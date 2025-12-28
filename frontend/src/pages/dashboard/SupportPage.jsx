import { useState } from 'react'
import {
  MessageSquare, Send, Clock, CheckCircle, HelpCircle, Headphones,
  BookOpen, Play, FileText, Download, Video, Book, Brain, TrendingUp, Shield, FolderOpen
} from 'lucide-react'

const SupportPage = () => {
  // Main tab state
  const [activeTab, setActiveTab] = useState('support')

  // Support states
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')

  // Main tabs
  const mainTabs = [
    { id: 'support', label: 'Support', icon: Headphones },
    { id: 'files', label: 'Files & Resources', icon: FolderOpen }
  ]

  // Mock tickets data
  const tickets = [
    { id: 1, subject: 'Question sur le retrait', status: 'resolved', date: '20 Jan 2024', lastReply: '21 Jan 2024' },
    { id: 2, subject: 'Probleme technique chart', status: 'open', date: '22 Jan 2024', lastReply: null },
  ]

  // Resources data
  const resources = [
    { id: 1, title: 'Guide du Debutant', type: 'pdf', category: 'Formation', icon: Book },
    { id: 2, title: 'Strategies de Trading', type: 'video', category: 'Formation', icon: TrendingUp },
    { id: 3, title: 'Analyse Technique', type: 'pdf', category: 'Technique', icon: FileText },
    { id: 4, title: 'Gestion du Risque', type: 'video', category: 'Risque', icon: Shield },
    { id: 5, title: 'Psychologie du Trading', type: 'pdf', category: 'Mental', icon: Brain },
  ]

  const categoryColors = {
    'Formation': { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/30' },
    'Technique': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    'Risque': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    'Mental': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  }

  // Render Support Tab
  const renderSupportTab = () => (
    <div className="space-y-6">
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

  // Render Files Tab
  const renderFilesTab = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Documents</p>
              <p className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">3 PDFs</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-red-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Video size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Videos</p>
              <p className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">2 Videos</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-green-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <BookOpen size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Categories</p>
              <p className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">4 Types</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map(resource => {
          const catColors = categoryColors[resource.category] || categoryColors['Formation']
          const ResourceIcon = resource.icon

          return (
            <div key={resource.id} className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-5 hover:border-primary-500/30 transition-all duration-300 cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${resource.type === 'video' ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30' : 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30'} group-hover:scale-105 transition-transform`}>
                  {resource.type === 'video' ? (
                    <Play className="text-red-400" size={20} />
                  ) : (
                    <FileText className="text-blue-400" size={20} />
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg ${catColors.bg} ${catColors.text} border ${catColors.border}`}>
                  {resource.category}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-3 group-hover:text-primary-400 transition-colors">{resource.title}</h3>
              <div className="flex items-center gap-2 text-sm">
                {resource.type === 'video' ? (
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/20 transition-colors">
                    <Play size={14} />
                    <span>Regarder</span>
                  </button>
                ) : (
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-colors">
                    <Download size={14} />
                    <span>Telecharger</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30">
            <Headphones className="text-green-400" size={24} />
          </div>
          Support & Resources
        </h1>
        <p className="text-gray-400 mt-1">Get help and access learning materials</p>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 bg-dark-100/80 backdrop-blur-xl rounded-xl p-1.5 border border-white/5 overflow-x-auto">
        {mainTabs.map(tab => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              <IconComponent size={16} />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'support' && renderSupportTab()}
      {activeTab === 'files' && renderFilesTab()}
    </div>
  )
}

export default SupportPage
