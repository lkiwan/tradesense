import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [prices, setPrices] = useState({})
  const [lastUpdate, setLastUpdate] = useState(null)
  const priceListenersRef = useRef(new Set())
  const tradeListenersRef = useRef(new Set())
  const challengeListenersRef = useRef(new Set())

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Connection events
    newSocket.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })

    newSocket.on('connected', (data) => {
      console.log('Server acknowledged connection:', data.message)
    })

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
    })

    // Price updates
    newSocket.on('price_update', (data) => {
      setPrices(prev => ({
        ...prev,
        [data.symbol]: {
          price: data.price,
          change: data.change,
          changePercent: data.change_percent,
          timestamp: data.timestamp
        }
      }))
      setLastUpdate(new Date())

      // Notify all price listeners
      priceListenersRef.current.forEach(callback => callback(data))
    })

    newSocket.on('prices_batch', (data) => {
      const newPrices = {}
      Object.entries(data.prices).forEach(([symbol, priceData]) => {
        newPrices[symbol] = {
          price: priceData.price,
          change: priceData.change,
          changePercent: priceData.change_percent,
          timestamp: data.timestamp
        }
      })
      setPrices(prev => ({ ...prev, ...newPrices }))
      setLastUpdate(new Date())
    })

    // Trade updates
    newSocket.on('trade_update', (data) => {
      tradeListenersRef.current.forEach(callback => callback(data))
    })

    // Challenge notifications
    newSocket.on('challenge_status', (data) => {
      const { challenge } = data
      if (challenge.status === 'passed') {
        toast.success('Congratulations! You passed the challenge!', { duration: 5000 })
      } else if (challenge.status === 'failed') {
        toast.error(`Challenge failed: ${challenge.failure_reason}`, { duration: 5000 })
      }
      challengeListenersRef.current.forEach(callback => callback(data))
    })

    newSocket.on('challenge_warning', (data) => {
      const { type, message, current, limit } = data
      if (type === 'daily_loss') {
        toast.error(`Warning: Daily loss at ${(current * 100).toFixed(1)}% (limit: ${(limit * 100).toFixed(0)}%)`, { duration: 5000 })
      } else if (type === 'total_loss') {
        toast.error(`Warning: Total loss at ${(current * 100).toFixed(1)}% (limit: ${(limit * 100).toFixed(0)}%)`, { duration: 5000 })
      }
    })

    // Authentication response
    newSocket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data.message)
    })

    newSocket.on('auth_error', (data) => {
      console.error('WebSocket auth error:', data.error)
    })

    newSocket.on('subscribed', (data) => {
      console.log('Subscribed to prices:', data.symbols)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  // Authenticate when user logs in
  useEffect(() => {
    if (socket && isConnected && isAuthenticated) {
      const token = localStorage.getItem('access_token')
      if (token) {
        socket.emit('authenticate', { token })
      }
    }
  }, [socket, isConnected, isAuthenticated])

  // Subscribe to price updates
  const subscribeToPrices = useCallback((symbols) => {
    if (socket && isConnected) {
      socket.emit('subscribe_prices', { symbols })
    }
  }, [socket, isConnected])

  // Unsubscribe from price updates
  const unsubscribeFromPrices = useCallback((symbols) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe_prices', { symbols })
    }
  }, [socket, isConnected])

  // Add price update listener
  const addPriceListener = useCallback((callback) => {
    priceListenersRef.current.add(callback)
    return () => priceListenersRef.current.delete(callback)
  }, [])

  // Add trade update listener
  const addTradeListener = useCallback((callback) => {
    tradeListenersRef.current.add(callback)
    return () => tradeListenersRef.current.delete(callback)
  }, [])

  // Add challenge update listener
  const addChallengeListener = useCallback((callback) => {
    challengeListenersRef.current.add(callback)
    return () => challengeListenersRef.current.delete(callback)
  }, [])

  // Get price for a specific symbol
  const getPrice = useCallback((symbol) => {
    return prices[symbol.toUpperCase()] || null
  }, [prices])

  const value = {
    socket,
    isConnected,
    prices,
    lastUpdate,
    subscribeToPrices,
    unsubscribeFromPrices,
    addPriceListener,
    addTradeListener,
    addChallengeListener,
    getPrice
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export default SocketContext
