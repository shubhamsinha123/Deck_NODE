/* eslint-disable */
const express = require('express');
const stockService = require('../services/stock.service');
const stockScraper = require('../services/stockScraper.service');
const STATUS = require('../constants/statusConstants');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { stockRateLimiter, stockSyncRateLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

class StockController {
  /**
   * GET /api/stocks or /api/v1/stocks
   * List all tracked Indian stocks with current price, day change, sector, and AI badge
   */
  async getAllStocks(req, res) {
    try {
      const result = await stockService.getAllStocks(req.query);
      const isPaginated = result && result.stocks && result.pagination;
      const data = isPaginated ? result.stocks : result;
      const total = isPaginated ? result.pagination.total : (Array.isArray(data) ? data.length : 0);
      const pagination = isPaginated ? result.pagination : undefined;

      return res.status(200).send({
        data,
        count: Array.isArray(data) ? data.length : 0,
        total,
        pagination,
        message: 'All NSE listed Indian stocks fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).send({
        data: null,
        message: error.message || 'Error fetching stocks',
        status: STATUS.ERROR,
      });
    }
  }

  /**
   * GET /api/screen or /api/stocks/screen
   * Screen stocks by verdict, sector, market cap, and sorting
   */
  async screenStocks(req, res) {
    try {
      const result = await stockService.screenStocks(req.query);
      const isPaginated = result && result.stocks && result.pagination;
      const data = isPaginated ? result.stocks : result;
      const total = isPaginated ? result.pagination.total : (Array.isArray(data) ? data.length : 0);
      const pagination = isPaginated ? result.pagination : undefined;

      return res.status(200).send({
        data,
        count: Array.isArray(data) ? data.length : 0,
        total,
        pagination,
        message: 'Stock screener results retrieved',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).send({
        data: null,
        message: error.message || 'Error screening stocks',
        status: STATUS.ERROR,
      });
    }
  }

  /**
   * GET /api/stocks/indices or /api/indices or /api/v1/indices
   * Real-time benchmark market indices (NIFTY 50, SENSEX, BANK NIFTY, INDIA VIX)
   * Supports ?fresh=true to bypass short 10s live buffer
   */
  async getMajorIndices(req, res) {
    try {
      const fresh = req.query.fresh === 'true' || req.query.fresh === '1';
      const indices = await stockService.getMajorIndices({ fresh });
      const market = stockScraper.getIndianMarketStatus();

      return res.status(200).send({
        data: indices,
        count: indices.length,
        market,
        last_updated: new Date().toISOString(),
        message: 'Real-time Indian market indices fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).send({
        data: [],
        message: error.message || 'Error fetching market indices',
        status: STATUS.ERROR,
      });
    }
  }

  /**
   * POST /api/stocks/refresh-nse-directory
   * Pull fresh official CSV from NSE portal and sync all stocks to MongoDB
   */
  async refreshNseDirectory(req, res) {
    try {
      const syncResult = await stockService.refreshNseDirectory();
      return res.status(200).send({
        data: syncResult,
        message: `NSE official directory refreshed (${syncResult.count} stocks synced)`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).send({
        data: null,
        message: error.message || 'Error refreshing NSE directory',
        status: STATUS.ERROR,
      });
    }
  }

  /**
   * GET /api/stocks/:symbol
   * Complete stock details (Fundamentals, Technicals, News)
   */
  async getStockBySymbol(req, res) {
    try {
      const { symbol } = req.params;
      const stock = await stockService.getStockBySymbol(symbol);
      if (!stock) {
        return res.status(404).send({
          data: null,
          message: `Stock '${symbol}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }

      // Fetch recent news as part of the complete stock view
      const news = await stockScraper.fetchGoogleNews(stock.symbol, stock.company_name);

      return res.status(200).send({
        data: {
          ...stock.toObject(),
          news,
        },
        message: `Stock '${symbol}' details fetched successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).send({
        data: null,
        message: error.message || 'Error fetching stock details',
        status: STATUS.ERROR,
      });
    }
  }

  /**
   * GET /api/stocks/:symbol/history?range=1M|6M|1Y
   * Candlestick data for charts
   */
  async getStockHistory(req, res) {
    try {
      const { symbol } = req.params;
      const range = req.query.range || '1M';
      const candles = await stockService.getHistoricalCandles(symbol, range);
      return res.status(200).send({
        data: {
          symbol,
          range,
          candles,
        },
        message: `Historical candlestick history for '${symbol}' fetched successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).send({
        data: null,
        message: error.message || 'Error fetching stock history',
        status: STATUS.ERROR,
      });
    }
  }

  /**
   * GET /api/stocks/:symbol/ai-verdict
   * AI recommendation with explanation (catalysts, risks, scores)
   */
  async getStockAiVerdict(req, res) {
    try {
      const { symbol } = req.params;
      const verdict = await stockService.getAiVerdict(symbol);
      return res.status(200).send({
        data: verdict,
        message: `AI recommendation verdict for '${symbol}' fetched successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).send({
        data: null,
        message: error.message || 'Error generating AI verdict',
        status: STATUS.ERROR,
      });
    }
  }

  /**
   * POST /api/stocks/sync or GET /api/stocks/sync or /api/stocks/:symbol/sync
   * Trigger immediate refresh/scrape for a stock or top marquee stocks
   */
  async syncStock(req, res) {
    try {
      const rawSymbol =
        req.params.symbol || (req.body && (req.body.symbol || req.body.symbols)) || req.query.symbol || req.query.symbols;

      if (rawSymbol) {
        const symbolsList = Array.isArray(rawSymbol)
          ? rawSymbol
          : typeof rawSymbol === 'string' && rawSymbol.includes(',')
            ? rawSymbol.split(',').map((s) => s.trim()).filter(Boolean)
            : null;

        if (symbolsList && symbolsList.length > 1) {
          const syncedList = [];
          for (const s of symbolsList) {
            try {
              const item = await stockService.syncStock(s);
              if (item && item.stock) syncedList.push(item.stock);
            } catch (e) {
              // ignore individual failure in batch
            }
          }
          return res.status(200).send({
            data: {
              count: syncedList.length,
              stocks: syncedList,
            },
            message: `${syncedList.length} stocks synced successfully`,
            status: STATUS.SUCCESS,
          });
        }

        const singleSymbol = symbolsList ? symbolsList[0] : rawSymbol;
        const synced = await stockService.syncStock(singleSymbol);
        return res.status(200).send({
          data: synced,
          message: `Stock '${singleSymbol}' synced successfully`,
          status: STATUS.SUCCESS,
        });
      }

      // If no symbol specified, sync top marquee NSE equities with fresh live quotes
      const marqueeSynced = await stockService.syncMarqueeStocks(15);
      return res.status(200).send({
        data: {
          synced_count: marqueeSynced.length,
          stocks: marqueeSynced,
        },
        message: `Synced ${marqueeSynced.length} top marquee NSE equities with live market quotes`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(500).send({
        data: null,
        message: error.message || 'Error syncing stock data',
        status: STATUS.ERROR,
      });
    }
  }
}

const stockController = new StockController();

// Reusable RBAC & 429 Rate Limiting Middleware Pipelines
const allowUserAndAdmin = [verifyToken, requireRole('user', 'superuser', 'admin', 'superadmin'), stockRateLimiter];
const allowUserAndAdminSync = [verifyToken, requireRole('user', 'superuser', 'admin', 'superadmin'), stockSyncRateLimiter];
const allowAdminOnly = [verifyToken, requireRole('admin', 'superadmin'), stockSyncRateLimiter];

// Mount Routes (supporting both /api/stocks and /api/v1/stocks, GET and POST for sync)
router.get('/api/stocks', ...allowUserAndAdmin, stockController.getAllStocks.bind(stockController));
router.get('/api/v1/stocks', ...allowUserAndAdmin, stockController.getAllStocks.bind(stockController));

router.get('/api/screen', ...allowUserAndAdmin, stockController.screenStocks.bind(stockController));
router.get('/api/stocks/screen', ...allowUserAndAdmin, stockController.screenStocks.bind(stockController));
router.get('/api/v1/stocks/screen', ...allowUserAndAdmin, stockController.screenStocks.bind(stockController));

router.post('/api/stocks/sync', ...allowUserAndAdminSync, stockController.syncStock.bind(stockController));
router.get('/api/stocks/sync', ...allowUserAndAdminSync, stockController.syncStock.bind(stockController));
router.post('/api/v1/stocks/sync', ...allowUserAndAdminSync, stockController.syncStock.bind(stockController));
router.get('/api/v1/stocks/sync', ...allowUserAndAdminSync, stockController.syncStock.bind(stockController));

router.post('/api/stocks/:symbol/sync', ...allowUserAndAdminSync, stockController.syncStock.bind(stockController));
router.get('/api/stocks/:symbol/sync', ...allowUserAndAdminSync, stockController.syncStock.bind(stockController));
router.post('/api/v1/stocks/:symbol/sync', ...allowUserAndAdminSync, stockController.syncStock.bind(stockController));
router.get('/api/v1/stocks/:symbol/sync', ...allowUserAndAdminSync, stockController.syncStock.bind(stockController));

router.post('/api/stocks/refresh-nse-directory', ...allowAdminOnly, stockController.refreshNseDirectory.bind(stockController));
router.get('/api/stocks/refresh-nse-directory', ...allowAdminOnly, stockController.refreshNseDirectory.bind(stockController));

router.get('/api/stocks/indices', ...allowUserAndAdmin, stockController.getMajorIndices.bind(stockController));
router.get('/api/indices', ...allowUserAndAdmin, stockController.getMajorIndices.bind(stockController));
router.get('/api/v1/indices', ...allowUserAndAdmin, stockController.getMajorIndices.bind(stockController));

router.get('/api/stocks/:symbol', ...allowUserAndAdmin, stockController.getStockBySymbol.bind(stockController));
router.get('/api/v1/stocks/:symbol', ...allowUserAndAdmin, stockController.getStockBySymbol.bind(stockController));

router.get('/api/stocks/:symbol/history', ...allowUserAndAdmin, stockController.getStockHistory.bind(stockController));
router.get('/api/v1/stocks/:symbol/history', ...allowUserAndAdmin, stockController.getStockHistory.bind(stockController));

router.get('/api/stocks/:symbol/ai-verdict', ...allowUserAndAdmin, stockController.getStockAiVerdict.bind(stockController));
router.get('/api/v1/stocks/:symbol/ai-verdict', ...allowUserAndAdmin, stockController.getStockAiVerdict.bind(stockController));

stockController.router = router;

module.exports = stockController;
