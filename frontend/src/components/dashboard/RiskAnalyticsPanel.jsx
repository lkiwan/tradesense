import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Shield, AlertTriangle, Target, TrendingUp } from 'lucide-react'
import AnimatedCounter from './AnimatedCounter'

/**
 * RiskAnalyticsPanel - Risk metrics with circular gauges
 *
 * @param {number} maxDrawdown - Maximum drawdown percentage
 * @param {number} currentDrawdown - Current drawdown percentage
 * @param {number} riskPerTrade - Average risk per trade
 * @param {Array} exposure - Asset class exposure [{ name, value }]
 * @param {number} sharpeRatio - Sharpe ratio (if applicable)
 * @param {number} maxAllowedDrawdown - Maximum allowed drawdown
 */
export default function RiskAnalyticsPanel({
  maxDrawdown = 0,
  currentDrawdown = 0,
  riskPerTrade = 0,
  exposure = [],
  sharpeRatio = null,
  maxAllowedDrawdown = 10
}) {
  // Exposure chart colors
  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  // Calculate drawdown usage percentage
  const drawdownUsage = (currentDrawdown / maxAllowedDrawdown) * 100

  // Circular progress for drawdown
  const CircularProgress = ({ value, max, color, label }) => {
    const percentage = Math.min((value / max) * 100, 100)
    const circumference = 2 * Math.PI * 40

    return (
      <div className="relative flex flex-col items-center">
        <svg width="100" height="100" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#374151"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (percentage / 100) * circumference }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white">{value.toFixed(1)}%</span>
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      </div>
    )
  }

  // Risk level indicator
  const getRiskLevel = () => {
    if (drawdownUsage >= 90) return { level: 'Critical', color: 'text-red-400', bg: 'bg-red-500/20' }
    if (drawdownUsage >= 70) return { level: 'High', color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
    if (drawdownUsage >= 50) return { level: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/20' }
    return { level: 'Low', color: 'text-green-400', bg: 'bg-green-500/20' }
  }

  const riskLevel = getRiskLevel()

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-200 border border-dark-100 rounded-lg p-2 shadow-xl">
          <p className="text-white text-sm font-medium">{payload[0].name}</p>
          <p className="text-gray-400 text-xs">{payload[0].value.toFixed(1)}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-gradient-to-br from-dark-100 to-dark-200 border border-dark-200 rounded-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Risk Analytics
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskLevel.color} ${riskLevel.bg}`}>
          {riskLevel.level} Risk
        </span>
      </div>

      {/* Circular progress indicators */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <CircularProgress
          value={currentDrawdown}
          max={maxAllowedDrawdown}
          color={drawdownUsage >= 70 ? '#ef4444' : drawdownUsage >= 50 ? '#f59e0b' : '#22c55e'}
          label="Drawdown"
        />
        <CircularProgress
          value={riskPerTrade}
          max={5}
          color={riskPerTrade > 3 ? '#ef4444' : riskPerTrade > 2 ? '#f59e0b' : '#22c55e'}
          label="Risk/Trade"
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-dark-300/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-gray-500 text-xs">Max Drawdown</span>
          </div>
          <p className="text-red-400 font-bold text-lg">
            <AnimatedCounter value={maxDrawdown} suffix="%" decimals={2} />
          </p>
        </div>

        <div className="p-3 bg-dark-300/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-gray-500 text-xs">DD Limit</span>
          </div>
          <p className="text-white font-bold text-lg">{maxAllowedDrawdown}%</p>
        </div>

        {sharpeRatio !== null && (
          <div className="col-span-2 p-3 bg-dark-300/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-gray-500 text-xs">Sharpe Ratio</span>
            </div>
            <p className={`font-bold text-lg ${sharpeRatio >= 1 ? 'text-green-400' : sharpeRatio >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
              <AnimatedCounter value={sharpeRatio} decimals={2} />
            </p>
          </div>
        )}
      </div>

      {/* Asset exposure pie chart */}
      {exposure.length > 0 && (
        <div className="border-t border-dark-200 pt-4">
          <h4 className="text-gray-400 text-sm mb-3">Asset Exposure</h4>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={exposure}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1000}
                  >
                    {exposure.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {exposure.slice(0, 4).map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-gray-400">{item.name}</span>
                  </div>
                  <span className="text-white font-medium">{item.value.toFixed(1)}%</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
