import api from './api'

// ===========================================
// Admin Dashboard Statistics
// ===========================================
export const adminStatsAPI = {
  getDashboardStats: () => api.get('/admin/superadmin/stats'),
  getUserGrowth: (period = '30d') => api.get('/admin/stats/user-growth', { params: { period } }),
  getRevenueTrend: (period = '30d') => api.get('/admin/stats/revenue-trend', { params: { period } }),
  getChallengeStats: () => api.get('/admin/stats/challenges'),
}

// ===========================================
// Admin User Management
// ===========================================
export const adminUsersAPI = {
  // List users with filters
  getUsers: (params = {}) => api.get('/admin/users', { params }),

  // Get single user details
  getUser: (userId) => api.get(`/admin/users/${userId}`),

  // Update user
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),

  // Ban user
  banUser: (userId, data) => api.post(`/admin/users/${userId}/ban`, data),

  // Unban user
  unbanUser: (userId) => api.post(`/admin/users/${userId}/unban`),

  // Freeze user (temporary restriction)
  freezeUser: (userId, hours, reason) => api.post(`/admin/users/${userId}/freeze`, { hours, reason }),

  // Unfreeze user
  unfreezeUser: (userId) => api.post(`/admin/users/${userId}/unfreeze`),

  // Verify user email (admin manually verifies)
  verifyEmail: (userId) => api.post(`/admin/users/${userId}/verify-email`),

  // Reset user's 2FA
  reset2FA: (userId) => api.post(`/admin/users/${userId}/reset-2fa`),

  // Unlock user account (reset failed login attempts)
  unlockAccount: (userId) => api.post(`/admin/users/${userId}/unlock`),

  // Change user password (superadmin only)
  changePassword: (userId, newPassword) => api.put(`/admin/users/${userId}/password`, { new_password: newPassword }),

  // Block user trading (superadmin only)
  blockTrading: (userId, reason) => api.post(`/admin/users/${userId}/trade-block`, { reason }),

  // Unblock user trading (superadmin only)
  unblockTrading: (userId) => api.post(`/admin/users/${userId}/trade-unblock`),

  // Get user activity log
  getUserActivity: (userId, params = {}) => api.get(`/admin/users/${userId}/activity`, { params }),

  // Get user sessions
  getUserSessions: (userId) => api.get(`/admin/users/${userId}/sessions`),

  // Revoke all user sessions
  revokeUserSessions: (userId) => api.post(`/admin/users/${userId}/revoke-sessions`),
}

// ===========================================
// Admin Challenge Management
// ===========================================
export const adminChallengesAPI = {
  // List challenges with filters
  getChallenges: (params = {}) => api.get('/admin/challenges', { params }),

  // Get single challenge details
  getChallenge: (challengeId) => api.get(`/admin/challenges/${challengeId}`),

  // Get challenge statistics
  getChallengeStats: () => api.get('/admin/challenges/stats'),

  // Get all challenge models (for grant challenge dropdown)
  getChallengeModels: () => api.get('/admin/challenges/models'),

  // Grant challenge to user (create challenge for user)
  grantChallenge: (data) => api.post('/admin/challenges/grant', data),

  // Edit challenge (superadmin only - edit any field)
  editChallenge: (challengeId, data) => api.put(`/admin/challenges/${challengeId}/edit`, data),

  // Adjust challenge balance
  adjustBalance: (challengeId, amount, type, reason) =>
    api.post(`/admin/challenges/${challengeId}/adjust-balance`, { amount, type, reason }),

  // Update challenge status
  updateChallengeStatus: (challengeId, status, reason = null) =>
    api.put(`/admin/challenges/${challengeId}/status`, { status, reason }),

  // Reset challenge
  resetChallenge: (challengeId) => api.post(`/admin/challenges/${challengeId}/reset`),

  // Get challenge trades
  getChallengeTrades: (challengeId, params = {}) =>
    api.get(`/admin/challenges/${challengeId}/trades`, { params }),

  // Delete a trade
  deleteTrade: (challengeId, tradeId, reason) =>
    api.delete(`/admin/challenges/${challengeId}/trades/${tradeId}`, { data: { reason } }),
}

// ===========================================
// Admin Financial Management
// ===========================================
export const adminFinancialAPI = {
  // Get financial overview
  getOverview: (params = {}) => api.get('/admin/financial/overview', { params }),

  // Get all payments
  getPayments: (params = {}) => api.get('/admin/payments', { params }),

  // Get revenue by plan
  getRevenueByPlan: (params = {}) => api.get('/admin/financial/revenue-by-plan', { params }),

  // Get revenue trends
  getRevenueTrends: (params = {}) => api.get('/admin/financial/revenue-trends', { params }),

  // Get payouts
  getPayouts: (params = {}) => api.get('/admin/payouts', { params }),

  // Approve payout
  approvePayout: (payoutId) => api.put(`/admin/payouts/${payoutId}/approve`),

  // Process payout (mark as paid)
  processPayout: (payoutId, data) => api.put(`/admin/payouts/${payoutId}/process`, data),

  // Reject payout
  rejectPayout: (payoutId, reason) => api.put(`/admin/payouts/${payoutId}/reject`, { reason }),
}

// ===========================================
// Admin Support Tickets
// ===========================================
export const adminTicketsAPI = {
  // List tickets
  getTickets: (params = {}) => api.get('/admin/tickets', { params }),

  // Get single ticket
  getTicket: (ticketId) => api.get(`/admin/tickets/${ticketId}`),

  // Assign ticket
  assignTicket: (ticketId, adminId) => api.put(`/admin/tickets/${ticketId}/assign`, { admin_id: adminId }),

  // Update ticket status
  updateTicketStatus: (ticketId, status) => api.put(`/admin/tickets/${ticketId}/status`, { status }),

  // Update ticket priority
  updateTicketPriority: (ticketId, priority) => api.put(`/admin/tickets/${ticketId}/priority`, { priority }),

  // Respond to ticket
  respondToTicket: (ticketId, message, isInternal = false) =>
    api.post(`/admin/tickets/${ticketId}/respond`, { message, is_internal: isInternal }),

  // Get ticket stats
  getTicketStats: () => api.get('/admin/tickets/stats'),
}

// ===========================================
// Admin Audit Logs
// ===========================================
export const adminAuditAPI = {
  // Get audit logs
  getLogs: (params = {}) => api.get('/admin/audit-logs', { params }),

  // Get recent security events
  getSecurityEvents: (params = {}) => api.get('/admin/security-events', { params }),
}

// ===========================================
// Admin KYC Management
// ===========================================
export const adminKYCAPI = {
  // Get pending KYC submissions
  getPendingKYC: (params = {}) => api.get('/admin/kyc/pending', { params }),

  // Get KYC details
  getKYC: (userId) => api.get(`/admin/kyc/${userId}`),

  // Approve KYC
  approveKYC: (userId, tier, notes = null) => api.post(`/admin/kyc/${userId}/approve`, { tier, notes }),

  // Reject KYC
  rejectKYC: (userId, reason) => api.post(`/admin/kyc/${userId}/reject`, { reason }),

  // Request more documents
  requestDocuments: (userId, documents, message) =>
    api.post(`/admin/kyc/${userId}/request-documents`, { documents, message }),
}

// ===========================================
// Admin Permissions Management (RBAC)
// ===========================================
export const adminPermissionsAPI = {
  // Get all permission categories and available permissions
  getCategories: () => api.get('/admin/permissions/categories'),

  // Get current user's permissions
  getMyPermissions: () => api.get('/admin/permissions/my-permissions'),

  // Get all admins with their permissions
  getAdmins: () => api.get('/admin/permissions/admins'),

  // Get specific user's permissions
  getUserPermissions: (userId) => api.get(`/admin/permissions/users/${userId}`),

  // Grant permission to user
  grantPermission: (userId, permission, expiresAt = null, notes = null) =>
    api.post(`/admin/permissions/users/${userId}/grant`, { permission, expires_at: expiresAt, notes }),

  // Revoke permission from user
  revokePermission: (userId, permission) =>
    api.post(`/admin/permissions/users/${userId}/revoke`, { permission }),

  // Grant default permissions for user's role
  grantDefaultPermissions: (userId) =>
    api.post(`/admin/permissions/users/${userId}/grant-defaults`),

  // Bulk update permissions (grant/revoke multiple)
  bulkUpdatePermissions: (userId, grant = [], revoke = []) =>
    api.post(`/admin/permissions/users/${userId}/bulk`, { grant, revoke }),

  // Check if current user has specific permissions
  checkPermissions: (permissions, mode = 'all') =>
    api.post('/admin/permissions/check', { permissions, mode }),

  // ===== Role Management =====

  // Get all roles
  getRoles: () => api.get('/admin/permissions/roles'),

  // Create new role
  createRole: (data) => api.post('/admin/permissions/roles', data),

  // Update role
  updateRole: (roleId, data) => api.put(`/admin/permissions/roles/${roleId}`, data),

  // Delete role
  deleteRole: (roleId) => api.delete(`/admin/permissions/roles/${roleId}`),

  // ===== User Role Assignment =====

  // Get user's roles
  getUserRoles: (userId) => api.get(`/admin/permissions/users/${userId}/roles`),

  // Assign role to user
  assignRole: (userId, roleId) => api.post(`/admin/permissions/users/${userId}/roles`, { role_id: roleId }),

  // Remove role from user
  removeRole: (userId, roleId) => api.delete(`/admin/permissions/users/${userId}/roles/${roleId}`),

  // Initialize default roles (superadmin only)
  initializeRoles: () => api.post('/admin/permissions/initialize'),
}

// ===========================================
// Export all as default
// ===========================================
export default {
  stats: adminStatsAPI,
  users: adminUsersAPI,
  challenges: adminChallengesAPI,
  financial: adminFinancialAPI,
  tickets: adminTicketsAPI,
  audit: adminAuditAPI,
  kyc: adminKYCAPI,
  permissions: adminPermissionsAPI,
}
