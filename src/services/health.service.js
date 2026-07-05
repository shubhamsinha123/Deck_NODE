/* eslint-disable class-methods-use-this */
const mongoose = require('mongoose');

class HealthService {
  getDatabaseState() {
    return mongoose.connection.readyState;
  }

  getDatabaseInfo() {
    const dbStatus = this.getDatabaseState();
    const dbStatusMap = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
    };

    return {
      status: dbStatusMap[dbStatus] || 'Unknown',
      readyState: dbStatus,
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A',
    };
  }

  getMemoryInfo() {
    return {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
    };
  }

  getProcessInfo() {
    return {
      pid: process.pid,
      nodeVersion: process.version,
    };
  }
}

module.exports = new HealthService();
