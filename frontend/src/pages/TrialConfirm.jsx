import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { subscriptionsAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  CheckCircle, XCircle, Loader2, ArrowRight, AlertCircle,
  Gift, Clock, DollarSign, Zap
} from 'lucide-react'

const TrialConfirm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()

  const [status, setStatus] = useState('processing') // processing, success, error
  const [error, setError] = useState(null)
  const [trialData, setTrialData] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setError('Token PayPal manquant')
      return
    }

    confirmTrial(token)
  }, [isAuthenticated, searchParams])

  const confirmTrial = async (token) => {
    try {
      const response = await subscriptionsAPI.confirmTrial(token)
      setTrialData(response.data)
      setStatus('success')
      toast.success('Essai gratuit active avec succes!')

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard')
      }, 3000)
    } catch (err) {
      console.error('Trial confirmation error:', err)
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to activate trial'
      setError(errorMessage)
      setStatus('error')
      toast.error(errorMessage)
    }
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-300 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="animate-spin text-white" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Activation en cours...
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Configuration de votre essai gratuit
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-300 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="text-white" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Echec de l'activation
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {error || 'Une erreur est survenue lors de l\'activation de votre essai'}
            </p>

            <div className="space-y-3">
              <Link
                to="/free-trial"
                className="flex items-center justify-center gap-2 w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all"
              >
                <Zap size={20} />
                Reessayer
              </Link>
              <Link
                to="/pricing"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all"
              >
                Voir les plans
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-primary-500 p-8 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Essai Gratuit Active!
            </h2>
            <p className="text-white/80">
              Votre compte de trading est pret
            </p>
          </div>

          {/* Trial Details */}
          <div className="p-6">
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-200 rounded-xl">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Gift size={24} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Capital de depart
                  </div>
                  <div className="text-2xl font-bold text-primary-500">$5,000</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-200 rounded-xl">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Clock size={24} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Duree de l'essai
                  </div>
                  <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    7 jours
                  </div>
                </div>
              </div>

              {trialData?.selected_plan && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-200 rounded-xl">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <DollarSign size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Plan selectionne
                    </div>
                    <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                      {trialData.selected_plan.charAt(0).toUpperCase() + trialData.selected_plan.slice(1)}
                      {trialData.plan_price && ` - $${trialData.plan_price} apres l'essai`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl mb-6">
              <AlertCircle size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vous recevrez un email de confirmation. Vous pouvez annuler a tout moment
                avant la fin de l'essai pour eviter d'etre facture.
              </p>
            </div>

            {/* CTA */}
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-blue-500 to-primary-500 hover:from-blue-600 hover:to-primary-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg"
            >
              <Zap size={24} />
              Commencer a Trader
              <ArrowRight size={24} />
            </Link>

            <p className="text-center text-sm text-gray-500 mt-4">
              Redirection automatique dans quelques secondes...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrialConfirm
