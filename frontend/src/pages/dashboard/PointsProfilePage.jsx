import { Link } from 'react-router-dom'
import { Sparkles, Star, Award, TrendingUp, ChevronRight, Crown, Medal, Gem, Zap } from 'lucide-react'

const PointsProfilePage = () => {
  const userPoints = {
    total: 1250,
    lifetime: 2500,
    level: 'Silver',
    nextLevel: 'Gold',
    pointsToNext: 750
  }

  const levels = [
    { name: 'Bronze', min: 0, max: 500, icon: Medal, color: 'text-amber-600', bg: 'bg-amber-600/10' },
    { name: 'Silver', min: 501, max: 2000, icon: Medal, color: 'text-gray-300', bg: 'bg-gray-300/10' },
    { name: 'Gold', min: 2001, max: 5000, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { name: 'Platinum', min: 5001, max: 10000, icon: Gem, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { name: 'Diamond', min: 10001, max: Infinity, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/10' }
  ]

  const currentLevel = levels.find(l => userPoints.lifetime >= l.min && userPoints.lifetime <= l.max) || levels[0]
  const nextLevel = levels[levels.indexOf(currentLevel) + 1]
  const progress = nextLevel ? ((userPoints.lifetime - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100

  const badges = [
    { name: 'First Trade', icon: TrendingUp, earned: true, date: '2024-01-01' },
    { name: 'Profit Master', icon: Award, earned: true, date: '2024-01-10' },
    { name: 'Funded Trader', icon: Crown, earned: false },
    { name: 'Top 10', icon: Star, earned: false }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Sparkles className="text-yellow-400" size={24} />
          </div>
          Infinity Points - My Points
        </h1>
        <p className="text-gray-400 mt-1">Track your points balance and level progress</p>
      </div>

      {/* Quick Nav */}
      <div className="flex gap-2">
        <Link
          to="/infinity-points"
          className="px-4 py-2 bg-dark-100 text-gray-400 hover:text-white rounded-lg font-medium transition-colors"
        >
          Activities
        </Link>
        <Link
          to="/infinity-points/profile"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Points Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-2xl border border-primary-500/30 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 ${currentLevel.bg} rounded-2xl flex items-center justify-center`}>
              <currentLevel.icon className={currentLevel.color} size={32} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Current Level</p>
              <p className={`text-2xl font-bold ${currentLevel.color}`}>{currentLevel.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-dark-100/50 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Available Points</p>
              <p className="text-3xl font-bold text-white">{userPoints.total.toLocaleString()}</p>
            </div>
            <div className="bg-dark-100/50 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Lifetime Earned</p>
              <p className="text-3xl font-bold text-yellow-400">{userPoints.lifetime.toLocaleString()}</p>
            </div>
          </div>

          {/* Progress to Next Level */}
          {nextLevel && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Progress to {nextLevel.name}</span>
                <span className="text-sm text-gray-400">{userPoints.pointsToNext} points to go</span>
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
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-5">
          <h3 className="font-semibold text-white mb-4">Level Tiers</h3>
          <div className="space-y-3">
            {levels.map((level, idx) => (
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
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
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
  )
}

export default PointsProfilePage
