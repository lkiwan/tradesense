import { useState } from 'react'
import {
  FileText, AlertTriangle, CheckCircle, XCircle, Info, Shield,
  HelpCircle, ChevronDown, Search, Target, DollarSign, Users, TrendingUp
} from 'lucide-react'

const TradingRulesPage = () => {
  // Main tab state
  const [activeTab, setActiveTab] = useState('rules')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [openItems, setOpenItems] = useState([])

  // Main tabs
  const mainTabs = [
    { id: 'rules', label: 'Trading Rules', icon: FileText },
    { id: 'faq', label: 'FAQ', icon: HelpCircle }
  ]

  // Trading rules data
  const rules = [
    { id: 1, title: 'Objectif de Profit', description: 'Atteindre 10% de profit pour passer la phase', icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
    { id: 2, title: 'Drawdown Maximum', description: 'Ne pas depasser 10% de perte maximale', icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
    { id: 3, title: 'Drawdown Journalier', description: 'Ne pas depasser 5% de perte par jour', icon: AlertTriangle, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
    { id: 4, title: 'Jours de Trading', description: 'Minimum 5 jours de trading actif', icon: Info, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
    { id: 5, title: 'Pas de Trading Weekend', description: 'Aucune position ouverte le weekend', icon: XCircle, color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30' },
    { id: 6, title: 'Pas de News Trading', description: 'Eviter de trader pendant les annonces majeures', icon: Info, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  ]

  // FAQ categories
  const faqCategories = [
    { id: 'all', name: 'All Questions', icon: HelpCircle, color: 'text-primary-500', bg: 'bg-primary-500/20' },
    { id: 'getting-started', name: 'Getting Started', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { id: 'challenges', name: 'Challenge Rules', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    { id: 'payments', name: 'Payments & Payouts', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20' },
    { id: 'trading', name: 'Trading', icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { id: 'account', name: 'Account', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/20' }
  ]

  // FAQ data
  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'What is TradeSense?',
      answer: 'TradeSense is a proprietary trading firm that funds talented traders. We provide capital to traders who prove their skills through our evaluation process, allowing them to trade without risking their own money and keep up to 80% of the profits they generate.'
    },
    {
      id: 2,
      category: 'getting-started',
      question: 'How does the challenge process work?',
      answer: 'Our challenge has two phases: Phase 1 (Evaluation) requires you to reach a 10% profit target, and Phase 2 (Verification) requires a 5% profit target. Once you pass both phases, you become a funded trader with access to real capital.'
    },
    {
      id: 3,
      category: 'getting-started',
      question: 'Is there a free trial available?',
      answer: 'Yes! We offer a 7-day free trial with $5,000 virtual capital. This allows you to experience our platform and trading conditions before committing to a paid challenge. The trial has a 10% profit target and includes access to all platform features.'
    },
    {
      id: 4,
      category: 'challenges',
      question: 'What are the profit targets for each phase?',
      answer: 'Phase 1 (Evaluation) has a 10% profit target, and Phase 2 (Verification) has a 5% profit target. There is no time limit to achieve these targets, so you can trade at your own pace.'
    },
    {
      id: 5,
      category: 'challenges',
      question: 'What are the maximum drawdown rules?',
      answer: 'We have two drawdown rules: a 10% maximum overall drawdown (from your starting balance) and a 5% maximum daily loss limit. If you breach either rule, your challenge ends and you would need to start over.'
    },
    {
      id: 6,
      category: 'challenges',
      question: 'Is there a time limit to complete the challenge?',
      answer: 'No, there is no time limit to complete either phase of the challenge. You can take as long as you need to reach the profit targets while respecting the risk management rules.'
    },
    {
      id: 7,
      category: 'challenges',
      question: 'Can I trade during news events?',
      answer: 'Yes, you can trade during high-impact news events. However, we recommend proper risk management during volatile periods. There are no trading restrictions on news events.'
    },
    {
      id: 8,
      category: 'payments',
      question: 'How much do the challenges cost?',
      answer: 'Our challenge prices vary by account size: Starter ($5K account) costs $200, Pro ($25K account) costs $500, and Elite ($100K account) costs $1,000. These are one-time fees with no recurring charges.'
    },
    {
      id: 9,
      category: 'payments',
      question: 'What payment methods do you accept?',
      answer: 'We accept PayPal, credit/debit cards (Visa, Mastercard), and various local payment methods depending on your region. All payments are processed securely through our payment partners.'
    },
    {
      id: 10,
      category: 'payments',
      question: 'How do I receive my profits as a funded trader?',
      answer: 'As a funded trader, you can request a payout once you have profits available. Payouts are processed within 24 hours and sent via your preferred method (bank transfer, PayPal, or crypto). You keep up to 80% of your profits.'
    },
    {
      id: 11,
      category: 'payments',
      question: 'Is there a minimum payout amount?',
      answer: 'Yes, the minimum payout amount is $100. You can request payouts on a monthly basis, and there are no limits on the maximum payout amount.'
    },
    {
      id: 12,
      category: 'trading',
      question: 'What markets can I trade?',
      answer: 'You can trade US stocks, cryptocurrencies, and Moroccan stocks on our platform. We provide real-time market data and competitive spreads across all instruments.'
    },
    {
      id: 13,
      category: 'trading',
      question: 'What trading platform do you use?',
      answer: 'We provide our own proprietary trading platform with real-time charts, AI-powered signals, and advanced order management. The platform is web-based and accessible from any device.'
    },
    {
      id: 14,
      category: 'trading',
      question: 'Are there any trading restrictions?',
      answer: 'We have minimal restrictions: no martingale strategies, no copy trading from external sources, and positions must be closed before the market closes on Friday (for weekend risk management). Other than that, you have full freedom in your trading approach.'
    },
    {
      id: 15,
      category: 'trading',
      question: 'What is the maximum leverage available?',
      answer: 'Leverage varies by instrument: up to 1:100 for forex, 1:20 for stocks, and 1:10 for cryptocurrencies. We recommend using appropriate leverage based on your risk management strategy.'
    },
    {
      id: 16,
      category: 'account',
      question: 'Can I have multiple challenge accounts?',
      answer: 'Yes, you can have multiple challenge accounts. However, you cannot use the same trading strategy across multiple accounts (no copy trading between your own accounts).'
    },
    {
      id: 17,
      category: 'account',
      question: 'What happens if I fail the challenge?',
      answer: 'If you breach a rule or fail to reach the profit target, your challenge ends. You can purchase a new challenge at any time to try again. We recommend reviewing your trades and refining your strategy before retrying.'
    },
    {
      id: 18,
      category: 'account',
      question: 'Can I scale my funded account?',
      answer: 'Yes! Our scaling program allows you to increase your account size based on consistent performance. After maintaining profitability for 3 months, you can request an account size increase up to $300K.'
    }
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
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h4 className="font-medium text-white mb-1">Important</h4>
          <p className="text-sm text-gray-400">
            Le non-respect de ces regles entrainera l'echec de votre challenge. Assurez-vous de bien les comprendre avant de commencer.
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
                <h3 className="font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">{rule.title}</h3>
                <p className="text-sm text-gray-400">{rule.description}</p>
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
          <h4 className="font-medium text-white mb-1">Conseil</h4>
          <p className="text-sm text-gray-400">
            Utilisez toujours un stop-loss et ne risquez jamais plus de 1-2% de votre capital par trade pour respecter facilement les regles de drawdown.
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
          placeholder="Search questions..."
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
              {category.name}
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
                      {faq.question}
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
                      {faq.answer}
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
            <h3 className="text-lg font-semibold text-white mb-2">No questions found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your search or category filter.</p>
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
          Trading Rules & FAQ
        </h1>
        <p className="text-gray-400 mt-1">Understand the rules and find answers to common questions</p>
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
      {activeTab === 'rules' && renderRulesTab()}
      {activeTab === 'faq' && renderFaqTab()}
    </div>
  )
}

export default TradingRulesPage
