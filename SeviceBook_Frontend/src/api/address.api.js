import axiosInstance from './axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_STORAGE_KEY = '@fixigo_saved_addresses';

// Helper for local storage
const getLocalAddresses = async () => {
  try {
    const data = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalAddresses = async (addresses) => {
  try {
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(addresses));
  } catch (e) {
    console.error('Error saving addresses locally:', e);
  }
};

export const addressAPI = {
  // GET all addresses
  getAll: async () => {
    try {
      const res = await axiosInstance.get('/addresses');
      return res.data;
    } catch (e) {
      console.warn('Backend address GET failed, using AsyncStorage fallback');
      const local = await getLocalAddresses();
      return { success: true, data: local };
    }
  },

  // ADD new address
  add: async (addressData) => {
    try {
      const res = await axiosInstance.post('/addresses', addressData);
      return res.data;
    } catch (e) {
      console.warn('Backend address POST failed, using AsyncStorage fallback');
      const local = await getLocalAddresses();
      const newAddress = {
        _id: 'loc_' + Date.now().toString(),
        ...addressData,
        isDefault: addressData.isDefault || local.length === 0, // auto default if first
        createdAt: new Date().toISOString()
      };
      
      // If setting as default, remove default from others
      let updatedList = [...local];
      if (newAddress.isDefault) {
        updatedList = updatedList.map(a => ({ ...a, isDefault: false }));
      }
      
      updatedList.push(newAddress);
      await saveLocalAddresses(updatedList);
      return { success: true, data: newAddress };
    }
  },

  // UPDATE existing address
  update: async (id, addressData) => {
    try {
      const res = await axiosInstance.put(`/addresses/${id}`, addressData);
      return res.data;
    } catch (e) {
      console.warn('Backend address PUT failed, using AsyncStorage fallback');
      const local = await getLocalAddresses();
      
      let updatedList = [...local];
      
      // If setting as default, remove default from others
      if (addressData.isDefault) {
        updatedList = updatedList.map(a => ({ ...a, isDefault: false }));
      }
      
      updatedList = updatedList.map(a => 
        a._id === id ? { ...a, ...addressData } : a
      );
      
      await saveLocalAddresses(updatedList);
      return { success: true, data: updatedList.find(a => a._id === id) };
    }
  },

  // DELETE address
  delete: async (id) => {
    try {
      const res = await axiosInstance.delete(`/addresses/${id}`);
      return res.data;
    } catch (e) {
      console.warn('Backend address DELETE failed, using AsyncStorage fallback');
      const local = await getLocalAddresses();
      const updatedList = local.filter(a => a._id !== id);
      await saveLocalAddresses(updatedList);
      return { success: true };
    }
  },

  // SET DEFAULT address
  setDefault: async (id) => {
    try {
      const res = await axiosInstance.patch(`/addresses/${id}/default`);
      return res.data;
    } catch (e) {
      console.warn('Backend address PATCH failed, using AsyncStorage fallback');
      const local = await getLocalAddresses();
      const updatedList = local.map(a => ({
        ...a,
        isDefault: a._id === id
      }));
      await saveLocalAddresses(updatedList);
      return { success: true, data: updatedList.find(a => a._id === id) };
    }
  }
};
