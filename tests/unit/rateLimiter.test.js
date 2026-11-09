const {
  createRateLimiter,
  stockRateLimiter,
  stockSyncRateLimiter,
} = require('../../src/middleware/rateLimiter.middleware');
const STATUS = require('../../src/constants/statusConstants');

describe('Rate Limiter Middleware Unit Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: { sub: 'user_123', role: { name: 'user' } },
      ip: '127.0.0.1',
      headers: {},
    };
    res = {
      headers: {},
      setHeader: jest.fn((key, value) => {
        res.headers[key] = value;
      }),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    stockRateLimiter.reset();
    stockSyncRateLimiter.reset();
  });

  it('should allow requests within the limit and set rate limit headers', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });

    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 2);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 1);

    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 0);
  });

  it('should block requests with HTTP 429 when rate limit is exceeded', () => {
    const limiter = createRateLimiter({
      windowMs: 5000,
      max: 2,
      message: 'Testing rate limit',
    });

    limiter(req, res, next);
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);

    // 3rd request exceeds limit of 2
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(2); // not called again
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: null,
        status: STATUS.TOO_MANY_REQUESTS,
        retry_after: expect.any(Number),
      }),
    );
  });

  it('should give higher limits to admin compared to standard user in stockRateLimiter', () => {
    const userReq = { user: { sub: 'u1', role: { name: 'user' } } };
    const adminReq = { user: { sub: 'a1', role: { name: 'admin' } } };

    stockRateLimiter(userReq, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 120);

    stockRateLimiter(adminReq, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 300);
  });

  it('should enforce sync limits correctly (6 for user, 30 for admin)', () => {
    const userReq = { user: { sub: 'u2', role: { name: 'user' } } };
    const adminReq = { user: { sub: 'a2', role: { name: 'admin' } } };

    stockSyncRateLimiter(userReq, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 6);

    stockSyncRateLimiter(adminReq, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 30);
  });

  it('should reset bucket after window expires', () => {
    jest.useFakeTimers();
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });

    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Immediate second call blocked
    limiter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);

    // Fast-forward past windowMs (1001ms)
    jest.advanceTimersByTime(1001);

    // Call after expiry should now be allowed
    const nextAfter = jest.fn();
    limiter(req, res, nextAfter);
    expect(nextAfter).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});

