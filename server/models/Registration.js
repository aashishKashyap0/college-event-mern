const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkinTime: {
    type: Date
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one registration per student per event
registrationSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);