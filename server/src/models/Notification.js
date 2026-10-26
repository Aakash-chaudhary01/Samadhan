const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['status_update', 'assignment', 'feedback_request', 'reward', 'system'],
    default: 'status_update',
  },
  relatedComplaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
  },
  trackingId: String,
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
