import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { SecureStorage } from '../../utils/secureStorage';
import { authAPI } from '../../api/auth.api';

// ── Login (Validate Credentials & Send OTP) ───────────────────────────────
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await authAPI.login(credentials);
      return res.data.data; // Returns { phone, mockOtp }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// ── Verify OTP (Finalize Login) ───────────────────────────────────────────
export const verifyLoginOtpUser = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phone, otp }, { rejectWithValue }) => {
    try {
      const res = await authAPI.verifyLoginOtp(phone, otp);
      const { user, accessToken, refreshToken } = res.data.data;
      
      // Store securely
      await SecureStorage.setItem('accessToken', accessToken);
      await SecureStorage.setItem('refreshToken', refreshToken);
      await SecureStorage.setItem('user', user);
      
      return { user, accessToken, refreshToken };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'OTP Verification failed');
    }
  }
);

// ── Register (Only create account) ────────────────────────────────────────
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await authAPI.register(userData);
      return res.data.message; // Just success message
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// ── Logout ────────────────────────────────────────────────────────────────
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try { await authAPI.logout(); } catch (e) {}
    try { await SecureStorage.clearAll(); } catch (e) {}
    return true;
  }
);

// ── Load stored auth on app start ─────────────────────────────────────────
export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async () => {
    try {
      const token = await SecureStorage.getItem('accessToken');
      const user  = await SecureStorage.getItem('user');
      if (token && user) {
        return { accessToken: token, user };
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
    otpPendingPhone: null, // Stores phone while waiting for OTP
  },
  reducers: {
    clearError:  (state)         => { state.error = null; },
    updateUser:  (state, action) => { state.user = { ...state.user, ...action.payload }; },
    clearOtpPending: (state)     => { state.otpPendingPhone = null; },
  },
  extraReducers: (builder) => {
    builder
      // loadStoredAuth
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user        = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.isLoggedIn  = true;
        }
        state.isInitialized = true;
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isInitialized = true;
      })

      // Login (OTP Gen)
      .addCase(loginUser.pending,   (state) => { state.isLoading = true;  state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading       = false;
        state.otpPendingPhone = action.payload; // Set phone for OTP screen
      })
      .addCase(loginUser.rejected,  (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // Verify OTP
      .addCase(verifyLoginOtpUser.pending,   (state) => { state.isLoading = true;  state.error = null; })
      .addCase(verifyLoginOtpUser.fulfilled, (state, action) => {
        state.isLoading       = false;
        state.user            = action.payload.user;
        state.accessToken     = action.payload.accessToken;
        state.isLoggedIn      = true;
        state.otpPendingPhone = null;
      })
      .addCase(verifyLoginOtpUser.rejected,  (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // Register
      .addCase(registerUser.pending,   (state) => { state.isLoading = true;  state.error = null; })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected,  (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user        = null;
        state.accessToken = null;
        state.isLoggedIn  = false;
      });
  },
});

export const { clearError, updateUser, clearOtpPending } = authSlice.actions;
export default authSlice.reducer;
