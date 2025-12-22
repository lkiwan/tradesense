import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { leaderboardAPI } from '../services/api'
import Leaderboard from '../components/Leaderboard'
import { Trophy, Users, TrendingUp, Target } from 'lucide-react'

const LeaderboardPage = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await leaderboardAPI.getStats()
      setStats(response.data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Mock stats
      setStats({
        total_users: 1250,
        total_challenges: 3420,
        active_challenges: 856,
        passed_challenges: 1230,
        failed_challenges: 1334,
        average_profit_percentage: 8.5,
        success_rate: 47.9
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      icon: Users,
      label: 'Total Traders',
      value: stats?.total_users?.toLocaleString() || '0',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Target,
      label: 'Challenges Actifs',
      value: stats?.active_challenges?.toLocaleString() || '0',
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      icon: TrendingUp,
      label: 'Profit Moyen',
      value: `${stats?.average_profit_percentage?.toFixed(1) || '0'}%`,
      color: 'text-primary-500',
      bg: 'bg-primary-500/10'
    },
    {
      icon: Trophy,
      label: 'Taux de Reussite',
      value: `${stats?.success_rate?.toFixed(1) || '0'}%`,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-full mb-4">
            <Trophy className="text-yellow-500" size={20} />
            <span className="text-yellow-500 font-medium">Top Performers</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('leaderboard.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Decouvrez les meilleurs traders de la plateforme
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="bg-white dark:bg-dark-100 rounded-xl p-6 text-center"
              >
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={stat.color} size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Leaderboard */}
        <Leaderboard limit={20} showPeriodSelector={true} />

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vous voulez apparaitre dans ce classement?
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all"
          >
            Commencer un Challenge
          </a>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
