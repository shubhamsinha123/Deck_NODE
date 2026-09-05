const mongoose = require('mongoose');

const oauthTokenSchema = new mongoose.Schema(
  {
    // Generic owner reference — works for both Admin and User tokens
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    ownerType: {
      type: String,
      enum: ['admin', 'user'],
      required: true,
    },
    identifier: {
      // MID for admin, id for user
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Auto-delete expired tokens via TTL index
oauthTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OAuthToken', oauthTokenSchema);
