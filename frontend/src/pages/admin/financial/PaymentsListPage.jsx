import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Filter, CreditCard, DollarSign, Calendar, Eye,
  MoreVertical, RefreshCw, Download, CheckCircle, XCircle, Clock,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { AdminLayout, DataTable, StatusBadge } from '../../../components/admin'
import adminApi from '../../../services/adminApi'

const PaymentsListPage = () => {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0
  })

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    method: '',
    dateRange: '30d'
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  useEffect(() => {
    fetchPayments()
  }, [filters, pagination.page])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getPayments({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      })
      setPayments(response.data.payments || [])
      setStats(response.data.stats || {})
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }))
    } catch (error) {
      console.error('Error fetching payments:', error)
      // Mock data
      setPayments([
        {
          id: 'PAY-001',
          user: { id: 1, username: 'trader_pro', email: 'trader@example.com' },
          amount: 299,
          currency: 'USD',
          method: 'card',
          status: 'completed',
          description: 'Standard 100K Challenge',
          transaction_id: 'txn_1234567890',
          created_at: '2024-12-24T10:30:00Z'
        },
        {
          id: 'PAY-002',
          user: { id: 2, username: 'fx_master', email: 'fx@example.com' },
          amount: 499,
          currency: 'USD',
          method: 'crypto',
          status: 'completed',
          description: 'Aggressive 200K Challenge',
          transaction_id: 'txn_0987654321',
          created_at: '2024-12-23T16:45:00Z'
        },
        {
          id: 'PAY-003',
          user: { id: 3, username: 'crypto_king', email: 'crypto@example.com' },
          amount: 199,
          currency: 'USD',
          method: 'card',
          status: 'pending',
          description: 'Standard 25K Challenge',
          transaction_id: null,
          created_at: '2024-12-23T14:20:00Z'
        },
        {
          id: 'PAY-004',
          user: { id: 4, username: 'swing_trader', email: 'swing@example.com' },
          amount: 399,
          currency: 'USD',
          method: 'paypal',
          status: 'failed',
          description: 'Standard 50K Challenge',
          transaction_id: null,
          error_message: 'Insufficient funds',
          created_at: '2024-12-22T11:00:00Z'
        }
      ])
      setStats({
        total: 1250,
        completed: 1180,
        pending: 45,
        failed: 25,
        totalAmount: 458750
      })
      setPagination(prev => ({ ...prev, total: 4 }))
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      completed: { color: 'green', icon: CheckCircle },
      pending: { color: 'yellow', icon: Clock },
      failed: { color: 'red', icon: XCircle },
      refunded: { color: 'blue', icon: ArrowDownRight }
    }
    return configs[status] || configs.pending
  }

  const getMethodIcon = (method) => {
    const icons = {
      card: '💳',
      crypto: '₿',
      paypal: '🅿️',
      bank: '🏦'
    }
    return icons[method] || '💰'
  }

  const columns = [
    {
      key: 'id',
      label: 'Payment ID',
      render: (value) => (
        <span className="text-gray-400 font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'user',
      label: 'Customer',
      render: (user) => (
        <div>
          <p className="font-medium text-white">{user?.username}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (amount, row) => (
        <span className="text-white font-medium">
          ${amount.toLocaleString()} {row.currency}
        </span>
      )
    },
    {
      key: 'method',
      label: 'Method',
      render: (method) => (
        <span className="flex items-center gap-2">
          <span>{getMethodIcon(method)}</span>
          <span className="text-gray-300 capitalize">{method}</span>
        </span>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => (
        <span className="text-gray-400 text-sm">{value}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => {
        const config = getStatusConfig(status)
        return <StatusBadge status={status} color={config.color} />
      }
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (value) => (
        <span className="text-gray-400 text-sm">
          {new Date(value).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/users/${row.user?.id}`)}
            className="p-1.5 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
            title="View User"
          >
            <Eye size={16} />
          </button>
          <button
            className="p-1.5 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
            title="More Actions"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      )
    }
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ]

  const methodOptions = [
    { value: '', label: 'All Methods' },
    { value: 'card', label: 'Card' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'bank', label: 'Bank Transfer' }
  ]

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' }
  ]

  const statCards = [
    { label: 'Total Payments', value: stats.total, icon: CreditCard, color: 'text-white', bg: 'bg-dark-200' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' }
  ]

  return (
    <AdminLayout
      title="Payments"
      subtitle="View and manage all payment transactions"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Financial', href: '/admin/financial' },
        { label: 'Payments' }
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

      {/* Total Revenue Card */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-dark-200 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 mb-1">Total Revenue (Selected Period)</p>
            <p className="text-3xl font-bold text-white">${stats.totalAmount?.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <DollarSign size={32} className="text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by username, email, or transaction ID..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-dark-200 text-white rounded-lg pl-10 pr-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Method Filter */}
          <select
            value={filters.method}
            onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            {methodOptions.map(opt => (
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

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPayments}
              className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
              title="Export"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
        }}
        emptyMessage="No payments found"
      />
    </AdminLayout>
  )
}

export default PaymentsListPage
