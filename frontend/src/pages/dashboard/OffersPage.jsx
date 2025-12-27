import { Gift, Tag, Clock, ArrowRight, Percent, Star, Sparkles } from 'lucide-react'

const OffersPage = () => {
  const offers = [
    { id: 1, title: '20% de Reduction', description: 'Sur votre prochain challenge', code: 'TRADE20', expiry: '31 Jan 2024', type: 'discount' },
    { id: 2, title: 'Challenge Gratuit', description: 'Atteignez 5% de profit et gagnez un challenge gratuit', code: null, expiry: '15 Feb 2024', type: 'reward' },
    { id: 3, title: '15% Parrainage Bonus', description: 'Bonus supplementaire sur chaque parrainage', code: 'REFER15', expiry: '28 Feb 2024', type: 'discount' },
  ]

  const typeConfig = {
    discount: { icon: Percent, color: 'primary', gradient: 'from-primary-500/20 to-primary-600/20' },
    reward: { icon: Star, color: 'yellow', gradient: 'from-yellow-500/20 to-yellow-600/20' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 border border-pink-500/30">
            <Gift className="text-pink-400" size={24} />
          </div>
          Mes Offres
        </h1>
        <p className="text-gray-400 mt-1">Decouvrez vos offres exclusives et promotions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-pink-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/10">
              <Gift size={20} className="text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Offres Actives</p>
              <p className="text-xl font-bold text-white group-hover:text-pink-400 transition-colors">{offers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-primary-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <Percent size={20} className="text-primary-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Reductions</p>
              <p className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">{offers.filter(o => o.type === 'discount').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-yellow-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Star size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Recompenses</p>
              <p className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">{offers.filter(o => o.type === 'reward').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map(offer => {
          const config = typeConfig[offer.type] || typeConfig.discount
          const IconComponent = config.icon

          return (
            <div
              key={offer.id}
              className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-6 hover:border-primary-500/30 transition-all duration-300 group relative overflow-hidden"
            >
              {/* Decorative gradient */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${config.gradient} rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-50 group-hover:opacity-75 transition-opacity`} />

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient} border border-${config.color}-500/30 group-hover:scale-105 transition-transform`}>
                    <IconComponent className={`text-${config.color}-400`} size={24} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 px-2.5 py-1 bg-dark-200/50 rounded-lg border border-white/5">
                    <Clock size={12} />
                    <span>{offer.expiry}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">{offer.title}</h3>
                <p className="text-gray-400 mb-4 text-sm">{offer.description}</p>

                {offer.code && (
                  <div className="bg-dark-200/50 rounded-xl px-4 py-2.5 mb-4 border border-white/5 border-dashed flex items-center justify-between">
                    <span className="text-primary-400 font-mono font-bold tracking-wider">{offer.code}</span>
                    <button className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 bg-dark-300/50 rounded-lg">
                      Copier
                    </button>
                  </div>
                )}

                <button className="flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-all duration-300 group/btn">
                  <span>Utiliser l'offre</span>
                  <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info Banner */}
      <div className="bg-primary-500/10 backdrop-blur-xl rounded-xl border border-primary-500/30 p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-primary-500/20">
          <Sparkles className="text-primary-400" size={18} />
        </div>
        <div>
          <h4 className="font-medium text-white mb-1">Conseil</h4>
          <p className="text-sm text-gray-400">
            Les offres sont personnalisees en fonction de votre activite. Plus vous tradez, plus vous debloquez d'offres exclusives!
          </p>
        </div>
      </div>
    </div>
  )
}

export default OffersPage
