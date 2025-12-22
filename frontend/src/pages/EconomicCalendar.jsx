import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar, Clock, AlertTriangle, TrendingUp, TrendingDown,
  Minus, Filter, ChevronLeft, ChevronRight, Globe, Flag
} from 'lucide-react'

const EconomicCalendar = () => {
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filter, setFilter] = useState('all') // all, high, medium, low
  const [selectedCountry, setSelectedCountry] = useState('all')

  // Sample economic events data
  const events = [
    {
      id: 1,
      time: '08:30',
      country: 'US',
      countryFlag: '🇺🇸',
      event: 'Non-Farm Payrolls',
      impact: 'high',
      previous: '227K',
      forecast: '180K',
      actual: null
    },
    {
      id: 2,
      time: '08:30',
      country: 'US',
      countryFlag: '🇺🇸',
      event: 'Unemployment Rate',
      impact: 'high',
      previous: '4.2%',
      forecast: '4.2%',
      actual: null
    },
    {
      id: 3,
      time: '10:00',
      country: 'US',
      countryFlag: '🇺🇸',
      event: 'ISM Services PMI',
      impact: 'medium',
      previous: '52.1',
      forecast: '53.0',
      actual: null
    },
    {
      id: 4,
      time: '14:00',
      country: 'EU',
      countryFlag: '🇪🇺',
      event: 'ECB Interest Rate Decision',
      impact: 'high',
      previous: '3.00%',
      forecast: '2.75%',
      actual: null
    },
    {
      id: 5,
      time: '09:00',
      country: 'UK',
      countryFlag: '🇬🇧',
      event: 'GDP Growth Rate QoQ',
      impact: 'high',
      previous: '0.1%',
      forecast: '0.2%',
      actual: '0.3%'
    },
    {
      id: 6,
      time: '07:00',
      country: 'JP',
      countryFlag: '🇯🇵',
      event: 'BoJ Interest Rate',
      impact: 'high',
      previous: '0.25%',
      forecast: '0.25%',
      actual: null
    },
    {
      id: 7,
      time: '11:00',
      country: 'EU',
      countryFlag: '🇪🇺',
      event: 'Consumer Confidence',
      impact: 'low',
      previous: '-14.5',
      forecast: '-14.0',
      actual: null
    },
    {
      id: 8,
      time: '15:30',
      country: 'US',
      countryFlag: '🇺🇸',
      event: 'Crude Oil Inventories',
      impact: 'medium',
      previous: '-1.2M',
      forecast: '-0.8M',
      actual: null
    }
  ]

  const countries = [
    { code: 'all', name: 'All Countries', flag: '🌍' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'EU', name: 'European Union', flag: '🇪🇺' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  ]

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-orange-500'
      case 'low':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getImpactBadge = (impact) => {
    switch (impact) {
      case 'high':
        return 'text-red-500 bg-red-500/10'
      case 'medium':
        return 'text-orange-500 bg-orange-500/10'
      case 'low':
        return 'text-yellow-600 bg-yellow-500/10'
      default:
        return 'text-gray-500 bg-gray-500/10'
    }
  }

  const filteredEvents = events
    .filter(event => filter === 'all' || event.impact === filter)
    .filter(event => selectedCountry === 'all' || event.country === selectedCountry)
    .sort((a, b) => a.time.localeCompare(b.time))

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + direction)
    setSelectedDate(newDate)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full text-primary-500 text-sm font-medium mb-4">
            <Calendar size={16} />
            Economic Calendar
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Stay Ahead of Market-Moving Events
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Track important economic releases, central bank decisions, and market events that can impact your trading.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-dark-100 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Date Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 transition-colors"
              >
                <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(selectedDate)}
                </div>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  Go to Today
                </button>
              </div>
              <button
                onClick={() => navigateDate(1)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 transition-colors"
              >
                <ChevronRight size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Impact Filter */}
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-200 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Impact</option>
                  <option value="high">High Impact</option>
                  <option value="medium">Medium Impact</option>
                  <option value="low">Low Impact</option>
                </select>
              </div>

              {/* Country Filter */}
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-gray-500" />
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-200 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-primary-500"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Impact Legend */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-dark-100">
            <span className="text-sm text-gray-500">Impact:</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">High</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Low</span>
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white dark:bg-dark-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Impact
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Previous
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Forecast
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actual
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-100">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                          <Clock size={16} className="text-gray-400" />
                          {event.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{event.countryFlag}</span>
                          <span className="text-gray-600 dark:text-gray-400">{event.country}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white font-medium">
                          {event.event}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getImpactBadge(event.impact)}`}>
                          {event.impact === 'high' && <AlertTriangle size={12} />}
                          {event.impact.charAt(0).toUpperCase() + event.impact.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                        {event.previous}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                        {event.forecast}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {event.actual ? (
                          <span className={`font-semibold ${
                            parseFloat(event.actual) > parseFloat(event.forecast)
                              ? 'text-green-500'
                              : parseFloat(event.actual) < parseFloat(event.forecast)
                                ? 'text-red-500'
                                : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {event.actual}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No events found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">High Impact Events</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              These events can cause significant market volatility. Consider reducing position sizes or staying out of the market.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
              <Clock size={20} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Timing is Key</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All times are displayed in your local timezone. Plan your trades around major economic releases.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <TrendingUp size={20} className="text-green-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Trade the News</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Compare actual vs forecast values. Surprises often lead to strong market moves and trading opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EconomicCalendar
