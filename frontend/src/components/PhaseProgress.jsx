import { useChallenge } from '../context/ChallengeContext'
import {
  Trophy, Target, CheckCircle, Clock, Zap,
  TrendingUp, Star, DollarSign
} from 'lucide-react'

const PhaseProgress = ({ showDetails = true }) => {
  const { challenge, getCurrentPhaseInfo, isFunded } = useChallenge()

  if (!challenge) return null

  const phaseInfo = getCurrentPhaseInfo()
  const progress = challenge.progress_to_target || 0
  const profitPercentage = challenge.profit_percentage || 0

  // Phase steps for the timeline
  const phases = [
    { key: 'trial', label: 'Essai', icon: Clock },
    { key: 'evaluation', label: 'Phase 1', icon: Target },
    { key: 'verification', label: 'Phase 2', icon: TrendingUp },
    { key: 'funded', label: 'Funde', icon: Trophy }
  ]

  const getCurrentPhaseIndex = () => {
    const phase = challenge.phase
    return phases.findIndex(p => p.key === phase)
  }

  const currentIndex = getCurrentPhaseIndex()

  // Color based on phase
  const getPhaseColor = () => {
    switch (challenge.phase) {
      case 'trial': return 'blue'
      case 'evaluation': return 'purple'
      case 'verification': return 'orange'
      case 'funded': return 'green'
      default: return 'primary'
    }
  }

  const color = getPhaseColor()

  return (
    <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-lg overflow-hidden">
      {/* Phase Header */}
      <div className={`bg-gradient-to-r ${
        color === 'blue' ? 'from-blue-500 to-blue-600' :
        color === 'purple' ? 'from-purple-500 to-purple-600' :
        color === 'orange' ? 'from-orange-500 to-orange-600' :
        'from-green-500 to-green-600'
      } p-6 text-white`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              {isFunded ? <Trophy size={24} /> : <Target size={24} />}
            </div>
            <div>
              <h3 className="text-lg font-bold">{phaseInfo?.name || challenge.phase_display}</h3>
              <p className="text-sm text-white/80">
                {phaseInfo?.description}
              </p>
            </div>
          </div>
          {isFunded && (
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Star className="text-yellow-300" size={18} />
              <span className="font-semibold">Funded Trader</span>
            </div>
          )}
        </div>

        {/* Progress Bar (only for non-funded) */}
        {!isFunded && phaseInfo?.target && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progression vers {phaseInfo.target}%</span>
              <span className="font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-white/70">
              <span>Profit actuel: {profitPercentage.toFixed(2)}%</span>
              <span>Objectif: {phaseInfo.target}%</span>
            </div>
          </div>
        )}

        {/* Funded Account Stats */}
        {isFunded && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-sm text-white/70">Profits totaux</div>
              <div className="text-xl font-bold flex items-center gap-1">
                <DollarSign size={20} />
                {(challenge.total_profit_earned || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-sm text-white/70">Retirable (80%)</div>
              <div className="text-xl font-bold flex items-center gap-1">
                <DollarSign size={20} />
                {(challenge.withdrawable_profit || 0).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Phase Timeline */}
      {showDetails && (
        <div className="p-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 dark:bg-dark-200 rounded-full" />
            <div
              className={`absolute top-5 left-0 h-1 rounded-full transition-all duration-500 ${
                color === 'blue' ? 'bg-blue-500' :
                color === 'purple' ? 'bg-purple-500' :
                color === 'orange' ? 'bg-orange-500' :
                'bg-green-500'
              }`}
              style={{ width: `${(currentIndex / (phases.length - 1)) * 100}%` }}
            />

            {/* Phase dots */}
            <div className="relative flex justify-between">
              {phases.map((phase, index) => {
                const Icon = phase.icon
                const isCompleted = index < currentIndex
                const isCurrent = index === currentIndex
                const isPending = index > currentIndex

                return (
                  <div key={phase.key} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? `${
                        color === 'blue' ? 'bg-blue-500' :
                        color === 'purple' ? 'bg-purple-500' :
                        color === 'orange' ? 'bg-orange-500' :
                        'bg-green-500'
                      } text-white ring-4 ring-opacity-30 ${
                        color === 'blue' ? 'ring-blue-500' :
                        color === 'purple' ? 'ring-purple-500' :
                        color === 'orange' ? 'ring-orange-500' :
                        'ring-green-500'
                      }` :
                      'bg-gray-200 dark:bg-dark-200 text-gray-400 dark:text-gray-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle size={20} />
                      ) : (
                        <Icon size={18} />
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${
                      isCurrent ? 'text-gray-900 dark:text-white' :
                      isCompleted ? 'text-green-500' :
                      'text-gray-400 dark:text-gray-600'
                    }`}>
                      {phase.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Phase Rules Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-dark-200 rounded-xl">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Zap size={18} className={
                color === 'blue' ? 'text-blue-500' :
                color === 'purple' ? 'text-purple-500' :
                color === 'orange' ? 'text-orange-500' :
                'text-green-500'
              } />
              Regles de la phase
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Objectif profit</div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {isFunded ? 'Aucun' : `+${phaseInfo?.target}%`}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Perte max/jour</div>
                <div className="font-bold text-red-500">-5%</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Perte max totale</div>
                <div className="font-bold text-red-500">-10%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhaseProgress
