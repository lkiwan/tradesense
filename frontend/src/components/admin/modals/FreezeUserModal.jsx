import { useState } from 'react'
import { X, Snowflake, Clock } from 'lucide-react'

const FreezeUserModal = ({ user, onClose, onFreeze }) => {
  const [formData, setFormData] = useState({
    hours: 24,
    reason: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const presetHours = [
    { value: 1, label: '1 Hour' },
    { value: 6, label: '6 Hours' },
    { value: 12, label: '12 Hours' },
    { value: 24, label: '24 Hours' },
    { value: 48, label: '48 Hours' },
    { value: 72, label: '72 Hours' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.reason.trim()) {
      setError('Please provide a reason for freezing')
      return
    }
    if (formData.hours < 1 || formData.hours > 720) {
      setError('Hours must be between 1 and 720 (30 days)')
      return
    }

    setLoading(true)
    try {
      await onFreeze({
        hours: formData.hours,
        reason: formData.reason
      })
    } catch (error) {
      console.error('Error freezing user:', error)
    } finally {
      setLoading(false)
    }
  }

  const getExpiryTime = () => {
    const expiry = new Date(Date.now() + formData.hours * 60 * 60 * 1000)
    return expiry.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Snowflake size={20} className="text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-white">Freeze User</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Info */}
          <div className="mx-6 mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400">
              Freezing <span className="font-medium text-white">{user?.username}</span> will temporarily
              restrict their account. They won't be able to perform any actions until the freeze expires.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Freeze Duration
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {presetHours.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, hours: preset.value }))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.hours === preset.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-dark-200 text-gray-400 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom hours input */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Or custom:</span>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={formData.hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours: parseInt(e.target.value) || 1 }))}
                  className="w-20 bg-dark-200 text-white rounded-lg px-3 py-2 border border-dark-300 focus:border-primary focus:outline-none text-sm"
                />
                <span className="text-gray-400 text-sm">hours</span>
              </div>

              {/* Expiry preview */}
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                <Clock size={14} />
                <span>Will expire: {getExpiryTime()}</span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Reason for freeze <span className="text-red-500">*</span>
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
                placeholder="Describe why this user is being frozen..."
              />
              {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
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
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                )}
                <Snowflake size={16} />
                Freeze User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FreezeUserModal
