import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Target, TrendingDown, Calendar, Clock, RefreshCw,
  Flame, Award, ArrowRight, Info,
  Cpu, Brain, Zap, Shield, BarChart3, TrendingUp,
  Sparkles, Crown, Rocket, Star, CheckCircle2
} from 'lucide-react'
import { challengeModelsAPI } from '../../services/api'
import { useChallenge } from '../../context/ChallengeContext'

// AI Tiers Configuration
const AI_TIERS = {
  starter: {
    name: 'IA Starter',
    icon: Cpu,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    accuracy: '72%',
    signals: '5-10',
    description: 'Algorithme de base'
  },
  basic: {
    name: 'IA Basic',
    icon: Zap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    accuracy: '78%',
    signals: '10-15',
    description: 'Analyse technique avancée'
  },
  advanced: {
    name: 'IA Advanced',
    icon: Brain,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    accuracy: '85%',
    signals: '15-25',
    description: 'Machine Learning optimisé'
  },
  pro: {
    name: 'IA Pro',
    icon: Sparkles,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    accuracy: '91%',
    signals: '25-40',
    description: 'Deep Learning + Sentiment'
  },
  elite: {
    name: 'IA Elite',
    icon: Crown,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    accuracy: '96%',
    signals: 'Illimité',
    description: 'Neural Network Quantique'
  }
}

// Map balance to AI tier
const getAiTierForBalance = (balance) => {
  if (balance >= 200000) return 'elite'
  if (balance >= 100000) return 'pro'
  if (balance >= 50000) return 'advanced'
  if (balance >= 25000) return 'basic'
  return 'starter'
}

// Format currency
const formatCurrency = (amount, currency = '$') => {
  return `${currency}${amount.toLocaleString('fr-FR')}`
}

// Row labels configuration
const ROW_LABELS = [
  { key: 'ai', icon: Brain, iconColor: 'text-purple-500', label: 'Intelligence Artificielle' },
  { key: 'accuracy', icon: Target, iconColor: 'text-green-500', label: 'Précision IA' },
  { key: 'signals', icon: BarChart3, iconColor: 'text-blue-500', label: 'Signaux / jour' },
  { key: 'profit', icon: TrendingUp, iconColor: 'text-primary-500', label: 'Objectif de Profit' },
  { key: 'dailyLoss', icon: TrendingDown, iconColor: 'text-orange-500', label: 'Perte Max Journalière' },
  { key: 'maxLoss', icon: TrendingDown, iconColor: 'text-red-500', label: 'Perte Max.' },
  { key: 'minDays', icon: Calendar, iconColor: 'text-gray-400', label: 'Jours de Trading Min.' },
  { key: 'period', icon: Clock, iconColor: 'text-gray-400', label: 'Période de Trading' },
  { key: 'refund', icon: RefreshCw, iconColor: 'text-green-500', label: 'Remboursement' },
]

// Get cell value for matrix
const getCellValue = (size, model, rowKey, showNumbers) => {
  const aiTierKey = getAiTierForBalance(size.balance)
  const aiTier = AI_TIERS[aiTierKey]
  const AiIcon = aiTier.icon

  const phase1Target = (size.balance * (model?.phase1_profit_target || 10)) / 100
  const phase2Target = (size.balance * (model?.phase2_profit_target || 5)) / 100
  const dailyLoss = (size.balance * (model?.max_daily_loss || 5)) / 100
  const maxLoss = (size.balance * (model?.max_total_loss || 10)) / 100

  switch (rowKey) {
    case 'ai':
      return (
        <div className="flex flex-col items-center gap-1">
          <div className={`p-1 rounded-lg ${aiTier.bgColor}`}>
            <AiIcon size={14} className={aiTier.color} />
          </div>
          <span className={`text-[10px] lg:text-xs font-bold ${aiTier.color}`}>{aiTier.name}</span>
        </div>
      )
    case 'accuracy':
      return (
        <span className={`text-sm lg:text-base font-bold ${aiTier.color}`}>{aiTier.accuracy}</span>
      )
    case 'signals':
      return <span className="text-white font-semibold text-xs lg:text-sm">{aiTier.signals}</span>
    case 'profit':
      return (
        <div className="text-[10px] lg:text-xs">
          <div className="text-white">
            <span className="text-gray-500">ÉT.1 </span>
            <span className="font-semibold">{showNumbers ? formatCurrency(phase1Target) : `${model?.phase1_profit_target || 10}%`}</span>
          </div>
          <div className="text-white">
            <span className="text-gray-500">ÉT.2 </span>
            <span className="font-semibold">{showNumbers ? formatCurrency(phase2Target) : `${model?.phase2_profit_target || 5}%`}</span>
          </div>
        </div>
      )
    case 'dailyLoss':
      return <span className="text-white font-semibold text-xs lg:text-sm">{showNumbers ? formatCurrency(dailyLoss) : `${model?.max_daily_loss || 5}%`}</span>
    case 'maxLoss':
      return <span className="text-white font-semibold text-xs lg:text-sm">{showNumbers ? formatCurrency(maxLoss) : `${model?.max_total_loss || 10}%`}</span>
    case 'minDays':
      return <span className="text-white font-semibold text-xs lg:text-sm">{model?.min_trading_days || 4} jours</span>
    case 'period':
      return <span className="text-white font-semibold text-xs lg:text-sm">Illimité</span>
    case 'refund':
      return (
        <div className="flex items-center justify-center gap-1">
          <span className="text-white font-semibold text-xs">Oui</span>
          <span className="px-1 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded">100%</span>
        </div>
      )
    default:
      return null
  }
}

const PlansPage = () => {
  const navigate = useNavigate()
  const { hasActiveChallenge, challenge } = useChallenge()
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNumbers, setShowNumbers] = useState(true)

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const response = await challengeModelsAPI.getAll()
      const modelsData = response.data.models || []
      setModels(modelsData)
      if (modelsData.length > 0) {
        // Find the popular model or use first
        const popularModel = modelsData.find(m => m.is_popular) || modelsData[0]
        setSelectedModel(popularModel)
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (size) => {
    navigate(`/challenge-checkout?model=${selectedModel.id}&size=${size.id}`)
  }

  const handleModelSelect = (model) => {
    setSelectedModel(model)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Sort sizes by balance descending
  const sortedSizes = selectedModel?.account_sizes?.slice().sort((a, b) => b.balance - a.balance) || []

  return (
    <div className="space-y-8 -m-4 md:-m-6">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden rounded-2xl mx-4 md:mx-6">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[200px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-8">
            <Brain className="text-purple-400" size={18} />
            <span className="text-purple-300 text-sm font-medium">Propulsé par l'Intelligence Artificielle</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Tradez avec une <span className="gradient-text-animated">IA Prédictive</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Notre intelligence artificielle analyse des millions de données en temps réel pour prédire les mouvements du marché.
          </p>

          {/* AI Stats */}
          <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6">
            <div className="group flex items-center gap-3 glass-card px-5 py-3 rounded-2xl hover:border-purple-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Brain size={24} className="text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-white">5 Niveaux</p>
                <p className="text-gray-500 text-xs">d'Intelligence IA</p>
              </div>
            </div>
            <div className="group flex items-center gap-3 glass-card px-5 py-3 rounded-2xl hover:border-green-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Target size={24} className="text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-white">Jusqu'à 96%</p>
                <p className="text-gray-500 text-xs">de Précision</p>
              </div>
            </div>
            <div className="group flex items-center gap-3 glass-card px-5 py-3 rounded-2xl hover:border-blue-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BarChart3 size={24} className="text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-white">+40 Signaux</p>
                <p className="text-gray-500 text-xs">par jour (Elite)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Challenge Notice */}
      {hasActiveChallenge && (
        <div className="mx-4 md:mx-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Vous avez un challenge actif</h3>
            <p className="text-sm text-gray-400">
              Actuellement en {challenge?.phase} avec ${challenge?.current_balance?.toLocaleString()} de solde
            </p>
          </div>
          <Link
            to="/accounts"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Voir le Dashboard
          </Link>
        </div>
      )}

      {/* Pricing Matrix Section */}
      {selectedModel && sortedSizes.length > 0 && (
        <section className="relative py-8 bg-dark-300/30 rounded-2xl mx-4 md:mx-6">
          <div className="relative px-4 md:px-6">
            {/* Toggle */}
            <div className="flex justify-end mb-6">
              <label className="flex items-center gap-3 cursor-pointer glass-card px-4 py-2 rounded-full hover:border-primary-500/30 transition-all duration-300">
                <div
                  onClick={() => setShowNumbers(!showNumbers)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                    showNumbers ? 'bg-primary-500 shadow-glow' : 'bg-dark-100'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                    showNumbers ? 'left-7' : 'left-1'
                  }`} />
                </div>
                <span className="text-gray-300 text-sm font-medium">Afficher les chiffres</span>
              </label>
            </div>

            {/* Matrix Pricing Table */}
            <div className="relative pb-4">
              <div className="flex">
                {/* Left Labels Column */}
                <div className="flex-shrink-0 w-40 lg:w-48">
                  {/* Empty header cell */}
                  <div className="h-[100px]" />

                  {/* Row Labels */}
                  {ROW_LABELS.map((row) => {
                    const IconComponent = row.icon
                    return (
                      <div
                        key={row.key}
                        className={`flex items-center gap-2 ${row.key === 'profit' || row.key === 'ai' ? 'h-14' : 'h-11'}`}
                      >
                        <IconComponent size={14} className={row.iconColor} />
                        <span className="text-gray-300 text-xs lg:text-sm font-medium">{row.label}</span>
                      </div>
                    )
                  })}

                  {/* Payment note */}
                  <div className="pt-6 pr-2">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Paiements uniques.
                    </p>
                  </div>
                </div>

                {/* Account Columns */}
                <div className="flex-1 flex gap-1 lg:gap-2 items-start overflow-x-auto">
                  {sortedSizes.map((size, index) => {
                    const aiTierKey = getAiTierForBalance(size.balance)
                    const aiTier = AI_TIERS[aiTierKey]
                    const hasDiscount = size.is_on_sale && size.sale_price
                    const isBestValue = size.balance === 100000

                    return (
                      <div
                        key={size.id}
                        className="flex-shrink-0 w-[130px] lg:w-[145px]"
                      >
                        {/* Main Card */}
                        <div className={`rounded-2xl transition-all duration-300 backdrop-blur-sm
                          ${isBestValue
                            ? 'bg-gradient-to-b from-dark-100 to-dark-200 ring-2 ring-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)]'
                            : 'bg-gradient-to-b from-dark-100 to-dark-200 ring-1 ring-white/5 hover:ring-primary-500/30'
                          }`}
                        >
                          {/* Best Value Badge */}
                          <div className={`text-xs font-semibold py-1.5 text-center h-7 rounded-t-2xl ${
                            isBestValue
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                              : 'bg-transparent'
                          }`}>
                            {isBestValue && (
                              <div className="flex items-center justify-center gap-1">
                                <Flame size={12} />
                                <span>Meilleur rapport</span>
                              </div>
                            )}
                          </div>

                          {/* Header - Account Size */}
                          <div className="text-center py-3 h-[72px] flex flex-col justify-center">
                            <p className="text-gray-400 text-xs mb-1">Compte</p>
                            <p className="text-lg lg:text-xl font-bold text-white">
                              {formatCurrency(size.balance)}
                            </p>
                          </div>

                          {/* Data Rows */}
                          {ROW_LABELS.map((row) => (
                            <div
                              key={row.key}
                              className={`flex items-center justify-center text-center px-2 ${row.key === 'profit' || row.key === 'ai' ? 'h-14' : 'h-11'}`}
                            >
                              {getCellValue(size, selectedModel, row.key, showNumbers)}
                            </div>
                          ))}

                          {/* Price */}
                          <div className="text-center py-3 border-t border-dark-200/50 mt-2 h-16 flex flex-col justify-center">
                            {hasDiscount ? (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1">
                                  <Flame size={12} className="text-orange-500" />
                                  <span className="text-lg lg:text-xl font-bold text-orange-500">
                                    €{size.sale_price.toLocaleString('fr-FR')}
                                  </span>
                                </div>
                                <span className="text-gray-500 line-through text-xs">
                                  €{size.price.toLocaleString('fr-FR')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg lg:text-xl font-bold text-white">
                                €{size.price.toLocaleString('fr-FR')}
                              </span>
                            )}
                          </div>

                          {/* CTA Button */}
                          <div className="px-3 pb-3">
                            <button
                              onClick={() => handleSelect(size)}
                              className={`group w-full py-2.5 rounded-xl font-semibold text-white text-xs transition-all duration-300 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 ${
                                isBestValue
                                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25'
                                  : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25'
                              }`}
                            >
                              <Rocket size={14} />
                              Commencer
                            </button>
                          </div>
                        </div>

                        {/* Average Reward */}
                        <div className="mt-2 py-3 glass-card text-center rounded-xl">
                          <div className="flex items-center justify-center gap-1.5">
                            <Star size={14} className="text-yellow-500" />
                            <span className="text-white font-bold text-sm">€{Math.round(size.balance * 0.05).toLocaleString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mt-1">
                            <span>Récompense moy.</span>
                            <Info size={10} className="cursor-help" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* AI Features Section */}
      <section className="relative py-12 overflow-hidden mx-4 md:mx-6 rounded-2xl">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative px-4">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-purple-400 text-sm font-medium mb-4">
              <Brain size={16} />
              Technologie Avancée
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Comment notre <span className="gradient-text-animated">IA</span> prédit le marché
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Notre technologie combine plusieurs approches d'intelligence artificielle pour maximiser la précision des prédictions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="group glass-card p-5 rounded-2xl hover:border-purple-500/30 transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Brain className="text-purple-400" size={28} />
              </div>
              <h3 className="text-white font-semibold text-base mb-2 group-hover:text-purple-400 transition-colors">Deep Learning</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Réseaux de neurones analysant les patterns historiques.</p>
            </div>

            <div className="group glass-card p-5 rounded-2xl hover:border-blue-500/30 transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <BarChart3 className="text-blue-400" size={28} />
              </div>
              <h3 className="text-white font-semibold text-base mb-2 group-hover:text-blue-400 transition-colors">Analyse Technique</h3>
              <p className="text-gray-400 text-sm leading-relaxed">150+ indicateurs calculés en temps réel.</p>
            </div>

            <div className="group glass-card p-5 rounded-2xl hover:border-green-500/30 transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <TrendingUp className="text-green-400" size={28} />
              </div>
              <h3 className="text-white font-semibold text-base mb-2 group-hover:text-green-400 transition-colors">Sentiment Analysis</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Analyse des news et réseaux sociaux.</p>
            </div>

            <div className="group glass-card p-5 rounded-2xl hover:border-orange-500/30 transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-2 cursor-pointer">
              <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Zap className="text-orange-400" size={28} />
              </div>
              <h3 className="text-white font-semibold text-base mb-2 group-hover:text-orange-400 transition-colors">Exécution Rapide</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Signaux générés en millisecondes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Trial CTA */}
      {!hasActiveChallenge && (
        <section className="relative py-12 overflow-hidden mx-4 md:mx-6 rounded-2xl">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-primary-600/20 to-blue-600/20 rounded-2xl" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-purple-500/15 rounded-full blur-[80px]" />

          <div className="relative px-4 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-6">
              <Sparkles className="text-yellow-400 animate-pulse" size={18} />
              <span className="text-white text-sm font-medium">Essai gratuit disponible</span>
            </div>

            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Pas encore prêt à vous lancer?
            </h2>

            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Essayez notre plateforme gratuitement pendant 7 jours avec un compte démo de $5,000
            </p>

            <Link
              to="/free-trial"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-dark-400 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95"
            >
              <Star size={20} />
              Commencer l'essai gratuit
              <ArrowRight size={18} />
            </Link>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Shield size={16} className="text-green-400" />
                <span>Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <RefreshCw size={16} className="text-blue-400" />
                <span>Remboursement 100%</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Zap size={16} className="text-yellow-400" />
                <span>Activation instantanée</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default PlansPage
