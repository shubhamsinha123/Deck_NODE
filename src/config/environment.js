module.exports = {
  PORT: process.env.PORT || 5000,
  ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  PATH_URI: process.env.PATH_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'default_jwt_access_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret',
  JWT_ACCESS_EXPIRES_IN: parseInt(process.env.JWT_ACCESS_EXPIRES_IN, 10) || 900,
  JWT_REFRESH_EXPIRES_IN: parseInt(process.env.JWT_REFRESH_EXPIRES_IN, 10) || 604800,
  REDIS_ENV_URL: process.env.REDIS_ENV_URL || process.env.REDIS_URL,
};
