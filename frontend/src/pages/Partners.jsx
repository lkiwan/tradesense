import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import {
  Gift, DollarSign, Users, TrendingUp, ChevronRight,
  CheckCircle2, Copy, Share2, Mail, MessageCircle,
  Twitter, Linkedin, ArrowRight, Zap, Award, Target,
  Sparkles, Crown, Star, Percent
} from 'lucide-react'
import toast from 'react-hot-toast'

const Partners = () => {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const [copied, setCopied] = useState(false)

  // Mock affiliate data (would come from API in real app)
  const affiliateData = {
    referralCode: user?.username ? `${user.username.toUpperCase()}2024` : 'TRADESENSE',
    referralLink: `https://tradesense.com/ref/${user?.username || 'join'}`,
    totalReferrals: 0,
    pendingCommission: 0,
    totalEarned: 0,
    conversionRate: 0
  }

  const tiers = [
    {
      name: 'Starter',
      commission: '10%',
      requirement: '0-10 referrals',
      icon: Users,
      color: 'text-gray-400',
      bg: 'bg-gray-500/20',
      border: 'border-gray-500/20',
      perks: ['Basic dashboard access', 'Standard payout (monthly)', 'Email support']
    },
    {
      name: 'Silver',
      commission: '15%',
      requirement: '11-50 referrals',
      icon: Award,
      color: 'text-slate-300',
      bg: 'bg-slate-400/20',
      border: 'border-slate-400/30',
      perks: ['Everything in Starter', 'Bi-weekly payouts', 'Priority support', 'Marketing materials']
    },
    {
      name: 'Gold',
      commission: '20%',
      requirement: '51-100 referrals',
      icon: Star,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30',
      perks: ['Everything in Silver', 'Weekly payouts', 'Dedicated manager', 'Custom landing pages']
    },
    {
      name: 'Diamond',
      commission: '25%',
      requirement: '100+ referrals',
      icon: Crown,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/20',
      border: 'border-cyan-500/30',
      glow: 'shadow-[0_0_30px_rgba(34,211,238,0.3)]',
      perks: ['Everything in Gold', 'Instant payouts', 'VIP events access', 'Revenue share bonus']
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Sign Up',
      description: 'Create your free affiliate account in seconds. No fees, no commitments.',
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/20'
    },
    {
      number: '02',
      title: 'Share Your Link',
      description: 'Get your unique referral link and share it with your network.',
      icon: Share2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/20'
    },
    {
      number: '03',
      title: 'Earn Commissions',
      description: 'Earn up to 25% commission on every successful referral purchase.',
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-green-500/20'
    }
  ]

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateData.referralLink)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (platform) => {
    const text = "Join TradeSense and become a funded trader! Use my referral link:"
    const url = affiliateData.referralLink

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=Join TradeSense&body=${encodeURIComponent(text + ' ' + url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    }

    window.open(shareUrls[platform], '_blank')
  }

  return (
    <div className="min-h-screen bg-dark-400">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/15 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[200px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-8 animate-float">
              <Gift className="text-green-400" size={18} />
              <span className="text-green-300 text-sm font-medium">Affiliate Program</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Earn Up to{' '}
              <span className="gradient-text-animated">25% Commission</span>
            </h1>
            <p className="text-gray-400 text-xl mb-10 leading-relaxed">
              Join our affiliate program and earn recurring commissions by referring traders to TradeSense.
              No limits on earnings - the more you refer, the more you earn.
            </p>

            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                <Link
                  to="/register"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 md:px-8 py-4 md:py-5 bg-gradient-to-r from-green-500 to-primary-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-primary-600 transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 active:scale-95"
                >
                  <Gift size={22} />
                  Become an Affiliate
                  <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 md:px-8 py-4 md:py-5 glass-card text-white font-semibold rounded-xl hover:border-primary-500/30 transition-all duration-300 hover:scale-105"
                >
                  Already an Affiliate? Login
                </Link>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-8 max-w-xl mx-auto">
                <div className="text-left mb-6">
                  <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <Share2 size={14} />
                    Your Referral Link
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      readOnly
                      value={affiliateData.referralLink}
                      className="flex-1 px-5 py-4 bg-dark-300/50 rounded-xl text-white text-sm border border-white/5 focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`px-5 py-4 rounded-xl font-medium transition-all duration-300 ${copied
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                        : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25'
                        }`}
                    >
                      {copied ? <CheckCircle2 size={22} /> : <Copy size={22} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex-1 p-4 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-xl hover:bg-[#1DA1F2]/20 transition-all duration-300 hover:scale-105"
                  >
                    <Twitter size={22} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="flex-1 p-4 bg-[#0A66C2]/10 text-[#0A66C2] rounded-xl hover:bg-[#0A66C2]/20 transition-all duration-300 hover:scale-105"
                  >
                    <Linkedin size={22} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleShare('telegram')}
                    className="flex-1 p-4 bg-[#0088cc]/10 text-[#0088cc] rounded-xl hover:bg-[#0088cc]/20 transition-all duration-300 hover:scale-105"
                  >
                    <MessageCircle size={22} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="flex-1 p-4 bg-gray-500/10 text-gray-400 rounded-xl hover:bg-gray-500/20 transition-all duration-300 hover:scale-105"
                  >
                    <Mail size={22} className="mx-auto" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section (for logged in users) */}
      {isAuthenticated && (
        <section className="relative py-12">
          <div className="absolute inset-0 bg-gradient-to-b from-dark-400 via-dark-300/50 to-dark-400" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="glass-card p-6 rounded-2xl text-center hover:border-blue-500/30 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {affiliateData.totalReferrals}
                </div>
                <div className="text-sm text-gray-500">Total Referrals</div>
              </div>
              <div className="glass-card p-6 rounded-2xl text-center hover:border-yellow-500/30 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={24} className="text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-yellow-400 mb-1">
                  ${affiliateData.pendingCommission}
                </div>
                <div className="text-sm text-gray-500">Pending Commission</div>
              </div>
              <div className="glass-card p-6 rounded-2xl text-center hover:border-green-500/30 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={24} className="text-green-400" />
                </div>
                <div className="text-3xl font-bold text-green-400 mb-1">
                  ${affiliateData.totalEarned}
                </div>
                <div className="text-sm text-gray-500">Total Earned</div>
              </div>
              <div className="glass-card p-6 rounded-2xl text-center hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Percent size={24} className="text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {affiliateData.conversionRate}%
                </div>
                <div className="text-sm text-gray-500">Conversion Rate</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-blue-400 text-sm font-medium mb-6">
              <Zap size={16} />
              Simple Process
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
              How It <span className="gradient-text-animated">Works</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Start earning in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="relative">
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-20 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent" />
                  )}
                  <div className="group relative glass-card rounded-2xl p-8 text-center transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:border-primary-500/30">
                    <div className={`w-20 h-20 mx-auto mb-6 ${step.bg} rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                      <Icon size={36} className={step.color} />
                    </div>
                    <div className="inline-flex px-3 py-1 bg-primary-500/20 rounded-full text-primary-400 text-sm font-bold mb-4">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-primary-400 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Commission Tiers */}
      <section className="relative py-24 bg-dark-300/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-yellow-400 text-sm font-medium mb-6">
              <Crown size={16} />
              Reward Tiers
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
              Commission <span className="gradient-text-animated">Tiers</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              The more you refer, the higher your commission rate
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, index) => {
              const Icon = tier.icon
              const isDiamond = tier.name === 'Diamond'
              return (
                <div
                  key={index}
                  className={`group relative glass-card p-8 rounded-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${tier.border} ${isDiamond ? tier.glow : ''}`}
                >
                  {isDiamond && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
                      BEST VALUE
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 mx-auto mb-4 ${tier.bg} rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                      <Icon size={32} className={tier.color} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${tier.color}`}>
                      {tier.name}
                    </h3>
                    <div className="text-4xl font-bold text-white mb-2">
                      {tier.commission}
                    </div>
                    <div className="text-sm text-gray-500">
                      {tier.requirement}
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {tier.perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-green-400 text-sm font-medium mb-6">
                <Sparkles size={16} />
                Why Join Us
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6">
                Why Become a <span className="gradient-text-animated">Partner</span>?
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Join our growing network of successful affiliates and unlock unlimited earning potential with industry-leading commission rates.
              </p>

              <div className="space-y-4">
                {[
                  { icon: DollarSign, text: 'Highest commission rates in the industry - up to 25%', color: 'text-green-400', bg: 'bg-green-500/20' },
                  { icon: Zap, text: 'Fast payouts - weekly for Gold, instant for Diamond', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
                  { icon: Target, text: 'Real-time tracking dashboard with detailed analytics', color: 'text-blue-400', bg: 'bg-blue-500/20' },
                  { icon: Award, text: 'Marketing materials and dedicated support team', color: 'text-purple-400', bg: 'bg-purple-500/20' }
                ].map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <div key={index} className="flex items-center gap-4 p-4 glass-card rounded-xl hover:border-white/10 transition-all duration-300">
                      <div className={`w-12 h-12 ${benefit.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon size={24} className={benefit.color} />
                      </div>
                      <span className="text-gray-300">{benefit.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-primary-500/10 to-cyan-500/20 rounded-3xl blur-3xl" />
              <div className="relative glass-card rounded-3xl p-10 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                  <Gift size={48} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Join 5,000+ Affiliates</h3>
                <p className="text-gray-400 mb-6">Earning an average of $2,500/month</p>
                <div className="flex justify-center gap-8 mb-8">
                  <div>
                    <div className="text-3xl font-bold text-green-400">$1.2M+</div>
                    <div className="text-sm text-gray-500">Paid to affiliates</div>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div>
                    <div className="text-3xl font-bold text-primary-400">25%</div>
                    <div className="text-sm text-gray-500">Max commission</div>
                  </div>
                </div>
                <Link
                  to={isAuthenticated ? "/dashboard/referral" : "/register"}
                  className="group inline-flex items-center justify-center gap-2 w-full px-6 md:px-8 py-4 bg-gradient-to-r from-green-500 to-primary-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-primary-600 transition-all duration-300 shadow-lg shadow-green-500/25"
                >
                  {isAuthenticated ? 'View Dashboard' : 'Start Earning Now'}
                  <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-primary-600/20 to-cyan-600/20" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-500/15 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>

        {/* Top Border Glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-8 animate-float">
            <Sparkles className="text-yellow-400 animate-pulse" size={18} />
            <span className="text-white text-sm font-medium">Limited Time - Enhanced Bonuses</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Start Earning <span className="gradient-text-animated">Today</span>
          </h2>

          <p className="text-white/80 mb-10 text-lg max-w-2xl mx-auto leading-relaxed">
            Join thousands of affiliates earning passive income by referring traders to TradeSense.
          </p>

          {/* CTA Button */}
          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-primary-500 rounded-2xl blur opacity-30 animate-pulse" />
            <Link
              to={isAuthenticated ? "/dashboard/referral" : "/register"}
              className="relative group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-white text-dark-400 rounded-2xl font-bold hover:bg-gray-50 transition-all duration-300 shadow-2xl text-base md:text-lg hover:scale-105 hover:shadow-[0_20px_60px_rgba(255,255,255,0.3)] active:scale-95"
            >
              <Gift size={24} className="transition-transform duration-300 group-hover:rotate-12" />
              {isAuthenticated ? 'Go to Dashboard' : "Join Now - It's Free"}
              <ArrowRight size={22} className="transition-transform duration-300 group-hover:translate-x-2" />
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-12 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <CheckCircle2 size={16} className="text-green-400" />
              <span>Free to join</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Zap size={16} className="text-yellow-400" />
              <span>Instant activation</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <DollarSign size={16} className="text-primary-400" />
              <span>No earning limits</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Partners
