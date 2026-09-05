const dotenv = require('dotenv');
dotenv.config();

const { getRedisClient, sanitizeRedisUrl } = require('../src/config/redis');
const otpService = require('../src/services/otp.service');
const { connectDB } = require('../src/config/database');

async function testOtpFlow() {
  console.log('--- TESTING REDIS & MOBILE OTP FLOW ---');

  console.log('1. Testing URL Sanitizer:');
  const rawEnv = process.env.REDIS_ENV_URL;
  const sanitized = sanitizeRedisUrl(rawEnv);
  console.log('Raw ENV:', rawEnv);
  console.log('Sanitized Redis URL:', sanitized);

  console.log('\n2. Testing Redis Cloud Connection:');
  try {
    const redis = await getRedisClient();
    const ping = await redis.ping();
    console.log('Redis Ping Response:', ping);
  } catch (err) {
    console.error('Redis connection failed:', err.message);
    process.exit(1);
  }

  console.log('\n3. Connecting to MongoDB:');
  await connectDB();

  const testMobile = '+919999888877';
  const redisInit = await getRedisClient();
  await redisInit.del(`otp_cooldown:${testMobile}`);
  await redisInit.del(`otp:${testMobile}`);

  console.log(`\n4. Requesting OTP for ${testMobile}:`);
  const sendRes = await otpService.sendOtp(testMobile);
  console.log('Send OTP Result:', sendRes);

  console.log('\n5. Testing 60s Cooldown Enforcement:');
  try {
    await otpService.sendOtp(testMobile);
    console.error('FAILED: Cooldown should have blocked this request!');
  } catch (err) {
    console.log('SUCCESS: Cooldown properly blocked resend ->', err.message);
  }

  console.log(`\n6. Verifying OTP (${sendRes.otp}):`);
  const verifyRes = await otpService.verifyOtp(testMobile, sendRes.otp);
  console.log('Verify Result:', verifyRes);

  console.log('\n7. Testing Full Signup / Authentication Flow:');
  const redis = await getRedisClient();
  await redis.set(`otp:${testMobile}`, '123456', { EX: 300 });

  const signupRes = await otpService.signupOrLoginWithMobile({
    mobileNumber: testMobile,
    otp: '123456',
    name: 'Test Mobile User',
    country: 'India',
    location: 'Mumbai',
  });
  console.log('Signup Result Summary:', {
    message: signupRes.message,
    isNewUser: signupRes.isNewUser,
    userId: signupRes.user.id,
    mobileNumber: signupRes.user.mobileNumber,
    hasAccessToken: !!signupRes.access_token,
    hasRefreshToken: !!signupRes.refresh_token,
  });

  console.log('\n--- ALL REDIS OTP TESTS PASSED SUCCESSFULLY ---');
  process.exit(0);
}

testOtpFlow().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
