// ════════════════════════════════════════════════════════════
// booking.controller.js
// ════════════════════════════════════════════════════════════
const asyncHandler      = require("../utils/asyncHandler");
const ApiResponse       = require("../utils/ApiResponse");
const ApiError          = require("../utils/ApiError");
const bookingService    = require("../services/booking.service");

const createBooking = asyncHandler(async (req, res) => {
  const { categoryId, scheduledDate, scheduledTime, address } = req.body;
  if (!categoryId || !scheduledDate || !scheduledTime || !address) {
    throw new ApiError(400, "categoryId, scheduledDate, scheduledTime and address are required.");
  }
  if (!address.addressLine || !address.city || !address.pincode || !address.location) {
    throw new ApiError(400, "address must include addressLine, city, pincode and location.coordinates.");
  }
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
  const { status } = req.body;
  if (!status) throw new ApiError(400, "status is required.");
  const booking = await bookingService.updateBookingStatus(req.params.id, status, req.user._id);
  res.status(200).json(new ApiResponse(200, booking, `Status updated to ${status}.`));
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user._id, req.body.reason);
  res.status(200).json(new ApiResponse(200, booking, "Booking cancelled."));
});

module.exports = {
  createBooking, getMyBookings, getProviderBookings,
  getBookingById, acceptBooking, rejectBooking, updateBookingStatus, cancelBooking,
};
