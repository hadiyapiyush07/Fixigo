const AdminNotification = require('../models/AdminNotification.model');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// GET /api/admin/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    AdminNotification.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    AdminNotification.countDocuments(),
    AdminNotification.countDocuments({ isRead: false })
  ]);

  res.json(new ApiResponse(200, {
    data: notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    unreadCount
  }, "Notifications fetched successfully"));
});

// PUT /api/admin/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await AdminNotification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );

  if (!notification) throw new ApiError(404, "Notification not found");
  res.json(new ApiResponse(200, notification, "Notification marked as read"));
});

// PUT /api/admin/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await AdminNotification.updateMany({ isRead: false }, { isRead: true });
  res.json(new ApiResponse(200, null, "All notifications marked as read"));
});

// Helper for backend logic to trigger notification
const createAdminNotification = async (title, message, type, link) => {
  try {
    const notif = await AdminNotification.create({ title, message, type, link });
    const { emitToAdmins } = require('../socket/socket');
    emitToAdmins('admin:notification', notif);
  } catch (error) {
    console.error("Error creating admin notification", error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createAdminNotification
};
