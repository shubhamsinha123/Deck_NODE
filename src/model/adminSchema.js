/* eslint-disable linebreak-style */
/* eslint-disable new-cap */
const mognoose = require('mongoose');

const newSchema = new mognoose.Schema({
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

const admin = new mognoose.model('Admin', newSchema);
module.exports = admin;
