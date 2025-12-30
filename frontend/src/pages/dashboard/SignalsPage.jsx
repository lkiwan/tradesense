import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Brain, Zap, TrendingUp, TrendingDown, Clock, Target, AlertCircle,
  CheckCircle, XCircle, Filter, RefreshCw, BarChart3, Activity,
  ArrowLeft, Loader2, ChevronRight, Award, Percent, DollarSign, Search
} from 'lucide-react'
import { signalsAPI } from '../../services/api'

// US & Crypto symbols
const US_CRYPTO_SYMBOLS = ['AAPL', 'TSLA', 'GOOGL', 'NVDA', 'BTC-USD', 'ETH-USD']

// Default 8 Moroccan stocks to display
const DEFAULT_MOROCCAN = ['IAM', 'ATW', 'BCP', 'CIH', 'BOA', 'HPS', 'MNG', 'LBV']

// All 80 Moroccan stocks for search
const ALL_MOROCCAN_STOCKS = {
  'IAM': 'Maroc Telecom',
  'ATW': 'Attijariwafa Bank',
  'BCP': 'Banque Centrale Populaire',
  'CIH': 'CIH Bank',
  'BOA': 'Bank of Africa',
  'HPS': 'Hightech Payment Systems',
  'MNG': 'Managem',
  'LBV': 'Label Vie',
  'TQM': 'Taqa Morocco',
  'MSA': 'Marsa Maroc',
  'CDM': 'Crédit du Maroc',
  'CMA': 'Ciments du Maroc',
  'CSR': 'Cosumar',
  'LHM': 'Lesieur Cristal',
  'WAA': 'Wafa Assurance',
  'SAH': 'Saham Assurance',
  'AGM': 'Agma',
  'AFM': 'Afma',
  'ATL': 'Atlanta',
  'SID': 'Sonasid',
  'SMI': 'SMI',
  'CMT': 'CMT',
  'GAZ': 'Afriquia Gaz',
  'TMA': 'Total Maroc',
  'ADH': 'Addoha',
  'RDS': 'Résidences Dar Saada',
  'ALM': 'Alliances',
  'DLM': 'Delattre Levivier',
  'STR': 'Stroc Industrie',
  'SNP': 'SNEP',
  'SRM': 'SRMM',
  'NEJ': 'Nexans',
  'NKL': 'Ennakl',
  'M2M': 'M2M Group',
  'IBC': 'IB Maroc',
  'HPS': 'HPS',
  'DYT': 'Delta Holding',
  'CTM': 'CTM',
  'COL': 'Colorado',
  'JET': 'Jet Contractors',
  'ARD': 'Aradei Capital',
  'IMO': 'Immorente',
  'BAL': 'Balima',
  'MUT': 'Mutandis',
  'FBR': 'Fenie Brossette',
  'ADI': 'Adi',
  'CFG': 'CFG Bank',
  'BCI': 'BMCI',
  'SBM': 'Société de Bourse',
  'OUL': 'Oulmès',
  'MOX': 'Maghreb Oxygène',
  'GTM': 'GTM',
  'TGC': 'Tgcc',
  'SAM': 'Sanlam',
  'PRO': 'Promopharm',
  'SOT': 'Sotemi',
  'MDP': 'Med Paper',
  'CAP': 'Cartier Saada',
  'DIS': 'Disway',
  'EQD': 'Eqdom',
  'MAB': 'Maroc Leasing',
  'MLE': 'Maghrebail',
  'SLF': 'Salafin',
  'DHO': 'Dari Couspate',
  'ZDJ': 'Zellidja',
  'AKT': 'Auto Nejma',
  'VCN': 'Involys',
  'CMG': 'Comptoir Métallurgique',
  'DRI': 'Dari Couspate',
  'LES': 'Lesieur',
  'MIC': 'Microdata',
  'S2M': 'S2M',
  'REB': 'Rebab',
  'INV': 'Involys',
  'DWY': 'Disway',
  'RIS': 'Risma',
  'CRS': 'Carsud',
  'UMR': 'Unimer',
  'ATH': 'Auto Hall'
}

const SYMBOLS = [...US_CRYPTO_SYMBOLS, ...DEFAULT_MOROCCAN]

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds

const SignalsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [timeframe, setTimeframe] = useState('30')
  const [signals, setSignals] = useState([])
  const [stats, setStats] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [symbolAnalysis, setSymbolAnalysis] = useState(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [nextRefresh, setNextRefresh] = useState(AUTO_REFRESH_INTERVAL / 1000) // countdown in seconds
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [moroccanSearch, setMoroccanSearch] = useState('')
  const [showMoroccanDropdown, setShowMoroccanDropdown] = useState(false)

  // Filter Moroccan stocks based on search
  const filteredMoroccanStocks = Object.entries(ALL_MOROCCAN_STOCKS).filter(([symbol, name]) => {
    if (!moroccanSearch) return false
    const search = moroccanSearch.toLowerCase()
    return symbol.toLowerCase().includes(search) || name.toLowerCase().includes(search)
  }).slice(0, 8) // Limit to 8 results

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [timeframe])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchData()
      setLastUpdated(new Date())
      setNextRefresh(AUTO_REFRESH_INTERVAL / 1000)
    }, AUTO_REFRESH_INTERVAL)

    // Countdown timer - update every second
    const countdownInterval = setInterval(() => {
      setNextRefresh(prev => (prev > 0 ? prev - 1 : AUTO_REFRESH_INTERVAL / 1000))
    }, 1000)

    return () => {
      clearInterval(refreshInterval)
      clearInterval(countdownInterval)
    }
  }, [timeframe])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [historyRes, statsRes, leaderboardRes] = await Promise.all([
        signalsAPI.getHistory(50),
        signalsAPI.getStats(parseInt(timeframe)),
        signalsAPI.getLeaderboard(parseInt(timeframe), 5)
      ])

      setSignals(historyRes.data.signals || [])
      setStats(statsRes.data)
      setLeaderboard(leaderboardRes.data.leaderboard || [])
    } catch (error) {
      console.error('Failed to fetch signals data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    setLastUpdated(new Date())
    setNextRefresh(AUTO_REFRESH_INTERVAL / 1000) // Reset countdown after manual refresh
  }

  // Format countdown time
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const fetchSymbolAnalysis = async (symbol) => {
    setSelectedSymbol(symbol)
    setLoadingAnalysis(true)
    try {
      const [technicalRes, sentimentRes] = await Promise.all([
        signalsAPI.getTechnical(symbol),
        signalsAPI.getSentiment(symbol)
      ])

      setSymbolAnalysis({
        technical: technicalRes.data,
        sentiment: sentimentRes.data
      })
    } catch (error) {
      console.error('Failed to fetch symbol analysis:', error)
      setSymbolAnalysis(null)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const filteredSignals = signals.filter(signal => {
    if (filter === 'all') return true
    if (filter === 'buy') return signal.signal_type === 'BUY'
    if (filter === 'sell') return signal.signal_type === 'SELL'
    if (filter === 'active') return signal.status === 'active'
    if (filter === 'wins') return signal.status === 'hit_tp'
    if (filter === 'losses') return signal.status === 'hit_sl'
    return true
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Clock size={14} className="text-blue-400" />
      case 'hit_tp': return <CheckCircle size={14} className="text-green-400" />
      case 'hit_sl': return <XCircle size={14} className="text-red-400" />
      case 'expired': return <AlertCircle size={14} className="text-yellow-400" />
      default: return null
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return t('signals.status.active')
      case 'hit_tp': return t('signals.status.targetHit')
      case 'hit_sl': return t('signals.status.stopped')
      case 'expired': return t('signals.status.expired')
      case 'closed': return t('signals.status.closed')
      default: return status
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getSignalColor = (signal) => {
    if (signal === 'strong_buy' || signal === 'buy') return 'text-green-400'
    if (signal === 'strong_sell' || signal === 'sell') return 'text-red-400'
    return 'text-gray-400'
  }

  const getScoreColor = (score) => {
    if (score >= 40) return 'text-green-400'
    if (score >= 20) return 'text-green-300'
    if (score <= -40) return 'text-red-400'
    if (score <= -20) return 'text-red-300'
    return 'text-gray-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-dark-100/80 border border-white/5 hover:border-primary-500/30 hover:bg-dark-100 transition-all duration-300 group"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-primary-400 transition-colors" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30">
                <Brain className="text-primary-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              {t('signals.title')}
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              {t('signals.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 rounded-xl border border-green-500/30">
            <Zap size={16} className="text-green-400" />
            <span className="text-sm text-green-400 font-medium">{t('signals.aiActive')}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-primary-500/10 rounded-xl border border-primary-500/30">
            <Clock size={14} className="text-primary-400" />
            <span className="text-xs text-primary-400 font-mono">{formatCountdown(nextRefresh)}</span>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-dark-100/80 border border-white/5 hover:border-primary-500/30 rounded-xl text-gray-400 hover:text-white transition-all duration-300"
            title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {t('signals.refresh')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-12 text-center">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('signals.loading')}</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-5 border border-white/5 hover:border-primary-500/30 transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-primary-400" />
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{t('signals.totalSignals')}</p>
                </div>
                <p className="text-2xl font-bold text-white group-hover:text-primary-400 transition-colors">
                  {stats.total_signals}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stats.active_signals} {t('signals.activeSignals')}</p>
              </div>
              <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-5 border border-white/5 hover:border-green-500/30 transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{t('signals.winRate')}</p>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats.win_rate}%</p>
                <p className="text-xs text-gray-500 mt-1">{stats.wins}W / {stats.losses}L</p>
              </div>
              <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-5 border border-white/5 hover:border-primary-500/30 transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-primary-400" />
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{t('signals.totalReturn')}</p>
                </div>
                <p className={`text-2xl font-bold ${stats.total_pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.total_pnl_percent >= 0 ? '+' : ''}{stats.total_pnl_percent}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('signals.lastDays', { days: timeframe })}</p>
              </div>
              <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-5 border border-white/5 hover:border-primary-500/30 transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{t('signals.profitFactor')}</p>
                </div>
                <p className="text-2xl font-bold text-primary-400">{stats.profit_factor}x</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('signals.avgWinLoss', { win: stats.avg_win_percent, loss: stats.avg_loss_percent })}
                </p>
              </div>
            </div>
          )}

          {/* Quick Symbol Analysis */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary-400" />
              {t('signals.quickAnalysis')}
            </h3>

            {/* US & Crypto Symbols */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">US & Crypto</p>
              <div className="flex flex-wrap gap-2">
                {US_CRYPTO_SYMBOLS.map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => fetchSymbolAnalysis(symbol)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      selectedSymbol === symbol
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-200/50 text-gray-400 hover:text-white hover:bg-dark-200'
                    }`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Moroccan Stocks */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                🇲🇦 Actions Marocaines
                <span className="text-primary-400">({Object.keys(ALL_MOROCCAN_STOCKS).length} total)</span>
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {DEFAULT_MOROCCAN.map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => fetchSymbolAnalysis(symbol)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      selectedSymbol === symbol
                        ? 'bg-green-500 text-white'
                        : 'bg-green-500/10 text-green-400 hover:text-white hover:bg-green-500/30 border border-green-500/30'
                    }`}
                    title={ALL_MOROCCAN_STOCKS[symbol]}
                  >
                    {symbol}
                  </button>
                ))}
              </div>

              {/* Search Bar for All Moroccan Stocks */}
              <div className="relative">
                <div className="flex items-center gap-2 bg-dark-200/50 rounded-lg px-3 py-2 border border-white/5 focus-within:border-green-500/50">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={moroccanSearch}
                    onChange={(e) => {
                      setMoroccanSearch(e.target.value)
                      setShowMoroccanDropdown(e.target.value.length > 0)
                    }}
                    onFocus={() => moroccanSearch && setShowMoroccanDropdown(true)}
                    onBlur={() => setTimeout(() => setShowMoroccanDropdown(false), 200)}
                    placeholder="Rechercher une action marocaine (ex: Maroc Telecom, BCP...)"
                    className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
                  />
                  {moroccanSearch && (
                    <button
                      onClick={() => {
                        setMoroccanSearch('')
                        setShowMoroccanDropdown(false)
                      }}
                      className="text-gray-500 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Dropdown Results */}
                {showMoroccanDropdown && filteredMoroccanStocks.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-dark-100 border border-white/10 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                    {filteredMoroccanStocks.map(([symbol, name]) => (
                      <button
                        key={symbol}
                        onClick={() => {
                          fetchSymbolAnalysis(symbol)
                          setMoroccanSearch('')
                          setShowMoroccanDropdown(false)
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-green-500/10 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <span className="font-medium text-green-400">{symbol}</span>
                          <span className="text-gray-400 ml-2 text-sm">{name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-green-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loadingAnalysis && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
              </div>
            )}

            {symbolAnalysis && !loadingAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Technical Analysis */}
                <div className="bg-dark-200/30 rounded-xl p-4 border border-white/5">
                  <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {t('signals.technicalAnalysis')}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t('signals.signal')}</span>
                      <span className={`font-bold ${getSignalColor(symbolAnalysis.technical.signal)}`}>
                        {symbolAnalysis.technical.signal?.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t('signals.score')}</span>
                      <span className={`font-bold ${getScoreColor(symbolAnalysis.technical.score)}`}>
                        {symbolAnalysis.technical.score > 0 ? '+' : ''}{symbolAnalysis.technical.score}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t('signals.confidence')}</span>
                      <span className="text-white font-medium">{symbolAnalysis.technical.confidence}%</span>
                    </div>
                    {symbolAnalysis.technical.entry_price && (
                      <>
                        <div className="border-t border-white/5 pt-3 mt-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{t('signals.entry')}</span>
                            <span className="text-white">${symbolAnalysis.technical.entry_price?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-400">{t('signals.stopLoss')}</span>
                            <span className="text-red-400">${symbolAnalysis.technical.stop_loss?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-400">{t('signals.takeProfit')}</span>
                            <span className="text-green-400">${symbolAnalysis.technical.take_profit?.toLocaleString()}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {symbolAnalysis.technical.reasons && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-xs text-gray-500 mb-2">{t('signals.reasons')}:</p>
                        <div className="flex flex-wrap gap-1">
                          {symbolAnalysis.technical.reasons.slice(0, 3).map((reason, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-dark-200/50 rounded text-gray-400">
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sentiment Analysis */}
                <div className="bg-dark-200/30 rounded-xl p-4 border border-white/5">
                  <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    {t('signals.sentimentAnalysis')}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t('signals.sentiment')}</span>
                      <span className={`font-bold ${getSignalColor(symbolAnalysis.sentiment.sentiment)}`}>
                        {symbolAnalysis.sentiment.sentiment?.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t('signals.score')}</span>
                      <span className={`font-bold ${getScoreColor(symbolAnalysis.sentiment.score)}`}>
                        {symbolAnalysis.sentiment.score > 0 ? '+' : ''}{symbolAnalysis.sentiment.score}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t('signals.articles')}</span>
                      <span className="text-white font-medium">{symbolAnalysis.sentiment.article_count}</span>
                    </div>
                    {symbolAnalysis.sentiment.breakdown && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-dark-200/50 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${(symbolAnalysis.sentiment.breakdown.positive / symbolAnalysis.sentiment.article_count * 100) || 0}%` }}
                            />
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${(symbolAnalysis.sentiment.breakdown.neutral / symbolAnalysis.sentiment.article_count * 100) || 0}%` }}
                            />
                            <div
                              className="h-full bg-red-500"
                              style={{ width: `${(symbolAnalysis.sentiment.breakdown.negative / symbolAnalysis.sentiment.article_count * 100) || 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                          <span className="text-green-400">+{symbolAnalysis.sentiment.breakdown.positive}</span>
                          <span className="text-blue-400">{symbolAnalysis.sentiment.breakdown.neutral}</span>
                          <span className="text-red-400">-{symbolAnalysis.sentiment.breakdown.negative}</span>
                        </div>
                      </div>
                    )}
                    {symbolAnalysis.sentiment.keywords?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-xs text-gray-500 mb-2">{t('signals.keywords')}:</p>
                        <div className="flex flex-wrap gap-1">
                          {symbolAnalysis.sentiment.keywords.slice(0, 5).map((kw, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2 py-0.5 rounded ${
                                kw.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters and Period */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm text-gray-400">{t('signals.filter')}:</span>
            </div>
            {['all', 'buy', 'sell', 'active', 'wins', 'losses'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-100 text-gray-400 hover:text-white border border-dark-200'
                }`}
              >
                {f === 'all' ? t('signals.all') : f === 'buy' ? t('signals.buy') : f === 'sell' ? t('signals.sell') : f === 'active' ? t('signals.active') : f === 'wins' ? t('signals.wins') : t('signals.losses')}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-gray-400">{t('signals.period')}:</span>
              {['7', '30', '90'].map(days => (
                <button
                  key={days}
                  onClick={() => setTimeframe(days)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    timeframe === days
                      ? 'bg-dark-200 text-white'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                {t('signals.topSignals')} ({t('signals.lastDays', { days: timeframe })})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {leaderboard.map((signal, index) => (
                  <div
                    key={index}
                    className="bg-dark-200/30 rounded-xl p-3 border border-white/5 hover:border-yellow-500/30 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-dark-200 text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-bold text-white">{signal.symbol}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        signal.signal_type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {signal.signal_type}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-green-400">+{signal.pnl_percent}%</p>
                    <p className="text-xs text-gray-500">{signal.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signals List */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-white">{t('signals.signalHistory')}</h3>
              <span className="text-sm text-gray-400">{filteredSignals.length} {t('signals.totalSignals').toLowerCase()}</span>
            </div>
            <div className="divide-y divide-dark-200">
              {filteredSignals.length === 0 ? (
                <div className="p-8 text-center">
                  <Brain className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">{t('signals.noSignals')}</p>
                </div>
              ) : (
                filteredSignals.map((signal, index) => (
                  <div key={signal.id || index} className="p-4 hover:bg-dark-200/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          signal.signal_type === 'BUY' ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          {signal.signal_type === 'BUY' ? (
                            <TrendingUp className="text-green-400" size={24} />
                          ) : (
                            <TrendingDown className="text-red-400" size={24} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{signal.symbol}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              signal.signal_type === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {signal.signal_type}
                            </span>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(signal.status)}
                              <span className="text-xs text-gray-500">{getStatusLabel(signal.status)}</span>
                            </div>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              signal.source === 'technical' ? 'bg-blue-500/20 text-blue-400' :
                              signal.source === 'sentiment' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-primary-500/20 text-primary-400'
                            }`}>
                              {signal.source}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            Entry: ${parseFloat(signal.entry_price).toLocaleString()}
                            {signal.take_profit && ` | TP: $${parseFloat(signal.take_profit).toLocaleString()}`}
                            {signal.stop_loss && ` | SL: $${parseFloat(signal.stop_loss).toLocaleString()}`}
                          </p>
                          {signal.reasons?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {signal.reasons.slice(0, 2).map((reason, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-dark-200/50 rounded text-gray-500">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Brain size={14} className="text-primary-400" />
                          <span className={`font-bold ${
                            signal.confidence >= 80 ? 'text-green-400' : signal.confidence >= 60 ? 'text-yellow-400' : 'text-gray-400'
                          }`}>
                            {signal.confidence}%
                          </span>
                        </div>
                        {signal.pnl_percent !== null && (
                          <p className={`font-bold mt-1 ${signal.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {signal.pnl_percent >= 0 ? '+' : ''}{signal.pnl_percent}%
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(signal.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SignalsPage
