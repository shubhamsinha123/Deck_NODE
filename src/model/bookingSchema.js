/* eslint-disable linebreak-style */
/* eslint-disable new-cap */
const mongoose = require('mongoose');

// Nested schema for passenger data
const passengerDataSchema = new mongoose.Schema({
  passFirstName: {
    type: String,
    required: true,
  },
  passLastName: {
    type: String,
    required: true,
  },
  passGender: {
    type: String,
    required: true,
  },
});

// Nested schema for flight fare details
const flightFareDetailsSchema = new mongoose.Schema({
  baseFare: {
    type: Number,
    required: true,
  },
  taxes: {
    type: Number,
    required: true,
  },
  convinenceFee: {
    type: Number,
    required: true,
  },
  baggageFee: {
    type: Number,
    required: false,
    default: 0,
  },
  seatFee: {
    type: Number,
    required: false,
    default: 0,
  },
  discount: {
    type: Number,
    required: false,
    default: 0,
  },
  totalFare: {
    type: Number,
    required: true,
  },
});

// Nested schema for flight details
const flightDetailsSchema = new mongoose.Schema({
  flightName: {
    type: String,
    required: true,
  },
  flightNumber: {
    type: String,
    required: true,
  },
  flightClass: {
    type: String,
    required: true,
  },
  flightDepartureDate: {
    type: String,
    required: true,
  },
  flightArrivalDate: {
    type: String,
    required: true,
  },
  flightDepartureTime: {
    type: String,
    required: true,
  },
  flightArrivalTime: {
    type: String,
    required: true,
  },
  flightDate: {
    type: String,
    required: true,
  },
  flightPassengerCount: {
    type: Number,
    required: true,
    default: 1,
  },
  flightFareDetails: {
    type: flightFareDetailsSchema,
    required: true,
  },
});

// Nested schema for add-ons
const addOnsSchema = new mongoose.Schema({
  extrabaggage: {
    type: Boolean,
    required: true,
    default: false,
  },
  meal: {
    type: Boolean,
    required: true,
    default: false,
  },
  priorityboarding: {
    type: Boolean,
    required: true,
    default: false,
  },
  extrabaggageCount: {
    type: Number,
    required: true,
    default: 0,
  },
  seatSelected: {
    type: [String],
    required: true,
    default: [],
  },
});

// Main booking schema
const bookingSchema = new mongoose.Schema({
  userEntryStep: {
    type: Number,
    required: true,
    default: 1,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userPhone: {
    type: String,
    required: true,
  },
  userAddress: {
    type: String,
    required: false,
  },
  passengerData: {
    type: [passengerDataSchema],
    required: true,
  },
  flightDetails: {
    type: flightDetailsSchema,
    required: true,
  },
  addOns: {
    type: addOnsSchema,
    required: true,
  },
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  bookingStatus: {
    type: String,
    required: true,
  },
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
