import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef } from 'react'
import {
  Target, TrendingUp, Award, DollarSign, Zap,
  CheckCircle2, ArrowRight, Play, Shield, Clock,
  Percent, Users, ChevronRight, Sparkles, Star,
  ArrowDown
} from 'lucide-react'

const HowItWorks = () => {
  const { t } = useTranslation()
  const [visibleSteps, setVisibleSteps] = useState([])

  // Intersection observer for step animations
  useEffect(() => {
    const observers = []
    document.querySelectorAll('.step-item').forEach((el, index) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleSteps(prev => [...new Set([...prev, index])])
          }
        },
        { threshold: 0.2 }
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach(obs => obs.disconnect())
  }, [])

  const steps = [
    {
      number: '01',
      titleKey: 'howItWorks.steps.step1.title',
      descKey: 'howItWorks.steps.step1.description',
      icon: Target,
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      detailKeys: [
        'howItWorks.steps.step1.detail1',
        'howItWorks.steps.step1.detail2',
        'howItWorks.steps.step1.detail3'
      ]
    },
    {
      number: '02',
      titleKey: 'howItWorks.steps.step2.title',
      descKey: 'howItWorks.steps.step2.description',
      icon: TrendingUp,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-600',
      detailKeys: [
        'howItWorks.steps.step2.detail1',
        'howItWorks.steps.step2.detail2',
        'howItWorks.steps.step2.detail3'
      ]
    },
    {
      number: '03',
      titleKey: 'howItWorks.steps.step3.title',
      descKey: 'howItWorks.steps.step3.description',
      icon: CheckCircle2,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600',
      detailKeys: [
        'howItWorks.steps.step3.detail1',
        'howItWorks.steps.step3.detail2',
        'howItWorks.steps.step3.detail3'
      ]
    },
    {
      number: '04',
      titleKey: 'howItWorks.steps.step4.title',
      descKey: 'howItWorks.steps.step4.description',
      icon: Award,
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-600',
      detailKeys: [
        'howItWorks.steps.step4.detail1',
        'howItWorks.steps.step4.detail2',
        'howItWorks.steps.step4.detail3'
      ]
    }
  ]

  const features = [
    {
      icon: Clock,
      titleKey: 'howItWorks.features.noTimeLimit.title',
      descKey: 'howItWorks.features.noTimeLimit.description',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Shield,
      titleKey: 'howItWorks.features.riskManagement.title',
      descKey: 'howItWorks.features.riskManagement.description',
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      icon: Percent,
      titleKey: 'howItWorks.features.profitSplit.title',
      descKey: 'howItWorks.features.profitSplit.description',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      icon: Zap,
      titleKey: 'howItWorks.features.fastPayouts.title',
      descKey: 'howItWorks.features.fastPayouts.description',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10'
    },
    {
      icon: Users,
      titleKey: 'howItWorks.features.community.title',
      descKey: 'howItWorks.features.community.description',
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10'
    },
    {
      icon: DollarSign,
      titleKey: 'howItWorks.features.scaling.title',
      descKey: 'howItWorks.features.scaling.description',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    }
  ]

  const getColorClasses = (color) => ({
    green: 'text-green-500 bg-green-500/10 border-green-500/30',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
    yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
  }[color])

  return (
    <div className="min-h-screen bg-dark-400">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-8 animate-float">
              <Play size={18} className="text-primary-500" />
              <span className="text-sm font-medium text-primary-400">{t('howItWorks.badge')}</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {t('howItWorks.heroTitle')}{' '}
              <span className="gradient-text-animated">
                {t('howItWorks.heroTitleHighlight')}
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              {t('howItWorks.heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link
                to="/pricing"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 md:px-8 py-4 bg-primary-500 text-black font-bold rounded-xl hover:bg-primary-400 transition-all duration-300 shadow-glow hover:shadow-glow-lg hover:scale-105 pulse-ring"
              >
                <Zap size={20} />
                {t('howItWorks.startChallenge')}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/free-trial"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 md:px-8 py-4 glass-card text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 spotlight"
              >
                {t('howItWorks.tryFreeTrial')}
              </Link>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 scroll-indicator">
            <span className="text-xs text-gray-500 uppercase tracking-widest">{t('howItWorks.scroll')}</span>
            <ArrowDown size={20} className="text-gray-500 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute right-0 top-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[150px]" />
        <div className="absolute left-0 bottom-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-full text-sm font-medium mb-6 border border-primary-500/20">
              <Sparkles size={14} />
              {t('howItWorks.process.badge')}
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-4">
              {t('howItWorks.process.title')} <span className="gradient-text-animated">{t('howItWorks.process.titleHighlight')}</span>
            </h2>
          </div>

          <div className="space-y-24">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isEven = index % 2 === 0
              const isVisible = visibleSteps.includes(index)

              return (
                <div
                  key={step.number}
                  className={`step-item flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-20 items-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                >
                  {/* Content */}
                  <div className="flex-1 space-y-4 md:space-y-6 text-center lg:text-left">
                    <div className={`inline-flex items-center gap-3 px-4 md:px-5 py-2 md:py-2.5 rounded-full border ${getColorClasses(step.color)}`}>
                      <span className="text-xl md:text-2xl font-bold">{step.number}</span>
                      <ChevronRight size={20} />
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                      {t(step.titleKey)}
                    </h2>
                    <p className="text-lg text-gray-400 leading-relaxed">
                      {t(step.descKey)}
                    </p>
                    <ul className="space-y-3 text-left">
                      {step.detailKeys.map((detailKey, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-300">
                          <CheckCircle2 size={20} className={`flex-shrink-0 ${step.color === 'green' ? 'text-green-500' : step.color === 'blue' ? 'text-blue-500' : step.color === 'purple' ? 'text-purple-500' : 'text-yellow-500'}`} />
                          {t(detailKey)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual Card */}
                  <div className="flex-1 w-full max-w-md">
                    <div className={`relative p-8 rounded-3xl bg-gradient-to-br ${step.gradient} shadow-2xl overflow-hidden group hover:scale-105 transition-transform duration-500`}>
                      {/* Glass overlay */}
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

                      {/* Floating particles */}
                      <div className="absolute inset-0 overflow-hidden">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
                            style={{
                              left: `${20 + i * 15}%`,
                              top: `${20 + (i % 3) * 20}%`,
                              animationDelay: `${i * 0.5}s`,
                            }}
                          />
                        ))}
                      </div>

                      <div className="relative text-white text-center">
                        <Icon size={80} className="mx-auto mb-4 opacity-90 group-hover:scale-110 transition-transform duration-500" />
                        <div className="text-7xl font-bold mb-2 opacity-30">{step.number}</div>
                        <div className="text-xl font-semibold">{t(step.titleKey)}</div>
                      </div>
                    </div>

                    {/* Connector Arrow (except last) */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:flex justify-center mt-8">
                        <ArrowDown size={32} className="text-gray-600 animate-bounce" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-dark-300 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-full text-sm font-medium mb-6 border border-primary-500/20">
              <Star size={14} />
              {t('howItWorks.whyChoose.badge')}
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-4">
              {t('howItWorks.whyChoose.title')} <span className="gradient-text-animated">TradeSense</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {t('howItWorks.whyChoose.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="glass-card-dark rounded-2xl p-6 hover:-translate-y-2 transition-all duration-500 card-hover-glow spotlight group"
                >
                  <div className={`w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon size={28} className={feature.color} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-primary-400 transition-colors">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {t(feature.descKey)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-300 to-dark-400">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-500/10 rounded-full blur-[150px]" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="glass-card rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500/20 rounded-full mb-8">
                <Zap size={18} className="text-primary-400" />
                <span className="text-sm font-semibold text-primary-400">{t('howItWorks.cta.badge')}</span>
              </div>

              <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-6">
                {t('howItWorks.cta.title')} <span className="gradient-text-animated">{t('howItWorks.cta.titleHighlight')}</span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                {t('howItWorks.cta.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                <Link
                  to="/pricing"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 md:px-10 py-4 md:py-5 bg-primary-500 text-black font-bold rounded-xl hover:bg-primary-400 transition-all duration-300 shadow-glow-lg hover:shadow-glow-xl hover:scale-105 pulse-ring"
                >
                  {t('howItWorks.cta.viewPricing')}
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/free-trial"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 md:px-10 py-4 md:py-5 glass-card text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  <Play size={20} />
                  {t('howItWorks.cta.startFreeTrial')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HowItWorks
