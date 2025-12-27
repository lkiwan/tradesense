import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { twoFactorAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Shield, Loader2, ArrowLeft, Key, Sparkles, AlertTriangle } from 'lucide-react'

const TwoFactorVerify = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWith2FA } = useAuth()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [attemptsRemaining, setAttemptsRemaining] = useState(null)

  // Get credentials from navigation state
  const { email, password, tempToken } = location.state || {}

  // Redirect if no credentials
  useEffect(() => {
    if (!email || !password) {
      navigate('/login')
    }
  }, [email, password, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (useBackupCode) {
      if (code.length < 8) {
        toast.error('Please enter a valid backup code')
        return
      }
    } else {
      if (code.length !== 6) {
        toast.error('Please enter a 6-digit code')
        return
      }
    }

    setLoading(true)
    try {
      const result = await loginWith2FA(email, password, code)

      if (result.success) {
        toast.success('Welcome back!')

        // Redirect based on user role
        const userRole = result.user?.role
        if (userRole === 'superadmin') {
          navigate('/superadmin/dashboard')
        } else if (userRole === 'admin') {
          navigate('/admin/dashboard')
        } else {
          navigate('/home')
        }
      } else {
        if (result.attemptsRemaining !== undefined) {
          setAttemptsRemaining(result.attemptsRemaining)
        }
        toast.error(result.error || 'Invalid verification code')
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (e) => {
    let value = e.target.value

    if (useBackupCode) {
      // Backup codes are alphanumeric, keep as is but uppercase
      value = value.toUpperCase().slice(0, 12)
    } else {
      // TOTP codes are 6 digits only
      value = value.replace(/\D/g, '').slice(0, 6)
    }

    setCode(value)
  }

  const toggleCodeType = () => {
    setUseBackupCode(!useBackupCode)
    setCode('')
  }

  if (!email || !password) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
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
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary-500/30">
              <Shield className="text-primary-400" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Two-Factor Authentication
            </h2>
            <p className="text-gray-400">
              {useBackupCode
                ? 'Enter one of your backup codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Code Input */}
            <div>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                className={`w-full text-center font-mono py-4 bg-dark-300/50 rounded-xl text-white border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 ${
                  useBackupCode ? 'text-xl tracking-wider' : 'text-3xl tracking-[0.5em]'
                }`}
                placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
                autoFocus
              />
            </div>

            {/* Attempts remaining warning */}
            {attemptsRemaining !== null && attemptsRemaining <= 3 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="text-yellow-400" size={20} />
                  </div>
                  <p className="text-sm text-yellow-400">
                    <strong>Warning:</strong> {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before lockout
                  </p>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-3 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Verify
                </>
              )}
            </button>
          </form>

          {/* Toggle backup code */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleCodeType}
              className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              <Key size={16} />
              {useBackupCode ? 'Use authenticator code instead' : 'Use a backup code instead'}
            </button>
          </div>

          {/* Back to login */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              Back to login
            </Link>
          </div>
        </div>

        {/* Footer Badge */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-gray-400 text-sm">
            <Sparkles size={14} className="text-primary-400" />
            Secure 2FA verification
          </div>
        </div>

        {/* Help text */}
        <p className="mt-4 text-center text-sm text-gray-500">
          Lost your device?{' '}
          <Link to="/contact" className="text-primary-400 hover:text-primary-300 transition-colors">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  )
}

export default TwoFactorVerify
