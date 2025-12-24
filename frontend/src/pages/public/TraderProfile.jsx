import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft, BarChart2, TrendingUp, Award, History,
  RefreshCw, Lock, AlertCircle
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
  { id: 'statistics', label: 'Statistics', icon: TrendingUp },
  { id: 'equity', label: 'Equity Curve', icon: TrendingUp },
  { id: 'badges', label: 'Badges', icon: Award },
  { id: 'trades', label: 'Trade History', icon: History }
]

const TraderProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('statistics')
  const [profile, setProfile] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [equityData, setEquityData] = useState([])
  const [equityPeriod, setEquityPeriod] = useState('30d')
  const [trades, setTrades] = useState([])
  const [tradePagination, setTradePagination] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [error, setError] = useState(null)

  // Load profile data
  useEffect(() => {
    loadProfile()
  }, [id])

  // Load equity when period changes
  useEffect(() => {
    if (profile) {
      loadEquityCurve()
    }
  }, [equityPeriod, profile])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get(`/api/profiles/${id}`)
      if (response.data.success) {
        setProfile(response.data.profile)
        loadStatistics()
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      if (error.response?.status === 403) {
        setError('This profile is private')
      } else if (error.response?.status === 404) {
        setError('Profile not found')
      } else {
        setError('Failed to load profile')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await api.get(`/api/profiles/${id}/statistics`)
      if (response.data.success) {
        setStatistics(response.data.statistics)
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }

  const loadEquityCurve = async () => {
    try {
      const response = await api.get(`/api/profiles/${id}/equity-curve?period=${equityPeriod}`)
      if (response.data.success) {
        setEquityData(response.data.equity_curve)
      }
    } catch (error) {
      console.error('Failed to load equity curve:', error)
    }
  }

  const loadTrades = async (page = 1) => {
    try {
      const response = await api.get(`/api/profiles/${id}/trades`, { params: { page } })
      if (response.data.success) {
        setTrades(response.data.trades)
        setTradePagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Failed to load trades:', error)
    }
  }

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/api/follow/${profile.user_id}`)
        setIsFollowing(false)
        toast.success('Unfollowed trader')
      } else {
        await api.post(`/api/follow/${profile.user_id}`)
        setIsFollowing(true)
        toast.success('Following trader')
      }
    } catch (error) {
      toast.error('Failed to update follow status')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          {error === 'This profile is private' ? (
            <Lock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          ) : (
            <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          )}
          <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
          <p className="text-slate-400 mb-6">
            {error === 'This profile is private'
              ? 'This trader has set their profile to private.'
              : 'The trader profile you are looking for does not exist.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        statistics={statistics}
        isOwnProfile={false}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
      />

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-1">
            {TABS.map(tab => {
              // Check if tab content is available
              const isDisabled =
                (tab.id === 'statistics' && !profile?.show_statistics) ||
                (tab.id === 'equity' && !profile?.show_equity_curve) ||
                (tab.id === 'trades' && !profile?.show_trades)

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!isDisabled) {
                      setActiveTab(tab.id)
                      if (tab.id === 'trades') loadTrades()
                    }
                  }}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    isDisabled
                      ? 'text-slate-600 border-transparent cursor-not-allowed'
                      : activeTab === tab.id
                        ? 'text-cyan-400 border-cyan-400'
                        : 'text-slate-400 border-transparent hover:text-white'
                  }`}
                >
                  {isDisabled ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <tab.icon className="w-4 h-4" />
                  )}
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          profile?.show_statistics ? (
            <StatisticsGrid statistics={statistics} />
          ) : (
            <div className="bg-slate-800 rounded-lg p-8 text-center">
              <Lock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Statistics are hidden by this trader.</p>
            </div>
          )
        )}

        {/* Equity Curve Tab */}
        {activeTab === 'equity' && (
          profile?.show_equity_curve ? (
            <EquityCurve
              data={equityData}
              period={equityPeriod}
              onPeriodChange={setEquityPeriod}
            />
          ) : (
            <div className="bg-slate-800 rounded-lg p-8 text-center">
              <Lock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Equity curve is hidden by this trader.</p>
            </div>
          )
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <BadgesDisplay
            badges={profile?.badges?.map(code => ({
              code,
              name: code.replace(/_/g, ' '),
              icon: '🏆',
              earned: true
            })) || []}
            earnedCount={profile?.badges?.length || 0}
            showAll={false}
          />
        )}

        {/* Trade History Tab */}
        {activeTab === 'trades' && (
          profile?.show_trades ? (
            <TradeHistory
              trades={trades}
              pagination={tradePagination}
              onPageChange={loadTrades}
            />
          ) : (
            <div className="bg-slate-800 rounded-lg p-8 text-center">
              <Lock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Trade history is hidden by this trader.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default TraderProfile
