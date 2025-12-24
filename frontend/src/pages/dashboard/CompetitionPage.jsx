import { useState } from 'react'
import { Trophy, Medal, Users, Clock, DollarSign, TrendingUp, Star, Crown, Award } from 'lucide-react'

const CompetitionPage = () => {
  const [activeTab, setActiveTab] = useState('active')

  const competitions = [
    {
      id: 1,
      title: 'Monthly Trading Challenge',
      description: 'Compete with other traders for the highest profit percentage',
      prize: 5000,
      participants: 234,
      maxParticipants: 500,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      status: 'active',
      myRank: 15,
      myProfit: 8.5
    },
    {
      id: 2,
      title: 'Weekly Sprint',
      description: 'One week, maximum returns. Show your trading skills!',
      prize: 1000,
      participants: 89,
      maxParticipants: 200,
      startDate: '2024-01-08',
      endDate: '2024-01-14',
      status: 'active',
      myRank: 5,
      myProfit: 12.3
    }
  ]

  const leaderboard = [
    { rank: 1, username: 'TraderKing', profit: 24.5, avatar: 'T' },
    { rank: 2, username: 'ForexMaster', profit: 21.2, avatar: 'F' },
    { rank: 3, username: 'CryptoWhale', profit: 18.9, avatar: 'C' },
    { rank: 4, username: 'StockPro', profit: 15.7, avatar: 'S' },
    { rank: 5, username: 'AlphaTrader', profit: 14.2, avatar: 'A' }
  ]

  const getRankBadge = (rank) => {
    if (rank === 1) return <Crown className="text-yellow-400" size={20} />
    if (rank === 2) return <Medal className="text-gray-300" size={20} />
    if (rank === 3) return <Medal className="text-amber-600" size={20} />
    return <span className="text-gray-400 font-bold">#{rank}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30">
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="text-yellow-400" size={32} />
          <h1 className="text-2xl font-bold text-white">Trading Competitions</h1>
        </div>
        <p className="text-gray-300">
          Compete with other traders and win amazing prizes. Show off your trading skills!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['active', 'upcoming', 'completed'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-primary-500 text-white'
                : 'bg-dark-100 text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Competitions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {competitions.map(comp => (
          <div key={comp.id} className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
            {/* Competition Header */}
            <div className="p-5 border-b border-dark-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white text-lg">{comp.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{comp.description}</p>
                </div>
                <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-400">Prize Pool</p>
                  <p className="text-xl font-bold text-yellow-400">${comp.prize.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Participants</p>
                  <p className="text-xl font-bold text-white">{comp.participants}/{comp.maxParticipants}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Your Rank</p>
                  <p className="text-xl font-bold text-primary-400">#{comp.myRank}</p>
                </div>
              </div>
            </div>

            {/* Your Stats */}
            <div className="p-5 bg-dark-200/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-primary-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Your Profit</p>
                    <p className="text-lg font-bold text-green-500">+{comp.myProfit}%</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="bg-dark-100 rounded-xl border border-dark-200">
        <div className="p-5 border-b border-dark-200 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Award className="text-yellow-400" size={20} />
            Top Traders
          </h3>
          <span className="text-sm text-gray-400">Monthly Trading Challenge</span>
        </div>
        <div className="divide-y divide-dark-200">
          {leaderboard.map(trader => (
            <div key={trader.rank} className={`p-4 flex items-center gap-4 ${
              trader.rank <= 3 ? 'bg-dark-200/30' : ''
            }`}>
              <div className="w-8 flex justify-center">
                {getRankBadge(trader.rank)}
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{trader.avatar}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{trader.username}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-500">+{trader.profit}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CompetitionPage
