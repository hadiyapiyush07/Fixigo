// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// src/api/booking.api.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import api from './axiosInstance';

export const bookingAPI = {
  // Customer
  create:  (data)   => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings/my', { params }),
  getById: (id)     => api.get(`/bookings/${id}`),
  cancel:  (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),

  // Provider
  getProviderBookings: (params) => api.get('/bookings/provider', { params }),
  accept:  (id)     => api.put(`/bookings/${id}/accept`),
  reject:  (id, reason) => api.put(`/bookings/${id}/reject`, { reason }),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
};
