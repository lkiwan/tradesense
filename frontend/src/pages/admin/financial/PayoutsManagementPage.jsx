import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Wallet, DollarSign, Clock, CheckCircle, XCircle,
  Eye, MoreVertical, RefreshCw, Download, Send, Ban, AlertTriangle
} from 'lucide-react'
import { AdminLayout, DataTable, StatusBadge, ConfirmationModal } from '../../../components/admin'
import adminApi from '../../../services/adminApi'

const PayoutsManagementPage = () => {
  const navigate = useNavigate()
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    rejected: 0,
    pendingAmount: 0
  })

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateRange: '30d'
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  // Selected payouts for bulk actions
  const [selectedPayouts, setSelectedPayouts] = useState([])

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchPayouts()
  }, [filters, pagination.page])

  const fetchPayouts = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getPayouts({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      })
      setPayouts(response.data.payouts || [])
      setStats(response.data.stats || {})
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }))
    } catch (error) {
      console.error('Error fetching payouts:', error)
      // Mock data
      setPayouts([
        {
          id: 'PO-001',
          user: { id: 1, username: 'trader_pro', email: 'trader@example.com' },
          challenge: { id: 1, model: 'Standard 100K' },
          amount: 2500,
          currency: 'USD',
          method: 'bank_transfer',
          bank_details: { bank: 'Chase', account: '****1234' },
          status: 'pending',
          profit_split: 80,
          created_at: '2024-12-24T10:30:00Z'
        },
        {
          id: 'PO-002',
          user: { id: 2, username: 'fx_master', email: 'fx@example.com' },
          challenge: { id: 2, model: 'Aggressive 200K' },
          amount: 5000,
          currency: 'USD',
          method: 'crypto',
          wallet_address: '0x1234...5678',
          status: 'processing',
          profit_split: 85,
          created_at: '2024-12-23T16:45:00Z'
        },
        {
          id: 'PO-003',
          user: { id: 3, username: 'swing_trader', email: 'swing@example.com' },
          challenge: { id: 3, model: 'Standard 50K' },
          amount: 1200,
          currency: 'USD',
          method: 'paypal',
          paypal_email: 'swing@paypal.com',
          status: 'completed',
          profit_split: 80,
          processed_at: '2024-12-22T14:00:00Z',
          created_at: '2024-12-21T11:00:00Z'
        },
        {
          id: 'PO-004',
          user: { id: 4, username: 'day_trader', email: 'day@example.com' },
          challenge: { id: 4, model: 'Standard 25K' },
          amount: 800,
          currency: 'USD',
          method: 'bank_transfer',
          status: 'rejected',
          rejection_reason: 'Incomplete KYC',
          created_at: '2024-12-20T09:30:00Z'
        }
      ])
      setStats({
        total: 450,
        pending: 25,
        processing: 10,
        completed: 400,
        rejected: 15,
        pendingAmount: 45000
      })
      setPagination(prev => ({ ...prev, total: 4 }))
    } finally {
      setLoading(false)
    }
  }

  const handleApprovePayout = async () => {
    if (!selectedPayout) return
    setActionLoading(true)
    try {
      await adminApi.approvePayout(selectedPayout.id)
      fetchPayouts()
      setShowApproveModal(false)
      setSelectedPayout(null)
    } catch (error) {
      console.error('Error approving payout:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectPayout = async () => {
    if (!selectedPayout) return
    setActionLoading(true)
    try {
      await adminApi.rejectPayout(selectedPayout.id, { reason: 'Admin rejection' })
      fetchPayouts()
      setShowRejectModal(false)
      setSelectedPayout(null)
    } catch (error) {
      console.error('Error rejecting payout:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkApprove = async () => {
    setActionLoading(true)
    try {
      await Promise.all(selectedPayouts.map(id => adminApi.approvePayout(id)))
      fetchPayouts()
      setSelectedPayouts([])
    } catch (error) {
      console.error('Error bulk approving payouts:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'yellow', icon: Clock },
      processing: { color: 'blue', icon: RefreshCw },
      completed: { color: 'green', icon: CheckCircle },
      rejected: { color: 'red', icon: XCircle }
    }
    return configs[status] || configs.pending
  }

  const getMethodLabel = (method) => {
    const labels = {
      bank_transfer: 'Bank Transfer',
      crypto: 'Cryptocurrency',
      paypal: 'PayPal',
      wise: 'Wise'
    }
    return labels[method] || method
  }

  const columns = [
    {
      key: 'select',
      label: '',
      render: (_, row) => row.status === 'pending' && (
        <input
          type="checkbox"
          checked={selectedPayouts.includes(row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedPayouts(prev => [...prev, row.id])
            } else {
              setSelectedPayouts(prev => prev.filter(id => id !== row.id))
            }
          }}
          className="rounded border-dark-300 bg-dark-200 text-primary focus:ring-primary"
        />
      )
    },
    {
      key: 'id',
      label: 'Payout ID',
      render: (value) => (
        <span className="text-gray-400 font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'user',
      label: 'Trader',
      render: (user) => (
        <div>
          <p className="font-medium text-white">{user?.username}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      )
    },
    {
      key: 'challenge',
      label: 'Challenge',
      render: (challenge) => (
        <span className="text-gray-300 text-sm">{challenge?.model}</span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (amount, row) => (
        <div>
          <p className="text-white font-medium">${amount.toLocaleString()}</p>
          <p className="text-gray-500 text-xs">{row.profit_split}% split</p>
        </div>
      )
    },
    {
      key: 'method',
      label: 'Method',
      render: (method) => (
        <span className="text-gray-300 text-sm">{getMethodLabel(method)}</span>
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
      label: 'Requested',
      render: (value) => (
        <span className="text-gray-400 text-sm">
          {new Date(value).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => {
                  setSelectedPayout(row)
                  setShowApproveModal(true)
                }}
                className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                title="Approve"
              >
                <CheckCircle size={16} />
              </button>
              <button
                onClick={() => {
                  setSelectedPayout(row)
                  setShowRejectModal(true)
                }}
                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="Reject"
              >
                <XCircle size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => navigate(`/admin/users/${row.user?.id}`)}
            className="p-1.5 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
            title="View User"
          >
            <Eye size={16} />
          </button>
        </div>
      )
    }
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' }
  ]

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' }
  ]

  const statCards = [
    { label: 'Total Payouts', value: stats.total, icon: Wallet, color: 'text-white', bg: 'bg-dark-200' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Processing', value: stats.processing, icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' }
  ]

  return (
    <AdminLayout
      title="Payout Management"
      subtitle="Review and process trader payout requests"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Financial', href: '/admin/financial' },
        { label: 'Payouts' }
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

      {/* Pending Amount Alert */}
      {stats.pendingAmount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-yellow-500" />
            <div>
              <p className="text-white font-medium">Pending Payouts</p>
              <p className="text-yellow-400 text-sm">
                ${stats.pendingAmount.toLocaleString()} waiting for approval
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: 'pending' }))}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium"
          >
            Review Pending
          </button>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedPayouts.length > 0 && (
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-4 mb-6 flex items-center justify-between">
          <p className="text-white">
            <span className="font-medium">{selectedPayouts.length}</span> payout(s) selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkApprove}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
              Approve Selected
            </button>
            <button
              onClick={() => setSelectedPayouts([])}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by username or payout ID..."
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
              onClick={fetchPayouts}
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
        data={payouts}
        loading={loading}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
        }}
        emptyMessage="No payouts found"
      />

      {/* Approve Modal */}
      {showApproveModal && selectedPayout && (
        <ConfirmationModal
          isOpen={showApproveModal}
          onClose={() => {
            setShowApproveModal(false)
            setSelectedPayout(null)
          }}
          onConfirm={handleApprovePayout}
          title="Approve Payout"
          message={`Are you sure you want to approve the payout of $${selectedPayout.amount.toLocaleString()} for ${selectedPayout.user?.username}? This will initiate the transfer process.`}
          confirmText="Approve Payout"
          variant="success"
          loading={actionLoading}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayout && (
        <ConfirmationModal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false)
            setSelectedPayout(null)
          }}
          onConfirm={handleRejectPayout}
          title="Reject Payout"
          message={`Are you sure you want to reject the payout request of $${selectedPayout.amount.toLocaleString()} for ${selectedPayout.user?.username}?`}
          confirmText="Reject Payout"
          variant="danger"
          loading={actionLoading}
        />
      )}
    </AdminLayout>
  )
}

export default PayoutsManagementPage
