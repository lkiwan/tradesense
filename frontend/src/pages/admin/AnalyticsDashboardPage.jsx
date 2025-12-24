import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartPieIcon,
  ClockIcon,
  CpuChipIcon,
  SignalIcon
} from '@heroicons/react/24/outline'

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <p className={`text-sm mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? '+' : ''}{trend}% vs last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

// System Health Card
const SystemHealthCard = ({ system }) => {
  const getHealthColor = (percent) => {
    if (percent < 50) return 'text-green-500'
    if (percent < 75) return 'text-yellow-500'
    return 'text-red-500'
  }

  const ProgressBar = ({ label, value, max = 100 }) => (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className={getHealthColor(value)}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            value < 50 ? 'bg-green-500' : value < 75 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ServerIcon className="w-5 h-5" />
        System Health
      </h3>
      <ProgressBar label="CPU Usage" value={system.cpu_percent || 0} />
      <ProgressBar label="Memory Usage" value={system.memory_percent || 0} />
      <ProgressBar label="Disk Usage" value={system.disk_percent || 0} />
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Memory Used</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {(system.memory_used_mb / 1024).toFixed(2)} GB
          </p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Disk Used</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {system.disk_used_gb?.toFixed(1)} GB
          </p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Process Memory</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {system.process_memory_mb?.toFixed(1)} MB
          </p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Threads</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {system.threads || 0}
          </p>
        </div>
      </div>
    </div>
  )
}

// Request Performance Card
const RequestPerformanceCard = ({ requests }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <SignalIcon className="w-5 h-5" />
      Request Performance
    </h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {requests.requests_per_minute?.toFixed(1) || 0}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Requests/min</p>
      </div>
      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
          {requests.avg_response_time?.toFixed(0) || 0}ms
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response</p>
      </div>
      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-3xl font-bold text-red-600 dark:text-red-400">
          {requests.error_rate?.toFixed(1) || 0}%
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
      </div>
      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
          {requests.total_requests || 0}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Total (5min)</p>
      </div>
    </div>
  </div>
)

// Popular Endpoints Table
const PopularEndpointsCard = ({ endpoints }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <ChartBarIcon className="w-5 h-5" />
      Top Endpoints
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
            <th className="pb-2">Endpoint</th>
            <th className="pb-2 text-right">Requests</th>
            <th className="pb-2 text-right">Avg Time</th>
            <th className="pb-2 text-right">Error %</th>
          </tr>
        </thead>
        <tbody>
          {endpoints?.slice(0, 10).map((ep, idx) => (
            <tr key={idx} className="border-b dark:border-gray-700 last:border-0">
              <td className="py-2 font-mono text-xs text-gray-900 dark:text-white truncate max-w-[200px]">
                {ep.endpoint}
              </td>
              <td className="py-2 text-right text-gray-600 dark:text-gray-400">
                {ep.requests}
              </td>
              <td className="py-2 text-right text-gray-600 dark:text-gray-400">
                {ep.avg_time_ms?.toFixed(0)}ms
              </td>
              <td className={`py-2 text-right ${ep.error_rate > 5 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                {ep.error_rate?.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

// Recent Errors Card
const RecentErrorsCard = ({ errors }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
      Recent Errors
    </h3>
    {errors?.recent?.length > 0 ? (
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {errors.recent.map((error, idx) => (
          <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-red-800 dark:text-red-400">
                {error.error_type}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(error.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-mono">
              {error.endpoint}
            </p>
            <p className="text-xs text-gray-500 mt-1 truncate">
              {error.message}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
        No recent errors
      </p>
    )}
  </div>
)

// User Growth Chart (Simple)
const UserGrowthCard = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.new_users), 1)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <UsersIcon className="w-5 h-5" />
        User Growth (30 days)
      </h3>
      <div className="flex items-end gap-1 h-32">
        {data.slice(-30).map((d, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
              style={{ height: `${(d.new_users / maxValue) * 100}%`, minHeight: d.new_users > 0 ? '4px' : '0' }}
              title={`${d.date}: ${d.new_users} users`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  )
}

// Revenue Chart (Simple)
const RevenueChartCard = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.revenue), 1)
  const total = data.reduce((sum, d) => sum + d.revenue, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <CurrencyDollarIcon className="w-5 h-5" />
        Revenue (30 days)
      </h3>
      <p className="text-2xl font-bold text-green-600 mb-4">
        ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
      <div className="flex items-end gap-1 h-24">
        {data.slice(-30).map((d, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
              style={{ height: `${(d.revenue / maxValue) * 100}%`, minHeight: d.revenue > 0 ? '4px' : '0' }}
              title={`${d.date}: $${d.revenue.toFixed(2)}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Challenge Distribution Pie
const ChallengeDistributionCard = ({ distribution }) => {
  const statusColors = {
    active: '#3B82F6',
    evaluation: '#F59E0B',
    passed: '#10B981',
    failed: '#EF4444',
    funded: '#8B5CF6',
    pending: '#6B7280'
  }

  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ChartPieIcon className="w-5 h-5" />
        Challenge Status
      </h3>
      <div className="space-y-2">
        {Object.entries(distribution).map(([status, count]) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: statusColors[status] || '#6B7280' }}
            />
            <span className="flex-1 text-sm text-gray-600 dark:text-gray-400 capitalize">
              {status}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {count}
            </span>
            <span className="text-xs text-gray-500">
              ({total > 0 ? ((count / total) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Uptime Card
const UptimeCard = ({ uptime }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <ClockIcon className="w-5 h-5" />
      Uptime
    </h3>
    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
      {uptime.uptime_formatted}
    </p>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
      Started: {new Date(uptime.start_time).toLocaleString()}
    </p>
  </div>
)

// Main Dashboard Component
export default function AnalyticsDashboardPage() {
  const [overview, setOverview] = useState(null)
  const [userGrowth, setUserGrowth] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [challengeDistribution, setChallengeDistribution] = useState({})
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setError(null)

      const [overviewRes, growthRes, revenueRes, distributionRes, metricsRes] = await Promise.all([
        api.get('/api/monitoring/analytics/overview?days=30'),
        api.get('/api/monitoring/analytics/users/growth?days=30'),
        api.get('/api/monitoring/analytics/revenue/daily?days=30'),
        api.get('/api/monitoring/analytics/challenges/distribution'),
        api.get('/api/monitoring/metrics')
      ])

      setOverview(overviewRes.data)
      setUserGrowth(growthRes.data.data || [])
      setRevenueData(revenueRes.data.data || [])
      setChallengeDistribution(distributionRes.data.distribution || {})
      setMetrics(metricsRes.data)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError(err.response?.data?.error || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    // Auto-refresh every 30 seconds
    let interval
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [fetchData, autoRefresh])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Real-time system and business metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
          {lastRefresh && (
            <span className="text-xs text-gray-500">
              Last: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={overview?.users?.total?.toLocaleString() || 0}
          subtitle={`+${overview?.users?.new || 0} new this month`}
          icon={UsersIcon}
          color="blue"
        />
        <StatCard
          title="Active Challenges"
          value={overview?.challenges?.active || 0}
          subtitle={`${overview?.challenges?.pass_rate?.toFixed(1) || 0}% pass rate`}
          icon={ChartBarIcon}
          color="purple"
        />
        <StatCard
          title="Revenue (30 days)"
          value={`$${overview?.revenue?.total?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`}
          subtitle={`${overview?.revenue?.transactions || 0} transactions`}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <StatCard
          title="Active Users"
          value={overview?.users?.active_15m || 0}
          subtitle={`${overview?.users?.active_60m || 0} in last hour`}
          icon={SignalIcon}
          color="indigo"
        />
      </div>

      {/* System & Performance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemHealthCard system={metrics?.system || {}} />
        <RequestPerformanceCard requests={overview?.performance || {}} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGrowthCard data={userGrowth} />
        <RevenueChartCard data={revenueData} />
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PopularEndpointsCard endpoints={metrics?.endpoints || []} />
        <ChallengeDistributionCard distribution={challengeDistribution} />
        <div className="space-y-6">
          <UptimeCard uptime={metrics?.uptime || { uptime_formatted: '0:00:00', start_time: new Date().toISOString() }} />
          <RecentErrorsCard errors={metrics?.errors || { recent: [] }} />
        </div>
      </div>
    </div>
  )
}
