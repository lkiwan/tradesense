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
    <div className="min-h-screen bg-dark-300">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full mb-6">
            <Brain className="text-purple-400" size={18} />
            <span className="text-purple-300 text-sm font-medium">Propulsé par l'Intelligence Artificielle</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Tradez avec une <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-primary-400 to-blue-400">IA Prédictive</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto mb-8">
            Notre intelligence artificielle analyse des millions de données en temps réel pour prédire les mouvements du marché.
            Plus votre plan est élevé, plus l'IA est puissante et précise.
          </p>

          {/* AI Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-12 mb-12">
            <div className="flex items-center gap-3 bg-dark-100/50 px-5 py-3 rounded-xl">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Brain size={24} className="text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-white">5 Niveaux</p>
                <p className="text-gray-500 text-sm">d'Intelligence IA</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-dark-100/50 px-5 py-3 rounded-xl">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Target size={24} className="text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-white">Jusqu'à 96%</p>
                <p className="text-gray-500 text-sm">de Précision</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-dark-100/50 px-5 py-3 rounded-xl">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 size={24} className="text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-white">+40 Signaux</p>
                <p className="text-gray-500 text-sm">par jour (Elite)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tiers Explanation */}
      <section className="py-8 bg-dark-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-8">
            {Object.entries(AI_TIERS).reverse().map(([key, tier]) => {
              const TierIcon = tier.icon
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 px-4 py-2 bg-dark-100 rounded-lg transition-all duration-300 ease-out
                    hover:scale-110 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                >
                  <div className={`p-1.5 rounded-lg ${tier.bgColor} transition-transform duration-300 hover:rotate-12`}>
                    <TierIcon size={16} className={tier.color} />
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
      <section className="relative py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Toggle */}
          <div className="flex justify-end mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setShowNumbers(!showNumbers)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  showNumbers ? 'bg-primary-500' : 'bg-dark-100'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  showNumbers ? 'left-7' : 'left-1'
                }`} />
              </div>
              <span className="text-gray-300 text-sm">Afficher les chiffres</span>
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
                      <div className={`rounded-2xl transition-all duration-300
                        ${account.isBestValue
                          ? 'bg-dark-100 ring-2 ring-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                          : 'bg-dark-100 ring-1 ring-dark-200 hover:ring-2 hover:ring-primary-500 hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]'
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
                            className={`w-full py-2.5 rounded-lg font-semibold text-white text-xs transition-colors duration-300 flex items-center justify-center gap-1 ${
                              account.isBestValue
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                            }`}
                          >
                            <Rocket size={14} />
                            Commencer
                          </button>
                        </div>
                      </div>

                      {/* Average Reward - Separate section with 5px gap */}
                      <div className="mt-[5px] py-3 bg-dark-100 text-center rounded-xl">
                        <div className="flex items-center justify-center gap-1">
                          <Star size={12} className="text-yellow-500" />
                          <span className="text-white font-bold text-sm">€{account.avgReward.toLocaleString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mt-0.5">
                          <span>Récompense moy.</span>
                          <Info size={10} />
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
      <section className="py-16 bg-dark-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Comment notre <span className="text-purple-400">IA</span> prédit le marché
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Notre technologie combine plusieurs approches d'intelligence artificielle pour maximiser la précision des prédictions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-dark-100 p-6 rounded-2xl border border-dark-200/50 hover:border-purple-500/50 transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer">
              <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Brain className="text-purple-400" size={28} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Deep Learning</h3>
              <p className="text-gray-400 text-sm">Réseaux de neurones profonds analysant les patterns historiques sur 20 ans de données.</p>
            </div>

            <div className="group bg-dark-100 p-6 rounded-2xl border border-dark-200/50 hover:border-blue-500/50 transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <BarChart3 className="text-blue-400" size={28} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Analyse Technique</h3>
              <p className="text-gray-400 text-sm">Plus de 150 indicateurs techniques calculés en temps réel sur tous les timeframes.</p>
            </div>

            <div className="group bg-dark-100 p-6 rounded-2xl border border-dark-200/50 hover:border-green-500/50 transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-2 hover:shadow-xl hover:shadow-green-500/10 cursor-pointer">
              <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <TrendingUp className="text-green-400" size={28} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Sentiment Analysis</h3>
              <p className="text-gray-400 text-sm">Analyse du sentiment des news, réseaux sociaux et rapports économiques.</p>
            </div>

            <div className="group bg-dark-100 p-6 rounded-2xl border border-dark-200/50 hover:border-orange-500/50 transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer">
              <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Zap className="text-orange-400" size={28} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Exécution Rapide</h3>
              <p className="text-gray-400 text-sm">Signaux générés en millisecondes pour capturer les meilleures opportunités.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Pourquoi choisir un plan supérieur?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Starter vs Elite comparison */}
            <div className="group bg-dark-100 p-6 rounded-2xl transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-500/20 rounded-lg transition-transform duration-300 group-hover:scale-110">
                  <Cpu size={20} className="text-gray-400" />
                </div>
                <h3 className="text-white font-semibold">IA Starter</h3>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-gray-400">
                  <CheckCircle2 size={16} className="text-gray-500" />
                  Analyse basique EUR/USD, GBP/USD
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <CheckCircle2 size={16} className="text-gray-500" />
                  5-10 signaux par jour
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <CheckCircle2 size={16} className="text-gray-500" />
                  Précision de 72%
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <CheckCircle2 size={16} className="text-gray-500" />
                  Indicateurs techniques de base
                </li>
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-6 rounded-2xl border border-yellow-500/30 transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/20 hover:border-yellow-500/50 cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                  <Crown size={20} className="text-yellow-400" />
                </div>
                <h3 className="text-white font-semibold">IA Elite</h3>
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full animate-pulse">PREMIUM</span>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle2 size={16} className="text-yellow-500" />
                  Tous les marchés (Forex, Crypto, Indices, Commodités)
                </li>
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle2 size={16} className="text-yellow-500" />
                  Signaux illimités en temps réel
                </li>
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle2 size={16} className="text-yellow-500" />
                  Précision de 96% avec Neural Network Quantique
                </li>
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle2 size={16} className="text-yellow-500" />
                  Analyse institutionnelle + Sentiment + API
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-dark-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            Questions Fréquentes
          </h2>

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
              <details key={index} className="group bg-dark-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none transition-colors duration-300 hover:bg-dark-200/50">
                  <span className="text-white font-medium group-hover:text-primary-400 transition-colors duration-300">{faq.q}</span>
                  <ChevronDown className="text-gray-400 group-open:rotate-180 transition-all duration-300 group-hover:text-primary-400" size={20} />
                </summary>
                <div className="px-5 pb-5 text-gray-400 animate-fadeIn">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-600/20 via-primary-600/20 to-blue-600/20" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <Sparkles className="text-yellow-400" size={18} />
            <span className="text-white text-sm font-medium">Offre limitée - Économisez jusqu'à 20%</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Prêt à trader avec l'IA?
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Rejoignez plus de 10,000 traders qui utilisent déjà notre IA pour maximiser leurs profits.
          </p>
          <button
            onClick={() => handleSelect(ACCOUNT_SIZES.find(a => a.isBestValue) || ACCOUNT_SIZES[1])}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-dark-300 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-xl text-lg hover:scale-105 hover:shadow-2xl hover:shadow-white/20 active:scale-95"
          >
            <Brain size={22} className="transition-transform duration-300 group-hover:rotate-12" />
            Commencer avec l'IA Pro
            <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </section>
    </div>
  )
}

export default Pricing
