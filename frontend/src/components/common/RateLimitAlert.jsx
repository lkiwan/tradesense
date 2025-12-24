import { useRateLimit } from '../../hooks/useRateLimit'
import { AlertTriangle, Clock } from 'lucide-react'

/**
 * Component to display rate limit warnings
 * Shows a countdown when rate limits are hit
 */
const RateLimitAlert = ({ className = '' }) => {
  const { isLimited, formattedCountdown, message } = useRateLimit()

  if (!isLimited) return null

  return (
    <div className={`bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <AlertTriangle className="text-yellow-400" size={20} />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-yellow-400 mb-1">Rate Limit Exceeded</h4>
          <p className="text-sm text-gray-300">
            {message || 'Too many requests. Please wait before trying again.'}
          </p>
          <div className="flex items-center gap-2 mt-2 text-yellow-400">
            <Clock size={16} />
            <span className="text-sm font-medium">
              Retry in: {formattedCountdown}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline rate limit warning for forms
 */
export const RateLimitInline = ({ isLimited, countdown, className = '' }) => {
  if (!isLimited) return null

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className={`flex items-center gap-2 text-yellow-400 text-sm ${className}`}>
      <Clock size={14} />
      <span>Please wait {formatTime(countdown)} before trying again</span>
    </div>
  )
}

/**
 * Button wrapper that disables during rate limiting
 */
export const RateLimitButton = ({
  children,
  isLimited,
  countdown,
  onClick,
  className = '',
  ...props
}) => {
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <button
      onClick={onClick}
      disabled={isLimited}
      className={`${className} ${isLimited ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {isLimited ? (
        <span className="flex items-center gap-2">
          <Clock size={14} />
          Wait {formatTime(countdown)}
        </span>
      ) : children}
    </button>
  )
}

export default RateLimitAlert
