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
            <div className="p-2 rounded-lg bg-primary-500/10">
              <Calendar className="text-primary-400" size={24} />
            </div>
            Economic Calendar
          </h1>
          <p className="text-gray-400 mt-1">Track important economic events that may impact your trading</p>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 bg-dark-200 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <ChevronLeft className="text-gray-400" size={20} />
          </button>
          <div className="text-center min-w-[200px]">
            <p className="font-semibold text-white">{formatDate(selectedDate)}</p>
          </div>
          <button
            onClick={() => navigateDate(1)}
            className="p-2 bg-dark-200 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <ChevronRight className="text-gray-400" size={20} />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            Today
          </button>
        </div>

        {/* Impact Filter */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'high', label: 'High Impact', color: 'text-red-500' },
            { key: 'medium', label: 'Medium', color: 'text-yellow-500' },
            { key: 'low', label: 'Low', color: 'text-green-500' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-200 text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Impact Legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span className="text-gray-400">High Impact</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <span className="text-gray-400">Medium Impact</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-gray-400">Low Impact</span>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-200/50">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Currency</th>
                <th className="px-4 py-3 text-left font-medium">Event</th>
                <th className="px-4 py-3 text-center font-medium">Impact</th>
                <th className="px-4 py-3 text-right font-medium">Forecast</th>
                <th className="px-4 py-3 text-right font-medium">Previous</th>
                <th className="px-4 py-3 text-right font-medium">Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200">
              {filteredEvents.map(event => (
                <tr key={event.id} className={`hover:bg-dark-200/30 transition-colors ${impactColors[event.impact].bg}`}>
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
            <Calendar className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400">No events scheduled for this date</p>
          </div>
        )}
      </div>

      {/* Trading Tip */}
      <div className="bg-yellow-500/10 rounded-xl border border-yellow-500/30 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-500 mt-0.5" size={20} />
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
