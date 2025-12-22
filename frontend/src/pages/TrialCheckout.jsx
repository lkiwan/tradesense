import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { subscriptionsAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Shield, Clock, DollarSign, Zap,
  Loader2, AlertCircle, CreditCard, Check, Gift
} from 'lucide-react'

const TrialCheckout = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get('plan') || 'starter')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/free-trial')
      return
    }
    fetchPlans()
  }, [isAuthenticated])

  const fetchPlans = async () => {
    try {
      const response = await subscriptionsAPI.getPlans()
      setPlans(response.data.plans)
    } catch (err) {
      console.error('Error fetching plans:', err)
      setPlans([
        { key: 'starter', name: 'Starter', price: 200, initial_balance: 5000 },
        { key: 'pro', name: 'Pro', price: 500, initial_balance: 25000 },
        { key: 'elite', name: 'Elite', price: 1000, initial_balance: 100000 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleStartTrial = async () => {
    setProcessing(true)
    setError(null)

    try {
      const returnUrl = `${window.location.origin}/checkout/trial/confirm`
      const cancelUrl = `${window.location.origin}/checkout/trial?plan=${selectedPlan}&cancelled=true`

      const response = await subscriptionsAPI.startTrial(selectedPlan, returnUrl, cancelUrl)

      if (response.data.approval_url) {
        // Redirect to PayPal for authorization
        toast.success('Redirection vers PayPal...')
        window.location.href = response.data.approval_url
      } else {
        throw new Error('No PayPal approval URL received')
      }
    } catch (err) {
      console.error('Trial start error:', err)
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to start trial'
      setError(errorMessage)
      toast.error(errorMessage)
      setProcessing(false)
    }
  }

  const selectedPlanData = plans.find(p => p.key === selectedPlan) || plans[0]

  // Check if cancelled from PayPal
  useEffect(() => {
    if (searchParams.get('cancelled') === 'true') {
      toast.error('Autorisation PayPal annulee')
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/free-trial')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Retour
        </button>

        {/* Trial Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-primary-500 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Gift size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">Essai Gratuit 7 Jours</h1>
              <p className="text-white/80">
                Testez TradeSense avec $5,000 de capital virtuel
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl overflow-hidden">
          {/* Plan Selection */}
          <div className="p-6 border-b border-gray-200 dark:border-dark-200">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Plan apres l'essai
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key)}
                  disabled={processing}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedPlan === plan.key
                      ? 'border-primary-500 bg-primary-500/5'
                      : 'border-gray-200 dark:border-dark-200 hover:border-gray-300'
                  } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    {plan.name}
                  </div>
                  <div className="text-primary-500 font-bold">${plan.price}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Resume de la commande
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Gift size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Essai Gratuit</div>
                    <div className="text-sm text-gray-500">7 jours - $5,000 capital</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-green-500">$0</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                    <DollarSign size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Plan {selectedPlanData?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Facture apres 7 jours - ${selectedPlanData?.initial_balance?.toLocaleString()} capital
                    </div>
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  ${selectedPlanData?.price}
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-xl mb-6">
              <CreditCard size={24} className="text-blue-500" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Paiement via PayPal</div>
                <div className="text-sm text-gray-500">
                  Vous serez redirige vers PayPal pour autoriser le paiement futur
                </div>
              </div>
            </div>

            {/* Today's Total */}
            <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-dark-200 rounded-xl mb-6">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Total aujourd'hui
              </span>
              <span className="text-2xl font-bold text-green-500">$0</span>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check size={16} className="text-green-500" />
                <span>7 jours gratuits</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check size={16} className="text-green-500" />
                <span>Annulez a tout moment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check size={16} className="text-green-500" />
                <span>$5,000 capital virtuel</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check size={16} className="text-green-500" />
                <span>Acces complet</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleStartTrial}
              disabled={processing}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-primary-500 hover:from-blue-600 hover:to-primary-600 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Redirection vers PayPal...
                </>
              ) : (
                <>
                  <Zap size={24} />
                  Continuer avec PayPal
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              En cliquant, vous acceptez nos conditions d'utilisation.
              Vous ne serez pas facture aujourd'hui.
            </p>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
              <Shield size={16} />
              <span>Paiement securise via PayPal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrialCheckout
