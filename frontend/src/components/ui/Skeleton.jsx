/**
 * Skeleton Loading Components
 * Provides placeholder UI while content is loading
 */

// Base skeleton with pulse animation
export const Skeleton = ({ className = '', variant = 'rectangular', width, height, rounded = 'md' }) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  }

  const variantClasses = {
    rectangular: '',
    circular: 'rounded-full',
    text: 'rounded'
  }

  const baseClass = `
    animate-pulse bg-gray-200 dark:bg-dark-300
    ${variantClasses[variant] || roundedClasses[rounded]}
    ${className}
  `

  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '100%')
  }

  return <div className={baseClass} style={style} />
}

// Skeleton for text content
export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        height="12px"
        width={i === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
)

// Skeleton for price cards in PriceTicker
export const SkeletonPriceCard = () => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-lg min-w-[140px] bg-gray-50 dark:bg-dark-200 animate-pulse">
    <div className="flex-1">
      <Skeleton width="40px" height="12px" className="mb-1" />
      <Skeleton width="70px" height="18px" />
    </div>
    <Skeleton width="50px" height="16px" />
  </div>
)

// Skeleton for the entire PriceTicker component
export const SkeletonPriceTicker = ({ count = 10 }) => (
  <div className="bg-white dark:bg-dark-100 rounded-xl p-4">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Skeleton width="80px" height="16px" />
        <Skeleton width="14px" height="14px" variant="circular" />
      </div>
      <Skeleton width="100px" height="12px" />
    </div>
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPriceCard key={i} />
      ))}
    </div>
  </div>
)

// Skeleton for chart area
export const SkeletonChart = ({ height = 300 }) => (
  <div className="bg-white dark:bg-dark-100 rounded-xl p-4">
    <div className="flex items-center justify-between mb-4">
      <Skeleton width="120px" height="20px" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} width="40px" height="28px" rounded="lg" />
        ))}
      </div>
    </div>
    <Skeleton height={`${height}px`} rounded="lg" />
  </div>
)

// Skeleton for trade form
export const SkeletonTradeForm = () => (
  <div className="bg-white dark:bg-dark-100 rounded-xl p-4 space-y-4">
    <Skeleton width="100px" height="20px" className="mb-4" />

    {/* Symbol selector */}
    <div>
      <Skeleton width="60px" height="14px" className="mb-2" />
      <Skeleton height="40px" rounded="lg" />
    </div>

    {/* Price display */}
    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-200 rounded-lg">
      <Skeleton width="80px" height="14px" />
      <Skeleton width="100px" height="20px" />
    </div>

    {/* Trade type buttons */}
    <div className="flex gap-2">
      <Skeleton height="36px" className="flex-1" rounded="lg" />
      <Skeleton height="36px" className="flex-1" rounded="lg" />
    </div>

    {/* Input fields */}
    {[1, 2, 3].map(i => (
      <div key={i}>
        <Skeleton width="80px" height="14px" className="mb-2" />
        <Skeleton height="40px" rounded="lg" />
      </div>
    ))}

    {/* Submit button */}
    <Skeleton height="44px" rounded="lg" />
  </div>
)

// Skeleton for challenge status card
export const SkeletonChallengeCard = () => (
  <div className="bg-white dark:bg-dark-100 rounded-xl p-4">
    <div className="flex items-center justify-between mb-4">
      <Skeleton width="140px" height="20px" />
      <Skeleton width="80px" height="24px" rounded="full" />
    </div>

    {/* Progress bars */}
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <Skeleton width="100px" height="12px" />
            <Skeleton width="60px" height="12px" />
          </div>
          <Skeleton height="8px" rounded="full" />
        </div>
      ))}
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-2 gap-3 mt-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="p-2 bg-gray-50 dark:bg-dark-200 rounded-lg">
          <Skeleton width="60px" height="12px" className="mb-1" />
          <Skeleton width="80px" height="18px" />
        </div>
      ))}
    </div>
  </div>
)

// Skeleton for positions table
export const SkeletonPositionsTable = ({ rows = 5 }) => (
  <div className="bg-white dark:bg-dark-100 rounded-xl p-4">
    <div className="flex items-center justify-between mb-4">
      <Skeleton width="120px" height="20px" />
      <Skeleton width="60px" height="16px" />
    </div>

    {/* Table header */}
    <div className="grid grid-cols-6 gap-4 pb-2 border-b border-gray-200 dark:border-dark-300">
      {['Symbol', 'Type', 'Entry', 'Size', 'P&L', 'Actions'].map((_, i) => (
        <Skeleton key={i} width="60px" height="12px" />
      ))}
    </div>

    {/* Table rows */}
    <div className="space-y-2 mt-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-6 gap-4 py-2">
          <Skeleton width="50px" height="16px" />
          <Skeleton width="40px" height="20px" rounded="full" />
          <Skeleton width="60px" height="16px" />
          <Skeleton width="40px" height="16px" />
          <Skeleton width="70px" height="16px" />
          <Skeleton width="30px" height="28px" rounded="lg" />
        </div>
      ))}
    </div>
  </div>
)

// Skeleton for stats card
export const SkeletonStatsCard = () => (
  <div className="bg-white dark:bg-dark-100 rounded-xl p-4">
    <div className="flex items-center gap-3">
      <Skeleton width="40px" height="40px" variant="circular" />
      <div className="flex-1">
        <Skeleton width="80px" height="12px" className="mb-2" />
        <Skeleton width="100px" height="24px" />
      </div>
    </div>
  </div>
)

// Full dashboard skeleton
export const SkeletonDashboard = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Stats row */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <SkeletonStatsCard key={i} />
      ))}
    </div>

    {/* Price ticker */}
    <SkeletonPriceTicker />

    {/* Main content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <SkeletonChart />
        <SkeletonPositionsTable />
      </div>
      <div className="space-y-6">
        <SkeletonTradeForm />
        <SkeletonChallengeCard />
      </div>
    </div>
  </div>
)

export default Skeleton
