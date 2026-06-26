import api from './axiosInstance';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (credentials) => api.post('/auth/login', credentials),
  verifyLoginOtp: (phone, otp) => api.post('/auth/verify-login-otp', { phone, otp }),
  
  forgotPassword: (phone) => api.post('/auth/forgot-password', { phone }),
  resetPassword: (phone, otp, newPassword) => api.post('/auth/reset-password', { phone, otp, newPassword }),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),

  logout: () => api.post('/auth/logout'),
  refreshToken: (token) => api.post('/auth/refresh-token', { refreshToken: token }),
  updateFcmToken: (token) => api.put('/auth/fcm-token', { fcmToken: token }),
};