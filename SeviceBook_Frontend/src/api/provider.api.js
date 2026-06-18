// src/api/provider.api.js
import api from './axiosInstance';

export const providerAPI = {
  getNearby: (params) => api.get('/providers/nearby', { params }),
  getById: (id) => api.get(`/providers/${id}`),
  getMyProfile: () => api.get('/providers/me'),
  updateProfile: (data) => api.put('/providers/profile', data),
  toggleOnline: (data) => api.put('/providers/online-status', data),
  updateAvailability: (availability) => api.put('/providers/availability', { availability }),
};