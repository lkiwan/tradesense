import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import AdminSidebar from './AdminSidebar'
import {
  Menu, X, Bell, Search, ChevronRight, LogOut, User, Settings,
  Home, RefreshCw, ChevronDown
} from 'lucide-react'

const AdminLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const isSuperAdmin = user?.role === 'superadmin'

  // Sidebar closed by default on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu-container')) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [userMenuOpen])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Generate breadcrumbs from path
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean)
    const breadcrumbs = []
    let currentPath = ''

    paths.forEach((path, index) => {
      currentPath += `/${path}`
      breadcrumbs.push({
        label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
        path: currentPath,
        isLast: index === paths.length - 1
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <div className="min-h-screen bg-dark-300 overflow-x-hidden max-w-[100vw]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className={`transition-all duration-300 overflow-x-hidden ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-dark-100 border-b border-dark-200">
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 max-w-[100vw]">
            {/* Left side */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              {/* Toggle button - always visible */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-200 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* Breadcrumbs - hidden on mobile */}
              <nav className="hidden md:flex items-center gap-2 text-sm min-w-0">
                <Link to="/" className="text-gray-500 hover:text-white flex-shrink-0">
                  <Home size={16} />
                </Link>
                {breadcrumbs.slice(0, 3).map((crumb, index) => (
                  <div key={crumb.path} className="flex items-center gap-2 min-w-0">
                    <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />
                    {crumb.isLast ? (
                      <span className="text-white font-medium truncate">{crumb.label}</span>
                    ) : (
                      <Link to={crumb.path} className="text-gray-500 hover:text-white truncate">
                        {crumb.label}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>

              {/* Mobile title */}
              <span className="md:hidden text-white font-medium text-sm truncate">
                {breadcrumbs[breadcrumbs.length - 1]?.label || 'Admin'}
              </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              {/* Search - hidden on mobile */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-dark-200 rounded-lg">
                <Search size={16} className="text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-32 xl:w-48"
                />
              </div>

              {/* Refresh */}
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-200 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-white hover:bg-dark-200 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="relative user-menu-container">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-dark-200 rounded-lg transition-colors min-h-[44px] touch-manipulation"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSuperAdmin ? 'bg-purple-500' : 'bg-primary'}`}>
                    <span className="text-white text-sm font-semibold">
                      {user?.username?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white">{user?.username}</p>
                    <p className={`text-xs ${isSuperAdmin ? 'text-purple-400' : 'text-primary'}`}>
                      {isSuperAdmin ? 'SuperAdmin' : 'Admin'}
                    </p>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 hidden sm:block transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-dark-100 border border-dark-200 rounded-xl shadow-2xl py-2 z-[100]">
                    <Link
                      to="/accounts"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-dark-200 min-h-[48px] touch-manipulation"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Home size={18} />
                      Back to Dashboard
                    </Link>
                    <Link
                      to="/profile/default"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-dark-200 min-h-[48px] touch-manipulation"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User size={18} />
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-dark-200 min-h-[48px] touch-manipulation"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings size={18} />
                      Settings
                    </Link>
                    <hr className="my-2 border-dark-200" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-dark-200 min-h-[48px] touch-manipulation"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
