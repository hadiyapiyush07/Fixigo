import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// const BASE_URL = 'http://10.0.2.2:5000/api'; // emulator
// const BASE_URL = 'http://localhost:5000/api'; 
const BASE_URL = 'http://172.17.2.85:5000/api'; // real phone — change WiFi to your PC's IP address

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request automatically
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto refresh token when expired
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      error.response?.data?.message === 'Token expired. Please login again.'
    ) {
      original._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const res = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
        const newToken = res.data.data.accessToken;
        await AsyncStorage.setItem('accessToken', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(original);
      } catch (e) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
