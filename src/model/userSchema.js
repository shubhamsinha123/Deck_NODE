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
const schema = new mognoose.Schema(
  {
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
    hasPassword: {
      type: Boolean,
      required: false,
      unique: false,
    },
    avatar: {
      type: String,
      default: null,
      // Safety limit for MongoDB Free Tier:
      // Rejects any payload > 150 KB to prevent database bloat
      maxlength: [
        150000,
        'Avatar string too large for free tier database storage',
      ],
    },
    avatarSeed: {
      type: String,
      default: '',
      trim: true,
    },
    avatarType: {
      type: String,
      enum: ['vector', 'image', 'initials', null],
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mognoose.model('Citizen', schema);
