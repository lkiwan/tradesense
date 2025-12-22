import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Sparkles, Newspaper, Users, GraduationCap,
  ChevronRight, Play, CheckCircle, TrendingUp,
  Shield, Zap, Globe, ArrowRight, Star, Quote,
  ChevronDown, BarChart3, Target, Award, Clock,
  DollarSign, LineChart, Lock, Headphones,
  Brain, Cpu, Crown, Rocket, Flame, Info
} from 'lucide-react'

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

// Typing animation component
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
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(currentText.slice(0, displayedText.length - 1))
        } else {
          setIsDeleting(false)
          setCurrentTextIndex((prev) => (prev + 1) % texts.length)
        }
      }
    }, isDeleting ? 50 : 100)

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
      icon: Sparkles,
      title: t('landing.features.ai.title'),
      description: t('landing.features.ai.description'),
      color: 'text-primary-500',
      bg: 'bg-primary-500/10'
    },
    {
      icon: Newspaper,
      title: t('landing.features.news.title'),
      description: t('landing.features.news.description'),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Users,
      title: t('landing.features.community.title'),
      description: t('landing.features.community.description'),
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      icon: GraduationCap,
      title: t('landing.features.education.title'),
      description: t('landing.features.education.description'),
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
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
      question: 'Qu\'est-ce que le prop trading?',
      answer: 'Le prop trading (proprietary trading) vous permet de trader avec le capital d\'une societe de trading. Vous passez d\'abord un challenge pour prouver vos competences, puis vous recevez un compte finance et gardez jusqu\'a 80% des profits.'
    },
    {
      question: 'Comment fonctionne le challenge TradeSense?',
      answer: 'Choisissez un plan (Starter, Pro ou Elite), atteignez l\'objectif de profit (8-10%) sans depasser les limites de perte. Une fois reussi, vous recevez un compte finance avec le meme capital.'
    },
    {
      question: 'Quels marches puis-je trader?',
      answer: 'Vous pouvez trader les actions US (Apple, Tesla, Google...), les cryptomonnaies (Bitcoin, Ethereum...) et les actions marocaines (IAM, Attijariwafa Bank...).'
    },
    {
      question: 'Comment fonctionnent les signaux IA?',
      answer: 'Notre IA analyse les donnees de marche en temps reel, les indicateurs techniques et le sentiment pour generer des signaux d\'achat/vente avec un niveau de confiance. Vous recevez aussi des alertes de risque.'
    },
    {
      question: 'Puis-je retirer mes profits?',
      answer: 'Oui! Une fois votre challenge reussi et votre compte finance, vous pouvez retirer vos profits chaque mois. Vous gardez jusqu\'a 80% de vos gains.'
    }
  ]

  const benefits = [
    { icon: Sparkles, text: 'Signaux IA et alertes de risque en temps reel' },
    { icon: Globe, text: 'Donnees de marche reelles (US, Crypto & Maroc)' },
    { icon: GraduationCap, text: 'Masterclass et formation trading incluses' },
    { icon: Users, text: 'Communaute active de traders' },
    { icon: Headphones, text: 'Support 24/7 en francais et arabe' },
    { icon: Lock, text: 'Plateforme securisee et fiable' }
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
        const greeting = "Hi, my name is TradeSense. How can I help you today?"
        setAiResponse(greeting)

        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(greeting)
          utterance.lang = 'en-US'
          utterance.rate = 1.0

          // Try to find a female English voice for the greeting
          const voices = window.speechSynthesis.getVoices()
          const femaleEnglish = voices.find(v => v.lang.includes('en') && (v.name.includes('Female') || v.name.includes('Google')))
          if (femaleEnglish) utterance.voice = femaleEnglish

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
          window.speechSynthesis.speak(utterance)
        } else {
          // No TTS support, just start listening
          setHasGreeted(true)
          startRecognition()
        }
      } else {
        // ALREADY GREETED, JUST LISTEN
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
      recognition.lang = 'fr-FR'
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
          const response = await fetch('http://localhost:5000/api/ai/chat', {
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

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'fr-FR'

      const voices = window.speechSynthesis.getVoices()
      // Prioritize female French voices
      const femaleVoice = voices.find(v =>
        (v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Amelie') || v.name.includes('Sophie'))
        && v.lang.includes('fr')
      )

      if (femaleVoice) {
        utterance.voice = femaleVoice
      }

      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section - Full Panoramic Background */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden"
      >
        {/* Background Image with Blur/Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-bg-panoramic.png"
            alt="Pro Trading Desk"
            className="w-full h-full object-cover"
          />
          {/* Gradient & Blur Overlay - Blurs left side, keeps right side clear */}
          <div className="absolute inset-0 bg-gradient-to-r from-dark-300 via-dark-300/80 to-transparent backdrop-blur-[2px] lg:backdrop-blur-0 lg:via-transparent lg:to-transparent">
            {/* Mobile: darker full overlay. Desktop: Gradient from left (dark+blur) to right (clear) */}
            <div className="absolute inset-0 bg-gradient-to-r from-dark-300/90 via-dark-300/60 to-transparent md:w-[65%] backdrop-blur-sm md:backdrop-filter-none mix-blend-multiply" />
            {/* Actual blur mask for text readability on left */}
            <div className="absolute top-0 bottom-0 left-0 w-full md:w-[60%] bg-dark-300/40 backdrop-blur-md mask-linear-fade" style={{ maskImage: 'linear-gradient(to right, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 50%, transparent 100%)' }} />
          </div>
          {/* Darken overlay for text contrast generally */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left pt-20">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 animate-bounce-slow backdrop-blur-md">
                <Sparkles className="text-primary-500" size={16} />
                <span className="text-sm text-primary-400">Powered by AI</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                Devenez Trader{' '}
                <span className="text-primary-500">
                  <TypingText
                    texts={['Professionnel', 'Finance', 'Rentable', 'Expert']}
                  />
                </span>
                <br />
                avec l'Intelligence Artificielle
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-gray-200 max-w-2xl mx-auto lg:mx-0 mb-10 drop-shadow-md font-medium">
                La premiere plateforme de prop trading au Maroc. Passez votre challenge,
                recevez jusqu'a $200,000 de capital et gardez 80% des profits.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/pricing"
                  className="group flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105"
                >
                  Commencer le Challenge
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
                <Link
                  to="/free-trial"
                  className="group flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-lg transition-all border border-white/20 backdrop-blur-md"
                >
                  <Zap className="group-hover:scale-110 transition-transform" size={20} />
                  Essai Gratuit 7 Jours
                </Link>
                <button className="group flex items-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all border border-white/10 hover:border-white/20 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Play size={14} fill="white" />
                  </div>
                  Demo
                </button>
              </div>

              {/* Trustpilot-style Review Badge */}
              <div className="flex items-center justify-center lg:justify-start mt-8">
                <div className="flex items-center gap-3 px-5 py-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-300">Excellent</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="text-green-500 fill-green-500" />
                      ))}
                    </div>
                  </div>
                  <div className="w-px h-5 bg-white/20" />
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">4.9</span>
                    <span className="text-gray-400 text-sm">sur 2,847 avis</span>
                  </div>
                  <div className="w-px h-5 bg-white/20" />
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-green-500 fill-green-500" />
                    <span className="text-green-500 text-sm font-medium">Trustpilot</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Empty to let image show, but keeping layout for spacing */}
            <div className="hidden lg:block relative h-full">
              {/* Floating elements can be added here if needed, but keeping it clean for the panoramic view as requested */}
            </div>
          </div>


          {/* Stats - Enhanced with Icons and Gradient Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto lg:max-w-none">
            <div className="group relative bg-gradient-to-br from-primary-500/20 to-primary-600/10 backdrop-blur-sm rounded-2xl p-5 border border-primary-500/20 hover:border-primary-500/40 transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center mb-3">
                  <Users className="text-primary-400" size={20} />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white">
                  <AnimatedCounter end={10000} suffix="+" />
                </div>
                <div className="text-gray-400 text-sm mt-1">Traders Actifs</div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-sm rounded-2xl p-5 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3">
                  <DollarSign className="text-blue-400" size={20} />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white">
                  $<AnimatedCounter end={2} suffix="M+" />
                </div>
                <div className="text-gray-400 text-sm mt-1">Capital Distribue</div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-sm rounded-2xl p-5 border border-green-500/20 hover:border-green-500/40 transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center mb-3">
                  <TrendingUp className="text-green-400" size={20} />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white">
                  <AnimatedCounter end={85} suffix="%" />
                </div>
                <div className="text-gray-400 text-sm mt-1">Taux de Reussite</div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-sm rounded-2xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-3">
                  <Award className="text-purple-400" size={20} />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white">
                  <AnimatedCounter end={80} suffix="%" />
                </div>
                <div className="text-gray-400 text-sm mt-1">Profit Split</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="text-gray-500" size={32} />
        </div>
      </section>

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
              Tradez sur les meilleurs marchés
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
      < section
        ref={featuresRef}
        className="py-20 bg-gray-50 dark:bg-dark-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="inline-block px-4 py-1 bg-primary-500/10 text-primary-500 rounded-full text-sm font-medium mb-4">
              Fonctionnalites
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Tout ce qu'il vous faut pour reussir
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Une plateforme complete pour devenir un trader professionnel finance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className={`group p-6 bg-white dark:bg-dark-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className={`w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={feature.color} size={28} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section >

      {/* How It Works Section */}
      < section
        ref={stepsRef}
        className="py-20 bg-white dark:bg-dark-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="inline-block px-4 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm font-medium mb-4">
              Comment ca marche
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              4 etapes pour devenir trader finance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
              <span className="text-purple-400 text-sm font-medium">Propulsé par l'IA</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choisissez Votre <span className="text-primary-500">Challenge</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Plus votre plan est élevé, plus l'IA est puissante et précise. Jusqu'à 96% de précision!
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
            {PRICING_PLANS.map((plan, index) => {
              const aiTier = AI_TIERS[plan.aiTier]
              const AiIcon = aiTier.icon
              const hasDiscount = plan.salePrice !== null

              return (
                <div
                  key={plan.balance}
                  className={`relative bg-white dark:bg-dark-100 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl cursor-pointer ${pricingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    } ${plan.isBestValue ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/20' : 'hover:ring-2 hover:ring-primary-500/50'}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Best Value Badge */}
                  {plan.isBestValue && (
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Flame size={12} />
                        <span>Meilleur choix</span>
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    {/* Account Size */}
                    <div className="text-center mb-4">
                      <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Compte</p>
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
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Signaux/jour</p>
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
                      className={`w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-all duration-300 flex items-center justify-center gap-1 hover:scale-105 active:scale-95 ${plan.isBestValue
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg hover:shadow-orange-500/30'
                        : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:shadow-lg hover:shadow-primary-500/30'
                        }`}
                    >
                      <Rocket size={14} />
                      Commencer
                    </Link>
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
              Voir tous les détails
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
              Temoignages
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ce que disent nos traders
            </h2>
          </div>

          <div dir="ltr" className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

        {/* Central Audio Wave Visuals */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Main animated wave */}
          <div className="w-[800px] h-[300px] opacity-30">
            <svg viewBox="0 0 800 300" className="w-full h-full text-blue-500 fill-current animate-pulse">
              <path d="M0,150 Q100,100 200,150 T400,150 T600,150 T800,150 V300 H0 Z" fill="url(#grad1)" opacity="0.3" />
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: 'transparent', stopOpacity: 0 }} />
                  <stop offset="50%" style={{ stopColor: '#3B82F6', stopOpacity: 0.5 }} />
                  <stop offset="100%" style={{ stopColor: 'transparent', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* Microphone Button Container */}
          <div className="relative flex justify-center mb-8">
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
          </div>

          <h2 className="text-2xl md:text-3xl font-medium text-white mb-4">
            Vous avez encore des questions ? Demandez à <span className="font-bold">TradeSense AI !</span>
          </h2>

          <p className="text-gray-400 text-sm mb-8 flex items-center justify-center gap-2">
            Microphone <div className="w-1 h-4 bg-white/20 rounded-full mx-1" /> pour obtenir des réponses instantanées en Français et 31 autres langues
          </p>

          {/* AI Response Card */}
          <div className={`transition-all duration-500 ease-out ${transcript || aiResponse ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
            <div className="bg-[#1E293B]/80 backdrop-blur-md rounded-2xl border border-white/10 p-6 max-w-2xl mx-auto shadow-2xl">
              {transcript && (
                <div className="text-left mb-4">
                  <p className="text-sm text-gray-500 mb-1">Vous avez dit :</p>
                  <p className="text-white text-lg">"{transcript}"</p>
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-400">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-200" />
                  <span className="text-sm ml-2">Analyse en cours...</span>
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
                Pourquoi choisir TradeSense AI?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all hover:scale-105"
              >
                Creer un Compte Gratuit
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
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Questions frequentes
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
      < section className="py-20 bg-gray-50 dark:bg-dark-300" >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 mb-6">
            <Zap size={16} />
            <span className="text-sm font-medium">Offre Limitee - 20% de reduction</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Pret a commencer votre parcours de trader?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Rejoignez plus de 10,000 traders qui font confiance a TradeSense AI
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/pricing"
              className="group flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:scale-105"
            >
              Voir les Challenges
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-2 px-8 py-4 bg-gray-200 dark:bg-dark-100 hover:bg-gray-300 dark:hover:bg-dark-200 text-gray-900 dark:text-white rounded-xl font-semibold text-lg transition-all"
            >
              Creer un Compte Gratuit
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Pas de carte bancaire requise pour l'inscription
          </p>
        </div>
      </section >
    </div >
  )
}

export default LandingPage
