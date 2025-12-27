import { useEffect, useRef, useMemo } from 'react'

const AnimatedAuthBackground = () => {
  const canvasRef = useRef(null)

  // Generate random candlesticks data
  const candlesticks = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      x: (i * 5) + Math.random() * 2,
      open: 30 + Math.random() * 40,
      close: 30 + Math.random() * 40,
      high: 50 + Math.random() * 30,
      low: 20 + Math.random() * 20,
      delay: Math.random() * 2,
    }))
  }, [])

  // Snow particles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationFrameId
    let particles = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize particles
    const initParticles = () => {
      particles = []
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000)

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: Math.random() * 0.8 + 0.2,
          opacity: Math.random() * 0.5 + 0.2,
          pulse: Math.random() * Math.PI * 2,
        })
      }
    }

    initParticles()

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.speedX
        particle.y += particle.speedY
        particle.pulse += 0.02

        // Wrap around screen
        if (particle.y > canvas.height) {
          particle.y = -10
          particle.x = Math.random() * canvas.width
        }
        if (particle.x > canvas.width) particle.x = 0
        if (particle.x < 0) particle.x = canvas.width

        // Draw particle with pulsing opacity
        const pulsingOpacity = particle.opacity * (0.7 + 0.3 * Math.sin(particle.pulse))
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34, 197, 94, ${pulsingOpacity})`
        ctx.fill()

        // Add glow effect
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius * 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34, 197, 94, ${pulsingOpacity * 0.2})`
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-400 via-dark-300 to-dark-400" />

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[150px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] animate-float-delayed" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[180px] animate-pulse-slow" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:60px_60px] animate-grid-scroll" />

      {/* Animated candlestick chart - Left side */}
      <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        {candlesticks.slice(0, 10).map((candle, i) => {
          const isGreen = candle.close > candle.open
          const color = isGreen ? '#22c55e' : '#ef4444'
          const bodyTop = Math.min(candle.open, candle.close)
          const bodyHeight = Math.abs(candle.close - candle.open)

          return (
            <g key={i} className="animate-candle-rise" style={{ animationDelay: `${candle.delay}s` }}>
              {/* Wick */}
              <line
                x1={candle.x + 1.5}
                y1={100 - candle.high}
                x2={candle.x + 1.5}
                y2={100 - candle.low}
                stroke={color}
                strokeWidth="0.3"
                className="opacity-60"
              />
              {/* Body */}
              <rect
                x={candle.x}
                y={100 - bodyTop - bodyHeight}
                width="3"
                height={Math.max(bodyHeight, 1)}
                fill={color}
                rx="0.5"
                className="opacity-80"
              />
            </g>
          )
        })}
        {/* Animated line chart overlay */}
        <path
          d={`M 0 ${70 - Math.random() * 20} ${candlesticks.slice(0, 10).map((c, i) => `L ${c.x + 1.5} ${100 - (c.open + c.close) / 2}`).join(' ')}`}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="0.5"
          className="animate-draw-line"
        />
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
            <stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Animated candlestick chart - Right side */}
      <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 opacity-20 scale-x-[-1]" viewBox="0 0 100 100" preserveAspectRatio="none">
        {candlesticks.slice(10, 20).map((candle, i) => {
          const isGreen = candle.close > candle.open
          const color = isGreen ? '#22c55e' : '#ef4444'
          const bodyTop = Math.min(candle.open, candle.close)
          const bodyHeight = Math.abs(candle.close - candle.open)

          return (
            <g key={i} className="animate-candle-rise" style={{ animationDelay: `${candle.delay + 0.5}s` }}>
              <line
                x1={candle.x + 1.5}
                y1={100 - candle.high}
                x2={candle.x + 1.5}
                y2={100 - candle.low}
                stroke={color}
                strokeWidth="0.3"
                className="opacity-60"
              />
              <rect
                x={candle.x}
                y={100 - bodyTop - bodyHeight}
                width="3"
                height={Math.max(bodyHeight, 1)}
                fill={color}
                rx="0.5"
                className="opacity-80"
              />
            </g>
          )
        })}
      </svg>

      {/* Floating trading icons */}
      <div className="absolute top-20 left-20 animate-float-slow">
        <div className="w-12 h-12 rounded-xl bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 flex items-center justify-center">
          <span className="text-primary-400 text-lg font-bold">$</span>
        </div>
      </div>
      <div className="absolute top-40 right-32 animate-float-delayed">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
            <polyline points="16,7 22,7 22,13" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-32 left-32 animate-float">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-40 right-20 animate-float-slow">
        <div className="w-11 h-11 rounded-xl bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 flex items-center justify-center">
          <span className="text-yellow-400 text-sm font-bold">BTC</span>
        </div>
      </div>

      {/* Moving price tickers */}
      <div className="absolute top-10 left-0 right-0 overflow-hidden opacity-30">
        <div className="flex gap-8 animate-ticker">
          {['EUR/USD +0.12%', 'BTC $87,409', 'GOLD +0.8%', 'AAPL $273.40', 'TSLA -2.1%', 'ETH $2,929', 'SPX +0.3%', 'NVDA +1.0%'].map((item, i) => (
            <span key={i} className={`text-sm font-mono whitespace-nowrap ${item.includes('+') ? 'text-primary-400' : item.includes('-') ? 'text-red-400' : 'text-gray-400'}`}>
              {item}
            </span>
          ))}
          {['EUR/USD +0.12%', 'BTC $87,409', 'GOLD +0.8%', 'AAPL $273.40', 'TSLA -2.1%', 'ETH $2,929', 'SPX +0.3%', 'NVDA +1.0%'].map((item, i) => (
            <span key={`dup-${i}`} className={`text-sm font-mono whitespace-nowrap ${item.includes('+') ? 'text-primary-400' : item.includes('-') ? 'text-red-400' : 'text-gray-400'}`}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom ticker */}
      <div className="absolute bottom-10 left-0 right-0 overflow-hidden opacity-30">
        <div className="flex gap-8 animate-ticker-reverse">
          {['GOOGL $313.51', 'AMZN +1.2%', 'META -0.5%', 'MSFT $412.80', 'JPM +0.9%', 'GS -0.3%', 'V +0.7%', 'MA +0.4%'].map((item, i) => (
            <span key={i} className={`text-sm font-mono whitespace-nowrap ${item.includes('+') ? 'text-primary-400' : item.includes('-') ? 'text-red-400' : 'text-gray-400'}`}>
              {item}
            </span>
          ))}
          {['GOOGL $313.51', 'AMZN +1.2%', 'META -0.5%', 'MSFT $412.80', 'JPM +0.9%', 'GS -0.3%', 'V +0.7%', 'MA +0.4%'].map((item, i) => (
            <span key={`dup-${i}`} className={`text-sm font-mono whitespace-nowrap ${item.includes('+') ? 'text-primary-400' : item.includes('-') ? 'text-red-400' : 'text-gray-400'}`}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Canvas for snow particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  )
}

export default AnimatedAuthBackground
