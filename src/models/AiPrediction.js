const mongoose = require('mongoose');

const aiPredictionSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    verdict: {
      type: String,
      enum: ['STRONG_BUY', 'BUY', 'HOLD', 'REDUCE', 'AVOID'],
      required: true,
      index: true,
    },
    confidence_score: {
      type: Number,
      required: true,
    },
    composite_scores: {
      fundamental: { type: Number, default: 0 },
      technical: { type: Number, default: 0 },
      sentiment: { type: Number, default: 0 },
    },
    summary: {
      type: String,
      default: '',
    },
    fundamental_summary: {
      type: String,
      default: '',
    },
    technical_summary: {
      type: String,
      default: '',
    },
    sentiment_summary: {
      type: String,
      default: '',
    },
    catalysts: [
      {
        type: String,
      },
    ],
    risks: [
      {
        type: String,
      },
    ],
    suggested_horizon: {
      type: String,
      default: 'Medium-Term (1-6 months)',
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: 'ai_predictions',
    timestamps: true,
  },
);

aiPredictionSchema.index({ symbol: 1, created_at: -1 });

module.exports = mongoose.models.AiPrediction || mongoose.model('AiPrediction', aiPredictionSchema);
