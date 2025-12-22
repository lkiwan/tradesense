import { Gift, Tag, Clock, ArrowRight } from 'lucide-react'

const OffersPage = () => {
  const offers = [
    { id: 1, title: '20% de Reduction', description: 'Sur votre prochain challenge', code: 'TRADE20', expiry: '31 Jan 2024', type: 'discount' },
    { id: 2, title: 'Challenge Gratuit', description: 'Atteignez 5% de profit et gagnez un challenge gratuit', code: null, expiry: '15 Feb 2024', type: 'reward' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/10">
            <Gift className="text-pink-400" size={24} />
          </div>
          Mes Offres
        </h1>
        <p className="text-gray-400 mt-1">Decouvrez vos offres exclusives et promotions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.map(offer => (
          <div key={offer.id} className="bg-dark-100 rounded-xl border border-dark-200 p-6 hover:border-primary-500/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-primary-500/10">
                <Tag className="text-primary-400" size={24} />
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Clock size={14} />
                <span>{offer.expiry}</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{offer.title}</h3>
            <p className="text-gray-400 mb-4">{offer.description}</p>
            {offer.code && (
              <div className="bg-dark-200 rounded-lg px-4 py-2 mb-4 inline-block">
                <span className="text-primary-400 font-mono font-bold">{offer.code}</span>
              </div>
            )}
            <button className="flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Utiliser l'offre
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OffersPage
