import { Coins, Gift, Star, TrendingUp, ArrowRight } from 'lucide-react'

const PointsPage = () => {
  const rewards = [
    { id: 1, name: '10% Reduction', points: 500, available: true },
    { id: 2, name: 'Challenge Gratuit', points: 2500, available: false },
    { id: 3, name: '1 Mois VIP', points: 1000, available: true },
  ]

  const history = [
    { id: 1, action: 'Trade complete', points: 10, date: '22 Jan 2024' },
    { id: 2, action: 'Challenge reussi', points: 500, date: '20 Jan 2024' },
    { id: 3, action: 'Parrainage', points: 200, date: '18 Jan 2024' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Coins className="text-yellow-400" size={24} />
          </div>
          Points Fidelite
        </h1>
        <p className="text-gray-400 mt-1">Accumulez des points et echangez-les contre des recompenses</p>
      </div>

      {/* Points Balance */}
      <div className="bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-xl p-6 border border-primary-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 mb-1">Vos Points</p>
            <p className="text-4xl font-bold text-white">1,250</p>
            <p className="text-sm text-green-400 mt-2 flex items-center gap-1">
              <TrendingUp size={14} />
              +150 ce mois
            </p>
          </div>
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Star className="text-yellow-400" size={40} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rewards */}
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Gift size={18} className="text-primary-400" />
            Recompenses Disponibles
          </h3>
          <div className="space-y-3">
            {rewards.map(reward => (
              <div key={reward.id} className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
                <div>
                  <p className="font-medium text-white">{reward.name}</p>
                  <p className="text-sm text-yellow-400">{reward.points} points</p>
                </div>
                <button
                  disabled={!reward.available}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reward.available
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-dark-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Echanger
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <h3 className="font-semibold text-white mb-4">Historique</h3>
          <div className="space-y-3">
            {history.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
                <div>
                  <p className="font-medium text-white">{item.action}</p>
                  <p className="text-xs text-gray-400">{item.date}</p>
                </div>
                <span className="text-green-400 font-bold">+{item.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PointsPage
