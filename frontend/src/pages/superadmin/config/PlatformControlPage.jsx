import { useState, useEffect } from 'react'
import {
  Power, AlertTriangle, Bell, Shield, Users, TrendingUp,
  Save, RefreshCw, Clock, CheckCircle, XCircle, Megaphone,
  Lock, Unlock, Globe, Server, Activity, Zap, Eye
} from 'lucide-react'
import { AdminLayout, ConfirmationModal } from '../../../components/admin'
import superAdminApi from '../../../services/superAdminApi'
import toast from 'react-hot-toast'

const PlatformControlPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  // Platform status
  const [platformStatus, setPlatformStatus] = useState({
    // Maintenance Mode
    maintenance: {
      enabled: false,
      message: 'We are currently performing scheduled maintenance. Please check back soon.',
      estimatedEnd: null,
      allowAdminAccess: true
    },

    // Platform Controls
    controls: {
      registrationEnabled: true,
      loginEnabled: true,
      tradingEnabled: true,
      paymentsEnabled: true,
      payoutsEnabled: true,
      newChallengesEnabled: true,
      apiAccessEnabled: true
    },

    // Announcements
    announcement: {
      enabled: false,
      type: 'info',
      title: '',
      message: '',
      dismissible: true,
      showOnPages: ['dashboard', 'trading']
    },

    // Feature Flags
    features: {
      socialTrading: true,
      copyTrading: true,
      expertAdvisors: true,
      referralProgram: true,
      infinityPoints: true,
      premiumSubscriptions: true,
      advancedCharts: true,
      mobileApp: true
    },

    // Rate Limiting
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 60,
      loginAttemptsPerHour: 10,
      apiRequestsPerMinute: 100
    }
  })

  // System health
  const [systemHealth, setSystemHealth] = useState({
    api: { status: 'healthy', latency: 45 },
    database: { status: 'healthy', latency: 12 },
    redis: { status: 'healthy', latency: 3 },
    websocket: { status: 'healthy', connections: 1250 },
    queue: { status: 'healthy', pending: 23 }
  })

  useEffect(() => {
    fetchPlatformStatus()
    fetchSystemHealth()
  }, [])

  const fetchPlatformStatus = async () => {
    setLoading(true)
    try {
      const response = await superAdminApi.getPlatformStatus()
      if (response.data) {
        setPlatformStatus(prev => ({ ...prev, ...response.data }))
      }
    } catch (error) {
      console.error('Error fetching platform status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemHealth = async () => {
    try {
      const response = await superAdminApi.getSystemHealth()
      if (response.data) {
        setSystemHealth(response.data)
      }
    } catch (error) {
      console.error('Error fetching system health:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await superAdminApi.updatePlatformStatus(platformStatus)
      toast.success('Platform settings saved successfully')
      setShowConfirmModal(false)
    } catch (error) {
      console.error('Error saving platform status:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleMaintenanceToggle = () => {
    setConfirmAction({
      type: 'maintenance',
      enabled: !platformStatus.maintenance.enabled,
      title: platformStatus.maintenance.enabled ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode',
      message: platformStatus.maintenance.enabled
        ? 'This will restore normal platform access for all users.'
        : 'This will prevent all users from accessing the platform. Only admins will have access.'
    })
    setShowConfirmModal(true)
  }

  const handleControlToggle = (control) => {
    const isCurrentlyEnabled = platformStatus.controls[control]
    const controlLabels = {
      registrationEnabled: 'User Registration',
      loginEnabled: 'User Login',
      tradingEnabled: 'Trading',
      paymentsEnabled: 'Payments',
      payoutsEnabled: 'Payouts',
      newChallengesEnabled: 'New Challenges',
      apiAccessEnabled: 'API Access'
    }

    setConfirmAction({
      type: 'control',
      control,
      enabled: !isCurrentlyEnabled,
      title: `${isCurrentlyEnabled ? 'Disable' : 'Enable'} ${controlLabels[control]}`,
      message: isCurrentlyEnabled
        ? `This will disable ${controlLabels[control].toLowerCase()} for all users.`
        : `This will enable ${controlLabels[control].toLowerCase()} for all users.`
    })
    setShowConfirmModal(true)
  }

  const confirmToggle = async () => {
    if (confirmAction.type === 'maintenance') {
      setPlatformStatus(prev => ({
        ...prev,
        maintenance: {
          ...prev.maintenance,
          enabled: confirmAction.enabled
        }
      }))
    } else if (confirmAction.type === 'control') {
      setPlatformStatus(prev => ({
        ...prev,
        controls: {
          ...prev.controls,
          [confirmAction.control]: confirmAction.enabled
        }
      }))
    }

    // Save immediately for critical toggles
    try {
      await handleSave()
    } catch (error) {
      // Revert on error
      if (confirmAction.type === 'maintenance') {
        setPlatformStatus(prev => ({
          ...prev,
          maintenance: {
            ...prev.maintenance,
            enabled: !confirmAction.enabled
          }
        }))
      }
    }

    setShowConfirmModal(false)
    setConfirmAction(null)
  }

  const handleInputChange = (section, field, value) => {
    setPlatformStatus(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleFeatureToggle = (feature) => {
    setPlatformStatus(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }))
  }

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-400'
      case 'degraded': return 'text-yellow-400'
      case 'unhealthy': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getHealthBgColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/20'
      case 'degraded': return 'bg-yellow-500/20'
      case 'unhealthy': return 'bg-red-500/20'
      default: return 'bg-gray-500/20'
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Platform Control">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Platform Control"
      subtitle="Manage platform status, maintenance mode, and feature flags"
      breadcrumbs={[
        { label: 'SuperAdmin', href: '/superadmin/dashboard' },
        { label: 'Platform Control' }
      ]}
    >
      {/* System Health Status */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(systemHealth).map(([service, data]) => (
          <div key={service} className={`${getHealthBgColor(data.status)} rounded-xl p-4 border border-dark-200`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm capitalize">{service}</span>
              <div className={`w-2 h-2 rounded-full ${
                data.status === 'healthy' ? 'bg-green-500' :
                data.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>
            <p className={`text-lg font-bold ${getHealthStatusColor(data.status)}`}>
              {data.latency ? `${data.latency}ms` : data.connections ? `${data.connections}` : data.pending}
            </p>
          </div>
        ))}
      </div>

      {/* Maintenance Mode */}
      <div className={`rounded-xl border p-6 mb-6 ${
        platformStatus.maintenance.enabled
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-dark-100 border-dark-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl ${
              platformStatus.maintenance.enabled ? 'bg-red-500/20' : 'bg-dark-200'
            }`}>
              <Power size={32} className={platformStatus.maintenance.enabled ? 'text-red-500' : 'text-gray-400'} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Maintenance Mode</h3>
              <p className={platformStatus.maintenance.enabled ? 'text-red-400' : 'text-gray-500'}>
                {platformStatus.maintenance.enabled
                  ? 'Platform is currently in maintenance mode'
                  : 'Platform is operating normally'}
              </p>
            </div>
          </div>
          <button
            onClick={handleMaintenanceToggle}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              platformStatus.maintenance.enabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {platformStatus.maintenance.enabled ? 'Disable Maintenance' : 'Enable Maintenance'}
          </button>
        </div>

        {platformStatus.maintenance.enabled && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Maintenance Message</label>
              <textarea
                value={platformStatus.maintenance.message}
                onChange={(e) => handleInputChange('maintenance', 'message', e.target.value)}
                rows={3}
                className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none resize-none"
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowAdminAccess"
                  checked={platformStatus.maintenance.allowAdminAccess}
                  onChange={(e) => handleInputChange('maintenance', 'allowAdminAccess', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary"
                />
                <label htmlFor="allowAdminAccess" className="text-gray-300">Allow admin access</label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Platform Controls */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield size={24} className="text-primary" />
          <h3 className="text-lg font-semibold text-white">Platform Controls</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'registrationEnabled', label: 'User Registration', icon: Users, description: 'Allow new user signups' },
            { key: 'loginEnabled', label: 'User Login', icon: Lock, description: 'Allow users to log in' },
            { key: 'tradingEnabled', label: 'Trading', icon: TrendingUp, description: 'Allow opening/closing trades' },
            { key: 'paymentsEnabled', label: 'Payments', icon: Zap, description: 'Allow payment processing' },
            { key: 'payoutsEnabled', label: 'Payouts', icon: Activity, description: 'Allow payout requests' },
            { key: 'newChallengesEnabled', label: 'New Challenges', icon: Globe, description: 'Allow purchasing challenges' }
          ].map((control) => (
            <div
              key={control.key}
              className={`p-4 rounded-lg border transition-colors ${
                platformStatus.controls[control.key]
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <control.icon size={18} className={platformStatus.controls[control.key] ? 'text-green-400' : 'text-red-400'} />
                  <span className="text-white font-medium">{control.label}</span>
                </div>
                <button
                  onClick={() => handleControlToggle(control.key)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    platformStatus.controls[control.key] ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    platformStatus.controls[control.key] ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <p className="text-gray-500 text-sm">{control.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Announcement */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Megaphone size={24} className="text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Platform Announcement</h3>
          </div>
          <button
            onClick={() => handleInputChange('announcement', 'enabled', !platformStatus.announcement.enabled)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              platformStatus.announcement.enabled ? 'bg-primary' : 'bg-dark-300'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
              platformStatus.announcement.enabled ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {platformStatus.announcement.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Announcement Type</label>
                <select
                  value={platformStatus.announcement.type}
                  onChange={(e) => handleInputChange('announcement', 'type', e.target.value)}
                  className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
                >
                  <option value="info">Info (Blue)</option>
                  <option value="success">Success (Green)</option>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="error">Error (Red)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Title</label>
                <input
                  type="text"
                  value={platformStatus.announcement.title}
                  onChange={(e) => handleInputChange('announcement', 'title', e.target.value)}
                  placeholder="Announcement title"
                  className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Message</label>
              <textarea
                value={platformStatus.announcement.message}
                onChange={(e) => handleInputChange('announcement', 'message', e.target.value)}
                rows={3}
                placeholder="Enter announcement message..."
                className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="dismissible"
                checked={platformStatus.announcement.dismissible}
                onChange={(e) => handleInputChange('announcement', 'dismissible', e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary"
              />
              <label htmlFor="dismissible" className="text-gray-300">Allow users to dismiss</label>
            </div>

            {/* Preview */}
            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-2">Preview</label>
              <div className={`p-4 rounded-lg border ${
                platformStatus.announcement.type === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                platformStatus.announcement.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                platformStatus.announcement.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {platformStatus.announcement.title && (
                  <p className="font-medium mb-1">{platformStatus.announcement.title}</p>
                )}
                <p className="text-sm opacity-80">{platformStatus.announcement.message || 'Your message will appear here...'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Flags */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap size={24} className="text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Feature Flags</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: 'socialTrading', label: 'Social Trading' },
            { key: 'copyTrading', label: 'Copy Trading' },
            { key: 'expertAdvisors', label: 'Expert Advisors' },
            { key: 'referralProgram', label: 'Referral Program' },
            { key: 'infinityPoints', label: 'Infinity Points' },
            { key: 'premiumSubscriptions', label: 'Premium Subscriptions' },
            { key: 'advancedCharts', label: 'Advanced Charts' },
            { key: 'mobileApp', label: 'Mobile App Access' }
          ].map((feature) => (
            <div
              key={feature.key}
              className="flex items-center justify-between p-3 bg-dark-200 rounded-lg"
            >
              <span className="text-white text-sm">{feature.label}</span>
              <button
                onClick={() => handleFeatureToggle(feature.key)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  platformStatus.features[feature.key] ? 'bg-primary' : 'bg-dark-300'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  platformStatus.features[feature.key] ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Rate Limiting</h3>
          </div>
          <button
            onClick={() => handleInputChange('rateLimiting', 'enabled', !platformStatus.rateLimiting.enabled)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              platformStatus.rateLimiting.enabled ? 'bg-primary' : 'bg-dark-300'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
              platformStatus.rateLimiting.enabled ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {platformStatus.rateLimiting.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Requests per Minute</label>
              <input
                type="number"
                value={platformStatus.rateLimiting.requestsPerMinute}
                onChange={(e) => handleInputChange('rateLimiting', 'requestsPerMinute', parseInt(e.target.value))}
                className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Login Attempts per Hour</label>
              <input
                type="number"
                value={platformStatus.rateLimiting.loginAttemptsPerHour}
                onChange={(e) => handleInputChange('rateLimiting', 'loginAttemptsPerHour', parseInt(e.target.value))}
                className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">API Requests per Minute</label>
              <input
                type="number"
                value={platformStatus.rateLimiting.apiRequestsPerMinute}
                onChange={(e) => handleInputChange('rateLimiting', 'apiRequestsPerMinute', parseInt(e.target.value))}
                className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={fetchPlatformStatus}
          className="flex items-center gap-2 px-6 py-3 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors"
        >
          <RefreshCw size={18} />
          Reset Changes
        </button>
        <button
          onClick={() => {
            setConfirmAction({ type: 'save' })
            setShowConfirmModal(true)
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Save size={18} />
          Save All Changes
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false)
            setConfirmAction(null)
          }}
          onConfirm={confirmAction.type === 'save' ? handleSave : confirmToggle}
          title={confirmAction.type === 'save' ? 'Save Platform Settings' : confirmAction.title}
          message={confirmAction.type === 'save'
            ? 'Are you sure you want to save all platform settings? This may affect user access.'
            : confirmAction.message
          }
          confirmText={saving ? 'Saving...' : 'Confirm'}
          variant={confirmAction.type === 'maintenance' || (confirmAction.type === 'control' && !confirmAction.enabled) ? 'danger' : 'warning'}
        />
      )}
    </AdminLayout>
  )
}

export default PlatformControlPage
