import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MessageSquare, Send, Clock, CheckCircle, HelpCircle, Headphones,
  BookOpen, Play, FileText, Download, Video, Book, Brain, TrendingUp, Shield, FolderOpen
} from 'lucide-react'

const SupportPage = () => {
  const { t } = useTranslation()
  // Main tab state
  const [activeTab, setActiveTab] = useState('support')

  // Support states
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')

  // Main tabs
  const mainTabs = [
    { id: 'support', labelKey: 'supportPage.tabs.support', icon: Headphones },
    { id: 'files', labelKey: 'supportPage.tabs.files', icon: FolderOpen }
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
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-white/5 hover:border-primary-500/30 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary-500/10 group-hover:bg-primary-500/20 transition-colors">
              <HelpCircle size={18} className="text-primary-400" />
            </div>
            <div>
              <h4 className="font-medium text-white group-hover:text-primary-400 transition-colors text-sm sm:text-base">{t('supportPage.quickHelp.faq')}</h4>
              <p className="text-[10px] sm:text-xs text-gray-400">{t('supportPage.quickHelp.faqDesc')}</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-white/5 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <MessageSquare size={18} className="text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors text-sm sm:text-base">{t('supportPage.quickHelp.liveChat')}</h4>
              <p className="text-[10px] sm:text-xs text-gray-400">{t('supportPage.quickHelp.liveChatDesc')}</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-white/5 hover:border-green-500/30 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <Headphones size={18} className="text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-white group-hover:text-green-400 transition-colors text-sm sm:text-base">{t('supportPage.quickHelp.phone')}</h4>
              <p className="text-[10px] sm:text-xs text-gray-400">{t('supportPage.quickHelp.phoneDesc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Ticket */}
      <div className="relative overflow-hidden bg-gradient-to-br from-dark-100/80 to-dark-200/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/5 hover:border-primary-500/20 transition-all duration-300 shadow-lg p-4 sm:p-6">
        <h3 className="font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
          <div className="p-1.5 rounded-lg bg-primary-500/10">
            <Send size={16} className="text-primary-400" />
          </div>
          {t('supportPage.newTicket.title')}
        </h3>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">{t('supportPage.newTicket.subject')}</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('supportPage.newTicket.subjectPlaceholder')}
              className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all duration-300 min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">{t('supportPage.newTicket.message')}</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('supportPage.newTicket.messagePlaceholder')}
              className="w-full bg-dark-200/50 border border-white/5 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none transition-all duration-300"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] w-full sm:w-auto min-h-[44px] text-sm sm:text-base">
            <Send size={16} />
            {t('supportPage.newTicket.send')}
          </button>
        </div>
      </div>

      {/* Previous Tickets */}
      <div className="relative overflow-hidden bg-gradient-to-br from-dark-100/80 to-dark-200/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all duration-300 shadow-lg">
        <div className="p-3 sm:p-4 border-b border-white/5">
          <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
            <div className="p-1.5 rounded-lg bg-purple-500/10">
              <MessageSquare size={16} className="text-purple-400" />
            </div>
            {t('supportPage.myTickets.title')}
          </h3>
        </div>
        <div className="divide-y divide-white/5">
          {tickets.map(ticket => (
            <div key={ticket.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 hover:bg-dark-200/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${ticket.status === 'resolved' ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30' : 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30'}`}>
                  {ticket.status === 'resolved' ? (
                    <CheckCircle className="text-green-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  ) : (
                    <Clock className="text-yellow-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-white group-hover:text-primary-400 transition-colors text-sm truncate">{ticket.subject}</h4>
                  <p className="text-xs text-gray-400">{t('supportPage.myTickets.createdOn')} {ticket.date}</p>
                </div>
              </div>
              <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium self-start sm:self-center whitespace-nowrap ${
                ticket.status === 'resolved' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
              }`}>
                {ticket.status === 'resolved' ? t('supportPage.myTickets.resolved') : t('supportPage.myTickets.inProgress')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Render Files Tab
  const renderFilesTab = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-2.5 sm:p-4 border border-white/5 hover:border-blue-500/30 transition-all duration-300 group">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left">
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
              <FileText size={16} className="text-blue-400 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[9px] sm:text-xs text-gray-400 uppercase tracking-wider">{t('supportPage.resources.docs')}</p>
              <p className="text-sm sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors">3</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-2.5 sm:p-4 border border-white/5 hover:border-red-500/30 transition-all duration-300 group">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left">
            <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/10">
              <Video size={16} className="text-red-400 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[9px] sm:text-xs text-gray-400 uppercase tracking-wider">{t('supportPage.resources.videos')}</p>
              <p className="text-sm sm:text-xl font-bold text-white group-hover:text-red-400 transition-colors">2</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-2.5 sm:p-4 border border-white/5 hover:border-green-500/30 transition-all duration-300 group">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left">
            <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
              <BookOpen size={16} className="text-green-400 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[9px] sm:text-xs text-gray-400 uppercase tracking-wider">{t('supportPage.resources.types')}</p>
              <p className="text-sm sm:text-xl font-bold text-white group-hover:text-green-400 transition-colors">4</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {resources.map(resource => {
          const catColors = categoryColors[resource.category] || categoryColors['Formation']
          const ResourceIcon = resource.icon

          return (
            <div key={resource.id} className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-3 sm:p-5 hover:border-primary-500/30 transition-all duration-300 cursor-pointer group">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className={`p-2 sm:p-2.5 rounded-xl ${resource.type === 'video' ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30' : 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30'} group-hover:scale-105 transition-transform`}>
                  {resource.type === 'video' ? (
                    <Play className="text-red-400 w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <FileText className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg ${catColors.bg} ${catColors.text} border ${catColors.border}`}>
                  {resource.category}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-2 sm:mb-3 group-hover:text-primary-400 transition-colors text-sm sm:text-base">{resource.title}</h3>
              <div className="flex items-center gap-2 text-sm">
                {resource.type === 'video' ? (
                  <button className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/20 transition-colors text-xs sm:text-sm min-h-[36px]">
                    <Play size={12} />
                    <span>{t('supportPage.resources.watch')}</span>
                  </button>
                ) : (
                  <button className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-colors text-xs sm:text-sm min-h-[36px]">
                    <Download size={12} />
                    <span>{t('supportPage.resources.download')}</span>
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30">
            <Headphones className="text-green-400 w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          {t('supportPage.title')}
        </h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">{t('supportPage.subtitle')}</p>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 sm:gap-2 bg-gradient-to-br from-dark-100/80 to-dark-200/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-1 sm:p-1.5 border border-white/5 overflow-x-auto shadow-lg">
        {mainTabs.map(tab => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg whitespace-nowrap transition-all duration-300 min-h-[40px] text-xs sm:text-sm ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              <IconComponent size={14} className="sm:w-4 sm:h-4" />
              <span className="font-medium">{t(tab.labelKey)}</span>
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
