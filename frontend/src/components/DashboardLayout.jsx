import { useState } from 'react'
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
  Newspaper
} from 'lucide-react'

const DashboardLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { activeChallenge } = useChallenge()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    rewards: true,
    support: false
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Main Navigation Items
  const mainNavItems = [
    { path: '/accounts', icon: LayoutDashboard, label: 'Accounts' },
    { path: '/margin-calculator', icon: Calculator, label: 'Calculator' },
    { path: '/billing/billing-history', icon: Receipt, label: 'Transactions' },
    { path: '/notifications', icon: Bell, label: 'Notifications', badge: '3' },
    { path: '/support-tickets', icon: MessageSquare, label: 'Support Tickets' },
    { path: '/plans', icon: CreditCard, label: 'Plans' },
    { path: '/subscriptions', icon: Crown, label: 'Premium', badge: 'NEW', badgeColor: 'bg-yellow-500' },
    { path: '/profile/default', icon: User, label: 'Profile' },
  ]

  // Rewards Hub Items with sub-menu for Infinity Points
  const rewardsItems = [
    { path: '/refer-and-earn', icon: Users, label: 'Refer & Earn', badge: 'NEW', badgeColor: 'bg-green-500' },
    { path: '/my-offers', icon: Gift, label: 'My Offers', badge: '2' },
    { path: '/competition', icon: Trophy, label: 'Competitions' },
    { path: '/certificates', icon: Award, label: 'Certificates' },
  ]

  // Infinity Points Sub-items
  const infinityPointsItems = [
    { path: '/infinity-points', icon: Sparkles, label: 'Activities' },
    { path: '/infinity-points/profile', icon: BarChart3, label: 'My Points' },
    { path: '/infinity-points/history', icon: FileText, label: 'History' },
    { path: '/infinity-points/rewards', icon: Gift, label: 'Rewards Store', badge: 'NEW', badgeColor: 'bg-yellow-500' },
  ]

  // Trading Tools Items
  const tradingToolsItems = [
    { path: '/advanced-orders', icon: Layers, label: 'Advanced Orders', badge: 'NEW', badgeColor: 'bg-blue-500' },
    { path: '/quick-trading', icon: MousePointer2, label: 'Quick Trading', badge: 'NEW', badgeColor: 'bg-green-500' },
    { path: '/order-templates', icon: FileCode, label: 'Order Templates', badge: 'NEW', badgeColor: 'bg-purple-500' },
    { path: '/trade-journal', icon: BookOpen, label: 'Trade Journal', badge: 'NEW', badgeColor: 'bg-orange-500' },
    { path: '/mt-connection', icon: Monitor, label: 'MT4/MT5 Connect', badge: 'NEW', badgeColor: 'bg-cyan-500' },
    { path: '/charts', icon: BarChart2, label: 'Advanced Charts', badge: 'NEW', badgeColor: 'bg-indigo-500' },
  ]

  // Social Trading Items
  const socialTradingItems = [
    { path: '/my-profile', icon: User, label: 'My Trader Profile', badge: 'NEW', badgeColor: 'bg-pink-500' },
    { path: '/followers', icon: Users, label: 'Followers & Network', badge: 'NEW', badgeColor: 'bg-pink-500' },
    { path: '/copy-trading', icon: Copy, label: 'Copy Trading', badge: 'NEW', badgeColor: 'bg-purple-500' },
    { path: '/trading-ideas', icon: Lightbulb, label: 'Trading Ideas', badge: 'NEW', badgeColor: 'bg-yellow-500' },
  ]

  // Help & Support Items
  const supportItems = [
    { path: '/utilities', icon: FolderOpen, label: 'Files & Utilities' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/news', icon: Newspaper, label: 'Market News', badge: 'NEW', badgeColor: 'bg-blue-500' },
    { path: 'https://fundednext.com/symbols', icon: ExternalLink, label: 'Symbols', external: true },
  ]

  // Trading Rules & FAQ (External Links)
  const externalLinks = [
    { path: 'https://help.fundednext.com/en/collections/11026230-trading-rules-guidelines', label: 'Trading Rules (CFDs)', external: true },
    { path: 'https://helpfutures.fundednext.com/en/collections/12136956-trading-rules-guidelines', label: 'Trading Rules (Futures)', external: true },
    { path: 'https://help.fundednext.com/en/', label: 'FAQ (CFDs)', external: true },
    { path: 'https://helpfutures.fundednext.com/en/', label: 'FAQ (Futures)', external: true },
  ]

  // Expanded sections state - add infinity points
  const [infinityExpanded, setInfinityExpanded] = useState(false)

  const NavItem = ({ item, collapsed = false }) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')

    // Handle external links
    if (item.external) {
      return (
        <a
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group text-gray-400 hover:text-white hover:bg-dark-200"
        >
          <item.icon size={20} className="text-gray-500 group-hover:text-primary-400" />
          {!collapsed && (
            <>
              <span className="flex-1 font-medium">{item.label}</span>
              <ExternalLink size={14} className="text-gray-500" />
            </>
          )}
        </a>
      )
    }

    return (
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
          isActive
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
            : 'text-gray-400 hover:text-white hover:bg-dark-200'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary-400'} />
        {!collapsed && (
          <>
            <span className="flex-1 font-medium">{item.label}</span>
            {item.badge && (
              <span className={`px-2 py-0.5 ${item.badgeColor || 'bg-primary-500/20'} ${item.badgeColor ? 'text-white' : 'text-primary-400'} text-xs font-bold rounded-full`}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  // Infinity Points expandable section
  const InfinityPointsSection = ({ collapsed }) => {
    const isAnyActive = infinityPointsItems.some(item =>
      location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    )

    return (
      <div>
        <button
          onClick={() => setInfinityExpanded(!infinityExpanded)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
            isAnyActive
              ? 'bg-primary-500/10 text-primary-400'
              : 'text-gray-400 hover:text-white hover:bg-dark-200'
          }`}
        >
          <Coins size={20} className={isAnyActive ? 'text-primary-400' : 'text-gray-500 group-hover:text-primary-400'} />
          {!collapsed && (
            <>
              <span className="flex-1 font-medium text-left">Infinity Points</span>
              <ChevronDown size={16} className={`transition-transform ${infinityExpanded ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
        {infinityExpanded && !collapsed && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-dark-200 pl-3">
            {infinityPointsItems.map(item => (
              <NavItem key={item.path} item={item} collapsed={collapsed} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const SectionHeader = ({ title, section, expanded, onToggle, collapsed = false }) => {
    if (collapsed) return null
    return (
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-400 transition-colors"
      >
        <span>{title}</span>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-dark-300 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-full bg-dark-100 border-r border-dark-200 transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-dark-200">
          <Link to="/accounts" className="flex items-center gap-3">
            <img src="/logo.svg" alt="TradeSense" className="w-10 h-10 object-contain flex-shrink-0" />
            {sidebarOpen && (
              <span className="font-bold text-xl text-white">
                Trade<span className="text-primary-500">Sense</span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {/* Main Nav */}
          <div className="space-y-1">
            {mainNavItems.map(item => (
              <NavItem key={item.path} item={item} collapsed={!sidebarOpen} />
            ))}
          </div>

          {/* Rewards Hub */}
          <div className="mt-6">
            <SectionHeader
              title="Rewards Hub"
              section="rewards"
              expanded={expandedSections.rewards}
              onToggle={() => toggleSection('rewards')}
              collapsed={!sidebarOpen}
            />
            {(expandedSections.rewards || !sidebarOpen) && (
              <div className="space-y-1 mt-2">
                {rewardsItems.map(item => (
                  <NavItem key={item.path} item={item} collapsed={!sidebarOpen} />
                ))}
                {/* Infinity Points Sub-section */}
                <InfinityPointsSection collapsed={!sidebarOpen} />
              </div>
            )}
          </div>

          {/* Trading Tools */}
          <div className="mt-6">
            {!sidebarOpen ? null : (
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Trading Tools
              </div>
            )}
            <div className="space-y-1 mt-2">
              {tradingToolsItems.map(item => (
                <NavItem key={item.path} item={item} collapsed={!sidebarOpen} />
              ))}
            </div>
          </div>

          {/* Social Trading */}
          <div className="mt-6">
            {!sidebarOpen ? null : (
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Social Trading
              </div>
            )}
            <div className="space-y-1 mt-2">
              {socialTradingItems.map(item => (
                <NavItem key={item.path} item={item} collapsed={!sidebarOpen} />
              ))}
            </div>
          </div>

          {/* Help & Support */}
          <div className="mt-6">
            <SectionHeader
              title="Help & Support"
              section="support"
              expanded={expandedSections.support}
              onToggle={() => toggleSection('support')}
              collapsed={!sidebarOpen}
            />
            {(expandedSections.support || !sidebarOpen) && (
              <div className="space-y-1 mt-2">
                {supportItems.map(item => (
                  <NavItem key={item.path} item={item} collapsed={!sidebarOpen} />
                ))}
                {/* External Links */}
                <div className="pt-2 mt-2 border-t border-dark-200">
                  {externalLinks.map(link => (
                    <a
                      key={link.path}
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
                    >
                      <ExternalLink size={14} />
                      {!(!sidebarOpen) && <span>{link.label}</span>}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Start Challenge Button */}
        <div className="p-4 border-t border-dark-200">
          <Link
            to="/plans"
            className={`flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all ${
              sidebarOpen ? '' : 'px-0'
            }`}
          >
            <Rocket size={18} />
            {sidebarOpen && <span>Start Challenge</span>}
          </Link>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-dark-100 border border-dark-200 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronRight size={14} /> : <ChevronRight size={14} className="rotate-180" />}
        </button>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-dark-100 border-b border-dark-200 flex items-center justify-between px-4 z-40">
        <Link to="/accounts" className="flex items-center gap-2">
          <img src="/logo.svg" alt="TradeSense" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg text-white">Trade<span className="text-primary-500">Sense</span></span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-16 left-0 h-[calc(100vh-64px)] w-72 bg-dark-100 border-r border-dark-200 z-50 transform transition-transform duration-300 overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="py-4 px-3">
          <div className="space-y-1">
            {mainNavItems.map(item => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>

          <div className="mt-6">
            <SectionHeader
              title="Rewards Hub"
              section="rewards"
              expanded={expandedSections.rewards}
              onToggle={() => toggleSection('rewards')}
            />
            {expandedSections.rewards && (
              <div className="space-y-1 mt-2">
                {rewardsItems.map(item => (
                  <NavItem key={item.path} item={item} />
                ))}
                {/* Infinity Points Sub-section */}
                <InfinityPointsSection collapsed={false} />
              </div>
            )}
          </div>

          {/* Trading Tools - Mobile */}
          <div className="mt-6">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Trading Tools
            </div>
            <div className="space-y-1 mt-2">
              {tradingToolsItems.map(item => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </div>

          {/* Social Trading - Mobile */}
          <div className="mt-6">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Social Trading
            </div>
            <div className="space-y-1 mt-2">
              {socialTradingItems.map(item => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <SectionHeader
              title="Help & Support"
              section="support"
              expanded={expandedSections.support}
              onToggle={() => toggleSection('support')}
            />
            {expandedSections.support && (
              <div className="space-y-1 mt-2">
                {supportItems.map(item => (
                  <NavItem key={item.path} item={item} />
                ))}
                {/* External Links */}
                <div className="pt-2 mt-2 border-t border-dark-200">
                  {externalLinks.map(link => (
                    <a
                      key={link.path}
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
                    >
                      <ExternalLink size={14} />
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-dark-200">
          <Link
            to="/plans"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Rocket size={18} />
            <span>Start Challenge</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Header */}
        <header className="sticky top-0 lg:top-0 h-16 lg:h-auto bg-dark-200/80 backdrop-blur-xl border-b border-dark-200 z-30 mt-16 lg:mt-0">
          <div className="flex items-center justify-between h-full lg:h-16 px-4 lg:px-8">
            {/* Left - Breadcrumb or Title */}
            <div className="flex items-center gap-4">
              {activeChallenge && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-dark-100 rounded-lg">
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
            </div>

            {/* Right - User Menu */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationBell />

              {/* User Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-100 transition-colors">
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
            </div>
          </div>
        </header>

        {/* Email Verification Banner */}
        <EmailVerificationBanner />

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
