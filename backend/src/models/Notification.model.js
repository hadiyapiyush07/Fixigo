const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'booking_created', 'booking_request', 'booking_accepted', 'booking_confirmed', 
      'booking_reassigned', 'provider_on_the_way', 'provider_arrived', 'otp_verification', 
      'service_started', 'payment_pending', 'payment_success', 'booking_completed', 
      'booking_cancelled', 'booking_rejected', 'general'
    ],
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  navigationTarget: {
    type: String,
    default: null
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  data: {
    type: Object,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
