import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { leaderboardAPI } from '../services/api'
import { Trophy, Medal, TrendingUp, User } from 'lucide-react'

const Leaderboard = ({ limit = 10, showPeriodSelector = true }) => {
  const { t } = useTranslation()
  const [leaders, setLeaders] = useState([])
  const [period, setPeriod] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [period, limit])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await leaderboardAPI.getLeaderboard(limit, period)
      setLeaders(response.data.leaderboard || [])
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      // Mock data for demo
      setLeaders(generateMockLeaders())
    } finally {
      setLoading(false)
    }
  }

  const generateMockLeaders = () => {
    const names = ['TraderPro', 'CryptoKing', 'ForexMaster', 'MarketGuru', 'TrendFollower',
                   'SwingTrader', 'DayTrader', 'AlgoTrader', 'ValueHunter', 'MomentumPlay']
    return names.slice(0, limit).map((name, i) => ({
      rank: i + 1,
      username: name,
      avatar: null,
      profit_percentage: (30 - i * 2.5 + Math.random() * 5).toFixed(2),
      plan_type: ['elite', 'pro', 'starter'][Math.floor(Math.random() * 3)],
      initial_balance: [100000, 25000, 5000][Math.floor(Math.random() * 3)],
      current_balance: 0
    })).map(leader => ({
      ...leader,
      current_balance: leader.initial_balance * (1 + leader.profit_percentage / 100)
    }))
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={24} />
      case 2:
        return <Medal className="text-gray-400" size={24} />
      case 3:
        return <Medal className="text-amber-600" size={24} />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</span>
    }
  }

  const getPlanBadgeColor = (plan) => {
    switch (plan) {
      case 'elite':
        return 'bg-purple-500/20 text-purple-500'
      case 'pro':
        return 'bg-blue-500/20 text-blue-500'
      default:
        return 'bg-gray-500/20 text-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
        <div className="flex items-center justify-center h-48">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500" size={24} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('leaderboard.title')}
          </h2>
        </div>

        {showPeriodSelector && (
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-200 rounded-lg p-1">
            {['all', 'month', 'week'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  period === p
                    ? 'bg-white dark:bg-dark-100 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t(`leaderboard.period.${p}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {leaders.map((leader, index) => (
          <div
            key={leader.username}
            className={`flex items-center gap-4 p-4 rounded-lg transition-all animate-fadeIn
              ${leader.rank <= 3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : 'bg-gray-50 dark:bg-dark-200'}
              hover:bg-gray-100 dark:hover:bg-dark-300`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-8">
              {getRankIcon(leader.rank)}
            </div>

            {/* Avatar & Name */}
            <div className="flex items-center gap-3 flex-grow">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                {leader.avatar ? (
                  <img src={leader.avatar} alt={leader.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white font-medium">
                    {leader.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {leader.username}
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${getPlanBadgeColor(leader.plan_type)}`}>
                  {leader.plan_type}
                </div>
              </div>
            </div>

            {/* Profit */}
            <div className="text-right">
              <div className={`font-bold flex items-center gap-1 justify-end ${
                parseFloat(leader.profit_percentage) >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                <TrendingUp size={16} />
                {parseFloat(leader.profit_percentage) >= 0 ? '+' : ''}{leader.profit_percentage}%
              </div>
              <div className="text-xs text-gray-500">
                ${parseFloat(leader.current_balance).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        ))}

        {leaders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No traders yet. Be the first!
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
