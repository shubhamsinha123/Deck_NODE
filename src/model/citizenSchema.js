/* eslint-disable linebreak-style */
/* eslint-disable new-cap */
const mognoose = require('mongoose');

const nestedSchema = new mognoose.Schema({
  city: {
    type: String,
    required: false,
  },
  code: {
    type: String,
    required: false,
  },
  country: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
});
const schema = new mognoose.Schema({
  id: {
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
  password: {
    type: String,
    unique: true,
    validate: {
      validator(value) {
        // Validate alphanumeric value using a regular expression
        return /^[a-zA-Z0-9]*$/.test(value);
      },
      message: 'Password can be alphanumeric.',
    },
  },
  location: {
    type: String,
    required: true,
    unique: false,
  },
  date: {
    type: Date,
    required: false,
    unique: false,
  },
  country: {
    type: String,
    required: true,
    unique: false,
  },
  visaStatus: {
    type: String,
    required: false,
    unique: false,
  },
  eDate: {
    type: Date,
    required: false,
    unique: false,
  },
  properties: {
    date: { type: String, required: false },
    class: { type: String, required: false },
    seat: { type: String, required: false },
    from: nestedSchema,
    to: nestedSchema,
    setNewsletter: { type: Boolean, required: false },
  },
  isPassword: {
    type: Boolean,
    required: false,
    unique: false,
  },
});

const citizen = new mognoose.model('Citizen', schema);
module.exports = citizen;
