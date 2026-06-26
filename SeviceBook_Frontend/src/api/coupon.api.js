import api from './axiosInstance';

export const couponAPI = {
  getActive: () => api.get('/coupons'),
  apply: (data) => api.post('/coupons/apply', data)
};

export default couponAPI;
