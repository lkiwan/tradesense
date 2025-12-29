import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Newspaper, ArrowLeft, RefreshCw, Globe, Loader2, TrendingUp, TrendingDown,
  Minus, ExternalLink, Clock, Filter, AlertTriangle, Zap, BarChart3
} from 'lucide-react'
import { newsAPI } from '../../services/api'

const NewsFeedPage = () => {
  const navigate = useNavigate()
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [marketFilter, setMarketFilter] = useState('all')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const [summary, setSummary] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const ITEMS_PER_PAGE = 20

  const markets = [
    { id: 'all', name: 'All Markets', icon: Globe },
    { id: 'us', name: 'US Stocks', flag: '🇺🇸' },
    { id: 'crypto', name: 'Crypto', flag: '🪙' },
    { id: 'forex', name: 'Forex', flag: '💱' },
    { id: 'moroccan', name: 'Morocco', flag: '🇲🇦' }
  ]

  const sentiments = [
    { id: 'all', name: 'All', color: 'gray' },
    { id: 'positive', name: 'Positive', color: 'green', icon: TrendingUp },
    { id: 'neutral', name: 'Neutral', color: 'blue', icon: Minus },
    { id: 'negative', name: 'Negative', color: 'red', icon: TrendingDown }
  ]

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
      setLoading(true)
      setPage(1)
    } else {
      setLoadingMore(true)
    }
    setError(null)

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
      setError('Failed to load news. Please try again.')
    } finally {
      setLoading(false)
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

  useEffect(() => {
    fetchNews(true)
    fetchSummary()
  }, [marketFilter, sentimentFilter])

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

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 sm:p-2.5 rounded-xl bg-dark-100/80 border border-white/5 hover:border-primary-500/30 hover:bg-dark-100 transition-all duration-300 group flex-shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-primary-400 transition-colors" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30 flex-shrink-0">
                  <Newspaper className="text-primary-400 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span>Market News</span>
              </h1>
              <p className="text-gray-400 mt-1 text-xs sm:text-sm md:text-base">
                Live financial news from multiple sources
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchNews(true)}
            disabled={loading}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-dark-100/80 border border-white/5 hover:border-primary-500/30 rounded-xl text-gray-400 hover:text-white transition-all duration-300 flex-shrink-0 min-h-[40px] touch-manipulation text-xs sm:text-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
          </button>
        </div>
      </div>

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
                  {market === 'us' && '🇺🇸'}
                  {market === 'crypto' && '🪙'}
                  {market === 'forex' && '💱'}
                  {market === 'moroccan' && '🇲🇦'}
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
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-3 sm:p-4 overflow-hidden">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Market Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 whitespace-nowrap">Market:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {markets.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMarketFilter(m.id)}
                  className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 min-h-[36px] touch-manipulation ${
                    marketFilter === m.id
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-dark-200/50 text-gray-400 hover:text-white hover:bg-dark-200'
                  }`}
                >
                  {m.icon ? <m.icon className="w-3.5 h-3.5" /> : <span>{m.flag}</span>}
                  <span className="hidden xs:inline sm:inline">{m.id === 'all' ? '' : m.id.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sentiment Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:ml-0 md:ml-auto">
            <div className="flex items-center gap-2 flex-shrink-0">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 whitespace-nowrap">Sentiment:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 bg-dark-200/30 rounded-xl p-1 sm:p-1.5 border border-white/5">
              {sentiments.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSentimentFilter(s.id)}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 min-h-[32px] touch-manipulation ${
                    sentimentFilter === s.id
                      ? s.id === 'positive' ? 'bg-green-500 text-white'
                        : s.id === 'negative' ? 'bg-red-500 text-white'
                        : s.id === 'neutral' ? 'bg-blue-500 text-white'
                        : 'bg-primary-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
                  }`}
                >
                  {s.icon && <s.icon className="w-3 h-3" />}
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* News Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading news...</p>
          </div>
        ) : error ? (
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-medium">{error}</p>
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
                    {/* Image */}
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

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* Source Badge */}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sourceBadge.color}`}>
                          {sourceBadge.name}
                        </span>

                        {/* Sentiment Badge */}
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sentimentStyles.bg} ${sentimentStyles.text}`}>
                          <SentimentIcon className="w-3 h-3" />
                          {article.sentiment}
                        </span>

                        {/* Breaking Badge */}
                        {article.breaking && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                            <Zap className="w-3 h-3" />
                            Breaking
                          </span>
                        )}

                        {/* Morocco Badge */}
                        {article.source?.includes('moroccan') && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400">
                            Morocco
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-white font-medium mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                        {article.title}
                      </h3>

                      {/* Summary */}
                      {article.summary && (
                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                          {article.summary}
                        </p>
                      )}

                      {/* Footer */}
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

            {/* Load More */}
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

      {/* Data Sources */}
      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <Globe className="w-3 h-3 flex-shrink-0" />
        <span className="break-words">Sources: Finnhub, Medias24, BourseNews, Le Matin, La Vie Eco</span>
      </div>
    </div>
  )
}

export default NewsFeedPage
