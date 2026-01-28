const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/auth');
const AudiBooking = require('../models/AudiBooking');

/**
 * @route   GET /api/hod/bookings/pending
 * @desc    Get all pending auditorium booking requests (HOD only)
 * @access  Private (HOD)
 */
router.get('/bookings/pending', protect, allowRoles('HOD'), async (req, res) => {
  try {
    const pendingBookings = await AudiBooking.find({ status: 'PENDING' })
      .populate('event', 'title description')
      .populate('auditorium', 'name capacity location')
      .populate('requestedBy', 'name email department')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingBookings.length,
      bookings: pendingBookings
    });
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending bookings',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/hod/bookings
 * @desc    Get all auditorium bookings with filter (HOD only)
 * @access  Private (HOD)
 */
router.get('/bookings', protect, allowRoles('HOD'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status: status.toUpperCase() } : {};

    const bookings = await AudiBooking.find(query)
      .populate('event', 'title description')
      .populate('auditorium', 'name capacity location')
      .populate('requestedBy', 'name email department')
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
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/hod/bookings/:id
 * @desc    Approve or reject a booking request (HOD only)
 * @access  Private (HOD)
 */
router.patch('/bookings/:id', protect, allowRoles('HOD'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either APPROVED or REJECTED'
      });
    }

    const booking = await AudiBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be updated'
      });
    }

    // If approving, check for conflicts with other approved bookings
    if (status === 'APPROVED') {
      const conflictingBooking = await AudiBooking.findOne({
        auditorium: booking.auditorium,
        date: booking.date,
        status: 'APPROVED',
        _id: { $ne: booking._id },
        $or: [
          {
            $and: [
              { startTime: { $lt: booking.endTime } },
              { endTime: { $gt: booking.startTime } }
            ]
          }
        ]
      });

      if (conflictingBooking) {
        return res.status(400).json({
          success: false,
          message: 'This auditorium is already booked for the selected time slot'
        });
      }
    }

    booking.status = status;
    booking.approvedBy = req.user.id;
    booking.updatedAt = new Date();
    await booking.save();

    const updatedBooking = await AudiBooking.findById(booking._id)
      .populate('event', 'title')
      .populate('auditorium', 'name capacity location')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
});

module.exports = router;