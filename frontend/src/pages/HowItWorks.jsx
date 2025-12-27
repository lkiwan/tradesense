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
      title: 'Choose Your Challenge',
      description: 'Select from our Starter ($5K), Pro ($25K), or Elite ($100K) account sizes. Each comes with specific profit targets and trading rules.',
      icon: Target,
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      details: [
        'No time limit to complete',
        'Trade forex, crypto & stocks',
        'Competitive spreads from 0.0 pips'
      ]
    },
    {
      number: '02',
      title: 'Phase 1: Evaluation',
      description: 'Prove your trading skills by reaching a 10% profit target while respecting our risk management rules.',
      icon: TrendingUp,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-600',
      details: [
        '10% profit target',
        '10% max drawdown limit',
        '5% daily loss limit'
      ]
    },
    {
      number: '03',
      title: 'Phase 2: Verification',
      description: 'Confirm your consistency with a 5% profit target. This phase ensures you can replicate your success.',
      icon: CheckCircle2,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600',
      details: [
        '5% profit target',
        'Same risk rules apply',
        'Prove consistency'
      ]
    },
    {
      number: '04',
      title: 'Get Funded',
      description: 'Congratulations! You\'re now a funded trader. Trade with real capital and keep up to 80% of your profits.',
      icon: Award,
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-600',
      details: [
        'Up to 80% profit split',
        'Real capital trading',
        'Monthly payouts'
      ]
    }
  ]

  const features = [
    {
      icon: Clock,
      title: 'No Time Limits',
      description: 'Take your time to complete each phase. No pressure, no rushing.',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Shield,
      title: 'Risk Management',
      description: 'Clear rules to protect capital: 10% max drawdown, 5% daily limit.',
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      icon: Percent,
      title: 'Up to 80% Profit Split',
      description: 'Keep the majority of profits you generate as a funded trader.',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      icon: Zap,
      title: 'Fast Payouts',
      description: 'Get your profits within 24 hours of requesting a withdrawal.',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10'
    },
    {
      icon: Users,
      title: 'Community Support',
      description: 'Join our community of traders sharing strategies and insights.',
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10'
    },
    {
      icon: DollarSign,
      title: 'Scaling Program',
      description: 'Grow your account size up to $300K based on performance.',
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
              <span className="text-sm font-medium text-primary-400">How It Works</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Your Path to Becoming a{' '}
              <span className="gradient-text-animated">
                Funded Trader
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Follow our simple 4-step process to prove your trading skills and get access to real capital.
              No hidden fees, no tricks - just pure trading.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/pricing"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-500 text-black font-bold rounded-xl hover:bg-primary-400 transition-all duration-300 shadow-glow hover:shadow-glow-lg hover:scale-105 pulse-ring"
              >
                <Zap size={20} />
                Start Your Challenge
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/free-trial"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 glass-card text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 spotlight"
              >
                Try Free Trial
              </Link>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 scroll-indicator">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll</span>
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
              The Process
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              4 Simple Steps to <span className="gradient-text-animated">Success</span>
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
                  className={`step-item flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                >
                  {/* Content */}
                  <div className="flex-1 space-y-6">
                    <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full border ${getColorClasses(step.color)}`}>
                      <span className="text-2xl font-bold">{step.number}</span>
                      <ChevronRight size={20} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                      {step.title}
                    </h2>
                    <p className="text-lg text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                    <ul className="space-y-3">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-300">
                          <CheckCircle2 size={20} className={step.color === 'green' ? 'text-green-500' : step.color === 'blue' ? 'text-blue-500' : step.color === 'purple' ? 'text-purple-500' : 'text-yellow-500'} />
                          {detail}
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
                        <div className="text-xl font-semibold">{step.title}</div>
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
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Why Traders Choose <span className="gradient-text-animated">TradeSense</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              We've built a platform that puts traders first with fair rules and real opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
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
                <span className="text-sm font-semibold text-primary-400">Start Today</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to Start Your <span className="gradient-text-animated">Journey?</span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Join thousands of traders who have already taken the first step towards becoming funded.
                Your trading career starts here.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/pricing"
                  className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-primary-500 text-black font-bold rounded-xl hover:bg-primary-400 transition-all duration-300 shadow-glow-lg hover:shadow-glow-xl hover:scale-105 pulse-ring"
                >
                  View Pricing
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/free-trial"
                  className="inline-flex items-center justify-center gap-2 px-10 py-5 glass-card text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  <Play size={20} />
                  Start Free Trial
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
