import axiosInstance from './axiosInstance';

export const addressAPI = {
  // GET all addresses
  getAll: async () => {
    const res = await axiosInstance.get('/addresses');
    return res.data; // { success: true, data: [...] }
  },

  // ADD new address
  add: async (addressData) => {
    const payload = { ...addressData, label: addressData.type || addressData.label || "Home" };
    const res = await axiosInstance.post('/addresses', payload);
    return res.data;
  },

  // UPDATE existing address
  update: async (id, addressData) => {
    const payload = { ...addressData, label: addressData.type || addressData.label || "Home" };
    const res = await axiosInstance.put(`/addresses/${id}`, payload);
    return res.data;
  },

  // DELETE address
  delete: async (id) => {
    const res = await axiosInstance.delete(`/addresses/${id}`);
    return res.data;
  }
};

export default addressAPI;
