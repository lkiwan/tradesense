import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight, Sparkles, Clock } from 'lucide-react'

const VerifyEmail = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading') // loading, success, error, expired
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (token) {
      verifyEmail()
    } else {
      setStatus('error')
      setMessage('No verification token provided')
    }
  }, [token])

  const verifyEmail = async () => {
    try {
      setStatus('loading')
      const response = await api.post('/auth/verify-email', { token })

      if (response.data.message) {
        setStatus('success')
        setMessage(response.data.message)
        toast.success('Email verified successfully!')

        // Refresh user data if logged in
        if (user && refreshUser) {
          await refreshUser()
        }

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate(user ? '/dashboard' : '/login')
        }, 3000)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Verification failed'

      if (errorMessage.includes('expired')) {
        setStatus('expired')
      } else {
        setStatus('error')
      }
      setMessage(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary-500/10 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
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

        {/* Status Card */}
        <div className="glass-card rounded-3xl p-8 md:p-10">
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary-500/30">
                <Loader2 className="animate-spin text-primary-400" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Verifying Email
              </h2>
              <p className="text-gray-400">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                <CheckCircle className="text-green-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Email Verified!
              </h2>
              <p className="text-gray-400 mb-6">
                {message}
              </p>
              <p className="text-sm text-gray-500 mb-6 flex items-center justify-center gap-2">
                <Clock size={14} className="text-primary-400" />
                Redirecting you in a moment...
              </p>
              <Link
                to={user ? '/dashboard' : '/login'}
                className="group inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                {user ? 'Go to Dashboard' : 'Login Now'}
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                <XCircle className="text-red-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-400 mb-6">
                {message}
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  className="group inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Go to Login
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/"
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-yellow-500/30">
                <Mail className="text-yellow-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Link Expired
              </h2>
              <p className="text-gray-400 mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please login and request a new verification email.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  className="group inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Login to Resend
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/"
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer Badge */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-gray-400 text-sm">
            <Sparkles size={14} className="text-primary-400" />
            Secure email verification
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
