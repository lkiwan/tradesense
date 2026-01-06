import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Mail, Phone, MapPin, Edit2, Camera, Shield, Award, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { t } = useTranslation()
  const { user, updateUser, fetchUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    phone: '',
    country: ''
  })

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        full_name: user.full_name || '',
        phone: user.phone || '',
        country: user.country || ''
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await api.put('/auth/me', formData)
      if (response.data.user) {
        // Update user in context
        if (updateUser) {
          updateUser(response.data.user)
        } else if (fetchUser) {
          await fetchUser()
        }
        toast.success(t('profile.saveSuccess', 'Profile updated successfully!'))
        setIsEditing(false)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || t('profile.saveError', 'Failed to update profile')
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form to current user data
    if (user) {
      setFormData({
        username: user.username || '',
        full_name: user.full_name || '',
        phone: user.phone || '',
        country: user.country || ''
      })
    }
    setIsEditing(false)
  }

  // Calculate profile completion
  const requiredFields = ['full_name', 'phone', 'country']
  const completedFields = requiredFields.filter(field => user?.[field])
  const completionPercent = Math.round((completedFields.length / requiredFields.length) * 100)
  const isProfileComplete = completionPercent === 100

  return (
    <div className="space-y-4 md:space-y-6 px-0">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
          <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30">
            <User className="text-primary-400" size={20} />
          </div>
          {t('profile.title')}
        </h1>
        <p className="text-gray-400 mt-1 text-sm md:text-base">{t('profile.subtitle')}</p>
      </div>

      {/* Profile Completion Card - Show only when not complete */}
      {!isProfileComplete && (
        <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 backdrop-blur-xl rounded-xl border border-primary-500/30 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/20">
                <AlertCircle size={20} className="text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{t('profile.completeProfile', 'Complete Your Profile')}</h3>
                <p className="text-sm text-gray-400">
                  {t('profile.completeProfileDesc', 'Fill in all required information to unlock all features')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 h-3 bg-dark-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <span className="text-sm font-bold text-primary-400">{completionPercent}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Profile Card */}
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 md:p-6 text-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary-500/20 rounded-full blur-[60px]" />

          <div className="relative">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 ring-4 ring-dark-100">
                <span className="text-white font-bold text-3xl">
                  {user?.full_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-dark-200 hover:bg-primary-500 rounded-full border border-white/10 text-gray-400 hover:text-white transition-all duration-300">
                <Camera size={14} />
              </button>
            </div>
            <h3 className="text-xl font-bold text-white">{user?.full_name || user?.username || 'Utilisateur'}</h3>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full border ${
              isProfileComplete
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-yellow-500/10 border-yellow-500/30'
            }`}>
              {isProfileComplete ? (
                <>
                  <CheckCircle size={14} className="text-green-400" />
                  <span className="text-sm text-green-400 font-medium">{t('profile.profileComplete', 'Profile Complete')}</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} className="text-yellow-400" />
                  <span className="text-sm text-yellow-400 font-medium">{t('profile.profileIncomplete', 'Profile Incomplete')}</span>
                </>
              )}
            </div>
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">12</p>
                  <p className="text-xs text-gray-400">{t('profile.trades')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">78%</p>
                  <p className="text-xs text-gray-400">{t('profile.winRate')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-400">1</p>
                  <p className="text-xs text-gray-400">{t('profile.challenges')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Form */}
        <div className="lg:col-span-2 bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
            <h3 className="font-semibold text-white">{t('profile.personalInfo')}</h3>
            <button
              onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 min-h-[44px] w-full sm:w-auto ${
                isEditing
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                  : 'bg-dark-200 hover:bg-dark-300 text-gray-400 hover:text-white'
              }`}
            >
              <Edit2 size={16} />
              {isEditing ? t('profile.cancel') : t('profile.edit')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {/* Full Name - Required */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                {t('profile.fullName', 'Full Name')}
                <span className="text-red-400">*</span>
                {!user?.full_name && (
                  <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">
                    {t('profile.required', 'Required')}
                  </span>
                )}
              </label>
              <div className="relative group">
                <User className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder={t('profile.fullNamePlaceholder', 'Enter your full name')}
                  disabled={!isEditing}
                  className={`w-full bg-dark-200/50 border rounded-xl px-10 md:px-12 py-3 md:py-3.5 text-white text-sm md:text-base placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 min-h-[48px] ${
                    !user?.full_name && !isEditing ? 'border-yellow-500/30' : 'border-white/5'
                  }`}
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('profile.username')}</label>
              <div className="relative group">
                <User className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-10 md:px-12 py-3 md:py-3.5 text-white text-sm md:text-base disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 min-h-[48px]"
                />
              </div>
            </div>

            {/* Email - Read only */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('profile.email')}</label>
              <div className="relative group">
                <Mail className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-10 md:px-12 py-3 md:py-3.5 text-white text-sm md:text-base opacity-50 cursor-not-allowed min-h-[48px]"
                />
              </div>
            </div>

            {/* Phone - Required */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                {t('profile.phone')}
                <span className="text-red-400">*</span>
                {!user?.phone && (
                  <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">
                    {t('profile.required', 'Required')}
                  </span>
                )}
              </label>
              <div className="relative group">
                <Phone className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+212 6 12 34 56 78"
                  disabled={!isEditing}
                  className={`w-full bg-dark-200/50 border rounded-xl px-10 md:px-12 py-3 md:py-3.5 text-white text-sm md:text-base placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 min-h-[48px] ${
                    !user?.phone && !isEditing ? 'border-yellow-500/30' : 'border-white/5'
                  }`}
                />
              </div>
            </div>

            {/* Country - Required */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                {t('profile.country')}
                <span className="text-red-400">*</span>
                {!user?.country && (
                  <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">
                    {t('profile.required', 'Required')}
                  </span>
                )}
              </label>
              <div className="relative group">
                <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder={t('profile.countryPlaceholder', 'Morocco')}
                  disabled={!isEditing}
                  className={`w-full bg-dark-200/50 border rounded-xl px-10 md:px-12 py-3 md:py-3.5 text-white text-sm md:text-base placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 min-h-[48px] ${
                    !user?.country && !isEditing ? 'border-yellow-500/30' : 'border-white/5'
                  }`}
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 md:mt-6 px-6 py-3 md:py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] min-h-[48px] w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  {t('profile.saving', 'Saving...')}
                </>
              ) : (
                t('profile.save')
              )}
            </button>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 md:p-6">
        <h3 className="font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-yellow-500/10">
            <Award size={18} className="text-yellow-400" />
          </div>
          {t('profile.achievements')}
        </h3>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 md:gap-3">
          {[
            t('profile.badges.firstTrade'),
            t('profile.badges.positiveProfit'),
            t('profile.badges.tenTrades'),
            t('profile.badges.phase1Success')
          ].map((badge, i) => (
            <div key={i} className="flex items-center justify-center sm:justify-start gap-2 px-3 md:px-4 py-2.5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 group cursor-pointer min-h-[44px]">
              <Award size={16} className="text-yellow-400 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="text-xs sm:text-sm text-white font-medium truncate">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
