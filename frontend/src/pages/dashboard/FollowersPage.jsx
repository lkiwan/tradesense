import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Users, UserPlus, TrendingUp, RefreshCw, ChevronLeft, ChevronRight,
  Sparkles, Search
} from 'lucide-react'
import { FollowerCard, SuggestionCard } from '../../components/social'
import api from '../../services/api'

const TABS = [
  { id: 'followers', label: 'Followers', icon: Users },
  { id: 'following', label: 'Following', icon: UserPlus },
  { id: 'suggestions', label: 'Discover', icon: Sparkles }
]

const FollowersPage = () => {
  const [activeTab, setActiveTab] = useState('followers')
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [stats, setStats] = useState({ follower_count: 0, following_count: 0 })
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'followers') {
      loadFollowers()
    } else if (activeTab === 'following') {
      loadFollowing()
    } else if (activeTab === 'suggestions') {
      loadSuggestions()
    }
  }, [activeTab])

  const loadStats = async () => {
    try {
      const response = await api.get('/api/follow/stats')
      if (response.data.success) {
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadFollowers = async (page = 1) => {
    try {
      setIsLoading(true)
      const response = await api.get('/api/follow/followers', { params: { page } })
      if (response.data.success) {
        setFollowers(response.data.followers)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Failed to load followers:', error)
      toast.error('Failed to load followers')
    } finally {
      setIsLoading(false)
    }
  }

  const loadFollowing = async (page = 1) => {
    try {
      setIsLoading(true)
      const response = await api.get('/api/follow/following', { params: { page } })
      if (response.data.success) {
        setFollowing(response.data.following)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Failed to load following:', error)
      toast.error('Failed to load following')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSuggestions = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/api/follow/suggestions', { params: { limit: 12 } })
      if (response.data.success) {
        setSuggestions(response.data.suggestions)
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismissSuggestion = (userId) => {
    setSuggestions(prev => prev.filter(s => s.user_id !== userId))
  }

  const handleFollowChange = (userId, isFollowing) => {
    loadStats()
    if (activeTab === 'following') {
      loadFollowing()
    }
  }

  const filteredFollowers = followers.filter(f => {
    const name = f.follower_profile?.display_name?.toLowerCase() || ''
    return name.includes(searchQuery.toLowerCase())
  })

  const filteredFollowing = following.filter(f => {
    const name = f.following_profile?.display_name?.toLowerCase() || ''
    return name.includes(searchQuery.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="w-7 h-7 text-cyan-400" />
          Social Network
        </h1>
        <p className="text-slate-400 mt-1">
          Connect with other traders, follow top performers, and grow your network
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.follower_count}</div>
          <div className="text-sm text-slate-400">Followers</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.following_count}</div>
          <div className="text-sm text-slate-400">Following</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <Link to="/my-profile" className="text-cyan-400 hover:text-cyan-300 font-medium">
            View My Profile
          </Link>
          <div className="text-sm text-slate-400 mt-1">Public Profile</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <Link to="/api/follow/feed" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Activity Feed
          </Link>
          <div className="text-sm text-slate-400 mt-1">Recent Trades</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'followers' && stats.follower_count > 0 && (
              <span className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">
                {stats.follower_count}
              </span>
            )}
            {tab.id === 'following' && stats.following_count > 0 && (
              <span className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">
                {stats.following_count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      {(activeTab === 'followers' || activeTab === 'following') && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Followers Tab */}
          {activeTab === 'followers' && (
            <div>
              {filteredFollowers.length > 0 ? (
                <div className="space-y-3">
                  {filteredFollowers.map(follower => (
                    <FollowerCard
                      key={follower.id}
                      user={follower}
                      type="follower"
                      onFollowChange={handleFollowChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800 rounded-lg">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No followers yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Make your profile public to get followers
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Following Tab */}
          {activeTab === 'following' && (
            <div>
              {filteredFollowing.length > 0 ? (
                <div className="space-y-3">
                  {filteredFollowing.map(follow => (
                    <FollowerCard
                      key={follow.id}
                      user={follow}
                      type="following"
                      showFollowButton={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800 rounded-lg">
                  <UserPlus className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Not following anyone yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Discover traders to follow in the Discover tab
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div>
              {suggestions.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {suggestions.map(suggestion => (
                    <SuggestionCard
                      key={suggestion.user_id}
                      suggestion={suggestion}
                      onDismiss={handleDismissSuggestion}
                      onFollowChange={handleFollowChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800 rounded-lg">
                  <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No suggestions available</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Check back later for new trader recommendations
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {(activeTab === 'followers' || activeTab === 'following') && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-slate-400">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => activeTab === 'followers' ? loadFollowers(pagination.page - 1) : loadFollowing(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => activeTab === 'followers' ? loadFollowers(pagination.page + 1) : loadFollowing(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default FollowersPage
