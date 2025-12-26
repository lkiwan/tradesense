import { useState, useEffect } from 'react'
import {
  Users, Search, CheckSquare, Square, Ban, Mail, Bell,
  Trash2, RefreshCw, Download, Filter, AlertTriangle,
  Play, Pause, UserX, UserCheck, CreditCard, Target
} from 'lucide-react'
import { AdminLayout, DataTable, StatusBadge, ConfirmationModal } from '../../../components/admin'
import superAdminApi from '../../../services/superAdminApi'
import toast from 'react-hot-toast'

const BulkActionsPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [processing, setProcessing] = useState(false)

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    role: '',
    hasChallenge: '',
    registeredAfter: '',
    registeredBefore: ''
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  })

  useEffect(() => {
    fetchUsers()
  }, [filters, pagination.page])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await superAdminApi.users.getUsers({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      })
      setUsers(response.data.users || [])
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }))
    } catch (error) {
      console.error('Error fetching users:', error)
      // Mock data
      setUsers([
        { id: 1, username: 'trader_pro', email: 'trader@example.com', status: 'active', role: 'user', has_challenge: true, created_at: '2024-12-20T10:00:00Z' },
        { id: 2, username: 'fx_master', email: 'fx@example.com', status: 'active', role: 'user', has_challenge: true, created_at: '2024-12-19T09:00:00Z' },
        { id: 3, username: 'crypto_king', email: 'crypto@example.com', status: 'banned', role: 'user', has_challenge: false, created_at: '2024-12-18T08:00:00Z' },
        { id: 4, username: 'swing_trader', email: 'swing@example.com', status: 'active', role: 'user', has_challenge: true, created_at: '2024-12-17T07:00:00Z' },
        { id: 5, username: 'day_trader', email: 'day@example.com', status: 'frozen', role: 'user', has_challenge: false, created_at: '2024-12-16T06:00:00Z' },
        { id: 6, username: 'scalper_pro', email: 'scalper@example.com', status: 'active', role: 'user', has_challenge: true, created_at: '2024-12-15T05:00:00Z' },
        { id: 7, username: 'position_trader', email: 'position@example.com', status: 'active', role: 'user', has_challenge: false, created_at: '2024-12-14T04:00:00Z' },
        { id: 8, username: 'algo_trader', email: 'algo@example.com', status: 'trade_blocked', role: 'user', has_challenge: true, created_at: '2024-12-13T03:00:00Z' }
      ])
      setPagination(prev => ({ ...prev, total: 8 }))
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
  }

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }
    setPendingAction(action)
    setShowConfirmModal(true)
  }

  const executeBulkAction = async () => {
    if (!pendingAction || selectedUsers.length === 0) return

    setProcessing(true)
    try {
      await superAdminApi.users.bulkAction(selectedUsers, pendingAction.action, pendingAction.params || {})
      toast.success(`${pendingAction.label} completed for ${selectedUsers.length} users`)
      setSelectedUsers([])
      fetchUsers()
    } catch (error) {
      console.error('Error executing bulk action:', error)
      toast.error('Failed to execute bulk action')
    } finally {
      setProcessing(false)
      setShowConfirmModal(false)
      setPendingAction(null)
    }
  }

  const bulkActions = [
    { action: 'ban', label: 'Ban Users', icon: Ban, color: 'text-red-400', bg: 'bg-red-500/20', description: 'Permanently ban selected users' },
    { action: 'unban', label: 'Unban Users', icon: UserCheck, color: 'text-green-400', bg: 'bg-green-500/20', description: 'Remove ban from selected users' },
    { action: 'freeze', label: 'Freeze Users', icon: Pause, color: 'text-blue-400', bg: 'bg-blue-500/20', params: { hours: 24 }, description: 'Temporarily freeze for 24 hours' },
    { action: 'unfreeze', label: 'Unfreeze Users', icon: Play, color: 'text-green-400', bg: 'bg-green-500/20', description: 'Remove freeze from selected users' },
    { action: 'block_trading', label: 'Block Trading', icon: Target, color: 'text-yellow-400', bg: 'bg-yellow-500/20', description: 'Block trading for selected users' },
    { action: 'unblock_trading', label: 'Unblock Trading', icon: Target, color: 'text-green-400', bg: 'bg-green-500/20', description: 'Allow trading for selected users' },
    { action: 'send_notification', label: 'Send Notification', icon: Bell, color: 'text-purple-400', bg: 'bg-purple-500/20', description: 'Send push notification' },
    { action: 'send_email', label: 'Send Email', icon: Mail, color: 'text-blue-400', bg: 'bg-blue-500/20', description: 'Send bulk email' }
  ]

  const getStatusConfig = (status) => {
    const configs = {
      active: { color: 'green', label: 'Active' },
      banned: { color: 'red', label: 'Banned' },
      frozen: { color: 'blue', label: 'Frozen' },
      trade_blocked: { color: 'yellow', label: 'Trade Blocked' },
      inactive: { color: 'gray', label: 'Inactive' }
    }
    return configs[status] || configs.inactive
  }

  const columns = [
    {
      key: 'select',
      label: (
        <button onClick={handleSelectAll} className="p-1">
          {selectedUsers.length === users.length && users.length > 0 ? (
            <CheckSquare size={18} className="text-primary" />
          ) : (
            <Square size={18} className="text-gray-500" />
          )}
        </button>
      ),
      render: (_, row) => (
        <button onClick={() => handleSelectUser(row.id)} className="p-1">
          {selectedUsers.includes(row.id) ? (
            <CheckSquare size={18} className="text-primary" />
          ) : (
            <Square size={18} className="text-gray-500" />
          )}
        </button>
      )
    },
    {
      key: 'username',
      label: 'User',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {value?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white font-medium">{value}</p>
            <p className="text-gray-500 text-sm">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const config = getStatusConfig(value)
        return <StatusBadge status={config.label} color={config.color} />
      }
    },
    {
      key: 'has_challenge',
      label: 'Challenge',
      render: (value) => (
        <span className={value ? 'text-green-400' : 'text-gray-500'}>
          {value ? 'Active' : 'None'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Registered',
      render: (value) => (
        <span className="text-gray-400 text-sm">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    }
  ]

  return (
    <AdminLayout
      title="Bulk Actions"
      subtitle="Perform actions on multiple users at once"
      breadcrumbs={[
        { label: 'SuperAdmin', href: '/superadmin/dashboard' },
        { label: 'Bulk Actions' }
      ]}
    >
      {/* Warning Banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-yellow-500 font-medium">Bulk Actions</p>
          <p className="text-yellow-500/70 text-sm">
            Actions performed here will affect multiple users simultaneously. Please review your selection carefully before proceeding.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-primary" />
            <span className="text-white font-medium">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          {selectedUsers.length > 0 && (
            <button
              onClick={() => setSelectedUsers([])}
              className="text-gray-400 hover:text-white text-sm"
            >
              Clear selection
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {bulkActions.map((action) => (
            <button
              key={action.action}
              onClick={() => handleBulkAction(action)}
              disabled={selectedUsers.length === 0}
              className={`flex items-center gap-2 p-3 rounded-lg border border-dark-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.bg} hover:border-dark-200`}
            >
              <action.icon size={18} className={action.color} />
              <span className={`text-sm ${action.color}`}>{action.label}</span>
            </button>
          ))}
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
              placeholder="Search by username or email..."
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
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="frozen">Frozen</option>
            <option value="trade_blocked">Trade Blocked</option>
          </select>

          {/* Challenge Filter */}
          <select
            value={filters.hasChallenge}
            onChange={(e) => setFilters(prev => ({ ...prev, hasChallenge: e.target.value }))}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            <option value="">All Users</option>
            <option value="true">With Challenge</option>
            <option value="false">Without Challenge</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={filters.registeredAfter}
            onChange={(e) => setFilters(prev => ({ ...prev, registeredAfter: e.target.value }))}
            placeholder="Registered after"
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          />

          {/* Actions */}
          <button
            onClick={fetchUsers}
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

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
        }}
        emptyMessage="No users found"
      />

      {/* Confirmation Modal */}
      {showConfirmModal && pendingAction && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false)
            setPendingAction(null)
          }}
          onConfirm={executeBulkAction}
          title={`Confirm ${pendingAction.label}`}
          message={`Are you sure you want to ${pendingAction.label.toLowerCase()} for ${selectedUsers.length} selected user${selectedUsers.length !== 1 ? 's' : ''}? ${pendingAction.description}`}
          confirmText={processing ? 'Processing...' : `${pendingAction.label}`}
          variant={pendingAction.action.includes('ban') || pendingAction.action.includes('block') ? 'danger' : 'warning'}
        />
      )}
    </AdminLayout>
  )
}

export default BulkActionsPage
