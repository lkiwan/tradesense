import { Coins, Gift, Star, TrendingUp, ArrowRight, Clock, Sparkles } from 'lucide-react'

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30">
            <Coins className="text-yellow-400" size={24} />
          </div>
          Points Fidelite
        </h1>
        <p className="text-gray-400 mt-1">Accumulez des points et echangez-les contre des recompenses</p>
      </div>

      {/* Points Balance */}
      <div className="bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-yellow-500/20 backdrop-blur-xl rounded-2xl p-6 border border-primary-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-gray-400 mb-1">Vos Points</p>
            <p className="text-4xl font-bold text-white">1,250</p>
            <p className="text-sm text-green-400 mt-2 flex items-center gap-1">
              <TrendingUp size={14} />
              +150 ce mois
            </p>
          </div>
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/40 flex items-center justify-center shadow-xl shadow-yellow-500/20">
            <Star className="text-yellow-400" size={48} />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-yellow-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Coins size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total Gagne</p>
              <p className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">2,450</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-primary-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <Gift size={20} className="text-primary-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total Utilise</p>
              <p className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">1,200</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-green-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Sparkles size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Niveau</p>
              <p className="text-xl font-bold text-green-400">Gold</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rewards */}
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary-500/10">
              <Gift size={18} className="text-primary-400" />
            </div>
            Recompenses Disponibles
          </h3>
          <div className="space-y-3">
            {rewards.map(reward => (
              <div key={reward.id} className="flex items-center justify-between p-4 bg-dark-200/50 rounded-xl border border-white/5 hover:border-primary-500/30 transition-all duration-300 group">
                <div>
                  <p className="font-medium text-white group-hover:text-primary-400 transition-colors">{reward.name}</p>
                  <p className="text-sm text-yellow-400 flex items-center gap-1 mt-0.5">
                    <Coins size={12} />
                    {reward.points} points
                  </p>
                </div>
                <button
                  disabled={!reward.available}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    reward.available
                      ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25 hover:scale-105'
                      : 'bg-dark-300/50 text-gray-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  Echanger
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <Clock size={18} className="text-blue-400" />
            </div>
            Historique
          </h3>
          <div className="space-y-3">
            {history.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-dark-200/50 rounded-xl border border-white/5 hover:border-green-500/30 transition-all duration-300 group">
                <div>
                  <p className="font-medium text-white group-hover:text-green-400 transition-colors">{item.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
                </div>
                <span className="text-green-400 font-bold text-lg">+{item.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PointsPage
