const express = require('express');
const request = require('supertest');
const { createRateLimiter } = require('../../src/middleware/rateLimiter.middleware');
const STATUS = require('../../src/constants/statusConstants');

describe('Rate Limiter Middleware', () => {
  it('should allow requests under the maximum limit', async () => {
    const app = express();
    const testLimiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 5,
      skipInTest: false,
    });

    app.get('/test-limit', testLimiter, (req, res) => {
      res.status(200).json({ status: STATUS.SUCCESS, message: 'OK' });
    });

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).get('/test-limit');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(STATUS.SUCCESS);
      expect(res.headers['ratelimit-limit']).toBe('5');
    }
  });

  it('should block requests exceeding the maximum limit with 429', async () => {
    const app = express();
    const customMessage = 'Rate limit exceeded for test endpoint';
    const testLimiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 2,
      message: customMessage,
      skipInTest: false,
    });

    app.get('/test-exceeded', testLimiter, (req, res) => {
      res.status(200).json({ status: STATUS.SUCCESS, message: 'OK' });
    });

    // Request 1: OK
    const res1 = await request(app).get('/test-exceeded');
    expect(res1.status).toBe(200);

    // Request 2: OK
    const res2 = await request(app).get('/test-exceeded');
    expect(res2.status).toBe(200);

    // Request 3: Blocked (429)
    const res3 = await request(app).get('/test-exceeded');
    expect(res3.status).toBe(429);
    expect(res3.body).toEqual({
      data: null,
      message: customMessage,
      status: STATUS.TOO_MANY_REQUESTS,
    });
    expect(res3.headers['retry-after']).toBeDefined();
  });

  it('should skip rate limiting when skipInTest is true in test environment', async () => {
    const app = express();
    const testLimiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 1,
      skipInTest: true,
    });

    app.get('/test-skip', testLimiter, (req, res) => {
      res.status(200).json({ status: STATUS.SUCCESS });
    });

    // Both requests should pass because process.env.NODE_ENV is test
    const res1 = await request(app).get('/test-skip');
    expect(res1.status).toBe(200);

    const res2 = await request(app).get('/test-skip');
    expect(res2.status).toBe(200);
  });
});
