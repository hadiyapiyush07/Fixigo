import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';

class NotificationService {
  async setupChannels() {
    if (Platform.OS !== 'android') return;
    
    // High Priority channel for new bookings
    await notifee.createChannel({
      id: 'booking_requests_v2',
      name: 'Booking Requests',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });

    // Standard updates channel
    await notifee.createChannel({
      id: 'booking_updates',
      name: 'Booking Updates',
      importance: AndroidImportance.DEFAULT,
    });
  }

  async displayBookingRequest(bookingData) {
    await this.setupChannels();
    
    await notifee.displayNotification({
      title: bookingData.title || '🛎️ New Booking Request!',
      body: bookingData.body || 'Tap to view details and accept the booking.',
      data: { bookingId: bookingData.bookingId },
      android: {
        channelId: 'booking_requests_v2',
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: '✅ Accept',
            pressAction: { id: 'accept_booking' },
          },
          {
            title: '❌ Decline',
            pressAction: { id: 'decline_booking' },
          },
        ],
        timeoutAfter: 20000, // Auto-dismiss after 20 seconds
      },
    });
  }
}

// Background Event Handler for Notifee Action Buttons
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  
  if (type === EventType.ACTION_PRESS && pressAction.id === 'accept_booking') {
    const bookingId = notification.data.bookingId;
    try {
      // Assuming a secured accept endpoint exists in providerAPI or bookingAPI
      // We will use bookingAPI.acceptBooking in reality, but since we are in a headless state
      // we must rely on the imported axios instance retaining the token from AsyncStorage.
      const { bookingAPI } = require('../api/booking.api');
      await bookingAPI.accept(bookingId);
      
      // Notify success locally
      await notifee.displayNotification({
        title: '✅ Booking Accepted',
        body: 'You have been assigned to this job.',
        android: { channelId: 'booking_updates' }
      });
    } catch (error) {
      const errMsg = error?.response?.data?.message || 'Error accepting booking';
      await notifee.displayNotification({
        title: '❌ Accept Failed',
        body: errMsg,
        android: { channelId: 'booking_updates' }
      });
    }

    // Remove the actionable notification
    await notifee.cancelNotification(notification.id);
  }

  if (type === EventType.ACTION_PRESS && pressAction.id === 'decline_booking') {
    await notifee.cancelNotification(notification.id);
    // Optionally notify backend about decline to skip 20s timeout
  }
});

export default new NotificationService();
