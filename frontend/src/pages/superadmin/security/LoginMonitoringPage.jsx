import { useState, useEffect } from 'react'
import {
  LogIn, LogOut, AlertTriangle, Shield, Globe, Monitor,
  Search, RefreshCw, Download, Ban, CheckCircle, XCircle,
  MapPin, Clock, User, Eye, Filter
} from 'lucide-react'
import { AdminLayout, DataTable, StatusBadge, ConfirmationModal } from '../../../components/admin'
import superAdminApi from '../../../services/superAdminApi'
import toast from 'react-hot-toast'

const LoginMonitoringPage = () => {
  const [loginAttempts, setLoginAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [ipToBlock, setIpToBlock] = useState(null)

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    dateRange: '24h'
  })

  // Stats
  const [stats, setStats] = useState({
    totalLogins: 0,
    successfulLogins: 0,
    failedLogins: 0,
    suspiciousAttempts: 0,
    uniqueIPs: 0
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  })

  useEffect(() => {
    fetchLoginAttempts()
  }, [filters, pagination.page])

  const fetchLoginAttempts = async () => {
    setLoading(true)
    try {
      const response = await superAdminApi.security.getLoginActivity({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      })
      setLoginAttempts(response.data.attempts || [])
      setStats(response.data.stats || {})
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }))
    } catch (error) {
      console.error('Error fetching login attempts:', error)
      // Mock data
      setLoginAttempts([
        {
          id: 1,
          user: { id: 1, username: 'trader_pro', email: 'trader@example.com' },
          status: 'success',
          ip_address: '192.168.1.100',
          location: { country: 'Morocco', city: 'Casablanca' },
          device: 'Chrome 120 / Windows 11',
          timestamp: '2024-12-24T15:30:00Z',
          suspicious: false,
          reason: null
        },
        {
          id: 2,
          user: { id: 2, username: 'fx_master', email: 'fx@example.com' },
          status: 'success',
          ip_address: '192.168.1.101',
          location: { country: 'France', city: 'Paris' },
          device: 'Firefox 121 / MacOS',
          timestamp: '2024-12-24T15:25:00Z',
          suspicious: false,
          reason: null
        },
        {
          id: 3,
          user: { id: null, username: 'unknown', email: 'attacker@example.com' },
          status: 'failed',
          ip_address: '45.33.21.100',
          location: { country: 'Unknown', city: 'Unknown' },
          device: 'Unknown',
          timestamp: '2024-12-24T15:20:00Z',
          suspicious: true,
          reason: 'Multiple failed attempts from this IP'
        },
        {
          id: 4,
          user: { id: 3, username: 'crypto_king', email: 'crypto@example.com' },
          status: 'failed',
          ip_address: '192.168.1.102',
          location: { country: 'USA', city: 'New York' },
          device: 'Safari 17 / iOS',
          timestamp: '2024-12-24T15:15:00Z',
          suspicious: false,
          reason: 'Invalid password'
        },
        {
          id: 5,
          user: { id: 4, username: 'swing_trader', email: 'swing@example.com' },
          status: 'success',
          ip_address: '192.168.1.103',
          location: { country: 'UK', city: 'London' },
          device: 'Edge 120 / Windows 10',
          timestamp: '2024-12-24T15:10:00Z',
          suspicious: false,
          reason: null
        },
        {
          id: 6,
          user: { id: null, username: 'unknown', email: 'test@test.com' },
          status: 'failed',
          ip_address: '45.33.21.100',
          location: { country: 'Unknown', city: 'Unknown' },
          device: 'Unknown',
          timestamp: '2024-12-24T15:05:00Z',
          suspicious: true,
          reason: 'Brute force attempt detected'
        },
        {
          id: 7,
          user: { id: 5, username: 'day_trader', email: 'day@example.com' },
          status: 'blocked',
          ip_address: '45.33.21.100',
          location: { country: 'Unknown', city: 'Unknown' },
          device: 'Unknown',
          timestamp: '2024-12-24T15:00:00Z',
          suspicious: true,
          reason: 'IP address is blocked'
        },
        {
          id: 8,
          user: { id: 1, username: 'trader_pro', email: 'trader@example.com' },
          status: 'success',
          ip_address: '192.168.1.104',
          location: { country: 'Morocco', city: 'Rabat' },
          device: 'Chrome 120 / Android',
          timestamp: '2024-12-24T14:55:00Z',
          suspicious: true,
          reason: 'Login from new location'
        }
      ])
      setStats({
        totalLogins: 1250,
        successfulLogins: 1180,
        failedLogins: 65,
        suspiciousAttempts: 12,
        uniqueIPs: 890
      })
      setPagination(prev => ({ ...prev, total: 8 }))
    } finally {
      setLoading(false)
    }
  }

  const handleBlockIP = async () => {
    try {
      await superAdminApi.security.blockIP(ipToBlock, 'Suspicious login activity')
      toast.success(`IP ${ipToBlock} has been blocked`)
      fetchLoginAttempts()
      setShowBlockModal(false)
      setIpToBlock(null)
    } catch (error) {
      console.error('Error blocking IP:', error)
      toast.error('Failed to block IP')
    }
  }

  const getStatusConfig = (status, suspicious) => {
    if (suspicious) {
      return { color: 'yellow', icon: AlertTriangle, label: 'Suspicious' }
    }
    const configs = {
      success: { color: 'green', icon: CheckCircle, label: 'Success' },
      failed: { color: 'red', icon: XCircle, label: 'Failed' },
      blocked: { color: 'gray', icon: Ban, label: 'Blocked' }
    }
    return configs[status] || configs.failed
  }

  const columns = [
    {
      key: 'timestamp',
      label: 'Time',
      render: (value) => (
        <div className="text-sm">
          <p className="text-white">
            {new Date(value).toLocaleTimeString()}
          </p>
          <p className="text-gray-500 text-xs">
            {new Date(value).toLocaleDateString()}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => {
        const config = getStatusConfig(value, row.suspicious)
        return (
          <div className="flex items-center gap-2">
            <StatusBadge status={config.label} color={config.color} />
            {row.suspicious && (
              <AlertTriangle size={14} className="text-yellow-500" />
            )}
          </div>
        )
      }
    },
    {
      key: 'user',
      label: 'User',
      render: (value) => (
        <div>
          <p className="text-white">{value?.username || 'Unknown'}</p>
          <p className="text-gray-500 text-sm">{value?.email || '-'}</p>
        </div>
      )
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (value) => (
        <span className="text-gray-300 font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'location',
      label: 'Location',
      render: (value) => (
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-gray-500" />
          <span className="text-gray-300 text-sm">
            {value?.city}, {value?.country}
          </span>
        </div>
      )
    },
    {
      key: 'device',
      label: 'Device',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-gray-500" />
          <span className="text-gray-400 text-sm max-w-[150px] truncate">{value}</span>
        </div>
      )
    },
    {
      key: 'reason',
      label: 'Notes',
      render: (value) => (
        value ? (
          <span className="text-yellow-400 text-sm">{value}</span>
        ) : (
          <span className="text-gray-500 text-sm">-</span>
        )
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedAttempt(row)}
            className="p-1.5 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {row.status !== 'blocked' && (row.suspicious || row.status === 'failed') && (
            <button
              onClick={() => {
                setIpToBlock(row.ip_address)
                setShowBlockModal(true)
              }}
              className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              title="Block IP"
            >
              <Ban size={16} />
            </button>
          )}
        </div>
      )
    }
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
    { value: 'blocked', label: 'Blocked' }
  ]

  const dateRangeOptions = [
    { value: '1h', label: 'Last hour' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' }
  ]

  const statCards = [
    { label: 'Total Attempts', value: stats.totalLogins, icon: LogIn, color: 'text-white', bg: 'bg-dark-200' },
    { label: 'Successful', value: stats.successfulLogins, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Failed', value: stats.failedLogins, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Suspicious', value: stats.suspiciousAttempts, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
  ]

  return (
    <AdminLayout
      title="Login Monitoring"
      subtitle="Monitor login attempts and suspicious activity"
      breadcrumbs={[
        { label: 'SuperAdmin', href: '/superadmin/dashboard' },
        { label: 'Login Monitoring' }
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

      {/* Suspicious Activity Alert */}
      {stats.suspiciousAttempts > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-center gap-4">
          <AlertTriangle size={24} className="text-yellow-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-yellow-500 font-medium">Suspicious Activity Detected</p>
            <p className="text-yellow-500/70 text-sm">
              {stats.suspiciousAttempts} suspicious login attempts detected. Review and take action if necessary.
            </p>
          </div>
          <button
            onClick={() => setFilters(prev => ({ ...prev, type: 'suspicious' }))}
            className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
          >
            View All
          </button>
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
              placeholder="Search by username, email, or IP..."
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

          {/* Suspicious Only */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.type === 'suspicious'}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.checked ? 'suspicious' : '' }))}
              className="w-4 h-4 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500"
            />
            <span className="text-gray-400 text-sm">Suspicious only</span>
          </label>

          {/* Actions */}
          <button
            onClick={fetchLoginAttempts}
            className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>

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
        data={loginAttempts}
        loading={loading}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
        }}
        emptyMessage="No login attempts found"
      />

      {/* Block IP Modal */}
      {showBlockModal && (
        <ConfirmationModal
          isOpen={showBlockModal}
          onClose={() => {
            setShowBlockModal(false)
            setIpToBlock(null)
          }}
          onConfirm={handleBlockIP}
          title="Block IP Address"
          message={`Are you sure you want to block IP address ${ipToBlock}? This will prevent any login attempts from this IP.`}
          confirmText="Block IP"
          variant="danger"
        />
      )}

      {/* Login Detail Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-xl border border-dark-200 w-full max-w-lg">
            <div className="p-6 border-b border-dark-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Login Attempt Details</h3>
                <p className="text-gray-500 text-sm">
                  {new Date(selectedAttempt.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <div className="mt-1">
                    <StatusBadge
                      status={getStatusConfig(selectedAttempt.status, selectedAttempt.suspicious).label}
                      color={getStatusConfig(selectedAttempt.status, selectedAttempt.suspicious).color}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Suspicious</label>
                  <p className={selectedAttempt.suspicious ? 'text-yellow-400' : 'text-green-400'}>
                    {selectedAttempt.suspicious ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">User</label>
                <p className="text-white">{selectedAttempt.user?.username || 'Unknown'}</p>
                <p className="text-gray-400 text-sm">{selectedAttempt.user?.email || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">IP Address</label>
                  <p className="text-white font-mono">{selectedAttempt.ip_address}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Location</label>
                  <p className="text-white">
                    {selectedAttempt.location?.city}, {selectedAttempt.location?.country}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Device / Browser</label>
                <p className="text-white">{selectedAttempt.device}</p>
              </div>

              {selectedAttempt.reason && (
                <div>
                  <label className="text-sm text-gray-500">Reason / Notes</label>
                  <p className="text-yellow-400">{selectedAttempt.reason}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-dark-200 flex justify-between">
              {selectedAttempt.status !== 'blocked' && (
                <button
                  onClick={() => {
                    setIpToBlock(selectedAttempt.ip_address)
                    setSelectedAttempt(null)
                    setShowBlockModal(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Ban size={18} />
                  Block IP
                </button>
              )}
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-4 py-2 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default LoginMonitoringPage
