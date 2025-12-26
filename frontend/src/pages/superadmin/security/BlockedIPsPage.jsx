import { useState, useEffect } from 'react'
import {
  Shield, Ban, Search, RefreshCw, Plus, Trash2, Clock,
  Globe, AlertTriangle, CheckCircle, Calendar, User
} from 'lucide-react'
import { AdminLayout, DataTable, ConfirmationModal } from '../../../components/admin'
import superAdminApi from '../../../services/superAdminApi'
import toast from 'react-hot-toast'

const BlockedIPsPage = () => {
  const [blockedIPs, setBlockedIPs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUnblockModal, setShowUnblockModal] = useState(false)
  const [selectedIP, setSelectedIP] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // New IP form
  const [newIP, setNewIP] = useState({
    ip_address: '',
    reason: '',
    expires_at: '',
    permanent: true
  })

  // Stats
  const [stats, setStats] = useState({
    totalBlocked: 0,
    permanent: 0,
    temporary: 0,
    expiringSoon: 0
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  useEffect(() => {
    fetchBlockedIPs()
  }, [searchQuery, pagination.page])

  const fetchBlockedIPs = async () => {
    setLoading(true)
    try {
      const response = await superAdminApi.security.getBlockedIPs({
        search: searchQuery,
        page: pagination.page,
        limit: pagination.limit
      })
      setBlockedIPs(response.data.blocked_ips || [])
      setStats(response.data.stats || {})
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }))
    } catch (error) {
      console.error('Error fetching blocked IPs:', error)
      // Mock data
      setBlockedIPs([
        {
          id: 1,
          ip_address: '45.33.21.100',
          reason: 'Brute force login attempts',
          blocked_by: { id: 1, username: 'superadmin' },
          blocked_at: '2024-12-24T15:00:00Z',
          expires_at: null,
          permanent: true,
          attempts_blocked: 156
        },
        {
          id: 2,
          ip_address: '192.168.100.50',
          reason: 'Suspicious scraping activity',
          blocked_by: { id: 1, username: 'superadmin' },
          blocked_at: '2024-12-23T12:00:00Z',
          expires_at: '2024-12-25T12:00:00Z',
          permanent: false,
          attempts_blocked: 45
        },
        {
          id: 3,
          ip_address: '10.0.0.55',
          reason: 'Multiple failed payment attempts',
          blocked_by: { id: 2, username: 'finance_admin' },
          blocked_at: '2024-12-22T09:00:00Z',
          expires_at: null,
          permanent: true,
          attempts_blocked: 23
        },
        {
          id: 4,
          ip_address: '172.16.0.100',
          reason: 'API abuse - rate limit exceeded',
          blocked_by: { id: 1, username: 'superadmin' },
          blocked_at: '2024-12-21T18:00:00Z',
          expires_at: '2024-12-28T18:00:00Z',
          permanent: false,
          attempts_blocked: 89
        },
        {
          id: 5,
          ip_address: '203.0.113.50',
          reason: 'Spam registration attempts',
          blocked_by: { id: 3, username: 'support_lead' },
          blocked_at: '2024-12-20T14:00:00Z',
          expires_at: null,
          permanent: true,
          attempts_blocked: 312
        }
      ])
      setStats({
        totalBlocked: 5,
        permanent: 3,
        temporary: 2,
        expiringSoon: 1
      })
      setPagination(prev => ({ ...prev, total: 5 }))
    } finally {
      setLoading(false)
    }
  }

  const handleBlockIP = async () => {
    if (!newIP.ip_address) {
      toast.error('Please enter an IP address')
      return
    }

    try {
      await superAdminApi.security.blockIP(
        newIP.ip_address,
        newIP.reason,
        newIP.permanent ? null : newIP.expires_at
      )
      toast.success(`IP ${newIP.ip_address} has been blocked`)
      fetchBlockedIPs()
      setShowAddModal(false)
      setNewIP({ ip_address: '', reason: '', expires_at: '', permanent: true })
    } catch (error) {
      console.error('Error blocking IP:', error)
      toast.error('Failed to block IP')
    }
  }

  const handleUnblockIP = async () => {
    try {
      await superAdminApi.security.unblockIP(selectedIP.ip_address)
      toast.success(`IP ${selectedIP.ip_address} has been unblocked`)
      fetchBlockedIPs()
      setShowUnblockModal(false)
      setSelectedIP(null)
    } catch (error) {
      console.error('Error unblocking IP:', error)
      toast.error('Failed to unblock IP')
    }
  }

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false
    const expiry = new Date(expiresAt)
    const now = new Date()
    const hoursUntilExpiry = (expiry - now) / (1000 * 60 * 60)
    return hoursUntilExpiry > 0 && hoursUntilExpiry < 24
  }

  const columns = [
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (value) => (
        <span className="text-white font-mono">{value}</span>
      )
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (value) => (
        <span className="text-gray-300 text-sm max-w-[200px] truncate block">{value}</span>
      )
    },
    {
      key: 'permanent',
      label: 'Duration',
      render: (value, row) => (
        value ? (
          <span className="text-red-400 flex items-center gap-1">
            <Ban size={14} />
            Permanent
          </span>
        ) : (
          <div>
            <span className={`flex items-center gap-1 ${isExpiringSoon(row.expires_at) ? 'text-yellow-400' : 'text-blue-400'}`}>
              <Clock size={14} />
              Temporary
            </span>
            <span className="text-gray-500 text-xs">
              Expires: {new Date(row.expires_at).toLocaleDateString()}
            </span>
          </div>
        )
      )
    },
    {
      key: 'blocked_by',
      label: 'Blocked By',
      render: (value) => (
        <span className="text-gray-400">{value?.username}</span>
      )
    },
    {
      key: 'blocked_at',
      label: 'Blocked At',
      render: (value) => (
        <span className="text-gray-400 text-sm">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'attempts_blocked',
      label: 'Blocked Attempts',
      render: (value) => (
        <span className="text-white font-medium">{value.toLocaleString()}</span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={() => {
            setSelectedIP(row)
            setShowUnblockModal(true)
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
        >
          <CheckCircle size={14} />
          Unblock
        </button>
      )
    }
  ]

  const statCards = [
    { label: 'Total Blocked', value: stats.totalBlocked, icon: Ban, color: 'text-white', bg: 'bg-dark-200' },
    { label: 'Permanent', value: stats.permanent, icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Temporary', value: stats.temporary, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Expiring Soon', value: stats.expiringSoon, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
  ]

  return (
    <AdminLayout
      title="Blocked IP Addresses"
      subtitle="Manage blocked IP addresses and access restrictions"
      breadcrumbs={[
        { label: 'SuperAdmin', href: '/superadmin/dashboard' },
        { label: 'Blocked IPs' }
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
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by IP address or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-200 text-white rounded-lg pl-10 pr-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Actions */}
          <button
            onClick={fetchBlockedIPs}
            className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Plus size={18} />
            Block IP
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={blockedIPs}
        loading={loading}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
        }}
        emptyMessage="No blocked IPs found"
      />

      {/* Add IP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-xl border border-dark-200 w-full max-w-md">
            <div className="p-6 border-b border-dark-200">
              <h3 className="text-xl font-bold text-white">Block IP Address</h3>
              <p className="text-gray-500 text-sm mt-1">Add an IP address to the blocklist</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">IP Address *</label>
                <input
                  type="text"
                  value={newIP.ip_address}
                  onChange={(e) => setNewIP(prev => ({ ...prev, ip_address: e.target.value }))}
                  placeholder="e.g., 192.168.1.100"
                  className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Reason</label>
                <textarea
                  value={newIP.reason}
                  onChange={(e) => setNewIP(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Why is this IP being blocked?"
                  rows={3}
                  className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIP.permanent}
                    onChange={(e) => setNewIP(prev => ({ ...prev, permanent: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-600 text-red-500 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-white">Permanent block</span>
                    <p className="text-gray-500 text-sm">IP will be blocked indefinitely</p>
                  </div>
                </label>
              </div>

              {!newIP.permanent && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Expires At</label>
                  <input
                    type="datetime-local"
                    value={newIP.expires_at}
                    onChange={(e) => setNewIP(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-dark-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewIP({ ip_address: '', reason: '', expires_at: '', permanent: true })
                }}
                className="px-4 py-2 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockIP}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Ban size={18} />
                Block IP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unblock Modal */}
      {showUnblockModal && selectedIP && (
        <ConfirmationModal
          isOpen={showUnblockModal}
          onClose={() => {
            setShowUnblockModal(false)
            setSelectedIP(null)
          }}
          onConfirm={handleUnblockIP}
          title="Unblock IP Address"
          message={`Are you sure you want to unblock ${selectedIP.ip_address}? This will allow access from this IP again.`}
          confirmText="Unblock"
          variant="warning"
        />
      )}
    </AdminLayout>
  )
}

export default BlockedIPsPage
