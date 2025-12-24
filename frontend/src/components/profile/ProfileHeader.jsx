import { useState } from 'react'
import {
  User, MapPin, Calendar, Shield, Edit2, Camera,
  TrendingUp, Users, Copy, CheckCircle, ExternalLink
} from 'lucide-react'

const TRADING_STYLES = {
  scalper: { label: 'Scalper', color: 'text-red-400' },
  day_trader: { label: 'Day Trader', color: 'text-orange-400' },
  swing_trader: { label: 'Swing Trader', color: 'text-blue-400' },
  position_trader: { label: 'Position Trader', color: 'text-green-400' }
}

const ProfileHeader = ({
  profile,
  statistics,
  isOwnProfile = false,
  onEditProfile,
  isFollowing = false,
  onFollowToggle
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)

  const tradingStyle = TRADING_STYLES[profile?.trading_style] || { label: 'Trader', color: 'text-gray-400' }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'Unknown'

  const tradingSince = profile?.trading_since
    ? new Date(profile.trading_since).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-slate-800 via-cyan-900 to-slate-800 relative overflow-hidden">
        {profile?.cover_image_url && (
          <img
            src={profile.cover_image_url}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

        {isOwnProfile && (
          <button
            onClick={() => onEditProfile?.('cover')}
            className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-white transition-colors"
          >
            <Camera className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Profile Content */}
      <div className="relative px-4 md:px-8 pb-6">
        {/* Avatar */}
        <div className="absolute -top-16 left-4 md:left-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-slate-900 bg-slate-800 overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                  onLoad={() => setImageLoaded(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>

            {profile?.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1.5 border-2 border-slate-900">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}

            {isOwnProfile && (
              <button
                onClick={() => onEditProfile?.('avatar')}
                className="absolute bottom-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-full text-white transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 md:pt-4 md:ml-40">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Name and Details */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">
                  {profile?.display_name || 'Trader'}
                </h1>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${tradingStyle.color} bg-slate-800`}>
                  {tradingStyle.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
                {profile?.country && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.country}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Member since {memberSince}
                </div>
                {tradingSince && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Trading since {tradingSince}
                  </div>
                )}
              </div>

              {profile?.bio && (
                <p className="text-slate-300 max-w-xl mb-4">
                  {profile.bio}
                </p>
              )}

              {/* Badges */}
              {profile?.badges && profile.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.badges.slice(0, 5).map((badge, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-full text-xs text-slate-300"
                      title={badge}
                    >
                      <Shield className="w-3 h-3 text-cyan-400" />
                      {badge.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {profile.badges.length > 5 && (
                    <span className="text-xs text-slate-400">
                      +{profile.badges.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {/* Preferred Pairs */}
              {profile?.preferred_pairs && profile.preferred_pairs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.preferred_pairs.map((pair, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300"
                    >
                      {pair}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions and Stats */}
            <div className="flex flex-col items-start md:items-end gap-4">
              {/* Social Stats */}
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-xl font-bold text-white">
                    {profile?.follower_count || 0}
                  </div>
                  <div className="text-xs text-slate-400">Followers</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">
                    {profile?.following_count || 0}
                  </div>
                  <div className="text-xs text-slate-400">Following</div>
                </div>
                {profile?.allow_copy_trading && (
                  <div>
                    <div className="text-xl font-bold text-white">
                      {profile?.copier_count || 0}
                    </div>
                    <div className="text-xs text-slate-400">Copiers</div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <button
                    onClick={() => onEditProfile?.('profile')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={onFollowToggle}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isFollowing
                          ? 'bg-slate-700 hover:bg-slate-600 text-white'
                          : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    {profile?.allow_copy_trading && (
                      <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors">
                        <Copy className="w-4 h-4" />
                        Copy Trader
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
