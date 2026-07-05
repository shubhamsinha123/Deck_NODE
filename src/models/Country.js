const mognoose = require('mongoose');
// Trying to access airport collections
const schema = new mognoose.Schema({
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

module.exports = mognoose.model('Country', schema);
