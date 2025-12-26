import { useState, useEffect } from 'react'
import {
  User, Search, Key, AtSign, Shield, UserX, UserCheck,
  Clock, AlertTriangle, CheckCircle, XCircle, Edit3,
  Lock, Unlock, CreditCard, Eye, EyeOff, RefreshCw
} from 'lucide-react'
import { AdminLayout, DataTable, StatusBadge, ConfirmationModal } from '../../../components/admin'
import superAdminApi from '../../../services/superAdminApi'
import toast from 'react-hot-toast'

const UserControlPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  // Form states
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newEmail, setNewEmail] = useState('')

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term')
      return
    }

    setLoading(true)
    try {
      const response = await superAdminApi.users.searchUsers(searchQuery)
      setSearchResults(response.data.users || [])
      if (response.data.users?.length === 0) {
        toast.info('No users found matching your search')
      }
    } catch (error) {
      console.error('Error searching users:', error)
      // Mock data for development
      setSearchResults([
        { id: 1, username: 'trader_pro', email: 'trader@example.com', status: 'active', role: 'user', created_at: '2024-12-20T10:00:00Z', last_login: '2024-12-24T08:30:00Z', has_2fa: true, email_verified: true },
        { id: 2, username: 'fx_master', email: 'fx@example.com', status: 'active', role: 'user', created_at: '2024-12-19T09:00:00Z', last_login: '2024-12-23T14:20:00Z', has_2fa: false, email_verified: true },
        { id: 3, username: 'crypto_king', email: 'crypto@example.com', status: 'banned', role: 'user', created_at: '2024-12-18T08:00:00Z', last_login: '2024-12-15T11:00:00Z', has_2fa: true, email_verified: false }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchUsers()
    }
  }

  const handleSelectUser = async (user) => {
    setSelectedUser(user)
    // Fetch detailed user info if needed
    try {
      const response = await superAdminApi.users.getUserDetails(user.id)
      setSelectedUser(response.data || user)
    } catch (error) {
      console.error('Error fetching user details:', error)
      // Use existing user data
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setActionLoading(true)
    try {
      await superAdminApi.users.changePassword(selectedUser.id, newPassword)
      toast.success(`Password changed for ${selectedUser.username}`)
      setShowPasswordModal(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to change password')
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangeUsername = async () => {
    if (!newUsername.trim()) {
      toast.error('Username cannot be empty')
      return
    }
    if (newUsername.length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }

    setActionLoading(true)
    try {
      await superAdminApi.users.changeUsername(selectedUser.id, newUsername)
      toast.success(`Username changed to ${newUsername}`)
      setSelectedUser(prev => ({ ...prev, username: newUsername }))
      setSearchResults(prev => prev.map(u =>
        u.id === selectedUser.id ? { ...u, username: newUsername } : u
      ))
      setShowUsernameModal(false)
      setNewUsername('')
    } catch (error) {
      console.error('Error changing username:', error)
      toast.error('Failed to change username')
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setActionLoading(true)
    try {
      await superAdminApi.users.changeEmail(selectedUser.id, newEmail)
      toast.success(`Email changed to ${newEmail}`)
      setSelectedUser(prev => ({ ...prev, email: newEmail }))
      setSearchResults(prev => prev.map(u =>
        u.id === selectedUser.id ? { ...u, email: newEmail } : u
      ))
      setShowEmailModal(false)
      setNewEmail('')
    } catch (error) {
      console.error('Error changing email:', error)
      toast.error('Failed to change email')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUserAction = (action) => {
    setPendingAction(action)
    setShowConfirmModal(true)
  }

  const executeAction = async () => {
    if (!pendingAction || !selectedUser) return

    setActionLoading(true)
    try {
      switch (pendingAction.type) {
        case 'reset_2fa':
          await superAdminApi.users.reset2FA(selectedUser.id)
          toast.success('2FA has been reset')
          setSelectedUser(prev => ({ ...prev, has_2fa: false }))
          break
        case 'verify_email':
          await superAdminApi.users.verifyEmail(selectedUser.id)
          toast.success('Email has been verified')
          setSelectedUser(prev => ({ ...prev, email_verified: true }))
          break
        case 'revoke_sessions':
          await superAdminApi.users.revokeSessions(selectedUser.id)
          toast.success('All sessions have been revoked')
          break
        case 'unlock_account':
          await superAdminApi.users.unlockAccount(selectedUser.id)
          toast.success('Account has been unlocked')
          setSelectedUser(prev => ({ ...prev, status: 'active' }))
          break
        case 'reset_failed_logins':
          await superAdminApi.users.resetFailedLogins(selectedUser.id)
          toast.success('Failed login attempts have been reset')
          break
        default:
          toast.error('Unknown action')
      }
    } catch (error) {
      console.error('Error executing action:', error)
      toast.error(`Failed to ${pendingAction.label.toLowerCase()}`)
    } finally {
      setActionLoading(false)
      setShowConfirmModal(false)
      setPendingAction(null)
    }
  }

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

  const controlActions = [
    { type: 'reset_2fa', label: 'Reset 2FA', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/20', description: 'Remove two-factor authentication' },
    { type: 'verify_email', label: 'Verify Email', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', description: 'Mark email as verified' },
    { type: 'revoke_sessions', label: 'Revoke Sessions', icon: UserX, color: 'text-red-400', bg: 'bg-red-500/20', description: 'Log out from all devices' },
    { type: 'unlock_account', label: 'Unlock Account', icon: Unlock, color: 'text-blue-400', bg: 'bg-blue-500/20', description: 'Unlock locked account' },
    { type: 'reset_failed_logins', label: 'Reset Failed Logins', icon: RefreshCw, color: 'text-yellow-400', bg: 'bg-yellow-500/20', description: 'Clear failed login attempts' }
  ]

  return (
    <AdminLayout
      title="User Control"
      subtitle="Manage user credentials and account settings"
      breadcrumbs={[
        { label: 'SuperAdmin', href: '/superadmin/dashboard' },
        { label: 'User Control' }
      ]}
    >
      {/* Search Section */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 mb-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Search size={20} className="text-primary" />
          Find User
        </h3>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by username, email, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-dark-200 text-white rounded-lg pl-10 pr-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
            />
          </div>
          <button
            onClick={searchUsers}
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
            Search
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Results */}
        <div className="lg:col-span-1">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
            <h3 className="text-white font-semibold mb-4">Search Results</h3>
            {searchResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Search for a user to get started
              </p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full p-3 rounded-lg border transition-colors text-left ${
                      selectedUser?.id === user.id
                        ? 'bg-primary/20 border-primary'
                        : 'bg-dark-200 border-dark-300 hover:border-dark-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold">
                        {user.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{user.username}</p>
                        <p className="text-gray-500 text-sm truncate">{user.email}</p>
                      </div>
                      <StatusBadge
                        status={getStatusConfig(user.status).label}
                        color={getStatusConfig(user.status).color}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Details & Actions */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="space-y-6">
              {/* User Info Card */}
              <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                      {selectedUser.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedUser.username}</h2>
                      <p className="text-gray-400">{selectedUser.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge
                          status={getStatusConfig(selectedUser.status).label}
                          color={getStatusConfig(selectedUser.status).color}
                        />
                        <span className="text-gray-500 text-sm">ID: {selectedUser.id}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-dark-200 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Role</p>
                    <p className="text-white font-medium capitalize">{selectedUser.role}</p>
                  </div>
                  <div className="bg-dark-200 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">2FA Status</p>
                    <p className={`font-medium ${selectedUser.has_2fa ? 'text-green-400' : 'text-yellow-400'}`}>
                      {selectedUser.has_2fa ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div className="bg-dark-200 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Email Verified</p>
                    <p className={`font-medium ${selectedUser.email_verified ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedUser.email_verified ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="bg-dark-200 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">Last Login</p>
                    <p className="text-white font-medium text-sm">
                      {selectedUser.last_login
                        ? new Date(selectedUser.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>

                {/* Credential Actions */}
                <h4 className="text-white font-medium mb-3">Change Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  <button
                    onClick={() => {
                      setNewPassword('')
                      setConfirmPassword('')
                      setShowPasswordModal(true)
                    }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-dark-200 border border-dark-300 hover:border-primary transition-colors"
                  >
                    <Key size={18} className="text-yellow-400" />
                    <span className="text-white">Change Password</span>
                  </button>
                  <button
                    onClick={() => {
                      setNewUsername(selectedUser.username)
                      setShowUsernameModal(true)
                    }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-dark-200 border border-dark-300 hover:border-primary transition-colors"
                  >
                    <AtSign size={18} className="text-blue-400" />
                    <span className="text-white">Change Username</span>
                  </button>
                  <button
                    onClick={() => {
                      setNewEmail(selectedUser.email)
                      setShowEmailModal(true)
                    }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-dark-200 border border-dark-300 hover:border-primary transition-colors"
                  >
                    <Edit3 size={18} className="text-purple-400" />
                    <span className="text-white">Change Email</span>
                  </button>
                </div>

                {/* Account Actions */}
                <h4 className="text-white font-medium mb-3">Account Actions</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {controlActions.map((action) => (
                    <button
                      key={action.type}
                      onClick={() => handleUserAction(action)}
                      className={`flex items-center gap-2 p-3 rounded-lg border border-dark-300 transition-colors ${action.bg} hover:border-dark-200`}
                    >
                      <action.icon size={18} className={action.color} />
                      <span className={`text-sm ${action.color}`}>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Log Preview */}
              <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  Recent Activity
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-dark-200 rounded-lg">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-gray-400 text-sm flex-1">Login from 192.168.1.1</span>
                    <span className="text-gray-500 text-xs">2 hours ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-dark-200 rounded-lg">
                    <CreditCard size={16} className="text-blue-400" />
                    <span className="text-gray-400 text-sm flex-1">Started new challenge</span>
                    <span className="text-gray-500 text-xs">1 day ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-dark-200 rounded-lg">
                    <Key size={16} className="text-yellow-400" />
                    <span className="text-gray-400 text-sm flex-1">Password changed</span>
                    <span className="text-gray-500 text-xs">3 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-12 text-center">
              <User size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No User Selected</h3>
              <p className="text-gray-500">
                Search for a user and select them to view details and manage their account
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Key size={20} className="text-yellow-400" />
              Change Password
            </h3>
            <p className="text-gray-400 mb-4">
              Set a new password for <span className="text-white font-medium">{selectedUser?.username}</span>
            </p>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 pr-12 border border-dark-300 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
              />
              {newPassword && newPassword.length < 8 && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle size={14} />
                  Password must be at least 8 characters
                </p>
              )}
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <XCircle size={14} />
                  Passwords do not match
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={actionLoading || !newPassword || newPassword !== confirmPassword || newPassword.length < 8}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AtSign size={20} className="text-blue-400" />
              Change Username
            </h3>
            <p className="text-gray-400 mb-4">
              Current username: <span className="text-white font-medium">{selectedUser?.username}</span>
            </p>
            <input
              type="text"
              placeholder="New username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none mb-4"
            />
            {newUsername && newUsername.length < 3 && (
              <p className="text-red-400 text-sm flex items-center gap-1 mb-4">
                <AlertTriangle size={14} />
                Username must be at least 3 characters
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowUsernameModal(false)}
                className="flex-1 px-4 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeUsername}
                disabled={actionLoading || !newUsername || newUsername.length < 3}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Changing...' : 'Change Username'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Edit3 size={20} className="text-purple-400" />
              Change Email
            </h3>
            <p className="text-gray-400 mb-4">
              Current email: <span className="text-white font-medium">{selectedUser?.email}</span>
            </p>
            <input
              type="email"
              placeholder="New email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeEmail}
                disabled={actionLoading || !newEmail || !newEmail.includes('@')}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Changing...' : 'Change Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && pendingAction && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false)
            setPendingAction(null)
          }}
          onConfirm={executeAction}
          title={`Confirm ${pendingAction.label}`}
          message={`Are you sure you want to ${pendingAction.label.toLowerCase()} for ${selectedUser?.username}? ${pendingAction.description}`}
          confirmText={actionLoading ? 'Processing...' : pendingAction.label}
          variant="warning"
        />
      )}
    </AdminLayout>
  )
}

export default UserControlPage
