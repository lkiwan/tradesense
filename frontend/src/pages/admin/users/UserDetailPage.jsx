import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { AdminLayout, StatusBadge } from '../../../components/admin'
import UserEditModal from '../../../components/admin/modals/UserEditModal'
import UserBanModal from '../../../components/admin/modals/UserBanModal'
import FreezeUserModal from '../../../components/admin/modals/FreezeUserModal'
import ChangePasswordModal from '../../../components/admin/modals/ChangePasswordModal'
import {
  ArrowLeft, User, Mail, Calendar, Shield, Edit, Ban, UserCheck,
  Snowflake, Key, Trophy, CreditCard, Activity, Clock, MapPin,
  Smartphone, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  ShieldCheck, KeyRound, Gift, Unlock, DollarSign, Hash, Globe,
  TrendingUp, MoreHorizontal
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
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    loadUser()
  }, [id])

  const loadUser = async () => {
    setLoading(true)
    try {
      const response = await adminUsersAPI.getUser(id)
      const userData = response.data.user || response.data
      setUser({
        ...userData,
        challenges: response.data.challenges || userData.challenges || [],
        payments: response.data.payments || userData.payments || [],
        sessions: response.data.sessions || userData.sessions || []
      })
    } catch (error) {
      console.error('Error loading user:', error)
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
        challenges: [],
        payments: [],
        sessions: []
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
    if (!confirm('Are you sure you want to reset 2FA for this user?')) return
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

  const handleChangePassword = async (newPassword) => {
    await adminUsersAPI.changePassword(user.id, newPassword)
    toast.success('Password changed successfully')
    setShowPasswordModal(false)
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
      case 'superadmin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'admin': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
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
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <User size={48} className="mx-auto text-gray-600 mb-4" />
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
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Users</span>
        </button>

        {/* User Profile Card */}
        <div className="bg-gradient-to-br from-dark-100 to-dark-100/50 rounded-2xl border border-dark-200 overflow-hidden">
          {/* Header Banner */}
          <div className="h-24 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20" />

          {/* Profile Section */}
          <div className="px-6 pb-6 -mt-12">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              {/* User Info */}
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center border-4 border-dark-100 shadow-xl">
                  <span className="text-white text-3xl font-bold">
                    {user.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-white">{user.username}</h1>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                    <StatusBadge status={getUserStatus()} />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} />
                      {user.email}
                      {user.email_verified ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        <XCircle size={14} className="text-red-500" />
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      Joined {formatDate(user.created_at)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Hash size={14} />
                      ID: {user.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2.5 bg-dark-200 text-white rounded-xl hover:bg-dark-300 transition-all flex items-center gap-2 font-medium"
                >
                  <Edit size={16} />
                  Edit Profile
                </button>

                {user.role !== 'superadmin' && (
                  <>
                    {user.status?.is_banned ? (
                      <button
                        onClick={handleUnbanUser}
                        className="px-4 py-2.5 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 transition-all flex items-center gap-2 font-medium border border-green-500/20"
                      >
                        <UserCheck size={16} />
                        Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowBanModal(true)}
                        className="px-4 py-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2 font-medium border border-red-500/20"
                      >
                        <Ban size={16} />
                        Ban User
                      </button>
                    )}

                    {isSuperAdmin && (
                      <>
                        {user.status?.is_frozen ? (
                          <button
                            onClick={handleUnfreezeUser}
                            className="px-4 py-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all flex items-center gap-2 font-medium border border-cyan-500/20"
                          >
                            <Snowflake size={16} />
                            Unfreeze
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowFreezeModal(true)}
                            className="px-4 py-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all flex items-center gap-2 font-medium border border-cyan-500/20"
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
            </div>

            {/* Quick Actions Grid */}
            <div className="mt-6 pt-6 border-t border-dark-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                {!user.email_verified && (
                  <button
                    onClick={handleVerifyEmail}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-all text-sm font-medium border border-green-500/20"
                  >
                    <ShieldCheck size={14} />
                    Verify Email
                  </button>
                )}

                <button
                  onClick={handleReset2FA}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-orange-500/10 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-all text-sm font-medium border border-orange-500/20"
                >
                  <KeyRound size={14} />
                  Reset 2FA
                </button>

                <button
                  onClick={handleUnlockAccount}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-all text-sm font-medium border border-purple-500/20"
                >
                  <Unlock size={14} />
                  Unlock Account
                </button>

                {isSuperAdmin && user.role !== 'superadmin' && (
                  <>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-sm font-medium border border-red-500/20"
                    >
                      <Key size={14} />
                      Change Password
                    </button>

                    {user.status?.can_trade === false ? (
                      <button
                        onClick={handleUnblockTrading}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all text-sm font-medium border border-emerald-500/20"
                      >
                        <TrendingUp size={14} />
                        Unblock Trading
                      </button>
                    ) : (
                      <button
                        onClick={handleBlockTrading}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all text-sm font-medium border border-amber-500/20"
                      >
                        <TrendingUp size={14} />
                        Block Trading
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => navigate(`/admin/users/${user.id}/grant-challenge`)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all text-sm font-medium border border-primary/20"
                >
                  <Gift size={14} />
                  Grant Challenge
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-dark-200">
              <div className="bg-dark-200/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Trophy size={16} />
                  <span className="text-xs uppercase tracking-wider">Challenges</span>
                </div>
                <p className="text-2xl font-bold text-white">{user.challenges?.length || 0}</p>
              </div>
              <div className="bg-dark-200/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <DollarSign size={16} />
                  <span className="text-xs uppercase tracking-wider">Total Spent</span>
                </div>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(user.payments?.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0) || 0)}
                </p>
              </div>
              <div className="bg-dark-200/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Clock size={16} />
                  <span className="text-xs uppercase tracking-wider">Last Activity</span>
                </div>
                <p className="text-lg font-bold text-white truncate">
                  {user.status?.last_activity_at ? formatDate(user.status.last_activity_at) : 'Never'}
                </p>
              </div>
              <div className="bg-dark-200/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Activity size={16} />
                  <span className="text-xs uppercase tracking-wider">Total Logins</span>
                </div>
                <p className="text-2xl font-bold text-white">{user.status?.total_logins || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-dark-100 rounded-xl border border-dark-200">
          <div className="border-b border-dark-200 px-4">
            <nav className="flex gap-1 -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-dark-200/50'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Information */}
                <div className="bg-dark-200/30 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <User size={18} className="text-primary" />
                    User Information
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'User ID', value: user.id },
                      { label: 'Username', value: user.username },
                      { label: 'Email', value: user.email },
                      { label: 'Email Verified', value: user.email_verified ? 'Yes' : 'No', color: user.email_verified ? 'text-green-400' : 'text-red-400' },
                      { label: 'Language', value: user.preferred_language?.toUpperCase() || 'FR' },
                      { label: 'Referral Code', value: user.referral_code || '-', mono: true }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-dark-200/50 last:border-0">
                        <span className="text-gray-400">{item.label}</span>
                        <span className={`${item.color || 'text-white'} ${item.mono ? 'font-mono text-sm' : ''}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account Status */}
                <div className="bg-dark-200/30 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield size={18} className="text-primary" />
                    Account Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-dark-200/50">
                      <span className="text-gray-400">Status</span>
                      <StatusBadge status={getUserStatus()} />
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dark-200/50">
                      <span className="text-gray-400">Can Trade</span>
                      <span className={user.status?.can_trade !== false ? 'text-green-400' : 'text-red-400'}>
                        {user.status?.can_trade !== false ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dark-200/50">
                      <span className="text-gray-400">2FA Enabled</span>
                      <span className={user.two_factor_enabled ? 'text-green-400' : 'text-gray-500'}>
                        {user.two_factor_enabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dark-200/50">
                      <span className="text-gray-400">Created At</span>
                      <span className="text-white">{formatDate(user.created_at)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400">Last Activity</span>
                      <span className="text-white">{formatDate(user.status?.last_activity_at) || 'Never'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'challenges' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Trophy size={18} className="text-primary" />
                    User Challenges
                  </h3>
                  <button
                    onClick={() => navigate(`/admin/users/${user.id}/grant-challenge`)}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all text-sm font-medium"
                  >
                    + Grant Challenge
                  </button>
                </div>
                {user.challenges?.length > 0 ? (
                  <div className="space-y-3">
                    {user.challenges.map(challenge => (
                      <div key={challenge.id} className="bg-dark-200/30 rounded-xl p-4 hover:bg-dark-200/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                              <Trophy className="text-primary" size={20} />
                            </div>
                            <div>
                              <p className="text-white font-medium">{challenge.model_name}</p>
                              <p className="text-sm text-gray-400">
                                {formatCurrency(challenge.account_size)} • Phase: {challenge.phase}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <StatusBadge status={challenge.status} />
                            <p className="text-sm text-gray-400 mt-1">
                              Balance: <span className="text-white font-medium">{formatCurrency(challenge.current_balance)}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-dark-200/30 rounded-xl">
                    <Trophy className="mx-auto text-gray-600 mb-3" size={40} />
                    <p className="text-gray-500">No challenges found</p>
                    <button
                      onClick={() => navigate(`/admin/users/${user.id}/grant-challenge`)}
                      className="mt-4 px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-all text-sm font-medium"
                    >
                      Grant First Challenge
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-primary" />
                  Payment History
                </h3>
                {user.payments?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dark-200">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">ID</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Method</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.payments.map(payment => (
                          <tr key={payment.id} className="border-b border-dark-200/50 hover:bg-dark-200/30 transition-colors">
                            <td className="py-3 px-4 text-white font-mono">#{payment.id}</td>
                            <td className="py-3 px-4 text-white font-medium">{formatCurrency(payment.amount, payment.currency)}</td>
                            <td className="py-3 px-4 text-gray-300 capitalize">{payment.method}</td>
                            <td className="py-3 px-4"><StatusBadge status={payment.status} /></td>
                            <td className="py-3 px-4 text-gray-400">{formatDate(payment.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-dark-200/30 rounded-xl">
                    <CreditCard className="mx-auto text-gray-600 mb-3" size={40} />
                    <p className="text-gray-500">No payments found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-primary" />
                  User Activity
                </h3>
                <div className="text-center py-12 bg-dark-200/30 rounded-xl">
                  <Activity className="mx-auto text-gray-600 mb-3" size={40} />
                  <p className="text-gray-500">Activity log coming soon...</p>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Smartphone size={18} className="text-primary" />
                  Active Sessions
                </h3>
                {user.sessions?.length > 0 ? (
                  <div className="space-y-3">
                    {user.sessions.map(session => (
                      <div key={session.id} className="bg-dark-200/30 rounded-xl p-4 hover:bg-dark-200/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-500/20 flex items-center justify-center">
                              <Smartphone className="text-gray-400" size={20} />
                            </div>
                            <div>
                              <p className="text-white font-medium">{session.device}</p>
                              <p className="text-sm text-gray-400 flex items-center gap-2">
                                <Globe size={12} />
                                {session.ip_address} • {session.country}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {session.is_current && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                                Current Session
                              </span>
                            )}
                            <p className="text-sm text-gray-400 mt-1">{formatDate(session.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-dark-200/30 rounded-xl">
                    <Smartphone className="mx-auto text-gray-600 mb-3" size={40} />
                    <p className="text-gray-500">No active sessions</p>
                  </div>
                )}
              </div>
            )}
          </div>
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

      {showPasswordModal && (
        <ChangePasswordModal
          user={user}
          onClose={() => setShowPasswordModal(false)}
          onSave={handleChangePassword}
        />
      )}
    </AdminLayout>
  )
}

export default UserDetailPage
