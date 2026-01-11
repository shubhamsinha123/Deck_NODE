/* eslint-disable linebreak-style */
/* eslint-disable consistent-return */
const express = require('express');

const router = express.Router();
const Booking = require('../model/bookingSchema');
const STATUS = require('../constants/statusConstants');

// Create a new booking
router.post('/bookings', async (req, res) => {
  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        data: null,
        message: 'Request body cannot be empty',
        status: STATUS.FAILURE,
      });
    }

    const bookingData = req.body;

    // Create new booking
    const newBooking = new Booking(bookingData);
    const savedBooking = await newBooking.save();

    res.status(201).json({
      data: savedBooking,
      message: 'Booking created successfully',
      status: STATUS.SUCCESS,
    });
  } catch (error) {
    res.status(400).json({
      data: null,
      message: 'Error creating booking',
      status: STATUS.FAILURE,
      error: error.message,
    });
  }
});

// Get all bookings
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json({
      data: bookings,
      message: `${bookings.length} booking(s) found`,
      status: STATUS.SUCCESS,
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Error fetching bookings',
      status: STATUS.FAILURE,
      error: error.message,
    });
  }
});

// Get a single booking by ID
router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        data: null,
        message: 'Booking not found',
        status: STATUS.FAILURE,
      });
    }

    res.status(200).json({
      data: booking,
      message: 'Booking fetched successfully',
      status: STATUS.SUCCESS,
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Error fetching booking',
      status: STATUS.FAILURE,
      error: error.message,
    });
  }
});

// Get bookings by email
router.get('/bookings/user/:email', async (req, res) => {
  try {
    const bookings = await Booking.find({
      userEmail: req.params.email,
    });

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No bookings found for this email',
      });
    }

    res.status(200).json({
      data: bookings,
      message: 'Bookings fetched successfully',
      status: STATUS.SUCCESS,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message,
    });
  }
});

// Get bookings by flight number
router.get('/bookings/flight/:flightNumber', async (req, res) => {
  try {
    const bookings = await Booking.find({
      'flightDetails.flightNumber': req.params.flightNumber,
    });

    if (bookings.length === 0) {
      return res.status(404).json({
        message: 'No bookings found for this flight',
        status: STATUS.NOT_FOUND,
      });
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: 'Error fetching bookings',
      status: STATUS.ERROR,
    });
  }
});

// Get bookings by status
router.get('/bookings/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const bookings = await Booking.find({ bookingStatus: status });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: 'Error fetching bookings',
      status: STATUS.ERROR,
    });
  }
});

// Update a booking
router.put('/bookings/:id', async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!updatedBooking) {
      return res.status(404).json({
        data: null,
        message: 'Booking not found',
        status: STATUS.FAILURE,
      });
    }

    res.status(200).json({
      data: updatedBooking,
      message: 'Booking updated successfully',
      status: STATUS.SUCCESS,
    });
  } catch (error) {
    res.status(400).json({
      data: null,
      message: 'Error updating booking',
      status: STATUS.FAILURE,
      error: error.message,
    });
  }
});

// Update booking by email with operations
router.patch('/update-travel-records/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const operations = req.body;

    // Validate operations array
    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        data: null,
        message: 'Request body must be a non-empty array of operations',
        status: STATUS.FAILURE,
      });
    }

    // Find booking by email
    const booking = await Booking.findOne({ userEmail: email });

    if (!booking) {
      return res.status(404).json({
        data: null,
        message: 'Booking not found for this email',
        status: STATUS.FAILURE,
      });
    }

    // Process operations
    const updateData = {};
    operations.forEach((operation) => {
      const { keyName, op, updatedData } = operation;

      if (!keyName || !op || !updatedData) {
        throw new Error('Each operation must have keyName, op, and updatedData');
      }

      // Check if keyName exists in the booking object
      if (!(keyName in booking)) {
        throw new Error(`Field '${keyName}' not found in booking record`);
      }

      if (op === '/replace') {
        Object.assign(updateData, updatedData);
      } else {
        throw new Error(`Unsupported operation: ${op}. Currently only /replace is supported`);
      }
    });

    // Update booking with the processed data
    const updatedBooking = await Booking.findOneAndUpdate(
      { userEmail: email },
      updateData,
      { new: true, runValidators: true },
    );

    res.status(200).json({
      data: updatedBooking,
      message: 'Booking updated successfully',
      status: STATUS.SUCCESS,
    });
  } catch (error) {
    // Check if error is about field not found
    if (error.message.includes('not found in booking record')) {
      return res.status(404).json({
        data: null,
        message: error.message,
        status: STATUS.FAILURE,
      });
    }

    res.status(400).json({
      data: null,
      message: 'Error updating booking',
      status: STATUS.FAILURE,
      error: error.message,
    });
  }
});

// Delete bookings by email
router.delete('/bookings/user/:email', async (req, res) => {
  try {
    const deletedBookings = await Booking.deleteMany({
      userEmail: req.params.email,
    });

    if (deletedBookings.deletedCount === 0) {
      return res.status(404).json({
        data: null,
        message: 'No bookings found for this email',
        status: STATUS.FAILURE,
      });
    }

    res.status(200).json({
      data: { deletedCount: deletedBookings.deletedCount },
      message: `${deletedBookings.deletedCount} booking(s) deleted successfully`,
      status: STATUS.SUCCESS,
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: 'Error deleting bookings',
      status: STATUS.FAILURE,
      error: error.message,
    });
  }
});

module.exports = router;
