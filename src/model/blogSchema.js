const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      default: '',
    },
    sender: {
      type: String,
      default: 'Anonymous',
    },
    avatar: {
      type: String,
      default: '',
    },
    timestamp: {
      type: String,
      default: () => new Date().toISOString(),
    },
    likes: {
      type: Number,
      default: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    reactions: [
      {
        emoji: { type: String },
        count: { type: Number, default: 0 },
        users: [{ type: String }],
      },
    ],
  },
  { _id: true, timestamps: true },
);

const blogSchema = new mongoose.Schema(
  {
    // Primary Blog Fields
    title: {
      type: String,
      required: false,
      trim: true,
    },
    name: {
      // Retained for backward-compatibility with legacy routes
      type: String,
      required: false,
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    readTime: {
      type: String,
      default: '3 min read',
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    image: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    moreDesc: {
      type: String,
      default: '',
    },

    // Author Details Subdocument
    author: {
      name: {
        type: String,
        default: 'Anonymous',
      },
      role: {
        type: String,
        default: 'Author',
      },
      avatar: {
        type: String,
        default: '',
      },
    },

    // Location Information Subdocument
    location: {
      city: {
        type: String,
        default: '',
      },
      country: {
        type: String,
        default: '',
      },
      flagIcon: {
        type: String,
        default: '',
      },
    },

    // Engagement Metrics
    engagement: {
      viewCount: {
        type: mongoose.Schema.Types.Mixed, // Supports number or formatted strings like "29.2k"
        default: 0,
      },
      rating: {
        type: Number,
        default: null,
        min: 1,
        max: 5,
      },
      ratingCount: {
        type: Number,
        default: 0,
      },
      ratingSum: {
        type: Number,
        default: 0,
      },
      likesCount: {
        type: Number,
        default: 0,
      },
      ratedBy: [
        {
          userId: { type: String }, // User ID or anonymous session ID
          score: { type: Number, min: 1, max: 5 },
          submittedAt: { type: Date, default: Date.now },
        },
      ],
    },

    // Legacy flat fields for backward compatibility
    viewCount: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    flagIcon: {
      type: String,
      required: false,
    },
    likes: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    flag: {
      type: Boolean,
      required: false,
    },

    // Real-time Chat / Comments Subdocument List
    chat: [chatMessageSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Blog = mongoose.models.Blogs || mongoose.model('Blogs', blogSchema);
module.exports = Blog;

