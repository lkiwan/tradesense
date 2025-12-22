import { useState } from 'react'
import { Calculator, DollarSign, Percent, TrendingUp, AlertTriangle, Info } from 'lucide-react'

const CalculatorPage = () => {
  const [accountSize, setAccountSize] = useState(10000)
  const [riskPercent, setRiskPercent] = useState(1)
  const [entryPrice, setEntryPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')

  const riskAmount = accountSize * (riskPercent / 100)
  const stopLossDistance = entryPrice && stopLoss ? Math.abs(parseFloat(entryPrice) - parseFloat(stopLoss)) : 0
  const positionSize = stopLossDistance > 0 ? riskAmount / stopLossDistance : 0
  const takeProfitDistance = entryPrice && takeProfit ? Math.abs(parseFloat(takeProfit) - parseFloat(entryPrice)) : 0
  const riskRewardRatio = stopLossDistance > 0 && takeProfitDistance > 0 ? takeProfitDistance / stopLossDistance : 0
  const potentialProfit = positionSize * takeProfitDistance
  const potentialLoss = riskAmount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Calculator className="text-blue-400" size={24} />
          </div>
          Calculateur de Position
        </h1>
        <p className="text-gray-400 mt-1">Calculez la taille optimale de vos positions en fonction de votre gestion du risque</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="font-semibold text-white mb-4">Parametres du Compte</h3>

            {/* Account Size */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Taille du Compte</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="number"
                  value={accountSize}
                  onChange={(e) => setAccountSize(parseFloat(e.target.value) || 0)}
                  className="w-full bg-dark-200 border border-dark-200 rounded-lg px-10 py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Risk Percent */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Risque par Trade (%)</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="number"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                  step="0.5"
                  min="0.1"
                  max="10"
                  className="w-full bg-dark-200 border border-dark-200 rounded-lg px-10 py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[0.5, 1, 2, 3].map(r => (
                  <button
                    key={r}
                    onClick={() => setRiskPercent(r)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      riskPercent === r ? 'bg-primary-500 text-white' : 'bg-dark-200 text-gray-400 hover:text-white'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="font-semibold text-white mb-4">Parametres du Trade</h3>

            {/* Entry Price */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Prix d'Entree</label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
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
                className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
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
                className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="font-semibold text-white mb-4">Resultats</h3>

            <div className="space-y-4">
              {/* Position Size */}
              <div className="bg-dark-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Taille de Position</span>
                  <TrendingUp size={18} className="text-primary-400" />
                </div>
                <p className="text-3xl font-bold text-white">{positionSize.toFixed(4)}</p>
                <p className="text-sm text-gray-500 mt-1">unites</p>
              </div>

              {/* Risk Amount */}
              <div className="bg-dark-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Montant a Risque</span>
                  <AlertTriangle size={18} className="text-red-400" />
                </div>
                <p className="text-2xl font-bold text-red-400">${riskAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">{riskPercent}% du compte</p>
              </div>

              {/* Risk/Reward */}
              <div className="bg-dark-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Ratio Risque/Rendement</span>
                  <Info size={18} className="text-blue-400" />
                </div>
                <p className={`text-2xl font-bold ${riskRewardRatio >= 2 ? 'text-green-400' : riskRewardRatio >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                  1:{riskRewardRatio.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {riskRewardRatio >= 2 ? 'Excellent' : riskRewardRatio >= 1 ? 'Acceptable' : 'Non recommande'}
                </p>
              </div>

              {/* Potential Outcomes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                  <p className="text-xs text-green-400 uppercase tracking-wider mb-1">Profit Potentiel</p>
                  <p className="text-xl font-bold text-green-400">+${potentialProfit.toFixed(2)}</p>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                  <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Perte Potentielle</p>
                  <p className="text-xl font-bold text-red-400">-${potentialLoss.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-primary-500/10 rounded-xl border border-primary-500/20 p-4">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-primary-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white mb-1">Conseil de Gestion du Risque</h4>
                <p className="text-sm text-gray-400">
                  Ne risquez jamais plus de 1-2% de votre capital par trade. Un ratio risque/rendement de 1:2 ou plus est recommande pour une strategie profitable a long terme.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalculatorPage
