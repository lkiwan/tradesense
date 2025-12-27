import { useState } from 'react'
import { Calculator, DollarSign, Percent, TrendingUp, AlertTriangle, Info, Ruler } from 'lucide-react'

const MarginCalculatorPage = () => {
  const [accountSize, setAccountSize] = useState(10000)
  const [riskPercent, setRiskPercent] = useState(1)
  const [entryPrice, setEntryPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [leverage, setLeverage] = useState(30)

  const riskAmount = accountSize * (riskPercent / 100)
  const stopLossDistance = entryPrice && stopLoss ? Math.abs(parseFloat(entryPrice) - parseFloat(stopLoss)) : 0
  const positionSize = stopLossDistance > 0 ? riskAmount / stopLossDistance : 0
  const takeProfitDistance = entryPrice && takeProfit ? Math.abs(parseFloat(takeProfit) - parseFloat(entryPrice)) : 0
  const riskRewardRatio = stopLossDistance > 0 && takeProfitDistance > 0 ? takeProfitDistance / stopLossDistance : 0
  const potentialProfit = positionSize * takeProfitDistance
  const potentialLoss = riskAmount
  const marginRequired = entryPrice && positionSize ? (positionSize * parseFloat(entryPrice)) / leverage : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
            <Calculator className="text-blue-400" size={24} />
          </div>
          Margin Calculator
        </h1>
        <p className="text-gray-400 mt-1">Calculate optimal position sizes based on your risk management strategy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-500/10">
                <DollarSign size={18} className="text-primary-400" />
              </div>
              Account Parameters
            </h3>

            {/* Account Size */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Account Size</label>
              <div className="relative group">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="number"
                  value={accountSize}
                  onChange={(e) => setAccountSize(parseFloat(e.target.value) || 0)}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-10 py-3 text-white focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Leverage */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Leverage</label>
              <div className="relative group">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <select
                  value={leverage}
                  onChange={(e) => setLeverage(parseInt(e.target.value))}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-10 py-3 text-white focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none appearance-none cursor-pointer transition-all duration-300"
                >
                  <option value={10} className="bg-dark-300">1:10</option>
                  <option value={20} className="bg-dark-300">1:20</option>
                  <option value={30} className="bg-dark-300">1:30</option>
                  <option value={50} className="bg-dark-300">1:50</option>
                  <option value={100} className="bg-dark-300">1:100</option>
                </select>
              </div>
            </div>

            {/* Risk Percent */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Risk per Trade (%)</label>
              <div className="relative group">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="number"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                  step="0.5"
                  min="0.1"
                  max="10"
                  className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-10 py-3 text-white focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all duration-300"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[0.5, 1, 2, 3].map(r => (
                  <button
                    key={r}
                    onClick={() => setRiskPercent(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                      riskPercent === r ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'bg-dark-200/50 text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <TrendingUp size={18} className="text-blue-400" />
              </div>
              Trade Parameters
            </h3>

            {/* Entry Price */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Entry Price</label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all duration-300"
              />
            </div>

            {/* Stop Loss */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Stop Loss</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="0.00"
                className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 outline-none transition-all duration-300"
              />
            </div>

            {/* Take Profit */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Take Profit</label>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="0.00"
                className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 outline-none transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-500/10">
                <Calculator size={18} className="text-green-400" />
              </div>
              Results
            </h3>

            <div className="space-y-4">
              {/* Position Size */}
              <div className="bg-dark-200/50 rounded-xl p-4 border border-white/5 hover:border-primary-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Position Size</span>
                  <div className="p-1.5 rounded-lg bg-primary-500/10">
                    <TrendingUp size={16} className="text-primary-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white group-hover:text-primary-400 transition-colors">{positionSize.toFixed(4)}</p>
                <p className="text-sm text-gray-500 mt-1">units</p>
              </div>

              {/* Margin Required */}
              <div className="bg-dark-200/50 rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Margin Required</span>
                  <div className="p-1.5 rounded-lg bg-blue-500/10">
                    <DollarSign size={16} className="text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-400">${marginRequired.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">at 1:{leverage} leverage</p>
              </div>

              {/* Risk Amount */}
              <div className="bg-dark-200/50 rounded-xl p-4 border border-white/5 hover:border-red-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Risk Amount</span>
                  <div className="p-1.5 rounded-lg bg-red-500/10">
                    <AlertTriangle size={16} className="text-red-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-400">${riskAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">{riskPercent}% of account</p>
              </div>

              {/* Risk/Reward */}
              <div className="bg-dark-200/50 rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Risk/Reward Ratio</span>
                  <div className="p-1.5 rounded-lg bg-blue-500/10">
                    <Info size={16} className="text-blue-400" />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${riskRewardRatio >= 2 ? 'text-green-400' : riskRewardRatio >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                  1:{riskRewardRatio.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {riskRewardRatio >= 2 ? 'Excellent' : riskRewardRatio >= 1 ? 'Acceptable' : 'Not Recommended'}
                </p>
              </div>

              {/* Potential Outcomes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30 hover:border-green-500/50 transition-all duration-300">
                  <p className="text-xs text-green-400 uppercase tracking-wider mb-1">Potential Profit</p>
                  <p className="text-xl font-bold text-green-400">+${potentialProfit.toFixed(2)}</p>
                </div>
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30 hover:border-red-500/50 transition-all duration-300">
                  <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Potential Loss</p>
                  <p className="text-xl font-bold text-red-400">-${potentialLoss.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-primary-500/10 backdrop-blur-xl rounded-xl border border-primary-500/30 p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-primary-500/20">
                <Info size={18} className="text-primary-400" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Risk Management Tip</h4>
                <p className="text-sm text-gray-400">
                  Never risk more than 1-2% of your capital per trade. A risk/reward ratio of 1:2 or higher is recommended for a profitable long-term strategy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarginCalculatorPage
