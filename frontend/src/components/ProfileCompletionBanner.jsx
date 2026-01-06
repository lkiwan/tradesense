import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { User, ArrowRight, AlertCircle, Shield, CheckCircle } from 'lucide-react'

const ProfileCompletionBanner = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Don't show if profile is complete
  if (!user || user.profile_complete) {
    return null
  }

  // Calculate missing fields
  const missingFields = []
  if (!user.full_name) missingFields.push(t('profile.fullName', 'Full Name'))
  if (!user.phone) missingFields.push(t('profile.phone', 'Phone'))
  if (!user.country) missingFields.push(t('profile.country', 'Country'))
  if (!user.gender) missingFields.push(t('profile.gender', 'Gender'))

  // Calculate completion percentage
  const totalFields = 4
  const completedFields = totalFields - missingFields.length
  const completionPercent = Math.round((completedFields / totalFields) * 100)

  return (
    <>
      {/* Full Screen Overlay */}
      <div className="fixed inset-0 z-[100] bg-dark-400/95 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Card */}
          <div className="bg-dark-100 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-primary-500 to-purple-600 p-6 text-white text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <User size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {t('profile.welcomeTitle', 'Welcome to TradeSense!')}
              </h2>
              <p className="text-white/80">
                {t('profile.welcomeSubtitle', 'Complete your profile to get started')}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{t('profile.completion', 'Profile Completion')}</span>
                  <span className="text-sm font-bold text-primary-400">{completionPercent}%</span>
                </div>
                <div className="w-full h-3 bg-dark-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              {/* Why complete profile */}
              <div className="bg-dark-200/50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Shield size={18} className="text-primary-400" />
                  {t('profile.whyComplete', 'Why complete your profile?')}
                </h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                    {t('profile.benefit1', 'Access all trading features')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                    {t('profile.benefit2', 'Purchase challenges and start trading')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                    {t('profile.benefit3', 'Receive payouts securely')}
                  </li>
                </ul>
              </div>

              {/* Missing fields */}
              {missingFields.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                    <AlertCircle size={14} className="text-yellow-400" />
                    {t('profile.missingInfo', 'Missing information')}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missingFields.map((field, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-yellow-500/10 text-yellow-400 text-sm rounded-full border border-yellow-500/20"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={() => navigate('/profile/default')}
                className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('profile.completeNow', 'Complete Profile Now')}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProfileCompletionBanner
