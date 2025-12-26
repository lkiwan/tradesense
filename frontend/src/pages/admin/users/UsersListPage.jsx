import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { AdminLayout, DataTable, StatusBadge } from '../../../components/admin'
import {
  Users, Search, Filter, Download, RefreshCw, Eye, Edit, Ban,
  UserCheck, MoreVertical, Mail, Calendar, Shield, ChevronDown
} from 'lucide-react'
import { adminUsersAPI } from '../../../services/adminApi'

const UsersListPage = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0
  })
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    kyc_status: '',
    has_challenge: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.perPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      }
      const response = await adminUsersAPI.getUsers(params)
      setUsers(response.data.users || [])
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.pages || 1
      }))
    } catch (error) {
      console.error('Error loading users:', error)
      // Mock data for development
      setUsers([
        { id: 1, username: 'admin', email: 'admin@tradesense.com', role: 'superadmin', email_verified: true, created_at: '2025-12-23T14:09:40', status: { is_banned: false, is_frozen: false } },
        { id: 5, username: 'lkiwann', email: 'lkiwann@gmail.com', role: 'user', email_verified: false, created_at: '2025-12-23T16:20:48', status: { is_banned: false, is_frozen: false } },
        { id: 6, username: 'lkiwan', email: 'lkiwan@gmail.com', role: 'user', email_verified: false, created_at: '2025-12-23T19:05:08', status: { is_banned: false, is_frozen: false } },
        { id: 7, username: 'TestTrader', email: 'testtrader@tradesense.com', role: 'user', email_verified: true, created_at: '2025-12-23T20:18:27', status: { is_banned: false, is_frozen: false }, challenges_count: 1 },
        { id: 8, username: 'testuser', email: 'invalid-email', role: 'user', email_verified: false, created_at: '2025-12-24T16:21:39', status: { is_banned: false, is_frozen: false } },
      ])
      setPagination(prev => ({ ...prev, total: 5, totalPages: 1 }))
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.perPage, filters])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSort = (column, direction) => {
    setFilters(prev => ({ ...prev, sort_by: column, sort_order: direction }))
  }

  const handleSelectRow = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = (checked) => {
    setSelectedUsers(checked ? users.map(u => u.id) : [])
  }

  const handleBanUser = async (user) => {
    if (user.status?.is_banned) {
      // Unban user
      try {
        await adminUsersAPI.unbanUser(user.id)
        toast.success(`${user.username} has been unbanned`)
        loadUsers()
      } catch (error) {
        console.error('Error unbanning user:', error)
        toast.error(error.response?.data?.error || 'Failed to unban user')
      }
    } else {
      // Ban user
      const reason = prompt('Enter ban reason:')
      if (reason) {
        try {
          await adminUsersAPI.banUser(user.id, { reason })
          toast.success(`${user.username} has been banned`)
          loadUsers()
        } catch (error) {
          console.error('Error banning user:', error)
          toast.error(error.response?.data?.error || 'Failed to ban user')
        }
      }
    }
  }

  const getUserStatus = (user) => {
    if (user.status?.is_banned) return 'banned'
    if (user.status?.is_frozen) return 'frozen'
    return 'active'
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'superadmin': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'admin': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-semibold">
              {user.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white font-medium">{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (role) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(role)}`}>
          {role}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, user) => <StatusBadge status={getUserStatus(user)} />
    },
    {
      key: 'email_verified',
      label: 'Email',
      render: (verified) => (
        <span className={`flex items-center gap-1 text-sm ${verified ? 'text-green-500' : 'text-gray-500'}`}>
          <Mail size={14} />
          {verified ? 'Verified' : 'Unverified'}
        </span>
      )
    },
    {
      key: 'challenges_count',
      label: 'Challenges',
      render: (count) => (
        <span className="text-white">{count || 0}</span>
      )
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (date) => (
        <span className="text-gray-400 text-sm">{formatDate(date)}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, user) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/admin/users/${user.id}`)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-200 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => navigate(`/admin/users/${user.id}?edit=true`)}
            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Edit User"
          >
            <Edit size={16} />
          </button>
          {user.role !== 'superadmin' && (
            <button
              onClick={() => handleBanUser(user)}
              className={`p-1.5 rounded-lg transition-colors ${
                user.status?.is_banned
                  ? 'text-green-400 hover:text-green-500 hover:bg-green-500/10'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
              }`}
              title={user.status?.is_banned ? 'Unban User' : 'Ban User'}
            >
              {user.status?.is_banned ? <UserCheck size={16} /> : <Ban size={16} />}
            </button>
          )}
        </div>
      )
    }
  ]

  const FilterDropdown = ({ label, value, options, onChange }) => (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-dark-200 text-white text-sm rounded-lg pl-3 pr-8 py-2 border border-dark-300 focus:border-primary focus:outline-none cursor-pointer"
      >
        <option value="">{label}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-gray-400 mt-1">View and manage all platform users</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {/* Export users */}}
              className="px-4 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-300 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Export
            </button>
            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
            <p className="text-xs text-gray-500 uppercase">Total Users</p>
            <p className="text-2xl font-bold text-white mt-1">{pagination.total}</p>
          </div>
          <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
            <p className="text-xs text-gray-500 uppercase">Active</p>
            <p className="text-2xl font-bold text-green-500 mt-1">
              {users.filter(u => !u.status?.is_banned && !u.status?.is_frozen).length}
            </p>
          </div>
          <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
            <p className="text-xs text-gray-500 uppercase">Banned</p>
            <p className="text-2xl font-bold text-red-500 mt-1">
              {users.filter(u => u.status?.is_banned).length}
            </p>
          </div>
          <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
            <p className="text-xs text-gray-500 uppercase">With Challenges</p>
            <p className="text-2xl font-bold text-purple-500 mt-1">
              {users.filter(u => u.challenges_count > 0).length}
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 bg-dark-200 rounded-lg flex-1 min-w-[200px] max-w-md">
              <Search size={18} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent text-white placeholder-gray-500 outline-none flex-1"
              />
            </div>

            {/* Filter Dropdowns */}
            <FilterDropdown
              label="All Roles"
              value={filters.role}
              options={[
                { value: 'user', label: 'User' },
                { value: 'admin', label: 'Admin' },
                { value: 'superadmin', label: 'SuperAdmin' }
              ]}
              onChange={(v) => handleFilterChange('role', v)}
            />

            <FilterDropdown
              label="All Status"
              value={filters.status}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'banned', label: 'Banned' },
                { value: 'frozen', label: 'Frozen' }
              ]}
              onChange={(v) => handleFilterChange('status', v)}
            />

            <FilterDropdown
              label="Email Status"
              value={filters.kyc_status}
              options={[
                { value: 'verified', label: 'Verified' },
                { value: 'unverified', label: 'Unverified' }
              ]}
              onChange={(v) => handleFilterChange('kyc_status', v)}
            />

            <FilterDropdown
              label="Challenges"
              value={filters.has_challenge}
              options={[
                { value: 'yes', label: 'Has Challenge' },
                { value: 'no', label: 'No Challenge' }
              ]}
              onChange={(v) => handleFilterChange('has_challenge', v)}
            />

            {/* Clear Filters */}
            {Object.values(filters).some(v => v !== '' && v !== 'created_at' && v !== 'desc') && (
              <button
                onClick={() => setFilters({
                  search: '',
                  role: '',
                  status: '',
                  kyc_status: '',
                  has_challenge: '',
                  sort_by: 'created_at',
                  sort_order: 'desc'
                })}
                className="text-sm text-primary hover:text-primary-dark"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Selected Users Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dark-200 flex items-center justify-between">
              <span className="text-sm text-gray-400">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-sm hover:bg-red-500/20 transition-colors">
                  Ban Selected
                </button>
                <button className="px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-sm hover:bg-blue-500/20 transition-colors">
                  Send Notification
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <DataTable
          data={users}
          columns={columns}
          loading={loading}
          pagination={{
            page: pagination.page,
            totalPages: pagination.totalPages,
            total: pagination.total,
            perPage: pagination.perPage
          }}
          onPageChange={handlePageChange}
          onSort={handleSort}
          sortColumn={filters.sort_by}
          sortDirection={filters.sort_order}
          selectable
          selectedRows={selectedUsers}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          emptyMessage="No users found matching your criteria"
        />
      </div>
    </AdminLayout>
  )
}

export default UsersListPage
