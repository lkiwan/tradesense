import { useState } from 'react'
import { Settings, Bell, Shield, Globe, Moon, Eye, EyeOff, Lock, Key, Smartphone } from 'lucide-react'

const SettingsPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    tradeAlerts: true,
    marketNews: false,
    twoFactor: false,
    darkMode: true,
    language: 'fr'
  })

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-500/10">
            <Settings className="text-gray-400" size={24} />
          </div>
          Parametres
        </h1>
        <p className="text-gray-400 mt-1">Configurez vos preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Bell size={18} className="text-primary-400" />
            Notifications
          </h3>
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: 'Notifications par email', desc: 'Recevez des mises a jour par email' },
              { key: 'pushNotifications', label: 'Notifications push', desc: 'Notifications sur votre navigateur' },
              { key: 'tradeAlerts', label: 'Alertes de trading', desc: 'Alertes pour vos signaux IA' },
              { key: 'marketNews', label: 'Actualites marche', desc: 'News et analyses de marche' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-dark-200 last:border-0">
                <div>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleSetting(item.key)}
                  className={`w-12 h-6 rounded-full transition-colors ${settings[item.key] ? 'bg-primary-500' : 'bg-dark-200'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={18} className="text-green-400" />
            Securite
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-dark-200">
              <div>
                <p className="font-medium text-white">Authentification 2FA</p>
                <p className="text-sm text-gray-400">Securisez votre compte</p>
              </div>
              <button
                onClick={() => toggleSetting('twoFactor')}
                className={`w-12 h-6 rounded-full transition-colors ${settings.twoFactor ? 'bg-green-500' : 'bg-dark-200'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.twoFactor ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Mot de passe actuel</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-dark-200 border border-dark-200 rounded-lg px-10 py-3 text-white pr-10"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
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
                  className="w-full bg-dark-200 border border-dark-200 rounded-lg px-10 py-3 text-white"
                />
              </div>
            </div>
            <button className="w-full py-3 bg-dark-200 hover:bg-dark-300 text-white rounded-lg font-medium transition-colors">
              Changer le mot de passe
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Moon size={18} className="text-purple-400" />
            Apparence
          </h3>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-white">Mode sombre</p>
              <p className="text-sm text-gray-400">Interface en mode sombre</p>
            </div>
            <button
              onClick={() => toggleSetting('darkMode')}
              className={`w-12 h-6 rounded-full transition-colors ${settings.darkMode ? 'bg-primary-500' : 'bg-dark-200'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Globe size={18} className="text-blue-400" />
            Langue
          </h3>
          <select
            value={settings.language}
            onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
            className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-3 text-white"
          >
            <option value="fr">Francais</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
