import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { AdminLayout } from '../../../components/admin'
import {
  Shield, Users, Search, RefreshCw, Plus, Check, X, ChevronDown, ChevronRight,
  Settings, Key, UserCog, Lock, Unlock, Edit2, Trash2, Eye, Save
} from 'lucide-react'
import { adminPermissionsAPI } from '../../../services/adminApi'

// Permission category icons
const categoryIcons = {
  users: Users,
  challenges: Settings,
  financial: Key,
  support: UserCog,
  content: Edit2,
  platform: Settings,
  superadmin: Shield
}

// Permission category colors
const categoryColors = {
  users: 'blue',
  challenges: 'green',
  financial: 'yellow',
  support: 'purple',
  content: 'pink',
  platform: 'indigo',
  superadmin: 'red'
}

const PermissionsManagementPage = () => {
  const [admins, setAdmins] = useState([])
  const [roles, setRoles] = useState([])
  const [categories, setCategories] = useState({})
  const [allPermissions, setAllPermissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState({})
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('admins') // 'admins' or 'roles'

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [adminsRes, rolesRes, categoriesRes] = await Promise.all([
        adminPermissionsAPI.getAdmins(),
        adminPermissionsAPI.getRoles(),
        adminPermissionsAPI.getCategories()
      ])

      setAdmins(adminsRes.data.admins || [])
      setRoles(rolesRes.data.roles || [])
      setCategories(categoriesRes.data.categories || {})
      setAllPermissions(categoriesRes.data.all_permissions || {})
    } catch (error) {
      console.error('Error loading permissions data:', error)
      // Mock data for development
      setAdmins([
        {
          user: { id: 1, username: 'admin', email: 'admin@tradesense.com', role: 'superadmin' },
          permissions: ['view_users', 'edit_users', 'ban_users', 'delete_users', 'view_challenges', 'edit_challenges'],
          permissions_count: 29,
          roles: [{ id: 5, name: 'superadmin', display_name: 'Super Administrator', level: 10 }]
        },
        {
          user: { id: 9, username: 'test_admin', email: 'testadmin@tradesense.com', role: 'admin' },
          permissions: ['view_users', 'edit_users', 'view_challenges', 'view_payments', 'view_tickets', 'respond_tickets'],
          permissions_count: 10,
          roles: [{ id: 4, name: 'admin', display_name: 'Administrator', level: 5 }]
        }
      ])
      setRoles([
        { id: 1, name: 'support_agent', display_name: 'Support Agent', level: 1, is_system: true, permissions: ['view_users', 'view_tickets', 'respond_tickets', 'close_tickets'] },
        { id: 2, name: 'content_manager', display_name: 'Content Manager', level: 1, is_system: true, permissions: ['manage_blog', 'manage_webinars', 'manage_resources'] },
        { id: 3, name: 'financial_admin', display_name: 'Financial Administrator', level: 2, is_system: true, permissions: ['view_payments', 'process_refunds', 'view_payouts', 'approve_payouts', 'process_payouts'] },
        { id: 4, name: 'admin', display_name: 'Administrator', level: 5, is_system: true, permissions: ['view_users', 'edit_users', 'view_challenges', 'edit_challenges', 'view_payments', 'view_payouts', 'view_tickets', 'respond_tickets', 'close_tickets', 'view_analytics'] },
        { id: 5, name: 'superadmin', display_name: 'Super Administrator', level: 10, is_system: true, permissions: [] }
      ])
      setCategories({
        users: { view_users: 'View user list and details', edit_users: 'Edit user profiles', ban_users: 'Ban/unban users', delete_users: 'Delete user accounts' },
        challenges: { view_challenges: 'View all challenges', edit_challenges: 'Modify challenge status', create_challenges: 'Create challenges for users', delete_challenges: 'Delete challenges' },
        financial: { view_payments: 'View payment history', process_refunds: 'Process refunds', view_payouts: 'View payout requests', approve_payouts: 'Approve/reject payouts', process_payouts: 'Mark payouts as processed' },
        support: { view_tickets: 'View support tickets', respond_tickets: 'Respond to tickets', close_tickets: 'Close/resolve tickets', assign_tickets: 'Assign tickets to staff' },
        content: { manage_blog: 'Create/edit blog posts', manage_webinars: 'Manage webinars', manage_resources: 'Manage educational resources' },
        platform: { view_analytics: 'View platform analytics', manage_offers: 'Create/edit promotional offers', manage_challenges_config: 'Configure challenge models', view_audit_logs: 'View audit logs' },
        superadmin: { manage_admins: 'Promote/demote admins', manage_permissions: 'Assign permissions to admins', platform_settings: 'Modify platform settings', maintenance_mode: 'Toggle maintenance mode', manage_api_keys: 'Manage API integrations' }
      })
      setAllPermissions({
        view_users: 'View user list and details', edit_users: 'Edit user profiles', ban_users: 'Ban/unban users', delete_users: 'Delete user accounts',
        view_challenges: 'View all challenges', edit_challenges: 'Modify challenge status', create_challenges: 'Create challenges for users', delete_challenges: 'Delete challenges',
        view_payments: 'View payment history', process_refunds: 'Process refunds', view_payouts: 'View payout requests', approve_payouts: 'Approve/reject payouts', process_payouts: 'Mark payouts as processed',
        view_tickets: 'View support tickets', respond_tickets: 'Respond to tickets', close_tickets: 'Close/resolve tickets', assign_tickets: 'Assign tickets to staff',
        manage_blog: 'Create/edit blog posts', manage_webinars: 'Manage webinars', manage_resources: 'Manage educational resources',
        view_analytics: 'View platform analytics', manage_offers: 'Create/edit promotional offers', manage_challenges_config: 'Configure challenge models', view_audit_logs: 'View audit logs',
        manage_admins: 'Promote/demote admins', manage_permissions: 'Assign permissions to admins', platform_settings: 'Modify platform settings', maintenance_mode: 'Toggle maintenance mode', manage_api_keys: 'Manage API integrations'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  // Grant permission to user
  const handleGrantPermission = async (userId, permission) => {
    try {
      await adminPermissionsAPI.grantPermission(userId, permission)
      toast.success(`Permission "${permission}" granted`)
      loadData()
    } catch (error) {
      toast.error('Failed to grant permission')
    }
  }

  // Revoke permission from user
  const handleRevokePermission = async (userId, permission) => {
    try {
      await adminPermissionsAPI.revokePermission(userId, permission)
      toast.success(`Permission "${permission}" revoked`)
      loadData()
    } catch (error) {
      toast.error('Failed to revoke permission')
    }
  }

  // Assign role to user
  const handleAssignRole = async (userId, roleId) => {
    try {
      await adminPermissionsAPI.assignRole(userId, roleId)
      toast.success('Role assigned')
      loadData()
    } catch (error) {
      toast.error('Failed to assign role')
    }
  }

  // Remove role from user
  const handleRemoveRole = async (userId, roleId) => {
    try {
      await adminPermissionsAPI.removeRole(userId, roleId)
      toast.success('Role removed')
      loadData()
    } catch (error) {
      toast.error('Failed to remove role')
    }
  }

  // Filter admins by search
  const filteredAdmins = admins.filter(admin =>
    admin.user.username.toLowerCase().includes(search.toLowerCase()) ||
    admin.user.email.toLowerCase().includes(search.toLowerCase())
  )

  // Get color class for category
  const getCategoryColor = (category) => {
    const color = categoryColors[category] || 'gray'
    return {
      bg: `bg-${color}-500/10`,
      text: `text-${color}-400`,
      border: `border-${color}-500/20`
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Shield className="w-7 h-7 text-primary" />
              Permissions Management
            </h1>
            <p className="text-gray-400 mt-1">Manage admin access and permissions</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-dark-200 text-gray-300 rounded-lg hover:bg-dark-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-200">
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'admins'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Admin Users
            </div>
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'roles'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Roles
            </div>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'admins' ? (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search admins..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-200 border border-dark-100 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Admin Cards */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-dark-200 rounded-xl p-6 animate-pulse">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-dark-100 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-dark-100 rounded w-1/3 mb-2" />
                        <div className="h-3 bg-dark-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-20 bg-dark-100 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredAdmins.map(admin => (
                  <AdminPermissionCard
                    key={admin.user.id}
                    admin={admin}
                    categories={categories}
                    allPermissions={allPermissions}
                    roles={roles}
                    onGrantPermission={handleGrantPermission}
                    onRevokePermission={handleRevokePermission}
                    onAssignRole={handleAssignRole}
                    onRemoveRole={handleRemoveRole}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Roles List */}
            <div className="grid gap-4">
              {roles.map(role => (
                <RoleCard
                  key={role.id}
                  role={role}
                  categories={categories}
                  allPermissions={allPermissions}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

// Admin Permission Card Component
const AdminPermissionCard = ({
  admin,
  categories,
  allPermissions,
  roles,
  onGrantPermission,
  onRevokePermission,
  onAssignRole,
  onRemoveRole
}) => {
  const [expanded, setExpanded] = useState(false)
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const isSuperAdmin = admin.user.role === 'superadmin'

  const hasPermission = (perm) => {
    if (isSuperAdmin) return true
    return admin.permissions?.includes(perm)
  }

  const getRoleBadgeColor = (level) => {
    if (level >= 10) return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    if (level >= 5) return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    if (level >= 2) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  return (
    <div className="bg-dark-200 rounded-xl border border-dark-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-dark-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">
                {admin.user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                {admin.user.username}
                {isSuperAdmin && (
                  <Shield className="w-4 h-4 text-purple-400" />
                )}
              </h3>
              <p className="text-sm text-gray-500">{admin.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              isSuperAdmin
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {admin.user.role}
            </span>
            <span className="text-sm text-gray-500">
              {admin.permissions_count} permissions
            </span>
          </div>
        </div>

        {/* Assigned Roles */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Roles:</span>
          {admin.roles?.map(role => (
            <span
              key={role.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor(role.level)}`}
            >
              {role.display_name}
              {!isSuperAdmin && (
                <button
                  onClick={() => onRemoveRole(admin.user.id, role.id)}
                  className="hover:text-red-400 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
          {!isSuperAdmin && (
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-dark-100 text-gray-400 hover:text-white hover:bg-dark-300"
              >
                <Plus className="w-3 h-3" />
                Add Role
              </button>
              {showRoleDropdown && (
                <div className="absolute z-10 mt-1 w-48 bg-dark-300 border border-dark-100 rounded-lg shadow-lg">
                  {roles.filter(r => !admin.roles?.find(ar => ar.id === r.id)).map(role => (
                    <button
                      key={role.id}
                      onClick={() => {
                        onAssignRole(admin.user.id, role.id)
                        setShowRoleDropdown(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-200 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {role.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-400 hover:bg-dark-300 transition-colors"
      >
        <span>{expanded ? 'Hide permissions' : 'Show permissions'}</span>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Permissions Grid */}
      {expanded && (
        <div className="p-4 space-y-4 border-t border-dark-100 max-h-96 overflow-y-auto">
          {Object.entries(categories).map(([category, permissions]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                {categoryIcons[category] && (() => {
                  const Icon = categoryIcons[category]
                  return <Icon className="w-3 h-3" />
                })()}
                {category}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(permissions).map(([perm, desc]) => {
                  const has = hasPermission(perm)
                  return (
                    <div
                      key={perm}
                      className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                        has
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-dark-300 border border-dark-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {has ? (
                          <Check className="w-4 h-4 text-green-400 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-600 shrink-0" />
                        )}
                        <span className={`truncate ${has ? 'text-green-400' : 'text-gray-500'}`} title={desc}>
                          {perm}
                        </span>
                      </div>
                      {!isSuperAdmin && (
                        <button
                          onClick={() => has
                            ? onRevokePermission(admin.user.id, perm)
                            : onGrantPermission(admin.user.id, perm)
                          }
                          className={`shrink-0 ml-2 p-1 rounded ${
                            has
                              ? 'text-red-400 hover:bg-red-500/20'
                              : 'text-green-400 hover:bg-green-500/20'
                          }`}
                          title={has ? 'Revoke' : 'Grant'}
                        >
                          {has ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Role Card Component
const RoleCard = ({ role, categories, allPermissions }) => {
  const [expanded, setExpanded] = useState(false)

  const getRoleBadgeColor = (level) => {
    if (level >= 10) return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    if (level >= 5) return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    if (level >= 2) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  return (
    <div className="bg-dark-200 rounded-xl border border-dark-100 overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoleBadgeColor(role.level)}`}>
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                {role.display_name}
                {role.is_system && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-500/20 text-gray-400 rounded">System</span>
                )}
              </h3>
              <p className="text-sm text-gray-500">{role.description || `Level ${role.level} role`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {role.name === 'superadmin' ? 'All' : role.permissions?.length || 0} permissions
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${getRoleBadgeColor(role.level)}`}>
              Level {role.level}
            </span>
          </div>
        </div>
      </div>

      {/* Expand/Collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-400 hover:bg-dark-300 transition-colors border-t border-dark-100"
      >
        <span>{expanded ? 'Hide permissions' : 'View permissions'}</span>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Permissions */}
      {expanded && (
        <div className="p-4 border-t border-dark-100 bg-dark-300/50">
          {role.name === 'superadmin' ? (
            <p className="text-center text-gray-400 py-4">
              Super Administrator has all permissions
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {role.permissions?.map(perm => (
                <span
                  key={perm}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/20"
                  title={allPermissions[perm]}
                >
                  <Check className="w-3 h-3" />
                  {perm}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PermissionsManagementPage
