import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, AlertTriangle, UserPlus, FileText, Check } from 'lucide-react';
import { adminService } from '../services/admin.service';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await adminService.getNotifications({ limit: 50 });
      setNotifications(res.data?.data?.data || []);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await adminService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to update notifications');
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await adminService.markNotificationRead(notification._id);
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      } catch (error) {
        console.error(error);
      }
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'provider_signup': return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'new_booking': return <FileText className="w-5 h-5 text-emerald-600" />;
      case 'system_alert': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default: return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 bg-primary/10 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading notifications...</div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div 
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 sm:px-6 flex gap-4 transition-colors cursor-pointer hover:bg-slate-50 ${!notification.isRead ? 'bg-primary/5' : ''}`}
              >
                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${!notification.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0">
                      {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${!notification.isRead ? 'text-slate-600' : 'text-slate-500'}`}>
                    {notification.message}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="flex items-center h-full ml-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 py-24">
            <Bell className="w-12 h-12 mb-4 text-slate-300" />
            <p>No new notifications right now.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
