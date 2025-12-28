import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Clock, Timer, Hourglass, Zap } from 'lucide-react'
import AnimatedCounter from './AnimatedCounter'

/**
 * TradeDuration - Trade duration analytics
 *
 * @param {number} avgDuration - Average trade duration in minutes
 * @param {number} shortest - Shortest trade duration in minutes
 * @param {number} longest - Longest trade duration in minutes
 * @param {Array} distribution - Duration distribution [{ range, count }]
 */
export default function TradeDuration({
  avgDuration = 0,
  shortest = 0,
  longest = 0,
  distribution = []
}) {
  // Format duration
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`
    return `${Math.round(minutes / 1440)}d`
  }

  // Format duration verbose
  const formatDurationVerbose = (minutes) => {
    if (minutes < 60) return `${Math.round(minutes)} minutes`
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      const mins = Math.round(minutes % 60)
      return `${hours}h ${mins}m`
    }
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    return `${days}d ${hours}h`
  }

  // Default distribution if not provided
  const defaultDistribution = [
    { range: '<1m', count: 0 },
    { range: '1-5m', count: 0 },
    { range: '5-15m', count: 0 },
    { range: '15m-1h', count: 0 },
    { range: '1-4h', count: 0 },
    { range: '4h-1d', count: 0 },
    { range: '>1d', count: 0 }
  ]

  const chartData = distribution.length > 0 ? distribution : defaultDistribution

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-200 border border-dark-100 rounded-lg p-2 shadow-xl">
          <p className="text-gray-400 text-xs">{label}</p>
          <p className="text-white font-medium">{payload[0].value} trades</p>
        </div>
      )
    }
    return null
  }

  // Determine trading style
  const getTradingStyle = () => {
    if (avgDuration < 5) return { style: 'Scalper', color: 'text-purple-400', icon: Zap }
    if (avgDuration < 60) return { style: 'Day Trader', color: 'text-blue-400', icon: Timer }
    if (avgDuration < 1440) return { style: 'Swing Trader', color: 'text-green-400', icon: Clock }
    return { style: 'Position Trader', color: 'text-yellow-400', icon: Hourglass }
  }

  const tradingStyle = getTradingStyle()
  const StyleIcon = tradingStyle.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-gradient-to-br from-dark-100 to-dark-200 border border-dark-200 rounded-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Trade Duration
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tradingStyle.color} bg-opacity-20 flex items-center gap-1`}
          style={{ backgroundColor: `${tradingStyle.color === 'text-purple-400' ? '#a855f7' : tradingStyle.color === 'text-blue-400' ? '#3b82f6' : tradingStyle.color === 'text-green-400' ? '#22c55e' : '#eab308'}20` }}
        >
          <StyleIcon className="w-3 h-3" />
          {tradingStyle.style}
        </span>
      </div>

      {/* Main stat */}
      <div className="text-center mb-4 p-4 bg-dark-300/50 rounded-xl">
        <p className="text-gray-500 text-sm mb-1">Average Duration</p>
        <p className="text-3xl font-bold text-white">
          {formatDurationVerbose(avgDuration)}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-dark-300/50 rounded-lg text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-4 h-4 text-green-400" />
            <span className="text-gray-500 text-xs">Shortest</span>
          </div>
          <p className="text-green-400 font-bold">{formatDuration(shortest)}</p>
        </div>

        <div className="p-3 bg-dark-300/50 rounded-lg text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Hourglass className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-500 text-xs">Longest</span>
          </div>
          <p className="text-yellow-400 font-bold">{formatDuration(longest)}</p>
        </div>
      </div>

      {/* Distribution chart */}
      <div className="border-t border-dark-200 pt-4">
        <p className="text-gray-500 text-xs mb-3">Duration Distribution</p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis
                dataKey="range"
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trading style explanation */}
      <div className="mt-4 pt-4 border-t border-dark-200">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <StyleIcon className={`w-4 h-4 ${tradingStyle.color} flex-shrink-0 mt-0.5`} />
          <p>
            {tradingStyle.style === 'Scalper' && 'Quick trades lasting seconds to minutes, high frequency.'}
            {tradingStyle.style === 'Day Trader' && 'Intraday trades, all positions closed before market close.'}
            {tradingStyle.style === 'Swing Trader' && 'Holding positions for hours to days to capture larger moves.'}
            {tradingStyle.style === 'Position Trader' && 'Long-term approach, holding for days to weeks.'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
