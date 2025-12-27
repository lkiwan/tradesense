import { useState } from 'react'
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, HelpCircle, Headphones } from 'lucide-react'

const SupportPage = () => {
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')

  const tickets = [
    { id: 1, subject: 'Question sur le retrait', status: 'resolved', date: '20 Jan 2024', lastReply: '21 Jan 2024' },
    { id: 2, subject: 'Probleme technique chart', status: 'open', date: '22 Jan 2024', lastReply: null },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30">
            <Headphones className="text-green-400" size={24} />
          </div>
          Support
        </h1>
        <p className="text-gray-400 mt-1">Contactez notre equipe pour toute question</p>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-primary-500/30 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10 group-hover:bg-primary-500/20 transition-colors">
              <HelpCircle size={20} className="text-primary-400" />
            </div>
            <div>
              <h4 className="font-medium text-white group-hover:text-primary-400 transition-colors">FAQ</h4>
              <p className="text-xs text-gray-400">Questions frequentes</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <MessageSquare size={20} className="text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">Live Chat</h4>
              <p className="text-xs text-gray-400">Discussion en direct</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-green-500/30 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <Headphones size={20} className="text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-white group-hover:text-green-400 transition-colors">Telephone</h4>
              <p className="text-xs text-gray-400">Lun-Ven 9h-18h</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Ticket */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary-500/10">
            <Send size={18} className="text-primary-400" />
          </div>
          Nouveau Ticket
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Sujet</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Decrivez brievement votre probleme"
              className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Expliquez votre probleme en detail..."
              className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none transition-all duration-300"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02]">
            <Send size={18} />
            Envoyer
          </button>
        </div>
      </div>

      {/* Previous Tickets */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10">
              <MessageSquare size={18} className="text-purple-400" />
            </div>
            Mes Tickets
          </h3>
        </div>
        <div className="divide-y divide-white/5">
          {tickets.map(ticket => (
            <div key={ticket.id} className="p-4 flex items-center justify-between hover:bg-dark-200/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${ticket.status === 'resolved' ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30' : 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30'}`}>
                  {ticket.status === 'resolved' ? (
                    <CheckCircle className="text-green-400" size={18} />
                  ) : (
                    <Clock className="text-yellow-400" size={18} />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-white group-hover:text-primary-400 transition-colors">{ticket.subject}</h4>
                  <p className="text-sm text-gray-400">Cree le {ticket.date}</p>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                ticket.status === 'resolved' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
              }`}>
                {ticket.status === 'resolved' ? 'Resolu' : 'En cours'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SupportPage
