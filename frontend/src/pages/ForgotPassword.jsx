import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'

const ForgotPassword = () => {
  const { t } = useTranslation()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch (error) {
      // Always show success to prevent email enumeration
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
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

          <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Check Your Email
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              If an account exists with the email <strong>{email}</strong>,
              you will receive a password reset link shortly.
            </p>

            <div className="bg-gray-50 dark:bg-dark-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Note:</strong> The link will expire in 1 hour. If you don't see the email,
                check your spam folder.
              </p>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium"
            >
              <ArrowLeft size={18} />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    )
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
            Forgot Password?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
            Enter your email and we'll send you a link to reset your password
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-icon"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
