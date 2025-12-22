import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import { useChallenge } from './context/ChallengeContext'

// Layout
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import DashboardLayout from './components/DashboardLayout'

// Pages
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Pricing from './pages/Pricing'
import Checkout from './pages/Checkout'
import LeaderboardPage from './pages/LeaderboardPage'
import MasterClass from './pages/MasterClass'
import Community from './pages/Community'
import News from './pages/News'
import FreeTrial from './pages/FreeTrial'
import TrialCheckout from './pages/TrialCheckout'
import TrialConfirm from './pages/TrialConfirm'
import AdminPanel from './pages/AdminPanel'
import SuperAdmin from './pages/SuperAdmin'
// New Pages
import HowItWorks from './pages/HowItWorks'
import EconomicCalendar from './pages/EconomicCalendar'
import Academy from './pages/Academy'
import Affiliate from './pages/Partners'
import HallOfFame from './pages/HallOfFame'
import About from './pages/About'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'

// Dashboard Pages
import {
  DashboardHome,
  SignalsPage,
  CalculatorPage,
  TransactionsPage,
  PayoutsPage,
  OffersPage,
  CompetitionsPage,
  CertificatesPage,
  PointsPage,
  ResourcesPage,
  TradingRulesPage,
  NotificationsPage,
  SupportPage,
  ProfilePage,
  SettingsPage
} from './pages/dashboard'

/**
 * Enhanced Protected Route Component
 * Supports multiple access control conditions:
 * - requiresAuth: Must be logged in
 * - requiresChallenge: Must have an active challenge/funded account
 * - adminOnly: Must be admin or superadmin
 * - superAdminOnly: Must be superadmin
 * - redirectTo: Custom redirect path when conditions fail
 */
const ProtectedRoute = ({
  children,
  requiresAuth = true,
  requiresChallenge = false,
  adminOnly = false,
  superAdminOnly = false,
  redirectTo = null
}) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { hasActiveChallenge, loading: challengeLoading } = useChallenge()

  // Show loading state while checking auth/challenge status
  if (authLoading || (requiresChallenge && challengeLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-200">
        <div className="spinner"></div>
      </div>
    )
  }

  // Check authentication
  if (requiresAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check challenge requirement (must have active challenge to access dashboard)
  if (requiresChallenge && !hasActiveChallenge) {
    return <Navigate to={redirectTo || '/pricing'} replace />
  }

  // Check superadmin role
  if (superAdminOnly && user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  // Check admin role
  if (adminOnly && !['admin', 'superadmin'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

/**
 * Auth-only Route - For pages that require login but no challenge
 * (MasterClass, Community)
 */
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-200">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

/**
 * Guest-only Route - Redirect authenticated users away from login/register
 */
const GuestRoute = ({ children, redirectTo = '/home' }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-200">
        <div className="spinner"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

/**
 * Smart Home Route - Redirects authenticated users based on their challenge status
 */
const SmartHomeRoute = () => {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { hasActiveChallenge, loading: challengeLoading } = useChallenge()

  if (authLoading || challengeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-200">
        <div className="spinner"></div>
      </div>
    )
  }

  // Not authenticated - show landing page
  if (!isAuthenticated) {
    return <LandingPage />
  }

  // Authenticated with challenge - go to dashboard
  if (hasActiveChallenge) {
    return <Navigate to="/dashboard" replace />
  }

  // Authenticated without challenge - go to pricing to get a plan
  return <Navigate to="/pricing" replace />
}

/**
 * Smart Auth Home Redirect - Redirects authenticated users based on challenge status
 */
const SmartAuthHomeRedirect = () => {
  const { hasActiveChallenge, loading } = useChallenge()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-200">
        <div className="spinner"></div>
      </div>
    )
  }

  // Has challenge - go to dashboard
  if (hasActiveChallenge) {
    return <Navigate to="/dashboard" replace />
  }

  // No challenge - go to pricing
  return <Navigate to="/pricing" replace />
}

/**
 * Trial Block Route - Block if user already has a challenge
 */
const TrialBlockRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const { hasActiveChallenge, loading } = useChallenge()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-200">
        <div className="spinner"></div>
      </div>
    )
  }

  // If authenticated and has active challenge, redirect to dashboard
  if (isAuthenticated && hasActiveChallenge) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  const { isDark } = useTheme()
  const location = useLocation()

  // Check if we're on a dashboard route
  const isDashboardRoute = location.pathname.startsWith('/dashboard')

  return (
    <div className={`${isDark ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white transition-colors duration-300">
        {/* Only show Navbar on non-dashboard routes */}
        {!isDashboardRoute && <Navbar />}

        <main className={isDashboardRoute ? '' : 'pt-[100px]'}>
          <Routes>
            {/* ==================== SMART HOME ROUTE ==================== */}
            {/* Landing for guests, redirect for authenticated users */}
            <Route path="/" element={<SmartHomeRoute />} />

            {/* ==================== PUBLIC ROUTES ==================== */}
            {/* Anyone can access these */}
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/news" element={<News />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/calendar" element={<EconomicCalendar />} />
            <Route path="/academy" element={<Academy />} />
            <Route path="/partners" element={<Affiliate />} />
            <Route path="/hall-of-fame" element={<HallOfFame />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />

            {/* ==================== HOME ROUTE FOR AUTHENTICATED USERS ==================== */}
            {/* Smart redirect based on challenge status */}
            <Route path="/home" element={
              <AuthRoute>
                <SmartAuthHomeRedirect />
              </AuthRoute>
            } />

            {/* ==================== GUEST-ONLY ROUTES ==================== */}
            {/* Redirect to pricing after login (to get a plan) */}
            <Route path="/login" element={
              <GuestRoute redirectTo="/home">
                <Login />
              </GuestRoute>
            } />
            <Route path="/register" element={
              <GuestRoute redirectTo="/pricing">
                <Register />
              </GuestRoute>
            } />

            {/* ==================== AUTH-REQUIRED ROUTES ==================== */}
            {/* Require login but NOT challenge (MasterClass, Community) */}
            <Route path="/masterclass" element={
              <AuthRoute>
                <MasterClass />
              </AuthRoute>
            } />
            <Route path="/community" element={
              <AuthRoute>
                <Community />
              </AuthRoute>
            } />

            {/* ==================== FREE TRIAL ROUTES ==================== */}
            {/* Block if user already has a challenge */}
            <Route path="/free-trial" element={
              <TrialBlockRoute>
                <FreeTrial />
              </TrialBlockRoute>
            } />

            {/* ==================== DASHBOARD ROUTES ==================== */}
            {/* All dashboard routes wrapped with DashboardLayout */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <DashboardHome />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/signals" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <SignalsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/calculator" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <CalculatorPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/transactions" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <TransactionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/payouts" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <PayoutsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/offers" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <OffersPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/competitions" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <CompetitionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/certificates" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <CertificatesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/points" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <PointsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/resources" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <ResourcesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/rules" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <TradingRulesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/notifications" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <NotificationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/support" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <SupportPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/profile" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/settings" element={
              <ProtectedRoute requiresChallenge redirectTo="/pricing">
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* ==================== CHECKOUT ROUTES ==================== */}
            {/* Trial checkout routes - must come before :planType */}
            <Route path="/checkout/trial" element={
              <ProtectedRoute>
                <TrialCheckout />
              </ProtectedRoute>
            } />
            <Route path="/checkout/trial/confirm" element={
              <ProtectedRoute>
                <TrialConfirm />
              </ProtectedRoute>
            } />

            {/* Regular checkout */}
            <Route path="/checkout/:planType" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />

            {/* ==================== ADMIN ROUTES ==================== */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/superadmin" element={
              <ProtectedRoute superAdminOnly>
                <SuperAdmin />
              </ProtectedRoute>
            } />

            {/* ==================== 404 REDIRECT ==================== */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Only show Footer on non-dashboard routes */}
        {!isDashboardRoute && <Footer />}

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: isDark ? '#1e293b' : '#fff',
              color: isDark ? '#fff' : '#1e293b',
              border: isDark ? '1px solid #334155' : '1px solid #e2e8f0'
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff'
              }
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff'
              }
            }
          }}
        />
      </div>
    </div>
  )
}

export default App
