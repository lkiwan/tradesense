/**
 * Service Worker for Push Notifications
 * Handles background push events and notification clicks
 */

// Version for cache control
const SW_VERSION = '1.0.0';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker version:', SW_VERSION);
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated');
  event.waitUntil(clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {
    title: 'TradeSense',
    body: 'You have a new notification',
    icon: '/logo192.png',
    badge: '/badge-72x72.png',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        ...data,
        ...payload
      };
    } catch (e) {
      console.error('[SW] Failed to parse push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    tag: data.data?.type || 'default',
    renotify: true,
    actions: getActionsForType(data.data?.type)
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);

  event.notification.close();

  const data = event.notification.data || {};
  let url = '/dashboard';

  // Determine URL based on notification type
  switch (data.type) {
    case 'trade_executed':
    case 'trade_closed':
      url = '/dashboard/trades';
      break;
    case 'challenge_update':
    case 'challenge_passed':
    case 'challenge_failed':
      url = '/dashboard/challenges';
      break;
    case 'payout_requested':
    case 'payout_approved':
    case 'payout_rejected':
      url = '/dashboard/payouts';
      break;
    case 'new_follower':
      url = '/dashboard/followers';
      break;
    case 'copy_trade':
      url = '/dashboard/copy-trading';
      break;
    case 'new_idea_comment':
    case 'idea_liked':
      url = '/dashboard/ideas';
      break;
    case 'price_alert':
      url = '/dashboard/trading';
      break;
    case 'security_alert':
      url = '/dashboard/security';
      break;
    default:
      url = '/dashboard/notifications';
  }

  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case 'view':
        // Use default URL
        break;
      case 'dismiss':
        return;
      case 'settings':
        url = '/dashboard/settings/notifications';
        break;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new window if not
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// Helper function to get actions based on notification type
function getActionsForType(type) {
  const defaultActions = [
    { action: 'view', title: 'View' },
    { action: 'dismiss', title: 'Dismiss' }
  ];

  switch (type) {
    case 'trade_executed':
      return [
        { action: 'view', title: 'View Trade' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'challenge_passed':
      return [
        { action: 'view', title: 'View Challenge' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'payout_approved':
      return [
        { action: 'view', title: 'View Payout' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'new_follower':
      return [
        { action: 'view', title: 'View Profile' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'security_alert':
      return [
        { action: 'view', title: 'Review' },
        { action: 'settings', title: 'Settings' }
      ];
    default:
      return defaultActions;
  }
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
