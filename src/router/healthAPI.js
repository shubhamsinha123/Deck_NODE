/* eslint-disable linebreak-style */
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Health check endpoint
router.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'api_connect',
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
  };

  const statusCode = mongoose.connection.readyState === 1 ? 200 : 503;

  res.status(statusCode).json(healthCheck);
});

// Detailed health check endpoint
router.get('/api/health/detailed', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStatusMap = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
    };

    const healthCheck = {
      status: dbStatus === 1 ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'api_connect',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: dbStatusMap[dbStatus] || 'Unknown',
          readyState: dbStatus,
          host: mongoose.connection.host || 'N/A',
          name: mongoose.connection.name || 'N/A',
        },
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        },
        process: {
          pid: process.pid,
          nodeVersion: process.version,
        },
      },
    };

    const statusCode = dbStatus === 1 ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

module.exports = router;
