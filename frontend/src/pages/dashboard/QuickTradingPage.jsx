import { useState, useEffect } from 'react'
import {
  Zap, TrendingUp, TrendingDown, Clock, BarChart3,
  RefreshCw, Keyboard, ChevronDown, Activity
} from 'lucide-react'
import { OneClickPanel } from '../../components/trading'
import api from '../../services/api'

const SYMBOLS = [
  { name: 'EURUSD', type: 'forex' },
  { name: 'GBPUSD', type: 'forex' },
  { name: 'USDJPY', type: 'forex' },
  { name: 'XAUUSD', type: 'commodity' },
  { name: 'BTCUSD', type: 'crypto' },
  { name: 'US30', type: 'index' },
  { name: 'NAS100', type: 'index' }
]

const QuickTradingPage = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD')
  const [currentPrice, setCurrentPrice] = useState(1.0850)
  const [challenges, setChallenges] = useState([])
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [executionHistory, setExecutionHistory] = useState([])
  const [stats, setStats] = useState({
    total_orders: 0,
    avg_execution_time: 0,
    win_rate: 0,
    today_orders: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChallenges()
    loadExecutionHistory()
    loadStats()

    // Simulate price updates (would be WebSocket in production)
    const priceInterval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 0.0010
        return parseFloat((prev + change).toFixed(5))
      })
    }, 1000)

    return () => clearInterval(priceInterval)
  }, [])

  const loadChallenges = async () => {
    try {
      const response = await api.get('/challenges/my-challenges')
      const activeChallenge = response.data?.find(c => c.status === 'active')
      setChallenges(response.data || [])
      if (activeChallenge) {
        setSelectedChallenge(activeChallenge.id)
      }
    } catch (error) {
      console.error('Failed to load challenges:', error)
    }
  }

  const loadExecutionHistory = async () => {
    try {
      const response = await api.get('/quick-trading/history', {
        params: { limit: 10 }
      })
      setExecutionHistory(response.data?.orders || [])
    } catch (error) {
      console.error('Failed to load execution history:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await api.get('/quick-trading/stats')
      if (response.data) {
        setStats({
          total_orders: response.data.total_orders || 0,
          avg_execution_time: response.data.avg_execution_time_ms || 0,
          win_rate: 0,
          today_orders: response.data.total_orders || 0
        })
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
            <Zap className="text-orange-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Quick Trading</h1>
            <p className="text-gray-400 text-sm">One-click order execution with hotkey support</p>
          </div>
        </div>
        <div className="flex gap-3">
          {/* Symbol Selector */}
          <div className="relative">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="appearance-none bg-dark-100 border border-dark-200 text-white rounded-lg px-4 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer hover:bg-dark-200 transition-colors"
            >
              {SYMBOLS.map(s => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>

          {/* Account Selector */}
          {challenges.length > 0 && (
            <div className="relative">
              <select
                value={selectedChallenge || ''}
                onChange={(e) => setSelectedChallenge(e.target.value)}
                className="appearance-none bg-dark-100 border border-dark-200 text-white rounded-lg px-4 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer hover:bg-dark-200 transition-colors"
              >
                {challenges.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.model_name} - ${c.account_size?.toLocaleString()}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          )}
        </div>
      </div>

      {/* Hotkey Info Banner */}
      <div className="bg-blue-500/10 backdrop-blur-xl rounded-xl border border-blue-500/30 p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-blue-500/20 mt-0.5">
          <Keyboard className="text-blue-400" size={18} />
        </div>
        <div>
          <h4 className="font-medium text-white mb-1">Hotkeys</h4>
          <p className="text-sm text-gray-300">
            Press <span className="px-2 py-0.5 bg-dark-200 rounded text-white font-mono text-xs mx-1">B</span> to Buy,
            <span className="px-2 py-0.5 bg-dark-200 rounded text-white font-mono text-xs mx-1">S</span> to Sell,
            <span className="px-2 py-0.5 bg-dark-200 rounded text-white font-mono text-xs mx-1">X</span> to Close All.
            Enable One-Click Trading to activate hotkeys.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* One-Click Panel */}
        <div className="lg:col-span-2">
          <OneClickPanel
            symbol={selectedSymbol}
            currentPrice={currentPrice}
            challengeId={selectedChallenge}
          />
        </div>

        {/* Stats & History */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="text-purple-400" size={20} />
              </div>
              <p className="text-2xl font-bold text-white">{stats.total_orders}</p>
              <p className="text-xs text-gray-400">Total Orders</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-green-400" size={20} />
              </div>
              <p className="text-2xl font-bold text-white">{formatTime(stats.avg_execution_time)}</p>
              <p className="text-xs text-gray-400">Avg Execution</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-xl rounded-xl p-4 border border-pink-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-pink-400" size={20} />
              </div>
              <p className="text-2xl font-bold text-white">{stats.win_rate}%</p>
              <p className="text-xs text-gray-400">Win Rate</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-blue-400" size={20} />
              </div>
              <p className="text-2xl font-bold text-white">{stats.today_orders}</p>
              <p className="text-xs text-gray-400">Today's Orders</p>
            </div>
          </div>

          {/* Execution History */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-dark-200 flex items-center justify-between">
              <h3 className="font-semibold text-white">Recent Executions</h3>
              <button
                onClick={loadExecutionHistory}
                className="p-2 rounded-lg bg-dark-200/50 hover:bg-dark-200 text-gray-400 hover:text-white transition-all"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : executionHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-200/50">
                    <tr className="text-xs text-gray-500 uppercase">
                      <th className="px-4 py-3 text-left font-medium">Time</th>
                      <th className="px-4 py-3 text-left font-medium">Symbol</th>
                      <th className="px-4 py-3 text-left font-medium">Side</th>
                      <th className="px-4 py-3 text-right font-medium">Lot Size</th>
                      <th className="px-4 py-3 text-right font-medium">Price</th>
                      <th className="px-4 py-3 text-right font-medium">Execution</th>
                      <th className="px-4 py-3 text-left font-medium">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-200">
                    {executionHistory.map((order, index) => (
                      <tr key={index} className="hover:bg-dark-200/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {order.symbol}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            order.side === 'buy'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {order.side === 'buy' ? (
                              <TrendingUp size={12} />
                            ) : (
                              <TrendingDown size={12} />
                            )}
                            {order.side?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-300">
                          {order.lot_size}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-300">
                          {parseFloat(order.entry_price).toFixed(5)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.execution_time_ms < 100
                              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                              : 'bg-dark-200 text-gray-400 border border-dark-200'
                          }`}>
                            {formatTime(order.execution_time_ms)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {order.executed_via === 'hotkey' ? '⌨️ Hotkey' : '🖱️ Click'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Zap className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-gray-400">No execution history yet. Start trading with one-click!</p>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-5">
            <h3 className="font-semibold text-primary-400 mb-3 flex items-center gap-2">
              <BarChart3 size={18} />
              Pro Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-400 flex items-start gap-2">
                  <span className="text-primary-500">•</span>
                  Enable one-click trading for instant order execution
                </p>
                <p className="text-sm text-gray-400 flex items-start gap-2">
                  <span className="text-primary-500">•</span>
                  Configure default SL/TP in settings to auto-apply risk management
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400 flex items-start gap-2">
                  <span className="text-primary-500">•</span>
                  Use hotkeys for fastest execution during volatile markets
                </p>
                <p className="text-sm text-gray-400 flex items-start gap-2">
                  <span className="text-primary-500">•</span>
                  Quick lot buttons let you switch position sizes instantly
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickTradingPage
