/* eslint-disable linebreak-style */
// const mognoose = require("mongoose");

// const schema = new mognoose.Schema({
//   id: {
//     type: String,
//     required: true,
//     unique: true,
//     validate: {
//       validator: function (value) {
//         // Validate alphanumeric value using a regular expression
//         return /^[a-zA-Z0-9]*$/.test(value);
//       },
//       message: "ID must be alphanumeric.",
//     },
//   },
//   name: {
//     type: String,
//     required: true,
//     unique: false,
//   },
//   location: {
//     type: String,
//     required: true,
//     unique: false,
//   },
//   date: {
//     type: Date,
//     required: false,
//     unique: false,
//   },
//   country: {
//     type: String,
//     required: true,
//     unique: false,
//   },
//   visaStatus: {
//     type: String,
//     required: false,
//     unique: false,
//   },
// });

// const citizen = new mognoose.Model("Citizen", schema);
// module.exports = citizen;
