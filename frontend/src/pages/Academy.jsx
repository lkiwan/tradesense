import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BookOpen, Play, Clock, Star, ChevronRight, Search,
  TrendingUp, BarChart3, Shield, Brain, Target, Zap,
  Lock, CheckCircle2, Users, Award
} from 'lucide-react'

const Academy = () => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Courses', icon: BookOpen },
    { id: 'beginner', name: 'Beginner', icon: Target },
    { id: 'intermediate', name: 'Intermediate', icon: TrendingUp },
    { id: 'advanced', name: 'Advanced', icon: Brain },
    { id: 'strategies', name: 'Strategies', icon: BarChart3 },
    { id: 'risk', name: 'Risk Management', icon: Shield },
  ]

  const courses = [
    {
      id: 1,
      title: 'Trading Fundamentals',
      description: 'Learn the basics of trading, market structure, and how to read price action.',
      category: 'beginner',
      duration: '2h 30m',
      lessons: 12,
      rating: 4.8,
      students: 2500,
      image: '/courses/fundamentals.jpg',
      free: true
    },
    {
      id: 2,
      title: 'Technical Analysis Mastery',
      description: 'Master chart patterns, indicators, and technical analysis techniques.',
      category: 'intermediate',
      duration: '4h 15m',
      lessons: 18,
      rating: 4.9,
      students: 1800,
      image: '/courses/technical.jpg',
      free: false
    },
    {
      id: 3,
      title: 'Risk Management Essentials',
      description: 'Protect your capital with proper position sizing and risk management.',
      category: 'risk',
      duration: '1h 45m',
      lessons: 8,
      rating: 4.7,
      students: 3200,
      image: '/courses/risk.jpg',
      free: true
    },
    {
      id: 4,
      title: 'Price Action Trading',
      description: 'Trade without indicators using pure price action and candlestick patterns.',
      category: 'strategies',
      duration: '3h 30m',
      lessons: 15,
      rating: 4.9,
      students: 1500,
      image: '/courses/priceaction.jpg',
      free: false
    },
    {
      id: 5,
      title: 'Trading Psychology',
      description: 'Master your emotions and develop a winning trader mindset.',
      category: 'advanced',
      duration: '2h 00m',
      lessons: 10,
      rating: 4.8,
      students: 2100,
      image: '/courses/psychology.jpg',
      free: false
    },
    {
      id: 6,
      title: 'Forex Trading Guide',
      description: 'Complete guide to trading currency pairs in the forex market.',
      category: 'beginner',
      duration: '3h 00m',
      lessons: 14,
      rating: 4.7,
      students: 2800,
      image: '/courses/forex.jpg',
      free: true
    },
    {
      id: 7,
      title: 'Crypto Trading Strategies',
      description: 'Learn to trade Bitcoin, Ethereum, and other cryptocurrencies effectively.',
      category: 'strategies',
      duration: '2h 45m',
      lessons: 12,
      rating: 4.6,
      students: 1900,
      image: '/courses/crypto.jpg',
      free: false
    },
    {
      id: 8,
      title: 'Advanced Chart Patterns',
      description: 'Identify and trade complex chart patterns for higher probability setups.',
      category: 'advanced',
      duration: '3h 15m',
      lessons: 16,
      rating: 4.8,
      students: 1200,
      image: '/courses/patterns.jpg',
      free: false
    }
  ]

  const guides = [
    {
      title: 'Getting Started with TradeSense',
      description: 'A complete guide to starting your funded trading journey.',
      icon: Zap,
      color: 'primary'
    },
    {
      title: 'Challenge Rules Explained',
      description: 'Understand all the rules and requirements for each phase.',
      icon: Target,
      color: 'blue'
    },
    {
      title: 'Trading Platform Guide',
      description: 'Learn how to use our trading platform effectively.',
      icon: BarChart3,
      color: 'purple'
    },
    {
      title: 'Payout Process',
      description: 'How to request and receive your trading profits.',
      icon: Award,
      color: 'green'
    }
  ]

  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getColorClasses = (color) => {
    const colors = {
      primary: 'bg-primary-500/10 text-primary-500',
      blue: 'bg-blue-500/10 text-blue-500',
      purple: 'bg-purple-500/10 text-purple-500',
      green: 'bg-green-500/10 text-green-500'
    }
    return colors[color]
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full text-primary-500 text-sm font-medium mb-4">
            <BookOpen size={16} />
            Trading Academy
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Learn to Trade Like a Pro
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Free educational resources, trading courses, and guides to help you become a consistently profitable trader.
          </p>
        </div>

        {/* Quick Start Guides */}
        <div className="mb-12">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Quick Start Guides</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {guides.map((guide, index) => {
              const Icon = guide.icon
              return (
                <div
                  key={index}
                  className="p-3 sm:p-5 bg-white dark:bg-dark-100 rounded-lg sm:rounded-xl border border-gray-200 dark:border-dark-100 hover:border-primary-500/50 transition-colors cursor-pointer group"
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${getColorClasses(guide.color)} flex items-center justify-center mb-2 sm:mb-3`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-0.5 sm:mb-1 group-hover:text-primary-500 transition-colors text-xs sm:text-base">
                    {guide.title}
                  </h3>
                  <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                    {guide.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-dark-100 rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-dark-200 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-dark-200 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-50'
                    }`}
                  >
                    <Icon size={16} />
                    {category.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-dark-100 rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-100 hover:border-primary-500/50 transition-all hover:shadow-lg group"
            >
              {/* Course Image */}
              <div className="relative h-40 bg-gradient-to-br from-primary-500/20 to-blue-500/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play size={48} className="text-primary-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                {course.free ? (
                  <span className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                    FREE
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 px-2 py-1 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Lock size={10} />
                    PRO
                  </span>
                )}
              </div>

              {/* Course Info */}
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {course.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {course.lessons} lessons
                  </div>
                </div>

                {/* Rating & Students */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Users size={14} />
                    {course.students.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary-500 to-blue-500 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Apply What You've Learned?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Put your trading knowledge to the test. Start a challenge and prove you have what it takes to become a funded trader.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-all"
            >
              Start a Challenge
              <ChevronRight size={20} />
            </Link>
            <Link
              to="/masterclass"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
            >
              View MasterClass
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Academy
