/* eslint-disable class-methods-use-this */
const express = require('express');
const bookingService = require('../services/booking.service');
const STATUS = require('../constants/statusConstants');

const router = express.Router();

class BookingController {
  async createBooking(req, res) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          data: null,
          message: 'Request body cannot be empty',
          status: STATUS.FAILURE,
        });
      }

      const savedBooking = await bookingService.createBooking(req.body);
      return res.status(201).json({
        data: savedBooking,
        message: 'Booking created successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).json({
        data: null,
        message: 'Error creating booking',
        status: STATUS.FAILURE,
        error: error.message,
      });
    }
  }

  async getAllBookings(req, res) {
    try {
      const bookings = await bookingService.getAllBookings();
      return res.status(200).json({
        data: bookings,
        message: `${bookings.length} booking(s) found`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        message: 'Error fetching bookings',
        status: STATUS.FAILURE,
        error: error.message,
      });
    }
  }

  async getBookingById(req, res) {
    try {
      const booking = await bookingService.getBookingById(req.params.id);
      if (!booking) {
        return res.status(404).json({
          data: null,
          message: 'Booking not found',
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).json({
        data: booking,
        message: 'Booking fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        message: 'Error fetching booking',
        status: STATUS.FAILURE,
        error: error.message,
      });
    }
  }

  async getBookingsByUser(req, res) {
    try {
      const { userEmail, password } = req.body;
      if (!userEmail || !password) {
        return res.status(400).json({
          data: null,
          message: 'userEmail and password are required',
          status: STATUS.PENDING,
        });
      }

      const bookings = await bookingService.getBookingsByUser(
        userEmail,
        password,
      );
      if (bookings.length === 0) {
        return res.status(401).json({
          data: null,
          message: 'Invalid email or password',
          status: STATUS.NOT_FOUND,
        });
      }

      return res.status(200).json({
        data: bookings,
        count: bookings.length,
        message: 'Bookings fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        message: 'Error fetching bookings records.',
        status: STATUS.FAILURE,
        error: error.message,
      });
    }
  }

  async getBookingsByFlight(req, res) {
    try {
      const bookings = await bookingService.getBookingsByFlight(
        req.params.flightNumber,
      );
      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No bookings found for this flight',
          status: STATUS.NOT_FOUND,
        });
      }

      return res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        message: 'Error fetching bookings records.',
        status: STATUS.FAILURE,
        error: error.message,
      });
    }
  }

  async getBookingsByStatus(req, res) {
    try {
      const bookings = await bookingService.getBookingsByStatus(
        req.params.status,
      );
      return res.status(200).json({
        data: bookings,
        count: bookings.length,
        message: 'Bookings fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        message: 'Error fetching bookings records.',
        status: STATUS.FAILURE,
        error: error.message,
      });
    }
  }

  async updateBookingByEmail(req, res) {
    try {
      const updatedBooking = await bookingService.updateBookingByEmail(
        req.params.email,
        req.body,
      );
      if (!updatedBooking) {
        return res.status(404).json({
          data: null,
          message: 'Booking not found',
          status: STATUS.NOT_FOUND,
        });
      }

      return res.status(200).json({
        data: updatedBooking,
        message: 'Booking updated successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).json({
        data: null,
        message: 'Error updating booking records.',
        status: STATUS.FAILURE,
        error: error.message,
      });
    }
  }

  async patchBookingByEmail(req, res) {
    try {
      const { email } = req.params;
      const operations = req.body;

      if (!Array.isArray(operations) || operations.length === 0) {
        return res.status(400).json({
          data: null,
          message: 'Request body must be a non-empty array of operations',
          status: STATUS.FAILURE,
        });
      }

      const updatedBooking = await bookingService.patchBookingByEmail(
        email,
        operations,
      );
      if (!updatedBooking) {
        return res.status(404).json({
          data: null,
          message: 'Booking not found for this email',
          status: STATUS.NOT_FOUND,
        });
      }

      return res.status(200).json({
        data: updatedBooking,
        message: 'Booking updated successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).json({
        data: null,
        message: 'Error updating booking records.',
        status: STATUS.FAILURE,
        error: error.message,
      });
    }
  }

  async deleteBookingsByEmail(req, res) {
    try {
      const deletedBookings = await bookingService.deleteBookingsByEmail(
        req.params.email,
      );
      if (deletedBookings.deletedCount === 0) {
        return res.status(404).json({
          data: null,
          message: 'No bookings found for this email',
          status: STATUS.NOT_FOUND,
        });
      }

      return res.status(200).json({
        data: { deletedCount: deletedBookings.deletedCount },
        message: `${deletedBookings.deletedCount} booking(s) deleted successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        message: 'Error deleting bookings records.',
        status: STATUS.FAILURE,
        error: error.message,
      });
    }
  }

  async deleteAllBookings(req, res) {
    try {
      const result = await bookingService.deleteAllBookings();
      return res.status(200).json({
        data: { deletedCount: result.deletedCount },
        message: 'All bookings deleted successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        message: 'Error deleting booking records.',
        status: STATUS.FAILURE,
        error: error.message,
      });
    }
  }
}

const bookingController = new BookingController();

// Map routes
router.post(
  '/api/bookings',
  bookingController.createBooking.bind(bookingController),
);
router.get(
  '/api/bookings',
  bookingController.getAllBookings.bind(bookingController),
);
router.get(
  '/api/bookings/:id',
  bookingController.getBookingById.bind(bookingController),
);
router.post(
  '/api/bookings/user',
  bookingController.getBookingsByUser.bind(bookingController),
);
router.get(
  '/api/bookings-flight/:flightNumber',
  bookingController.getBookingsByFlight.bind(bookingController),
);
router.get(
  '/api/bookings-status/:status',
  bookingController.getBookingsByStatus.bind(bookingController),
);
router.put(
  '/api/update-travel-records/:email',
  bookingController.updateBookingByEmail.bind(bookingController),
);
router.patch(
  '/api/update-travel-records/:email',
  bookingController.patchBookingByEmail.bind(bookingController),
);
router.delete(
  '/api/bookings/user/:email',
  bookingController.deleteBookingsByEmail.bind(bookingController),
);
router.delete(
  '/api/bookings',
  bookingController.deleteAllBookings.bind(bookingController),
);

bookingController.router = router;

module.exports = bookingController;
