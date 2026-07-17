import api from './axiosInstance';

export const adminService = {
  getDashboardStats: (params) => api.get('/admin/stats', { params }),
  getStats: (params) => api.get('/admin/stats', { params }),
  getProviders: (params) => api.get('/admin/providers', { params }),
  verifyProvider: (id, data) => api.put(`/admin/providers/${id}/verify`, data),
  getCustomers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id, data) => api.put(`/admin/users/${id}/toggle-status`, data),
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data) => api.post('/admin/coupons', data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
  getNotifications: (params) => api.get('/admin/notifications', { params }),
  markNotificationRead: (id) => api.put(`/admin/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/admin/notifications/read-all'),
};
