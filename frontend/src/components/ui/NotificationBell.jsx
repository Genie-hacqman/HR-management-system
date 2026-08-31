import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as notificationService from '../../services/notificationService';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  async function loadUnreadCount() {
    try {
      setUnreadCount(await notificationService.getUnreadCount());
    } catch { /* non-critical */ }
  }

  async function loadNotifications() {
    try {
      const result = await notificationService.listNotifications({ pageSize: 10 });
      setNotifications(result.data);
    } catch { /* non-critical */ }
  }

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleOpen() {
    const next = !isOpen;
    setIsOpen(next);
    if (next) loadNotifications();
  }

  async function handleNotificationClick(n) {
    if (!n.is_read) {
      await notificationService.markAsRead(n.id);
      loadUnreadCount();
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    setIsOpen(false);
    if (n.link) navigate(n.link);
  }

  async function handleMarkAllRead() {
    await notificationService.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-ink/60 hover:bg-navy-50 hover:text-ink"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-card border border-border bg-panel shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-medium text-navy-700 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-ink/40">You're all caught up.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`block w-full border-b border-border px-4 py-3 text-left last:border-0 hover:bg-navy-50/40 ${
                  !n.is_read ? 'bg-navy-50/20' : ''
                }`}
              >
                <p className="text-sm font-medium text-ink">{n.title}</p>
                {n.message && <p className="mt-0.5 text-xs text-ink/60">{n.message}</p>}
                <p className="mt-1 text-[11px] text-ink/40">{new Date(n.created_at).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
