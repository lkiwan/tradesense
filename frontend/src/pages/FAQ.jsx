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
    { id: 'all', nameKey: 'faqPage.categories.all', icon: HelpCircle, color: 'text-primary-500', bg: 'bg-primary-500/20' },
    { id: 'getting-started', nameKey: 'faqPage.categories.gettingStarted', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { id: 'challenges', nameKey: 'faqPage.categories.challenges', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    { id: 'payments', nameKey: 'faqPage.categories.payments', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20' },
    { id: 'trading', nameKey: 'faqPage.categories.trading', icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    { id: 'account', nameKey: 'faqPage.categories.account', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/20' }
  ]

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      questionKey: 'faqPage.questions.q1.question',
      answerKey: 'faqPage.questions.q1.answer'
    },
    {
      id: 2,
      category: 'getting-started',
      questionKey: 'faqPage.questions.q2.question',
      answerKey: 'faqPage.questions.q2.answer'
    },
    {
      id: 3,
      category: 'getting-started',
      questionKey: 'faqPage.questions.q3.question',
      answerKey: 'faqPage.questions.q3.answer'
    },
    {
      id: 4,
      category: 'challenges',
      questionKey: 'faqPage.questions.q4.question',
      answerKey: 'faqPage.questions.q4.answer'
    },
    {
      id: 5,
      category: 'challenges',
      questionKey: 'faqPage.questions.q5.question',
      answerKey: 'faqPage.questions.q5.answer'
    },
    {
      id: 6,
      category: 'challenges',
      questionKey: 'faqPage.questions.q6.question',
      answerKey: 'faqPage.questions.q6.answer'
    },
    {
      id: 7,
      category: 'challenges',
      questionKey: 'faqPage.questions.q7.question',
      answerKey: 'faqPage.questions.q7.answer'
    },
    {
      id: 8,
      category: 'payments',
      questionKey: 'faqPage.questions.q8.question',
      answerKey: 'faqPage.questions.q8.answer'
    },
    {
      id: 9,
      category: 'payments',
      questionKey: 'faqPage.questions.q9.question',
      answerKey: 'faqPage.questions.q9.answer'
    },
    {
      id: 10,
      category: 'payments',
      questionKey: 'faqPage.questions.q10.question',
      answerKey: 'faqPage.questions.q10.answer'
    },
    {
      id: 11,
      category: 'payments',
      questionKey: 'faqPage.questions.q11.question',
      answerKey: 'faqPage.questions.q11.answer'
    },
    {
      id: 12,
      category: 'trading',
      questionKey: 'faqPage.questions.q12.question',
      answerKey: 'faqPage.questions.q12.answer'
    },
    {
      id: 13,
      category: 'trading',
      questionKey: 'faqPage.questions.q13.question',
      answerKey: 'faqPage.questions.q13.answer'
    },
    {
      id: 14,
      category: 'trading',
      questionKey: 'faqPage.questions.q14.question',
      answerKey: 'faqPage.questions.q14.answer'
    },
    {
      id: 15,
      category: 'trading',
      questionKey: 'faqPage.questions.q15.question',
      answerKey: 'faqPage.questions.q15.answer'
    },
    {
      id: 16,
      category: 'account',
      questionKey: 'faqPage.questions.q16.question',
      answerKey: 'faqPage.questions.q16.answer'
    },
    {
      id: 17,
      category: 'account',
      questionKey: 'faqPage.questions.q17.question',
      answerKey: 'faqPage.questions.q17.answer'
    },
    {
      id: 18,
      category: 'account',
      questionKey: 'faqPage.questions.q18.question',
      answerKey: 'faqPage.questions.q18.answer'
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
    const question = t(faq.questionKey)
    const answer = t(faq.answerKey)
    const matchesSearch = question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         answer.toLowerCase().includes(searchQuery.toLowerCase())
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
            <span className="text-primary-300 text-sm font-medium">{t('faqPage.badge')}</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {t('faqPage.title')} <span className="gradient-text-animated">{t('faqPage.titleHighlight')}</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('faqPage.subtitle')}
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-primary-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative group">
              <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" />
              <input
                type="text"
                placeholder={t('faqPage.searchPlaceholder')}
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
                  {t(category.nameKey)}
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
                          {t(faq.questionKey)}
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
                          {t(faq.answerKey)}
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
                <h3 className="text-xl font-semibold text-white mb-3">{t('faqPage.noResults')}</h3>
                <p className="text-gray-400">{t('faqPage.noResultsHint')}</p>
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
              {t('faqPage.support.badge')}
            </div>

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
              {t('faqPage.support.title')} <span className="gradient-text-animated">{t('faqPage.support.titleHighlight')}</span>
            </h2>
            <p className="text-gray-400 mb-10 text-lg max-w-xl mx-auto">
              {t('faqPage.support.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link
                to="/contact"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 md:px-8 py-4 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-105 active:scale-95"
              >
                <Mail size={20} />
                {t('faqPage.support.contactButton')}
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 md:px-8 py-4 glass-card text-white font-semibold rounded-xl hover:border-primary-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <MessageCircle size={20} className="text-primary-400" />
                {t('faqPage.support.chatButton')}
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
              {t('faqPage.resources.badge')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {t('faqPage.resources.title')}
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
                {t('faqPage.resources.howItWorks')}
              </h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">
                {t('faqPage.resources.howItWorksDesc')}
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
                {t('faqPage.resources.pricing')}
              </h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">
                {t('faqPage.resources.pricingDesc')}
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
                {t('faqPage.resources.academy')}
              </h3>
              <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed hidden sm:block">
                {t('faqPage.resources.academyDesc')}
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
