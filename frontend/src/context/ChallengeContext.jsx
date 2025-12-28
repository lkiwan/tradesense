import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { challengesAPI } from '../services/api'

const ChallengeContext = createContext()

export const ChallengeProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch active challenge on mount and when auth changes
  const fetchChallenge = useCallback(async () => {
    if (!isAuthenticated) {
      setChallenge(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await challengesAPI.getActive()
      setChallenge(response.data.challenge)
    } catch (err) {
      // 404 means no active challenge, which is valid
      if (err.response?.status === 404) {
        setChallenge(null)
      } else {
        console.error('Error fetching challenge:', err)
        setError(err.response?.data?.error || 'Failed to fetch challenge')
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchChallenge()
  }, [fetchChallenge])

  // Refresh challenge data
  const refetch = useCallback(() => {
    return fetchChallenge()
  }, [fetchChallenge])

  // Update balance directly (for immediate feedback after trade close)
  const updateBalance = useCallback((newBalance) => {
    if (challenge) {
      setChallenge(prev => ({
        ...prev,
        current_balance: newBalance
      }))
    }
  }, [challenge])

  // Computed values
  const hasActiveChallenge = !!challenge && ['active', 'funded'].includes(challenge.status)
  const isFunded = challenge?.is_funded || challenge?.phase === 'funded'
  const currentPhase = challenge?.phase || null
  const isTrialActive = challenge?.is_trial && !challenge?.is_trial_expired

  // Phase display helpers
  const phaseInfo = {
    trial: {
      name: 'Essai Gratuit',
      color: 'blue',
      target: 10,
      description: '7 jours pour atteindre 10% de profit'
    },
    evaluation: {
      name: 'Phase 1: Evaluation',
      color: 'purple',
      target: 10,
      description: 'Atteignez 10% de profit pour passer en Phase 2'
    },
    verification: {
      name: 'Phase 2: Verification',
      color: 'orange',
      target: 5,
      description: 'Atteignez 5% de profit pour etre funde'
    },
    funded: {
      name: 'Compte Funde',
      color: 'green',
      target: null,
      description: 'Tradez et gagnez 80% de vos profits'
    }
  }

  const getCurrentPhaseInfo = () => {
    if (!currentPhase) return null
    return phaseInfo[currentPhase] || phaseInfo.evaluation
  }

  // Access control helpers
  const canAccessDashboard = hasActiveChallenge
  const canStartTrial = isAuthenticated && !challenge
  const canAccessTrading = hasActiveChallenge

  const value = {
    // Challenge data
    challenge,
    loading,
    error,

    // Status checks
    hasActiveChallenge,
    isFunded,
    currentPhase,
    isTrialActive,

    // Phase info
    phaseInfo,
    getCurrentPhaseInfo,

    // Access control
    canAccessDashboard,
    canStartTrial,
    canAccessTrading,

    // Actions
    refetch,
    updateBalance
  }

  return (
    <ChallengeContext.Provider value={value}>
      {children}
    </ChallengeContext.Provider>
  )
}

export const useChallenge = () => {
  const context = useContext(ChallengeContext)
  if (!context) {
    throw new Error('useChallenge must be used within a ChallengeProvider')
  }
  return context
}

export default ChallengeContext
