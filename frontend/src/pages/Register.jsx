import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Loader2, UserPlus, ArrowRight, Sparkles, CheckCircle2, Globe } from 'lucide-react'
import SocialLoginButtons from '../components/auth/SocialLoginButtons'

const Register = () => {
  const { t } = useTranslation()
  const { register } = useAuth()
  const { language, languages } = useLanguage()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState(language)
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!username || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (!agreedToTerms) {
      toast.error('Please accept the terms and conditions')
      return
    }

    setLoading(true)
    const result = await register(username, email, password, preferredLanguage)
    setLoading(false)

    if (result.success) {
      toast.success('Account created successfully! Please verify your email.')
      navigate('/email-verification-sent')
    } else {
      toast.error(result.error)
    }
  }

  // Password strength checker
  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: '', color: '' }
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' }
    if (strength <= 3) return { strength, label: 'Medium', color: 'bg-yellow-500' }
    return { strength, label: 'Strong', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group">
            <img src="/logo.svg" alt="TradeSense" className="w-16 h-16 object-contain transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xl font-bold text-white">Trade<span className="text-primary-500">Sense</span></span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-3xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {t('auth.register.title')}
            </h2>
            <p className="text-gray-400">
              Créez votre compte et commencez à trader
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-dark-300/50 rounded-xl text-white placeholder-gray-500 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
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
                    {passwordStrength.label}
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
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 bg-dark-300/50 rounded-xl text-white placeholder-gray-500 border focus:outline-none focus:ring-2 transition-all duration-300 ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-500/50 focus:ring-red-500/50'
                      : confirmPassword && password === confirmPassword
                      ? 'border-green-500/50 focus:ring-green-500/50'
                      : 'border-white/5 focus:ring-primary-500/50 focus:border-primary-500/50'
                  }`}
                  placeholder="••••••••"
                  required
                />
                {confirmPassword && password === confirmPassword && (
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={20} />
                )}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Globe size={14} className="inline mr-1" />
                Langue préférée
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
            <div className="flex items-start gap-3 p-4 bg-dark-300/30 rounded-xl border border-white/5">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-600 bg-dark-300 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm text-gray-400 leading-relaxed">
                J'accepte les{' '}
                <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors">
                  conditions d'utilisation
                </a>{' '}
                et la{' '}
                <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors">
                  politique de confidentialité
                </a>
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="group w-full flex items-center justify-center gap-3 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98]"
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
              <span className="px-4 bg-dark-200 text-gray-500 rounded-full">ou s'inscrire avec</span>
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
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-gray-400 text-sm">
            <Sparkles size={14} className="text-primary-400" />
            Join 10,000+ traders worldwide
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
