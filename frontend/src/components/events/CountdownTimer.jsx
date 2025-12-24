import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

const CountdownTimer = ({
  endDate,
  onComplete,
  showDays = true,
  showLabels = true,
  size = 'default', // 'small', 'default', 'large'
  variant = 'default', // 'default', 'compact', 'banner'
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  function calculateTimeLeft() {
    const difference = new Date(endDate) - new Date()

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)

      if (newTimeLeft.total <= 0) {
        clearInterval(timer)
        if (onComplete) onComplete()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate, onComplete])

  const padNumber = (num) => String(num).padStart(2, '0')

  // Size classes
  const sizeClasses = {
    small: {
      container: 'gap-1',
      box: 'w-8 h-8 text-sm',
      label: 'text-[10px]',
      separator: 'text-sm'
    },
    default: {
      container: 'gap-2',
      box: 'w-12 h-12 text-lg',
      label: 'text-xs',
      separator: 'text-lg'
    },
    large: {
      container: 'gap-3',
      box: 'w-16 h-16 text-2xl',
      label: 'text-sm',
      separator: 'text-2xl'
    }
  }

  const sizes = sizeClasses[size]

  // Compact variant (single line)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 font-mono ${className}`}>
        <Clock size={size === 'small' ? 14 : 16} className="text-current opacity-70" />
        <span>
          {showDays && timeLeft.days > 0 && `${timeLeft.days}d `}
          {padNumber(timeLeft.hours)}:{padNumber(timeLeft.minutes)}:{padNumber(timeLeft.seconds)}
        </span>
      </div>
    )
  }

  // Banner variant (horizontal boxes)
  if (variant === 'banner') {
    return (
      <div className={`flex items-center ${sizes.container} ${className}`}>
        {showDays && (
          <>
            <TimeBox value={timeLeft.days} label="Days" sizes={sizes} showLabels={showLabels} />
            <span className={`${sizes.separator} font-bold opacity-50`}>:</span>
          </>
        )}
        <TimeBox value={timeLeft.hours} label="Hours" sizes={sizes} showLabels={showLabels} />
        <span className={`${sizes.separator} font-bold opacity-50`}>:</span>
        <TimeBox value={timeLeft.minutes} label="Minutes" sizes={sizes} showLabels={showLabels} />
        <span className={`${sizes.separator} font-bold opacity-50`}>:</span>
        <TimeBox value={timeLeft.seconds} label="Seconds" sizes={sizes} showLabels={showLabels} />
      </div>
    )
  }

  // Default variant
  return (
    <div className={`flex items-center ${sizes.container} ${className}`}>
      {showDays && (
        <>
          <TimeBox value={timeLeft.days} label="Days" sizes={sizes} showLabels={showLabels} />
          <span className={`${sizes.separator} font-bold opacity-50`}>:</span>
        </>
      )}
      <TimeBox value={timeLeft.hours} label="Hours" sizes={sizes} showLabels={showLabels} />
      <span className={`${sizes.separator} font-bold opacity-50`}>:</span>
      <TimeBox value={timeLeft.minutes} label="Mins" sizes={sizes} showLabels={showLabels} />
      <span className={`${sizes.separator} font-bold opacity-50`}>:</span>
      <TimeBox value={timeLeft.seconds} label="Secs" sizes={sizes} showLabels={showLabels} />
    </div>
  )
}

const TimeBox = ({ value, label, sizes, showLabels }) => (
  <div className="flex flex-col items-center">
    <div className={`${sizes.box} bg-black/30 rounded-lg flex items-center justify-center font-bold font-mono`}>
      {String(value).padStart(2, '0')}
    </div>
    {showLabels && (
      <span className={`${sizes.label} text-current opacity-70 mt-1`}>{label}</span>
    )}
  </div>
)

export default CountdownTimer
