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

// Row labels configuration - with short labels for mobile
const ROW_LABELS = [
  { key: 'ai', icon: Brain, iconColor: 'text-purple-500', label: 'Intelligence Artificielle', shortLabel: 'IA' },
  { key: 'accuracy', icon: Target, iconColor: 'text-green-500', label: 'Précision IA', shortLabel: 'Précision' },
  { key: 'signals', icon: BarChart3, iconColor: 'text-blue-500', label: 'Signaux / jour', shortLabel: 'Signaux' },
  { key: 'profit', icon: TrendingUp, iconColor: 'text-primary-500', label: 'Objectif de Profit', shortLabel: 'Objectif' },
  { key: 'dailyLoss', icon: TrendingDown, iconColor: 'text-orange-500', label: 'Perte Max Journalière', shortLabel: 'Perte/jour' },
  { key: 'maxLoss', icon: TrendingDown, iconColor: 'text-red-500', label: 'Perte Max.', shortLabel: 'Perte Max' },
  { key: 'minDays', icon: Calendar, iconColor: 'text-gray-400', label: 'Jours de Trading Min.', shortLabel: 'Min. jours' },
  { key: 'period', icon: Clock, iconColor: 'text-gray-400', label: 'Période de Trading', shortLabel: 'Période' },
  { key: 'refund', icon: RefreshCw, iconColor: 'text-green-500', label: 'Remboursement', shortLabel: 'Remb.' },
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
    <div className="space-y-6 md:space-y-8 -m-4 md:-m-6">
      {/* Hero Section */}
      <section className="relative py-10 md:py-16 overflow-hidden rounded-2xl mx-4 md:mx-6">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[200px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-3 md:px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 glass-card rounded-full mb-6 md:mb-8">
            <Brain className="text-purple-400" size={18} />
            <span className="text-purple-300 text-xs md:text-sm font-medium">Propulse par l'Intelligence Artificielle</span>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight px-2">
            Tradez avec une <span className="gradient-text-animated">IA Predictive</span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-2">
            Notre intelligence artificielle analyse des millions de donnees en temps reel pour predire les mouvements du marche.
          </p>

          {/* AI Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 px-2">
            <div className="group flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 glass-card px-2 sm:px-4 md:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl hover:border-purple-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-400" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm sm:text-lg md:text-xl font-bold text-white">5 Niveaux</p>
                <p className="text-gray-500 text-[10px] sm:text-xs">d'Intelligence IA</p>
              </div>
            </div>
            <div className="group flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 glass-card px-2 sm:px-4 md:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl hover:border-green-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm sm:text-lg md:text-xl font-bold text-white">96%</p>
                <p className="text-gray-500 text-[10px] sm:text-xs">de Precision</p>
              </div>
            </div>
            <div className="group flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 glass-card px-2 sm:px-4 md:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl hover:border-blue-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-400" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm sm:text-lg md:text-xl font-bold text-white">+40</p>
                <p className="text-gray-500 text-[10px] sm:text-xs">Signaux/jour</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Challenge Notice */}
      {hasActiveChallenge && (
        <div className="mx-4 md:mx-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white">Vous avez un challenge actif</h3>
            <p className="text-sm text-gray-400 break-words">
              Actuellement en {challenge?.phase} avec ${challenge?.current_balance?.toLocaleString()} de solde
            </p>
          </div>
          <Link
            to="/accounts"
            className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors min-h-[44px] w-full sm:w-auto text-center"
          >
            Voir le Dashboard
          </Link>
        </div>
      )}

      {/* Pricing Section */}
      {selectedModel && sortedSizes.length > 0 && (
        <section className="relative py-6 md:py-8 bg-dark-300/30 rounded-2xl mx-4 md:mx-6">
          <div className="relative px-3 md:px-4 lg:px-6">
            {/* Toggle - Desktop only */}
            <div className="hidden sm:flex justify-end mb-4 md:mb-6">
              <label className="flex items-center gap-3 cursor-pointer glass-card px-3 md:px-4 py-2 rounded-full hover:border-primary-500/30 transition-all duration-300">
                <div
                  onClick={() => setShowNumbers(!showNumbers)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 min-w-[48px] ${
                    showNumbers ? 'bg-primary-500 shadow-glow' : 'bg-dark-100'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                    showNumbers ? 'left-7' : 'left-1'
                  }`} />
                </div>
                <span className="text-gray-300 text-xs md:text-sm font-medium whitespace-nowrap">Afficher les chiffres</span>
              </label>
            </div>

            {/* Mobile Swipeable Slides */}
            <div className="sm:hidden">
              {/* Slide indicators */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {sortedSizes.map((size, idx) => (
                  <div
                    key={size.id}
                    className={`w-2 h-2 rounded-full transition-all ${
                      size.balance === 100000 ? 'bg-orange-500 w-4' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              {/* Swipe hint */}
              <div className="flex items-center justify-center gap-2 mb-4 text-gray-500 text-xs">
                <span>←</span>
                <span>Glissez pour changer</span>
                <span>→</span>
              </div>

              {/* Full-width slides container */}
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {sortedSizes.map((size) => {
                  const aiTierKey = getAiTierForBalance(size.balance)
                  const aiTier = AI_TIERS[aiTierKey]
                  const AiIcon = aiTier.icon
                  const hasDiscount = size.is_on_sale && size.sale_price
                  const isBestValue = size.balance === 100000

                  const phase1Target = (size.balance * (selectedModel?.phase1_profit_target || 10)) / 100
                  const phase2Target = (size.balance * (selectedModel?.phase2_profit_target || 5)) / 100
                  const dailyLoss = (size.balance * (selectedModel?.max_daily_loss || 5)) / 100
                  const maxLoss = (size.balance * (selectedModel?.max_total_loss || 10)) / 100

                  return (
                    <div
                      key={size.id}
                      className="flex-shrink-0 w-full snap-center px-2"
                      style={{ minWidth: '100%' }}
                    >
                      <div className={`rounded-2xl overflow-hidden mx-auto max-w-sm ${
                        isBestValue
                          ? 'ring-2 ring-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)]'
                          : 'ring-1 ring-white/10'
                      }`}>
                      {/* Best Value Badge */}
                      {isBestValue && (
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Flame size={14} />
                            <span>Meilleur choix</span>
                          </div>
                        </div>
                      )}

                      <div className="bg-gradient-to-b from-dark-100 to-dark-200 p-5">
                        {/* Header */}
                        <div className="text-center mb-4">
                          <p className="text-gray-400 text-xs mb-1">Compte</p>
                          <p className="text-3xl font-bold text-white">{formatCurrency(size.balance)}</p>
                        </div>

                        {/* AI Tier */}
                        <div className="flex items-center justify-center gap-3 mb-4 py-3 bg-dark-300/50 rounded-xl">
                          <div className={`p-2 rounded-lg ${aiTier.bgColor}`}>
                            <AiIcon size={24} className={aiTier.color} />
                          </div>
                          <div>
                            <p className={`font-bold ${aiTier.color}`}>{aiTier.name}</p>
                            <p className="text-xs text-gray-400">{aiTier.description}</p>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-dark-300/30 rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                              <Target size={14} />
                              <span className="text-xs">Précision</span>
                            </div>
                            <p className={`text-lg font-bold ${aiTier.color}`}>{aiTier.accuracy}</p>
                          </div>
                          <div className="bg-dark-300/30 rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                              <BarChart3 size={14} />
                              <span className="text-xs">Signaux/j</span>
                            </div>
                            <p className="text-lg font-bold text-white">{aiTier.signals}</p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center py-2 border-b border-dark-300/50">
                            <span className="text-gray-400 text-sm flex items-center gap-2">
                              <TrendingUp size={14} className="text-primary-500" />
                              Objectif Étape 1
                            </span>
                            <span className="text-white font-semibold">{formatCurrency(phase1Target)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-dark-300/50">
                            <span className="text-gray-400 text-sm flex items-center gap-2">
                              <TrendingUp size={14} className="text-primary-500" />
                              Objectif Étape 2
                            </span>
                            <span className="text-white font-semibold">{formatCurrency(phase2Target)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-dark-300/50">
                            <span className="text-gray-400 text-sm flex items-center gap-2">
                              <TrendingDown size={14} className="text-orange-500" />
                              Perte Max/Jour
                            </span>
                            <span className="text-white font-semibold">{formatCurrency(dailyLoss)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-dark-300/50">
                            <span className="text-gray-400 text-sm flex items-center gap-2">
                              <TrendingDown size={14} className="text-red-500" />
                              Perte Max Totale
                            </span>
                            <span className="text-white font-semibold">{formatCurrency(maxLoss)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-dark-300/50">
                            <span className="text-gray-400 text-sm flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              Min. Jours Trading
                            </span>
                            <span className="text-white font-semibold">{selectedModel?.min_trading_days || 4} jours</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-dark-300/50">
                            <span className="text-gray-400 text-sm flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              Période
                            </span>
                            <span className="text-white font-semibold">Illimitée</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-400 text-sm flex items-center gap-2">
                              <RefreshCw size={14} className="text-green-500" />
                              Remboursement
                            </span>
                            <span className="text-green-400 font-semibold">100%</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-center py-4 border-t border-dark-300/50">
                          {hasDiscount ? (
                            <div>
                              <div className="flex items-center justify-center gap-2">
                                <Flame size={18} className="text-orange-500" />
                                <span className="text-3xl font-bold text-orange-500">€{size.sale_price.toLocaleString('fr-FR')}</span>
                              </div>
                              <span className="text-gray-500 line-through">€{size.price.toLocaleString('fr-FR')}</span>
                            </div>
                          ) : (
                            <span className="text-3xl font-bold text-white">€{size.price.toLocaleString('fr-FR')}</span>
                          )}
                        </div>

                        {/* CTA */}
                        <button
                          onClick={() => handleSelect(size)}
                          className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 min-h-[56px] touch-manipulation ${
                            isBestValue
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30'
                              : 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30'
                          }`}
                        >
                          <Rocket size={18} />
                          Commencer le Challenge
                        </button>

                        {/* Avg Reward */}
                        <div className="mt-4 py-3 glass-card rounded-xl text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Star size={16} className="text-yellow-500" />
                            <span className="text-white font-bold">€{Math.round(size.balance * 0.05).toLocaleString('fr-FR')}</span>
                            <span className="text-gray-400 text-sm">récompense moy.</span>
                          </div>
                        </div>
                      </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Desktop Matrix Table */}
            <div className="hidden sm:block">
              {/* Scroll hint for tablet */}
              <div className="flex md:hidden items-center justify-center gap-2 mb-3 text-gray-500 text-xs">
                <span>←</span>
                <span>Glissez pour voir tous les plans</span>
                <span>→</span>
              </div>

              {/* Matrix Pricing Table */}
              <div className="relative pb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-dark-100 scrollbar-track-transparent">
                <div className="flex min-w-max">
                  {/* Left Labels Column */}
                  <div className="flex-shrink-0 w-28 md:w-40 lg:w-48 sticky left-0 bg-dark-300/95 z-10">
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
                          <IconComponent size={14} className={`${row.iconColor} flex-shrink-0`} />
                          <span className="text-gray-300 text-xs lg:text-sm font-medium leading-tight">{row.label}</span>
                        </div>
                      )
                    })}

                    {/* Payment note */}
                    <div className="pt-6 pr-2">
                      <p className="text-xs text-gray-500 leading-relaxed">Paiements uniques.</p>
                    </div>
                  </div>

                  {/* Account Columns */}
                  <div className="flex-1 flex gap-1.5 lg:gap-2 items-start">
                    {sortedSizes.map((size) => {
                      const aiTierKey = getAiTierForBalance(size.balance)
                      const aiTier = AI_TIERS[aiTierKey]
                      const hasDiscount = size.is_on_sale && size.sale_price
                      const isBestValue = size.balance === 100000

                      return (
                        <div key={size.id} className="flex-shrink-0 w-[110px] md:w-[130px] lg:w-[145px]">
                          {/* Main Card */}
                          <div className={`rounded-2xl transition-all duration-300 backdrop-blur-sm ${
                            isBestValue
                              ? 'bg-gradient-to-b from-dark-100 to-dark-200 ring-2 ring-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)]'
                              : 'bg-gradient-to-b from-dark-100 to-dark-200 ring-1 ring-white/5 hover:ring-primary-500/30'
                          }`}>
                            {/* Best Value Badge */}
                            <div className={`text-xs font-semibold py-1.5 text-center h-7 rounded-t-2xl ${
                              isBestValue ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-transparent'
                            }`}>
                              {isBestValue && (
                                <div className="flex items-center justify-center gap-1">
                                  <Flame size={12} />
                                  <span>Meilleur rapport</span>
                                </div>
                              )}
                            </div>

                            {/* Header */}
                            <div className="text-center py-3 h-[72px] flex flex-col justify-center">
                              <p className="text-gray-400 text-xs mb-1">Compte</p>
                              <p className="text-lg lg:text-xl font-bold text-white">{formatCurrency(size.balance)}</p>
                            </div>

                            {/* Data Rows */}
                            {ROW_LABELS.map((row) => (
                              <div key={row.key} className={`flex items-center justify-center text-center px-2 ${row.key === 'profit' || row.key === 'ai' ? 'h-14' : 'h-11'}`}>
                                {getCellValue(size, selectedModel, row.key, showNumbers)}
                              </div>
                            ))}

                            {/* Price */}
                            <div className="text-center py-3 border-t border-dark-200/50 mt-2 h-16 flex flex-col justify-center">
                              {hasDiscount ? (
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-1">
                                    <Flame size={12} className="text-orange-500" />
                                    <span className="text-lg lg:text-xl font-bold text-orange-500">€{size.sale_price.toLocaleString('fr-FR')}</span>
                                  </div>
                                  <span className="text-gray-500 line-through text-xs">€{size.price.toLocaleString('fr-FR')}</span>
                                </div>
                              ) : (
                                <span className="text-lg lg:text-xl font-bold text-white">€{size.price.toLocaleString('fr-FR')}</span>
                              )}
                            </div>

                            {/* CTA Button */}
                            <div className="px-3 pb-3">
                              <button
                                onClick={() => handleSelect(size)}
                                className={`group w-full py-2.5 rounded-xl font-semibold text-white text-xs transition-all duration-300 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 min-h-[40px] touch-manipulation ${
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
          </div>
        </section>
      )}

      {/* AI Features Section */}
      <section className="relative py-8 sm:py-12 overflow-hidden mx-3 sm:mx-4 md:mx-6 rounded-xl sm:rounded-2xl">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-40 sm:w-80 h-40 sm:h-80 bg-purple-500/10 rounded-full blur-[100px] sm:blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-36 sm:w-72 h-36 sm:h-72 bg-blue-500/10 rounded-full blur-[80px] sm:blur-[120px]" />
        </div>

        <div className="relative px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass-card rounded-full text-purple-400 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              <Brain size={14} className="sm:w-4 sm:h-4" />
              Technologie Avancée
            </span>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 px-2">
              Comment notre <span className="gradient-text-animated">IA</span> predit le marche
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-xs sm:text-sm md:text-base px-2">
              Notre technologie combine plusieurs approches d'intelligence artificielle pour maximiser la précision des prédictions.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            <div className="group glass-card p-2.5 sm:p-5 rounded-lg sm:rounded-2xl hover:border-purple-500/30 transition-all duration-500 ease-out sm:hover:scale-105 sm:hover:-translate-y-2 cursor-pointer">
              <div className="w-8 h-8 sm:w-14 sm:h-14 bg-purple-500/20 rounded-lg flex items-center justify-center mb-1.5 sm:mb-4 transition-all duration-300 group-hover:scale-110">
                <Brain className="text-purple-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-white font-semibold text-xs sm:text-base mb-0.5 sm:mb-2 group-hover:text-purple-400 transition-colors">Deep Learning</h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">Réseaux de neurones analysant les patterns historiques.</p>
            </div>

            <div className="group glass-card p-2.5 sm:p-5 rounded-lg sm:rounded-2xl hover:border-blue-500/30 transition-all duration-500 ease-out sm:hover:scale-105 sm:hover:-translate-y-2 cursor-pointer">
              <div className="w-8 h-8 sm:w-14 sm:h-14 bg-blue-500/20 rounded-lg flex items-center justify-center mb-1.5 sm:mb-4 transition-all duration-300 group-hover:scale-110">
                <BarChart3 className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-white font-semibold text-xs sm:text-base mb-0.5 sm:mb-2 group-hover:text-blue-400 transition-colors">Analyse Technique</h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">150+ indicateurs calculés en temps réel.</p>
            </div>

            <div className="group glass-card p-2.5 sm:p-5 rounded-lg sm:rounded-2xl hover:border-green-500/30 transition-all duration-500 ease-out sm:hover:scale-105 sm:hover:-translate-y-2 cursor-pointer">
              <div className="w-8 h-8 sm:w-14 sm:h-14 bg-green-500/20 rounded-lg flex items-center justify-center mb-1.5 sm:mb-4 transition-all duration-300 group-hover:scale-110">
                <TrendingUp className="text-green-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-white font-semibold text-xs sm:text-base mb-0.5 sm:mb-2 group-hover:text-green-400 transition-colors">Sentiment</h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">Analyse des news et réseaux sociaux.</p>
            </div>

            <div className="group glass-card p-2.5 sm:p-5 rounded-lg sm:rounded-2xl hover:border-orange-500/30 transition-all duration-500 ease-out sm:hover:scale-105 sm:hover:-translate-y-2 cursor-pointer">
              <div className="w-8 h-8 sm:w-14 sm:h-14 bg-orange-500/20 rounded-lg flex items-center justify-center mb-1.5 sm:mb-4 transition-all duration-300 group-hover:scale-110">
                <Zap className="text-orange-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-white font-semibold text-xs sm:text-base mb-0.5 sm:mb-2 group-hover:text-orange-400 transition-colors">Rapide</h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">Signaux générés en millisecondes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Trial CTA */}
      {!hasActiveChallenge && (
        <section className="relative py-8 sm:py-12 overflow-hidden mx-3 sm:mx-4 md:mx-6 rounded-xl sm:rounded-2xl">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-primary-600/20 to-blue-600/20 rounded-xl sm:rounded-2xl" />
          <div className="absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-primary-500/20 rounded-full blur-[60px] sm:blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-28 sm:w-56 h-28 sm:h-56 bg-purple-500/15 rounded-full blur-[50px] sm:blur-[80px]" />

          <div className="relative px-3 sm:px-4 text-center">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 glass-card rounded-full mb-4 sm:mb-6">
              <Sparkles className="text-yellow-400 animate-pulse" size={14} />
              <span className="text-white text-xs sm:text-sm font-medium">Essai gratuit disponible</span>
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 px-2">
              Pas encore pret a vous lancer?
            </h2>

            <p className="text-white/80 mb-5 sm:mb-6 md:mb-8 max-w-lg mx-auto text-xs sm:text-sm md:text-base px-2">
              Essayez notre plateforme gratuitement pendant 7 jours avec un compte demo de $5,000
            </p>

            <Link
              to="/free-trial"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 bg-white text-dark-400 rounded-lg sm:rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 min-h-[48px] w-full sm:w-auto max-w-xs sm:max-w-none mx-auto touch-manipulation"
            >
              <Star size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
              <span className="text-sm sm:text-base">Commencer l'essai gratuit</span>
              <ArrowRight size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
            </Link>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-6 border-t border-white/10">
              <div className="flex items-center gap-1.5 sm:gap-2 text-white/60 text-xs sm:text-sm">
                <Shield size={14} className="text-green-400 sm:w-4 sm:h-4" />
                <span>Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-white/60 text-xs sm:text-sm">
                <RefreshCw size={14} className="text-blue-400 sm:w-4 sm:h-4" />
                <span>Remboursement 100%</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-white/60 text-xs sm:text-sm">
                <Zap size={14} className="text-yellow-400 sm:w-4 sm:h-4" />
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
