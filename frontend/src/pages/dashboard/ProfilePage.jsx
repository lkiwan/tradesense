import { useState } from 'react'
import { User, Mail, Phone, MapPin, Calendar, Edit2, Camera, Shield, Award } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const ProfilePage = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-500/10">
            <User className="text-primary-400" size={24} />
          </div>
          Mon Profil
        </h1>
        <p className="text-gray-400 mt-1">Gerez vos informations personnelles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-3xl">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-dark-200 rounded-full border border-dark-200 text-gray-400 hover:text-white transition-colors">
              <Camera size={14} />
            </button>
          </div>
          <h3 className="text-xl font-bold text-white">{user?.username || 'Utilisateur'}</h3>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Shield size={14} className="text-green-400" />
            <span className="text-sm text-green-400">Compte verifie</span>
          </div>
          <div className="mt-6 pt-6 border-t border-dark-200">
            <div className="flex items-center justify-center gap-6">
              <div>
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-xs text-gray-400">Trades</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">78%</p>
                <p className="text-xs text-gray-400">Win Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-400">1</p>
                <p className="text-xs text-gray-400">Challenges</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Form */}
        <div className="lg:col-span-2 bg-dark-100 rounded-xl border border-dark-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white">Informations Personnelles</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 bg-dark-200 hover:bg-dark-300 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <Edit2 size={16} />
              {isEditing ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nom d'utilisateur</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled={!isEditing}
                  className="w-full bg-dark-200 border border-dark-200 rounded-lg px-10 py-3 text-white disabled:opacity-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled={!isEditing}
                  className="w-full bg-dark-200 border border-dark-200 rounded-lg px-10 py-3 text-white disabled:opacity-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Telephone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  disabled={!isEditing}
                  className="w-full bg-dark-200 border border-dark-200 rounded-lg px-10 py-3 text-white disabled:opacity-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Pays</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="France"
                  disabled={!isEditing}
                  className="w-full bg-dark-200 border border-dark-200 rounded-lg px-10 py-3 text-white disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <button className="mt-6 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
              Sauvegarder
            </button>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Award size={18} className="text-yellow-400" />
          Accomplissements
        </h3>
        <div className="flex flex-wrap gap-4">
          {['Premier Trade', 'Profit Positif', '10 Trades', 'Phase 1 Reussie'].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 bg-dark-200 rounded-lg">
              <Award size={16} className="text-yellow-400" />
              <span className="text-sm text-white">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
