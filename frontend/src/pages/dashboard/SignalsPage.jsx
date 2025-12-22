import { useState } from 'react'
import { Brain, Zap, TrendingUp, TrendingDown, Clock, Target, AlertCircle, CheckCircle, XCircle, Filter } from 'lucide-react'
import SignalsPanel from '../../components/SignalsPanel'

const SYMBOLS = ['AAPL', 'TSLA', 'GOOGL', 'NVDA', 'MSFT', 'AMZN', 'META', 'BTC-USD', 'ETH-USD', 'SOL-USD', 'IAM', 'ATW']

const SignalsPage = () => {
  const [filter, setFilter] = useState('all')
  const [timeframe, setTimeframe] = useState('1h')

  const mockSignals = [
    { id: 1, symbol: 'AAPL', type: 'buy', confidence: 89, price: 178.50, target: 185.00, stopLoss: 175.00, time: '10 min ago', status: 'active' },
    { id: 2, symbol: 'BTC-USD', type: 'sell', confidence: 76, price: 43250, target: 41500, stopLoss: 44000, time: '25 min ago', status: 'active' },
    { id: 3, symbol: 'TSLA', type: 'buy', confidence: 92, price: 248.30, target: 265.00, stopLoss: 240.00, time: '45 min ago', status: 'hit_target' },
    { id: 4, symbol: 'ETH-USD', type: 'buy', confidence: 81, price: 2280, target: 2450, stopLoss: 2200, time: '1h ago', status: 'active' },
    { id: 5, symbol: 'NVDA', type: 'sell', confidence: 67, price: 485.20, target: 460.00, stopLoss: 500.00, time: '2h ago', status: 'stopped' },
  ]

  const filteredSignals = mockSignals.filter(signal => {
    if (filter === 'all') return true
    if (filter === 'buy') return signal.type === 'buy'
    if (filter === 'sell') return signal.type === 'sell'
    if (filter === 'active') return signal.status === 'active'
    return true
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Clock size={14} className="text-blue-400" />
      case 'hit_target': return <CheckCircle size={14} className="text-green-400" />
      case 'stopped': return <XCircle size={14} className="text-red-400" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <Brain className="text-primary-400" size={24} />
            </div>
            Signaux IA
          </h1>
          <p className="text-gray-400 mt-1">Signaux de trading generes par notre intelligence artificielle</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-dark-100 rounded-lg border border-dark-200">
            <Zap size={16} className="text-green-400" />
            <span className="text-sm text-gray-400">IA Active</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Signaux Aujourd'hui</p>
          <p className="text-2xl font-bold text-white">24</p>
          <p className="text-xs text-green-400 mt-1">+8 depuis hier</p>
        </div>
        <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Taux de Reussite</p>
          <p className="text-2xl font-bold text-green-400">78%</p>
          <p className="text-xs text-gray-500 mt-1">Sur les 30 derniers jours</p>
        </div>
        <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Meilleur Signal</p>
          <p className="text-2xl font-bold text-white">+12.5%</p>
          <p className="text-xs text-gray-500 mt-1">TSLA il y a 3 jours</p>
        </div>
        <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Confiance Moyenne</p>
          <p className="text-2xl font-bold text-primary-400">82%</p>
          <p className="text-xs text-gray-500 mt-1">Score IA moyen</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm text-gray-400">Filtrer:</span>
        </div>
        {['all', 'buy', 'sell', 'active'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? 'bg-primary-500 text-white'
                : 'bg-dark-100 text-gray-400 hover:text-white border border-dark-200'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'buy' ? 'Achat' : f === 'sell' ? 'Vente' : 'Actifs'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-400">Timeframe:</span>
          {['15m', '1h', '4h', '1d'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                timeframe === tf
                  ? 'bg-dark-200 text-white'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Signals List */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
        <div className="p-4 border-b border-dark-200">
          <h3 className="font-semibold text-white">Signaux Recents</h3>
        </div>
        <div className="divide-y divide-dark-200">
          {filteredSignals.map(signal => (
            <div key={signal.id} className="p-4 hover:bg-dark-200/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    signal.type === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    {signal.type === 'buy' ? (
                      <TrendingUp className="text-green-400" size={24} />
                    ) : (
                      <TrendingDown className="text-red-400" size={24} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{signal.symbol}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        signal.type === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {signal.type === 'buy' ? 'ACHAT' : 'VENTE'}
                      </span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(signal.status)}
                        <span className="text-xs text-gray-500">{signal.status === 'active' ? 'Actif' : signal.status === 'hit_target' ? 'Objectif atteint' : 'Stoppe'}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Entree: ${signal.price.toLocaleString()} | Objectif: ${signal.target.toLocaleString()} | Stop: ${signal.stopLoss.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Brain size={14} className="text-primary-400" />
                    <span className={`font-bold ${
                      signal.confidence >= 80 ? 'text-green-400' : signal.confidence >= 60 ? 'text-yellow-400' : 'text-gray-400'
                    }`}>
                      {signal.confidence}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{signal.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Signals Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SignalsPanel symbols={SYMBOLS.slice(0, 6)} />
        <SignalsPanel symbols={SYMBOLS.slice(6)} />
      </div>
    </div>
  )
}

export default SignalsPage
