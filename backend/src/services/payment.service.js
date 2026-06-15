const Razorpay = require("razorpay");
const crypto   = require("crypto");
const Booking  = require("../models/Booking.model");
const Provider = require("../models/Provider.model");
const { Payment } = require("../models/Other.model");
const ApiError = require("../utils/ApiError");
const { sendPushNotification } = require("../config/firebase");

// Razorpay instance — uses your test keys from .env
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── STEP 1: Create Razorpay order ─────────────────────────────────────────
// Called when customer taps "Pay Now" on the booking confirmation screen
// Returns an order object that the mobile app passes to Razorpay SDK
const createPaymentOrder = async (bookingId, customerId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");

  // Only the booking owner can pay
  if (String(booking.customerId) !== String(customerId)) {
    throw new ApiError(403, "Access denied.");
  }

  // Cannot pay for a booking that is not confirmed
  if (!["confirmed", "in_progress", "completed"].includes(booking.status)) {
    throw new ApiError(400, `Cannot create payment for booking with status: ${booking.status}`);
  }

  // Already paid
  if (booking.paymentStatus === "paid") {
    throw new ApiError(400, "This booking is already paid.");
  }

  // Amount in paise (₹1 = 100 paise)
  // ₹850 = 85000 paise
  const amountInPaise = booking.pricing.totalAmount * 100;

  // Create order on Razorpay servers
  const order = await razorpay.orders.create({
    amount:   amountInPaise,
    currency: "INR",
    receipt:  `booking_${bookingId}`,    // your internal reference
    notes: {
      bookingId:  String(bookingId),
      customerId: String(customerId),
    },
  });

  // Save payment record in DB with status "created"
  const payment = await Payment.create({
    bookingId,
    customerId,
    providerId:        booking.providerId,
    razorpayOrderId:   order.id,
    amount:            amountInPaise,
    currency:          "INR",
    status:            "created",
  });

  // Return everything mobile app needs to open Razorpay checkout
  return {
    orderId:    order.id,               // pass to RazorpayCheckout.open()
    amount:     order.amount,           // in paise
    currency:   order.currency,
    keyId:      process.env.RAZORPAY_KEY_ID,  // needed by mobile SDK
    paymentId:  payment._id,
    bookingDetails: {
      service:    booking.subService?.name,
      totalAmount: booking.pricing.totalAmount,
    },
  };
};

// ── STEP 2: Verify payment after Razorpay callback ───────────────────────
// Razorpay sends razorpay_order_id + razorpay_payment_id + razorpay_signature
// We verify the signature to confirm the payment is genuine (not tampered)
const verifyPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  bookingId,
  customerId,
}) => {
  // Step 1: Recreate the signature using our secret key
  // Razorpay signature = HMAC-SHA256 of "orderId|paymentId" using secret key
  const body      = razorpayOrderId + "|" + razorpayPaymentId;
  const generated = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  // Step 2: Compare with what Razorpay sent us
  const isValid = generated === razorpaySignature;
  if (!isValid) {
    // Signature mismatch = payment was tampered or fake
    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { status: "failed" }
    );
    throw new ApiError(400, "Payment verification failed. Invalid signature.");
  }

  // Step 3: Mark payment as paid in DB
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    {
      razorpayPaymentId,
      razorpaySignature,
      status: "paid",
      paidAt: new Date(),
    },
    { new: true }
  );

  if (!payment) throw new ApiError(404, "Payment record not found.");

  // Step 4: Update booking payment status
  await Booking.findByIdAndUpdate(bookingId, {
    paymentStatus: "paid",
    paymentMethod: "razorpay",
    paymentId:     payment._id,
  });

  // Step 5: Credit provider wallet (85% of total — 15% platform fee)
  const booking = await Booking.findById(bookingId);
  if (booking && booking.providerId) {
    const providerShare = Math.floor(payment.amount * 0.85); // 85% to provider
    await Provider.findByIdAndUpdate(booking.providerId, {
      $inc: {
        "earnings.total":   providerShare,
        "earnings.pending": providerShare,
      },
    });
  }

  // Step 6: Notify customer payment success
  const { Notification } = require("../models/Other.model");
  const User = require("../models/User.model");
  const customer = await User.findById(customerId).select("fcmToken");
  if (customer && customer.fcmToken) {
    await sendPushNotification(
      customer.fcmToken,
      "Payment Successful! ✅",
      `₹${payment.amount / 100} paid successfully for your booking.`,
      { bookingId: String(bookingId), screen: "BookingDetail" }
    );
  }

  await Notification.create({
    userId: customerId,
    title:  "Payment Successful!",
    body:   `₹${payment.amount / 100} paid successfully.`,
    type:   "payment_success",
    data:   { bookingId: String(bookingId) },
  });

  return {
    message:   "Payment verified successfully.",
    paymentId: payment._id,
    amount:    payment.amount / 100,  // convert back to rupees for response
    status:    "paid",
  };
};

// ── Get payment details for a booking ────────────────────────────────────
const getPaymentByBookingId = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");

  const payment = await Payment.findOne({ bookingId })
    .populate("customerId", "name phone")
    .populate("bookingId",  "status pricing");

  if (!payment) throw new ApiError(404, "No payment found for this booking.");
  return payment;
};

// ── Razorpay webhook (optional but recommended for production) ────────────
// Razorpay calls this URL when payment status changes on their end
const handleWebhook = async (body, signature) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "webhook_secret")
    .update(JSON.stringify(body))
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new ApiError(400, "Invalid webhook signature.");
  }

  const event = body.event;

  if (event === "payment.captured") {
    const paymentEntity = body.payload.payment.entity;
    await Payment.findOneAndUpdate(
      { razorpayOrderId: paymentEntity.order_id },
      { status: "paid", razorpayPaymentId: paymentEntity.id, paidAt: new Date() }
    );
  }

  if (event === "payment.failed") {
    const paymentEntity = body.payload.payment.entity;
    await Payment.findOneAndUpdate(
      { razorpayOrderId: paymentEntity.order_id },
      { status: "failed" }
    );
  }

  return { received: true };
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentByBookingId,
  handleWebhook,
};