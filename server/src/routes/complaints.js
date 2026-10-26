const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { verifyToken, optionalAuth, requireRole } = require('../middleware/auth');

// Haversine formula for distance calculation in kilometers
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate unique tracking ID: SAM-YYYYMMDD-XXXX
function generateTrackingId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `SAM-${dateStr}-${randomSuffix}`;
}

// Check and award badges based on points
function evaluateBadges(user) {
  const existingBadgeIds = new Set((user.badges || []).map((b) => b.id));
  const newBadges = [];

  if (user.points >= 20 && !existingBadgeIds.has('civic_starter')) {
    newBadges.push({
      id: 'civic_starter',
      name: 'Civic Scout',
      description: 'Submitted first verified civic issue on Samadhan',
    });
  }
  if (user.points >= 50 && !existingBadgeIds.has('active_resolver')) {
    newBadges.push({
      id: 'active_resolver',
      name: 'Active Contributor',
      description: 'Contributed 50+ points through submissions and feedback',
    });
  }
  if (user.points >= 100 && !existingBadgeIds.has('ward_guardian')) {
    newBadges.push({
      id: 'ward_guardian',
      name: 'Ward Guardian',
      description: 'Civic champion with 100+ points protecting neighborhood infrastructure',
    });
  }

  if (newBadges.length > 0) {
    user.badges.push(...newBadges);
  }
}

// 1. PUBLIC: Real MongoDB Statistics (No fake statistics)
router.get('/public-stats', async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const resolvedComplaints = await Complaint.countDocuments({ status: { $in: ['resolved', 'closed', 'verified'] } });
    const inProgressComplaints = await Complaint.countDocuments({ status: { $in: ['in_progress', 'assigned', 'under_review'] } });
    const activeCitizens = await User.countDocuments({ role: 'citizen' });

    // Aggregate by category
    const categoryBreakdown = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Aggregate by ward
    const wardHotspots = await Complaint.aggregate([
      { $group: { _id: '$location.ward', count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return res.json({
      success: true,
      stats: {
        totalComplaints,
        resolvedComplaints,
        inProgressComplaints,
        activeCitizens,
        resolutionRate: totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0,
      },
      categoryBreakdown,
      wardHotspots,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving platform statistics' });
  }
});

// 2. SUBMIT COMPLAINT (Citizens or Guest Scan & Report without login)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { title, description, category, photoUrl, location, priority, reporterName, reporterPhone } = req.body;

    if (!title || !description || !category || !location || location.latitude === undefined || location.longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and geolocation coordinates are required.',
      });
    }

    const trackingId = generateTrackingId();

    // Duplicate detection heuristic: Same category within 200m submitted recently
    const recentSimilar = await Complaint.find({
      category,
      status: { $nin: ['resolved', 'rejected', 'closed'] },
      createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }, // past 14 days
    });

    let isDuplicate = false;
    let duplicateOfTrackingId = null;

    for (const comp of recentSimilar) {
      const distKm = calculateDistanceKm(
        location.latitude,
        location.longitude,
        comp.location.latitude,
        comp.location.longitude
      );
      if (distKm <= 0.2) {
        // Less than 200 meters away
        isDuplicate = true;
        duplicateOfTrackingId = comp.trackingId;
        break;
      }
    }

    // Determine department recommendation
    const departments = await Department.find({ isActive: true });
    let matchedDepartment = '';
    for (const dep of departments) {
      if (dep.categories.includes(category)) {
        matchedDepartment = dep.name;
        break;
      }
    }

    const citizenId = req.user ? req.user._id : null;
    const authorName = req.user ? req.user.name : (reporterName || 'Citizen (Scan & Report)');
    const authorRole = req.user ? req.user.role : 'citizen';

    const complaint = new Complaint({
      trackingId,
      title: title.trim(),
      description: description.trim(),
      category,
      photoUrl: photoUrl || '',
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '',
        city: location.city || 'Delhi NCR',
        ward: location.ward || 'Ward 1',
      },
      priority: priority || 'medium',
      status: 'submitted',
      citizen: citizenId,
      reporterName: authorName,
      reporterPhone: reporterPhone || (req.user?.phone || ''),
      assignedDepartment: matchedDepartment,
      statusHistory: [
        {
          status: 'submitted',
          changedBy: citizenId,
          changedByName: authorName,
          role: authorRole,
          note: req.user
            ? 'Complaint registered by citizen on Samadhan portal.'
            : 'Complaint registered via instant Scan & Report without login.',
          timestamp: new Date(),
        },
      ],
      aiInsights: {
        suggestedCategory: category,
        suggestedDepartment: matchedDepartment,
        suggestedPriority: priority || 'medium',
        isDuplicate,
        duplicateOfTrackingId,
        confidenceScore: 0.88,
        analyzedAt: new Date(),
      },
    });

    let pointsEarned = 0;
    // Award 20 points for logged-in citizen submission
    if (req.user) {
      const citizenUser = await User.findById(req.user._id);
      if (citizenUser && !complaint.pointsAwarded.submission) {
        citizenUser.points += 20;
        complaint.pointsAwarded.submission = true;
        evaluateBadges(citizenUser);
        await citizenUser.save();
        pointsEarned = 20;

        await Notification.create({
          recipient: citizenUser._id,
          title: 'Points Earned (+20)!',
          message: `You earned 20 Samadhan recognition points for submitting complaint ${trackingId}.`,
          type: 'reward',
          trackingId,
        });
      }
    }

    // Save complaint to MongoDB; never claim success if save fails
    await complaint.save();

    await AuditLog.create({
      action: 'COMPLAINT_CREATED',
      entityType: 'Complaint',
      entityId: complaint._id,
      trackingId: complaint.trackingId,
      performedBy: citizenId,
      performedByName: authorName,
      performedByRole: authorRole,
      details: `New complaint submitted: ${complaint.title} in ${complaint.location.ward} via Scan & Report`,
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaint,
      pointsEarned,
      referenceId: trackingId,
    });
  } catch (err) {
    console.error('Complaint submission error:', err);
    return res.status(500).json({ success: false, message: 'Server error during submission: ' + err.message });
  }
});

// 3. GET COMPLAINTS (Role-aware & Filterable)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, category, ward, search } = req.query;
    let query = {};

    // Citizens only see their own complaints
    if (req.user.role === 'citizen') {
      query.citizen = req.user._id;
    } else if (req.user.role === 'field_worker') {
      // Field worker sees tasks assigned to them or unassigned in their department
      query.$or = [
        { assignedTo: req.user._id },
        { assignedDepartment: req.user.department, status: { $in: ['assigned', 'in_progress', 'under_review'] } },
      ];
    } else if (req.user.role === 'supervisor') {
      // Supervisor sees department complaints or ward complaints
      if (req.user.department) {
        query.assignedDepartment = req.user.department;
      }
    }

    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (ward) query['location.ward'] = ward;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { trackingId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('citizen', 'name email phone')
      .populate('assignedTo', 'name email phone department')
      .populate('assignedSupervisor', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: complaints.length, complaints });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving complaints' });
  }
});

// 4. GET SINGLE COMPLAINT BY ID OR TRACKING ID (Public by Tracking ID, Auth by Mongo ID)
router.get('/:identifier', optionalAuth, async (req, res) => {
  try {
    const { identifier } = req.params;
    let complaint = null;

    if (identifier.startsWith('SAM-')) {
      complaint = await Complaint.findOne({ trackingId: identifier })
        .populate('citizen', 'name email phone points')
        .populate('assignedTo', 'name email phone')
        .populate('assignedSupervisor', 'name email');
    } else {
      complaint = await Complaint.findById(identifier)
        .populate('citizen', 'name email phone points')
        .populate('assignedTo', 'name email phone')
        .populate('assignedSupervisor', 'name email');
    }

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Citizen ownership check (only for private Mongo ID lookup, not public tracking ID)
    if (!identifier.startsWith('SAM-') && req.user && req.user.role === 'citizen') {
      if (complaint.citizen && complaint.citizen._id && complaint.citizen._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only view your own complaints.' });
      }
    }

    return res.json({ success: true, complaint });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving complaint' });
  }
});

// 5. UPDATE COMPLAINT STATUS & ASSIGNMENT (RBAC enforced)
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, assignedDepartment, assignedTo, assignedSupervisor, priority, evidencePhotoUrl, resolutionNotes } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const previousStatus = complaint.status;

    // RBAC Permissions check:
    if (req.user.role === 'citizen') {
      return res.status(403).json({ success: false, message: 'Citizens cannot alter complaint lifecycle status.' });
    }

    // Field Worker constraints:
    if (req.user.role === 'field_worker') {
      const isAssigned = complaint.assignedTo && complaint.assignedTo.toString() === req.user._id.toString();
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'Field workers can only update tasks directly assigned to them.' });
      }

      // Can only set in_progress or resolved
      if (!['in_progress', 'resolved'].includes(status)) {
        return res.status(403).json({ success: false, message: 'Field workers may only set status to in_progress or resolved.' });
      }

      // Evidence photo upload is mandatory to mark resolved!
      if (status === 'resolved' && !evidencePhotoUrl && !complaint.evidencePhotoUrl) {
        return res.status(400).json({
          success: false,
          message: 'Resolution proof photo is mandatory before marking a complaint as resolved.',
        });
      }
    }

    // Apply updates
    if (status) complaint.status = status;
    if (priority && ['municipal_admin', 'supervisor'].includes(req.user.role)) complaint.priority = priority;
    if (assignedDepartment && ['municipal_admin', 'supervisor'].includes(req.user.role)) complaint.assignedDepartment = assignedDepartment;
    if (assignedTo && ['municipal_admin', 'supervisor'].includes(req.user.role)) complaint.assignedTo = assignedTo;
    if (assignedSupervisor && req.user.role === 'municipal_admin') complaint.assignedSupervisor = assignedSupervisor;
    if (evidencePhotoUrl) complaint.evidencePhotoUrl = evidencePhotoUrl;
    if (resolutionNotes) complaint.resolutionNotes = resolutionNotes;

    complaint.statusHistory.push({
      status: status || previousStatus,
      changedBy: req.user._id,
      changedByName: req.user.name,
      role: req.user.role,
      note: note || `Status updated from ${previousStatus} to ${status || previousStatus}`,
      timestamp: new Date(),
    });

    // Check reward for verified impact (30 points) when verified by admin
    if (status === 'verified' && ['municipal_admin', 'supervisor'].includes(req.user.role)) {
      const citizenUser = await User.findById(complaint.citizen);
      if (citizenUser && !complaint.pointsAwarded.resolution) {
        citizenUser.points += 30;
        complaint.pointsAwarded.resolution = true;
        evaluateBadges(citizenUser);
        await citizenUser.save();

        await Notification.create({
          recipient: citizenUser._id,
          title: 'Impact Verified (+30 Points)!',
          message: `Your reported issue (${complaint.trackingId}) has been successfully verified! 30 points awarded.`,
          type: 'reward',
          trackingId: complaint.trackingId,
        });
      }
    }

    await complaint.save();

    // Notify citizen about status change
    await Notification.create({
      recipient: complaint.citizen,
      title: `Complaint Status Updated: ${status || previousStatus}`,
      message: `Your complaint #${complaint.trackingId} is now ${status || previousStatus}. ${note ? `Note: ${note}` : ''}`,
      type: 'status_update',
      relatedComplaintId: complaint._id,
      trackingId: complaint.trackingId,
    });

    // Audit log
    await AuditLog.create({
      action: 'COMPLAINT_STATUS_CHANGED',
      entityType: 'Complaint',
      entityId: complaint._id,
      trackingId: complaint.trackingId,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      previousState: { status: previousStatus },
      newState: { status: complaint.status },
      details: note || `Changed status to ${complaint.status}`,
    });

    return res.json({
      success: true,
      message: 'Complaint updated successfully.',
      complaint,
    });
  } catch (err) {
    console.error('Update complaint error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating complaint' });
  }
});

// 6. CITIZEN FEEDBACK & RATING (10 Points with double-award protection)
router.post('/:id/feedback', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Valid rating between 1 and 5 is required.' });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Ownership check
    if (complaint.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the citizen who filed this complaint can submit feedback.' });
    }

    if (!['resolved', 'verified', 'closed'].includes(complaint.status)) {
      return res.status(400).json({ success: false, message: 'Feedback can only be submitted after resolution.' });
    }

    complaint.feedback = {
      rating,
      comment: comment || '',
      submittedAt: new Date(),
    };

    let pointsAwarded = 0;
    // Award 10 points for providing constructive feedback (double-award protected)
    if (!complaint.pointsAwarded.feedback) {
      const citizenUser = await User.findById(req.user._id);
      if (citizenUser) {
        citizenUser.points += 10;
        complaint.pointsAwarded.feedback = true;
        evaluateBadges(citizenUser);
        await citizenUser.save();
        pointsAwarded = 10;

        await Notification.create({
          recipient: citizenUser._id,
          title: 'Feedback Reward (+10 Points)!',
          message: `Thank you for rating resolution for #${complaint.trackingId}. 10 points added to your profile!`,
          type: 'reward',
          trackingId: complaint.trackingId,
        });
      }
    }

    await complaint.save();

    await AuditLog.create({
      action: 'FEEDBACK_SUBMITTED',
      entityType: 'Complaint',
      entityId: complaint._id,
      trackingId: complaint.trackingId,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      details: `Citizen submitted feedback: ${rating}/5 stars`,
    });

    return res.json({
      success: true,
      message: 'Feedback submitted successfully. Thank you!',
      pointsAwarded,
      complaint,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error submitting feedback: ' + err.message });
  }
});

module.exports = router;
