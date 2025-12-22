import { Trophy, Users, Clock, Award, TrendingUp } from 'lucide-react'

const CompetitionsPage = () => {
  const competitions = [
    { id: 1, name: 'Challenge Janvier', participants: 156, prize: 5000, endDate: '31 Jan 2024', status: 'active', yourRank: 12 },
    { id: 2, name: 'Top Trader Mensuel', participants: 89, prize: 2500, endDate: '15 Feb 2024', status: 'upcoming', yourRank: null },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Trophy className="text-yellow-400" size={24} />
          </div>
          Competitions
        </h1>
        <p className="text-gray-400 mt-1">Participez aux competitions et gagnez des prix</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {competitions.map(comp => (
          <div key={comp.id} className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  comp.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {comp.status === 'active' ? 'En cours' : 'A venir'}
                </span>
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <Clock size={14} />
                  {comp.endDate}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{comp.name}</h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-dark-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Users size={14} />
                    Participants
                  </div>
                  <p className="text-lg font-bold text-white">{comp.participants}</p>
                </div>
                <div className="bg-dark-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Award size={14} />
                    Prix
                  </div>
                  <p className="text-lg font-bold text-yellow-400">${comp.prize.toLocaleString()}</p>
                </div>
              </div>
              {comp.yourRank && (
                <div className="mt-4 bg-primary-500/10 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-gray-400">Votre classement</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-400" />
                    <span className="text-xl font-bold text-white">#{comp.yourRank}</span>
                  </div>
                </div>
              )}
            </div>
            <button className="w-full py-3 bg-dark-200 text-white font-medium hover:bg-dark-300 transition-colors">
              {comp.status === 'active' ? 'Voir le classement' : 'S\'inscrire'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CompetitionsPage
