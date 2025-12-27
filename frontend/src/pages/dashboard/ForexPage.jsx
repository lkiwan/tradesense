import { useState, useEffect } from 'react'
import { forexAPI } from '../../services/api'
import {
  DollarSign, TrendingUp, TrendingDown, RefreshCw, Clock,
  ArrowRightLeft, Globe, Banknote, BarChart3, AlertCircle,
  ChevronUp, ChevronDown, Search, Filter
} from 'lucide-react'

const ForexPage = () => {
  const [pairs, setPairs] = useState([])
  const [madPairs, setMadPairs] = useState([])
  const [summary, setSummary] = useState(null)
  const [marketStatus, setMarketStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedType, setSelectedType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Converter state
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('MAD')
  const [amount, setAmount] = useState(100)
  const [convertedAmount, setConvertedAmount] = useState(null)
  const [converting, setConverting] = useState(false)
  const [conversionRate, setConversionRate] = useState(null)

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'MAD']

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [selectedType])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [pairsRes, madRes, summaryRes, statusRes] = await Promise.all([
        forexAPI.getPairs(selectedType),
        forexAPI.getMADPairs(),
        forexAPI.getSummary(),
        forexAPI.getStatus()
      ])

      setPairs(pairsRes.data.pairs || [])
      setMadPairs(madRes.data.pairs || [])
      setSummary(summaryRes.data)
      setMarketStatus(statusRes.data)
    } catch (err) {
      console.error('Failed to fetch forex data:', err)
      setError('Failed to load forex data')
    } finally {
      setLoading(false)
    }
  }

  const handleConvert = async () => {
    if (!amount || amount <= 0) return

    try {
      setConverting(true)
      const res = await forexAPI.convert(fromCurrency, toCurrency, amount)
      setConvertedAmount(res.data.converted)
      setConversionRate(res.data.rate)
    } catch (err) {
      console.error('Conversion failed:', err)
      setError('Conversion failed')
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

  const filteredPairs = pairs.filter(pair =>
    pair.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pair.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatChange = (change) => {
    if (change === null || change === undefined) return '--'
    const prefix = change >= 0 ? '+' : ''
    return `${prefix}${change.toFixed(2)}%`
  }

  const getChangeColor = (change) => {
    if (change === null || change === undefined) return 'text-gray-400'
    return change >= 0 ? 'text-green-400' : 'text-red-400'
  }

  if (loading && pairs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading forex data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-primary-500" />
            Forex Market
          </h1>
          <p className="text-gray-400 mt-1">
            Live currency pairs and exchange rates
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Market Status */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            marketStatus?.market_open
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              marketStatus?.market_open ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`} />
            <span className="text-sm font-medium">
              {marketStatus?.market_open ? 'Market Open' : 'Market Closed'}
            </span>
          </div>

          <button
            onClick={fetchData}
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

      {/* Currency Converter */}
      <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-primary-500" />
          Currency Converter
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* From Currency */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full bg-dark-300 border border-dark-100 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
            >
              {currencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-dark-300 border border-dark-100 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
              placeholder="Enter amount"
              min="0"
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={swapCurrencies}
              className="p-3 bg-dark-300 rounded-full text-primary-500 hover:bg-primary-500/20 transition-colors"
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>
          </div>

          {/* To Currency */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">To</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full bg-dark-300 border border-dark-100 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
            >
              {currencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={converting}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {converting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Convert'
            )}
          </button>
        </div>

        {/* Conversion Result */}
        {convertedAmount !== null && (
          <div className="mt-4 p-4 bg-dark-300 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {amount.toLocaleString()} {fromCurrency} =
                </p>
                <p className="text-2xl font-bold text-white">
                  {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Exchange Rate</p>
                <p className="text-lg font-semibold text-primary-400">
                  1 {fromCurrency} = {conversionRate?.toFixed(6)} {toCurrency}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAD Pairs - Moroccan Dirham */}
      <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-green-500" />
          Moroccan Dirham (MAD) Pairs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {madPairs.map((pair, index) => (
            <div
              key={index}
              className="bg-dark-300 rounded-xl p-4 border border-dark-100 hover:border-primary-500/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{pair.symbol}</span>
                <span className={`text-sm ${getChangeColor(pair.change_percent)}`}>
                  {formatChange(pair.change_percent)}
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {pair.price?.toFixed(4) || '--'}
              </div>
              <p className="text-xs text-gray-500">{pair.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Market Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Gainers */}
          <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Top Gainers
            </h2>
            <div className="space-y-3">
              {summary.top_gainers?.slice(0, 5).map((pair, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-dark-300 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{pair.symbol}</p>
                    <p className="text-sm text-gray-500">{pair.price?.toFixed(4)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-400">
                    <ChevronUp className="w-4 h-4" />
                    <span className="font-medium">
                      {formatChange(pair.change_percent)}
                    </span>
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
              {summary.top_losers?.slice(0, 5).map((pair, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-dark-300 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{pair.symbol}</p>
                    <p className="text-sm text-gray-500">{pair.price?.toFixed(4)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-red-400">
                    <ChevronDown className="w-4 h-4" />
                    <span className="font-medium">
                      {formatChange(pair.change_percent)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Forex Pairs */}
      <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            All Currency Pairs
          </h2>

          <div className="flex items-center gap-3">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-dark-300 border border-dark-100 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="all">All Pairs</option>
                <option value="major">Major</option>
                <option value="cross">Cross</option>
                <option value="mad">MAD</option>
                <option value="exotic">Exotic</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pairs..."
                className="pl-10 pr-4 py-2 bg-dark-300 border border-dark-100 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 w-48"
              />
            </div>
          </div>
        </div>

        {/* Pairs Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-dark-100">
                <th className="pb-4 text-gray-400 font-medium">Pair</th>
                <th className="pb-4 text-gray-400 font-medium text-right">Bid</th>
                <th className="pb-4 text-gray-400 font-medium text-right">Ask</th>
                <th className="pb-4 text-gray-400 font-medium text-right">Spread</th>
                <th className="pb-4 text-gray-400 font-medium text-right">Change</th>
                <th className="pb-4 text-gray-400 font-medium text-right">Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredPairs.map((pair, index) => (
                <tr
                  key={index}
                  className="border-b border-dark-100/50 hover:bg-dark-300/50 transition-colors"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-dark-300 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{pair.symbol}</p>
                        <p className="text-xs text-gray-500">{pair.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right text-white font-mono">
                    {pair.bid?.toFixed(5) || pair.price?.toFixed(5) || '--'}
                  </td>
                  <td className="py-4 text-right text-white font-mono">
                    {pair.ask?.toFixed(5) || pair.price?.toFixed(5) || '--'}
                  </td>
                  <td className="py-4 text-right text-gray-400 font-mono">
                    {pair.spread?.toFixed(1) || '--'}
                  </td>
                  <td className={`py-4 text-right font-medium ${getChangeColor(pair.change_percent)}`}>
                    <div className="flex items-center justify-end gap-1">
                      {pair.change_percent >= 0 ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      {formatChange(pair.change_percent)}
                    </div>
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
              ))}
            </tbody>
          </table>

          {filteredPairs.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No pairs found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Trading Info */}
      <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" />
          Trading Hours
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-dark-300 rounded-lg">
            <p className="text-gray-400 text-sm">Sydney</p>
            <p className="text-white font-medium">5 PM - 2 AM EST</p>
          </div>
          <div className="p-4 bg-dark-300 rounded-lg">
            <p className="text-gray-400 text-sm">Tokyo</p>
            <p className="text-white font-medium">7 PM - 4 AM EST</p>
          </div>
          <div className="p-4 bg-dark-300 rounded-lg">
            <p className="text-gray-400 text-sm">London</p>
            <p className="text-white font-medium">3 AM - 12 PM EST</p>
          </div>
          <div className="p-4 bg-dark-300 rounded-lg">
            <p className="text-gray-400 text-sm">New York</p>
            <p className="text-white font-medium">8 AM - 5 PM EST</p>
          </div>
          <div className="p-4 bg-dark-300 rounded-lg">
            <p className="text-gray-400 text-sm">Casablanca</p>
            <p className="text-white font-medium">8 AM - 5 PM WET</p>
          </div>
          <div className="p-4 bg-dark-300 rounded-lg">
            <p className="text-gray-400 text-sm">Market Week</p>
            <p className="text-white font-medium">Sunday 5 PM - Friday 5 PM EST</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForexPage
