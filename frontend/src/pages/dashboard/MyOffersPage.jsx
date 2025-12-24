import { useState } from 'react'
import { Gift, Copy, Check, Clock, Tag, Percent, Sparkles, ChevronRight } from 'lucide-react'

const MyOffersPage = () => {
  const [copiedCode, setCopiedCode] = useState(null)

  const activeOffers = [
    {
      id: 1,
      title: 'Holiday Special',
      code: 'HOLIDAY25',
      discount: 25,
      type: 'percentage',
      description: 'Get 25% off your next challenge purchase',
      expires: '2024-12-31',
      minPurchase: 100,
      applicable: ['stellar-1-step', 'stellar-2-step']
    },
    {
      id: 2,
      title: 'New Year Bonus',
      code: 'NEWYEAR50',
      discount: 50,
      type: 'fixed',
      description: '$50 off any challenge $200 or more',
      expires: '2024-01-15',
      minPurchase: 200,
      applicable: 'all'
    },
    {
      id: 3,
      title: 'Loyalty Reward',
      code: 'LOYAL15',
      discount: 15,
      type: 'percentage',
      description: '15% off for returning customers',
      expires: '2024-02-28',
      minPurchase: 0,
      applicable: 'all'
    }
  ]

  const expiredOffers = [
    {
      id: 4,
      title: 'Black Friday',
      code: 'BF2023',
      discount: 40,
      type: 'percentage',
      expired: '2023-11-30'
    }
  ]

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const daysUntilExpiry = (date) => {
    const diff = new Date(date) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-500/10">
            <Gift className="text-primary-400" size={24} />
          </div>
          My Offers
        </h1>
        <p className="text-gray-400 mt-1">Exclusive discounts and promotional offers</p>
      </div>

      {/* Active Offers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeOffers.map(offer => {
          const daysLeft = daysUntilExpiry(offer.expires)
          const isExpiringSoon = daysLeft <= 7

          return (
            <div
              key={offer.id}
              className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden hover:border-primary-500/30 transition-colors"
            >
              {/* Offer Header */}
              <div className="bg-gradient-to-r from-primary-500/20 to-purple-500/20 p-4 border-b border-dark-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-yellow-400" size={20} />
                    <h3 className="font-semibold text-white">{offer.title}</h3>
                  </div>
                  {isExpiringSoon && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded">
                      Expires Soon!
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-white mt-2">
                  {offer.type === 'percentage' ? `${offer.discount}%` : `$${offer.discount}`}
                  <span className="text-lg font-normal text-gray-400 ml-1">OFF</span>
                </p>
              </div>

              {/* Offer Details */}
              <div className="p-4 space-y-4">
                <p className="text-sm text-gray-400">{offer.description}</p>

                {/* Code */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-dark-200 rounded-lg px-4 py-2 font-mono text-white">
                    {offer.code}
                  </div>
                  <button
                    onClick={() => copyCode(offer.code)}
                    className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    {copiedCode === offer.code ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock size={14} />
                    <span>{daysLeft} days left</span>
                  </div>
                  {offer.minPurchase > 0 && (
                    <div className="flex items-center gap-1 text-gray-400">
                      <Tag size={14} />
                      <span>Min. ${offer.minPurchase}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* How to Use */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
        <h3 className="font-semibold text-white mb-4">How to Use Offer Codes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: 1, title: 'Copy Code', desc: 'Click the copy button next to your offer code' },
            { step: 2, title: 'Go to Checkout', desc: 'Choose your challenge and proceed to payment' },
            { step: 3, title: 'Apply Code', desc: 'Paste the code in the promo field and save!' }
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                {item.step}
              </div>
              <div>
                <p className="font-medium text-white">{item.title}</p>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expired Offers */}
      {expiredOffers.length > 0 && (
        <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden opacity-60">
          <div className="p-4 border-b border-dark-200">
            <h3 className="font-semibold text-gray-400">Expired Offers</h3>
          </div>
          <div className="divide-y divide-dark-200">
            {expiredOffers.map(offer => (
              <div key={offer.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-400">{offer.title}</p>
                  <p className="text-sm text-gray-500">Code: {offer.code}</p>
                </div>
                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs font-medium rounded">
                  Expired {new Date(offer.expired).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MyOffersPage
