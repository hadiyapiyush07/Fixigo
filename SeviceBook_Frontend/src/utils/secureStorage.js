import AsyncStorage from '@react-native-async-storage/async-storage';

// Simplified Storage for Portfolio: Avoids 'Native crypto module' crash on Android
export const SecureStorage = {
  setItem: async (key, value) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(`secure_${key}`, stringValue);
    } catch (e) {
      console.error(`SecureStorage setItem error for ${key}:`, e);
    }
  },

  getItem: async (key) => {
    try {
      const value = await AsyncStorage.getItem(`secure_${key}`);
      if (!value) return null;
      
      // Try to parse as JSON if it's an object/array, otherwise return the string
      try {
        return JSON.parse(value);
      } catch (parseError) {
        return value;
      }
    } catch (e) {
      console.error(`SecureStorage getItem error for ${key}:`, e);
      return null;
    }
  },

  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(`secure_${key}`);
    } catch (e) {
      console.error(`SecureStorage removeItem error for ${key}:`, e);
    }
  },

  clearAll: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(k => k.startsWith('secure_'));
      for (const k of secureKeys) {
        await AsyncStorage.removeItem(k);
      }
    } catch (e) {
      console.error('SecureStorage clearAll error:', e);
    }
  }
};
