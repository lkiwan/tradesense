import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Loader2, Link2, Unlink, Check, AlertCircle } from 'lucide-react'

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

const providerIcons = {
  google: GoogleIcon,
  apple: AppleIcon
}

const LinkedAccounts = () => {
  const [linkedAccounts, setLinkedAccounts] = useState([])
  const [availableProviders, setAvailableProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [linkingProvider, setLinkingProvider] = useState(null)
  const [unlinkingProvider, setUnlinkingProvider] = useState(null)

  useEffect(() => {
    fetchLinkedAccounts()
  }, [])

  const fetchLinkedAccounts = async () => {
    try {
      const response = await api.get('/api/auth/oauth/linked-accounts')
      setLinkedAccounts(response.data.accounts || [])
      setAvailableProviders(response.data.available_providers || [])
    } catch (error) {
      console.error('Failed to fetch linked accounts:', error)
      toast.error('Failed to load linked accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkAccount = async (provider) => {
    setLinkingProvider(provider)

    try {
      // Get authorization URL with link flag
      const response = await api.get(`/api/auth/oauth/${provider}/url?link=true`)
      const { url, state } = response.data

      // Store state for verification
      localStorage.setItem('oauth_state', state)
      localStorage.setItem('oauth_provider', provider)
      localStorage.setItem('oauth_action', 'link')

      // Redirect to OAuth provider
      window.location.href = url
    } catch (error) {
      console.error(`Failed to link ${provider}:`, error)
      toast.error(`Failed to connect with ${provider}`)
      setLinkingProvider(null)
    }
  }

  // Handle OAuth callback for linking (when redirected back)
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const state = urlParams.get('state')
      const error = urlParams.get('error')

      if (error) {
        toast.error(`OAuth error: ${error}`)
        window.history.replaceState({}, '', window.location.pathname)
        return
      }

      if (!code) return

      const storedState = localStorage.getItem('oauth_state')
      const provider = localStorage.getItem('oauth_provider')
      const action = localStorage.getItem('oauth_action')

      // Clear stored data
      localStorage.removeItem('oauth_state')
      localStorage.removeItem('oauth_provider')
      localStorage.removeItem('oauth_action')

      if (action !== 'link') return

      if (state !== storedState) {
        toast.error('Security validation failed. Please try again.')
        window.history.replaceState({}, '', window.location.pathname)
        return
      }

      setLinkingProvider(provider)

      try {
        await api.post(`/api/auth/oauth/link/${provider}`, {
          code,
          state
        })

        toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account linked successfully!`)

        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname)

        // Refresh linked accounts
        fetchLinkedAccounts()
      } catch (error) {
        console.error('Link callback error:', error)
        toast.error(error.response?.data?.error || 'Failed to link account')
        window.history.replaceState({}, '', window.location.pathname)
      } finally {
        setLinkingProvider(null)
      }
    }

    handleCallback()
  }, [])

  const handleUnlinkAccount = async (provider) => {
    if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      return
    }

    setUnlinkingProvider(provider)

    try {
      await api.delete(`/api/auth/oauth/unlink/${provider}`)
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked`)
      fetchLinkedAccounts()
    } catch (error) {
      console.error(`Failed to unlink ${provider}:`, error)
      toast.error(error.response?.data?.error || 'Failed to unlink account')
    } finally {
      setUnlinkingProvider(null)
    }
  }

  const isLinked = (provider) => {
    return linkedAccounts.some(acc => acc.provider === provider)
  }

  const getLinkedAccount = (provider) => {
    return linkedAccounts.find(acc => acc.provider === provider)
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-dark-100 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link2 className="text-primary-500" size={24} />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Linked Accounts
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Connect your social accounts for easier login
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {availableProviders.map((provider) => {
          const Icon = providerIcons[provider]
          const linked = isLinked(provider)
          const account = getLinkedAccount(provider)
          const isLinking = linkingProvider === provider
          const isUnlinking = unlinkingProvider === provider

          return (
            <div
              key={provider}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors
                ${linked
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  provider === 'google'
                    ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    : 'bg-black'
                }`}>
                  {Icon && <Icon />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {provider}
                  </p>
                  {linked && account ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {account.email || account.name || 'Connected'}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Not connected
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {linked ? (
                  <>
                    <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <Check size={16} />
                      Linked
                    </span>
                    <button
                      onClick={() => handleUnlinkAccount(provider)}
                      disabled={isUnlinking}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isUnlinking ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Unlink size={16} />
                      )}
                      Unlink
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleLinkAccount(provider)}
                    disabled={isLinking}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLinking ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Link2 size={16} />
                    )}
                    Link Account
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Security Note */}
      <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">Security Note</p>
          <p>
            Linking social accounts allows you to sign in with them. You can unlink an account
            at any time, but you must have at least one way to sign in (either a password or
            a linked account).
          </p>
        </div>
      </div>
    </div>
  )
}

export default LinkedAccounts
