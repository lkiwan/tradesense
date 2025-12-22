import { useTranslation } from 'react-i18next'
import {
  GraduationCap, PlayCircle, BookOpen, Award,
  TrendingUp, Shield, BarChart, Clock, Lock
} from 'lucide-react'

const MasterClass = () => {
  const { t } = useTranslation()

  const courses = [
    {
      title: 'Introduction au Trading',
      description: 'Les bases du trading pour debutants',
      lessons: 12,
      duration: '2h 30min',
      level: 'Debutant',
      locked: false,
      icon: BookOpen
    },
    {
      title: 'Analyse Technique',
      description: 'Maitrisez les graphiques et indicateurs',
      lessons: 18,
      duration: '4h 15min',
      level: 'Intermediaire',
      locked: false,
      icon: BarChart
    },
    {
      title: 'Gestion des Risques',
      description: 'Protegez votre capital comme un pro',
      lessons: 10,
      duration: '2h',
      level: 'Intermediaire',
      locked: false,
      icon: Shield
    },
    {
      title: 'Psychologie du Trading',
      description: 'Controlez vos emotions pour gagner',
      lessons: 8,
      duration: '1h 45min',
      level: 'Tous niveaux',
      locked: false,
      icon: TrendingUp
    },
    {
      title: 'Strategies Avancees',
      description: 'Techniques de trading professionnelles',
      lessons: 24,
      duration: '6h',
      level: 'Avance',
      locked: true,
      icon: Award
    },
    {
      title: 'Trading Algorithmique',
      description: 'Automatisez vos strategies',
      lessons: 20,
      duration: '5h',
      level: 'Expert',
      locked: true,
      icon: BarChart
    }
  ]

  const getLevelColor = (level) => {
    switch (level) {
      case 'Debutant':
        return 'bg-green-500/10 text-green-500'
      case 'Intermediaire':
        return 'bg-blue-500/10 text-blue-500'
      case 'Avance':
        return 'bg-purple-500/10 text-purple-500'
      case 'Expert':
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
            <span className="text-primary-500 font-medium">Centre d'Apprentissage</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('nav.masterclass')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Des cours de haute qualite pour devenir un trader professionnel,
            du debutant a l'expert
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-primary-500 mb-1">90+</div>
            <div className="text-sm text-gray-500">Lecons</div>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-primary-500 mb-1">20h+</div>
            <div className="text-sm text-gray-500">De Contenu</div>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-primary-500 mb-1">6</div>
            <div className="text-sm text-gray-500">Modules</div>
          </div>
          <div className="bg-white dark:bg-dark-100 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-primary-500 mb-1">5K+</div>
            <div className="text-sm text-gray-500">Etudiants</div>
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
                      {course.level}
                    </span>
                    {course.locked && (
                      <Lock className="absolute top-0 right-0 text-white" size={20} />
                    )}
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <PlayCircle size={16} />
                      <span>{course.lessons} lecons</span>
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
                    {course.locked ? 'Bientot Disponible' : 'Commencer'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Webinars Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Webinaires en Direct
          </h2>
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-xl font-semibold mb-2">
              Prochain Webinaire: Strategies de Trading 2024
            </h3>
            <p className="text-white/80 mb-6">
              Rejoignez nos experts pour decouvrir les meilleures strategies pour cette annee
            </p>
            <button className="px-6 py-3 bg-white text-primary-500 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
              S'inscrire Gratuitement
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterClass
