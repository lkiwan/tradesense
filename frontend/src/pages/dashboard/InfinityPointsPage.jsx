import { useState, useEffect } from 'react'
import {
  Sparkles, TrendingUp, TrendingDown, Target, Trophy, Users, CheckCircle, Calendar,
  Flame, Gift, Star, Award, Crown, Medal, Gem, Zap, Clock, RefreshCw, DollarSign,
  Percent, ShoppingBag, Search, Filter, Loader2, Package, ChevronRight, X, AlertCircle, Check
} from 'lucide-react'
import api from '../../services/api'

// Tab definitions
const TABS = [
  { id: 'activities', label: 'Activities', icon: Sparkles },
  { id: 'points', label: 'My Points', icon: Star },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'rewards', label: 'Rewards Store', icon: Gift }
]

// Activities data
const ACTIVITIES = [
  { icon: TrendingUp, title: 'Complete a Trade', points: 10, description: 'Open and close any trade', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: CheckCircle, title: 'Profitable Trading Day', points: 25, description: 'End the day in profit', color: 'text-green-400', bg: 'bg-green-500/10' },
  { icon: Target, title: 'Pass Phase 1', points: 500, description: 'Complete evaluation phase', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: Target, title: 'Pass Phase 2', points: 500, description: 'Complete verification phase', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { icon: Trophy, title: 'Get Funded', points: 1000, description: 'Become a funded trader', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { icon: Users, title: 'Refer a Friend', points: 200, description: 'When they make a purchase', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { icon: CheckCircle, title: 'Complete Profile', points: 50, description: 'Fill in all profile details', color: 'text-pink-400', bg: 'bg-pink-500/10', oneTime: true },
  { icon: Flame, title: 'Trading Streak', points: 50, description: '5 consecutive trading days', color: 'text-red-400', bg: 'bg-red-500/10' },
  { icon: Calendar, title: 'Daily Login', points: 5, description: 'Log in daily to earn', color: 'text-indigo-400', bg: 'bg-indigo-500/10' }
]

// Levels data
const LEVELS = [
  { name: 'Bronze', min: 0, max: 500, icon: Medal, color: 'text-amber-600', bg: 'bg-amber-600/10' },
  { name: 'Silver', min: 501, max: 2000, icon: Medal, color: 'text-gray-300', bg: 'bg-gray-300/10' },
  { name: 'Gold', min: 2001, max: 5000, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { name: 'Platinum', min: 5001, max: 10000, icon: Gem, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { name: 'Diamond', min: 10001, max: Infinity, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/10' }
]

// Rewards category info
const CATEGORY_INFO = {
  discount: { name: 'Discounts', icon: Percent, color: 'text-green-400', bg: 'bg-green-500/20' },
  free_extension: { name: 'Extensions', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  free_reset: { name: 'Resets', icon: RefreshCw, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  subscription: { name: 'Subscriptions', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  cash_bonus: { name: 'Cash Bonus', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  merchandise: { name: 'Merchandise', icon: ShoppingBag, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  exclusive: { name: 'Exclusive', icon: Award, color: 'text-orange-400', bg: 'bg-orange-500/20' }
}

const LEVEL_COLORS = {
  Bronze: 'text-amber-600',
  Silver: 'text-gray-400',
  Gold: 'text-yellow-400',
  Platinum: 'text-cyan-400',
  Diamond: 'text-purple-400'
}

const InfinityPointsPage = () => {
  const [activeTab, setActiveTab] = useState('activities')
  const [loading, setLoading] = useState(false)

  // Points state
  const [userPoints, setUserPoints] = useState({ total: 1250, lifetime: 2500 })
  const [userLevel, setUserLevel] = useState('Silver')

  // History state
  const [historyFilter, setHistoryFilter] = useState('all')
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'earned', points: 10, description: 'Trade completed - AAPL', date: '2024-01-15 14:32' },
    { id: 2, type: 'earned', points: 25, description: 'Profitable trading day', date: '2024-01-15 23:59' },
    { id: 3, type: 'earned', points: 10, description: 'Trade completed - BTC-USD', date: '2024-01-14 10:15' },
    { id: 4, type: 'earned', points: 500, description: 'Passed Phase 1', date: '2024-01-13 16:00' },
    { id: 5, type: 'earned', points: 200, description: 'Referral converted - John', date: '2024-01-12 09:30' },
    { id: 6, type: 'earned', points: 5, description: 'Daily login bonus', date: '2024-01-12 08:00' },
    { id: 7, type: 'earned', points: 50, description: 'Profile completed', date: '2024-01-11 12:00' },
    { id: 8, type: 'earned', points: 10, description: 'Trade completed - TSLA', date: '2024-01-10 15:45' }
  ])

  // Rewards state
  const [rewards, setRewards] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [selectedReward, setSelectedReward] = useState(null)
  const [redeeming, setRedeeming] = useState(false)
  const [rewardsTab, setRewardsTab] = useState('catalog')
  const [shippingForm, setShippingForm] = useState({
    name: '', address: '', city: '', state: '', zip: '', country: '', phone: ''
  })

  // Badges data
  const badges = [
    { name: 'First Trade', icon: TrendingUp, earned: true, date: '2024-01-01' },
    { name: 'Profit Master', icon: Award, earned: true, date: '2024-01-10' },
    { name: 'Funded Trader', icon: Crown, earned: false },
    { name: 'Top 10', icon: Star, earned: false }
  ]

  useEffect(() => {
    if (activeTab === 'rewards') {
      fetchRewardsData()
    }
  }, [activeTab])

  const fetchRewardsData = async () => {
    try {
      setLoading(true)
      const [rewardsRes, redemptionsRes, balanceRes] = await Promise.all([
        api.get('/points/rewards'),
        api.get('/points/redemptions'),
        api.get('/points/balance')
      ])
      setRewards(rewardsRes.data.rewards || [])
      setRedemptions(redemptionsRes.data.redemptions || [])
      setUserPoints({ total: balanceRes.data.total_points || 1250, lifetime: 2500 })
      setUserLevel(balanceRes.data.level || 'Silver')
    } catch (error) {
      console.error('Error fetching rewards data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!selectedReward) return
    try {
      setRedeeming(true)
      const payload = { reward_id: selectedReward.id }
      if (selectedReward.requires_shipping) {
        payload.shipping_address = shippingForm
      }
      await api.post('/points/redeem', payload)
      setShowRedeemModal(false)
      setSelectedReward(null)
      setShippingForm({ name: '', address: '', city: '', state: '', zip: '', country: '', phone: '' })
      fetchRewardsData()
    } catch (error) {
      console.error('Error redeeming reward:', error)
      alert(error.response?.data?.error || 'Failed to redeem reward')
    } finally {
      setRedeeming(false)
    }
  }

  // Computed values
  const currentLevel = LEVELS.find(l => userPoints.lifetime >= l.min && userPoints.lifetime <= l.max) || LEVELS[0]
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1]
  const progress = nextLevel ? ((userPoints.lifetime - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100
  const pointsToNext = nextLevel ? nextLevel.min - userPoints.lifetime : 0

  const filteredTransactions = historyFilter === 'all'
    ? transactions
    : transactions.filter(t => t.type === historyFilter)

  const filteredRewards = rewards.filter(reward => {
    const matchesCategory = selectedCategory === 'all' || reward.category === selectedCategory
    const matchesSearch = reward.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reward.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalEarned = transactions.filter(t => t.type === 'earned').reduce((sum, t) => sum + t.points, 0)
  const totalSpent = transactions.filter(t => t.type === 'spent').reduce((sum, t) => sum + t.points, 0)

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      processing: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
      failed: 'bg-red-500/20 text-red-400'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
              <Sparkles className="text-yellow-400" size={24} />
            </div>
            Infinity Points
          </h1>
          <p className="text-gray-400 mt-1">Earn points, level up, and unlock exclusive rewards</p>
        </div>

        {/* Points Summary */}
        <div className="flex items-center gap-3">
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl px-5 py-3 border border-white/5">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Balance</div>
            <div className="text-xl font-bold text-yellow-400 flex items-center gap-1">
              <Star size={16} />
              {userPoints.total.toLocaleString()}
            </div>
          </div>
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl px-5 py-3 border border-white/5">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Level</div>
            <div className={`text-xl font-bold ${currentLevel.color}`}>
              {currentLevel.name}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-dark-100/80 backdrop-blur-xl rounded-xl p-1.5 border border-white/5 overflow-x-auto">
        {TABS.map(tab => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              <IconComponent size={16} />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACTIVITIES.map((activity, idx) => (
              <div
                key={idx}
                className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-5 hover:border-primary-500/30 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${activity.bg} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <activity.icon className={activity.color} size={24} />
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                    <Star className="text-yellow-400" size={14} />
                    <span className="text-yellow-400 font-bold text-sm">+{activity.points}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">{activity.title}</h3>
                <p className="text-sm text-gray-400">{activity.description}</p>
                {activity.oneTime && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded border border-gray-500/20">
                    One-time only
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 backdrop-blur-xl rounded-xl border border-primary-500/30 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Gift className="text-primary-400" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Maximize Your Points</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    Trade consistently to build up your points quickly
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    Complete your profile to earn a one-time 50 point bonus
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    Refer friends to earn 200 points per successful referral
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Points Tab */}
      {activeTab === 'points' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Points Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-primary-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-primary-500/30 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 ${currentLevel.bg} rounded-2xl flex items-center justify-center border border-white/10`}>
                  <currentLevel.icon className={currentLevel.color} size={32} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Current Level</p>
                  <p className={`text-2xl font-bold ${currentLevel.color}`}>{currentLevel.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-dark-100/50 rounded-xl p-4 border border-white/5">
                  <p className="text-sm text-gray-400 mb-1">Available Points</p>
                  <p className="text-3xl font-bold text-white">{userPoints.total.toLocaleString()}</p>
                </div>
                <div className="bg-dark-100/50 rounded-xl p-4 border border-white/5">
                  <p className="text-sm text-gray-400 mb-1">Lifetime Earned</p>
                  <p className="text-3xl font-bold text-yellow-400">{userPoints.lifetime.toLocaleString()}</p>
                </div>
              </div>

              {nextLevel && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Progress to {nextLevel.name}</span>
                    <span className="text-sm text-gray-400">{pointsToNext} points to go</span>
                  </div>
                  <div className="h-3 bg-dark-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Levels */}
            <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-5">
              <h3 className="font-semibold text-white mb-4">Level Tiers</h3>
              <div className="space-y-3">
                {LEVELS.map((level) => (
                  <div
                    key={level.name}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      level.name === currentLevel.name ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-dark-200/50'
                    }`}
                  >
                    <level.icon className={level.color} size={20} />
                    <div className="flex-1">
                      <p className={`font-medium ${level.name === currentLevel.name ? 'text-white' : 'text-gray-400'}`}>
                        {level.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {level.max === Infinity ? `${level.min.toLocaleString()}+` : `${level.min.toLocaleString()} - ${level.max.toLocaleString()}`}
                      </p>
                    </div>
                    {level.name === currentLevel.name && (
                      <span className="px-2 py-0.5 bg-primary-500 text-white text-xs font-medium rounded">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="text-yellow-400" size={20} />
              Badges & Achievements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl text-center ${
                    badge.earned
                      ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30'
                      : 'bg-dark-200/50 opacity-50'
                  }`}
                >
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                    badge.earned ? 'bg-yellow-500/20' : 'bg-dark-300'
                  }`}>
                    <badge.icon className={badge.earned ? 'text-yellow-400' : 'text-gray-500'} size={24} />
                  </div>
                  <p className={`font-medium ${badge.earned ? 'text-white' : 'text-gray-500'}`}>{badge.name}</p>
                  {badge.earned && badge.date && (
                    <p className="text-xs text-gray-400 mt-1">Earned {badge.date}</p>
                  )}
                  {!badge.earned && (
                    <p className="text-xs text-gray-500 mt-1">Locked</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Earned</p>
                  <p className="text-2xl font-bold text-green-500">+{totalEarned.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <TrendingDown className="text-red-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Spent</p>
                  <p className="text-2xl font-bold text-red-500">-{totalSpent.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              {['all', 'earned', 'spent'].map(f => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    historyFilter === f
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-dark-200 text-gray-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search transactions..."
                className="bg-dark-200/50 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary-500/50 outline-none w-48"
              />
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center">
                  <Sparkles className="mx-auto text-gray-500 mb-4" size={48} />
                  <p className="text-gray-400">No transactions found</p>
                </div>
              ) : (
                filteredTransactions.map(transaction => (
                  <div key={transaction.id} className="p-4 flex items-center gap-4 hover:bg-dark-200/30 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transaction.type === 'earned' ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      {transaction.type === 'earned' ? (
                        <TrendingUp className="text-green-500" size={20} />
                      ) : (
                        <TrendingDown className="text-red-500" size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{transaction.date}</p>
                    </div>
                    <div className={`font-bold ${transaction.type === 'earned' ? 'text-green-500' : 'text-red-500'}`}>
                      {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rewards Store Tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <>
              {/* Sub-tabs */}
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setRewardsTab('catalog')}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    rewardsTab === 'catalog'
                      ? 'text-primary-400 border-b-2 border-primary-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Gift className="w-4 h-4 inline-block mr-2" />
                  Rewards Catalog
                </button>
                <button
                  onClick={() => setRewardsTab('redemptions')}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    rewardsTab === 'redemptions'
                      ? 'text-primary-400 border-b-2 border-primary-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4 inline-block mr-2" />
                  Redemption History
                </button>
              </div>

              {rewardsTab === 'catalog' ? (
                <>
                  {/* Search and Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search rewards..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-dark-100/80 border border-white/5 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                          selectedCategory === 'all'
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-100/80 text-gray-400 hover:text-white'
                        }`}
                      >
                        All
                      </button>
                      {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                        const IconComponent = info.icon
                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                              selectedCategory === key
                                ? 'bg-primary-500 text-white'
                                : 'bg-dark-100/80 text-gray-400 hover:text-white'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                            {info.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Rewards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRewards.map(reward => {
                      const categoryInfo = CATEGORY_INFO[reward.category] || CATEGORY_INFO.exclusive
                      const IconComponent = categoryInfo.icon
                      const canAfford = userPoints.total >= reward.points_cost
                      const meetsLevel = reward.can_redeem

                      return (
                        <div
                          key={reward.id}
                          className={`bg-dark-100/80 backdrop-blur-xl rounded-xl p-5 border transition-all ${
                            canAfford && meetsLevel
                              ? 'border-white/5 hover:border-primary-500/30 cursor-pointer'
                              : 'border-white/5 opacity-60'
                          }`}
                          onClick={() => canAfford && meetsLevel && setSelectedReward(reward) && setShowRedeemModal(true)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-lg ${categoryInfo.bg} flex items-center justify-center`}>
                              <IconComponent className={`w-6 h-6 ${categoryInfo.color}`} />
                            </div>
                            {reward.stock !== null && (
                              <span className="text-xs text-gray-500 bg-dark-200/50 px-2 py-1 rounded">
                                {reward.remaining_stock} left
                              </span>
                            )}
                          </div>

                          <h3 className="font-semibold text-white mb-2">{reward.name}</h3>
                          <p className="text-sm text-gray-400 mb-4">{reward.description}</p>

                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`text-lg font-bold flex items-center gap-1 ${canAfford ? 'text-yellow-400' : 'text-gray-500'}`}>
                                <Star className="w-4 h-4" />
                                {reward.points_cost?.toLocaleString()}
                              </span>
                              <span className={`text-xs block ${LEVEL_COLORS[reward.level_required]}`}>
                                {reward.level_required} required
                              </span>
                            </div>

                            {!meetsLevel ? (
                              <span className="text-xs text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                Level locked
                              </span>
                            ) : !canAfford ? (
                              <span className="text-xs text-gray-500">
                                Need {(reward.points_cost - userPoints.total).toLocaleString()} more
                              </span>
                            ) : (
                              <button className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors">
                                Redeem
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {filteredRewards.length === 0 && (
                    <div className="text-center py-12">
                      <Gift className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No rewards found matching your criteria</p>
                    </div>
                  )}
                </>
              ) : (
                /* Redemption History */
                <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5">
                  {redemptions.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No redemptions yet</p>
                      <p className="text-sm text-gray-500">Start redeeming rewards to see them here</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Reward</th>
                            <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Points</th>
                            <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Status</th>
                            <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Code</th>
                            <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {redemptions.map(redemption => (
                            <tr key={redemption.id} className="border-b border-white/5 hover:bg-dark-200/30">
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-white">{redemption.reward_name}</p>
                                  <p className="text-sm text-gray-500">{redemption.reward_category}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-yellow-400 font-medium flex items-center gap-1">
                                  <Star className="w-4 h-4" />
                                  {redemption.points_spent?.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {getStatusBadge(redemption.status)}
                              </td>
                              <td className="px-6 py-4">
                                {redemption.redemption_code && !redemption.code_used ? (
                                  <code className="bg-dark-200/50 px-2 py-1 rounded text-sm text-green-400">
                                    {redemption.redemption_code}
                                  </code>
                                ) : redemption.redemption_code && redemption.code_used ? (
                                  <span className="text-gray-500 text-sm">Used</span>
                                ) : (
                                  <span className="text-gray-500 text-sm">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-gray-400 text-sm">
                                {new Date(redemption.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Redeem Modal */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-xl border border-dark-200 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Redeem Reward</h2>
                <button
                  onClick={() => setShowRedeemModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-lg ${CATEGORY_INFO[selectedReward.category]?.bg || 'bg-dark-200'} flex items-center justify-center flex-shrink-0`}>
                  {(() => {
                    const IconComponent = CATEGORY_INFO[selectedReward.category]?.icon || Gift
                    return <IconComponent className={`w-8 h-8 ${CATEGORY_INFO[selectedReward.category]?.color || 'text-gray-400'}`} />
                  })()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedReward.name}</h3>
                  <p className="text-gray-400">{selectedReward.description}</p>
                </div>
              </div>

              <div className="bg-dark-200/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Points Required</span>
                  <span className="text-yellow-400 font-bold flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {selectedReward.points_cost?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-400">Your Balance</span>
                  <span className="text-white font-medium">{userPoints.total.toLocaleString()}</span>
                </div>
                <div className="border-t border-white/5 mt-3 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">After Redemption</span>
                    <span className="text-green-400 font-medium">
                      {(userPoints.total - selectedReward.points_cost).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {selectedReward.requires_shipping && (
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Shipping Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={shippingForm.name}
                        onChange={(e) => setShippingForm({...shippingForm, name: e.target.value})}
                        className="w-full px-3 py-2 bg-dark-200/50 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary-500/50"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Address</label>
                      <input
                        type="text"
                        value={shippingForm.address}
                        onChange={(e) => setShippingForm({...shippingForm, address: e.target.value})}
                        className="w-full px-3 py-2 bg-dark-200/50 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">City</label>
                      <input
                        type="text"
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm({...shippingForm, city: e.target.value})}
                        className="w-full px-3 py-2 bg-dark-200/50 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Country</label>
                      <input
                        type="text"
                        value={shippingForm.country}
                        onChange={(e) => setShippingForm({...shippingForm, country: e.target.value})}
                        className="w-full px-3 py-2 bg-dark-200/50 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary-500/50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-dark-200 flex gap-3">
              <button
                onClick={() => setShowRedeemModal(false)}
                className="flex-1 px-4 py-3 bg-dark-200/50 text-white font-medium rounded-lg hover:bg-dark-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="flex-1 px-4 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {redeeming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirm Redemption
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InfinityPointsPage
