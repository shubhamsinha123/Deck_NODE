const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: false,
  },
  date: {
    type: String,
    required: true,
    unique: false,
  },
  image: {
    type: String,
    required: true,
    unique: false,
  },
  description: {
    type: String,
    required: true,
    unique: false,
  },
  moreDesc: {
    type: String,
    required: false,
    unique: false,
  },
  viewCount: {
    type: Number,
    required: true,
    unique: false,
  },
  flagIcon: {
    type: String,
    required: true,
    unique: false,
  },
  city: {
    type: String,
    required: true,
    unique: false,
  },
  country: {
    type: String,
    required: true,
    unique: false,
  },
  likes: {
    type: Boolean,
    required: false,
    unique: false,
  },
  flag: {
    type: Boolean,
    required: false,
    unique: false,
  },
  chat: [
    {
      text: {
        type: String,
        required: false,
      },
      sender: {
        type: String,
        required: false,
      },
      timestamp: {
        type: String,
        required: false,
      },
      likes: {
        type: Number,
        required: false,
      },
      isEdited: {
        type: Boolean,
        required: false,
      },
    },
  ],
});

const Blog = mongoose.models.Blogs || mongoose.model('Blogs', schema);
module.exports = Blog;
