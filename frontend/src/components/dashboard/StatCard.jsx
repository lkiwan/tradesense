import { motion } from 'framer-motion'
import { cardVariants } from '../../utils/animations'
import AnimatedCounter from './AnimatedCounter'

/**
 * StatCard - Glass-morphism statistics card with mobile-first design
 * Matches landing page style with gradient backgrounds and glow effects
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
  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null
    if (trend > 0) return '+'
    return ''
  }

  const getTrendColor = () => {
    if (trend > 0) return 'text-green-400'
    if (trend < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  // Gradient backgrounds based on variant (matching landing page)
  const variantStyles = {
    default: {
      gradient: 'from-dark-100/80 to-dark-200/80',
      border: 'border-white/5 hover:border-primary-500/30',
      iconBg: 'bg-gray-500/20',
      iconColor: 'text-gray-400',
      glow: 'hover:shadow-gray-500/10'
    },
    success: {
      gradient: 'from-green-500/10 to-green-600/5',
      border: 'border-green-500/20 hover:border-green-500/40',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      glow: 'hover:shadow-green-500/20'
    },
    danger: {
      gradient: 'from-red-500/10 to-red-600/5',
      border: 'border-red-500/20 hover:border-red-500/40',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      glow: 'hover:shadow-red-500/20'
    },
    warning: {
      gradient: 'from-yellow-500/10 to-yellow-600/5',
      border: 'border-yellow-500/20 hover:border-yellow-500/40',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      glow: 'hover:shadow-yellow-500/20'
    },
    info: {
      gradient: 'from-blue-500/10 to-blue-600/5',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      glow: 'hover:shadow-blue-500/20'
    },
    purple: {
      gradient: 'from-purple-500/10 to-purple-600/5',
      border: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      glow: 'hover:shadow-purple-500/20'
    }
  }

  const style = variantStyles[variant] || variantStyles.default

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
        group relative overflow-hidden
        bg-gradient-to-br ${style.gradient}
        backdrop-blur-xl
        border ${style.border}
        rounded-xl sm:rounded-2xl
        p-3 sm:p-4
        transition-all duration-300
        hover:shadow-lg ${style.glow}
        hover:scale-[1.02]
        cursor-default
        touch-manipulation
        ${className}
      `}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl sm:rounded-2xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon and title */}
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">{title}</span>
          {Icon && (
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={`w-6 h-6 sm:w-8 sm:h-8 ${style.iconBg} rounded-lg flex items-center justify-center`}
            >
              <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${style.iconColor}`} />
            </motion.div>
          )}
        </div>

        {/* Main value */}
        <div className="flex items-baseline gap-1 sm:gap-2">
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
              className={`text-[10px] sm:text-xs font-medium ${getTrendColor()}`}
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
            className="text-gray-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate"
          >
            {subValue}
          </motion.p>
        )}

        {/* Progress bar */}
        {progress && (
          <div className="mt-2 sm:mt-3">
            <div className="h-1.5 sm:h-2 bg-dark-300/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressValue, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className={`h-full bg-gradient-to-r ${progressColors[progressColor]} rounded-full`}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
