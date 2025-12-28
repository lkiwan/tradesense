import { useState, useEffect, useCallback } from 'react'
import { marketAPI, forexAPI } from '../../services/api'
import {
  TrendingUp, TrendingDown, RefreshCw, Search, Globe, DollarSign,
  BarChart3, Activity, Clock, ChevronUp, ChevronDown, Filter,
  Zap, AlertCircle, Building2, Bitcoin, Landmark
} from 'lucide-react'

const MarketOverviewPage = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Market data state
  const [usStocks, setUsStocks] = useState([])
  const [crypto, setCrypto] = useState([])
  const [moroccan, setMoroccan] = useState([])
  const [forex, setForex] = useState([])
  const [marketStatus, setMarketStatus] = useState(null)

  // Statistics
  const [stats, setStats] = useState({
    totalGainers: 0,
    totalLosers: 0,
    avgChange: 0
  })

  const tabs = [
    { id: 'all', label: 'All Markets', icon: Globe },
    { id: 'us', label: 'US Stocks', icon: Building2 },
    { id: 'crypto', label: 'Crypto', icon: Bitcoin },
    { id: 'moroccan', label: 'Moroccan', icon: Landmark },
    { id: 'forex', label: 'Forex', icon: DollarSign },
  ]

  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [pricesRes, forexRes, statusRes] = await Promise.all([
        marketAPI.getAllPrices('all'),
        forexAPI.getPairs('all'),
        marketAPI.getMarketStatus()
      ])

      // Process US stocks
      const usData = pricesRes.data.us_stocks || {}
      const usStocksList = Object.entries(usData).map(([symbol, data]) => ({
        symbol,
        ...data,
        market: 'US',
        type: symbol.endsWith('-USD') ? 'crypto' : 'stock'
      })).filter(s => !s.symbol.endsWith('-USD'))

      // Process Crypto
      const cryptoData = pricesRes.data.crypto || {}
      const cryptoList = Object.entries(cryptoData).map(([symbol, data]) => ({
        symbol,
        ...data,
        market: 'CRYPTO',
        type: 'crypto'
      }))

      // Process Moroccan
      const moroccanData = pricesRes.data.moroccan_list || []
      const moroccanList = moroccanData.map(stock => ({
        ...stock,
        market: 'MOROCCO',
        type: 'stock'
      }))

      // Process Forex
      const forexData = forexRes.data.pairs || []
      const forexList = forexData.map(pair => ({
        ...pair,
        market: 'FOREX',
        type: 'forex'
      }))

      setUsStocks(usStocksList)
      setCrypto(cryptoList)
      setMoroccan(moroccanList)
      setForex(forexList)
      setMarketStatus(statusRes.data)
      setLastUpdate(new Date())

      // Calculate stats
      const allAssets = [...usStocksList, ...cryptoList, ...moroccanList, ...forexList]
      const gainers = allAssets.filter(a => (a.change_percent || 0) > 0).length
      const losers = allAssets.filter(a => (a.change_percent || 0) < 0).length
      const avgChange = allAssets.reduce((sum, a) => sum + (a.change_percent || 0), 0) / (allAssets.length || 1)

      setStats({
        totalGainers: gainers,
        totalLosers: losers,
        avgChange: avgChange.toFixed(2)
      })

    } catch (err) {
      console.error('Failed to fetch market data:', err)
      setError('Failed to load market data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMarketData()
    const interval = setInterval(fetchMarketData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [fetchMarketData])

  // Get filtered data based on active tab
  const getFilteredData = () => {
    let data = []

    switch (activeTab) {
      case 'us':
        data = usStocks
        break
      case 'crypto':
        data = crypto
        break
      case 'moroccan':
        data = moroccan
        break
      case 'forex':
        data = forex
        break
      default:
        data = [...usStocks, ...crypto, ...moroccan, ...forex]
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      data = data.filter(item =>
        item.symbol?.toLowerCase().includes(query) ||
        item.name?.toLowerCase().includes(query)
      )
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

  const getMarketIcon = (market) => {
    switch (market) {
      case 'US': return <Building2 className="w-4 h-4" />
      case 'CRYPTO': return <Bitcoin className="w-4 h-4" />
      case 'MOROCCO': return <Landmark className="w-4 h-4" />
      case 'FOREX': return <DollarSign className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
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

  // Get top gainers and losers
  const allData = [...usStocks, ...crypto, ...moroccan, ...forex]
  const topGainers = [...allData]
    .filter(a => a.change_percent !== null && a.change_percent !== undefined)
    .sort((a, b) => (b.change_percent || 0) - (a.change_percent || 0))
    .slice(0, 5)
  const topLosers = [...allData]
    .filter(a => a.change_percent !== null && a.change_percent !== undefined)
    .sort((a, b) => (a.change_percent || 0) - (b.change_percent || 0))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary-500" />
            Market Overview
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time prices across all markets
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Last Update */}
          {lastUpdate && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Updated {lastUpdate.toLocaleTimeString()}</span>
            </div>
          )}

          <button
            onClick={fetchMarketData}
            disabled={loading}
            className="p-2 bg-dark-200 rounded-lg text-gray-400 hover:text-white hover:bg-dark-100 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Market Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* US Market */}
        <div className="bg-dark-200 rounded-xl p-4 border border-dark-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">US Markets</span>
            <div className={`w-2 h-2 rounded-full ${
              marketStatus?.us?.status === 'open' ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`} />
          </div>
          <p className="text-white font-semibold capitalize">
            {marketStatus?.us?.status || 'Loading...'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{usStocks.length} stocks</p>
        </div>

        {/* Crypto */}
        <div className="bg-dark-200 rounded-xl p-4 border border-dark-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Crypto</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <p className="text-white font-semibold">24/7 Open</p>
          <p className="text-xs text-gray-500 mt-1">{crypto.length} coins</p>
        </div>

        {/* Morocco */}
        <div className="bg-dark-200 rounded-xl p-4 border border-dark-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Casablanca SE</span>
            <div className={`w-2 h-2 rounded-full ${
              marketStatus?.morocco?.status === 'open' ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`} />
          </div>
          <p className="text-white font-semibold capitalize">
            {marketStatus?.morocco?.status || 'Loading...'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{moroccan.length} stocks</p>
        </div>

        {/* Forex */}
        <div className="bg-dark-200 rounded-xl p-4 border border-dark-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Forex</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <p className="text-white font-semibold">24/5 Open</p>
          <p className="text-xs text-gray-500 mt-1">{forex.length} pairs</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-dark-200 rounded-xl p-4 border border-dark-100">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">Gainers</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalGainers}</p>
        </div>
        <div className="bg-dark-200 rounded-xl p-4 border border-dark-100">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <TrendingDown className="w-5 h-5" />
            <span className="text-sm">Losers</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalLosers}</p>
        </div>
        <div className="bg-dark-200 rounded-xl p-4 border border-dark-100">
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
        {/* Top Gainers */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Top Gainers
          </h2>
          <div className="space-y-3">
            {topGainers.map((asset, index) => (
              <div
                key={`${asset.symbol}-${index}`}
                className="flex items-center justify-between p-3 bg-dark-300 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs ${getMarketBadgeColor(asset.market)}`}>
                    {getMarketIcon(asset.market)}
                  </span>
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

        {/* Top Losers */}
        <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Top Losers
          </h2>
          <div className="space-y-3">
            {topLosers.map((asset, index) => (
              <div
                key={`${asset.symbol}-${index}`}
                className="flex items-center justify-between p-3 bg-dark-300 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs ${getMarketBadgeColor(asset.market)}`}>
                    {getMarketIcon(asset.market)}
                  </span>
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

      {/* Market Tabs and Search */}
      <div className="bg-dark-200 rounded-xl border border-dark-100">
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-dark-100 p-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="pl-10 pr-4 py-2 bg-dark-300 border border-dark-100 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 w-64"
            />
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden p-4 border-b border-dark-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-10 pr-4 py-2 bg-dark-300 border border-dark-100 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-dark-100">
                <th className="p-4 text-gray-400 font-medium">Asset</th>
                <th className="p-4 text-gray-400 font-medium text-right">Price</th>
                <th className="p-4 text-gray-400 font-medium text-right">Change</th>
                <th className="p-4 text-gray-400 font-medium text-right hidden md:table-cell">Volume</th>
                <th className="p-4 text-gray-400 font-medium text-right">Market</th>
              </tr>
            </thead>
            <tbody>
              {loading && filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading market data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    No assets found matching your search.
                  </td>
                </tr>
              ) : (
                filteredData.slice(0, 50).map((asset, index) => (
                  <tr
                    key={`${asset.symbol}-${asset.market}-${index}`}
                    className="border-b border-dark-100/50 hover:bg-dark-300/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getMarketBadgeColor(asset.market)}`}>
                          {getMarketIcon(asset.market)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{asset.symbol}</p>
                          <p className="text-xs text-gray-500 max-w-[150px] truncate">
                            {asset.name || '--'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right text-white font-mono">
                      {formatPrice(asset.price, asset.market)}
                    </td>
                    <td className={`p-4 text-right font-medium ${getChangeColor(asset.change_percent)}`}>
                      <div className="flex items-center justify-end gap-1">
                        {asset.change_percent >= 0 ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        {formatChange(asset.change_percent)}
                      </div>
                    </td>
                    <td className="p-4 text-right text-gray-400 hidden md:table-cell">
                      {asset.volume ? asset.volume.toLocaleString() : '--'}
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

        {/* Show more indicator */}
        {filteredData.length > 50 && (
          <div className="p-4 text-center text-gray-400 border-t border-dark-100">
            Showing 50 of {filteredData.length} assets. Use search to find specific assets.
          </div>
        )}
      </div>
    </div>
  )
}

export default MarketOverviewPage
