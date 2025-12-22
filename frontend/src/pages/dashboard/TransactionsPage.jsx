import { useState } from 'react'
import { Receipt, ArrowUpRight, ArrowDownRight, Filter, Download, Search, Calendar } from 'lucide-react'

const TransactionsPage = () => {
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const transactions = [
    { id: 1, type: 'deposit', amount: 10000, description: 'Depot initial - Challenge Pro', date: '2024-01-15', status: 'completed' },
    { id: 2, type: 'trade', amount: 250, description: 'Profit AAPL Long', date: '2024-01-16', status: 'completed' },
    { id: 3, type: 'trade', amount: -120, description: 'Perte BTC-USD Short', date: '2024-01-17', status: 'completed' },
    { id: 4, type: 'trade', amount: 380, description: 'Profit TSLA Long', date: '2024-01-18', status: 'completed' },
    { id: 5, type: 'fee', amount: -50, description: 'Frais de plateforme', date: '2024-01-19', status: 'completed' },
    { id: 6, type: 'trade', amount: 175, description: 'Profit ETH-USD Long', date: '2024-01-20', status: 'completed' },
    { id: 7, type: 'withdrawal', amount: -500, description: 'Retrait vers compte bancaire', date: '2024-01-21', status: 'pending' },
    { id: 8, type: 'trade', amount: -85, description: 'Perte NVDA Short', date: '2024-01-22', status: 'completed' },
  ]

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filter === 'all' || t.type === filter
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0)
  const totalProfits = transactions.filter(t => t.type === 'trade' && t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalLosses = Math.abs(transactions.filter(t => t.type === 'trade' && t.amount < 0).reduce((sum, t) => sum + t.amount, 0))
  const totalWithdrawals = Math.abs(transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0))

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deposit': return <ArrowDownRight className="text-green-400" size={16} />
      case 'withdrawal': return <ArrowUpRight className="text-blue-400" size={16} />
      case 'trade': return <Receipt className="text-primary-400" size={16} />
      case 'fee': return <Receipt className="text-gray-400" size={16} />
      default: return <Receipt className="text-gray-400" size={16} />
    }
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'deposit': return 'Depot'
      case 'withdrawal': return 'Retrait'
      case 'trade': return 'Trade'
      case 'fee': return 'Frais'
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Receipt className="text-purple-400" size={24} />
            </div>
            Transactions
          </h1>
          <p className="text-gray-400 mt-1">Historique de toutes vos transactions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-400 hover:text-white transition-colors">
          <Download size={18} />
          Exporter
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Depots</p>
          <p className="text-2xl font-bold text-green-400">${totalDeposits.toLocaleString()}</p>
        </div>
        <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Profits Trading</p>
          <p className="text-2xl font-bold text-green-400">+${totalProfits.toLocaleString()}</p>
        </div>
        <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Pertes Trading</p>
          <p className="text-2xl font-bold text-red-400">-${totalLosses.toLocaleString()}</p>
        </div>
        <div className="bg-dark-100 rounded-xl p-4 border border-dark-200">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Retraits</p>
          <p className="text-2xl font-bold text-blue-400">${totalWithdrawals.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Rechercher une transaction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-100 border border-dark-200 rounded-lg px-10 py-2.5 text-white focus:border-primary-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          {['all', 'deposit', 'trade', 'withdrawal', 'fee'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-100 text-gray-400 hover:text-white border border-dark-200'
              }`}
            >
              {f === 'all' ? 'Tous' : getTypeLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-200/50">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-6 py-4 text-left font-medium">Type</th>
                <th className="px-6 py-4 text-left font-medium">Description</th>
                <th className="px-6 py-4 text-left font-medium">Date</th>
                <th className="px-6 py-4 text-left font-medium">Statut</th>
                <th className="px-6 py-4 text-right font-medium">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200">
              {filteredTransactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-dark-200/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center">
                        {getTypeIcon(transaction.type)}
                      </div>
                      <span className="text-sm font-medium text-white capitalize">
                        {getTypeLabel(transaction.type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{transaction.description}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar size={14} />
                      <span className="text-sm">{new Date(transaction.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {transaction.status === 'completed' ? 'Complete' : 'En cours'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${
                    transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TransactionsPage
