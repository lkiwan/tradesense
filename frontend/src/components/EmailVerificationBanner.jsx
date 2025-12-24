import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Mail, X, RefreshCw, CheckCircle } from 'lucide-react'

const EmailVerificationBanner = () => {
  const { user, refreshUser } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  // Don't show if user is verified or banner is dismissed
  if (!user || user.email_verified || dismissed) {
    return null
  }

  const handleResend = async () => {
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
    <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-full">
            <Mail size={18} />
          </div>
          <p className="text-sm font-medium">
            Please verify your email address to unlock all features.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {resent ? (
            <span className="flex items-center gap-1 text-sm">
              <CheckCircle size={16} />
              Email sent!
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="flex items-center gap-1 text-sm font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
            >
              {resending ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Resend Email
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition-all"
            title="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationBanner
