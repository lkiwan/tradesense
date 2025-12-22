import { useEffect, useRef, useState } from 'react'
import { createChart } from 'lightweight-charts'
import { marketAPI } from '../services/api'
import { Skeleton } from './ui/Skeleton'

// Available time periods for chart
const TIME_PERIODS = [
  { value: '1d', label: '1D', interval: '5m' },
  { value: '5d', label: '5D', interval: '15m' },
  { value: '1mo', label: '1M', interval: '1d' },
  { value: '3mo', label: '3M', interval: '1d' },
  { value: '6mo', label: '6M', interval: '1d' },
  { value: '1y', label: '1Y', interval: '1wk' },
  { value: '2y', label: '2Y', interval: '1wk' }
]

const PriceChart = ({ symbol, height = 400 }) => {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('1mo')

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#9ca3af'
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' }
      },
      crosshair: {
        mode: 1
      },
      rightPriceScale: {
        borderColor: '#374151'
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false
      }
    })

    chartRef.current = chart

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e'
    })

    seriesRef.current = candlestickSeries

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // Fetch data
    fetchData()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [symbol, height])

  // Fetch data when symbol or period changes
  useEffect(() => {
    if (seriesRef.current) {
      fetchData()
    }
  }, [symbol, selectedPeriod])

  const fetchData = async () => {
    const period = TIME_PERIODS.find(p => p.value === selectedPeriod) || TIME_PERIODS[2]

    try {
      setLoading(true)
      setError(null)

      const response = await marketAPI.getHistory(symbol, period.value, period.interval)
      const data = response.data.data

      if (data && data.length > 0 && seriesRef.current) {
        seriesRef.current.setData(data)
        chartRef.current?.timeScale().fitContent()
      }
    } catch (err) {
      console.error('Error fetching chart data:', err)
      setError('Failed to load chart data')

      // Use mock data for demo
      if (seriesRef.current) {
        const mockData = generateMockData()
        seriesRef.current.setData(mockData)
        chartRef.current?.timeScale().fitContent()
      }
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = () => {
    const data = []
    const now = Math.floor(Date.now() / 1000)
    let price = symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 2500 : 150

    for (let i = 30; i >= 0; i--) {
      const time = now - (i * 86400)
      const open = price
      const change = (Math.random() - 0.5) * price * 0.05
      const close = price + change
      const high = Math.max(open, close) + Math.random() * price * 0.02
      const low = Math.min(open, close) - Math.random() * price * 0.02

      data.push({
        time,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100
      })

      price = close
    }

    return data
  }

  return (
    <div className="relative">
      {/* Time Period Selector */}
      <div className="flex gap-1 mb-3 justify-end">
        {TIME_PERIODS.map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value)}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              selectedPeriod === period.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-dark-200 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-300'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-dark-200/80 z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-full px-8 space-y-3">
              {/* Skeleton bars to simulate chart loading */}
              <div className="flex items-end justify-center gap-1 h-32">
                {[40, 60, 45, 75, 55, 80, 65, 70, 50, 85, 60, 75, 55, 90, 70].map((h, i) => (
                  <Skeleton
                    key={i}
                    width="12px"
                    height={`${h}%`}
                    className="animate-pulse"
                    style={{ animationDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>
              <Skeleton width="100%" height="20px" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</span>
          </div>
        </div>
      )}
      <div ref={chartContainerRef} className="chart-container" />
    </div>
  )
}

export default PriceChart
