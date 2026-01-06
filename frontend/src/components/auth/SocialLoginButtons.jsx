import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

// Google Icon SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

// Apple Icon SVG
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
)

const SocialLoginButtons = ({ mode = 'login', onSuccess, disabled = false }) => {
  const navigate = useNavigate()
  const { setUser, setIsAuthenticated } = useAuth()
  const [providers, setProviders] = useState([])
  const [loadingProvider, setLoadingProvider] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await api.get('/api/auth/oauth/providers')
      setProviders(response.data.providers.filter(p => p.enabled))
    } catch (error) {
      console.error('Failed to fetch OAuth providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider) => {
    if (disabled || loadingProvider) return

    setLoadingProvider(provider)

    try {
      // Get authorization URL
      const response = await api.get(`/api/auth/oauth/${provider}/url`)
      const { url, state } = response.data

      // Store state for verification
      localStorage.setItem('oauth_state', state)
      localStorage.setItem('oauth_provider', provider)

      // Redirect to OAuth provider
      window.location.href = url
    } catch (error) {
      console.error(`${provider} OAuth error:`, error)
      toast.error(`Failed to connect with ${provider}`)
      setLoadingProvider(null)
    }
  }

  // Handle OAuth callback (when redirected back)
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const state = urlParams.get('state')
      const error = urlParams.get('error')

      if (error) {
        toast.error(`OAuth error: ${error}`)
        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname)
        return
      }

      if (!code) return

      const storedState = localStorage.getItem('oauth_state')
      const provider = localStorage.getItem('oauth_provider') || 'google'

      // Clear stored data
      localStorage.removeItem('oauth_state')
      localStorage.removeItem('oauth_provider')

      // Validate state only if we have a stored state (backend also validates)
      if (storedState && state !== storedState) {
        console.warn('OAuth state mismatch:', { state, storedState })
        toast.error('Security validation failed. Please try again.')
        window.history.replaceState({}, '', window.location.pathname)
        return
      }

      setLoadingProvider(provider)

      try {
        const response = await api.post(`/api/auth/oauth/${provider}/callback`, {
          code,
          state
        })

        const { access_token, refresh_token, user, is_new_user } = response.data

        // Store tokens
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)

        // Update auth context
        setUser(user)
        setIsAuthenticated(true)

        // Show success message
        if (is_new_user) {
          toast.success(`Welcome to TradeSense! Account created with ${provider}.`)
        } else {
          toast.success(`Welcome back! Signed in with ${provider}.`)
        }

        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname)

        // Callback or navigate
        if (onSuccess) {
          onSuccess(user)
        } else {
          navigate('/dashboard')
        }
      } catch (error) {
        console.error('OAuth callback error:', error)
        toast.error(error.response?.data?.error || 'Authentication failed')
        window.history.replaceState({}, '', window.location.pathname)
      } finally {
        setLoadingProvider(null)
      }
    }

    handleCallback()
  }, [navigate, setUser, setIsAuthenticated, onSuccess])

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    )
  }

  if (providers.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <button
          key={provider.id}
          onClick={() => handleOAuthLogin(provider.id)}
          disabled={disabled || loadingProvider}
          className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium transition-all
            ${provider.id === 'google'
              ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              : 'bg-black text-white hover:bg-gray-900'
            }
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loadingProvider === provider.id ? (
            <Loader2 className="animate-spin" size={20} />
          ) : provider.id === 'google' ? (
            <GoogleIcon />
          ) : (
            <AppleIcon />
          )}
          <span>
            {mode === 'login' ? 'Continue' : 'Sign up'} with {provider.name}
          </span>
        </button>
      ))}
    </div>
  )
}

export default SocialLoginButtons
