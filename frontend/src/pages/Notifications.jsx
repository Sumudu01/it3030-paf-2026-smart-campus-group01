import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationAPI.getAll();
      setNotifications(res.data || []);
    } catch (e) {
      setError('Failed to load notifications');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation(); // Don't trigger markAsRead
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
    } catch (e) {
      console.error('Failed to clear all notifications', e);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleString();
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="notifications-container">
        <div className="notifications-loading">
          <div className="spinner"></div>
          <p>Loading your updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-module-header">
        <div className="notifications-header-row">
          <div>
            <h2>Notifications</h2>
            <p className="subtitle">Stay updated with your campus activities</p>
          </div>
          {notifications.length > 0 && (
            <div className="notifications-header-actions">
              <button
                type="button"
                className="notifications-action-btn secondary"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
              <button
                type="button"
                className="notifications-action-btn danger"
                onClick={handleClearAll}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="notifications-error">{error}</div>}

      {notifications.length === 0 ? (
        <div className="notifications-empty">
          <div className="empty-icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>Updates about your bookings and incident reports will appear here.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className={`notification-item ${!n.read ? 'unread' : ''}`}
              onClick={() => !n.read && handleMarkAsRead(n.id)}
            >
              <div className="notification-type-icon">
                {n.type === 'BOOKING' ? '📅' : '🎫'}
              </div>
              <div className="notification-body">
                <div className="notification-header">
                  <span className="notification-title">{n.title}</span>
                  <span className="notification-time">{formatDateTime(n.createdAt)}</span>
                </div>
                <p className="notification-message">{n.message}</p>
                <div className="notification-item-actions">
                  {!n.read && <span className="unread-dot"></span>}
                  <button 
                    className="delete-notification-btn"
                    onClick={(e) => handleDeleteNotification(e, n.id)}
                    title="Remove notification"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
