import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../api/auth.api';

// ── Login ─────────────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = res.data.data;
      await AsyncStorage.setItem('accessToken',  accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return { user, accessToken, refreshToken };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// ── Register ──────────────────────────────────────────────────────────────
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await authAPI.register(userData);
      const { user, accessToken, refreshToken } = res.data.data;
      await AsyncStorage.setItem('accessToken',  accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return { user, accessToken, refreshToken };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// ── Logout ────────────────────────────────────────────────────────────────
// NO navigation here — AppNavigator watches isLoggedIn automatically
// When isLoggedIn becomes false → AppNavigator shows Login instantly
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try { await authAPI.logout(); } catch (e) {}
    try { await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']); } catch (e) {}
    return true;
  }
);

// ── Load stored auth on app start ─────────────────────────────────────────
export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async () => {
    try {
      const token   = await AsyncStorage.getItem('accessToken');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        return { accessToken: token, user: JSON.parse(userStr) };
      }
    } catch (e) {}
    return null;
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:          null,
    accessToken:   null,
    isLoggedIn:    false,
    isLoading:     false,
    error:         null,
    isInitialized: false,
  },
  reducers: {
    clearError:  (state)         => { state.error = null; },
    updateUser:  (state, action) => { state.user = { ...state.user, ...action.payload }; },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending,   (state) => { state.isLoading = true;  state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading   = false;
        state.user        = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isLoggedIn  = true;
      })
      .addCase(loginUser.rejected,  (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // Register
      .addCase(registerUser.pending,   (state) => { state.isLoading = true;  state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading   = false;
        state.user        = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isLoggedIn  = true;
      })
      .addCase(registerUser.rejected,  (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // Logout — just clear state, AppNavigator handles redirect automatically
      .addCase(logoutUser.fulfilled, (state) => {
        state.user        = null;
        state.accessToken = null;
        state.isLoggedIn  = false;
        // No navigation needed here — AppNavigator watches isLoggedIn
        // When isLoggedIn = false → Auth stack renders → Login shows instantly
      })

      // Load stored auth
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isInitialized = true;
        if (action.payload) {
          state.user        = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.isLoggedIn  = true;
        }
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
