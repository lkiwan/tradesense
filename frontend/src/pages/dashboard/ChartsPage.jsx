import { useState, useEffect, useRef, useMemo } from 'react'
import { createChart, ColorType } from 'lightweight-charts'
import {
  Activity, BarChart2, TrendingUp, Maximize2, Minimize2,
  LayoutGrid, Square, Columns, Grid3X3, Save, Camera
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const layouts = [
  { id: '1x1', icon: Square, label: 'Single', cols: 1, rows: 1 },
  { id: '1x2', icon: Columns, label: '1x2', cols: 2, rows: 1 },
  { id: '2x2', icon: LayoutGrid, label: '2x2', cols: 2, rows: 2 },
]

const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D']
const symbols = ['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD', 'USDJPY', 'ETHUSD']

// Get interval in seconds based on timeframe
const getIntervalSeconds = (timeframe) => {
  switch (timeframe) {
    case '1m': return 60
    case '5m': return 300
    case '15m': return 900
    case '1H': return 3600
    case '4H': return 14400
    case '1D': return 86400
    default: return 3600
  }
}

// Generate mock OHLC data
const generateData = (symbol, timeframe) => {
  const data = []
  const now = Math.floor(Date.now() / 1000)
  const interval = getIntervalSeconds(timeframe)
  let price = symbol.includes('JPY') ? 150 : symbol.includes('XAU') ? 2000 : symbol.includes('BTC') ? 45000 : 1.1

  // Adjust volatility based on timeframe
  const volatilityMultiplier = timeframe === '1m' ? 0.0005 : timeframe === '5m' ? 0.001 : 0.002

  for (let i = 200; i >= 0; i--) {
    const time = now - (i * interval)
    const change = (Math.random() - 0.5) * (price * volatilityMultiplier)
    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * (price * volatilityMultiplier * 0.5)
    const low = Math.min(open, close) - Math.random() * (price * volatilityMultiplier * 0.5)

    data.push({ time, open, high, low, close })
    price = close
  }
  return data
}

// Single Chart Component
const Chart = ({ symbol, timeframe, onSymbolChange, onTimeframeChange, chartHeight, isMobile }) => {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)

  const data = useMemo(() => generateData(symbol, timeframe), [symbol, timeframe])

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const toolbarHeight = isMobile ? 80 : 50 // Taller toolbar on mobile for stacked layout
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: chartHeight - toolbarHeight, // Account for toolbar
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a2e' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#2d2d44' },
        horzLines: { color: '#2d2d44' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: '#3d3d5c',
      },
      timeScale: {
        borderColor: '#3d3d5c',
        timeVisible: true,
      },
    })

    chartRef.current = chart

    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    seriesRef.current = series
    series.setData(data)
    chart.timeScale().fitContent()

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [data, chartHeight])

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg sm:rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 sm:px-3 py-2 bg-slate-800 border-b border-slate-700 gap-2 sm:gap-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Symbol selector */}
          <select
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            className="bg-slate-700 text-white text-xs sm:text-sm rounded px-2 py-1.5 sm:py-1 border-none focus:outline-none focus:ring-1 focus:ring-cyan-500 min-h-[36px] sm:min-h-0 touch-manipulation"
          >
            {symbols.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Timeframe buttons */}
          <div className="flex bg-slate-700 rounded overflow-hidden">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-1.5 sm:px-2 py-1.5 sm:py-1 text-[10px] sm:text-xs font-medium transition-colors min-w-[28px] sm:min-w-0 touch-manipulation ${
                  timeframe === tf
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-600'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Price display */}
        <div className="text-xs sm:text-sm flex items-center justify-end">
          <span className="text-slate-400 mr-2 hidden sm:inline">{symbol}</span>
          <span className={`font-medium ${data[data.length - 1]?.close > data[data.length - 2]?.close ? 'text-green-400' : 'text-red-400'}`}>
            {data[data.length - 1]?.close?.toFixed(symbol.includes('JPY') ? 3 : 5)}
          </span>
        </div>
      </div>

      {/* Chart container */}
      <div ref={containerRef} className="flex-1" />
    </div>
  )
}

const ChartsPage = () => {
  const [currentLayout, setCurrentLayout] = useState(layouts[0])
  const [charts, setCharts] = useState([
    { id: 1, symbol: 'EURUSD', timeframe: '1H' }
  ])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const containerRef = useRef(null)

  // Calculate chart height based on layout
  const getChartHeight = () => {
    const isMobileView = window.innerWidth < 640
    const availableHeight = window.innerHeight - (isMobileView ? 160 : 200) // Less padding on mobile
    return Math.floor(availableHeight / currentLayout.rows)
  }

  const [chartHeight, setChartHeight] = useState(getChartHeight())

  useEffect(() => {
    const handleResize = () => {
      setChartHeight(getChartHeight())
      setIsMobile(window.innerWidth < 640)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentLayout])

  // Change layout
  const handleLayoutChange = (layout) => {
    setCurrentLayout(layout)
    const totalCharts = layout.cols * layout.rows

    if (charts.length < totalCharts) {
      const newCharts = [...charts]
      for (let i = charts.length; i < totalCharts; i++) {
        newCharts.push({
          id: i + 1,
          symbol: symbols[i % symbols.length],
          timeframe: '1H'
        })
      }
      setCharts(newCharts)
    } else {
      setCharts(charts.slice(0, totalCharts))
    }

    // Recalculate height
    setTimeout(() => setChartHeight(getChartHeight()), 100)
  }

  // Update chart
  const updateChart = (id, updates) => {
    setCharts(prev => prev.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ))
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 p-2 sm:p-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            Advanced Charts
          </h1>

          {/* Layout selector */}
          <div className="flex bg-slate-800 rounded-lg overflow-hidden w-fit">
            {layouts.map(layout => (
              <button
                key={layout.id}
                onClick={() => handleLayoutChange(layout)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm transition-colors touch-manipulation ${
                  currentLayout.id === layout.id
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <layout.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{layout.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div
        className="grid gap-1.5 sm:gap-2"
        style={{
          gridTemplateColumns: isMobile ? '1fr' : `repeat(${currentLayout.cols}, 1fr)`,
          gridTemplateRows: isMobile
            ? `repeat(${charts.length}, ${chartHeight}px)`
            : `repeat(${currentLayout.rows}, ${chartHeight}px)`,
        }}
      >
        {charts.map(chart => (
          <Chart
            key={chart.id}
            symbol={chart.symbol}
            timeframe={chart.timeframe}
            onSymbolChange={(symbol) => updateChart(chart.id, { symbol })}
            onTimeframeChange={(timeframe) => updateChart(chart.id, { timeframe })}
            chartHeight={chartHeight}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Info bar */}
      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-slate-400 gap-2 sm:gap-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <span>Layout: {currentLayout.label}</span>
          <span>Charts: {charts.length}</span>
        </div>
        <div className="hidden sm:block">
          Click on a chart to interact • Use symbol dropdown to change pair • Select timeframe from toolbar
        </div>
        <div className="sm:hidden text-[10px] text-slate-500">
          Tap chart to interact • Use dropdown for symbols
        </div>
      </div>
    </div>
  )
}

export default ChartsPage
