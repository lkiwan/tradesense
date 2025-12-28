import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

/**
 * BalanceHistoryChart - Animated area chart showing balance over time
 *
 * @param {Array} data - Array of { date, balance } objects
 * @param {string} period - Selected period: '7d', '30d', '90d', 'all'
 * @param {function} onPeriodChange - Callback when period changes
 * @param {number} initialBalance - Starting balance for reference
 */
export default function BalanceHistoryChart({
  data = [],
  period = '30d',
  onPeriodChange,
  initialBalance = 0
}) {
  const [isAnimated, setIsAnimated] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(period)

  const periods = [
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: 'all', label: 'All' }
  ]

  useEffect(() => {
    setIsAnimated(true)
  }, [])

  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod)
    if (onPeriodChange) onPeriodChange(newPeriod)
  }

  // Calculate stats
  const currentBalance = data.length > 0 ? data[data.length - 1]?.balance || 0 : 0
  const startBalance = data.length > 0 ? data[0]?.balance || initialBalance : initialBalance
  const change = currentBalance - startBalance
  const changePercent = startBalance > 0 ? (change / startBalance) * 100 : 0
  const isPositive = change >= 0

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-200 border border-dark-100 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className="text-white font-bold">
            ${payload[0].value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )
    }
    return null
  }

  // Generate gradient ID
  const gradientId = isPositive ? 'balanceGradientGreen' : 'balanceGradientRed'
  const strokeColor = isPositive ? '#22c55e' : '#ef4444'
  const gradientStart = isPositive ? '#22c55e' : '#ef4444'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-dark-100 to-dark-200 border border-dark-200 rounded-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Balance History</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-white">
              ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 bg-dark-300 rounded-lg p-1">
          {periods.map((p) => (
            <motion.button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                px-3 py-1 text-sm font-medium rounded-md transition-all
                ${selectedPeriod === p.value
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-gray-400 hover:text-white'
                }
              `}
            >
              {p.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 text-sm">No trading data yet</p>
              <p className="text-gray-500 text-xs mt-1">Start trading to see your balance history</p>
            </div>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradientStart} stopOpacity={0.3} />
                <stop offset="100%" stopColor={gradientStart} stopOpacity={0} />
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
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              animationDuration={isAnimated ? 1500 : 0}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>

      {/* Reference line info */}
      <div className="flex justify-between mt-4 pt-4 border-t border-dark-200">
        <div className="text-center">
          <p className="text-gray-500 text-xs">Starting Balance</p>
          <p className="text-white font-medium">${startBalance.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs">Current Balance</p>
          <p className="text-white font-medium">${currentBalance.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs">P&L</p>
          <p className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}${change.toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
