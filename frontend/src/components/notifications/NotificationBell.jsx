import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Settings,
  TrendingUp,
  Trophy,
  DollarSign,
  Users,
  Shield,
  Megaphone,
  MessageCircle,
  X
} from 'lucide-react';
import pushNotificationService from '../../services/pushNotifications';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await pushNotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const result = await pushNotificationService.getNotificationHistory(1, 5);
      setNotifications(result.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const markAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await pushNotificationService.markAsRead([notificationId]);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await pushNotificationService.markAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'trade_executed':
      case 'trade_closed':
        return <TrendingUp className="h-4 w-4 text-blue-400" />;
      case 'challenge_update':
      case 'challenge_passed':
      case 'challenge_failed':
        return <Trophy className="h-4 w-4 text-yellow-400" />;
      case 'payout_requested':
      case 'payout_approved':
      case 'payout_rejected':
        return <DollarSign className="h-4 w-4 text-green-400" />;
      case 'new_follower':
      case 'copy_trade':
        return <Users className="h-4 w-4 text-purple-400" />;
      case 'new_idea_comment':
      case 'idea_liked':
        return <MessageCircle className="h-4 w-4 text-indigo-400" />;
      case 'security_alert':
        return <Shield className="h-4 w-4 text-red-400" />;
      case 'system_announcement':
        return <Megaphone className="h-4 w-4 text-orange-400" />;
      default:
        return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <h3 className="text-white font-medium">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin h-6 w-6 border-2 border-gray-600 border-t-indigo-500 rounded-full mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellOff className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer ${
                    !notification.read_at ? 'bg-indigo-900/10' : ''
                  }`}
                  onClick={() => {
                    navigate('/dashboard/notifications');
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-gray-700/50 rounded-lg mt-0.5">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-white font-medium truncate">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                    </div>
                    {!notification.read_at && (
                      <button
                        onClick={(e) => markAsRead(notification.id, e)}
                        className="p-1 text-gray-400 hover:text-indigo-400"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-700 flex justify-between">
            <button
              onClick={() => {
                navigate('/dashboard/notifications');
                setIsOpen(false);
              }}
              className="text-sm text-indigo-400 hover:text-indigo-300 px-2 py-1"
            >
              View all
            </button>
            <button
              onClick={() => {
                navigate('/dashboard/notifications?tab=preferences');
                setIsOpen(false);
              }}
              className="text-sm text-gray-400 hover:text-white px-2 py-1 flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
