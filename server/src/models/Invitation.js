const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['municipal_admin', 'field_worker', 'supervisor'],
    required: true,
  },
  department: {
    type: String,
    default: '',
  },
  ward: {
    type: String,
    default: '',
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  usedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Invitation', invitationSchema);
