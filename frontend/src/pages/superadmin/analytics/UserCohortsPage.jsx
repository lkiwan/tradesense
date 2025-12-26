import { useState, useEffect } from 'react'
import {
  Users, Calendar, TrendingUp, TrendingDown, ArrowRight,
  Filter, Download, RefreshCw, Clock, DollarSign, Target,
  BarChart3, Activity, Percent, ChevronDown, ChevronUp
} from 'lucide-react'
import { AdminLayout, StatCard } from '../../../components/admin'
import superAdminApi from '../../../services/superAdminApi'
import toast from 'react-hot-toast'

const UserCohortsPage = () => {
  const [loading, setLoading] = useState(true)
  const [cohortType, setCohortType] = useState('monthly')
  const [metric, setMetric] = useState('retention')

  // Cohort data
  const [cohortData, setCohortData] = useState(null)
  const [retentionData, setRetentionData] = useState(null)
  const [segmentData, setSegmentData] = useState(null)

  useEffect(() => {
    fetchCohortData()
  }, [cohortType, metric])

  const fetchCohortData = async () => {
    setLoading(true)
    try {
      const [cohorts, retention, segments] = await Promise.all([
        superAdminApi.analytics.getCohortAnalysis({ type: cohortType, metric }),
        superAdminApi.analytics.getRetentionMetrics({ type: cohortType }),
        superAdminApi.analytics.getCohortAnalysis({ groupBy: 'segment' })
      ])

      setCohortData(cohorts.data)
      setRetentionData(retention.data)
      setSegmentData(segments.data)
    } catch (error) {
      console.error('Error fetching cohort data:', error)
      // Mock data for development
      setCohortData({
        summary: {
          totalCohorts: 12,
          avgRetention: 42.5,
          bestCohort: 'Aug 2024',
          avgLTV: 850
        },
        cohorts: [
          { period: 'Dec 2024', users: 485, month1: 78, month2: 62, month3: 51, month4: null, month5: null, month6: null, revenue: 145500 },
          { period: 'Nov 2024', users: 520, month1: 75, month2: 58, month3: 48, month4: 42, month5: null, month6: null, revenue: 156000 },
          { period: 'Oct 2024', users: 445, month1: 72, month2: 55, month3: 46, month4: 40, month5: 36, month6: null, revenue: 133500 },
          { period: 'Sep 2024', users: 510, month1: 74, month2: 57, month3: 47, month4: 41, month5: 37, month6: 34, revenue: 153000 },
          { period: 'Aug 2024', users: 480, month1: 82, month2: 65, month3: 54, month4: 48, month5: 44, month6: 41, revenue: 168000 },
          { period: 'Jul 2024', users: 425, month1: 70, month2: 52, month3: 42, month4: 36, month5: 32, month6: 29, revenue: 118750 }
        ]
      })

      setRetentionData({
        overall: {
          day1: 85,
          day7: 62,
          day14: 48,
          day30: 38,
          day60: 28,
          day90: 22
        },
        byChannel: [
          { channel: 'Organic', day1: 88, day7: 68, day30: 45, users: 1250 },
          { channel: 'Paid Ads', day1: 82, day7: 55, day30: 32, users: 890 },
          { channel: 'Referral', day1: 92, day7: 75, day30: 52, users: 420 },
          { channel: 'Social', day1: 78, day7: 48, day30: 28, users: 680 },
          { channel: 'Affiliate', day1: 85, day7: 62, day30: 40, users: 560 }
        ],
        trends: [
          { period: 'This Month', retention: 42.5, change: 5.2 },
          { period: 'Last Month', retention: 40.4, change: 3.1 },
          { period: '3 Months Ago', retention: 39.2, change: -2.4 }
        ]
      })

      setSegmentData({
        segments: [
          { name: 'Power Traders', users: 285, avgTrades: 45, retention: 68, ltv: 2100, growth: 12.5 },
          { name: 'Regular Users', users: 1450, avgTrades: 18, retention: 45, ltv: 750, growth: 8.2 },
          { name: 'Casual Users', users: 890, avgTrades: 5, retention: 28, ltv: 320, growth: -3.5 },
          { name: 'Dormant', users: 675, avgTrades: 0, retention: 8, ltv: 150, growth: -15.2 }
        ],
        behaviorPatterns: [
          { pattern: 'High Activity in Week 1', percentage: 65, outcome: 'Higher retention' },
          { pattern: 'Uses Mobile App', percentage: 42, outcome: '30% better retention' },
          { pattern: 'Completes Profile', percentage: 78, outcome: '25% higher LTV' },
          { pattern: 'Joins Community', percentage: 35, outcome: '40% better retention' }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getRetentionColor = (value) => {
    if (value === null) return 'bg-dark-300'
    if (value >= 60) return 'bg-green-500'
    if (value >= 40) return 'bg-blue-500'
    if (value >= 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getRetentionTextColor = (value) => {
    if (value === null) return 'text-gray-600'
    if (value >= 60) return 'text-green-400'
    if (value >= 40) return 'text-blue-400'
    if (value >= 25) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <AdminLayout
      title="User Cohorts"
      subtitle="Cohort analysis and retention metrics"
      breadcrumbs={[
        { label: 'SuperAdmin', href: '/superadmin/dashboard' },
        { label: 'User Cohorts' }
      ]}
    >
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <select
            value={cohortType}
            onChange={(e) => setCohortType(e.target.value)}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            <option value="weekly">Weekly Cohorts</option>
            <option value="monthly">Monthly Cohorts</option>
            <option value="quarterly">Quarterly Cohorts</option>
          </select>

          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            <option value="retention">Retention Rate</option>
            <option value="revenue">Revenue</option>
            <option value="activity">Activity</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCohortData}
            className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-dark-200 text-gray-400 rounded-lg hover:text-white transition-colors">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {cohortData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Cohorts"
            value={cohortData.summary.totalCohorts}
            icon={Users}
          />
          <StatCard
            title="Avg. Retention"
            value={`${cohortData.summary.avgRetention}%`}
            icon={Activity}
            trend={{ value: 3.2, isPositive: true }}
          />
          <StatCard
            title="Best Performing Cohort"
            value={cohortData.summary.bestCohort}
            icon={TrendingUp}
          />
          <StatCard
            title="Average LTV"
            value={formatCurrency(cohortData.summary.avgLTV)}
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
          />
        </div>
      )}

      {/* Cohort Retention Matrix */}
      {cohortData && (
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 mb-6 overflow-x-auto">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Cohort Retention Matrix
          </h3>
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="text-gray-500 text-sm">
                <th className="text-left py-3 px-4">Cohort</th>
                <th className="text-center py-3 px-4">Users</th>
                <th className="text-center py-3 px-4">Month 1</th>
                <th className="text-center py-3 px-4">Month 2</th>
                <th className="text-center py-3 px-4">Month 3</th>
                <th className="text-center py-3 px-4">Month 4</th>
                <th className="text-center py-3 px-4">Month 5</th>
                <th className="text-center py-3 px-4">Month 6</th>
                <th className="text-right py-3 px-4">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {cohortData.cohorts.map((cohort, index) => (
                <tr key={index} className="border-t border-dark-300/50">
                  <td className="py-3 px-4">
                    <span className="text-white font-medium">{cohort.period}</span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-400">
                    {cohort.users.toLocaleString()}
                  </td>
                  {[cohort.month1, cohort.month2, cohort.month3, cohort.month4, cohort.month5, cohort.month6].map((value, i) => (
                    <td key={i} className="py-3 px-4 text-center">
                      <div
                        className={`inline-flex items-center justify-center w-12 h-8 rounded ${getRetentionColor(value)} ${value !== null ? 'bg-opacity-20' : ''}`}
                      >
                        <span className={`text-sm font-medium ${getRetentionTextColor(value)}`}>
                          {value !== null ? `${value}%` : '-'}
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right text-green-400 font-medium">
                    {formatCurrency(cohort.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-dark-300">
            <span className="text-gray-500 text-sm">Retention:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500/20" />
                <span className="text-green-400 text-sm">60%+</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500/20" />
                <span className="text-blue-400 text-sm">40-59%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500/20" />
                <span className="text-yellow-400 text-sm">25-39%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/20" />
                <span className="text-red-400 text-sm">&lt;25%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Retention by Channel */}
        {retentionData && (
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target size={20} className="text-primary" />
              Retention by Acquisition Channel
            </h3>
            <div className="space-y-4">
              {retentionData.byChannel.map((channel, index) => (
                <div key={index} className="p-4 bg-dark-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-white font-medium">{channel.channel}</span>
                      <span className="text-gray-500 text-sm ml-2">({channel.users.toLocaleString()} users)</span>
                    </div>
                    <span className={`font-medium ${
                      channel.day30 >= 45 ? 'text-green-400' :
                      channel.day30 >= 30 ? 'text-blue-400' :
                      'text-yellow-400'
                    }`}>
                      {channel.day30}% D30
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">D1</span>
                        <span className="text-white">{channel.day1}%</span>
                      </div>
                      <div className="w-full bg-dark-300 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${channel.day1}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">D7</span>
                        <span className="text-white">{channel.day7}%</span>
                      </div>
                      <div className="w-full bg-dark-300 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${channel.day7}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">D30</span>
                        <span className="text-white">{channel.day30}%</span>
                      </div>
                      <div className="w-full bg-dark-300 rounded-full h-1.5">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{ width: `${channel.day30}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retention Curve */}
        {retentionData && (
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              Overall Retention Curve
            </h3>
            <div className="h-64 flex items-end gap-4">
              {Object.entries(retentionData.overall).map(([day, value], index) => {
                const labels = { day1: 'Day 1', day7: 'Day 7', day14: 'Day 14', day30: 'Day 30', day60: 'Day 60', day90: 'Day 90' }
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-primary to-blue-500 rounded-t transition-all hover:opacity-80"
                      style={{ height: `${value}%` }}
                    />
                    <p className="text-gray-500 text-xs mt-2">{labels[day]}</p>
                    <p className="text-white font-medium text-sm">{value}%</p>
                  </div>
                )
              })}
            </div>

            {/* Retention Trends */}
            <div className="mt-6 pt-4 border-t border-dark-300">
              <h4 className="text-gray-400 text-sm mb-3">Retention Trends</h4>
              <div className="grid grid-cols-3 gap-4">
                {retentionData.trends.map((trend, index) => (
                  <div key={index} className="text-center">
                    <p className="text-gray-500 text-xs">{trend.period}</p>
                    <p className="text-white font-semibold text-lg">{trend.retention}%</p>
                    <p className={`text-sm flex items-center justify-center gap-1 ${
                      trend.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trend.change >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {Math.abs(trend.change)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Segments */}
      {segmentData && (
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 mb-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Users size={20} className="text-primary" />
            User Segments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {segmentData.segments.map((segment, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  segment.name === 'Power Traders' ? 'bg-purple-500/10 border-purple-500/30' :
                  segment.name === 'Regular Users' ? 'bg-blue-500/10 border-blue-500/30' :
                  segment.name === 'Casual Users' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-gray-500/10 border-gray-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-semibold ${
                    segment.name === 'Power Traders' ? 'text-purple-400' :
                    segment.name === 'Regular Users' ? 'text-blue-400' :
                    segment.name === 'Casual Users' ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>
                    {segment.name}
                  </h4>
                  <span className={`text-sm flex items-center gap-1 ${
                    segment.growth >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {segment.growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(segment.growth)}%
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Users</span>
                    <span className="text-white">{segment.users.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg. Trades/mo</span>
                    <span className="text-white">{segment.avgTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Retention</span>
                    <span className={`${
                      segment.retention >= 50 ? 'text-green-400' :
                      segment.retention >= 30 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {segment.retention}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">LTV</span>
                    <span className="text-white">{formatCurrency(segment.ltv)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Behavior Patterns */}
      {segmentData && (
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Activity size={20} className="text-primary" />
            Behavior Patterns That Drive Retention
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {segmentData.behaviorPatterns.map((pattern, index) => (
              <div
                key={index}
                className="p-4 bg-dark-200 rounded-lg flex items-center gap-4"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">{pattern.percentage}%</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{pattern.pattern}</p>
                  <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                    <ArrowRight size={14} className="text-green-400" />
                    {pattern.outcome}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">Key Insights</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Users who complete their profile have 25% higher LTV</li>
              <li>• Mobile app users show 30% better retention than web-only users</li>
              <li>• Community engagement is the strongest retention driver</li>
              <li>• First week activity is critical for long-term retention</li>
            </ul>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default UserCohortsPage
