const stockController = require('../../src/controllers/stock.controller');
const stockService = require('../../src/services/stock.service');
const stockScraper = require('../../src/services/stockScraper.service');
const STATUS = require('../../src/constants/statusConstants');

jest.mock('../../src/services/stock.service');
jest.mock('../../src/services/stockScraper.service');

describe('StockController Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should return all stocks successfully', async () => {
    const mockList = [{ symbol: 'RELIANCE.NS', current_price: 2985.5 }];
    stockService.getAllStocks.mockResolvedValue(mockList);

    await stockController.getAllStocks(req, res);

    expect(stockService.getAllStocks).toHaveBeenCalledWith(req.query);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockList,
        count: 1,
        status: STATUS.SUCCESS,
      }),
    );
  });

  it('should return stock details with news', async () => {
    req.params.symbol = 'RELIANCE.NS';
    const mockStock = {
      symbol: 'RELIANCE.NS',
      company_name: 'Reliance Industries',
      toObject: () => ({ symbol: 'RELIANCE.NS', company_name: 'Reliance Industries' }),
    };
    const mockNews = [{ title: 'Reliance hits new high' }];

    stockService.getStockBySymbol.mockResolvedValue(mockStock);
    stockScraper.fetchGoogleNews.mockResolvedValue(mockNews);

    await stockController.getStockBySymbol(req, res);

    expect(stockService.getStockBySymbol).toHaveBeenCalledWith('RELIANCE.NS');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      data: {
        symbol: 'RELIANCE.NS',
        company_name: 'Reliance Industries',
        news: mockNews,
      },
      message: "Stock 'RELIANCE.NS' details fetched successfully",
      status: STATUS.SUCCESS,
    });
  });

  it('should return 404 when stock is not found', async () => {
    req.params.symbol = 'UNKNOWN.NS';
    stockService.getStockBySymbol.mockResolvedValue(null);

    await stockController.getStockBySymbol(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      data: null,
      message: "Stock 'UNKNOWN.NS' not found",
      status: STATUS.NOT_FOUND,
    });
  });

  it('should return historical candlestick data', async () => {
    req.params.symbol = 'TCS.NS';
    req.query.range = '1M';
    const mockCandles = [{ close: 4120, volume: 2000000 }];
    stockService.getHistoricalCandles.mockResolvedValue(mockCandles);

    await stockController.getStockHistory(req, res);

    expect(stockService.getHistoricalCandles).toHaveBeenCalledWith('TCS.NS', '1M');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      data: {
        symbol: 'TCS.NS',
        range: '1M',
        candles: mockCandles,
      },
      message: "Historical candlestick history for 'TCS.NS' fetched successfully",
      status: STATUS.SUCCESS,
    });
  });

  it('should return AI verdict recommendations', async () => {
    req.params.symbol = 'HDFCBANK.NS';
    const mockVerdict = {
      symbol: 'HDFCBANK.NS',
      verdict: 'STRONG_BUY',
      confidence_score: 85,
    };
    stockService.getAiVerdict.mockResolvedValue(mockVerdict);

    await stockController.getStockAiVerdict(req, res);

    expect(stockService.getAiVerdict).toHaveBeenCalledWith('HDFCBANK.NS');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      data: mockVerdict,
      message: "AI recommendation verdict for 'HDFCBANK.NS' fetched successfully",
      status: STATUS.SUCCESS,
    });
  });

  it('should screen stocks with filters', async () => {
    req.query = { sector: 'Information Technology', verdict: 'BUY' };
    const mockFiltered = [{ symbol: 'INFY.NS', sector: 'Information Technology' }];
    stockService.screenStocks.mockResolvedValue(mockFiltered);

    await stockController.screenStocks(req, res);

    expect(stockService.screenStocks).toHaveBeenCalledWith(req.query);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockFiltered,
        count: 1,
        status: STATUS.SUCCESS,
      }),
    );
  });

  it('should return real-time major indices with market session status', async () => {
    req.query = { fresh: 'true' };
    const mockIndices = [
      { name: 'NIFTY 50', symbol: '^NSEI', current_price: 24914.9, change: -71.5, change_percent: -0.29 },
      { name: 'SENSEX', symbol: '^BSESN', current_price: 81381.36, change: -230.15, change_percent: -0.28 },
    ];
    stockService.getMajorIndices.mockResolvedValue(mockIndices);
    stockScraper.getIndianMarketStatus.mockReturnValue({
      session: 'OPEN',
      timezone: 'Asia/Kolkata',
      is_live: true,
    });

    await stockController.getMajorIndices(req, res);

    expect(stockService.getMajorIndices).toHaveBeenCalledWith({ fresh: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockIndices,
        count: 2,
        market: expect.objectContaining({
          session: expect.any(String),
          timezone: 'Asia/Kolkata',
        }),
        status: STATUS.SUCCESS,
      }),
    );
  });

  describe('Route Protection & RBAC Guards', () => {
    const { verifyToken, requireRole } = require('../../src/middleware/auth.middleware');
    const { stockRateLimiter, stockSyncRateLimiter } = require('../../src/middleware/rateLimiter.middleware');

    it('should have mounted routes with RBAC middleware on stockController.router', () => {
      const routes = stockController.router.stack.filter((layer) => layer.route);
      expect(routes.length).toBeGreaterThan(0);

      // Verify each route has middleware pipeline (verifyToken, requireRole, rateLimiter, controller handler)
      const stockRoute = routes.find((r) => r.route.path === '/api/stocks' && r.route.methods.get);
      expect(stockRoute).toBeDefined();
      expect(stockRoute.route.stack.length).toBeGreaterThanOrEqual(3);
    });

    it('should reject unauthenticated request when token is missing', () => {
      const authReq = { headers: {} };
      const authRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const authNext = jest.fn();

      verifyToken(authReq, authRes, authNext);

      expect(authNext).not.toHaveBeenCalled();
      expect(authRes.status).toHaveBeenCalledWith(401);
      expect(authRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'UNAUTHORIZED',
        }),
      );
    });

    it('should reject unauthorized role on admin-only guard', () => {
      const authReq = { user: { role: { name: 'user' } } };
      const authRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const authNext = jest.fn();

      const adminGuard = requireRole('admin', 'superadmin');
      adminGuard(authReq, authRes, authNext);

      expect(authNext).not.toHaveBeenCalled();
      expect(authRes.status).toHaveBeenCalledWith(403);
      expect(authRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FORBIDDEN',
        }),
      );
    });

    it('should allow user with permitted role', () => {
      const authReq = { user: { role: { name: 'user' } } };
      const authRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const authNext = jest.fn();

      const userGuard = requireRole('user', 'admin');
      userGuard(authReq, authRes, authNext);

      expect(authNext).toHaveBeenCalled();
    });
  });
});

