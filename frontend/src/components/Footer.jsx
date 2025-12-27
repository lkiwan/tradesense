import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Github, Twitter, Linkedin, Mail, TrendingUp } from 'lucide-react'

const Footer = () => {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-dark-200 border-t border-gray-200 dark:border-dark-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src="/logo.svg"
                alt="TradeSense"
                className="h-10 w-10 object-contain"
              />
              <span className="text-2xl font-bold">
                <span className="text-gray-900 dark:text-white">Trade</span>
                <span className="text-primary-500">Sense</span>
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mb-4">
              La premiere Prop Firm assistee par IA pour l'Afrique. Tradez sur des donnees reelles,
              atteignez vos objectifs et devenez un trader finance.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <Github size={20} />
              </a>
              <a href="mailto:contact@tradesense.com" className="text-gray-400 hover:text-primary-500 transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-sm transition-colors">
                  {t('nav.pricing')}
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-sm transition-colors">
                  {t('nav.leaderboard')}
                </Link>
              </li>
              <li>
                <Link to="/masterclass" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-sm transition-colors">
                  {t('nav.masterclass')}
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-sm transition-colors">
                  {t('nav.community')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-sm transition-colors">
                  Conditions d'utilisation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-sm transition-colors">
                  Politique de confidentialite
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-sm transition-colors">
                  Regles du Challenge
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 text-sm transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-dark-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © {currentYear} TradeSense AI. Tous droits reserves.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Fait avec passion pour les traders africains
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
