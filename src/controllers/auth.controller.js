/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
const express = require('express');
const authService = require('../services/auth.service');

const router = express.Router();

function verifyToken(req, res, next) {
  const bearerTokenHeader = req.headers.authorization;

  if (typeof bearerTokenHeader !== 'undefined') {
    const bearer = bearerTokenHeader.split(' ');
    const token = bearer[1];
    req.token = token;
    next();
  } else {
    res.send({
      result: 'Token is Invalid/Not Defined',
    });
  }
}

class AuthController {
  async getInfo(req, res) {
    return res.json({
      message: 'Hello from local',
    });
  }

  async login(req, res) {
    try {
      const { id, password } = req.body;
      const result = await authService.login(id, password);
      if (!result) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      return res.json(result);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async verifyProfile(req, res) {
    try {
      const authData = authService.verifyToken(req.token);
      authData.expiresIn = authService.formatExpiryToIST(authData.exp);
      return res.json({
        message: 'Tokken verified',
        authData,
      });
    } catch (err) {
      return res.send({
        message: 'Token Expired! Please Regenerate and apply again, Thanks.',
      });
    }
  }
}

const authController = new AuthController();

// Map legacy routes
router.get('/infoJwt', authController.getInfo.bind(authController));
router.post('/jwtLogin', authController.login.bind(authController));
router.post(
  '/profileJwt',
  verifyToken,
  authController.verifyProfile.bind(authController),
);

authController.router = router;
authController.verifyTokenMiddleware = verifyToken; // export if needed

module.exports = authController;
