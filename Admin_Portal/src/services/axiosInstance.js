import axios from 'axios';
import { store } from '../redux/store';
import { logout } from '../redux/authSlice';

// Create Axios Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Interceptor for API Requests
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for API Responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      store.dispatch(logout());
      // Do not use window.location.href = '/login' here as it causes infinite reloads on initial check
      // Let the component handle the rejection and use React Router to redirect if needed
    }
    return Promise.reject(error);
  }
);

export default api;
