const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');
const { verifyToken, requireRole } = require('../middleware/auth');

// Admin & Supervisor Analytics Overview
router.get('/overview', verifyToken, requireRole(['municipal_admin', 'supervisor']), async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const reviewQueue = await Complaint.countDocuments({ status: { $in: ['submitted', 'under_review'] } });
    const inProgress = await Complaint.countDocuments({ status: 'in_progress' });
    const resolved = await Complaint.countDocuments({ status: { $in: ['resolved', 'verified', 'closed'] } });
    const rejected = await Complaint.countDocuments({ status: 'rejected' });

    // Category breakdown
    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Priority breakdown
    const byPriority = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Ward hotspot analysis
    const byWard = await Complaint.aggregate([
      {
        $group: {
          _id: '$location.ward',
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'verified', 'closed']] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    // Department breakdown
    const byDepartment = await Complaint.aggregate([
      { $match: { assignedDepartment: { $ne: '' } } },
      { $group: { _id: '$assignedDepartment', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.json({
      success: true,
      metrics: {
        totalComplaints,
        reviewQueue,
        inProgress,
        resolved,
        rejected,
        resolutionPercentage: totalComplaints > 0 ? Math.round((resolved / totalComplaints) * 100) : 0,
      },
      byCategory,
      byPriority,
      byWard,
      byDepartment,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving analytics overview' });
  }
});

// Staff Directory (Admins and Supervisors)
router.get('/staff', verifyToken, requireRole(['municipal_admin', 'supervisor']), async (req, res) => {
  try {
    const staff = await User.find({
      role: { $in: ['field_worker', 'supervisor', 'municipal_admin'] },
    }).select('-password').sort({ createdAt: -1 });

    return res.json({ success: true, count: staff.length, staff });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching staff members' });
  }
});

// Audit Logs (Municipal Admins only)
router.get('/audit-logs', verifyToken, requireRole('municipal_admin'), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching audit logs' });
  }
});

module.exports = router;
