import { createSlice } from '@reduxjs/toolkit';

const storedToken = localStorage.getItem('adminAccessToken');

const initialState = {
  admin: null,
  accessToken: storedToken || null,
  isAuthenticated: !!storedToken,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { admin, accessToken } = action.payload;
      state.admin = admin;
      if (accessToken) {
        state.accessToken = accessToken;
        localStorage.setItem('adminAccessToken', accessToken);
      }
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.admin = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('adminAccessToken');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;
export const selectCurrentAdmin = (state) => state.auth.admin;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
