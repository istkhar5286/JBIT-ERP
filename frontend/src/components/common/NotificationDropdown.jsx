import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Bell, Check, Clock, AlertCircle, Info, CheckCircle2, ChevronRight, X } from 'lucide-react';

export const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000); // Check every 45s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-wider">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500/20 text-rose-300 px-2 py-0.5 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-[11px] text-slate-300 hover:text-white underline font-semibold"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="h-8 w-8 mx-auto text-slate-300 mb-1.5" />
                <p className="font-semibold text-slate-600">You're all caught up!</p>
                <p className="text-[11px]">No alerts at this moment</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  className={`p-3.5 flex items-start justify-between gap-3 transition-colors ${
                    item.read ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/50 hover:bg-indigo-50/80'
                  }`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {item.type === 'ATTENDANCE_WARNING' || item.type === 'FEE_OVERDUE' ? (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      ) : item.type === 'PAYMENT_SUCCESS' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Info className="h-4 w-4 text-indigo-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(item.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  {!item.read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkRead(item._id, e)}
                      className="p-1 text-indigo-600 hover:bg-indigo-100 rounded-lg shrink-0"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
