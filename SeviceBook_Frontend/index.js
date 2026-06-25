/**
 * @format
 * index.js — App Entry Point
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import NotificationService from './src/services/NotificationService';

try {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('[FCM Background] Message handled!', remoteMessage);
    if (remoteMessage.data && remoteMessage.data.type === 'booking_request') {
      await NotificationService.displayBookingRequest(remoteMessage.data);
    }
  });
} catch (e) {
  console.warn('[FCM] Background handler registration failed:', e.message);
}

AppRegistry.registerComponent(appName, () => App);
