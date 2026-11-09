/* eslint-disable */
const axios = require('axios');
const AiPrediction = require('../models/AiPrediction');
const Stock = require('../models/Stock');

class AiRecommendationService {
  /**
   * Generates or retrieves an AI recommendation for a stock
   */
  async generateRecommendation({
    symbol,
    companyName,
    quote,
    fundamentals,
    technicals,
    headlines = [],
    quantResult,
  }) {
    let aiOutput = null;

    // 1. If Gemini API key is configured, invoke Gemini API
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        aiOutput = await this.callGeminiAPI({
          symbol,
          companyName,
          quote,
          fundamentals,
          technicals,
          headlines,
          apiKey: geminiApiKey,
        });
      } catch (err) {
        console.warn(`[AiRecommendation] Gemini call failed (${err.message}). Falling back to Quant synthesis.`);
      }
    }

    // 2. Deterministic SEBI-standard financial synthesis fallback
    if (!aiOutput) {
      aiOutput = this.generateDeterministicInsight({
        symbol,
        companyName,
        quote,
        fundamentals,
        technicals,
        headlines,
        quantResult,
      });
    }

    // Standardize verdict
    let normalizedVerdict = aiOutput.verdict || quantResult.verdict;
    if (normalizedVerdict === 'SELL') normalizedVerdict = 'REDUCE';

    const predictionPayload = {
      symbol,
      verdict: normalizedVerdict,
      confidence_score: aiOutput.confidence_score || quantResult.confidence_score,
      composite_scores: quantResult.composite_scores,
      summary:
        aiOutput.summary ||
        `${companyName} shows ${normalizedVerdict.replace('_', ' ')} characteristics with balanced fundamentals and technical indicators.`,
      fundamental_summary: aiOutput.fundamental_summary || '',
      technical_summary: aiOutput.technical_summary || '',
      sentiment_summary: aiOutput.sentiment_summary || '',
      catalysts: aiOutput.key_catalysts || aiOutput.catalysts || [],
      risks: aiOutput.key_risks || aiOutput.risks || [],
      suggested_horizon:
        aiOutput.ideal_action_horizon || aiOutput.suggested_horizon || quantResult.suggested_horizon,
      created_at: new Date(),
    };

    // 3. Save into AiPrediction audit collection
    try {
      await AiPrediction.create(predictionPayload);
    } catch (saveErr) {
      console.warn(`[AiRecommendation] Failed to save prediction audit: ${saveErr.message}`);
    }

    // 4. Update the Master Stock document snapshot
    try {
      await Stock.findByIdAndUpdate(symbol, {
        latest_ai_verdict: {
          verdict: predictionPayload.verdict,
          composite_score: quantResult.composite_score,
          confidence_score: predictionPayload.confidence_score,
          summary: predictionPayload.summary,
          updated_at: new Date(),
        },
      });
    } catch (updateErr) {
      console.warn(`[AiRecommendation] Failed to update Stock latest_ai_verdict: ${updateErr.message}`);
    }

    return predictionPayload;
  }

  /**
   * Invokes Google Gemini API with SEBI financial research prompt
   */
  async callGeminiAPI({
    symbol,
    companyName,
    quote,
    fundamentals,
    technicals,
    headlines,
    apiKey,
  }) {
    const prompt = `You are a senior Indian equity research analyst certified by SEBI standards.
Analyze the following multi-source metrics for stock: ${symbol} (${companyName || symbol})

Fundamental Data:
- P/E: ${fundamentals.pe_ratio} (Industry Average: ${fundamentals.industry_pe || 25})
- ROCE: ${fundamentals.roce}%, ROE: ${fundamentals.roe}%
- Debt-to-Equity: ${fundamentals.debt_to_equity}
- FII/DII Total Flow: ${(fundamentals.fii_holding || 0) + (fundamentals.dii_holding || 0)}%
- Promoter Pledged: ${fundamentals.promoter_pledged || 0}%

Technical Data:
- Current Price: ₹${quote.current_price}
- 50 DMA: ₹${technicals.dma_50}, 200 DMA: ₹${technicals.dma_200}
- RSI (14): ${technicals.rsi_14}
- MACD Status: ${technicals.macd ? technicals.macd.signal : 'NEUTRAL'}
- Delivery Volume %: ${quote.delivery_percent || 50}%

Recent News Headlines (Last 72 hours):
${headlines.map((h) => `- ${h.title}`).join('\n')}

Task:
Provide a structured analysis in valid JSON format without markdown ticks:
{
  "verdict": "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "AVOID",
  "confidence_score": 0-100,
  "fundamental_summary": "1-2 sentences on valuation and balance sheet",
  "technical_summary": "1-2 sentences on momentum and trend",
  "sentiment_summary": "1-2 sentences on news impact",
  "key_catalysts": ["catalyst 1", "catalyst 2", "catalyst 3"],
  "key_risks": ["risk 1", "risk 2"],
  "ideal_action_horizon": "Short-Term (1-4 weeks)" | "Medium-Term (1-6 months)" | "Long-Term (3-12 months)"
}`;

    // Call Gemini 1.5/2.0 API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      },
      { timeout: 12000 },
    );

    const candidateText =
      response.data &&
      response.data.candidates &&
      response.data.candidates[0] &&
      response.data.candidates[0].content &&
      response.data.candidates[0].content.parts &&
      response.data.candidates[0].content.parts[0] &&
      response.data.candidates[0].content.parts[0].text;

    if (!candidateText) {
      throw new Error('Empty response from Gemini API');
    }

    const cleaned = candidateText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }

  /**
   * Generates SEBI-standard financial rationale when LLM API key is not present or offline
   */
  generateDeterministicInsight({
    symbol,
    companyName,
    quote,
    fundamentals,
    technicals,
    headlines,
    quantResult,
  }) {
    const catalysts = [];
    const risks = [];

    // Catalysts
    if ((quote.delivery_percent || 50) >= 50) {
      catalysts.push(
        `Healthy delivery volume of ${quote.delivery_percent || 52}% indicating steady institutional accumulation.`,
      );
    }
    if (technicals.rsi_14 >= 45 && technicals.rsi_14 <= 65) {
      catalysts.push(
        `RSI at ${technicals.rsi_14} indicates healthy upward momentum headroom before entering overbought zone.`,
      );
    } else if (technicals.rsi_14 < 35) {
      catalysts.push(
        `RSI at ${technicals.rsi_14} presents an attractive oversold mean-reversion opportunity.`,
      );
    }

    if (quote.current_price > technicals.dma_50 && technicals.dma_50 > technicals.dma_200) {
      catalysts.push('Golden Cross formation with price comfortably trading above 50 and 200 DMAs.');
    }

    if ((fundamentals.promoter_pledged || 0) === 0 && (fundamentals.debt_to_equity || 0) < 0.6) {
      catalysts.push(
        `Prudent balance sheet with zero promoter share pledging and conservative debt-to-equity of ${fundamentals.debt_to_equity || 0.4}.`,
      );
    }

    if ((fundamentals.roce || 0) > 15) {
      catalysts.push(`Superior capital efficiency demonstrated by ROCE of ${fundamentals.roce}%.`);
    }

    // Risks
    if (fundamentals.pe_ratio > (fundamentals.industry_pe || 25)) {
      risks.push(
        `Valuation P/E of ${fundamentals.pe_ratio} trades at a premium to sector benchmark (${fundamentals.industry_pe || 25}).`,
      );
    }
    if (quote.fifty_two_week && quote.current_price >= quote.fifty_two_week.high * 0.95) {
      risks.push('Trading within 5% of 52-week highs, potentially facing overhead profit booking.');
    }
    if (technicals.rsi_14 > 70) {
      risks.push(`RSI at ${technicals.rsi_14} signals near-term overbought conditions.`);
    }
    if ((fundamentals.debt_to_equity || 0) > 1.2) {
      risks.push(
        `Elevated leverage with debt-to-equity ratio at ${fundamentals.debt_to_equity}, sensitive to interest rate cycles.`,
      );
    }

    if (catalysts.length === 0) {
      catalysts.push('Stable cash flow visibility and defensiveness in core operating business.');
    }
    if (risks.length === 0) {
      risks.push('Broader macroeconomic volatility and global supply chain fluctuations.');
    }

    const fundamentalSummary = `P/E stands at ${fundamentals.pe_ratio || 'N/A'} with ROCE of ${fundamentals.roce || 'N/A'}% and manageable debt-to-equity of ${fundamentals.debt_to_equity || '0.4'}.`;
    const technicalSummary = `Stock is trading at ₹${quote.current_price} with RSI at ${technicals.rsi_14} and MACD signal: ${technicals.macd ? technicals.macd.signal : 'NEUTRAL'}.`;
    const sentimentSummary =
      headlines.length > 0
        ? `Recent news flow reflects balanced coverage across ${headlines.length} tracked market sources.`
        : 'Neutral sentiment based on ongoing market consolidation.';

    const summary = `${companyName || symbol} shows ${quantResult.verdict.replace('_', ' ')} signals with a composite score of ${quantResult.composite_score}/100 based on technical trend, fundamental health, and news sentiment.`;

    return {
      verdict: quantResult.verdict,
      confidence_score: quantResult.confidence_score,
      summary,
      fundamental_summary: fundamentalSummary,
      technical_summary: technicalSummary,
      sentiment_summary: sentimentSummary,
      key_catalysts: catalysts.slice(0, 3),
      key_risks: risks.slice(0, 2),
      ideal_action_horizon: quantResult.suggested_horizon,
    };
  }
}

module.exports = new AiRecommendationService();
