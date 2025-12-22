import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

const ChallengeStatus = ({ challenge }) => {
  const { t } = useTranslation()

  if (!challenge) {
    return (
      <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
        <div className="text-center py-8">
          <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('dashboard.noActiveChallenge')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('dashboard.purchaseChallenge')}
          </p>
        </div>
      </div>
    )
  }

  const profitPct = challenge.profit_percentage || 0
  const totalDrawdown = challenge.total_drawdown || 0
  const isProfit = profitPct > 0
  const dailyLossLimit = 5
  const totalLossLimit = 10
  const profitTarget = 10

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'text-green-500 bg-green-500/10'
      case 'failed':
        return 'text-red-500 bg-red-500/10'
      default:
        return 'text-blue-500 bg-blue-500/10'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle size={20} />
      case 'failed':
        return <XCircle size={20} />
      default:
        return <TrendingUp size={20} />
    }
  }

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Challenge {challenge.plan_type?.toUpperCase()}
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(challenge.status)}`}>
          {getStatusIcon(challenge.status)}
          <span className="text-sm font-medium capitalize">
            {t(`status.${challenge.status}`)}
          </span>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500 dark:text-gray-400">{t('dashboard.balance')}</span>
          <span className={`flex items-center gap-1 ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
            {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}%
          </span>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          ${parseFloat(challenge.current_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Initial: ${parseFloat(challenge.initial_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {/* Profit Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500">{t('pricing.features.target')} ({profitTarget}%)</span>
            <span className={`text-sm font-medium ${profitPct >= profitTarget ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
              {profitPct.toFixed(2)}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-dark-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                profitPct >= profitTarget ? 'bg-green-500' : 'bg-primary-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, (profitPct / profitTarget) * 100))}%` }}
            />
          </div>
        </div>

        {/* Daily Loss */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500">{t('dashboard.dailyLoss')} (max {dailyLossLimit}%)</span>
            <span className={`text-sm font-medium ${Math.abs(totalDrawdown) >= dailyLossLimit ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
              {totalDrawdown.toFixed(2)}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-dark-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                Math.abs(totalDrawdown) >= dailyLossLimit ? 'bg-red-500' :
                Math.abs(totalDrawdown) >= dailyLossLimit * 0.7 ? 'bg-yellow-500' : 'bg-gray-400'
              }`}
              style={{ width: `${Math.min(100, Math.abs(totalDrawdown / dailyLossLimit) * 100)}%` }}
            />
          </div>
        </div>

        {/* Total Drawdown */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500">{t('dashboard.totalDrawdown')} (max {totalLossLimit}%)</span>
            <span className={`text-sm font-medium ${totalDrawdown >= totalLossLimit ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
              {totalDrawdown.toFixed(2)}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-dark-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalDrawdown >= totalLossLimit ? 'bg-red-500' :
                totalDrawdown >= totalLossLimit * 0.7 ? 'bg-yellow-500' : 'bg-gray-400'
              }`}
              style={{ width: `${Math.min(100, (totalDrawdown / totalLossLimit) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Warning messages */}
      {challenge.status === 'active' && (
        <div className="mt-4 space-y-2">
          {totalDrawdown >= totalLossLimit * 0.7 && totalDrawdown < totalLossLimit && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-500">
              <AlertTriangle size={18} />
              <span className="text-sm">Attention: Vous approchez de la limite de perte!</span>
            </div>
          )}
          {profitPct >= profitTarget * 0.8 && profitPct < profitTarget && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-500">
              <TrendingUp size={18} />
              <span className="text-sm">Excellent! Vous etes proche de l'objectif!</span>
            </div>
          )}
        </div>
      )}

      {challenge.status === 'failed' && challenge.failure_reason && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 text-red-500">
          <div className="flex items-center gap-2">
            <XCircle size={18} />
            <span className="text-sm font-medium">Raison: {challenge.failure_reason}</span>
          </div>
        </div>
      )}

      {challenge.status === 'passed' && (
        <div className="mt-4 p-3 rounded-lg bg-green-500/10 text-green-500">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">Felicitations! Vous avez reussi le challenge!</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChallengeStatus
