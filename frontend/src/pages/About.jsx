import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef } from 'react'
import {
  Building2, Users, Globe, Target, Shield, Award,
  TrendingUp, Heart, Zap, ArrowRight, CheckCircle2,
  MapPin, Mail, Phone, Sparkles, Star, Rocket
} from 'lucide-react'

// Animated Counter Component
const AnimatedCounter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let startTime
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [isVisible, end, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

const About = () => {
  const { t } = useTranslation()
  const [activeTimeline, setActiveTimeline] = useState(0)

  const values = [
    {
      icon: Shield,
      title: 'Transparency',
      description: 'Clear rules, fair evaluation, and honest communication. No hidden fees or surprise conditions.',
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'We build a supportive community where traders help each other grow and succeed.',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Target,
      title: 'Excellence',
      description: 'We set high standards for ourselves and our traders, pushing everyone to be their best.',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      icon: Heart,
      title: 'Trader First',
      description: 'Every decision we make is focused on providing the best experience for our traders.',
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    }
  ]

  const stats = [
    { value: 500, suffix: '+', label: 'Funded Traders', icon: Users },
    { value: 2.5, suffix: 'M+', label: 'Payouts Made', icon: TrendingUp, prefix: '$' },
    { value: 15, suffix: 'K+', label: 'Active Users', icon: Globe },
    { value: 24, suffix: '/7', label: 'Support Available', icon: Zap }
  ]

  const team = [
    {
      name: 'Karim Benali',
      role: 'CEO & Founder',
      bio: 'Former institutional trader with 15+ years of experience in forex and commodities.',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      name: 'Sofia Martinez',
      role: 'Head of Trading',
      bio: 'Risk management expert who previously worked at major investment banks.',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      name: 'Ahmed Hassan',
      role: 'CTO',
      bio: 'Tech visionary responsible for building our cutting-edge trading platform.',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      name: 'Marie Dubois',
      role: 'Head of Support',
      bio: 'Dedicated to ensuring every trader receives the help they need, when they need it.',
      gradient: 'from-orange-500 to-red-600'
    }
  ]

  const milestones = [
    { year: '2022', event: 'TradeSense founded with a mission to democratize prop trading', icon: Rocket },
    { year: '2023', event: 'Launched challenge programs and funded first 100 traders', icon: Award },
    { year: '2024', event: 'Reached $1M in total payouts, expanded to 50+ countries', icon: Globe },
    { year: '2025', event: 'Introduced free trial program and AI trading signals', icon: Sparkles }
  ]

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
              <Building2 size={18} className="text-primary-500" />
              <span className="text-sm font-medium text-primary-400">About TradeSense</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Empowering Traders to{' '}
              <span className="gradient-text-animated">
                Achieve Their Dreams
              </span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              We believe talented traders shouldn't be held back by lack of capital.
              Our mission is to identify, fund, and support skilled traders worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-400 via-dark-300 to-dark-400" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className="glass-card rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300 card-hover-glow"
                >
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary-500/20 rounded-xl flex items-center justify-center">
                    <Icon size={24} className="text-primary-500" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.prefix}<AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[150px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-full text-sm font-medium mb-6 border border-primary-500/20">
                <Sparkles size={14} />
                Our Story
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                From Vision to <span className="text-primary-500">Reality</span>
              </h2>
              <div className="space-y-4 text-gray-400 text-lg leading-relaxed">
                <p>
                  TradeSense was born from a simple observation: many talented traders around the world
                  lack the capital to trade professionally. We set out to change that.
                </p>
                <p>
                  Founded by a team of experienced traders and fintech professionals, we built a platform
                  that gives skilled traders access to significant trading capital without risking their
                  own money.
                </p>
                <p>
                  Today, we've funded hundreds of traders from over 50 countries, paying out millions
                  in profits. But we're just getting started.
                </p>
              </div>
              <div className="mt-8">
                <Link
                  to="/pricing"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-black font-bold rounded-xl hover:bg-primary-400 transition-all duration-300 shadow-glow hover:shadow-glow-lg hover:scale-105"
                >
                  Start Your Journey
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Global Reach Card */}
            <div className="relative">
              <div className="glass-card rounded-3xl p-8 card-hover-glow">
                <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Globe size={32} className="text-primary-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Global Reach</h3>
                <p className="text-gray-400 mb-8">
                  We support traders from around the world, with localized support in French,
                  English, and Arabic.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-card rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-primary-500">50+</div>
                    <div className="text-xs text-gray-500">Countries</div>
                  </div>
                  <div className="glass-card rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-primary-500">3</div>
                    <div className="text-xs text-gray-500">Languages</div>
                  </div>
                  <div className="glass-card rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-primary-500">24/7</div>
                    <div className="text-xs text-gray-500">Support</div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 glass-card rounded-xl p-3 float-element">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-green-500" />
                  </div>
                  <span className="text-sm font-semibold text-white">Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-24 bg-dark-300 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-full text-sm font-medium mb-6 border border-primary-500/20">
              <Heart size={14} />
              Our Values
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              The Principles That <span className="gradient-text-animated">Guide Us</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Everything we do is driven by these core values
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div
                  key={index}
                  className="glass-card-dark rounded-2xl p-6 text-center hover:-translate-y-2 transition-all duration-500 card-hover-glow spotlight group"
                >
                  <div className={`w-16 h-16 mx-auto mb-6 ${value.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon size={28} className={value.color} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-primary-400 transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute left-0 top-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-[150px] -translate-y-1/2" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-full text-sm font-medium mb-6 border border-primary-500/20">
              <Rocket size={14} />
              Our Journey
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Milestones Along the <span className="gradient-text-animated">Way</span>
            </h2>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500/50 via-primary-500/30 to-transparent -translate-x-1/2" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => {
                const Icon = milestone.icon
                return (
                  <div
                    key={index}
                    className={`relative flex items-center gap-8 ${
                      index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    <div className={`flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                      <div className="inline-block glass-card p-6 rounded-2xl hover:scale-105 transition-transform duration-300 card-hover-glow">
                        <div className="flex items-center gap-3 mb-2 justify-end">
                          {index % 2 !== 0 && <Icon size={20} className="text-primary-500" />}
                          <span className="text-2xl font-bold text-primary-500">{milestone.year}</span>
                          {index % 2 === 0 && <Icon size={20} className="text-primary-500" />}
                        </div>
                        <p className="text-gray-400">{milestone.event}</p>
                      </div>
                    </div>

                    {/* Center Dot */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-5 h-5 bg-primary-500 rounded-full border-4 border-dark-400 z-10 shadow-glow" />

                    <div className="flex-1" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-dark-300 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-full text-sm font-medium mb-6 border border-primary-500/20">
              <Users size={14} />
              Our Team
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Meet the <span className="gradient-text-animated">People</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Experienced professionals dedicated to your trading success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div
                key={index}
                className="glass-card-dark rounded-2xl p-6 text-center hover:-translate-y-2 transition-all duration-500 card-hover-glow group"
              >
                <div className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br ${member.gradient} rounded-full flex items-center justify-center text-white text-3xl font-bold group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                  {member.name}
                </h3>
                <p className="text-primary-500 text-sm font-medium mb-3">{member.role}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-8 text-center hover:scale-105 transition-transform duration-300 card-hover-glow">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary-500/20 rounded-xl flex items-center justify-center">
                <MapPin size={24} className="text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Location</h3>
              <p className="text-gray-400">
                Casablanca, Morocco<br />
                Dubai, UAE
              </p>
            </div>
            <div className="glass-card rounded-2xl p-8 text-center hover:scale-105 transition-transform duration-300 card-hover-glow">
              <div className="w-14 h-14 mx-auto mb-4 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Mail size={24} className="text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Email</h3>
              <p className="text-gray-400">
                support@tradesense.com<br />
                partners@tradesense.com
              </p>
            </div>
            <div className="glass-card rounded-2xl p-8 text-center hover:scale-105 transition-transform duration-300 card-hover-glow">
              <div className="w-14 h-14 mx-auto mb-4 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Phone size={24} className="text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Phone</h3>
              <p className="text-gray-400">
                +212 XXX XXX XXX<br />
                24/7 Live Chat
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-400 to-dark-300">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary-500/10 rounded-full blur-[150px]" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-8">
            <Star size={18} className="text-yellow-500" />
            <span className="text-sm font-semibold text-yellow-400">Join 10,000+ Traders</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start <span className="gradient-text-animated">Trading?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join TradeSense today and take the first step towards becoming a funded trader.
          </p>

          <Link
            to="/pricing"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-primary-500 text-black font-bold rounded-xl hover:bg-primary-400 transition-all duration-300 shadow-glow-lg hover:shadow-glow-xl hover:scale-105 pulse-ring"
          >
            <Zap size={22} />
            Start Your Challenge
            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default About
