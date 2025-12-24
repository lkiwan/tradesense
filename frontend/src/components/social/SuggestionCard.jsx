import { Link } from 'react-router-dom'
import { User, TrendingUp, CheckCircle, X } from 'lucide-react'
import FollowButton from './FollowButton'

const REASONS = {
  top_performer: 'Top Performer',
  similar_style: 'Similar Style',
  popular: 'Popular Trader'
}

const SuggestionCard = ({
  suggestion,
  onDismiss,
  onFollowChange
}) => {
  const { profile, statistics, user_id, reason } = suggestion

  if (!profile) return null

  return (
    <div className="bg-slate-800 rounded-lg p-4 relative">
      {/* Dismiss Button */}
      <button
        onClick={() => onDismiss?.(user_id)}
        className="absolute top-2 right-2 p-1 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <Link to={`/trader/${user_id}`} className="block">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative mb-2">
            <div className="w-16 h-16 rounded-full bg-slate-700 overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            {profile.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <h4 className="font-medium text-white text-center truncate max-w-full">
            {profile.display_name}
          </h4>

          <span className="text-xs text-cyan-400 mt-1">
            {REASONS[reason] || 'Suggested'}
          </span>
        </div>

        {/* Stats */}
        {statistics && (
          <div className="grid grid-cols-2 gap-2 mb-4 text-center">
            <div className="bg-slate-700/50 rounded p-2">
              <div className={`text-lg font-bold ${
                statistics.win_rate >= 50 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {statistics.win_rate?.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400">Win Rate</div>
            </div>
            <div className="bg-slate-700/50 rounded p-2">
              <div className={`text-lg font-bold ${
                statistics.net_profit >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${Math.abs(statistics.net_profit || 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400">Profit</div>
            </div>
          </div>
        )}
      </Link>

      {/* Follow Button */}
      <FollowButton
        userId={user_id}
        initialFollowing={false}
        size="sm"
        className="w-full"
        onFollowChange={(following) => onFollowChange?.(user_id, following)}
      />
    </div>
  )
}

export default SuggestionCard
