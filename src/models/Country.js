const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: false,
  },
  label: {
    type: String,
    required: true,
    unique: false,
  },
  phone: {
    type: String,
    required: true,
    unique: false,
  },
});

const Country = mongoose.models.Country || mongoose.model('Country', schema);
module.exports = Country;
