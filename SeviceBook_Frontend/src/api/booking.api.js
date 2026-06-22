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
  respondReschedule: (id, data) => api.put(`/bookings/${id}/respond-reschedule`, data),

  // Provider
  getProviderBookings: (params) => api.get('/bookings/provider', { params }),
  accept:  (id)     => api.put(`/bookings/${id}/accept`),
  reject:  (id, reason) => api.put(`/bookings/${id}/reject`, { reason }),
  updateStatus: (id, status, otp) => api.put(`/bookings/${id}/status`, { status, otp }),
  verifyOtp: (id, otp) => api.post(`/bookings/${id}/verify-otp`, { otp }),
  providerCancel: (id, reason) => api.put(`/bookings/${id}/provider-cancel`, { reason }),
  requestReschedule: (id, data) => api.put(`/bookings/${id}/request-reschedule`, data),
};

export default bookingAPI;
