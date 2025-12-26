import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react'

const ConfirmationModal = ({
  isOpen = true,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // danger, warning, info, success
  loading = false
}) => {
  if (!isOpen) return null

  const variants = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      buttonBg: 'bg-red-500 hover:bg-red-600'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-500',
      buttonBg: 'bg-yellow-500 hover:bg-yellow-600'
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      buttonBg: 'bg-blue-500 hover:bg-blue-600'
    },
    success: {
      icon: CheckCircle,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-500',
      buttonBg: 'bg-green-500 hover:bg-green-600'
    }
  }

  const { icon: Icon, iconBg, iconColor, buttonBg } = variants[variant]

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
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${iconBg}`}>
                <Icon size={24} className={iconColor} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{message}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-dark-200/50 rounded-b-xl">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${buttonBg}`}
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal
