import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { challengesAPI, tradesAPI } from '../../services/api'
import { useChallenge } from '../../context/ChallengeContext'
import { useAuth } from '../../context/AuthContext'
import { ResetModal, ExtendModal, UpgradeModal } from '../../components/challenge'
import {
  SkeletonChallengeCard,
  SkeletonPositionsTable,
} from '../../components/ui/Skeleton'
import {
  TrendingUp, TrendingDown, RefreshCw, Clock,
  Activity, AlertTriangle, X, Target,
  Award, Wallet, ChevronRight, Trophy,
  Copy, Check, ExternalLink, Monitor, Gift, Timer,
  Zap, Shield, ArrowRight, BarChart2, Percent,
  CheckCircle2, Circle, Lock, LineChart
} from 'lucide-react'
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler'

// Circular Progress Component - Responsive
const CircularProgress = ({ value, max, size = 120, mobileSize = 90, strokeWidth = 8, color = 'green', label, sublabel }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const actualSize = isMobile ? mobileSize : size
  const actualStrokeWidth = isMobile ? 6 : strokeWidth
  const radius = (actualSize - actualStrokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.min(value / max, 1)
  const offset = circumference - progress * circumference

  const colors = {
    green: { stroke: '#22c55e', text: 'text-green-500' },
    red: { stroke: '#ef4444', text: 'text-red-500' },
    yellow: { stroke: '#eab308', text: 'text-yellow-500' },
    purple: { stroke: '#a855f7', text: 'text-purple-500' },
    blue: { stroke: '#3b82f6', text: 'text-blue-500' },
  }

  const colorSet = colors[color] || colors.green

  return (
    <div className="relative flex flex-col items-center">
      <svg width={actualSize} height={actualSize} className="transform -rotate-90">
        <circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={actualStrokeWidth}
        />
        <motion.circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={radius}
          fill="none"
          stroke={colorSet.stroke}
          strokeWidth={actualStrokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg sm:text-2xl font-bold ${colorSet.text}`}>{label}</span>
        <span className="text-[10px] sm:text-xs text-gray-500">{sublabel}</span>
      </div>
    </div>
  )
}

// Phase Journey Step Component - Mobile responsive
const PhaseStep = ({ phase, label, isActive, isCompleted, isLast }) => {
  const getIcon = () => {
    if (isCompleted) return <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
    if (isActive) return <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 fill-purple-500" />
    return <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
  }

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
          isCompleted ? 'bg-green-500/20' : isActive ? 'bg-purple-500/20' : 'bg-dark-300'
        }`}>
          {getIcon()}
        </div>
        <span className={`mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium ${
          isActive ? 'text-purple-400' : isCompleted ? 'text-green-400' : 'text-gray-500'
        }`}>
          {label}
        </span>
      </div>
      {!isLast && (
        <div className={`w-6 sm:w-12 md:w-20 h-0.5 mx-1 sm:mx-2 ${
          isCompleted ? 'bg-green-500' : 'bg-dark-300'
        }`} />
      )}
    </div>
  )
}

// Animated Stat Card - Mobile responsive
const StatCard = ({ icon: Icon, label, value, subvalue, color = 'white', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-dark-200/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/5 hover:border-white/10 transition-all"
  >
    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
        <Icon className={`w-3 h-3 sm:w-4 sm:h-4 text-${color}-500`} />
      </div>
      <span className="text-[10px] sm:text-xs text-gray-400 truncate">{label}</span>
    </div>
    <p className={`text-base sm:text-xl font-bold text-${color === 'white' ? 'white' : color + '-500'} truncate`}>{value}</p>
    {subvalue && <p className="text-[10px] sm:text-xs text-gray-500 mt-1 truncate">{subvalue}</p>}
  </motion.div>
)

// Equity Curve Chart Component - Mobile responsive
const EquityCurveChart = ({ trades, initialBalance }) => {
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) return []

    const sortedTrades = [...trades]
      .filter(t => t.status === 'closed' && t.closed_at)
      .sort((a, b) => new Date(a.closed_at) - new Date(b.closed_at))

    let balance = initialBalance
    const data = [{ label: 'Start', balance: initialBalance, pnl: 0, tradeNum: 0 }]

    sortedTrades.forEach((trade, index) => {
      balance += (trade.pnl || 0)
      const date = new Date(trade.closed_at)
      data.push({
        label: `#${index + 1}`,
        fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        balance: Math.round(balance * 100) / 100,
        pnl: trade.pnl || 0,
        symbol: trade.symbol,
        tradeNum: index + 1
      })
    })

    return data
  }, [trades, initialBalance])

  const isProfit = chartData.length > 1 && chartData[chartData.length - 1].balance >= initialBalance
  const strokeColor = isProfit ? '#22c55e' : '#ef4444'
  const gradientColor = isProfit ? '#22c55e' : '#ef4444'

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-dark-200 border border-white/10 rounded-lg p-2 sm:p-3 shadow-xl text-xs sm:text-sm">
          <p className="text-gray-400 text-[10px] sm:text-xs mb-1">
            {data.tradeNum === 0 ? 'Start' : `Trade ${data.tradeNum}`}
          </p>
          <p className="text-white font-bold">
            ${data.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          {data.pnl !== 0 && (
            <p className={`text-[10px] sm:text-xs mt-1 ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.pnl >= 0 ? '+' : ''}${data.pnl?.toFixed(2)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  if (chartData.length < 2) {
    return (
      <div className="h-48 sm:h-64 flex items-center justify-center">
        <div className="text-center">
          <LineChart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-2 sm:mb-3" />
          <p className="text-gray-400 text-sm">No trade history yet</p>
          <p className="text-gray-500 text-xs">Complete trades to see your equity curve</p>
        </div>
      </div>
    )
  }

  const minBalance = Math.min(...chartData.map(d => d.balance))
  const maxBalance = Math.max(...chartData.map(d => d.balance))
  const range = maxBalance - minBalance
  const padding = range * 0.15 || 500

  const formatYAxis = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(range < 5000 ? 1 : 0)}k`
    return `$${value.toFixed(0)}`
  }

  return (
    <div className="h-48 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={gradientColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
            domain={[minBalance - padding, maxBalance + padding]}
            tickCount={4}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={initialBalance} stroke="#6b7280" strokeDasharray="5 5" strokeWidth={1} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#equityGradient)"
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const AccountsPage = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { challenge: contextChallenge } = useChallenge()
  const [challenge, setChallenge] = useState(null)
  const [trades, setTrades] = useState([])
  const [openPnLData, setOpenPnLData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  const [showResetModal, setShowResetModal] = useState(false)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    const pnlInterval = setInterval(fetchOpenPnL, 10000)
    return () => {
      clearInterval(interval)
      clearInterval(pnlInterval)
    }
  }, [])

  const fetchData = async () => {
    try {
      setRefreshing(true)
      try {
        const challengeRes = await challengesAPI.getActive()
        setChallenge(challengeRes.data.challenge)
        const tradesRes = await tradesAPI.getAll(challengeRes.data.challenge.id)
        setTrades(tradesRes.data.trades || [])
      } catch (error) {
        if (error.response?.status === 404) {
          setChallenge(null)
          setTrades([])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchOpenPnL = async () => {
    try {
      const pnlRes = await tradesAPI.getOpenPnL()
      setOpenPnLData(pnlRes.data)
    } catch (error) {
      console.log('PnL update failed:', error)
    }
  }

  const handleCloseTrade = async (tradeId) => {
    try {
      const response = await tradesAPI.close(tradeId)
      const pnl = response.data.pnl
      showSuccessToast(`Trade closed! PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`)
      fetchData()
      fetchOpenPnL()
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleAddonSuccess = (result) => {
    showSuccessToast(result.message || 'Operation completed successfully!')
    fetchData()
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const openTrades = trades.filter(t => t.status === 'open')
  const closedTrades = trades.filter(t => t.status === 'closed')

  const stats = useMemo(() => {
    if (!challenge) {
      return {
        totalPnl: 0, winRate: 0, totalTrades: 0, openPositions: 0,
        bestTrade: 0, worstTrade: 0, avgWin: 0, avgLoss: 0, profitFactor: 0,
        profitPercent: 0, currentBalance: 0, equity: 0, drawdown: 0, maxDrawdown: 0
      }
    }

    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0)
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0)
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0

    const pnlValues = closedTrades.map(t => t.pnl || 0)
    const bestTrade = pnlValues.length > 0 ? Math.max(...pnlValues) : 0
    const worstTrade = pnlValues.length > 0 ? Math.min(...pnlValues) : 0

    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length : 0
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length) : 0
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0

    const initialBalance = challenge.initial_balance || 10000
    const currentBalance = challenge.current_balance || initialBalance
    const unrealizedPnl = openPnLData?.total_unrealized_pnl || 0
    const equity = currentBalance + unrealizedPnl
    const profitPercent = ((currentBalance - initialBalance) / initialBalance) * 100

    const drawdown = challenge.max_balance ? ((challenge.max_balance - currentBalance) / challenge.max_balance) * 100 : 0
    const maxDrawdown = challenge.max_drawdown_percent || 10

    return {
      totalPnl, winRate, totalTrades: closedTrades.length, openPositions: openTrades.length,
      bestTrade, worstTrade, avgWin, avgLoss, profitFactor, profitPercent,
      currentBalance, equity, initialBalance, drawdown, maxDrawdown, unrealizedPnl
    }
  }, [closedTrades, openTrades, challenge, openPnLData])

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {[1,2,3].map(i => <SkeletonChallengeCard key={i} />)}
        </div>
        <SkeletonPositionsTable rows={3} />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] relative px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full blur-[150px]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-dark-100/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center max-w-md w-full border border-white/5 shadow-2xl"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Zap className="text-white w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Start Your Journey</h2>
          <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">Join thousands of traders who have proven their skills and earned funded accounts.</p>
          <Link
            to="/plans"
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 w-full min-h-[48px] touch-manipulation"
          >
            <Zap size={18} />
            Get Funded Now
          </Link>
        </motion.div>
      </div>
    )
  }

  const profitTarget = (challenge.profit_target * 100) || 10
  const profitProgress = Math.max(stats.profitPercent, 0)
  const drawdownUsed = Math.max(stats.drawdown, 0)

  const phases = ['trial', 'evaluation', 'verification', 'funded']
  const currentPhaseIndex = phases.indexOf(challenge.phase)

  const getDrawdownColor = () => {
    const ratio = drawdownUsed / stats.maxDrawdown
    if (ratio >= 0.9) return 'red'
    if (ratio >= 0.7) return 'yellow'
    return 'green'
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8 px-2 sm:px-0">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{user?.username || 'Trader'}</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Track your challenge progress</p>
        </div>
        <Link
          to="/trading"
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 w-full sm:w-auto min-h-[48px] touch-manipulation"
        >
          <Activity size={18} />
          Start Trading
        </Link>
      </motion.div>

      {/* Main Account Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-dark-100 to-dark-200 rounded-xl sm:rounded-2xl border border-white/5 overflow-hidden"
      >
        {/* Account Header */}
        <div className="p-4 sm:p-6 border-b border-white/5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                {challenge.phase === 'funded' ? (
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                ) : (
                  <Target className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-xl font-bold text-white truncate">
                    {challenge.phase === 'trial' ? 'Free Trial' :
                     challenge.phase === 'evaluation' ? 'Phase 1' :
                     challenge.phase === 'verification' ? 'Phase 2' :
                     'Funded'}
                  </h2>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-gray-400 text-sm">${challenge.initial_balance?.toLocaleString()} Account</p>
              </div>
            </div>

            {/* Balance Display */}
            <div className="bg-dark-300/30 rounded-xl p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-400">Current Balance</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">
                ${stats.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className={`text-xs sm:text-sm font-medium ${stats.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.profitPercent >= 0 ? '+' : ''}{stats.profitPercent.toFixed(2)}% from start
              </p>
            </div>
          </div>
        </div>

        {/* Progress Circles - 2 columns on mobile, 4 on desktop */}
        <div className="p-3 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="flex flex-col items-center p-2 sm:p-4 bg-dark-300/30 rounded-lg sm:rounded-xl">
            <CircularProgress
              value={profitProgress}
              max={profitTarget}
              color="green"
              label={`${profitProgress.toFixed(1)}%`}
              sublabel={`of ${profitTarget}%`}
            />
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-gray-300">Profit Target</p>
          </div>

          <div className="flex flex-col items-center p-2 sm:p-4 bg-dark-300/30 rounded-lg sm:rounded-xl">
            <CircularProgress
              value={drawdownUsed}
              max={stats.maxDrawdown}
              color={getDrawdownColor()}
              label={`${drawdownUsed.toFixed(1)}%`}
              sublabel={`of ${stats.maxDrawdown}%`}
            />
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-gray-300">Drawdown</p>
          </div>

          <div className="flex flex-col items-center p-2 sm:p-4 bg-dark-300/30 rounded-lg sm:rounded-xl">
            <CircularProgress
              value={stats.winRate}
              max={100}
              color="purple"
              label={`${stats.winRate.toFixed(0)}%`}
              sublabel="Win Rate"
            />
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-gray-300">Win Rate</p>
          </div>

          <div className="flex flex-col items-center p-2 sm:p-4 bg-dark-300/30 rounded-lg sm:rounded-xl">
            <CircularProgress
              value={Math.min(stats.profitFactor, 3)}
              max={3}
              color="blue"
              label={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
              sublabel="Factor"
            />
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-gray-300">Profit Factor</p>
          </div>
        </div>
      </motion.div>

      {/* Equity Curve Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-dark-100 rounded-xl sm:rounded-2xl border border-white/5 p-3 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <h3 className="text-sm sm:text-lg font-semibold text-white">Account Development</h3>
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-500" />
              <span className="text-gray-400">${stats.initialBalance?.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${stats.currentBalance >= stats.initialBalance ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={stats.currentBalance >= stats.initialBalance ? 'text-green-400' : 'text-red-400'}>
                ${stats.currentBalance?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <EquityCurveChart trades={trades} initialBalance={stats.initialBalance} />
      </motion.div>

      {/* Phase Journey */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-dark-100 rounded-xl sm:rounded-2xl border border-white/5 p-4 sm:p-6"
      >
        <h3 className="text-sm sm:text-lg font-semibold text-white mb-4 sm:mb-6">Your Journey</h3>
        <div className="flex items-center justify-center overflow-x-auto pb-2">
          <PhaseStep phase="trial" label="Trial" isActive={challenge.phase === 'trial'} isCompleted={currentPhaseIndex > 0} />
          <PhaseStep phase="evaluation" label="Phase 1" isActive={challenge.phase === 'evaluation'} isCompleted={currentPhaseIndex > 1} />
          <PhaseStep phase="verification" label="Phase 2" isActive={challenge.phase === 'verification'} isCompleted={currentPhaseIndex > 2} />
          <PhaseStep phase="funded" label="Funded" isActive={challenge.phase === 'funded'} isCompleted={false} isLast />
        </div>
      </motion.div>

      {/* Stats Grid - 3 columns on mobile */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        <StatCard icon={BarChart2} label="Trades" value={stats.totalTrades} delay={0.1} />
        <StatCard icon={TrendingUp} label="Best" value={`+$${stats.bestTrade.toFixed(0)}`} color="green" delay={0.15} />
        <StatCard icon={TrendingDown} label="Worst" value={`$${stats.worstTrade.toFixed(0)}`} color="red" delay={0.2} />
        <StatCard icon={Target} label="Avg Win" value={`+$${stats.avgWin.toFixed(0)}`} color="green" delay={0.25} />
        <StatCard icon={AlertTriangle} label="Avg Loss" value={`-$${stats.avgLoss.toFixed(0)}`} color="red" delay={0.3} />
        <StatCard icon={Activity} label="Open" value={openTrades.length} color="purple" delay={0.35} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Trading Credentials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-dark-100 rounded-xl sm:rounded-2xl border border-white/5 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <h3 className="text-sm sm:text-lg font-semibold text-white">Trading Credentials</h3>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:gap-4">
            {[
              { label: 'Login', value: challenge.trading_login || '00000', field: 'login' },
              { label: 'Password', value: challenge.trading_password || 'password', display: '••••••••', field: 'password' },
              { label: 'Server', value: challenge.trading_server || 'TradeSense-Demo', field: 'server' },
            ].map((cred) => (
              <div key={cred.field} className="flex items-center justify-between bg-dark-200/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/5">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-gray-400">{cred.label}</p>
                  <p className="font-mono text-white text-sm sm:text-base truncate">{cred.display || cred.value}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(cred.value, cred.field)}
                  className="p-2 sm:p-3 hover:bg-dark-300 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                >
                  {copiedField === cred.field ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
          <a
            href="https://www.metatrader5.com/en/download"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-dark-200/50 hover:bg-dark-300 rounded-lg text-sm text-gray-300 hover:text-white transition-all min-h-[44px] touch-manipulation"
          >
            <ExternalLink size={14} />
            Download MT5
          </a>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 sm:space-y-4"
        >
          {/* Plan Info */}
          <div className="bg-dark-100 rounded-xl sm:rounded-2xl border border-white/5 p-4 sm:p-5">
            <h4 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4">Account Details</h4>
            <div className="space-y-2 sm:space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Plan Type</span>
                <span className="text-purple-400 font-medium">{challenge.plan_type || 'Standard'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Platform</span>
                <span className="text-white font-medium">MT5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Account Size</span>
                <span className="text-white font-medium">${challenge.initial_balance?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Add-ons */}
          {challenge.phase !== 'trial' && (
            <div className="bg-dark-100 rounded-xl sm:rounded-2xl border border-white/5 p-4 sm:p-5">
              <h4 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                <Zap size={14} className="text-yellow-400" />
                Add-ons
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Reset Challenge', icon: RefreshCw, onClick: () => setShowResetModal(true) },
                  { label: 'Extend Time', icon: Clock, onClick: () => setShowExtendModal(true) },
                  { label: 'Upgrade Account', icon: TrendingUp, onClick: () => setShowUpgradeModal(true) },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-dark-200/50 hover:bg-dark-300 rounded-lg sm:rounded-xl transition-all group min-h-[48px] touch-manipulation"
                  >
                    <span className="flex items-center gap-2 text-gray-300 group-hover:text-white text-sm">
                      <item.icon size={16} />
                      {item.label}
                    </span>
                    <ChevronRight size={16} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Promo */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl sm:rounded-2xl border border-purple-500/30 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Gift size={18} className="text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm sm:text-base mb-1">Special Offer</h4>
                <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">20% off with code TRADER20</p>
                <Link to="/my-offers" className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1">
                  View Offers <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Open Positions */}
      <AnimatePresence>
        {openTrades.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-dark-100 rounded-xl sm:rounded-2xl border border-white/5 overflow-hidden"
          >
            <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-semibold text-white text-sm sm:text-base">Open Positions</span>
                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full">
                  {openTrades.length}
                </span>
              </div>
              {openPnLData && (
                <span className={`font-bold text-sm sm:text-base ${openPnLData.total_unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {openPnLData.total_unrealized_pnl >= 0 ? '+' : ''}${openPnLData.total_unrealized_pnl.toFixed(2)}
                </span>
              )}
            </div>
            <div className="divide-y divide-white/5">
              {openTrades.map(trade => {
                const pnlInfo = openPnLData?.trades?.find(t => t.trade_id === trade.id)
                return (
                  <div key={trade.id} className="p-3 sm:p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-1 h-8 sm:h-10 rounded-full ${trade.trade_type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="font-semibold text-white text-sm sm:text-base">{trade.symbol}</span>
                          <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded ${
                            trade.trade_type === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {trade.trade_type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500">{trade.quantity} @ ${trade.entry_price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                      {pnlInfo && (
                        <div className="text-right">
                          <p className={`font-bold text-sm sm:text-base ${pnlInfo.unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {pnlInfo.unrealized_pnl >= 0 ? '+' : ''}${pnlInfo.unrealized_pnl.toFixed(0)}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => handleCloseTrade(trade.id)}
                        className="p-2 sm:p-3 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade History */}
      {closedTrades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-dark-100 rounded-xl sm:rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className="font-semibold text-white text-sm sm:text-base">History</span>
              <span className="text-[10px] sm:text-xs text-gray-500">({closedTrades.length})</span>
            </div>
            <span className={`font-bold text-sm ${stats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(0)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-dark-200/50">
                <tr className="text-[10px] sm:text-xs text-gray-500 uppercase">
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-medium">Symbol</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-medium">Type</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-medium">Entry</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-medium">Exit</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right font-medium">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {closedTrades.slice(0, 10).map(trade => (
                  <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-white text-xs sm:text-sm">{trade.symbol}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded ${
                        trade.trade_type === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {trade.trade_type === 'buy' ? 'BUY' : 'SELL'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs sm:text-sm">${Number(trade.entry_price).toFixed(2)}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs sm:text-sm">${Number(trade.exit_price).toFixed(2)}</td>
                    <td className={`px-3 sm:px-4 py-2 sm:py-3 text-right font-bold text-xs sm:text-sm ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Modals */}
      <ResetModal isOpen={showResetModal} onClose={() => setShowResetModal(false)} challenge={challenge} onSuccess={handleAddonSuccess} />
      <ExtendModal isOpen={showExtendModal} onClose={() => setShowExtendModal(false)} challenge={challenge} onSuccess={handleAddonSuccess} />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} challenge={challenge} onSuccess={handleAddonSuccess} />
    </div>
  )
}

export default AccountsPage
