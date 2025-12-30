import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt, ArrowUpRight, ArrowDownRight, Filter, Download, Search, Calendar } from 'lucide-react'

const TransactionsPage = () => {
  const { t, i18n } = useTranslation()
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
      case 'deposit': return t('transactions.types.deposit')
      case 'withdrawal': return t('transactions.types.withdrawal')
      case 'trade': return t('transactions.types.trade')
      case 'fee': return t('transactions.types.fee')
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
              <Receipt className="text-purple-400" size={24} />
            </div>
            {t('transactions.title')}
          </h1>
          <p className="text-gray-400 mt-1">{t('transactions.subtitle')}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-dark-100/80 backdrop-blur-xl border border-white/5 rounded-xl text-gray-400 hover:text-white hover:border-primary-500/30 transition-all duration-300">
          <Download size={18} />
          {t('transactions.export')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-green-500/30 transition-all duration-300 group">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('transactions.stats.totalDeposits')}</p>
          <p className="text-2xl font-bold text-green-400">${totalDeposits.toLocaleString()}</p>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-green-500/30 transition-all duration-300 group">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('transactions.stats.tradingProfits')}</p>
          <p className="text-2xl font-bold text-green-400">+${totalProfits.toLocaleString()}</p>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-red-500/30 transition-all duration-300 group">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('transactions.stats.tradingLosses')}</p>
          <p className="text-2xl font-bold text-red-400">-${totalLosses.toLocaleString()}</p>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-all duration-300 group">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('transactions.stats.totalWithdrawals')}</p>
          <p className="text-2xl font-bold text-blue-400">${totalWithdrawals.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder={t('transactions.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-100/80 backdrop-blur-xl border border-white/5 rounded-xl px-11 py-2.5 text-white focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all duration-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          {['all', 'deposit', 'trade', 'withdrawal', 'fee'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filter === f
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-100/80 text-gray-400 hover:text-white border border-white/5 hover:border-primary-500/30'
              }`}
            >
              {f === 'all' ? t('transactions.filters.all') : getTypeLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-200/50">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-6 py-4 text-left font-medium">{t('transactions.table.type')}</th>
                <th className="px-6 py-4 text-left font-medium">{t('transactions.table.description')}</th>
                <th className="px-6 py-4 text-left font-medium">{t('transactions.table.date')}</th>
                <th className="px-6 py-4 text-left font-medium">{t('transactions.table.status')}</th>
                <th className="px-6 py-4 text-right font-medium">{t('transactions.table.amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-dark-200/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-dark-200/50 border border-white/5 flex items-center justify-center">
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
                      <span className="text-sm">{new Date(transaction.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : i18n.language === 'en' ? 'en-US' : 'fr-FR')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {transaction.status === 'completed' ? t('transactions.status.completed') : t('transactions.status.pending')}
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
