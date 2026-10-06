const rateLimit = require('express-rate-limit');
const STATUS = require('../constants/statusConstants');

/**
 * Default response handler when rate limit is reached
 */
const defaultRateLimitHandler = (message) => (req, res /* , next, options */) => {
  res.status(429).json({
    data: null,
    message: message || 'Too many requests from this IP, please try again later.',
    status: STATUS.TOO_MANY_REQUESTS,
  });
};

/**
 * Creates a configurable rate limiter middleware
 * @param {Object} options Configuration options
 * @param {number} options.windowMs Time window in milliseconds (default: 15 mins)
 * @param {number} options.max Max requests per windowMs (default: 100)
 * @param {string} options.message Custom error message
 * @param {boolean} options.skipInTest Whether to bypass limiting in test environments (default: true)
 */
const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests from this IP, please try again later.',
  skipInTest = true,
} = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Return standard RateLimit headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
    legacyHeaders: false, // Disable X-RateLimit-* headers
    skip: () => skipInTest && process.env.NODE_ENV === 'test',
    handler: defaultRateLimitHandler(message),
  });

/**
 * Global application-level rate limiter
 * Protects against overall brute-force / DDoS requests
 * Default: 100 requests per 15 minutes
 */
const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests to the server, please try again after 15 minutes.',
});

/**
 * GET / Read operations rate limiter
 * Specifically protects the Database from being flooded with repeated read queries
 * Default: 60 requests per 1 minute
 */
const getApiLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: 'Too many read requests. Please slow down to prevent database overload.',
});

/**
 * Sensitive endpoints rate limiter (e.g. Auth, Login, OTP)
 * Default: 10 requests per 15 minutes
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again after 15 minutes.',
});

module.exports = {
  createRateLimiter,
  globalLimiter,
  getApiLimiter,
  authLimiter,
};
