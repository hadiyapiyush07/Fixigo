import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../navigation/RootNavigation';
import api from '../api/api'; // generic axios instance

class NotificationService {
  constructor() {
    this.fcmToken = null;
    this.messageListener = null;
  }

  async requestUserPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        // Notification permission denied
        return false;
      }
    }
    
    // iOS and Android generic request
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      await this.getFCMToken();
      return true;
    }
    return false;
  }

  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      if (token) {
        this.fcmToken = token;
        await AsyncStorage.setItem('fcmToken', token);
        await this.syncTokenWithBackend(token);
      }
    } catch (e) {
      // Error getting FCM token
    }
  }

  async syncTokenWithBackend(token) {
    try {
      const appVersion = '1.0.0'; // Hardcoded for MVP, ideally use react-native-device-info
      await api.post('/notifications/fcm-token', {
        fcmToken: token,
        platform: Platform.OS,
        appVersion
      });
    } catch (e) {
      // Failed to sync FCM token
    }
  }

  setupListeners() {
    // Listen for foreground messages
    this.messageListener = messaging().onMessage(async remoteMessage => {
      // Foreground Message received
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
                  navigationRef.current.navigate(targetScreen, bookingId ? { bookingId } : {});
                }
              }
            }
          ]
        );
      }
    });

    // Handle user tapping on background notification
    messaging().onNotificationOpenedApp(remoteMessage => {
      const { bookingId, targetScreen } = remoteMessage.data || {};
      if (navigationRef.current && targetScreen) {
        navigationRef.current.navigate(targetScreen, bookingId ? { bookingId } : {});
      }
    });

    // Handle app opened from a quit state via notification
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        const { bookingId, targetScreen } = remoteMessage.data || {};
        // Delay slightly so navigation is fully mounted
        setTimeout(() => {
          if (navigationRef.current && targetScreen) {
            navigationRef.current.navigate(targetScreen, bookingId ? { bookingId } : {});
          }
        }, 1000);
      }
    });

    // Listen for token refresh
    messaging().onTokenRefresh(async token => {
      this.fcmToken = token;
      await AsyncStorage.setItem('fcmToken', token);
      await this.syncTokenWithBackend(token);
    });
  }

  removeListeners() {
    if (this.messageListener) {
      this.messageListener();
    }
  }
}

export const notificationService = new NotificationService();
