import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { paymentsAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  CreditCard, Wallet, Bitcoin, Loader2,
  CheckCircle, ArrowLeft, Shield, Gift, Clock, Zap
} from 'lucide-react'

const Checkout = () => {
  const { t } = useTranslation()
  const { planType } = useParams()
  const navigate = useNavigate()

  const [plan, setPlan] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cmi')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isTrial, setIsTrial] = useState(false)

  useEffect(() => {
    fetchPlan()
  }, [planType])

  const fetchPlan = async () => {
    try {
      const response = await paymentsAPI.getPlans()
      const plans = response.data.plans
      if (plans[planType]) {
        const fetchedPlan = { ...plans[planType], type: planType }
        setPlan(fetchedPlan)
        setIsTrial(planType === 'trial' || fetchedPlan.is_trial || fetchedPlan.price === 0)
      } else {
        toast.error('Plan not found')
        navigate('/pricing')
      }
    } catch (error) {
      console.error('Error fetching plan:', error)
      // Use default plan
      const defaultPlans = {
        trial: { price: 0, initial_balance: 5000, name: 'Free Trial', is_trial: true, trial_days: 7 },
        starter: { price: 200, initial_balance: 5000, name: 'Starter' },
        pro: { price: 500, initial_balance: 25000, name: 'Pro' },
        elite: { price: 1000, initial_balance: 100000, name: 'Elite' }
      }
      if (defaultPlans[planType]) {
        const defaultPlan = { ...defaultPlans[planType], type: planType }
        setPlan(defaultPlan)
        setIsTrial(planType === 'trial' || defaultPlan.is_trial || defaultPlan.price === 0)
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setProcessing(true)

    try {
      if (isTrial) {
        // For trial, just call checkout - it handles everything
        const response = await paymentsAPI.createCheckout(planType, 'free')

        if (response.data.is_trial) {
          setSuccess(true)
          toast.success('Essai gratuit active avec succes!')
          setTimeout(() => {
            navigate('/dashboard')
          }, 2000)
        }
      } else {
        // Regular payment flow
        const checkoutRes = await paymentsAPI.createCheckout(planType, paymentMethod)
        const paymentId = checkoutRes.data.payment_id

        // Process payment (simulated)
        const processRes = await paymentsAPI.processPayment(paymentId)

        setSuccess(true)
        toast.success(t('checkout.success'))

        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || error.response?.data?.error || t('checkout.error'))
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-300 px-4">
        <div className="text-center max-w-sm">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 ${isTrial ? 'bg-blue-500' : 'bg-green-500'} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse`}>
            <CheckCircle className="text-white" size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isTrial ? 'Essai Gratuit Active!' : t('checkout.success')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm sm:text-base">
            {isTrial
              ? `Vous avez 7 jours pour tester TradeSense avec $${plan?.initial_balance?.toLocaleString()}`
              : 'Votre challenge a ete active avec succes!'
            }
          </p>
          <p className="text-gray-400 text-xs sm:text-sm">
            Redirection vers le dashboard...
          </p>
        </div>
      </div>
    )
  }

  const paymentMethods = [
    {
      id: 'cmi',
      name: 'Carte Bancaire (CMI)',
      icon: CreditCard,
      description: 'Visa, Mastercard, CMI'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: Wallet,
      description: 'Paiement securise PayPal'
    },
    {
      id: 'crypto',
      name: 'Crypto',
      icon: Bitcoin,
      description: 'BTC, ETH, USDT'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 py-6 sm:py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(isTrial ? '/free-trial' : '/pricing')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 sm:mb-8 transition-colors min-h-[44px] touch-manipulation"
        >
          <ArrowLeft size={20} />
          <span className="text-sm sm:text-base">{isTrial ? 'Retour' : 'Retour aux tarifs'}</span>
        </button>

        {/* Trial Banner */}
        {isTrial && (
          <div className="bg-gradient-to-r from-blue-500 to-primary-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-white">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <Gift size={24} className="sm:w-8 sm:h-8" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1">Essai Gratuit 7 Jours</h2>
                <p className="text-white/80 text-sm sm:text-base">
                  Testez TradeSense sans risque avec ${plan?.initial_balance?.toLocaleString()} de capital virtuel
                </p>
              </div>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 ${isTrial ? '' : 'lg:grid-cols-2'} gap-4 sm:gap-6 lg:gap-8`}>
          {/* Order Summary */}
          <div className="bg-white dark:bg-dark-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 h-fit">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              {isTrial ? 'Details de l\'Essai Gratuit' : 'Resume de la Commande'}
            </h2>

            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-dark-200 rounded-lg sm:rounded-xl mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  {isTrial ? 'Type' : 'Challenge'}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                  {isTrial && <Gift size={14} className="text-blue-500 sm:w-4 sm:h-4" />}
                  {plan?.name}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Solde Initial</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                  ${plan?.initial_balance?.toLocaleString()}
                </span>
              </div>
              {isTrial && (
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Duree</span>
                  <span className="font-semibold text-blue-500 flex items-center gap-1 text-sm sm:text-base">
                    <Clock size={14} className="sm:w-4 sm:h-4" />
                    7 jours
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Objectif</span>
                <span className="font-semibold text-green-500 text-sm sm:text-base">+10%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Perte Max</span>
                <span className="font-semibold text-red-500 text-sm sm:text-base">-10%</span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-dark-200 pt-3 sm:pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">Total</span>
                {isTrial ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 line-through text-sm sm:text-lg">$200</span>
                    <span className="font-bold text-xl sm:text-2xl text-green-500">GRATUIT</span>
                  </div>
                ) : (
                  <span className="font-bold text-xl sm:text-2xl text-primary-500">
                    ${plan?.price}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <Shield size={14} className="flex-shrink-0 sm:w-4 sm:h-4" />
              <span>{isTrial ? 'Aucune carte bancaire requise' : 'Paiement securise et crypte'}</span>
            </div>

            {/* For Trial - Show CTA here */}
            {isTrial && (
              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full mt-4 sm:mt-6 py-3.5 sm:py-4 bg-gradient-to-r from-blue-500 to-primary-500 hover:from-blue-600 hover:to-primary-600 text-white rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 min-h-[52px] sm:min-h-[56px] touch-manipulation active:scale-[0.98]"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-sm sm:text-base">Activation en cours...</span>
                  </>
                ) : (
                  <>
                    <Zap size={20} className="sm:w-6 sm:h-6" />
                    <span>Activer Mon Essai Gratuit</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Payment Methods - Only for paid plans */}
          {!isTrial && (
            <div className="bg-white dark:bg-dark-100 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                {t('checkout.selectMethod')}
              </h2>

              <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all min-h-[60px] sm:min-h-[72px] touch-manipulation ${
                        paymentMethod === method.id
                          ? 'border-primary-500 bg-primary-500/5'
                          : 'border-gray-200 dark:border-dark-200 hover:border-gray-300 dark:hover:border-dark-100'
                      }`}
                    >
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === method.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-dark-200 text-gray-600 dark:text-gray-400'
                      }`}>
                        <Icon size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                          {method.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                          {method.description}
                        </div>
                      </div>
                      {paymentMethod === method.id && (
                        <CheckCircle className="text-primary-500 flex-shrink-0" size={20} />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full py-3.5 sm:py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] sm:min-h-[56px] touch-manipulation active:scale-[0.98]"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-sm sm:text-base">{t('checkout.processing')}</span>
                  </>
                ) : (
                  <span>Payer ${plan?.price}</span>
                )}
              </button>

              <p className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2">
                En cliquant sur Payer, vous acceptez nos conditions d'utilisation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Checkout
