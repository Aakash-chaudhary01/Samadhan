const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  entityType: {
    type: String,
    enum: ['Complaint', 'User', 'Department', 'Invitation'],
    default: 'Complaint',
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  trackingId: String,
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  },
  performedByName: String,
  performedByRole: String,
  previousState: mongoose.Schema.Types.Mixed,
  newState: mongoose.Schema.Types.Mixed,
  details: String,
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
