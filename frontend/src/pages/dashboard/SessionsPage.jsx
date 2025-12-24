import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { sessionsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  Shield,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  MapPin,
  Loader2,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Chrome,
  RefreshCw
} from 'lucide-react'

// Browser icons mapping
const BrowserIcon = ({ browser }) => {
  // Default to Chrome icon for all browsers (simplified)
  return <Chrome size={18} className="text-gray-400" />
}

// Device type icons
const DeviceIcon = ({ type }) => {
  switch (type?.toLowerCase()) {
    case 'mobile':
      return <Smartphone size={24} className="text-primary-400" />
    case 'tablet':
      return <Tablet size={24} className="text-purple-400" />
    default:
      return <Monitor size={24} className="text-blue-400" />
  }
}

const SessionsPage = () => {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState(null)
  const [revokingAll, setRevokingAll] = useState(false)

  // Get session token from localStorage
  const currentSessionToken = localStorage.getItem('session_token')

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const response = await sessionsAPI.getAll()
      setSessions(response.data.sessions || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeSession = async (sessionId) => {
    setRevoking(sessionId)
    try {
      await sessionsAPI.revoke(sessionId)
      setSessions(sessions.filter(s => s.id !== sessionId))
      toast.success('Session revoked successfully')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to revoke session')
    } finally {
      setRevoking(null)
    }
  }

  const handleRevokeAll = async () => {
    if (!confirm('Are you sure you want to sign out from all other devices?')) {
      return
    }

    setRevokingAll(true)
    try {
      const response = await sessionsAPI.revokeAll()
      toast.success(`${response.data.revoked_count} session(s) revoked`)
      loadSessions()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to revoke sessions')
    } finally {
      setRevokingAll(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateString)
  }

  const otherSessions = sessions.filter(s => !s.is_current)
  const currentSession = sessions.find(s => s.is_current)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <Shield className="text-primary-400" size={24} />
            </div>
            Active Sessions
          </h1>
          <p className="text-gray-400 mt-1">
            Manage devices where you're signed in
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadSessions}
            disabled={loading}
            className="p-2 bg-dark-100 hover:bg-dark-200 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          {otherSessions.length > 0 && (
            <button
              onClick={handleRevokeAll}
              disabled={revokingAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {revokingAll ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <LogOut size={18} />
              )}
              Sign out all other devices
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary-400" size={40} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Session */}
          {currentSession && (
            <div className="bg-dark-100 rounded-xl border border-primary-500/30 p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-500/10 rounded-xl">
                  <DeviceIcon type={currentSession.device_type} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">
                      {currentSession.browser} on {currentSession.os}
                    </h3>
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                      <CheckCircle size={12} />
                      Current session
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Globe size={14} />
                      {currentSession.ip_address || 'Unknown IP'}
                    </span>
                    {(currentSession.city || currentSession.country) && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {[currentSession.city, currentSession.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Active {getRelativeTime(currentSession.last_activity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Sessions */}
          {otherSessions.length > 0 ? (
            <div className="bg-dark-100 rounded-xl border border-dark-200">
              <div className="p-4 border-b border-dark-200">
                <h3 className="font-semibold text-white">Other Active Sessions</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {otherSessions.length} other device{otherSessions.length !== 1 ? 's' : ''} signed in
                </p>
              </div>
              <div className="divide-y divide-dark-200">
                {otherSessions.map((session) => (
                  <div key={session.id} className="p-4 flex items-start gap-4">
                    <div className="p-3 bg-dark-200 rounded-xl">
                      <DeviceIcon type={session.device_type} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">
                          {session.browser} on {session.os}
                        </h4>
                        {session.is_suspicious && (
                          <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs font-medium rounded-full flex items-center gap-1">
                            <AlertTriangle size={12} />
                            New device
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Globe size={14} />
                          {session.ip_address || 'Unknown IP'}
                        </span>
                        {(session.city || session.country) && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {[session.city, session.country].filter(Boolean).join(', ')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          Last active {getRelativeTime(session.last_activity)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Signed in {formatDate(session.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revoking === session.id}
                      className="px-4 py-2 bg-dark-200 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {revoking === session.id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        'Revoke'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-8 text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-400" size={32} />
              </div>
              <h3 className="font-semibold text-white mb-2">No Other Sessions</h3>
              <p className="text-gray-400">
                You're only signed in on this device.
              </p>
            </div>
          )}

          {/* Security Tips */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-5">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Shield size={18} className="text-primary-400" />
              Security Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                Regularly review your active sessions and revoke any you don't recognize.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                Enable two-factor authentication for extra security.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                Sign out from all devices if you suspect unauthorized access.
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-dark-200">
              <button
                onClick={() => navigate('/settings')}
                className="text-primary-400 hover:text-primary-300 text-sm font-medium"
              >
                Go to Security Settings →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SessionsPage
