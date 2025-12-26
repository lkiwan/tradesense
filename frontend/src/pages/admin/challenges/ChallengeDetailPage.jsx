import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, TrendingUp, TrendingDown, Clock, CheckCircle,
  XCircle, Target, DollarSign, Calendar, Activity, BarChart3,
  AlertTriangle, Edit, Ban, Play, Pause, RefreshCw, Download
} from 'lucide-react'
import Chart from 'react-apexcharts'
import { AdminLayout, StatusBadge, ConfirmationModal } from '../../../components/admin'
import adminApi from '../../../services/adminApi'

const ChallengeDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showPassModal, setShowPassModal] = useState(false)
  const [showFailModal, setShowFailModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchChallengeDetails()
  }, [id])

  const fetchChallengeDetails = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getChallengeDetails(id)
      setChallenge(response.data.challenge)
      setTrades(response.data.trades || [])
    } catch (error) {
      console.error('Error fetching challenge details:', error)
      // Mock data
      setChallenge({
        id: parseInt(id),
        user: { id: 1, username: 'trader_pro', email: 'trader@example.com', avatar: null },
        model: {
          name: 'Standard 100K',
          account_size: 100000,
          profit_target: 10,
          max_daily_drawdown: 5,
          max_total_drawdown: 10,
          min_trading_days: 5
        },
        status: 'active',
        phase: 1,
        current_balance: 102500,
        initial_balance: 100000,
        profit: 2500,
        profit_percent: 2.5,
        max_drawdown: 1.2,
        daily_drawdown: 0.8,
        trades_count: 45,
        winning_trades: 28,
        losing_trades: 17,
        win_rate: 62.2,
        trading_days: 12,
        start_date: '2024-12-01T00:00:00Z',
        end_date: '2025-01-01T00:00:00Z',
        created_at: '2024-11-28T10:30:00Z',
        equity_curve: [
          100000, 100500, 101200, 100800, 101500, 102000, 101800,
          102200, 102800, 102500, 103000, 102500
        ]
      })
      setTrades([
        { id: 1, symbol: 'EURUSD', type: 'buy', size: 1.0, entry_price: 1.0850, exit_price: 1.0920, profit: 700, status: 'closed', opened_at: '2024-12-15T10:30:00Z', closed_at: '2024-12-15T14:45:00Z' },
        { id: 2, symbol: 'GBPUSD', type: 'sell', size: 0.5, entry_price: 1.2650, exit_price: 1.2580, profit: 350, status: 'closed', opened_at: '2024-12-16T09:00:00Z', closed_at: '2024-12-16T16:30:00Z' },
        { id: 3, symbol: 'USDJPY', type: 'buy', size: 0.8, entry_price: 149.50, exit_price: 149.20, profit: -240, status: 'closed', opened_at: '2024-12-17T11:00:00Z', closed_at: '2024-12-17T15:00:00Z' },
        { id: 4, symbol: 'XAUUSD', type: 'buy', size: 0.3, entry_price: 2020.50, current_price: 2035.80, profit: 459, status: 'open', opened_at: '2024-12-18T08:30:00Z' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handlePassChallenge = async () => {
    setActionLoading(true)
    try {
      await adminApi.updateChallengeStatus(id, { status: 'passed' })
      setChallenge(prev => ({ ...prev, status: 'passed' }))
      setShowPassModal(false)
    } catch (error) {
      console.error('Error passing challenge:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleFailChallenge = async () => {
    setActionLoading(true)
    try {
      await adminApi.updateChallengeStatus(id, { status: 'failed', reason: 'Manual admin action' })
      setChallenge(prev => ({ ...prev, status: 'failed' }))
      setShowFailModal(false)
    } catch (error) {
      console.error('Error failing challenge:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      active: { color: 'blue', icon: Clock, label: 'Active' },
      passed: { color: 'green', icon: CheckCircle, label: 'Passed' },
      failed: { color: 'red', icon: XCircle, label: 'Failed' },
      funded: { color: 'purple', icon: Target, label: 'Funded' }
    }
    return configs[status] || configs.active
  }

  const equityChartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: true }
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    colors: ['#10B981'],
    xaxis: {
      categories: challenge?.equity_curve?.map((_, i) => `Day ${i + 1}`) || [],
      labels: { style: { colors: '#6B7280' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: '#6B7280' },
        formatter: (val) => `$${val.toLocaleString()}`
      }
    },
    grid: { borderColor: '#374151', strokeDashArray: 3 },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `$${val.toLocaleString()}` }
    },
    dataLabels: { enabled: false }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trades', label: 'Trades', icon: Activity },
    { id: 'rules', label: 'Rules & Limits', icon: Target }
  ]

  if (loading) {
    return (
      <AdminLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    )
  }

  if (!challenge) {
    return (
      <AdminLayout title="Challenge Not Found">
        <div className="text-center py-12">
          <p className="text-gray-400">Challenge not found</p>
          <button
            onClick={() => navigate('/admin/challenges')}
            className="mt-4 text-primary hover:underline"
          >
            Back to Challenges
          </button>
        </div>
      </AdminLayout>
    )
  }

  const statusConfig = getStatusConfig(challenge.status)

  return (
    <AdminLayout
      title={`Challenge #${challenge.id}`}
      subtitle={`${challenge.model?.name} - ${challenge.user?.username}`}
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Challenges', href: '/admin/challenges' },
        { label: `#${challenge.id}` }
      ]}
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/challenges')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Challenges
        </button>

        <div className="flex items-center gap-3">
          {challenge.status === 'active' && (
            <>
              <button
                onClick={() => setShowPassModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <CheckCircle size={18} />
                Pass Challenge
              </button>
              <button
                onClick={() => setShowFailModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <XCircle size={18} />
                Fail Challenge
              </button>
            </>
          )}
          <button
            onClick={fetchChallengeDetails}
            className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Challenge Info */}
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Challenge Info</h3>
            <StatusBadge status={challenge.status} color={statusConfig.color} />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Model</span>
              <span className="text-white font-medium">{challenge.model?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Account Size</span>
              <span className="text-white">${challenge.model?.account_size?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phase</span>
              <span className="text-white">Phase {challenge.phase}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Started</span>
              <span className="text-white">{new Date(challenge.start_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Trading Days</span>
              <span className="text-white">{challenge.trading_days} / {challenge.model?.min_trading_days}</span>
            </div>
          </div>
        </div>

        {/* Trader Info */}
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Trader</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {challenge.user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{challenge.user?.username}</p>
              <p className="text-gray-400 text-sm">{challenge.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/admin/users/${challenge.user?.id}`)}
            className="w-full py-2 px-4 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors text-sm"
          >
            View User Profile
          </button>
        </div>

        {/* Performance Summary */}
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Current Balance</span>
              <span className="text-white font-medium">${challenge.current_balance?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Profit/Loss</span>
              <span className={`font-medium flex items-center gap-1 ${challenge.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {challenge.profit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                ${Math.abs(challenge.profit).toLocaleString()} ({challenge.profit_percent?.toFixed(2)}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Win Rate</span>
              <span className="text-white">{challenge.win_rate?.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Trades</span>
              <span className="text-white">{challenge.trades_count}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Equity Curve */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Equity Curve</h3>
            <Chart
              options={equityChartOptions}
              series={[{ name: 'Equity', data: challenge.equity_curve || [] }]}
              type="area"
              height={300}
            />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
              <p className="text-gray-400 text-sm mb-1">Max Drawdown</p>
              <p className={`text-2xl font-bold ${challenge.max_drawdown > 5 ? 'text-red-500' : 'text-green-500'}`}>
                {challenge.max_drawdown?.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500">Limit: {challenge.model?.max_total_drawdown}%</p>
            </div>
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
              <p className="text-gray-400 text-sm mb-1">Daily Drawdown</p>
              <p className={`text-2xl font-bold ${challenge.daily_drawdown > 3 ? 'text-red-500' : 'text-green-500'}`}>
                {challenge.daily_drawdown?.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500">Limit: {challenge.model?.max_daily_drawdown}%</p>
            </div>
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
              <p className="text-gray-400 text-sm mb-1">Winning Trades</p>
              <p className="text-2xl font-bold text-green-500">{challenge.winning_trades}</p>
            </div>
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
              <p className="text-gray-400 text-sm mb-1">Losing Trades</p>
              <p className="text-2xl font-bold text-red-500">{challenge.losing_trades}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trades' && (
        <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-200">
                <tr>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Symbol</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Type</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Size</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Entry</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Exit/Current</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">P&L</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Status</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-200">
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-dark-200/50">
                    <td className="px-4 py-3 text-white font-medium">{trade.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{trade.size}</td>
                    <td className="px-4 py-3 text-gray-300">{trade.entry_price}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {trade.exit_price || trade.current_price}
                    </td>
                    <td className="px-4 py-3">
                      <span className={trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                        ${trade.profit?.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={trade.status}
                        color={trade.status === 'open' ? 'blue' : 'gray'}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {new Date(trade.opened_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Challenge Rules</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-200 rounded-lg">
              <div>
                <p className="text-white font-medium">Profit Target</p>
                <p className="text-gray-400 text-sm">Minimum profit required to pass</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{challenge.model?.profit_target}%</p>
                <p className={`text-sm ${challenge.profit_percent >= challenge.model?.profit_target ? 'text-green-500' : 'text-gray-400'}`}>
                  Current: {challenge.profit_percent?.toFixed(2)}%
                  {challenge.profit_percent >= challenge.model?.profit_target && ' ✓'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-200 rounded-lg">
              <div>
                <p className="text-white font-medium">Max Daily Drawdown</p>
                <p className="text-gray-400 text-sm">Maximum loss in a single day</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-red-500">{challenge.model?.max_daily_drawdown}%</p>
                <p className={`text-sm ${challenge.daily_drawdown < challenge.model?.max_daily_drawdown ? 'text-green-500' : 'text-red-500'}`}>
                  Current: {challenge.daily_drawdown?.toFixed(2)}%
                  {challenge.daily_drawdown < challenge.model?.max_daily_drawdown && ' ✓'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-200 rounded-lg">
              <div>
                <p className="text-white font-medium">Max Total Drawdown</p>
                <p className="text-gray-400 text-sm">Maximum total loss from peak</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-red-500">{challenge.model?.max_total_drawdown}%</p>
                <p className={`text-sm ${challenge.max_drawdown < challenge.model?.max_total_drawdown ? 'text-green-500' : 'text-red-500'}`}>
                  Current: {challenge.max_drawdown?.toFixed(2)}%
                  {challenge.max_drawdown < challenge.model?.max_total_drawdown && ' ✓'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-200 rounded-lg">
              <div>
                <p className="text-white font-medium">Minimum Trading Days</p>
                <p className="text-gray-400 text-sm">Days with at least one trade</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-500">{challenge.model?.min_trading_days}</p>
                <p className={`text-sm ${challenge.trading_days >= challenge.model?.min_trading_days ? 'text-green-500' : 'text-gray-400'}`}>
                  Current: {challenge.trading_days}
                  {challenge.trading_days >= challenge.model?.min_trading_days && ' ✓'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pass Modal */}
      {showPassModal && (
        <ConfirmationModal
          isOpen={showPassModal}
          onClose={() => setShowPassModal(false)}
          onConfirm={handlePassChallenge}
          title="Pass Challenge"
          message={`Are you sure you want to manually pass this challenge for ${challenge.user?.username}? This action will move them to the next phase or funded status.`}
          confirmText="Pass Challenge"
          variant="success"
          loading={actionLoading}
        />
      )}

      {/* Fail Modal */}
      {showFailModal && (
        <ConfirmationModal
          isOpen={showFailModal}
          onClose={() => setShowFailModal(false)}
          onConfirm={handleFailChallenge}
          title="Fail Challenge"
          message={`Are you sure you want to manually fail this challenge for ${challenge.user?.username}? This action cannot be undone.`}
          confirmText="Fail Challenge"
          variant="danger"
          loading={actionLoading}
        />
      )}
    </AdminLayout>
  )
}

export default ChallengeDetailPage
