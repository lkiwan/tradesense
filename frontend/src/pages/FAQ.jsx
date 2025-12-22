import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  HelpCircle, ChevronDown, Search, MessageCircle,
  Mail, Zap, ArrowRight, Target, DollarSign, Shield,
  Clock, TrendingUp, Users
} from 'lucide-react'

const FAQ = () => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [openItems, setOpenItems] = useState([])

  const categories = [
    { id: 'all', name: 'All Questions', icon: HelpCircle },
    { id: 'getting-started', name: 'Getting Started', icon: Target },
    { id: 'challenges', name: 'Challenge Rules', icon: TrendingUp },
    { id: 'payments', name: 'Payments & Payouts', icon: DollarSign },
    { id: 'trading', name: 'Trading', icon: Shield },
    { id: 'account', name: 'Account', icon: Users }
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-200 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full text-primary-500 text-sm font-medium mb-4">
            <HelpCircle size={16} />
            FAQ
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Find answers to common questions about TradeSense
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-dark-100 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 border border-gray-200 dark:border-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-dark-100 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-50 border border-gray-200 dark:border-dark-100'
                }`}
              >
                <Icon size={16} />
                {category.name}
              </button>
            )
          })}
        </div>

        {/* FAQ List */}
        <div className="space-y-4 mb-12">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white dark:bg-dark-100 rounded-xl border border-gray-200 dark:border-dark-100 overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-dark-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                      openItems.includes(faq.id) ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openItems.includes(faq.id) && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <HelpCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No questions found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or category filter.</p>
            </div>
          )}
        </div>

        {/* Still Need Help */}
        <div className="bg-white dark:bg-dark-100 rounded-2xl p-8 text-center border border-gray-200 dark:border-dark-100">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Still Have Questions?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
            >
              <Mail size={18} />
              Contact Support
            </Link>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-dark-50 transition-colors"
            >
              <MessageCircle size={18} />
              Live Chat
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Link
            to="/how-it-works"
            className="p-6 bg-white dark:bg-dark-100 rounded-xl border border-gray-200 dark:border-dark-100 hover:border-primary-500/50 transition-colors group"
          >
            <Target size={24} className="text-primary-500 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">
              How It Works
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Learn about our challenge process step by step.
            </p>
          </Link>
          <Link
            to="/pricing"
            className="p-6 bg-white dark:bg-dark-100 rounded-xl border border-gray-200 dark:border-dark-100 hover:border-primary-500/50 transition-colors group"
          >
            <DollarSign size={24} className="text-primary-500 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">
              Pricing
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View our challenge plans and pricing options.
            </p>
          </Link>
          <Link
            to="/academy"
            className="p-6 bg-white dark:bg-dark-100 rounded-xl border border-gray-200 dark:border-dark-100 hover:border-primary-500/50 transition-colors group"
          >
            <Clock size={24} className="text-primary-500 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">
              Academy
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Free educational resources for traders.
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default FAQ
