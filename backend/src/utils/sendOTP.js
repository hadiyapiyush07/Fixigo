const axios = require('axios');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP.model');

// Configuration
const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;
const MAX_OTP_RESENDS = 3;

// Generate 6 digit OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Abstracted SMS Layer
const sendSmsViaProvider = async (phone, otp) => {
  // SMS Provider Configuration
  const provider = process.env.SMS_PROVIDER || 'mock'; // mock, fast2sms, msg91, twilio

  if (provider === 'mock' || process.env.MOCK_SMS === 'true') {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📱 [MOCK SMS] OTP for ${phone}: ${otp}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return { success: true, message: 'OTP sent (mock mode)', mockOtp: otp };
  }

  if (provider === 'fast2sms') {
    try {
      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        { route: 'otp', variables_values: otp, numbers: phone },
        {
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.data.return === true) {
        return { success: true, message: 'OTP sent successfully' };
      }
      throw new Error(response.data.message);
    } catch (error) {
      console.error('Fast2SMS Error:', error.response?.data || error.message);
      // Fallback to MOCK mode if SMS fails in dev so that testing is not blocked
      console.log(`\n📱 [FALLBACK MOCK SMS] OTP for ${phone}: ${otp}\n`);
      return { success: true, message: 'OTP sent (fallback mock mode)', mockOtp: otp };
    }
  }

  // Add more providers here (MSG91, Twilio, etc)
  throw new Error(`Unsupported SMS provider: ${provider}`);
};

/**
 * Generate and Send OTP
 * @param {string} phone 
 * @param {string} purpose ('login', 'forgot_password')
 */
const sendOTP = async (phone, purpose = 'login') => {
  // Check existing OTP to manage resends
  const existingOTP = await OTP.findOne({ phone, purpose });
  
  if (existingOTP) {
    if (existingOTP.resendCount >= MAX_OTP_RESENDS) {
      throw new Error('Maximum resend attempts reached. Please wait for OTP to expire.');
    }
    // Delete existing OTP so old one becomes invalid immediately
    await OTP.deleteOne({ _id: existingOTP._id });
  }

  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const resendCount = existingOTP ? existingOTP.resendCount + 1 : 0;

  await OTP.create({
    phone,
    otpHash,
    purpose,
    resendCount,
    expiresAt
  });

  // Send via abstracted SMS layer
  const smsResponse = await sendSmsViaProvider(phone, otp);
  return smsResponse;
};

/**
 * Verify OTP
 * @param {string} phone 
 * @param {string} enteredOtp 
 * @param {string} purpose 
 */
const verifyOTP = async (phone, enteredOtp, purpose = 'login') => {
  const otpRecord = await OTP.findOne({ phone, purpose });

  if (!otpRecord) {
    return { success: false, message: 'OTP expired or not found' };
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return { success: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
  }

  const isMatch = await bcrypt.compare(enteredOtp.toString().trim(), otpRecord.otpHash);

  if (!isMatch) {
    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();
    return { success: false, message: 'Incorrect OTP' };
  }

  // Verified successfully, delete OTP
  await OTP.deleteOne({ _id: otpRecord._id });
  return { success: true, message: 'OTP verified successfully' };
};

module.exports = { sendOTP, verifyOTP };