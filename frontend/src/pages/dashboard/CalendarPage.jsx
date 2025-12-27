import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, AlertTriangle, ChevronLeft, ChevronRight, ArrowLeft, RefreshCw, Globe, Loader2 } from 'lucide-react'
import { resourcesAPI } from '../../services/api'

const CalendarPage = () => {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [impactFilter, setImpactFilter] = useState('all')
  const [currencyFilter, setCurrencyFilter] = useState('all')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const impactColors = {
    high: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
    medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
    low: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' }
  }

  const currencyFlags = {
    USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
    AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭', CNY: '🇨🇳',
    NZD: '🇳🇿', MAD: '🇲🇦', ZAR: '🇿🇦', MXN: '🇲🇽'
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

  // Fetch events when date or filters change
  useEffect(() => {
    fetchEvents()
  }, [selectedDate, impactFilter, currencyFilter])

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const impact = impactFilter !== 'all' ? impactFilter : null
      const currency = currencyFilter !== 'all' ? currencyFilter : null

      const response = await resourcesAPI.getCalendarEvents(dateStr, impact, currency)
      setEvents(response.data.events || [])
    } catch (err) {
      console.error('Failed to fetch calendar events:', err)
      setError('Failed to load economic events. Please try again.')
      setEvents([])
    } finally {
      setLoading(false)
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
                <Calendar className="text-primary-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              Economic Calendar
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Live economic events from multiple sources
            </p>
          </div>
        </div>
        <button
          onClick={fetchEvents}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-dark-100/80 border border-white/5 hover:border-primary-500/30 rounded-xl text-gray-400 hover:text-white transition-all duration-300"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Date Navigation */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2.5 bg-dark-200/50 hover:bg-dark-200 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all duration-300"
          >
            <ChevronLeft className="text-gray-400" size={20} />
          </button>
          <div className="text-center min-w-[200px]">
            <p className="font-semibold text-white">{formatDate(selectedDate)}</p>
          </div>
          <button
            onClick={() => navigateDate(1)}
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Currency Filter */}
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="px-3 py-2 bg-dark-200/50 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-primary-500/50"
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>

          {/* Impact Filter */}
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
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading economic events...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={fetchEvents}
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
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="text-gray-500" size={14} />
                          <span className="text-white font-medium">{event.time || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {event.flag || currencyFlags[event.currency] || '🏳️'}
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
                        {event.forecast || '—'}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-400">
                        {event.previous || '—'}
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
                          <span className="text-gray-500">—</span>
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

      {/* Data Sources */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Globe className="w-3 h-3" />
        <span>Data sources: Investing.com, ForexFactory, Bank Al-Maghrib</span>
      </div>
    </div>
  )
}

export default CalendarPage
