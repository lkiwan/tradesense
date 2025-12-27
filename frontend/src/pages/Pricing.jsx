import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Target, TrendingDown, Calendar, Clock, RefreshCw,
  ChevronDown, Info, Flame, Award, ArrowRight,
  Cpu, Brain, Zap, Shield, BarChart3, TrendingUp,
  Sparkles, Crown, Rocket, Star, CheckCircle2
} from 'lucide-react'

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

// Account sizes configuration with AI tiers
const ACCOUNT_SIZES = [
  {
    balance: 200000,
    price: 1080,
    salePrice: 899,
    avgReward: 12233,
    aiTier: 'elite',
    features: ['Tous les marchés', 'Signaux temps réel', 'Support VIP 24/7', 'Analyse institutionnelle', 'Accès API complet']
  },
  {
    balance: 100000,
    price: 540,
    salePrice: 439,
    avgReward: 5957,
    isBestValue: true,
    aiTier: 'pro',
    features: ['Forex + Crypto + Indices', 'Alertes instantanées', 'Support prioritaire', 'Analyse de sentiment']
  },
  {
    balance: 50000,
    price: 345,
    salePrice: null,
    avgReward: 2805,
    aiTier: 'advanced',
    features: ['Forex + Crypto', 'Alertes par email', 'Support dédié', 'Backtesting inclus']
  },
  {
    balance: 25000,
    price: 250,
    salePrice: null,
    avgReward: 1431,
    aiTier: 'basic',
    features: ['Forex majeurs', 'Alertes quotidiennes', 'Support standard']
  },
  {
    balance: 10000,
    price: 89,
    salePrice: null,
    avgReward: 680,
    aiTier: 'starter',
    features: ['EUR/USD + GBP/USD', 'Signaux basiques', 'Support email']
  },
]

// Challenge rules by account size
const getRules = (balance) => {
  const rules = {
    200000: { phase1Target: 20000, phase2Target: 10000, dailyLoss: 10000, maxLoss: 20000 },
    100000: { phase1Target: 10000, phase2Target: 5000, dailyLoss: 5000, maxLoss: 10000 },
    50000: { phase1Target: 5000, phase2Target: 2500, dailyLoss: 2500, maxLoss: 5000 },
    25000: { phase1Target: 2500, phase2Target: 1250, dailyLoss: 1250, maxLoss: 2500 },
    10000: { phase1Target: 1000, phase2Target: 500, dailyLoss: 500, maxLoss: 1000 },
  }
  return rules[balance] || rules[100000]
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
const getCellValue = (account, rowKey, showNumbers) => {
  const rules = getRules(account.balance)
  const aiTier = AI_TIERS[account.aiTier]
  const AiIcon = aiTier.icon

  switch (rowKey) {
    case 'ai':
      return (
        <div className="flex flex-col items-center gap-1">
          <div className={`p-1.5 rounded-lg ${aiTier.bgColor}`}>
            <AiIcon size={16} className={aiTier.color} />
          </div>
          <span className={`text-xs font-bold ${aiTier.color}`}>{aiTier.name}</span>
        </div>
      )
    case 'accuracy':
      return (
        <div className="flex items-center gap-1">
          <span className={`text-lg font-bold ${aiTier.color}`}>{aiTier.accuracy}</span>
        </div>
      )
    case 'signals':
      return <span className="text-white font-semibold">{aiTier.signals}</span>
    case 'profit':
      return (
        <div className="text-xs">
          <div className="text-white">
            <span className="text-gray-500">ÉTAPE 1</span>{' '}
            <span className="font-semibold">{showNumbers ? formatCurrency(rules.phase1Target) : '10%'}</span>
          </div>
          <div className="text-white">
            <span className="text-gray-500">ÉTAPE 2</span>{' '}
            <span className="font-semibold">{showNumbers ? formatCurrency(rules.phase2Target) : '5%'}</span>
          </div>
        </div>
      )
    case 'dailyLoss':
      return <span className="text-white font-semibold text-sm">{showNumbers ? formatCurrency(rules.dailyLoss) : '5%'}</span>
    case 'maxLoss':
      return <span className="text-white font-semibold text-sm">{showNumbers ? formatCurrency(rules.maxLoss) : '10%'}</span>
    case 'minDays':
      return <span className="text-white font-semibold text-sm">4 jours</span>
    case 'period':
      return <span className="text-white font-semibold text-sm">Illimité</span>
    case 'refund':
      return (
        <div className="flex items-center justify-center gap-1">
          <span className="text-white font-semibold text-sm">Oui</span>
          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded">100%</span>
        </div>
      )
    default:
      return null
  }
}

const Pricing = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [showNumbers, setShowNumbers] = useState(true)

  const handleSelect = (account) => {
    if (isAuthenticated) {
      navigate(`/checkout?balance=${account.balance}&price=${account.salePrice || account.price}`)
    } else {
      navigate('/register')
    }
  }

  return (
    <div className="min-h-screen bg-dark-400">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[200px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-8 animate-float">
            <Brain className="text-purple-400" size={18} />
            <span className="text-purple-300 text-sm font-medium">Propulsé par l'Intelligence Artificielle</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Tradez avec une <span className="gradient-text-animated">IA Prédictive</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
            Notre intelligence artificielle analyse des millions de données en temps réel pour prédire les mouvements du marché.
            Plus votre plan est élevé, plus l'IA est puissante et précise.
          </p>

          {/* AI Stats */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 lg:gap-8 mb-12 px-4">
            <div className="group flex items-center gap-3 md:gap-4 glass-card px-4 md:px-6 py-3 md:py-4 rounded-2xl hover:border-purple-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Brain size={24} className="text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-xl md:text-2xl font-bold text-white">5 Niveaux</p>
                <p className="text-gray-500 text-xs md:text-sm">d'Intelligence IA</p>
              </div>
            </div>
            <div className="group flex items-center gap-3 md:gap-4 glass-card px-4 md:px-6 py-3 md:py-4 rounded-2xl hover:border-green-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-green-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Target size={24} className="text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-xl md:text-2xl font-bold text-white">Jusqu'a 96%</p>
                <p className="text-gray-500 text-xs md:text-sm">de Precision</p>
              </div>
            </div>
            <div className="group flex items-center gap-3 md:gap-4 glass-card px-4 md:px-6 py-3 md:py-4 rounded-2xl hover:border-blue-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BarChart3 size={24} className="text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-xl md:text-2xl font-bold text-white">+40 Signaux</p>
                <p className="text-gray-500 text-xs md:text-sm">par jour (Elite)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tiers Explanation */}
      <section className="relative py-10 overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-primary-500 uppercase tracking-[0.3em] mb-6">
            Niveaux d'Intelligence
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 lg:gap-6 px-4">
            {Object.entries(AI_TIERS).reverse().map(([key, tier], index) => {
              const TierIcon = tier.icon
              return (
                <div
                  key={key}
                  className="group flex items-center gap-3 px-5 py-3 glass-card rounded-xl transition-all duration-300 ease-out
                    hover:scale-110 hover:-translate-y-2 hover:shadow-lg cursor-pointer animate-float"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`p-2 rounded-xl ${tier.bgColor} transition-all duration-300 group-hover:scale-110 group-hover:rotate-12`}>
                    <TierIcon size={20} className={tier.color} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${tier.color}`}>{tier.name}</p>
                    <p className="text-xs text-gray-500">{tier.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section className="relative py-16 bg-dark-300/50">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-orange-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Toggle */}
          <div className="flex justify-end mb-8">
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
          <div className="relative overflow-x-auto pb-4">
            <div className="flex min-w-max">
              {/* Left Labels Column */}
              <div className="flex-shrink-0 w-48 lg:w-56">
                {/* Empty header cell - matches column header height */}
                <div className="h-[88px]" />

                {/* Row Labels */}
                {ROW_LABELS.map((row) => {
                  const IconComponent = row.icon
                  return (
                    <div
                      key={row.key}
                      className={`flex items-center gap-2 ${row.key === 'profit' || row.key === 'ai' ? 'h-14' : 'h-11'}`}
                    >
                      <IconComponent size={16} className={row.iconColor} />
                      <span className="text-gray-300 text-sm font-medium">{row.label}</span>
                    </div>
                  )
                })}

                {/* Payment note */}
                <div className="pt-6 pr-4">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Tous les prix sont des paiements uniques.
                  </p>
                </div>
              </div>

              {/* Account Columns */}
              <div className="flex gap-3 lg:gap-4 items-start">
                {ACCOUNT_SIZES.map((account) => {
                  const hasDiscount = account.salePrice !== null
                  const aiTier = AI_TIERS[account.aiTier]

                  return (
                    <div
                      key={account.balance}
                      className="flex-shrink-0 w-40 lg:w-44 cursor-pointer"
                    >
                      {/* Main Card */}
                      <div className={`rounded-2xl transition-all duration-500 backdrop-blur-sm
                        ${account.isBestValue
                          ? 'bg-gradient-to-b from-dark-100 to-dark-200 ring-2 ring-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)]'
                          : 'bg-gradient-to-b from-dark-100 to-dark-200 ring-1 ring-white/5 hover:ring-2 hover:ring-primary-500/50 hover:shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:-translate-y-1'
                        }`}
                      >
                        {/* Best Value Badge */}
                        <div className={`text-xs font-semibold py-1.5 text-center h-7 rounded-t-2xl ${
                          account.isBestValue
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                            : 'bg-transparent'
                        }`}>
                          {account.isBestValue && (
                            <div className="flex items-center justify-center gap-1">
                              <Flame size={12} />
                              <span>Meilleur rapport</span>
                            </div>
                          )}
                        </div>

                        {/* Header - Account Size */}
                        <div className="text-center py-3 h-[60px] flex flex-col justify-center">
                          <p className="text-gray-400 text-xs mb-1">Compte</p>
                          <p className="text-xl lg:text-2xl font-bold text-white">
                            {formatCurrency(account.balance)}
                          </p>
                        </div>

                        {/* Data Rows */}
                        {ROW_LABELS.map((row) => (
                          <div
                            key={row.key}
                            className={`flex items-center justify-center text-center px-2 ${row.key === 'profit' || row.key === 'ai' ? 'h-14' : 'h-11'}`}
                          >
                            {getCellValue(account, row.key, showNumbers)}
                          </div>
                        ))}

                        {/* Price */}
                        <div className="text-center py-4 border-t border-dark-200/50 mt-2 h-20 flex flex-col justify-center">
                          {hasDiscount ? (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1">
                                <Flame size={14} className="text-orange-500" />
                                <span className="text-xl lg:text-2xl font-bold text-orange-500">
                                  €{account.salePrice.toLocaleString('fr-FR')}
                                </span>
                              </div>
                              <span className="text-gray-500 line-through text-xs">
                                €{account.price.toLocaleString('fr-FR')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xl lg:text-2xl font-bold text-white">
                              €{account.price.toLocaleString('fr-FR')}
                            </span>
                          )}
                        </div>

                        {/* CTA Button */}
                        <div className="px-3 pb-3">
                          <button
                            onClick={() => handleSelect(account)}
                            className={`group w-full py-2.5 rounded-xl font-semibold text-white text-xs transition-all duration-300 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 ${
                              account.isBestValue
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25'
                                : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25'
                            }`}
                          >
                            <Rocket size={14} className="transition-transform duration-300 group-hover:-rotate-12" />
                            Commencer
                          </button>
                        </div>
                      </div>

                      {/* Average Reward - Separate section with 5px gap */}
                      <div className="mt-2 py-3 glass-card text-center rounded-xl hover:border-yellow-500/30 transition-all duration-300">
                        <div className="flex items-center justify-center gap-1.5">
                          <Star size={14} className="text-yellow-500" />
                          <span className="text-white font-bold text-sm">€{account.avgReward.toLocaleString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mt-1">
                          <span>Récompense moy.</span>
                          <Info size={10} className="hover:text-primary-400 cursor-help transition-colors" />
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

      {/* AI Features Section */}
      <section className="relative py-20 bg-dark-400 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-purple-400 text-sm font-medium mb-6 animate-float">
              <Brain size={16} />
              Technologie Avancée
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
              Comment notre <span className="gradient-text-animated">IA</span> predit le marche
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Notre technologie combine plusieurs approches d'intelligence artificielle pour maximiser la précision des prédictions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group glass-card p-6 rounded-2xl hover:border-purple-500/30 transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)] cursor-pointer">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg group-hover:shadow-purple-500/20">
                <Brain className="text-purple-400" size={32} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-3 group-hover:text-purple-400 transition-colors">Deep Learning</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Réseaux de neurones profonds analysant les patterns historiques sur 20 ans de données.</p>
            </div>

            <div className="group glass-card p-6 rounded-2xl hover:border-blue-500/30 transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] cursor-pointer">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg group-hover:shadow-blue-500/20">
                <BarChart3 className="text-blue-400" size={32} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-3 group-hover:text-blue-400 transition-colors">Analyse Technique</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Plus de 150 indicateurs techniques calculés en temps réel sur tous les timeframes.</p>
            </div>

            <div className="group glass-card p-6 rounded-2xl hover:border-green-500/30 transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(34,197,94,0.15)] cursor-pointer">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg group-hover:shadow-green-500/20">
                <TrendingUp className="text-green-400" size={32} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-3 group-hover:text-green-400 transition-colors">Sentiment Analysis</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Analyse du sentiment des news, réseaux sociaux et rapports économiques.</p>
            </div>

            <div className="group glass-card p-6 rounded-2xl hover:border-orange-500/30 transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(249,115,22,0.15)] cursor-pointer">
              <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg group-hover:shadow-orange-500/20">
                <Zap className="text-orange-400" size={32} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-3 group-hover:text-orange-400 transition-colors">Exécution Rapide</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Signaux générés en millisecondes pour capturer les meilleures opportunités.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="relative py-20 bg-dark-300/50 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-yellow-400 text-sm font-medium mb-6">
              <Award size={16} />
              Comparaison
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
              Pourquoi choisir un <span className="gradient-text-animated">plan superieur</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Starter comparison */}
            <div className="group glass-card p-8 rounded-2xl transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-2 cursor-pointer">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gray-500/20 rounded-xl transition-transform duration-300 group-hover:scale-110">
                  <Cpu size={24} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">IA Starter</h3>
                  <p className="text-gray-500 text-xs">Niveau débutant</p>
                </div>
              </div>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3 text-gray-400">
                  <CheckCircle2 size={18} className="text-gray-500 flex-shrink-0" />
                  Analyse basique EUR/USD, GBP/USD
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <CheckCircle2 size={18} className="text-gray-500 flex-shrink-0" />
                  5-10 signaux par jour
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <CheckCircle2 size={18} className="text-gray-500 flex-shrink-0" />
                  Précision de 72%
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <CheckCircle2 size={18} className="text-gray-500 flex-shrink-0" />
                  Indicateurs techniques de base
                </li>
              </ul>
            </div>

            {/* Elite comparison */}
            <div className="group relative p-8 rounded-2xl transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-yellow-500/5 border border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-[0_20px_60px_rgba(234,179,8,0.2)]">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative flex items-center gap-3 mb-6">
                <div className="p-3 bg-yellow-500/20 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg group-hover:shadow-yellow-500/30">
                  <Crown size={24} className="text-yellow-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-lg">IA Elite</h3>
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full animate-pulse">PREMIUM</span>
                  </div>
                  <p className="text-yellow-500/70 text-xs">Niveau expert</p>
                </div>
              </div>
              <ul className="relative space-y-4 text-sm">
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle2 size={18} className="text-yellow-500 flex-shrink-0" />
                  Tous les marchés (Forex, Crypto, Indices, Commodités)
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle2 size={18} className="text-yellow-500 flex-shrink-0" />
                  Signaux illimités en temps réel
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle2 size={18} className="text-yellow-500 flex-shrink-0" />
                  Précision de 96% avec Neural Network Quantique
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle2 size={18} className="text-yellow-500 flex-shrink-0" />
                  Analyse institutionnelle + Sentiment + API
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20 bg-dark-400 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-primary-400 text-sm font-medium mb-6">
              <Info size={16} />
              FAQ
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
              Questions <span className="gradient-text-animated">Frequentes</span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Comment fonctionne l\'IA de trading?',
                a: 'Notre IA utilise des algorithmes de Deep Learning et Machine Learning pour analyser des millions de points de données en temps réel. Elle détecte des patterns invisibles à l\'œil humain et génère des signaux de trading avec une précision allant jusqu\'à 96%.'
              },
              {
                q: 'Quelle est la différence entre les niveaux d\'IA?',
                a: 'Chaque niveau offre des algorithmes plus sophistiqués. L\'IA Starter utilise l\'analyse technique de base, tandis que l\'IA Elite combine Deep Learning, analyse de sentiment et données institutionnelles pour des prédictions ultra-précises.'
              },
              {
                q: 'Les signaux sont-ils garantis?',
                a: 'Aucun signal n\'est garanti à 100%. Cependant, notre IA Elite affiche un taux de réussite de 96% sur les 12 derniers mois. Le trading comporte toujours des risques.'
              },
              {
                q: 'Puis-je upgrader mon plan?',
                a: 'Oui! Vous pouvez upgrader votre plan à tout moment pour accéder à une IA plus puissante. La différence de prix sera calculée au prorata.'
              }
            ].map((faq, index) => (
              <details key={index} className="group glass-card rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_10px_40px_rgba(34,197,94,0.1)] hover:border-primary-500/30">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none transition-colors duration-300">
                  <span className="text-white font-medium group-hover:text-primary-400 transition-colors duration-300 pr-4">{faq.q}</span>
                  <ChevronDown className="text-gray-400 group-open:rotate-180 transition-all duration-500 group-hover:text-primary-400 flex-shrink-0" size={22} />
                </summary>
                <div className="px-6 pb-6 text-gray-400 leading-relaxed animate-fadeIn border-t border-white/5">
                  <p className="pt-4">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-primary-600/20 to-blue-600/20" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        {/* Top Border Glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-8 animate-float">
            <Sparkles className="text-yellow-400 animate-pulse" size={18} />
            <span className="text-white text-sm font-medium">Offre limitée - Économisez jusqu'à 20%</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Pret a trader avec <span className="gradient-text-animated">l'IA</span>?
          </h2>

          <p className="text-white/80 mb-10 text-lg max-w-2xl mx-auto leading-relaxed">
            Rejoignez plus de 10,000 traders qui utilisent déjà notre IA pour maximiser leurs profits.
          </p>

          {/* CTA Button with pulse ring */}
          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity animate-pulse" />
            <button
              onClick={() => handleSelect(ACCOUNT_SIZES.find(a => a.isBestValue) || ACCOUNT_SIZES[1])}
              className="relative group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-white text-dark-400 rounded-2xl font-bold hover:bg-gray-50 transition-all duration-300 shadow-2xl text-base md:text-lg hover:scale-105 hover:shadow-[0_20px_60px_rgba(255,255,255,0.3)] active:scale-95"
            >
              <Brain size={24} className="transition-transform duration-300 group-hover:rotate-12" />
              Commencer avec l'IA Pro
              <ArrowRight size={22} className="transition-transform duration-300 group-hover:translate-x-2" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-12 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Shield size={16} className="text-green-400" />
              <span>Paiement securise</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <RefreshCw size={16} className="text-blue-400" />
              <span>Remboursement 100%</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Zap size={16} className="text-yellow-400" />
              <span>Activation instantanee</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Pricing
