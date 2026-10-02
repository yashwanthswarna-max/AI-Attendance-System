import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Bell, Shield, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export const Navbar = ({ setIsMobileOpen }) => {
  const { user, darkMode, toggleDarkMode } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/settings/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/settings/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center space-x-3">
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Live System Badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Face AI & Liveness: Active</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-xl border border-slate-200 dark:border-slate-800 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</span>
                <button
                  onClick={() => setShowNotifs(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto mt-2 space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.notification_id}
                      onClick={() => !n.is_read && markAsRead(n.notification_id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        n.is_read
                          ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400'
                          : 'bg-brand-50/50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-900/60 text-slate-800 dark:text-slate-200 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">{n.title}</span>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-brand-500"></span>}
                      </div>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Tag */}
        <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
            {(user?.name || user?.username || 'A')[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">{user?.name || user?.username}</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-300 capitalize">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
