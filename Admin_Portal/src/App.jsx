import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Providers from './pages/Providers';
import Customers from './pages/Customers';
import Categories from './pages/Categories';
import Bookings from './pages/Bookings';
import Finance from './pages/Finance';
import Coupons from './pages/Coupons';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import { authService } from './services/auth.service';
import { setCredentials, logout } from './redux/authSlice';

function App() {
  const dispatch = useDispatch();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await authService.getProfile();
        // Since we don't have the token in the response of getProfile (it's in httpOnly cookie), 
        // we just set the user. The Axios interceptor handles the token injection for requests.
        dispatch(setCredentials({ admin: res.data.data, accessToken: null }));
      } catch (error) {
        dispatch(logout());
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, [dispatch]);

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/providers" element={<Providers />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
