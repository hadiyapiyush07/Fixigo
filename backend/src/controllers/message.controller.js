const Message = require("../models/Message.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const getMessages = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const messages = await Message.find({ bookingId })
    .sort({ createdAt: 1 })
    .populate("sender", "name profilePhoto")
    .populate("receiver", "name profilePhoto");
    
  res.status(200).json(new ApiResponse(200, messages, "Messages fetched successfully."));
});

const sendMessage = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { receiverId, message } = req.body;
  
  if (!receiverId || !message) {
    throw new ApiError(400, "receiverId and message are required.");
  }
  
  const newMessage = await Message.create({
    bookingId,
    sender: req.user._id,
    receiver: receiverId,
    message
  });
  
  const { emitToUser } = require("../socket/socket");
  emitToUser(receiverId, "newMessage", newMessage);
  
  res.status(201).json(new ApiResponse(201, newMessage, "Message sent successfully."));
});

const markAsRead = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  await Message.updateMany(
    { bookingId, receiver: req.user._id, read: false },
    { $set: { read: true } }
  );
  
  const { emitToBooking } = require("../socket/socket");
  emitToBooking(bookingId, "messagesRead", { readerId: req.user._id });
  
  res.status(200).json(new ApiResponse(200, null, "Messages marked as read."));
});

module.exports = {
  getMessages,
  sendMessage,
  markAsRead
};
