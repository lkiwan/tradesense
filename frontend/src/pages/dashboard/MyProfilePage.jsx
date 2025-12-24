import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
  User, BarChart2, TrendingUp, Award, History,
  Settings, RefreshCw, Share2, Eye, EyeOff
} from 'lucide-react'
import {
  ProfileHeader,
  StatisticsGrid,
  EquityCurve,
  BadgesDisplay,
  TradeHistory
} from '../../components/profile'
import api from '../../services/api'

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'statistics', label: 'Statistics', icon: TrendingUp },
  { id: 'equity', label: 'Equity Curve', icon: TrendingUp },
  { id: 'badges', label: 'Badges', icon: Award },
  { id: 'trades', label: 'Trade History', icon: History },
  { id: 'settings', label: 'Profile Settings', icon: Settings }
]

const MyProfilePage = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [profile, setProfile] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [equityData, setEquityData] = useState([])
  const [equityPeriod, setEquityPeriod] = useState('30d')
  const [badges, setBadges] = useState([])
  const [earnedCount, setEarnedCount] = useState(0)
  const [trades, setTrades] = useState([])
  const [tradePagination, setTradePagination] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Profile form state
  const [formData, setFormData] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  // Load profile data
  useEffect(() => {
    loadProfile()
    loadStatistics()
    loadBadges()
  }, [])

  // Load equity when period changes
  useEffect(() => {
    loadEquityCurve()
  }, [equityPeriod])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/api/profiles/me')
      if (response.data.success) {
        setProfile(response.data.profile)
        setFormData(response.data.profile)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await api.get('/api/profiles/me/statistics')
      if (response.data.success) {
        setStatistics(response.data.statistics)
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }

  const loadEquityCurve = async () => {
    try {
      const response = await api.get(`/api/profiles/me/equity-curve?period=${equityPeriod}`)
      if (response.data.success) {
        setEquityData(response.data.equity_curve)
      }
    } catch (error) {
      console.error('Failed to load equity curve:', error)
    }
  }

  const loadBadges = async () => {
    try {
      const response = await api.get('/api/profiles/me/badges')
      if (response.data.success) {
        setBadges(response.data.badges)
        setEarnedCount(response.data.earned_count)
      }
    } catch (error) {
      console.error('Failed to load badges:', error)
    }
  }

  const loadTrades = async (page = 1) => {
    try {
      // For own profile, we need to use challenges endpoint
      const response = await api.get('/api/trades', { params: { page, per_page: 20 } })
      if (response.data) {
        setTrades(response.data.trades || [])
        setTradePagination(response.data.pagination || {})
      }
    } catch (error) {
      console.error('Failed to load trades:', error)
    }
  }

  const refreshStatistics = async () => {
    try {
      setIsRefreshing(true)
      const response = await api.post('/api/profiles/me/statistics/refresh')
      if (response.data.success) {
        setStatistics(response.data.statistics)
        toast.success('Statistics refreshed')
      }
    } catch (error) {
      toast.error('Failed to refresh statistics')
    } finally {
      setIsRefreshing(false)
    }
  }

  const checkBadges = async () => {
    try {
      const response = await api.post('/api/profiles/me/badges/check')
      if (response.data.success && response.data.new_badges.length > 0) {
        toast.success(`Earned ${response.data.new_badges.length} new badge(s)!`)
        loadBadges()
      }
    } catch (error) {
      console.error('Failed to check badges:', error)
    }
  }

  const saveProfile = async () => {
    try {
      setIsSaving(true)
      const response = await api.put('/api/profiles/me', formData)
      if (response.data.success) {
        setProfile(response.data.profile)
        toast.success('Profile updated')
      }
    } catch (error) {
      toast.error('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        statistics={statistics}
        isOwnProfile={true}
        onEditProfile={() => setActiveTab('settings')}
      />

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (tab.id === 'trades') loadTrades()
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-cyan-400 border-cyan-400'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Summary</h3>
                {statistics ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {statistics.win_rate}%
                      </div>
                      <div className="text-sm text-slate-400">Win Rate</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${
                        statistics.net_profit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${statistics.net_profit.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400">Net Profit</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {statistics.total_trades}
                      </div>
                      <div className="text-sm text-slate-400">Total Trades</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {statistics.profit_factor}
                      </div>
                      <div className="text-sm text-slate-400">Profit Factor</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400">No trading data yet</p>
                )}
              </div>

              {/* Recent Badges */}
              <div className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Badges</h3>
                  <button
                    onClick={checkBadges}
                    className="text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    Check for new
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {badges.filter(b => b.earned).slice(0, 6).map((badge, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 rounded-full"
                      title={badge.description}
                    >
                      <span>{badge.icon}</span>
                      <span className="text-sm text-white">{badge.name}</span>
                    </div>
                  ))}
                  {earnedCount === 0 && (
                    <p className="text-slate-400 text-sm">Start trading to earn badges!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Equity Curve Preview */}
            <EquityCurve
              data={equityData}
              period={equityPeriod}
              onPeriodChange={setEquityPeriod}
            />
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Trading Statistics</h2>
              <button
                onClick={refreshStatistics}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <StatisticsGrid statistics={statistics} />
          </div>
        )}

        {/* Equity Curve Tab */}
        {activeTab === 'equity' && (
          <EquityCurve
            data={equityData}
            period={equityPeriod}
            onPeriodChange={setEquityPeriod}
          />
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <BadgesDisplay
            badges={badges}
            earnedCount={earnedCount}
            showAll={true}
          />
        )}

        {/* Trade History Tab */}
        {activeTab === 'trades' && (
          <TradeHistory
            trades={trades}
            pagination={tradePagination}
            onPageChange={loadTrades}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={formData.display_name || ''}
                      onChange={(e) => handleFormChange('display_name', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Your display name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Bio</label>
                    <textarea
                      value={formData.bio || ''}
                      onChange={(e) => handleFormChange('bio', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 h-24 resize-none"
                      placeholder="Tell others about yourself..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country || ''}
                      onChange={(e) => handleFormChange('country', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Your country"
                    />
                  </div>
                </div>
              </div>

              {/* Trading Style */}
              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Trading Style</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Trading Style</label>
                    <select
                      value={formData.trading_style || ''}
                      onChange={(e) => handleFormChange('trading_style', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">Select style</option>
                      <option value="scalper">Scalper</option>
                      <option value="day_trader">Day Trader</option>
                      <option value="swing_trader">Swing Trader</option>
                      <option value="position_trader">Position Trader</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Trading Since</label>
                    <input
                      type="date"
                      value={formData.trading_since || ''}
                      onChange={(e) => handleFormChange('trading_since', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Privacy Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      {formData.is_public ? (
                        <Eye className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <div className="text-white">Public Profile</div>
                        <div className="text-sm text-slate-400">Allow others to view your profile</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_public || false}
                      onChange={(e) => handleFormChange('is_public', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      formData.is_public ? 'bg-cyan-500' : 'bg-slate-600'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                        formData.is_public ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-white">Show Statistics</div>
                      <div className="text-sm text-slate-400">Display trading statistics publicly</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.show_statistics || false}
                      onChange={(e) => handleFormChange('show_statistics', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      formData.show_statistics ? 'bg-cyan-500' : 'bg-slate-600'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                        formData.show_statistics ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-white">Show Equity Curve</div>
                      <div className="text-sm text-slate-400">Display your equity curve publicly</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.show_equity_curve || false}
                      onChange={(e) => handleFormChange('show_equity_curve', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      formData.show_equity_curve ? 'bg-cyan-500' : 'bg-slate-600'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                        formData.show_equity_curve ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-white">Show Trade History</div>
                      <div className="text-sm text-slate-400">Display your trades publicly</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.show_trades || false}
                      onChange={(e) => handleFormChange('show_trades', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      formData.show_trades ? 'bg-cyan-500' : 'bg-slate-600'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                        formData.show_trades ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-white">Allow Copy Trading</div>
                      <div className="text-sm text-slate-400">Let others copy your trades</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.allow_copy_trading || false}
                      onChange={(e) => handleFormChange('allow_copy_trading', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      formData.allow_copy_trading ? 'bg-cyan-500' : 'bg-slate-600'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                        formData.allow_copy_trading ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={saveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyProfilePage
