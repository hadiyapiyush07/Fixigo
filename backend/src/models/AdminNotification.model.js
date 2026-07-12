const mongoose = require('mongoose');

const adminNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['provider_signup', 'new_booking', 'system_alert', 'payment'], default: 'system_alert' },
    link: { type: String, default: null }, // URL to redirect when clicked
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminNotification', adminNotificationSchema);
