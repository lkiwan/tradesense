import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Chart from 'react-apexcharts'
import { toast } from 'react-hot-toast'
import { AdminLayout, StatCard, StatCardGrid } from '../../components/admin'
import {
  Users, DollarSign, Trophy, TrendingUp, CreditCard, Wallet,
  HelpCircle, AlertTriangle, ArrowRight, Activity
} from 'lucide-react'
import { adminStatsAPI } from '../../services/adminApi'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userGrowthData, setUserGrowthData] = useState([])
  const [revenueData, setRevenueData] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const response = await adminStatsAPI.getDashboardStats()
      setStats(response.data)

      // Generate sample data for charts (replace with actual API calls)
      generateChartData()
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      // Use mock data for now
      setStats({
        revenue: { total: 125000, monthly: 28500, currency: 'MAD' },
        users: { total: 1250, new_this_month: 85 },
        challenges: { total: 890, active: 245, passed: 380, failed: 265, success_rate: 58.9 },
        trades: { total: 15680, total_volume: 2450000 }
      })
      generateChartData()
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = () => {
    // Sample user growth data (last 30 days)
    const days = 30
    const userGrowth = []
    const revenue = []
    let baseUsers = 1100
    let baseRevenue = 20000

    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      baseUsers += Math.floor(Math.random() * 10)
      baseRevenue += Math.floor(Math.random() * 2000)

      userGrowth.push({ x: dateStr, y: baseUsers })
      revenue.push({ x: dateStr, y: baseRevenue })
    }

    setUserGrowthData(userGrowth)
    setRevenueData(revenue)
  }

  const formatCurrency = (value, currency = 'MAD') => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('fr-MA').format(value)
  }

  // Chart configurations
  const userGrowthChartOptions = {
    chart: {
      type: 'area',
      height: 300,
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'inherit'
    },
    colors: ['#3b82f6'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    xaxis: {
      type: 'datetime',
      labels: {
        style: { colors: '#9ca3af' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: '#9ca3af' },
        formatter: (val) => formatNumber(val)
      }
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 3
    },
    tooltip: {
      theme: 'dark',
      x: { format: 'dd MMM yyyy' }
    }
  }

  const revenueChartOptions = {
    ...userGrowthChartOptions,
    colors: ['#10b981'],
    tooltip: {
      theme: 'dark',
      x: { format: 'dd MMM yyyy' },
      y: {
        formatter: (val) => formatCurrency(val)
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#9ca3af' },
        formatter: (val) => formatCurrency(val)
      }
    }
  }

  const challengeStatusOptions = {
    chart: {
      type: 'donut',
      background: 'transparent'
    },
    colors: ['#10b981', '#ef4444', '#3b82f6'],
    labels: ['Passed', 'Failed', 'Active'],
    legend: {
      position: 'bottom',
      labels: { colors: '#9ca3af' }
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
              color: '#9ca3af',
              formatter: () => stats?.challenges?.total || 0
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: false
    }
  }

  const QuickActionCard = ({ icon: Icon, title, description, to, color }) => (
    <Link
      to={to}
      className="bg-dark-100 rounded-xl p-5 border border-dark-200 hover:border-primary/50 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-medium mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ArrowRight size={18} className="text-gray-500 group-hover:text-primary transition-colors" />
      </div>
    </Link>
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Overview of platform performance</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Refresh Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={formatNumber(stats?.users?.total || 0)}
            icon={Users}
            trend="up"
            trendValue={`+${stats?.users?.new_this_month || 0}`}
            trendLabel="this month"
            color="blue"
            loading={loading}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.revenue?.total || 0)}
            icon={DollarSign}
            trend="up"
            trendValue={formatCurrency(stats?.revenue?.monthly || 0)}
            trendLabel="this month"
            color="green"
            loading={loading}
          />
          <StatCard
            title="Active Challenges"
            value={formatNumber(stats?.challenges?.active || 0)}
            icon={Trophy}
            trend="up"
            trendValue={`${stats?.challenges?.success_rate?.toFixed(1) || 0}%`}
            trendLabel="success rate"
            color="purple"
            loading={loading}
          />
          <StatCard
            title="Total Trades"
            value={formatNumber(stats?.trades?.total || 0)}
            icon={Activity}
            trend="up"
            trendValue={formatCurrency(stats?.trades?.total_volume || 0)}
            trendLabel="volume"
            color="orange"
            loading={loading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-dark-100 rounded-xl p-5 border border-dark-200">
            <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
            {loading ? (
              <div className="h-[300px] bg-dark-200 rounded animate-pulse"></div>
            ) : (
              <Chart
                options={userGrowthChartOptions}
                series={[{ name: 'Users', data: userGrowthData }]}
                type="area"
                height={300}
              />
            )}
          </div>

          {/* Revenue Chart */}
          <div className="bg-dark-100 rounded-xl p-5 border border-dark-200">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
            {loading ? (
              <div className="h-[300px] bg-dark-200 rounded animate-pulse"></div>
            ) : (
              <Chart
                options={revenueChartOptions}
                series={[{ name: 'Revenue', data: revenueData }]}
                type="area"
                height={300}
              />
            )}
          </div>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Challenge Status Chart */}
          <div className="bg-dark-100 rounded-xl p-5 border border-dark-200">
            <h3 className="text-lg font-semibold text-white mb-4">Challenge Status</h3>
            {loading ? (
              <div className="h-[250px] bg-dark-200 rounded animate-pulse"></div>
            ) : (
              <Chart
                options={challengeStatusOptions}
                series={[
                  stats?.challenges?.passed || 0,
                  stats?.challenges?.failed || 0,
                  stats?.challenges?.active || 0
                ]}
                type="donut"
                height={250}
              />
            )}
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickActionCard
                icon={Users}
                title="Manage Users"
                description="View and manage user accounts"
                to="/admin/users"
                color="bg-blue-500/10 text-blue-500"
              />
              <QuickActionCard
                icon={Trophy}
                title="Challenges"
                description="Monitor active challenges"
                to="/admin/challenges"
                color="bg-purple-500/10 text-purple-500"
              />
              <QuickActionCard
                icon={Wallet}
                title="Payouts"
                description="Process pending payouts"
                to="/admin/payouts"
                color="bg-green-500/10 text-green-500"
              />
              <QuickActionCard
                icon={HelpCircle}
                title="Support Tickets"
                description="Respond to user inquiries"
                to="/admin/tickets"
                color="bg-yellow-500/10 text-yellow-500"
              />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-dark-100 rounded-xl p-5 border border-dark-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <Link to="/admin/audit-logs" className="text-sm text-primary hover:text-primary-dark">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-dark-200/50 rounded-lg animate-pulse">
                  <div className="w-10 h-10 bg-dark-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-dark-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-dark-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity size={40} className="mx-auto mb-2 opacity-50" />
                <p>Activity feed will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
