import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import { useChallenge } from './context/ChallengeContext'

// Layout
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import DashboardLayout from './components/DashboardLayout'
import ErrorBoundary from './components/common/ErrorBoundary'
import ScrollToTop from './components/ScrollToTop'
import GlobalAIAssistant from './components/GlobalAIAssistant'

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
import VerifyEmail from './pages/VerifyEmail'
import EmailVerificationSent from './pages/EmailVerificationSent'
import TwoFactorSetup from './pages/TwoFactorSetup'
import TwoFactorVerify from './pages/TwoFactorVerify'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ChallengeCheckout from './pages/ChallengeCheckout'

// Public Trader Profile
import TraderProfile from './pages/public/TraderProfile'

// Blog Pages
import BlogPage from './pages/public/BlogPage'
import BlogPostPage from './pages/public/BlogPostPage'

// Webinar Pages
import WebinarsPage from './pages/public/WebinarsPage'
import WebinarDetailPage from './pages/public/WebinarDetailPage'

// Admin Pages
import BlogManagementPage from './pages/admin/BlogManagementPage'
import WebinarManagementPage from './pages/admin/WebinarManagementPage'
import EventsManagementPage from './pages/admin/EventsManagementPage'
import AnalyticsDashboardPage from './pages/admin/AnalyticsDashboardPage'

// Admin Layout
import AdminLayout from './components/admin/common/AdminLayout'

// New Admin Dashboard Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'

// Admin User Management Pages
import UsersListPage from './pages/admin/users/UsersListPage'
import UserDetailPage from './pages/admin/users/UserDetailPage'
import GrantChallengePage from './pages/admin/users/GrantChallengePage'

// Admin Challenge Management Pages
import ChallengesListPage from './pages/admin/challenges/ChallengesListPage'
import ChallengeDetailPage from './pages/admin/challenges/ChallengeDetailPage'

// Admin Financial Pages
import FinancialOverviewPage from './pages/admin/financial/FinancialOverviewPage'
import PaymentsListPage from './pages/admin/financial/PaymentsListPage'
import PayoutsManagementPage from './pages/admin/financial/PayoutsManagementPage'

// Admin Support & Activity Pages
import TicketsListPage from './pages/admin/support/TicketsListPage'
import TicketDetailPage from './pages/admin/support/TicketDetailPage'
import UserActivityPage from './pages/admin/support/UserActivityPage'

// SuperAdmin Configuration Pages
import SystemConfigPage from './pages/superadmin/config/SystemConfigPage'
import TradingConfigPage from './pages/superadmin/config/TradingConfigPage'
import PlatformControlPage from './pages/superadmin/config/PlatformControlPage'

// SuperAdmin Security Pages
import AdminManagementPage from './pages/superadmin/security/AdminManagementPage'
import AuditSecurityPage from './pages/superadmin/security/AuditSecurityPage'
import LoginMonitoringPage from './pages/superadmin/security/LoginMonitoringPage'
import BlockedIPsPage from './pages/superadmin/security/BlockedIPsPage'

// SuperAdmin Advanced Features Pages
import BulkActionsPage from './pages/superadmin/advanced/BulkActionsPage'
import UserControlPage from './pages/superadmin/advanced/UserControlPage'
import NotificationCenterPage from './pages/superadmin/advanced/NotificationCenterPage'

// SuperAdmin Analytics Pages
import AdvancedAnalyticsPage from './pages/superadmin/analytics/AdvancedAnalyticsPage'
import UserCohortsPage from './pages/superadmin/analytics/UserCohortsPage'

// Admin Permissions Management
import PermissionsManagementPage from './pages/admin/permissions/PermissionsManagementPage'

// Promo Page
import PromoPage from './pages/public/PromoPage'

// Dashboard Pages - Main App Pages
import {
  AccountsPage,
  MarginCalculatorPage,
  BillingHistoryPage,
  NotificationsPage,
  SupportTicketsPage,
  PlansPage,
  ProfilePage,
  SettingsPage,
  SessionsPage,
  KYCPage,
  SubscriptionsPage,
  // Rewards Hub
  ReferralPage,
  MyOffersPage,
  CompetitionPage,
  CertificatesPage,
  PointsActivitiesPage,
  PointsProfilePage,
  PointsHistoryPage,
  PointsRewardsPage,
  // Trading Tools
  TradingPage,
  AdvancedOrdersPage,
  QuickTradingPage,
  OrderTemplatesPage,
  TradeJournalPage,
  MTConnectionPage,
  ChartsPage,
  // Social Trading
  MyProfilePage,
  FollowersPage,
  CopyTradingPage,
  TradingIdeasPage,
  IdeaDetailPage,
  // Help & Support
  UtilitiesPage,
  CalendarPage,
  NewsFeedPage,
  ForexPage,
  ResourcesPage,
  TradingRulesPage,
  SupportPage,
  // Market Overview
  MarketOverviewPage,
  // Financial
  PayoutsPage,
  TransactionsPage,
  // Signals
  SignalsPage,
  // Points & Competitions
  PointsPage,
  CompetitionsPage,
  OffersPage,
  CalculatorPage
} from './pages/dashboard'

/**
 * Enhanced Protected Route Component
 * Supports multiple access control conditions:
 * - requiresAuth: Must be logged in
 * - requiresChallenge: Must have an active challenge/funded account (user-only routes)
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

  // Redirect admin/superadmin away from user-only routes (routes that requiresChallenge)
  // These users should use their admin dashboards instead
  if (requiresChallenge && !adminOnly && !superAdminOnly) {
    if (user?.role === 'superadmin') {
      return <Navigate to="/superadmin/dashboard" replace />
    }
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
  }

  // Check challenge requirement for normal users
  if (requiresChallenge && !hasActiveChallenge) {
    return <Navigate to={redirectTo || '/plans'} replace />
  }

  // Check superadmin role
  if (superAdminOnly && user?.role !== 'superadmin') {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    return <Navigate to="/home" replace />
  }

  // Check admin role
  if (adminOnly && !['admin', 'superadmin'].includes(user?.role)) {
    return <Navigate to="/home" replace />
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
 * Get home route based on user role
 */
const getHomeRouteByRole = (role) => {
  switch (role) {
    case 'superadmin':
      return '/superadmin/dashboard'
    case 'admin':
      return '/admin/dashboard'
    default:
      return '/home'
  }
}

/**
 * Guest-only Route - Redirect authenticated users away from login/register
 * Redirects based on user role
 */
const GuestRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-200">
        <div className="spinner"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    // Redirect based on role
    const redirectPath = getHomeRouteByRole(user?.role)
    return <Navigate to={redirectPath} replace />
  }

  return children
}

/**
 * Smart Home Route - Redirects authenticated users based on role and challenge status
 */
const SmartHomeRoute = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { hasActiveChallenge, loading: challengeLoading } = useChallenge()

  if (authLoading) {
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

  // Admin/SuperAdmin - redirect to their dashboard (no need to check challenge)
  if (user?.role === 'superadmin') {
    return <Navigate to="/superadmin/dashboard" replace />
  }
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  // Normal user - check challenge status
  if (challengeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-200">
        <div className="spinner"></div>
      </div>
    )
  }

  // Authenticated with challenge - go to accounts (main dashboard)
  if (hasActiveChallenge) {
    return <Navigate to="/accounts" replace />
  }

  // Authenticated without challenge - go to plans to get a plan
  return <Navigate to="/plans" replace />
}

/**
 * Smart Auth Home Redirect - Redirects authenticated users based on role and challenge status
 */
const SmartAuthHomeRedirect = () => {
  const { user } = useAuth()
  const { hasActiveChallenge, loading } = useChallenge()

  // Admin/SuperAdmin - redirect to their dashboard
  if (user?.role === 'superadmin') {
    return <Navigate to="/superadmin/dashboard" replace />
  }
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-200">
        <div className="spinner"></div>
      </div>
    )
  }

  // Has challenge - go to accounts
  if (hasActiveChallenge) {
    return <Navigate to="/accounts" replace />
  }

  // No challenge - go to plans
  return <Navigate to="/plans" replace />
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

  // If authenticated and has active challenge, redirect to accounts
  if (isAuthenticated && hasActiveChallenge) {
    return <Navigate to="/accounts" replace />
  }

  return children
}

// Routes that use user DashboardLayout (hide main Navbar/Footer)
const USER_DASHBOARD_ROUTES = [
  '/accounts', '/margin-calculator', '/billing', '/notifications', '/support-tickets',
  '/plans', '/profile', '/refer-and-earn', '/my-offers', '/competition', '/certificates',
  '/infinity-points', '/utilities', '/calendar', '/settings', '/sessions', '/dashboard', '/kyc',
  '/subscriptions', '/infinity-points/rewards', '/advanced-orders', '/quick-trading', '/order-templates',
  '/trade-journal', '/mt-connection', '/charts', '/my-profile', '/followers', '/copy-trading', '/trading-ideas',
  '/challenge-checkout', '/forex', '/markets', '/news', '/signals', '/resources', '/payouts', '/transactions',
  '/trading-rules', '/support', '/points', '/competitions', '/offers', '/calculator', '/trading', '/charts-markets'
]

// Admin routes - use AdminLayout (hide main Navbar/Footer completely)
const ADMIN_ROUTE_PREFIXES = ['/admin', '/superadmin']

function App() {
  const { isDark } = useTheme()
  const location = useLocation()

  // Check if we're on an admin/superadmin route
  const isAdminRoute = ADMIN_ROUTE_PREFIXES.some(prefix => location.pathname.startsWith(prefix))

  // Check if we're on a user dashboard route
  const isUserDashboardRoute = USER_DASHBOARD_ROUTES.some(route => location.pathname.startsWith(route))

  // Hide Navbar and Footer on both admin routes and user dashboard routes
  const shouldHideNavbar = isAdminRoute || isUserDashboardRoute
  const shouldHideFooter = isAdminRoute || isUserDashboardRoute

  return (
    <ErrorBoundary>
      <div className={`${isDark ? 'dark' : ''}`}>
        <ScrollToTop />
        <div className="min-h-screen bg-gray-50 dark:bg-dark-200 text-gray-900 dark:text-white transition-colors duration-300">
          {/* Only show Navbar on public pages (not admin or user dashboard) */}
          {!shouldHideNavbar && <Navbar />}

          <main className={shouldHideNavbar ? '' : 'pt-[100px]'}>
            <Routes>
            {/* ==================== SMART HOME ROUTE ==================== */}
            {/* Landing for guests, redirect for authenticated users */}
            <Route path="/" element={<SmartHomeRoute />} />

            {/* ==================== PUBLIC ROUTES ==================== */}
            {/* Anyone can access these */}
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            {/* Public news/calendar moved to /public/* to avoid conflict with dashboard routes */}
            <Route path="/public/news" element={<News />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/public/calendar" element={<EconomicCalendar />} />
            <Route path="/academy" element={<Academy />} />
            <Route path="/partners" element={<Affiliate />} />
            <Route path="/hall-of-fame" element={<HallOfFame />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />

            {/* ==================== BLOG ROUTES ==================== */}
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />

            {/* ==================== WEBINAR ROUTES ==================== */}
            <Route path="/webinars" element={<WebinarsPage />} />
            <Route path="/webinars/:slug" element={<WebinarDetailPage />} />

            {/* ==================== PROMO ROUTES ==================== */}
            <Route path="/promo/:slug" element={<PromoPage />} />

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

            {/* ==================== EMAIL VERIFICATION ROUTES ==================== */}
            {/* Verify email from link */}
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Email verification sent confirmation */}
            <Route path="/email-verification-sent" element={
              <AuthRoute>
                <EmailVerificationSent />
              </AuthRoute>
            } />

            {/* ==================== PASSWORD RESET ROUTES ==================== */}
            {/* Forgot password - request reset email */}
            <Route path="/forgot-password" element={
              <GuestRoute redirectTo="/home">
                <ForgotPassword />
              </GuestRoute>
            } />

            {/* Reset password - set new password */}
            <Route path="/reset-password" element={
              <GuestRoute redirectTo="/home">
                <ResetPassword />
              </GuestRoute>
            } />

            {/* ==================== TWO-FACTOR AUTH ROUTES ==================== */}
            {/* 2FA verification during login (no auth required - user is mid-login) */}
            <Route path="/verify-2fa" element={<TwoFactorVerify />} />

            {/* 2FA setup (requires auth) */}
            <Route path="/setup-2fa" element={
              <AuthRoute>
                <TwoFactorSetup />
              </AuthRoute>
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

            {/* ==================== MAIN APP ROUTES (Dashboard) ==================== */}
            {/* Accounts - Main Dashboard */}
            <Route path="/accounts" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <AccountsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            {/* Legacy redirect from /dashboard to /accounts */}
            <Route path="/dashboard" element={<Navigate to="/accounts" replace />} />
            <Route path="/dashboard/*" element={<Navigate to="/accounts" replace />} />

            {/* Margin Calculator */}
            <Route path="/margin-calculator" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <MarginCalculatorPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Billing History / Transactions */}
            <Route path="/billing/billing-history" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <BillingHistoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/billing" element={<Navigate to="/billing/billing-history" replace />} />

            {/* Notifications */}
            <Route path="/notifications" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <NotificationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Support Tickets */}
            <Route path="/support-tickets" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <SupportTicketsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Plans - Purchase/View Challenges */}
            <Route path="/plans" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PlansPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Profile - accessible without challenge so users can complete their profile */}
            <Route path="/profile/default" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={<Navigate to="/profile/default" replace />} />

            {/* Settings */}
            <Route path="/settings" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Active Sessions */}
            <Route path="/sessions" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <SessionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* KYC Verification */}
            <Route path="/kyc" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <KYCPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Premium Subscriptions */}
            <Route path="/subscriptions" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SubscriptionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* ==================== REWARDS HUB ROUTES ==================== */}
            {/* Refer & Earn */}
            <Route path="/refer-and-earn" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <ReferralPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* My Offers */}
            <Route path="/my-offers" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <MyOffersPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Competitions */}
            <Route path="/competition" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <CompetitionPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Certificates */}
            <Route path="/certificates" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <CertificatesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Infinity Points - Activities */}
            <Route path="/infinity-points" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <PointsActivitiesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Infinity Points - Profile/Dashboard */}
            <Route path="/infinity-points/profile" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <PointsProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Infinity Points - History */}
            <Route path="/infinity-points/history" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <PointsHistoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Infinity Points - Rewards Store */}
            <Route path="/infinity-points/rewards" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <PointsRewardsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* ==================== TRADING TOOLS ROUTES ==================== */}
            {/* Advanced Orders */}
            <Route path="/advanced-orders" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <AdvancedOrdersPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Trading Terminal - Pro Trading Page */}
            <Route path="/trading" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <TradingPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Quick Trading / One-Click Trading */}
            <Route path="/quick-trading" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <QuickTradingPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Order Templates */}
            <Route path="/order-templates" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <OrderTemplatesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Trade Journal */}
            <Route path="/trade-journal" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <TradeJournalPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* MT4/MT5 Connection */}
            <Route path="/mt-connection" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <MTConnectionPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Advanced Charts */}
            <Route path="/charts" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <ChartsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* ==================== SOCIAL TRADING ROUTES ==================== */}
            {/* My Trader Profile */}
            <Route path="/my-profile" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <MyProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Followers & Following */}
            <Route path="/followers" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <FollowersPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Copy Trading */}
            <Route path="/copy-trading" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <CopyTradingPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Trading Ideas */}
            <Route path="/trading-ideas" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <TradingIdeasPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/trading-ideas/:id" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <IdeaDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Public Trader Profile */}
            <Route path="/trader/:id" element={<TraderProfile />} />

            {/* ==================== HELP & SUPPORT ROUTES ==================== */}
            {/* Utilities / Resources */}
            <Route path="/utilities" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <UtilitiesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Dashboard Calendar */}
            <Route path="/calendar" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <CalendarPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Dashboard News Feed */}
            <Route path="/news" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <NewsFeedPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Forex Market */}
            <Route path="/forex" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <ForexPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Market Overview */}
            <Route path="/markets" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <MarketOverviewPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Signals */}
            <Route path="/signals" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <SignalsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Resources */}
            <Route path="/resources" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <ResourcesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Trading Rules */}
            <Route path="/trading-rules" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <TradingRulesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Support */}
            <Route path="/support" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <SupportPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Financial - Payouts */}
            <Route path="/payouts" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <PayoutsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Financial - Transactions */}
            <Route path="/transactions" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <TransactionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Points Main Page */}
            <Route path="/points" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <PointsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Competitions */}
            <Route path="/competitions" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <CompetitionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Offers */}
            <Route path="/offers" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <OffersPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Calculator */}
            <Route path="/calculator" element={
              <ProtectedRoute requiresChallenge redirectTo="/plans">
                <DashboardLayout>
                  <CalculatorPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* ==================== CHECKOUT ROUTES ==================== */}
            {/* Challenge checkout - for purchasing challenge models */}
            <Route path="/challenge-checkout" element={
              <ProtectedRoute>
                <ChallengeCheckout />
              </ProtectedRoute>
            } />

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
            {/* New Admin Dashboard */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Legacy Admin Panel - redirect to new dashboard */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* SuperAdmin Dashboard */}
            <Route path="/superadmin/dashboard" element={
              <ProtectedRoute superAdminOnly>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />

            {/* Legacy SuperAdmin - redirect to new dashboard */}
            <Route path="/superadmin" element={
              <ProtectedRoute superAdminOnly>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />

            {/* SuperAdmin Configuration Pages */}
            <Route path="/superadmin/config" element={
              <ProtectedRoute superAdminOnly>
                <SystemConfigPage />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/trading" element={
              <ProtectedRoute superAdminOnly>
                <TradingConfigPage />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/platform" element={
              <ProtectedRoute superAdminOnly>
                <PlatformControlPage />
              </ProtectedRoute>
            } />

            {/* SuperAdmin Security Pages */}
            <Route path="/superadmin/admins" element={
              <ProtectedRoute superAdminOnly>
                <AdminManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/permissions" element={
              <ProtectedRoute superAdminOnly>
                <PermissionsManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/audit-logs" element={
              <ProtectedRoute superAdminOnly>
                <AuditSecurityPage />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/login-monitoring" element={
              <ProtectedRoute superAdminOnly>
                <LoginMonitoringPage />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/blocked-ips" element={
              <ProtectedRoute superAdminOnly>
                <BlockedIPsPage />
              </ProtectedRoute>
            } />

            {/* SuperAdmin Advanced Features */}
            <Route path="/superadmin/bulk-actions" element={
              <ProtectedRoute superAdminOnly>
                <BulkActionsPage />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/user-control" element={
              <ProtectedRoute superAdminOnly>
                <UserControlPage />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/notifications" element={
              <ProtectedRoute superAdminOnly>
                <NotificationCenterPage />
              </ProtectedRoute>
            } />

            {/* SuperAdmin Analytics */}
            <Route path="/superadmin/analytics" element={
              <ProtectedRoute superAdminOnly>
                <AdvancedAnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/cohorts" element={
              <ProtectedRoute superAdminOnly>
                <UserCohortsPage />
              </ProtectedRoute>
            } />

            {/* Admin User Management */}
            <Route path="/admin/users" element={
              <ProtectedRoute adminOnly>
                <UsersListPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/users/:id" element={
              <ProtectedRoute adminOnly>
                <UserDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/users/:id/grant-challenge" element={
              <ProtectedRoute adminOnly>
                <GrantChallengePage />
              </ProtectedRoute>
            } />

            {/* Admin Challenge Management */}
            <Route path="/admin/challenges" element={
              <ProtectedRoute adminOnly>
                <ChallengesListPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/challenges/:id" element={
              <ProtectedRoute adminOnly>
                <ChallengeDetailPage />
              </ProtectedRoute>
            } />

            {/* Admin Financial Pages */}
            <Route path="/admin/financial" element={
              <ProtectedRoute adminOnly>
                <FinancialOverviewPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute adminOnly>
                <PaymentsListPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/payouts" element={
              <ProtectedRoute adminOnly>
                <PayoutsManagementPage />
              </ProtectedRoute>
            } />

            {/* Admin Support Tickets */}
            <Route path="/admin/tickets" element={
              <ProtectedRoute adminOnly>
                <TicketsListPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/tickets/:id" element={
              <ProtectedRoute adminOnly>
                <TicketDetailPage />
              </ProtectedRoute>
            } />

            {/* Admin User Activity */}
            <Route path="/admin/activity" element={
              <ProtectedRoute adminOnly>
                <UserActivityPage />
              </ProtectedRoute>
            } />

            {/* Blog Management - Admin Only */}
            <Route path="/admin/blog" element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <BlogManagementPage />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Webinar Management - Admin Only */}
            <Route path="/admin/webinars" element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <WebinarManagementPage />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Events Management - Admin Only */}
            <Route path="/admin/events" element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <EventsManagementPage />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Analytics Dashboard - Admin Only */}
            <Route path="/admin/analytics" element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AnalyticsDashboardPage />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* ==================== 404 REDIRECT ==================== */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Only show Footer on public pages (not admin or user dashboard) */}
        {!shouldHideFooter && <Footer />}

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

        {/* Global AI Assistant - Available on all pages */}
        <GlobalAIAssistant />
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
