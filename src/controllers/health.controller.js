/* eslint-disable class-methods-use-this */
const express = require('express');
const healthService = require('../services/health.service');

const router = express.Router();

class HealthController {
  async getHealth(req, res) {
    const dbState = healthService.getDatabaseState();
    const healthCheck = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'api_connect',
      environment: process.env.NODE_ENV || 'development',
      database: dbState === 1 ? 'Connected' : 'Disconnected',
    };

    const statusCode = dbState === 1 ? 200 : 503;
    return res.status(statusCode).json(healthCheck);
  }

  async getDetailedHealth(req, res) {
    try {
      const dbState = healthService.getDatabaseState();
      const healthCheck = {
        status: dbState === 1 ? 'UP' : 'DOWN',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'api_connect',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        checks: {
          database: healthService.getDatabaseInfo(),
          memory: healthService.getMemoryInfo(),
          process: healthService.getProcessInfo(),
        },
      };

      const statusCode = dbState === 1 ? 200 : 503;
      return res.status(statusCode).json(healthCheck);
    } catch (error) {
      return res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }
}

const healthController = new HealthController();

// Map legacy routes (exactly as in healthAPI.js)
router.get('/api/health', healthController.getHealth.bind(healthController));
router.get(
  '/api/health/detailed',
  healthController.getDetailedHealth.bind(healthController),
);

healthController.router = router;

module.exports = healthController;
