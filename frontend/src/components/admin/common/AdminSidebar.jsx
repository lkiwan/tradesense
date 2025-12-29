import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import {
  LayoutDashboard, Users, Trophy, CreditCard, Wallet, HelpCircle,
  Settings, Shield, BarChart3, Bell, ChevronDown, ChevronRight,
  Activity, FileText, Lock, Server, Sliders, UserCog, AlertTriangle,
  TrendingUp, PieChart, Send, Ban, Database, Globe, Key, X
} from 'lucide-react'

const AdminSidebar = ({ isOpen = true, onClose }) => {
  const location = useLocation()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'superadmin'
  const [expandedSections, setExpandedSections] = useState({
    users: true,
    financial: false,
    system: true,
    security: false
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  // Admin navigation items
  const adminNavItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]

  const userManagementItems = [
    { path: '/admin/users', icon: Users, label: 'All Users' },
    { path: '/admin/kyc-review', icon: FileText, label: 'KYC Review' },
  ]

  const challengeItems = [
    { path: '/admin/challenges', icon: Trophy, label: 'Challenges' },
  ]

  const financialItems = [
    { path: '/admin/financial', icon: TrendingUp, label: 'Overview' },
    { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { path: '/admin/payouts', icon: Wallet, label: 'Payouts' },
  ]

  const supportItems = [
    { path: '/admin/tickets', icon: HelpCircle, label: 'Support Tickets' },
    { path: '/admin/activity', icon: Activity, label: 'User Activity' },
  ]

  // SuperAdmin exclusive items
  const systemItems = [
    { path: '/superadmin/config', icon: Settings, label: 'System Config' },
    { path: '/superadmin/trading', icon: Sliders, label: 'Trading Config' },
    { path: '/superadmin/platform', icon: Server, label: 'Platform Control' },
  ]

  const adminManagementItems = [
    { path: '/superadmin/admins', icon: UserCog, label: 'Admin Management' },
    { path: '/superadmin/permissions', icon: Key, label: 'Permissions' },
    { path: '/superadmin/admin-activity', icon: Activity, label: 'Admin Activity' },
  ]

  const analyticsItems = [
    { path: '/superadmin/analytics', icon: BarChart3, label: 'Advanced Analytics' },
    { path: '/superadmin/cohorts', icon: PieChart, label: 'User Cohorts' },
  ]

  const securityItems = [
    { path: '/superadmin/audit-logs', icon: Shield, label: 'Audit Logs' },
    { path: '/superadmin/login-monitoring', icon: Lock, label: 'Login Monitoring' },
    { path: '/superadmin/blocked-ips', icon: Ban, label: 'Blocked IPs' },
  ]

  const userControlItems = [
    { path: '/superadmin/bulk-actions', icon: Database, label: 'Bulk Actions' },
    { path: '/superadmin/user-control', icon: Users, label: 'User Control' },
  ]

  const notificationItems = [
    { path: '/superadmin/notifications', icon: Send, label: 'Notification Center' },
  ]

  const NavItem = ({ item }) => (
    <Link
      to={item.path}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-h-[48px] touch-manipulation ${
        isActive(item.path)
          ? 'bg-primary text-white'
          : 'text-gray-400 hover:text-white hover:bg-dark-200'
      }`}
      onClick={() => onClose && onClose()}
    >
      <item.icon size={18} className="flex-shrink-0" />
      <span className="text-sm font-medium">{item.label}</span>
      {item.badge && (
        <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${item.badgeColor || 'bg-primary'} text-white`}>
          {item.badge}
        </span>
      )}
    </Link>
  )

  const NavSection = ({ title, items, sectionKey, icon: Icon }) => (
    <div className="mb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-400 min-h-[40px] touch-manipulation"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} />}
          <span>{title}</span>
        </div>
        {expandedSections[sectionKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {expandedSections[sectionKey] && (
        <div className="mt-1 space-y-1">
          {items.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-dark-100 border-r border-dark-200 z-50 transition-transform duration-300 ease-in-out w-64 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-dark-200 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <img src="/logo.svg" alt="TradeSense" className="w-8 h-8 object-contain" />
            <div>
              <span className="text-white font-bold text-lg">Trade<span className="text-primary-500">Sense</span></span>
              <span className={`block text-xs ${isSuperAdmin ? 'text-purple-400' : 'text-primary-400'}`}>
                {isSuperAdmin ? 'SuperAdmin' : 'Admin'}
              </span>
            </div>
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-dark-200 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-hide">
          {/* Main Dashboard */}
          <div className="mb-4 space-y-1">
            {adminNavItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>

          {/* User Management */}
          <NavSection
            title="User Management"
            items={userManagementItems}
            sectionKey="users"
            icon={Users}
          />

          {/* Challenges */}
          <div className="mb-4 space-y-1">
            {challengeItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>

          {/* Financial */}
          <NavSection
            title="Financial"
            items={financialItems}
            sectionKey="financial"
            icon={CreditCard}
          />

          {/* Support */}
          <div className="mb-4 space-y-1">
            {supportItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>

          {/* SuperAdmin Only Sections */}
          {isSuperAdmin && (
            <>
              <div className="my-4 border-t border-dark-200 pt-4">
                <span className="px-4 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  SuperAdmin
                </span>
              </div>

              {/* System Configuration */}
              <NavSection
                title="System"
                items={systemItems}
                sectionKey="system"
                icon={Server}
              />

              {/* Admin Management */}
              <div className="mb-4 space-y-1">
                {adminManagementItems.map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </div>

              {/* Analytics */}
              <div className="mb-4 space-y-1">
                {analyticsItems.map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </div>

              {/* Security */}
              <NavSection
                title="Security"
                items={securityItems}
                sectionKey="security"
                icon={Shield}
              />

              {/* User Control */}
              <div className="mb-4 space-y-1">
                {userControlItems.map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </div>

              {/* Notifications */}
              <div className="mb-4 space-y-1">
                {notificationItems.map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-dark-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isSuperAdmin ? 'bg-purple-500' : 'bg-primary'}`}>
              <span className="text-white font-semibold">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default AdminSidebar
