const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['STUDENT', 'COORDINATOR', 'HOD']).withMessage('Invalid role')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      department: department || ''
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in user registration',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in login',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get('/me', require('../middleware/auth').protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

module.exports = router;

// ========================================
// FILE: server/routes/events.js
// ========================================
// const express = require('express');
const { protect, allowRoles } = require('../middleware/auth');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Feedback = require('../models/Feedback');
const { Parser } = require('json2csv');

/**
 * @route   GET /api/events
 * @desc    Get all events (upcoming) or coordinator's own events
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { mine } = req.query;
    let query = {};

    // If coordinator wants their own events
    if (mine === 'true' && req.user.role === 'COORDINATOR') {
      query.createdBy = req.user.id;
    } else {
      // Show only upcoming events for students
      query.date = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    // Get registration count for each event
    const eventsWithCount = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({ event: event._id });
        return {
          ...event.toObject(),
          registrationCount
        };
      })
    );

    res.json({
      success: true,
      count: eventsWithCount.length,
      events: eventsWithCount
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/events/:id
 * @desc    Get single event details
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email department');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const registrationCount = await Registration.countDocuments({ event: event._id });

    res.json({
      success: true,
      event: {
        ...event.toObject(),
        registrationCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/events
 * @desc    Create new event (Coordinator only)
 * @access  Private (Coordinator)
 */
router.post('/', protect, allowRoles('COORDINATOR'), async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      venue,
      department,
      maxParticipants,
      registrationDeadline
    } = req.body;

    const event = await Event.create({
      title,
      description,
      date,
      startTime,
      endTime,
      venue,
      department,
      maxParticipants,
      registrationDeadline,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/events/:id/register
 * @desc    Register for an event (Student only)
 * @access  Private (Student)
 */
router.post('/:id/register', protect, allowRoles('STUDENT'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if registration deadline has passed
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Check if event is full
    const registrationCount = await Registration.countDocuments({ event: event._id });
    if (registrationCount >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      event: req.params.id,
      student: req.user.id
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Create registration
    const registration = await Registration.create({
      event: req.params.id,
      student: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for the event',
      registration
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering for event',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/events/registrations/me
 * @desc    Get student's own registrations
 * @access  Private (Student)
 */
router.get('/registrations/me', protect, allowRoles('STUDENT'), async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.user.id })
      .populate('event')
      .sort({ registeredAt: -1 });

    res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/events/:id/registrations
 * @desc    Get all registrations for an event (Coordinator only)
 * @access  Private (Coordinator)
 */
router.get('/:id/registrations', protect, allowRoles('COORDINATOR'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Ensure coordinator owns this event
    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view registrations for this event'
      });
    }

    const registrations = await Registration.find({ event: req.params.id })
      .populate('student', 'name email department')
      .sort({ registeredAt: -1 });

    res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/events/:id/registrations/export
 * @desc    Export registrations as CSV (Coordinator only)
 * @access  Private (Coordinator)
 */
router.get('/:id/registrations/export', protect, allowRoles('COORDINATOR'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Ensure coordinator owns this event
    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to export registrations for this event'
      });
    }

    const registrations = await Registration.find({ event: req.params.id })
      .populate('student', 'name email department');

    // Format data for CSV
    const data = registrations.map(reg => ({
      Name: reg.student.name,
      Email: reg.student.email,
      Department: reg.student.department,
      'Registration Date': new Date(reg.registeredAt).toLocaleString(),
      'Checked In': reg.checkedIn ? 'Yes' : 'No',
      'Check-in Time': reg.checkinTime ? new Date(reg.checkinTime).toLocaleString() : 'N/A'
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`${event.title}_registrations.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting registrations',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/events/:id/checkin
 * @desc    Check-in to an event (Student only)
 * @access  Private (Student)
 */
router.post('/:id/checkin', protect, allowRoles('STUDENT'), async (req, res) => {
  try {
    const registration = await Registration.findOne({
      event: req.params.id,
      student: req.user.id
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'You are not registered for this event'
      });
    }

    if (registration.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in for this event'
      });
    }

    registration.checkedIn = true;
    registration.checkinTime = new Date();
    await registration.save();

    res.json({
      success: true,
      message: 'Successfully checked in to the event',
      registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking in to event',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/events/:id/feedback
 * @desc    Submit feedback for an event (Student only)
 * @access  Private (Student)
 */
router.post('/:id/feedback', protect, allowRoles('STUDENT'), async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Check if event exists and is past
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (new Date(event.date) > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot submit feedback for upcoming events'
      });
    }

    // Check if student attended/registered for the event
    const registration = await Registration.findOne({
      event: req.params.id,
      student: req.user.id
    });

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered for the event to give feedback'
      });
    }

    // Create or update feedback
    const feedback = await Feedback.findOneAndUpdate(
      { event: req.params.id, student: req.user.id },
      { rating, comment },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/events/:id/feedback
 * @desc    Get feedback for an event (Coordinator only)
 * @access  Private (Coordinator)
 */
router.get('/:id/feedback', protect, allowRoles('COORDINATOR'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Ensure coordinator owns this event
    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view feedback for this event'
      });
    }

    const feedbacks = await Feedback.find({ event: req.params.id })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

    res.json({
      success: true,
      count: feedbacks.length,
      averageRating: avgRating.toFixed(1),
      feedbacks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
});

module.exports = router;
