import { useState } from 'react'
import { X, Ban, AlertTriangle } from 'lucide-react'

const UserBanModal = ({ user, onClose, onBan }) => {
  const [formData, setFormData] = useState({
    reason: '',
    duration: 'permanent' // permanent, 24h, 7d, 30d, custom
  })
  const [customDays, setCustomDays] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const durations = [
    { value: 'permanent', label: 'Permanent' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'custom', label: 'Custom' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.reason.trim()) {
      setError('Please provide a reason for the ban')
      return
    }

    setLoading(true)
    try {
      let expiresAt = null
      if (formData.duration !== 'permanent') {
        const now = new Date()
        switch (formData.duration) {
          case '24h':
            expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
            break
          case '7d':
            expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            break
          case '30d':
            expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            break
          case 'custom':
            expiresAt = new Date(now.getTime() + customDays * 24 * 60 * 60 * 1000)
            break
        }
      }

      await onBan({
        reason: formData.reason,
        expires_at: expiresAt?.toISOString() || null
      })
    } catch (error) {
      console.error('Error banning user:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-dark-100 rounded-xl border border-dark-200 shadow-xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Ban size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-white">Ban User</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Warning */}
          <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium">Warning</p>
              <p className="text-sm text-red-400 mt-1">
                You are about to ban <span className="font-medium text-white">{user?.username}</span>.
                This will prevent them from logging in and accessing the platform.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Reason for ban <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, reason: e.target.value }))
                  setError('')
                }}
                rows={3}
                className={`w-full bg-dark-200 text-white rounded-lg px-4 py-2.5 border ${
                  error ? 'border-red-500' : 'border-dark-300'
                } focus:border-primary focus:outline-none resize-none`}
                placeholder="Describe why this user is being banned..."
              />
              {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Ban Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {durations.map(duration => (
                  <button
                    key={duration.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, duration: duration.value }))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.duration === duration.value
                        ? 'bg-red-500 text-white'
                        : 'bg-dark-200 text-gray-400 hover:text-white'
                    }`}
                  >
                    {duration.label}
                  </button>
                ))}
              </div>

              {/* Custom days input */}
              {formData.duration === 'custom' && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDays}
                    onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                    className="w-20 bg-dark-200 text-white rounded-lg px-3 py-2 border border-dark-300 focus:border-primary focus:outline-none"
                  />
                  <span className="text-gray-400">days</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                )}
                <Ban size={16} />
                Ban User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserBanModal
