import api from './axiosInstance';

export const authService = {
  login: (data) => api.post('/admin/auth/login', data),
  logout: () => api.post('/admin/auth/logout'),
  getProfile: () => api.get('/admin/auth/me'),
};
