import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Mail, Lock, Loader2, LogIn, AlertTriangle, Clock, Ban, ArrowRight, Sparkles } from 'lucide-react'
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
    <div className="min-h-screen bg-dark-400 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group">
            <img src="/logo.png" alt="TradeSense" className="w-16 h-16 object-contain transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xl font-bold text-white">Trade<span className="text-primary-500">Sense</span></span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-3xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {t('auth.login.title')}
            </h2>
            <p className="text-gray-400">
              Connectez-vous pour accéder à votre dashboard
            </p>
          </div>

          {/* Banned User Warning */}
          {isBanned && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Ban className="text-red-500" size={20} />
                </div>
                <div>
                  <p className="text-red-400 font-semibold">This account has been banned</p>
                  {banReason && (
                    <p className="text-red-400/70 text-sm mt-1">
                      Reason: {banReason}
                    </p>
                  )}
                  <p className="text-gray-500 text-sm mt-2">
                    If you believe this is a mistake, please contact support.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.login.email')}
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setIsBanned(false) // Reset banned state on email change
                  }}
                  className="w-full pl-12 pr-4 py-4 bg-dark-300/50 rounded-xl text-white placeholder-gray-500 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.login.password')}
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-dark-300/50 rounded-xl text-white placeholder-gray-500 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                Mot de passe oublié?
              </Link>
            </div>

            {/* Rate Limit Warning */}
            {isLimited && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="text-yellow-400" size={20} />
                  </div>
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
              className="group w-full flex items-center justify-center gap-3 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98]"
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
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark-200 text-gray-500 rounded-full">ou continuer avec</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <SocialLoginButtons mode="login" disabled={loading || isLimited} />

          {/* Demo Account Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark-200 text-gray-500 rounded-full">demo</span>
            </div>
          </div>

          {/* Demo Account */}
          <button
            onClick={() => {
              setEmail('admin@tradesense.com')
              setPassword('admin123')
            }}
            className="w-full py-4 bg-dark-300/50 hover:bg-dark-300 text-gray-300 rounded-xl font-medium transition-all duration-300 border border-white/5 hover:border-white/10"
          >
            Utiliser le compte demo
          </button>

          {/* Register Link */}
          <p className="mt-8 text-center text-gray-400">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              {t('auth.login.register')}
            </Link>
          </p>
        </div>

        {/* Footer Badge */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-gray-400 text-sm">
            <Sparkles size={14} className="text-primary-400" />
            Secure login with 2FA support
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
