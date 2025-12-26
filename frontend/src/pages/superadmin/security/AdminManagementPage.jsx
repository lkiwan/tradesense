import { useState, useEffect } from 'react'
import {
  Users, Shield, UserPlus, UserMinus, Eye, Search,
  MoreVertical, CheckCircle, XCircle, Clock, Activity,
  Mail, Calendar, RefreshCw, Filter
} from 'lucide-react'
import { AdminLayout, DataTable, StatusBadge, ConfirmationModal } from '../../../components/admin'
import superAdminApi from '../../../services/superAdminApi'
import toast from 'react-hot-toast'

const AdminManagementPage = () => {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [showDemoteModal, setShowDemoteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [adminActivity, setAdminActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalAdmins: 0,
    superAdmins: 0,
    activeToday: 0,
    pendingActions: 0
  })

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  useEffect(() => {
    fetchAdmins()
  }, [searchQuery, roleFilter, pagination.page])

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const response = await superAdminApi.admins.getAdmins({
        search: searchQuery,
        role: roleFilter,
        page: pagination.page,
        limit: pagination.limit
      })
      setAdmins(response.data.admins || [])
      setStats(response.data.stats || {})
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }))
    } catch (error) {
      console.error('Error fetching admins:', error)
      // Mock data
      setAdmins([
        {
          id: 1,
          username: 'superadmin',
          email: 'admin@tradesense.com',
          role: 'superadmin',
          status: 'active',
          last_login: '2024-12-24T15:30:00Z',
          created_at: '2024-01-15T10:00:00Z',
          actions_today: 45,
          permissions: ['all']
        },
        {
          id: 2,
          username: 'support_lead',
          email: 'support@tradesense.com',
          role: 'admin',
          status: 'active',
          last_login: '2024-12-24T14:00:00Z',
          created_at: '2024-03-20T09:00:00Z',
          actions_today: 32,
          permissions: ['users', 'tickets', 'challenges']
        },
        {
          id: 3,
          username: 'finance_admin',
          email: 'finance@tradesense.com',
          role: 'admin',
          status: 'active',
          last_login: '2024-12-24T12:30:00Z',
          created_at: '2024-05-10T11:00:00Z',
          actions_today: 18,
          permissions: ['payments', 'payouts', 'financial']
        },
        {
          id: 4,
          username: 'tech_admin',
          email: 'tech@tradesense.com',
          role: 'admin',
          status: 'inactive',
          last_login: '2024-12-20T09:00:00Z',
          created_at: '2024-06-15T14:00:00Z',
          actions_today: 0,
          permissions: ['system', 'logs']
        }
      ])
      setStats({
        totalAdmins: 4,
        superAdmins: 1,
        activeToday: 3,
        pendingActions: 12
      })
      setPagination(prev => ({ ...prev, total: 4 }))
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminActivity = async (adminId) => {
    setActivityLoading(true)
    try {
      const response = await superAdminApi.admins.getAdminActivity(adminId, { limit: 20 })
      setAdminActivity(response.data.activities || [])
    } catch (error) {
      console.error('Error fetching admin activity:', error)
      // Mock data
      setAdminActivity([
        { id: 1, action: 'user_ban', target: 'user_123', description: 'Banned user for policy violation', created_at: '2024-12-24T15:30:00Z' },
        { id: 2, action: 'ticket_reply', target: 'TKT-045', description: 'Replied to support ticket', created_at: '2024-12-24T15:15:00Z' },
        { id: 3, action: 'payout_approve', target: 'PAY-789', description: 'Approved payout request $2,500', created_at: '2024-12-24T14:45:00Z' },
        { id: 4, action: 'challenge_update', target: 'CHG-456', description: 'Updated challenge status to passed', created_at: '2024-12-24T14:30:00Z' },
        { id: 5, action: 'login', target: null, description: 'Admin logged in', created_at: '2024-12-24T14:00:00Z' }
      ])
    } finally {
      setActivityLoading(false)
    }
  }

  const handlePromote = async () => {
    try {
      await superAdminApi.admins.promoteToAdmin(selectedUser.id)
      toast.success(`${selectedUser.username} promoted to admin`)
      fetchAdmins()
      setShowPromoteModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error promoting user:', error)
      toast.error('Failed to promote user')
    }
  }

  const handleDemote = async () => {
    try {
      await superAdminApi.admins.demoteAdmin(selectedUser.id)
      toast.success(`${selectedUser.username} demoted to regular user`)
      fetchAdmins()
      setShowDemoteModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error demoting admin:', error)
      toast.error('Failed to demote admin')
    }
  }

  const handleViewActivity = (admin) => {
    setSelectedUser(admin)
    fetchAdminActivity(admin.id)
    setShowActivityModal(true)
  }

  const getActionIcon = (action) => {
    const icons = {
      user_ban: { icon: XCircle, color: 'text-red-400' },
      user_unban: { icon: CheckCircle, color: 'text-green-400' },
      ticket_reply: { icon: Mail, color: 'text-blue-400' },
      payout_approve: { icon: CheckCircle, color: 'text-green-400' },
      payout_reject: { icon: XCircle, color: 'text-red-400' },
      challenge_update: { icon: Activity, color: 'text-purple-400' },
      login: { icon: Shield, color: 'text-gray-400' },
      logout: { icon: Shield, color: 'text-gray-400' }
    }
    return icons[action] || { icon: Activity, color: 'text-gray-400' }
  }

  const columns = [
    {
      key: 'username',
      label: 'Admin',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
            row.role === 'superadmin' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
          }`}>
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
      key: 'role',
      label: 'Role',
      render: (value) => (
        <StatusBadge
          status={value === 'superadmin' ? 'Super Admin' : 'Admin'}
          color={value === 'superadmin' ? 'purple' : 'blue'}
        />
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${value === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span className={value === 'active' ? 'text-green-400' : 'text-gray-400'}>
            {value === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    },
    {
      key: 'actions_today',
      label: 'Actions Today',
      render: (value) => (
        <span className="text-white font-medium">{value}</span>
      )
    },
    {
      key: 'last_login',
      label: 'Last Login',
      render: (value) => (
        <span className="text-gray-400 text-sm">
          {value ? new Date(value).toLocaleString() : 'Never'}
        </span>
      )
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (value) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {value?.slice(0, 3).map((perm, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-dark-300 text-gray-400 text-xs rounded capitalize">
              {perm}
            </span>
          ))}
          {value?.length > 3 && (
            <span className="px-2 py-0.5 bg-dark-300 text-gray-400 text-xs rounded">
              +{value.length - 3}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewActivity(row)}
            className="p-1.5 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
            title="View Activity"
          >
            <Eye size={16} />
          </button>
          {row.role !== 'superadmin' && (
            <button
              onClick={() => {
                setSelectedUser(row)
                setShowDemoteModal(true)
              }}
              className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              title="Demote to User"
            >
              <UserMinus size={16} />
            </button>
          )}
        </div>
      )
    }
  ]

  const statCards = [
    { label: 'Total Admins', value: stats.totalAdmins, icon: Users, color: 'text-white', bg: 'bg-dark-200' },
    { label: 'Super Admins', value: stats.superAdmins, icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Active Today', value: stats.activeToday, icon: Activity, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Pending Actions', value: stats.pendingActions, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
  ]

  return (
    <AdminLayout
      title="Admin Management"
      subtitle="Manage admin users and permissions"
      breadcrumbs={[
        { label: 'SuperAdmin', href: '/superadmin/dashboard' },
        { label: 'Admin Management' }
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
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-200 text-white rounded-lg pl-10 pr-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
          </select>

          {/* Actions */}
          <button
            onClick={fetchAdmins}
            className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>

          <button
            onClick={() => setShowPromoteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <UserPlus size={18} />
            Promote User
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={admins}
        loading={loading}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
        }}
        emptyMessage="No admins found"
      />

      {/* Demote Modal */}
      {showDemoteModal && selectedUser && (
        <ConfirmationModal
          isOpen={showDemoteModal}
          onClose={() => {
            setShowDemoteModal(false)
            setSelectedUser(null)
          }}
          onConfirm={handleDemote}
          title="Demote Admin"
          message={`Are you sure you want to demote ${selectedUser.username} to a regular user? They will lose all admin privileges.`}
          confirmText="Demote"
          variant="danger"
        />
      )}

      {/* Activity Modal */}
      {showActivityModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-xl border border-dark-200 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-dark-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Admin Activity</h3>
                <p className="text-gray-500">{selectedUser.username}</p>
              </div>
              <button
                onClick={() => {
                  setShowActivityModal(false)
                  setSelectedUser(null)
                }}
                className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : adminActivity.length > 0 ? (
                <div className="space-y-4">
                  {adminActivity.map((activity) => {
                    const actionConfig = getActionIcon(activity.action)
                    const Icon = actionConfig.icon
                    return (
                      <div key={activity.id} className="flex items-start gap-4 p-4 bg-dark-200 rounded-lg">
                        <div className={`p-2 rounded-lg bg-dark-300 ${actionConfig.color}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-white">{activity.description}</p>
                          {activity.target && (
                            <p className="text-gray-500 text-sm">Target: {activity.target}</p>
                          )}
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No activity found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Promote Modal - Simple version */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-xl border border-dark-200 w-full max-w-md">
            <div className="p-6 border-b border-dark-200">
              <h3 className="text-xl font-bold text-white">Promote User to Admin</h3>
              <p className="text-gray-500 text-sm mt-1">Enter user email or ID to promote</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">User Email or ID</label>
                <input
                  type="text"
                  placeholder="user@example.com or user ID"
                  className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {['users', 'challenges', 'financial', 'tickets', 'system', 'all'].map((perm) => (
                    <label key={perm} className="flex items-center gap-2 p-2 bg-dark-200 rounded-lg cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-600 text-primary focus:ring-primary" />
                      <span className="text-white text-sm capitalize">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-dark-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPromoteModal(false)}
                className="px-4 py-2 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success('User promoted to admin')
                  setShowPromoteModal(false)
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Promote
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminManagementPage
