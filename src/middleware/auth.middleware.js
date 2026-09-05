const jwt = require('jsonwebtoken');
const { JWT_ACCESS_SECRET } = require('../config/environment');
const AppError = require('../exceptions/AppError');

/**
 * OAuth 2.0 Bearer token middleware.
 * Verifies the access_token from Authorization: Bearer <token>
 * Attaches decoded payload as req.user = { sub, MID, role }
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authorization header missing or malformed', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    const status = error instanceof AppError ? error.statusCode : 401;
    return res.status(status).json({
      message: error.message || 'Token is invalid or expired',
      status: 'UNAUTHORIZED',
    });
  }
};

/**
 * Role-based guard middleware factory.
 * Usage: requireRole('superadmin') or requireRole('admin', 'superadmin')
 * Works with the enriched role object: { name, permissions, level }
 */
const requireRole = (...roles) => (req, res, next) => {
  // Support both plain string role (legacy) and role object (new)
  const userRole = req.user?.role?.name ?? req.user?.role ?? null;

  if (!req.user || !roles.includes(userRole)) {
    return res.status(403).json({
      message: `Access denied. Required role: ${roles.join(' or ')}`,
      status: 'FORBIDDEN',
    });
  }
  return next();
};

// Keep legacy export for other controllers that import authenticateJWT

const authenticateJWT = verifyToken;

module.exports = { verifyToken, authenticateJWT, requireRole };
