import { useState, useEffect, useCallback } from 'react'
import { rateLimitState } from '../services/api'

/**
 * Hook to track rate limit status and provide countdown
 */
export function useRateLimit() {
  const [isLimited, setIsLimited] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [endpoint, setEndpoint] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleRateLimitExceeded = (event) => {
      const { retryAfter, endpoint: limitedEndpoint, message: errorMessage } = event.detail
      setIsLimited(true)
      setCountdown(retryAfter)
      setEndpoint(limitedEndpoint)
      setMessage(errorMessage)
    }

    window.addEventListener('rateLimitExceeded', handleRateLimitExceeded)
    return () => window.removeEventListener('rateLimitExceeded', handleRateLimitExceeded)
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!isLimited || countdown <= 0) {
      if (countdown <= 0 && isLimited) {
        setIsLimited(false)
        setEndpoint(null)
        setMessage('')
      }
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsLimited(false)
          setEndpoint(null)
          setMessage('')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isLimited, countdown])

  const formatCountdown = useCallback((seconds) => {
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }, [])

  const checkRateLimit = useCallback(() => {
    return rateLimitState.isLimited
  }, [])

  return {
    isLimited,
    countdown,
    formattedCountdown: formatCountdown(countdown),
    endpoint,
    message,
    checkRateLimit
  }
}

/**
 * Hook to check if a specific endpoint is rate limited
 */
export function useEndpointRateLimit(targetEndpoint) {
  const { isLimited, countdown, formattedCountdown, endpoint, message } = useRateLimit()

  const isEndpointLimited = isLimited && endpoint?.includes(targetEndpoint)

  return {
    isLimited: isEndpointLimited,
    countdown,
    formattedCountdown,
    message
  }
}

export default useRateLimit
