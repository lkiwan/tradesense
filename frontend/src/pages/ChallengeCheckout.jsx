import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { challengeModelsAPI, paymentsAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Shield, Zap, Loader2, CreditCard, Wallet, Bitcoin,
  CheckCircle, Target, TrendingDown, Calendar, Award, Brain, Star
} from 'lucide-react'

// AI Tiers Configuration
const AI_TIERS = {
  starter: { name: 'IA Starter', color: 'text-gray-400', accuracy: '72%' },
  basic: { name: 'IA Basic', color: 'text-blue-400', accuracy: '78%' },
  advanced: { name: 'IA Advanced', color: 'text-purple-400', accuracy: '85%' },
  pro: { name: 'IA Pro', color: 'text-orange-400', accuracy: '91%' },
  elite: { name: 'IA Elite', color: 'text-yellow-400', accuracy: '96%' }
}

const getAiTierForBalance = (balance) => {
  if (balance >= 200000) return 'elite'
  if (balance >= 100000) return 'pro'
  if (balance >= 50000) return 'advanced'
  if (balance >= 25000) return 'basic'
  return 'starter'
}

const ChallengeCheckout = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [model, setModel] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cmi')

  const modelId = searchParams.get('model')
  const sizeId = searchParams.get('size')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/challenge-checkout?model=${modelId}&size=${sizeId}`)
      return
    }
    fetchModelAndSize()
  }, [isAuthenticated, modelId, sizeId])

  const fetchModelAndSize = async () => {
    try {
      if (!modelId || !sizeId) {
        toast.error('Paramètres de challenge manquants')
        navigate('/plans')
        return
      }

      // Fetch model with sizes
      const response = await challengeModelsAPI.getById(modelId)
      const modelData = response.data

      if (!modelData) {
        toast.error('Challenge non trouvé')
        navigate('/plans')
        return
      }

      setModel(modelData)

      // Find the selected size
      const size = modelData.account_sizes?.find(s => s.id === parseInt(sizeId))
      if (!size) {
        toast.error('Taille de compte non trouvée')
        navigate('/plans')
        return
      }

      setSelectedSize(size)
    } catch (error) {
      console.error('Error fetching challenge:', error)
      toast.error('Erreur lors du chargement du challenge')
      navigate('/plans')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setProcessing(true)

    try {
      // Create challenge purchase
      const response = await paymentsAPI.createChallengeCheckout({
        model_id: model.id,
        size_id: selectedSize.id,
        payment_method: paymentMethod
      })

      // Check for PayPal approval URL
      if (response.data.paypal_approval_url) {
        toast.loading('Redirection vers PayPal...')
        window.location.href = response.data.paypal_approval_url
        return
      }

      // Check for generic payment URL (crypto, etc.)
      if (response.data.payment_url) {
        window.location.href = response.data.payment_url
        return
      }

      // Direct success (CMI card payments)
      if (response.data.success) {
        setSuccess(true)
        toast.success('Challenge activé avec succès!')
        setTimeout(() => {
          navigate('/accounts')
        }, 2000)
      } else {
        throw new Error('Payment initiation failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.error || 'Erreur lors du paiement')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-300 flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-dark-300 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse">
            <CheckCircle className="text-white" size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Challenge Activé!</h2>
          <p className="text-gray-400 mb-4 text-sm sm:text-base">
            Votre challenge {model?.display_name} de ${selectedSize?.balance?.toLocaleString()} a été activé.
          </p>
          <p className="text-gray-500 text-xs sm:text-sm">Redirection vers vos comptes...</p>
        </div>
      </div>
    )
  }

  if (!model || !selectedSize) {
    return (
      <div className="min-h-screen bg-dark-300 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-400 text-sm sm:text-base">Challenge non trouvé</p>
          <button
            onClick={() => navigate('/plans')}
            className="mt-4 px-5 sm:px-6 py-2.5 sm:py-2 bg-primary-500 text-white rounded-lg text-sm sm:text-base min-h-[44px] touch-manipulation"
          >
            Retour aux plans
          </button>
        </div>
      </div>
    )
  }

  const aiTier = AI_TIERS[getAiTierForBalance(selectedSize.balance)]
  const price = selectedSize.is_on_sale ? selectedSize.sale_price : selectedSize.price
  const phase1Target = (selectedSize.balance * model.phase1_profit_target) / 100
  const phase2Target = model.phase2_profit_target ? (selectedSize.balance * model.phase2_profit_target) / 100 : null
  const dailyLoss = (selectedSize.balance * model.max_daily_loss) / 100
  const maxLoss = (selectedSize.balance * model.max_overall_loss) / 100

  const paymentMethods = [
    { id: 'cmi', name: 'Carte Bancaire (CMI)', icon: CreditCard, description: 'Visa, Mastercard' },
    { id: 'paypal', name: 'PayPal', icon: Wallet, description: 'Paiement sécurisé PayPal' },
    { id: 'crypto', name: 'Crypto', icon: Bitcoin, description: 'BTC, ETH, USDT' }
  ]

  return (
    <div className="min-h-screen bg-dark-300 py-6 sm:py-8 lg:py-12">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/plans')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 sm:mb-8 transition-colors min-h-[44px] touch-manipulation"
        >
          <ArrowLeft size={20} />
          <span className="text-sm sm:text-base">Retour aux plans</span>
        </button>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
            Finaliser votre achat
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            {model.display_name} - Compte ${selectedSize.balance.toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Order Summary */}
          <div className="bg-dark-100 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <Target className="text-primary-500 flex-shrink-0" size={20} />
              <span>Résumé de la Commande</span>
            </h2>

            {/* Challenge Info */}
            <div className="bg-dark-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-gray-400 text-sm sm:text-base">Challenge</span>
                <span className="font-semibold text-white text-sm sm:text-base">{model.display_name}</span>
              </div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-gray-400 text-sm sm:text-base">Capital</span>
                <span className="font-bold text-white text-base sm:text-lg">${selectedSize.balance.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-gray-400 flex items-center gap-1 text-sm sm:text-base">
                  <Brain size={14} className="flex-shrink-0" />
                  <span>Intelligence IA</span>
                </span>
                <span className={`font-semibold text-sm sm:text-base ${aiTier.color}`}>{aiTier.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm sm:text-base">Précision IA</span>
                <span className={`font-bold text-sm sm:text-base ${aiTier.color}`}>{aiTier.accuracy}</span>
              </div>
            </div>

            {/* Challenge Rules */}
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-dark-200/50 rounded-lg">
                <span className="text-gray-400 text-xs sm:text-sm">Objectif Phase 1</span>
                <span className="text-green-400 font-semibold text-xs sm:text-sm">
                  ${phase1Target.toLocaleString()} ({model.phase1_profit_target}%)
                </span>
              </div>
              {phase2Target && (
                <div className="flex items-center justify-between p-2.5 sm:p-3 bg-dark-200/50 rounded-lg">
                  <span className="text-gray-400 text-xs sm:text-sm">Objectif Phase 2</span>
                  <span className="text-green-400 font-semibold text-xs sm:text-sm">
                    ${phase2Target.toLocaleString()} ({model.phase2_profit_target}%)
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-dark-200/50 rounded-lg">
                <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1">
                  <TrendingDown size={12} className="sm:w-[14px] sm:h-[14px] flex-shrink-0" />
                  <span>Perte Max Journalière</span>
                </span>
                <span className="text-orange-400 font-semibold text-xs sm:text-sm">
                  ${dailyLoss.toLocaleString()} ({model.max_daily_loss}%)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-dark-200/50 rounded-lg">
                <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1">
                  <TrendingDown size={12} className="sm:w-[14px] sm:h-[14px] flex-shrink-0" />
                  <span>Perte Max Totale</span>
                </span>
                <span className="text-red-400 font-semibold text-xs sm:text-sm">
                  ${maxLoss.toLocaleString()} ({model.max_overall_loss}%)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-dark-200/50 rounded-lg">
                <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1">
                  <Calendar size={12} className="sm:w-[14px] sm:h-[14px] flex-shrink-0" />
                  <span>Jours Min. de Trading</span>
                </span>
                <span className="text-white font-semibold text-xs sm:text-sm">{model.phase1_min_days || 0} jours</span>
              </div>
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-dark-200/50 rounded-lg">
                <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1">
                  <Award size={12} className="sm:w-[14px] sm:h-[14px] flex-shrink-0" />
                  <span>Partage des Profits</span>
                </span>
                <span className="text-primary-400 font-semibold text-xs sm:text-sm">{model.default_profit_split}%</span>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-dark-200 pt-3 sm:pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-base sm:text-lg">Total à payer</span>
                <div className="text-right">
                  {selectedSize.is_on_sale && (
                    <span className="text-gray-500 line-through text-xs sm:text-sm mr-2">
                      €{selectedSize.price.toLocaleString()}
                    </span>
                  )}
                  <span className="font-bold text-xl sm:text-2xl text-primary-500">
                    €{price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-4 sm:mt-6 flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <Shield size={14} className="text-green-500 flex-shrink-0 sm:w-4 sm:h-4" />
              <span>Paiement sécurisé • Remboursement 100% garanti</span>
            </div>

            {/* Expected Reward */}
            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-400 text-xs sm:text-sm">
                <Star size={14} className="flex-shrink-0 sm:w-4 sm:h-4" />
                <span className="font-semibold">
                  Récompense potentielle: €{Math.round(selectedSize.balance * 0.05).toLocaleString()}/mois
                </span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-dark-100 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <CreditCard className="text-primary-500 flex-shrink-0" size={20} />
              <span>Mode de Paiement</span>
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
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-200 hover:border-dark-100'
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === method.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-200 text-gray-400'
                    }`}>
                      <Icon size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium text-white text-sm sm:text-base truncate">{method.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">{method.description}</div>
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
              className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25 min-h-[52px] sm:min-h-[56px] touch-manipulation active:scale-[0.98]"
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-sm sm:text-base">Traitement en cours...</span>
                </>
              ) : (
                <>
                  <Zap size={20} className="sm:w-6 sm:h-6" />
                  <span>Payer €{price.toLocaleString()}</span>
                </>
              )}
            </button>

            <p className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-500 px-2">
              En cliquant sur Payer, vous acceptez nos{' '}
              <a href="/terms" className="text-primary-400 hover:underline">conditions d'utilisation</a>
            </p>

            {/* Features List */}
            <div className="mt-6 sm:mt-8 space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-2.5 sm:gap-3 text-gray-400 text-xs sm:text-sm">
                <CheckCircle size={14} className="text-green-500 flex-shrink-0 sm:w-4 sm:h-4" />
                <span>Activation instantanée du compte</span>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-3 text-gray-400 text-xs sm:text-sm">
                <CheckCircle size={14} className="text-green-500 flex-shrink-0 sm:w-4 sm:h-4" />
                <span>Accès immédiat aux signaux IA</span>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-3 text-gray-400 text-xs sm:text-sm">
                <CheckCircle size={14} className="text-green-500 flex-shrink-0 sm:w-4 sm:h-4" />
                <span>Support prioritaire 24/7</span>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-3 text-gray-400 text-xs sm:text-sm">
                <CheckCircle size={14} className="text-green-500 flex-shrink-0 sm:w-4 sm:h-4" />
                <span>Période de trading illimitée</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChallengeCheckout
