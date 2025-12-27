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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance */}
        <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Balance</span>
            <Wallet size={16} className="text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            ${stats.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-xs mt-1 ${stats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.totalPnl >= 0 ? '+' : ''}{stats.profitPercent.toFixed(2)}% depuis le debut
          </p>
        </div>

        {/* Equity */}
        <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Equity</span>
            <BarChart3 size={16} className="text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            ${stats.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {stats.unrealizedPnl !== 0 && (
            <p className={`text-xs mt-1 ${stats.unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.unrealizedPnl >= 0 ? '+' : ''}${stats.unrealizedPnl.toFixed(2)} non realise
            </p>
          )}
        </div>

        {/* Profit Target Progress */}
        <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Objectif Profit</span>
            <Target size={16} className="text-green-500" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-white">
              {Math.max(stats.profitPercent, 0).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mb-1">/ {profitTarget}%</p>
          </div>
          <div className="mt-2 h-1.5 bg-dark-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(profitProgress, 0)}%` }}
            />
          </div>
        </div>

        {/* Drawdown */}
        <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Drawdown</span>
            <Activity size={16} className={stats.drawdown > stats.maxDrawdown * 0.7 ? 'text-red-500' : 'text-gray-500'} />
          </div>
          <div className="flex items-end gap-2">
            <p className={`text-2xl font-bold ${stats.drawdown > stats.maxDrawdown * 0.7 ? 'text-red-500' : 'text-white'}`}>
              {stats.drawdown.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mb-1">/ {stats.maxDrawdown}% max</p>
          </div>
          <div className="mt-2 h-1.5 bg-dark-200 rounded-full overflow-hidden">
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
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-6">
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-400 mb-1">Win Rate</p>
            <p className="text-lg font-bold text-white">{stats.winRate.toFixed(1)}%</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-400 mb-1">Total Trades</p>
            <p className="text-lg font-bold text-white">{stats.totalTrades}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-400 mb-1">Best Trade</p>
            <p className="text-lg font-bold text-green-500">+${stats.bestTrade.toFixed(2)}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-400 mb-1">Worst Trade</p>
            <p className="text-lg font-bold text-red-500">${stats.worstTrade.toFixed(2)}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-400 mb-1">Avg Win</p>
            <p className="text-lg font-bold text-green-500">+${stats.avgWin.toFixed(2)}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-400 mb-1">Profit Factor</p>
            <p className="text-lg font-bold text-white">
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
          <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
            <div className="p-4 border-b border-dark-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CircleDot size={16} className="text-green-500" />
                  <span className="font-semibold text-white">{selectedSymbol}</span>
                </div>
                <div className="flex gap-1 bg-dark-200 p-1 rounded-lg">
                  {Object.keys(SYMBOL_CATEGORIES).map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category)
                        setSelectedSymbol(SYMBOL_CATEGORIES[category][0])
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all capitalize ${
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
              <div className="flex flex-wrap gap-1.5">
                {SYMBOL_CATEGORIES[selectedCategory].map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => setSelectedSymbol(symbol)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
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
            <PriceChart symbol={selectedSymbol} height={400} />
          </div>

          {/* Open Positions */}
          {openTrades.length > 0 && (
            <div className="bg-dark-100 rounded-xl border border-dark-200">
              <div className="p-4 border-b border-dark-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-green-500" />
                  <span className="font-semibold text-white">Positions Ouvertes</span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
                    {openTrades.length}
                  </span>
                </div>
                {openPnLData && (
                  <span className={`text-sm font-bold ${openPnLData.total_unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {openPnLData.total_unrealized_pnl >= 0 ? '+' : ''}${openPnLData.total_unrealized_pnl.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="divide-y divide-dark-200">
                {openTrades.map(trade => {
                  const pnlInfo = openPnLData?.trades?.find(t => t.trade_id === trade.id)
                  return (
                    <div key={trade.id} className="p-4 flex items-center justify-between hover:bg-dark-200/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-10 rounded-full ${trade.trade_type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{trade.symbol}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${trade.trade_type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {trade.trade_type === 'buy' ? 'LONG' : 'SHORT'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {trade.quantity} @ ${trade.entry_price}
                            {pnlInfo && <span className="text-gray-500"> → ${pnlInfo.current_price.toFixed(2)}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {pnlInfo ? (
                          <div className="text-right">
                            <p className={`font-bold ${pnlInfo.unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {pnlInfo.unrealized_pnl >= 0 ? '+' : ''}${pnlInfo.unrealized_pnl.toFixed(2)}
                            </p>
                            <p className={`text-xs ${pnlInfo.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pnlInfo.pnl_percent >= 0 ? '+' : ''}{pnlInfo.pnl_percent.toFixed(2)}%
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">${trade.trade_value?.toFixed(2)}</p>
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
            </div>
          )}

          {/* Trade History */}
          {closedTrades.length > 0 && (
            <div className="bg-dark-100 rounded-xl border border-dark-200">
              <div className="p-4 border-b border-dark-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-gray-400" />
                  <span className="font-semibold text-white">Historique</span>
                  <span className="text-xs text-gray-500">({closedTrades.length} trades)</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-200/50">
                    <tr className="text-xs text-gray-500 uppercase">
                      <th className="px-4 py-3 text-left font-medium">Symbol</th>
                      <th className="px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-left font-medium">Entry</th>
                      <th className="px-4 py-3 text-left font-medium">Exit</th>
                      <th className="px-4 py-3 text-right font-medium">PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-200">
                    {closedTrades.slice(0, 10).map(trade => (
                      <tr key={trade.id} className="hover:bg-dark-200/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{trade.symbol}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            trade.trade_type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {trade.trade_type === 'buy' ? 'LONG' : 'SHORT'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">${Number(trade.entry_price).toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-400">${Number(trade.exit_price).toFixed(2)}</td>
                        <td className={`px-4 py-3 text-right font-bold ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
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
