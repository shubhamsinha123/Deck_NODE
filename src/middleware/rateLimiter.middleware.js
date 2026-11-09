const STATUS = require('../constants/statusConstants');

/**
 * Creates an in-memory sliding-window rate limiter middleware
 * @param {Object} options
 * @param {number} [options.windowMs=60000] - Time window in milliseconds
 * @param {number|Function} [options.max=100] - Max requests permitted in window. Can be a function: (req) => number
 * @param {string} [options.message='Too many requests, please try again later.'] - Message returned on 429
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const message = options.message || 'Too many requests, please try again later.';
  const hits = new Map();

  // Periodic cleanup of expired client records every 60s (unref to avoid hanging node processes/tests)
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 60000);
  if (timer.unref) {
    timer.unref();
  }

  const middleware = (req, res, next) => {
    // Key by authenticated user identifier (sub, id, MID), or fallback to client IP
    const clientId =
      req.user?.sub ||
      req.user?.id ||
      req.user?.MID ||
      req.ip ||
      req.headers['x-forwarded-for'] ||
      'anonymous';

    const now = Date.now();
    const maxLimit = typeof options.max === 'function' ? options.max(req) : (options.max || 100);

    let record = hits.get(clientId);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      hits.set(clientId, record);
    }

    record.count += 1;

    const remaining = Math.max(0, maxLimit - record.count);
    const resetSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

    // Standard RFC rate limiting headers
    if (res.setHeader) {
      res.setHeader('X-RateLimit-Limit', maxLimit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    }

    if (record.count > maxLimit) {
      if (res.setHeader) {
        res.setHeader('Retry-After', resetSeconds);
      }
      return res.status(429).json({
        data: null,
        message: `${message} Please retry after ${resetSeconds} seconds.`,
        status: STATUS.TOO_MANY_REQUESTS,
        retry_after: resetSeconds,
      });
    }

    return next();
  };

  middleware.reset = () => {
    hits.clear();
  };

  middleware._hits = hits;
  return middleware;
}

// Tier 1: General Stock Queries (Read analytics) - 120 req/min for User, 300 req/min for Admin
const stockRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: (req) => {
    const role = req.user?.role?.name ?? req.user?.role;
    return (role === 'admin' || role === 'superadmin') ? 300 : 120;
  },
  message: 'Stock API rate limit exceeded.',
});

// Tier 2: Heavy Mutation & Live Sync (Scraper Protection) - 6 syncs/min for User, 30 syncs/min for Admin
const stockSyncRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: (req) => {
    const role = req.user?.role?.name ?? req.user?.role;
    return (role === 'admin' || role === 'superadmin') ? 30 : 6;
  },
  message: 'Stock sync rate limit exceeded.',
});

module.exports = {
  createRateLimiter,
  stockRateLimiter,
  stockSyncRateLimiter,
};

