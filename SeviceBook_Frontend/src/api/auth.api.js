// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// src/api/auth.api.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import api from './axiosInstance';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  updateFcmToken: (fcmToken)   => api.put('/auth/fcm-token', { fcmToken }),
};

export const otpAPI = {
  send:   (phone)      => api.post('/otp/send',   { phone }),
  verify: (phone, otp) => api.post('/otp/verify', { phone, otp }),
  resend: (phone)      => api.post('/otp/resend', { phone }),
};
