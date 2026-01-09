import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Sparkles, Newspaper, Users, GraduationCap,
  ChevronRight, Play, CheckCircle, TrendingUp,
  Shield, Zap, Globe, ArrowRight, Star, Quote,
  ChevronDown, BarChart3, Target, Award, Clock,
  DollarSign, LineChart, Lock, Headphones,
  Brain, Cpu, Crown, Rocket, Flame, Info,
  Volume2, VolumeX, Send, MessageCircle, RotateCcw, Trophy
} from 'lucide-react'
import PaymentMarquee from '../components/PaymentMarquee'
import TrustBadge from '../components/TrustBadge'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Animated counter component
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0)
  const countRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (countRef.current) {
      observer.observe(countRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let startTime
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }, [isVisible, end, duration])

  return <span ref={countRef}>{count.toLocaleString()}{suffix}</span>
}

// Typing animation component - Optimized for performance
const TypingText = ({ texts, className = '' }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentText = texts[currentTextIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayedText.length < currentText.length) {
          setDisplayedText(currentText.slice(0, displayedText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), 3000) // Hold text longer
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(currentText.slice(0, displayedText.length - 1))
        } else {
          setIsDeleting(false)
          setCurrentTextIndex((prev) => (prev + 1) % texts.length)
        }
      }
    }, isDeleting ? 80 : 150) // Slower typing speed

    return () => clearTimeout(timeout)
  }, [displayedText, isDeleting, currentTextIndex, texts])

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

// Scroll animation hook
const useScrollAnimation = () => {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return [ref, isVisible]
}

// FAQ Accordion Item
const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border-b border-gray-200 dark:border-dark-200">
    <button
      onClick={onClick}
      className="w-full py-5 flex items-center justify-between text-left"
    >
      <span className="text-lg font-medium text-gray-900 dark:text-white">{question}</span>
      <ChevronDown
        size={20}
        className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        }`}
    >
      <p className="text-gray-600 dark:text-gray-400">{answer}</p>
    </div>
  </div>
)

// AI Tiers Configuration
const AI_TIERS = {
  starter: { name: 'IA Starter', icon: Cpu, color: 'text-gray-400', bgColor: 'bg-gray-500/20', accuracy: '72%' },
  basic: { name: 'IA Basic', icon: Zap, color: 'text-blue-400', bgColor: 'bg-blue-500/20', accuracy: '78%' },
  advanced: { name: 'IA Advanced', icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-500/20', accuracy: '85%' },
  pro: { name: 'IA Pro', icon: Sparkles, color: 'text-orange-400', bgColor: 'bg-orange-500/20', accuracy: '91%' },
  elite: { name: 'IA Elite', icon: Crown, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', accuracy: '96%' }
}

// Pricing Plans
const PRICING_PLANS = [
  { balance: 200000, price: 1080, salePrice: 899, aiTier: 'elite', signals: 'Illimité' },
  { balance: 100000, price: 540, salePrice: 439, aiTier: 'pro', signals: '25-40', isBestValue: true },
  { balance: 50000, price: 345, salePrice: null, aiTier: 'advanced', signals: '15-25' },
  { balance: 25000, price: 250, salePrice: null, aiTier: 'basic', signals: '10-15' },
  { balance: 10000, price: 89, salePrice: null, aiTier: 'starter', signals: '5-10' },
]

const LandingPage = () => {
  const { t } = useTranslation()
  const [openFAQ, setOpenFAQ] = useState(0)
  const [heroRef, heroVisible] = useScrollAnimation()
  const [featuresRef, featuresVisible] = useScrollAnimation()
  const [stepsRef, stepsVisible] = useScrollAnimation()
  const [pricingRef, pricingVisible] = useScrollAnimation()
  const [testimonialsRef, testimonialsVisible] = useScrollAnimation()

  const features = [
    {
      icon: TrendingUp,
      title: t('landing.features.profitSplit.title'),
      description: t('landing.features.profitSplit.description'),
      color: 'text-primary-500',
      bg: 'bg-primary-500/10'
    },
    {
      icon: Clock,
      title: t('landing.features.noTimeLimit.title'),
      description: t('landing.features.noTimeLimit.description'),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Newspaper,
      title: t('landing.features.newsTrading.title'),
      description: t('landing.features.newsTrading.description'),
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      icon: Zap,
      title: t('landing.features.spreads.title'),
      description: t('landing.features.spreads.description'),
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      icon: RotateCcw,
      title: t('landing.features.reset.title'),
      description: t('landing.features.reset.description'),
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    },
    {
      icon: Trophy,
      title: t('landing.features.competitions.title'),
      description: t('landing.features.competitions.description'),
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10'
    }
  ]

  const steps = [
    { step: 1, icon: Target, ...t('landing.howItWorks.step1', { returnObjects: true }) },
    { step: 2, icon: BarChart3, ...t('landing.howItWorks.step2', { returnObjects: true }) },
    { step: 3, icon: TrendingUp, ...t('landing.howItWorks.step3', { returnObjects: true }) },
    { step: 4, icon: Award, ...t('landing.howItWorks.step4', { returnObjects: true }) }
  ]

  const testimonials = [
    {
      name: 'محمد الإدريسي',
      roleKey: 'professional',
      avatar: 'م',
      rating: 5,
      text: 'صراحة كنت خايف نبدا فالتداول، بصح TradeSense غيرت كلشي. الإشارات ديالهم دقيقة بزاف والدعم الفني سريع. دابا عندي حساب ممول وكنربح كل شهر الحمد لله!',
      isArabic: true
    },
    {
      name: 'James Wilson',
      roleKey: 'funded',
      avatar: 'JW',
      rating: 5,
      text: 'Been trading for 3 years but always struggled with risk management. The AI alerts here literally saved my account multiple times. Passed my challenge on the second try and now trading a $50k funded account. Couldn\'t be happier!'
    },
    {
      name: 'Emily Chen',
      roleKey: 'beginner',
      avatar: 'EC',
      rating: 5,
      text: 'I was super skeptical at first tbh, but gave it a shot anyway. The masterclasses are actually useful (not like those youtube gurus lol). Started with the Starter plan, learned the basics, and just passed my first challenge last week!'
    }
  ]

  const traderRoles = {
    professional: t('landing.testimonials.roles.professional', 'Professional Trader'),
    funded: t('landing.testimonials.roles.funded', 'Funded Trader'),
    beginner: t('landing.testimonials.roles.beginner', 'Beginner Trader')
  }

  const faqs = [
    {
      question: t('landing.faqSection.q1'),
      answer: t('landing.faqSection.a1')
    },
    {
      question: t('landing.faqSection.q2'),
      answer: t('landing.faqSection.a2')
    },
    {
      question: t('landing.faqSection.q3'),
      answer: t('landing.faqSection.a3')
    },
    {
      question: t('landing.faqSection.q4'),
      answer: t('landing.faqSection.a4')
    },
    {
      question: t('landing.faqSection.q5'),
      answer: t('landing.faqSection.a5')
    }
  ]

  const benefits = [
    { icon: Sparkles, text: t('landing.benefits.aiSignals') },
    { icon: Globe, text: t('landing.benefits.marketData') },
    { icon: GraduationCap, text: t('landing.benefits.masterclass') },
    { icon: Users, text: t('landing.benefits.community') },
    { icon: Headphones, text: t('landing.benefits.support') },
    { icon: Lock, text: t('landing.benefits.secure') }
  ]

  const partners = [
    { name: 'NASDAQ', color: 'text-blue-400' },
    { name: 'NYSE', color: 'text-blue-500' },
    { name: 'CRYPTO', color: 'text-orange-400' },
    { name: 'BVC', color: 'text-green-400' }
  ]

  // AI Assistant State
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [voices, setVoices] = useState([])
  const [isMuted, setIsMuted] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [showChatInput, setShowChatInput] = useState(false)

  // Preload voices on mount (fixes voice glitch)
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      if (availableVoices.length > 0) {
        setVoices(availableVoices)
      }
    }

    // Load immediately if available
    loadVoices()

    // Also listen for voiceschanged event (required for Chrome)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  // Get the current language from i18n
  const { i18n } = useTranslation()
  const currentLang = i18n.language || 'fr'

  // Map language codes to speech synthesis language codes
  const getLangCode = () => {
    switch (currentLang) {
      case 'ar': return 'ar-SA'
      case 'en': return 'en-US'
      case 'fr':
      default: return 'fr-FR'
    }
  }

  // Get the best voice for current language
  const getBestVoice = (langOverride = null) => {
    const lang = langOverride || getLangCode()
    const langPrefix = lang.split('-')[0]

    // Priority voices by language
    const voicePreferences = {
      'fr': ['Google français', 'Microsoft Denise', 'Amelie', 'Sophie', 'Virginie'],
      'en': ['Google US English', 'Microsoft Zira', 'Samantha', 'Karen', 'Victoria'],
      'ar': ['Google العربية', 'Microsoft Naayf', 'Maged', 'Tarik']
    }

    const preferred = voicePreferences[langPrefix] || voicePreferences['fr']
    for (const name of preferred) {
      const voice = voices.find(v => v.name.includes(name))
      if (voice) return voice
    }
    // Fallback to any voice matching the language
    return voices.find(v => v.lang.includes(langPrefix))
  }

  // Get greeting based on language
  const getGreeting = () => {
    switch (currentLang) {
      case 'ar': return 'مرحبا، أنا تريد سينس. كيف يمكنني مساعدتك؟'
      case 'en': return 'Hello, I am TradeSense AI. How can I help you?'
      case 'fr':
      default: return 'Bonjour, je suis TradeSense AI. Comment puis-je vous aider?'
    }
  }

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false)
      setIsProcessing(false)
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    } else {
      if (!hasGreeted) {
        // PLAY GREETING FIRST
        setIsListening(true)
        const greeting = getGreeting()
        setAiResponse(greeting)

        if ('speechSynthesis' in window && !isMuted) {
          // Cancel any ongoing speech first
          window.speechSynthesis.cancel()

          const utterance = new SpeechSynthesisUtterance(greeting)
          utterance.lang = getLangCode()
          utterance.rate = 1.25  // Comfortable fast speech
          utterance.pitch = 1.1  // Slightly higher pitch for female voice
          utterance.volume = 1.0

          const selectedVoice = getBestVoice()
          if (selectedVoice) {
            utterance.voice = selectedVoice
          }

          // Safety timeout in case onend is never fired
          const safetyTimeout = setTimeout(() => {
            if (!hasGreeted) {
              setHasGreeted(true)
              startRecognition()
            }
          }, 4000)

          utterance.onend = () => {
            clearTimeout(safetyTimeout)
            setHasGreeted(true)
            startRecognition() // Start listening AFTER greeting finishes
          }

          utterance.onerror = (e) => {
            console.error('Speech error:', e)
            clearTimeout(safetyTimeout)
            setHasGreeted(true)
            startRecognition()
          }

          // Small delay to ensure voices are ready
          setTimeout(() => {
            window.speechSynthesis.speak(utterance)
          }, 100)
        } else {
          // No TTS support or muted, just start listening
          setHasGreeted(true)
          startRecognition()
        }
      } else {
        // ALREADY GREETED, JUST LISTEN
        setIsListening(true)
        startRecognition()
      }
    }
  }

  const startRecognition = () => {
    setIsListening(true)
    setTranscript('')
    setAiResponse('')

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      // Support multiple languages - let browser auto-detect or use page language
      recognition.lang = getLangCode()
      recognition.continuous = false

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = async (event) => {
        const text = event.results[0][0].transcript
        setTranscript(text)
        setIsListening(false)
        setIsProcessing(true)

        try {
          // CALL BACKEND
          const response = await fetch(`${API_URL}/ai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: text }),
          })

          const data = await response.json()
          setIsProcessing(false)

          if (data.response) {
            setAiResponse(data.response)
            speak(data.response)
          } else {
            setAiResponse("Désolé, je n'ai pas reçu de réponse du cerveau IA.")
            speak("Désolé, je n'ai pas reçu de réponse du cerveau IA.")
          }
        } catch (error) {
          console.error('AI Error:', error)
          setIsProcessing(false)
          setAiResponse(`Erreur technique: ${error.message}. Vérifiez la console (F12) pour plus de détails.`)
          speak("Une erreur de connexion est survenue.")
        }
      }

      recognition.onerror = (e) => {
        console.error("Speech error", e)
        setIsListening(false)
      }

      recognition.start()
    } else {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.")
    }
  }

  // Detect language from text (simple detection)
  const detectLanguage = (text) => {
    // Arabic characters (including Darija written in Arabic script)
    if (/[\u0600-\u06FF]/.test(text)) return 'ar-SA'
    // Darija in Latin script (common words)
    if (/\b(wach|kifach|chhal|bghit|3endna|dyal|howa|kayn|merhba|n9der|l9it)\b/i.test(text)) return 'ar-MA'
    // Check for common English words
    if (/\b(the|is|are|you|how|what|can|help|hello|hi|yes|no|our|we|offer)\b/i.test(text)) return 'en-US'
    // Default to French
    return 'fr-FR'
  }

  // Check if text is Arabic (standard or Darija)
  const isArabic = (text) => {
    // Arabic script
    if (/[\u0600-\u06FF]/.test(text)) return true
    // Darija in Latin script
    if (/\b(wach|kifach|chhal|bghit|3endna|dyal|howa|kayn|merhba|n9der|l9it|tal|ghir)\b/i.test(text)) return true
    return false
  }

  const speak = (text) => {
    // Don't speak if muted
    if (isMuted) return

    // Don't speak Arabic - only show text
    if (isArabic(text)) {
      console.log('Arabic detected - text only mode')
      return
    }

    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech first to prevent overlap/glitches
      window.speechSynthesis.cancel()

      // Detect the language of the response (only FR or EN now)
      const detectedLang = detectLanguage(text)

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = detectedLang
      utterance.rate = 1.25  // Comfortable fast speech
      utterance.pitch = 1.1  // Slightly higher for female voice
      utterance.volume = 1.0

      const selectedVoice = getBestVoice(detectedLang)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e)
      }

      // Small delay to ensure speech synthesis is ready
      setTimeout(() => {
        window.speechSynthesis.speak(utterance)
      }, 50)
    }
  }

  // Send text message to AI
  const sendTextMessage = async () => {
    if (!chatInput.trim()) return

    const message = chatInput.trim()
    setTranscript(message)
    setChatInput('')
    setIsProcessing(true)

    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      const data = await response.json()
      setIsProcessing(false)

      if (data.response) {
        setAiResponse(data.response)
        speak(data.response)
      } else {
        setAiResponse("Désolé, je n'ai pas reçu de réponse.")
      }
    } catch (error) {
      console.error('AI Error:', error)
      setIsProcessing(false)
      setAiResponse("Erreur de connexion. Veuillez réessayer.")
    }
  }

  // Handle Enter key in chat input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendTextMessage()
    }
  }

  // Toggle mute and stop current speech
  const toggleMute = () => {
    if (!isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsMuted(!isMuted)
  }

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section - Full Panoramic Background */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-x-hidden"
      >
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0 animated-gradient-bg">
          {/* Primary Background Image */}
          <img
            src="/images/hero-bg-panoramic.png"
            alt="Pro Trading Desk"
            className="w-full h-full object-cover opacity-60"
          />

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark-400/90 via-dark-400/70 to-dark-400" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-400 via-transparent to-transparent" />

          {/* Animated Glow Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[200px]" />

          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

          {/* Floating Particles - Reduced for performance */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[10, 25, 40, 55, 70, 85].map((left, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-primary-500/30 rounded-full animate-float"
                style={{
                  left: `${left}%`,
                  top: `${20 + (i * 12)}%`,
                  animationDelay: `${i * 0.8}s`,
                  animationDuration: `${6 + i}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className={`relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left pt-24 sm:pt-28">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full glass-card mb-6 sm:mb-8 animate-float hover:scale-105 transition-transform cursor-default">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <Sparkles className="text-primary-400" size={12} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-primary-400">{t('landing.hero.poweredByAI')}</span>
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-primary-500"></span>
                </span>
              </div>

              {/* Title with Gradient Animation */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-4 sm:mb-6 leading-tight">
                <span className="block">{t('landing.hero.becomeTrader')}</span>
                <span className="gradient-text-animated block">
                  <TypingText
                    texts={t('landing.hero.typingTexts', { returnObjects: true }) || ['Rentable', 'Pro', 'Expert']}
                  />
                </span>
                <span className="text-glow block mt-1 sm:mt-2 text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl">{t('landing.hero.withAI')}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-lg md:text-xl text-gray-300 mx-auto lg:mx-0 mb-8 sm:mb-10 leading-relaxed max-w-[90%] sm:max-w-lg md:max-w-2xl">
                {t('landing.hero.description')}{' '}
                <span className="text-primary-400 font-semibold">$200,000</span> {t('landing.hero.capital')}{' '}
                <span className="text-primary-400 font-semibold">80% {t('landing.hero.profits')}</span>.
              </p>

              {/* CTA Buttons with Glow Effects */}
              <div className="flex flex-col items-stretch sm:flex-row sm:items-center sm:justify-center lg:justify-start gap-3 sm:gap-4">
                <Link
                  to="/pricing"
                  className="group relative flex items-center justify-center gap-2 px-5 sm:px-6 md:px-8 py-3.5 sm:py-4 bg-primary-500 hover:bg-primary-400 text-black font-bold rounded-xl text-sm sm:text-base md:text-lg transition-all duration-300 shadow-glow hover:shadow-glow-lg hover:scale-105 pulse-ring overflow-hidden min-h-[48px] touch-manipulation"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {t('landing.hero.cta')}
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                  </span>
                </Link>
                <Link
                  to="/free-trial"
                  className="group flex items-center justify-center gap-2 px-5 sm:px-6 md:px-8 py-3.5 sm:py-4 glass-card hover:bg-white/10 text-white rounded-xl font-semibold text-sm sm:text-base md:text-lg transition-all duration-300 hover:scale-105 spotlight min-h-[48px] touch-manipulation"
                >
                  <Zap className="text-primary-400 group-hover:scale-110 transition-transform" size={18} />
                  {t('landing.hero.freeTrial')}
                </Link>
                <button className="group flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 sm:py-4 glass-card hover:bg-white/10 text-white rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-105 min-h-[48px] touch-manipulation">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                    <Play size={14} fill="white" className="text-white ml-0.5" />
                  </div>
                  {t('landing.hero.demo')}
                </button>
              </div>

              {/* Trustpilot-style Review Badge */}
              <div className="flex items-center justify-center lg:justify-start mt-8 sm:mt-10 overflow-hidden">
                <TrustBadge />
              </div>
            </div>

            {/* Right Content - Horizontal Floating Cards */}
            <div className="hidden lg:flex relative h-full items-center justify-center">
              {/* Main Container for Horizontal Layout */}
              <div className="flex flex-col gap-4 w-full max-w-md">
                {/* Top Row - Two small cards */}
                <div className="flex gap-4">
                  {/* New Traders Card */}
                  <div className="flex-1 glass-card rounded-xl p-4 float-element card-hover-glow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Users className="text-blue-400" size={18} />
                      </div>
                      <div>
                        <p className="text-white text-lg font-bold">+248</p>
                        <p className="text-xs text-gray-400">{t('landing.floatingCards.newTraders')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payout Card */}
                  <div className="flex-1 glass-card rounded-xl p-4 float-element-delayed card-hover-glow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <DollarSign className="text-green-400" size={18} />
                      </div>
                      <div>
                        <p className="text-green-400 text-lg font-bold">$12,450</p>
                        <p className="text-xs text-gray-400">{t('landing.floatingCards.justPaidOut')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Trading Signal Card */}
                <div className="glass-card rounded-2xl p-5 float-element card-hover-glow" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                        <TrendingUp className="text-primary-500" size={22} />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{t('landing.floatingCards.liveAISignal')}</p>
                        <p className="text-xs text-gray-400">{t('landing.floatingCards.justNow')}</p>
                      </div>
                    </div>
                    <span className="px-4 py-1.5 bg-green-500/20 text-green-400 text-sm font-bold rounded-full border border-green-500/30">{t('signals.buy')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">EUR/USD</p>
                      <p className="text-sm text-gray-400">{t('landing.floatingCards.entry')}: 1.0892</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-400">+2.4%</p>
                      <p className="text-xs text-gray-400">{t('landing.floatingCards.target')}: 1.0940</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2.5 bg-dark-200 rounded-full overflow-hidden">
                    <div className="h-full w-[94%] bg-gradient-to-r from-primary-500 to-primary-400 rounded-full animate-pulse" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">{t('landing.floatingCards.aiConfidence')}: 94%</p>
                </div>

                {/* Bottom Row - Stats */}
                <div className="flex gap-4">
                  {/* Win Rate */}
                  <div className="flex-1 glass-card rounded-xl p-4 float-element card-hover-glow" style={{ animationDelay: '1s' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Target className="text-purple-400" size={18} />
                      </div>
                      <div>
                        <p className="text-purple-400 text-lg font-bold">92%</p>
                        <p className="text-xs text-gray-400">{t('landing.floatingCards.winRate')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Active Signals */}
                  <div className="flex-1 glass-card rounded-xl p-4 float-element-delayed card-hover-glow" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Zap className="text-orange-400" size={18} />
                      </div>
                      <div>
                        <p className="text-orange-400 text-lg font-bold">12</p>
                        <p className="text-xs text-gray-400">{t('landing.floatingCards.activeSignals')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Stats - Enhanced with Icons and Gradient Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-10 sm:mt-16 max-w-4xl mx-auto lg:max-w-none px-2 sm:px-0">
            <div className="group relative bg-gradient-to-br from-primary-500/20 to-primary-600/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-primary-500/20 hover:border-primary-500/40 transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                  <Users className="text-primary-400" size={16} />
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  <AnimatedCounter end={10000} suffix="+" />
                </div>
                <div className="text-gray-400 text-xs sm:text-sm mt-1">{t('landing.stats.activeTraders')}</div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                  <DollarSign className="text-blue-400" size={16} />
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  $<AnimatedCounter end={2} suffix="M+" />
                </div>
                <div className="text-gray-400 text-xs sm:text-sm mt-1">{t('landing.stats.capitalDistributed')}</div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-green-500/20 hover:border-green-500/40 transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                  <TrendingUp className="text-green-400" size={16} />
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  <AnimatedCounter end={85} suffix="%" />
                </div>
                <div className="text-gray-400 text-xs sm:text-sm mt-1">{t('landing.stats.successRate')}</div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                  <Award className="text-purple-400" size={16} />
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  <AnimatedCounter end={80} suffix="%" />
                </div>
                <div className="text-gray-400 text-xs sm:text-sm mt-1">{t('landing.stats.profitSplit')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Scroll Indicator - Hidden on mobile */}
        <div className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 scroll-indicator">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll</span>
          <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-primary-500 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Payment Marquee - Trusted By */}
      <PaymentMarquee />

      {/* Markets Section with Flashlight Effect */}
      <section
        className="relative py-24 bg-dark-300 overflow-hidden"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          e.currentTarget.style.setProperty('--x', `${x}px`)
          e.currentTarget.style.setProperty('--y', `${y}px`)
        }}
        style={{ '--x': '50%', '--y': '50%' }}
      >
        {/* Background Layers */}
        <div className="absolute inset-0 z-0">
          {/* Layer 1: Blurred & Darkened (Default) */}
          <div className="absolute inset-0">
            <img
              src="/images/markets-bg-chart.png"
              alt="Markets Technical Chart Background"
              className="w-full h-full object-cover filter blur-[6px] brightness-[0.15]"
            />
          </div>

          {/* Layer 2: Clear & Bright (Revealed by Flashlight) */}
          <div
            className="absolute inset-0 transition-opacity duration-75"
            style={{
              maskImage: 'radial-gradient(circle 300px at var(--x) var(--y), black 0%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle 300px at var(--x) var(--y), black 0%, transparent 70%)'
            }}
          >
            <img
              src="/images/markets-bg-chart.png"
              alt="Markets Revealed"
              className="w-full h-full object-cover brightness-110 saturate-150"
            />
            {/* Fine Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full overflow-hidden">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-primary-500 uppercase tracking-[0.3em] drop-shadow-lg animate-pulse">
              {t('landing.markets.title')}
            </p>
          </div>

          {/* Sliding Marquee - Single Color & Abbreviations */}
          <div className="flex select-none mask-linear-fade">
            <div className="flex animate-marquee whitespace-nowrap items-center">
              {/* Combine items into a seamless list with duplicates for infinite loop */}
              {[
                'AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'GOOGL', 'BTC', 'ETH', 'SOL', 'BNB',
                'IAM', 'ATW', 'BCP', 'ADI', 'EUR/USD', 'XAU/USD',
                'AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'GOOGL', 'BTC', 'ETH', 'SOL', 'BNB',
                'IAM', 'ATW', 'BCP', 'ADI', 'EUR/USD', 'XAU/USD'
              ].map((ticker, i) => (
                <span
                  key={i}
                  className="text-3xl md:text-5xl font-black text-gray-500 mx-6 md:mx-10 transition-transform duration-300 hover:scale-110 hover:text-white cursor-default"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {ticker}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section
        ref={featuresRef}
        className="py-24 bg-dark-300 relative overflow-hidden"
      >
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-full text-sm font-medium mb-6 border border-primary-500/20">
              <Sparkles size={14} />
              {t('landing.features.badge')}
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-4">
              {t('landing.features.title')} <span className="gradient-text-animated">{t('landing.features.titleHighlight')}</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className={`group p-3 sm:p-6 glass-card-dark rounded-xl sm:rounded-2xl hover:bg-dark-200/80 transition-all duration-500 hover:-translate-y-2 card-hover-glow spotlight ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 ${feature.bg} rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon className={feature.color} size={18} />
                  </div>
                  <h3 className="text-sm sm:text-xl font-semibold text-white mb-1 sm:mb-3 group-hover:text-primary-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-base text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-300 to-dark-200" />
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full mb-6 border border-green-500/20">
                  <Shield className="text-green-500" size={20} />
                  <span className="text-green-400 text-sm font-semibold">{t('landing.guarantee.badge')}</span>
                </div>

                <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-6">
                  {t('landing.guarantee.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">{t('landing.guarantee.titleHighlight')}</span>
                </h2>

                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                  {t('landing.guarantee.description')} <span className="text-white font-bold">$1,000</span> {t('landing.guarantee.penalty')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-dark-300/50 flex items-center justify-center border border-white/5">
                      <Zap className="text-yellow-400" size={24} />
                    </div>
                    <div>
                      <p className="text-white font-bold">{t('landing.guarantee.avgTime')}</p>
                      <p className="text-gray-400 text-sm">{t('landing.guarantee.avgTimeLabel')}</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-12 bg-white/10" />

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-dark-300/50 flex items-center justify-center border border-white/5">
                      <Shield className="text-primary-500" size={24} />
                    </div>
                    <div>
                      <p className="text-white font-bold">{t('landing.guarantee.secure')}</p>
                      <p className="text-gray-400 text-sm">{t('landing.guarantee.secureLabel')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="relative z-10 bg-dark-200/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="text-green-500" size={20} />
                      </div>
                      <div>
                        <p className="text-white font-bold">{t('landing.guarantee.paymentApproved')}</p>
                        <p className="text-green-500 text-sm">{t('landing.guarantee.minutesAgo')}</p>
                      </div>
                    </div>
                    <span className="text-white font-mono font-bold">$12,450.00</span>
                  </div>

                  <div className="space-y-3">
                    <div className="h-2 bg-dark-100 rounded-full w-full overflow-hidden">
                      <div className="h-full bg-green-500 w-full animate-pulse" />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{t('landing.guarantee.processing')}</span>
                      <span>{t('landing.guarantee.completed')}</span>
                    </div>
                  </div>
                </div>

                {/* Background decorative elements */}
                <div className="absolute -top-6 -right-6 z-0 w-24 h-24 bg-purple-500/30 rounded-full blur-2xl" />
                <div className="absolute -bottom-6 -left-6 z-0 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      < section
        ref={stepsRef}
        className="py-20 bg-white dark:bg-dark-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="inline-block px-4 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm font-medium mb-4">
              {t('landing.steps.badge')}
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('landing.steps.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon || Target
              return (
                <div
                  key={index}
                  className={`relative transition-all duration-700 ${stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-500 to-primary-500/20" />
                  )}

                  <div className="relative text-center">
                    {/* Step Number with Icon */}
                    <div className="relative inline-block">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25 mb-4">
                        <Icon size={32} />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-dark-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-500 shadow-lg">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section >

      {/* Pricing Section */}
      < section
        ref={pricingRef}
        className="py-20 bg-gray-50 dark:bg-dark-300 relative overflow-hidden"
      >
        {/* Background Effects */}
        < div className="absolute inset-0" >
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div >

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-700 ${pricingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full mb-4">
              <Brain className="text-purple-400" size={18} />
              <span className="text-purple-400 text-sm font-medium">{t('landing.pricingSection.badge')}</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('landing.pricingSection.title')} <span className="text-primary-500">{t('landing.pricingSection.titleHighlight')}</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('landing.pricingSection.subtitle')}
            </p>
          </div>

          {/* Mobile: Slide indicators */}
          <div className="flex sm:hidden items-center justify-center gap-2 mb-3">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.balance}
                className={`w-2 h-2 rounded-full transition-all ${
                  plan.isBestValue ? 'bg-orange-500 w-4' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Swipe hint for mobile */}
          <div className="flex sm:hidden items-center justify-center gap-2 mb-4 text-gray-500 text-xs">
            <span>←</span>
            <span>{t('landing.pricingSection.swipeHint')}</span>
            <span>→</span>
          </div>

          {/* Pricing Cards - Full-width slides on mobile */}
          <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-4 sm:pb-0 scrollbar-hide">
            {PRICING_PLANS.map((plan, index) => {
              const aiTier = AI_TIERS[plan.aiTier]
              const AiIcon = aiTier.icon
              const hasDiscount = plan.salePrice !== null

              return (
                <div
                  key={plan.balance}
                  className={`flex-shrink-0 w-full sm:w-auto snap-center px-4 sm:px-0 ${pricingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{ minWidth: '100%', transitionDelay: `${index * 100}ms` }}
                >
                  <div className={`relative bg-white dark:bg-dark-100 rounded-2xl overflow-hidden transition-all duration-500 sm:hover:scale-105 sm:hover:-translate-y-2 hover:shadow-2xl cursor-pointer mx-auto max-w-xs sm:max-w-none ${
                    plan.isBestValue ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/20' : 'sm:hover:ring-2 sm:hover:ring-primary-500/50'
                  }`}>
                  {/* Best Value Badge */}
                  {plan.isBestValue && (
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Flame size={12} />
                        <span>{t('landing.pricingSection.bestValue')}</span>
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    {/* Account Size */}
                    <div className="text-center mb-4">
                      <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">{t('landing.pricingSection.account')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${plan.balance.toLocaleString('fr-FR')}
                      </p>
                    </div>

                    {/* AI Tier */}
                    <div className="flex flex-col items-center gap-2 mb-4 py-3 bg-gray-50 dark:bg-dark-200 rounded-xl">
                      <div className={`p-2 rounded-lg ${aiTier.bgColor}`}>
                        <AiIcon size={20} className={aiTier.color} />
                      </div>
                      <span className={`text-sm font-bold ${aiTier.color}`}>{aiTier.name}</span>
                      <div className="flex items-center gap-1">
                        <Target size={12} className="text-green-500" />
                        <span className="text-green-500 text-sm font-semibold">{aiTier.accuracy}</span>
                      </div>
                    </div>

                    {/* Signals */}
                    <div className="text-center mb-4">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{t('landing.pricingSection.signalsPerDay')}</p>
                      <p className="text-gray-900 dark:text-white font-semibold">{plan.signals}</p>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-4">
                      {hasDiscount ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1">
                            <Flame size={14} className="text-orange-500" />
                            <span className="text-2xl font-bold text-orange-500">€{plan.salePrice}</span>
                          </div>
                          <span className="text-gray-400 line-through text-sm">€{plan.price}</span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">€{plan.price}</span>
                      )}
                    </div>

                    {/* CTA */}
                    <Link
                      to="/pricing"
                      className={`w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-all duration-300 flex items-center justify-center gap-1 hover:scale-105 active:scale-95 min-h-[44px] touch-manipulation ${plan.isBestValue
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg hover:shadow-orange-500/30'
                        : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:shadow-lg hover:shadow-primary-500/30'
                        }`}
                    >
                      <Rocket size={14} />
                      {t('landing.pricingSection.start')}
                    </Link>
                  </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* View All Plans Button */}
          <div className={`text-center mt-10 transition-all duration-700 ${pricingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '500ms' }}>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-dark-100 text-gray-900 dark:text-white rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-lg border border-gray-200 dark:border-dark-200"
            >
              {t('landing.pricingSection.viewDetails')}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section >

      {/* Testimonials Section */}
      < section
        ref={testimonialsRef}
        className="py-20 bg-white dark:bg-dark-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="inline-block px-4 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm font-medium mb-4">
              {t('landing.testimonials.badge')}
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('landing.testimonials.title')}
            </h2>
          </div>

          <div dir="ltr" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`p-6 bg-white dark:bg-dark-100 rounded-2xl shadow-lg transition-all duration-700 hover:-translate-y-2 hover:shadow-xl flex flex-col ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Quote className="text-primary-500/20 mb-4" size={40} />
                <p
                  dir={testimonial.isArabic ? 'rtl' : 'ltr'}
                  className={`text-gray-600 dark:text-gray-400 mb-6 leading-relaxed flex-1 ${testimonial.isArabic ? 'font-arabic' : ''}`}
                >
                  "{testimonial.text}"
                </p>
                <div dir="ltr" className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">{traderRoles[testimonial.roleKey]}</div>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={14} className="text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Voice Assistant Section - Matched to User Reference */}
      <section className="py-24 relative overflow-hidden bg-[#0A0E2E]">
        {/* Deep Blue Background Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0A0E2E] to-[#0A0E2E]" />

        {/* Top Wave */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none rotate-180">
          <svg className="relative block w-[calc(100%+1.3px)] h-[80px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="#f3f4f6" opacity=".3" className="dark:fill-[#111827]"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" fill="#f3f4f6" opacity=".5" className="dark:fill-[#111827]"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="#f3f4f6" className="dark:fill-[#111827]"></path>
          </svg>
        </div>

        {/* Central Audio Wave Visuals */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Animated wave layers */}
          <div className="absolute w-[120%] h-[300px] opacity-30">
            <svg className="w-full h-full animate-wave-flow" viewBox="0 0 1440 200" preserveAspectRatio="none">
              <path d="M0,100 C320,150 420,50 720,100 C1020,150 1120,50 1440,100 V200 H0 Z" fill="url(#waveGrad1)" />
              <defs>
                <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="absolute w-[120%] h-[300px] opacity-20">
            <svg className="w-full h-full animate-wave-flow-reverse" viewBox="0 0 1440 200" preserveAspectRatio="none">
              <path d="M0,120 C360,70 540,170 900,120 C1260,70 1320,170 1440,120 V200 H0 Z" fill="url(#waveGrad2)" />
              <defs>
                <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="absolute w-[120%] h-[300px] opacity-15">
            <svg className="w-full h-full animate-wave-flow-slow" viewBox="0 0 1440 200" preserveAspectRatio="none">
              <path d="M0,80 C240,130 480,30 720,80 C960,130 1200,30 1440,80 V200 H0 Z" fill="url(#waveGrad3)" />
              <defs>
                <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#93C5FD" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-[calc(100%+1.3px)] h-[80px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" fill="#6366f1" opacity=".2"></path>
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z" fill="#3B82F6" opacity=".15"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V120H0Z" fill="#60A5FA" opacity=".1"></path>
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* Buttons Container */}
          <div className="relative flex justify-center items-center gap-6 mb-8">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isMuted
                ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                }`}
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Microphone Button */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Ripple Rings */}
              <div className={`absolute inset-0 border border-white/10 rounded-full ${isListening ? 'animate-ping' : ''}`} />
              <div className={`absolute -inset-4 border border-white/5 rounded-full ${isListening ? 'animate-ping animation-delay-500' : ''}`} />

              {/* Main Button */}
              <button
                onClick={toggleListening}
                className="relative z-20 w-20 h-20 rounded-full bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 transition-all duration-300 group"
              >
                {isListening ? (
                  <div className="flex gap-1 h-6 items-center">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-1 bg-white rounded-full animate-wave" style={{ animationDelay: `${i * 0.1}s`, height: '100%' }} />
                    ))}
                  </div>
                ) : (
                  <div className="relative w-8 h-8">
                    {/* Microphone Icon */}
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </div>
                )}
              </button>
            </div>

            {/* Chat Toggle Button */}
            <button
              onClick={() => setShowChatInput(!showChatInput)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${showChatInput
                ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                }`}
              title="Écrire un message"
            >
              <MessageCircle size={20} />
            </button>
          </div>

          <h2 className="text-xl md:text-2xl lg:text-3xl font-medium text-white mb-4 px-4">
            {t('landing.aiAssistant.title')} <span className="font-bold">{t('landing.aiAssistant.titleHighlight')}</span>
          </h2>

          <p className="text-gray-400 text-sm mb-6 flex items-center justify-center gap-2">
            {isMuted && <span className="text-red-400">({t('landing.aiAssistant.soundOff')})</span>}
            {t('landing.aiAssistant.subtitle')}
          </p>

          {/* Text Chat Input */}
          {showChatInput && (
            <div className="max-w-xl mx-auto mb-6">
              <div className="flex gap-2 bg-[#1E293B]/80 backdrop-blur-md rounded-xl border border-white/10 p-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('landing.aiAssistant.typeHere')}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-2 outline-none"
                  disabled={isProcessing}
                />
                <button
                  onClick={sendTextMessage}
                  disabled={isProcessing || !chatInput.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}

          {/* AI Response Card */}
          <div className={`transition-all duration-500 ease-out ${transcript || aiResponse ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
            <div className="bg-[#1E293B]/80 backdrop-blur-md rounded-2xl border border-white/10 p-6 max-w-2xl mx-auto shadow-2xl">
              {transcript && (
                <div className="text-left mb-4">
                  <p className="text-sm text-gray-500 mb-1">{t('landing.aiAssistant.youSaid')}</p>
                  <p className="text-white text-lg">"{transcript}"</p>
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-400">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-200" />
                  <span className="text-sm ml-2">{t('landing.aiAssistant.analyzing')}</span>
                </div>
              )}

              {aiResponse && !isProcessing && (
                <div className="text-left bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Brain size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-gray-200 leading-relaxed">{aiResponse}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 relative overflow-hidden" >
        {/* Background Pattern */}
        < div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 md:mb-8">
                {t('landing.benefits.title')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <div key={index} className="flex items-start gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="text-white" size={20} />
                      </div>
                      <span className="text-white/90">{benefit.text}</span>
                    </div>
                  )
                })}
              </div>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 mt-6 md:mt-8 w-full sm:w-auto px-6 md:px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold text-base md:text-lg hover:bg-gray-100 transition-all hover:scale-105"
              >
                {t('landing.benefits.createAccount')}
                <ChevronRight size={20} />
              </Link>
            </div>

            <div className="relative">
              {/* Dashboard Preview */}
              <div className="bg-dark-200 rounded-2xl p-4 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="bg-dark-300 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="text-xs text-gray-500">TradeSense Dashboard</div>
                  </div>
                  <div className="h-48 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <LineChart className="text-primary-500" size={64} />
                    {/* Animated line */}
                    <div className="absolute bottom-4 left-4 right-4 h-20">
                      <svg className="w-full h-full" viewBox="0 0 200 50">
                        <path
                          d="M0,40 L20,35 L40,38 L60,25 L80,30 L100,20 L120,25 L140,15 L160,18 L180,10 L200,5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-primary-500"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Balance</div>
                      <div className="text-white font-semibold">$52,340</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Profit</div>
                      <div className="text-green-500 font-semibold">+$4,560</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Win Rate</div>
                      <div className="text-primary-500 font-semibold">78%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* FAQ Section */}
      < section className="py-20 bg-white dark:bg-dark-200" >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-purple-500/10 text-purple-500 rounded-full text-sm font-medium mb-4">
              {t('landing.faqSection.badge')}
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('landing.faqSection.title')}
            </h2>
          </div>

          <div className="bg-gray-50 dark:bg-dark-100 rounded-2xl p-6">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onClick={() => setOpenFAQ(openFAQ === index ? -1 : index)}
              />
            ))}
          </div>
        </div>
      </section >

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-300 via-dark-400 to-dark-400">
          {/* Glow Effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-500/10 rounded-full blur-[150px]" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

          {/* Floating Particles - Reduced for performance */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[15, 35, 55, 75].map((left, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-primary-500/20 rounded-full animate-float"
                style={{
                  left: `${left}%`,
                  top: `${25 + (i * 15)}%`,
                  animationDelay: `${i * 1.2}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge with Pulse */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card mb-8 animate-pulse-green">
            <Zap className="text-primary-400" size={18} />
            <span className="text-sm font-semibold text-primary-400">{t('landing.finalCta.badge')}</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {t('landing.finalCta.title')}{' '}
            <span className="gradient-text-animated">{t('landing.finalCta.titleHighlight')}</span>
          </h2>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            {t('landing.finalCta.subtitle')} <span className="text-white font-semibold">{t('landing.finalCta.traderCount')}</span> {t('landing.finalCta.subtitleEnd')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
            <Link
              to="/pricing"
              className="group relative w-full sm:w-auto flex items-center justify-center gap-2 px-8 md:px-10 py-4 md:py-5 bg-primary-500 hover:bg-primary-400 text-black font-bold rounded-xl text-base md:text-lg transition-all duration-300 shadow-glow-lg hover:shadow-glow-xl hover:scale-105 pulse-ring"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t('landing.finalCta.viewChallenges')}
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={22} />
              </span>
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 md:px-10 py-4 md:py-5 glass-card hover:bg-white/10 text-white rounded-xl font-semibold text-base md:text-lg transition-all duration-300 hover:scale-105 spotlight"
            >
              <Users size={20} />
              {t('landing.finalCta.createAccount')}
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-500 flex items-center justify-center gap-2">
            <Lock size={14} />
            {t('landing.finalCta.noCard')}
          </p>

          {/* Trust Icons */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 md:gap-8 opacity-50">
            <div className="flex items-center gap-2 text-gray-400">
              <Shield size={20} />
              <span className="text-sm">{t('landing.finalCta.sslSecured')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle size={20} />
              <span className="text-sm">{t('landing.finalCta.payouts24h')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Globe size={20} />
              <span className="text-sm">{t('landing.finalCta.globalSupport')}</span>
            </div>
          </div>
        </div>
      </section>
    </div >
  )
}

export default LandingPage
