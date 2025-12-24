import { useState, useEffect } from 'react'
import {
  Users, Copy, Check, Share2, DollarSign, Gift, TrendingUp, Twitter, Facebook,
  Linkedin, Mail, Award, Star, ChevronRight, Wallet, Download, ExternalLink,
  Shield, Zap, Crown
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { CommissionChart, SubAffiliateTree, PayoutHistory } from '../../components/affiliate'
import { showSuccessToast, showErrorToast } from '../../utils/errorHandler'

const ReferralPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [subAffiliates, setSubAffiliates] = useState([])
  const [payouts, setPayouts] = useState([])
  const [payoutSummary, setPayoutSummary] = useState({})

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [dashboardRes, subAffiliatesRes, payoutsRes] = await Promise.all([
        api.get('/affiliates/dashboard'),
        api.get('/affiliates/sub-affiliates'),
        api.get('/affiliates/payouts')
      ])
      setDashboardData(dashboardRes.data)
      setSubAffiliates(subAffiliatesRes.data.sub_affiliates || [])
      setPayouts(payoutsRes.data.payouts || [])
      setPayoutSummary(payoutsRes.data.summary || {})
    } catch (error) {
      console.error('Failed to load affiliate data:', error)
      // Use mock data for development
      setDashboardData({
        referral_code: user?.username?.toUpperCase().slice(0, 4) + 'XYZ123',
        referral_link: 'https://tradesense.com/signup?ref=' + (user?.username?.toUpperCase().slice(0, 4) || 'USER') + 'XYZ123',
        stats: {
          tier1: { referrals: 0, active_referrals: 0, total_revenue: 0, total_commissions: 0 },
          tier2: { referrals: 0, active_referrals: 0, total_revenue: 0, total_commissions: 0 },
          totals: { referrals: 0, revenue: 0, commissions: 0, paid: 0, pending_balance: 0 },
          performance_tier: 'none',
          bonus_rate: 0
        },
        commission_rates: { tier1: 15, tier2: 5 },
        minimum_payout: 100,
        recent_commissions: [],
        monthly_earnings: [],
        performance: {
          current_tier: 'none',
          bonus_rate: 0,
          next_tier: 'bronze',
          next_tier_progress: {
            referrals: { current: 0, required: 5, percent: 0 },
            revenue: { current: 0, required: 500, percent: 0 }
          },
          tiers: {
            bronze: { min_referrals: 5, min_revenue: 500, bonus_percent: 2 },
            silver: { min_referrals: 15, min_revenue: 2000, bonus_percent: 3 },
            gold: { min_referrals: 30, min_revenue: 5000, bonus_percent: 5 },
            platinum: { min_referrals: 50, min_revenue: 10000, bonus_percent: 7 }
          }
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    showSuccessToast('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRequestPayout = async (paymentMethod, paymentDetails) => {
    try {
      await api.post('/affiliates/payout-request', {
        payment_method: paymentMethod,
        payment_details: paymentDetails
      })
      showSuccessToast('Payout request submitted successfully!')
      fetchDashboardData()
    } catch (error) {
      showErrorToast(error)
      throw error
    }
  }

  const shareLinks = [
    { name: 'Twitter', icon: Twitter, url: `https://twitter.com/intent/tweet?text=Join me on TradeSense and become a funded trader! Use my referral code ${dashboardData?.referral_code}: ${dashboardData?.referral_link}`, color: 'hover:bg-blue-500' },
    { name: 'Facebook', icon: Facebook, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(dashboardData?.referral_link || '')}`, color: 'hover:bg-blue-600' },
    { name: 'LinkedIn', icon: Linkedin, url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(dashboardData?.referral_link || '')}&title=Join TradeSense`, color: 'hover:bg-blue-700' },
    { name: 'Email', icon: Mail, url: `mailto:?subject=Join TradeSense&body=Use my referral code ${dashboardData?.referral_code} to get started: ${dashboardData?.referral_link}`, color: 'hover:bg-gray-600' }
  ]

  const tierColors = {
    none: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: Shield },
    bronze: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Star },
    silver: { bg: 'bg-slate-400/20', text: 'text-slate-300', icon: Star },
    gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Crown },
    platinum: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Crown }
  }

  const currentTier = dashboardData?.performance?.current_tier || 'none'
  const tierConfig = tierColors[currentTier]
  const TierIcon = tierConfig?.icon || Shield

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-dark-100 rounded-2xl mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-dark-100 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-dark-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Affiliate Dashboard</h1>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tierConfig.bg} ${tierConfig.text}`}>
                      {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Tier
                    </span>
                    {dashboardData?.performance?.bonus_rate > 0 && (
                      <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium text-white">
                        +{dashboardData.performance.bonus_rate}% Bonus
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-white/80 max-w-xl">
                Earn <span className="font-bold">{dashboardData?.commission_rates?.tier1}%</span> on direct referrals and{' '}
                <span className="font-bold">{dashboardData?.commission_rates?.tier2}%</span> on sub-referrals.
                Build your network and unlock performance bonuses!
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-white/60 text-sm">Total Earnings</p>
                <p className="text-3xl font-bold text-white">
                  ${(dashboardData?.stats?.totals?.commissions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(dashboardData?.referral_link || '')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="text-blue-500" size={20} />
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-1">Tier 1 Referrals</p>
          <p className="text-2xl font-bold text-white">{dashboardData?.stats?.tier1?.referrals || 0}</p>
          <p className="text-xs text-green-500">{dashboardData?.commission_rates?.tier1}% commission</p>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Zap className="text-purple-500" size={20} />
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-1">Tier 2 Referrals</p>
          <p className="text-2xl font-bold text-white">{dashboardData?.stats?.tier2?.referrals || 0}</p>
          <p className="text-xs text-purple-500">{dashboardData?.commission_rates?.tier2}% commission</p>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-500" size={20} />
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-500">
            ${(dashboardData?.stats?.totals?.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Wallet className="text-yellow-500" size={20} />
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-yellow-500">
            ${(dashboardData?.stats?.totals?.pending_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-dark-100 rounded-lg p-1 border border-dark-200">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'network', label: 'Network', icon: Users },
          { id: 'payouts', label: 'Payouts', icon: Wallet },
          { id: 'materials', label: 'Materials', icon: Download }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Referral Code & Link */}
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
              <h3 className="font-semibold text-white mb-4">Your Referral Code</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 bg-dark-200 rounded-lg px-4 py-3 font-mono text-xl text-white">
                  {dashboardData?.referral_code || 'Loading...'}
                </div>
                <button
                  onClick={() => copyToClipboard(dashboardData?.referral_code || '')}
                  className="p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>

              <h4 className="text-sm text-gray-400 mb-2">Referral Link</h4>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 bg-dark-200 rounded-lg px-4 py-3 text-gray-400 text-sm truncate">
                  {dashboardData?.referral_link || 'Loading...'}
                </div>
                <button
                  onClick={() => copyToClipboard(dashboardData?.referral_link || '')}
                  className="p-3 bg-dark-200 hover:bg-dark-300 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <Copy size={20} />
                </button>
              </div>

              {/* Share Buttons */}
              <div className="flex flex-wrap gap-3">
                {shareLinks.map(link => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-4 py-2 bg-dark-200 rounded-lg text-gray-400 ${link.color} hover:text-white transition-all`}
                  >
                    <link.icon size={18} />
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Commission Chart */}
            <CommissionChart
              data={dashboardData?.monthly_earnings || []}
              loading={loading}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Tier Progress */}
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${tierConfig.bg} rounded-lg flex items-center justify-center`}>
                  <TierIcon className={tierConfig.text} size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Performance Tier</h3>
                  <p className="text-sm text-gray-400">
                    {currentTier === 'platinum' ? 'Max tier reached!' : `Next: ${dashboardData?.performance?.next_tier}`}
                  </p>
                </div>
              </div>

              {dashboardData?.performance?.next_tier_progress && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Referrals</span>
                      <span className="text-white">
                        {dashboardData.performance.next_tier_progress.referrals.current} / {dashboardData.performance.next_tier_progress.referrals.required}
                      </span>
                    </div>
                    <div className="h-2 bg-dark-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${dashboardData.performance.next_tier_progress.referrals.percent}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Revenue</span>
                      <span className="text-white">
                        ${dashboardData.performance.next_tier_progress.revenue.current.toLocaleString()} / ${dashboardData.performance.next_tier_progress.revenue.required.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-dark-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${dashboardData.performance.next_tier_progress.revenue.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tier Benefits */}
              <div className="mt-4 pt-4 border-t border-dark-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Tier Bonuses</p>
                <div className="space-y-2">
                  {Object.entries(dashboardData?.performance?.tiers || {}).map(([name, data]) => (
                    <div
                      key={name}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        currentTier === name ? 'bg-primary-500/20' : 'bg-dark-200/50'
                      }`}
                    >
                      <span className={`text-sm font-medium capitalize ${
                        currentTier === name ? 'text-primary-400' : 'text-gray-400'
                      }`}>
                        {name}
                      </span>
                      <span className={`text-sm ${
                        currentTier === name ? 'text-primary-400 font-bold' : 'text-gray-500'
                      }`}>
                        +{data.bonus_percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Commission Rates Card */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 p-6">
              <Gift className="text-green-400 mb-3" size={28} />
              <h4 className="font-semibold text-white mb-3">Commission Rates</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Tier 1 (Direct)</span>
                  <span className="text-2xl font-bold text-green-400">
                    {dashboardData?.commission_rates?.tier1}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Tier 2 (Sub-refs)</span>
                  <span className="text-2xl font-bold text-purple-400">
                    {dashboardData?.commission_rates?.tier2}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Earn on every purchase your network makes. No limits!
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <SubAffiliateTree
          subAffiliates={subAffiliates}
          loading={loading}
        />
      )}

      {activeTab === 'payouts' && (
        <PayoutHistory
          payouts={payouts}
          summary={payoutSummary}
          loading={loading}
          onRequestPayout={handleRequestPayout}
          pendingBalance={dashboardData?.stats?.totals?.pending_balance || 0}
          minimumPayout={dashboardData?.minimum_payout || 100}
        />
      )}

      {activeTab === 'materials' && (
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Marketing Materials</h3>
              <p className="text-sm text-gray-400">Download banners, templates, and more</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Banner 728x90', type: 'PNG', size: '728x90px' },
              { name: 'Banner 300x250', type: 'PNG', size: '300x250px' },
              { name: 'Social Media Kit', type: 'ZIP', size: 'All sizes' },
              { name: 'Email Templates', type: 'HTML', size: '5 templates' }
            ].map((material, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{material.name}</p>
                    <p className="text-xs text-gray-400">{material.type} • {material.size}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>

          {/* Guidelines */}
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-200 font-medium">Marketing Guidelines</p>
                <ul className="text-xs text-yellow-300/70 mt-2 space-y-1">
                  <li>• Always disclose affiliate relationship</li>
                  <li>• Do not make false claims about earnings</li>
                  <li>• Do not spam or use deceptive marketing</li>
                  <li>• Do not bid on TradeSense branded keywords</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReferralPage
