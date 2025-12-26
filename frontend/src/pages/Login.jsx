import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Mail, Lock, Loader2, LogIn, AlertTriangle, Clock, Ban } from 'lucide-react'
import SimpleCaptcha from '../components/auth/SimpleCaptcha'
import SocialLoginButtons from '../components/auth/SocialLoginButtons'
import { useRateLimit } from '../hooks/useRateLimit'

const Login = () => {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const { isLimited, formattedCountdown } = useRateLimit()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [requiresCaptcha, setRequiresCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isBanned, setIsBanned] = useState(false)
  const [banReason, setBanReason] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    // Check if CAPTCHA is required but not verified
    if (requiresCaptcha && !captchaToken) {
      toast.error('Please complete the CAPTCHA verification')
      return
    }

    // Check if rate limited
    if (isLimited) {
      toast.error(`Please wait ${formattedCountdown} before trying again`)
      return
    }

    setLoading(true)

    try {
      const result = await login(email, password, captchaToken)
      setLoading(false)

      if (result.success) {
        // Reset state on success
        setFailedAttempts(0)
        setRequiresCaptcha(false)
        setCaptchaToken(null)
        toast.success('Welcome back!')

        // Redirect based on user role
        const userRole = result.user?.role
        if (userRole === 'superadmin') {
          navigate('/superadmin/dashboard')
        } else if (userRole === 'admin') {
          navigate('/admin/dashboard')
        } else {
          // Normal user - redirect to home (SmartHomeRoute will handle challenge check)
          navigate('/home')
        }
      } else if (result.requires_2fa) {
        // Redirect to 2FA verification page with credentials
        navigate('/verify-2fa', {
          state: {
            email,
            password,
            tempToken: result.temp_token
          }
        })
      } else {
        // Handle error
        setFailedAttempts(prev => prev + 1)

        // Check if user is banned
        if (result.banned) {
          setIsBanned(true)
          setBanReason(result.ban_reason || '')
          return // Don't show toast, we show a banner instead
        }

        // Check if CAPTCHA is now required
        if (result.requires_captcha) {
          setRequiresCaptcha(true)
          setCaptchaToken(null)
        }

        toast.error(result.error)
      }
    } catch (error) {
      setLoading(false)

      // Handle rate limit error
      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.retry_after || 60
        toast.error(`Too many attempts. Please wait ${retryAfter} seconds.`)
        return
      }

      // Handle CAPTCHA required
      if (error.response?.data?.requires_captcha) {
        setRequiresCaptcha(true)
        setCaptchaToken(null)
        setFailedAttempts(error.response.data.failed_attempts || failedAttempts + 1)
      }

      toast.error(error.response?.data?.error || 'Login failed')
    }
  }

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token)
  }

  const handleCaptchaError = () => {
    setCaptchaToken(null)
  }

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">T</span>
            </div>
            <span className="font-bold text-2xl text-gray-900 dark:text-white">
              Trade<span className="text-primary-500">Sense</span>
            </span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            {t('auth.login.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
            Connectez-vous pour acceder a votre dashboard
          </p>

          {/* Banned User Warning */}
          {isBanned && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Ban className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
                <div>
                  <p className="text-red-500 font-semibold text-lg">This account has been banned</p>
                  {banReason && (
                    <p className="text-red-400 text-sm mt-1">
                      Reason: {banReason}
                    </p>
                  )}
                  <p className="text-gray-400 text-sm mt-2">
                    If you believe this is a mistake, please contact support.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.login.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setIsBanned(false) // Reset banned state on email change
                  }}
                  className="input input-icon"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.login.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-icon"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm text-primary-500 hover:text-primary-600">
                Mot de passe oublie?
              </Link>
            </div>

            {/* Rate Limit Warning */}
            {isLimited && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-yellow-400 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-yellow-400 font-medium">Too many attempts</p>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <Clock size={14} />
                      Please wait {formattedCountdown} before trying again
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CAPTCHA */}
            {requiresCaptcha && !isLimited && (
              <SimpleCaptcha
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
              />
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || isLimited || (requiresCaptcha && !captchaToken)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {t('common.loading')}
                </>
              ) : isLimited ? (
                <>
                  <Clock size={20} />
                  Wait {formattedCountdown}
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  {t('auth.login.submit')}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-dark-100" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-dark-100 text-gray-500">ou continuer avec</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <SocialLoginButtons mode="login" disabled={loading || isLimited} />

          {/* Demo Account Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-dark-100" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-dark-100 text-gray-500">demo</span>
            </div>
          </div>

          {/* Demo Account */}
          <button
            onClick={() => {
              setEmail('admin@tradesense.com')
              setPassword('admin123')
            }}
            className="w-full py-3 bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all"
          >
            Utiliser le compte demo
          </button>

          {/* Register Link */}
          <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="text-primary-500 hover:text-primary-600 font-medium">
              {t('auth.login.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
