import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { AlertTriangle, TrendingDown } from 'lucide-react'

/**
 * DrawdownChart - Area chart showing drawdown history with max indicator
 *
 * @param {Array} data - Array of { date, drawdown } objects (drawdown as negative percentage)
 * @param {number} maxDrawdown - Maximum drawdown percentage
 * @param {number} maxAllowed - Maximum allowed drawdown (challenge rule)
 */
export default function DrawdownChart({
  data = [],
  maxDrawdown = 0,
  maxAllowed = 10
}) {
  const [isAnimated, setIsAnimated] = useState(false)

  useEffect(() => {
    setIsAnimated(true)
  }, [])

  // Find max drawdown point
  const maxDrawdownPoint = data.reduce((max, point) =>
    Math.abs(point.drawdown) > Math.abs(max.drawdown) ? point : max
  , { drawdown: 0 })

  // Calculate warning level
  const warningLevel = maxAllowed * 0.7 // 70% of max
  const dangerLevel = maxAllowed * 0.9 // 90% of max
  const currentDrawdown = data.length > 0 ? Math.abs(data[data.length - 1]?.drawdown || 0) : 0

  const getStatusColor = () => {
    if (currentDrawdown >= dangerLevel) return 'text-red-400'
    if (currentDrawdown >= warningLevel) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getStatusText = () => {
    if (currentDrawdown >= dangerLevel) return 'Critical'
    if (currentDrawdown >= warningLevel) return 'Warning'
    return 'Healthy'
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = Math.abs(payload[0].value)
      return (
        <div className="bg-dark-200 border border-dark-100 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className="text-red-400 font-bold">
            -{value.toFixed(2)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-gradient-to-br from-dark-100 to-dark-200 border border-dark-200 rounded-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            Drawdown
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-2xl font-bold text-red-400">
              -{currentDrawdown.toFixed(2)}%
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor()} bg-opacity-20 ${
              currentDrawdown >= dangerLevel ? 'bg-red-400' :
              currentDrawdown >= warningLevel ? 'bg-yellow-400' : 'bg-green-400'
            }`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Max drawdown indicator */}
        <div className="text-right">
          <p className="text-gray-500 text-xs">Max Drawdown</p>
          <p className="text-red-400 font-bold text-lg">-{Math.abs(maxDrawdown).toFixed(2)}%</p>
          <p className="text-gray-500 text-xs">Limit: {maxAllowed}%</p>
        </div>
      </div>

      {/* Warning banner if near limit */}
      {currentDrawdown >= warningLevel && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            currentDrawdown >= dangerLevel ? 'bg-red-500/20' : 'bg-yellow-500/20'
          }`}
        >
          <AlertTriangle className={`w-5 h-5 ${currentDrawdown >= dangerLevel ? 'text-red-400' : 'text-yellow-400'}`} />
          <span className={`text-sm ${currentDrawdown >= dangerLevel ? 'text-red-400' : 'text-yellow-400'}`}>
            {currentDrawdown >= dangerLevel
              ? 'Critical: You are very close to the maximum drawdown limit!'
              : 'Warning: Your drawdown is approaching the limit.'
            }
          </span>
        </motion.div>
      )}

      {/* Chart */}
      <div className="h-56">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 text-sm">No drawdown data yet</p>
              <p className="text-gray-500 text-xs mt-1">Start trading to track your drawdown</p>
            </div>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              domain={[Math.min(-maxAllowed - 2, -Math.abs(maxDrawdown) - 2), 0]}
              reversed
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Warning line */}
            <ReferenceLine
              y={-warningLevel}
              stroke="#eab308"
              strokeDasharray="5 5"
              strokeWidth={1}
            />

            {/* Max allowed line */}
            <ReferenceLine
              y={-maxAllowed}
              stroke="#ef4444"
              strokeDasharray="3 3"
              strokeWidth={2}
              label={{
                value: 'Max Limit',
                position: 'right',
                fill: '#ef4444',
                fontSize: 11
              }}
            />

            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#drawdownGradient)"
              animationDuration={isAnimated ? 1500 : 0}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>

      {/* Progress bar showing drawdown vs limit */}
      <div className="mt-4 pt-4 border-t border-dark-200">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Drawdown Usage</span>
          <span>{((currentDrawdown / maxAllowed) * 100).toFixed(0)}% of limit</span>
        </div>
        <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((currentDrawdown / maxAllowed) * 100, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
            className={`h-full rounded-full ${
              currentDrawdown >= dangerLevel ? 'bg-red-500' :
              currentDrawdown >= warningLevel ? 'bg-yellow-500' : 'bg-green-500'
            }`}
          />
        </div>
      </div>
    </motion.div>
  )
}
