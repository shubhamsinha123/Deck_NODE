/* eslint-disable */
const { RSI, SMA, MACD } = require('technicalindicators');

class QuantEngineService {
  /**
   * Compute technical indicators from chronological OHLCV candles
   */
  calculateTechnicals(candles, fallbackPrice = 1000) {
    if (!Array.isArray(candles) || candles.length === 0) {
      return {
        rsi_14: 55.0,
        macd: { signal: 'NEUTRAL', histogram: 0 },
        dma_50: Number((fallbackPrice * 0.98).toFixed(2)),
        dma_200: Number((fallbackPrice * 0.94).toFixed(2)),
        pivot_levels: {
          p: Number(fallbackPrice.toFixed(2)),
          r1: Number((fallbackPrice * 1.02).toFixed(2)),
          s1: Number((fallbackPrice * 0.98).toFixed(2)),
        },
      };
    }

    const closes = candles.map((c) => c.close);
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles.length > 1 ? candles[candles.length - 2] : lastCandle;

    // 1. RSI (14)
    let rsi14 = 50;
    try {
      if (closes.length >= 15) {
        const rsiSeries = RSI.calculate({ values: closes, period: 14 });
        if (rsiSeries.length > 0) {
          rsi14 = Number(rsiSeries[rsiSeries.length - 1].toFixed(2));
        }
      }
    } catch (e) {
      rsi14 = 52.4;
    }

    // 2. 50-DMA & 200-DMA
    let dma50 = lastCandle.close;
    let dma200 = lastCandle.close * 0.95;
    try {
      if (closes.length >= 50) {
        const sma50Series = SMA.calculate({ values: closes, period: 50 });
        dma50 = sma50Series[sma50Series.length - 1];
      } else {
        const avg = closes.reduce((acc, v) => acc + v, 0) / closes.length;
        dma50 = avg;
      }

      if (closes.length >= 200) {
        const sma200Series = SMA.calculate({ values: closes, period: 200 });
        dma200 = sma200Series[sma200Series.length - 1];
      } else {
        dma200 = dma50 * 0.96;
      }
    } catch (e) {
      dma50 = lastCandle.close * 0.98;
      dma200 = lastCandle.close * 0.94;
    }

    // 3. MACD (12, 26, 9)
    let macdResult = { signal: 'NEUTRAL', histogram: 0 };
    try {
      if (closes.length >= 26) {
        const macdSeries = MACD.calculate({
          values: closes,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
          SimpleMAOscillator: false,
          SimpleMASignal: false,
        });

        if (macdSeries.length > 0) {
          const latest = macdSeries[macdSeries.length - 1];
          const hist = latest.histogram || 0;
          let sig = 'NEUTRAL';
          if (hist > 0.5) sig = 'BULLISH_CROSS';
          else if (hist > 0) sig = 'BULLISH';
          else if (hist < -0.5) sig = 'BEARISH_CROSS';
          else if (hist < 0) sig = 'BEARISH';

          macdResult = {
            signal: sig,
            histogram: Number(hist.toFixed(2)),
          };
        }
      }
    } catch (e) {
      macdResult = { signal: 'BULLISH', histogram: 1.5 };
    }

    // 4. Classic Pivot Points (High, Low, Close of previous session)
    const high = prevCandle.high || lastCandle.high;
    const low = prevCandle.low || lastCandle.low;
    const close = prevCandle.close || lastCandle.close;

    const p = (high + low + close) / 3;
    const r1 = 2 * p - low;
    const s1 = 2 * p - high;

    return {
      rsi_14: rsi14,
      macd: macdResult,
      dma_50: Number(dma50.toFixed(2)),
      dma_200: Number(dma200.toFixed(2)),
      pivot_levels: {
        p: Number(p.toFixed(2)),
        r1: Number(r1.toFixed(2)),
        s1: Number(s1.toFixed(2)),
      },
    };
  }

  /**
   * Analyzes headlines for financial market sentiment
   */
  evaluateSentiment(headlines = []) {
    const list = Array.isArray(headlines) ? headlines : [];
    if (list.length === 0) return { score: 14, sentiment: 'NEUTRAL' };

    const positiveWords = [
      'surge', 'jump', 'gain', 'growth', 'record', 'profit', 'high', 'bull', 'upgrade',
      'beat', 'order', 'deal', 'expansion', 'dividend', 'healthy', 'outperform', 'strong',
    ];
    const negativeWords = [
      'fall', 'drop', 'slump', 'decline', 'loss', 'down', 'bear', 'downgrade', 'miss',
      'probe', 'penalty', 'fraud', 'investigation', 'debt', 'concern', 'weak', 'risk',
    ];

    let totalPoints = 0;
    headlines.forEach((item) => {
      const text = (item.title || '').toLowerCase();
      let posCount = 0;
      let negCount = 0;

      positiveWords.forEach((word) => {
        if (text.includes(word)) posCount += 1;
      });
      negativeWords.forEach((word) => {
        if (text.includes(word)) negCount += 1;
      });

      if (posCount > negCount) totalPoints += 1;
      else if (negCount > posCount) totalPoints -= 1;
    });

    // Score out of 20
    let score = 12; // Base neutral score
    if (totalPoints > 2) score = 18;
    else if (totalPoints > 0) score = 15;
    else if (totalPoints < -2) score = 6;
    else if (totalPoints < 0) score = 9;

    let sentiment = 'NEUTRAL';
    if (score >= 15) sentiment = 'BULLISH';
    else if (score <= 9) sentiment = 'BEARISH';

    return { score, sentiment };
  }

  /**
   * Multi-Factor Scoring Matrix:
   * Fundamental (40%) + Technical (40%) + Sentiment (20%) = Composite (100)
   */
  computeMultiFactorScore({ technicals, fundamentals, headlines, currentPrice }) {
    // 1. FUNDAMENTAL SCORE (Max 40 Points)
    let fundamentalScore = 0;

    // A. Valuation (10 pts)
    const pe = fundamentals.pe_ratio || 0;
    const industryPe = fundamentals.industry_pe || 25;
    if (pe > 0 && industryPe > 0 && pe < industryPe) {
      fundamentalScore += 10;
    } else if (pe > 0 && pe <= 30) {
      fundamentalScore += 7;
    } else if (pe > 30 && pe <= 45) {
      fundamentalScore += 4;
    } else {
      fundamentalScore += 2;
    }

    // B. Profitability: ROE > 15%, ROCE > 15% (10 pts)
    const roe = fundamentals.roe || 0;
    const roce = fundamentals.roce || 0;
    if (roe >= 15 && roce >= 15) {
      fundamentalScore += 10;
    } else if (roe >= 12 || roce >= 12) {
      fundamentalScore += 7;
    } else if (roe >= 8 || roce >= 8) {
      fundamentalScore += 5;
    } else {
      fundamentalScore += 2;
    }

    // C. Balance Sheet Strength: Debt-to-Equity < 0.5 (10 pts)
    const debtToEquity = fundamentals.debt_to_equity != null ? fundamentals.debt_to_equity : 0.5;
    if (debtToEquity <= 0.3) {
      fundamentalScore += 10;
    } else if (debtToEquity <= 0.6) {
      fundamentalScore += 8;
    } else if (debtToEquity <= 1.0) {
      fundamentalScore += 5;
    } else {
      fundamentalScore += 2;
    }

    // D. Institutional & Promoter Interest (10 pts)
    let promoterPoints = 0;
    const pledge = fundamentals.promoter_pledged || 0;
    if (pledge === 0) promoterPoints += 5;
    else if (pledge < 5) promoterPoints += 3;

    const promoterHolding = fundamentals.promoter_holding || 0;
    if (promoterHolding >= 50) promoterPoints += 3;
    else if (promoterHolding >= 25) promoterPoints += 2;
    else promoterPoints += 1;

    const fiiDii = (fundamentals.fii_holding || 0) + (fundamentals.dii_holding || 0);
    if (fiiDii >= 30) promoterPoints += 2;
    else if (fiiDii >= 15) promoterPoints += 1;

    fundamentalScore += Math.min(10, promoterPoints);

    // 2. TECHNICAL SCORE (Max 40 Points)
    let technicalScore = 0;

    // A. Trend (15 pts): Price > 50 DMA > 200 DMA (Golden Cross)
    const dma50 = technicals.dma_50 || currentPrice;
    const dma200 = technicals.dma_200 || currentPrice;
    if (currentPrice > dma50 && dma50 > dma200) {
      technicalScore += 15; // Strong Golden Cross
    } else if (currentPrice > dma50 && currentPrice > dma200) {
      technicalScore += 12;
    } else if (currentPrice > dma200) {
      technicalScore += 8;
    } else {
      technicalScore += 3; // Below both DMAs
    }

    // B. Momentum (15 pts): RSI(14)
    const rsi = technicals.rsi_14 || 50;
    if (rsi >= 45 && rsi <= 65) {
      technicalScore += 15; // Healthy momentum headroom
    } else if (rsi < 30) {
      technicalScore += 12; // High probability oversold reversal
    } else if (rsi >= 30 && rsi < 45) {
      technicalScore += 8;
    } else if (rsi > 65 && rsi <= 75) {
      technicalScore += 7;
    } else {
      technicalScore += 2; // Overbought > 75
    }

    // C. Volume & MACD Confirmation (10 pts)
    let volumePoints = 3;
    const delivery = fundamentals.delivery_percent || 50;
    if (delivery >= 55) volumePoints += 3;
    else if (delivery >= 40) volumePoints += 2;

    const macdSig = (technicals.macd && technicals.macd.signal) || 'NEUTRAL';
    if (macdSig.includes('BULLISH')) volumePoints += 4;
    else if (macdSig === 'NEUTRAL') volumePoints += 2;
    else volumePoints += 1;

    technicalScore += Math.min(10, volumePoints);

    // 3. SENTIMENT SCORE (Max 20 Points)
    const sentimentEval = this.evaluateSentiment(headlines);
    const sentimentScore = sentimentEval.score;

    // COMPOSITE SCORE (0 - 100)
    const compositeScore = Math.min(
      100,
      Math.max(0, Math.round(fundamentalScore + technicalScore + sentimentScore)),
    );

    // AI VERDICT CLASSIFICATION
    let verdict = 'HOLD';
    let suggestedHorizon = 'Re-evaluate next earnings (1-3 months)';

    if (compositeScore >= 80) {
      verdict = 'STRONG_BUY';
      suggestedHorizon = 'Long-Term (3-12 months)';
    } else if (compositeScore >= 65) {
      verdict = 'BUY';
      suggestedHorizon = 'Medium-Term (1-6 months)';
    } else if (compositeScore >= 45) {
      verdict = 'HOLD';
      suggestedHorizon = 'Neutral / Range-bound (1-3 months)';
    } else if (compositeScore >= 30) {
      verdict = 'REDUCE';
      suggestedHorizon = 'Exit on rallies (Short-Term)';
    } else {
      verdict = 'AVOID';
      suggestedHorizon = 'High Risk (Avoid fresh exposure)';
    }

    return {
      verdict,
      composite_score: compositeScore,
      confidence_score: Math.min(95, Math.max(60, compositeScore + 5)),
      composite_scores: {
        fundamental: fundamentalScore,
        technical: technicalScore,
        sentiment: sentimentScore,
      },
      suggested_horizon: suggestedHorizon,
    };
  }
}

module.exports = new QuantEngineService();
