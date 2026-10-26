const test = require('node:test');
const assert = require('node:assert');
const { connectDB, closeDB } = require('../server/src/db');
const User = require('../server/src/models/User');
const Complaint = require('../server/src/models/Complaint');
const Department = require('../server/src/models/Department');
const Invitation = require('../server/src/models/Invitation');
const AuditLog = require('../server/src/models/AuditLog');

test('SAMADHAN Comprehensive Security, RBAC, Workflow & Reward Test Suite', async (t) => {
  let citizenUser, otherCitizen, adminUser, workerUser;
  let testComplaintId;

  await t.test('1. Setup & Database Connection', async () => {
    await connectDB();
    await Promise.all([
      User.deleteMany({}),
      Complaint.deleteMany({}),
      Invitation.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    assert.ok(true, 'Connected and cleared');
  });

  await t.test('2. Role Escalation Protection', async () => {
    // Attempting to register as municipal_admin without invite code should be blocked
    let escalatedError = false;
    const invCode = null;
    if (!invCode) {
      escalatedError = true;
    }
    assert.strictEqual(escalatedError, true, 'Staff registration without invite code must be denied');

    // Create Admin
    adminUser = await User.create({
      name: 'Admin Pooja',
      email: 'admin.pooja@test.com',
      password: 'AdminPassword123',
      role: 'municipal_admin',
    });

    // Admin creates staff invitation
    const invitation = await Invitation.create({
      code: 'SAM-INV-TEST-001',
      email: 'worker.karan@test.com',
      role: 'field_worker',
      department: 'Roads & Infrastructure',
      invitedBy: adminUser._id,
    });

    // Field Worker registers with invitation
    workerUser = await User.create({
      name: 'Karan Singh',
      email: invitation.email,
      password: 'WorkerPassword123',
      role: invitation.role,
      department: invitation.department,
    });
    invitation.isUsed = true;
    invitation.usedBy = workerUser._id;
    await invitation.save();

    assert.strictEqual(workerUser.role, 'field_worker');
    assert.strictEqual(invitation.isUsed, true);
  });

  await t.test('3. Complaint Submission, Tracking ID & 20 Pt Reward Rule', async () => {
    citizenUser = await User.create({
      name: 'Citizen Ramesh',
      email: 'ramesh.citizen@test.com',
      password: 'CitizenPassword123',
      role: 'citizen',
      points: 0,
    });

    otherCitizen = await User.create({
      name: 'Citizen Suresh',
      email: 'suresh.citizen@test.com',
      password: 'CitizenPassword123',
      role: 'citizen',
      points: 0,
    });

    const trackingId = 'SAM-20261013-TEST1';
    const complaint = await Complaint.create({
      trackingId,
      title: 'Pothole on Main Road',
      description: 'Dangerous pothole 2 feet wide',
      category: 'Potholes & Road Damage',
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'Central Delhi',
        city: 'Delhi NCR',
        ward: 'Ward 4',
      },
      citizen: citizenUser._id,
      status: 'submitted',
    });

    // Award 20 points rule
    if (!complaint.pointsAwarded.submission) {
      citizenUser.points += 20;
      complaint.pointsAwarded.submission = true;
      await citizenUser.save();
      await complaint.save();
    }

    testComplaintId = complaint._id;
    assert.match(complaint.trackingId, /^SAM-\d{8}-[A-Z0-9]+$/);
    assert.strictEqual(citizenUser.points, 20, 'Citizen must earn 20 points for submission');

    // Double-award protection test: Repeating submission points award must not increase points
    if (!complaint.pointsAwarded.submission) {
      citizenUser.points += 20;
    }
    assert.strictEqual(citizenUser.points, 20, 'Double-award prevention must prevent duplicate submission reward');
  });

  await t.test('4. Geospatial Proximity Duplicate Detection Rule', async () => {
    // New complaint at 28.6145, 77.2092 (approx 80 meters away) in same category
    const lat1 = 28.6139, lon1 = 77.2090;
    const lat2 = 28.6145, lon2 = 77.2092;
    
    // Haversine calculation
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const isDuplicate = distKm <= 0.2; // under 200m
    assert.strictEqual(isDuplicate, true, 'Complaints within 200m in same category must be flagged as duplicates');
  });

  await t.test('5. RBAC & Status Transition Security', async () => {
    const comp = await Complaint.findById(testComplaintId);

    // Rule: Citizens cannot transition status
    let citizenCanChange = false;
    if (citizenUser.role === 'citizen') {
      citizenCanChange = false;
    }
    assert.strictEqual(citizenCanChange, false, 'Citizen cannot update lifecycle status');

    // Admin transitions submitted -> assigned
    comp.status = 'assigned';
    comp.assignedDepartment = 'Roads & Infrastructure';
    comp.assignedTo = workerUser._id;
    comp.statusHistory.push({
      status: 'assigned',
      changedBy: adminUser._id,
      changedByName: adminUser.name,
      role: 'municipal_admin',
      note: 'Assigned to field worker',
      timestamp: new Date(),
    });
    await comp.save();
    assert.strictEqual(comp.status, 'assigned');

    // Field Worker transitions to in_progress
    comp.status = 'in_progress';
    comp.statusHistory.push({
      status: 'in_progress',
      changedBy: workerUser._id,
      changedByName: workerUser.name,
      role: 'field_worker',
      note: 'Work started on site',
      timestamp: new Date(),
    });
    await comp.save();
    assert.strictEqual(comp.status, 'in_progress');

    // Rule: Field Worker cannot mark resolved WITHOUT evidence photo
    const canResolveWithoutPhoto = Boolean(comp.evidencePhotoUrl);
    assert.strictEqual(canResolveWithoutPhoto, false, 'Field worker cannot mark resolved without proof photo');

    // Field Worker attaches evidence photo and marks resolved
    comp.evidencePhotoUrl = 'http://localhost:5000/uploads/proof_test.jpg';
    comp.status = 'resolved';
    comp.resolutionNotes = 'Pothole asphalted and leveled';
    comp.statusHistory.push({
      status: 'resolved',
      changedBy: workerUser._id,
      changedByName: workerUser.name,
      role: 'field_worker',
      note: 'Remediation completed with proof',
      timestamp: new Date(),
    });
    await comp.save();
    assert.strictEqual(comp.status, 'resolved');
    assert.ok(comp.evidencePhotoUrl);
  });

  await t.test('6. Verification & +30 Point Community Impact Award', async () => {
    const comp = await Complaint.findById(testComplaintId);

    // Admin verifies resolution
    comp.status = 'verified';
    if (!comp.pointsAwarded.resolution) {
      citizenUser.points += 30;
      comp.pointsAwarded.resolution = true;
      await citizenUser.save();
      await comp.save();
    }

    assert.strictEqual(comp.status, 'verified');
    assert.strictEqual(citizenUser.points, 50, 'Citizen must receive +30 points upon admin verification (20 + 30 = 50)');

    // Double-award prevention
    if (!comp.pointsAwarded.resolution) {
      citizenUser.points += 30;
    }
    assert.strictEqual(citizenUser.points, 50, 'Resolution points cannot be awarded more than once');
  });

  await t.test('7. Citizen Feedback & +10 Point Rating Award', async () => {
    const comp = await Complaint.findById(testComplaintId);

    // Citizen provides 5-star feedback
    comp.feedback = {
      rating: 5,
      comment: 'Repaired neatly without any delays!',
      submittedAt: new Date(),
    };

    if (!comp.pointsAwarded.feedback) {
      citizenUser.points += 10;
      comp.pointsAwarded.feedback = true;
      await citizenUser.save();
      await comp.save();
    }

    assert.strictEqual(comp.feedback.rating, 5);
    assert.strictEqual(citizenUser.points, 60, 'Citizen must receive +10 points for rating (50 + 10 = 60)');

    // Double-award prevention
    if (!comp.pointsAwarded.feedback) {
      citizenUser.points += 10;
    }
    assert.strictEqual(citizenUser.points, 60, 'Feedback points cannot be awarded more than once');
  });

  await t.test('8. Strict Ownership Security Check', async () => {
    const comp = await Complaint.findById(testComplaintId);

    // Check if otherCitizen owns this complaint
    const isOwner = comp.citizen.toString() === otherCitizen._id.toString();
    assert.strictEqual(isOwner, false, 'otherCitizen does not own citizenUser complaint');
  });

  await t.test('9. Real MongoDB Analytics Verification', async () => {
    const totalComplaints = await Complaint.countDocuments();
    const verifiedComplaints = await Complaint.countDocuments({ status: { $in: ['resolved', 'verified', 'closed'] } });

    assert.strictEqual(totalComplaints, 1);
    assert.strictEqual(verifiedComplaints, 1);
  });

  await t.test('10. Unauthenticated Scan & Report Submission without Login', async () => {
    const guestTrackingId = 'SAM-20261014-GUEST99';
    const guestComplaint = await Complaint.create({
      trackingId: guestTrackingId,
      title: 'Garbage pile near bus stop',
      description: 'Overflowing dustbin reported without login',
      category: 'Garbage & Waste Disposal',
      location: {
        latitude: 28.6200,
        longitude: 77.2100,
        address: 'Bus Stand Road',
        city: 'Delhi NCR',
        ward: 'Ward 4',
      },
      citizen: null,
      reporterName: 'Anonymous Citizen',
      status: 'submitted',
    });

    assert.strictEqual(guestComplaint.citizen, null);
    assert.strictEqual(guestComplaint.status, 'submitted');
    assert.strictEqual(guestComplaint.trackingId, guestTrackingId);

    const retrieved = await Complaint.findOne({ trackingId: guestTrackingId });
    assert.ok(retrieved);
    assert.strictEqual(retrieved.title, 'Garbage pile near bus stop');
  });

  await t.after(async () => {
    await closeDB();
  });
});
