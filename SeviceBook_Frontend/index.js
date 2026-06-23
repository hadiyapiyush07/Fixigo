/**
 * @format
 * index.js — App Entry Point
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Register Firebase background message handler using modular API (v22+).
// This must run before AppRegistry so FCM can wake the app in background/quit state.
try {
  const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
  const { getApp } = require('@react-native-firebase/app');
  const messaging = getMessaging(getApp());
  setBackgroundMessageHandler(messaging, async remoteMessage => {
    console.log('[FCM Background]', remoteMessage?.notification?.title);
  });
} catch (e) {
  console.warn('[FCM] Background handler registration failed:', e.message);
}

AppRegistry.registerComponent(appName, () => App);
