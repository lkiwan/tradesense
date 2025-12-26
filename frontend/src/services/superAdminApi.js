import api from './api'

// ===========================================
// SuperAdmin System Configuration
// ===========================================
export const systemConfigAPI = {
  // Get all system configuration
  getConfig: () => api.get('/superadmin/config'),

  // Update system configuration
  updateConfig: (data) => api.put('/superadmin/config', data),

  // Get payment gateway settings
  getPaymentGateways: () => api.get('/superadmin/config/payment-gateways'),

  // Update payment gateway settings
  updatePaymentGateways: (data) => api.put('/superadmin/config/payment-gateways', data),

  // Get API keys (masked)
  getAPIKeys: () => api.get('/superadmin/config/api-keys'),

  // Update API keys
  updateAPIKeys: (data) => api.put('/superadmin/config/api-keys', data),

  // Get system config (new endpoints)
  getSystemConfig: () => api.get('/superadmin/config/system'),
  updateSystemConfig: (data) => api.put('/superadmin/config/system', data),
}

// ===========================================
// SuperAdmin Trading Configuration
// ===========================================
export const tradingConfigAPI = {
  // Get spread configuration
  getSpreadConfig: () => api.get('/superadmin/trading/spread-config'),

  // Update spread configuration
  updateSpreadConfig: (data) => api.put('/superadmin/trading/spread-config', data),

  // Get trade access control settings
  getTradeAccessControl: () => api.get('/superadmin/trading/access-control'),

  // Update trade access control
  updateTradeAccessControl: (data) => api.put('/superadmin/trading/access-control', data),

  // Get trading config (new endpoints)
  getTradingConfig: () => api.get('/superadmin/config/trading'),
  updateTradingConfig: (data) => api.put('/superadmin/config/trading'),
}

// ===========================================
// SuperAdmin Platform Control
// ===========================================
export const platformControlAPI = {
  // Get platform status
  getStatus: () => api.get('/superadmin/platform/status'),

  // Toggle maintenance mode
  toggleMaintenance: (enabled, message = null, endsAt = null) =>
    api.post('/superadmin/platform/maintenance', { enabled, message, ends_at: endsAt }),

  // Block all trading
  blockAllTrading: (message = null) => api.post('/superadmin/platform/block-all-trades', { message }),

  // Unblock trading
  unblockTrading: () => api.post('/superadmin/platform/unblock-trades'),

  // Toggle registration
  toggleRegistration: (enabled, message = null) =>
    api.post('/superadmin/platform/registration', { enabled, message }),

  // Get platform status (new endpoints)
  getPlatformStatus: () => api.get('/superadmin/config/platform'),
  updatePlatformStatus: (data) => api.put('/superadmin/config/platform', data),

  // Get system health
  getSystemHealth: () => api.get('/superadmin/config/health'),

  // Toggle maintenance
  setMaintenance: (data) => api.post('/superadmin/config/maintenance', data),

  // Feature flags
  getFeatureFlags: () => api.get('/superadmin/config/features'),
  toggleFeature: (feature, enabled) => api.put(`/superadmin/config/features/${feature}`, { enabled }),

  // Announcement
  getAnnouncement: () => api.get('/superadmin/config/announcement'),
  updateAnnouncement: (data) => api.put('/superadmin/config/announcement', data),
}

// ===========================================
// SuperAdmin Admin Management
// ===========================================
export const adminManagementAPI = {
  // Get all admins
  getAdmins: (params = {}) => api.get('/superadmin/admins', { params }),

  // Promote user to admin
  promoteToAdmin: (userId) => api.post(`/superadmin/admins/${userId}/promote`),

  // Demote admin to user
  demoteAdmin: (userId) => api.post(`/superadmin/admins/${userId}/demote`),

  // Get admin activity log
  getAdminActivity: (adminId, params = {}) =>
    api.get(`/superadmin/admins/${adminId}/activity`, { params }),

  // Get all admin activities
  getAllAdminActivities: (params = {}) => api.get('/superadmin/admins/activity', { params }),
}

// ===========================================
// SuperAdmin User Control
// ===========================================
export const userControlAPI = {
  // Search users
  searchUsers: (query) => api.get('/superadmin/advanced/users/search', { params: { q: query } }),

  // Get user details
  getUserDetails: (userId) => api.get(`/superadmin/advanced/users/${userId}/details`),

  // Get users list
  getUsers: (params = {}) => api.get('/admin/users', { params }),

  // Change user password
  changePassword: (userId, newPassword) =>
    api.put(`/superadmin/advanced/users/${userId}/password`, { password: newPassword }),

  // Change username
  changeUsername: (userId, newUsername) =>
    api.put(`/superadmin/advanced/users/${userId}/username`, { username: newUsername }),

  // Change email
  changeEmail: (userId, newEmail) =>
    api.put(`/superadmin/advanced/users/${userId}/email`, { email: newEmail }),

  // Reset 2FA
  reset2FA: (userId) => api.post(`/superadmin/advanced/users/${userId}/reset-2fa`),

  // Verify email manually
  verifyEmail: (userId) => api.post(`/superadmin/advanced/users/${userId}/verify-email`),

  // Revoke all sessions
  revokeSessions: (userId) => api.post(`/superadmin/advanced/users/${userId}/revoke-sessions`),

  // Unlock account
  unlockAccount: (userId) => api.post(`/superadmin/advanced/users/${userId}/unlock`),

  // Reset failed login attempts
  resetFailedLogins: (userId) => api.post(`/superadmin/advanced/users/${userId}/reset-failed-logins`),

  // Grant challenge access
  grantChallengeAccess: (userId, challengeData) =>
    api.post(`/superadmin/users/${userId}/challenge-access`, challengeData),

  // Revoke challenge access
  revokeChallengeAccess: (userId, challengeId) =>
    api.delete(`/superadmin/users/${userId}/challenge-access`, { data: { challenge_id: challengeId } }),

  // Freeze user
  freezeUser: (userId, hours, reason = null) =>
    api.post(`/superadmin/users/${userId}/freeze`, { hours, reason }),

  // Unfreeze user
  unfreezeUser: (userId) => api.post(`/superadmin/users/${userId}/unfreeze`),

  // Block user trading
  blockTrading: (userId, reason = null) =>
    api.post(`/superadmin/users/${userId}/trade-block`, { reason }),

  // Unblock user trading
  unblockTrading: (userId) => api.post(`/superadmin/users/${userId}/trade-unblock`),

  // Bulk actions
  bulkAction: (userIds, action, params = {}) =>
    api.post('/superadmin/advanced/bulk-action', { user_ids: userIds, action, params }),

  // Delete user (soft delete)
  deleteUser: (userId, reason = null) =>
    api.delete(`/superadmin/users/${userId}`, { data: { reason } }),
}

// ===========================================
// SuperAdmin Analytics
// ===========================================
export const analyticsAPI = {
  // Get deep revenue analytics
  getRevenueAnalytics: (params = {}) => api.get('/superadmin/analytics/revenue', { params }),

  // Get user cohort analysis
  getCohortAnalysis: (params = {}) => api.get('/superadmin/analytics/cohorts', { params }),

  // Get retention metrics
  getRetentionMetrics: (params = {}) => api.get('/superadmin/analytics/retention', { params }),

  // Get lifetime value analysis
  getLTVAnalysis: (params = {}) => api.get('/superadmin/analytics/ltv', { params }),

  // Get conversion funnel
  getConversionFunnel: (params = {}) => api.get('/superadmin/analytics/funnel', { params }),

  // Get churn analysis
  getChurnAnalysis: (params = {}) => api.get('/superadmin/analytics/churn', { params }),

  // Get predictions
  getPredictions: (params = {}) => api.get('/superadmin/analytics/predictions', { params }),
}

// ===========================================
// SuperAdmin Notifications
// ===========================================
export const notificationsAPI = {
  // Get notification templates
  getTemplates: () => api.get('/superadmin/notifications/templates'),

  // Create notification template
  createTemplate: (data) => api.post('/superadmin/notifications/templates', data),

  // Update notification template
  updateTemplate: (templateId, data) =>
    api.put(`/superadmin/notifications/templates/${templateId}`, data),

  // Delete notification template
  deleteTemplate: (templateId) => api.delete(`/superadmin/notifications/templates/${templateId}`),

  // Send notification to specific users (uses advanced endpoint)
  send: (data) => api.post('/superadmin/advanced/notifications/send', data),

  // Send notification to specific users
  sendNotification: (data) => api.post('/superadmin/advanced/notifications/send', data),

  // Broadcast notification to all users
  broadcastNotification: (data) => api.post('/superadmin/notifications/broadcast', data),

  // Get notification history (uses advanced endpoint)
  getHistory: (params = {}) => api.get('/superadmin/advanced/notifications/history', { params }),

  // Get notification history
  getNotificationHistory: (params = {}) => api.get('/superadmin/advanced/notifications/history', { params }),

  // Get notification detail
  getNotification: (notificationId) => api.get(`/superadmin/advanced/notifications/${notificationId}`),
}

// ===========================================
// SuperAdmin Security
// ===========================================
export const securityAPI = {
  // Get extended audit logs
  getAuditLogs: (params = {}) => api.get('/superadmin/security/audit-logs', { params }),

  // Get login activity monitoring
  getLoginActivity: (params = {}) => api.get('/superadmin/security/login-activity', { params }),

  // Get suspicious activity alerts
  getSuspiciousActivity: (params = {}) => api.get('/superadmin/security/suspicious', { params }),

  // Get security events timeline
  getSecurityEvents: (params = {}) => api.get('/superadmin/security/events', { params }),

  // Block IP address
  blockIP: (ipAddress, reason = null, expiresAt = null) =>
    api.post('/superadmin/security/ip-block', { ip_address: ipAddress, reason, expires_at: expiresAt }),

  // Unblock IP address
  unblockIP: (ipAddress) => api.delete(`/superadmin/security/ip-block/${ipAddress}`),

  // Get blocked IPs
  getBlockedIPs: (params = {}) => api.get('/superadmin/security/blocked-ips', { params }),
}

// ===========================================
// Convenience methods for config pages
// ===========================================
const superAdminApi = {
  // System Configuration
  getSystemConfig: () => api.get('/superadmin/config/system'),
  updateSystemConfig: (data) => api.put('/superadmin/config/system', data),

  // Trading Configuration
  getTradingConfig: () => api.get('/superadmin/config/trading'),
  updateTradingConfig: (data) => api.put('/superadmin/config/trading', data),

  // Platform Control
  getPlatformStatus: () => api.get('/superadmin/config/platform'),
  updatePlatformStatus: (data) => api.put('/superadmin/config/platform', data),
  getSystemHealth: () => api.get('/superadmin/config/health'),

  // All APIs
  system: systemConfigAPI,
  trading: tradingConfigAPI,
  platform: platformControlAPI,
  admins: adminManagementAPI,
  users: userControlAPI,
  analytics: analyticsAPI,
  notifications: notificationsAPI,
  security: securityAPI,
}

// ===========================================
// Export all as default
// ===========================================
export default superAdminApi
