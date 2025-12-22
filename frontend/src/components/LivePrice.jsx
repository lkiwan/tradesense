import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import { TrendingUp, TrendingDown } from 'lucide-react'

// Format price based on value
const formatPrice = (price, symbol) => {
  if (price === null || price === undefined) return '-'

  if (symbol?.endsWith('-USD')) {
    if (price < 0.01) return price.toFixed(8)
    if (price < 1) return price.toFixed(6)
    if (price < 100) return price.toFixed(4)
    return price.toFixed(2)
  }
  return price.toFixed(2)
}

const LivePrice = ({
  symbol,
  showChange = true,
  showSymbol = false,
  size = 'md',
  className = ''
}) => {
  const { prices, subscribeToPrices, isConnected } = useSocket()
  const [flash, setFlash] = useState(null) // 'up' | 'down' | null
  const prevPriceRef = useRef(null)

  // Subscribe to this symbol's price updates
  useEffect(() => {
    if (isConnected && symbol) {
      subscribeToPrices([symbol])
    }
  }, [symbol, isConnected, subscribeToPrices])

  // Get current price data
  const priceData = prices[symbol?.toUpperCase()]
  const price = priceData?.price
  const change = priceData?.change || 0
  const changePercent = priceData?.changePercent || 0

  // Flash effect when price changes
  useEffect(() => {
    if (price !== null && prevPriceRef.current !== null) {
      if (price > prevPriceRef.current) {
        setFlash('up')
      } else if (price < prevPriceRef.current) {
        setFlash('down')
      }

      const timer = setTimeout(() => setFlash(null), 500)
      return () => clearTimeout(timer)
    }
    prevPriceRef.current = price
  }, [price])

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl'
  }

  // Flash classes
  const flashClasses = {
    up: 'bg-green-500/20 transition-colors duration-300',
    down: 'bg-red-500/20 transition-colors duration-300'
  }

  if (!price) {
    return (
      <span className={`text-gray-400 ${sizeClasses[size]} ${className}`}>
        Loading...
      </span>
    )
  }

  const isPositive = changePercent >= 0

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded ${flash ? flashClasses[flash] : ''} ${className}`}>
      {showSymbol && (
        <span className="font-medium text-gray-900 dark:text-white">
          {symbol}
        </span>
      )}

      <span className={`font-semibold ${sizeClasses[size]} text-gray-900 dark:text-white`}>
        ${formatPrice(price, symbol)}
      </span>

      {showChange && (
        <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{isPositive ? '+' : ''}{changePercent.toFixed(2)}%</span>
        </span>
      )}
    </div>
  )
}

export default LivePrice
