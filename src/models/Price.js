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

module.exports = mognoose.model('Tktprice', schema);
