import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts'
import {
  TrendingUp, TrendingDown, Activity, BarChart2,
  Minus, Circle, Triangle, Square, Hash
} from 'lucide-react'

const timeframes = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '30m', value: '30' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
]

const chartTypes = [
  { label: 'Candles', value: 'candlestick', icon: BarChart2 },
  { label: 'Line', value: 'line', icon: Activity },
  { label: 'Area', value: 'area', icon: TrendingUp },
  { label: 'Bars', value: 'bar', icon: Minus },
]

const AdvancedChart = forwardRef(({
  symbol = 'EURUSD',
  data = [],
  onSymbolChange,
  onTimeframeChange,
  height = 400,
  showToolbar = true,
  showLegend = true,
  theme = 'dark',
  indicators = [],
  drawings = [],
  onDrawingComplete,
  compact = false
}, ref) => {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const indicatorSeriesRef = useRef({})

  const [selectedTimeframe, setSelectedTimeframe] = useState('60')
  const [chartType, setChartType] = useState('candlestick')
  const [crosshairData, setCrosshairData] = useState(null)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [drawingTool, setDrawingTool] = useState(null)

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getChart: () => chartRef.current,
    getSeries: () => seriesRef.current,
    fitContent: () => chartRef.current?.timeScale().fitContent(),
    scrollToRealTime: () => chartRef.current?.timeScale().scrollToRealTime(),
    addIndicator: (name, data, options) => addIndicatorSeries(name, data, options),
    removeIndicator: (name) => removeIndicatorSeries(name),
    takeScreenshot: () => chartRef.current?.takeScreenshot(),
  }))

  // Theme colors
  const colors = theme === 'dark' ? {
    background: '#1a1a2e',
    textColor: '#d1d5db',
    gridColor: '#2d2d44',
    borderColor: '#3d3d5c',
    upColor: '#22c55e',
    downColor: '#ef4444',
    wickUpColor: '#22c55e',
    wickDownColor: '#ef4444',
    volumeUp: 'rgba(34, 197, 94, 0.3)',
    volumeDown: 'rgba(239, 68, 68, 0.3)',
  } : {
    background: '#ffffff',
    textColor: '#374151',
    gridColor: '#e5e7eb',
    borderColor: '#d1d5db',
    upColor: '#22c55e',
    downColor: '#ef4444',
    wickUpColor: '#22c55e',
    wickDownColor: '#ef4444',
    volumeUp: 'rgba(34, 197, 94, 0.3)',
    volumeDown: 'rgba(239, 68, 68, 0.3)',
  }

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.textColor,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: colors.borderColor,
          style: 2,
        },
        horzLine: {
          width: 1,
          color: colors.borderColor,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: colors.borderColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: colors.borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    })

    chartRef.current = chart

    // Create main series based on chart type
    createMainSeries(chart, chartType)

    // Create volume series
    const volumeSeries = chart.addHistogramSeries({
      color: colors.volumeUp,
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })
    volumeSeriesRef.current = volumeSeries

    // Subscribe to crosshair move
    chart.subscribeCrosshairMove((param) => {
      if (param.time && seriesRef.current) {
        const data = param.seriesData.get(seriesRef.current)
        if (data) {
          setCrosshairData({
            time: param.time,
            ...data
          })
        }
      } else {
        setCrosshairData(null)
      }
    })

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [theme, height])

  // Create main series based on type
  const createMainSeries = (chart, type) => {
    // Remove existing series if any
    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current)
    }

    let series
    switch (type) {
      case 'line':
        series = chart.addLineSeries({
          color: colors.upColor,
          lineWidth: 2,
        })
        break
      case 'area':
        series = chart.addAreaSeries({
          topColor: 'rgba(34, 197, 94, 0.4)',
          bottomColor: 'rgba(34, 197, 94, 0.0)',
          lineColor: colors.upColor,
          lineWidth: 2,
        })
        break
      case 'bar':
        series = chart.addBarSeries({
          upColor: colors.upColor,
          downColor: colors.downColor,
        })
        break
      default: // candlestick
        series = chart.addCandlestickSeries({
          upColor: colors.upColor,
          downColor: colors.downColor,
          borderUpColor: colors.upColor,
          borderDownColor: colors.downColor,
          wickUpColor: colors.wickUpColor,
          wickDownColor: colors.wickDownColor,
        })
    }

    seriesRef.current = series
    return series
  }

  // Update chart type
  const handleChartTypeChange = (type) => {
    setChartType(type)
    if (chartRef.current) {
      createMainSeries(chartRef.current, type)
      updateChartData(data)
    }
  }

  // Update data when it changes
  const updateChartData = useCallback((newData) => {
    if (!seriesRef.current || !newData.length) return

    // Format data based on chart type
    const formattedData = newData.map(d => {
      const baseData = { time: d.time }

      if (chartType === 'line' || chartType === 'area') {
        return { ...baseData, value: d.close }
      }
      return {
        ...baseData,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }
    })

    seriesRef.current.setData(formattedData)

    // Update volume data
    if (volumeSeriesRef.current) {
      const volumeData = newData.map(d => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open ? colors.volumeUp : colors.volumeDown,
      }))
      volumeSeriesRef.current.setData(volumeData)
    }

    // Fit content after data update
    chartRef.current?.timeScale().fitContent()
  }, [chartType, colors])

  useEffect(() => {
    if (data.length > 0) {
      updateChartData(data)
    }
  }, [data, updateChartData])

  // Handle timeframe change
  const handleTimeframeChange = (tf) => {
    setSelectedTimeframe(tf)
    onTimeframeChange?.(tf)
  }

  // Add indicator series
  const addIndicatorSeries = (name, indicatorData, options = {}) => {
    if (!chartRef.current) return

    const defaultOptions = {
      color: '#fbbf24',
      lineWidth: 1,
      priceScaleId: 'right',
    }

    const series = chartRef.current.addLineSeries({
      ...defaultOptions,
      ...options,
    })

    series.setData(indicatorData)
    indicatorSeriesRef.current[name] = series
  }

  // Remove indicator series
  const removeIndicatorSeries = (name) => {
    if (chartRef.current && indicatorSeriesRef.current[name]) {
      chartRef.current.removeSeries(indicatorSeriesRef.current[name])
      delete indicatorSeriesRef.current[name]
    }
  }

  // Price formatting
  const formatPrice = (price) => {
    if (!price) return '-'
    return price.toFixed(symbol.includes('JPY') ? 3 : 5)
  }

  // Render legend
  const renderLegend = () => {
    if (!showLegend) return null

    const lastData = data[data.length - 1]
    const displayData = crosshairData || lastData

    if (!displayData) return null

    const isUp = displayData.close >= displayData.open
    const change = displayData.close - displayData.open
    const changePercent = ((change / displayData.open) * 100).toFixed(2)

    return (
      <div className="absolute top-2 left-2 z-10 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-white">{symbol}</span>
          <span className={`flex items-center ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {changePercent}%
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400">O </span>
            <span className="text-white">{formatPrice(displayData.open)}</span>
          </div>
          <div>
            <span className="text-slate-400">H </span>
            <span className="text-green-400">{formatPrice(displayData.high)}</span>
          </div>
          <div>
            <span className="text-slate-400">L </span>
            <span className="text-red-400">{formatPrice(displayData.low)}</span>
          </div>
          <div>
            <span className="text-slate-400">C </span>
            <span className={isUp ? 'text-green-400' : 'text-red-400'}>
              {formatPrice(displayData.close)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden">
      {/* Toolbar */}
      {showToolbar && (
        <div className={`flex items-center justify-between border-b border-slate-700 ${compact ? 'px-2 py-1' : 'px-4 py-2'}`}>
          {/* Left: Symbol & Timeframes */}
          <div className="flex items-center gap-2">
            {/* Symbol selector */}
            <select
              value={symbol}
              onChange={(e) => onSymbolChange?.(e.target.value)}
              className="bg-slate-800 text-white text-sm rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-cyan-500"
            >
              <option value="EURUSD">EUR/USD</option>
              <option value="GBPUSD">GBP/USD</option>
              <option value="USDJPY">USD/JPY</option>
              <option value="XAUUSD">XAU/USD</option>
              <option value="BTCUSD">BTC/USD</option>
            </select>

            {/* Timeframes */}
            <div className="flex bg-slate-800 rounded overflow-hidden">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => handleTimeframeChange(tf.value)}
                  className={`px-2 py-1 text-xs font-medium transition-colors ${
                    selectedTimeframe === tf.value
                      ? 'bg-cyan-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Chart Type */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 rounded overflow-hidden">
              {chartTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleChartTypeChange(type.value)}
                  className={`p-1.5 transition-colors ${
                    chartType === type.value
                      ? 'bg-cyan-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title={type.label}
                >
                  <type.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="relative flex-1">
        {renderLegend()}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  )
})

AdvancedChart.displayName = 'AdvancedChart'

export default AdvancedChart
