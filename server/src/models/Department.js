const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  description: {
    type: String,
    default: '',
  },
  categories: [{
    type: String, // e.g. 'Potholes', 'Road Damage', 'Garbage Dump', 'Streetlight Outage'
  }],
  headSupervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  slaHours: {
    type: Number,
    default: 48,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Department', departmentSchema);
