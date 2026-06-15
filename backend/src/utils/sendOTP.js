// const axios        = require("axios");
// const { setEx, get, del } = require("../config/redis");

// // Generate a random 6-digit OTP
// const generateOTP = () => {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// };

// // ── Send OTP ──────────────────────────────────────────────────────────────
// // const sendOTP = async (phone) => {
// //   const otp = generateOTP();

// //   // Store in Redis with 10 minute expiry
// //   // Key pattern: otp:9876543210
// //   await setEx(`otp:${phone}`, otp, 600);

// //   // ── DEVELOPMENT MODE — just log to console ────────────────────────────
// //   if (process.env.NODE_ENV === "development") {
// //     console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
// //     console.log(`📱 OTP for ${phone}: ${otp}`);
// //     console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
// //     return { success: true, message: "OTP sent (check server console in dev mode)" };
// //   }

// //   // ── PRODUCTION MODE — send via MSG91 ─────────────────────────────────
// //   try {
// //     const response = await axios.post(
// //       "https://control.msg91.com/api/v5/otp",
// //       {
// //         authkey:     process.env.MSG91_AUTH_KEY,
// //         template_id: process.env.MSG91_TEMPLATE_ID,
// //         mobile:      `91${phone}`,   // 91 = India country code
// //         otp:         otp,
// //       },
// //       {
// //         headers: { "Content-Type": "application/json" },
// //         timeout: 10000, // 10 second timeout
// //       }
// //     );

// //     if (response.data.type === "success") {
// //       return { success: true, message: "OTP sent to your mobile number." };
// //     } else {
// //       console.error("MSG91 error:", response.data);
// //       throw new Error("Failed to send OTP via MSG91.");
// //     }
// //   } catch (error) {
// //     console.error("MSG91 error:", error.message);
// //     throw new Error("Failed to send OTP. Please try again.");
// //   }
// // };

// const sendOTP = async (phone) => {
//   const otp = generateOTP();
//   await setEx(`otp:${phone}`, otp, 600); // 10 minutes expiry

//   // ---------- MOCK MODE (for practice) ----------
//   if (process.env.MOCK_SMS === 'true') {
//     console.log(`\n📱 [MOCK] OTP for ${phone}: ${otp}\n`);
//     return { success: true, message: 'OTP sent (check console)' };
//   }

//   // ---------- REAL SMS (Fast2SMS) ----------
//   try {
//     const response = await axios.post(
//       'https://www.fast2sms.com/dev/bulkV2',
//       {
//         route: 'otp',
//         variables_values: otp,
//         numbers: phone,
//       },
//       {
//         headers: {
//           authorization: process.env.FAST2SMS_API_KEY,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     if (response.data.return === true) {
//       return { success: true, message: 'OTP sent successfully' };
//     }
//     throw new Error(response.data.message);
//   } catch (error) {
//     console.error('SMS Error:', error.response?.data || error.message);
//     throw new Error('Failed to send OTP');
//   }
// };


// // ── Verify OTP entered by user ────────────────────────────────────────────
// const verifyOTP = async (phone, enteredOtp) => {
//   const storedOtp = await get(`otp:${phone}`);

//   if (!storedOtp) {
//     return {
//       success: false,
//       message: "OTP expired or not found. Please request a new OTP.",
//     };
//   }

//   if (storedOtp !== enteredOtp.toString().trim()) {
//     return {
//       success: false,
//       message: "Incorrect OTP. Please try again.",
//     };
//   }

//   // OTP verified — delete from Redis so it cannot be reused
//   await del(`otp:${phone}`);

//   return { success: true, message: "OTP verified successfully." };
// };

// // ── Resend OTP — delete old and send fresh ────────────────────────────────
// const resendOTP = async (phone) => {
//   // Delete existing OTP if any
//   await del(`otp:${phone}`);
//   // Send fresh OTP
//   return sendOTP(phone);
// };

// module.exports = { sendOTP, verifyOTP, resendOTP };


const axios = require('axios');
const crypto = require('crypto');

// Simple in‑memory store (replace with Redis in production)
const otpStore = new Map();

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const setEx = async (key, value, ttlSeconds) => {
  otpStore.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
};

const get = async (key) => {
  const entry = otpStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    otpStore.delete(key);
    return null;
  }
  return entry.value;
};

const del = async (key) => otpStore.delete(key);

// ──────────────────────────────────────────────────────────
// sendOTP – uses mock mode when MOCK_SMS=true
// ──────────────────────────────────────────────────────────
const sendOTP = async (phone) => {
  const otp = generateOTP();
  await setEx(`otp:${phone}`, otp, 600); // 10 minutes

  // MOCK MODE – for practice
  if (process.env.MOCK_SMS === 'true') {
    console.log(`\n📱 [MOCK] OTP for ${phone}: ${otp}\n`);
    // Return the OTP so frontend can display it
    return { success: true, message: 'OTP sent (mock mode)', mockOtp: otp };
  }

  // REAL SMS – Fast2SMS (unused unless MOCK_SMS=false)
  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'otp',
        variables_values: otp,
        numbers: phone,
      },
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
    console.error('SMS Error:', error.response?.data || error.message);
    throw new Error('Failed to send OTP');
  }
};

const verifyOTP = async (phone, otp) => {
  const stored = await get(`otp:${phone}`);
  if (!stored) return { success: false, message: 'OTP expired or not found' };
  if (stored !== otp) return { success: false, message: 'Incorrect OTP' };
  await del(`otp:${phone}`);
  return { success: true, message: 'OTP verified successfully' };
};

const resendOTP = async (phone) => {
  await del(`otp:${phone}`);
  return sendOTP(phone);
};

module.exports = { sendOTP, verifyOTP, resendOTP };