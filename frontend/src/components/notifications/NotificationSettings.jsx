import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Volume2,
  VolumeX,
  Clock,
  TrendingUp,
  Trophy,
  DollarSign,
  Users,
  Shield,
  Megaphone,
  Smartphone,
  Globe,
  Calendar,
  Save,
  RefreshCw
} from 'lucide-react';
import pushNotificationService from '../../services/pushNotifications';

const NotificationSettings = ({ onSave, compact = false }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const prefs = await pushNotificationService.getPreferences();
      setPreferences(prefs || getDefaultPreferences());
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setPreferences(getDefaultPreferences());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPreferences = () => ({
    push_enabled: true,
    trade_executed: true,
    trade_closed: true,
    price_alerts: true,
    challenge_updates: true,
    challenge_passed: true,
    challenge_failed: true,
    payout_updates: true,
    new_follower: true,
    copy_trade: true,
    idea_interactions: true,
    security_alerts: true,
    system_announcements: true,
    marketing: false,
    email_enabled: true,
    email_trade_summary: true,
    email_marketing: false,
    email_digest_frequency: 'daily',
    sound_enabled: true,
    sound_volume: 50,
    quiet_hours_enabled: false,
    quiet_hours_start: 22,
    quiet_hours_end: 8,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  });

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await pushNotificationService.updatePreferences(preferences);
      setHasChanges(false);
      if (onSave) onSave(preferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!preferences) return null;

  const categories = [
    {
      id: 'trading',
      title: 'Trading',
      icon: TrendingUp,
      color: 'text-blue-400',
      settings: [
        { key: 'trade_executed', label: 'Trade Executed', description: 'When a trade is opened' },
        { key: 'trade_closed', label: 'Trade Closed', description: 'When a trade is closed with P/L' },
        { key: 'price_alerts', label: 'Price Alerts', description: 'When price targets are hit' }
      ]
    },
    {
      id: 'challenges',
      title: 'Challenges',
      icon: Trophy,
      color: 'text-yellow-400',
      settings: [
        { key: 'challenge_updates', label: 'Challenge Updates', description: 'Progress and milestone updates' },
        { key: 'challenge_passed', label: 'Challenge Passed', description: 'When you pass a phase' },
        { key: 'challenge_failed', label: 'Challenge Failed', description: 'When a challenge fails' }
      ]
    },
    {
      id: 'payouts',
      title: 'Payouts',
      icon: DollarSign,
      color: 'text-green-400',
      settings: [
        { key: 'payout_updates', label: 'Payout Updates', description: 'Status changes on payout requests' }
      ]
    },
    {
      id: 'social',
      title: 'Social',
      icon: Users,
      color: 'text-purple-400',
      settings: [
        { key: 'new_follower', label: 'New Followers', description: 'When someone follows you' },
        { key: 'copy_trade', label: 'Copy Trading', description: 'When someone copies your trade' },
        { key: 'idea_interactions', label: 'Idea Interactions', description: 'Likes and comments on your ideas' }
      ]
    },
    {
      id: 'system',
      title: 'System',
      icon: Shield,
      color: 'text-red-400',
      settings: [
        { key: 'security_alerts', label: 'Security Alerts', description: 'Login attempts and security events' },
        { key: 'system_announcements', label: 'Announcements', description: 'Platform updates and news' },
        { key: 'marketing', label: 'Marketing', description: 'Promotions and special offers' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Global Push Toggle */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {preferences.push_enabled ? (
              <Bell className="h-6 w-6 text-indigo-400" />
            ) : (
              <Bell className="h-6 w-6 text-gray-500" />
            )}
            <div>
              <h3 className="text-white font-medium">Push Notifications</h3>
              <p className="text-gray-400 text-sm">
                Receive notifications on this device
              </p>
            </div>
          </div>
          <Toggle
            checked={preferences.push_enabled}
            onChange={(v) => updatePreference('push_enabled', v)}
          />
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className={`h-6 w-6 ${preferences.email_enabled ? 'text-indigo-400' : 'text-gray-500'}`} />
            <div>
              <h3 className="text-white font-medium">Email Notifications</h3>
              <p className="text-gray-400 text-sm">
                Receive updates via email
              </p>
            </div>
          </div>
          <Toggle
            checked={preferences.email_enabled}
            onChange={(v) => updatePreference('email_enabled', v)}
          />
        </div>

        {preferences.email_enabled && (
          <div className="pl-9 space-y-3 border-t border-gray-700 pt-4">
            <SettingRow
              label="Daily Trade Summary"
              description="Receive a daily summary of your trading activity"
              checked={preferences.email_trade_summary}
              onChange={(v) => updatePreference('email_trade_summary', v)}
            />
            <SettingRow
              label="Marketing Emails"
              description="Promotions, tips, and educational content"
              checked={preferences.email_marketing}
              onChange={(v) => updatePreference('email_marketing', v)}
            />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-300 text-sm">Digest Frequency</span>
                <p className="text-gray-500 text-xs">How often to receive email digests</p>
              </div>
              <select
                value={preferences.email_digest_frequency || 'daily'}
                onChange={(e) => updatePreference('email_digest_frequency', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
              >
                <option value="realtime">Real-time</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Sound Settings */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {preferences.sound_enabled ? (
              <Volume2 className="h-6 w-6 text-indigo-400" />
            ) : (
              <VolumeX className="h-6 w-6 text-gray-500" />
            )}
            <div>
              <h3 className="text-white font-medium">Notification Sounds</h3>
              <p className="text-gray-400 text-sm">
                Play sound when notifications arrive
              </p>
            </div>
          </div>
          <Toggle
            checked={preferences.sound_enabled}
            onChange={(v) => updatePreference('sound_enabled', v)}
          />
        </div>

        {preferences.sound_enabled && (
          <div className="pl-9 border-t border-gray-700 pt-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">Volume</span>
              <input
                type="range"
                min="0"
                max="100"
                value={preferences.sound_volume || 50}
                onChange={(e) => updatePreference('sound_volume', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-gray-400 text-sm w-10 text-right">
                {preferences.sound_volume || 50}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quiet Hours */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className={`h-6 w-6 ${preferences.quiet_hours_enabled ? 'text-orange-400' : 'text-gray-500'}`} />
            <div>
              <h3 className="text-white font-medium">Quiet Hours</h3>
              <p className="text-gray-400 text-sm">
                Pause notifications during specific hours
              </p>
            </div>
          </div>
          <Toggle
            checked={preferences.quiet_hours_enabled}
            onChange={(v) => updatePreference('quiet_hours_enabled', v)}
          />
        </div>

        {preferences.quiet_hours_enabled && (
          <div className="pl-9 border-t border-gray-700 pt-4 space-y-3">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-gray-400 text-sm block mb-1">Start Time</label>
                <select
                  value={preferences.quiet_hours_start}
                  onChange={(e) => updatePreference('quiet_hours_start', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-gray-400 text-sm block mb-1">End Time</label>
                <select
                  value={preferences.quiet_hours_end}
                  onChange={(e) => updatePreference('quiet_hours_end', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Timezone</label>
              <select
                value={preferences.timezone}
                onChange={(e) => updatePreference('timezone', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Asia/Shanghai">Shanghai (CST)</option>
                <option value="Australia/Sydney">Sydney (AEST)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Category Settings */}
      {!compact && (
        <div className="space-y-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-400" />
            Notification Categories
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(category => (
              <div key={category.id} className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  <category.icon className={`h-5 w-5 ${category.color}`} />
                  {category.title}
                </h4>
                <div className="space-y-3">
                  {category.settings.map(setting => (
                    <SettingRow
                      key={setting.key}
                      label={setting.label}
                      description={setting.description}
                      checked={preferences[setting.key]}
                      onChange={(v) => updatePreference(setting.key, v)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

// Toggle Component
const Toggle = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
  </label>
);

// Setting Row Component
const SettingRow = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <div>
      <span className="text-gray-300 text-sm">{label}</span>
      {description && (
        <p className="text-gray-500 text-xs">{description}</p>
      )}
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
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

export default NotificationSettings;
