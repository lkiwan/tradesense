import { useTranslation } from 'react-i18next'
import {
  Users, MessageCircle, Heart, Share2,
  TrendingUp, Award, Star, ArrowRight
} from 'lucide-react'

const Community = () => {
  const { t } = useTranslation()

  const posts = [
    {
      author: 'TradePro',
      avatar: null,
      time: '2h',
      content: 'Je viens de passer mon challenge Elite! 12.5% de profit en 3 semaines. Merci a la communaute pour les conseils!',
      likes: 45,
      comments: 12,
      badge: 'Funded Trader'
    },
    {
      author: 'ForexMaster',
      avatar: null,
      time: '5h',
      content: 'Nouvelle strategie: j\'utilise les signaux IA de TradeSense combines avec mon analyse technique. Resultats impressionnants!',
      likes: 78,
      comments: 23,
      badge: 'Top Trader'
    },
    {
      author: 'CryptoKing',
      avatar: null,
      time: '1j',
      content: 'Qui trade le BTC ce soir? Les signaux indiquent une possible hausse. Partagez vos analyses!',
      likes: 34,
      comments: 45,
      badge: null
    }
  ]

  const groups = [
    { name: 'Traders Debutants', members: 2340, icon: Users },
    { name: 'Analyse Technique', members: 1890, icon: TrendingUp },
    { name: 'Crypto Trading', members: 3210, icon: Star },
    { name: 'Forex Experts', members: 1560, icon: Award }
  ]

  const topMembers = [
    { name: 'AlphaTrader', profit: '+45.2%', rank: 1 },
    { name: 'MarketGuru', profit: '+38.7%', rank: 2 },
    { name: 'TrendMaster', profit: '+32.1%', rank: 3 }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full mb-4">
            <Users className="text-purple-500" size={20} />
            <span className="text-purple-500 font-medium">Zone Communautaire</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('nav.community')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Connectez-vous avec des milliers de traders, partagez des strategies
            et apprenez des meilleurs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">U</span>
                </div>
                <input
                  type="text"
                  placeholder="Partagez votre experience de trading..."
                  className="flex-1 bg-gray-100 dark:bg-dark-200 rounded-full px-6 py-3 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Posts */}
            {posts.map((post, index) => (
              <div key={index} className="bg-white dark:bg-dark-100 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">
                      {post.author.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {post.author}
                      </span>
                      {post.badge && (
                        <span className="px-2 py-0.5 text-xs bg-primary-500/10 text-primary-500 rounded-full">
                          {post.badge}
                        </span>
                      )}
                      <span className="text-gray-500 text-sm">• {post.time}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
                        <Heart size={18} />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors">
                        <MessageCircle size={18} />
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Groups */}
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Groupes Populaires
              </h3>
              <div className="space-y-3">
                {groups.map((group, index) => {
                  const Icon = group.icon
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-200 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                          <Icon className="text-primary-500" size={20} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {group.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {group.members.toLocaleString()} membres
                          </div>
                        </div>
                      </div>
                      <button className="text-primary-500 hover:text-primary-600">
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top Members */}
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Top Traders du Mois
              </h3>
              <div className="space-y-3">
                {topMembers.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-200"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      member.rank === 1 ? 'bg-yellow-500' :
                      member.rank === 2 ? 'bg-gray-400' : 'bg-amber-600'
                    } text-white font-bold text-sm`}>
                      {member.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {member.name}
                      </div>
                    </div>
                    <div className="text-green-500 font-semibold text-sm">
                      {member.profit}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Online Now */}
            <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  En ligne maintenant
                </span>
              </div>
              <p className="text-2xl font-bold text-primary-500">
                1,234 traders
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Community
