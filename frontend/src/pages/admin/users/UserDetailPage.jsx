import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { AdminLayout, StatusBadge } from '../../../components/admin'
import UserEditModal from '../../../components/admin/modals/UserEditModal'
import UserBanModal from '../../../components/admin/modals/UserBanModal'
import FreezeUserModal from '../../../components/admin/modals/FreezeUserModal'
import {
  ArrowLeft, User, Mail, Calendar, Shield, Edit, Ban, UserCheck,
  Snowflake, Key, Trophy, CreditCard, Activity, Clock, MapPin,
  Smartphone, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  ShieldCheck, KeyRound, Gift, Unlock
} from 'lucide-react'
import { adminUsersAPI } from '../../../services/adminApi'
import { userControlAPI } from '../../../services/superAdminApi'
import { useAuth } from '../../../context/AuthContext'

const UserDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user: currentUser } = useAuth()
  const isSuperAdmin = currentUser?.role === 'superadmin'

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Modal states
  const [showEditModal, setShowEditModal] = useState(searchParams.get('edit') === 'true')
  const [showBanModal, setShowBanModal] = useState(false)
  const [showFreezeModal, setShowFreezeModal] = useState(false)

  useEffect(() => {
    loadUser()
  }, [id])

  const loadUser = async () => {
    setLoading(true)
    try {
      const response = await adminUsersAPI.getUser(id)
      // Handle both nested {user: {...}} and flat {...} response formats
      const userData = response.data.user || response.data
      // Merge user data with challenges/payments/sessions if they exist at top level
      setUser({
        ...userData,
        challenges: response.data.challenges || userData.challenges || [],
        payments: response.data.payments || userData.payments || [],
        sessions: response.data.sessions || userData.sessions || []
      })
    } catch (error) {
      console.error('Error loading user:', error)
      // Mock data
      setUser({
        id: parseInt(id),
        username: 'TestTrader',
        email: 'testtrader@tradesense.com',
        role: 'user',
        email_verified: true,
        email_verified_at: '2025-12-23T20:38:42',
        preferred_language: 'en',
        created_at: '2025-12-23T20:18:27',
        referral_code: 'T615ZXXP',
        status: {
          is_banned: false,
          is_frozen: false,
          can_trade: true,
          last_activity_at: '2025-12-24T15:30:00',
          total_logins: 12
        },
        challenges: [
          {
            id: 3,
            model_name: 'Stellar 1-Step',
            account_size: 50000,
            status: 'active',
            phase: 'funded',
            current_balance: 52500,
            profit_percentage: 5.0,
            created_at: '2025-11-23T20:18:45'
          }
        ],
        payments: [
          {
            id: 1,
            amount: 299,
            currency: 'MAD',
            status: 'completed',
            method: 'paypal',
            created_at: '2025-11-23T20:15:00'
          }
        ],
        sessions: [
          {
            id: 1,
            device: 'Chrome on Windows',
            ip_address: '192.168.1.100',
            country: 'Morocco',
            is_current: true,
            created_at: '2025-12-24T10:00:00'
          }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async (data) => {
    try {
      await adminUsersAPI.banUser(user.id, data)
      toast.success('User banned successfully')
      setShowBanModal(false)
      loadUser()
    } catch (error) {
      toast.error('Failed to ban user')
    }
  }

  const handleUnbanUser = async () => {
    try {
      await adminUsersAPI.unbanUser(user.id)
      toast.success('User unbanned successfully')
      loadUser()
    } catch (error) {
      toast.error('Failed to unban user')
    }
  }

  const handleFreezeUser = async (data) => {
    try {
      await userControlAPI.freezeUser(user.id, data.hours, data.reason)
      toast.success('User frozen successfully')
      setShowFreezeModal(false)
      loadUser()
    } catch (error) {
      toast.error('Failed to freeze user')
    }
  }

  const handleUnfreezeUser = async () => {
    try {
      await userControlAPI.unfreezeUser(user.id)
      toast.success('User unfrozen successfully')
      loadUser()
    } catch (error) {
      toast.error('Failed to unfreeze user')
    }
  }

  const handleUpdateUser = async (data) => {
    try {
      await adminUsersAPI.updateUser(user.id, data)
      toast.success('User updated successfully')
      setShowEditModal(false)
      loadUser()
    } catch (error) {
      toast.error('Failed to update user')
    }
  }

  const handleVerifyEmail = async () => {
    try {
      await adminUsersAPI.verifyEmail(user.id)
      toast.success('Email verified successfully')
      loadUser()
    } catch (error) {
      toast.error('Failed to verify email')
    }
  }

  const handleReset2FA = async () => {
    if (!confirm('Are you sure you want to reset 2FA for this user? They will need to set it up again.')) {
      return
    }
    try {
      await adminUsersAPI.reset2FA(user.id)
      toast.success('2FA reset successfully')
      loadUser()
    } catch (error) {
      toast.error('Failed to reset 2FA')
    }
  }

  const handleUnlockAccount = async () => {
    try {
      await adminUsersAPI.unlockAccount(user.id)
      toast.success('Account unlocked successfully')
      loadUser()
    } catch (error) {
      toast.error('Failed to unlock account')
    }
  }

  const handleBlockTrading = async () => {
    const reason = prompt('Enter reason for blocking trading:')
    if (!reason) return
    try {
      await adminUsersAPI.blockTrading(user.id, reason)
      toast.success('Trading blocked successfully')
      loadUser()
    } catch (error) {
      toast.error('Failed to block trading')
    }
  }

  const handleUnblockTrading = async () => {
    try {
      await adminUsersAPI.unblockTrading(user.id)
      toast.success('Trading unblocked successfully')
      loadUser()
    } catch (error) {
      toast.error('Failed to unblock trading')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (value, currency = 'MAD') => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(value)
  }

  const getUserStatus = () => {
    if (user?.status?.is_banned) return 'banned'
    if (user?.status?.is_frozen) return 'frozen'
    return 'active'
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'superadmin': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'admin': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'sessions', label: 'Sessions', icon: Smartphone }
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">User not found</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Users</span>
        </button>

        {/* User Header */}
        <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-2xl font-bold">
                  {user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{user.username}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                  <StatusBadge status={getUserStatus()} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Mail size={14} />
                    {user.email}
                    {user.email_verified ? (
                      <CheckCircle size={14} className="text-green-500 ml-1" />
                    ) : (
                      <XCircle size={14} className="text-red-500 ml-1" />
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    Joined {formatDate(user.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-300 transition-colors flex items-center gap-2"
              >
                <Edit size={16} />
                Edit
              </button>

              {user.role !== 'superadmin' && (
                <>
                  {user.status?.is_banned ? (
                    <button
                      onClick={handleUnbanUser}
                      className="px-4 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors flex items-center gap-2"
                    >
                      <UserCheck size={16} />
                      Unban
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowBanModal(true)}
                      className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2"
                    >
                      <Ban size={16} />
                      Ban
                    </button>
                  )}

                  {isSuperAdmin && (
                    <>
                      {user.status?.is_frozen ? (
                        <button
                          onClick={handleUnfreezeUser}
                          className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                        >
                          <Snowflake size={16} />
                          Unfreeze
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowFreezeModal(true)}
                          className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                        >
                          <Snowflake size={16} />
                          Freeze
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Additional Actions Row */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-200">
              {/* Verify Email - show if not verified */}
              {!user.email_verified && (
                <button
                  onClick={handleVerifyEmail}
                  className="px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors flex items-center gap-2 text-sm"
                >
                  <ShieldCheck size={14} />
                  Verify Email
                </button>
              )}

              {/* Reset 2FA */}
              <button
                onClick={handleReset2FA}
                className="px-3 py-1.5 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-colors flex items-center gap-2 text-sm"
              >
                <KeyRound size={14} />
                Reset 2FA
              </button>

              {/* Unlock Account */}
              <button
                onClick={handleUnlockAccount}
                className="px-3 py-1.5 bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500/20 transition-colors flex items-center gap-2 text-sm"
              >
                <Unlock size={14} />
                Unlock
              </button>

              {/* Trading Block/Unblock - SuperAdmin only */}
              {isSuperAdmin && user.role !== 'superadmin' && (
                <>
                  {user.status?.can_trade === false ? (
                    <button
                      onClick={handleUnblockTrading}
                      className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Trophy size={14} />
                      Unblock Trading
                    </button>
                  ) : (
                    <button
                      onClick={handleBlockTrading}
                      className="px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Trophy size={14} />
                      Block Trading
                    </button>
                  )}
                </>
              )}

              {/* Grant Challenge */}
              <button
                onClick={() => navigate(`/admin/users/${user.id}/grant-challenge`)}
                className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-2 text-sm"
              >
                <Gift size={14} />
                Grant Challenge
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-dark-200">
            <div>
              <p className="text-xs text-gray-500 uppercase">Challenges</p>
              <p className="text-xl font-bold text-white mt-1">{user.challenges?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Spent</p>
              <p className="text-xl font-bold text-green-500 mt-1">
                {formatCurrency(user.payments?.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0) || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Last Activity</p>
              <p className="text-xl font-bold text-white mt-1">
                {user.status?.last_activity_at ? formatDate(user.status.last_activity_at) : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Logins</p>
              <p className="text-xl font-bold text-white mt-1">{user.status?.total_logins || 0}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-dark-200">
          <nav className="flex gap-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-dark-100 rounded-xl p-6 border border-dark-200">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">User Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-dark-200">
                    <span className="text-gray-400">User ID</span>
                    <span className="text-white">{user.id}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dark-200">
                    <span className="text-gray-400">Username</span>
                    <span className="text-white">{user.username}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dark-200">
                    <span className="text-gray-400">Email</span>
                    <span className="text-white">{user.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dark-200">
                    <span className="text-gray-400">Email Verified</span>
                    <span className={user.email_verified ? 'text-green-500' : 'text-red-500'}>
                      {user.email_verified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dark-200">
                    <span className="text-gray-400">Language</span>
                    <span className="text-white">{user.preferred_language?.toUpperCase() || 'FR'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dark-200">
                    <span className="text-gray-400">Referral Code</span>
                    <span className="text-white font-mono">{user.referral_code || '-'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-dark-200">
                    <span className="text-gray-400">Status</span>
                    <StatusBadge status={getUserStatus()} />
                  </div>
                  <div className="flex justify-between py-2 border-b border-dark-200">
                    <span className="text-gray-400">Can Trade</span>
                    <span className={user.status?.can_trade ? 'text-green-500' : 'text-red-500'}>
                      {user.status?.can_trade ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dark-200">
                    <span className="text-gray-400">Created At</span>
                    <span className="text-white">{formatDate(user.created_at)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dark-200">
                    <span className="text-gray-400">Last Activity</span>
                    <span className="text-white">{formatDate(user.status?.last_activity_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'challenges' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">User Challenges</h3>
              {user.challenges?.length > 0 ? (
                <div className="space-y-4">
                  {user.challenges.map(challenge => (
                    <div key={challenge.id} className="bg-dark-200/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{challenge.model_name}</p>
                          <p className="text-sm text-gray-400">
                            {formatCurrency(challenge.account_size)} • Phase: {challenge.phase}
                          </p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={challenge.status} />
                          <p className="text-sm text-gray-400 mt-1">
                            Balance: {formatCurrency(challenge.current_balance)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No challenges found</p>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Payment History</h3>
              {user.payments?.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-200">
                      <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase">ID</th>
                      <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase">Amount</th>
                      <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase">Method</th>
                      <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                      <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.payments.map(payment => (
                      <tr key={payment.id} className="border-b border-dark-200">
                        <td className="py-3 text-white">#{payment.id}</td>
                        <td className="py-3 text-white">{formatCurrency(payment.amount, payment.currency)}</td>
                        <td className="py-3 text-white capitalize">{payment.method}</td>
                        <td className="py-3"><StatusBadge status={payment.status} /></td>
                        <td className="py-3 text-gray-400">{formatDate(payment.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-center py-8">No payments found</p>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">User Activity</h3>
              <p className="text-gray-500 text-center py-8">Activity log coming soon...</p>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Active Sessions</h3>
              {user.sessions?.length > 0 ? (
                <div className="space-y-4">
                  {user.sessions.map(session => (
                    <div key={session.id} className="bg-dark-200/50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Smartphone size={24} className="text-gray-500" />
                        <div>
                          <p className="text-white">{session.device}</p>
                          <p className="text-sm text-gray-400">
                            {session.ip_address} • {session.country}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {session.is_current && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-500">
                            Current
                          </span>
                        )}
                        <p className="text-sm text-gray-400 mt-1">{formatDate(session.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No active sessions</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <UserEditModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateUser}
        />
      )}

      {showBanModal && (
        <UserBanModal
          user={user}
          onClose={() => setShowBanModal(false)}
          onBan={handleBanUser}
        />
      )}

      {showFreezeModal && (
        <FreezeUserModal
          user={user}
          onClose={() => setShowFreezeModal(false)}
          onFreeze={handleFreezeUser}
        />
      )}
    </AdminLayout>
  )
}

export default UserDetailPage
