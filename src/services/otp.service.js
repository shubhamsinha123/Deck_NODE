/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');
const User = require('../models/User');
const userService = require('./user.service');
const AppError = require('../exceptions/AppError');

class OtpService {
  /**
   * Clean and normalize mobile number
   */
  sanitizeMobileNumber(mobileNumber) {
    if (!mobileNumber || typeof mobileNumber !== 'string') {
      throw new AppError('Mobile number is required and must be a string', 400);
    }
    // Strip spaces, dashes, parentheses
    const cleaned = mobileNumber.replace(/[\s()-]/g, '').trim();
    if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
      throw new AppError('Invalid mobile number format. Must be between 10 to 15 digits', 400);
    }
    return cleaned;
  }

  /**
   * Generate 6-digit random OTP and store in Redis Cloud
   * TTL: 5 minutes (300s), Cooldown: 60s
   */
  async sendOtp(rawMobileNumber) {
    const mobileNumber = this.sanitizeMobileNumber(rawMobileNumber);
    const client = await getRedisClient();

    const cooldownKey = `otp_cooldown:${mobileNumber}`;
    const otpKey = `otp:${mobileNumber}`;

    // Check rate limit / cooldown
    const isCoolingDown = await client.get(cooldownKey);
    if (isCoolingDown) {
      const ttl = await client.ttl(cooldownKey);
      throw new AppError(`Please wait ${ttl > 0 ? ttl : 60} seconds before requesting a new OTP`, 429);
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store in Redis Cloud
    // EX: 300 seconds (5 minutes)
    await client.set(otpKey, otp, { EX: 300 });

    // Set resend cooldown in Redis Cloud: 60 seconds
    await client.set(cooldownKey, '1', { EX: 60 });

    console.log(`[OTP Service] Generated OTP ${otp} for mobile ${mobileNumber}`);

    return {
      mobileNumber,
      message: 'OTP sent successfully',
      otp, // Included for development/testing API response
      expiresInSeconds: 300,
    };
  }

  /**
   * Verify OTP against Redis Cloud
   */
  async verifyOtp(rawMobileNumber, otp) {
    if (!otp) {
      throw new AppError('OTP is required', 400);
    }

    const mobileNumber = this.sanitizeMobileNumber(rawMobileNumber);
    const client = await getRedisClient();
    const otpKey = `otp:${mobileNumber}`;

    const storedOtp = await client.get(otpKey);

    if (!storedOtp) {
      throw new AppError('OTP has expired or was not requested. Please request a new OTP', 400);
    }

    if (storedOtp !== otp.toString().trim()) {
      throw new AppError('Invalid OTP. Please check and try again', 400);
    }

    // Delete OTP key after successful verification to prevent reuse
    await client.del(otpKey);

    return {
      mobileNumber,
      verified: true,
      message: 'OTP verified successfully',
    };
  }

  /**
   * Verify OTP and complete user registration / login
   */
  async signupOrLoginWithMobile({
    mobileNumber,
    otp,
    name,
    country,
    location,
    role,
  }) {
    // First verify OTP
    await this.verifyOtp(mobileNumber, otp);

    const cleanedMobile = this.sanitizeMobileNumber(mobileNumber);

    // Check if user already exists by mobileNumber or id

    let user = await User.findOne({
      $or: [{ mobileNumber: cleanedMobile }, { id: cleanedMobile }],
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Sanitize ID for model validation requirement (alphanumeric + safe chars)
      const safeId = cleanedMobile.replace(/[^a-zA-Z0-9]/g, '');

      user = await User.create({
        id: safeId || `user_${Date.now()}`,
        mobileNumber: cleanedMobile,
        name: name || `User_${cleanedMobile.slice(-4)}`,
        country: country || 'India',
        location: location || 'Default Location',
        role: role === 'admin' ? 'admin' : 'user',
        hasPassword: false,
      });
    }

    // Issue JWT Token Pair via userService
    const tokens = await userService._issueTokenPair(user);

    const userDetail = user.toObject();
    delete userDetail.password;

    return {
      message: isNewUser ? 'User registered and authenticated successfully' : 'User authenticated successfully',
      isNewUser,
      user: userDetail,
      ...tokens,
    };
  }
}

module.exports = new OtpService();
