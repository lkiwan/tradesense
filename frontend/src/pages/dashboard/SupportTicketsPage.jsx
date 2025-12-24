import { useState, useEffect } from 'react'
import { MessageSquare, Plus, Search, Filter, Clock, CheckCircle, AlertCircle, ChevronRight, Send, Paperclip } from 'lucide-react'

const SupportTicketsPage = () => {
  const [tickets, setTickets] = useState([
    { id: 1, subject: 'Challenge phase not updating', category: 'technical', status: 'open', priority: 'high', created: '2024-01-15', lastUpdate: '2 hours ago' },
    { id: 2, subject: 'Payout request pending', category: 'billing', status: 'in_progress', priority: 'medium', created: '2024-01-14', lastUpdate: '1 day ago' },
    { id: 3, subject: 'MT5 login issues', category: 'account', status: 'resolved', priority: 'low', created: '2024-01-10', lastUpdate: '5 days ago' }
  ])
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [newMessage, setNewMessage] = useState('')

  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'technical',
    priority: 'medium',
    message: ''
  })

  const categories = [
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'account', label: 'Account' },
    { value: 'trading', label: 'Trading' },
    { value: 'withdrawal', label: 'Withdrawal' },
    { value: 'other', label: 'Other' }
  ]

  const getStatusBadge = (status) => {
    const styles = {
      open: 'bg-blue-500/10 text-blue-500',
      in_progress: 'bg-yellow-500/10 text-yellow-500',
      resolved: 'bg-green-500/10 text-green-500',
      closed: 'bg-gray-500/10 text-gray-500'
    }
    return styles[status] || styles.open
  }

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-500/10 text-gray-400',
      medium: 'bg-yellow-500/10 text-yellow-500',
      high: 'bg-orange-500/10 text-orange-500',
      urgent: 'bg-red-500/10 text-red-500'
    }
    return styles[priority] || styles.medium
  }

  const handleCreateTicket = () => {
    if (!newTicket.subject || !newTicket.message) return
    // API call would go here
    setShowNewTicket(false)
    setNewTicket({ subject: '', category: 'technical', priority: 'medium', message: '' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <MessageSquare className="text-primary-400" size={24} />
            </div>
            Support Tickets
          </h1>
          <p className="text-gray-400 mt-1">Get help from our support team</p>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
          <p className="text-sm text-gray-400">Open Tickets</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{tickets.filter(t => t.status === 'open').length}</p>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
          <p className="text-sm text-gray-400">In Progress</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{tickets.filter(t => t.status === 'in_progress').length}</p>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
          <p className="text-sm text-gray-400">Resolved</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{tickets.filter(t => t.status === 'resolved').length}</p>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
          <p className="text-sm text-gray-400">Total Tickets</p>
          <p className="text-2xl font-bold text-white mt-1">{tickets.length}</p>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-2xl border border-dark-200 w-full max-w-lg">
            <div className="p-6 border-b border-dark-200">
              <h3 className="text-lg font-semibold text-white">Create New Ticket</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none"
                  placeholder="Brief description of your issue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Message</label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none h-32 resize-none"
                  placeholder="Describe your issue in detail..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-dark-200 flex justify-end gap-3">
              <button
                onClick={() => setShowNewTicket(false)}
                className="px-4 py-2 bg-dark-200 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
        <div className="p-4 border-b border-dark-200 flex items-center justify-between">
          <h3 className="font-semibold text-white">All Tickets</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search tickets..."
              className="bg-dark-200 border border-dark-200 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary-500 outline-none w-48"
            />
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400">No tickets yet</p>
            <p className="text-sm text-gray-500 mt-1">Create a ticket to get help from our team</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-200">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className="p-4 hover:bg-dark-200/30 transition-colors cursor-pointer flex items-center gap-4"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  ticket.status === 'open' ? 'bg-blue-500/10' :
                  ticket.status === 'in_progress' ? 'bg-yellow-500/10' :
                  'bg-green-500/10'
                }`}>
                  {ticket.status === 'resolved' ? <CheckCircle className="text-green-500" size={20} /> :
                   ticket.status === 'in_progress' ? <Clock className="text-yellow-500" size={20} /> :
                   <AlertCircle className="text-blue-500" size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{ticket.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className="text-xs text-gray-500">{ticket.category}</span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-400">{ticket.lastUpdate}</p>
                </div>
                <ChevronRight className="text-gray-500" size={20} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SupportTicketsPage
