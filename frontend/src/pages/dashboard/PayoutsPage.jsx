import { useState } from 'react'
import { Wallet, ArrowUpRight, Clock, CheckCircle, XCircle, CreditCard, Building2, Plus, AlertCircle } from 'lucide-react'

const PayoutsPage = () => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const payouts = [
    { id: 1, amount: 2500, method: 'bank', status: 'completed', date: '2024-01-20', processedDate: '2024-01-22' },
    { id: 2, amount: 1800, method: 'crypto', status: 'completed', date: '2024-01-10', processedDate: '2024-01-11' },
    { id: 3, amount: 3200, method: 'bank', status: 'pending', date: '2024-01-25', processedDate: null },
    { id: 4, amount: 500, method: 'crypto', status: 'rejected', date: '2024-01-05', processedDate: null },
  ]

  const totalWithdrawn = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
  const availableBalance = 4500

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed': return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Complete' }
      case 'pending': return { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'En cours' }
      case 'rejected': return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Rejete' }
      default: return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/10', label: status }
    }
  }

  const getMethodIcon = (method) => {
    switch (method) {
      case 'bank': return Building2
      case 'crypto': return Wallet
      default: return CreditCard
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30">
              <Wallet className="text-green-400" size={24} />
            </div>
            Retraits
          </h1>
          <p className="text-gray-400 mt-1">Gerez vos retraits et suivez l'historique de vos paiements</p>
        </div>
        <button
          onClick={() => setShowWithdrawModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:scale-[1.02]"
        >
          <Plus size={18} />
          Nouveau Retrait
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5 hover:border-green-500/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Solde Disponible</span>
            <div className="p-1.5 rounded-lg bg-green-500/10">
              <Wallet size={18} className="text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-green-400 transition-colors">${availableBalance.toLocaleString()}</p>
          <p className="text-sm text-green-400 mt-2">Pret a retirer</p>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5 hover:border-blue-500/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Total Retire</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <ArrowUpRight size={18} className="text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">${totalWithdrawn.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">{payouts.filter(p => p.status === 'completed').length} retraits completes</p>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-6 border border-white/5 hover:border-yellow-500/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">En Cours</span>
            <div className="p-1.5 rounded-lg bg-yellow-500/10">
              <Clock size={18} className="text-yellow-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-yellow-400">${pendingAmount.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">En attente de traitement</p>
        </div>
      </div>

      {/* Withdrawal Methods */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary-500/10">
            <CreditCard size={18} className="text-primary-400" />
          </div>
          Methodes de Retrait
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-dark-200/50 rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="text-blue-400" size={24} />
              </div>
              <div>
                <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">Virement Bancaire</h4>
                <p className="text-sm text-gray-400">2-5 jours ouvrables</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-200/50 rounded-xl p-4 border border-white/5 hover:border-orange-500/30 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wallet className="text-orange-400" size={24} />
              </div>
              <div>
                <h4 className="font-medium text-white group-hover:text-orange-400 transition-colors">Crypto (USDT)</h4>
                <p className="text-sm text-gray-400">Instantane - 24h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-500/10 backdrop-blur-xl rounded-xl border border-blue-500/20 p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-blue-500/20">
          <AlertCircle className="text-blue-400" size={18} />
        </div>
        <div>
          <h4 className="font-medium text-white mb-1">Information sur les Retraits</h4>
          <p className="text-sm text-gray-400">
            Les retraits sont traites tous les jours ouvrables. Le montant minimum de retrait est de 100$.
            Les profits doivent etre generes avec un compte funded pour etre eligibles au retrait.
          </p>
        </div>
      </div>

      {/* Payouts History */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold text-white">Historique des Retraits</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-200/50">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-6 py-4 text-left font-medium">ID</th>
                <th className="px-6 py-4 text-left font-medium">Methode</th>
                <th className="px-6 py-4 text-left font-medium">Date Demande</th>
                <th className="px-6 py-4 text-left font-medium">Date Traitement</th>
                <th className="px-6 py-4 text-left font-medium">Statut</th>
                <th className="px-6 py-4 text-right font-medium">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payouts.map(payout => {
                const status = getStatusConfig(payout.status)
                const MethodIcon = getMethodIcon(payout.method)
                return (
                  <tr key={payout.id} className="hover:bg-dark-200/50 transition-colors">
                    <td className="px-6 py-4 text-gray-400">#{payout.id.toString().padStart(5, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MethodIcon size={16} className="text-gray-400" />
                        <span className="text-white capitalize">{payout.method === 'bank' ? 'Virement' : 'Crypto'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(payout.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {payout.processedDate ? new Date(payout.processedDate).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                        <status.icon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      ${payout.amount.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PayoutsPage
