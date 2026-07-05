const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  MID: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator(value) {
        // Validate alphanumeric value using a regular expression
        return /^[a-zA-Z0-9]*$/.test(value);
      },
      message: 'ID must be alphanumeric.',
    },
  },
  name: {
    type: String,
    required: true,
    unique: false,
  },
  MPIN: {
    type: String,
    required: true,
    unique: false,
  },
});

module.exports = mongoose.model('Admin', adminSchema);
