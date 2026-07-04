import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  Calendar, 
  Wallet, 
  Tag, 
  Bell, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { logout, selectCurrentAdmin } from '../../redux/authSlice';
import { authService } from '../../services/auth.service';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Providers', path: '/providers', icon: Wrench },
  { name: 'Services', path: '/categories', icon: Tag },
  { name: 'Bookings', path: '/bookings', icon: Calendar },
  { name: 'Finance', path: '/finance', icon: Wallet },
  { name: 'Coupons', path: '/coupons', icon: Tag },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const dispatch = useDispatch();
  const admin = useSelector(selectCurrentAdmin);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
    } catch (error) {
      console.error('Logout failed', error);
      dispatch(logout());
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
            />
            <motion.aside
              initial={{ x: -256, width: 256 }}
              animate={{ x: 0, width: 256 }}
              exit={{ x: -256, width: 256 }}
              transition={{ type: "tween", duration: 0.3 }}
              className="bg-white border-r border-slate-200 flex-shrink-0 flex flex-col fixed md:relative z-30 h-full shadow-2xl md:shadow-none"
            >
            <div className="h-16 flex items-center px-6 border-b border-slate-200">
              <span className="text-xl font-bold text-primary">Fixigo Admin</span>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-3">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          setIsSidebarOpen(false);
                        }
                      }}
                      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-slate-200">
              <div className="flex items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {admin?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {admin?.email || 'admin@fixigo.com'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-500 hover:text-slate-700 focus:outline-none"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <div className="flex items-center space-x-4">
             <button className="text-slate-400 hover:text-slate-500">
               <Bell className="h-5 w-5" />
             </button>
             <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {admin?.name?.[0]?.toUpperCase() || 'A'}
             </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
