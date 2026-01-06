import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  Target, TrendingDown, Calendar, Clock, RefreshCw,
  Flame, Award, ArrowRight, Info, ChevronDown,
  Cpu, Brain, Zap, Shield, BarChart3, TrendingUp,
  Sparkles, Crown, Rocket, Star, CheckCircle2, User, AlertCircle
} from 'lucide-react'
import { challengeModelsAPI } from '../../services/api'
import { useChallenge } from '../../context/ChallengeContext'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// AI Tiers Configuration (static styling, names/descriptions from translations)
const AI_TIERS_CONFIG = {
  starter: {
    key: 'starter',
    icon: Cpu,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    accuracy: '72%',
    signals: '5-10'
  },
  basic: {
    key: 'basic',
    icon: Zap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    accuracy: '78%',
    signals: '10-15'
  },
  advanced: {
    key: 'advanced',
    icon: Brain,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    accuracy: '85%',
    signals: '15-25'
  },
  pro: {
    key: 'pro',
    icon: Sparkles,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    accuracy: '91%',
    signals: '25-40'
  },
  elite: {
    key: 'elite',
    icon: Crown,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    accuracy: '96%',
    signals: 'unlimited'
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

// Row labels configuration - with short labels for mobile (uses translation keys)
const ROW_LABELS_CONFIG = [
  { key: 'ai', icon: Brain, iconColor: 'text-purple-500', labelKey: 'ai', shortLabelKey: 'aiShort' },
  { key: 'accuracy', icon: Target, iconColor: 'text-green-500', labelKey: 'accuracy', shortLabelKey: 'accuracyShort' },
  { key: 'signals', icon: BarChart3, iconColor: 'text-blue-500', labelKey: 'signals', shortLabelKey: 'signalsShort' },
  { key: 'profit', icon: TrendingUp, iconColor: 'text-primary-500', labelKey: 'profit', shortLabelKey: 'profitShort' },
  { key: 'dailyLoss', icon: TrendingDown, iconColor: 'text-orange-500', labelKey: 'dailyLoss', shortLabelKey: 'dailyLossShort' },
  { key: 'maxLoss', icon: TrendingDown, iconColor: 'text-red-500', labelKey: 'maxLoss', shortLabelKey: 'maxLossShort' },
  { key: 'minDays', icon: Calendar, iconColor: 'text-gray-400', labelKey: 'minDays', shortLabelKey: 'minDaysShort' },
  { key: 'period', icon: Clock, iconColor: 'text-gray-400', labelKey: 'period', shortLabelKey: 'periodShort' },
  { key: 'refund', icon: RefreshCw, iconColor: 'text-green-500', labelKey: 'refund', shortLabelKey: 'refundShort' },
]

// Get cell value for matrix - now accepts t (translation function) as parameter
const getCellValue = (size, model, rowKey, showNumbers, t) => {
  const aiTierKey = getAiTierForBalance(size.balance)
  const aiTier = AI_TIERS_CONFIG[aiTierKey]
  const AiIcon = aiTier.icon
  const aiName = t(`plans.aiTiers.${aiTier.key}.name`)
  const signalsValue = aiTier.signals === 'unlimited' ? t('plans.table.unlimited') : aiTier.signals

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
          <span className={`text-[10px] lg:text-xs font-bold ${aiTier.color}`}>{aiName}</span>
        </div>
      )
    case 'accuracy':
      return (
        <span className={`text-sm lg:text-base font-bold ${aiTier.color}`}>{aiTier.accuracy}</span>
      )
    case 'signals':
      return <span className="text-white font-semibold text-xs lg:text-sm">{signalsValue}</span>
    case 'profit':
      return (
        <div className="text-[10px] lg:text-xs">
          <div className="text-white">
            <span className="text-gray-500">{t('plans.table.step1')} </span>
            <span className="font-semibold">{showNumbers ? formatCurrency(phase1Target) : `${model?.phase1_profit_target || 10}%`}</span>
          </div>
          <div className="text-white">
            <span className="text-gray-500">{t('plans.table.step2')} </span>
            <span className="font-semibold">{showNumbers ? formatCurrency(phase2Target) : `${model?.phase2_profit_target || 5}%`}</span>
          </div>
        </div>
      )
    case 'dailyLoss':
      return <span className="text-white font-semibold text-xs lg:text-sm">{showNumbers ? formatCurrency(dailyLoss) : `${model?.max_daily_loss || 5}%`}</span>
    case 'maxLoss':
      return <span className="text-white font-semibold text-xs lg:text-sm">{showNumbers ? formatCurrency(maxLoss) : `${model?.max_total_loss || 10}%`}</span>
    case 'minDays':
      return <span className="text-white font-semibold text-xs lg:text-sm">{model?.min_trading_days || 4} {t('plans.table.days')}</span>
    case 'period':
      return <span className="text-white font-semibold text-xs lg:text-sm">{t('plans.table.unlimited')}</span>
    case 'refund':
      return (
        <div className="flex items-center justify-center gap-1">
          <span className="text-white font-semibold text-xs">{t('plans.table.yes')}</span>
          <span className="px-1 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded">{t('plans.table.refundPercent')}</span>
        </div>
      )
    default:
      return null
  }
}

const PlansPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hasActiveChallenge, challenge } = useChallenge()
  const { user } = useAuth()
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNumbers, setShowNumbers] = useState(true)
  const [expandedCard, setExpandedCard] = useState(null) // For mobile expandable cards
  const [showProfileModal, setShowProfileModal] = useState(false)

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
    // Check if profile is complete before allowing purchase
    if (!user?.profile_complete) {
      setShowProfileModal(true)
      return
    }
    navigate(`/challenge-checkout?model=${selectedModel.id}&size=${size.id}`)
  }

  const handleModelSelect = (model) => {
    setSelectedModel(model)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="animate-spin w-8 h-8 sm:w-10 sm:h-10 border-2 sm:border-3 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Sort sizes by balance descending
  const sortedSizes = selectedModel?.account_sizes?.slice().sort((a, b) => b.balance - a.balance) || []

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 -m-2 sm:-m-4 md:-m-6 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative py-8 sm:py-10 md:py-16 overflow-hidden rounded-xl sm:rounded-2xl mx-2 sm:mx-4 md:mx-6">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-purple-500/15 rounded-full blur-[100px] sm:blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-40 sm:w-60 md:w-80 h-40 sm:h-60 md:h-80 bg-blue-500/10 rounded-full blur-[80px] sm:blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[450px] md:w-[600px] h-[300px] sm:h-[450px] md:h-[600px] bg-primary-500/5 rounded-full blur-[150px] sm:blur-[200px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:30px_30px] sm:bg-[size:50px_50px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-3 sm:px-4 md:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 glass-card rounded-full mb-4 sm:mb-6 md:mb-8">
            <Brain className="text-purple-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            <span className="text-purple-300 text-[10px] sm:text-xs md:text-sm font-medium">{t('plans.hero.badge')}</span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight px-1 sm:px-2">
            {t('plans.hero.title')} <span className="gradient-text-animated">{t('plans.hero.titleHighlight')}</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10 leading-relaxed px-2">
            {t('plans.hero.description')}
          </p>

          {/* AI Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 px-2">
            <div className="group flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 glass-card px-2 sm:px-4 md:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl hover:border-purple-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-400" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm sm:text-lg md:text-xl font-bold text-white">{t('plans.aiStats.levels')}</p>
                <p className="text-gray-500 text-[10px] sm:text-xs">{t('plans.aiStats.levelsDesc')}</p>
              </div>
            </div>
            <div className="group flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 glass-card px-2 sm:px-4 md:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl hover:border-green-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm sm:text-lg md:text-xl font-bold text-white">{t('plans.aiStats.accuracy')}</p>
                <p className="text-gray-500 text-[10px] sm:text-xs">{t('plans.aiStats.accuracyDesc')}</p>
              </div>
            </div>
            <div className="group flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 glass-card px-2 sm:px-4 md:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl hover:border-blue-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-400" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm sm:text-lg md:text-xl font-bold text-white">{t('plans.aiStats.signals')}</p>
                <p className="text-gray-500 text-[10px] sm:text-xs">{t('plans.aiStats.signalsDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Challenge Notice */}
      {hasActiveChallenge && (
        <div className="mx-2 sm:mx-4 md:mx-6 bg-blue-500/10 border border-blue-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="text-white w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm sm:text-base">{t('plans.activeChallenge.title')}</h3>
            <p className="text-xs sm:text-sm text-gray-400 break-words">
              {t('plans.activeChallenge.currentlyIn', { phase: challenge?.phase, balance: challenge?.current_balance?.toLocaleString() })}
            </p>
          </div>
          <Link
            to="/accounts"
            className="px-4 py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors min-h-[44px] w-full sm:w-auto text-center text-sm sm:text-base touch-manipulation active:scale-95"
          >
            {t('plans.activeChallenge.viewDashboard')}
          </Link>
        </div>
      )}

      {/* Pricing Section */}
      {selectedModel && sortedSizes.length > 0 && (
        <section className="relative py-4 sm:py-6 md:py-8 bg-dark-300/30 rounded-xl sm:rounded-2xl mx-2 sm:mx-4 md:mx-6">
          <div className="relative px-2 sm:px-3 md:px-4 lg:px-6">
            {/* Toggle - Desktop only */}
            <div className="hidden sm:flex justify-end mb-4 md:mb-6">
              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer glass-card px-3 md:px-4 py-2 rounded-full hover:border-primary-500/30 transition-all duration-300">
                <div
                  onClick={() => setShowNumbers(!showNumbers)}
                  className={`relative w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-all duration-300 min-w-[40px] sm:min-w-[48px] ${
                    showNumbers ? 'bg-primary-500 shadow-glow' : 'bg-dark-100'
                  }`}
                >
                  <div className={`absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                    showNumbers ? 'left-5 sm:left-7' : 'left-0.5 sm:left-1'
                  }`} />
                </div>
                <span className="text-gray-300 text-xs md:text-sm font-medium whitespace-nowrap">{t('plans.table.showNumbers')}</span>
              </label>
            </div>

            {/* Mobile Vertical Cards */}
            <div className="sm:hidden space-y-3">
              {/* Section title */}
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-white mb-1">{t('plans.table.chooseAccount')}</h2>
                <p className="text-gray-400 text-xs">{t('plans.table.tapToSeeDetails')}</p>
              </div>

              {/* Compact vertical cards */}
              {sortedSizes.map((size) => {
                const aiTierKey = getAiTierForBalance(size.balance)
                const aiTier = AI_TIERS_CONFIG[aiTierKey]
                const AiIcon = aiTier.icon
                const hasDiscount = size.is_on_sale && size.sale_price
                const isBestValue = size.balance === 100000
                const isExpanded = expandedCard === size.id

                const phase1Target = (size.balance * (selectedModel?.phase1_profit_target || 10)) / 100
                const phase2Target = (size.balance * (selectedModel?.phase2_profit_target || 5)) / 100
                const dailyLoss = (size.balance * (selectedModel?.max_daily_loss || 5)) / 100
                const maxLoss = (size.balance * (selectedModel?.max_total_loss || 10)) / 100

                return (
                  <div
                    key={size.id}
                    className={`rounded-xl overflow-hidden transition-all duration-300 ${
                      isBestValue
                        ? 'ring-2 ring-orange-500 bg-gradient-to-r from-orange-500/10 to-dark-100'
                        : 'ring-1 ring-white/10 bg-dark-100'
                    }`}
                  >
                    {/* Best Value Badge */}
                    {isBestValue && (
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-bold py-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Flame size={10} />
                          <span>{t('plans.table.bestChoice')}</span>
                        </div>
                      </div>
                    )}

                    {/* Compact Card Header - Always visible */}
                    <div
                      className="p-3 cursor-pointer touch-manipulation"
                      onClick={() => setExpandedCard(isExpanded ? null : size.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Left: Balance + AI */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${aiTier.bgColor}`}>
                            <AiIcon size={20} className={aiTier.color} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-lg font-bold text-white">{formatCurrency(size.balance)}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${aiTier.color}`}>{t(`plans.aiTiers.${aiTier.key}.name`)}</span>
                              <span className="text-gray-500 text-[10px]">•</span>
                              <span className="text-green-400 text-xs font-medium">{aiTier.accuracy}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Price + Expand */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            {hasDiscount ? (
                              <>
                                <p className="text-lg font-bold text-orange-500">€{size.sale_price}</p>
                                <p className="text-gray-500 line-through text-[10px]">€{size.price}</p>
                              </>
                            ) : (
                              <p className="text-lg font-bold text-white">€{size.price}</p>
                            )}
                          </div>
                          <ChevronDown
                            size={18}
                            className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </div>

                      {/* Quick stats row */}
                      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <BarChart3 size={10} className="text-blue-400" />
                          <span className="text-[10px] text-gray-400">{aiTier.signals === 'unlimited' ? t('plans.table.unlimited') : aiTier.signals} {t('plans.table.signalsPerDay')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp size={10} className="text-green-400" />
                          <span className="text-[10px] text-gray-400">+{selectedModel?.phase1_profit_target || 10}% {t('plans.table.objective')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={10} className="text-yellow-400" />
                          <span className="text-[10px] text-gray-400">€{Math.round(size.balance * 0.05).toLocaleString('fr-FR')} {t('plans.table.reward')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                      <div className="px-3 pb-3 space-y-3">
                        {/* Divider */}
                        <div className="h-px bg-white/10" />

                        {/* Stats in 2x2 grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-dark-200/50 rounded-lg p-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <TrendingUp size={12} className="text-primary-500" />
                              <span className="text-[10px] text-gray-400">{t('plans.table.objectiveStep1')}</span>
                            </div>
                            <p className="text-sm font-bold text-white">{formatCurrency(phase1Target)}</p>
                          </div>
                          <div className="bg-dark-200/50 rounded-lg p-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <TrendingUp size={12} className="text-primary-500" />
                              <span className="text-[10px] text-gray-400">{t('plans.table.objectiveStep2')}</span>
                            </div>
                            <p className="text-sm font-bold text-white">{formatCurrency(phase2Target)}</p>
                          </div>
                          <div className="bg-dark-200/50 rounded-lg p-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <TrendingDown size={12} className="text-orange-500" />
                              <span className="text-[10px] text-gray-400">{t('plans.table.dailyMaxLoss')}</span>
                            </div>
                            <p className="text-sm font-bold text-white">{formatCurrency(dailyLoss)}</p>
                          </div>
                          <div className="bg-dark-200/50 rounded-lg p-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <TrendingDown size={12} className="text-red-500" />
                              <span className="text-[10px] text-gray-400">{t('plans.table.totalMaxLoss')}</span>
                            </div>
                            <p className="text-sm font-bold text-white">{formatCurrency(maxLoss)}</p>
                          </div>
                        </div>

                        {/* Additional info row */}
                        <div className="flex items-center justify-between text-xs bg-dark-200/30 rounded-lg p-2.5">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="text-gray-400" />
                              <span className="text-gray-400">{selectedModel?.min_trading_days || 4}{t('plans.table.minDays')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={12} className="text-gray-400" />
                              <span className="text-gray-400">{t('plans.table.unlimited')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <RefreshCw size={12} className="text-green-500" />
                            <span className="text-green-400 font-medium">{t('plans.table.refundPercent')} {t('plans.table.refundLabel')}</span>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelect(size)
                          }}
                          className={`w-full py-3.5 rounded-lg font-bold text-white text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] min-h-[52px] touch-manipulation ${
                            isBestValue
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30'
                              : 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30'
                          }`}
                        >
                          <Rocket size={18} />
                          {t('plans.table.startChallenge')}
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Common info footer */}
              <div className="mt-4 p-3 bg-dark-200/30 rounded-lg">
                <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <Shield size={10} className="text-green-500" />
                    <span>{t('plans.table.securePayment')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap size={10} className="text-yellow-500" />
                    <span>{t('plans.table.instantActivation')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Matrix Table */}
            <div className="hidden sm:block">
              {/* Scroll hint for tablet */}
              <div className="flex md:hidden items-center justify-center gap-2 mb-3 text-gray-500 text-xs">
                <span>←</span>
                <span>{t('plans.table.swipeHint')}</span>
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
                    {ROW_LABELS_CONFIG.map((row) => {
                      const IconComponent = row.icon
                      return (
                        <div
                          key={row.key}
                          className={`flex items-center gap-2 ${row.key === 'profit' || row.key === 'ai' ? 'h-14' : 'h-11'}`}
                        >
                          <IconComponent size={14} className={`${row.iconColor} flex-shrink-0`} />
                          <span className="text-gray-300 text-xs lg:text-sm font-medium leading-tight">{t(`plans.rowLabels.${row.labelKey}`)}</span>
                        </div>
                      )
                    })}

                    {/* Payment note */}
                    <div className="pt-6 pr-2">
                      <p className="text-xs text-gray-500 leading-relaxed">{t('plans.table.paymentNote')}</p>
                    </div>
                  </div>

                  {/* Account Columns */}
                  <div className="flex-1 flex gap-1.5 lg:gap-2 items-start">
                    {sortedSizes.map((size) => {
                      const aiTierKey = getAiTierForBalance(size.balance)
                      const aiTier = AI_TIERS_CONFIG[aiTierKey]
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
                                  <span>{t('plans.table.bestValue')}</span>
                                </div>
                              )}
                            </div>

                            {/* Header */}
                            <div className="text-center py-3 h-[72px] flex flex-col justify-center">
                              <p className="text-gray-400 text-xs mb-1">{t('plans.table.account')}</p>
                              <p className="text-lg lg:text-xl font-bold text-white">{formatCurrency(size.balance)}</p>
                            </div>

                            {/* Data Rows */}
                            {ROW_LABELS_CONFIG.map((row) => (
                              <div key={row.key} className={`flex items-center justify-center text-center px-2 ${row.key === 'profit' || row.key === 'ai' ? 'h-14' : 'h-11'}`}>
                                {getCellValue(size, selectedModel, row.key, showNumbers, t)}
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
                                {t('plans.table.start')}
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
                              <span>{t('plans.table.avgReward')}</span>
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
              {t('plans.aiFeatures.badge')}
            </span>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 px-2">
              {t('plans.aiFeatures.title')} <span className="gradient-text-animated">{t('plans.aiFeatures.titleHighlight')}</span> {t('plans.aiFeatures.titleEnd')}
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-xs sm:text-sm md:text-base px-2">
              {t('plans.aiFeatures.description')}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            <div className="group glass-card p-2.5 sm:p-5 rounded-lg sm:rounded-2xl hover:border-purple-500/30 transition-all duration-500 ease-out sm:hover:scale-105 sm:hover:-translate-y-2 cursor-pointer">
              <div className="w-8 h-8 sm:w-14 sm:h-14 bg-purple-500/20 rounded-lg flex items-center justify-center mb-1.5 sm:mb-4 transition-all duration-300 group-hover:scale-110">
                <Brain className="text-purple-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-white font-semibold text-xs sm:text-base mb-0.5 sm:mb-2 group-hover:text-purple-400 transition-colors">{t('plans.aiFeatures.deepLearning.title')}</h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">{t('plans.aiFeatures.deepLearning.description')}</p>
            </div>

            <div className="group glass-card p-2.5 sm:p-5 rounded-lg sm:rounded-2xl hover:border-blue-500/30 transition-all duration-500 ease-out sm:hover:scale-105 sm:hover:-translate-y-2 cursor-pointer">
              <div className="w-8 h-8 sm:w-14 sm:h-14 bg-blue-500/20 rounded-lg flex items-center justify-center mb-1.5 sm:mb-4 transition-all duration-300 group-hover:scale-110">
                <BarChart3 className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-white font-semibold text-xs sm:text-base mb-0.5 sm:mb-2 group-hover:text-blue-400 transition-colors">{t('plans.aiFeatures.technicalAnalysis.title')}</h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">{t('plans.aiFeatures.technicalAnalysis.description')}</p>
            </div>

            <div className="group glass-card p-2.5 sm:p-5 rounded-lg sm:rounded-2xl hover:border-green-500/30 transition-all duration-500 ease-out sm:hover:scale-105 sm:hover:-translate-y-2 cursor-pointer">
              <div className="w-8 h-8 sm:w-14 sm:h-14 bg-green-500/20 rounded-lg flex items-center justify-center mb-1.5 sm:mb-4 transition-all duration-300 group-hover:scale-110">
                <TrendingUp className="text-green-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-white font-semibold text-xs sm:text-base mb-0.5 sm:mb-2 group-hover:text-green-400 transition-colors">{t('plans.aiFeatures.sentiment.title')}</h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">{t('plans.aiFeatures.sentiment.description')}</p>
            </div>

            <div className="group glass-card p-2.5 sm:p-5 rounded-lg sm:rounded-2xl hover:border-orange-500/30 transition-all duration-500 ease-out sm:hover:scale-105 sm:hover:-translate-y-2 cursor-pointer">
              <div className="w-8 h-8 sm:w-14 sm:h-14 bg-orange-500/20 rounded-lg flex items-center justify-center mb-1.5 sm:mb-4 transition-all duration-300 group-hover:scale-110">
                <Zap className="text-orange-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-white font-semibold text-xs sm:text-base mb-0.5 sm:mb-2 group-hover:text-orange-400 transition-colors">{t('plans.aiFeatures.fast.title')}</h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">{t('plans.aiFeatures.fast.description')}</p>
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
              <span className="text-white text-xs sm:text-sm font-medium">{t('plans.freeTrial.badge')}</span>
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 px-2">
              {t('plans.freeTrial.title')}
            </h2>

            <p className="text-white/80 mb-5 sm:mb-6 md:mb-8 max-w-lg mx-auto text-xs sm:text-sm md:text-base px-2">
              {t('plans.freeTrial.description')}
            </p>

            <Link
              to="/free-trial"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 bg-white text-dark-400 rounded-lg sm:rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 min-h-[48px] w-full sm:w-auto max-w-xs sm:max-w-none mx-auto touch-manipulation"
            >
              <Star size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
              <span className="text-sm sm:text-base">{t('plans.freeTrial.cta')}</span>
              <ArrowRight size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
            </Link>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-6 border-t border-white/10">
              <div className="flex items-center gap-1.5 sm:gap-2 text-white/60 text-xs sm:text-sm">
                <Shield size={14} className="text-green-400 sm:w-4 sm:h-4" />
                <span>{t('plans.freeTrial.securePayment')}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-white/60 text-xs sm:text-sm">
                <RefreshCw size={14} className="text-blue-400 sm:w-4 sm:h-4" />
                <span>{t('plans.freeTrial.fullRefund')}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-white/60 text-xs sm:text-sm">
                <Zap size={14} className="text-yellow-400 sm:w-4 sm:h-4" />
                <span>{t('plans.freeTrial.instantActivation')}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Profile Completion Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-100 rounded-2xl border border-white/10 p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                <User size={32} className="text-primary-400" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-2">
                {t('plans.profileRequired.title', 'Complete Your Profile')}
              </h3>

              {/* Description */}
              <p className="text-gray-400 mb-6">
                {t('plans.profileRequired.description', 'Please complete your profile information before purchasing a challenge. This helps us verify your identity and process payments securely.')}
              </p>

              {/* Missing fields */}
              <div className="bg-dark-200/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 mb-2">{t('profile.missing', 'Missing')}:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {!user?.full_name && (
                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-sm rounded-full border border-yellow-500/20">
                      {t('profile.fullName', 'Full Name')}
                    </span>
                  )}
                  {!user?.phone && (
                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-sm rounded-full border border-yellow-500/20">
                      {t('profile.phone', 'Phone')}
                    </span>
                  )}
                  {!user?.country && (
                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-sm rounded-full border border-yellow-500/20">
                      {t('profile.country', 'Country')}
                    </span>
                  )}
                  {!user?.gender && (
                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-sm rounded-full border border-yellow-500/20">
                      {t('profile.gender', 'Gender')}
                    </span>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-3 bg-dark-200 hover:bg-dark-300 text-gray-300 rounded-xl font-medium transition-all"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false)
                    navigate('/profile/default')
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <User size={18} />
                  {t('profile.complete', 'Complete Profile')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlansPage
