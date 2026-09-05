const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: false,
    default: '',
  },
  thumbnail: {
    type: String,
    required: false,
    default: '',
  },
  uploaderName: {
    type: String,
    required: false,
    default: '',
  },
  duration: {
    type: Number,
    required: false,
    default: 0,
  },
}, { _id: false });

const playlistSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    default: () => `pl-${Date.now()}`,
  },
  name: {
    type: String,
    required: true,
    default: 'My Playlist',
  },
  tracks: {
    type: [trackSchema],
    default: [],
  },
}, { _id: false });

const nestedSchema = new mongoose.Schema({
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
const schema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator(value) {
        // Validate alphanumeric value using a regular expression
        return /^[a-zA-Z0-9+_.-]*$/.test(value);
      },
      message: 'ID must be valid alphanumeric or phone/email string.',
    },
  },
  mobileNumber: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
    unique: false,
  },
  password: {
    type: String,
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
  musicList: {
    type: [playlistSchema],
    default: [],
  },
  hasPassword: {
    type: Boolean,
    required: false,
    unique: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
});

module.exports = mongoose.model('Citizen', schema);
