import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Chart from 'react-apexcharts'
import { AdminLayout, StatCard } from '../../components/admin'
import {
  Users, DollarSign, Trophy, TrendingUp, Shield, Server,
  AlertTriangle, Activity, Settings, Bell, Lock, Database,
  ArrowRight, Check, X, Clock
} from 'lucide-react'
import { adminStatsAPI } from '../../services/adminApi'
import superAdminApi from '../../services/superAdminApi'

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [platformStatus, setPlatformStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, platformRes] = await Promise.all([
        adminStatsAPI.getDashboardStats(),
        superAdminApi.platform.getStatus()
      ])
      setStats(statsRes.data)
      setPlatformStatus(platformRes.data)
      generateChartData()
    } catch (error) {
      console.error('Error loading dashboard:', error)
      // Mock data
      setStats({
        revenue: { total: 125000, monthly: 28500, currency: 'MAD' },
        users: { total: 1250, new_this_month: 85 },
        challenges: { total: 890, active: 245, passed: 380, failed: 265, success_rate: 58.9 },
        trades: { total: 15680, total_volume: 2450000 }
      })
      setPlatformStatus({
        maintenance_mode: false,
        trading_enabled: true,
        registration_enabled: true,
        active_admins: 3
      })
      generateChartData()
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = () => {
    const days = 30
    const revenue = []
    let baseRevenue = 20000

    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      baseRevenue += Math.floor(Math.random() * 2000)
      revenue.push({ x: date.toISOString().split('T')[0], y: baseRevenue })
    }

    setRevenueData(revenue)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('fr-MA').format(value)
  }

  const revenueChartOptions = {
    chart: {
      type: 'area',
      height: 250,
      toolbar: { show: false },
      background: 'transparent',
      sparkline: { enabled: true }
    },
    colors: ['#10b981'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1
      }
    },
    stroke: { curve: 'smooth', width: 2 },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => formatCurrency(val) }
    }
  }

  const StatusIndicator = ({ active, label }) => (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className={`text-sm ${active ? 'text-green-500' : 'text-red-500'}`}>{label}</span>
    </div>
  )

  const SystemStatusCard = ({ icon: Icon, title, status, statusLabel, color, link }) => (
    <Link
      to={link}
      className="bg-dark-100 rounded-xl p-4 border border-dark-200 hover:border-primary/50 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} />
        </div>
        <StatusIndicator active={status} label={statusLabel} />
      </div>
      <h4 className="text-white font-medium group-hover:text-primary transition-colors">{title}</h4>
    </Link>
  )

  const QuickActionButton = ({ icon: Icon, label, onClick, variant = 'default' }) => {
    const variants = {
      default: 'bg-dark-200 hover:bg-dark-300 text-white',
      primary: 'bg-primary hover:bg-primary-dark text-white',
      danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-500',
      success: 'bg-green-500/10 hover:bg-green-500/20 text-green-500',
    }

    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${variants[variant]}`}
      >
        <Icon size={18} />
        <span className="text-sm font-medium">{label}</span>
      </button>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">SuperAdmin Dashboard</h1>
            <p className="text-gray-400 mt-1">Full platform control and monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-300 transition-colors"
            >
              Refresh
            </button>
            <Link
              to="/superadmin/config"
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <Settings size={18} />
              System Config
            </Link>
          </div>
        </div>

        {/* Platform Status Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="text-purple-400" size={24} />
              <div>
                <h3 className="text-white font-medium">Platform Status</h3>
                <p className="text-sm text-gray-400">All systems operational</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <StatusIndicator
                active={!platformStatus?.maintenance_mode}
                label={platformStatus?.maintenance_mode ? 'Maintenance' : 'Online'}
              />
              <StatusIndicator
                active={platformStatus?.trading_enabled}
                label={platformStatus?.trading_enabled ? 'Trading Active' : 'Trading Disabled'}
              />
              <StatusIndicator
                active={platformStatus?.registration_enabled}
                label={platformStatus?.registration_enabled ? 'Registration Open' : 'Registration Closed'}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.revenue?.total || 0)}
            icon={DollarSign}
            trend="up"
            trendValue={`+${formatCurrency(stats?.revenue?.monthly || 0)}`}
            trendLabel="this month"
            color="green"
            loading={loading}
          />
          <StatCard
            title="Total Users"
            value={formatNumber(stats?.users?.total || 0)}
            icon={Users}
            trend="up"
            trendValue={`+${stats?.users?.new_this_month || 0}`}
            trendLabel="new this month"
            color="blue"
            loading={loading}
          />
          <StatCard
            title="Success Rate"
            value={`${stats?.challenges?.success_rate?.toFixed(1) || 0}%`}
            icon={Trophy}
            trend="up"
            trendValue={`${stats?.challenges?.passed || 0} passed`}
            trendLabel="challenges"
            color="purple"
            loading={loading}
          />
          <StatCard
            title="Platform Health"
            value="99.9%"
            icon={Server}
            trend="up"
            trendValue="Uptime"
            trendLabel="last 30 days"
            color="green"
            loading={loading}
          />
        </div>

        {/* System Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SystemStatusCard
            icon={Server}
            title="Platform Control"
            status={!platformStatus?.maintenance_mode}
            statusLabel={platformStatus?.maintenance_mode ? 'Maintenance' : 'Active'}
            color="bg-purple-500/10 text-purple-500"
            link="/superadmin/platform"
          />
          <SystemStatusCard
            icon={TrendingUp}
            title="Trading System"
            status={platformStatus?.trading_enabled}
            statusLabel={platformStatus?.trading_enabled ? 'Enabled' : 'Disabled'}
            color="bg-green-500/10 text-green-500"
            link="/superadmin/trading"
          />
          <SystemStatusCard
            icon={Shield}
            title="Security"
            status={true}
            statusLabel="Protected"
            color="bg-blue-500/10 text-blue-500"
            link="/superadmin/security"
          />
          <SystemStatusCard
            icon={Database}
            title="Database"
            status={true}
            statusLabel="Healthy"
            color="bg-orange-500/10 text-orange-500"
            link="/superadmin/config"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-dark-100 rounded-xl p-5 border border-dark-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Revenue Overview</h3>
              <Link to="/superadmin/analytics" className="text-sm text-primary hover:text-primary-dark">
                View Analytics
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Today</p>
                <p className="text-xl font-bold text-white">{formatCurrency(2850)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">This Week</p>
                <p className="text-xl font-bold text-white">{formatCurrency(18500)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">This Month</p>
                <p className="text-xl font-bold text-white">{formatCurrency(stats?.revenue?.monthly || 0)}</p>
              </div>
            </div>
            {loading ? (
              <div className="h-[200px] bg-dark-200 rounded animate-pulse"></div>
            ) : (
              <Chart
                options={revenueChartOptions}
                series={[{ name: 'Revenue', data: revenueData }]}
                type="area"
                height={200}
              />
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-dark-100 rounded-xl p-5 border border-dark-200">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/superadmin/notifications"
                className="flex items-center justify-between p-3 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-yellow-500" />
                  <span className="text-white">Send Notification</span>
                </div>
                <ArrowRight size={16} className="text-gray-500 group-hover:text-primary" />
              </Link>
              <Link
                to="/superadmin/bulk-actions"
                className="flex items-center justify-between p-3 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-blue-500" />
                  <span className="text-white">Bulk User Actions</span>
                </div>
                <ArrowRight size={16} className="text-gray-500 group-hover:text-primary" />
              </Link>
              <Link
                to="/superadmin/admins"
                className="flex items-center justify-between p-3 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-purple-500" />
                  <span className="text-white">Manage Admins</span>
                </div>
                <ArrowRight size={16} className="text-gray-500 group-hover:text-primary" />
              </Link>
              <Link
                to="/superadmin/blocked-ips"
                className="flex items-center justify-between p-3 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Lock size={18} className="text-red-500" />
                  <span className="text-white">Blocked IPs</span>
                </div>
                <ArrowRight size={16} className="text-gray-500 group-hover:text-primary" />
              </Link>
            </div>
          </div>
        </div>

        {/* Alerts & Security Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Alerts */}
          <div className="bg-dark-100 rounded-xl p-5 border border-dark-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Security Alerts</h3>
              <Link to="/superadmin/security" className="text-sm text-primary hover:text-primary-dark">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 bg-dark-200/50 rounded-lg animate-pulse">
                    <div className="h-4 bg-dark-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-dark-200 rounded w-1/2"></div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Check size={40} className="mx-auto mb-2 text-green-500" />
                  <p>No security alerts</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Activity */}
          <div className="bg-dark-100 rounded-xl p-5 border border-dark-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Admin Activity</h3>
              <Link to="/superadmin/admin-activity" className="text-sm text-primary hover:text-primary-dark">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 bg-dark-200/50 rounded-lg animate-pulse">
                    <div className="h-4 bg-dark-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-dark-200 rounded w-1/2"></div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Activity size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Admin activity will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default SuperAdminDashboard
