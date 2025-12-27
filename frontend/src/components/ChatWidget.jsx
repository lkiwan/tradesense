import { useState, useRef, useEffect } from 'react'
import {
  MessageCircle, X, Send, Bot, User, ChevronDown,
  HelpCircle, Sparkles, ArrowRight
} from 'lucide-react'

// FAQ Database for matching answers
const FAQ_DATABASE = [
  {
    keywords: ['tradesense', 'what is', 'about', 'company'],
    question: 'What is TradeSense?',
    answer: 'TradeSense is a proprietary trading firm that funds talented traders. We provide capital to traders who prove their skills through our evaluation process, allowing them to trade without risking their own money and keep up to 80% of the profits they generate.'
  },
  {
    keywords: ['challenge', 'process', 'how', 'work', 'phases', 'evaluation'],
    question: 'How does the challenge process work?',
    answer: 'Our challenge has two phases: Phase 1 (Evaluation) requires you to reach a 10% profit target, and Phase 2 (Verification) requires a 5% profit target. Once you pass both phases, you become a funded trader with access to real capital.'
  },
  {
    keywords: ['free', 'trial', 'demo', 'test'],
    question: 'Is there a free trial available?',
    answer: 'Yes! We offer a 7-day free trial with $5,000 virtual capital. This allows you to experience our platform and trading conditions before committing to a paid challenge.'
  },
  {
    keywords: ['profit', 'target', 'goal', 'objective'],
    question: 'What are the profit targets?',
    answer: 'Phase 1 (Evaluation) has a 10% profit target, and Phase 2 (Verification) has a 5% profit target. There is no time limit to achieve these targets.'
  },
  {
    keywords: ['drawdown', 'loss', 'limit', 'risk', 'maximum'],
    question: 'What are the drawdown rules?',
    answer: 'We have two drawdown rules: a 10% maximum overall drawdown (from your starting balance) and a 5% maximum daily loss limit. If you breach either rule, your challenge ends.'
  },
  {
    keywords: ['time', 'limit', 'deadline', 'duration'],
    question: 'Is there a time limit?',
    answer: 'No, there is no time limit to complete either phase of the challenge. You can take as long as you need to reach the profit targets while respecting the risk management rules.'
  },
  {
    keywords: ['news', 'event', 'trading', 'restriction'],
    question: 'Can I trade during news events?',
    answer: 'Yes, you can trade during high-impact news events. However, we recommend proper risk management during volatile periods. There are no trading restrictions on news events.'
  },
  {
    keywords: ['cost', 'price', 'fee', 'how much', 'pay'],
    question: 'How much do the challenges cost?',
    answer: 'Our challenge prices vary by account size: $10K account costs €89, $25K costs €250, $50K costs €345, $100K costs €439-€540, and $200K costs €899-€1080. These are one-time fees with no recurring charges.'
  },
  {
    keywords: ['payment', 'method', 'pay', 'card', 'paypal', 'crypto'],
    question: 'What payment methods do you accept?',
    answer: 'We accept PayPal, credit/debit cards (Visa, Mastercard), Bitcoin, Ethereum, Apple Pay, Google Pay, and bank transfers. All payments are processed securely.'
  },
  {
    keywords: ['payout', 'withdraw', 'profit', 'receive', 'money'],
    question: 'How do I receive my profits?',
    answer: 'As a funded trader, you can request a payout once you have profits available. Payouts are processed within 24 hours via bank transfer, PayPal, or crypto. You keep up to 80% of your profits.'
  },
  {
    keywords: ['minimum', 'payout', 'withdraw'],
    question: 'Is there a minimum payout?',
    answer: 'Yes, the minimum payout amount is $100. You can request payouts on a monthly basis, and there are no limits on the maximum payout amount.'
  },
  {
    keywords: ['market', 'trade', 'forex', 'crypto', 'stock', 'instrument'],
    question: 'What markets can I trade?',
    answer: 'You can trade Forex, cryptocurrencies, US stocks, indices, and commodities on our platform. We provide real-time market data and competitive spreads across all instruments.'
  },
  {
    keywords: ['platform', 'software', 'trading'],
    question: 'What trading platform do you use?',
    answer: 'We provide our own proprietary trading platform with real-time charts, AI-powered signals, and advanced order management. The platform is web-based and accessible from any device.'
  },
  {
    keywords: ['leverage', 'margin'],
    question: 'What is the maximum leverage?',
    answer: 'Leverage varies by instrument: up to 1:100 for forex, 1:20 for stocks, and 1:10 for cryptocurrencies. We recommend using appropriate leverage based on your risk management strategy.'
  },
  {
    keywords: ['multiple', 'account', 'accounts'],
    question: 'Can I have multiple accounts?',
    answer: 'Yes, you can have multiple challenge accounts. However, you cannot use the same trading strategy across multiple accounts (no copy trading between your own accounts).'
  },
  {
    keywords: ['fail', 'failed', 'lose', 'restart'],
    question: 'What if I fail the challenge?',
    answer: 'If you breach a rule or fail to reach the profit target, your challenge ends. You can purchase a new challenge at any time to try again. We recommend reviewing your trades before retrying.'
  },
  {
    keywords: ['scale', 'scaling', 'increase', 'upgrade'],
    question: 'Can I scale my funded account?',
    answer: 'Yes! Our scaling program allows you to increase your account size based on consistent performance. After maintaining profitability for 3 months, you can request an account size increase up to $300K.'
  },
  {
    keywords: ['ai', 'artificial', 'intelligence', 'signal', 'prediction'],
    question: 'How does the AI work?',
    answer: 'Our AI uses Deep Learning and Machine Learning algorithms to analyze millions of data points in real-time. It detects patterns invisible to the human eye and generates trading signals with up to 96% accuracy.'
  },
  {
    keywords: ['contact', 'support', 'help', 'email'],
    question: 'How can I contact support?',
    answer: 'You can reach our support team via email at support@tradesense.com, through live chat on our website, or via our Discord community. We offer 24/7 support for all traders.'
  },
  {
    keywords: ['refund', 'money back', 'guarantee'],
    question: 'Is there a refund policy?',
    answer: 'Yes! If you pass both phases of the challenge, we refund 100% of your challenge fee with your first payout. This means successful traders get their investment back.'
  }
]

// Find best matching answer
const findAnswer = (query) => {
  const queryLower = query.toLowerCase()
  const words = queryLower.split(/\s+/)

  let bestMatch = null
  let bestScore = 0

  for (const faq of FAQ_DATABASE) {
    let score = 0
    for (const keyword of faq.keywords) {
      if (queryLower.includes(keyword)) {
        score += 2
      }
      for (const word of words) {
        if (keyword.includes(word) || word.includes(keyword)) {
          score += 1
        }
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = faq
    }
  }

  if (bestScore >= 2) {
    return {
      found: true,
      question: bestMatch.question,
      answer: bestMatch.answer
    }
  }

  return {
    found: false,
    answer: "I'm not sure about that. Would you like to contact our support team for more specific help? You can also browse the FAQ section above or email us at support@tradesense.com"
  }
}

// Quick question suggestions
const QUICK_QUESTIONS = [
  'What is TradeSense?',
  'How much does it cost?',
  'What are the profit targets?',
  'How do I get paid?',
  'Is there a free trial?'
]

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hi! I'm TradeSense Assistant. How can I help you today? Ask me anything about our trading challenges, payouts, or platform.",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSend = (text = inputValue) => {
    if (!text.trim()) return

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate typing delay and find answer
    setTimeout(() => {
      const result = findAnswer(text)
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: result.answer,
        matchedQuestion: result.found ? result.question : null,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 800 + Math.random() * 700)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickQuestion = (question) => {
    handleSend(question)
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-500 ${
          isOpen
            ? 'bg-dark-200 rotate-0'
            : 'bg-primary-500 hover:bg-primary-600 hover:scale-110 animate-bounce-slow'
        }`}
        style={{
          boxShadow: isOpen
            ? '0 10px 40px rgba(0,0,0,0.3)'
            : '0 10px 40px rgba(34,197,94,0.4)'
        }}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <MessageCircle size={24} className="text-white" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] transition-all duration-500 ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-dark-300 rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col h-[500px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">TradeSense Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/80 text-xs">Online - Ready to help</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronDown size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-400">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user'
                      ? 'bg-primary-500'
                      : 'bg-dark-200'
                  }`}
                >
                  {message.type === 'user' ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-primary-400" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] p-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-primary-500 text-white rounded-tr-sm'
                      : 'bg-dark-200 text-gray-200 rounded-tl-sm'
                  }`}
                >
                  {message.matchedQuestion && (
                    <div className="flex items-center gap-1.5 text-primary-400 text-xs mb-2 pb-2 border-b border-white/10">
                      <HelpCircle size={12} />
                      <span>{message.matchedQuestion}</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-dark-200 flex items-center justify-center">
                  <Bot size={16} className="text-primary-400" />
                </div>
                <div className="bg-dark-200 p-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="px-4 py-3 bg-dark-300 border-t border-white/5">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Sparkles size={12} className="text-primary-400" />
                Quick questions
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    className="text-xs px-3 py-1.5 bg-dark-200 text-gray-300 rounded-full hover:bg-primary-500/20 hover:text-primary-400 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-dark-300 border-t border-white/5">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question..."
                className="flex-1 bg-dark-200 text-white placeholder-gray-500 px-4 py-3 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none transition-colors text-sm"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isTyping}
                className="p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default ChatWidget
