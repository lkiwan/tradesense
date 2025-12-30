import { useTranslation } from 'react-i18next'
import {
  GraduationCap, PlayCircle, BookOpen, Award,
  TrendingUp, Shield, BarChart, Clock, Lock
} from 'lucide-react'

const MasterClass = () => {
  const { t } = useTranslation()

  const courses = [
    {
      titleKey: 'masterclass.courses.introTrading.title',
      descKey: 'masterclass.courses.introTrading.description',
      lessons: 12,
      duration: '2h 30min',
      levelKey: 'masterclass.levels.beginner',
      level: 'beginner',
      locked: false,
      icon: BookOpen
    },
    {
      titleKey: 'masterclass.courses.technicalAnalysis.title',
      descKey: 'masterclass.courses.technicalAnalysis.description',
      lessons: 18,
      duration: '4h 15min',
      levelKey: 'masterclass.levels.intermediate',
      level: 'intermediate',
      locked: false,
      icon: BarChart
    },
    {
      titleKey: 'masterclass.courses.riskManagement.title',
      descKey: 'masterclass.courses.riskManagement.description',
      lessons: 10,
      duration: '2h',
      levelKey: 'masterclass.levels.intermediate',
      level: 'intermediate',
      locked: false,
      icon: Shield
    },
    {
      titleKey: 'masterclass.courses.tradingPsychology.title',
      descKey: 'masterclass.courses.tradingPsychology.description',
      lessons: 8,
      duration: '1h 45min',
      levelKey: 'masterclass.levels.allLevels',
      level: 'allLevels',
      locked: false,
      icon: TrendingUp
    },
    {
      titleKey: 'masterclass.courses.advancedStrategies.title',
      descKey: 'masterclass.courses.advancedStrategies.description',
      lessons: 24,
      duration: '6h',
      levelKey: 'masterclass.levels.advanced',
      level: 'advanced',
      locked: true,
      icon: Award
    },
    {
      titleKey: 'masterclass.courses.algoTrading.title',
      descKey: 'masterclass.courses.algoTrading.description',
      lessons: 20,
      duration: '5h',
      levelKey: 'masterclass.levels.expert',
      level: 'expert',
      locked: true,
      icon: BarChart
    }
  ]

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500/10 text-green-500'
      case 'intermediate':
        return 'bg-blue-500/10 text-blue-500'
      case 'advanced':
        return 'bg-purple-500/10 text-purple-500'
      case 'expert':
        return 'bg-red-500/10 text-red-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-300 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full mb-4">
            <GraduationCap className="text-primary-500" size={20} />
            <span className="text-primary-500 font-medium">{t('masterclass.badge')}</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('masterclass.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('masterclass.subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-primary-500 mb-1">90+</div>
            <div className="text-sm text-gray-500">{t('masterclass.stats.lessons')}</div>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-primary-500 mb-1">20h+</div>
            <div className="text-sm text-gray-500">{t('masterclass.stats.content')}</div>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-primary-500 mb-1">6</div>
            <div className="text-sm text-gray-500">{t('masterclass.stats.modules')}</div>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-primary-500 mb-1">5K+</div>
            <div className="text-sm text-gray-500">{t('masterclass.stats.students')}</div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => {
            const Icon = course.icon
            return (
              <div
                key={index}
                className={`bg-white dark:bg-dark-100 rounded-xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl ${
                  course.locked ? 'opacity-75' : ''
                }`}
              >
                {/* Course Header */}
                <div className="relative h-40 bg-gradient-to-br from-primary-500 to-primary-600 p-6">
                  <Icon className="text-white/30 absolute right-4 bottom-4" size={80} />
                  <div className="relative">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getLevelColor(course.level)}`}>
                      {t(course.levelKey)}
                    </span>
                    {course.locked && (
                      <Lock className="absolute top-0 right-0 text-white" size={20} />
                    )}
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t(course.titleKey)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {t(course.descKey)}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <PlayCircle size={16} />
                      <span>{course.lessons} {t('masterclass.lessons')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{course.duration}</span>
                    </div>
                  </div>

                  <button
                    className={`w-full py-2 rounded-lg font-medium transition-all ${
                      course.locked
                        ? 'bg-gray-100 dark:bg-dark-200 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-500 hover:bg-primary-600 text-white'
                    }`}
                    disabled={course.locked}
                  >
                    {course.locked ? t('masterclass.comingSoon') : t('masterclass.start')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Webinars Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {t('masterclass.webinars.title')}
          </h2>
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-xl font-semibold mb-2">
              {t('masterclass.webinars.nextWebinar')}
            </h3>
            <p className="text-white/80 mb-6">
              {t('masterclass.webinars.description')}
            </p>
            <button className="px-6 py-3 bg-white text-primary-500 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
              {t('masterclass.webinars.registerFree')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterClass
