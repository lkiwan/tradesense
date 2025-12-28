import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

/**
 * AnimatedCounter - Smooth count-up animation for numbers
 *
 * @param {number} value - Target value to count to
 * @param {string} prefix - Prefix (e.g., '$', '+')
 * @param {string} suffix - Suffix (e.g., '%', 'USD')
 * @param {number} decimals - Decimal places
 * @param {number} duration - Animation duration in ms
 * @param {string} className - Additional CSS classes
 * @param {string} variant - Color variant: 'default', 'success', 'danger', 'warning'
 */
export default function AnimatedCounter({
  value = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1000,
  className = '',
  variant = 'default',
  size = 'md'
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const prevValue = useRef(0)
  const animationRef = useRef(null)

  // Color variants
  const colorClasses = {
    default: 'text-white',
    success: 'text-green-400',
    danger: 'text-red-400',
    warning: 'text-yellow-400',
    muted: 'text-gray-400'
  }

  // Size variants
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  }

  // Determine color based on value if variant is 'auto'
  const getAutoColor = () => {
    if (variant !== 'auto') return colorClasses[variant] || colorClasses.default
    if (value > 0) return colorClasses.success
    if (value < 0) return colorClasses.danger
    return colorClasses.default
  }

  useEffect(() => {
    const startValue = prevValue.current
    const endValue = typeof value === 'number' ? value : parseFloat(value) || 0
    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (easeOutQuart)
      const easeOut = 1 - Math.pow(1 - progress, 4)

      const currentValue = startValue + (endValue - startValue) * easeOut
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        setHasAnimated(true)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    prevValue.current = endValue

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, duration])

  // Format the display value
  const formatValue = (val) => {
    const num = typeof val === 'number' ? val : parseFloat(val) || 0
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={`
        font-bold tabular-nums
        ${sizeClasses[size]}
        ${getAutoColor()}
        ${className}
      `}
    >
      {prefix}
      {formatValue(displayValue)}
      {suffix}
    </motion.span>
  )
}
