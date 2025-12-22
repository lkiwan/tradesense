import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { superAdminAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  Settings, Users, DollarSign, TrendingUp,
  Shield, Sparkles, Save, Eye, EyeOff,
  UserPlus, UserMinus, BarChart3
} from 'lucide-react'

const SuperAdmin = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('settings')
  const [loading, setLoading] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)

  // Settings state
  const [paypalSettings, setPaypalSettings] = useState({
    client_id: '',
    client_secret: '',
    mode: 'sandbox'
  })
  const [geminiSettings, setGeminiSettings] = useState({
    api_key: ''
  })

  // Admins state
  const [admins, setAdmins] = useState([])

  // Stats state
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdmins()
    } else if (activeTab === 'stats') {
      fetchStats()
    }
  }, [activeTab])

  const fetchAdmins = async () => {
    try {
      const response = await superAdminAPI.getAdmins()
      setAdmins(response.data.admins)
    } catch (error) {
      console.error('Error fetching admins:', error)
      setAdmins([
        { id: 1, username: 'admin', email: 'admin@tradesense.com', role: 'superadmin' },
        { id: 2, username: 'manager', email: 'manager@tradesense.com', role: 'admin' }
      ])
    }
  }

  const fetchStats = async () => {
    try {
      const response = await superAdminAPI.getStats()
      setStats(response.data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({
        revenue: { total: 125000, monthly: 32000, currency: 'MAD' },
        users: { total: 1250, new_this_month: 156 },
        challenges: { total: 3420, active: 856, passed: 1230, failed: 1334, success_rate: 47.9 },
        trades: { total: 45678, total_volume: 12500000 }
      })
    }
  }

  const handleSavePayPal = async () => {
    setLoading(true)
    try {
      await superAdminAPI.updatePayPal(paypalSettings)
      toast.success('PayPal settings saved!')
    } catch (error) {
      toast.error('Failed to save PayPal settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGemini = async () => {
    setLoading(true)
    try {
      await superAdminAPI.updateGemini(geminiSettings)
      toast.success('Gemini API settings saved!')
    } catch (error) {
      toast.error('Failed to save Gemini settings')
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteUser = async (userId) => {
    try {
      await superAdminAPI.promoteAdmin(userId)
      toast.success('User promoted to admin')
      fetchAdmins()
    } catch (error) {
      toast.error('Failed to promote user')
    }
  }

  const handleDemoteAdmin = async (userId) => {
    try {
      await superAdminAPI.demoteAdmin(userId)
      toast.success('Admin demoted to user')
      fetchAdmins()
    } catch (error) {
      toast.error('Failed to demote admin')
    }
  }

  const tabs = [
    { id: 'settings', label: 'Configuration', icon: Settings },
    { id: 'admins', label: 'Administrateurs', icon: Users },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Shield className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Super Admin Panel
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Configuration avancee de la plateforme
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 bg-white dark:bg-dark-100 rounded-xl p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-200'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* PayPal Configuration */}
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-blue-500" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Configuration PayPal
                  </h3>
                  <p className="text-sm text-gray-500">
                    Configurez vos identifiants PayPal pour les paiements
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client ID
                  </label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={paypalSettings.client_id}
                    onChange={(e) => setPaypalSettings({ ...paypalSettings, client_id: e.target.value })}
                    className="input"
                    placeholder="PayPal Client ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={paypalSettings.client_secret}
                      onChange={(e) => setPaypalSettings({ ...paypalSettings, client_secret: e.target.value })}
                      className="input pr-10"
                      placeholder="PayPal Client Secret"
                    />
                    <button
                      onClick={() => setShowSecrets(!showSecrets)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mode
                </label>
                <select
                  value={paypalSettings.mode}
                  onChange={(e) => setPaypalSettings({ ...paypalSettings, mode: e.target.value })}
                  className="input w-auto"
                >
                  <option value="sandbox">Sandbox (Test)</option>
                  <option value="live">Live (Production)</option>
                </select>
              </div>

              <button
                onClick={handleSavePayPal}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                Enregistrer PayPal
              </button>
            </div>

            {/* Gemini Configuration */}
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="text-primary-500" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Configuration Gemini AI
                  </h3>
                  <p className="text-sm text-gray-500">
                    Configurez votre cle API Google Gemini pour les signaux IA
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={geminiSettings.api_key}
                  onChange={(e) => setGeminiSettings({ ...geminiSettings, api_key: e.target.value })}
                  className="input"
                  placeholder="Gemini API Key"
                />
              </div>

              <button
                onClick={handleSaveGemini}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                Enregistrer Gemini
              </button>
            </div>
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="bg-white dark:bg-dark-100 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-dark-200">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Gestion des Administrateurs
              </h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-200">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-dark-200">
                    <td className="px-6 py-4 text-sm text-gray-500">{admin.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {admin.username}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{admin.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        admin.role === 'superadmin' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {admin.role === 'admin' && (
                        <button
                          onClick={() => handleDemoteAdmin(admin.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <UserMinus size={16} />
                          Retrograder
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* Revenue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Revenue Totale</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.revenue.total.toLocaleString()} {stats.revenue.currency}
                </div>
              </div>
              <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Revenue Mensuelle</h3>
                <div className="text-3xl font-bold text-primary-500">
                  {stats.revenue.monthly.toLocaleString()} {stats.revenue.currency}
                </div>
              </div>
            </div>

            {/* Users & Challenges */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-dark-100 rounded-xl p-6 text-center">
                <Users className="mx-auto text-blue-500 mb-2" size={32} />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.users.total.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Utilisateurs Total</div>
              </div>
              <div className="bg-white dark:bg-dark-100 rounded-xl p-6 text-center">
                <TrendingUp className="mx-auto text-green-500 mb-2" size={32} />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.challenges.active.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Challenges Actifs</div>
              </div>
              <div className="bg-white dark:bg-dark-100 rounded-xl p-6 text-center">
                <DollarSign className="mx-auto text-primary-500 mb-2" size={32} />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.trades.total.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Trades Executes</div>
              </div>
              <div className="bg-white dark:bg-dark-100 rounded-xl p-6 text-center">
                <BarChart3 className="mx-auto text-purple-500 mb-2" size={32} />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.challenges.success_rate}%
                </div>
                <div className="text-sm text-gray-500">Taux de Reussite</div>
              </div>
            </div>

            {/* Challenge Breakdown */}
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Repartition des Challenges
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-500/10 rounded-xl">
                  <div className="text-2xl font-bold text-blue-500">{stats.challenges.active}</div>
                  <div className="text-sm text-gray-500">Actifs</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-xl">
                  <div className="text-2xl font-bold text-green-500">{stats.challenges.passed}</div>
                  <div className="text-sm text-gray-500">Reussis</div>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-xl">
                  <div className="text-2xl font-bold text-red-500">{stats.challenges.failed}</div>
                  <div className="text-sm text-gray-500">Echoues</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SuperAdmin
