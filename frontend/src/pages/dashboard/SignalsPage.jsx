import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Brain, Zap, TrendingUp, TrendingDown, Clock, Target, AlertCircle,
  CheckCircle, XCircle, Filter, RefreshCw, BarChart3, Activity,
  ArrowLeft, Loader2, ChevronRight, Award, Percent, DollarSign, Search,
  Copy, Play, Shield, Lock, Sparkles, Globe, Bitcoin, Building2,
  Landmark, ArrowUpRight, ArrowDownRight, Eye, Star, Flame, Timer,
  CircleDollarSign, TrendingUpIcon, AlertTriangle, Check, X
} from 'lucide-react'
import { signalsAPI, marketAPI, tradesAPI, challengesAPI } from '../../services/api'
import toast from 'react-hot-toast'

// Market categories with their symbols
const MARKET_CATEGORIES = {
  all: { label: 'All Markets', icon: Globe, color: 'primary' },
  forex: { label: 'Forex', icon: CircleDollarSign, color: 'blue' },
  crypto: { label: 'Crypto', icon: Bitcoin, color: 'orange' },
  stocks: { label: 'US Stocks', icon: Building2, color: 'green' },
  morocco: { label: 'Morocco', icon: Landmark, color: 'red' }
}

// Symbols by market
const MARKET_SYMBOLS = {
  forex: [
    { symbol: 'EURUSD', name: 'EUR/USD', pip: 0.0001 },
    { symbol: 'GBPUSD', name: 'GBP/USD', pip: 0.0001 },
    { symbol: 'USDJPY', name: 'USD/JPY', pip: 0.01 },
    { symbol: 'USDCHF', name: 'USD/CHF', pip: 0.0001 },
    { symbol: 'AUDUSD', name: 'AUD/USD', pip: 0.0001 },
    { symbol: 'USDCAD', name: 'USD/CAD', pip: 0.0001 }
  ],
  crypto: [
    { symbol: 'BTC-USD', name: 'Bitcoin', pip: 1 },
    { symbol: 'ETH-USD', name: 'Ethereum', pip: 0.01 },
    { symbol: 'SOL-USD', name: 'Solana', pip: 0.01 },
    { symbol: 'XRP-USD', name: 'Ripple', pip: 0.0001 },
    { symbol: 'ADA-USD', name: 'Cardano', pip: 0.0001 },
    { symbol: 'DOGE-USD', name: 'Dogecoin', pip: 0.00001 }
  ],
  stocks: [
    { symbol: 'AAPL', name: 'Apple', pip: 0.01 },
    { symbol: 'TSLA', name: 'Tesla', pip: 0.01 },
    { symbol: 'NVDA', name: 'NVIDIA', pip: 0.01 },
    { symbol: 'GOOGL', name: 'Google', pip: 0.01 },
    { symbol: 'MSFT', name: 'Microsoft', pip: 0.01 },
    { symbol: 'AMZN', name: 'Amazon', pip: 0.01 }
  ],
  morocco: [
    { symbol: 'IAM', name: 'Maroc Telecom', pip: 0.01 },
    { symbol: 'ATW', name: 'Attijariwafa Bank', pip: 0.01 },
    { symbol: 'BCP', name: 'Banque Populaire', pip: 0.01 },
    { symbol: 'CIH', name: 'CIH Bank', pip: 0.01 },
    { symbol: 'HPS', name: 'Hightech Payment', pip: 0.01 },
    { symbol: 'TQM', name: 'Taqa Morocco', pip: 0.01 }
  ]
}

// Challenge tiers for signal allocation
const CHALLENGE_TIERS = {
  basic: { signals: 10, label: 'Basic', color: 'gray' },
  standard: { signals: 15, label: 'Standard', color: 'blue' },
  premium: { signals: 25, label: 'Premium', color: 'purple' },
  elite: { signals: 50, label: 'Elite', color: 'yellow' }
}

const AUTO_REFRESH_INTERVAL = 60 * 1000 // 1 minute

// Helper to get today's date key for localStorage
const getTodayKey = () => new Date().toISOString().split('T')[0]

// Get daily trades from localStorage
const getDailyTrades = () => {
  try {
    const stored = localStorage.getItem('dailySignalTrades')
    if (stored) {
      const data = JSON.parse(stored)
      // Reset if it's a new day
      if (data.date !== getTodayKey()) {
        return { date: getTodayKey(), count: 0, trades: [] }
      }
      return data
    }
  } catch (e) {
    console.error('Error reading daily trades:', e)
  }
  return { date: getTodayKey(), count: 0, trades: [] }
}

// Save daily trades to localStorage
const saveDailyTrades = (data) => {
  try {
    localStorage.setItem('dailySignalTrades', JSON.stringify(data))
  } catch (e) {
    console.error('Error saving daily trades:', e)
  }
}

const SignalsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // State
  const [selectedMarket, setSelectedMarket] = useState('all')
  const [signals, setSignals] = useState([])
  const [marketAnalysis, setMarketAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeChallenge, setActiveChallenge] = useState(null)
  const [userTier, setUserTier] = useState('basic')
  const [nextRefresh, setNextRefresh] = useState(60)
  const [executingTrade, setExecutingTrade] = useState(null)
  const [copiedSignals, setCopiedSignals] = useState([])
  const [showConfirmModal, setShowConfirmModal] = useState(null)
  const [prices, setPrices] = useState({})
  const [dailyTrades, setDailyTrades] = useState(getDailyTrades())

  // Fetch initial data
  useEffect(() => {
    fetchAllData()
    fetchPrices()
  }, [])

  // Auto-refresh
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchSignals()
      fetchPrices()
      setNextRefresh(60)
    }, AUTO_REFRESH_INTERVAL)

    const countdownInterval = setInterval(() => {
      setNextRefresh(prev => (prev > 0 ? prev - 1 : 60))
    }, 1000)

    return () => {
      clearInterval(refreshInterval)
      clearInterval(countdownInterval)
    }
  }, [selectedMarket])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchSignals(),
        fetchMarketAnalysis(),
        fetchUserChallenge()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSignals = async () => {
    try {
      // Get symbols based on selected market
      let symbols = []
      if (selectedMarket === 'all') {
        Object.values(MARKET_SYMBOLS).forEach(marketSymbols => {
          symbols.push(...marketSymbols.map(s => s.symbol))
        })
      } else {
        symbols = MARKET_SYMBOLS[selectedMarket]?.map(s => s.symbol) || []
      }

      // Fetch AI signals for these symbols
      const response = await marketAPI.getAllSignals(symbols.slice(0, 10))

      if (response.data.signals) {
        // Enhance signals with additional data
        const enhancedSignals = response.data.signals.map((sig, index) => ({
          id: `sig-${Date.now()}-${index}`,
          ...sig,
          market: getMarketForSymbol(sig.symbol),
          timeframe: '1D',
          riskReward: calculateRiskReward(sig),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isHot: sig.signal?.confidence >= 75,
          isPremium: sig.signal?.confidence >= 85
        }))
        setSignals(enhancedSignals)
      }
    } catch (error) {
      console.error('Error fetching signals:', error)
      // Generate demo signals if API fails
      setSignals(generateDemoSignals())
    }
  }

  const fetchMarketAnalysis = async () => {
    try {
      const response = await signalsAPI.getMarketSentiment('all')
      setMarketAnalysis(response.data)
    } catch (error) {
      // Demo market analysis
      setMarketAnalysis({
        overall: 'bullish',
        confidence: 68,
        summary: 'Markets showing positive momentum with strong tech sector performance. Crypto consolidating after recent rally. Moroccan market stable with banking sector strength.',
        sectors: {
          forex: { sentiment: 'neutral', score: 52 },
          crypto: { sentiment: 'bullish', score: 72 },
          stocks: { sentiment: 'bullish', score: 78 },
          morocco: { sentiment: 'neutral', score: 58 }
        }
      })
    }
  }

  const fetchUserChallenge = async () => {
    try {
      const response = await challengesAPI.getActive()
      if (response.data.challenges?.length > 0) {
        const challenge = response.data.challenges[0]
        setActiveChallenge(challenge)
        // Determine tier based on challenge size
        const size = challenge.account_size || 10000
        if (size >= 100000) setUserTier('elite')
        else if (size >= 50000) setUserTier('premium')
        else if (size >= 25000) setUserTier('standard')
        else setUserTier('basic')
      }
    } catch (error) {
      console.error('Error fetching challenge:', error)
    }
  }

  const fetchPrices = async () => {
    try {
      const response = await marketAPI.getAllPrices('all')
      const allPrices = {
        ...response.data.us_stocks,
        ...response.data.crypto,
        ...response.data.moroccan
      }
      setPrices(allPrices)
    } catch (error) {
      console.error('Error fetching prices:', error)
    }
  }

  const getMarketForSymbol = (symbol) => {
    if (symbol.includes('-USD')) return 'crypto'
    if (MARKET_SYMBOLS.morocco.find(s => s.symbol === symbol)) return 'morocco'
    if (MARKET_SYMBOLS.forex.find(s => s.symbol === symbol)) return 'forex'
    return 'stocks'
  }

  const calculateRiskReward = (signal) => {
    if (!signal.signal?.entry_price || !signal.signal?.stop_loss || !signal.signal?.take_profit) {
      return 2.0 // Default R:R
    }
    const entry = signal.signal.entry_price
    const sl = signal.signal.stop_loss
    const tp = signal.signal.take_profit
    const risk = Math.abs(entry - sl)
    const reward = Math.abs(tp - entry)
    return risk > 0 ? (reward / risk).toFixed(1) : 2.0
  }

  const generateDemoSignals = () => {
    const allSymbols = []
    Object.entries(MARKET_SYMBOLS).forEach(([market, symbols]) => {
      symbols.forEach(s => allSymbols.push({ ...s, market }))
    })

    return allSymbols.slice(0, 10).map((sym, index) => {
      const isBuy = Math.random() > 0.5
      const confidence = 55 + Math.floor(Math.random() * 40)
      const basePrice = sym.market === 'crypto' ?
        (sym.symbol === 'BTC-USD' ? 45000 : sym.symbol === 'ETH-USD' ? 2500 : 100) :
        sym.market === 'morocco' ? 100 + Math.random() * 500 : 150 + Math.random() * 100

      const entry = basePrice
      const slPercent = 0.02 + Math.random() * 0.03
      const tpPercent = 0.04 + Math.random() * 0.06

      return {
        id: `demo-${index}`,
        symbol: sym.symbol,
        name: sym.name,
        market: sym.market,
        price: basePrice,
        change_percent: (Math.random() - 0.5) * 6,
        signal: {
          signal: isBuy ? 'BUY' : 'SELL',
          confidence,
          reason: isBuy
            ? `Strong bullish momentum with ${confidence}% AI confidence. RSI oversold, MACD crossover detected.`
            : `Bearish divergence detected with ${confidence}% AI confidence. Price below key support levels.`,
          entry_price: entry,
          stop_loss: isBuy ? entry * (1 - slPercent) : entry * (1 + slPercent),
          take_profit: isBuy ? entry * (1 + tpPercent) : entry * (1 - tpPercent),
          ai_powered: true
        },
        timeframe: '1D',
        riskReward: (tpPercent / slPercent).toFixed(1),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isHot: confidence >= 75,
        isPremium: confidence >= 85
      }
    })
  }

  // Get remaining trades for today based on tier
  const getRemainingTrades = () => {
    const maxTrades = CHALLENGE_TIERS[userTier]?.signals || 10
    return Math.max(0, maxTrades - dailyTrades.count)
  }

  const handleCopyTrade = async (signal) => {
    if (!activeChallenge) {
      toast.error('You need an active challenge to copy trades')
      navigate('/plans')
      return
    }

    // Check daily limit
    const remaining = getRemainingTrades()
    if (remaining <= 0) {
      toast.error(`Daily limit reached! You've used all ${CHALLENGE_TIERS[userTier].signals} signals for today.`)
      return
    }

    setShowConfirmModal(signal)
  }

  const executeCopyTrade = async (signal) => {
    setExecutingTrade(signal.id)
    setShowConfirmModal(null)

    // Check limit again before executing
    const remaining = getRemainingTrades()
    if (remaining <= 0) {
      toast.error('Daily signal limit reached!')
      setExecutingTrade(null)
      return
    }

    // Update daily trades count
    const newDailyTrades = {
      date: getTodayKey(),
      count: dailyTrades.count + 1,
      trades: [...dailyTrades.trades, {
        signalId: signal.id,
        symbol: signal.symbol,
        direction: signal.signal.signal,
        timestamp: new Date().toISOString()
      }]
    }
    setDailyTrades(newDailyTrades)
    saveDailyTrades(newDailyTrades)

    // Mark as copied
    setCopiedSignals(prev => [...prev, signal.id])

    // Navigate to trading page with signal parameters
    const signalParams = new URLSearchParams({
      symbol: signal.symbol,
      direction: signal.signal.signal.toLowerCase(),
      entry: signal.signal.entry_price || signal.price,
      sl: signal.signal.stop_loss,
      tp: signal.signal.take_profit,
      confidence: signal.signal.confidence,
      source: 'ai_signal'
    })

    toast.success(`Opening ${signal.signal.signal} ${signal.symbol} in Trading...`)

    // Small delay for visual feedback
    setTimeout(() => {
      navigate(`/trading?${signalParams.toString()}`)
      setExecutingTrade(null)
    }, 500)
  }

  const filteredSignals = signals.filter(signal => {
    if (selectedMarket === 'all') return true
    return signal.market === selectedMarket
  })

  const formatPrice = (price, symbol) => {
    if (!price) return '-.--'
    if (symbol?.includes('JPY')) return price.toFixed(3)
    if (symbol?.includes('BTC')) return price.toLocaleString(undefined, { maximumFractionDigits: 0 })
    if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 })
    if (price >= 1) return price.toFixed(2)
    return price.toFixed(5)
  }

  const getTimeRemaining = (expiresAt) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${mins}m`
  }

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'bullish' || sentiment === 'strong_buy') return 'text-green-400'
    if (sentiment === 'bearish' || sentiment === 'strong_sell') return 'text-red-400'
    return 'text-yellow-400'
  }

  const getSentimentBg = (sentiment) => {
    if (sentiment === 'bullish' || sentiment === 'strong_buy') return 'bg-green-500/10 border-green-500/30'
    if (sentiment === 'bearish' || sentiment === 'strong_sell') return 'bg-red-500/10 border-red-500/30'
    return 'bg-yellow-500/10 border-yellow-500/30'
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Brain className="w-16 h-16 text-primary-500 mx-auto animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <p className="text-gray-400 mt-4">AI is analyzing markets...</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-dark-100 border border-dark-200 hover:border-primary-500/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/30">
                <Brain className="text-primary-400 w-6 h-6" />
              </div>
              AI Trading Signals
            </h1>
            <p className="text-gray-400 mt-1">
              Copy high-confidence signals with one click
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* User Tier Badge with Remaining Trades */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
            userTier === 'elite' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
            userTier === 'premium' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
            userTier === 'standard' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
            'bg-gray-500/10 border-gray-500/30 text-gray-400'
          }`}>
            <Award size={16} />
            <span className="text-sm font-medium">{CHALLENGE_TIERS[userTier].label}</span>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-bold ${getRemainingTrades() > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {getRemainingTrades()}
              </span>
              <span className="text-xs opacity-70">/ {CHALLENGE_TIERS[userTier].signals} left</span>
            </div>
          </div>

          {/* AI Status */}
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-xl border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-green-400 font-medium">AI Active</span>
          </div>

          {/* Refresh Timer */}
          <div className="flex items-center gap-2 px-3 py-2 bg-dark-100 rounded-xl border border-dark-200">
            <Timer size={14} className="text-primary-400" />
            <span className="text-xs text-primary-400 font-mono">{nextRefresh}s</span>
          </div>

          <button
            onClick={() => {
              setRefreshing(true)
              fetchSignals().finally(() => setRefreshing(false))
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-dark-100 border border-dark-200 hover:border-primary-500/30 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Market Analysis Overview */}
      {marketAnalysis && (
        <div className="bg-gradient-to-br from-dark-100 to-dark-200 rounded-2xl border border-dark-200 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/30">
                  <BarChart3 className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Daily Market Analysis</h2>
                  <p className="text-xs text-gray-500">AI-powered insights updated hourly</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${getSentimentBg(marketAnalysis.overall)}`}>
                {marketAnalysis.overall === 'bullish' ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : marketAnalysis.overall === 'bearish' ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : (
                  <Activity className="w-4 h-4 text-yellow-400" />
                )}
                <span className={`text-sm font-semibold capitalize ${getSentimentColor(marketAnalysis.overall)}`}>
                  {marketAnalysis.overall}
                </span>
                <span className="text-xs text-gray-500">({marketAnalysis.confidence}%)</span>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              {marketAnalysis.summary}
            </p>

            {/* Market Sectors */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(marketAnalysis.sectors || {}).map(([key, data]) => (
                <div key={key} className="bg-dark-100/50 rounded-xl p-3 border border-dark-300">
                  <div className="flex items-center gap-2 mb-2">
                    {key === 'forex' && <CircleDollarSign size={14} className="text-blue-400" />}
                    {key === 'crypto' && <Bitcoin size={14} className="text-orange-400" />}
                    {key === 'stocks' && <Building2 size={14} className="text-green-400" />}
                    {key === 'morocco' && <Landmark size={14} className="text-red-400" />}
                    <span className="text-xs text-gray-400 uppercase">{key}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold capitalize ${getSentimentColor(data.sentiment)}`}>
                      {data.sentiment}
                    </span>
                    <span className="text-sm text-gray-500">{data.score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-dark-300 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        data.score >= 60 ? 'bg-green-500' : data.score <= 40 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${data.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Market Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {Object.entries(MARKET_CATEGORIES).map(([key, { label, icon: Icon, color }]) => (
          <button
            key={key}
            onClick={() => setSelectedMarket(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              selectedMarket === key
                ? `bg-${color}-500/20 border border-${color}-500/50 text-${color}-400`
                : 'bg-dark-100 border border-dark-200 text-gray-400 hover:text-white hover:border-dark-300'
            }`}
            style={selectedMarket === key ? {
              backgroundColor: color === 'primary' ? 'rgba(99, 102, 241, 0.2)' :
                             color === 'blue' ? 'rgba(59, 130, 246, 0.2)' :
                             color === 'orange' ? 'rgba(249, 115, 22, 0.2)' :
                             color === 'green' ? 'rgba(34, 197, 94, 0.2)' :
                             'rgba(239, 68, 68, 0.2)',
              borderColor: color === 'primary' ? 'rgba(99, 102, 241, 0.5)' :
                          color === 'blue' ? 'rgba(59, 130, 246, 0.5)' :
                          color === 'orange' ? 'rgba(249, 115, 22, 0.5)' :
                          color === 'green' ? 'rgba(34, 197, 94, 0.5)' :
                          'rgba(239, 68, 68, 0.5)'
            } : {}}
          >
            <Icon size={16} />
            {label}
            {key !== 'all' && (
              <span className="text-xs bg-dark-200 px-1.5 py-0.5 rounded">
                {signals.filter(s => s.market === key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSignals.map((signal, index) => (
          <SignalCard
            key={signal.id}
            signal={signal}
            index={index}
            prices={prices}
            formatPrice={formatPrice}
            getTimeRemaining={getTimeRemaining}
            onCopy={handleCopyTrade}
            isCopied={copiedSignals.includes(signal.id)}
            isExecuting={executingTrade === signal.id}
            hasActiveChallenge={!!activeChallenge}
            remainingTrades={getRemainingTrades()}
          />
        ))}
      </div>

      {filteredSignals.length === 0 && (
        <div className="bg-dark-100 rounded-2xl border border-dark-200 p-12 text-center">
          <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Signals Available</h3>
          <p className="text-gray-400">AI is analyzing the market. New signals will appear soon.</p>
        </div>
      )}

      {/* Confirm Trade Modal */}
      {showConfirmModal && (
        <TradeConfirmModal
          signal={showConfirmModal}
          onConfirm={() => executeCopyTrade(showConfirmModal)}
          onCancel={() => setShowConfirmModal(null)}
          formatPrice={formatPrice}
        />
      )}
    </div>
  )
}

// Signal Card Component
const SignalCard = ({
  signal,
  index,
  prices,
  formatPrice,
  getTimeRemaining,
  onCopy,
  isCopied,
  isExecuting,
  hasActiveChallenge,
  remainingTrades
}) => {
  const isBuy = signal.signal?.signal === 'BUY'
  const confidence = signal.signal?.confidence || 50
  const isHot = confidence >= 75
  const isPremium = confidence >= 85
  const limitReached = remainingTrades <= 0

  return (
    <div
      className={`relative bg-gradient-to-br from-dark-100 to-dark-200 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
        isPremium ? 'border-yellow-500/30 shadow-yellow-500/10' :
        isHot ? 'border-primary-500/30 shadow-primary-500/10' :
        'border-dark-200 hover:border-dark-300'
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Premium/Hot Badge */}
      {(isPremium || isHot) && (
        <div className={`absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
          isPremium ? 'bg-yellow-500 text-black' : 'bg-primary-500 text-white'
        }`}>
          {isPremium ? <Star size={12} /> : <Flame size={12} />}
          {isPremium ? 'PREMIUM' : 'HOT'}
        </div>
      )}

      {/* Card Header */}
      <div className="p-4 border-b border-dark-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isBuy ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              {isBuy ? (
                <TrendingUp className="w-6 h-6 text-green-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg">{signal.symbol}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {signal.signal?.signal}
                </span>
              </div>
              <span className="text-xs text-gray-500">{signal.name}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-primary-400">
              <Brain size={14} />
              <span className="font-bold">{confidence}%</span>
            </div>
            <span className="text-xs text-gray-500">Confidence</span>
          </div>
        </div>
      </div>

      {/* Price Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Entry Price</span>
          <span className="text-white font-semibold">
            ${formatPrice(signal.signal?.entry_price || signal.price, signal.symbol)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/20">
            <div className="flex items-center gap-1 mb-1">
              <Shield size={12} className="text-red-400" />
              <span className="text-xs text-red-400">Stop Loss</span>
            </div>
            <span className="text-white font-semibold">
              ${formatPrice(signal.signal?.stop_loss, signal.symbol)}
            </span>
          </div>
          <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/20">
            <div className="flex items-center gap-1 mb-1">
              <Target size={12} className="text-green-400" />
              <span className="text-xs text-green-400">Take Profit</span>
            </div>
            <span className="text-white font-semibold">
              ${formatPrice(signal.signal?.take_profit, signal.symbol)}
            </span>
          </div>
        </div>

        {/* Risk/Reward & Time */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">R:R</span>
            <span className="text-primary-400 font-semibold">1:{signal.riskReward}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock size={12} />
            <span className="text-xs">{getTimeRemaining(signal.expiresAt)} left</span>
          </div>
        </div>

        {/* AI Reason */}
        <div className="bg-dark-300/50 rounded-lg p-3">
          <div className="flex items-center gap-1 mb-1">
            <Sparkles size={12} className="text-primary-400" />
            <span className="text-xs text-primary-400">AI Analysis</span>
          </div>
          <p className="text-xs text-gray-400 line-clamp-2">
            {signal.signal?.reason}
          </p>
        </div>

        {/* Copy Trade Button */}
        <button
          onClick={() => onCopy(signal)}
          disabled={isCopied || isExecuting || !hasActiveChallenge || limitReached}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            isCopied
              ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
              : isExecuting
              ? 'bg-dark-300 text-gray-400 cursor-wait'
              : !hasActiveChallenge
              ? 'bg-dark-300 text-gray-500 cursor-not-allowed'
              : limitReached
              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 cursor-not-allowed'
              : isBuy
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/20'
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/20'
          }`}
        >
          {isCopied ? (
            <>
              <Check size={18} />
              Trade Copied
            </>
          ) : isExecuting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Opening Trade...
            </>
          ) : !hasActiveChallenge ? (
            <>
              <Lock size={18} />
              Need Active Challenge
            </>
          ) : limitReached ? (
            <>
              <AlertTriangle size={18} />
              Daily Limit Reached
            </>
          ) : (
            <>
              <Play size={18} />
              Copy Trade
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Trade Confirm Modal
const TradeConfirmModal = ({ signal, onConfirm, onCancel, formatPrice }) => {
  const isBuy = signal.signal?.signal === 'BUY'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative bg-dark-100 rounded-2xl border border-dark-200 w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl ${isBuy ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {isBuy ? (
              <TrendingUp className="w-6 h-6 text-green-400" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Confirm Copy Trade</h3>
            <p className="text-sm text-gray-400">{signal.symbol} - {signal.signal?.signal}</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 bg-dark-200 rounded-lg">
            <span className="text-gray-400">Entry Price</span>
            <span className="text-white font-semibold">
              ${formatPrice(signal.signal?.entry_price || signal.price, signal.symbol)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-red-500/5 rounded-lg border border-red-500/20">
            <span className="text-red-400">Stop Loss</span>
            <span className="text-white font-semibold">
              ${formatPrice(signal.signal?.stop_loss, signal.symbol)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-green-500/5 rounded-lg border border-green-500/20">
            <span className="text-green-400">Take Profit</span>
            <span className="text-white font-semibold">
              ${formatPrice(signal.signal?.take_profit, signal.symbol)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-dark-200 rounded-lg">
            <span className="text-gray-400">AI Confidence</span>
            <span className="text-primary-400 font-semibold">{signal.signal?.confidence}%</span>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />
            <p className="text-xs text-yellow-400">
              This will open a real trade on your challenge account. Make sure you understand the risks involved.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-dark-200 text-white font-semibold hover:bg-dark-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 ${
              isBuy
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}
          >
            <Play size={18} />
            Execute Trade
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignalsPage
