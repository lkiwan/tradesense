import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { marketAPI } from '../services/api'
import { TrendingUp, TrendingDown, Minus, Sparkles, RefreshCw, Clock } from 'lucide-react'
import { Skeleton } from './ui/Skeleton'

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds

// Supported symbols for AI signals (backend has price data for these)
const SUPPORTED_SIGNAL_SYMBOLS = [
  'AAPL', 'TSLA', 'NVDA', 'GOOGL', 'MSFT',  // US Stocks
  'BTC-USD', 'ETH-USD', 'SOL-USD',           // Crypto
  'IAM', 'ATW', 'BCP'                        // Moroccan
]

const SignalsPanel = ({ symbols: propSymbols }) => {
  const { t } = useTranslation()
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nextRefresh, setNextRefresh] = useState(AUTO_REFRESH_INTERVAL / 1000) // countdown in seconds

  // Use supported symbols, filtering prop symbols to only include supported ones
  // If no valid symbols from props, use defaults
  const symbols = propSymbols?.length > 0
    ? propSymbols.filter(s => SUPPORTED_SIGNAL_SYMBOLS.includes(s))
    : []
  const effectiveSymbols = symbols.length > 0 ? symbols : SUPPORTED_SIGNAL_SYMBOLS.slice(0, 5)

  // Initial fetch
  useEffect(() => {
    fetchSignals()
  }, [effectiveSymbols.join(',')])

  // Auto-refresh every 5 minutes with countdown
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchSignals()
      setNextRefresh(AUTO_REFRESH_INTERVAL / 1000)
    }, AUTO_REFRESH_INTERVAL)

    const countdownInterval = setInterval(() => {
      setNextRefresh(prev => (prev > 0 ? prev - 1 : AUTO_REFRESH_INTERVAL / 1000))
    }, 1000)

    return () => {
      clearInterval(refreshInterval)
      clearInterval(countdownInterval)
    }
  }, [symbols])

  // Format countdown time
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const fetchSignals = async () => {
    try {
      setRefreshing(true)
      console.log('Fetching signals for:', effectiveSymbols)
      const response = await marketAPI.getAllSignals(effectiveSymbols)
      console.log('Signals response:', response.data)
      const fetchedSignals = response.data.signals || []
      if (fetchedSignals.length === 0) {
        console.warn('No signals returned from API, using mock data')
        setSignals(generateMockSignals())
      } else {
        setSignals(fetchedSignals)
      }
    } catch (error) {
      console.error('Error fetching signals:', error)
      // Use mock signals for demo
      setSignals(generateMockSignals())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const generateMockSignals = () => {
    return effectiveSymbols.map(symbol => {
      const signalTypes = ['BUY', 'SELL', 'HOLD']
      const signal = signalTypes[Math.floor(Math.random() * 3)]
      const confidence = 50 + Math.floor(Math.random() * 45)

      return {
        symbol,
        price: symbol.includes('BTC') ? 45000 + Math.random() * 2000 :
               symbol.includes('ETH') ? 2500 + Math.random() * 200 :
               symbol.includes('IAM') ? 118 + Math.random() * 5 :
               150 + Math.random() * 20,
        change_percent: (Math.random() - 0.5) * 10,
        signal: {
          signal,
          confidence,
          reason: signal === 'BUY' ? 'Strong upward momentum detected' :
                  signal === 'SELL' ? 'Bearish divergence on RSI' :
                  'Market consolidation phase',
          ai_powered: Math.random() > 0.3
        }
      }
    })
  }

  const getSignalIcon = (signal) => {
    switch (signal) {
      case 'BUY':
        return <TrendingUp className="text-green-500" size={20} />
      case 'SELL':
        return <TrendingDown className="text-red-500" size={20} />
      default:
        return <Minus className="text-yellow-500" size={20} />
    }
  }

  const getSignalClass = (signal) => {
    switch (signal) {
      case 'BUY':
        return 'signal-buy'
      case 'SELL':
        return 'signal-sell'
      default:
        return 'signal-hold'
    }
  }

  // Skeleton for signal card
  const SignalSkeleton = () => (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-dark-200 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Skeleton width="60px" height="18px" />
          <Skeleton width="24px" height="16px" rounded="sm" />
        </div>
        <Skeleton width="50px" height="14px" />
      </div>
      <div className="flex items-center justify-between mb-3">
        <Skeleton width="90px" height="28px" />
        <Skeleton width="70px" height="28px" rounded="full" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton width="80px" height="14px" />
          <Skeleton width="40px" height="14px" />
        </div>
        <Skeleton height="8px" rounded="full" />
        <Skeleton width="100%" height="12px" className="mt-2" />
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Skeleton width="24px" height="24px" variant="circular" />
            <Skeleton width="100px" height="20px" />
          </div>
          <Skeleton width="32px" height="32px" rounded="lg" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <SignalSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary-500" size={24} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('signals.title')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-primary-500/10 rounded-lg">
            <Clock size={12} className="text-primary-500" />
            <span className="text-xs text-primary-500 font-mono">{formatCountdown(nextRefresh)}</span>
          </div>
          <button
            onClick={() => {
              fetchSignals()
              setNextRefresh(AUTO_REFRESH_INTERVAL / 1000)
            }}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 transition-colors"
          >
            <RefreshCw size={18} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Show only top 4 signals sorted by confidence */}
        {signals
          .sort((a, b) => (b.signal?.confidence || 0) - (a.signal?.confidence || 0))
          .slice(0, 4)
          .map((item, index) => (
          <div
            key={item.symbol}
            className="p-4 rounded-lg bg-gray-50 dark:bg-dark-200 animate-fadeIn"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {item.symbol}
                </span>
                {item.signal.ai_powered && (
                  <span className="px-1.5 py-0.5 text-xs bg-primary-500/20 text-primary-500 rounded">
                    AI
                  </span>
                )}
              </div>
              <span className={`text-sm ${item.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {item.change_percent >= 0 ? '+' : ''}{item.change_percent?.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                ${item.price?.toFixed(2)}
              </span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getSignalClass(item.signal.signal)}`}>
                {getSignalIcon(item.signal.signal)}
                <span className="text-sm font-medium">
                  {t(`signals.${item.signal.signal.toLowerCase()}`)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('signals.confidence')}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.signal.confidence}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-dark-300 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.signal.signal === 'BUY' ? 'bg-green-500' :
                    item.signal.signal === 'SELL' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${item.signal.confidence}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {item.signal.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SignalsPanel
