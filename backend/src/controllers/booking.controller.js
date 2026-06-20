// ════════════════════════════════════════════════════════════
// booking.controller.js
// ════════════════════════════════════════════════════════════
const asyncHandler      = require("../utils/asyncHandler");
const ApiResponse       = require("../utils/ApiResponse");
const ApiError          = require("../utils/ApiError");
const bookingService    = require("../services/booking.service");

const createBooking = asyncHandler(async (req, res) => {
  // ── DEBUG: print exactly what arrives from frontend ──────
  console.log("\n══════════════════════════════════════════════");
  console.log("📦 [createBooking] req.body =", JSON.stringify(req.body, null, 2));
  console.log("══════════════════════════════════════════════\n");

  const { categoryId, address } = req.body;

  // Only categoryId and address are truly required for instant booking
  if (!categoryId) {
    throw new ApiError(400, "categoryId is required.");
  }
  if (!address || !address.addressLine || !address.city || !address.pincode) {
    throw new ApiError(400, "address must include addressLine, city, and pincode.");
  }

  // ── Instant Booking: auto-fill date & time if not provided ──
  if (!req.body.scheduledDate) {
    req.body.scheduledDate = new Date();
  }
  if (!req.body.scheduledTime) {
    req.body.scheduledTime = "Instant";
  }

  // ── Ensure address.location exists with defaults (Surat) ────
  if (!req.body.address.location) {
    req.body.address.location = {
      type: "Point",
      coordinates: [72.8311, 21.1702]
    };
  }

  console.log("📋 [createBooking] parsed payload:");
  console.log("  categoryId   :", req.body.categoryId);
  console.log("  scheduledDate:", req.body.scheduledDate);
  console.log("  scheduledTime:", req.body.scheduledTime);
  console.log("  subServices  :", JSON.stringify(req.body.subServices));
  console.log("  subService   :", JSON.stringify(req.body.subService));
  console.log("  pricing      :", JSON.stringify(req.body.pricing));
  console.log("  address      :", req.body.address?.addressLine, req.body.address?.city);
  console.log("  images count :", (req.body.images || []).length);

  const booking = await bookingService.createBooking(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, booking, "Booking created. Finding provider..."));
});

const getMyBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.getCustomerBookings(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, result));
});

const getProviderBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.getProviderBookings(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, result));
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, booking));
});

const acceptBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.acceptBooking(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, booking, "Booking accepted."));
});

const rejectBooking = asyncHandler(async (req, res) => {
  const result = await bookingService.rejectBooking(req.params.id, req.user._id, req.body.reason);
  res.status(200).json(new ApiResponse(200, result));
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, otp } = req.body;
  if (!status) throw new ApiError(400, "status is required.");
  const booking = await bookingService.updateBookingStatus(req.params.id, status, req.user._id, otp);
  res.status(200).json(new ApiResponse(200, booking, `Status updated to ${status}.`));
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user._id, req.body.reason);
  res.status(200).json(new ApiResponse(200, booking, "Booking cancelled."));
});

const providerCancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await bookingService.cancelJobByProvider(req.params.id, req.user._id, reason);
  res.status(200).json(new ApiResponse(200, booking, "Job cancelled by provider. Reassigning..."));
});

const requestRescheduleBooking = asyncHandler(async (req, res) => {
  const { proposedDate, proposedTime, reason } = req.body;
  if (!proposedDate || !proposedTime) {
    throw new ApiError(400, "proposedDate and proposedTime are required.");
  }
  const booking = await bookingService.requestReschedule(req.params.id, req.user._id, req.user.role, { proposedDate, proposedTime, reason });
  res.status(200).json(new ApiResponse(200, booking, "Reschedule request sent."));
});

const respondRescheduleBooking = asyncHandler(async (req, res) => {
  const { response } = req.body;
  if (!response) throw new ApiError(400, "response is required.");
  const booking = await bookingService.respondReschedule(req.params.id, req.user._id, { response });
  res.status(200).json(new ApiResponse(200, booking, `Reschedule ${response}.`));
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) throw new ApiError(400, "OTP is required.");
  const booking = await bookingService.verifyOtp(req.params.id, req.user._id, otp);
  res.status(200).json(new ApiResponse(200, booking, "OTP Verified. Service Started."));
});

const getLiveLocation = asyncHandler(async (req, res) => {
  const location = await bookingService.getLiveLocation(req.params.id);
  res.status(200).json(new ApiResponse(200, location, "Live location fetched."));
});

const submitReview = asyncHandler(async (req, res) => {
  const { rating, reviewText } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new ApiError(400, "Rating between 1 and 5 is required.");
  const review = await bookingService.submitReview(req.params.id, req.user._id, rating, reviewText);
  res.status(200).json(new ApiResponse(200, review, "Review submitted successfully."));
});

module.exports = {
  createBooking, getMyBookings, getProviderBookings,
  getBookingById, acceptBooking, rejectBooking, updateBookingStatus, cancelBooking,
  providerCancelBooking, requestRescheduleBooking, respondRescheduleBooking, verifyOtp,
  getLiveLocation, submitReview
};
