import { Link } from 'react-router-dom'
import { Sparkles, TrendingUp, Target, Trophy, Users, CheckCircle, Calendar, Flame, Gift, ChevronRight, Star } from 'lucide-react'

const PointsActivitiesPage = () => {
  const activities = [
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Sparkles className="text-yellow-400" size={24} />
            </div>
            Infinity Points - Activities
          </h1>
          <p className="text-gray-400 mt-1">Discover ways to earn points and level up</p>
        </div>
        <Link
          to="/infinity-points/profile"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          View My Points
          <ChevronRight size={18} />
        </Link>
      </div>

      {/* Quick Nav */}
      <div className="flex gap-2">
        <Link
          to="/infinity-points"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium"
        >
          Activities
        </Link>
        <Link
          to="/infinity-points/profile"
          className="px-4 py-2 bg-dark-100 text-gray-400 hover:text-white rounded-lg font-medium transition-colors"
        >
          My Points
        </Link>
        <Link
          to="/infinity-points/history"
          className="px-4 py-2 bg-dark-100 text-gray-400 hover:text-white rounded-lg font-medium transition-colors"
        >
          History
        </Link>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((activity, idx) => (
          <div
            key={idx}
            className="bg-dark-100 rounded-xl border border-dark-200 p-5 hover:border-primary-500/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${activity.bg} rounded-xl flex items-center justify-center`}>
                <activity.icon className={activity.color} size={24} />
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/10 rounded-full">
                <Star className="text-yellow-400" size={14} />
                <span className="text-yellow-400 font-bold text-sm">+{activity.points}</span>
              </div>
            </div>
            <h3 className="font-semibold text-white mb-1">{activity.title}</h3>
            <p className="text-sm text-gray-400">{activity.description}</p>
            {activity.oneTime && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded">
                One-time only
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-xl border border-primary-500/30 p-6">
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
  )
}

export default PointsActivitiesPage
