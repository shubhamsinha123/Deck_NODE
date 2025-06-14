/* eslint-disable linebreak-style */
/* eslint-disable new-cap */
const mognoose = require('mongoose');
// Trying to access airport collections
const schema = new mognoose.Schema({
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

const tcktPrice = new mognoose.model('Tktprice', schema);
module.exports = tcktPrice;
