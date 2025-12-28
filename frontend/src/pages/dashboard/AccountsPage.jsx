import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
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
  CheckCircle2, Circle, Lock
} from 'lucide-react'
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler'

// Circular Progress Component
const CircularProgress = ({ value, max, size = 120, strokeWidth = 8, color = 'green', label, sublabel }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.min(value / max, 1)
  const offset = circumference - progress * circumference

  const colors = {
    green: { stroke: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', text: 'text-green-500' },
    red: { stroke: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', text: 'text-red-500' },
    yellow: { stroke: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', text: 'text-yellow-500' },
    purple: { stroke: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', text: 'text-purple-500' },
    blue: { stroke: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', text: 'text-blue-500' },
  }

  const colorSet = colors[color] || colors.green

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorSet.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${colorSet.text}`}>{label}</span>
        <span className="text-xs text-gray-500">{sublabel}</span>
      </div>
    </div>
  )
}

// Phase Journey Step Component
const PhaseStep = ({ phase, label, isActive, isCompleted, isLast }) => {
  const getIcon = () => {
    if (isCompleted) return <CheckCircle2 className="w-5 h-5 text-green-500" />
    if (isActive) return <Circle className="w-5 h-5 text-purple-500 fill-purple-500" />
    return <Lock className="w-5 h-5 text-gray-600" />
  }

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isCompleted ? 'bg-green-500/20' : isActive ? 'bg-purple-500/20' : 'bg-dark-300'
        }`}>
          {getIcon()}
        </div>
        <span className={`mt-2 text-xs font-medium ${
          isActive ? 'text-purple-400' : isCompleted ? 'text-green-400' : 'text-gray-500'
        }`}>
          {label}
        </span>
      </div>
      {!isLast && (
        <div className={`w-12 sm:w-20 h-0.5 mx-2 ${
          isCompleted ? 'bg-green-500' : 'bg-dark-300'
        }`} />
      )}
    </div>
  )
}

// Animated Stat Card
const StatCard = ({ icon: Icon, label, value, subvalue, color = 'white', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all"
  >
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-8 h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
        <Icon className={`w-4 h-4 text-${color}-500`} />
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
    <p className={`text-xl font-bold text-${color === 'white' ? 'white' : color + '-500'}`}>{value}</p>
    {subvalue && <p className="text-xs text-gray-500 mt-1">{subvalue}</p>}
  </motion.div>
)

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
  const [activeTab, setActiveTab] = useState('overview')

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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <SkeletonChallengeCard key={i} />)}
        </div>
        <SkeletonPositionsTable rows={3} />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] relative px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-dark-100/80 backdrop-blur-xl rounded-2xl p-12 text-center max-w-md w-full border border-white/5 shadow-2xl"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="text-white w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Start Your Journey</h2>
          <p className="text-gray-400 mb-8">Join thousands of traders who have proven their skills and earned funded accounts.</p>
          <Link
            to="/plans"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 w-full"
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
    <div className="space-y-6 pb-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{user?.username || 'Trader'}</span>
          </h1>
          <p className="text-gray-400 mt-1">Track your challenge progress and trading performance</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/trading"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20"
          >
            <Activity size={18} />
            Start Trading
          </Link>
        </div>
      </motion.div>

      {/* Main Account Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-dark-100 to-dark-200 rounded-2xl border border-white/5 overflow-hidden"
      >
        {/* Account Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                {challenge.phase === 'funded' ? (
                  <Trophy className="w-7 h-7 text-white" />
                ) : (
                  <Target className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">
                    {challenge.phase === 'trial' ? 'Free Trial' :
                     challenge.phase === 'evaluation' ? 'Phase 1 - Evaluation' :
                     challenge.phase === 'verification' ? 'Phase 2 - Verification' :
                     'Funded Account'}
                  </h2>
                  <span className="px-3 py-1 bg-green-500/10 text-green-400 text-sm font-medium rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-gray-400">${challenge.initial_balance?.toLocaleString()} Account</p>
              </div>
            </div>

            {/* Account Balance Display */}
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-sm text-gray-400">Current Balance</p>
                <p className="text-3xl font-bold text-white">
                  ${stats.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-sm font-medium ${stats.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.profitPercent >= 0 ? '+' : ''}{stats.profitPercent.toFixed(2)}% from start
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Circles */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Profit Target */}
          <div className="flex flex-col items-center p-4 bg-dark-300/30 rounded-xl">
            <CircularProgress
              value={profitProgress}
              max={profitTarget}
              color="green"
              label={`${profitProgress.toFixed(1)}%`}
              sublabel={`of ${profitTarget}%`}
            />
            <p className="mt-3 text-sm font-medium text-gray-300">Profit Target</p>
            <p className="text-xs text-gray-500">+{profitTarget}% required</p>
          </div>

          {/* Drawdown */}
          <div className="flex flex-col items-center p-4 bg-dark-300/30 rounded-xl">
            <CircularProgress
              value={drawdownUsed}
              max={stats.maxDrawdown}
              color={getDrawdownColor()}
              label={`${drawdownUsed.toFixed(1)}%`}
              sublabel={`of ${stats.maxDrawdown}%`}
            />
            <p className="mt-3 text-sm font-medium text-gray-300">Max Drawdown</p>
            <p className="text-xs text-gray-500">{stats.maxDrawdown}% limit</p>
          </div>

          {/* Win Rate */}
          <div className="flex flex-col items-center p-4 bg-dark-300/30 rounded-xl">
            <CircularProgress
              value={stats.winRate}
              max={100}
              color="purple"
              label={`${stats.winRate.toFixed(0)}%`}
              sublabel="Win Rate"
            />
            <p className="mt-3 text-sm font-medium text-gray-300">Win Rate</p>
            <p className="text-xs text-gray-500">{closedTrades.filter(t => t.pnl > 0).length} / {closedTrades.length} trades</p>
          </div>

          {/* Profit Factor */}
          <div className="flex flex-col items-center p-4 bg-dark-300/30 rounded-xl">
            <CircularProgress
              value={Math.min(stats.profitFactor, 3)}
              max={3}
              color="blue"
              label={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
              sublabel="Factor"
            />
            <p className="mt-3 text-sm font-medium text-gray-300">Profit Factor</p>
            <p className="text-xs text-gray-500">Risk/Reward ratio</p>
          </div>
        </div>
      </motion.div>

      {/* Phase Journey */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-dark-100 rounded-2xl border border-white/5 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-6">Your Trading Journey</h3>
        <div className="flex items-center justify-center overflow-x-auto pb-2">
          <PhaseStep
            phase="trial"
            label="Trial"
            isActive={challenge.phase === 'trial'}
            isCompleted={currentPhaseIndex > 0}
          />
          <PhaseStep
            phase="evaluation"
            label="Phase 1"
            isActive={challenge.phase === 'evaluation'}
            isCompleted={currentPhaseIndex > 1}
          />
          <PhaseStep
            phase="verification"
            label="Phase 2"
            isActive={challenge.phase === 'verification'}
            isCompleted={currentPhaseIndex > 2}
          />
          <PhaseStep
            phase="funded"
            label="Funded"
            isActive={challenge.phase === 'funded'}
            isCompleted={false}
            isLast
          />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={BarChart2} label="Total Trades" value={stats.totalTrades} delay={0.1} />
        <StatCard icon={TrendingUp} label="Best Trade" value={`+$${stats.bestTrade.toFixed(0)}`} color="green" delay={0.15} />
        <StatCard icon={TrendingDown} label="Worst Trade" value={`$${stats.worstTrade.toFixed(0)}`} color="red" delay={0.2} />
        <StatCard icon={Target} label="Avg Win" value={`+$${stats.avgWin.toFixed(0)}`} color="green" delay={0.25} />
        <StatCard icon={AlertTriangle} label="Avg Loss" value={`-$${stats.avgLoss.toFixed(0)}`} color="red" delay={0.3} />
        <StatCard icon={Activity} label="Open Positions" value={openTrades.length} color="purple" delay={0.35} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Credentials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-dark-100 rounded-2xl border border-white/5 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Trading Credentials</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Login', value: challenge.trading_login || '00000', field: 'login' },
              { label: 'Password', value: challenge.trading_password || 'password', display: '••••••••', field: 'password' },
              { label: 'Server', value: challenge.trading_server || 'TradeSense-Demo', field: 'server' },
            ].map((cred) => (
              <div key={cred.field} className="flex items-center justify-between bg-dark-200/50 rounded-xl p-4 border border-white/5">
                <div>
                  <p className="text-xs text-gray-400">{cred.label}</p>
                  <p className="font-mono text-white">{cred.display || cred.value}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(cred.value, cred.field)}
                  className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                >
                  {copiedField === cred.field ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Download Links */}
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://www.metatrader5.com/en/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-dark-200/50 hover:bg-dark-300 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
            >
              <ExternalLink size={14} />
              Download MT5
            </a>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {/* Plan Info */}
          <div className="bg-dark-100 rounded-2xl border border-white/5 p-5">
            <h4 className="font-semibold text-white mb-4">Account Details</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Plan Type</span>
                <span className="text-purple-400 font-medium">{challenge.plan_type || 'Standard'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Platform</span>
                <span className="text-white font-medium">MetaTrader 5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Account Size</span>
                <span className="text-white font-medium">${challenge.initial_balance?.toLocaleString()}</span>
              </div>
              {challenge.phase === 'trial' && challenge.trial_expires_at && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm flex items-center gap-1">
                    <Timer size={12} /> Expires
                  </span>
                  <span className="text-yellow-400 font-medium">
                    {new Date(challenge.trial_expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Add-ons */}
          {challenge.phase !== 'trial' && (
            <div className="bg-dark-100 rounded-2xl border border-white/5 p-5">
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Zap size={16} className="text-yellow-400" />
                Challenge Add-ons
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => setShowResetModal(true)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-dark-200/50 hover:bg-dark-300 rounded-xl transition-all group"
                >
                  <span className="flex items-center gap-2 text-gray-300 group-hover:text-white">
                    <RefreshCw size={16} />
                    Reset Challenge
                  </span>
                  <ChevronRight size={16} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setShowExtendModal(true)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-dark-200/50 hover:bg-dark-300 rounded-xl transition-all group"
                >
                  <span className="flex items-center gap-2 text-gray-300 group-hover:text-white">
                    <Clock size={16} />
                    Extend Time
                  </span>
                  <ChevronRight size={16} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-dark-200/50 hover:bg-dark-300 rounded-xl transition-all group"
                >
                  <span className="flex items-center gap-2 text-gray-300 group-hover:text-white">
                    <TrendingUp size={16} />
                    Upgrade Account
                  </span>
                  <ChevronRight size={16} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Promo */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Gift size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Special Offer</h4>
                <p className="text-sm text-gray-300 mb-3">Get 20% off your next challenge with code TRADER20</p>
                <Link to="/my-offers" className="text-sm text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1">
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
            className="bg-dark-100 rounded-2xl border border-white/5 overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-semibold text-white">Open Positions</span>
                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full">
                  {openTrades.length}
                </span>
              </div>
              {openPnLData && (
                <span className={`font-bold ${openPnLData.total_unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {openPnLData.total_unrealized_pnl >= 0 ? '+' : ''}${openPnLData.total_unrealized_pnl.toFixed(2)}
                </span>
              )}
            </div>
            <div className="divide-y divide-white/5">
              {openTrades.map(trade => {
                const pnlInfo = openPnLData?.trades?.find(t => t.trade_id === trade.id)
                return (
                  <div key={trade.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-10 rounded-full ${trade.trade_type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{trade.symbol}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            trade.trade_type === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {trade.trade_type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{trade.quantity} lots @ ${trade.entry_price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {pnlInfo && (
                        <div className="text-right">
                          <p className={`font-bold ${pnlInfo.unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {pnlInfo.unrealized_pnl >= 0 ? '+' : ''}${pnlInfo.unrealized_pnl.toFixed(2)}
                          </p>
                          <p className={`text-xs ${pnlInfo.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnlInfo.pnl_percent >= 0 ? '+' : ''}{pnlInfo.pnl_percent.toFixed(2)}%
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => handleCloseTrade(trade.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all"
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
          className="bg-dark-100 rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              <span className="font-semibold text-white">Trade History</span>
              <span className="text-xs text-gray-500">({closedTrades.length} trades)</span>
            </div>
            <span className={`font-bold ${stats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              Total: {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-200/50">
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-medium">Symbol</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Entry</th>
                  <th className="px-4 py-3 text-left font-medium">Exit</th>
                  <th className="px-4 py-3 text-left font-medium">Lots</th>
                  <th className="px-4 py-3 text-right font-medium">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {closedTrades.slice(0, 10).map(trade => (
                  <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{trade.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        trade.trade_type === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {trade.trade_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">${Number(trade.entry_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-400">${Number(trade.exit_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-400">{trade.quantity}</td>
                    <td className={`px-4 py-3 text-right font-bold ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Modals */}
      <ResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        challenge={challenge}
        onSuccess={handleAddonSuccess}
      />
      <ExtendModal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        challenge={challenge}
        onSuccess={handleAddonSuccess}
      />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        challenge={challenge}
        onSuccess={handleAddonSuccess}
      />
    </div>
  )
}

export default AccountsPage
