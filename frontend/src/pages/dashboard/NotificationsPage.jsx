import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  BellOff,
  Settings,
  Check,
  CheckCheck,
  Trash2,
  Smartphone,
  Monitor,
  Send,
  Volume2,
  VolumeX,
  Clock,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Trophy,
  DollarSign,
  Users,
  MessageCircle,
  Shield,
  Megaphone
} from 'lucide-react';
import pushNotificationService from '../../services/pushNotifications';

const NotificationsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('history');
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushPermission, setPushPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
    checkPushStatus();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [historyRes, prefs, deviceList, count] = await Promise.all([
        pushNotificationService.getNotificationHistory(1, 20),
        pushNotificationService.getPreferences(),
        pushNotificationService.getDevices(),
        pushNotificationService.getUnreadCount()
      ]);

      setNotifications(historyRes.notifications || []);
      setPagination(historyRes.pagination || {});
      setPreferences(prefs);
      setDevices(deviceList);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPushStatus = async () => {
    const status = await pushNotificationService.checkPermission();
    setPushPermission(status.permission);
    setIsSubscribed(status.permission === 'granted');
  };

  const enableNotifications = async () => {
    try {
      const permission = await pushNotificationService.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        await pushNotificationService.subscribe();
        setIsSubscribed(true);
        loadData();
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    }
  };

  const updatePreference = async (key, value) => {
    try {
      const updated = await pushNotificationService.updatePreferences({
        [key]: value
      });
      setPreferences(updated);
    } catch (error) {
      console.error('Failed to update preference:', error);
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

  const markAsRead = async (notificationId) => {
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

  const sendTestNotification = async () => {
    try {
      await pushNotificationService.sendTestNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const removeDevice = async (deviceId) => {
    try {
      await pushNotificationService.unregisterDevice(deviceId);
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    } catch (error) {
      console.error('Failed to remove device:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'trade_executed':
      case 'trade_closed':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'challenge_update':
      case 'challenge_passed':
      case 'challenge_failed':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'payout_requested':
      case 'payout_approved':
      case 'payout_rejected':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'new_follower':
      case 'copy_trade':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'new_idea_comment':
      case 'idea_liked':
        return <MessageCircle className="h-5 w-5 text-indigo-500" />;
      case 'security_alert':
        return <Shield className="h-5 w-5 text-red-500" />;
      case 'system_announcement':
        return <Megaphone className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read_at;
    return n.notification_type?.includes(filter);
  });

  const tabs = [
    { id: 'history', labelKey: 'notifications.tabs.notifications', icon: Bell },
    { id: 'preferences', labelKey: 'notifications.tabs.preferences', icon: Settings },
    { id: 'devices', labelKey: 'notifications.tabs.devices', icon: Smartphone }
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30">
              <Bell className="text-primary-400" size={20} />
            </div>
            {t('notifications.title')}
          </h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">
            {t('notifications.subtitle')}
          </p>
        </div>

        {pushPermission !== 'granted' && (
          <button
            onClick={enableNotifications}
            className="px-4 md:px-5 py-3 md:py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl flex items-center justify-center gap-2 font-medium transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 min-h-[48px] w-full sm:w-auto text-sm md:text-base"
          >
            <Bell className="h-5 w-5" />
            {t('notifications.enableNotifications')}
          </button>
        )}
      </div>

      {/* Permission Banner */}
      {pushPermission === 'denied' && (
        <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/30 rounded-xl p-3 md:p-4 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-red-500/20 flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-red-200 font-medium text-sm md:text-base">{t('notifications.notificationsBlocked')}</p>
            <p className="text-red-300/70 text-xs md:text-sm break-words">
              {t('notifications.notificationsBlockedDesc')}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 md:gap-2 bg-dark-100/80 backdrop-blur-xl rounded-xl p-1 md:p-1.5 border border-white/5 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[100px] px-3 md:px-4 py-2.5 flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm font-medium rounded-lg transition-all duration-300 whitespace-nowrap min-h-[44px] ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
            }`}
          >
            <tab.icon className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t(tab.labelKey)}</span>
            <span className="sm:hidden">{t(tab.labelKey).split(' ')[0]}</span>
            {tab.id === 'history' && unreadCount > 0 && (
              <span className="px-1.5 md:px-2 py-0.5 text-xs bg-white/20 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-300 min-h-[44px] flex-1 sm:flex-none"
                  >
                    <option value="all">{t('notifications.filters.all')}</option>
                    <option value="unread">{t('notifications.filters.unread')}</option>
                    <option value="trade">{t('notifications.filters.trading')}</option>
                    <option value="challenge">{t('notifications.filters.challenges')}</option>
                    <option value="payout">{t('notifications.filters.payouts')}</option>
                    <option value="follower">{t('notifications.filters.social')}</option>
                    <option value="security">{t('notifications.filters.security')}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="px-3 py-2.5 text-sm text-gray-400 hover:text-white flex items-center gap-2 min-h-[44px]"
                    >
                      <CheckCheck className="h-4 w-4" />
                      <span>{t('notifications.markAllRead')}</span>
                    </button>
                  )}
                  <button
                    onClick={loadData}
                    className="p-2.5 text-sm text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="space-y-2">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <BellOff className="h-12 w-12 mx-auto mb-3" />
                    <p>{t('notifications.noNotifications')}</p>
                  </div>
                ) : (
                  filteredNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`bg-gray-800/50 rounded-lg p-3 md:p-4 flex items-start gap-3 md:gap-4 ${
                        !notification.read_at ? 'border-l-4 border-indigo-500' : ''
                      }`}
                    >
                      <div className="p-1.5 md:p-2 bg-gray-700/50 rounded-lg flex-shrink-0">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                          <div className="min-w-0">
                            <h4 className="text-white font-medium text-sm md:text-base break-words">
                              {notification.title}
                            </h4>
                            <p className="text-gray-400 text-xs md:text-sm mt-1 break-words">
                              {notification.body}
                            </p>
                          </div>
                          <span className="text-gray-500 text-xs whitespace-nowrap sm:ml-4 order-first sm:order-last">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      {!notification.read_at && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2.5 text-gray-400 hover:text-indigo-400 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {Array.from({ length: pagination.pages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => loadData(i + 1)}
                      className={`px-3 py-2 rounded min-w-[44px] min-h-[44px] ${
                        pagination.page === i + 1
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && preferences && (
            <div className="space-y-4 md:space-y-6">
              {/* Global Toggle */}
              <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {preferences.push_enabled ? (
                      <Volume2 className="h-5 w-5 md:h-6 md:w-6 text-indigo-400 flex-shrink-0" />
                    ) : (
                      <VolumeX className="h-5 w-5 md:h-6 md:w-6 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <h3 className="text-white font-medium text-sm md:text-base">{t('notifications.preferences.pushNotifications')}</h3>
                      <p className="text-gray-400 text-xs md:text-sm">
                        {preferences.push_enabled ? t('notifications.preferences.enabled') : t('notifications.preferences.disabled')}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={preferences.push_enabled}
                      onChange={(e) => updatePreference('push_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Category Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Trading */}
                <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
                  <h4 className="text-white font-medium mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                    {t('notifications.preferences.trading')}
                  </h4>
                  <div className="space-y-3">
                    <PreferenceToggle
                      label={t('notifications.preferences.tradeExecuted')}
                      checked={preferences.trade_executed}
                      onChange={(v) => updatePreference('trade_executed', v)}
                    />
                    <PreferenceToggle
                      label={t('notifications.preferences.tradeClosed')}
                      checked={preferences.trade_closed}
                      onChange={(v) => updatePreference('trade_closed', v)}
                    />
                    <PreferenceToggle
                      label={t('notifications.preferences.priceAlerts')}
                      checked={preferences.price_alerts}
                      onChange={(v) => updatePreference('price_alerts', v)}
                    />
                  </div>
                </div>

                {/* Challenges */}
                <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
                  <h4 className="text-white font-medium mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                    <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                    {t('notifications.preferences.challenges')}
                  </h4>
                  <div className="space-y-3">
                    <PreferenceToggle
                      label={t('notifications.preferences.challengeUpdates')}
                      checked={preferences.challenge_updates}
                      onChange={(v) => updatePreference('challenge_updates', v)}
                    />
                    <PreferenceToggle
                      label={t('notifications.preferences.challengePassed')}
                      checked={preferences.challenge_passed}
                      onChange={(v) => updatePreference('challenge_passed', v)}
                    />
                    <PreferenceToggle
                      label={t('notifications.preferences.challengeFailed')}
                      checked={preferences.challenge_failed}
                      onChange={(v) => updatePreference('challenge_failed', v)}
                    />
                  </div>
                </div>

                {/* Payouts */}
                <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
                  <h4 className="text-white font-medium mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                    <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-green-400" />
                    {t('notifications.preferences.payouts')}
                  </h4>
                  <div className="space-y-3">
                    <PreferenceToggle
                      label={t('notifications.preferences.payoutUpdates')}
                      checked={preferences.payout_updates}
                      onChange={(v) => updatePreference('payout_updates', v)}
                    />
                  </div>
                </div>

                {/* Social */}
                <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
                  <h4 className="text-white font-medium mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-400" />
                    {t('notifications.preferences.social')}
                  </h4>
                  <div className="space-y-3">
                    <PreferenceToggle
                      label={t('notifications.preferences.newFollowers')}
                      checked={preferences.new_follower}
                      onChange={(v) => updatePreference('new_follower', v)}
                    />
                    <PreferenceToggle
                      label={t('notifications.preferences.copyTrade')}
                      checked={preferences.copy_trade}
                      onChange={(v) => updatePreference('copy_trade', v)}
                    />
                    <PreferenceToggle
                      label={t('notifications.preferences.ideaInteractions')}
                      checked={preferences.idea_interactions}
                      onChange={(v) => updatePreference('idea_interactions', v)}
                    />
                  </div>
                </div>

                {/* System */}
                <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
                  <h4 className="text-white font-medium mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                    <Shield className="h-4 w-4 md:h-5 md:w-5 text-red-400" />
                    {t('notifications.preferences.system')}
                  </h4>
                  <div className="space-y-3">
                    <PreferenceToggle
                      label={t('notifications.preferences.securityAlerts')}
                      checked={preferences.security_alerts}
                      onChange={(v) => updatePreference('security_alerts', v)}
                    />
                    <PreferenceToggle
                      label={t('notifications.preferences.systemAnnouncements')}
                      checked={preferences.system_announcements}
                      onChange={(v) => updatePreference('system_announcements', v)}
                    />
                    <PreferenceToggle
                      label={t('notifications.preferences.marketing')}
                      checked={preferences.marketing}
                      onChange={(v) => updatePreference('marketing', v)}
                    />
                  </div>
                </div>

                {/* Quiet Hours */}
                <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
                  <h4 className="text-white font-medium mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                    <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
                    {t('notifications.preferences.quietHours')}
                  </h4>
                  <div className="space-y-3">
                    <PreferenceToggle
                      label={t('notifications.preferences.enableQuietHours')}
                      checked={preferences.quiet_hours_enabled}
                      onChange={(v) => updatePreference('quiet_hours_enabled', v)}
                    />
                    {preferences.quiet_hours_enabled && (
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-3">
                        <div className="flex-1">
                          <label className="text-gray-400 text-xs md:text-sm">{t('notifications.preferences.start')}</label>
                          <select
                            value={preferences.quiet_hours_start}
                            onChange={(e) => updatePreference('quiet_hours_start', parseInt(e.target.value))}
                            className="block w-full mt-1 bg-gray-700 border border-gray-600 rounded px-3 py-2.5 text-white min-h-[44px] text-sm"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-gray-400 text-xs md:text-sm">{t('notifications.preferences.end')}</label>
                          <select
                            value={preferences.quiet_hours_end}
                            onChange={(e) => updatePreference('quiet_hours_end', parseInt(e.target.value))}
                            className="block w-full mt-1 bg-gray-700 border border-gray-600 rounded px-3 py-2.5 text-white min-h-[44px] text-sm"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Test Notification */}
              {isSubscribed && (
                <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-white font-medium text-sm md:text-base">{t('notifications.testNotification')}</h4>
                      <p className="text-gray-400 text-xs md:text-sm">
                        {t('notifications.testNotificationDesc')}
                      </p>
                    </div>
                    <button
                      onClick={sendTestNotification}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto text-sm"
                    >
                      <Send className="h-4 w-4" />
                      {t('notifications.sendTest')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Devices Tab */}
          {activeTab === 'devices' && (
            <div className="space-y-3 md:space-y-4">
              {devices.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Smartphone className="h-12 w-12 mx-auto mb-3" />
                  <p>{t('notifications.devices.noDevices')}</p>
                  <p className="text-sm mt-2">
                    {t('notifications.devices.enableToRegister')}
                  </p>
                </div>
              ) : (
                devices.map(device => (
                  <div
                    key={device.id}
                    className="bg-gray-800/50 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                  >
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="p-2 md:p-3 bg-gray-700/50 rounded-lg flex-shrink-0">
                        {device.platform === 'web' ? (
                          <Monitor className="h-5 w-5 md:h-6 md:w-6 text-indigo-400" />
                        ) : (
                          <Smartphone className="h-5 w-5 md:h-6 md:w-6 text-indigo-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white font-medium text-sm md:text-base truncate">
                          {device.device_name || `${device.browser} on ${device.os}`}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
                          <span className="text-gray-400 text-xs md:text-sm">
                            {device.platform}
                          </span>
                          {device.is_active ? (
                            <span className="text-green-400 text-xs flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                              {t('notifications.devices.active')}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">{t('notifications.devices.inactive')}</span>
                          )}
                          <span className="text-gray-500 text-xs hidden sm:inline">
                            {t('notifications.devices.lastUsed')}: {formatDate(device.last_used_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDevice(device.id)}
                      className="p-2.5 text-gray-400 hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center self-end sm:self-auto"
                      title="Remove device"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Preference Toggle Component
const PreferenceToggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between gap-3 min-h-[36px]">
    <span className="text-gray-300 text-xs md:text-sm">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-gray-700 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
    </label>
  </div>
);

export default NotificationsPage;
