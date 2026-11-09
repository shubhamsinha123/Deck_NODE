const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    open: {
      type: Number,
      required: true,
    },
    high: {
      type: Number,
      required: true,
    },
    low: {
      type: Number,
      required: true,
    },
    close: {
      type: Number,
      required: true,
    },
    volume: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: 'price_history',
    timestamps: true,
  },
);

// Compound index for fast time-range lookups and avoiding duplicates
priceHistorySchema.index({ symbol: 1, timestamp: -1 }, { unique: true });

module.exports = mongoose.models.PriceHistory || mongoose.model('PriceHistory', priceHistorySchema);
