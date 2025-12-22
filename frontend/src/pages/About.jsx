import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2, Users, Globe, Target, Shield, Award,
  TrendingUp, Heart, Zap, ArrowRight, CheckCircle2,
  MapPin, Mail, Phone
} from 'lucide-react'

const About = () => {
  const { t } = useTranslation()

  const values = [
    {
      icon: Shield,
      title: 'Transparency',
      description: 'Clear rules, fair evaluation, and honest communication. No hidden fees or surprise conditions.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'We build a supportive community where traders help each other grow and succeed.'
    },
    {
      icon: Target,
      title: 'Excellence',
      description: 'We set high standards for ourselves and our traders, pushing everyone to be their best.'
    },
    {
      icon: Heart,
      title: 'Trader First',
      description: 'Every decision we make is focused on providing the best experience for our traders.'
    }
  ]

  const stats = [
    { value: '500+', label: 'Funded Traders' },
    { value: '$2.5M+', label: 'Payouts Made' },
    { value: '15K+', label: 'Active Users' },
    { value: '24/7', label: 'Support Available' }
  ]

  const team = [
    {
      name: 'Karim Benali',
      role: 'CEO & Founder',
      bio: 'Former institutional trader with 15+ years of experience in forex and commodities.',
      avatar: null
    },
    {
      name: 'Sofia Martinez',
      role: 'Head of Trading',
      bio: 'Risk management expert who previously worked at major investment banks.',
      avatar: null
    },
    {
      name: 'Ahmed Hassan',
      role: 'CTO',
      bio: 'Tech visionary responsible for building our cutting-edge trading platform.',
      avatar: null
    },
    {
      name: 'Marie Dubois',
      role: 'Head of Support',
      bio: 'Dedicated to ensuring every trader receives the help they need, when they need it.',
      avatar: null
    }
  ]

  const milestones = [
    { year: '2022', event: 'TradeSense founded with a mission to democratize prop trading' },
    { year: '2023', event: 'Launched challenge programs and funded first 100 traders' },
    { year: '2024', event: 'Reached $1M in total payouts, expanded to 50+ countries' },
    { year: '2025', event: 'Introduced free trial program and AI trading signals' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-200">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full text-primary-500 text-sm font-medium mb-6">
              <Building2 size={16} />
              About TradeSense
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Empowering Traders to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-blue-500">
                Achieve Their Dreams
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              We believe talented traders shouldn't be held back by lack of capital.
              Our mission is to identify, fund, and support skilled traders worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary-500 mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-400">
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
                  in profits. But we're just getting started. Our goal is to become the world's most
                  trusted prop trading firm.
                </p>
              </div>
              <div className="mt-8">
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
                >
                  Start Your Journey
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-500 to-blue-500 rounded-3xl p-8 text-white">
                <Globe size={64} className="mb-6 opacity-80" />
                <h3 className="text-2xl font-bold mb-4">Global Reach</h3>
                <p className="opacity-90 mb-6">
                  We support traders from around the world, with localized support in French,
                  English, and Arabic.
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">50+</div>
                    <div className="text-sm opacity-80">Countries</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">3</div>
                    <div className="text-sm opacity-80">Languages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">24/7</div>
                    <div className="text-sm opacity-80">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-white dark:bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-primary-500/10 rounded-2xl flex items-center justify-center">
                    <Icon size={28} className="text-primary-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {value.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Journey
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-dark-100 -translate-x-1/2" />
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`relative flex items-center gap-8 ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <div className="inline-block bg-white dark:bg-dark-100 p-6 rounded-2xl shadow-sm">
                      <div className="text-2xl font-bold text-primary-500 mb-2">{milestone.year}</div>
                      <p className="text-gray-600 dark:text-gray-400">{milestone.event}</p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-primary-500 rounded-full border-4 border-white dark:border-dark-200" />
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white dark:bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Experienced professionals dedicated to your trading success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-dark-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-primary-500 text-sm font-medium mb-3">{member.role}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-dark-100 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary-500/10 rounded-xl flex items-center justify-center">
                <MapPin size={24} className="text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Location</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Casablanca, Morocco<br />
                Dubai, UAE
              </p>
            </div>
            <div className="bg-white dark:bg-dark-100 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary-500/10 rounded-xl flex items-center justify-center">
                <Mail size={24} className="text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Email</h3>
              <p className="text-gray-600 dark:text-gray-400">
                support@tradesense.com<br />
                partners@tradesense.com
              </p>
            </div>
            <div className="bg-white dark:bg-dark-100 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary-500/10 rounded-xl flex items-center justify-center">
                <Phone size={24} className="text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Phone</h3>
              <p className="text-gray-600 dark:text-gray-400">
                +212 XXX XXX XXX<br />
                24/7 Live Chat
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Join TradeSense today and take the first step towards becoming a funded trader.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-all"
          >
            <Zap size={20} />
            Start Your Challenge
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default About
