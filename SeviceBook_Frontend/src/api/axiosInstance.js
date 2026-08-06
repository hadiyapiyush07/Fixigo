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
const BASE_URL = Config.API_URL || 'http://10.0.2.2:5000/api';

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

    // Only show visual error for unexpected server errors (5xx) or true network failures
    // 4xx errors (wrong password, validation etc.) are handled by individual screens
    const status = error?.response?.status;
    const isNetworkError = !error?.response; // No response = network unreachable
    const isServerError = status >= 500;     // 5xx = our backend crashed

    if (isNetworkError || isServerError) {
      const errorMsg = isNetworkError
        ? 'Cannot reach server. Check your internet connection.'
        : (error?.response?.data?.message || 'Server error. Please try again.');

      setTimeout(() => {
        try {
          const { showMessage } = require('react-native-flash-message');
          showMessage({
            message: isNetworkError ? 'Network Error' : 'Server Error',
            description: errorMsg,
            type: 'danger',
            duration: 4000,
          });
        } catch (err) {}
      }, 100);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;