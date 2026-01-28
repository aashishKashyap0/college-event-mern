const mongoose = require('mongoose');

const auditoriumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  facilities: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Auditorium', auditoriumSchema);