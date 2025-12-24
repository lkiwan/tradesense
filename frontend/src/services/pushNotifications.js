/**
 * Push Notification Service
 * Handles Web Push notifications registration and management
 */

import api from './api';

class PushNotificationService {
  constructor() {
    this.swRegistration = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Check if notifications are supported and permitted
   */
  async checkPermission() {
    if (!this.isSupported) {
      return { supported: false, permission: 'unsupported' };
    }
    return {
      supported: true,
      permission: Notification.permission
    };
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }
    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Get VAPID public key from server
   */
  async getVapidPublicKey() {
    try {
      const response = await api.get('/api/notifications/vapid-key');
      return response.data.vapid_public_key;
    } catch (error) {
      console.error('Failed to get VAPID key:', error);
      return null;
    }
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!this.isSupported) {
      throw new Error('Service workers are not supported');
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.swRegistration);
      return this.swRegistration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe() {
    if (!this.swRegistration) {
      await this.registerServiceWorker();
    }

    const vapidPublicKey = await this.getVapidPublicKey();
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not available');
    }

    try {
      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Send subscription to server
      await this.registerDevice(subscription);

      console.log('Push subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    if (!this.swRegistration) {
      return;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }

  /**
   * Register device with backend
   */
  async registerDevice(subscription) {
    const deviceInfo = this.getDeviceInfo();

    try {
      const response = await api.post('/api/notifications/devices/register', {
        subscription: subscription.toJSON(),
        device_token: subscription.endpoint.slice(-50),
        platform: 'web',
        ...deviceInfo
      });
      return response.data;
    } catch (error) {
      console.error('Failed to register device:', error);
      throw error;
    }
  }

  /**
   * Get registered devices
   */
  async getDevices() {
    try {
      const response = await api.get('/api/notifications/devices');
      return response.data.devices;
    } catch (error) {
      console.error('Failed to get devices:', error);
      return [];
    }
  }

  /**
   * Unregister device
   */
  async unregisterDevice(deviceId) {
    try {
      await api.delete(`/api/notifications/devices/${deviceId}`);
      return true;
    } catch (error) {
      console.error('Failed to unregister device:', error);
      return false;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences() {
    try {
      const response = await api.get('/api/notifications/preferences');
      return response.data.preferences;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return null;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences) {
    try {
      const response = await api.put('/api/notifications/preferences', preferences);
      return response.data.preferences;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(page = 1, perPage = 20, unreadOnly = false) {
    try {
      const response = await api.get('/api/notifications/history', {
        params: { page, per_page: perPage, unread_only: unreadOnly }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get notification history:', error);
      return { notifications: [], pagination: {} };
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds = []) {
    try {
      const response = await api.post('/api/notifications/mark-read', {
        notification_ids: notificationIds
      });
      return response.data;
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount() {
    try {
      const response = await api.get('/api/notifications/unread-count');
      return response.data.unread_count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification() {
    try {
      const response = await api.post('/api/notifications/test');
      return response.data;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * Get device info from browser
   */
  getDeviceInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect browser
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('Opera')) browser = 'Opera';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    return {
      device_name: `${browser} on ${os}`,
      browser,
      os
    };
  }

  /**
   * Convert base64 VAPID key to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Show local notification (for testing)
   */
  showLocalNotification(title, options = {}) {
    if (!this.isSupported || Notification.permission !== 'granted') {
      return;
    }

    const defaultOptions = {
      icon: '/logo192.png',
      badge: '/badge-72x72.png',
      vibrate: [200, 100, 200],
      ...options
    };

    if (this.swRegistration) {
      this.swRegistration.showNotification(title, defaultOptions);
    } else {
      new Notification(title, defaultOptions);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
