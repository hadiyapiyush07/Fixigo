const asyncHandler     = require("../utils/asyncHandler");
const ApiResponse      = require("../utils/ApiResponse");
const ApiError         = require("../utils/ApiError");
const paymentService   = require("../services/payment.service");

// POST /api/payments/create-order
// Customer calls this when they tap "Pay Now"
// Returns Razorpay order details for mobile SDK
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) throw new ApiError(400, "bookingId is required.");

  const order = await paymentService.createPaymentOrder(bookingId, req.user._id);

  res.status(201).json(new ApiResponse(201, order, "Payment order created. Proceed to checkout."));
});

// POST /api/payments/verify
// Called AFTER Razorpay checkout completes on mobile
// Razorpay returns 3 values to mobile app after payment — send them here
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    bookingId,
  } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !bookingId) {
    throw new ApiError(400,
      "razorpayOrderId, razorpayPaymentId, razorpaySignature and bookingId are all required."
    );
  }

  const result = await paymentService.verifyPayment({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    bookingId,
    customerId: req.user._id,
  });

  res.status(200).json(new ApiResponse(200, result, "Payment successful!"));
});

// GET /api/payments/booking/:bookingId
// Get payment details for a booking
const getPaymentByBookingId = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentByBookingId(
    req.params.bookingId,
    req.user._id
  );
  res.status(200).json(new ApiResponse(200, payment));
});

// POST /api/payments/webhook
// Razorpay calls this automatically when payment status changes
// No auth middleware — Razorpay calls from their servers
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const result = await paymentService.handleWebhook(req.body, signature);
  res.status(200).json(result);
});

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentByBookingId,
  handleWebhook,
};