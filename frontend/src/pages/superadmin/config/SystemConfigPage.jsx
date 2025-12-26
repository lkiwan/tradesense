import { useState, useEffect } from 'react'
import {
  Key, CreditCard, Mail, Globe, Shield, Database,
  Save, RefreshCw, Eye, EyeOff, CheckCircle, AlertTriangle,
  Server, Cloud, Lock, Settings
} from 'lucide-react'
import { AdminLayout, ConfirmationModal } from '../../../components/admin'
import superAdminApi from '../../../services/superAdminApi'
import toast from 'react-hot-toast'

const SystemConfigPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('payment')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingChanges, setPendingChanges] = useState(null)

  // Password visibility toggles
  const [showSecrets, setShowSecrets] = useState({})

  // Configuration state
  const [config, setConfig] = useState({
    // Payment Gateways
    stripe: {
      enabled: true,
      publicKey: '',
      secretKey: '',
      webhookSecret: '',
      testMode: true
    },
    paypal: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      testMode: true
    },
    crypto: {
      enabled: false,
      walletAddress: '',
      network: 'ethereum'
    },

    // Email Settings
    email: {
      provider: 'smtp',
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      smtpSecure: true,
      fromEmail: '',
      fromName: 'TradeSense',
      sendgridApiKey: '',
      mailgunApiKey: '',
      mailgunDomain: ''
    },

    // Third-party Services
    services: {
      sentryDsn: '',
      googleAnalyticsId: '',
      recaptchaSiteKey: '',
      recaptchaSecretKey: '',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: ''
    },

    // Database & Cache
    infrastructure: {
      redisUrl: '',
      databaseUrl: '',
      s3Bucket: '',
      s3AccessKey: '',
      s3SecretKey: '',
      cdnUrl: ''
    }
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const response = await superAdminApi.getSystemConfig()
      if (response.data) {
        setConfig(prev => ({ ...prev, ...response.data }))
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      toast.error('Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await superAdminApi.updateSystemConfig(config)
      toast.success('Configuration saved successfully')
      setShowConfirmModal(false)
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const toggleSecretVisibility = (key) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const maskValue = (value, key) => {
    if (!value) return ''
    if (showSecrets[key]) return value
    return '••••••••••••••••'
  }

  const tabs = [
    { id: 'payment', label: 'Payment Gateways', icon: CreditCard },
    { id: 'email', label: 'Email Settings', icon: Mail },
    { id: 'services', label: 'Third-party Services', icon: Cloud },
    { id: 'infrastructure', label: 'Infrastructure', icon: Server }
  ]

  const renderSecretInput = (section, field, label, placeholder, key) => (
    <div>
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <div className="relative">
        <input
          type={showSecrets[key] ? 'text' : 'password'}
          value={config[section]?.[field] || ''}
          onChange={(e) => handleInputChange(section, field, e.target.value)}
          placeholder={placeholder}
          className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 pr-12 border border-dark-300 focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={() => toggleSecretVisibility(key)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
        >
          {showSecrets[key] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )

  const renderTextInput = (section, field, label, placeholder, type = 'text') => (
    <div>
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <input
        type={type}
        value={config[section]?.[field] || ''}
        onChange={(e) => handleInputChange(section, field, type === 'number' ? parseInt(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
      />
    </div>
  )

  const renderToggle = (section, field, label, description) => (
    <div className="flex items-center justify-between p-4 bg-dark-200 rounded-lg">
      <div>
        <p className="text-white font-medium">{label}</p>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
      <button
        onClick={() => handleInputChange(section, field, !config[section]?.[field])}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          config[section]?.[field] ? 'bg-primary' : 'bg-dark-300'
        }`}
      >
        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
          config[section]?.[field] ? 'translate-x-8' : 'translate-x-1'
        }`} />
      </button>
    </div>
  )

  if (loading) {
    return (
      <AdminLayout title="System Configuration">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="System Configuration"
      subtitle="Manage API keys, payment gateways, and system settings"
      breadcrumbs={[
        { label: 'SuperAdmin', href: '/superadmin/dashboard' },
        { label: 'System Configuration' }
      ]}
    >
      {/* Warning Banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-yellow-500 font-medium">Sensitive Configuration</p>
          <p className="text-yellow-500/70 text-sm">
            Changes to these settings can affect system functionality. Make sure to test in a staging environment first.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-dark-100 text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payment Gateways Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          {/* Stripe */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <CreditCard size={24} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Stripe</h3>
                  <p className="text-gray-500 text-sm">Primary payment processor</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {config.stripe?.enabled && (
                  <span className="flex items-center gap-1 text-green-400 text-sm">
                    <CheckCircle size={14} />
                    Connected
                  </span>
                )}
              </div>
            </div>

            {renderToggle('stripe', 'enabled', 'Enable Stripe', 'Accept credit card payments via Stripe')}

            {config.stripe?.enabled && (
              <div className="mt-4 space-y-4">
                {renderToggle('stripe', 'testMode', 'Test Mode', 'Use Stripe test environment')}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {renderTextInput('stripe', 'publicKey', 'Publishable Key', 'pk_test_...')}
                  {renderSecretInput('stripe', 'secretKey', 'Secret Key', 'sk_test_...', 'stripeSecret')}
                </div>

                {renderSecretInput('stripe', 'webhookSecret', 'Webhook Secret', 'whsec_...', 'stripeWebhook')}
              </div>
            )}
          </div>

          {/* PayPal */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <CreditCard size={24} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">PayPal</h3>
                  <p className="text-gray-500 text-sm">Alternative payment method</p>
                </div>
              </div>
            </div>

            {renderToggle('paypal', 'enabled', 'Enable PayPal', 'Accept PayPal payments')}

            {config.paypal?.enabled && (
              <div className="mt-4 space-y-4">
                {renderToggle('paypal', 'testMode', 'Sandbox Mode', 'Use PayPal sandbox environment')}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {renderTextInput('paypal', 'clientId', 'Client ID', 'AZ...')}
                  {renderSecretInput('paypal', 'clientSecret', 'Client Secret', 'EG...', 'paypalSecret')}
                </div>
              </div>
            )}
          </div>

          {/* Crypto */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-500/20">
                  <Globe size={24} className="text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Cryptocurrency</h3>
                  <p className="text-gray-500 text-sm">Accept crypto payments</p>
                </div>
              </div>
            </div>

            {renderToggle('crypto', 'enabled', 'Enable Crypto', 'Accept cryptocurrency payments')}

            {config.crypto?.enabled && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Network</label>
                  <select
                    value={config.crypto?.network || 'ethereum'}
                    onChange={(e) => handleInputChange('crypto', 'network', e.target.value)}
                    className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
                  >
                    <option value="ethereum">Ethereum (ETH)</option>
                    <option value="bitcoin">Bitcoin (BTC)</option>
                    <option value="usdt">USDT (Tether)</option>
                    <option value="usdc">USDC</option>
                  </select>
                </div>
                {renderTextInput('crypto', 'walletAddress', 'Wallet Address', '0x...')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Settings Tab */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-green-500/20">
                <Mail size={24} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Email Configuration</h3>
                <p className="text-gray-500 text-sm">Configure email sending service</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email Provider</label>
                <select
                  value={config.email?.provider || 'smtp'}
                  onChange={(e) => handleInputChange('email', 'provider', e.target.value)}
                  className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
                >
                  <option value="smtp">SMTP</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderTextInput('email', 'fromEmail', 'From Email', 'noreply@tradesense.com')}
                {renderTextInput('email', 'fromName', 'From Name', 'TradeSense')}
              </div>

              {config.email?.provider === 'smtp' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderTextInput('email', 'smtpHost', 'SMTP Host', 'smtp.gmail.com')}
                    {renderTextInput('email', 'smtpPort', 'SMTP Port', '587', 'number')}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderTextInput('email', 'smtpUser', 'SMTP Username', 'username')}
                    {renderSecretInput('email', 'smtpPassword', 'SMTP Password', '••••••••', 'smtpPassword')}
                  </div>
                  {renderToggle('email', 'smtpSecure', 'Use TLS/SSL', 'Enable secure connection')}
                </>
              )}

              {config.email?.provider === 'sendgrid' && (
                renderSecretInput('email', 'sendgridApiKey', 'SendGrid API Key', 'SG.xxx', 'sendgridKey')
              )}

              {config.email?.provider === 'mailgun' && (
                <div className="space-y-4">
                  {renderSecretInput('email', 'mailgunApiKey', 'Mailgun API Key', 'key-xxx', 'mailgunKey')}
                  {renderTextInput('email', 'mailgunDomain', 'Mailgun Domain', 'mg.example.com')}
                </div>
              )}
            </div>
          </div>

          {/* Test Email */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Test Email Configuration</h3>
            <div className="flex gap-4">
              <input
                type="email"
                placeholder="Enter test email address"
                className="flex-1 bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
              />
              <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                Send Test Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Third-party Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Error Tracking */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-red-500/20">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Error Tracking (Sentry)</h3>
                <p className="text-gray-500 text-sm">Monitor application errors</p>
              </div>
            </div>
            {renderSecretInput('services', 'sentryDsn', 'Sentry DSN', 'https://xxx@sentry.io/xxx', 'sentryDsn')}
          </div>

          {/* Analytics */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Globe size={24} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Google Analytics</h3>
                <p className="text-gray-500 text-sm">Track website analytics</p>
              </div>
            </div>
            {renderTextInput('services', 'googleAnalyticsId', 'Measurement ID', 'G-XXXXXXXXXX')}
          </div>

          {/* reCAPTCHA */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-green-500/20">
                <Shield size={24} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Google reCAPTCHA</h3>
                <p className="text-gray-500 text-sm">Protect forms from spam</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderTextInput('services', 'recaptchaSiteKey', 'Site Key', '6Lc...')}
              {renderSecretInput('services', 'recaptchaSecretKey', 'Secret Key', '6Lc...', 'recaptchaSecret')}
            </div>
          </div>

          {/* Twilio */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Settings size={24} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Twilio (SMS)</h3>
                <p className="text-gray-500 text-sm">Send SMS notifications</p>
              </div>
            </div>
            <div className="space-y-4">
              {renderTextInput('services', 'twilioAccountSid', 'Account SID', 'AC...')}
              {renderSecretInput('services', 'twilioAuthToken', 'Auth Token', '...', 'twilioToken')}
              {renderTextInput('services', 'twilioPhoneNumber', 'Phone Number', '+1234567890')}
            </div>
          </div>
        </div>
      )}

      {/* Infrastructure Tab */}
      {activeTab === 'infrastructure' && (
        <div className="space-y-6">
          {/* Redis */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-red-500/20">
                <Database size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Redis Cache</h3>
                <p className="text-gray-500 text-sm">In-memory data store</p>
              </div>
            </div>
            {renderSecretInput('infrastructure', 'redisUrl', 'Redis URL', 'redis://localhost:6379', 'redisUrl')}
          </div>

          {/* Database */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Database size={24} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Database</h3>
                <p className="text-gray-500 text-sm">PostgreSQL connection</p>
              </div>
            </div>
            {renderSecretInput('infrastructure', 'databaseUrl', 'Database URL', 'postgresql://...', 'dbUrl')}
          </div>

          {/* S3 Storage */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-orange-500/20">
                <Cloud size={24} className="text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">S3 Storage</h3>
                <p className="text-gray-500 text-sm">File storage configuration</p>
              </div>
            </div>
            <div className="space-y-4">
              {renderTextInput('infrastructure', 's3Bucket', 'Bucket Name', 'tradesense-uploads')}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderSecretInput('infrastructure', 's3AccessKey', 'Access Key', 'AKIA...', 's3Access')}
                {renderSecretInput('infrastructure', 's3SecretKey', 'Secret Key', '...', 's3Secret')}
              </div>
              {renderTextInput('infrastructure', 'cdnUrl', 'CDN URL (optional)', 'https://cdn.example.com')}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={fetchConfig}
          className="flex items-center gap-2 px-6 py-3 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors"
        >
          <RefreshCw size={18} />
          Reset Changes
        </button>
        <button
          onClick={() => setShowConfirmModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Save size={18} />
          Save Configuration
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleSave}
          title="Save Configuration"
          message="Are you sure you want to save these configuration changes? This may affect system functionality."
          confirmText={saving ? 'Saving...' : 'Save Changes'}
          variant="warning"
        />
      )}
    </AdminLayout>
  )
}

export default SystemConfigPage
