const mongoose = require('mongoose');

const scrapedCacheSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // e.g. "cache:screener:RELIANCE.NS" or "cache:news:RELIANCE.NS"
      required: true,
    },
    source: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900, // MongoDB TTL Index: auto-deletes document after 900 seconds (15 minutes)
    },
  },
  {
    collection: 'scraped_cache',
  },
);

// Explicitly ensure TTL index
scrapedCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

module.exports = mongoose.models.ScrapedCache || mongoose.model('ScrapedCache', scrapedCacheSchema);
