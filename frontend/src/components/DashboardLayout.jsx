import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChallenge } from '../context/ChallengeContext'
import EmailVerificationBanner from './EmailVerificationBanner'
import { NotificationBell } from './notifications'
import {
  LayoutDashboard, Calculator, Receipt, Wallet, Gift, Trophy,
  Award, Coins, BookOpen, FileText, Bell, HelpCircle, MessageSquare,
  ChevronDown, ChevronRight, LogOut, Settings, User, Menu, X,
  Rocket, Brain, TrendingUp, BarChart3, Target, Zap, Users,
  CreditCard, FolderOpen, Calendar, ExternalLink, Sparkles, Crown,
  Layers, MousePointer2, FileCode, Monitor, BarChart2, Copy, Lightbulb,
  Newspaper, DollarSign, Briefcase, LineChart, PieChart, Headphones
} from 'lucide-react'

// Category definitions
const CATEGORIES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trading', label: 'Trading', icon: TrendingUp },
  { id: 'financials', label: 'Financials', icon: DollarSign },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'resources', label: 'Resources', icon: BookOpen }
]

// Navigation items per category
const CATEGORY_NAV_ITEMS = {
  dashboard: [
    { path: '/accounts', icon: LayoutDashboard, label: 'Accounts' },
    { path: '/notifications', icon: Bell, label: 'Notifications', badge: '3' },
    { path: '/profile/default', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ],
  trading: [
    { path: '/trading', icon: LineChart, label: 'Trading', badge: 'PRO', badgeColor: 'bg-primary-500' },
    { path: '/quick-trading', icon: MousePointer2, label: 'Quick Trading', badge: 'NEW', badgeColor: 'bg-green-500' },
    { path: '/trade-journal', icon: BookOpen, label: 'Trade Journal', badge: 'NEW', badgeColor: 'bg-orange-500' },
    { path: '/charts-markets', icon: BarChart2, label: 'Charts & Markets', badge: 'NEW', badgeColor: 'bg-indigo-500' },
    { path: '/copy-trading', icon: Copy, label: 'Copy Trading', badge: 'NEW', badgeColor: 'bg-purple-500' },
    { path: '/mt-connection', icon: Monitor, label: 'MT4/MT5 Connect', badge: 'NEW', badgeColor: 'bg-cyan-500' }
  ],
  financials: [
    { path: '/plans', icon: CreditCard, label: 'Plans' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/calculator', icon: Calculator, label: 'Calculator' }
  ],
  rewards: [
    { path: '/infinity-points', icon: Coins, label: 'Infinity Points', badge: 'NEW', badgeColor: 'bg-yellow-500' },
    { path: '/refer-and-earn', icon: Users, label: 'Refer & Earn', badge: 'NEW', badgeColor: 'bg-green-500' },
    { path: '/competitions', icon: Trophy, label: 'Competitions' },
    { path: '/certificates', icon: Award, label: 'Certificates' }
  ],
  resources: [
    { path: '/news', icon: Newspaper, label: 'Market News', badge: 'NEW', badgeColor: 'bg-blue-500' },
    { path: '/trading-rules', icon: FileText, label: 'Trading Rules' },
    { path: '/support', icon: Headphones, label: 'Support' }
  ]
}

// Map paths to categories for auto-selection
const PATH_TO_CATEGORY = {
  '/accounts': 'dashboard',
  '/notifications': 'dashboard',
  '/profile': 'dashboard',
  '/settings': 'dashboard',
  '/sessions': 'dashboard',
  '/kyc': 'dashboard',
  '/trading': 'trading',
  '/quick-trading': 'trading',
  '/trade-journal': 'trading',
  '/charts-markets': 'trading',
  '/charts': 'trading',
  '/markets': 'trading',
  '/forex': 'trading',
  '/copy-trading': 'trading',
  '/my-profile': 'trading',
  '/followers': 'trading',
  '/trading-ideas': 'trading',
  '/mt-connection': 'trading',
  '/advanced-orders': 'trading',
  '/order-templates': 'trading',
  '/plans': 'financials',
  '/subscriptions': 'financials',
  '/transactions': 'financials',
  '/billing': 'financials',
  '/payouts': 'financials',
  '/calculator': 'financials',
  '/margin-calculator': 'financials',
  '/infinity-points': 'rewards',
  '/points': 'rewards',
  '/refer-and-earn': 'rewards',
  '/competitions': 'rewards',
  '/competition': 'rewards',
  '/my-offers': 'rewards',
  '/offers': 'rewards',
  '/certificates': 'rewards',
  '/news': 'resources',
  '/calendar': 'resources',
  '/trading-rules': 'resources',
  '/support': 'resources',
  '/support-tickets': 'resources',
  '/utilities': 'resources',
  '/resources': 'resources'
}

const DashboardLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { challenge: activeChallenge, hasActiveChallenge } = useChallenge()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Sidebar expands on hover
  const isSidebarExpanded = sidebarOpen || sidebarHovered

  // Determine active category based on current path
  const getActiveCategory = () => {
    for (const [path, category] of Object.entries(PATH_TO_CATEGORY)) {
      if (location.pathname === path || location.pathname.startsWith(path + '/')) {
        return category
      }
    }
    return 'dashboard'
  }

  const [activeCategory, setActiveCategory] = useState(getActiveCategory())

  // Update active category when route changes
  useEffect(() => {
    const newCategory = getActiveCategory()
    setActiveCategory(newCategory)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId)
    // Navigate to first item in category
    const firstItem = CATEGORY_NAV_ITEMS[categoryId]?.[0]
    if (firstItem) {
      navigate(firstItem.path)
    }
  }

  const currentNavItems = CATEGORY_NAV_ITEMS[activeCategory] || CATEGORY_NAV_ITEMS.dashboard

  const NavItem = ({ item, collapsed = false }) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')

    // Handle external links
    if (item.external) {
      return (
        <a
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-in-out group text-gray-400 hover:text-white hover:bg-dark-200"
        >
          <item.icon size={20} className="flex-shrink-0 text-gray-500 group-hover:text-primary-400 transition-colors duration-300" />
          <span className={`flex-1 font-medium whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${
            collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}>{item.label}</span>
          <ExternalLink size={14} className={`flex-shrink-0 text-gray-500 transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`} />
        </a>
      )
    }

    return (
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-in-out group ${
          isActive
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
            : 'text-gray-400 hover:text-white hover:bg-dark-200'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <item.icon size={20} className={`flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary-400'}`} />
        <span className={`flex-1 font-medium whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${
          collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
        }`}>{item.label}</span>
        {item.badge && (
          <span className={`flex-shrink-0 px-2 py-0.5 ${item.badgeColor || 'bg-primary-500/20'} ${item.badgeColor ? 'text-white' : 'text-primary-400'} text-xs font-bold rounded-full transition-all duration-300 ${
            collapsed ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
          }`}>
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  // Category Tab Component
  const CategoryTab = ({ category, isActive, onClick, isMobile = false }) => {
    const IconComponent = category.icon
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
          isActive
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
            : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
        } ${isMobile ? 'flex-1 justify-center' : ''}`}
      >
        <IconComponent size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
        <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{category.label}</span>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-dark-300 flex flex-col">
      {/* Top Header with Category Tabs */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-dark-100 border-b border-dark-200 z-50">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Logo */}
          <Link to="/accounts" className="flex items-center gap-3 flex-shrink-0">
            <img src="/logo.svg" alt="TradeSense" className="w-10 h-10 object-contain" />
            <span className="font-bold text-xl text-white hidden sm:block">
              Trade<span className="text-primary-500">Sense</span>
            </span>
          </Link>

          {/* Category Tabs - Desktop */}
          <div className="hidden lg:flex items-center gap-1 bg-dark-200/50 rounded-xl p-1 border border-white/5">
            {CATEGORIES.map(category => (
              <CategoryTab
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onClick={() => handleCategoryChange(category.id)}
              />
            ))}
          </div>

          {/* Right - User Menu */}
          <div className="flex items-center gap-4">
            {/* Challenge Status */}
            {activeChallenge && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-dark-200/50 rounded-lg border border-white/5">
                <div className={`w-2 h-2 rounded-full ${
                  activeChallenge.phase === 'funded' ? 'bg-green-500' : 'bg-primary-500'
                } animate-pulse`} />
                <span className="text-sm text-gray-400">
                  {activeChallenge.phase === 'funded' ? 'Funded' : `Phase ${activeChallenge.phase}`}
                </span>
                <span className="text-sm font-semibold text-white">
                  ${activeChallenge.balance?.toLocaleString()}
                </span>
              </div>
            )}

            {/* Notifications */}
            <NotificationBell />

            {/* User Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-200/50 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">{user?.username || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email || ''}</p>
                </div>
                <ChevronDown size={16} className="text-gray-400 hidden md:block" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-dark-100 rounded-xl border border-dark-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-2">
                  <Link
                    to="/profile/default"
                    className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-dark-200 transition-colors"
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-dark-200 transition-colors"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <hr className="my-2 border-dark-200" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:text-red-300 hover:bg-dark-200 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Category Tabs */}
      <div className="lg:hidden fixed top-16 left-0 right-0 bg-dark-100 border-b border-dark-200 z-40 overflow-x-auto">
        <div className="flex items-center gap-1 p-2 min-w-max">
          {CATEGORIES.map(category => (
            <CategoryTab
              key={category.id}
              category={category}
              isActive={activeCategory === category.id}
              onClick={() => handleCategoryChange(category.id)}
              isMobile
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 pt-16 lg:pt-16">
        {/* Desktop Sidebar - Collapsed by default, expands on hover */}
        <aside
          className={`hidden lg:flex flex-col fixed top-16 left-0 h-[calc(100vh-64px)] bg-dark-100 border-r border-dark-200 z-40 transition-[width] duration-500 ease-in-out ${
            isSidebarExpanded ? 'w-64' : 'w-16'
          }`}
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        >
          {/* Category Title */}
          <div className={`px-4 border-b border-dark-200 overflow-hidden transition-all duration-500 ease-in-out ${
            isSidebarExpanded ? 'py-4 opacity-100 max-h-20' : 'py-0 opacity-0 max-h-0'
          }`}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
              {CATEGORIES.find(c => c.id === activeCategory)?.label}
            </h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2 overflow-y-auto overflow-x-hidden">
            <div className="space-y-1">
              {currentNavItems.map(item => (
                <NavItem key={item.path} item={item} collapsed={!isSidebarExpanded} />
              ))}
            </div>
          </nav>

          {/* Action Button */}
          <div className="p-2 border-t border-dark-200">
            <Link
              to={hasActiveChallenge ? "/trading" : "/plans"}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 overflow-hidden"
            >
              <span className="flex-shrink-0">
                {hasActiveChallenge ? <TrendingUp size={18} /> : <Rocket size={18} />}
              </span>
              <span className={`whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden ${
                isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
              }`}>
                {hasActiveChallenge ? 'Go Trading' : 'Start Challenge'}
              </span>
            </Link>
          </div>
        </aside>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40 pt-28" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`lg:hidden fixed top-28 left-0 h-[calc(100vh-112px)] w-72 bg-dark-100 border-r border-dark-200 z-50 transform transition-transform duration-300 overflow-y-auto ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Category Title */}
          <div className="px-4 py-4 border-b border-dark-200">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              {CATEGORIES.find(c => c.id === activeCategory)?.label}
            </h2>
          </div>

          <nav className="py-4 px-3">
            <div className="space-y-1">
              {currentNavItems.map(item => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </nav>

          <div className="p-4 border-t border-dark-200">
            <Link
              to={hasActiveChallenge ? "/trading" : "/plans"}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/25"
              onClick={() => setMobileMenuOpen(false)}
            >
              {hasActiveChallenge ? <TrendingUp size={18} /> : <Rocket size={18} />}
              <span>{hasActiveChallenge ? 'Go Trading' : 'Start Challenge'}</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 transition-all duration-300 lg:ml-16 mt-12 lg:mt-0">
          {/* Email Verification Banner */}
          <EmailVerificationBanner />

          {/* Page Content */}
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
