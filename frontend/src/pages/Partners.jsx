import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import {
  Gift, DollarSign, Users, TrendingUp, ChevronRight,
  CheckCircle2, Copy, Share2, Mail, MessageCircle,
  Twitter, Linkedin, ArrowRight, Zap, Award, Target
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
      color: 'gray',
      perks: ['Basic dashboard access', 'Standard payout (monthly)', 'Email support']
    },
    {
      name: 'Silver',
      commission: '15%',
      requirement: '11-50 referrals',
      color: 'gray',
      perks: ['Everything in Starter', 'Bi-weekly payouts', 'Priority support', 'Marketing materials']
    },
    {
      name: 'Gold',
      commission: '20%',
      requirement: '51-100 referrals',
      color: 'yellow',
      perks: ['Everything in Silver', 'Weekly payouts', 'Dedicated manager', 'Custom landing pages']
    },
    {
      name: 'Diamond',
      commission: '25%',
      requirement: '100+ referrals',
      color: 'blue',
      perks: ['Everything in Gold', 'Instant payouts', 'VIP events access', 'Revenue share bonus']
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Sign Up',
      description: 'Create your free affiliate account in seconds. No fees, no commitments.',
      icon: Users
    },
    {
      number: '02',
      title: 'Share Your Link',
      description: 'Get your unique referral link and share it with your network.',
      icon: Share2
    },
    {
      number: '03',
      title: 'Earn Commissions',
      description: 'Earn up to 25% commission on every successful referral purchase.',
      icon: DollarSign
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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-200">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-green-500/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full text-green-500 text-sm font-medium mb-6">
              <Gift size={16} />
              Affiliate Program
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Earn Up to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-primary-500">
                25% Commission
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Join our affiliate program and earn recurring commissions by referring traders to TradeSense.
              No limits on earnings - the more you refer, the more you earn.
            </p>
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-primary-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-primary-600 transition-all shadow-lg shadow-green-500/25"
                >
                  <Gift size={20} />
                  Become an Affiliate
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-dark-100 text-gray-900 dark:text-white font-semibold rounded-xl border border-gray-200 dark:border-dark-100 hover:bg-gray-50 dark:hover:bg-dark-50 transition-all"
                >
                  Already an Affiliate? Login
                </Link>
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-100 rounded-2xl p-6 max-w-xl mx-auto">
                <div className="text-left mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your Referral Link</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={affiliateData.referralLink}
                      className="flex-1 px-4 py-3 bg-gray-100 dark:bg-dark-200 rounded-lg text-gray-900 dark:text-white text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`px-4 py-3 rounded-lg font-medium transition-colors ${copied
                        ? 'bg-green-500 text-white'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                        }`}
                    >
                      {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex-1 p-3 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-lg hover:bg-[#1DA1F2]/20 transition-colors"
                  >
                    <Twitter size={20} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="flex-1 p-3 bg-[#0A66C2]/10 text-[#0A66C2] rounded-lg hover:bg-[#0A66C2]/20 transition-colors"
                  >
                    <Linkedin size={20} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleShare('telegram')}
                    className="flex-1 p-3 bg-[#0088cc]/10 text-[#0088cc] rounded-lg hover:bg-[#0088cc]/20 transition-colors"
                  >
                    <MessageCircle size={20} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="flex-1 p-3 bg-gray-500/10 text-gray-500 rounded-lg hover:bg-gray-500/20 transition-colors"
                  >
                    <Mail size={20} className="mx-auto" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section (for logged in users) */}
      {isAuthenticated && (
        <section className="py-12 bg-white dark:bg-dark-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-6 bg-gray-50 dark:bg-dark-200 rounded-xl text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {affiliateData.totalReferrals}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Referrals</div>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-dark-200 rounded-xl text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">
                  ${affiliateData.pendingCommission}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Pending Commission</div>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-dark-200 rounded-xl text-center">
                <div className="text-3xl font-bold text-primary-500 mb-1">
                  ${affiliateData.totalEarned}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Earned</div>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-dark-200 rounded-xl text-center">
                <div className="text-3xl font-bold text-blue-500 mb-1">
                  {affiliateData.conversionRate}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Conversion Rate</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Start earning in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="relative">
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-500 to-transparent" />
                  )}
                  <div className="relative bg-white dark:bg-dark-100 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-primary-500 rounded-2xl flex items-center justify-center text-white">
                      <Icon size={28} />
                    </div>
                    <div className="text-sm font-bold text-primary-500 mb-2">{step.number}</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
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
      </section>

      {/* Commission Tiers */}
      <section className="py-20 bg-white dark:bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Commission Tiers
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              The more you refer, the higher your commission rate
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, index) => (
              <div
                key={index}
                className={`relative p-6 rounded-2xl border-2 ${tier.name === 'Diamond'
                  ? 'border-blue-500 bg-blue-500/5'
                  : tier.name === 'Gold'
                    ? 'border-yellow-500 bg-yellow-500/5'
                    : 'border-gray-200 dark:border-dark-100 bg-gray-50 dark:bg-dark-200'
                  }`}
              >
                {tier.name === 'Diamond' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                    BEST VALUE
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${tier.name === 'Diamond' ? 'text-blue-500' :
                    tier.name === 'Gold' ? 'text-yellow-500' :
                      'text-gray-900 dark:text-white'
                    }`}>
                    {tier.name}
                  </h3>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                    {tier.commission}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {tier.requirement}
                  </div>
                </div>
                <ul className="space-y-3">
                  {tier.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-r from-green-500 to-primary-500 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative text-center text-white">
              <Gift size={48} className="mx-auto mb-4 opacity-90" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Start Earning Today
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of affiliates earning passive income by referring traders to TradeSense.
              </p>
              <Link
                to={isAuthenticated ? "/dashboard" : "/register"}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-100 transition-all"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Join Now - It\'s Free'}
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Partners
