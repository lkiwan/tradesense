import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Mail, RefreshCw, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'

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

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 md:p-10">
          <div className="text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary-500/30">
              <Mail className="text-primary-400" size={40} />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Check Your Email
            </h2>

            <p className="text-gray-400 mb-6">
              We've sent a verification link to{' '}
              <span className="font-semibold text-primary-400">
                {user?.email || 'your email address'}
              </span>
            </p>

            {/* Instructions */}
            <div className="bg-dark-300/50 rounded-xl p-5 mb-6 text-left border border-white/5">
              <h3 className="font-semibold text-white mb-3">
                Next Steps:
              </h3>
              <ol className="text-sm text-gray-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-500/30">
                    <span className="text-xs font-bold text-primary-400">1</span>
                  </span>
                  <span>Open the email we just sent you</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-500/30">
                    <span className="text-xs font-bold text-primary-400">2</span>
                  </span>
                  <span>Click the "Verify Email" button</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-500/30">
                    <span className="text-xs font-bold text-primary-400">3</span>
                  </span>
                  <span>Start trading with TradeSense!</span>
                </li>
              </ol>
            </div>

            {/* Resend Button */}
            {resent ? (
              <div className="flex items-center justify-center gap-2 text-green-400 mb-6 p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                <CheckCircle size={20} />
                <span>Email sent! Check your inbox.</span>
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium mb-6 transition-colors"
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
            <div className="pt-5 border-t border-white/5">
              <Link
                to="/dashboard"
                className="group inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                Continue to Dashboard
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <p className="text-sm text-gray-500 mt-3">
                You can verify your email later from your dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Footer Badge */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-gray-400 text-sm">
            <Sparkles size={14} className="text-primary-400" />
            Secure email verification
          </div>
        </div>

        {/* Help */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Having trouble?{' '}
          <Link to="/contact" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}

export default EmailVerificationSent
