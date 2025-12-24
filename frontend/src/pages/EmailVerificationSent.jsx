import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Mail, RefreshCw, ArrowRight, CheckCircle } from 'lucide-react'

const EmailVerificationSent = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    if (!user) {
      toast.error('Please login first')
      navigate('/login')
      return
    }

    setResending(true)
    try {
      await api.post('/auth/resend-verification')
      setResent(true)
      toast.success('Verification email sent!')
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to resend email'
      toast.error(errorMessage)
    } finally {
      setResending(false)
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

        {/* Card */}
        <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="text-primary-500" size={40} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Check Your Email
            </h2>

            <p className="text-gray-500 dark:text-gray-400 mb-6">
              We've sent a verification link to{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {user?.email || 'your email address'}
              </span>
            </p>

            {/* Instructions */}
            <div className="bg-gray-50 dark:bg-dark-200 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Next Steps:
              </h3>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary-600">1</span>
                  </span>
                  Open the email we just sent you
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary-600">2</span>
                  </span>
                  Click the "Verify Email" button
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary-600">3</span>
                  </span>
                  Start trading with TradeSense!
                </li>
              </ol>
            </div>

            {/* Resend Button */}
            {resent ? (
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-4">
                <CheckCircle size={20} />
                <span>Email sent! Check your inbox.</span>
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium mb-4"
              >
                {resending ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Didn't receive it? Resend email
                  </>
                )}
              </button>
            )}

            {/* Continue Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all"
              >
                Continue to Dashboard
                <ArrowRight size={18} />
              </Link>
              <p className="text-sm text-gray-400 mt-3">
                You can verify your email later from your dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Help */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Having trouble?{' '}
          <Link to="/contact" className="text-primary-500 hover:text-primary-600 font-medium">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}

export default EmailVerificationSent
