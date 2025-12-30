import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Github, Twitter, Linkedin, Mail, TrendingUp } from 'lucide-react'

const Footer = () => {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-dark-200 border-t border-gray-200 dark:border-dark-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand - Full width on mobile */}
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src="/logo.svg"
                alt="TradeSense"
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
              />
              <span className="text-xl sm:text-2xl font-bold">
                <span className="text-gray-900 dark:text-white">Trade</span>
                <span className="text-primary-500">Sense</span>
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm max-w-md mb-4">
              {t('footer.description')}
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <Twitter size={18} className="sm:w-5 sm:h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <Linkedin size={18} className="sm:w-5 sm:h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <Github size={18} className="sm:w-5 sm:h-5" />
              </a>
              <a href="mailto:contact@tradesense.com" className="text-gray-400 hover:text-primary-500 transition-colors">
                <Mail size={18} className="sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links - Side by side on mobile */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">{t('footer.platform')}</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link to="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-xs sm:text-sm transition-colors">
                  {t('nav.pricing')}
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-xs sm:text-sm transition-colors">
                  {t('nav.leaderboard')}
                </Link>
              </li>
              <li>
                <Link to="/masterclass" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-xs sm:text-sm transition-colors">
                  {t('nav.masterclass')}
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-xs sm:text-sm transition-colors">
                  {t('nav.community')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal - Side by side on mobile */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">{t('footer.legal')}</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-xs sm:text-sm transition-colors">
                  {t('footer.terms')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-xs sm:text-sm transition-colors">
                  {t('footer.privacy')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-xs sm:text-sm transition-colors">
                  {t('footer.rules')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-xs sm:text-sm transition-colors">
                  {t('footer.contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-dark-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © {currentYear} TradeSense AI. {t('footer.copyright')}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t('footer.madeWith')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
