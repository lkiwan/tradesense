import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, TrendingUp, TrendingDown, Filter, Calendar, Search } from 'lucide-react'

const PointsHistoryPage = () => {
  const [filter, setFilter] = useState('all')

  const transactions = [
    { id: 1, type: 'earned', points: 10, description: 'Trade completed - AAPL', date: '2024-01-15 14:32', icon: TrendingUp },
    { id: 2, type: 'earned', points: 25, description: 'Profitable trading day', date: '2024-01-15 23:59', icon: TrendingUp },
    { id: 3, type: 'earned', points: 10, description: 'Trade completed - BTC-USD', date: '2024-01-14 10:15', icon: TrendingUp },
    { id: 4, type: 'earned', points: 500, description: 'Passed Phase 1', date: '2024-01-13 16:00', icon: TrendingUp },
    { id: 5, type: 'earned', points: 200, description: 'Referral converted - John', date: '2024-01-12 09:30', icon: TrendingUp },
    { id: 6, type: 'earned', points: 5, description: 'Daily login bonus', date: '2024-01-12 08:00', icon: TrendingUp },
    { id: 7, type: 'earned', points: 50, description: 'Profile completed', date: '2024-01-11 12:00', icon: TrendingUp },
    { id: 8, type: 'earned', points: 10, description: 'Trade completed - TSLA', date: '2024-01-10 15:45', icon: TrendingUp }
  ]

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter)

  const totalEarned = transactions.filter(t => t.type === 'earned').reduce((sum, t) => sum + t.points, 0)
  const totalSpent = transactions.filter(t => t.type === 'spent').reduce((sum, t) => sum + t.points, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Sparkles className="text-yellow-400" size={24} />
          </div>
          Infinity Points - History
        </h1>
        <p className="text-gray-400 mt-1">View your complete points transaction history</p>
      </div>

      {/* Quick Nav */}
      <div className="flex gap-2">
        <Link
          to="/infinity-points"
          className="px-4 py-2 bg-dark-100 text-gray-400 hover:text-white rounded-lg font-medium transition-colors"
        >
          Activities
        </Link>
        <Link
          to="/infinity-points/profile"
          className="px-4 py-2 bg-dark-100 text-gray-400 hover:text-white rounded-lg font-medium transition-colors"
        >
          My Points
        </Link>
        <Link
          to="/infinity-points/history"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium"
        >
          History
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Earned</p>
              <p className="text-2xl font-bold text-green-500">+{totalEarned.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-red-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-red-500">-{totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {['all', 'earned', 'spent'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-200 text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search transactions..."
            className="bg-dark-200 border border-dark-200 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary-500 outline-none w-48"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
        <div className="divide-y divide-dark-200">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <Sparkles className="mx-auto text-gray-500 mb-4" size={48} />
              <p className="text-gray-400">No transactions found</p>
            </div>
          ) : (
            filteredTransactions.map(transaction => (
              <div key={transaction.id} className="p-4 flex items-center gap-4 hover:bg-dark-200/30 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  transaction.type === 'earned' ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                  <transaction.icon className={transaction.type === 'earned' ? 'text-green-500' : 'text-red-500'} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{transaction.description}</p>
                  <p className="text-xs text-gray-500">{transaction.date}</p>
                </div>
                <div className={`font-bold ${transaction.type === 'earned' ? 'text-green-500' : 'text-red-500'}`}>
                  {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination placeholder */}
      <div className="flex justify-center">
        <button className="px-4 py-2 bg-dark-100 text-gray-400 hover:text-white rounded-lg transition-colors">
          Load More
        </button>
      </div>
    </div>
  )
}

export default PointsHistoryPage
