import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { twoFactorAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Shield, Loader2, ArrowLeft, Key } from 'lucide-react'

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
        navigate('/dashboard')
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
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="text-primary-500" size={32} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
            {useBackupCode
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code Input */}
            <div>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                className={`w-full text-center font-mono py-4 border-2 border-gray-200 dark:border-dark-200 rounded-xl focus:border-primary-500 focus:outline-none bg-white dark:bg-dark-200 text-gray-900 dark:text-white ${
                  useBackupCode ? 'text-xl tracking-wider' : 'text-3xl tracking-[0.5em]'
                }`}
                placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
                autoFocus
              />
            </div>

            {/* Attempts remaining warning */}
            {attemptsRemaining !== null && attemptsRemaining <= 3 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                  <strong>Warning:</strong> {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before lockout
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              <Key size={16} />
              {useBackupCode ? 'Use authenticator code instead' : 'Use a backup code instead'}
            </button>
          </div>

          {/* Back to login */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-200">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              Back to login
            </Link>
          </div>
        </div>

        {/* Help text */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Lost your device?{' '}
          <Link to="/contact" className="text-primary-500 hover:text-primary-600">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  )
}

export default TwoFactorVerify
