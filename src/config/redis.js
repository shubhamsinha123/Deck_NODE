/* eslint-disable no-console */
const { createClient } = require('redis');
const { REDIS_ENV_URL } = require('./environment');

function sanitizeRedisUrl(rawUrl) {
  if (!rawUrl) return null;
  let url = rawUrl.trim();
  // Remove 'redis-cli -u' or similar prefixes if present
  if (url.startsWith('redis-cli -u')) {
    url = url.replace(/^redis-cli\s+-u\s*/, '').trim();
  }
  // Remove wrapping quotes if present
  url = url.replace(/^['"]|['"]$/g, '');
  return url;
}

const sanitizedUrl = sanitizeRedisUrl(REDIS_ENV_URL);

const redisClient = createClient({
  url: sanitizedUrl || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 200, 3000),
  },
});

redisClient.on('error', (err) => {
  console.error('[Redis Cloud Error]', err.message);
});

redisClient.on('connect', () => {
  console.log('[Redis Cloud] Successfully connected to Redis Cloud');
});

let connectPromise = null;

async function getRedisClient() {
  if (redisClient.isOpen) {
    return redisClient;
  }
  if (!connectPromise) {
    connectPromise = redisClient.connect().catch((err) => {
      connectPromise = null;
      console.error('[Redis Cloud Connection Error]', err.message);
      throw err;
    });
  }
  await connectPromise;
  return redisClient;
}

module.exports = {
  redisClient,
  getRedisClient,
  sanitizeRedisUrl,
};
