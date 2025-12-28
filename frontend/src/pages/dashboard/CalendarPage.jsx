import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, AlertTriangle, ChevronLeft, ChevronRight, ArrowLeft, RefreshCw, Globe, Loader2, Timer, Bell, CalendarDays, List } from 'lucide-react'
import { resourcesAPI } from '../../services/api'

const CalendarPage = () => {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [impactFilter, setImpactFilter] = useState('all')
  const [currencyFilter, setCurrencyFilter] = useState('all')
  const [viewMode, setViewMode] = useState('day') // 'day' or 'week'
  const [events, setEvents] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [countdown, setCountdown] = useState(null)

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
  }, [selectedDate, impactFilter, currencyFilter, viewMode])

  // Countdown timer for next high-impact event
  useEffect(() => {
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
  }, [upcomingEvents])

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const impact = impactFilter !== 'all' ? impactFilter : null
      const currency = currencyFilter !== 'all' ? currencyFilter : null

      // Fetch events for selected date/week
      const response = await resourcesAPI.getCalendarEvents(dateStr, impact, currency)
      let fetchedEvents = response.data.events || []

      // For week view, fetch multiple days
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

      // Also fetch upcoming events for countdown
      try {
        const upcomingRes = await resourcesAPI.getUpcomingEvents()
        setUpcomingEvents(upcomingRes.data.events || [])
      } catch (e) {
        console.error('Failed to fetch upcoming events')
      }
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 sm:p-2.5 rounded-xl bg-dark-100/80 border border-white/5 hover:border-primary-500/30 hover:bg-dark-100 transition-all duration-300 group min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-primary-400 transition-colors" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30">
                <Calendar className="text-primary-400 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
              <span className="hidden xs:inline">Economic </span>Calendar
            </h1>
            <p className="text-gray-400 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base">
              Live economic events
            </p>
          </div>
        </div>
        <button
          onClick={fetchEvents}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-dark-100/80 border border-white/5 hover:border-primary-500/30 rounded-xl text-gray-400 hover:text-white transition-all duration-300 min-h-[40px] text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Countdown Banner */}
      {countdown && (
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-xl rounded-xl border border-red-500/30 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/20 animate-pulse flex-shrink-0">
                <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-red-300">Next High-Impact</p>
                <p className="text-white font-semibold text-sm sm:text-base truncate">{countdown.event.event}</p>
                <p className="text-[10px] sm:text-xs text-gray-400">{countdown.event.currency} - {countdown.event.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-center">
              <div className="text-center px-2 sm:px-3 py-1 sm:py-2 bg-dark-300/50 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-white">{String(countdown.hours).padStart(2, '0')}</p>
                <p className="text-[9px] sm:text-xs text-gray-400">H</p>
              </div>
              <span className="text-white text-sm sm:text-xl">:</span>
              <div className="text-center px-2 sm:px-3 py-1 sm:py-2 bg-dark-300/50 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-white">{String(countdown.minutes).padStart(2, '0')}</p>
                <p className="text-[9px] sm:text-xs text-gray-400">M</p>
              </div>
              <span className="text-white text-sm sm:text-xl">:</span>
              <div className="text-center px-2 sm:px-3 py-1 sm:py-2 bg-dark-300/50 rounded-lg">
                <p className="text-lg sm:text-2xl font-bold text-red-400">{String(countdown.seconds).padStart(2, '0')}</p>
                <p className="text-[9px] sm:text-xs text-gray-400">S</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Navigation */}
      <div className="relative overflow-hidden bg-gradient-to-br from-dark-100/80 to-dark-200/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/5 hover:border-primary-500/20 transition-all duration-300 shadow-lg p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
        {/* Row 1: Navigation */}
        <div className="flex items-center justify-between gap-2">
          {/* View Toggle */}
          <div className="flex gap-0.5 sm:gap-1 bg-dark-200/30 rounded-lg p-0.5 sm:p-1 border border-white/5">
            <button
              onClick={() => setViewMode('day')}
              className={`p-1.5 sm:p-2 rounded-lg transition-all min-w-[32px] ${
                viewMode === 'day'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Day View"
            >
              <List className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`p-1.5 sm:p-2 rounded-lg transition-all min-w-[32px] ${
                viewMode === 'week'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Week View"
            >
              <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => navigateDate(viewMode === 'week' ? -7 : -1)}
              className="p-1.5 sm:p-2.5 bg-dark-200/50 hover:bg-dark-200 rounded-lg sm:rounded-xl border border-white/5 hover:border-primary-500/30 transition-all duration-300 min-w-[32px]"
            >
              <ChevronLeft className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="text-center min-w-[80px] sm:min-w-[150px] md:min-w-[200px]">
              <p className="font-semibold text-white text-xs sm:text-sm md:text-base truncate">
                {viewMode === 'week'
                  ? `Week`
                  : formatDate(selectedDate).split(',').slice(0, 2).join(',')
                }
              </p>
            </div>
            <button
              onClick={() => navigateDate(viewMode === 'week' ? 7 : 1)}
              className="p-1.5 sm:p-2.5 bg-dark-200/50 hover:bg-dark-200 rounded-lg sm:rounded-xl border border-white/5 hover:border-primary-500/30 transition-all duration-300 min-w-[32px]"
            >
              <ChevronRight className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-2 sm:px-4 py-1.5 sm:py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-300 shadow-lg shadow-primary-500/25 text-xs sm:text-sm min-h-[32px]"
          >
            Today
          </button>
        </div>

        {/* Row 2: Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Currency Filter */}
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-dark-200/50 border border-white/5 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-primary-500/50 min-h-[36px]"
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>

          {/* Impact Filter */}
          <div className="flex gap-1 sm:gap-2 bg-dark-200/30 rounded-lg sm:rounded-xl p-1 sm:p-1.5 border border-white/5">
            {[
              { key: 'all', label: 'All' },
              { key: 'high', label: 'H' },
              { key: 'medium', label: 'M' },
              { key: 'low', label: 'L' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setImpactFilter(f.key)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-medium transition-all duration-300 min-w-[28px] ${
                  impactFilter === f.key
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
                }`}
              >
                <span className="hidden sm:inline">{f.key === 'all' ? 'All' : f.key === 'high' ? 'High' : f.key === 'medium' ? 'Med' : 'Low'}</span>
                <span className="sm:hidden">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Legend */}
      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-400 font-medium">High</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-yellow-500 rounded-full" />
          <span className="text-yellow-400 font-medium">Med</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full" />
          <span className="text-green-400 font-medium">Low</span>
        </div>
      </div>

      {/* Events Table */}
      <div className="relative overflow-hidden bg-gradient-to-br from-dark-100/80 to-dark-200/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/5 hover:border-primary-500/20 transition-all duration-300 shadow-lg">
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
                            {event.displayDate ? new Date(event.displayDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : event.date || '—'}
                          </span>
                        </td>
                      )}
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
              <div className="p-6 sm:p-12 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-dark-200/50 border border-white/5 flex items-center justify-center">
                  <Calendar className="text-gray-500 w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <p className="text-gray-400 font-medium text-sm sm:text-base">No events for this date</p>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">Try a different date or filters</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Trading Tip */}
      <div className="bg-yellow-500/10 backdrop-blur-xl rounded-xl border border-yellow-500/30 p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="p-1 sm:p-1.5 rounded-lg bg-yellow-500/20 flex-shrink-0">
            <AlertTriangle className="text-yellow-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </div>
          <div>
            <h4 className="font-medium text-white mb-0.5 sm:mb-1 text-sm sm:text-base">Trading Tip</h4>
            <p className="text-xs sm:text-sm text-gray-400">
              High-impact events cause significant volatility. Consider reducing positions during NFP, FOMC, and ECB announcements.
            </p>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500">
        <Globe className="w-3 h-3" />
        <span>Sources: Investing.com, ForexFactory</span>
      </div>
    </div>
  )
}

export default CalendarPage
