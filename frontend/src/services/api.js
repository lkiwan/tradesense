import axios from 'axios'
import { logError } from '../utils/errorHandler'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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

// Response interceptor - handle token refresh and log errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Log error in development
    logError(error, `API ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`)

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
  getAll: () => api.get('/challenges'),
  getActive: () => api.get('/challenges/active'),
  getById: (id) => api.get(`/challenges/${id}`),
  getStats: (id) => api.get(`/challenges/${id}/stats`),
  // Trial endpoints
  activateTrial: () => api.post('/challenges/activate-trial'),
  checkTrial: () => api.get('/challenges/check-trial')
}

export const tradesAPI = {
  getAll: (challengeId) => api.get('/trades', { params: { challenge_id: challengeId } }),
  open: (data) => api.post('/trades/open', data),
  close: (tradeId) => api.post(`/trades/${tradeId}/close`),
  getById: (id) => api.get(`/trades/${id}`),
  getOpenPnL: () => api.get('/trades/open/pnl')
}

export const marketAPI = {
  getPrice: (symbol) => api.get(`/market/price/${symbol}`),
  getAllPrices: (category) => api.get('/market/prices', { params: { category } }),
  getHistory: (symbol, period, interval) =>
    api.get(`/market/history/${symbol}`, { params: { period, interval } }),
  getSignal: (symbol) => api.get(`/market/signal/${symbol}`),
  getAllSignals: (symbols) =>
    api.get('/market/signals', { params: { symbols: symbols.join(',') } }),
  getMarketStatus: () => api.get('/market/status')
}

export const paymentsAPI = {
  getPlans: () => api.get('/payments/plans'),
  createCheckout: (planType, paymentMethod) =>
    api.post('/payments/checkout', { plan_type: planType, payment_method: paymentMethod }),
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

export default api
