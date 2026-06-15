// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// src/api/payment.api.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import api from './axiosInstance';

export const paymentAPI = {
  createOrder:  (bookingId) => api.post('/payments/create-order', { bookingId }),
  verifyPayment: (data)     => api.post('/payments/verify', data),
  getByBooking:  (bookingId)=> api.get(`/payments/booking/${bookingId}`),
};