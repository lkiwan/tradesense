import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Bell, Shield, Globe, Moon, Eye, EyeOff, Lock, Key, Smartphone, Loader2, CheckCircle, AlertTriangle, ExternalLink, Link2 } from 'lucide-react'
import { twoFactorAPI } from '../../services/api'
import toast from 'react-hot-toast'
import LinkedAccounts from '../../components/profile/LinkedAccounts'

const SettingsPage = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    tradeAlerts: true,
    marketNews: false,
    darkMode: true,
    language: 'fr'
  })

  // 2FA state
  const [twoFaStatus, setTwoFaStatus] = useState({
    enabled: false,
    backup_codes_remaining: 0,
    is_locked: false
  })
  const [loadingTwoFa, setLoadingTwoFa] = useState(true)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [disabling, setDisabling] = useState(false)

  // Load 2FA status
  useEffect(() => {
    const load2FAStatus = async () => {
      try {
        const response = await twoFactorAPI.getStatus()
        setTwoFaStatus(response.data)
      } catch (error) {
        console.error('Error loading 2FA status:', error)
      } finally {
        setLoadingTwoFa(false)
      }
    }
    load2FAStatus()
  }, [])

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleEnable2FA = () => {
    navigate('/setup-2fa')
  }

  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) {
      toast.error('Please enter your 6-digit code')
      return
    }

    setDisabling(true)
    try {
      await twoFactorAPI.disable(disableCode)
      setTwoFaStatus({ enabled: false, backup_codes_remaining: 0, is_locked: false })
      setShowDisableModal(false)
      setDisableCode('')
      toast.success('Two-factor authentication has been disabled')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to disable 2FA')
    } finally {
      setDisabling(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
          <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-500/30">
            <Settings className="text-gray-400" size={20} />
          </div>
          Parametres
        </h1>
        <p className="text-gray-400 mt-1 text-sm md:text-base">Configurez vos preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Notifications */}
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 md:p-6">
          <h3 className="font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary-500/10">
              <Bell size={18} className="text-primary-400" />
            </div>
            Notifications
          </h3>
          <div className="space-y-3 md:space-y-4">
            {[
              { key: 'emailNotifications', label: 'Notifications par email', desc: 'Recevez des mises a jour par email' },
              { key: 'pushNotifications', label: 'Notifications push', desc: 'Notifications sur votre navigateur' },
              { key: 'tradeAlerts', label: 'Alertes de trading', desc: 'Alertes pour vos signaux IA' },
              { key: 'marketNews', label: 'Actualites marche', desc: 'News et analyses de marche' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-dark-200 last:border-0 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white text-sm md:text-base">{item.label}</p>
                  <p className="text-xs md:text-sm text-gray-400 break-words">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleSetting(item.key)}
                  className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 min-w-[48px] ${settings[item.key] ? 'bg-primary-500' : 'bg-dark-200'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 md:p-6">
          <h3 className="font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-green-500/10">
              <Shield size={18} className="text-green-400" />
            </div>
            Securite
          </h3>
          <div className="space-y-3 md:space-y-4">
            {/* Two-Factor Authentication */}
            <div className="py-3 border-b border-dark-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-start sm:items-center gap-3">
                  <Smartphone size={20} className="text-primary-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm md:text-base">Authentification 2FA</p>
                    <p className="text-xs md:text-sm text-gray-400">Securisez votre compte avec un code a 6 chiffres</p>
                  </div>
                </div>
                {loadingTwoFa ? (
                  <Loader2 className="animate-spin text-gray-400" size={20} />
                ) : twoFaStatus.enabled ? (
                  <span className="flex items-center gap-1 text-green-400 text-sm font-medium">
                    <CheckCircle size={16} />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400 text-sm">
                    Non active
                  </span>
                )}
              </div>

              {!loadingTwoFa && (
                <div className="ml-8">
                  {twoFaStatus.enabled ? (
                    <div className="space-y-3">
                      {/* Backup codes status */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Codes de secours restants:</span>
                        <span className={`font-medium ${twoFaStatus.backup_codes_remaining < 3 ? 'text-yellow-400' : 'text-white'}`}>
                          {twoFaStatus.backup_codes_remaining} / 10
                        </span>
                      </div>
                      {twoFaStatus.backup_codes_remaining < 3 && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-yellow-200">
                            Peu de codes restants. Pensez a les regenerer.
                          </p>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => navigate('/setup-2fa')}
                          className="flex-1 py-2.5 bg-dark-200 hover:bg-dark-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                        >
                          <Key size={16} />
                          Regenerer les codes
                        </button>
                        <button
                          onClick={() => setShowDisableModal(true)}
                          className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
                        >
                          Desactiver
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleEnable2FA}
                      className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-h-[48px] text-sm md:text-base"
                    >
                      <Shield size={18} />
                      Activer l'authentification 2FA
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Password Change */}
            <div className="pt-2">
              <p className="font-medium text-white mb-3 flex items-center gap-2 text-sm md:text-base">
                <Lock size={18} className="text-gray-400" />
                Changer le mot de passe
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Mot de passe actuel</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-10 py-3 text-white pr-12 min-h-[48px] text-sm md:text-base"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nouveau mot de passe</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-dark-200 border border-dark-200 rounded-lg px-10 py-3 text-white min-h-[48px] text-sm md:text-base"
                    />
                  </div>
                </div>
                <button className="w-full py-3 bg-dark-200 hover:bg-dark-300 text-white rounded-lg font-medium transition-colors min-h-[48px] text-sm md:text-base">
                  Changer le mot de passe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2FA Disable Modal */}
        {showDisableModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-4 md:p-6 max-w-md w-full mx-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="text-red-400" size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white">Desactiver 2FA</h3>
                  <p className="text-sm text-gray-400">Cette action reduira la securite de votre compte</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Entrez votre code a 6 chiffres pour confirmer
                </label>
                <input
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center text-xl md:text-2xl font-mono tracking-[0.2em] md:tracking-[0.3em] bg-dark-200 border border-dark-200 rounded-lg py-3 text-white min-h-[48px]"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowDisableModal(false)
                    setDisableCode('')
                  }}
                  className="flex-1 py-3 bg-dark-200 hover:bg-dark-300 text-white rounded-lg font-medium transition-colors min-h-[48px] order-2 sm:order-1"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDisable2FA}
                  disabled={disabling || disableCode.length !== 6}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px] order-1 sm:order-2"
                >
                  {disabling ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Desactivation...
                    </>
                  ) : (
                    'Desactiver'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Linked Accounts */}
        <LinkedAccounts />

        {/* Appearance */}
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 md:p-6">
          <h3 className="font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10">
              <Moon size={18} className="text-purple-400" />
            </div>
            Apparence
          </h3>
          <div className="flex items-center justify-between py-3 gap-3">
            <div className="min-w-0">
              <p className="font-medium text-white text-sm md:text-base">Mode sombre</p>
              <p className="text-xs md:text-sm text-gray-400">Interface en mode sombre</p>
            </div>
            <button
              onClick={() => toggleSetting('darkMode')}
              className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 min-w-[48px] ${settings.darkMode ? 'bg-primary-500' : 'bg-dark-200'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 md:p-6">
          <h3 className="font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <Globe size={18} className="text-blue-400" />
            </div>
            Langue
          </h3>
          <select
            value={settings.language}
            onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
            className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-4 py-3 md:py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 cursor-pointer min-h-[48px] text-sm md:text-base"
          >
            <option value="fr" className="bg-dark-300">Francais</option>
            <option value="en" className="bg-dark-300">English</option>
            <option value="ar" className="bg-dark-300">العربية</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
