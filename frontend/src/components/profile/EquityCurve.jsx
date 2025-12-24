import { useState, useEffect, useRef, useMemo } from 'react'
import { createChart, ColorType } from 'lightweight-charts'
import { TrendingUp, RefreshCw, Calendar } from 'lucide-react'

const PERIODS = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'all', label: 'All Time' }
]

const EquityCurve = ({ data = [], period = '30d', onPeriodChange, isLoading = false }) => {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  // Transform data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    return data.map(point => ({
      time: Math.floor(new Date(point.timestamp).getTime() / 1000),
      value: point.equity
    })).sort((a, b) => a.time - b.time)
  }, [data])

  // Calculate metrics
  const metrics = useMemo(() => {
    if (chartData.length < 2) return null

    const startValue = chartData[0].value
    const endValue = chartData[chartData.length - 1].value
    const change = endValue - startValue
    const percentChange = ((change / startValue) * 100)
    const high = Math.max(...chartData.map(d => d.value))
    const low = Math.min(...chartData.map(d => d.value))

    return {
      startValue,
      endValue,
      change,
      percentChange,
      high,
      low,
      isPositive: change >= 0
    }
  }, [chartData])

  useEffect(() => {
    if (!containerRef.current || chartData.length === 0) return

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: '#334155',
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Create area series for equity curve
    const areaSeries = chart.addAreaSeries({
      topColor: metrics?.isPositive ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      bottomColor: metrics?.isPositive ? 'rgba(34, 197, 94, 0.0)' : 'rgba(239, 68, 68, 0.0)',
      lineColor: metrics?.isPositive ? '#22c55e' : '#ef4444',
      lineWidth: 2,
    })

    areaSeries.setData(chartData)
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
  }, [chartData, metrics])

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-center h-[300px]">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No equity data available yet.</p>
        <p className="text-sm text-slate-500 mt-2">
          Equity curve will appear after completing trades.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white">Equity Curve</h3>
          {metrics && (
            <div className={`flex items-center gap-1 text-sm ${metrics.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <TrendingUp className={`w-4 h-4 ${!metrics.isPositive ? 'rotate-180' : ''}`} />
              <span>{metrics.isPositive ? '+' : ''}{metrics.percentChange.toFixed(2)}%</span>
              <span className="text-slate-400">
                (${metrics.isPositive ? '+' : ''}{metrics.change.toFixed(2)})
              </span>
            </div>
          )}
        </div>

        {/* Period Selector */}
        <div className="flex bg-slate-700 rounded-lg overflow-hidden">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => onPeriodChange?.(p.id)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.id
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      {metrics && (
        <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-700">
          <div>
            <div className="text-xs text-slate-400 mb-1">Starting Balance</div>
            <div className="text-white font-medium">${metrics.startValue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Current Balance</div>
            <div className="text-white font-medium">${metrics.endValue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Peak Balance</div>
            <div className="text-green-400 font-medium">${metrics.high.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Lowest Balance</div>
            <div className="text-red-400 font-medium">${metrics.low.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div ref={containerRef} className="w-full" style={{ height: '300px' }} />
    </div>
  )
}

export default EquityCurve
