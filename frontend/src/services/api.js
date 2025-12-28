import axios from 'axios'
import { logError } from '../utils/errorHandler'

// Ensure API_URL ends with /api
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
if (API_URL && !API_URL.endsWith('/api')) {
  API_URL = API_URL.replace(/\/$/, '') + '/api'
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add auth token, session token, and fix API paths
api.interceptors.request.use(
  (config) => {
    // Remove /api prefix from URL since baseURL already includes /api
    // Handle all variations: /api/, api/, /api, api
    if (config.url) {
      // Remove leading /api/ or api/ to prevent double /api/api/
      config.url = config.url.replace(/^\/?api\//, '/')
      // Ensure URL starts with / for proper concatenation
      if (!config.url.startsWith('/') && !config.url.startsWith('http')) {
        config.url = '/' + config.url
      }
    }

    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add session token for session management
    const sessionToken = localStorage.getItem('session_token')
    if (sessionToken) {
      config.headers['X-Session-Token'] = sessionToken
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Track if we're already handling a 401 to prevent loops
let isRefreshing = false
let isRedirecting = false

// Rate limit state for UI components
export const rateLimitState = {
  isLimited: false,
  retryAfter: 0,
  resetTime: null,
  endpoint: null
}

// Response interceptor - handle token refresh, rate limits, and log errors
api.interceptors.response.use(
  (response) => {
    // Extract rate limit headers for monitoring
    const remaining = response.headers['x-ratelimit-remaining']
    const limit = response.headers['x-ratelimit-limit']
    const reset = response.headers['x-ratelimit-reset']

    if (remaining !== undefined) {
      // Store rate limit info for components that need it
      response.rateLimitInfo = {
        remaining: parseInt(remaining, 10),
        limit: parseInt(limit, 10),
        reset: reset ? new Date(parseInt(reset, 10) * 1000) : null
      }
    }

    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Log error in development
    logError(error, `API ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`)

    // Handle rate limit errors (429)
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || error.response.data?.retry_after || 60, 10)

      // Update rate limit state
      rateLimitState.isLimited = true
      rateLimitState.retryAfter = retryAfter
      rateLimitState.resetTime = new Date(Date.now() + retryAfter * 1000)
      rateLimitState.endpoint = originalRequest?.url

      // Dispatch custom event for UI components
      window.dispatchEvent(new CustomEvent('rateLimitExceeded', {
        detail: {
          retryAfter,
          endpoint: originalRequest?.url,
          message: error.response.data?.message || 'Too many requests. Please wait.'
        }
      }))

      // Clear rate limit state after timeout
      setTimeout(() => {
        rateLimitState.isLimited = false
        rateLimitState.retryAfter = 0
        rateLimitState.resetTime = null
        rateLimitState.endpoint = null
      }, retryAfter * 1000)

      return Promise.reject(error)
    }

    // Skip redirect handling for auth endpoints to prevent loops
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/')

    // If 401 and not a retry, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken && !isAuthEndpoint) {
        isRefreshing = true
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`
            }
          })

          const { access_token } = response.data
          localStorage.setItem('access_token', access_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          isRefreshing = false
          return api(originalRequest)
        } catch (refreshError) {
          isRefreshing = false
          // Refresh failed, logout user
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          // Only redirect if not already on login page and not already redirecting
          if (!isRedirecting && !window.location.pathname.includes('/login')) {
            isRedirecting = true
            window.location.href = '/login'
          }
        }
      } else if (!isAuthEndpoint && !isRedirecting) {
        // No refresh token, clear any stale tokens and redirect
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (!window.location.pathname.includes('/login')) {
          isRedirecting = true
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

// API helper functions
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data)
}

export const challengesAPI = {
  getAll: () => api.get('/api/challenges'),
  getActive: () => api.get('/api/challenges/active'),
  getById: (id) => api.get(`/api/challenges/${id}`),
  getStats: (id) => api.get(`/api/challenges/${id}/stats`),
  getExtendedStats: (id) => api.get(`/api/challenges/${id}/stats/extended`),
  // Trial endpoints
  activateTrial: () => api.post('/api/challenges/activate-trial'),
  checkTrial: () => api.get('/api/challenges/check-trial')
}

export const tradesAPI = {
  getAll: (challengeId) => api.get('/api/trades', { params: { challenge_id: challengeId } }),
  open: (data) => api.post('/api/trades/open', data),
  close: (tradeId) => api.post(`/api/trades/${tradeId}/close`),
  getById: (id) => api.get(`/api/trades/${id}`),
  getOpenPnL: () => api.get('/api/trades/open/pnl')
}

export const marketAPI = {
  getPrice: (symbol) => api.get(`/api/market/price/${symbol}`),
  getAllPrices: (category, sector = null) => api.get('/api/market/prices', { params: { category, sector } }),
  getHistory: (symbol, period, interval) =>
    api.get(`/api/market/history/${symbol}`, { params: { period, interval } }),
  getSignal: (symbol) => api.get(`/api/market/signal/${symbol}`),
  getAllSignals: (symbols) =>
    api.get('/api/market/signals', { params: { symbols: symbols.join(',') } }),
  getMarketStatus: () => api.get('/api/market/status'),

  // Enhanced Moroccan market endpoints (78 stocks)
  getMoroccanSectors: () => api.get('/api/market/moroccan/sectors'),
  getMoroccanInfo: (symbol) => api.get(`/api/market/moroccan/info/${symbol}`),
  getMoroccanPrices: (sector = null) => api.get('/api/market/prices', { params: { category: 'moroccan', sector } })
}

export const paymentsAPI = {
  getPlans: () => api.get('/payments/plans'),
  createCheckout: (planType, paymentMethod) =>
    api.post('/payments/checkout', { plan_type: planType, payment_method: paymentMethod }),
  createChallengeCheckout: (data) =>
    api.post('/payments/challenge-checkout', data),
  processPayment: (paymentId, paypalOrderId) =>
    api.post('/payments/process', { payment_id: paymentId, paypal_order_id: paypalOrderId }),
  getHistory: () => api.get('/payments/history')
}

export const leaderboardAPI = {
  getLeaderboard: (limit, period) =>
    api.get('/leaderboard', { params: { limit, period } }),
  getStats: () => api.get('/leaderboard/stats'),
  getUserRank: (userId) => api.get(`/leaderboard/user/${userId}`)
}

// Challenge Models API (multi-model system)
export const challengeModelsAPI = {
  // Get all active challenge models with account sizes
  getAll: () => api.get('/challenge-models'),
  // Get a specific model by ID
  getById: (id) => api.get(`/challenge-models/${id}`),
  // Get a model by name
  getByName: (name) => api.get(`/challenge-models/by-name/${name}`),
  // Get account sizes for a model
  getSizes: (modelId) => api.get(`/challenge-models/${modelId}/sizes`),
  // Get comparison data for all models
  compare: () => api.get('/challenge-models/compare'),
  // Admin endpoints
  adminGetAll: () => api.get('/challenge-models/admin'),
  adminCreate: (data) => api.post('/challenge-models/admin', data),
  adminUpdate: (modelId, data) => api.put(`/challenge-models/admin/${modelId}`, data),
  adminAddSize: (modelId, data) => api.post(`/challenge-models/admin/${modelId}/sizes`, data),
  adminUpdateSize: (sizeId, data) => api.put(`/challenge-models/admin/sizes/${sizeId}`, data),
  adminDeleteSize: (sizeId) => api.delete(`/challenge-models/admin/sizes/${sizeId}`)
}

export const adminAPI = {
  getUsers: (page, perPage, search) =>
    api.get('/admin/users', { params: { page, per_page: perPage, search } }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  getChallenges: (page, perPage, status) =>
    api.get('/admin/challenges', { params: { page, per_page: perPage, status } }),
  updateChallengeStatus: (challengeId, status, reason) =>
    api.put(`/admin/challenges/${challengeId}/status`, { status, reason }),
  getTrades: (page, perPage, challengeId) =>
    api.get('/admin/trades', { params: { page, per_page: perPage, challenge_id: challengeId } }),
  getPayments: (page, perPage, status) =>
    api.get('/admin/payments', { params: { page, per_page: perPage, status } })
}

export const superAdminAPI = {
  getSettings: () => api.get('/admin/superadmin/settings'),
  updateSettings: (data) => api.put('/admin/superadmin/settings', data),
  updatePayPal: (data) => api.put('/admin/superadmin/settings/paypal', data),
  updateGemini: (data) => api.put('/admin/superadmin/settings/gemini', data),
  getAdmins: () => api.get('/admin/superadmin/admins'),
  promoteAdmin: (userId) => api.post(`/admin/superadmin/admins/${userId}/promote`),
  demoteAdmin: (userId) => api.post(`/admin/superadmin/admins/${userId}/demote`),
  getStats: () => api.get('/admin/superadmin/stats')
}

// Payout API for funded trader withdrawals
export const payoutsAPI = {
  // Get user's payout history
  getPayouts: () => api.get('/payouts'),

  // Get available balance for withdrawal
  getBalance: () => api.get('/payouts/balance'),

  // Request a withdrawal
  requestPayout: (amount, paymentMethod, paypalEmail) =>
    api.post('/payouts/request', {
      amount,
      payment_method: paymentMethod,
      paypal_email: paypalEmail
    }),

  // Admin: Get pending payouts
  adminGetPending: (page, perPage) =>
    api.get('/payouts/admin/pending', { params: { page, per_page: perPage } }),

  // Admin: Approve payout
  adminApprove: (payoutId) =>
    api.put(`/payouts/admin/${payoutId}/approve`),

  // Admin: Process (mark as paid)
  adminProcess: (payoutId, transactionId) =>
    api.put(`/payouts/admin/${payoutId}/process`, { transaction_id: transactionId }),

  // Admin: Reject payout
  adminReject: (payoutId, reason) =>
    api.put(`/payouts/admin/${payoutId}/reject`, { reason })
}

// Subscription API for auto-charge trial system
export const subscriptionsAPI = {
  // Get available plans for trial signup
  getPlans: () => api.get('/subscriptions/plans'),

  // Start trial with PayPal billing agreement
  startTrial: (selectedPlan, returnUrl, cancelUrl) =>
    api.post('/subscriptions/trial/start', {
      selected_plan: selectedPlan,
      return_url: returnUrl,
      cancel_url: cancelUrl
    }),

  // Confirm trial after PayPal approval
  confirmTrial: (token) =>
    api.post('/subscriptions/trial/confirm', { token }),

  // Cancel trial before it ends
  cancelTrial: () =>
    api.post('/subscriptions/trial/cancel'),

  // Get current trial/subscription status
  getStatus: () =>
    api.get('/subscriptions/trial/status')
}

// Referrals API
export const referralsAPI = {
  // Generate referral code
  generateCode: () => api.post('/referrals/generate-code'),

  // Get user's referral code
  getMyCode: () => api.get('/referrals/my-code'),

  // Get referral statistics
  getStats: () => api.get('/referrals/stats'),

  // Get referral history
  getHistory: (page = 1, perPage = 10) =>
    api.get('/referrals/history', { params: { page, per_page: perPage } }),

  // Apply referral code
  applyCode: (referralCode, userId) =>
    api.post('/referrals/apply', { referral_code: referralCode, user_id: userId }),

  // Validate referral code
  validateCode: (code) => api.get(`/referrals/validate/${code}`)
}

// Points API
export const pointsAPI = {
  // Get user's points balance
  getBalance: () => api.get('/points/balance'),

  // Get points transaction history
  getHistory: (page = 1, perPage = 20, type = null) =>
    api.get('/points/history', { params: { page, per_page: perPage, type } }),

  // Get available point-earning activities
  getActivities: () => api.get('/points/activities'),

  // Get points leaderboard
  getLeaderboard: (period = 'all') =>
    api.get('/points/leaderboard', { params: { period } }),

  // Award points for an activity
  awardPoints: (transactionType, description = null, referenceId = null, referenceType = null) =>
    api.post('/points/award', {
      transaction_type: transactionType,
      description,
      reference_id: referenceId,
      reference_type: referenceType
    }),

  // Claim daily login points
  claimDailyLogin: () => api.post('/points/daily-login')
}

// Support Tickets API
export const ticketsAPI = {
  // Create a new ticket
  create: (subject, message, category = 'general', priority = 'medium') =>
    api.post('/tickets', { subject, message, category, priority }),

  // Get user's tickets
  getAll: (page = 1, perPage = 10, status = null, category = null) =>
    api.get('/tickets', { params: { page, per_page: perPage, status, category } }),

  // Get a specific ticket with messages
  getById: (ticketId) => api.get(`/tickets/${ticketId}`),

  // Add a message to a ticket
  addMessage: (ticketId, message, isInternal = false) =>
    api.post(`/tickets/${ticketId}/messages`, { message, is_internal: isInternal }),

  // Close a ticket
  close: (ticketId) => api.put(`/tickets/${ticketId}/close`),

  // Reopen a ticket
  reopen: (ticketId) => api.put(`/tickets/${ticketId}/reopen`),

  // Admin: Assign ticket
  assign: (ticketId, assigneeId = null) =>
    api.put(`/tickets/${ticketId}/assign`, { assignee_id: assigneeId }),

  // Admin: Update status
  updateStatus: (ticketId, status) =>
    api.put(`/tickets/${ticketId}/status`, { status }),

  // Admin: Update priority
  updatePriority: (ticketId, priority) =>
    api.put(`/tickets/${ticketId}/priority`, { priority })
}

// Resources API
export const resourcesAPI = {
  // Get all resources
  getAll: (category = null, search = null, featured = false) =>
    api.get('/resources', { params: { category, search, featured } }),

  // Get a specific resource
  getById: (resourceId) => api.get(`/resources/${resourceId}`),

  // Record a download
  download: (resourceId) => api.post(`/resources/${resourceId}/download`),

  // Get economic calendar events (multi-source: Investing.com, ForexFactory, Moroccan, DB)
  getCalendarEvents: (date = null, impact = null, currency = null) =>
    api.get('/resources/calendar', { params: { date, impact, currency } }),

  // Get week's economic events
  getWeekEvents: (impact = null) =>
    api.get('/resources/calendar/week', { params: { impact } }),

  // Get upcoming high-impact events
  getUpcomingEvents: (hours = 24) =>
    api.get('/resources/calendar/upcoming', { params: { hours } }),

  // Get available currencies for filtering
  getCalendarCurrencies: () =>
    api.get('/resources/calendar/currencies'),

  // Admin: Sync calendar from external sources
  syncCalendar: () =>
    api.post('/resources/calendar/sync'),

  // Admin: Create resource
  create: (data) => api.post('/resources', data),

  // Admin: Update resource
  update: (resourceId, data) => api.put(`/resources/${resourceId}`, data),

  // Admin: Delete resource
  delete: (resourceId) => api.delete(`/resources/${resourceId}`),

  // Admin: Create calendar event
  createCalendarEvent: (data) => api.post('/resources/calendar', data),

  // Admin: Update calendar event
  updateCalendarEvent: (eventId, data) => api.put(`/resources/calendar/${eventId}`, data)
}

// Enhanced Signals API (technical + sentiment)
export const signalsAPI = {
  // Get technical signal for a symbol
  getTechnical: (symbol) =>
    api.get(`/signals/technical/${symbol}`),

  // Get sentiment signal for a symbol
  getSentiment: (symbol) =>
    api.get(`/signals/sentiment/${symbol}`),

  // Get combined technical + sentiment signal
  getCombined: (symbol) =>
    api.get(`/signals/combined/${symbol}`),

  // Get all indicators for a symbol
  getIndicators: (symbol) =>
    api.get(`/signals/indicators/${symbol}`),

  // Get overall market sentiment
  getMarketSentiment: (market = 'all') =>
    api.get('/signals/market-sentiment', { params: { market } }),

  // Get batch signals for multiple symbols
  getBatch: (symbols) =>
    api.post('/signals/batch', { symbols }),

  // Get signal history
  getHistory: (limit = 20, status = null, symbol = null) =>
    api.get('/signals/history', { params: { limit, status, symbol } }),

  // Get active signals
  getActive: () =>
    api.get('/signals/active'),

  // Get performance stats
  getStats: (days = 30) =>
    api.get('/signals/stats', { params: { days } }),

  // Get signal leaderboard
  getLeaderboard: (days = 30, limit = 10) =>
    api.get('/signals/leaderboard', { params: { days, limit } }),

  // Record a new signal
  record: (data) =>
    api.post('/signals/record', data),

  // Update signal outcome
  update: (signalId, currentPrice, status = null) =>
    api.put(`/signals/${signalId}/update`, { current_price: currentPrice, status }),

  // Demo endpoints (no auth)
  demoTechnical: (symbol) =>
    api.get(`/signals/demo/technical/${symbol}`),

  demoIndicators: (symbol) =>
    api.get(`/signals/demo/indicators/${symbol}`)
}

// News API (multi-source news aggregation)
export const newsAPI = {
  // Get aggregated news from all sources
  getNews: (market = 'all', category = null, limit = 20, sentiment = null) =>
    api.get('/news', { params: { market, category, limit, sentiment } }),

  // Get breaking news (last 2 hours)
  getBreaking: (limit = 5) =>
    api.get('/news/breaking', { params: { limit } }),

  // Get news for a specific symbol
  getBySymbol: (symbol, limit = 10) =>
    api.get(`/news/symbol/${symbol}`, { params: { limit } }),

  // Get market sentiment summary
  getSummary: () =>
    api.get('/news/summary'),

  // Get available markets (public)
  getMarkets: () =>
    api.get('/news/markets'),

  // Get sentiment types (public)
  getSentiments: () =>
    api.get('/news/sentiments')
}

// Forex API (currency pairs and rates)
export const forexAPI = {
  // Get all forex pairs with prices
  getPairs: (type = 'all') =>
    api.get('/forex/pairs', { params: { type } }),

  // Get single pair price
  getPair: (symbol) =>
    api.get(`/forex/pair/${symbol}`),

  // Get pair metadata
  getPairInfo: (symbol) =>
    api.get(`/forex/pair/${symbol}/info`),

  // Get historical data
  getHistory: (symbol, period = '1mo') =>
    api.get(`/forex/pair/${symbol}/history`, { params: { period } }),

  // Get market summary (top gainers/losers)
  getSummary: () =>
    api.get('/forex/summary'),

  // Get MAD pairs only
  getMADPairs: () =>
    api.get('/forex/mad'),

  // Get major pairs only
  getMajorPairs: () =>
    api.get('/forex/majors'),

  // Currency conversion
  convert: (from, to, amount = 1) =>
    api.get('/forex/convert', { params: { from, to, amount } }),

  // Get available symbols (public)
  getSymbols: () =>
    api.get('/forex/symbols'),

  // Get market status (public)
  getStatus: () =>
    api.get('/forex/status')
}

// Session Management API
export const sessionsAPI = {
  // Get all active sessions
  getAll: () => api.get('/auth/sessions'),

  // Get current session
  getCurrent: () => api.get('/auth/sessions/current'),

  // Revoke a specific session
  revoke: (sessionId) => api.post(`/auth/sessions/${sessionId}/revoke`),

  // Revoke all other sessions
  revokeAll: () => api.post('/auth/sessions/revoke-all')
}

// Two-Factor Authentication API
export const twoFactorAPI = {
  // Get 2FA status
  getStatus: () => api.get('/auth/2fa/status'),

  // Initialize 2FA setup (returns QR code and backup codes)
  setup: () => api.post('/auth/2fa/setup'),

  // Confirm 2FA setup with initial token
  confirm: (token) => api.post('/auth/2fa/confirm', { token }),

  // Verify 2FA token during login
  verify: (token) => api.post('/auth/2fa/verify', { token }),

  // Disable 2FA
  disable: (token) => api.post('/auth/2fa/disable', { token }),

  // Get remaining backup codes count
  getBackupCodesCount: () => api.get('/auth/2fa/backup-codes'),

  // Regenerate backup codes
  regenerateBackupCodes: (token) => api.post('/auth/2fa/backup-codes/regenerate', { token }),

  // Check if 2FA is required
  isRequired: () => api.get('/auth/2fa/required'),

  // Login with 2FA token
  loginWith2FA: (email, password, twoFaToken) =>
    api.post('/auth/login', { email, password, two_fa_token: twoFaToken })
}

// Offers API
export const offersAPI = {
  // Get active offers
  getActive: () => api.get('/offers/active'),

  // Get featured offers
  getFeatured: () => api.get('/offers/featured'),

  // Validate an offer code
  validateCode: (code, amount = 0) =>
    api.get(`/offers/validate/${code}`, { params: { amount } }),

  // Apply an offer
  apply: (code, amount, paymentId = null) =>
    api.post('/offers/apply', { code, amount, payment_id: paymentId }),

  // Get user's offers (available and used)
  getMyOffers: () => api.get('/offers/my-offers'),

  // Admin: Get all offers
  getAll: (includeInactive = false) =>
    api.get('/offers', { params: { include_inactive: includeInactive } }),

  // Admin: Create offer
  create: (data) => api.post('/offers', data),

  // Admin: Update offer
  update: (offerId, data) => api.put(`/offers/${offerId}`, data),

  // Admin: Delete offer
  delete: (offerId) => api.delete(`/offers/${offerId}`),

  // Admin: Get offer stats
  getStats: (offerId) => api.get(`/offers/${offerId}/stats`)
}

// MT4/MT5 Connection API
export const mtAPI = {
  // Get all connections
  getConnections: () => api.get('/mt/connections'),

  // Connect new MT account
  connect: (data) => api.post('/mt/connect', data),

  // Disconnect account
  disconnect: (connectionId) => api.post(`/mt/disconnect/${connectionId}`),

  // Reconnect account
  reconnect: (connectionId) => api.post(`/mt/reconnect/${connectionId}`),

  // Sync account data
  sync: (connectionId) => api.post(`/mt/sync/${connectionId}`),

  // Get account info
  getAccountInfo: (connectionId) => api.get(`/mt/account-info/${connectionId}`),

  // Get positions
  getPositions: (connectionId) => api.get(`/mt/positions/${connectionId}`),

  // Get history
  getHistory: (connectionId, days = 30) =>
    api.get(`/mt/history/${connectionId}`, { params: { days } }),

  // Execute trade
  execute: (connectionId, data) => api.post(`/mt/execute/${connectionId}`, data),

  // Close position
  closePosition: (connectionId, positionId, volume = null) =>
    api.post(`/mt/close-position/${connectionId}`, { position_id: positionId, volume }),

  // Update settings
  updateSettings: (connectionId, settings) =>
    api.put(`/mt/settings/${connectionId}`, settings),

  // Delete connection
  delete: (connectionId) => api.delete(`/mt/delete/${connectionId}`),

  // Get sync logs
  getSyncLogs: (connectionId, page = 1, perPage = 20) =>
    api.get(`/mt/sync-logs/${connectionId}`, { params: { page, per_page: perPage } })
}

// Charts API
export const chartsAPI = {
  // Layouts
  getLayouts: () => api.get('/charts/layouts'),
  createLayout: (data) => api.post('/charts/layouts', data),
  updateLayout: (id, data) => api.put(`/charts/layouts/${id}`, data),
  deleteLayout: (id) => api.delete(`/charts/layouts/${id}`),

  // Templates
  getTemplates: () => api.get('/charts/templates'),
  createTemplate: (data) => api.post('/charts/templates', data),
  updateTemplate: (id, data) => api.put(`/charts/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/charts/templates/${id}`),

  // Drawings
  getDrawings: (symbol, timeframe) => api.get('/charts/drawings', { params: { symbol, timeframe } }),
  createDrawing: (data) => api.post('/charts/drawings', data),
  updateDrawing: (id, data) => api.put(`/charts/drawings/${id}`, data),
  deleteDrawing: (id) => api.delete(`/charts/drawings/${id}`),
  bulkDeleteDrawings: (drawingIds) => api.post('/charts/drawings/bulk-delete', { drawing_ids: drawingIds })
}

export default api
