import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Loader2, UserPlus, ArrowRight, Sparkles, CheckCircle2, Globe, TrendingUp, Rocket, Eye, EyeOff } from 'lucide-react'
import SocialLoginButtons from '../components/auth/SocialLoginButtons'
import AnimatedAuthBackground from '../components/auth/AnimatedAuthBackground'

const Register = () => {
  const { t } = useTranslation()
  const { register } = useAuth()
  const { language, languages } = useLanguage()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [preferredLanguage, setPreferredLanguage] = useState(language)
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!username || !email || !password || !confirmPassword) {
      toast.error(t('auth.register.fillAllFields'))
      return
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.register.passwordsNotMatch'))
      return
    }

    if (password.length < 6) {
      toast.error(t('auth.register.passwordMinLength'))
      return
    }

    if (!agreedToTerms) {
      toast.error(t('auth.register.acceptTerms'))
      return
    }

    setLoading(true)
    try {
      const result = await register(username, email, password, preferredLanguage)
      setLoading(false)

      if (result.success) {
        toast.success(t('auth.register.success'))
        navigate('/email-verification-sent')
      } else {
        // Check for rate limit error
        if (result.error?.includes('rate') || result.error?.includes('Too many')) {
          toast.error(t('auth.register.tooManyAttempts'))
        } else {
          toast.error(result.error || t('auth.register.failed'))
        }
      }
    } catch (error) {
      setLoading(false)
      console.error('Registration error:', error)

      // Handle rate limit (429)
      if (error.response?.status === 429) {
        toast.error(t('auth.register.waitHour'))
      } else {
        toast.error(error.response?.data?.error || t('auth.register.checkConnection'))
      }
    }
  }

  // Password strength checker
  const getPasswordStrength = () => {
    if (!password) return { strength: 0, labelKey: '', color: '' }
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    if (strength <= 2) return { strength, labelKey: 'auth.register.passwordStrength.weak', color: 'bg-red-500' }
    if (strength <= 3) return { strength, labelKey: 'auth.register.passwordStrength.medium', color: 'bg-yellow-500' }
    return { strength, labelKey: 'auth.register.passwordStrength.strong', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedAuthBackground />

      <div className="relative max-w-md w-full z-10">
        {/* Logo with animation */}
        <div className="text-center mb-8 animate-slide-up-fade">
          <Link to="/" className="inline-flex flex-col items-center gap-3 group logo-hover">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500/20 rounded-2xl blur-xl animate-pulse-slow" />
              <img
                src="/logo.svg"
                alt="TradeSense"
                className="relative w-20 h-20 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
              />
            </div>
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary-400 animate-bounce-slow" />
              <span className="text-2xl font-bold text-white">Trade<span className="text-primary-500">Sense</span></span>
            </div>
          </Link>
        </div>

        {/* Form Card with entrance animation */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 md:p-10 auth-card-enter animate-glow-pulse">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {t('auth.register.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-400">
              {t('auth.register.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.register.username')}
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-dark-300/50 rounded-xl text-white placeholder-gray-500 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                  placeholder="TraderPro"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.register.email')}
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-dark-300/50 rounded-xl text-white placeholder-gray-500 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.register.password')}
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-dark-300/50 rounded-xl text-white placeholder-gray-500 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-400 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= passwordStrength.strength ? passwordStrength.color : 'bg-dark-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength.color.replace('bg-', 'text-')}`}>
                    {passwordStrength.labelKey && t(passwordStrength.labelKey)}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.register.confirmPassword')}
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-4 bg-dark-300/50 rounded-xl text-white placeholder-gray-500 border focus:outline-none focus:ring-2 transition-all duration-300 ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-500/50 focus:ring-red-500/50'
                      : confirmPassword && password === confirmPassword
                      ? 'border-green-500/50 focus:ring-green-500/50'
                      : 'border-white/5 focus:ring-primary-500/50 focus:border-primary-500/50'
                  }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors focus:outline-none ${
                    confirmPassword && password === confirmPassword
                      ? 'right-12 text-gray-500 hover:text-primary-400'
                      : 'text-gray-500 hover:text-primary-400'
                  }`}
                  style={{ right: confirmPassword && password === confirmPassword ? '3rem' : '1rem' }}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {confirmPassword && password === confirmPassword && (
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={20} />
                )}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Globe size={14} className="inline mr-1" />
                {t('auth.register.preferredLanguage')}
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full px-4 py-4 bg-dark-300/50 rounded-xl text-white border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 cursor-pointer"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-dark-300">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 p-3 sm:p-4 bg-dark-300/30 rounded-xl border border-white/5">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-5 h-5 min-w-[20px] rounded border-gray-600 bg-dark-300 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {t('auth.register.terms.iAccept')}{' '}
                <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors">
                  {t('auth.register.terms.termsOfUse')}
                </a>{' '}
                {t('auth.register.terms.and')}{' '}
                <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors">
                  {t('auth.register.terms.privacyPolicy')}
                </a>
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="group w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] btn-shine"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  {t('auth.register.submit')}
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
              <span className="px-4 bg-dark-200 text-gray-500 rounded-full">{t('auth.register.orSignUpWith')}</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <SocialLoginButtons mode="register" disabled={loading} />

          {/* Login Link */}
          <p className="mt-8 text-center text-gray-400">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              {t('auth.register.login')}
            </Link>
          </p>
        </div>

        {/* Footer Badge */}
        <div className="mt-6 sm:mt-8 text-center animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 glass-card rounded-full text-gray-400 text-xs sm:text-sm border border-white/5 hover:border-primary-500/30 transition-all duration-300 hover:text-gray-300">
            <Sparkles size={14} className="text-primary-400 animate-pulse flex-shrink-0" />
            <span>{t('auth.register.joinTraders')}</span>
            <div className="flex gap-1 flex-shrink-0">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-primary-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
