const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  codeFrom: {
    type: String,
    required: true,
    unique: true,
  },
  codeTo: {
    type: String,
    required: false,
    unique: false,
  },
  price: {
    type: String,
    required: false,
    unique: false,
  },
});

const Price = mongoose.models.Tktprice || mongoose.model('Tktprice', schema);
module.exports = Price;
