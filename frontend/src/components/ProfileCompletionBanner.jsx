import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { User, X, ArrowRight, AlertCircle } from 'lucide-react'

const ProfileCompletionBanner = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  // Don't show if profile is complete or banner is dismissed
  if (!user || user.profile_complete || dismissed) {
    return null
  }

  // Calculate missing fields
  const missingFields = []
  if (!user.full_name) missingFields.push(t('profile.fullName'))
  if (!user.phone) missingFields.push(t('profile.phone'))
  if (!user.country) missingFields.push(t('profile.country'))

  // Calculate completion percentage
  const totalFields = 3
  const completedFields = totalFields - missingFields.length
  const completionPercent = Math.round((completedFields / totalFields) * 100)

  return (
    <div className="bg-gradient-to-r from-primary-500 to-purple-600 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-full">
            <User size={18} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <p className="text-sm font-medium">
              {t('profile.completeBanner', 'Complete your profile to unlock all features')}
            </p>
            <div className="flex items-center gap-2">
              {/* Progress bar */}
              <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <span className="text-xs text-white/80">{completionPercent}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Missing fields hint */}
          {missingFields.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-white/80">
              <AlertCircle size={12} />
              <span>{t('profile.missing', 'Missing')}: {missingFields.join(', ')}</span>
            </div>
          )}

          <button
            onClick={() => navigate('/dashboard/profile')}
            className="flex items-center gap-1 text-sm font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-all"
          >
            {t('profile.complete', 'Complete Profile')}
            <ArrowRight size={14} />
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition-all"
            title={t('common.dismiss', 'Dismiss')}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileCompletionBanner
