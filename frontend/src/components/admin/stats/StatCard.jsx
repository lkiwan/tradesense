import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  trendLabel,
  color = 'primary',
  loading = false,
  onClick,
  className = ''
}) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-500',
    red: 'bg-red-500/10 text-red-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    pink: 'bg-pink-500/10 text-pink-500',
    orange: 'bg-orange-500/10 text-orange-500',
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={14} className="text-green-500" />
    if (trend === 'down') return <TrendingDown size={14} className="text-red-500" />
    return <Minus size={14} className="text-gray-500" />
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-500'
    if (trend === 'down') return 'text-red-500'
    return 'text-gray-500'
  }

  if (loading) {
    return (
      <div className={`bg-dark-100 rounded-xl p-5 border border-dark-200 animate-pulse ${className}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-dark-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-dark-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-dark-200 rounded w-20"></div>
          </div>
          <div className="w-12 h-12 bg-dark-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-dark-100 rounded-xl p-5 border border-dark-200 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-primary/50 hover:shadow-lg' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-white mb-1">{value}</p>
          {(trendValue || trendLabel) && (
            <div className="flex items-center gap-1.5">
              {getTrendIcon()}
              {trendValue && (
                <span className={`text-sm font-medium ${getTrendColor()}`}>
                  {trendValue}
                </span>
              )}
              {trendLabel && (
                <span className="text-xs text-gray-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  )
}

export const StatCardGrid = ({ children, columns = 4, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-4 ${className}`}>
      {children}
    </div>
  )
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  progress,
  progressColor = 'primary',
  loading = false,
  className = ''
}) => {
  const progressColors = {
    primary: 'bg-primary',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
  }

  if (loading) {
    return (
      <div className={`bg-dark-100 rounded-xl p-5 border border-dark-200 animate-pulse ${className}`}>
        <div className="h-4 bg-dark-200 rounded w-24 mb-3"></div>
        <div className="h-8 bg-dark-200 rounded w-32 mb-2"></div>
        <div className="h-2 bg-dark-200 rounded w-full"></div>
      </div>
    )
  }

  return (
    <div className={`bg-dark-100 rounded-xl p-5 border border-dark-200 ${className}`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
        {title}
      </p>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 mb-3">{subtitle}</p>
      )}
      {progress !== undefined && (
        <div className="w-full bg-dark-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${progressColors[progressColor]}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      )}
    </div>
  )
}

export default StatCard
