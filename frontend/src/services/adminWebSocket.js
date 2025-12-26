/**
 * Admin WebSocket Service
 * Real-time updates for admin dashboard
 */

import { io } from 'socket.io-client'

class AdminWebSocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.isConnected = false
  }

  /**
   * Connect to the WebSocket server
   * @param {string} token - JWT token for authentication
   */
  connect(token) {
    if (this.socket?.connected) {
      console.log('Admin WebSocket already connected')
      return
    }

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    this.socket = io(baseURL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay
    })

    this.setupEventHandlers()
  }

  /**
   * Setup socket event handlers
   */
  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Admin WebSocket connected')
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connection_status', { connected: true })

      // Join admin room
      this.socket.emit('join_admin_room')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Admin WebSocket disconnected:', reason)
      this.isConnected = false
      this.emit('connection_status', { connected: false, reason })
    })

    this.socket.on('connect_error', (error) => {
      console.error('Admin WebSocket connection error:', error)
      this.reconnectAttempts++
      this.emit('connection_error', { error: error.message, attempt: this.reconnectAttempts })
    })

    // Admin-specific events
    this.socket.on('admin_stats_update', (data) => {
      this.emit('stats_update', data)
    })

    this.socket.on('new_user_registered', (data) => {
      this.emit('new_user', data)
    })

    this.socket.on('new_challenge_purchased', (data) => {
      this.emit('new_challenge', data)
    })

    this.socket.on('challenge_status_changed', (data) => {
      this.emit('challenge_update', data)
    })

    this.socket.on('new_payment', (data) => {
      this.emit('payment', data)
    })

    this.socket.on('payout_requested', (data) => {
      this.emit('payout_request', data)
    })

    this.socket.on('new_ticket', (data) => {
      this.emit('new_ticket', data)
    })

    this.socket.on('ticket_updated', (data) => {
      this.emit('ticket_update', data)
    })

    this.socket.on('trade_executed', (data) => {
      this.emit('trade', data)
    })

    this.socket.on('user_status_changed', (data) => {
      this.emit('user_status', data)
    })

    this.socket.on('security_alert', (data) => {
      this.emit('security_alert', data)
    })

    this.socket.on('system_alert', (data) => {
      this.emit('system_alert', data)
    })
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in ${event} listener:`, error)
        }
      })
    }
  }

  /**
   * Send event to server
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  send(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('Cannot send event, socket not connected')
    }
  }

  /**
   * Request real-time stats refresh
   */
  requestStatsRefresh() {
    this.send('request_stats_refresh')
  }

  /**
   * Subscribe to specific user updates
   * @param {number} userId - User ID to watch
   */
  watchUser(userId) {
    this.send('watch_user', { user_id: userId })
  }

  /**
   * Unsubscribe from user updates
   * @param {number} userId - User ID to unwatch
   */
  unwatchUser(userId) {
    this.send('unwatch_user', { user_id: userId })
  }

  /**
   * Subscribe to specific challenge updates
   * @param {number} challengeId - Challenge ID to watch
   */
  watchChallenge(challengeId) {
    this.send('watch_challenge', { challenge_id: challengeId })
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.listeners.clear()
    }
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected
  }
}

// Singleton instance
const adminWebSocket = new AdminWebSocketService()

export default adminWebSocket

// ==================== REACT HOOK ====================

import { useState, useEffect, useCallback } from 'react'

/**
 * React hook for admin WebSocket events
 * @param {string} event - Event name to subscribe to
 * @param {Function} callback - Optional callback for event
 * @returns {Object} { data, isConnected }
 */
export const useAdminWebSocket = (event, callback) => {
  const [data, setData] = useState(null)
  const [isConnected, setIsConnected] = useState(adminWebSocket.getConnectionStatus())

  useEffect(() => {
    // Subscribe to connection status
    const unsubConnection = adminWebSocket.on('connection_status', ({ connected }) => {
      setIsConnected(connected)
    })

    // Subscribe to the specified event
    const unsubEvent = adminWebSocket.on(event, (eventData) => {
      setData(eventData)
      if (callback) {
        callback(eventData)
      }
    })

    return () => {
      unsubConnection()
      unsubEvent()
    }
  }, [event, callback])

  return { data, isConnected }
}

/**
 * React hook for real-time admin stats
 * @returns {Object} { stats, isConnected, refresh }
 */
export const useAdminStats = () => {
  const [stats, setStats] = useState(null)
  const [isConnected, setIsConnected] = useState(adminWebSocket.getConnectionStatus())

  useEffect(() => {
    const unsubConnection = adminWebSocket.on('connection_status', ({ connected }) => {
      setIsConnected(connected)
    })

    const unsubStats = adminWebSocket.on('stats_update', (data) => {
      setStats(data)
    })

    return () => {
      unsubConnection()
      unsubStats()
    }
  }, [])

  const refresh = useCallback(() => {
    adminWebSocket.requestStatsRefresh()
  }, [])

  return { stats, isConnected, refresh }
}

/**
 * React hook for real-time notifications
 * @param {Function} onNotification - Callback when notification received
 * @returns {Object} { notifications, clearNotifications }
 */
export const useAdminNotifications = (onNotification) => {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const events = [
      'new_user',
      'new_challenge',
      'payment',
      'payout_request',
      'new_ticket',
      'security_alert',
      'system_alert'
    ]

    const unsubscribers = events.map(event => {
      return adminWebSocket.on(event, (data) => {
        const notification = {
          id: Date.now(),
          type: event,
          data,
          timestamp: new Date()
        }
        setNotifications(prev => [notification, ...prev].slice(0, 50)) // Keep last 50
        if (onNotification) {
          onNotification(notification)
        }
      })
    })

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [onNotification])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return { notifications, clearNotifications }
}
