import { useState } from 'react'
import {
  Activity, TrendingUp, BarChart2, Waves, Target,
  Settings, X, Plus, Search, Star, Clock, ChevronRight
} from 'lucide-react'

const indicatorCategories = [
  { id: 'popular', label: 'Popular', icon: Star },
  { id: 'trend', label: 'Trend', icon: TrendingUp },
  { id: 'momentum', label: 'Momentum', icon: Activity },
  { id: 'volatility', label: 'Volatility', icon: Waves },
  { id: 'volume', label: 'Volume', icon: BarChart2 },
  { id: 'custom', label: 'My Indicators', icon: Target },
]

const indicators = [
  // Popular
  { id: 'sma', name: 'SMA', fullName: 'Simple Moving Average', category: 'popular', params: [{ name: 'Period', default: 20 }] },
  { id: 'ema', name: 'EMA', fullName: 'Exponential Moving Average', category: 'popular', params: [{ name: 'Period', default: 20 }] },
  { id: 'rsi', name: 'RSI', fullName: 'Relative Strength Index', category: 'popular', params: [{ name: 'Period', default: 14 }] },
  { id: 'macd', name: 'MACD', fullName: 'Moving Average Convergence Divergence', category: 'popular', params: [{ name: 'Fast', default: 12 }, { name: 'Slow', default: 26 }, { name: 'Signal', default: 9 }] },
  { id: 'bb', name: 'BB', fullName: 'Bollinger Bands', category: 'popular', params: [{ name: 'Period', default: 20 }, { name: 'StdDev', default: 2 }] },

  // Trend
  { id: 'sma', name: 'SMA', fullName: 'Simple Moving Average', category: 'trend', params: [{ name: 'Period', default: 20 }] },
  { id: 'ema', name: 'EMA', fullName: 'Exponential Moving Average', category: 'trend', params: [{ name: 'Period', default: 20 }] },
  { id: 'wma', name: 'WMA', fullName: 'Weighted Moving Average', category: 'trend', params: [{ name: 'Period', default: 20 }] },
  { id: 'dema', name: 'DEMA', fullName: 'Double EMA', category: 'trend', params: [{ name: 'Period', default: 20 }] },
  { id: 'tema', name: 'TEMA', fullName: 'Triple EMA', category: 'trend', params: [{ name: 'Period', default: 20 }] },
  { id: 'ichimoku', name: 'Ichimoku', fullName: 'Ichimoku Cloud', category: 'trend', params: [{ name: 'Conversion', default: 9 }, { name: 'Base', default: 26 }, { name: 'Span', default: 52 }] },
  { id: 'psar', name: 'PSAR', fullName: 'Parabolic SAR', category: 'trend', params: [{ name: 'Step', default: 0.02 }, { name: 'Max', default: 0.2 }] },
  { id: 'supertrend', name: 'SuperTrend', fullName: 'SuperTrend', category: 'trend', params: [{ name: 'Period', default: 10 }, { name: 'Multiplier', default: 3 }] },

  // Momentum
  { id: 'rsi', name: 'RSI', fullName: 'Relative Strength Index', category: 'momentum', params: [{ name: 'Period', default: 14 }] },
  { id: 'stoch', name: 'Stoch', fullName: 'Stochastic Oscillator', category: 'momentum', params: [{ name: 'K', default: 14 }, { name: 'D', default: 3 }, { name: 'Smooth', default: 3 }] },
  { id: 'macd', name: 'MACD', fullName: 'MACD', category: 'momentum', params: [{ name: 'Fast', default: 12 }, { name: 'Slow', default: 26 }, { name: 'Signal', default: 9 }] },
  { id: 'cci', name: 'CCI', fullName: 'Commodity Channel Index', category: 'momentum', params: [{ name: 'Period', default: 20 }] },
  { id: 'mom', name: 'MOM', fullName: 'Momentum', category: 'momentum', params: [{ name: 'Period', default: 10 }] },
  { id: 'roc', name: 'ROC', fullName: 'Rate of Change', category: 'momentum', params: [{ name: 'Period', default: 9 }] },
  { id: 'williams', name: 'Williams %R', fullName: 'Williams %R', category: 'momentum', params: [{ name: 'Period', default: 14 }] },
  { id: 'ao', name: 'AO', fullName: 'Awesome Oscillator', category: 'momentum', params: [] },

  // Volatility
  { id: 'bb', name: 'BB', fullName: 'Bollinger Bands', category: 'volatility', params: [{ name: 'Period', default: 20 }, { name: 'StdDev', default: 2 }] },
  { id: 'atr', name: 'ATR', fullName: 'Average True Range', category: 'volatility', params: [{ name: 'Period', default: 14 }] },
  { id: 'kc', name: 'KC', fullName: 'Keltner Channel', category: 'volatility', params: [{ name: 'Period', default: 20 }, { name: 'ATR', default: 10 }, { name: 'Mult', default: 2 }] },
  { id: 'dc', name: 'DC', fullName: 'Donchian Channel', category: 'volatility', params: [{ name: 'Period', default: 20 }] },
  { id: 'stddev', name: 'StdDev', fullName: 'Standard Deviation', category: 'volatility', params: [{ name: 'Period', default: 20 }] },

  // Volume
  { id: 'vol', name: 'Volume', fullName: 'Volume', category: 'volume', params: [] },
  { id: 'obv', name: 'OBV', fullName: 'On Balance Volume', category: 'volume', params: [] },
  { id: 'vwap', name: 'VWAP', fullName: 'Volume Weighted Average Price', category: 'volume', params: [] },
  { id: 'mfi', name: 'MFI', fullName: 'Money Flow Index', category: 'volume', params: [{ name: 'Period', default: 14 }] },
  { id: 'adl', name: 'ADL', fullName: 'Accumulation/Distribution', category: 'volume', params: [] },
  { id: 'cmf', name: 'CMF', fullName: 'Chaikin Money Flow', category: 'volume', params: [{ name: 'Period', default: 20 }] },
]

const IndicatorsPanel = ({
  activeIndicators = [],
  onAddIndicator,
  onRemoveIndicator,
  onUpdateIndicator,
  isOpen = false,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('popular')
  const [configureIndicator, setConfigureIndicator] = useState(null)
  const [indicatorParams, setIndicatorParams] = useState({})

  const filteredIndicators = indicators.filter(ind => {
    const matchesSearch = ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ind.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = searchQuery ? true : ind.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddIndicator = (indicator) => {
    const params = {}
    indicator.params.forEach(p => {
      params[p.name.toLowerCase()] = p.default
    })

    if (indicator.params.length > 0) {
      setConfigureIndicator(indicator)
      setIndicatorParams(params)
    } else {
      onAddIndicator?.({
        ...indicator,
        instanceId: `${indicator.id}_${Date.now()}`,
        params: {},
        color: getRandomColor()
      })
    }
  }

  const handleConfirmAdd = () => {
    if (configureIndicator) {
      onAddIndicator?.({
        ...configureIndicator,
        instanceId: `${configureIndicator.id}_${Date.now()}`,
        params: indicatorParams,
        color: getRandomColor()
      })
      setConfigureIndicator(null)
      setIndicatorParams({})
    }
  }

  const getRandomColor = () => {
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">Indicators</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search indicators..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Categories sidebar */}
          <div className="w-48 border-r border-slate-700 py-2 overflow-y-auto">
            {indicatorCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id)
                  setSearchQuery('')
                }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Indicators list */}
          <div className="flex-1 overflow-y-auto p-4">
            {configureIndicator ? (
              /* Configure indicator */
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfigureIndicator(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ← Back
                  </button>
                  <h4 className="font-medium text-white">{configureIndicator.fullName}</h4>
                </div>

                <div className="space-y-3">
                  {configureIndicator.params.map((param) => (
                    <div key={param.name}>
                      <label className="block text-sm text-slate-400 mb-1">{param.name}</label>
                      <input
                        type="number"
                        value={indicatorParams[param.name.toLowerCase()] || param.default}
                        onChange={(e) => setIndicatorParams(prev => ({
                          ...prev,
                          [param.name.toLowerCase()]: Number(e.target.value)
                        }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleConfirmAdd}
                  className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors"
                >
                  Add Indicator
                </button>
              </div>
            ) : (
              /* Indicator list */
              <div className="grid grid-cols-2 gap-2">
                {filteredIndicators.map((ind, i) => {
                  const isActive = activeIndicators.some(a => a.id === ind.id)

                  return (
                    <button
                      key={`${ind.id}-${i}`}
                      onClick={() => handleAddIndicator(ind)}
                      className={`flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-cyan-500/20 border border-cyan-500/50'
                          : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-white">{ind.name}</div>
                        <div className="text-xs text-slate-400">{ind.fullName}</div>
                      </div>
                      <Plus className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Active indicators */}
        {activeIndicators.length > 0 && (
          <div className="border-t border-slate-700 p-4">
            <div className="text-sm text-slate-400 mb-2">Active Indicators ({activeIndicators.length})</div>
            <div className="flex flex-wrap gap-2">
              {activeIndicators.map((ind) => (
                <div
                  key={ind.instanceId}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 rounded-full"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ind.color }}
                  />
                  <span className="text-sm text-white">{ind.name}</span>
                  <button
                    onClick={() => onRemoveIndicator?.(ind.instanceId)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IndicatorsPanel
