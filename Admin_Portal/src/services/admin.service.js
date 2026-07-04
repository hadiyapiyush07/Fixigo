import api from './axiosInstance';

export const adminService = {
  getDashboardStats: () => api.get('/admin/stats'),
  getStats: () => api.get('/admin/stats'),
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
};
