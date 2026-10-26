const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['citizen', 'municipal_admin', 'field_worker', 'supervisor'],
    default: 'citizen',
  },
  department: {
    type: String,
    default: '', // For field_worker or supervisor, e.g. 'Sanitation', 'Roads & Infrastructure'
  },
  ward: {
    type: String,
    default: '', // E.g., 'Ward 4', 'Ward 12'
  },
  points: {
    type: Number,
    default: 0,
  },
  badges: [{
    id: String,
    name: String,
    description: String,
    awardedAt: { type: Date, default: Date.now },
  }],
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
