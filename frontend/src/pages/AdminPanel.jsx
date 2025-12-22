import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { adminAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  Users, Activity, DollarSign, TrendingUp,
  Search, ChevronLeft, ChevronRight, Eye,
  CheckCircle, XCircle, Clock, Filter
} from 'lucide-react'

const AdminPanel = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [challenges, setChallenges] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchData()
  }, [activeTab, page, statusFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'users':
          const usersRes = await adminAPI.getUsers(page, 20, search)
          setUsers(usersRes.data.users)
          setTotalPages(usersRes.data.pages)
          break
        case 'challenges':
          const challengesRes = await adminAPI.getChallenges(page, 20, statusFilter)
          setChallenges(challengesRes.data.challenges)
          setTotalPages(challengesRes.data.pages)
          break
        case 'payments':
          const paymentsRes = await adminAPI.getPayments(page, 20, statusFilter)
          setPayments(paymentsRes.data.payments)
          setTotalPages(paymentsRes.data.pages)
          break
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Mock data for demo
      setUsers([
        { id: 1, username: 'trader1', email: 'trader1@test.com', role: 'user', created_at: '2024-01-15' },
        { id: 2, username: 'trader2', email: 'trader2@test.com', role: 'user', created_at: '2024-01-16' },
        { id: 3, username: 'admin', email: 'admin@tradesense.com', role: 'superadmin', created_at: '2024-01-01' }
      ])
      setChallenges([
        { id: 1, username: 'trader1', plan_type: 'pro', initial_balance: 25000, current_balance: 27500, status: 'active' },
        { id: 2, username: 'trader2', plan_type: 'elite', initial_balance: 100000, current_balance: 95000, status: 'active' }
      ])
      setPayments([
        { id: 1, user_id: 1, amount: 500, payment_method: 'paypal', status: 'completed', created_at: '2024-01-15' },
        { id: 2, user_id: 2, amount: 1000, payment_method: 'cmi', status: 'completed', created_at: '2024-01-16' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateChallengeStatus = async (challengeId, newStatus) => {
    try {
      await adminAPI.updateChallengeStatus(challengeId, newStatus)
      toast.success(`Challenge status updated to ${newStatus}`)
      fetchData()
    } catch (error) {
      toast.error('Failed to update challenge status')
    }
  }

  const tabs = [
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'challenges', label: 'Challenges', icon: Activity },
    { id: 'payments', label: 'Paiements', icon: DollarSign }
  ]

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-blue-500/10 text-blue-500',
      passed: 'bg-green-500/10 text-green-500',
      failed: 'bg-red-500/10 text-red-500',
      completed: 'bg-green-500/10 text-green-500',
      pending: 'bg-yellow-500/10 text-yellow-500'
    }
    return colors[status] || 'bg-gray-500/10 text-gray-500'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('nav.admin')} Panel
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerez les utilisateurs, challenges et paiements
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 bg-white dark:bg-dark-100 rounded-xl p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setPage(1)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-200'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-100 border border-gray-200 dark:border-dark-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {(activeTab === 'challenges' || activeTab === 'payments') && (
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white dark:bg-dark-100 border border-gray-200 dark:border-dark-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tous les statuts</option>
                {activeTab === 'challenges' ? (
                  <>
                    <option value="active">Actif</option>
                    <option value="passed">Reussi</option>
                    <option value="failed">Echoue</option>
                  </>
                ) : (
                  <>
                    <option value="completed">Complete</option>
                    <option value="pending">En attente</option>
                    <option value="failed">Echoue</option>
                  </>
                )}
              </select>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              {/* Users Tab */}
              {activeTab === 'users' && (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-200">
                        <td className="px-6 py-4 text-sm text-gray-500">{user.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {user.username?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {user.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'superadmin' ? 'bg-purple-500/10 text-purple-500' :
                            user.role === 'admin' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-300 rounded-lg">
                            <Eye size={18} className="text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Challenges Tab */}
              {activeTab === 'challenges' && (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trader</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solde</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-200">
                    {challenges.map((challenge) => {
                      const profit = ((challenge.current_balance - challenge.initial_balance) / challenge.initial_balance * 100).toFixed(2)
                      return (
                        <tr key={challenge.id} className="hover:bg-gray-50 dark:hover:bg-dark-200">
                          <td className="px-6 py-4 text-sm text-gray-500">{challenge.id}</td>
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            {challenge.username}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-primary-500/10 text-primary-500">
                              {challenge.plan_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            ${challenge.current_balance?.toLocaleString()}
                          </td>
                          <td className={`px-6 py-4 text-sm font-medium ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {profit >= 0 ? '+' : ''}{profit}%
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(challenge.status)}`}>
                              {challenge.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateChallengeStatus(challenge.id, 'passed')}
                                className="p-2 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg"
                                title="Marquer comme reussi"
                              >
                                <CheckCircle size={18} className="text-green-500" />
                              </button>
                              <button
                                onClick={() => handleUpdateChallengeStatus(challenge.id, 'failed')}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg"
                                title="Marquer comme echoue"
                              >
                                <XCircle size={18} className="text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Methode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-dark-200">
                        <td className="px-6 py-4 text-sm text-gray-500">{payment.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{payment.user_id}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {payment.amount} MAD
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 uppercase">
                          {payment.payment_method}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-dark-200">
            <div className="text-sm text-gray-500">
              Page {page} sur {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
