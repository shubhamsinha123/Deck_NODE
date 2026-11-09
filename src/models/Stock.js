const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // e.g. "RELIANCE.NS"
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    company_name: {
      type: String,
      required: true,
    },
    exchange: {
      type: String,
      default: 'NSE',
    },
    sector: {
      type: String,
      default: 'General',
      index: true,
    },
    market_cap_category: {
      type: String,
      enum: ['LARGE', 'MID', 'SMALL'],
      default: 'LARGE',
      index: true,
    },
    series: {
      type: String,
      default: 'EQ',
      index: true,
    },
    isin: {
      type: String,
      default: '',
    },
    listing_date: {
      type: String,
      default: '',
    },
    current_price: {
      type: Number,
      default: 0,
    },
    day_change: {
      type: Number,
      default: 0,
    },
    day_change_percent: {
      type: Number,
      default: 0,
    },
    volume: {
      type: Number,
      default: 0,
    },
    delivery_percent: {
      type: Number,
      default: 0,
    },
    data_source: {
      type: String,
      default: 'REALTIME_NSE',
    },
    is_fallback: {
      type: Boolean,
      default: false,
      index: true,
    },
    data_tag: {
      type: String,
      enum: ['realtime', 'fallback'],
      default: 'realtime',
      index: true,
    },
    fifty_two_week: {
      high: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
    },
    fundamentals: {
      pe_ratio: { type: Number, default: 0 },
      industry_pe: { type: Number, default: 0 },
      pb_ratio: { type: Number, default: 0 },
      roe: { type: Number, default: 0 },
      roce: { type: Number, default: 0 },
      debt_to_equity: { type: Number, default: 0 },
      promoter_holding: { type: Number, default: 0 },
      promoter_pledged: { type: Number, default: 0 },
      fii_holding: { type: Number, default: 0 },
      dii_holding: { type: Number, default: 0 },
    },
    technicals: {
      rsi_14: { type: Number, default: 0 },
      macd: {
        signal: { type: String, default: 'NEUTRAL' },
        histogram: { type: Number, default: 0 },
      },
      dma_50: { type: Number, default: 0 },
      dma_200: { type: Number, default: 0 },
      pivot_levels: {
        p: { type: Number, default: 0 },
        r1: { type: Number, default: 0 },
        s1: { type: Number, default: 0 },
      },
    },
    latest_ai_verdict: {
      verdict: {
        type: String,
        enum: ['STRONG_BUY', 'BUY', 'HOLD', 'REDUCE', 'AVOID', 'PENDING'],
        default: 'PENDING',
        index: true,
      },
      composite_score: { type: Number, default: 50 },
      confidence_score: { type: Number, default: 50 },
      summary: { type: String, default: '' },
      updated_at: { type: Date, default: Date.now },
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'stocks',
    timestamps: true,
  },
);

module.exports = mongoose.models.Stock || mongoose.model('Stock', stockSchema);
