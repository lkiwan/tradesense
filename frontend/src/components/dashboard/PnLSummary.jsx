import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import AnimatedCounter from './AnimatedCounter'

/**
 * PnLSummary - Daily/Weekly/Monthly P&L breakdown with animated tabs
 *
 * @param {Array} daily - Daily P&L data [{ date, pnl }]
 * @param {Array} weekly - Weekly P&L data [{ week, pnl }]
 * @param {Array} monthly - Monthly P&L data [{ month, pnl }]
 */
export default function PnLSummary({
  daily = [],
  weekly = [],
  monthly = []
}) {
  const [activeTab, setActiveTab] = useState('daily')

  const tabs = [
    { key: 'daily', label: 'Daily', icon: Calendar },
    { key: 'weekly', label: 'Weekly', icon: Calendar },
    { key: 'monthly', label: 'Monthly', icon: Calendar }
  ]

  const getData = () => {
    switch (activeTab) {
      case 'weekly': return weekly
      case 'monthly': return monthly
      default: return daily
    }
  }

  const data = getData()

  // Calculate totals
  const totalPnL = data.reduce((sum, item) => sum + (item.pnl || 0), 0)
  const positiveDays = data.filter(d => d.pnl > 0).length
  const negativeDays = data.filter(d => d.pnl < 0).length
  const bestDay = Math.max(...data.map(d => d.pnl || 0), 0)
  const worstDay = Math.min(...data.map(d => d.pnl || 0), 0)

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value
      const isPositive = value >= 0
      return (
        <div className="bg-dark-200 border border-dark-100 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}${value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-gradient-to-br from-dark-100 to-dark-200 border border-dark-200 rounded-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            P&L Summary
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}
              <AnimatedCounter value={totalPnL} prefix="$" decimals={2} />
            </span>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 bg-dark-300 rounded-lg p-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1
                ${activeTab === tab.key
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-gray-400 hover:text-white'
                }
              `}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center p-2 bg-dark-300/50 rounded-lg">
          <p className="text-gray-500 text-xs">Profitable</p>
          <p className="text-green-400 font-bold">{positiveDays}</p>
        </div>
        <div className="text-center p-2 bg-dark-300/50 rounded-lg">
          <p className="text-gray-500 text-xs">Loss</p>
          <p className="text-red-400 font-bold">{negativeDays}</p>
        </div>
        <div className="text-center p-2 bg-dark-300/50 rounded-lg">
          <p className="text-gray-500 text-xs">Best</p>
          <p className="text-green-400 font-bold">+${bestDay.toFixed(0)}</p>
        </div>
        <div className="text-center p-2 bg-dark-300/50 rounded-lg">
          <p className="text-gray-500 text-xs">Worst</p>
          <p className="text-red-400 font-bold">${worstDay.toFixed(0)}</p>
        </div>
      </div>

      {/* Chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="h-48"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis
                dataKey={activeTab === 'daily' ? 'date' : activeTab === 'weekly' ? 'week' : 'month'}
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]} animationDuration={800}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>

      {/* Win rate bar */}
      <div className="mt-4 pt-4 border-t border-dark-200">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Win Rate</span>
          <span>{data.length > 0 ? ((positiveDays / data.length) * 100).toFixed(0) : 0}%</span>
        </div>
        <div className="h-2 bg-dark-300 rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.length > 0 ? (positiveDays / data.length) * 100 : 0}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className="h-full bg-green-500 rounded-l-full"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.length > 0 ? (negativeDays / data.length) * 100 : 0}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className="h-full bg-red-500 rounded-r-full"
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-green-400">{positiveDays} wins</span>
          <span className="text-red-400">{negativeDays} losses</span>
        </div>
      </div>
    </motion.div>
  )
}
