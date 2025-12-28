import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createChart, ColorType } from 'lightweight-charts'
import { marketAPI, forexAPI } from '../../services/api'
import {
  BarChart2, TrendingUp, TrendingDown, RefreshCw, Search, Globe, DollarSign,
  BarChart3, Activity, Clock, ChevronUp, ChevronDown, Filter, Maximize2, Minimize2,
  LayoutGrid, Square, Columns, AlertCircle, Building2, Bitcoin, Landmark, Banknote,
  ArrowRightLeft
} from 'lucide-react'

// Tab definitions
const TABS = [
  { id: 'charts', label: 'Charts', icon: BarChart2 },
  { id: 'markets', label: 'Market Overview', icon: BarChart3 },
  { id: 'forex', label: 'Forex', icon: DollarSign }
]

// Charts configuration
const chartLayouts = [
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
const Chart = ({ symbol, timeframe, onSymbolChange, onTimeframeChange, chartHeight }) => {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const data = useMemo(() => generateData(symbol, timeframe), [symbol, timeframe])

  useEffect(() => {
    if (!containerRef.current) return

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: chartHeight - 50,
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#334155' },
      timeScale: { borderColor: '#334155', timeVisible: true },
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

    series.setData(data)
    chart.timeScale().fitContent()

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
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
    <div className="flex flex-col h-full bg-dark-100 rounded-xl overflow-hidden border border-white/5">
      <div className="flex items-center justify-between px-3 py-2 bg-dark-200/50 border-b border-white/5">
        <div className="flex items-center gap-2">
          <select
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            className="bg-dark-100 text-white text-sm rounded px-2 py-1 border border-white/5 focus:outline-none focus:border-primary-500/50"
          >
            {symbols.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex bg-dark-100 rounded overflow-hidden border border-white/5">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  timeframe === tf
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="text-sm">
          <span className="text-gray-400 mr-2">{symbol}</span>
          <span className={`font-medium ${data[data.length - 1]?.close > data[data.length - 2]?.close ? 'text-green-400' : 'text-red-400'}`}>
            {data[data.length - 1]?.close?.toFixed(symbol.includes('JPY') ? 3 : 5)}
          </span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1" />
    </div>
  )
}

const ChartsMarketsPage = () => {
  const [activeTab, setActiveTab] = useState('charts')

  // Charts state
  const [currentLayout, setCurrentLayout] = useState(chartLayouts[0])
  const [charts, setCharts] = useState([{ id: 1, symbol: 'EURUSD', timeframe: '1H' }])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [chartHeight, setChartHeight] = useState(400)
  const containerRef = useRef(null)

  // Markets state
  const [marketTab, setMarketTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usStocks, setUsStocks] = useState([])
  const [crypto, setCrypto] = useState([])
  const [moroccan, setMoroccan] = useState([])
  const [forex, setForex] = useState([])
  const [marketStatus, setMarketStatus] = useState(null)
  const [stats, setStats] = useState({ totalGainers: 0, totalLosers: 0, avgChange: 0 })

  // Forex state
  const [pairs, setPairs] = useState([])
  const [madPairs, setMadPairs] = useState([])
  const [forexSummary, setForexSummary] = useState(null)
  const [forexStatus, setForexStatus] = useState(null)
  const [forexLoading, setForexLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [forexSearchQuery, setForexSearchQuery] = useState('')

  // Converter state
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('MAD')
  const [amount, setAmount] = useState(100)
  const [convertedAmount, setConvertedAmount] = useState(null)
  const [conversionRate, setConversionRate] = useState(null)
  const [converting, setConverting] = useState(false)

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'MAD']

  const marketTabs = [
    { id: 'all', label: 'All Markets', icon: Globe },
    { id: 'us', label: 'US Stocks', icon: Building2 },
    { id: 'crypto', label: 'Crypto', icon: Bitcoin },
    { id: 'moroccan', label: 'Moroccan', icon: Landmark },
    { id: 'forex', label: 'Forex', icon: DollarSign },
  ]

  // Fetch market data
  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [pricesRes, forexRes, statusRes] = await Promise.all([
        marketAPI.getAllPrices('all'),
        forexAPI.getPairs('all'),
        marketAPI.getMarketStatus()
      ])

      const usData = pricesRes.data.us_stocks || {}
      const usStocksList = Object.entries(usData).map(([symbol, data]) => ({
        symbol, ...data, market: 'US', type: 'stock'
      })).filter(s => !s.symbol.endsWith('-USD'))

      const cryptoData = pricesRes.data.crypto || {}
      const cryptoList = Object.entries(cryptoData).map(([symbol, data]) => ({
        symbol, ...data, market: 'CRYPTO', type: 'crypto'
      }))

      const moroccanData = pricesRes.data.moroccan_list || []
      const moroccanList = moroccanData.map(stock => ({ ...stock, market: 'MOROCCO', type: 'stock' }))

      const forexData = forexRes.data.pairs || []
      const forexList = forexData.map(pair => ({ ...pair, market: 'FOREX', type: 'forex' }))

      setUsStocks(usStocksList)
      setCrypto(cryptoList)
      setMoroccan(moroccanList)
      setForex(forexList)
      setMarketStatus(statusRes.data)

      const allAssets = [...usStocksList, ...cryptoList, ...moroccanList, ...forexList]
      const gainers = allAssets.filter(a => (a.change_percent || 0) > 0).length
      const losers = allAssets.filter(a => (a.change_percent || 0) < 0).length
      const avgChange = allAssets.reduce((sum, a) => sum + (a.change_percent || 0), 0) / (allAssets.length || 1)
      setStats({ totalGainers: gainers, totalLosers: losers, avgChange: avgChange.toFixed(2) })
    } catch (err) {
      console.error('Failed to fetch market data:', err)
      setError('Failed to load market data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch forex data
  const fetchForexData = useCallback(async () => {
    try {
      setForexLoading(true)
      const [pairsRes, madRes, summaryRes, statusRes] = await Promise.all([
        forexAPI.getPairs(selectedType),
        forexAPI.getMADPairs(),
        forexAPI.getSummary(),
        forexAPI.getStatus()
      ])
      setPairs(pairsRes.data.pairs || [])
      setMadPairs(madRes.data.pairs || [])
      setForexSummary(summaryRes.data)
      setForexStatus(statusRes.data)
    } catch (err) {
      console.error('Failed to fetch forex data:', err)
    } finally {
      setForexLoading(false)
    }
  }, [selectedType])

  useEffect(() => {
    if (activeTab === 'markets') {
      fetchMarketData()
    } else if (activeTab === 'forex') {
      fetchForexData()
    }
  }, [activeTab, fetchMarketData, fetchForexData])

  // Chart layout handlers
  const handleLayoutChange = (layout) => {
    setCurrentLayout(layout)
    const totalCharts = layout.cols * layout.rows
    if (charts.length < totalCharts) {
      const newCharts = [...charts]
      for (let i = charts.length; i < totalCharts; i++) {
        newCharts.push({ id: i + 1, symbol: symbols[i % symbols.length], timeframe: '1H' })
      }
      setCharts(newCharts)
    } else {
      setCharts(charts.slice(0, totalCharts))
    }
  }

  const updateChart = (id, updates) => {
    setCharts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Market helpers
  const getFilteredData = () => {
    let data = []
    switch (marketTab) {
      case 'us': data = usStocks; break
      case 'crypto': data = crypto; break
      case 'moroccan': data = moroccan; break
      case 'forex': data = forex; break
      default: data = [...usStocks, ...crypto, ...moroccan, ...forex]
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      data = data.filter(item => item.symbol?.toLowerCase().includes(query) || item.name?.toLowerCase().includes(query))
    }
    return data
  }

  const formatPrice = (price, market) => {
    if (price === null || price === undefined) return '--'
    if (market === 'FOREX') return price.toFixed(5)
    if (market === 'CRYPTO' && price < 1) return price.toFixed(6)
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatChange = (change) => {
    if (change === null || change === undefined) return '--'
    const prefix = change >= 0 ? '+' : ''
    return `${prefix}${change.toFixed(2)}%`
  }

  const getChangeColor = (change) => {
    if (change === null || change === undefined) return 'text-gray-400'
    return change >= 0 ? 'text-green-400' : 'text-red-400'
  }

  const getMarketBadgeColor = (market) => {
    switch (market) {
      case 'US': return 'bg-blue-500/20 text-blue-400'
      case 'CRYPTO': return 'bg-orange-500/20 text-orange-400'
      case 'MOROCCO': return 'bg-green-500/20 text-green-400'
      case 'FOREX': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const filteredData = getFilteredData()
  const allData = [...usStocks, ...crypto, ...moroccan, ...forex]
  const topGainers = [...allData].filter(a => a.change_percent !== null).sort((a, b) => (b.change_percent || 0) - (a.change_percent || 0)).slice(0, 5)
  const topLosers = [...allData].filter(a => a.change_percent !== null).sort((a, b) => (a.change_percent || 0) - (b.change_percent || 0)).slice(0, 5)

  // Forex helpers
  const filteredPairs = pairs.filter(pair =>
    pair.symbol?.toLowerCase().includes(forexSearchQuery.toLowerCase()) ||
    pair.name?.toLowerCase().includes(forexSearchQuery.toLowerCase())
  )

  const handleConvert = async () => {
    if (!amount || amount <= 0) return
    try {
      setConverting(true)
      const res = await forexAPI.convert(fromCurrency, toCurrency, amount)
      setConvertedAmount(res.data.converted)
      setConversionRate(res.data.rate)
    } catch (err) {
      console.error('Conversion failed:', err)
    } finally {
      setConverting(false)
    }
  }

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setConvertedAmount(null)
    setConversionRate(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <BarChart2 className="text-indigo-400" size={24} />
            </div>
            Charts & Markets
          </h1>
          <p className="text-gray-400 mt-1">Advanced charting and real-time market data</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-dark-100/80 backdrop-blur-xl rounded-xl p-1.5 border border-white/5 overflow-x-auto">
        {TABS.map(tab => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              <IconComponent size={16} />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <div ref={containerRef} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex bg-dark-100/80 rounded-lg overflow-hidden border border-white/5">
                {chartLayouts.map(layout => (
                  <button
                    key={layout.id}
                    onClick={() => handleLayoutChange(layout)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                      currentLayout.id === layout.id
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-dark-200'
                    }`}
                  >
                    <layout.icon className="w-4 h-4" />
                    {layout.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-dark-100/80 hover:bg-dark-200 rounded-lg text-gray-300 transition-colors border border-white/5"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${currentLayout.cols}, 1fr)`,
              gridTemplateRows: `repeat(${currentLayout.rows}, ${chartHeight}px)`,
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
              />
            ))}
          </div>

          <div className="text-sm text-gray-400 text-center">
            Click on a chart to interact - Use symbol dropdown to change pair - Select timeframe from toolbar
          </div>
        </div>
      )}

      {/* Markets Tab */}
      {activeTab === 'markets' && (
        <div className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm">Gainers</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalGainers}</p>
            </div>
            <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <TrendingDown className="w-5 h-5" />
                <span className="text-sm">Losers</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalLosers}</p>
            </div>
            <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 text-primary-400 mb-2">
                <Activity className="w-5 h-5" />
                <span className="text-sm">Avg Change</span>
              </div>
              <p className={`text-2xl font-bold ${getChangeColor(parseFloat(stats.avgChange))}`}>
                {stats.avgChange}%
              </p>
            </div>
          </div>

          {/* Top Movers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Top Gainers
              </h2>
              <div className="space-y-3">
                {topGainers.map((asset, index) => (
                  <div key={`${asset.symbol}-${index}`} className="flex items-center justify-between p-3 bg-dark-200/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs ${getMarketBadgeColor(asset.market)}`}>{asset.market}</span>
                      <div>
                        <p className="text-white font-medium">{asset.symbol}</p>
                        <p className="text-xs text-gray-500">{asset.name?.slice(0, 20) || asset.market}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-mono">{formatPrice(asset.price, asset.market)}</p>
                      <p className="text-green-400 text-sm flex items-center justify-end gap-1">
                        <ChevronUp className="w-3 h-3" />
                        {formatChange(asset.change_percent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Top Losers
              </h2>
              <div className="space-y-3">
                {topLosers.map((asset, index) => (
                  <div key={`${asset.symbol}-${index}`} className="flex items-center justify-between p-3 bg-dark-200/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs ${getMarketBadgeColor(asset.market)}`}>{asset.market}</span>
                      <div>
                        <p className="text-white font-medium">{asset.symbol}</p>
                        <p className="text-xs text-gray-500">{asset.name?.slice(0, 20) || asset.market}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-mono">{formatPrice(asset.price, asset.market)}</p>
                      <p className="text-red-400 text-sm flex items-center justify-end gap-1">
                        <ChevronDown className="w-3 h-3" />
                        {formatChange(asset.change_percent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Market Tabs and Data */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5">
            <div className="flex items-center justify-between border-b border-white/5 p-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                {marketTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setMarketTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      marketTab === tab.id
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-dark-200'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets..."
                  className="pl-10 pr-4 py-2 bg-dark-200/50 border border-white/5 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50 w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-white/5">
                    <th className="p-4 text-gray-400 font-medium">Asset</th>
                    <th className="p-4 text-gray-400 font-medium text-right">Price</th>
                    <th className="p-4 text-gray-400 font-medium text-right">Change</th>
                    <th className="p-4 text-gray-400 font-medium text-right">Market</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading market data...
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-400">No assets found.</td>
                    </tr>
                  ) : (
                    filteredData.slice(0, 50).map((asset, index) => (
                      <tr key={`${asset.symbol}-${index}`} className="border-b border-white/5 hover:bg-dark-200/30 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="text-white font-medium">{asset.symbol}</p>
                            <p className="text-xs text-gray-500 max-w-[150px] truncate">{asset.name || '--'}</p>
                          </div>
                        </td>
                        <td className="p-4 text-right text-white font-mono">{formatPrice(asset.price, asset.market)}</td>
                        <td className={`p-4 text-right font-medium ${getChangeColor(asset.change_percent)}`}>
                          {formatChange(asset.change_percent)}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMarketBadgeColor(asset.market)}`}>
                            {asset.market}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Forex Tab */}
      {activeTab === 'forex' && (
        <div className="space-y-6">
          {/* Currency Converter */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary-500" />
              Currency Converter
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm text-gray-400 mb-2">From</label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500/50"
                >
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500/50"
                  placeholder="Enter amount"
                  min="0"
                />
              </div>
              <div className="flex justify-center">
                <button onClick={swapCurrencies} className="p-3 bg-dark-200/50 rounded-full text-primary-500 hover:bg-primary-500/20 transition-colors">
                  <ArrowRightLeft className="w-5 h-5" />
                </button>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">To</label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500/50"
                >
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button
                onClick={handleConvert}
                disabled={converting}
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {converting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Convert'}
              </button>
            </div>
            {convertedAmount !== null && (
              <div className="mt-4 p-4 bg-dark-200/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{amount.toLocaleString()} {fromCurrency} =</p>
                    <p className="text-2xl font-bold text-white">{convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Exchange Rate</p>
                    <p className="text-lg font-semibold text-primary-400">1 {fromCurrency} = {conversionRate?.toFixed(6)} {toCurrency}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MAD Pairs */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-500" />
              Moroccan Dirham (MAD) Pairs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {madPairs.map((pair, index) => (
                <div key={index} className="bg-dark-200/50 rounded-xl p-4 border border-white/5 hover:border-primary-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{pair.symbol}</span>
                    <span className={`text-sm ${getChangeColor(pair.change_percent)}`}>{formatChange(pair.change_percent)}</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{pair.price?.toFixed(4) || '--'}</div>
                  <p className="text-xs text-gray-500">{pair.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* All Forex Pairs */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                All Currency Pairs
              </h2>
              <div className="flex items-center gap-3">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-dark-200/50 border border-white/5 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                >
                  <option value="all">All Pairs</option>
                  <option value="major">Major</option>
                  <option value="cross">Cross</option>
                  <option value="mad">MAD</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={forexSearchQuery}
                    onChange={(e) => setForexSearchQuery(e.target.value)}
                    placeholder="Search pairs..."
                    className="pl-10 pr-4 py-2 bg-dark-200/50 border border-white/5 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50 w-48"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-white/5">
                    <th className="pb-4 text-gray-400 font-medium">Pair</th>
                    <th className="pb-4 text-gray-400 font-medium text-right">Bid</th>
                    <th className="pb-4 text-gray-400 font-medium text-right">Ask</th>
                    <th className="pb-4 text-gray-400 font-medium text-right">Change</th>
                    <th className="pb-4 text-gray-400 font-medium text-right">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {forexLoading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading forex data...
                      </td>
                    </tr>
                  ) : filteredPairs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400">No pairs found.</td>
                    </tr>
                  ) : (
                    filteredPairs.map((pair, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-dark-200/30 transition-colors">
                        <td className="py-4">
                          <div>
                            <p className="text-white font-medium">{pair.symbol}</p>
                            <p className="text-xs text-gray-500">{pair.name}</p>
                          </div>
                        </td>
                        <td className="py-4 text-right text-white font-mono">{pair.bid?.toFixed(5) || pair.price?.toFixed(5) || '--'}</td>
                        <td className="py-4 text-right text-white font-mono">{pair.ask?.toFixed(5) || pair.price?.toFixed(5) || '--'}</td>
                        <td className={`py-4 text-right font-medium ${getChangeColor(pair.change_percent)}`}>
                          {formatChange(pair.change_percent)}
                        </td>
                        <td className="py-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            pair.type === 'major' ? 'bg-blue-500/20 text-blue-400' :
                            pair.type === 'cross' ? 'bg-purple-500/20 text-purple-400' :
                            pair.type === 'mad' ? 'bg-green-500/20 text-green-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {pair.type || 'forex'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChartsMarketsPage
