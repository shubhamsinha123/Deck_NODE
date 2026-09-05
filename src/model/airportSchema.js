const mongoose = require('mongoose');

// Trying to access airport collections
const schema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: false,
    unique: false,
  },
  city: {
    type: String,
    required: true,
    unique: false,
  },
  country: {
    type: String,
    required: true,
    unique: false,
  },
  Type: {
    type: String,
    required: true,
    unique: false,
  },
});

const Airport = mongoose.models.Airport || mongoose.model('Airport', schema);
module.exports = Airport;
