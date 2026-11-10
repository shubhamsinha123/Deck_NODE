/* eslint-disable */
const Stock = require('../models/Stock');
const AiPrediction = require('../models/AiPrediction');
const stockScraper = require('./stockScraper.service');
const quantEngine = require('./quantEngine.service');
const aiRecommendation = require('./aiRecommendation.service');
const nseDirectory = require('./nseDirectory.service');

const MARQUEE_SYMBOLS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', sector: 'Energy & Power', cap: 'LARGE' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services Limited', sector: 'Information Technology', cap: 'LARGE' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', sector: 'Financial Services', cap: 'LARGE' },
  { symbol: 'INFY.NS', name: 'Infosys Limited', sector: 'Information Technology', cap: 'LARGE' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', sector: 'Financial Services', cap: 'LARGE' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Financial Services', cap: 'LARGE' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', sector: 'Telecommunications & Media', cap: 'LARGE' },
  { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'Fast Moving Consumer Goods', cap: 'LARGE' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro Limited', sector: 'Infrastructure & Real Estate', cap: 'LARGE' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Limited', sector: 'Automobile & Ancillaries', cap: 'LARGE' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries', sector: 'Healthcare & Pharmaceuticals', cap: 'LARGE' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Limited', sector: 'Automobile & Ancillaries', cap: 'LARGE' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Limited', sector: 'Fast Moving Consumer Goods', cap: 'LARGE' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', sector: 'Financial Services', cap: 'LARGE' },
  { symbol: 'TITAN.NS', name: 'Titan Company Limited', sector: 'Fast Moving Consumer Goods', cap: 'LARGE' },
];

class StockService {
  /**
   * Initializes master stock database with ALL 2600+ NSE listed equities
   */
  async seedDefaultStocksIfEmpty() {
    try {
      const count = await Stock.countDocuments();
      if (count < 500) {
        console.log('[StockService] Initializing entire official NSE equity directory (~2600+ stocks)...');
        await nseDirectory.syncAllNseStocksToDatabase();

        // Hydrate key marquee stocks with live price & indicators
        for (const item of MARQUEE_SYMBOLS) {
          try {
            await this.syncStock(item.symbol, item.name, item.sector, item.cap);
          } catch (syncErr) {
            console.warn(`[StockService] Initial sync skipped for ${item.symbol}: ${syncErr.message}`);
          }
        }
        console.log('[StockService] Full NSE directory initialization completed.');
      }
    } catch (e) {
      console.warn(`[StockService] Seeding error: ${e.message}`);
    }
  }

  /**
   * Syncs top marquee stocks with fresh live prices, indicators and AI verdicts
   */
  async syncMarqueeStocks(limit = 15) {
    const targets = MARQUEE_SYMBOLS.slice(0, limit);
    const results = [];

    for (const item of targets) {
      try {
        const synced = await this.syncStock(item.symbol, item.name, item.sector, item.cap);
        if (synced && synced.stock) {
          results.push(synced.stock);
        }
      } catch (err) {
        console.warn(`[StockService] Sync error for ${item.symbol}: ${err.message}`);
      }
    }

    return results;
  }

  /**
   * Syncs a single stock: scrapes quotes, fundamentals, technicals & AI prediction
   */
  async syncStock(symbol, defaultName = '', defaultSector = 'Diversified', defaultCap = 'MID') {
    const sym = symbol.toUpperCase().trim();

    // Look up official name from NSE master list if not provided
    const nseMeta = nseDirectory.findStockBySymbol(sym);
    const resolvedName = (nseMeta && nseMeta.company_name) || defaultName || sym.replace(/\.(NS|BO)$/i, '');
    const resolvedSector = (nseMeta && nseMeta.sector) || defaultSector;
    const resolvedSeries = (nseMeta && nseMeta.series) || 'EQ';
    const resolvedIsin = (nseMeta && nseMeta.isin) || '';

    // 1. Fetch Quote & Meta
    const quote = await stockScraper.fetchQuoteAndMeta(sym);
    const companyName = quote.company_name || resolvedName;

    // 2. Fetch Fundamentals (Screener.in with 15m TTL)
    const fundamentals = await stockScraper.fetchScreenerFundamentals(sym);

    // 3. Fetch News (Google News RSS with 15m TTL)
    const headlines = await stockScraper.fetchGoogleNews(sym, companyName);

    // 4. Fetch Historical OHLCV Candles
    const candles = await stockScraper.fetchHistoricalOHLCV(sym, '1M');

    // 5. Compute Quantitative Indicators
    const technicals = quantEngine.calculateTechnicals(candles, quote.current_price);

    // 6. Compute Multi-Factor Quant Scoring Matrix
    const quantResult = quantEngine.computeMultiFactorScore({
      technicals,
      fundamentals,
      headlines,
      currentPrice: quote.current_price,
    });

    // 7. Generate AI Recommendation (Gemini API or SEBI-standard deterministic synthesis)
    const aiVerdict = await aiRecommendation.generateRecommendation({
      symbol: sym,
      companyName,
      quote,
      fundamentals,
      technicals,
      headlines,
      quantResult,
    });

    // 8. Upsert Master Stock Document
    const stockDoc = {
      _id: sym,
      symbol: sym,
      company_name: companyName,
      exchange: quote.exchange || 'NSE',
      series: resolvedSeries,
      isin: resolvedIsin,
      sector: resolvedSector,
      market_cap_category: defaultCap || quote.market_cap_category || 'MID',
      current_price: quote.current_price,
      day_change: quote.day_change,
      day_change_percent: quote.day_change_percent,
      volume: quote.volume,
      delivery_percent: quote.delivery_percent || 50,
      fifty_two_week: quote.fifty_two_week,
      data_source: quote.data_source || (quote.is_fallback ? 'FALLBACK' : 'REALTIME_NSE'),
      is_fallback: Boolean(quote.is_fallback),
      data_tag: quote.data_tag || (quote.is_fallback ? 'fallback' : 'realtime'),
      fundamentals: {
        pe_ratio: fundamentals.pe_ratio || quote.pe_ratio || 0,
        industry_pe: fundamentals.industry_pe || 25,
        pb_ratio: fundamentals.pb_ratio || quote.pb_ratio || 0,
        roe: fundamentals.roe || 0,
        roce: fundamentals.roce || 0,
        debt_to_equity: fundamentals.debt_to_equity || 0.4,
        promoter_holding: fundamentals.promoter_holding || 50,
        promoter_pledged: fundamentals.promoter_pledged || 0,
        fii_holding: fundamentals.fii_holding || 20,
        dii_holding: fundamentals.dii_holding || 15,
      },
      technicals,
      latest_ai_verdict: {
        verdict: aiVerdict.verdict,
        composite_score: quantResult.composite_score,
        confidence_score: aiVerdict.confidence_score,
        summary: aiVerdict.summary,
        updated_at: new Date(),
      },
      last_updated: new Date(),
    };

    const saved = await Stock.findByIdAndUpdate(sym, stockDoc, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    return { stock: saved, prediction: aiVerdict, headlines };
  }

  /**
   * List all stocks across the entire 2600+ NSE directory with pagination, search, and filters
   */
  async getAllStocks(query = {}) {
    await this.seedDefaultStocksIfEmpty();

    const filter = {};

    // Search by ticker symbol or company name
    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ symbol: regex }, { company_name: regex }];
    }

    // Filter by Series (e.g. EQ for regular equity, or ALL)
    if (query.series && query.series !== 'ALL') {
      filter.series = query.series.toUpperCase();
    }

    if (query.sector && query.sector !== 'ALL') {
      filter.sector = new RegExp(query.sector.trim(), 'i');
    }

    if (query.market_cap && query.market_cap !== 'ALL') {
      filter.market_cap_category = query.market_cap.toUpperCase();
    }

    if (query.verdict && query.verdict !== 'ALL') {
      filter['latest_ai_verdict.verdict'] = query.verdict.toUpperCase();
    }

    if (query.data_tag && query.data_tag !== 'ALL') {
      filter.data_tag = query.data_tag.toLowerCase();
    }

    if (query.hydrated === 'true' || query.realtime_only === 'true') {
      filter.current_price = { $gt: 0, $ne: 1000 };
    }

    if (query.min_price) {
      filter.current_price = { $gte: parseFloat(query.min_price) };
    }

    // Sorting
    let sortOption = { current_price: -1, 'latest_ai_verdict.composite_score': -1 };
    if (query.sort) {
      switch (query.sort) {
        case 'score:desc':
          sortOption = { 'latest_ai_verdict.composite_score': -1, current_price: -1 };
          break;
        case 'score:asc':
          sortOption = { 'latest_ai_verdict.composite_score': 1, current_price: 1 };
          break;
        case 'price:desc':
          sortOption = { current_price: -1 };
          break;
        case 'price:asc':
          sortOption = { current_price: 1 };
          break;
        case 'change:desc':
          sortOption = { day_change_percent: -1 };
          break;
        case 'change:asc':
          sortOption = { day_change_percent: 1 };
          break;
        case 'name:asc':
          sortOption = { company_name: 1 };
          break;
        case 'symbol:asc':
          sortOption = { symbol: 1 };
          break;
        default:
          sortOption = { current_price: -1, 'latest_ai_verdict.composite_score': -1 };
          break;
      }
    }

    // Pagination (defaults to 50 per page for performance across 2600+ stocks)
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const isAll = query.all === 'true' || query.limit === '0' || query.limit === 'all';
    const limit = isAll ? 0 : Math.min(200, Math.max(1, parseInt(query.limit, 10) || 50));
    const skip = limit > 0 ? (page - 1) * limit : 0;

    const total = await Stock.countDocuments(filter);

    let queryBuilder = Stock.find(filter).sort(sortOption);
    if (limit > 0 && typeof queryBuilder.skip === 'function') {
      queryBuilder = queryBuilder.skip(skip).limit(limit);
    }

    const stocks = await queryBuilder;

    // Auto-hydrate quotes on-the-fly for any unhydrated stocks in the returned page
    const unhydrated = stocks.filter((s) => s.current_price === 0 || s.current_price === 1000);
    if (unhydrated.length > 0 && unhydrated.length <= 50) {
      await Promise.allSettled(
        unhydrated.map(async (stk) => {
          try {
            const live = await stockScraper.fetchQuoteAndMeta(stk.symbol);
            if (live && live.current_price > 0 && live.current_price !== 1000) {
              stk.current_price = live.current_price;
              stk.day_change = live.day_change;
              stk.day_change_percent = live.day_change_percent;
              stk.volume = live.volume;
              stk.fifty_two_week = live.fifty_two_week;
              stk.data_source = live.data_source;
              stk.data_tag = live.data_tag;
              stk.is_fallback = live.is_fallback;
              stk.last_updated = new Date();

              await Stock.updateOne(
                { _id: stk._id },
                {
                  $set: {
                    current_price: live.current_price,
                    day_change: live.day_change,
                    day_change_percent: live.day_change_percent,
                    volume: live.volume,
                    fifty_two_week: live.fifty_two_week,
                    data_source: live.data_source,
                    data_tag: live.data_tag,
                    is_fallback: live.is_fallback,
                    last_updated: new Date(),
                  },
                },
              );
            }
          } catch (e) {
            // ignore individual hydration failure
          }
        }),
      );
    }

    return {
      stocks,
      pagination: {
        total,
        page,
        limit: limit > 0 ? limit : total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
      },
    };
  }

  /**
   * Get single stock detail by symbol (auto-hydrates from NSE directory + live sources)
   */
  async getStockBySymbol(symbol) {
    let sym = symbol.toUpperCase().trim();
    if (!sym.endsWith('.NS') && !sym.endsWith('.BO')) {
      sym = `${sym}.NS`;
    }

    let stock = await Stock.findById(sym);

    // If stock doesn't exist or is an unhydrated placeholder, perform live sync
    if (!stock || stock.current_price === 0) {
      const nseMeta = nseDirectory.findStockBySymbol(sym);
      const name = (nseMeta && nseMeta.company_name) || sym.replace(/\.(NS|BO)$/i, '');
      const sector = (nseMeta && nseMeta.sector) || 'Diversified';
      const cap = (nseMeta && nseMeta.market_cap_category) || 'MID';

      const synced = await this.syncStock(sym, name, sector, cap);
      stock = synced.stock;
    }

    return stock;
  }

  /**
   * Get historical candlestick data for charts
   */
  async getHistoricalCandles(symbol, range = '1M') {
    let sym = symbol.toUpperCase().trim();
    if (!sym.endsWith('.NS') && !sym.endsWith('.BO')) {
      sym = `${sym}.NS`;
    }
    return stockScraper.fetchHistoricalOHLCV(sym, range);
  }

  /**
   * Get AI prediction for a stock
   */
  async getAiVerdict(symbol) {
    let sym = symbol.toUpperCase().trim();
    if (!sym.endsWith('.NS') && !sym.endsWith('.BO')) {
      sym = `${sym}.NS`;
    }

    const stock = await this.getStockBySymbol(sym);

    // Look for recent AI prediction in audit collection
    const latestPrediction = await AiPrediction.findOne({ symbol: sym }).sort({ created_at: -1 });

    if (latestPrediction) {
      return {
        symbol: sym,
        company_name: stock.company_name,
        current_price: stock.current_price,
        ...latestPrediction.toObject(),
      };
    }

    // If none exists, run sync
    const synced = await this.syncStock(sym, stock.company_name, stock.sector, stock.market_cap_category);
    return {
      symbol: sym,
      company_name: stock.company_name,
      current_price: stock.current_price,
      ...synced.prediction,
    };
  }

  /**
   * Screener endpoint
   */
  async screenStocks(query = {}) {
    return this.getAllStocks(query);
  }

  /**
   * Refresh entire NSE directory from official exchange portal
   */
  async refreshNseDirectory() {
    await nseDirectory.refreshFromNse();
    return nseDirectory.syncAllNseStocksToDatabase();
  }

  /**
   * Real-time benchmark index quotes (NIFTY 50, SENSEX, BANK NIFTY, INDIA VIX)
   */
  async getMajorIndices(options = {}) {
    return stockScraper.fetchMajorIndices(options);
  }

  /**
   * Comprehensive market status with holiday check & live news channel insights
   */
  async getMarketStatus(options = {}) {
    return stockScraper.getDetailedMarketStatus(options.fresh);
  }

  /**
   * Official NSE trading holiday calendar for a year
   */
  getNseHolidays(year) {
    return stockScraper.getNseHolidayCalendar(year);
  }
}

module.exports = new StockService();
