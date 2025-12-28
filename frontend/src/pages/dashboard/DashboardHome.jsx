import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { challengesAPI, tradesAPI } from '../../services/api'
import { useChallenge } from '../../context/ChallengeContext'
import PriceTicker from '../../components/PriceTicker'
import PhaseProgress from '../../components/PhaseProgress'
import {
  StatCard,
  BalanceHistoryChart,
  DrawdownChart,
  PnLSummary,
  RiskAnalyticsPanel,
  TradingStreaks,
  TradeDuration
} from '../../components/dashboard'
import { containerVariants } from '../../utils/animations'
import {
  SkeletonChart,
  SkeletonChallengeCard,
  SkeletonPositionsTable
} from '../../components/ui/Skeleton'
import {
  TrendingUp, TrendingDown, RefreshCw, Clock,
  DollarSign, Activity, AlertTriangle, X, Target,
  Award, BarChart3, Wallet, ArrowUpRight, ArrowDownRight,
  Percent, Trophy, Zap, LineChart
} from 'lucide-react'
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler'

const DashboardHome = () => {
  const { t } = useTranslation()
  const { challenge: contextChallenge, isFunded, currentPhase, refetch: refetchChallenge } = useChallenge()
  const [challenge, setChallenge] = useState(null)
  const [trades, setTrades] = useState([])
  const [openPnLData, setOpenPnLData] = useState(null)
  const [extendedStats, setExtendedStats] = useState(null)
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
        const challengeData = challengeRes.data.challenge
        setChallenge(challengeData)

        const tradesRes = await tradesAPI.getAll(challengeData.id)
        setTrades(tradesRes.data.trades || [])

        // Fetch extended stats for charts
        try {
          const extendedRes = await challengesAPI.getExtendedStats(challengeData.id)
          setExtendedStats(extendedRes.data.extended_stats)
        } catch (err) {
          console.log('Extended stats not available:', err)
        }
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
      currentBalance, equity, initialBalance, drawdown, maxDrawdown, unrealizedPnl,
      winningTrades: winningTrades.length, losingTrades: losingTrades.length
    }
  }, [closedTrades, openTrades, challenge, openPnLData])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonChallengeCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart height={300} />
          <SkeletonChart height={300} />
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] relative">
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

  const profitTarget = (challenge.profit_target * 100) || 10
  const profitProgress = Math.min((stats.profitPercent / profitTarget) * 100, 100)
  const drawdownProgress = Math.min((stats.drawdown / stats.maxDrawdown) * 100, 100)

  // Prepare data for charts
  const balanceHistory = extendedStats?.balance_history || []
  const drawdownHistory = extendedStats?.drawdown_history || []
  const dailyPnl = extendedStats?.daily_pnl || []
  const weeklyPnl = extendedStats?.weekly_pnl || []
  const monthlyPnl = extendedStats?.monthly_pnl || []

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Row 1: Account Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Balance"
          value={stats.currentBalance}
          prefix="$"
          decimals={0}
          icon={Wallet}
          trend={stats.profitPercent}
          variant={stats.totalPnl >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Equity"
          value={stats.equity}
          prefix="$"
          decimals={0}
          icon={BarChart3}
          subValue={stats.unrealizedPnl !== 0 ? `Unrealized: ${stats.unrealizedPnl >= 0 ? '+' : ''}$${stats.unrealizedPnl.toFixed(0)}` : null}
          variant={stats.unrealizedPnl >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Profit Target"
          value={Math.max(stats.profitPercent, 0)}
          suffix="%"
          decimals={1}
          icon={Target}
          subValue={`Target: ${profitTarget}%`}
          progress={true}
          progressValue={Math.max(profitProgress, 0)}
          progressColor="green"
        />
        <StatCard
          title="Drawdown"
          value={stats.drawdown}
          suffix="%"
          decimals={1}
          icon={Activity}
          subValue={`Limit: ${stats.maxDrawdown}%`}
          progress={true}
          progressValue={drawdownProgress}
          progressColor={drawdownProgress > 70 ? 'red' : drawdownProgress > 50 ? 'yellow' : 'green'}
          variant={stats.drawdown > stats.maxDrawdown * 0.7 ? 'danger' : 'default'}
        />
      </div>

      {/* Row 2: Phase Progress */}
      <PhaseProgress />

      {/* Row 3: Key Performance Metrics */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Win Rate"
          value={stats.winRate}
          suffix="%"
          decimals={1}
          icon={Percent}
          variant={stats.winRate >= 50 ? 'success' : 'danger'}
        />
        <StatCard
          title="Profit Factor"
          value={stats.profitFactor === Infinity ? 99.99 : stats.profitFactor}
          decimals={2}
          icon={TrendingUp}
          variant={stats.profitFactor >= 1 ? 'success' : 'danger'}
        />
        <StatCard
          title="Total Trades"
          value={stats.totalTrades}
          icon={BarChart3}
          subValue={`${stats.winningTrades}W / ${stats.losingTrades}L`}
        />
        <StatCard
          title="Best Trade"
          value={stats.bestTrade}
          prefix="+$"
          decimals={0}
          icon={Trophy}
          variant="success"
        />
        <StatCard
          title="Worst Trade"
          value={Math.abs(stats.worstTrade)}
          prefix="-$"
          decimals={0}
          icon={TrendingDown}
          variant="danger"
        />
        <StatCard
          title="Avg Win"
          value={stats.avgWin}
          prefix="+$"
          decimals={0}
          icon={Award}
          variant="success"
        />
      </div>

      {/* Row 4: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BalanceHistoryChart
          data={balanceHistory}
          initialBalance={stats.initialBalance}
        />
        <DrawdownChart
          data={drawdownHistory}
          maxDrawdown={extendedStats?.max_drawdown || stats.drawdown}
          maxAllowed={stats.maxDrawdown}
        />
      </div>

      {/* Row 5: P&L and Risk Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PnLSummary
            daily={dailyPnl}
            weekly={weeklyPnl}
            monthly={monthlyPnl}
          />
        </div>
        <RiskAnalyticsPanel
          maxDrawdown={extendedStats?.max_drawdown || stats.drawdown}
          currentDrawdown={stats.drawdown}
          riskPerTrade={2}
          exposure={extendedStats?.exposure || []}
          sharpeRatio={extendedStats?.sharpe_ratio}
          maxAllowedDrawdown={stats.maxDrawdown}
        />
      </div>

      {/* Row 6: Trading Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TradingStreaks
          currentStreak={extendedStats?.streaks?.current || 0}
          maxWinStreak={extendedStats?.streaks?.max_win || 0}
          maxLossStreak={extendedStats?.streaks?.max_loss || 0}
          recentTrades={extendedStats?.streaks?.recent_trades || []}
        />
        <TradeDuration
          avgDuration={extendedStats?.duration_stats?.average || 0}
          shortest={extendedStats?.duration_stats?.shortest || 0}
          longest={extendedStats?.duration_stats?.longest || 0}
          distribution={extendedStats?.duration_stats?.distribution || []}
        />
      </div>

      {/* Row 7: Live Prices */}
      <PriceTicker />

      {/* Row 8: Open Positions */}
      {openTrades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-100 rounded-xl border border-dark-200"
        >
          <div className="p-4 border-b border-dark-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-green-500" />
              <span className="font-semibold text-white">Open Positions</span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
                {openTrades.length}
              </span>
            </div>
            {openPnLData && (
              <span className={`text-sm font-bold ${openPnLData.total_unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                Total P&L: {openPnLData.total_unrealized_pnl >= 0 ? '+' : ''}${openPnLData.total_unrealized_pnl.toFixed(2)}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-200/50">
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-medium">Symbol</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Size</th>
                  <th className="px-4 py-3 text-left font-medium">Entry</th>
                  <th className="px-4 py-3 text-left font-medium">Current</th>
                  <th className="px-4 py-3 text-left font-medium">SL</th>
                  <th className="px-4 py-3 text-left font-medium">TP</th>
                  <th className="px-4 py-3 text-right font-medium">P&L</th>
                  <th className="px-4 py-3 text-right font-medium">%</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-200">
                {openTrades.map(trade => {
                  const pnlInfo = openPnLData?.trades?.find(t => t.trade_id === trade.id)
                  return (
                    <tr key={trade.id} className="hover:bg-dark-200/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-1 h-8 rounded-full ${trade.trade_type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="font-medium text-white">{trade.symbol}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          trade.trade_type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {trade.trade_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{trade.quantity}</td>
                      <td className="px-4 py-3 text-gray-400">${Number(trade.entry_price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-white font-medium">
                        ${pnlInfo?.current_price?.toFixed(2) || '-'}
                      </td>
                      <td className="px-4 py-3 text-red-400">
                        {trade.stop_loss ? `$${Number(trade.stop_loss).toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-green-400">
                        {trade.take_profit ? `$${Number(trade.take_profit).toFixed(2)}` : '-'}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${
                        (pnlInfo?.unrealized_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {pnlInfo ? `${pnlInfo.unrealized_pnl >= 0 ? '+' : ''}$${pnlInfo.unrealized_pnl.toFixed(2)}` : '-'}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm ${
                        (pnlInfo?.pnl_percent || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {pnlInfo ? `${pnlInfo.pnl_percent >= 0 ? '+' : ''}${pnlInfo.pnl_percent.toFixed(2)}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleCloseTrade(trade.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all text-sm font-medium"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Row 9: Trade History */}
      {closedTrades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-100 rounded-xl border border-dark-200"
        >
          <div className="p-4 border-b border-dark-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              <span className="font-semibold text-white">Recent Trades</span>
              <span className="text-xs text-gray-500">({closedTrades.length} total)</span>
            </div>
            <Link
              to="/trade-journal"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-200/50">
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-medium">Symbol</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Entry</th>
                  <th className="px-4 py-3 text-left font-medium">Exit</th>
                  <th className="px-4 py-3 text-right font-medium">P&L</th>
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
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="flex justify-center">
        <Link
          to="/trading"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02]"
        >
          <LineChart size={20} />
          Open Trading Platform
        </Link>
      </div>
    </motion.div>
  )
}

export default DashboardHome
