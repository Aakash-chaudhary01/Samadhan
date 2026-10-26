const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  changedByName: String,
  role: String,
  note: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const complaintSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Potholes & Road Damage',
      'Garbage & Waste Disposal',
      'Streetlight & Electrical',
      'Water Supply & Leakage',
      'Drainage & Sewage Overflow',
      'Illegal Construction & Encroachment',
      'Public Sanitation & Toilets',
      'Stray Animals & Pest Control',
      'Other Civic Issues',
    ],
  },
  photoUrl: {
    type: String,
    default: '',
  },
  location: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: 'Delhi NCR',
    },
    ward: {
      type: String,
      default: 'Ward 1',
    },
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: [
      'submitted',
      'under_review',
      'assigned',
      'in_progress',
      'resolved',
      'verified',
      'closed',
      'rejected',
    ],
    default: 'submitted',
  },
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  },
  reporterName: {
    type: String,
    default: 'Citizen (Scan & Report)',
  },
  reporterPhone: {
    type: String,
    default: '',
  },
  assignedDepartment: {
    type: String,
    default: '',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // field_worker
  },
  assignedSupervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // supervisor
  },
  evidencePhotoUrl: {
    type: String,
    default: '', // Photo uploaded by field_worker when resolving
  },
  resolutionNotes: {
    type: String,
    default: '',
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    submittedAt: Date,
  },
  pointsAwarded: {
    submission: {
      type: Boolean,
      default: false,
    },
    resolution: {
      type: Boolean,
      default: false,
    },
    feedback: {
      type: Boolean,
      default: false,
    },
  },
  aiInsights: {
    suggestedCategory: String,
    suggestedPriority: String,
    suggestedDepartment: String,
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    duplicateOfTrackingId: String,
    confidenceScore: Number, // Honest confidence or null if heuristic
    analyzedAt: Date,
  },
  statusHistory: [statusHistorySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

complaintSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
