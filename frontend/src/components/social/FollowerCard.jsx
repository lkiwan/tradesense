import { Link } from 'react-router-dom'
import { User, TrendingUp, CheckCircle } from 'lucide-react'
import FollowButton from './FollowButton'

const TRADING_STYLES = {
  scalper: 'Scalper',
  day_trader: 'Day Trader',
  swing_trader: 'Swing Trader',
  position_trader: 'Position Trader'
}

const FollowerCard = ({
  user,
  type = 'follower', // 'follower' or 'following'
  showFollowButton = true,
  onFollowChange
}) => {
  const profile = type === 'follower' ? user.follower_profile : user.following_profile
  const userId = type === 'follower' ? user.follower_id : user.following_id

  if (!profile) return null

  return (
    <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between hover:bg-slate-750 transition-colors">
      <Link
        to={`/trader/${userId}`}
        className="flex items-center gap-4 flex-1"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          {profile.is_verified && (
            <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-0.5">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">
              {profile.display_name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {profile.trading_style && (
              <span>{TRADING_STYLES[profile.trading_style] || profile.trading_style}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Follow Button */}
      {showFollowButton && type === 'follower' && (
        <FollowButton
          userId={userId}
          initialFollowing={false}
          size="sm"
          onFollowChange={(following) => onFollowChange?.(userId, following)}
        />
      )}
    </div>
  )
}

export default FollowerCard
