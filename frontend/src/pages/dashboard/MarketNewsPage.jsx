import { useState, useEffect, useCallback } from 'react'
import {
  Newspaper, RefreshCw, Globe, Loader2, TrendingUp, TrendingDown,
  Minus, ExternalLink, Clock, Filter, AlertTriangle, Zap, BarChart3,
  Calendar, ChevronLeft, ChevronRight, Timer, CalendarDays, List
} from 'lucide-react'
import { newsAPI, resourcesAPI } from '../../services/api'

const MarketNewsPage = () => {
  // Main tab state
  const [activeTab, setActiveTab] = useState('news')

  // ========== NEWS STATES ==========
  const [news, setNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsError, setNewsError] = useState(null)
  const [marketFilter, setMarketFilter] = useState('all')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const [summary, setSummary] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // ========== CALENDAR STATES ==========
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [impactFilter, setImpactFilter] = useState('all')
  const [currencyFilter, setCurrencyFilter] = useState('all')
  const [viewMode, setViewMode] = useState('day')
  const [events, setEvents] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [calendarError, setCalendarError] = useState(null)
  const [countdown, setCountdown] = useState(null)

  const ITEMS_PER_PAGE = 20

  // Main tabs
  const mainTabs = [
    { id: 'news', label: 'Market News', icon: Newspaper },
    { id: 'calendar', label: 'Economic Calendar', icon: Calendar }
  ]

  // ========== NEWS CONSTANTS ==========
  const markets = [
    { id: 'all', name: 'All Markets', icon: Globe },
    { id: 'us', name: 'US Stocks', flag: '\u{1F1FA}\u{1F1F8}' },
    { id: 'crypto', name: 'Crypto', flag: '\u{1FA99}' },
    { id: 'forex', name: 'Forex', flag: '\u{1F4B1}' },
    { id: 'moroccan', name: 'Morocco', flag: '\u{1F1F2}\u{1F1E6}' }
  ]

  const sentiments = [
    { id: 'all', name: 'All', color: 'gray' },
    { id: 'positive', name: 'Positive', color: 'green', icon: TrendingUp },
    { id: 'neutral', name: 'Neutral', color: 'blue', icon: Minus },
    { id: 'negative', name: 'Negative', color: 'red', icon: TrendingDown }
  ]

  // ========== CALENDAR CONSTANTS ==========
  const impactColors = {
    high: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
    medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
    low: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' }
  }

  const currencyFlags = {
    USD: '\u{1F1FA}\u{1F1F8}', EUR: '\u{1F1EA}\u{1F1FA}', GBP: '\u{1F1EC}\u{1F1E7}', JPY: '\u{1F1EF}\u{1F1F5}',
    AUD: '\u{1F1E6}\u{1F1FA}', CAD: '\u{1F1E8}\u{1F1E6}', CHF: '\u{1F1E8}\u{1F1ED}', CNY: '\u{1F1E8}\u{1F1F3}',
    NZD: '\u{1F1F3}\u{1F1FF}', MAD: '\u{1F1F2}\u{1F1E6}', ZAR: '\u{1F1FF}\u{1F1E6}', MXN: '\u{1F1F2}\u{1F1FD}'
  }

  const currencies = [
    { code: 'all', name: 'All Currencies' },
    { code: 'USD', name: 'USD' },
    { code: 'EUR', name: 'EUR' },
    { code: 'GBP', name: 'GBP' },
    { code: 'JPY', name: 'JPY' },
    { code: 'MAD', name: 'MAD' },
    { code: 'AUD', name: 'AUD' },
    { code: 'CAD', name: 'CAD' },
    { code: 'CHF', name: 'CHF' },
    { code: 'CNY', name: 'CNY' },
  ]

  // ========== NEWS FUNCTIONS ==========
  const getSentimentStyles = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return {
          bg: 'bg-green-500/10',
          text: 'text-green-400',
          border: 'border-green-500/30',
          icon: TrendingUp
        }
      case 'negative':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          border: 'border-red-500/30',
          icon: TrendingDown
        }
      default:
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          icon: Minus
        }
    }
  }

  const fetchNews = useCallback(async (reset = false) => {
    if (reset) {
      setNewsLoading(true)
      setPage(1)
    } else {
      setLoadingMore(true)
    }
    setNewsError(null)

    try {
      const currentPage = reset ? 1 : page
      const sentiment = sentimentFilter !== 'all' ? sentimentFilter : null

      const response = await newsAPI.getNews(
        marketFilter,
        null,
        currentPage * ITEMS_PER_PAGE,
        sentiment
      )

      const fetchedNews = response.data.news || []

      if (reset) {
        setNews(fetchedNews)
      } else {
        setNews(prev => [...prev, ...fetchedNews.slice(prev.length)])
      }

      setHasMore(fetchedNews.length === currentPage * ITEMS_PER_PAGE)
    } catch (err) {
      console.error('Failed to fetch news:', err)
      setNewsError('Failed to load news. Please try again.')
    } finally {
      setNewsLoading(false)
      setLoadingMore(false)
    }
  }, [marketFilter, sentimentFilter, page])

  const fetchSummary = async () => {
    try {
      const response = await newsAPI.getSummary()
      setSummary(response.data.summary)
    } catch (err) {
      console.error('Failed to fetch summary:', err)
    }
  }

  const loadMore = () => {
    setPage(prev => prev + 1)
    fetchNews(false)
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

  const getSourceBadge = (source) => {
    const sources = {
      finnhub: { name: 'Finnhub', color: 'bg-blue-500/20 text-blue-400' },
      medias24: { name: 'Medias24', color: 'bg-orange-500/20 text-orange-400' },
      boursenews: { name: 'BourseNews', color: 'bg-purple-500/20 text-purple-400' },
      lematin: { name: 'Le Matin', color: 'bg-red-500/20 text-red-400' },
      lavieeco: { name: 'La Vie Eco', color: 'bg-green-500/20 text-green-400' }
    }
    return sources[source] || { name: source || 'Unknown', color: 'bg-gray-500/20 text-gray-400' }
  }

  // ========== CALENDAR FUNCTIONS ==========
  const fetchCalendarEvents = async () => {
    setCalendarLoading(true)
    setCalendarError(null)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const impact = impactFilter !== 'all' ? impactFilter : null
      const currency = currencyFilter !== 'all' ? currencyFilter : null

      const response = await resourcesAPI.getCalendarEvents(dateStr, impact, currency)
      let fetchedEvents = response.data.events || []

      if (viewMode === 'week') {
        const weekEvents = []
        for (let i = 0; i < 7; i++) {
          const date = new Date(selectedDate)
          date.setDate(date.getDate() + i)
          const dayStr = date.toISOString().split('T')[0]
          try {
            const dayResponse = await resourcesAPI.getCalendarEvents(dayStr, impact, currency)
            const dayEvents = (dayResponse.data.events || []).map(e => ({
              ...e,
              displayDate: dayStr
            }))
            weekEvents.push(...dayEvents)
          } catch (e) {
            console.error(`Failed to fetch events for ${dayStr}`)
          }
        }
        fetchedEvents = weekEvents
      }

      setEvents(fetchedEvents)

      try {
        const upcomingRes = await resourcesAPI.getUpcomingEvents()
        setUpcomingEvents(upcomingRes.data.events || [])
      } catch (e) {
        console.error('Failed to fetch upcoming events')
      }
    } catch (err) {
      console.error('Failed to fetch calendar events:', err)
      setCalendarError('Failed to load economic events. Please try again.')
      setEvents([])
    } finally {
      setCalendarLoading(false)
    }
  }

  const navigateDate = (days) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // ========== EFFECTS ==========
  useEffect(() => {
    if (activeTab === 'news') {
      fetchNews(true)
      fetchSummary()
    }
  }, [activeTab, marketFilter, sentimentFilter])

  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchCalendarEvents()
    }
  }, [activeTab, selectedDate, impactFilter, currencyFilter, viewMode])

  useEffect(() => {
    if (activeTab !== 'calendar') return

    const updateCountdown = () => {
      const now = new Date()
      const nextHighImpact = upcomingEvents.find(e => e.impact === 'high')

      if (nextHighImpact && nextHighImpact.datetime) {
        const eventTime = new Date(nextHighImpact.datetime)
        const diff = eventTime - now

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)

          setCountdown({
            event: nextHighImpact,
            hours,
            minutes,
            seconds,
            total: diff
          })
        } else {
          setCountdown(null)
        }
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [activeTab, upcomingEvents])

  // ========== RENDER NEWS TAB ==========
  const renderNewsTab = () => (
    <div className="space-y-6">
      {/* Market Sentiment Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summary).map(([market, data]) => (
            <div
              key={market}
              className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 hover:border-primary-500/20 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">
                  {market === 'us' && '\u{1F1FA}\u{1F1F8}'}
                  {market === 'crypto' && '\u{1FA99}'}
                  {market === 'forex' && '\u{1F4B1}'}
                  {market === 'moroccan' && '\u{1F1F2}\u{1F1E6}'}
                </span>
                <span className="text-white font-medium capitalize">{market}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="h-2 bg-dark-200/50 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${data.positive || 0}%` }}
                    />
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${data.neutral || 0}%` }}
                    />
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${data.negative || 0}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-400">{data.total || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Market Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Market:</span>
            <div className="flex flex-wrap gap-2">
              {markets.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMarketFilter(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    marketFilter === m.id
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-dark-200/50 text-gray-400 hover:text-white hover:bg-dark-200'
                  }`}
                >
                  {m.icon ? <m.icon className="w-3.5 h-3.5" /> : <span>{m.flag}</span>}
                  <span className="hidden sm:inline">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sentiment Filter */}
          <div className="flex items-center gap-2 md:ml-auto">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Sentiment:</span>
            <div className="flex gap-2 bg-dark-200/30 rounded-xl p-1.5 border border-white/5">
              {sentiments.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSentimentFilter(s.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    sentimentFilter === s.id
                      ? s.id === 'positive' ? 'bg-green-500 text-white'
                        : s.id === 'negative' ? 'bg-red-500 text-white'
                        : s.id === 'neutral' ? 'bg-blue-500 text-white'
                        : 'bg-primary-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
                  }`}
                >
                  {s.icon && <s.icon className="w-3 h-3" />}
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* News Feed */}
      <div className="space-y-4">
        {newsLoading ? (
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading news...</p>
          </div>
        ) : newsError ? (
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-medium">{newsError}</p>
            <button
              onClick={() => fetchNews(true)}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : news.length === 0 ? (
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-200/50 border border-white/5 flex items-center justify-center">
              <Newspaper className="text-gray-500" size={32} />
            </div>
            <p className="text-gray-400 font-medium">No news found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {news.map((article, index) => {
              const sentimentStyles = getSentimentStyles(article.sentiment)
              const sourceBadge = getSourceBadge(article.source)
              const SentimentIcon = sentimentStyles.icon

              return (
                <article
                  key={article.id || index}
                  className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 sm:p-5 hover:border-primary-500/20 transition-all duration-300 group"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {article.image && (
                      <div className="sm:w-32 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-dark-200/50">
                        <img
                          src={article.image}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sourceBadge.color}`}>
                          {sourceBadge.name}
                        </span>

                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sentimentStyles.bg} ${sentimentStyles.text}`}>
                          <SentimentIcon className="w-3 h-3" />
                          {article.sentiment}
                        </span>

                        {article.breaking && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                            <Zap className="w-3 h-3" />
                            Breaking
                          </span>
                        )}

                        {article.source?.includes('moroccan') && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400">
                            Morocco
                          </span>
                        )}
                      </div>

                      <h3 className="text-white font-medium mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                        {article.title}
                      </h3>

                      {article.summary && (
                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                          {article.summary}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(article.published_at || article.datetime)}
                          </span>
                          {article.symbols && article.symbols.length > 0 && (
                            <div className="flex items-center gap-1">
                              {article.symbols.slice(0, 3).map(symbol => (
                                <span
                                  key={symbol}
                                  className="px-1.5 py-0.5 bg-dark-200/50 rounded text-gray-400"
                                >
                                  {symbol}
                                </span>
                              ))}
                              {article.symbols.length > 3 && (
                                <span className="text-gray-500">+{article.symbols.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {article.url && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                          >
                            Read more
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}

            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-dark-100/80 border border-white/5 hover:border-primary-500/30 rounded-xl text-gray-400 hover:text-white transition-all duration-300"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Globe className="w-3 h-3" />
        <span>Sources: Finnhub, Medias24, BourseNews, Le Matin, La Vie Eco</span>
      </div>
    </div>
  )

  // ========== RENDER CALENDAR TAB ==========
  const renderCalendarTab = () => (
    <div className="space-y-6">
      {/* Countdown Banner */}
      {countdown && (
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-xl rounded-xl border border-red-500/30 p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20 animate-pulse">
                <Timer className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-red-300">Next High-Impact Event</p>
                <p className="text-white font-semibold">{countdown.event.event}</p>
                <p className="text-xs text-gray-400">{countdown.event.currency} - {countdown.event.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-center px-3 py-2 bg-dark-300/50 rounded-lg">
                <p className="text-2xl font-bold text-white">{String(countdown.hours).padStart(2, '0')}</p>
                <p className="text-xs text-gray-400">Hours</p>
              </div>
              <span className="text-white text-xl">:</span>
              <div className="text-center px-3 py-2 bg-dark-300/50 rounded-lg">
                <p className="text-2xl font-bold text-white">{String(countdown.minutes).padStart(2, '0')}</p>
                <p className="text-xs text-gray-400">Min</p>
              </div>
              <span className="text-white text-xl">:</span>
              <div className="text-center px-3 py-2 bg-dark-300/50 rounded-lg">
                <p className="text-2xl font-bold text-red-400">{String(countdown.seconds).padStart(2, '0')}</p>
                <p className="text-xs text-gray-400">Sec</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Navigation */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-1 bg-dark-200/30 rounded-lg p-1 border border-white/5">
            <button
              onClick={() => setViewMode('day')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'day'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Day View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Week View"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => navigateDate(viewMode === 'week' ? -7 : -1)}
            className="p-2.5 bg-dark-200/50 hover:bg-dark-200 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all duration-300"
          >
            <ChevronLeft className="text-gray-400" size={20} />
          </button>
          <div className="text-center min-w-[200px]">
            <p className="font-semibold text-white">
              {viewMode === 'week'
                ? `${formatDate(selectedDate).split(',')[0]} - Week View`
                : formatDate(selectedDate)
              }
            </p>
          </div>
          <button
            onClick={() => navigateDate(viewMode === 'week' ? 7 : 1)}
            className="p-2.5 bg-dark-200/50 hover:bg-dark-200 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all duration-300"
          >
            <ChevronRight className="text-gray-400" size={20} />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-primary-500/25 hover:scale-105"
          >
            Today
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="px-3 py-2 bg-dark-200/50 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-primary-500/50"
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>

          <div className="flex gap-2 bg-dark-200/30 rounded-xl p-1.5 border border-white/5">
            {[
              { key: 'all', label: 'All' },
              { key: 'high', label: 'High' },
              { key: 'medium', label: 'Med' },
              { key: 'low', label: 'Low' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setImpactFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  impactFilter === f.key
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-400 font-medium">High Impact</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
          <span className="text-yellow-400 font-medium">Medium Impact</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          <span className="text-green-400 font-medium">Low Impact</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 rounded-lg border border-primary-500/20">
          <Globe className="w-3.5 h-3.5 text-primary-400" />
          <span className="text-primary-400 font-medium">Morocco</span>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
        {calendarLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading economic events...</p>
          </div>
        ) : calendarError ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-medium">{calendarError}</p>
            <button
              onClick={fetchCalendarEvents}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-200/30 border-b border-white/5">
                  <tr className="text-xs text-gray-400 uppercase tracking-wider">
                    {viewMode === 'week' && (
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                    )}
                    <th className="px-4 py-3 text-left font-medium">Time</th>
                    <th className="px-4 py-3 text-left font-medium">Currency</th>
                    <th className="px-4 py-3 text-left font-medium">Event</th>
                    <th className="px-4 py-3 text-center font-medium">Impact</th>
                    <th className="px-4 py-3 text-right font-medium">Forecast</th>
                    <th className="px-4 py-3 text-right font-medium">Previous</th>
                    <th className="px-4 py-3 text-right font-medium">Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {events.map((event, index) => (
                    <tr
                      key={event.id || index}
                      className={`hover:bg-dark-200/50 transition-all duration-300 ${
                        impactColors[event.impact]?.bg || 'bg-transparent'
                      }`}
                    >
                      {viewMode === 'week' && (
                        <td className="px-4 py-4">
                          <span className="text-gray-400 text-sm">
                            {event.displayDate ? new Date(event.displayDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : event.date || '\u2014'}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="text-gray-500" size={14} />
                          <span className="text-white font-medium">{event.time || '\u2014'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {event.flag || currencyFlags[event.currency] || '\u{1F3F3}'}
                          </span>
                          <span className="text-white font-medium">{event.currency}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-white">{event.event}</span>
                        {event.source === 'moroccan' && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 bg-primary-500/20 text-primary-400 rounded">
                            Morocco
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium capitalize ${
                          impactColors[event.impact]?.bg || ''
                        } ${impactColors[event.impact]?.text || 'text-gray-400'}`}>
                          {event.impact === 'high' && <AlertTriangle size={12} />}
                          {event.impact}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-white font-medium">
                        {event.forecast || '\u2014'}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-400">
                        {event.previous || '\u2014'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {event.actual ? (
                          <span className={`font-bold ${
                            event.forecast && parseFloat(event.actual) > parseFloat(event.forecast)
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}>
                            {event.actual}
                          </span>
                        ) : (
                          <span className="text-gray-500">\u2014</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {events.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-200/50 border border-white/5 flex items-center justify-center">
                  <Calendar className="text-gray-500" size={32} />
                </div>
                <p className="text-gray-400 font-medium">No events scheduled for this date</p>
                <p className="text-gray-500 text-sm mt-1">Try selecting a different date or adjusting filters</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Trading Tip */}
      <div className="bg-yellow-500/10 backdrop-blur-xl rounded-xl border border-yellow-500/30 p-4">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-yellow-500/20">
            <AlertTriangle className="text-yellow-400" size={18} />
          </div>
          <div>
            <h4 className="font-medium text-white mb-1">Trading Tip</h4>
            <p className="text-sm text-gray-400">
              High-impact events can cause significant market volatility. Consider reducing position sizes or avoiding trades during these times,
              especially around NFP, FOMC, ECB announcements, and Bank Al-Maghrib rate decisions.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Globe className="w-3 h-3" />
        <span>Data sources: Investing.com, ForexFactory, Bank Al-Maghrib</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30">
              <Newspaper className="text-primary-400 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            Market News & Calendar
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Stay informed with live financial news and economic events
          </p>
        </div>
        <button
          onClick={() => activeTab === 'news' ? fetchNews(true) : fetchCalendarEvents()}
          disabled={activeTab === 'news' ? newsLoading : calendarLoading}
          className="flex items-center gap-2 px-4 py-2 bg-dark-100/80 border border-white/5 hover:border-primary-500/30 rounded-xl text-gray-400 hover:text-white transition-all duration-300"
        >
          <RefreshCw className={`w-4 h-4 ${(activeTab === 'news' ? newsLoading : calendarLoading) ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 bg-dark-100/80 backdrop-blur-xl rounded-xl p-1.5 border border-white/5 overflow-x-auto">
        {mainTabs.map(tab => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              <IconComponent size={16} />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'news' && renderNewsTab()}
      {activeTab === 'calendar' && renderCalendarTab()}
    </div>
  )
}

export default MarketNewsPage
