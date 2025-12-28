import { motion } from 'framer-motion'
import { cardVariants } from '../../utils/animations'
import AnimatedCounter from './AnimatedCounter'

/**
 * StatCard - Animated statistics card with hover effects
 *
 * @param {string} title - Card title
 * @param {number} value - Main value to display
 * @param {string} prefix - Value prefix (e.g., '$')
 * @param {string} suffix - Value suffix (e.g., '%')
 * @param {number} decimals - Decimal places
 * @param {React.Component} icon - Lucide icon component
 * @param {string} subValue - Secondary value/description
 * @param {number} trend - Trend percentage (positive or negative)
 * @param {string} variant - Color variant
 * @param {boolean} progress - Show progress bar
 * @param {number} progressValue - Progress percentage (0-100)
 * @param {string} progressColor - Progress bar color
 */
export default function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon: Icon,
  subValue,
  trend,
  variant = 'default',
  progress = false,
  progressValue = 0,
  progressColor = 'green',
  className = ''
}) {
  // Trend arrow
  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null
    if (trend > 0) return '+'
    if (trend < 0) return ''
    return ''
  }

  const getTrendColor = () => {
    if (trend > 0) return 'text-green-400'
    if (trend < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  // Progress bar colors
  const progressColors = {
    green: 'from-green-500 to-green-400',
    red: 'from-red-500 to-red-400',
    blue: 'from-blue-500 to-blue-400',
    yellow: 'from-yellow-500 to-yellow-400',
    purple: 'from-purple-500 to-purple-400'
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      className={`
        relative overflow-hidden
        bg-gradient-to-br from-dark-100 to-dark-200
        border border-dark-200 hover:border-dark-100
        rounded-xl p-4
        transition-all duration-300
        hover:shadow-lg hover:shadow-green-500/10
        cursor-default
        ${className}
      `}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon and title */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm font-medium">{title}</span>
          {Icon && (
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Icon className="w-5 h-5 text-gray-500" />
            </motion.div>
          )}
        </div>

        {/* Main value */}
        <div className="flex items-baseline gap-2">
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            variant={variant}
            size="lg"
          />

          {/* Trend indicator */}
          {trend !== undefined && trend !== null && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className={`text-sm font-medium ${getTrendColor()}`}
            >
              {getTrendIcon()}{Math.abs(trend).toFixed(1)}%
            </motion.span>
          )}
        </div>

        {/* Sub value / description */}
        {subValue && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 text-sm mt-1"
          >
            {subValue}
          </motion.p>
        )}

        {/* Progress bar */}
        {progress && (
          <div className="mt-3">
            <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressValue, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className={`h-full bg-gradient-to-r ${progressColors[progressColor]} rounded-full`}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">0%</span>
              <span className="text-xs text-gray-500">100%</span>
            </div>
          </div>
        )}
      </div>

      {/* Animated border gradient */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, transparent 50%)',
        }}
      />
    </motion.div>
  )
}
