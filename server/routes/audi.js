const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/auth');
const Auditorium = require('../models/Auditorium');
const AudiBooking = require('../models/AudiBooking');
const Event = require('../models/Event');

/**
 * @route   GET /api/audi
 * @desc    Get all auditoriums
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const auditoriums = await Auditorium.find().sort({ name: 1 });

    res.json({
      success: true,
      count: auditoriums.length,
      auditoriums
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching auditoriums',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audi/availability
 * @desc    Check auditorium availability for a specific date and time
 * @access  Private (Coordinator)
 */
router.get('/availability', protect, allowRoles('COORDINATOR'), async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Date, start time, and end time are required'
      });
    }

    // Get all auditoriums
    const allAudis = await Auditorium.find();

    // Get bookings for the specified date that are approved
    const bookings = await AudiBooking.find({
      date: new Date(date),
      status: 'APPROVED'
    }).populate('auditorium');

    // Check which auditoriums are available
    const available = allAudis.filter(audi => {
      // Check if this auditorium has any conflicting bookings
      const hasConflict = bookings.some(booking => {
        if (booking.auditorium._id.toString() !== audi._id.toString()) {
          return false;
        }

        // Check time overlap
        const bookingStart = booking.startTime;
        const bookingEnd = booking.endTime;
        
        // Times overlap if:
        // (start1 < end2) and (start2 < end1)
        return (startTime < bookingEnd) && (bookingStart < endTime);
      });

      return !hasConflict;
    });

    res.json({
      success: true,
      date,
      startTime,
      endTime,
      available
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking availability',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/audi/book
 * @desc    Request auditorium booking (Coordinator only)
 * @access  Private (Coordinator)
 */
router.post('/book', protect, allowRoles('COORDINATOR'), async (req, res) => {
  try {
    const { eventId, auditoriumId, date, startTime, endTime } = req.body;

    // Validate event exists and belongs to coordinator
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only book auditoriums for your own events'
      });
    }

    // Validate auditorium exists
    const auditorium = await Auditorium.findById(auditoriumId);
    if (!auditorium) {
      return res.status(404).json({
        success: false,
        message: 'Auditorium not found'
      });
    }

    // Check if there's already a booking for this event
    const existingBooking = await AudiBooking.findOne({ event: eventId });
    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'A booking already exists for this event'
      });
    }

    // Create booking request
    const booking = await AudiBooking.create({
      event: eventId,
      auditorium: auditoriumId,
      date,
      startTime,
      endTime,
      requestedBy: req.user.id,
      status: 'PENDING'
    });

    const populatedBooking = await AudiBooking.findById(booking._id)
      .populate('event', 'title')
      .populate('auditorium', 'name capacity location')
      .populate('requestedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audi/my-requests
 * @desc    Get coordinator's own booking requests
 * @access  Private (Coordinator)
 */
router.get('/my-requests', protect, allowRoles('COORDINATOR'), async (req, res) => {
  try {
    const bookings = await AudiBooking.find({ requestedBy: req.user.id })
      .populate('event', 'title')
      .populate('auditorium', 'name capacity location')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking requests',
      error: error.message
    });
  }
});

module.exports = router;
