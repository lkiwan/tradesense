import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Award, Trophy, Star, TrendingUp, DollarSign,
  Calendar, ChevronRight, Crown, Medal, Target,
  Users, Zap, ArrowRight
} from 'lucide-react'

const HallOfFame = () => {
  const { t } = useTranslation()
  const [selectedPeriod, setSelectedPeriod] = useState('all')

  // Sample funded traders data
  const fundedTraders = [
    {
      id: 1,
      username: 'Mohammed_Trader',
      avatar: null,
      country: '🇲🇦',
      countryName: 'Morocco',
      accountSize: 100000,
      totalProfit: 45000,
      profitPercent: 45,
      fundedDate: '2024-01-15',
      totalPayouts: 36000,
      tradeCount: 234,
      winRate: 68,
      badge: 'diamond'
    },
    {
      id: 2,
      username: 'Sarah_FX',
      avatar: null,
      country: '🇫🇷',
      countryName: 'France',
      accountSize: 50000,
      totalProfit: 28500,
      profitPercent: 57,
      fundedDate: '2024-02-20',
      totalPayouts: 22800,
      tradeCount: 189,
      winRate: 72,
      badge: 'gold'
    },
    {
      id: 3,
      username: 'Ahmed_Pro',
      avatar: null,
      country: '🇦🇪',
      countryName: 'UAE',
      accountSize: 100000,
      totalProfit: 38000,
      profitPercent: 38,
      fundedDate: '2024-03-10',
      totalPayouts: 30400,
      tradeCount: 156,
      winRate: 65,
      badge: 'gold'
    },
    {
      id: 4,
      username: 'Elena_Trades',
      avatar: null,
      country: '🇪🇸',
      countryName: 'Spain',
      accountSize: 25000,
      totalProfit: 12500,
      profitPercent: 50,
      fundedDate: '2024-04-05',
      totalPayouts: 10000,
      tradeCount: 98,
      winRate: 71,
      badge: 'silver'
    },
    {
      id: 5,
      username: 'Youssef_FX',
      avatar: null,
      country: '🇲🇦',
      countryName: 'Morocco',
      accountSize: 50000,
      totalProfit: 22000,
      profitPercent: 44,
      fundedDate: '2024-04-18',
      totalPayouts: 17600,
      tradeCount: 145,
      winRate: 67,
      badge: 'silver'
    },
    {
      id: 6,
      username: 'David_Crypto',
      avatar: null,
      country: '🇩🇪',
      countryName: 'Germany',
      accountSize: 100000,
      totalProfit: 52000,
      profitPercent: 52,
      fundedDate: '2024-05-01',
      totalPayouts: 41600,
      tradeCount: 201,
      winRate: 69,
      badge: 'diamond'
    }
  ]

  const stats = [
    { label: 'Funded Traders', value: '500+', icon: Users },
    { label: 'Total Payouts', value: '$2.5M+', icon: DollarSign },
    { label: 'Avg Win Rate', value: '68%', icon: Target },
    { label: 'Success Rate', value: '12%', icon: TrendingUp }
  ]

  const getBadgeInfo = (badge) => {
    const badges = {
      diamond: { icon: Crown, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Diamond' },
      gold: { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Gold' },
      silver: { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Silver' }
    }
    return badges[badge] || badges.silver
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-200">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-primary-500/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-full text-yellow-500 text-sm font-medium mb-6">
              <Award size={16} />
              Hall of Fame
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Our{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-primary-500">
                Successful Traders
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Meet the traders who passed our challenge and are now trading with real capital.
              Your name could be here next.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/10 text-primary-500 mb-4">
                    <Icon size={24} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Funded Traders Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Featured Funded Traders
            </h2>
            <div className="flex gap-2">
              {['all', 'month', 'week'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-dark-100 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-50'
                  }`}
                >
                  {period === 'all' ? 'All Time' : period === 'month' ? 'This Month' : 'This Week'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fundedTraders.map((trader, index) => {
              const badgeInfo = getBadgeInfo(trader.badge)
              const BadgeIcon = badgeInfo.icon

              return (
                <div
                  key={trader.id}
                  className="bg-white dark:bg-dark-100 rounded-2xl p-6 border border-gray-200 dark:border-dark-100 hover:border-primary-500/50 transition-all hover:shadow-lg"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
                          {trader.username.charAt(0)}
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-xl">{trader.country}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {trader.username}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {trader.countryName}
                        </p>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${badgeInfo.bg}`}>
                      <BadgeIcon size={20} className={badgeInfo.color} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 dark:bg-dark-200 rounded-xl">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account Size</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(trader.accountSize)}
                      </div>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <div className="text-xs text-green-600 dark:text-green-400 mb-1">Total Profit</div>
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        +{formatCurrency(trader.totalProfit)}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-dark-200 rounded-xl">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Win Rate</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {trader.winRate}%
                      </div>
                    </div>
                    <div className="p-3 bg-primary-500/10 rounded-xl">
                      <div className="text-xs text-primary-600 dark:text-primary-400 mb-1">Payouts</div>
                      <div className="font-semibold text-primary-600 dark:text-primary-400">
                        {formatCurrency(trader.totalPayouts)}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Calendar size={14} />
                      Funded {formatDate(trader.fundedDate)}
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <TrendingUp size={14} />
                      {trader.tradeCount} trades
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-dark-100 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200 dark:border-dark-100 hover:bg-gray-50 dark:hover:bg-dark-50 transition-colors">
              Load More Traders
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-dark-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-r from-yellow-500 to-primary-500 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative text-center text-white">
              <Star size={48} className="mx-auto mb-4 opacity-90" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Join the Hall of Fame?
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Start your challenge today and prove you have what it takes to become a funded trader.
                Your success story awaits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-all"
                >
                  <Zap size={20} />
                  Start Challenge
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/leaderboard"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
                >
                  View Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HallOfFame
