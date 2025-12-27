import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { challengesAPI, tradesAPI } from '../../services/api'
import { useChallenge } from '../../context/ChallengeContext'
import PriceChart from '../../components/PriceChart'
import SignalsPanel from '../../components/SignalsPanel'
import TradeForm from '../../components/TradeForm'
import MarketStatus from '../../components/MarketStatus'
import PriceTicker from '../../components/PriceTicker'
import PhaseProgress from '../../components/PhaseProgress'
import {
  SkeletonChart,
  SkeletonTradeForm,
  SkeletonChallengeCard,
  SkeletonPositionsTable,
  Skeleton
} from '../../components/ui/Skeleton'
import {
  TrendingUp, TrendingDown, RefreshCw, Clock,
  DollarSign, Activity, AlertTriangle, X, Target,
  Award, BarChart3, Wallet, ArrowUpRight, ArrowDownRight,
  ChevronRight, Shield, Flame, Trophy, CircleDot, Star, Banknote
} from 'lucide-react'
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler'

const SYMBOL_CATEGORIES = {
  popular: ['AAPL', 'TSLA', 'GOOGL', 'NVDA', 'BTC-USD', 'ETH-USD'],
  stocks: ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'NFLX', 'AMD'],
  crypto: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD', 'ADA-USD'],
  moroccan: ['IAM', 'ATW', 'BCP', 'CIH', 'TAQA', 'MNG']
}

const DashboardHome = () => {
  const { t } = useTranslation()
  const { challenge: contextChallenge, isFunded, currentPhase, refetch: refetchChallenge } = useChallenge()
  const [challenge, setChallenge] = useState(null)
  const [trades, setTrades] = useState([])
  const [openPnLData, setOpenPnLData] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [selectedCategory, setSelectedCategory] = useState('popular')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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
      refetchChallenge()
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
      <div className="flex items-center justify-center min-h-[60vh] relative">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-[150px]" />

        <div className="relative bg-dark-100/80 backdrop-blur-xl rounded-2xl p-12 text-center max-w-md border border-white/5 shadow-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-yellow-500/30">
            <AlertTriangle className="text-yellow-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {t('dashboard.noActiveChallenge')}
          </h2>
          <p className="text-gray-400 mb-8">
            {t('dashboard.purchaseChallenge')}
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02]"
          >
            <DollarSign size={20} />
            Voir les Challenges
          </Link>
        </div>
      </div>
    )
  }

  const phaseColors = {
    trial: { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-500/10' },
    evaluation: { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-500/10' },
    verification: { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-500/10' },
    funded: { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-500/10' }
  }
  const phaseColor = phaseColors[challenge.phase] || phaseColors.evaluation

  const profitTarget = (challenge.profit_target * 100) || 10
  const profitProgress = Math.min((stats.profitPercent / profitTarget) * 100, 100)
  const drawdownProgress = Math.min((stats.drawdown / stats.maxDrawdown) * 100, 100)

  return (
    <div className="space-y-6">
      {/* Account Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* Balance */}
        <div className="bg-dark-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-dark-200">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">Balance</span>
            <Wallet size={14} className="text-gray-500 sm:w-4 sm:h-4" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-white">
            ${stats.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className={`text-[10px] sm:text-xs mt-1 ${stats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.totalPnl >= 0 ? '+' : ''}{stats.profitPercent.toFixed(2)}%
          </p>
        </div>

        {/* Equity */}
        <div className="bg-dark-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-dark-200">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">Equity</span>
            <BarChart3 size={14} className="text-gray-500 sm:w-4 sm:h-4" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-white">
            ${stats.equity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          {stats.unrealizedPnl !== 0 && (
            <p className={`text-[10px] sm:text-xs mt-1 ${stats.unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.unrealizedPnl >= 0 ? '+' : ''}${stats.unrealizedPnl.toFixed(0)}
            </p>
          )}
        </div>

        {/* Profit Target Progress */}
        <div className="bg-dark-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-dark-200">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">Objectif</span>
            <Target size={14} className="text-green-500 sm:w-4 sm:h-4" />
          </div>
          <div className="flex items-end gap-1 sm:gap-2">
            <p className="text-lg sm:text-2xl font-bold text-white">
              {Math.max(stats.profitPercent, 0).toFixed(1)}%
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">/ {profitTarget}%</p>
          </div>
          <div className="mt-1.5 sm:mt-2 h-1 sm:h-1.5 bg-dark-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(profitProgress, 0)}%` }}
            />
          </div>
        </div>

        {/* Drawdown */}
        <div className="bg-dark-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-dark-200">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">Drawdown</span>
            <Activity size={14} className={`sm:w-4 sm:h-4 ${stats.drawdown > stats.maxDrawdown * 0.7 ? 'text-red-500' : 'text-gray-500'}`} />
          </div>
          <div className="flex items-end gap-1 sm:gap-2">
            <p className={`text-lg sm:text-2xl font-bold ${stats.drawdown > stats.maxDrawdown * 0.7 ? 'text-red-500' : 'text-white'}`}>
              {stats.drawdown.toFixed(1)}%
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">/ {stats.maxDrawdown}%</p>
          </div>
          <div className="mt-1.5 sm:mt-2 h-1 sm:h-1.5 bg-dark-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                drawdownProgress > 70 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                drawdownProgress > 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                'bg-gradient-to-r from-green-500 to-green-400'
              }`}
              style={{ width: `${drawdownProgress}%` }}
            />
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

      {/* Live Prices */}
      <PriceTicker />

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
    </div>
  )
}

export default DashboardHome
