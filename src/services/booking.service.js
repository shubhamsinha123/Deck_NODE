/* eslint-disable class-methods-use-this */
const bcrypt = require('bcryptjs');
const Booking = require('../models/Booking');

class BookingService {
  async createBooking(bookingData) {
    const newBooking = new Booking(bookingData);
    return newBooking.save();
  }

  async getAllBookings() {
    return Booking.find();
  }

  async getBookingById(id) {
    return Booking.findById(id);
  }

  async getBookingsByUser(userEmail, password) {
    if (typeof userEmail === 'object') {
      return Booking.find(userEmail).select('-password');
    }

    const bookings = await Booking.find({ userEmail });
    if (!bookings || bookings.length === 0) {
      return [];
    }

    const results = await Promise.all(
      bookings.map(async (booking) => {
        if (!booking.password) {
          return booking;
        }
        const isBcryptMatch = await bcrypt
          .compare(password, booking.password)
          .catch(() => false);
        const isExactMatch = booking.password === password;
        if (isBcryptMatch || isExactMatch) {
          return booking;
        }
        return null;
      }),
    );
    const validBookings = results.filter(Boolean);

    return validBookings.map((b) => {
      const obj = typeof b.toObject === 'function' ? b.toObject() : { ...b };

      delete obj.password;
      return obj;
    });
  }

  async getBookingsByEmail(email) {
    return Booking.find({ userEmail: email });
  }

  async getBookingsByFlight(flightNumber) {
    return Booking.find({
      'flightDetails.flightNumber': flightNumber,
    });
  }

  async getBookingsByStatus(status) {
    return Booking.find({ bookingStatus: status });
  }

  async updateBookingByEmail(email, updateData) {
    return Booking.findOneAndUpdate({ userEmail: email }, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async patchBookingByEmail(email, operations) {
    const booking = await Booking.findOne({ userEmail: email });
    if (!booking) {
      return null;
    }

    const updateData = {};
    const validPaths = Object.keys(Booking.schema.paths);

    operations.forEach((operation) => {
      const { keyName, op, updatedData } = operation;

      if (!keyName || !op || !updatedData) {
        throw new Error(
          'Each operation must have keyName, op, and updatedData',
        );
      }

      if (!validPaths.includes(keyName) && !(keyName in booking.toObject())) {
        throw new Error(`Field '${keyName}' not found in booking record`);
      }

      if (op === '/replace') {
        Object.assign(updateData, updatedData);
      } else {
        throw new Error(
          `Unsupported operation: ${op}. Currently only /replace is supported`,
        );
      }
    });

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return Booking.findOneAndUpdate({ userEmail: email }, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async deleteBookingsByEmail(email) {
    return Booking.deleteMany({ userEmail: email });
  }

  async deleteAllBookings() {
    return Booking.deleteMany({});
  }
}

module.exports = new BookingService();
