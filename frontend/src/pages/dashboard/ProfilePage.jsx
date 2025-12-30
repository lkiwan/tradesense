import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Mail, Phone, MapPin, Calendar, Edit2, Camera, Shield, Award, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const ProfilePage = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Profile Card */}
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 md:p-6 text-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary-500/20 rounded-full blur-[60px]" />

          <div className="relative">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 ring-4 ring-dark-100">
                <span className="text-white font-bold text-3xl">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-dark-200 hover:bg-primary-500 rounded-full border border-white/10 text-gray-400 hover:text-white transition-all duration-300">
                <Camera size={14} />
              </button>
            </div>
            <h3 className="text-xl font-bold text-white">{user?.username || 'Utilisateur'}</h3>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/30">
              <Shield size={14} className="text-green-400" />
              <span className="text-sm text-green-400 font-medium">{t('profile.accountVerified')}</span>
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
              onClick={() => setIsEditing(!isEditing)}
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
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('profile.username')}</label>
              <div className="relative group">
                <User className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled={!isEditing}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-10 md:px-12 py-3 md:py-3.5 text-white text-sm md:text-base disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 min-h-[48px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('profile.email')}</label>
              <div className="relative group">
                <Mail className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled={!isEditing}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-10 md:px-12 py-3 md:py-3.5 text-white text-sm md:text-base disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 min-h-[48px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('profile.phone')}</label>
              <div className="relative group">
                <Phone className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  disabled={!isEditing}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-10 md:px-12 py-3 md:py-3.5 text-white text-sm md:text-base placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 min-h-[48px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('profile.country')}</label>
              <div className="relative group">
                <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="France"
                  disabled={!isEditing}
                  className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-10 md:px-12 py-3 md:py-3.5 text-white text-sm md:text-base placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 min-h-[48px]"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <button className="mt-4 md:mt-6 px-6 py-3 md:py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] min-h-[48px] w-full sm:w-auto">
              {t('profile.save')}
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
