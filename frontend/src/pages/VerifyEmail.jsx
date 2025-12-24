import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react'

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

        {/* Status Card */}
        <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl p-8">
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="animate-spin text-primary-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verifying Email
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email Verified!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {message}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Redirecting you in a moment...
              </p>
              <Link
                to={user ? '/dashboard' : '/login'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all"
              >
                {user ? 'Go to Dashboard' : 'Login Now'}
                <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="text-red-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {message}
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all"
                >
                  Go to Login
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/"
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-yellow-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Link Expired
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {message}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Please login and request a new verification email.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all"
                >
                  Login to Resend
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/"
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
