/* eslint-disable class-methods-use-this */
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
    return Booking.find({ userEmail, password }).select('-password');
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
    operations.forEach((operation) => {
      const { keyName, op, updatedData } = operation;

      if (!keyName || !op || !updatedData) {
        throw new Error(
          'Each operation must have keyName, op, and updatedData',
        );
      }

      if (!(keyName in booking.toObject())) {
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
