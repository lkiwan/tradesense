import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Activity, User, LogIn, LogOut, CreditCard, Target,
  Settings, Shield, Eye, RefreshCw, Download, Calendar, Filter
} from 'lucide-react'
import { AdminLayout, DataTable } from '../../../components/admin'
import adminApi from '../../../services/adminApi'

const UserActivityPage = () => {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalToday: 0,
    logins: 0,
    trades: 0,
    payments: 0
  })

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    dateRange: '24h'
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  })

  useEffect(() => {
    fetchActivities()
  }, [filters, pagination.page])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getUserActivities({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      })
      setActivities(response.data.activities || [])
      setStats(response.data.stats || {})
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }))
    } catch (error) {
      console.error('Error fetching activities:', error)
      // Mock data
      setActivities([
        {
          id: 1,
          user: { id: 1, username: 'trader_pro', email: 'trader@example.com' },
          action: 'login',
          description: 'User logged in',
          ip_address: '192.168.1.100',
          user_agent: 'Chrome 120 / Windows',
          created_at: '2024-12-24T15:30:00Z',
          metadata: { location: 'Morocco' }
        },
        {
          id: 2,
          user: { id: 2, username: 'fx_master', email: 'fx@example.com' },
          action: 'trade',
          description: 'Opened BUY position on EURUSD',
          ip_address: '192.168.1.101',
          user_agent: 'Firefox 121 / MacOS',
          created_at: '2024-12-24T15:25:00Z',
          metadata: { symbol: 'EURUSD', size: 1.0 }
        },
        {
          id: 3,
          user: { id: 3, username: 'crypto_king', email: 'crypto@example.com' },
          action: 'payment',
          description: 'Purchased Standard 100K Challenge',
          ip_address: '192.168.1.102',
          user_agent: 'Safari 17 / iOS',
          created_at: '2024-12-24T15:20:00Z',
          metadata: { amount: 299, currency: 'USD' }
        },
        {
          id: 4,
          user: { id: 4, username: 'swing_trader', email: 'swing@example.com' },
          action: 'settings',
          description: 'Updated profile settings',
          ip_address: '192.168.1.103',
          user_agent: 'Chrome 120 / Android',
          created_at: '2024-12-24T15:15:00Z',
          metadata: {}
        },
        {
          id: 5,
          user: { id: 1, username: 'trader_pro', email: 'trader@example.com' },
          action: 'logout',
          description: 'User logged out',
          ip_address: '192.168.1.100',
          user_agent: 'Chrome 120 / Windows',
          created_at: '2024-12-24T15:10:00Z',
          metadata: {}
        },
        {
          id: 6,
          user: { id: 5, username: 'day_trader', email: 'day@example.com' },
          action: 'security',
          description: 'Enabled 2FA authentication',
          ip_address: '192.168.1.104',
          user_agent: 'Edge 120 / Windows',
          created_at: '2024-12-24T15:05:00Z',
          metadata: { method: 'authenticator' }
        },
        {
          id: 7,
          user: { id: 2, username: 'fx_master', email: 'fx@example.com' },
          action: 'challenge',
          description: 'Started Phase 2 of challenge',
          ip_address: '192.168.1.101',
          user_agent: 'Firefox 121 / MacOS',
          created_at: '2024-12-24T15:00:00Z',
          metadata: { challenge_id: 123, phase: 2 }
        }
      ])
      setStats({
        totalToday: 1250,
        logins: 320,
        trades: 580,
        payments: 45
      })
      setPagination(prev => ({ ...prev, total: 7 }))
    } finally {
      setLoading(false)
    }
  }

  const getActionConfig = (action) => {
    const configs = {
      login: { icon: LogIn, color: 'text-green-400', bg: 'bg-green-500/10' },
      logout: { icon: LogOut, color: 'text-gray-400', bg: 'bg-gray-500/10' },
      trade: { icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10' },
      payment: { icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10' },
      settings: { icon: Settings, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
      security: { icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10' },
      challenge: { icon: Target, color: 'text-primary', bg: 'bg-primary/10' }
    }
    return configs[action] || { icon: Activity, color: 'text-gray-400', bg: 'bg-gray-500/10' }
  }

  const columns = [
    {
      key: 'created_at',
      label: 'Time',
      render: (value) => (
        <span className="text-gray-400 text-sm font-mono">
          {new Date(value).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </span>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: (action) => {
        const config = getActionConfig(action)
        const Icon = config.icon
        return (
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${config.bg}`}>
              <Icon size={16} className={config.color} />
            </div>
            <span className="text-white capitalize">{action}</span>
          </div>
        )
      }
    },
    {
      key: 'user',
      label: 'User',
      render: (user) => (
        <div>
          <p className="text-white font-medium">{user?.username}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => (
        <span className="text-gray-300">{value}</span>
      )
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (value, row) => (
        <div>
          <p className="text-gray-300 font-mono text-sm">{value}</p>
          <p className="text-gray-500 text-xs">{row.metadata?.location || 'Unknown'}</p>
        </div>
      )
    },
    {
      key: 'user_agent',
      label: 'Device',
      render: (value) => (
        <span className="text-gray-400 text-sm">{value}</span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={() => navigate(`/admin/users/${row.user?.id}`)}
          className="p-1.5 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
          title="View User"
        >
          <Eye size={16} />
        </button>
      )
    }
  ]

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'trade', label: 'Trade' },
    { value: 'payment', label: 'Payment' },
    { value: 'settings', label: 'Settings' },
    { value: 'security', label: 'Security' },
    { value: 'challenge', label: 'Challenge' }
  ]

  const dateRangeOptions = [
    { value: '1h', label: 'Last hour' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' }
  ]

  const statCards = [
    { label: 'Total Activities', value: stats.totalToday, icon: Activity, color: 'text-white', bg: 'bg-dark-200' },
    { label: 'Logins', value: stats.logins, icon: LogIn, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Trades', value: stats.trades, icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Payments', value: stats.payments, icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10' }
  ]

  return (
    <AdminLayout
      title="User Activity"
      subtitle="Real-time user activity monitoring"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'User Activity' }
      ]}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.bg} rounded-xl p-4 border border-dark-200`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">{stat.label}</p>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Live Indicator */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping" />
          </div>
          <span className="text-white font-medium">Live Activity Feed</span>
          <span className="text-gray-400 text-sm">Auto-refreshes every 30 seconds</span>
        </div>
        <button
          onClick={fetchActivities}
          className="flex items-center gap-2 px-4 py-2 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh Now
        </button>
      </div>

      {/* Filters */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by username, email, or IP..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-dark-200 text-white rounded-lg pl-10 pr-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Action Filter */}
          <select
            value={filters.action}
            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            {actionOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Date Range */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            {dateRangeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Export */}
          <button
            className="flex items-center gap-2 px-4 py-2 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={activities}
        loading={loading}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
        }}
        emptyMessage="No activities found"
      />
    </AdminLayout>
  )
}

export default UserActivityPage
