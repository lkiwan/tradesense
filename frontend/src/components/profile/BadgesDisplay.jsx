import { Shield, Lock, Award, Sparkles } from 'lucide-react'

const BADGE_COLORS = {
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30'
}

const BADGE_CATEGORIES = {
  milestone: { label: 'Milestones', icon: Award },
  achievement: { label: 'Achievements', icon: Sparkles },
  special: { label: 'Special', icon: Shield }
}

const BadgeCard = ({ badge, earned = false, showDetails = false }) => {
  const colorClass = BADGE_COLORS[badge.color] || BADGE_COLORS.blue

  return (
    <div
      className={`relative rounded-lg border p-4 transition-all ${
        earned
          ? `${colorClass}`
          : 'bg-slate-800/50 text-slate-500 border-slate-700'
      }`}
    >
      {!earned && (
        <div className="absolute top-2 right-2">
          <Lock className="w-4 h-4 text-slate-600" />
        </div>
      )}

      <div className="text-3xl mb-2">{badge.icon}</div>
      <div className={`font-medium ${earned ? '' : 'text-slate-400'}`}>
        {badge.name}
      </div>
      {showDetails && (
        <p className={`text-xs mt-1 ${earned ? 'opacity-80' : 'text-slate-500'}`}>
          {badge.description}
        </p>
      )}
    </div>
  )
}

const BadgesDisplay = ({
  badges = [],
  earnedCount = 0,
  showAll = false,
  onShowAll
}) => {
  if (!badges || badges.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No badges available.</p>
      </div>
    )
  }

  // Group badges by category
  const groupedBadges = badges.reduce((acc, badge) => {
    const category = badge.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(badge)
    return acc
  }, {})

  // Earned badges first
  const earnedBadges = badges.filter(b => b.earned)
  const unearnedBadges = badges.filter(b => !b.earned)

  // Display limited or all
  const displayBadges = showAll ? badges : earnedBadges.slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Award className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Badges</h3>
            <p className="text-sm text-slate-400">
              {earnedCount} of {badges.length} earned
            </p>
          </div>
        </div>

        {!showAll && earnedBadges.length > 6 && (
          <button
            onClick={onShowAll}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View all badges
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${(earnedCount / badges.length) * 100}%` }}
        />
      </div>

      {showAll ? (
        // Grouped by category
        Object.entries(groupedBadges).map(([category, categoryBadges]) => {
          const categoryInfo = BADGE_CATEGORIES[category] || { label: category, icon: Shield }
          const CategoryIcon = categoryInfo.icon

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <CategoryIcon className="w-4 h-4 text-slate-400" />
                <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                  {categoryInfo.label}
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoryBadges.map((badge, index) => (
                  <BadgeCard
                    key={badge.code || index}
                    badge={badge}
                    earned={badge.earned}
                    showDetails={true}
                  />
                ))}
              </div>
            </div>
          )
        })
      ) : (
        // Simple grid of earned badges
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayBadges.map((badge, index) => (
            <BadgeCard
              key={badge.code || index}
              badge={badge}
              earned={badge.earned}
              showDetails={false}
            />
          ))}
        </div>
      )}

      {/* Locked badges hint */}
      {!showAll && unearnedBadges.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-400 justify-center">
          <Lock className="w-4 h-4" />
          <span>{unearnedBadges.length} more badges to unlock</span>
        </div>
      )}
    </div>
  )
}

export default BadgesDisplay
