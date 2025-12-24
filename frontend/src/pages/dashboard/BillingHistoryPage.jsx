import { useState, useEffect } from 'react'
import { Receipt, Download, Filter, Search, CreditCard, Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle } from 'lucide-react'
import { paymentsAPI, payoutsAPI } from '../../services/api'

const BillingHistoryPage = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [payments, setPayments] = useState([])
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [paymentsRes, payoutsRes] = await Promise.allSettled([
        paymentsAPI.getHistory(),
        payoutsAPI.getPayouts()
      ])

      if (paymentsRes.status === 'fulfilled') {
        setPayments(paymentsRes.value.data.payments || [])
      }
      if (payoutsRes.status === 'fulfilled') {
        setPayouts(payoutsRes.value.data.payouts || [])
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const allTransactions = [
    ...payments.map(p => ({ ...p, type: 'payment', date: p.created_at })),
    ...payouts.map(p => ({ ...p, type: 'payout', date: p.requested_at }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  const filteredTransactions = allTransactions.filter(t => {
    if (activeTab === 'payments') return t.type === 'payment'
    if (activeTab === 'payouts') return t.type === 'payout'
    return true
  })

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-500/10 text-green-500',
      pending: 'bg-yellow-500/10 text-yellow-500',
      failed: 'bg-red-500/10 text-red-500',
      approved: 'bg-green-500/10 text-green-500',
      rejected: 'bg-red-500/10 text-red-500',
      paid: 'bg-blue-500/10 text-blue-500'
    }
    return styles[status] || 'bg-gray-500/10 text-gray-500'
  }

  const getStatusIcon = (status) => {
    if (['completed', 'approved', 'paid'].includes(status)) return <CheckCircle size={14} />
    if (['failed', 'rejected'].includes(status)) return <XCircle size={14} />
    return <Clock size={14} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <Receipt className="text-primary-400" size={24} />
            </div>
            Billing History
          </h1>
          <p className="text-gray-400 mt-1">View all your payments and withdrawal history</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-300 hover:text-white transition-colors">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Paid</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <CreditCard className="text-blue-500" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Withdrawn</p>
              <p className="text-2xl font-bold text-green-500 mt-1">
                ${payouts.reduce((sum, p) => sum + (p.status === 'paid' ? p.net_payout : 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Wallet className="text-green-500" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-500 mt-1">
                ${payouts.reduce((sum, p) => sum + (['pending', 'approved'].includes(p.status) ? p.net_payout : 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All Transactions' },
              { key: 'payments', label: 'Payments' },
              { key: 'payouts', label: 'Withdrawals' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-200 text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 bg-dark-200 border border-dark-200 rounded-lg pl-10 pr-4 py-2 text-white focus:border-primary-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-200/50">
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="px-6 py-4 text-left font-medium">Type</th>
                  <th className="px-6 py-4 text-left font-medium">Description</th>
                  <th className="px-6 py-4 text-left font-medium">Date</th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-200">
                {filteredTransactions.map((transaction, idx) => (
                  <tr key={idx} className="hover:bg-dark-200/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          transaction.type === 'payment' ? 'bg-blue-500/10' : 'bg-green-500/10'
                        }`}>
                          {transaction.type === 'payment' ? (
                            <ArrowUpRight className="text-blue-500" size={16} />
                          ) : (
                            <ArrowDownRight className="text-green-500" size={16} />
                          )}
                        </div>
                        <span className="font-medium text-white capitalize">{transaction.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {transaction.type === 'payment' ? (
                        `${transaction.plan_type || 'Challenge'} Purchase`
                      ) : (
                        `Profit Withdrawal`
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(transaction.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        {transaction.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${
                      transaction.type === 'payment' ? 'text-white' : 'text-green-500'
                    }`}>
                      {transaction.type === 'payment' ? '-' : '+'}${(transaction.amount || transaction.net_payout || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default BillingHistoryPage
