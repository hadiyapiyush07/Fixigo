// src/services/notification.service.js
// Firebase Messaging v22+ modular API (no deprecated namespace warnings)

import { Platform, PermissionsAndroid, Alert } from 'react-native';
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

      // Foreground messages
      this.unsubscribeMessage = onMessage(messaging, async remoteMessage => {
        const { title, body } = remoteMessage.notification || {};
        const { bookingId, targetScreen } = remoteMessage.data || {};
        if (title || body) {
          Alert.alert(
            title || 'New Notification',
            body || '',
            [
              { text: 'Dismiss', style: 'cancel' },
              {
                text: 'View',
                onPress: () => {
                  if (navigationRef.current && targetScreen) {
                    navigationRef.current.navigate(
                      targetScreen,
                      bookingId ? { bookingId } : {}
                    );
                  }
                },
              },
            ]
          );
        }
      });

      // Background → foreground tap
      onNotificationOpenedApp(messaging, remoteMessage => {
        const { bookingId, targetScreen } = remoteMessage.data || {};
        if (navigationRef.current && targetScreen) {
          navigationRef.current.navigate(
            targetScreen,
            bookingId ? { bookingId } : {}
          );
        }
      });

      // Quit state → opened via notification
      getInitialNotification(messaging).then(remoteMessage => {
        if (remoteMessage) {
          const { bookingId, targetScreen } = remoteMessage.data || {};
          setTimeout(() => {
            if (navigationRef.current && targetScreen) {
              navigationRef.current.navigate(
                targetScreen,
                bookingId ? { bookingId } : {}
              );
            }
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
