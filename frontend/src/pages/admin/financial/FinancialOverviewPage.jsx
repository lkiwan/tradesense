import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet,
  ArrowUpRight, ArrowDownRight, Calendar, Download, RefreshCw,
  PieChart, BarChart3, Activity
} from 'lucide-react'
import Chart from 'react-apexcharts'
import { AdminLayout, StatCard } from '../../../components/admin'
import adminApi from '../../../services/adminApi'

const FinancialOverviewPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    revenueGrowth: 0,
    payoutsGrowth: 0
  })
  const [revenueData, setRevenueData] = useState([])
  const [payoutData, setPayoutData] = useState([])
  const [revenueBySource, setRevenueBySource] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])

  useEffect(() => {
    fetchFinancialData()
  }, [dateRange])

  const fetchFinancialData = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getFinancialOverview({ dateRange })
      setStats(response.data.stats)
      setRevenueData(response.data.revenueData)
      setPayoutData(response.data.payoutData)
      setRevenueBySource(response.data.revenueBySource)
      setRecentTransactions(response.data.recentTransactions)
    } catch (error) {
      console.error('Error fetching financial data:', error)
      // Mock data
      setStats({
        totalRevenue: 458750,
        monthlyRevenue: 85420,
        pendingPayouts: 12350,
        completedPayouts: 156890,
        revenueGrowth: 12.5,
        payoutsGrowth: 8.3
      })
      setRevenueData([
        { date: 'Dec 1', revenue: 2500, payouts: 800 },
        { date: 'Dec 5', revenue: 3200, payouts: 1200 },
        { date: 'Dec 10', revenue: 4100, payouts: 1500 },
        { date: 'Dec 15', revenue: 3800, payouts: 2000 },
        { date: 'Dec 20', revenue: 5200, payouts: 1800 },
        { date: 'Dec 25', revenue: 4800, payouts: 2200 }
      ])
      setRevenueBySource([
        { source: 'Challenge Fees', amount: 45000, percentage: 52.7 },
        { source: 'Subscriptions', amount: 22000, percentage: 25.8 },
        { source: 'Add-ons', amount: 12000, percentage: 14.1 },
        { source: 'Other', amount: 6420, percentage: 7.4 }
      ])
      setRecentTransactions([
        { id: 1, type: 'payment', user: 'trader_pro', amount: 299, status: 'completed', date: '2024-12-24T10:30:00Z' },
        { id: 2, type: 'payout', user: 'fx_master', amount: 2500, status: 'pending', date: '2024-12-24T09:15:00Z' },
        { id: 3, type: 'payment', user: 'crypto_king', amount: 499, status: 'completed', date: '2024-12-23T16:45:00Z' },
        { id: 4, type: 'payout', user: 'swing_trader', amount: 5000, status: 'completed', date: '2024-12-23T14:20:00Z' },
        { id: 5, type: 'payment', user: 'day_trader', amount: 199, status: 'failed', date: '2024-12-23T11:00:00Z' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const revenueChartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      stacked: false
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    colors: ['#10B981', '#EF4444'],
    xaxis: {
      categories: revenueData.map(d => d.date),
      labels: { style: { colors: '#6B7280' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: '#6B7280' },
        formatter: (val) => `$${(val / 1000).toFixed(1)}k`
      }
    },
    grid: { borderColor: '#374151', strokeDashArray: 3 },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `$${val.toLocaleString()}` }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#9CA3AF' }
    },
    dataLabels: { enabled: false }
  }

  const revenueChartSeries = [
    { name: 'Revenue', data: revenueData.map(d => d.revenue) },
    { name: 'Payouts', data: revenueData.map(d => d.payouts) }
  ]

  const sourceChartOptions = {
    chart: {
      type: 'donut',
      background: 'transparent'
    },
    labels: revenueBySource.map(s => s.source),
    colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'],
    legend: {
      position: 'bottom',
      labels: { colors: '#9CA3AF' }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              color: '#9CA3AF',
              formatter: () => `$${stats.monthlyRevenue.toLocaleString()}`
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: { show: false }
  }

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'This year' }
  ]

  return (
    <AdminLayout
      title="Financial Overview"
      subtitle="Revenue, payments, and payout analytics"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Financial' }
      ]}
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
          >
            {dateRangeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFinancialData}
            className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 rounded-lg transition-colors">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <DollarSign size={24} className="text-green-500" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${stats.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.revenueGrowth >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(stats.revenueGrowth)}%
            </div>
          </div>
          <p className="text-gray-400 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <TrendingUp size={24} className="text-blue-500" />
            </div>
          </div>
          <p className="text-gray-400 text-sm">Monthly Revenue</p>
          <p className="text-2xl font-bold text-white">${stats.monthlyRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Wallet size={24} className="text-yellow-500" />
            </div>
          </div>
          <p className="text-gray-400 text-sm">Pending Payouts</p>
          <p className="text-2xl font-bold text-white">${stats.pendingPayouts.toLocaleString()}</p>
          <button
            onClick={() => navigate('/admin/payouts')}
            className="text-primary text-sm hover:underline mt-2"
          >
            View all →
          </button>
        </div>

        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <CreditCard size={24} className="text-purple-500" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${stats.payoutsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.payoutsGrowth >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(stats.payoutsGrowth)}%
            </div>
          </div>
          <p className="text-gray-400 text-sm">Completed Payouts</p>
          <p className="text-2xl font-bold text-white">${stats.completedPayouts.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-dark-100 rounded-xl border border-dark-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Revenue vs Payouts</h3>
            <BarChart3 size={20} className="text-gray-500" />
          </div>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <Chart
              options={revenueChartOptions}
              series={revenueChartSeries}
              type="area"
              height={300}
            />
          )}
        </div>

        {/* Revenue by Source */}
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Revenue by Source</h3>
            <PieChart size={20} className="text-gray-500" />
          </div>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <Chart
              options={sourceChartOptions}
              series={revenueBySource.map(s => s.amount)}
              type="donut"
              height={300}
            />
          )}
        </div>
      </div>

      {/* Quick Links & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links */}
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/payments')}
              className="w-full flex items-center gap-3 p-3 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors"
            >
              <CreditCard size={20} className="text-blue-500" />
              <span className="text-white">View All Payments</span>
            </button>
            <button
              onClick={() => navigate('/admin/payouts')}
              className="w-full flex items-center gap-3 p-3 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors"
            >
              <Wallet size={20} className="text-green-500" />
              <span className="text-white">Manage Payouts</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors">
              <Download size={20} className="text-purple-500" />
              <span className="text-white">Export Reports</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-dark-100 rounded-xl border border-dark-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
            <Activity size={20} className="text-gray-500" />
          </div>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    tx.type === 'payment' ? 'bg-green-500/10' : 'bg-blue-500/10'
                  }`}>
                    {tx.type === 'payment' ? (
                      <ArrowDownRight size={18} className="text-green-500" />
                    ) : (
                      <ArrowUpRight size={18} className="text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{tx.user}</p>
                    <p className="text-gray-500 text-sm capitalize">{tx.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${tx.type === 'payment' ? 'text-green-500' : 'text-blue-500'}`}>
                    {tx.type === 'payment' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </p>
                  <p className={`text-xs ${
                    tx.status === 'completed' ? 'text-green-400' :
                    tx.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/admin/payments')}
            className="w-full mt-4 py-2 text-primary hover:underline text-sm"
          >
            View all transactions →
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default FinancialOverviewPage
