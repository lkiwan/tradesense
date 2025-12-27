import { Trophy, Users, Clock, Award, TrendingUp, Star } from 'lucide-react'

const CompetitionsPage = () => {
  const competitions = [
    { id: 1, name: 'Challenge Janvier', participants: 156, prize: 5000, endDate: '31 Jan 2024', status: 'active', yourRank: 12 },
    { id: 2, name: 'Top Trader Mensuel', participants: 89, prize: 2500, endDate: '15 Feb 2024', status: 'upcoming', yourRank: null },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30">
            <Trophy className="text-yellow-400" size={24} />
          </div>
          Competitions
        </h1>
        <p className="text-gray-400 mt-1">Participez aux competitions et gagnez des prix</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-yellow-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Trophy size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Competitions Actives</p>
              <p className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">2</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-green-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Star size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Meilleur Classement</p>
              <p className="text-xl font-bold text-green-400">#12</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-primary-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <Award size={20} className="text-primary-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Prix Total</p>
              <p className="text-xl font-bold text-primary-400">$7,500</p>
            </div>
          </div>
        </div>
      </div>

      {/* Competitions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {competitions.map(comp => (
          <div key={comp.id} className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden hover:border-yellow-500/30 transition-all duration-300 group">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  comp.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                }`}>
                  {comp.status === 'active' ? 'En cours' : 'A venir'}
                </span>
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <Clock size={14} />
                  {comp.endDate}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">{comp.name}</h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-dark-200/50 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Users size={14} />
                    Participants
                  </div>
                  <p className="text-lg font-bold text-white">{comp.participants}</p>
                </div>
                <div className="bg-dark-200/50 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Award size={14} />
                    Prix
                  </div>
                  <p className="text-lg font-bold text-yellow-400">${comp.prize.toLocaleString()}</p>
                </div>
              </div>
              {comp.yourRank && (
                <div className="mt-4 bg-gradient-to-r from-primary-500/10 to-green-500/10 rounded-xl p-3 flex items-center justify-between border border-primary-500/20">
                  <span className="text-gray-400">Votre classement</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-400" />
                    <span className="text-xl font-bold text-white">#{comp.yourRank}</span>
                  </div>
                </div>
              )}
            </div>
            <button className="w-full py-3.5 bg-dark-200/50 text-white font-medium hover:bg-yellow-500/10 hover:text-yellow-400 transition-all duration-300 border-t border-white/5">
              {comp.status === 'active' ? 'Voir le classement' : 'S\'inscrire'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CompetitionsPage
