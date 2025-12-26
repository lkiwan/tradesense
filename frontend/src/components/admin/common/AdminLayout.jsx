import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import AdminSidebar from './AdminSidebar'
import {
  Menu, X, Bell, Search, ChevronRight, LogOut, User, Settings,
  Home, RefreshCw
} from 'lucide-react'

const AdminLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  // Derive isSuperAdmin from user role instead of prop
  const isSuperAdmin = user?.role === 'superadmin'
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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
    <div className="min-h-screen bg-dark-300">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-dark-100 border-b border-dark-200">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-200 rounded-lg transition-colors hidden lg:block"
              >
                <Menu size={20} />
              </button>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-200 rounded-lg transition-colors lg:hidden"
              >
                <Menu size={20} />
              </button>

              {/* Breadcrumbs */}
              <nav className="hidden md:flex items-center gap-2 text-sm">
                <Link to="/" className="text-gray-500 hover:text-white">
                  <Home size={16} />
                </Link>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.path} className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-gray-600" />
                    {crumb.isLast ? (
                      <span className="text-white font-medium">{crumb.label}</span>
                    ) : (
                      <Link to={crumb.path} className="text-gray-500 hover:text-white">
                        {crumb.label}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-dark-200 rounded-lg">
                <Search size={16} className="text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users, challenges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-48"
                />
              </div>

              {/* Refresh */}
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-200 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-white hover:bg-dark-200 rounded-lg transition-colors">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-dark-200 rounded-lg transition-colors"
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
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-100 border border-dark-200 rounded-lg shadow-xl py-1 z-50">
                    <Link
                      to="/accounts"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-dark-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Home size={16} />
                      Back to Dashboard
                    </Link>
                    <Link
                      to="/profile/default"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-dark-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User size={16} />
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-dark-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings size={16} />
                      Settings
                    </Link>
                    <hr className="my-1 border-dark-200" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-dark-200"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
