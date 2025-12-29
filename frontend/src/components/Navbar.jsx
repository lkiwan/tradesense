import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useChallenge } from '../context/ChallengeContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useSocket } from '../context/SocketContext'
import { marketAPI } from '../services/api'
import {
  Menu, X, Sun, Moon, Globe, ChevronDown,
  LayoutDashboard, Trophy, GraduationCap, Users,
  Newspaper, DollarSign, LogOut, User, Settings,
  Zap, Target, Clock, Star, TrendingUp, TrendingDown, Lock,
  HelpCircle, Info, Mail, Calendar, BookOpen,
  Gift, Award, Play, FileText, Building2, MessageCircle
} from 'lucide-react'

// Ticker symbols
const TICKER_SYMBOLS = ['BTC-USD', 'ETH-USD', 'AAPL', 'TSLA', 'IAM', 'NVDA', 'GOOGL', 'ATW']

// Format price based on value
const formatTickerPrice = (price, symbol) => {
  if (price === null || price === undefined) return null
  if (symbol?.endsWith('-USD')) {
    if (price < 1) return price.toFixed(4)
    return price.toFixed(2)
  }
  return price.toFixed(2)
}

// Price Ticker Item
const TickerItem = ({ symbol, price, changePercent }) => {
  const isPositive = changePercent >= 0
  const displaySymbol = symbol.replace('-USD', '')
  const formattedPrice = formatTickerPrice(price, symbol)
  const isMoroccan = ['IAM', 'ATW'].includes(symbol)

  return (
    <span className="inline-flex items-center gap-2 mx-4 text-sm whitespace-nowrap">
      <span className="text-gray-400">{displaySymbol}</span>
      <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
        {isMoroccan ? '' : '$'}{formattedPrice || '---'}{isMoroccan ? ' MAD' : ''}{' '}
        {isPositive ? '+' : ''}{changePercent?.toFixed(1) || '0.0'}%
      </span>
    </span>
  )
}

const Navbar = () => {
  const { t } = useTranslation()
  const { user, isAuthenticated, logout } = useAuth()
  const { challenge, hasActiveChallenge, isFunded, currentPhase } = useChallenge()
  const { isDark, toggleTheme } = useTheme()
  const { language, setLanguage, languages } = useLanguage()
  const { prices: socketPrices, subscribeToPrices, isConnected } = useSocket()
  const location = useLocation()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [tickerPrices, setTickerPrices] = useState({})
  const dropdownRef = useRef(null)

  // Subscribe to ticker prices
  useEffect(() => {
    if (isConnected) {
      subscribeToPrices(TICKER_SYMBOLS)
    }
  }, [isConnected, subscribeToPrices])

  // Fetch prices from API as fallback
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await marketAPI.getAllSignals(TICKER_SYMBOLS)
        if (response.data?.signals) {
          const prices = {}
          response.data.signals.forEach((item) => {
            prices[item.symbol] = {
              price: item.price,
              changePercent: item.change_percent || 0
            }
          })
          setTickerPrices(prices)
        }
      } catch (error) {
        console.log('Ticker prices fetch error:', error)
      }
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  // Merge socket and API prices (memoized to prevent unnecessary re-renders)
  const livePrices = useMemo(() => ({ ...tickerPrices, ...socketPrices }), [tickerPrices, socketPrices])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdowns on route change
  useEffect(() => {
    setActiveDropdown(null)
    setIsMenuOpen(false)
  }, [location.pathname])

  // Navigation structure with dropdowns
  const navStructure = [
    {
      id: 'challenges',
      label: 'Challenges',
      icon: Target,
      items: [
        { path: '/pricing', label: 'Pricing', icon: DollarSign, description: 'View all challenge plans' },
        { path: '/free-trial', label: 'Free Trial', icon: Gift, description: '7-day trial with $5,000', highlight: true, hideIfChallenge: true },
        { path: '/how-it-works', label: 'How It Works', icon: Play, description: 'Learn the challenge process' },
      ]
    },
    {
      id: 'trading',
      label: 'Trading',
      icon: TrendingUp,
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Your trading dashboard', requiresChallenge: true },
        { path: '/leaderboard', label: 'Leaderboard', icon: Trophy, description: 'Top traders ranking' },
        { path: '/calendar', label: 'Economic Calendar', icon: Calendar, description: 'Important market events' },
      ]
    },
    {
      id: 'learn',
      label: 'Learn',
      icon: GraduationCap,
      items: [
        { path: '/masterclass', label: 'MasterClass', icon: GraduationCap, description: 'Trading courses & tutorials', requiresAuth: true },
        { path: '/news', label: 'Market News', icon: Newspaper, description: 'Latest trading insights' },
        { path: '/academy', label: 'Academy', icon: BookOpen, description: 'Trading guides & resources' },
      ]
    },
    {
      id: 'community',
      label: 'Community',
      icon: Users,
      items: [
        { path: '/community', label: 'Forum', icon: MessageCircle, description: 'Join trader discussions', requiresAuth: true },
        { path: '/partners', label: 'Affiliate Program', icon: Gift, description: 'Earn by referring traders' },
        { path: '/hall-of-fame', label: 'Hall of Fame', icon: Award, description: 'Our successful traders' },
      ]
    },
    {
      id: 'about',
      label: 'About',
      icon: Info,
      items: [
        { path: '/about', label: 'About Us', icon: Building2, description: 'Our story & mission' },
        { path: '/faq', label: 'FAQ', icon: HelpCircle, description: 'Frequently asked questions' },
        { path: '/contact', label: 'Contact', icon: Mail, description: 'Get in touch with us' },
      ]
    },
  ]

  const isActive = (path) => location.pathname === path

  // Get phase badge info
  const getPhaseBadge = () => {
    if (!hasActiveChallenge) return null

    const badges = {
      trial: { label: 'Essai', color: 'blue', icon: Clock },
      evaluation: { label: 'Phase 1', color: 'purple', icon: Target },
      verification: { label: 'Phase 2', color: 'orange', icon: TrendingUp },
      funded: { label: 'Fundé', color: 'green', icon: Star }
    }

    return badges[currentPhase] || badges.evaluation
  }

  const phaseBadge = getPhaseBadge()

  // Check if nav item should be shown
  const shouldShowItem = (item) => {
    if (item.hideIfChallenge && hasActiveChallenge) return false
    return true
  }

  // Check access level for nav item
  const getItemAccess = (item) => {
    if (item.requiresChallenge && !hasActiveChallenge) {
      return isAuthenticated ? 'locked' : 'hidden'
    }
    if (item.requiresAuth && !isAuthenticated) {
      return 'login-required'
    }
    return 'accessible'
  }

  // Render dropdown menu item
  const renderDropdownItem = (item) => {
    if (!shouldShowItem(item)) return null

    const Icon = item.icon
    const access = getItemAccess(item)

    if (access === 'hidden') return null

    if (access === 'locked') {
      return (
        <div
          key={item.path}
          className="flex items-start gap-3 px-4 py-3 text-gray-400 dark:text-gray-600 cursor-not-allowed"
          title="Achetez un challenge pour accéder"
        >
          <div className="p-2 bg-gray-100 dark:bg-dark-100 rounded-lg">
            <Icon size={18} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{item.label}</span>
              <Lock size={12} />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-600">{item.description}</p>
          </div>
        </div>
      )
    }

    if (access === 'login-required') {
      return (
        <Link
          key={item.path}
          to={`/login?redirect=${item.path}`}
          className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-100 transition-colors group"
        >
          <div className="p-2 bg-gray-100 dark:bg-dark-100 rounded-lg group-hover:bg-primary-500/10">
            <Icon size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-primary-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-500">{item.label}</span>
              <Lock size={12} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
          </div>
        </Link>
      )
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-100 transition-colors group ${item.highlight ? 'bg-gradient-to-r from-primary-500/5 to-blue-500/5' : ''
          }`}
      >
        <div className={`p-2 rounded-lg ${item.highlight
          ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20'
          : 'bg-gray-100 dark:bg-dark-100 group-hover:bg-primary-500/10'
          }`}>
          <Icon size={18} className={`${item.highlight
            ? 'text-primary-500'
            : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-500'
            }`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm group-hover:text-primary-500 ${item.highlight
              ? 'text-primary-500'
              : 'text-gray-700 dark:text-gray-300'
              }`}>
              {item.label}
            </span>
            {item.highlight && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-primary-500 to-blue-500 text-white rounded-full">
                FREE
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
        </div>
      </Link>
    )
  }

  // Render desktop dropdown
  const renderDropdown = (menu) => {
    const Icon = menu.icon
    const isOpen = activeDropdown === menu.id
    const hasActiveChild = menu.items.some(item => isActive(item.path))

    return (
      <div key={menu.id} className="relative">
        <button
          onClick={() => setActiveDropdown(isOpen ? null : menu.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${hasActiveChild || isOpen
            ? 'text-primary-500 bg-primary-500/10'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100'
            }`}
        >
          <Icon size={18} />
          {menu.label}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-dark-200 rounded-xl shadow-xl border border-gray-200 dark:border-dark-100 py-2 z-50 animate-fadeIn">
            {menu.items.map(item => renderDropdownItem(item))}
          </div>
        )}
      </div>
    )
  }

  // Render mobile menu item
  const renderMobileMenuItem = (item, menuLabel) => {
    if (!shouldShowItem(item)) return null

    const Icon = item.icon
    const access = getItemAccess(item)

    if (access === 'hidden') return null

    if (access === 'locked') {
      return (
        <div
          key={item.path}
          className="flex items-center gap-3 px-4 py-3 text-gray-400 dark:text-gray-600 cursor-not-allowed"
        >
          <Icon size={18} />
          <span className="flex-1">{item.label}</span>
          <Lock size={14} />
        </div>
      )
    }

    const linkPath = access === 'login-required' ? `/login?redirect=${item.path}` : item.path

    return (
      <Link
        key={item.path}
        to={linkPath}
        onClick={() => setIsMenuOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive(item.path)
          ? 'text-primary-500 bg-primary-500/10'
          : item.highlight
            ? 'text-primary-500 bg-gradient-to-r from-primary-500/10 to-blue-500/10'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100'
          }`}
      >
        <Icon size={18} />
        <span className="flex-1">{item.label}</span>
        {access === 'login-required' && <Lock size={14} className="text-gray-400" />}
        {item.highlight && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-primary-500 to-blue-500 text-white rounded-full">
            FREE
          </span>
        )}
      </Link>
    )
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-dark-200/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.svg" alt="TradeSense AI Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold whitespace-nowrap">
                <span className="text-gray-900 dark:text-white">Trade</span>
                <span className="text-primary-500">Sense</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
              {navStructure.map(menu => renderDropdown(menu))}
            </div>

            {/* Right side - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Phase Badge (when authenticated with challenge) */}
              {phaseBadge && (
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${phaseBadge.color === 'blue' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' :
                    phaseBadge.color === 'purple' ? 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20' :
                      phaseBadge.color === 'orange' ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20' :
                        'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                    }`}
                >
                  <phaseBadge.icon size={14} />
                  {phaseBadge.label}
                </Link>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-1 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors"
                >
                  <Globe size={20} />
                  <span className="text-sm font-medium">{language.toUpperCase()}</span>
                  <ChevronDown size={16} />
                </button>

                {isLangOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-dark-100 rounded-lg shadow-lg border border-gray-200 dark:border-dark-100 py-1 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code)
                          setIsLangOpen(false)
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-200
                        ${language === lang.code ? 'text-primary-500' : 'text-gray-700 dark:text-gray-300'}`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Auth Buttons / User Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isFunded ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-primary-500'
                      }`}>
                      {isFunded ? (
                        <Star size={14} className="text-white" />
                      ) : (
                        <span className="text-white text-sm font-medium">
                          {user?.username?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user?.username}
                    </span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-100 rounded-lg shadow-lg border border-gray-200 dark:border-dark-100 py-1 z-50">
                      {/* Phase status in menu */}
                      {phaseBadge && (
                        <div className={`mx-2 mb-2 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${phaseBadge.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                          phaseBadge.color === 'purple' ? 'bg-purple-500/10 text-purple-500' :
                            phaseBadge.color === 'orange' ? 'bg-orange-500/10 text-orange-500' :
                              'bg-green-500/10 text-green-500'
                          }`}>
                          <phaseBadge.icon size={14} />
                          {challenge?.phase_display || phaseBadge.label}
                        </div>
                      )}

                      {hasActiveChallenge && (
                        <Link
                          to="/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-200"
                        >
                          <LayoutDashboard size={16} />
                          {t('nav.dashboard')}
                        </Link>
                      )}

                      {!hasActiveChallenge && (
                        <Link
                          to="/pricing"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-primary-500 hover:bg-gray-100 dark:hover:bg-dark-200"
                        >
                          <DollarSign size={16} />
                          Acheter un Challenge
                        </Link>
                      )}

                      {['admin', 'superadmin'].includes(user?.role) && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-200"
                        >
                          <Settings size={16} />
                          {t('nav.admin')}
                        </Link>
                      )}

                      {user?.role === 'superadmin' && (
                        <Link
                          to="/superadmin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-200"
                        >
                          <User size={16} />
                          {t('nav.superadmin')}
                        </Link>
                      )}

                      <hr className="my-1 border-gray-200 dark:border-dark-100" />

                      <button
                        onClick={() => {
                          logout()
                          setIsUserMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-dark-200"
                      >
                        <LogOut size={16} />
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500 transition-colors"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}

              {/* Start Challenge CTA */}
              {!hasActiveChallenge && (
                <Link
                  to="/pricing"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-blue-500 hover:from-primary-600 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-primary-500/25 ml-2"
                >
                  <Zap size={16} />
                  Start Challenge
                </Link>
              )}
            </div>

            {/* Right side - Mobile */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Login Button - Always visible on mobile when not authenticated */}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500 transition-colors"
                >
                  {t('nav.login')}
                </Link>
              )}

              {/* User Avatar - When authenticated */}
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${isFunded ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-primary-500'
                    }`}
                >
                  {isFunded ? (
                    <Star size={14} className="text-white" />
                  ) : (
                    <span className="text-white text-sm font-medium">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-dark-200 border-b border-gray-200 dark:border-dark-100 max-h-[80vh] overflow-y-auto">
            <div className="py-4">
              {/* User info when authenticated */}
              {isAuthenticated && (
                <div className="px-4 pb-4 mb-4 border-b border-gray-200 dark:border-dark-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isFunded ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-primary-500'
                      }`}>
                      {isFunded ? (
                        <Star size={16} className="text-white" />
                      ) : (
                        <span className="text-white font-medium">
                          {user?.username?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{user?.username}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                  </div>

                  {/* Phase badge */}
                  {phaseBadge && (
                    <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${phaseBadge.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                      phaseBadge.color === 'purple' ? 'bg-purple-500/10 text-purple-500' :
                        phaseBadge.color === 'orange' ? 'bg-orange-500/10 text-orange-500' :
                          'bg-green-500/10 text-green-500'
                      }`}>
                      <phaseBadge.icon size={16} />
                      {challenge?.phase_display || phaseBadge.label}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="px-4 pb-4 mb-4 border-b border-gray-200 dark:border-dark-100">
                <div className="flex items-center gap-2">
                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 transition-colors min-h-[48px] touch-manipulation"
                  >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    <span className="text-sm font-medium">{isDark ? 'Clair' : 'Sombre'}</span>
                  </button>

                  {/* Language Selector */}
                  <div className="relative flex-1">
                    <button
                      onClick={() => setIsLangOpen(!isLangOpen)}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 transition-colors min-h-[48px] touch-manipulation"
                    >
                      <Globe size={20} />
                      <span className="text-sm font-medium">{language.toUpperCase()}</span>
                      <ChevronDown size={16} />
                    </button>

                    {isLangOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-100 rounded-lg shadow-lg border border-gray-200 dark:border-dark-100 py-1 z-50">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.code)
                              setIsLangOpen(false)
                            }}
                            className={`w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-dark-200 min-h-[48px]
                            ${language === lang.code ? 'text-primary-500' : 'text-gray-700 dark:text-gray-300'}`}
                          >
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile menu sections */}
              {navStructure.map((menu) => (
                <div key={menu.id} className="mb-4">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {menu.label}
                  </div>
                  <div className="space-y-1">
                    {menu.items.map(item => renderMobileMenuItem(item, menu.label))}
                  </div>
                </div>
              ))}

              {/* Mobile auth buttons */}
              {!isAuthenticated && (
                <div className="px-4 pt-4 space-y-2 border-t border-gray-200 dark:border-dark-100">
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center text-sm font-medium bg-primary-500 text-white rounded-lg min-h-[48px] flex items-center justify-center touch-manipulation"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}

              {/* Logout button when authenticated */}
              {isAuthenticated && (
                <div className="px-4 pt-4 border-t border-gray-200 dark:border-dark-100">
                  {/* Admin/SuperAdmin links */}
                  {['admin', 'superadmin'].includes(user?.role) && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg mb-2"
                    >
                      <Settings size={18} />
                      <span>{t('nav.admin')}</span>
                    </Link>
                  )}
                  {user?.role === 'superadmin' && (
                    <Link
                      to="/superadmin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg mb-2"
                    >
                      <User size={18} />
                      <span>{t('nav.superadmin')}</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 bg-red-500/10 rounded-lg font-medium min-h-[48px] touch-manipulation"
                  >
                    <LogOut size={18} />
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add animation keyframes */}
        <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
      `}</style>
      </nav>

      {/* Market Ticker Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-dark-300/95 backdrop-blur-sm border-b border-dark-100 overflow-hidden">
        <div className="flex animate-scroll-left whitespace-nowrap py-1.5">
          {/* Duplicate the ticker items for seamless loop */}
          {[...TICKER_SYMBOLS, ...TICKER_SYMBOLS].map((symbol, index) => {
            const priceData = livePrices[symbol]
            return (
              <TickerItem
                key={`${symbol}-${index}`}
                symbol={symbol}
                price={priceData?.price}
                changePercent={priceData?.changePercent || priceData?.change_percent || 0}
              />
            )
          })}
        </div>
      </div>
    </>
  )
}

export default Navbar
