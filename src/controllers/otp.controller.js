/* eslint-disable class-methods-use-this */
const express = require('express');
const otpService = require('../services/otp.service');
const { getRedisClient } = require('../config/redis');
const STATUS = require('../constants/statusConstants');

const router = express.Router();

class OtpController {
  /**
   * GET /api/v1/auth/otp/health
   * Check connection status to Redis Cloud
   */
  async checkRedisHealth(req, res) {
    try {
      const client = await getRedisClient();
      const pingResult = await client.ping();
      return res.status(200).json({
        status: STATUS.SUCCESS,
        message: 'Redis Cloud is connected and responsive',
        ping: pingResult,
      });
    } catch (error) {
      return res.status(500).json({
        status: STATUS.FAILURE,
        message: `Redis Cloud connection issue: ${error.message}`,
      });
    }
  }

  /**
   * POST /api/v1/auth/otp/send
   * Body: { mobileNumber }
   */
  async sendOtp(req, res) {
    try {
      const { mobileNumber } = req.body;
      if (!mobileNumber) {
        return res.status(400).json({
          data: null,
          message: 'mobileNumber is required',
          status: STATUS.FAILURE,
        });
      }
      const result = await otpService.sendOtp(mobileNumber);
      return res.status(200).json({
        data: result,
        message: 'OTP generated and stored in Redis Cloud successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      const statusCode = error.statusCode || 400;
      return res.status(statusCode).json({
        data: null,
        message: error.message || 'Failed to send OTP',
        status: STATUS.FAILURE,
      });
    }
  }

  /**
   * POST /api/v1/auth/otp/verify
   * Body: { mobileNumber, otp }
   */
  async verifyOtp(req, res) {
    try {
      const { mobileNumber, otp } = req.body;
      if (!mobileNumber || !otp) {
        return res.status(400).json({
          data: null,
          message: 'mobileNumber and otp are required',
          status: STATUS.FAILURE,
        });
      }
      const result = await otpService.verifyOtp(mobileNumber, otp);
      return res.status(200).json({
        data: result,
        message: 'OTP verified successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      const statusCode = error.statusCode || 400;
      return res.status(statusCode).json({
        data: null,
        message: error.message || 'OTP verification failed',
        status: STATUS.FAILURE,
      });
    }
  }

  /**
   * POST /api/v1/auth/otp/signup
   * Body: { mobileNumber, otp, name, country, location, role }
   */
  async signupWithOtp(req, res) {
    try {
      const {
        mobileNumber,
        otp,
        name,
        country,
        location,
        role,
      } = req.body;

      if (!mobileNumber || !otp) {
        return res.status(400).json({
          data: null,
          message: 'mobileNumber and otp are required',
          status: STATUS.FAILURE,
        });
      }
      const result = await otpService.signupOrLoginWithMobile({
        mobileNumber,
        otp,
        name,
        country,
        location,
        role,
      });
      return res.status(200).json({
        data: result,
        message: result.message,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      const statusCode = error.statusCode || 400;
      return res.status(statusCode).json({
        data: null,
        message: error.message || 'Signup failed',
        status: STATUS.FAILURE,
      });
    }
  }
}

const otpController = new OtpController();

// Define routes
router.get('/api/v1/auth/otp/health', otpController.checkRedisHealth.bind(otpController));
router.post('/api/v1/auth/otp/send', otpController.sendOtp.bind(otpController));
router.post('/api/v1/auth/otp/verify', otpController.verifyOtp.bind(otpController));
router.post('/api/v1/auth/otp/signup', otpController.signupWithOtp.bind(otpController));

otpController.router = router;

module.exports = otpController;
