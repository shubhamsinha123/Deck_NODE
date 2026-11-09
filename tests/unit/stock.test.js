const quantEngine = require('../../src/services/quantEngine.service');
const aiRecommendation = require('../../src/services/aiRecommendation.service');
const stockScraper = require('../../src/services/stockScraper.service');
const stockService = require('../../src/services/stock.service');
const Stock = require('../../src/models/Stock');
const ScrapedCache = require('../../src/models/ScrapedCache');
const AiPrediction = require('../../src/models/AiPrediction');

jest.mock('../../src/models/Stock');
jest.mock('../../src/models/ScrapedCache');
jest.mock('../../src/models/AiPrediction');
jest.mock('../../src/models/PriceHistory');

describe('Indian Stock Lister & AI Engine Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('QuantEngineService', () => {
    it('should calculate technical indicators accurately from OHLCV candles', () => {
      const mockCandles = [];
      let base = 2500;
      for (let i = 0; i < 60; i += 1) {
        base += i % 2 === 0 ? 5 : -3;
        mockCandles.push({
          timestamp: new Date(Date.now() - (60 - i) * 86400000),
          open: base - 2,
          high: base + 10,
          low: base - 8,
          close: base,
          volume: 1500000,
        });
      }

      const technicals = quantEngine.calculateTechnicals(mockCandles);

      expect(technicals).toHaveProperty('rsi_14');
      expect(technicals).toHaveProperty('dma_50');
      expect(technicals).toHaveProperty('dma_200');
      expect(technicals).toHaveProperty('macd');
      expect(technicals).toHaveProperty('pivot_levels');
      expect(technicals.pivot_levels).toHaveProperty('p');
      expect(technicals.pivot_levels).toHaveProperty('r1');
      expect(technicals.pivot_levels).toHaveProperty('s1');
      expect(technicals.rsi_14).toBeGreaterThan(0);
      expect(technicals.rsi_14).toBeLessThanOrEqual(100);
    });

    it('should evaluate headline sentiment accurately', () => {
      const positiveHeadlines = [
        { title: 'Reliance shares surge 4% to record high on stellar profit growth' },
        { title: 'Analysts upgrade stock after strong quarterly order wins' },
      ];
      const negativeHeadlines = [
        { title: 'Stock plunges 5% as penalty and fraud investigation begins' },
        { title: 'Sharp decline in margins triggers earnings downgrade' },
      ];

      const posResult = quantEngine.evaluateSentiment(positiveHeadlines);
      const negResult = quantEngine.evaluateSentiment(negativeHeadlines);

      expect(posResult.score).toBeGreaterThan(12);
      expect(posResult.sentiment).toBe('BULLISH');

      expect(negResult.score).toBeLessThan(12);
      expect(negResult.sentiment).toBe('BEARISH');
    });

    it('should calculate 40-40-20 multi-factor score and classify verdicts correctly', () => {
      // Strong bullish metrics
      const bullishInput = {
        technicals: {
          rsi_14: 55,
          dma_50: 2900,
          dma_200: 2700,
          macd: { signal: 'BULLISH_CROSS', histogram: 4.5 },
          pivot_levels: { p: 2950, r1: 3000, s1: 2920 },
        },
        fundamentals: {
          pe_ratio: 22,
          industry_pe: 26,
          roe: 20,
          roce: 22,
          debt_to_equity: 0.25,
          promoter_holding: 55,
          promoter_pledged: 0,
          fii_holding: 25,
          dii_holding: 20,
          delivery_percent: 60,
        },
        headlines: [{ title: 'Company posts record profit with strong margin expansion' }],
        currentPrice: 3000,
      };

      const result = quantEngine.computeMultiFactorScore(bullishInput);

      expect(result.composite_score).toBeGreaterThanOrEqual(80);
      expect(result.verdict).toBe('STRONG_BUY');
      expect(result.composite_scores.fundamental).toBeGreaterThan(30);
      expect(result.composite_scores.technical).toBeGreaterThan(30);
      expect(result.composite_scores.sentiment).toBeGreaterThan(12);
    });

    it('should classify weak metrics as AVOID or REDUCE', () => {
      const bearishInput = {
        technicals: {
          rsi_14: 82, // Overbought danger
          dma_50: 950,
          dma_200: 980,
          macd: { signal: 'BEARISH_CROSS', histogram: -3.2 },
          pivot_levels: { p: 900, r1: 910, s1: 890 },
        },
        fundamentals: {
          pe_ratio: 95, // Highly overvalued
          industry_pe: 20,
          roe: 3,
          roce: 4,
          debt_to_equity: 2.2, // Heavy debt
          promoter_holding: 20,
          promoter_pledged: 35, // High pledge
          fii_holding: 2,
          dii_holding: 3,
          delivery_percent: 25,
        },
        headlines: [{ title: 'Company faces regulatory probe and profit plunge' }],
        currentPrice: 880, // Below 50 & 200 DMA
      };

      const result = quantEngine.computeMultiFactorScore(bearishInput);

      expect(result.composite_score).toBeLessThan(45);
      expect(['REDUCE', 'AVOID']).toContain(result.verdict);
    });
  });

  describe('StockScraperService & TTL Cache', () => {
    it('should read from ScrapedCache if present and not expired', async () => {
      const mockPayload = { pe_ratio: 28.5, roe: 18.0 };
      ScrapedCache.findById.mockResolvedValue({ payload: mockPayload });

      const cached = await stockScraper.getCache('cache:screener:RELIANCE.NS');

      expect(ScrapedCache.findById).toHaveBeenCalledWith('cache:screener:RELIANCE.NS');
      expect(cached).toEqual(mockPayload);
    });

    it('should write to ScrapedCache with upsert', async () => {
      ScrapedCache.findOneAndUpdate.mockResolvedValue({});

      await stockScraper.setCache('cache:screener:TCS.NS', 'screener.in', 'TCS.NS', { pe: 30 });

      expect(ScrapedCache.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'cache:screener:TCS.NS' },
        expect.objectContaining({
          source: 'screener.in',
          symbol: 'TCS.NS',
          payload: { pe: 30 },
        }),
        expect.objectContaining({ upsert: true }),
      );
    });

    it('should generate synthetic candles with fallback tags if API fails', () => {
      const candles = stockScraper.generateSyntheticCandles('RELIANCE.NS', '1M');

      expect(Array.isArray(candles)).toBe(true);
      expect(candles.length).toBeGreaterThan(20);
      expect(candles[0]).toHaveProperty('open');
      expect(candles[0]).toHaveProperty('high');
      expect(candles[0]).toHaveProperty('low');
      expect(candles[0]).toHaveProperty('close');
      expect(candles[0]).toHaveProperty('volume');
      expect(candles[0].is_fallback).toBe(true);
      expect(candles[0].data_tag).toBe('fallback');
    });

    it('should tag quotes appropriately as realtime or fallback', async () => {
      jest.spyOn(stockScraper, 'fetchLiveQuoteFromYahooV8').mockResolvedValue(null);
      jest.spyOn(stockScraper, 'fetchLiveQuoteFromScreener').mockResolvedValue(null);
      ScrapedCache.findById.mockResolvedValue(null);

      const fallbackQuote = await stockScraper.fetchQuoteAndMeta('UNKNOWN_SYM.NS');
      expect(fallbackQuote.is_fallback).toBe(true);
      expect(fallbackQuote.data_tag).toBe('fallback');
      expect(fallbackQuote.data_source).toBe('FALLBACK');

      jest.spyOn(stockScraper, 'fetchLiveQuoteFromYahooV8').mockResolvedValue({
        symbol: 'RELIANCE.NS',
        current_price: 1320.0,
        day_change: 6.6,
        day_change_percent: 0.5,
        is_fallback: false,
        data_tag: 'realtime',
        data_source: 'REALTIME_NSE',
      });

      const liveQuote = await stockScraper.fetchQuoteAndMeta('RELIANCE.NS');
      expect(liveQuote.is_fallback).toBe(false);
      expect(liveQuote.data_tag).toBe('realtime');
      expect(liveQuote.data_source).toBe('REALTIME_NSE');
    });
  });

  describe('AiRecommendationService', () => {
    it('should generate deterministic SEBI-standard insight when Gemini key is not set', async () => {
      delete process.env.GEMINI_API_KEY;

      const input = {
        symbol: 'RELIANCE.NS',
        companyName: 'Reliance Industries Limited',
        quote: {
          current_price: 2985.5,
          delivery_percent: 58.4,
          fifty_two_week: { high: 3200, low: 2200 },
        },
        fundamentals: {
          pe_ratio: 28.4,
          industry_pe: 26.1,
          roce: 14.8,
          roe: 13.9,
          debt_to_equity: 0.42,
          promoter_pledged: 0,
        },
        technicals: {
          rsi_14: 56.4,
          dma_50: 2940,
          dma_200: 2810,
          macd: { signal: 'BULLISH_CROSS' },
        },
        headlines: [{ title: 'Reliance retail expansion drives revenue momentum' }],
        quantResult: {
          verdict: 'STRONG_BUY',
          composite_score: 84,
          confidence_score: 88,
          composite_scores: { fundamental: 34, technical: 34, sentiment: 16 },
          suggested_horizon: 'Long-Term (3-12 months)',
        },
      };

      AiPrediction.create.mockResolvedValue({});
      Stock.findByIdAndUpdate.mockResolvedValue({});

      const output = await aiRecommendation.generateRecommendation(input);

      expect(output.verdict).toBe('STRONG_BUY');
      expect(output.confidence_score).toBe(88);
      expect(output.catalysts.length).toBeGreaterThan(0);
      expect(output.risks.length).toBeGreaterThan(0);
      expect(output.fundamental_summary).toContain('P/E stands at 28.4');
      expect(output.technical_summary).toContain('₹2985.5');
      expect(AiPrediction.create).toHaveBeenCalled();
      expect(Stock.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('StockService', () => {
    it('should filter stocks by verdict and sector', async () => {
      const mockStocks = [
        { symbol: 'RELIANCE.NS', sector: 'Energy & Petrochemicals', latest_ai_verdict: { verdict: 'STRONG_BUY' } },
      ];
      Stock.countDocuments.mockResolvedValue(1000);
      Stock.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockStocks),
      });

      const result = await stockService.getAllStocks({ verdict: 'STRONG_BUY', sector: 'Energy' });

      expect(Stock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'latest_ai_verdict.verdict': 'STRONG_BUY',
          sector: expect.any(RegExp),
        }),
      );
      expect(result.stocks).toEqual(mockStocks);
    });

    it('should return AI verdict from audit log if available', async () => {
      const mockStock = {
        _id: 'TCS.NS',
        company_name: 'Tata Consultancy Services',
        current_price: 4120.0,
      };
      const mockPrediction = {
        toObject: () => ({
          symbol: 'TCS.NS',
          verdict: 'BUY',
          confidence_score: 78,
          catalysts: ['Strong IT margin execution'],
        }),
      };

      Stock.findById.mockResolvedValue(mockStock);
      AiPrediction.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPrediction),
      });

      const verdict = await stockService.getAiVerdict('TCS.NS');

      expect(verdict.verdict).toBe('BUY');
      expect(verdict.symbol).toBe('TCS.NS');
      expect(verdict.company_name).toBe('Tata Consultancy Services');
    });
  });
});

