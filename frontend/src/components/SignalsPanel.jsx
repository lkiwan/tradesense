import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { marketAPI } from '../services/api'
import { TrendingUp, TrendingDown, Minus, Sparkles, RefreshCw } from 'lucide-react'
import { Skeleton } from './ui/Skeleton'

const SignalsPanel = ({ symbols = ['AAPL', 'TSLA', 'BTC-USD', 'IAM', 'ATW'] }) => {
  const { t } = useTranslation()
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchSignals()
    const interval = setInterval(fetchSignals, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [symbols])

  const fetchSignals = async () => {
    try {
      setRefreshing(true)
      const response = await marketAPI.getAllSignals(symbols)
      setSignals(response.data.signals || [])
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
    return symbols.map(symbol => {
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
          {[1, 2, 3, 4, 5].map(i => (
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
        <button
          onClick={fetchSignals}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 transition-colors"
        >
          <RefreshCw size={18} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {signals.map((item, index) => (
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
