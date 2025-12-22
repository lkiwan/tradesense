import { useState } from 'react'
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react'

const SupportPage = () => {
  const [message, setMessage] = useState('')

  const tickets = [
    { id: 1, subject: 'Question sur le retrait', status: 'resolved', date: '20 Jan 2024', lastReply: '21 Jan 2024' },
    { id: 2, subject: 'Probleme technique chart', status: 'open', date: '22 Jan 2024', lastReply: null },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <MessageSquare className="text-green-400" size={24} />
          </div>
          Support
        </h1>
        <p className="text-gray-400 mt-1">Contactez notre equipe pour toute question</p>
      </div>

      {/* New Ticket */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
        <h3 className="font-semibold text-white mb-4">Nouveau Ticket</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Sujet</label>
            <input
              type="text"
              placeholder="Decrivez brievement votre probleme"
              className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Expliquez votre probleme en detail..."
              className="w-full bg-dark-200 border border-dark-200 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none resize-none"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
            <Send size={18} />
            Envoyer
          </button>
        </div>
      </div>

      {/* Previous Tickets */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
        <div className="p-4 border-b border-dark-200">
          <h3 className="font-semibold text-white">Mes Tickets</h3>
        </div>
        <div className="divide-y divide-dark-200">
          {tickets.map(ticket => (
            <div key={ticket.id} className="p-4 flex items-center justify-between hover:bg-dark-200/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${ticket.status === 'resolved' ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                  {ticket.status === 'resolved' ? (
                    <CheckCircle className="text-green-400" size={18} />
                  ) : (
                    <Clock className="text-yellow-400" size={18} />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-white">{ticket.subject}</h4>
                  <p className="text-sm text-gray-400">Cree le {ticket.date}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                ticket.status === 'resolved' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
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
