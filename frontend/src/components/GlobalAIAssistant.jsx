import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChallenge } from '../context/ChallengeContext'
import { tradesAPI } from '../services/api'
import { showSuccessToast, showErrorToast } from '../utils/errorHandler'
import {
  MessageCircle, X, Send, Bot, User, Sparkles, Mic, MicOff,
  Volume2, VolumeX, ArrowRight, TrendingUp, TrendingDown, Loader2,
  Navigation, ExternalLink, ChevronDown, Zap, XCircle
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Navigation mapping - what pages users can go to
const NAVIGATION_MAP = {
  // Dashboard routes
  'dashboard': '/accounts',
  'accounts': '/accounts',
  'home': '/accounts',
  'trading': '/trading',
  'trade': '/trading',
  'charts': '/charts',
  'signals': '/signals',
  'markets': '/markets',
  'market': '/markets',
  'forex': '/forex',
  'news': '/news',
  'calendar': '/calendar',
  'profile': '/profile/default',
  'settings': '/settings',
  'notifications': '/notifications',
  'support': '/support',
  'payouts': '/payouts',
  'payout': '/payouts',
  'transactions': '/transactions',
  'billing': '/billing/billing-history',
  'plans': '/plans',
  'pricing': '/pricing',
  'challenges': '/plans',
  'challenge': '/plans',
  'quick trading': '/quick-trading',
  'quick-trading': '/quick-trading',
  'journal': '/trade-journal',
  'trade journal': '/trade-journal',
  'referral': '/refer-and-earn',
  'refer': '/refer-and-earn',
  'affiliate': '/refer-and-earn',
  'points': '/infinity-points',
  'infinity points': '/infinity-points',
  'rewards': '/infinity-points/rewards',
  'competitions': '/competitions',
  'competition': '/competitions',
  'leaderboard': '/leaderboard',
  'copy trading': '/copy-trading',
  'copy': '/copy-trading',
  'ideas': '/trading-ideas',
  'trading ideas': '/trading-ideas',
  'calculator': '/calculator',
  'kyc': '/kyc',
  'verification': '/kyc',
  // Public routes
  'faq': '/faq',
  'about': '/about',
  'contact': '/contact',
  'academy': '/academy',
  'learn': '/academy',
  'education': '/academy',
  'masterclass': '/masterclass',
  'community': '/community',
  'blog': '/blog',
  'webinars': '/webinars',
  'hall of fame': '/hall-of-fame',
  'partners': '/partners',
  'how it works': '/how-it-works',
  'free trial': '/free-trial',
  'trial': '/free-trial'
}

// Quick actions for suggestions
const QUICK_ACTIONS = [
  { label: 'Go to Trading', action: 'navigate', target: '/trading', icon: TrendingUp },
  { label: 'View Signals', action: 'navigate', target: '/signals', icon: Zap },
  { label: 'Check Markets', action: 'navigate', target: '/markets', icon: Navigation },
  { label: 'My Dashboard', action: 'navigate', target: '/accounts', icon: ExternalLink }
]

const GlobalAIAssistant = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const { hasActiveChallenge, activeChallenge } = useChallenge()

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [pendingTrade, setPendingTrade] = useState(null)
  const [pendingCloseAll, setPendingCloseAll] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'fr-FR'

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'bot',
        text: user
          ? `Merhba bik ${user.first_name || 'ami'}! Ana TradeSense AI. Kifach n9der n3awnek lyouma? 🚀\n\nT9der tgoli:\n• "Weddini l trading" - Bach nmchi l page dyal trading\n• "Bghit nchri Apple" - Bach neftah trade\n• "Chnou les signaux?" - Bach nchouf les signaux`
          : `Merhba bik! Ana TradeSense AI. Kifach n9der n3awnek? 🎯\n\nT9der tsawelni 3la:\n• Les challenges dyal TradeSense\n• Les prix w les offres\n• Kifach tbda f trading`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, user])

  // Text-to-speech function
  const speak = useCallback((text) => {
    if (!soundEnabled || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    utterance.rate = 1.0
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [soundEnabled])

  // Parse AI response for actions
  const parseActions = (text) => {
    const actions = []
    const lowerText = text.toLowerCase()

    // Check for navigation intent
    for (const [keyword, path] of Object.entries(NAVIGATION_MAP)) {
      if (lowerText.includes(`[navigate:${keyword}]`) || lowerText.includes(`[goto:${keyword}]`)) {
        actions.push({ type: 'navigate', path, label: keyword })
      }
    }

    // Check for trade intent
    const tradeMatch = text.match(/\[trade:(\w+):(\w+):([\d.]+)\]/i)
    if (tradeMatch) {
      actions.push({
        type: 'trade',
        symbol: tradeMatch[1].toUpperCase(),
        tradeType: tradeMatch[2].toLowerCase(),
        quantity: parseFloat(tradeMatch[3])
      })
    }

    return actions
  }

  // Clean response text (remove action tags)
  const cleanResponse = (text) => {
    return text
      .replace(/\[navigate:\w+\]/gi, '')
      .replace(/\[goto:\w+\]/gi, '')
      .replace(/\[trade:\w+:\w+:[\d.]+\]/gi, '')
      .trim()
  }

  // Detect navigation intent from user message
  const detectNavigationIntent = (message) => {
    const lowerMsg = message.toLowerCase()

    // Navigation keywords in multiple languages
    const navKeywords = [
      'weddini', 'mchini', 'bghit nmchi', 'take me', 'go to', 'navigate', 'open',
      'aller', 'ouvrir', 'show me', 'afficher', 'voir', 'chof', 'werini'
    ]

    const hasNavIntent = navKeywords.some(kw => lowerMsg.includes(kw))
    if (!hasNavIntent) return null

    // Find matching destination
    for (const [keyword, path] of Object.entries(NAVIGATION_MAP)) {
      if (lowerMsg.includes(keyword)) {
        return { path, keyword }
      }
    }

    return null
  }

  // Detect trade intent from user message
  const detectTradeIntent = (message) => {
    const lowerMsg = message.toLowerCase()

    // Trade keywords
    const buyKeywords = ['buy', 'acheter', 'chri', 'bghit nchri', 'long', 'achat']
    const sellKeywords = ['sell', 'vendre', 'bi3', 'bghit nbi3', 'short', 'vente']

    let tradeType = null
    if (buyKeywords.some(kw => lowerMsg.includes(kw))) tradeType = 'buy'
    if (sellKeywords.some(kw => lowerMsg.includes(kw))) tradeType = 'sell'

    if (!tradeType) return null

    // Symbol mapping - all supported symbols with proper format
    const symbolMap = {
      // US Stocks (direct symbols)
      'aapl': 'AAPL', 'apple': 'AAPL',
      'tsla': 'TSLA', 'tesla': 'TSLA',
      'googl': 'GOOGL', 'google': 'GOOGL',
      'msft': 'MSFT', 'microsoft': 'MSFT',
      'amzn': 'AMZN', 'amazon': 'AMZN',
      'meta': 'META', 'facebook': 'META',
      'nvda': 'NVDA', 'nvidia': 'NVDA',
      'nflx': 'NFLX', 'netflix': 'NFLX',
      'amd': 'AMD',
      'jpm': 'JPM', 'jpmorgan': 'JPM',
      // Crypto (must use -USD suffix for yfinance)
      'btc': 'BTC-USD', 'bitcoin': 'BTC-USD', 'btc-usd': 'BTC-USD', 'btcusd': 'BTC-USD',
      'eth': 'ETH-USD', 'ethereum': 'ETH-USD', 'eth-usd': 'ETH-USD', 'ethusd': 'ETH-USD',
      'sol': 'SOL-USD', 'solana': 'SOL-USD', 'sol-usd': 'SOL-USD', 'solusd': 'SOL-USD',
      'xrp': 'XRP-USD', 'ripple': 'XRP-USD', 'xrp-usd': 'XRP-USD', 'xrpusd': 'XRP-USD',
      'ada': 'ADA-USD', 'cardano': 'ADA-USD', 'ada-usd': 'ADA-USD', 'adausd': 'ADA-USD',
      'doge': 'DOGE-USD', 'dogecoin': 'DOGE-USD', 'doge-usd': 'DOGE-USD', 'dogeusd': 'DOGE-USD',
      // Moroccan stocks
      'iam': 'IAM', 'maroc telecom': 'IAM', 'maroctelecom': 'IAM',
      'atw': 'ATW', 'attijariwafa': 'ATW', 'attijari': 'ATW',
      'bcp': 'BCP', 'banque populaire': 'BCP',
      'cih': 'CIH',
      'hps': 'HPS',
      'mng': 'MNG', 'managem': 'MNG',
      'lbv': 'LBV', 'label vie': 'LBV'
    }

    // Find symbol in message
    let symbol = null
    for (const [key, value] of Object.entries(symbolMap)) {
      if (lowerMsg.includes(key)) {
        symbol = value
        break
      }
    }

    if (!symbol) return null

    // Try to find quantity (default to 1)
    const qtyMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:actions?|shares?|units?|coins?)?/i)
    const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 1

    console.log('Detected trade intent:', { symbol, tradeType, quantity })
    return { symbol, tradeType, quantity }
  }

  // Execute trade
  const executeTrade = async (trade) => {
    if (!isAuthenticated) {
      showErrorToast(null, 'You need to be logged in to trade')
      return false
    }

    if (!hasActiveChallenge) {
      showErrorToast(null, 'You need an active challenge to trade. Go to Plans to get one!')
      return false
    }

    try {
      console.log('Executing trade:', trade)
      const response = await tradesAPI.open({
        symbol: trade.symbol,
        trade_type: trade.tradeType,
        quantity: trade.quantity
      })
      console.log('Trade response:', response)
      showSuccessToast(`Trade opened: ${trade.tradeType.toUpperCase()} ${trade.quantity} ${trade.symbol}`)
      return true
    } catch (error) {
      console.error('Trade execution error:', error)
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to execute trade'
      showErrorToast(null, errorMsg)
      return false
    }
  }

  // Detect close all trades intent
  const detectCloseAllIntent = (message) => {
    const lowerMsg = message.toLowerCase()
    const closeAllKeywords = [
      'close all', 'fermer tout', 'fermer toutes', 'sed koulchi', 'sed kolchi',
      'close everything', 'close all trades', 'close all positions',
      'fermer toutes les positions', 'fermer tous les trades',
      'sedd', 'sed les trades', 'sed all'
    ]
    return closeAllKeywords.some(kw => lowerMsg.includes(kw))
  }

  // Execute close all trades
  const executeCloseAll = async () => {
    if (!isAuthenticated) {
      showErrorToast(null, 'You need to be logged in')
      return false
    }

    if (!hasActiveChallenge) {
      showErrorToast(null, 'You need an active challenge')
      return false
    }

    try {
      console.log('Closing all trades...')
      const response = await tradesAPI.closeAll()
      console.log('Close all response:', response)
      const data = response.data
      showSuccessToast(`Closed ${data.closed_count} positions! P/L: $${data.total_profit?.toFixed(2) || 0}`)
      return { success: true, ...data }
    } catch (error) {
      console.error('Close all error:', error)
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to close trades'
      showErrorToast(null, errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  // Handle send message
  const handleSend = async (text = inputValue) => {
    if (!text.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Check for direct navigation intent
    const navIntent = detectNavigationIntent(text)
    if (navIntent) {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: `Wakha! Ghadi nweddik l ${navIntent.keyword}... 🚀`,
        timestamp: new Date(),
        actions: [{ type: 'navigate', path: navIntent.path, label: navIntent.keyword }]
      }
      setMessages(prev => [...prev, botResponse])
      setIsLoading(false)

      // Navigate after a short delay
      setTimeout(() => {
        navigate(navIntent.path)
        setIsOpen(false)
      }, 1000)
      return
    }

    // Check for close all trades intent
    if (detectCloseAllIntent(text) && isAuthenticated && hasActiveChallenge) {
      setPendingCloseAll(true)
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: `⚠️ Bghiti tsed GA3 les trades dyalk?\n\nHad l'action ghadi tsed toutes les positions li meftouhin.\n\nClick "Confirm Close All" ila mte2ked!`,
        timestamp: new Date(),
        pendingCloseAll: true
      }
      setMessages(prev => [...prev, botResponse])
      setIsLoading(false)
      return
    }

    // Check for trade intent
    const tradeIntent = detectTradeIntent(text)
    if (tradeIntent && isAuthenticated && hasActiveChallenge) {
      setPendingTrade(tradeIntent)
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: `Bghiti t${tradeIntent.tradeType === 'buy' ? 'chri' : 'bi3'}?\n\n📊 Symbol: ${tradeIntent.symbol}\n💰 Quantity: ${tradeIntent.quantity}\n📈 Type: ${tradeIntent.tradeType.toUpperCase()}\n\nClick "Confirm" bach neftah l trade!`,
        timestamp: new Date(),
        pendingTrade: tradeIntent
      }
      setMessages(prev => [...prev, botResponse])
      setIsLoading(false)
      return
    }

    // Send to AI backend
    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            isAuthenticated,
            hasChallenge: hasActiveChallenge,
            currentPage: location.pathname,
            userName: user?.first_name
          }
        })
      })

      const data = await response.json()
      const aiText = data.response || data.error || 'Smahli, ma9dertch nfhemk. Jreb mera khra.'

      // Parse for actions
      const actions = parseActions(aiText)
      const cleanText = cleanResponse(aiText)

      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: cleanText,
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined
      }
      setMessages(prev => [...prev, botResponse])

      // Speak response
      if (soundEnabled) {
        speak(cleanText)
      }

      // Auto-execute navigation if found
      const navAction = actions.find(a => a.type === 'navigate')
      if (navAction) {
        setTimeout(() => {
          navigate(navAction.path)
        }, 2000)
      }

    } catch (error) {
      console.error('AI Chat Error:', error)
      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: 'Smahli, kayn mochkil f connection. Jreb mera khra. 😅',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle trade confirmation
  const handleConfirmTrade = async () => {
    if (!pendingTrade) return

    setIsLoading(true)

    // Extra validation
    if (!isAuthenticated) {
      const resultMessage = {
        id: Date.now(),
        type: 'bot',
        text: `Khassek t connecti bach t trader! 🔐 Click "Login" bach tdkhl.`,
        timestamp: new Date(),
        actions: [{ type: 'navigate', path: '/login', label: 'Login' }]
      }
      setMessages(prev => [...prev, resultMessage])
      setPendingTrade(null)
      setIsLoading(false)
      return
    }

    if (!hasActiveChallenge) {
      const resultMessage = {
        id: Date.now(),
        type: 'bot',
        text: `Khassek challenge bach t trader! 📊 Chof les plans dyalna.`,
        timestamp: new Date(),
        actions: [{ type: 'navigate', path: '/plans', label: 'View Plans' }]
      }
      setMessages(prev => [...prev, resultMessage])
      setPendingTrade(null)
      setIsLoading(false)
      return
    }

    const success = await executeTrade(pendingTrade)

    const resultMessage = {
      id: Date.now(),
      type: 'bot',
      text: success
        ? `Trade executed! ✅ ${pendingTrade.tradeType.toUpperCase()} ${pendingTrade.quantity} ${pendingTrade.symbol}. Chof l trades dyalk f dashboard.`
        : `Ma9dertch neftah l trade. 😕 Check l balance dyalk, wla l symbol, wla jreb mera khra. Open the console (F12) to see the error.`,
      timestamp: new Date(),
      actions: success ? [{ type: 'navigate', path: '/trading', label: 'View Trades' }] : [{ type: 'navigate', path: '/accounts', label: 'Check Balance' }]
    }
    setMessages(prev => [...prev, resultMessage])
    setPendingTrade(null)
    setIsLoading(false)
  }

  // Handle close all confirmation
  const handleConfirmCloseAll = async () => {
    if (!pendingCloseAll) return

    setIsLoading(true)

    const result = await executeCloseAll()

    const resultMessage = {
      id: Date.now(),
      type: 'bot',
      text: result.success
        ? `✅ Seddina ${result.closed_count} trades!\n\n💰 Total P/L: $${result.total_profit?.toFixed(2) || 0}\n💵 New Balance: $${result.new_balance?.toFixed(2) || 'N/A'}`
        : `❌ Ma9dertch nsed les trades. ${result.error || 'Jreb mera khra.'}`,
      timestamp: new Date(),
      actions: result.success ? [{ type: 'navigate', path: '/trading', label: 'View Trading' }] : undefined
    }
    setMessages(prev => [...prev, resultMessage])
    setPendingCloseAll(false)
    setIsLoading(false)
  }

  // Handle voice input
  const toggleVoice = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // Handle quick action
  const handleQuickAction = (action) => {
    if (action.action === 'navigate') {
      navigate(action.target)
      setIsOpen(false)
    }
  }

  // Handle action button click
  const handleActionClick = (action) => {
    if (action.type === 'navigate') {
      navigate(action.path)
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[9999] p-4 rounded-full shadow-2xl transition-all duration-300 ${
          isOpen
            ? 'bg-dark-300 rotate-0 scale-100'
            : 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 hover:scale-110'
        }`}
        style={{
          boxShadow: isOpen
            ? '0 10px 40px rgba(0,0,0,0.4)'
            : '0 10px 40px rgba(34,197,94,0.5), 0 0 60px rgba(34,197,94,0.3)'
        }}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <>
            <Bot size={24} className="text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
          </>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 z-[9999] w-[400px] max-w-[calc(100vw-48px)] transition-all duration-300 ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto scale-100'
            : 'opacity-0 translate-y-8 pointer-events-none scale-95'
        }`}
      >
        <div className="bg-dark-300 rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col h-[550px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot size={26} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">TradeSense AI</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                  <span className="text-white/80 text-xs">Online • Voice & Text</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title={soundEnabled ? 'Mute' : 'Unmute'}
                >
                  {soundEnabled ? (
                    <Volume2 size={18} className="text-white" />
                  ) : (
                    <VolumeX size={18} className="text-white/60" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronDown size={18} className="text-white" />
                </button>
              </div>
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
                      ? 'bg-green-500'
                      : 'bg-gradient-to-br from-green-500 to-emerald-600'
                  }`}
                >
                  {message.type === 'user' ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-white" />
                  )}
                </div>
                <div className={`max-w-[80%] ${message.type === 'user' ? '' : ''}`}>
                  <div
                    className={`p-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-green-500 text-white rounded-tr-sm'
                        : 'bg-dark-200 text-gray-100 rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                  </div>

                  {/* Action buttons */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(action)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium hover:bg-green-500/30 transition-colors"
                        >
                          {action.type === 'navigate' && <Navigation size={12} />}
                          {action.type === 'trade' && <TrendingUp size={12} />}
                          {action.label || action.path}
                          <ArrowRight size={12} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Trade confirmation */}
                  {message.pendingTrade && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleConfirmTrade}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                        Confirm Trade
                      </button>
                      <button
                        onClick={() => setPendingTrade(null)}
                        className="px-4 py-2 bg-dark-100 text-gray-400 rounded-lg text-sm hover:bg-dark-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Close all confirmation */}
                  {message.pendingCloseAll && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleConfirmCloseAll}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Confirm Close All
                      </button>
                      <button
                        onClick={() => setPendingCloseAll(false)}
                        className="px-4 py-2 bg-dark-100 text-gray-400 rounded-lg text-sm hover:bg-dark-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && !pendingTrade && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-dark-200 p-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (show only when few messages) */}
          {messages.length <= 2 && isAuthenticated && (
            <div className="px-4 py-3 bg-dark-300/80 border-t border-white/5">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Sparkles size={12} className="text-green-400" />
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-dark-200 text-gray-300 rounded-full hover:bg-green-500/20 hover:text-green-400 transition-colors"
                  >
                    <action.icon size={12} />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-dark-300 border-t border-white/5">
            <div className="flex gap-2">
              <button
                onClick={toggleVoice}
                disabled={!recognitionRef.current}
                className={`p-3 rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-dark-200 text-gray-400 hover:text-green-400 hover:bg-dark-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Kteb wla hder m3aya..."
                className="flex-1 bg-dark-200 text-white placeholder-gray-500 px-4 py-3 rounded-xl border border-white/5 focus:border-green-500/50 focus:outline-none transition-colors text-sm"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[9998] md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default GlobalAIAssistant
