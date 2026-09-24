// src/services/notification.service.js
// Firebase Messaging v22+ modular API (no deprecated namespace warnings)

import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../navigation/RootNavigation';
import api from '../api/axiosInstance';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';

// ─── Global listener registry for incoming booking requests ─────────────────
// This lets AppNavigator subscribe to FCM "booking_request" events
// so the IncomingRequestModal pops up even when socket is disconnected (background)
const bookingRequestListeners = [];
export const onFCMBookingRequest = (cb) => {
  bookingRequestListeners.push(cb);
  return () => {
    const idx = bookingRequestListeners.indexOf(cb);
    if (idx !== -1) bookingRequestListeners.splice(idx, 1);
  };
};
const emitBookingRequest = (bookingId) => {
  bookingRequestListeners.forEach(cb => cb(bookingId));
};

// Safe getter for the Firebase messaging instance
const safeGetMessaging = () => {
  try {
    return getMessaging(getApp());
  } catch (e) {
    console.warn('[FCM] Firebase not initialized:', e.message);
    return null;
  }
};

class NotificationService {
  constructor() {
    this.fcmToken = null;
    this.unsubscribeMessage = null;
    this.unsubscribeTokenRefresh = null;
  }

  async requestUserPermission() {
    try {
      // Android 13+ explicit notification permission
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }

      const messaging = safeGetMessaging();
      if (!messaging) return false;

      const authStatus = await requestPermission(messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        await this.getFCMToken();
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[FCM] requestUserPermission failed:', e.message);
      return false;
    }
  }

  async getFCMToken() {
    try {
      const messaging = safeGetMessaging();
      if (!messaging) return;
      const token = await getToken(messaging);
      if (token) {
        this.fcmToken = token;
        await AsyncStorage.setItem('fcmToken', token);
        await this.syncTokenWithBackend(token);
      }
    } catch (e) {
      console.warn('[FCM] getFCMToken failed:', e.message);
    }
  }

  async syncTokenWithBackend(token) {
    try {
      await api.post('/notifications/fcm-token', {
        fcmToken: token,
        platform: Platform.OS,
        appVersion: '1.0.0',
      });
    } catch (_e) {
      // Silently fail — token sync is best-effort
    }
  }

  setupListeners() {
    try {
      const messaging = safeGetMessaging();
      if (!messaging) return;

      // ── FOREGROUND: FCM message received while app is open ──────────────
      this.unsubscribeMessage = onMessage(messaging, async remoteMessage => {
        const { type, bookingId } = remoteMessage.data || {};

        // If it's a booking request notification → trigger the popup modal
        if (type === 'booking_request' && bookingId) {
          emitBookingRequest(bookingId);
          return; // Don't show Alert, modal will show instead
        }

        // All other notifications → show a simple in-app alert (optional)
        // Intentionally left minimal to avoid noise
      });

      // ── BACKGROUND → FOREGROUND: User taps the notification ─────────────
      onNotificationOpenedApp(messaging, remoteMessage => {
        const { type, bookingId, targetScreen } = remoteMessage.data || {};

        if (type === 'booking_request' && bookingId) {
          // Small delay so the navigator is ready
          setTimeout(() => emitBookingRequest(bookingId), 500);
          return;
        }

        if (navigationRef.current && targetScreen) {
          navigationRef.current.navigate(
            targetScreen,
            bookingId ? { bookingId } : {}
          );
        }
      });

      // ── QUIT STATE: App was fully closed, opened via notification ────────
      getInitialNotification(messaging).then(remoteMessage => {
        if (!remoteMessage) return;
        const { type, bookingId, targetScreen } = remoteMessage.data || {};

        if (type === 'booking_request' && bookingId) {
          setTimeout(() => emitBookingRequest(bookingId), 1500);
          return;
        }

        if (navigationRef.current && targetScreen) {
          setTimeout(() => {
            navigationRef.current.navigate(
              targetScreen,
              bookingId ? { bookingId } : {}
            );
          }, 1000);
        }
      });

      // Token refresh
      this.unsubscribeTokenRefresh = onTokenRefresh(messaging, async newToken => {
        this.fcmToken = newToken;
        await AsyncStorage.setItem('fcmToken', newToken);
        await this.syncTokenWithBackend(newToken);
      });
    } catch (e) {
      console.warn('[FCM] setupListeners failed:', e.message);
    }
  }

  removeListeners() {
    try { if (this.unsubscribeMessage) { this.unsubscribeMessage(); this.unsubscribeMessage = null; } } catch (_e) {}
    try { if (this.unsubscribeTokenRefresh) { this.unsubscribeTokenRefresh(); this.unsubscribeTokenRefresh = null; } } catch (_e) {}
  }
}

export const notificationService = new NotificationService();
