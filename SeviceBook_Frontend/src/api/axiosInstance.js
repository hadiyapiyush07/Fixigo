// src/api/axiosInstance.js
import axios from 'axios';
import { SecureStorage } from '../utils/secureStorage';
import Config from 'react-native-config';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMPORTANT — CHANGE THIS IP FOR YOUR SETUP:
//
// For Android EMULATOR:
//   BASE_URL = 'http://10.0.2.2:5000/api'
//
// For REAL PHONE (USB debug):
//   Step 1: Find your PC WiFi IP
//   Windows: open CMD → type "ipconfig" → look for IPv4 Address
//   Example: 192.168.1.105
//   Step 2: Make sure phone and PC are on SAME WiFi network
//   Step 3: Set BASE_URL = 'http://192.168.1.105:5000/api'
//
// Your phone and PC MUST be on the same WiFi network!
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Loaded from .env.development or .env.emulator via react-native-config
const BASE_URL = Config.API_URL || 'http://10.113.245.85:5000/api';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {}
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error?.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = await SecureStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const newToken =
          res?.data?.data?.accessToken ||
          res?.data?.accessToken;

        const newRefreshToken =
          res?.data?.data?.refreshToken ||
          res?.data?.refreshToken;

        if (!newToken) throw new Error('No new access token');

        await SecureStorage.setItem('accessToken', newToken);
        if (newRefreshToken) {
          await SecureStorage.setItem('refreshToken', newRefreshToken);
        }

        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(original);
      } catch (e) {
        await SecureStorage.clearAll();
      }
    }

    // Show visual error to help debugging
    const errorMsg = error?.response?.data?.message || error.message || 'API Request Failed';
    
    // Use setTimeout to avoid interfering with current render cycle
    setTimeout(() => {
      // Need to import showMessage dynamically or statically
      try {
        const { showMessage } = require('react-native-flash-message');
        showMessage({
          message: "API Error",
          description: errorMsg,
          type: "danger",
          duration: 4000
        });
      } catch (err) {}
    }, 100);

    return Promise.reject(error);
  }
);

export default axiosInstance;