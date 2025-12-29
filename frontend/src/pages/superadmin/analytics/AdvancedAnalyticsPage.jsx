import { useState, useEffect } from 'react'
import {
  TrendingUp, DollarSign, Users, CreditCard, ArrowUp, ArrowDown,
  Calendar, Filter, Download, RefreshCw, Target, Percent,
  BarChart3, PieChart, Activity, Zap, Clock, AlertTriangle
} from 'lucide-react'
import { AdminLayout, StatCard } from '../../../components/admin'
import superAdminApi from '../../../services/superAdminApi'
import toast from 'react-hot-toast'
import ExportDropdown from '../../../components/common/ExportDropdown'
import {
  createPDF,
  savePDF,
  generateFileName,
  addHeader,
  addFooter,
  addSectionTitle,
  addRevenueAnalyticsStats,
  addRevenueBySourceAnalytics,
  addTopProductsTable,
  addConversionFunnelTable,
  addConversionRatesSummary,
  addLTVAnalyticsStats,
  addLTVSegmentsTable,
  addPredictionsSummary,
  addChurnRiskTable,
  addRecommendationsTable
} from '../../../utils/exports/pdfExport'
import { exportAdvancedAnalyticsToExcel } from '../../../utils/exports/excelExport'

const AdvancedAnalyticsPage = () => {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState('30d')
  const [activeTab, setActiveTab] = useState('revenue')

  // Analytics data
  const [revenueData, setRevenueData] = useState(null)
  const [conversionData, setConversionData] = useState(null)
  const [predictionData, setPredictionData] = useState(null)
  const [ltfData, setLtvData] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [revenue, conversion, predictions, ltv] = await Promise.all([
        superAdminApi.analytics.getRevenueAnalytics({ range: dateRange }),
        superAdminApi.analytics.getConversionFunnel({ range: dateRange }),
        superAdminApi.analytics.getPredictions({ range: dateRange }),
        superAdminApi.analytics.getLTVAnalysis({ range: dateRange })
      ])

      setRevenueData(revenue.data)
      setConversionData(conversion.data)
      setPredictionData(predictions.data)
      setLtvData(ltv.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Mock data for development
      setRevenueData({
        total: 485000,
        growth: 23.5,
        bySource: [
          { source: 'Challenges', amount: 320000, percentage: 66 },
          { source: 'Subscriptions', amount: 95000, percentage: 20 },
          { source: 'Add-ons', amount: 45000, percentage: 9 },
          { source: 'Affiliates', amount: 25000, percentage: 5 }
        ],
        byPeriod: [
          { period: 'Week 1', amount: 98000 },
          { period: 'Week 2', amount: 115000 },
          { period: 'Week 3', amount: 125000 },
          { period: 'Week 4', amount: 147000 }
        ],
        topProducts: [
          { name: '$100K Challenge', revenue: 185000, count: 370 },
          { name: '$50K Challenge', revenue: 95000, count: 380 },
          { name: '$200K Challenge', revenue: 40000, count: 40 },
          { name: 'Pro Subscription', revenue: 35000, count: 700 },
          { name: 'Trading Signals', revenue: 28000, count: 560 }
        ]
      })

      setConversionData({
        funnel: [
          { stage: 'Visitors', count: 50000, rate: 100 },
          { stage: 'Sign-ups', count: 8500, rate: 17 },
          { stage: 'Trial Started', count: 3200, rate: 37.6 },
          { stage: 'Challenge Purchased', count: 1850, rate: 57.8 },
          { stage: 'Phase 1 Passed', count: 925, rate: 50 },
          { stage: 'Funded', count: 370, rate: 40 }
        ],
        conversionRates: {
          visitorToSignup: 17,
          signupToTrial: 37.6,
          trialToPurchase: 57.8,
          purchaseToFunded: 20
        }
      })

      setPredictionData({
        nextMonthRevenue: 525000,
        confidence: 85,
        churnRisk: {
          high: 45,
          medium: 120,
          low: 835
        },
        growthForecast: [
          { month: 'Jan', predicted: 510000, actual: null },
          { month: 'Feb', predicted: 545000, actual: null },
          { month: 'Mar', predicted: 580000, actual: null }
        ],
        recommendations: [
          { type: 'action', text: 'Launch email campaign to 120 medium-risk users', impact: 'Potential $15K retention' },
          { type: 'warning', text: '45 high-risk users likely to churn', impact: 'Potential loss: $9K' },
          { type: 'opportunity', text: 'Upsell $50K users to $100K', impact: 'Revenue boost: $25K' }
        ]
      })

      setLtvData({
        averageLTV: 850,
        bySegment: [
          { segment: 'High Value', ltv: 2500, count: 150, percentage: 15 },
          { segment: 'Medium Value', ltv: 950, count: 450, percentage: 45 },
          { segment: 'Low Value', ltv: 350, count: 400, percentage: 40 }
        ],
        paybackPeriod: 45,
        cac: 125,
        ltvToCac: 6.8
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

  const dateRangeLabels = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    '1y': 'Last year'
  }

  const handleExportPDF = async () => {
    if (!revenueData || !conversionData || !ltfData || !predictionData) return

    setExporting(true)
    try {
      const doc = createPDF()
      let yPosition = 20

      // Add header
      yPosition = addHeader(doc, 'Advanced Analytics Report', dateRangeLabels[dateRange] || dateRange)
      yPosition += 10

      // Page 1: Revenue Analytics
      yPosition = addSectionTitle(doc, 'Revenue Analytics', yPosition)
      yPosition = addRevenueAnalyticsStats(doc, revenueData, yPosition)
      yPosition = addSectionTitle(doc, 'Revenue by Source', yPosition)
      yPosition = addRevenueBySourceAnalytics(doc, revenueData.bySource, yPosition)
      yPosition = addSectionTitle(doc, 'Top Revenue Products', yPosition)
      yPosition = addTopProductsTable(doc, revenueData.topProducts, yPosition)

      // Page 2: Conversion Funnel
      doc.addPage()
      yPosition = 20
      yPosition = addSectionTitle(doc, 'Conversion Funnel Analysis', yPosition)
      yPosition = addConversionRatesSummary(doc, conversionData.conversionRates, yPosition)
      yPosition = addSectionTitle(doc, 'Detailed Funnel', yPosition)
      yPosition = addConversionFunnelTable(doc, conversionData.funnel, yPosition)

      // Page 3: LTV Analysis
      doc.addPage()
      yPosition = 20
      yPosition = addSectionTitle(doc, 'LTV Analysis', yPosition)
      yPosition = addLTVAnalyticsStats(doc, ltfData, yPosition)
      yPosition = addSectionTitle(doc, 'Customer Segments by LTV', yPosition)
      yPosition = addLTVSegmentsTable(doc, ltfData.bySegment, yPosition)

      // Page 4: AI Predictions
      doc.addPage()
      yPosition = 20
      yPosition = addSectionTitle(doc, 'AI-Powered Predictions', yPosition)
      yPosition = addPredictionsSummary(doc, predictionData, yPosition)
      yPosition = addSectionTitle(doc, 'Churn Risk Distribution', yPosition)
      yPosition = addChurnRiskTable(doc, predictionData.churnRisk, yPosition)
      yPosition = addSectionTitle(doc, 'AI Recommendations', yPosition)
      yPosition = addRecommendationsTable(doc, predictionData.recommendations, yPosition)

      // Add footer to all pages
      addFooter(doc)

      // Save PDF
      savePDF(doc, generateFileName('AdvancedAnalytics', 'pdf'))
      toast.success('PDF exported successfully!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    if (!revenueData || !conversionData || !ltfData || !predictionData) return

    setExporting(true)
    try {
      await exportAdvancedAnalyticsToExcel(
        revenueData,
        conversionData,
        ltfData,
        predictionData,
        dateRangeLabels[dateRange] || dateRange
      )
      toast.success('Excel exported successfully!')
    } catch (error) {
      console.error('Error exporting Excel:', error)
      toast.error('Failed to export Excel')
    } finally {
      setExporting(false)
    }
  }

  const tabs = [
    { id: 'revenue', label: 'Revenue Analytics', icon: DollarSign },
    { id: 'conversion', label: 'Conversion Funnel', icon: Target },
    { id: 'ltv', label: 'LTV Analysis', icon: TrendingUp },
    { id: 'predictions', label: 'AI Predictions', icon: Zap }
  ]

  return (
    <AdminLayout
      title="Advanced Analytics"
      subtitle="Deep revenue insights and AI-powered predictions"
      breadcrumbs={[
        { label: 'SuperAdmin', href: '/superadmin/dashboard' },
        { label: 'Advanced Analytics' }
      ]}
    >
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-dark-200 text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <ExportDropdown
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            loading={exporting}
            disabled={loading || !revenueData}
          />
        </div>
      </div>

      {/* Revenue Analytics Tab */}
      {activeTab === 'revenue' && revenueData && (
        <div className="space-y-6">
          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(revenueData.total)}
              icon={DollarSign}
              trend={{ value: revenueData.growth, isPositive: revenueData.growth > 0 }}
            />
            <StatCard
              title="Avg. Order Value"
              value={formatCurrency(revenueData.total / 1850)}
              icon={CreditCard}
              trend={{ value: 8.2, isPositive: true }}
            />
            <StatCard
              title="Revenue per User"
              value={formatCurrency(revenueData.total / 1000)}
              icon={Users}
              trend={{ value: 12.5, isPositive: true }}
            />
            <StatCard
              title="MRR"
              value={formatCurrency(95000)}
              icon={TrendingUp}
              trend={{ value: 5.3, isPositive: true }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Source */}
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <PieChart size={20} className="text-primary" />
                Revenue by Source
              </h3>
              <div className="space-y-4">
                {revenueData.bySource.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">{item.source}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-white font-medium">{formatCurrency(item.amount)}</span>
                        <span className="text-gray-500 text-sm">{item.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-dark-300 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Revenue Trend */}
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-primary" />
                Weekly Revenue Trend
              </h3>
              <div className="flex items-end gap-4 h-48">
                {revenueData.byPeriod.map((item, index) => {
                  const maxAmount = Math.max(...revenueData.byPeriod.map(p => p.amount))
                  const height = (item.amount / maxAmount) * 100
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-primary to-blue-500 rounded-t transition-all hover:opacity-80"
                        style={{ height: `${height}%` }}
                      />
                      <p className="text-gray-500 text-sm mt-2">{item.period}</p>
                      <p className="text-white font-medium text-sm">{formatCurrency(item.amount)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target size={20} className="text-primary" />
              Top Revenue Products
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 text-sm border-b border-dark-300">
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-right py-3 px-4">Revenue</th>
                    <th className="text-right py-3 px-4">Sales</th>
                    <th className="text-right py-3 px-4">Avg. Price</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.topProducts.map((product, index) => (
                    <tr key={index} className="border-b border-dark-300/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            index === 1 ? 'bg-gray-500/20 text-gray-400' :
                            index === 2 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-dark-300 text-gray-500'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-white font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-green-400 font-medium">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400">
                        {product.count.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {formatCurrency(product.revenue / product.count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Funnel Tab */}
      {activeTab === 'conversion' && conversionData && (
        <div className="space-y-6">
          {/* Conversion Rate Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Visitor to Sign-up"
              value={`${conversionData.conversionRates.visitorToSignup}%`}
              icon={Users}
              trend={{ value: 2.3, isPositive: true }}
            />
            <StatCard
              title="Sign-up to Trial"
              value={`${conversionData.conversionRates.signupToTrial}%`}
              icon={Clock}
              trend={{ value: 5.1, isPositive: true }}
            />
            <StatCard
              title="Trial to Purchase"
              value={`${conversionData.conversionRates.trialToPurchase}%`}
              icon={CreditCard}
              trend={{ value: 3.8, isPositive: true }}
            />
            <StatCard
              title="Purchase to Funded"
              value={`${conversionData.conversionRates.purchaseToFunded}%`}
              icon={Target}
              trend={{ value: -1.2, isPositive: false }}
            />
          </div>

          {/* Funnel Visualization */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              Conversion Funnel
            </h3>
            <div className="space-y-4">
              {conversionData.funnel.map((stage, index) => {
                const width = (stage.count / conversionData.funnel[0].count) * 100
                const prevCount = index > 0 ? conversionData.funnel[index - 1].count : stage.count
                const dropoff = prevCount - stage.count
                const dropoffRate = index > 0 ? ((dropoff / prevCount) * 100).toFixed(1) : 0

                return (
                  <div key={index} className="relative">
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-right">
                        <p className="text-white font-medium">{stage.stage}</p>
                        <p className="text-gray-500 text-sm">{stage.count.toLocaleString()}</p>
                      </div>
                      <div className="flex-1 relative">
                        <div className="w-full bg-dark-300 rounded-lg h-10">
                          <div
                            className="bg-gradient-to-r from-primary to-blue-500 h-10 rounded-lg flex items-center justify-end px-3 transition-all"
                            style={{ width: `${width}%` }}
                          >
                            <span className="text-white font-medium text-sm">
                              {stage.rate}%
                            </span>
                          </div>
                        </div>
                      </div>
                      {index > 0 && (
                        <div className="w-24 text-left">
                          <p className="text-red-400 text-sm flex items-center gap-1">
                            <ArrowDown size={14} />
                            {dropoffRate}% drop
                          </p>
                          <p className="text-gray-500 text-xs">{dropoff.toLocaleString()} lost</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* LTV Analysis Tab */}
      {activeTab === 'ltv' && ltfData && (
        <div className="space-y-6">
          {/* LTV Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Average LTV"
              value={formatCurrency(ltfData.averageLTV)}
              icon={DollarSign}
              trend={{ value: 15.2, isPositive: true }}
            />
            <StatCard
              title="CAC"
              value={formatCurrency(ltfData.cac)}
              icon={Target}
              trend={{ value: -8.5, isPositive: true }}
            />
            <StatCard
              title="LTV:CAC Ratio"
              value={`${ltfData.ltvToCac}:1`}
              icon={TrendingUp}
              trend={{ value: 22.3, isPositive: true }}
            />
            <StatCard
              title="Payback Period"
              value={`${ltfData.paybackPeriod} days`}
              icon={Clock}
              trend={{ value: -12, isPositive: true }}
            />
          </div>

          {/* LTV by Segment */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <PieChart size={20} className="text-primary" />
              Customer Segments by LTV
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ltfData.bySegment.map((segment, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border ${
                    segment.segment === 'High Value' ? 'bg-green-500/10 border-green-500/30' :
                    segment.segment === 'Medium Value' ? 'bg-blue-500/10 border-blue-500/30' :
                    'bg-gray-500/10 border-gray-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`font-semibold ${
                      segment.segment === 'High Value' ? 'text-green-400' :
                      segment.segment === 'Medium Value' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      {segment.segment}
                    </h4>
                    <span className="text-gray-500 text-sm">{segment.percentage}%</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg. LTV</span>
                      <span className="text-white font-medium">{formatCurrency(segment.ltv)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customers</span>
                      <span className="text-white font-medium">{segment.count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Value</span>
                      <span className="text-white font-medium">{formatCurrency(segment.ltv * segment.count)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LTV Insights */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Zap size={20} className="text-primary" />
              LTV Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-medium mb-2">Healthy LTV:CAC Ratio</p>
                <p className="text-gray-400 text-sm">
                  Your LTV:CAC ratio of {ltfData.ltvToCac}:1 is excellent. Industry benchmark is 3:1.
                  This indicates strong unit economics and room for growth investment.
                </p>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 font-medium mb-2">Quick Payback</p>
                <p className="text-gray-400 text-sm">
                  {ltfData.paybackPeriod}-day payback period is efficient. Consider increasing
                  marketing spend to acquire more customers while maintaining this ratio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Predictions Tab */}
      {activeTab === 'predictions' && predictionData && (
        <div className="space-y-6">
          {/* Prediction Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Predicted Next Month Revenue"
              value={formatCurrency(predictionData.nextMonthRevenue)}
              icon={TrendingUp}
              trend={{ value: 8.2, isPositive: true }}
            />
            <StatCard
              title="Prediction Confidence"
              value={`${predictionData.confidence}%`}
              icon={Target}
            />
            <StatCard
              title="High-Risk Churn Users"
              value={predictionData.churnRisk.high}
              icon={AlertTriangle}
              trend={{ value: 12, isPositive: false }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Churn Risk Distribution */}
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-yellow-400" />
                Churn Risk Distribution
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-400">High Risk</span>
                    <span className="text-white font-medium">{predictionData.churnRisk.high} users</span>
                  </div>
                  <div className="w-full bg-dark-300 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full"
                      style={{ width: `${(predictionData.churnRisk.high / 1000) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-yellow-400">Medium Risk</span>
                    <span className="text-white font-medium">{predictionData.churnRisk.medium} users</span>
                  </div>
                  <div className="w-full bg-dark-300 rounded-full h-3">
                    <div
                      className="bg-yellow-500 h-3 rounded-full"
                      style={{ width: `${(predictionData.churnRisk.medium / 1000) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400">Low Risk</span>
                    <span className="text-white font-medium">{predictionData.churnRisk.low} users</span>
                  </div>
                  <div className="w-full bg-dark-300 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${(predictionData.churnRisk.low / 1000) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Forecast */}
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-primary" />
                Revenue Forecast
              </h3>
              <div className="flex items-end gap-6 h-40">
                {predictionData.growthForecast.map((item, index) => {
                  const maxAmount = Math.max(...predictionData.growthForecast.map(p => p.predicted))
                  const height = (item.predicted / maxAmount) * 100
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-primary/50 to-primary rounded-t border-2 border-dashed border-primary transition-all"
                        style={{ height: `${height}%` }}
                      />
                      <p className="text-gray-500 text-sm mt-2">{item.month}</p>
                      <p className="text-white font-medium text-sm">{formatCurrency(item.predicted)}</p>
                    </div>
                  )
                })}
              </div>
              <p className="text-gray-500 text-sm mt-4 text-center">
                Predicted values based on ML model with {predictionData.confidence}% confidence
              </p>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Zap size={20} className="text-primary" />
              AI-Powered Recommendations
            </h3>
            <div className="space-y-4">
              {predictionData.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border flex items-start gap-4 ${
                    rec.type === 'action' ? 'bg-blue-500/10 border-blue-500/30' :
                    rec.type === 'warning' ? 'bg-red-500/10 border-red-500/30' :
                    'bg-green-500/10 border-green-500/30'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    rec.type === 'action' ? 'bg-blue-500/20' :
                    rec.type === 'warning' ? 'bg-red-500/20' :
                    'bg-green-500/20'
                  }`}>
                    {rec.type === 'action' ? <Target size={20} className="text-blue-400" /> :
                     rec.type === 'warning' ? <AlertTriangle size={20} className="text-red-400" /> :
                     <TrendingUp size={20} className="text-green-400" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      rec.type === 'action' ? 'text-blue-400' :
                      rec.type === 'warning' ? 'text-red-400' :
                      'text-green-400'
                    }`}>
                      {rec.text}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">{rec.impact}</p>
                  </div>
                  <button className="px-3 py-1.5 bg-dark-200 text-gray-400 rounded-lg text-sm hover:text-white transition-colors">
                    Take Action
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdvancedAnalyticsPage
