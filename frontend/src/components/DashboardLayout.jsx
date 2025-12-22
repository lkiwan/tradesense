import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChallenge } from '../context/ChallengeContext'
import {
  LayoutDashboard, Calculator, Receipt, Wallet, Gift, Trophy,
  Award, Coins, BookOpen, FileText, Bell, HelpCircle, MessageSquare,
  ChevronDown, ChevronRight, LogOut, Settings, User, Menu, X,
  Rocket, Brain, TrendingUp, BarChart3, Target, Zap
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

  const mainNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Mes Comptes' },
    { path: '/dashboard/signals', icon: Brain, label: 'Signaux IA' },
    { path: '/dashboard/calculator', icon: Calculator, label: 'Calculateur' },
    { path: '/dashboard/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/dashboard/payouts', icon: Wallet, label: 'Retraits' },
  ]

  const rewardsItems = [
    { path: '/dashboard/offers', icon: Gift, label: 'Mes Offres', badge: '2' },
    { path: '/dashboard/competitions', icon: Trophy, label: 'Compétitions' },
    { path: '/dashboard/certificates', icon: Award, label: 'Certificats' },
    { path: '/dashboard/points', icon: Coins, label: 'Points Fidélité' },
  ]

  const supportItems = [
    { path: '/dashboard/resources', icon: BookOpen, label: 'Ressources' },
    { path: '/dashboard/rules', icon: FileText, label: 'Règles de Trading' },
    { path: '/dashboard/notifications', icon: Bell, label: 'Notifications', badge: '3' },
    { path: '/faq', icon: HelpCircle, label: 'FAQ' },
    { path: '/dashboard/support', icon: MessageSquare, label: 'Support' },
  ]

  const NavItem = ({ item, collapsed = false }) => {
    const isActive = location.pathname === item.path
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
              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-bold rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
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
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">T</span>
            </div>
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
              </div>
            )}
          </div>

          {/* Help & Support */}
          <div className="mt-6">
            <SectionHeader
              title="Aide & Support"
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
              </div>
            )}
          </div>
        </nav>

        {/* Start Challenge Button */}
        <div className="p-4 border-t border-dark-200">
          <Link
            to="/pricing"
            className={`flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all ${
              sidebarOpen ? '' : 'px-0'
            }`}
          >
            <Rocket size={18} />
            {sidebarOpen && <span>Nouveau Challenge</span>}
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
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">T</span>
          </div>
          <span className="font-bold text-lg text-white">TradeSense</span>
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
              </div>
            )}
          </div>

          <div className="mt-6">
            <SectionHeader
              title="Aide & Support"
              section="support"
              expanded={expandedSections.support}
              onToggle={() => toggleSection('support')}
            />
            {expandedSections.support && (
              <div className="space-y-1 mt-2">
                {supportItems.map(item => (
                  <NavItem key={item.path} item={item} />
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-dark-200">
          <Link
            to="/pricing"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Rocket size={18} />
            <span>Nouveau Challenge</span>
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
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

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
                      to="/dashboard/profile"
                      className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-dark-200 transition-colors"
                    >
                      <User size={16} />
                      <span>Mon Profil</span>
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-dark-200 transition-colors"
                    >
                      <Settings size={16} />
                      <span>Paramètres</span>
                    </Link>
                    <hr className="my-2 border-dark-200" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:text-red-300 hover:bg-dark-200 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
