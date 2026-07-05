const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/environment');
const AppError = require('../exceptions/AppError');

const authenticateJWT = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new AppError('Token not provided', 401);

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Unauthorized', 401));
  }
};

module.exports = { authenticateJWT };
