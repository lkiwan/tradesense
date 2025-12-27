import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  HelpCircle, ChevronDown, Search, MessageCircle,
  Mail, Zap, ArrowRight, Target, DollarSign, Shield,
  Clock, TrendingUp, Users, Sparkles, BookOpen
} from 'lucide-react'
import ChatWidget from '../components/ChatWidget'

const FAQ = () => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [openItems, setOpenItems] = useState([])

  const categories = [
    { id: 'all', name: 'All Questions', icon: HelpCircle, color: 'text-primary-500', bg: 'bg-primary-500/20' },
    { id: 'getting-started', name: 'Getting Started', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { id: 'challenges', name: 'Challenge Rules', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    { id: 'payments', name: 'Payments & Payouts', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20' },
    { id: 'trading', name: 'Trading', icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { id: 'account', name: 'Account', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/20' }
  ]

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

  const getCategoryInfo = (categoryId) => categories.find(c => c.id === categoryId)

  return (
    <div className="min-h-screen bg-dark-400">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-8 animate-float">
            <HelpCircle className="text-primary-400" size={18} />
            <span className="text-primary-300 text-sm font-medium">Help Center</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Frequently Asked <span className="gradient-text-animated">Questions</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Find answers to common questions about TradeSense, our challenges, and trading conditions.
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-primary-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative group">
              <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 glass-card rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative py-8">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-400 via-dark-300/50 to-dark-400" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category, index) => {
              const Icon = category.icon
              const isActive = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`group flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'glass-card text-gray-400 hover:text-white hover:border-primary-500/30'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? '' : 'group-hover:rotate-6'}`}>
                    <Icon size={18} className={isActive ? 'text-white' : category.color} />
                  </div>
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="relative py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => {
                const categoryInfo = getCategoryInfo(faq.category)
                const isOpen = openItems.includes(faq.id)
                return (
                  <div
                    key={faq.id}
                    className={`glass-card rounded-2xl overflow-hidden transition-all duration-500 ${
                      isOpen ? 'shadow-[0_10px_40px_rgba(34,197,94,0.1)] border-primary-500/30' : 'hover:border-white/10'
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full flex items-center justify-between p-4 md:p-6 text-left group"
                    >
                      <div className="flex items-center gap-3 md:gap-4 pr-2 md:pr-4">
                        <div className={`p-2 rounded-xl ${categoryInfo.bg} transition-all duration-300 group-hover:scale-110`}>
                          <categoryInfo.icon size={18} className={categoryInfo.color} />
                        </div>
                        <span className={`text-sm md:text-base font-medium transition-colors duration-300 ${isOpen ? 'text-primary-400' : 'text-white group-hover:text-primary-400'}`}>
                          {faq.question}
                        </span>
                      </div>
                      <ChevronDown
                        size={22}
                        className={`flex-shrink-0 transition-all duration-500 ${
                          isOpen ? 'rotate-180 text-primary-400' : 'text-gray-400 group-hover:text-primary-400'
                        }`}
                      />
                    </button>
                    <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                      <div className="px-4 md:px-6 pb-4 md:pb-6 pt-0 border-t border-white/5">
                        <p className="text-sm md:text-base text-gray-400 leading-relaxed pt-4">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-16 glass-card rounded-2xl">
                <div className="w-20 h-20 bg-gray-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <HelpCircle size={40} className="text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">No questions found</h3>
                <p className="text-gray-400">Try adjusting your search or category filter.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-blue-600/10 to-purple-600/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl p-10 md:p-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6">
              <MessageCircle size={16} />
              Support
            </div>

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
              Still Have <span className="gradient-text-animated">Questions</span>?
            </h2>
            <p className="text-gray-400 mb-10 text-lg max-w-xl mx-auto">
              Can't find what you're looking for? Our support team is here to help 24/7.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link
                to="/contact"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 md:px-8 py-4 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-105 active:scale-95"
              >
                <Mail size={20} />
                Contact Support
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 md:px-8 py-4 glass-card text-white font-semibold rounded-xl hover:border-primary-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <MessageCircle size={20} className="text-primary-400" />
                Live Chat
                <Zap size={16} className="text-yellow-400 animate-pulse" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="relative py-20 bg-dark-300/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-blue-400 text-sm font-medium mb-6">
              <Sparkles size={16} />
              Helpful Resources
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Explore More
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-6">
            <Link
              to="/how-it-works"
              className="group glass-card p-3 sm:p-8 rounded-lg sm:rounded-2xl hover:border-blue-500/30 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)]"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-500/20 rounded-lg sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-5 mx-auto sm:mx-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Target className="w-5 h-5 sm:w-7 sm:h-7 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white text-xs sm:text-lg mb-1 sm:mb-2 group-hover:text-blue-400 transition-colors text-center sm:text-left">
                How It Works
              </h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">
                Learn about our challenge process step by step.
              </p>
            </Link>

            <Link
              to="/pricing"
              className="group glass-card p-3 sm:p-8 rounded-lg sm:rounded-2xl hover:border-green-500/30 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(34,197,94,0.15)]"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-green-500/20 rounded-lg sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-5 mx-auto sm:mx-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <DollarSign className="w-5 h-5 sm:w-7 sm:h-7 text-green-400" />
              </div>
              <h3 className="font-semibold text-white text-xs sm:text-lg mb-1 sm:mb-2 group-hover:text-green-400 transition-colors text-center sm:text-left">
                Pricing
              </h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">
                View our challenge plans and pricing options.
              </p>
            </Link>

            <Link
              to="/academy"
              className="group glass-card p-3 sm:p-8 rounded-lg sm:rounded-2xl hover:border-purple-500/30 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)]"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-purple-500/20 rounded-lg sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-5 mx-auto sm:mx-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white text-xs sm:text-lg mb-1 sm:mb-2 group-hover:text-purple-400 transition-colors text-center sm:text-left">
                Academy
              </h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">
                Free educational resources for traders.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  )
}

export default FAQ
