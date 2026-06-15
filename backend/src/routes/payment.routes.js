const express  = require("express");
const router   = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  getPaymentByBookingId,
  handleWebhook,
} = require("../controllers/payment.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

// Webhook — no auth (Razorpay server calls this)
// express.raw needed for webhook signature verification
router.post("/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

// Protected routes — customer only
router.post("/create-order",
  verifyToken,
  requireRole("customer"),
  createPaymentOrder
);

router.post("/verify",
  verifyToken,
  requireRole("customer"),
  verifyPayment
);

router.get("/booking/:bookingId",
  verifyToken,
  getPaymentByBookingId
);

module.exports = router;

// ══════════════════════════════════════════════════════════════
// POSTMAN TESTING GUIDE — PAYMENT API
// ══════════════════════════════════════════════════════════════
//
// FLOW:
// 1. Create order → get orderId
// 2. Mobile app opens Razorpay checkout with orderId
// 3. Customer pays → Razorpay returns 3 values to app
// 4. App sends those 3 values to /verify
// 5. Backend verifies → marks booking as paid
//
// ── STEP 1: CREATE PAYMENT ORDER ─────────────────────────────
// POST http://localhost:5000/api/payments/create-order
// Headers: Authorization: Bearer {{customerToken}}
// Body:
// { "bookingId": "<completed_booking_id>" }
//
// Expected Response:
// {
//   "data": {
//     "orderId":  "order_xxxxxxxxxxxxx",   ← pass to Razorpay SDK
//     "amount":   85000,                   ← in paise (₹850)
//     "currency": "INR",
//     "keyId":    "rzp_test_xxxxxxxxxx"    ← your test key
//   }
// }
//
// ── STEP 2: SIMULATE PAYMENT (test mode) ─────────────────────
// In test mode you cannot actually call Razorpay from Postman.
// But you can SIMULATE a successful payment for testing.
//
// Use these test card details in your mobile app:
//   Card number: 4111 1111 1111 1111
//   Expiry:      Any future date (e.g. 12/26)
//   CVV:         Any 3 digits (e.g. 123)
//   Name:        Any name
//
//   UPI (easiest for testing): success@razorpay
//
// ── STEP 3: VERIFY PAYMENT ───────────────────────────────────
// POST http://localhost:5000/api/payments/verify
// Headers: Authorization: Bearer {{customerToken}}
// Body:
// {
//   "razorpayOrderId":   "order_xxxxxxxxxxxxx",
//   "razorpayPaymentId": "pay_xxxxxxxxxxxxx",
//   "razorpaySignature": "abc123def456...",
//   "bookingId":         "<your_booking_id>"
// }
//
// To test verify WITHOUT mobile app (simulate):
// In Node.js console, generate a fake valid signature:
//
//   const crypto = require("crypto");
//   const orderId   = "order_xxxxxxxxxxxxx";  ← from step 1
//   const paymentId = "pay_test_" + Date.now();
//   const body      = orderId + "|" + paymentId;
//   const sig = crypto.createHmac("sha256", "your_razorpay_secret")
//               .update(body).digest("hex");
//   console.log("paymentId:", paymentId);
//   console.log("signature:", sig);
//
// Paste those values in the verify body.
//
// ── STEP 4: CHECK PAYMENT STATUS ─────────────────────────────
// GET http://localhost:5000/api/payments/booking/<bookingId>
// Headers: Authorization: Bearer {{customerToken}}