import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText, AlertTriangle, CheckCircle, XCircle, Info, Shield,
  HelpCircle, ChevronDown, Search, Target, DollarSign, Users, TrendingUp
} from 'lucide-react'

const TradingRulesPage = () => {
  const { t } = useTranslation()
  // Main tab state
  const [activeTab, setActiveTab] = useState('rules')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [openItems, setOpenItems] = useState([])

  // Main tabs
  const mainTabs = [
    { id: 'rules', labelKey: 'tradingRulesPage.tabs.rules', icon: FileText },
    { id: 'faq', labelKey: 'tradingRulesPage.tabs.faq', icon: HelpCircle }
  ]

  // Trading rules data
  const rules = [
    { id: 1, titleKey: 'tradingRulesPage.rules.profitTarget.title', descKey: 'tradingRulesPage.rules.profitTarget.desc', icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
    { id: 2, titleKey: 'tradingRulesPage.rules.maxDrawdown.title', descKey: 'tradingRulesPage.rules.maxDrawdown.desc', icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
    { id: 3, titleKey: 'tradingRulesPage.rules.dailyDrawdown.title', descKey: 'tradingRulesPage.rules.dailyDrawdown.desc', icon: AlertTriangle, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
    { id: 4, titleKey: 'tradingRulesPage.rules.tradingDays.title', descKey: 'tradingRulesPage.rules.tradingDays.desc', icon: Info, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
    { id: 5, titleKey: 'tradingRulesPage.rules.noWeekend.title', descKey: 'tradingRulesPage.rules.noWeekend.desc', icon: XCircle, color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30' },
    { id: 6, titleKey: 'tradingRulesPage.rules.noNews.title', descKey: 'tradingRulesPage.rules.noNews.desc', icon: Info, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  ]

  // FAQ categories
  const faqCategories = [
    { id: 'all', nameKey: 'tradingRulesPage.faq.categories.all', icon: HelpCircle, color: 'text-primary-500', bg: 'bg-primary-500/20' },
    { id: 'getting-started', nameKey: 'tradingRulesPage.faq.categories.gettingStarted', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { id: 'challenges', nameKey: 'tradingRulesPage.faq.categories.challenges', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    { id: 'payments', nameKey: 'tradingRulesPage.faq.categories.payments', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20' },
    { id: 'trading', nameKey: 'tradingRulesPage.faq.categories.trading', icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { id: 'account', nameKey: 'tradingRulesPage.faq.categories.account', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/20' }
  ]

  // FAQ data
  const faqs = [
    { id: 1, category: 'getting-started', questionKey: 'tradingRulesPage.faq.q1.question', answerKey: 'tradingRulesPage.faq.q1.answer' },
    { id: 2, category: 'getting-started', questionKey: 'tradingRulesPage.faq.q2.question', answerKey: 'tradingRulesPage.faq.q2.answer' },
    { id: 3, category: 'getting-started', questionKey: 'tradingRulesPage.faq.q3.question', answerKey: 'tradingRulesPage.faq.q3.answer' },
    { id: 4, category: 'challenges', questionKey: 'tradingRulesPage.faq.q4.question', answerKey: 'tradingRulesPage.faq.q4.answer' },
    { id: 5, category: 'challenges', questionKey: 'tradingRulesPage.faq.q5.question', answerKey: 'tradingRulesPage.faq.q5.answer' },
    { id: 6, category: 'challenges', questionKey: 'tradingRulesPage.faq.q6.question', answerKey: 'tradingRulesPage.faq.q6.answer' },
    { id: 7, category: 'challenges', questionKey: 'tradingRulesPage.faq.q7.question', answerKey: 'tradingRulesPage.faq.q7.answer' },
    { id: 8, category: 'payments', questionKey: 'tradingRulesPage.faq.q8.question', answerKey: 'tradingRulesPage.faq.q8.answer' },
    { id: 9, category: 'payments', questionKey: 'tradingRulesPage.faq.q9.question', answerKey: 'tradingRulesPage.faq.q9.answer' },
    { id: 10, category: 'payments', questionKey: 'tradingRulesPage.faq.q10.question', answerKey: 'tradingRulesPage.faq.q10.answer' },
    { id: 11, category: 'payments', questionKey: 'tradingRulesPage.faq.q11.question', answerKey: 'tradingRulesPage.faq.q11.answer' },
    { id: 12, category: 'trading', questionKey: 'tradingRulesPage.faq.q12.question', answerKey: 'tradingRulesPage.faq.q12.answer' },
    { id: 13, category: 'trading', questionKey: 'tradingRulesPage.faq.q13.question', answerKey: 'tradingRulesPage.faq.q13.answer' },
    { id: 14, category: 'trading', questionKey: 'tradingRulesPage.faq.q14.question', answerKey: 'tradingRulesPage.faq.q14.answer' },
    { id: 15, category: 'trading', questionKey: 'tradingRulesPage.faq.q15.question', answerKey: 'tradingRulesPage.faq.q15.answer' },
    { id: 16, category: 'account', questionKey: 'tradingRulesPage.faq.q16.question', answerKey: 'tradingRulesPage.faq.q16.answer' },
    { id: 17, category: 'account', questionKey: 'tradingRulesPage.faq.q17.question', answerKey: 'tradingRulesPage.faq.q17.answer' },
    { id: 18, category: 'account', questionKey: 'tradingRulesPage.faq.q18.question', answerKey: 'tradingRulesPage.faq.q18.answer' }
  ]

  const toggleItem = (id) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const question = t(faq.questionKey)
    const answer = t(faq.answerKey)
    const matchesSearch = question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getCategoryInfo = (categoryId) => faqCategories.find(c => c.id === categoryId)

  // Render Trading Rules Tab
  const renderRulesTab = () => (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-yellow-500/10 backdrop-blur-xl rounded-xl border border-yellow-500/30 p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-yellow-500/20">
          <AlertTriangle className="text-yellow-400" size={18} />
        </div>
        <div>
          <h4 className="font-medium text-white mb-1">{t('tradingRulesPage.important.title')}</h4>
          <p className="text-sm text-gray-400">
            {t('tradingRulesPage.important.message')}
          </p>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map(rule => (
          <div key={rule.id} className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-5 hover:border-primary-500/30 transition-all duration-300 group">
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl ${rule.bgColor} border ${rule.borderColor} group-hover:scale-105 transition-transform`}>
                <rule.icon size={20} className={rule.color} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">{t(rule.titleKey)}</h3>
                <p className="text-sm text-gray-400">{t(rule.descKey)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Tip */}
      <div className="bg-primary-500/10 backdrop-blur-xl rounded-xl border border-primary-500/30 p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-primary-500/20">
          <Shield className="text-primary-400" size={18} />
        </div>
        <div>
          <h4 className="font-medium text-white mb-1">{t('tradingRulesPage.tip.title')}</h4>
          <p className="text-sm text-gray-400">
            {t('tradingRulesPage.tip.message')}
          </p>
        </div>
      </div>
    </div>
  )

  // Render FAQ Tab
  const renderFaqTab = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder={t('tradingRulesPage.faq.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-dark-200/50 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {faqCategories.map((category) => {
          const Icon = category.icon
          const isActive = selectedCategory === category.id
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-200/50 border border-white/5 text-gray-400 hover:text-white hover:border-primary-500/30'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-white' : category.color} />
              {t(category.nameKey)}
            </button>
          )
        })}
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const categoryInfo = getCategoryInfo(faq.category)
            const isOpen = openItems.includes(faq.id)
            return (
              <div
                key={faq.id}
                className={`bg-dark-100/80 backdrop-blur-xl rounded-xl border overflow-hidden transition-all duration-300 ${
                  isOpen ? 'border-primary-500/30' : 'border-white/5 hover:border-white/10'
                }`}
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left group"
                >
                  <div className="flex items-center gap-3 pr-4">
                    <div className={`p-2 rounded-xl ${categoryInfo.bg} transition-all duration-300 group-hover:scale-110`}>
                      <categoryInfo.icon size={16} className={categoryInfo.color} />
                    </div>
                    <span className={`text-sm font-medium transition-colors duration-300 ${isOpen ? 'text-primary-400' : 'text-white group-hover:text-primary-400'}`}>
                      {t(faq.questionKey)}
                    </span>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`flex-shrink-0 transition-all duration-300 ${
                      isOpen ? 'rotate-180 text-primary-400' : 'text-gray-400 group-hover:text-primary-400'
                    }`}
                  />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-4 pb-4 pt-0 border-t border-white/5">
                    <p className="text-sm text-gray-400 leading-relaxed pt-4">
                      {t(faq.answerKey)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-12 bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-200/50 border border-white/5 flex items-center justify-center">
              <HelpCircle size={32} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t('tradingRulesPage.faq.noResults.title')}</h3>
            <p className="text-gray-400 text-sm">{t('tradingRulesPage.faq.noResults.message')}</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
            <FileText className="text-orange-400" size={24} />
          </div>
          {t('tradingRulesPage.title')}
        </h1>
        <p className="text-gray-400 mt-1">{t('tradingRulesPage.subtitle')}</p>
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
              <span className="font-medium">{t(tab.labelKey)}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'rules' && renderRulesTab()}
      {activeTab === 'faq' && renderFaqTab()}
    </div>
  )
}

export default TradingRulesPage
