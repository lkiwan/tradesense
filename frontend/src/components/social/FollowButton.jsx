import { useState, useEffect } from 'react'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

const FollowButton = ({
  userId,
  initialFollowing = false,
  onFollowChange,
  size = 'md',
  showText = true,
  className = ''
}) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsFollowing(initialFollowing)
  }, [initialFollowing])

  const handleToggleFollow = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      if (isFollowing) {
        await api.delete(`/api/follow/${userId}`)
        setIsFollowing(false)
        toast.success('Unfollowed')
        onFollowChange?.(false)
      } else {
        await api.post(`/api/follow/${userId}`)
        setIsFollowing(true)
        toast.success('Following')
        onFollowChange?.(true)
      }
    } catch (error) {
      console.error('Follow error:', error)
      toast.error(error.response?.data?.error || 'Failed to update follow status')
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`
        flex items-center justify-center gap-2 rounded-lg font-medium transition-all
        ${sizeClasses[size]}
        ${isFollowing
          ? 'bg-slate-700 hover:bg-red-600 text-white group'
          : 'bg-cyan-500 hover:bg-cyan-600 text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : isFollowing ? (
        <>
          <UserMinus className={`${iconSizes[size]} hidden group-hover:block`} />
          <UserPlus className={`${iconSizes[size]} group-hover:hidden`} />
        </>
      ) : (
        <UserPlus className={iconSizes[size]} />
      )}
      {showText && (
        <span className={isFollowing ? 'group-hover:hidden' : ''}>
          {isFollowing ? 'Following' : 'Follow'}
        </span>
      )}
      {showText && isFollowing && (
        <span className="hidden group-hover:inline text-red-100">
          Unfollow
        </span>
      )}
    </button>
  )
}

export default FollowButton
