import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Target, TrendingUp, Award, DollarSign, Zap,
  CheckCircle2, ArrowRight, Play, Shield, Clock,
  Percent, Users, ChevronRight
} from 'lucide-react'

const HowItWorks = () => {
  const { t } = useTranslation()

  const steps = [
    {
      number: '01',
      title: 'Choose Your Challenge',
      description: 'Select from our Starter ($5K), Pro ($25K), or Elite ($100K) account sizes. Each comes with specific profit targets and trading rules.',
      icon: Target,
      color: 'primary',
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
      color: 'green',
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
      description: 'Take your time to complete each phase. No pressure, no rushing.'
    },
    {
      icon: Shield,
      title: 'Risk Management',
      description: 'Clear rules to protect capital: 10% max drawdown, 5% daily limit.'
    },
    {
      icon: Percent,
      title: 'Up to 80% Profit Split',
      description: 'Keep the majority of profits you generate as a funded trader.'
    },
    {
      icon: Zap,
      title: 'Fast Payouts',
      description: 'Get your profits within 24 hours of requesting a withdrawal.'
    },
    {
      icon: Users,
      title: 'Community Support',
      description: 'Join our community of traders sharing strategies and insights.'
    },
    {
      icon: DollarSign,
      title: 'Scaling Program',
      description: 'Grow your account size up to $300K based on performance.'
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      primary: 'from-primary-500 to-primary-600 text-primary-500 bg-primary-500/10 border-primary-500/20',
      blue: 'from-blue-500 to-blue-600 text-blue-500 bg-blue-500/10 border-blue-500/20',
      purple: 'from-purple-500 to-purple-600 text-purple-500 bg-purple-500/10 border-purple-500/20',
      green: 'from-green-500 to-green-600 text-green-500 bg-green-500/10 border-green-500/20'
    }
    return colors[color]
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-200">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full text-primary-500 text-sm font-medium mb-6">
              <Play size={16} />
              How It Works
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Your Path to Becoming a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-blue-500">
                Funded Trader
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Follow our simple 4-step process to prove your trading skills and get access to real capital.
              No hidden fees, no tricks - just pure trading.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-blue-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-blue-600 transition-all shadow-lg shadow-primary-500/25"
              >
                <Zap size={20} />
                Start Your Challenge
                <ArrowRight size={20} />
              </Link>
              <Link
                to="/free-trial"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-dark-100 text-gray-900 dark:text-white font-semibold rounded-xl border border-gray-200 dark:border-dark-100 hover:bg-gray-50 dark:hover:bg-dark-50 transition-all"
              >
                Try Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon
              const colorClasses = getColorClasses(step.color)
              const isEven = index % 2 === 0

              return (
                <div
                  key={step.number}
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-16 items-center`}
                >
                  {/* Content */}
                  <div className="flex-1 space-y-6">
                    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${colorClasses.split(' ').slice(2).join(' ')}`}>
                      <span className="text-2xl font-bold">{step.number}</span>
                      <ChevronRight size={20} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                      {step.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                    <ul className="space-y-3">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                          <CheckCircle2 size={20} className={colorClasses.split(' ')[2]} />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual */}
                  <div className="flex-1 w-full max-w-md">
                    <div className={`relative p-8 rounded-3xl bg-gradient-to-br ${colorClasses.split(' ').slice(0, 2).join(' ')} shadow-2xl`}>
                      <div className="absolute inset-0 bg-white/10 rounded-3xl backdrop-blur-sm" />
                      <div className="relative text-white text-center">
                        <Icon size={80} className="mx-auto mb-4 opacity-90" />
                        <div className="text-6xl font-bold mb-2">{step.number}</div>
                        <div className="text-xl font-medium opacity-90">{step.title}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Traders Choose TradeSense
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We've built a platform that puts traders first with fair rules and real opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-gray-50 dark:bg-dark-200 border border-gray-100 dark:border-dark-100 hover:border-primary-500/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                    <Icon size={24} className="text-primary-500" />
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
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-r from-primary-500 to-blue-500 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of traders who have already taken the first step towards becoming funded.
                Your trading career starts here.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-all"
                >
                  View Pricing
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/free-trial"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
                >
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
