const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const AuditLog = require('../models/AuditLog');
const { verifyToken, requireRole, JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, invitationCode, ward } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    let assignedRole = 'citizen';
    let assignedDepartment = '';
    let assignedWard = ward || '';
    let invitationDoc = null;

    // Strict Role Escalation Prevention: Staff accounts only via admin invitation
    if (role && role !== 'citizen') {
      if (!invitationCode) {
        return res.status(403).json({
          success: false,
          message: 'Staff registration requires a valid invitation code issued by a Municipal Admin.',
        });
      }

      invitationDoc = await Invitation.findOne({
        code: invitationCode.trim().toUpperCase(),
        isUsed: false,
      });

      if (!invitationDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or already consumed invitation code.',
        });
      }

      if (invitationDoc.expiresAt && invitationDoc.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'This invitation code has expired.',
        });
      }

      if (invitationDoc.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: `This invitation code was issued specifically for ${invitationDoc.email}.`,
        });
      }

      assignedRole = invitationDoc.role;
      assignedDepartment = invitationDoc.department || '';
      assignedWard = invitationDoc.ward || assignedWard;
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: assignedRole,
      department: assignedDepartment,
      ward: assignedWard,
    });

    await user.save();

    if (invitationDoc) {
      invitationDoc.isUsed = true;
      invitationDoc.usedBy = user._id;
      invitationDoc.usedAt = new Date();
      await invitationDoc.save();

      await AuditLog.create({
        action: 'STAFF_INVITATION_REDEEMED',
        entityType: 'User',
        entityId: user._id,
        performedBy: user._id,
        performedByName: user.name,
        performedByRole: user.role,
        details: `Invitation ${invitationDoc.code} redeemed for role ${assignedRole}`,
      });
    }

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        ward: user.ward,
        points: user.points,
        badges: user.badges,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, portal } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is suspended or pending activation.' });
    }

    // Portal verification for helpful user feedback
    if (portal === 'municipal' && user.role === 'citizen') {
      return res.status(403).json({
        success: false,
        message: 'This account is a Citizen account. Please use the Citizen Portal login.',
      });
    }
    if (portal === 'citizen' && user.role !== 'citizen') {
      // Municipal staff can still login or be guided
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        ward: user.ward,
        points: user.points,
        badges: user.badges,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      department: req.user.department,
      ward: req.user.ward,
      points: req.user.points,
      badges: req.user.badges,
      createdAt: req.user.createdAt,
    },
  });
});

// Forgot password simulation (returns reset verification token)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success to avoid email enumeration
      return res.json({
        success: true,
        message: 'If the email exists in our records, password reset instructions have been dispatched.',
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    return res.json({
      success: true,
      message: 'Password reset link sent to registered email address.',
      demoToken: resetToken, // Exposed for student demo inspection
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error processing request.' });
  }
});

// Admin: Create staff invitation code
router.post('/create-invitation', verifyToken, requireRole('municipal_admin'), async (req, res) => {
  try {
    const { email, role, department, ward } = req.body;

    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email and role are required.' });
    }

    if (!['municipal_admin', 'supervisor', 'field_worker'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid staff role specified.' });
    }

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `SAM-INV-${role.slice(0, 3).toUpperCase()}-${randomSuffix}`;

    const invitation = new Invitation({
      code,
      email: email.toLowerCase(),
      role,
      department: department || '',
      ward: ward || '',
      invitedBy: req.user._id,
    });

    await invitation.save();

    await AuditLog.create({
      action: 'INVITATION_CREATED',
      entityType: 'Invitation',
      entityId: invitation._id,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      details: `Generated invitation code ${code} for ${email} as ${role}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Staff invitation created successfully.',
      invitation,
    });
  } catch (err) {
    console.error('Error generating invitation:', err);
    return res.status(500).json({ success: false, message: 'Server error generating invitation.' });
  }
});

// Admin: Get all staff invitations
router.get('/invitations', verifyToken, requireRole('municipal_admin'), async (req, res) => {
  try {
    const invitations = await Invitation.find().sort({ createdAt: -1 }).populate('invitedBy', 'name email');
    return res.json({ success: true, invitations });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error fetching invitations.' });
  }
});

module.exports = router;
