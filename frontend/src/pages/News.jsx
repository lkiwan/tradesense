import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Newspaper, Clock, TrendingUp, TrendingDown,
  Globe, AlertCircle, Sparkles, RefreshCw
} from 'lucide-react'

const News = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { id: 'all', label: 'Tout' },
    { id: 'stocks', label: 'Actions' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'forex', label: 'Forex' },
    { id: 'morocco', label: 'Maroc' }
  ]

  const news = [
    {
      id: 1,
      title: 'Bitcoin atteint un nouveau sommet historique',
      summary: 'Le BTC depasse les $50,000 suite a l\'approbation des ETF spot par la SEC.',
      category: 'crypto',
      time: '2h',
      sentiment: 'bullish',
      aiSummary: 'Signal positif pour les crypto-actifs. Volume en hausse de 45%.',
      image: null
    },
    {
      id: 2,
      title: 'Maroc Telecom annonce des resultats records',
      summary: 'IAM affiche une croissance de 12% sur le trimestre.',
      category: 'morocco',
      time: '4h',
      sentiment: 'bullish',
      aiSummary: 'Impact positif attendu sur le cours. Objectif: 125 MAD.',
      image: null
    },
    {
      id: 3,
      title: 'La Fed maintient ses taux directeurs',
      summary: 'Jerome Powell indique une possible baisse au T2 2024.',
      category: 'forex',
      time: '6h',
      sentiment: 'neutral',
      aiSummary: 'Volatilite attendue sur EUR/USD. Surveiller les niveaux cles.',
      image: null
    },
    {
      id: 4,
      title: 'Apple depasse les attentes au Q4',
      summary: 'Les ventes d\'iPhone en hausse de 8% malgre la concurrence.',
      category: 'stocks',
      time: '8h',
      sentiment: 'bullish',
      aiSummary: 'Momentum positif. Support a $178, resistance a $195.',
      image: null
    },
    {
      id: 5,
      title: 'Attijariwafa Bank acquiert une banque africaine',
      summary: 'Expansion strategique sur le marche ouest-africain.',
      category: 'morocco',
      time: '12h',
      sentiment: 'bullish',
      aiSummary: 'Operation de croissance externe positive. ATW reste attractif.',
      image: null
    },
    {
      id: 6,
      title: 'Ethereum lance sa mise a jour Dencun',
      summary: 'Les frais de transaction devraient baisser significativement.',
      category: 'crypto',
      time: '1j',
      sentiment: 'bullish',
      aiSummary: 'Catalyseur technique majeur. Objectif court terme: $3,000.',
      image: null
    }
  ]

  const economicCalendar = [
    { time: '14:30', event: 'NFP (US)', importance: 'high' },
    { time: '16:00', event: 'ISM Services', importance: 'medium' },
    { time: '20:00', event: 'Minutes FOMC', importance: 'high' }
  ]

  const filteredNews = activeCategory === 'all'
    ? news
    : news.filter(n => n.category === activeCategory)

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="text-green-500" size={18} />
      case 'bearish':
        return <TrendingDown className="text-red-500" size={18} />
      default:
        return <AlertCircle className="text-yellow-500" size={18} />
    }
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'bullish':
        return 'bg-green-500/10 text-green-500'
      case 'bearish':
        return 'bg-red-500/10 text-red-500'
      default:
        return 'bg-yellow-500/10 text-yellow-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full mb-4">
            <Newspaper className="text-blue-500" size={20} />
            <span className="text-blue-500 font-medium">Actualites en Direct</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('nav.news')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Restez informe avec les dernieres actualites financieres et les analyses IA
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-dark-100 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
              <button
                onClick={() => setLoading(true)}
                className="p-2 rounded-full bg-white dark:bg-dark-100 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-200"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* News List */}
            <div className="space-y-4">
              {filteredNews.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-dark-100 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor(item.sentiment)}`}>
                          {getSentimentIcon(item.sentiment)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {item.time}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-dark-200 rounded text-xs text-gray-600 dark:text-gray-400">
                          {item.category}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {item.summary}
                      </p>

                      {/* AI Summary */}
                      <div className="flex items-start gap-2 p-3 bg-primary-500/5 rounded-lg">
                        <Sparkles className="text-primary-500 flex-shrink-0 mt-0.5" size={16} />
                        <div>
                          <span className="text-xs font-medium text-primary-500">Analyse IA</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {item.aiSummary}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Economic Calendar */}
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock size={20} className="text-primary-500" />
                Calendrier Economique
              </h3>
              <div className="text-sm text-gray-500 mb-4">Aujourd'hui</div>
              <div className="space-y-3">
                {economicCalendar.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-200"
                  >
                    <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
                      {event.time}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {event.event}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      event.importance === 'high' ? 'bg-red-500' :
                      event.importance === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Market Overview */}
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe size={20} className="text-primary-500" />
                Marches Mondiaux
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'S&P 500', value: '4,750.32', change: '+0.85%', up: true },
                  { name: 'NASDAQ', value: '14,890.21', change: '+1.20%', up: true },
                  { name: 'BTC/USD', value: '45,230.00', change: '-0.45%', up: false },
                  { name: 'EUR/USD', value: '1.0920', change: '+0.12%', up: true },
                  { name: 'MASI', value: '12,450.50', change: '+0.35%', up: true }
                ].map((market, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {market.name}
                    </span>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {market.value}
                      </div>
                      <div className={`text-xs ${market.up ? 'text-green-500' : 'text-red-500'}`}>
                        {market.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default News
