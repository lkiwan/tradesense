import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { challengesAPI, tradesAPI } from '../../services/api'
import { useChallenge } from '../../context/ChallengeContext'
import { useAuth } from '../../context/AuthContext'
import PriceChart from '../../components/PriceChart'
import SignalsPanel from '../../components/SignalsPanel'
import TradeForm from '../../components/TradeForm'
import PhaseProgress from '../../components/PhaseProgress'
import { ResetModal, ExtendModal, UpgradeModal } from '../../components/challenge'
import {
  SkeletonChart,
  SkeletonTradeForm,
  SkeletonChallengeCard,
  SkeletonPositionsTable,
} from '../../components/ui/Skeleton'
import {
  TrendingUp, TrendingDown, RefreshCw, Clock,
  DollarSign, Activity, AlertTriangle, X, Target,
  Award, BarChart3, Wallet, ArrowUpRight, ArrowDownRight,
  ChevronRight, Shield, Flame, Trophy, CircleDot, Star, Banknote,
  Rocket, Copy, Check, ExternalLink, Monitor, Gift, Timer, Sparkles
} from 'lucide-react'
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler'

const SYMBOL_CATEGORIES = {
  popular: ['AAPL', 'TSLA', 'GOOGL', 'NVDA', 'BTC-USD', 'ETH-USD'],
  stocks: ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'NFLX', 'AMD'],
  crypto: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD', 'ADA-USD'],
  moroccan: ['IAM', 'ATW', 'BCP', 'CIH', 'TAQA', 'MNG']
}

const AccountsPage = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { challenge: contextChallenge, isFunded, currentPhase, refetch: refetchChallenge } = useChallenge()
  const [challenge, setChallenge] = useState(null)
  const [trades, setTrades] = useState([])
  const [openPnLData, setOpenPnLData] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [selectedCategory, setSelectedCategory] = useState('popular')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  // Add-on modals state
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
      // Note: Don't call refetchChallenge() here as it causes infinite re-renders
      // The local challenge state is sufficient for this page
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
      const pnlSign = pnl >= 0 ? '+' : ''
      showSuccessToast(`Trade closed! PnL: ${pnlSign}$${pnl.toFixed(2)}`)
      fetchData()
      fetchOpenPnL()
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleTradeComplete = () => {
    fetchData()
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonChart height={400} />
            <SkeletonPositionsTable rows={3} />
          </div>
          <div className="space-y-6">
            <SkeletonTradeForm />
          </div>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] relative px-4">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-primary-500/10 rounded-full blur-[150px]" />

        <div className="relative bg-dark-100/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center max-w-md w-full border border-white/5 shadow-2xl">
          <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-yellow-500/30">
            <AlertTriangle className="text-yellow-500" size={28} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            No Active Challenge
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">
            Start your trading journey by purchasing a challenge or activating your free trial.
          </p>
          <Link
            to="/plans"
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] min-h-[48px] w-full sm:w-auto touch-manipulation"
          >
            <Rocket size={18} />
            View Plans
          </Link>
        </div>
      </div>
    )
  }

  const phaseColors = {
    trial: { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-500/10', gradient: 'from-blue-500 to-blue-600' },
    evaluation: { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-500/10', gradient: 'from-purple-500 to-purple-600' },
    verification: { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-500/10', gradient: 'from-orange-500 to-orange-600' },
    funded: { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-500/10', gradient: 'from-green-500 to-green-600' }
  }
  const phaseColor = phaseColors[challenge.phase] || phaseColors.evaluation

  const profitTarget = (challenge.profit_target * 100) || 10
  const profitProgress = Math.min((stats.profitPercent / profitTarget) * 100, 100)
  const drawdownProgress = Math.min((stats.drawdown / stats.maxDrawdown) * 100, 100)

  const phaseNames = {
    trial: 'Free Trial',
    evaluation: 'Phase 1 - Evaluation',
    verification: 'Phase 2 - Verification',
    funded: 'Funded Account'
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className={`bg-gradient-to-r ${phaseColor.gradient} rounded-2xl p-4 md:p-6 lg:p-8 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-white/80 text-sm mb-1">Welcome back,</p>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white break-words">{user?.username || 'Trader'}</h1>
              <p className="text-white/80 mt-2 text-sm md:text-base">Unlock your trading potential with TradeSense. Start trading now!</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/plans"
                className="inline-flex items-center justify-center gap-2 px-4 md:px-5 py-3 md:py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all backdrop-blur-sm min-h-[44px] w-full md:w-auto"
              >
                <Rocket size={18} />
                Start Challenge
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Account Card + Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Card */}
        <div className="lg:col-span-2 bg-dark-100 rounded-lg sm:rounded-xl border border-dark-200 overflow-hidden">
          <div className="p-3 sm:p-5 border-b border-dark-200 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${phaseColor.bg} rounded-lg flex items-center justify-center`}>
                {challenge.phase === 'funded' ? <Trophy size={16} className="text-white sm:w-5 sm:h-5" /> : <Target size={16} className="text-white sm:w-5 sm:h-5" />}
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm sm:text-base">{phaseNames[challenge.phase]}</h3>
                <p className="text-xs sm:text-sm text-gray-400">${challenge.initial_balance?.toLocaleString()} Account</p>
              </div>
            </div>
            <span className={`px-2 sm:px-3 py-1 ${phaseColor.light} ${phaseColor.text} text-xs sm:text-sm font-medium rounded-full`}>
              Active
            </span>
          </div>

          <div className="p-3 sm:p-4 md:p-5 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {/* Balance */}
            <div className="bg-dark-200/50 rounded-lg p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Balance</p>
              <p className="text-base sm:text-xl font-bold text-white">${stats.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              <p className={`text-[10px] sm:text-xs mt-1 ${stats.profitPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.profitPercent >= 0 ? '+' : ''}{stats.profitPercent.toFixed(2)}%
              </p>
            </div>

            {/* Equity */}
            <div className="bg-dark-200/50 rounded-lg p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Equity</p>
              <p className="text-base sm:text-xl font-bold text-white">${stats.equity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              {stats.unrealizedPnl !== 0 && (
                <p className={`text-[10px] sm:text-xs mt-1 ${stats.unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.unrealizedPnl >= 0 ? '+' : ''}${stats.unrealizedPnl.toFixed(0)}
                </p>
              )}
            </div>

            {/* Profit Target */}
            <div className="bg-dark-200/50 rounded-lg p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Objectif</p>
              <p className="text-base sm:text-xl font-bold text-white">
                {Math.max(stats.profitPercent, 0).toFixed(1)}%
                <span className="text-[10px] sm:text-sm text-gray-500 font-normal"> / {profitTarget}%</span>
              </p>
              <div className="mt-1.5 sm:mt-2 h-1 sm:h-1.5 bg-dark-300 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.max(profitProgress, 0)}%` }} />
              </div>
            </div>

            {/* Drawdown */}
            <div className="bg-dark-200/50 rounded-lg p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Drawdown</p>
              <p className={`text-base sm:text-xl font-bold ${stats.drawdown > stats.maxDrawdown * 0.7 ? 'text-red-500' : 'text-white'}`}>
                {stats.drawdown.toFixed(1)}%
                <span className="text-[10px] sm:text-sm text-gray-500 font-normal"> / {stats.maxDrawdown}%</span>
              </p>
              <div className="mt-1.5 sm:mt-2 h-1 sm:h-1.5 bg-dark-300 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${drawdownProgress > 70 ? 'bg-red-500' : drawdownProgress > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${drawdownProgress}%` }} />
              </div>
            </div>
          </div>

          {/* Trading Credentials */}
          <div className="p-3 sm:p-4 md:p-5 border-t border-dark-200">
            <h4 className="text-xs sm:text-sm font-medium text-gray-400 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
              <Monitor size={14} className="sm:w-4 sm:h-4" />
              MT5 Credentials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="flex items-center justify-between bg-dark-200/50 rounded-lg px-3 py-2 sm:py-3 min-h-[52px] sm:min-h-[60px]">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-gray-400">Login</p>
                  <p className="font-mono text-white text-xs sm:text-sm truncate">{challenge.trading_login || '00000'}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(challenge.trading_login || '00000', 'login')}
                  className="p-1.5 sm:p-2 hover:bg-dark-300 rounded transition-colors ml-2 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center touch-manipulation"
                >
                  {copiedField === 'login' ? <Check size={14} className="text-green-500 sm:w-4 sm:h-4" /> : <Copy size={14} className="text-gray-400 sm:w-4 sm:h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between bg-dark-200/50 rounded-lg px-3 py-2 sm:py-3 min-h-[52px] sm:min-h-[60px]">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-gray-400">Password</p>
                  <p className="font-mono text-white text-xs sm:text-sm">••••••••</p>
                </div>
                <button
                  onClick={() => copyToClipboard(challenge.trading_password || 'password', 'password')}
                  className="p-1.5 sm:p-2 hover:bg-dark-300 rounded transition-colors ml-2 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center touch-manipulation"
                >
                  {copiedField === 'password' ? <Check size={14} className="text-green-500 sm:w-4 sm:h-4" /> : <Copy size={14} className="text-gray-400 sm:w-4 sm:h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between bg-dark-200/50 rounded-lg px-3 py-2 sm:py-3 min-h-[52px] sm:min-h-[60px]">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-gray-400">Server</p>
                  <p className="font-mono text-white text-xs sm:text-sm truncate">{challenge.trading_server || 'TradeSense-Demo'}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(challenge.trading_server || 'TradeSense-Demo', 'server')}
                  className="p-1.5 sm:p-2 hover:bg-dark-300 rounded transition-colors ml-2 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center touch-manipulation"
                >
                  {copiedField === 'server' ? <Check size={14} className="text-green-500 sm:w-4 sm:h-4" /> : <Copy size={14} className="text-gray-400 sm:w-4 sm:h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-4 sm:space-y-6">
          {/* Selected Plan */}
          <div className="bg-dark-100 rounded-lg sm:rounded-xl border border-dark-200 p-4 sm:p-5">
            <h4 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4">Selected Plan</h4>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs sm:text-sm">Plan Type</span>
                <span className={`${phaseColor.text} font-medium text-xs sm:text-sm`}>{challenge.phase === 'trial' ? 'Free Trial' : challenge.plan_type || 'Standard'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs sm:text-sm">Platform</span>
                <span className="text-white font-medium text-xs sm:text-sm">MT5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs sm:text-sm">Account Type</span>
                <span className="text-white font-medium text-xs sm:text-sm">Swap Account</span>
              </div>
              {challenge.phase === 'trial' && challenge.trial_expires_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1">
                    <Timer size={12} className="sm:w-[14px] sm:h-[14px]" />
                    Trial Ends
                  </span>
                  <span className="text-yellow-500 font-medium text-xs sm:text-sm">
                    {new Date(challenge.trial_expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            <Link
              to="/plans"
              className="mt-3 sm:mt-4 w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-dark-200 hover:bg-dark-300 text-white rounded-lg font-medium transition-all text-sm min-h-[44px] touch-manipulation"
            >
              <ExternalLink size={14} className="sm:w-4 sm:h-4" />
              View All Plans
            </Link>

            {/* Add-on Actions */}
            {challenge.phase !== 'trial' && (
              <div className="mt-4 pt-4 border-t border-dark-200">
                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                  <Sparkles size={12} />
                  Challenge Add-ons
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowResetModal(true)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20 border border-orange-500/30 rounded-lg text-sm transition-all group"
                  >
                    <span className="flex items-center gap-2 text-orange-400">
                      <RefreshCw size={14} />
                      Reset Challenge
                    </span>
                    <ChevronRight size={14} className="text-orange-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={() => setShowExtendModal(true)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border border-blue-500/30 rounded-lg text-sm transition-all group"
                  >
                    <span className="flex items-center gap-2 text-blue-400">
                      <Clock size={14} />
                      Extend Time
                    </span>
                    <ChevronRight size={14} className="text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/30 rounded-lg text-sm transition-all group"
                  >
                    <span className="flex items-center gap-2 text-purple-400">
                      <TrendingUp size={14} />
                      Upgrade Account
                    </span>
                    <ChevronRight size={14} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Promo Banner */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg sm:rounded-xl border border-yellow-500/30 p-4 sm:p-5">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Gift size={16} className="text-white sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm sm:text-base mb-0.5 sm:mb-1">Special Offer!</h4>
                <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">Get 20% off your next challenge with code TRADER20</p>
                <Link
                  to="/my-offers"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-yellow-500 hover:text-yellow-400 font-medium"
                >
                  View Offers <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Progress */}
      <PhaseProgress />

      {/* Trading Stats Row */}
      <div className="bg-dark-100 rounded-lg sm:rounded-xl border border-dark-200 p-3 sm:p-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4 md:gap-6">
          <div className="text-center md:text-left">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Win Rate</p>
            <p className="text-sm sm:text-lg font-bold text-white">{stats.winRate.toFixed(1)}%</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Trades</p>
            <p className="text-sm sm:text-lg font-bold text-white">{stats.totalTrades}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Best</p>
            <p className="text-sm sm:text-lg font-bold text-green-500">+${stats.bestTrade.toFixed(0)}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Worst</p>
            <p className="text-sm sm:text-lg font-bold text-red-500">${stats.worstTrade.toFixed(0)}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Avg Win</p>
            <p className="text-sm sm:text-lg font-bold text-green-500">+${stats.avgWin.toFixed(0)}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">P. Factor</p>
            <p className="text-sm sm:text-lg font-bold text-white">
              {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <div className="bg-dark-100 rounded-lg sm:rounded-xl border border-dark-200 overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-dark-200">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CircleDot size={14} className="text-green-500 sm:w-4 sm:h-4" />
                  <span className="font-semibold text-white text-sm sm:text-base">{selectedSymbol}</span>
                </div>
                <div className="flex gap-0.5 sm:gap-1 bg-dark-200 p-0.5 sm:p-1 rounded-lg overflow-x-auto">
                  {Object.keys(SYMBOL_CATEGORIES).map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category)
                        setSelectedSymbol(SYMBOL_CATEGORIES[category][0])
                      }}
                      className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded transition-all capitalize whitespace-nowrap ${
                        selectedCategory === category
                          ? 'bg-dark-100 text-white shadow-sm'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {SYMBOL_CATEGORIES[selectedCategory].map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => setSelectedSymbol(symbol)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg transition-all min-h-[28px] sm:min-h-[32px] touch-manipulation ${
                      selectedSymbol === symbol
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
                    }`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
            <PriceChart symbol={selectedSymbol} height={300} className="sm:h-[400px]" />
          </div>

          {/* Open Positions */}
          {openTrades.length > 0 && (
            <div className="bg-dark-100 rounded-lg sm:rounded-xl border border-dark-200">
              <div className="p-3 sm:p-4 border-b border-dark-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Activity size={16} className="text-green-500 sm:w-[18px] sm:h-[18px]" />
                  <span className="font-semibold text-white text-sm sm:text-base">Positions</span>
                  <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-green-500/10 text-green-500">
                    {openTrades.length}
                  </span>
                </div>
                {openPnLData && (
                  <span className={`text-xs sm:text-sm font-bold ${openPnLData.total_unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {openPnLData.total_unrealized_pnl >= 0 ? '+' : ''}${openPnLData.total_unrealized_pnl.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="divide-y divide-dark-200">
                {openTrades.map(trade => {
                  const pnlInfo = openPnLData?.trades?.find(t => t.trade_id === trade.id)
                  return (
                    <div key={trade.id} className="p-3 sm:p-4 flex items-center justify-between hover:bg-dark-200/50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className={`w-1 h-8 sm:h-10 rounded-full flex-shrink-0 ${trade.trade_type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="font-semibold text-white text-sm sm:text-base">{trade.symbol}</span>
                            <span className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded ${trade.trade_type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {trade.trade_type === 'buy' ? 'L' : 'S'}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                            {trade.quantity} @ ${trade.entry_price}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        {pnlInfo ? (
                          <div className="text-right">
                            <p className={`font-bold text-sm sm:text-base ${pnlInfo.unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {pnlInfo.unrealized_pnl >= 0 ? '+' : ''}${pnlInfo.unrealized_pnl.toFixed(0)}
                            </p>
                            <p className={`text-[10px] sm:text-xs ${pnlInfo.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pnlInfo.pnl_percent >= 0 ? '+' : ''}{pnlInfo.pnl_percent.toFixed(1)}%
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-500">${trade.trade_value?.toFixed(0)}</p>
                        )}
                        <button
                          onClick={() => handleCloseTrade(trade.id)}
                          className="p-1.5 sm:p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center touch-manipulation"
                        >
                          <X size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Trade History */}
          {closedTrades.length > 0 && (
            <div className="bg-dark-100 rounded-lg sm:rounded-xl border border-dark-200">
              <div className="p-3 sm:p-4 border-b border-dark-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Clock size={16} className="text-gray-400 sm:w-[18px] sm:h-[18px]" />
                  <span className="font-semibold text-white text-sm sm:text-base">Historique</span>
                  <span className="text-[10px] sm:text-xs text-gray-500">({closedTrades.length})</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] sm:min-w-0">
                  <thead className="bg-dark-200/50">
                    <tr className="text-[10px] sm:text-xs text-gray-500 uppercase">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Symbol</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Type</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Entry</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Exit</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium">PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-200">
                    {closedTrades.slice(0, 10).map(trade => (
                      <tr key={trade.id} className="hover:bg-dark-200/30 transition-colors">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-white text-xs sm:text-sm">{trade.symbol}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${
                            trade.trade_type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {trade.trade_type === 'buy' ? 'L' : 'S'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs sm:text-sm">${Number(trade.entry_price).toFixed(2)}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-400 text-xs sm:text-sm">${Number(trade.exit_price).toFixed(2)}</td>
                        <td className={`px-2 sm:px-4 py-2 sm:py-3 text-right font-bold text-xs sm:text-sm ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <TradeForm challenge={challenge} onTradeComplete={handleTradeComplete} />
          <SignalsPanel symbols={['AAPL', 'TSLA', 'NVDA', 'BTC-USD', 'ETH-USD', 'IAM', 'ATW']} />
        </div>
      </div>

      {/* Add-on Modals */}
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
