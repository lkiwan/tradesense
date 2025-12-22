import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { subscriptionsAPI } from '../services/api'
import {
  Zap, Clock, DollarSign, TrendingUp, Check,
  Shield, Sparkles, ArrowRight, AlertCircle,
  Gift, Target, BarChart3, Users, CreditCard
} from 'lucide-react'

const FreeTrial = () => {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [trialStatus, setTrialStatus] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState('starter')
  const [plans, setPlans] = useState([])

  useEffect(() => {
    fetchPlans()
    if (isAuthenticated) {
      checkTrialStatus()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const fetchPlans = async () => {
    try {
      const response = await subscriptionsAPI.getPlans()
      setPlans(response.data.plans)
    } catch (err) {
      console.error('Error fetching plans:', err)
      // Use default plans
      setPlans([
        { key: 'starter', name: 'Starter', price: 200, initial_balance: 5000 },
        { key: 'pro', name: 'Pro', price: 500, initial_balance: 25000 },
        { key: 'elite', name: 'Elite', price: 1000, initial_balance: 100000 }
      ])
    }
  }

  const checkTrialStatus = async () => {
    try {
      const response = await subscriptionsAPI.getStatus()
      setTrialStatus(response.data)
    } catch (err) {
      console.error('Error checking trial status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTrial = () => {
    if (!isAuthenticated) {
      navigate(`/register?trial=true&plan=${selectedPlan}`)
      return
    }
    // Navigate to trial checkout with selected plan
    navigate(`/checkout/trial?plan=${selectedPlan}`)
  }

  const trialFeatures = [
    { icon: DollarSign, text: '$5,000 de capital virtuel', highlight: true },
    { icon: Clock, text: '7 jours d\'acces complet' },
    { icon: TrendingUp, text: 'Trading sur marches reels' },
    { icon: Sparkles, text: 'Signaux IA inclus' },
    { icon: BarChart3, text: 'Dashboard complet' },
    { icon: Shield, text: 'Memes regles que les challenges' },
    { icon: Target, text: 'Objectif: 10% de profit' },
    { icon: Users, text: 'Acces a la communaute' }
  ]

  const selectedPlanData = plans.find(p => p.key === selectedPlan) || plans[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-blue-600 via-blue-700 to-primary-700 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
            <Gift className="text-yellow-400" size={18} />
            <span className="text-white font-medium">Essai Gratuit 7 Jours</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Testez TradeSense <span className="text-yellow-400">Gratuitement</span>
          </h1>

          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-6">
            Choisissez le plan que vous souhaitez apres l'essai. Vous aurez 7 jours pour tester
            avec $5,000 de capital virtuel avant d'etre facture.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-white/80">
              <Check size={18} className="text-green-400" />
              <span>7 jours gratuits</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Check size={18} className="text-green-400" />
              <span>$5,000 capital virtuel</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Check size={18} className="text-green-400" />
              <span>Annulez a tout moment</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Plan Selection */}
        <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl p-6 md:p-8 -mt-16 relative z-10 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            Choisissez votre plan apres l'essai
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
            Vous ne serez facture qu'apres les 7 jours d'essai gratuit
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <button
                key={plan.key}
                onClick={() => setSelectedPlan(plan.key)}
                className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                  selectedPlan === plan.key
                    ? 'border-primary-500 bg-primary-500/5 ring-2 ring-primary-500/20'
                    : 'border-gray-200 dark:border-dark-200 hover:border-gray-300 dark:hover:border-dark-100'
                }`}
              >
                {selectedPlan === plan.key && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
                <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold text-primary-500">${plan.price}</span>
                  <span className="text-gray-500 text-sm">apres l'essai</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Capital: ${plan.initial_balance?.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Trial Info + CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Features */}
          <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Ce que vous obtenez pendant l'essai
            </h3>
            <div className="space-y-3">
              {trialFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      feature.highlight ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-dark-200'
                    }`}>
                      <Icon size={16} className={feature.highlight ? '' : 'text-gray-600 dark:text-gray-400'} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {feature.text}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CTA Card */}
          <div className="bg-gradient-to-br from-blue-500 to-primary-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Resume</h3>
                <p className="text-white/80 text-sm">Plan {selectedPlanData?.name}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-white/20">
                <span className="text-white/80">Aujourd'hui</span>
                <span className="font-bold text-xl">$0</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-white/80">Apres 7 jours</span>
                <span className="font-bold text-xl">${selectedPlanData?.price}</span>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-yellow-300 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-white/90">
                  Vous serez redirige vers PayPal pour autoriser le paiement futur.
                  Aucun montant ne sera preleve aujourd'hui.
                </p>
              </div>
            </div>

            {!isAuthenticated ? (
              <button
                onClick={() => navigate(`/register?trial=true&plan=${selectedPlan}`)}
                className="w-full py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <Zap size={20} />
                Creer un Compte et Commencer
              </button>
            ) : trialStatus?.can_start_trial ? (
              <button
                onClick={handleStartTrial}
                className="w-full py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <Zap size={20} />
                Demarrer Mon Essai Gratuit
                <ArrowRight size={20} />
              </button>
            ) : trialStatus?.trial_blocked_reason ? (
              <div className="text-center">
                <div className="bg-white/10 rounded-xl p-4 mb-4">
                  <p className="text-white/90">{trialStatus.trial_blocked_reason}</p>
                </div>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 text-white underline hover:no-underline"
                >
                  Voir les challenges
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : null}

            <p className="text-center text-white/60 text-sm mt-4">
              Annulez a tout moment avant la fin de l'essai
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Comment ca marche?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Choisissez un plan', desc: 'Selectionnez le plan souhaite' },
              { step: 2, title: 'Autorisez PayPal', desc: 'Liez votre compte PayPal' },
              { step: 3, title: 'Tradez 7 jours', desc: 'Testez avec $5,000 virtuels' },
              { step: 4, title: 'Continuez ou annulez', desc: 'Decide avant la fin de l\'essai' }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FreeTrial
