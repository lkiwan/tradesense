import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Error fetching user:', error)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, captchaToken = null) => {
    try {
      const payload = { email, password }
      if (captchaToken) {
        payload.captcha_token = captchaToken
      }

      const response = await api.post('/auth/login', payload)
      const { access_token, refresh_token, user: userData, requires_2fa, temp_token } = response.data

      // Check if 2FA is required
      if (requires_2fa) {
        return {
          success: false,
          requires_2fa: true,
          temp_token,
          message: '2FA verification required'
        }
      }

      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)

      // Store session token if provided
      if (response.data.session_token) {
        localStorage.setItem('session_token', response.data.session_token)
      }

      setUser(userData)
      setIsAuthenticated(true)

      return { success: true, user: userData, isNewDevice: response.data.is_new_device }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
        requires_captcha: error.response?.data?.requires_captcha,
        failed_attempts: error.response?.data?.failed_attempts,
        banned: error.response?.data?.banned,
        ban_reason: error.response?.data?.reason
      }
    }
  }

  const loginWith2FA = async (email, password, twoFaToken) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        two_fa_token: twoFaToken
      })
      const { access_token, refresh_token, user: userData } = response.data

      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)

      // Store session token if provided
      if (response.data.session_token) {
        localStorage.setItem('session_token', response.data.session_token)
      }

      setUser(userData)
      setIsAuthenticated(true)

      return { success: true, user: userData }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Invalid 2FA code',
        attemptsRemaining: error.response?.data?.attempts_remaining
      }
    }
  }

  const register = async (username, email, password, preferred_language = 'fr') => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password,
        preferred_language
      })
      const { access_token, refresh_token, user: userData } = response.data

      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)

      setUser(userData)
      setIsAuthenticated(true)

      return { success: true, user: userData }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('session_token')
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateUser = async (data) => {
    try {
      const response = await api.put('/auth/me', data)
      setUser(response.data.user)
      return { success: true, user: response.data.user }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Update failed'
      }
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    loginWith2FA,
    register,
    logout,
    updateUser,
    fetchUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
