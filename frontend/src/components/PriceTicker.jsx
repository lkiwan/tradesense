import { useEffect, useState, useRef, useMemo } from 'react'
import { useSocket } from '../context/SocketContext'
import { marketAPI } from '../services/api'
import { TrendingUp, TrendingDown, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { SkeletonPriceCard } from './ui/Skeleton'

// Default symbols to show in ticker
const TICKER_SYMBOLS = [
  'AAPL', 'TSLA', 'GOOGL', 'NVDA', 'MSFT',
  'BTC-USD', 'ETH-USD', 'SOL-USD',
  'IAM', 'ATW'
]

// LocalStorage key for cached prices
const CACHE_KEY = 'tradesense_prices_cache'

// Get cached prices from localStorage
const getCachedPrices = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.log('Error reading cached prices:', e)
  }
  return {}
}

// Save prices to localStorage
const savePricesToCache = (prices) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(prices))
  } catch (e) {
    console.log('Error caching prices:', e)
  }
}

// Format price based on value
const formatPrice = (price, symbol) => {
  if (price === null || price === undefined) return null
  if (symbol?.endsWith('-USD')) {
    if (price < 1) return price.toFixed(4)
    return price.toFixed(2)
  }
  return price.toFixed(2)
}

// Individual price card with flash effect
const PriceCard = ({ symbol, data, cachedData }) => {
  const [flash, setFlash] = useState(null) // 'up' | 'down' | null
  const prevPriceRef = useRef(null)

  // Use live data, fallback to cached data
  const displayData = data?.price ? data : cachedData
  const price = displayData?.price
  const changePercent = displayData?.changePercent || 0
  const isPositive = changePercent >= 0
  const isLive = data?.price ? true : false

  // Flash effect when price changes
  useEffect(() => {
    if (price !== null && price !== undefined && prevPriceRef.current !== null) {
      if (price > prevPriceRef.current) {
        setFlash('up')
      } else if (price < prevPriceRef.current) {
        setFlash('down')
      }

      const timer = setTimeout(() => setFlash(null), 600)
      return () => clearTimeout(timer)
    }
    prevPriceRef.current = price
  }, [price])

  // Flash background classes
  const flashBg = flash === 'up'
    ? 'bg-green-500/30 dark:bg-green-500/40'
    : flash === 'down'
    ? 'bg-red-500/30 dark:bg-red-500/40'
    : 'bg-gray-50 dark:bg-dark-200'

  const formattedPrice = formatPrice(price, symbol)

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg min-w-[140px] transition-all duration-300 ${flashBg}`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {symbol}
          </span>
          {!isLive && price && (
            <span className="text-[9px] text-gray-400" title="Cached price">
              (cached)
            </span>
          )}
        </div>
        <div className={`font-semibold transition-colors duration-300 ${
          flash === 'up' ? 'text-green-600 dark:text-green-400' :
          flash === 'down' ? 'text-red-600 dark:text-red-400' :
          'text-gray-900 dark:text-white'
        }`}>
          {formattedPrice ? `$${formattedPrice}` : 'Loading...'}
        </div>
      </div>
      {price && (
        <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{isPositive ? '+' : ''}{changePercent.toFixed(2)}%</span>
        </div>
      )}
    </div>
  )
}

const PriceTicker = ({ symbols = TICKER_SYMBOLS }) => {
  const { prices: socketPrices, subscribeToPrices, isConnected, lastUpdate } = useSocket()
  const [isLoading, setIsLoading] = useState(true)
  const [apiPrices, setApiPrices] = useState({})
  const [cachedPrices, setCachedPrices] = useState(() => getCachedPrices())
  const [refreshing, setRefreshing] = useState(false)

  // Combined prices: prefer socket prices, then API prices (memoized to prevent infinite loops)
  const livePrices = useMemo(() => ({ ...apiPrices, ...socketPrices }), [apiPrices, socketPrices])

  // Subscribe to all ticker symbols when WebSocket connected
  useEffect(() => {
    if (isConnected) {
      subscribeToPrices(symbols)
    }
  }, [isConnected, symbols, subscribeToPrices])

  // Cache prices whenever we get new ones (use ref to avoid dependency on cachedPrices)
  const cachedPricesRef = useRef(cachedPrices)
  cachedPricesRef.current = cachedPrices

  useEffect(() => {
    const hasLivePrices = Object.keys(livePrices).length > 0
    if (hasLivePrices) {
      // Merge with existing cache (don't lose old prices)
      const mergedCache = { ...cachedPricesRef.current }
      let hasChanges = false
      Object.keys(livePrices).forEach(symbol => {
        if (livePrices[symbol]?.price) {
          const newPrice = livePrices[symbol].price
          const oldPrice = mergedCache[symbol]?.price
          if (newPrice !== oldPrice) {
            hasChanges = true
            mergedCache[symbol] = {
              ...livePrices[symbol],
              cachedAt: Date.now()
            }
          }
        }
      })
      if (hasChanges) {
        setCachedPrices(mergedCache)
        savePricesToCache(mergedCache)
      }
    }
  }, [livePrices])

  // Fetch prices via API as fallback
  const fetchPricesFromAPI = async () => {
    try {
      setRefreshing(true)
      const response = await marketAPI.getAllSignals(symbols)
      if (response.data?.signals) {
        const formattedPrices = {}
        response.data.signals.forEach((item) => {
          formattedPrices[item.symbol] = {
            price: item.price,
            change: item.change || 0,
            changePercent: item.change_percent || 0
          }
        })
        setApiPrices(formattedPrices)
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
    } finally {
      setRefreshing(false)
      setIsLoading(false)
    }
  }

  // Fetch prices on mount and periodically if WebSocket not connected
  useEffect(() => {
    fetchPricesFromAPI()

    // Poll every 10 seconds if WebSocket not connected
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchPricesFromAPI()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [isConnected, symbols])

  // Track loading state - show content once we have cached or live prices
  useEffect(() => {
    const hasLivePrices = symbols.some(symbol => livePrices[symbol]?.price)
    const hasCachedPrices = symbols.some(symbol => cachedPrices[symbol]?.price)
    if (hasLivePrices || hasCachedPrices) {
      setIsLoading(false)
    }
  }, [livePrices, cachedPrices, symbols])

  // Check if we have any prices to show (live or cached)
  const hasAnyPrices = symbols.some(symbol =>
    livePrices[symbol]?.price || cachedPrices[symbol]?.price
  )

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl p-4 overflow-hidden border border-gray-100 dark:border-dark-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          Live Prices
          {isConnected ? (
            <Wifi size={14} className="text-green-500 animate-pulse" />
          ) : (
            <WifiOff size={14} className="text-gray-400" />
          )}
        </h3>
        <div className="flex items-center gap-2">
          {lastUpdate && !isLoading && (
            <span className="text-xs text-gray-400">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchPricesFromAPI}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 transition-colors"
            title="Refresh prices"
          >
            <RefreshCw size={14} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {isLoading && !hasAnyPrices ? (
          // Show skeleton cards only on first load with no cached data
          symbols.map((_, index) => (
            <SkeletonPriceCard key={index} />
          ))
        ) : (
          // Show actual price cards - always show with live or cached data
          symbols.map(symbol => (
            <PriceCard
              key={symbol}
              symbol={symbol}
              data={livePrices[symbol]}
              cachedData={cachedPrices[symbol]}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default PriceTicker
