const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const { sendMulticast } = require('../config/firebase');
const ApiError = require('../utils/ApiError');

exports.updateFCMToken = async (req, res, next) => {
  try {
    const { fcmToken, platform, appVersion } = req.body;
    if (!fcmToken) return next(new ApiError(400, "Token is required"));

    const user = await User.findById(req.user.id).select('+fcmTokens');
    if (!user) return next(new ApiError(404, "User not found"));

    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
    }
    user.devicePlatform = platform || user.devicePlatform;
    user.appVersion = appVersion || user.appVersion;
    user.lastActive = Date.now();
    await user.save();

    res.status(200).json({ success: true, data: "Token updated" });
  } catch (err) {
    next(err);
  }
};

exports.getMyNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const notifications = await Notification.find({ receiver: req.user.id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await Notification.countDocuments({ receiver: req.user.id });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, receiver: req.user.id });
    if (!notification) return next(new ApiError(404, "Notification not found"));

    notification.read = true;
    await notification.save();

    res.status(200).json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ receiver: req.user.id, read: false }, { read: true });
    res.status(200).json({ success: true, data: "All marked as read" });
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, receiver: req.user.id });
    if (!notification) return next(new ApiError(404, "Notification not found"));

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
