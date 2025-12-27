import { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, TrendingUp, TrendingDown, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filter, setFilter] = useState('all')

  // Sample economic events data
  const events = [
    { id: 1, time: '08:30', currency: 'USD', event: 'Non-Farm Payrolls', impact: 'high', forecast: '180K', previous: '199K', actual: null },
    { id: 2, time: '08:30', currency: 'USD', event: 'Unemployment Rate', impact: 'high', forecast: '3.8%', previous: '3.7%', actual: null },
    { id: 3, time: '10:00', currency: 'USD', event: 'ISM Manufacturing PMI', impact: 'high', forecast: '48.5', previous: '47.4', actual: null },
    { id: 4, time: '14:00', currency: 'EUR', event: 'ECB Interest Rate Decision', impact: 'high', forecast: '4.50%', previous: '4.50%', actual: null },
    { id: 5, time: '15:30', currency: 'GBP', event: 'BOE Gov Bailey Speaks', impact: 'medium', forecast: '-', previous: '-', actual: null },
    { id: 6, time: '21:30', currency: 'AUD', event: 'Retail Sales m/m', impact: 'medium', forecast: '0.2%', previous: '0.1%', actual: null },
    { id: 7, time: '02:00', currency: 'CNY', event: 'Manufacturing PMI', impact: 'medium', forecast: '50.2', previous: '49.5', actual: null },
    { id: 8, time: '08:00', currency: 'EUR', event: 'German CPI m/m', impact: 'high', forecast: '0.3%', previous: '0.2%', actual: null }
  ]

  const impactColors = {
    high: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
    medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
    low: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' }
  }

  const currencyFlags = {
    USD: '🇺🇸',
    EUR: '🇪🇺',
    GBP: '🇬🇧',
    JPY: '🇯🇵',
    AUD: '🇦🇺',
    CAD: '🇨🇦',
    CHF: '🇨🇭',
    CNY: '🇨🇳'
  }

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.impact === filter)

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
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30">
              <Calendar className="text-primary-400" size={24} />
            </div>
            Economic Calendar
          </h1>
          <p className="text-gray-400 mt-1">Track important economic events that may impact your trading</p>
        </div>
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

        {/* Impact Filter */}
        <div className="flex gap-2 bg-dark-200/30 rounded-xl p-1.5 border border-white/5">
          {[
            { key: 'all', label: 'All' },
            { key: 'high', label: 'High', color: 'text-red-500' },
            { key: 'medium', label: 'Medium', color: 'text-yellow-500' },
            { key: 'low', label: 'Low', color: 'text-green-500' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                filter === f.key
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              {f.label}
            </button>
          ))}
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
      </div>

      {/* Events Table */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
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
              {filteredEvents.map(event => (
                <tr key={event.id} className={`hover:bg-dark-200/50 transition-all duration-300 ${impactColors[event.impact].bg}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="text-gray-500" size={14} />
                      <span className="text-white font-medium">{event.time}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{currencyFlags[event.currency]}</span>
                      <span className="text-white font-medium">{event.currency}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-white">{event.event}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium capitalize ${impactColors[event.impact].bg} ${impactColors[event.impact].text}`}>
                      {event.impact === 'high' && <AlertTriangle size={12} />}
                      {event.impact}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-white font-medium">{event.forecast}</td>
                  <td className="px-4 py-4 text-right text-gray-400">{event.previous}</td>
                  <td className="px-4 py-4 text-right">
                    {event.actual ? (
                      <span className={`font-bold ${
                        parseFloat(event.actual) > parseFloat(event.forecast) ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {event.actual}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEvents.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-200/50 border border-white/5 flex items-center justify-center">
              <Calendar className="text-gray-500" size={32} />
            </div>
            <p className="text-gray-400 font-medium">No events scheduled for this date</p>
            <p className="text-gray-500 text-sm mt-1">Try selecting a different date</p>
          </div>
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
              especially around NFP, FOMC, and ECB announcements.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarPage
