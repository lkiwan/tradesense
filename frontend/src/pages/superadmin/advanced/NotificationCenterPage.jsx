import { useState, useEffect } from 'react'
import {
  Bell, Send, Users, User, Search, Filter,
  Clock, CheckCircle, XCircle, Mail, MessageSquare,
  Megaphone, AlertTriangle, Info, Gift, TrendingUp,
  RefreshCw, Trash2, Eye
} from 'lucide-react'
import { AdminLayout, DataTable, StatusBadge, ConfirmationModal } from '../../../components/admin'
import superAdminApi from '../../../services/superAdminApi'
import toast from 'react-hot-toast'

const NotificationCenterPage = () => {
  const [activeTab, setActiveTab] = useState('compose')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // Compose form
  const [notificationType, setNotificationType] = useState('push')
  const [targetType, setTargetType] = useState('all')
  const [targetUsers, setTargetUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const [notification, setNotification] = useState({
    title: '',
    message: '',
    category: 'general',
    priority: 'normal',
    actionUrl: '',
    scheduledAt: ''
  })

  // History filters
  const [historyFilters, setHistoryFilters] = useState({
    type: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  })

  // View notification modal
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)

  useEffect(() => {
    if (activeTab === 'history') {
      fetchNotificationHistory()
    }
  }, [activeTab, historyFilters])

  const fetchNotificationHistory = async () => {
    setLoading(true)
    try {
      const response = await superAdminApi.notifications.getHistory(historyFilters)
      setNotifications(response.data.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Mock data
      setNotifications([
        { id: 1, type: 'push', title: 'New Challenge Available', message: 'Check out our latest $100K challenge with reduced fees!', target: 'all', recipients: 1250, sent_at: '2024-12-24T10:00:00Z', status: 'delivered', category: 'promotion' },
        { id: 2, type: 'email', title: 'Platform Maintenance', message: 'Scheduled maintenance on Dec 25, 2024', target: 'all', recipients: 1250, sent_at: '2024-12-23T15:00:00Z', status: 'delivered', category: 'system' },
        { id: 3, type: 'push', title: 'Welcome Bonus!', message: 'Complete your first trade and get 500 points!', target: 'new_users', recipients: 85, sent_at: '2024-12-22T09:00:00Z', status: 'delivered', category: 'promotion' },
        { id: 4, type: 'email', title: 'Account Verification Required', message: 'Please verify your email to continue trading', target: 'unverified', recipients: 156, sent_at: '2024-12-21T11:00:00Z', status: 'partial', category: 'account' },
        { id: 5, type: 'push', title: 'Market Alert', message: 'High volatility expected during FOMC meeting', target: 'active_traders', recipients: 450, sent_at: '2024-12-20T08:00:00Z', status: 'delivered', category: 'market' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) return

    try {
      const response = await superAdminApi.users.searchUsers(searchQuery)
      setSearchResults(response.data.users || [])
    } catch (error) {
      console.error('Error searching users:', error)
      // Mock data
      setSearchResults([
        { id: 1, username: 'trader_pro', email: 'trader@example.com' },
        { id: 2, username: 'fx_master', email: 'fx@example.com' },
        { id: 3, username: 'crypto_king', email: 'crypto@example.com' }
      ])
    }
  }

  const addTargetUser = (user) => {
    if (!targetUsers.find(u => u.id === user.id)) {
      setTargetUsers([...targetUsers, user])
    }
    setSearchQuery('')
    setSearchResults([])
  }

  const removeTargetUser = (userId) => {
    setTargetUsers(targetUsers.filter(u => u.id !== userId))
  }

  const handleSendNotification = async () => {
    if (!notification.title.trim() || !notification.message.trim()) {
      toast.error('Please fill in title and message')
      return
    }

    if (targetType === 'specific' && targetUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    setSending(true)
    try {
      await superAdminApi.notifications.send({
        ...notification,
        type: notificationType,
        targetType,
        targetUserIds: targetType === 'specific' ? targetUsers.map(u => u.id) : []
      })
      toast.success('Notification sent successfully!')
      // Reset form
      setNotification({
        title: '',
        message: '',
        category: 'general',
        priority: 'normal',
        actionUrl: '',
        scheduledAt: ''
      })
      setTargetUsers([])
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  const getCategoryIcon = (category) => {
    const icons = {
      general: Info,
      promotion: Gift,
      system: AlertTriangle,
      market: TrendingUp,
      account: User
    }
    return icons[category] || Info
  }

  const getCategoryColor = (category) => {
    const colors = {
      general: 'text-blue-400',
      promotion: 'text-purple-400',
      system: 'text-yellow-400',
      market: 'text-green-400',
      account: 'text-cyan-400'
    }
    return colors[category] || 'text-gray-400'
  }

  const getStatusConfig = (status) => {
    const configs = {
      delivered: { color: 'green', label: 'Delivered' },
      partial: { color: 'yellow', label: 'Partial' },
      failed: { color: 'red', label: 'Failed' },
      scheduled: { color: 'blue', label: 'Scheduled' },
      pending: { color: 'gray', label: 'Pending' }
    }
    return configs[status] || configs.pending
  }

  const targetOptions = [
    { value: 'all', label: 'All Users', description: 'Send to all registered users' },
    { value: 'active', label: 'Active Users', description: 'Users who logged in last 7 days' },
    { value: 'inactive', label: 'Inactive Users', description: 'Users inactive for 30+ days' },
    { value: 'with_challenge', label: 'Challenge Holders', description: 'Users with active challenges' },
    { value: 'new_users', label: 'New Users', description: 'Registered in last 7 days' },
    { value: 'premium', label: 'Premium Users', description: 'Users with premium subscription' },
    { value: 'specific', label: 'Specific Users', description: 'Select individual users' }
  ]

  const categoryOptions = [
    { value: 'general', label: 'General', icon: Info },
    { value: 'promotion', label: 'Promotion', icon: Gift },
    { value: 'system', label: 'System', icon: AlertTriangle },
    { value: 'market', label: 'Market Alert', icon: TrendingUp },
    { value: 'account', label: 'Account', icon: User }
  ]

  const columns = [
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <div className="flex items-center gap-2">
          {value === 'push' ? (
            <Bell size={16} className="text-blue-400" />
          ) : (
            <Mail size={16} className="text-purple-400" />
          )}
          <span className="text-white capitalize">{value}</span>
        </div>
      )
    },
    {
      key: 'title',
      label: 'Notification',
      render: (value, row) => {
        const CategoryIcon = getCategoryIcon(row.category)
        return (
          <div className="flex items-start gap-3">
            <CategoryIcon size={16} className={getCategoryColor(row.category)} />
            <div>
              <p className="text-white font-medium">{value}</p>
              <p className="text-gray-500 text-sm truncate max-w-xs">{row.message}</p>
            </div>
          </div>
        )
      }
    },
    {
      key: 'target',
      label: 'Target',
      render: (value, row) => (
        <div>
          <p className="text-white capitalize">{value.replace('_', ' ')}</p>
          <p className="text-gray-500 text-sm">{row.recipients.toLocaleString()} recipients</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const config = getStatusConfig(value)
        return <StatusBadge status={config.label} color={config.color} />
      }
    },
    {
      key: 'sent_at',
      label: 'Sent',
      render: (value) => (
        <span className="text-gray-400 text-sm">
          {new Date(value).toLocaleString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={() => {
            setSelectedNotification(row)
            setShowViewModal(true)
          }}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-200 transition-colors"
        >
          <Eye size={16} />
        </button>
      )
    }
  ]

  return (
    <AdminLayout
      title="Notification Center"
      subtitle="Send push notifications and emails to users"
      breadcrumbs={[
        { label: 'SuperAdmin', href: '/superadmin/dashboard' },
        { label: 'Notification Center' }
      ]}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === 'compose'
              ? 'bg-primary text-white'
              : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          <Send size={18} />
          Compose
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === 'history'
              ? 'bg-primary text-white'
              : 'bg-dark-200 text-gray-400 hover:text-white'
          }`}
        >
          <Clock size={18} />
          History
        </button>
      </div>

      {activeTab === 'compose' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compose Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notification Type */}
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
              <h3 className="text-white font-semibold mb-4">Notification Type</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setNotificationType('push')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                    notificationType === 'push'
                      ? 'border-primary bg-primary/10'
                      : 'border-dark-300 hover:border-dark-200'
                  }`}
                >
                  <Bell size={24} className={notificationType === 'push' ? 'text-primary' : 'text-gray-500'} />
                  <p className={`mt-2 font-medium ${notificationType === 'push' ? 'text-white' : 'text-gray-400'}`}>
                    Push Notification
                  </p>
                  <p className="text-gray-500 text-sm mt-1">Instant mobile/web notification</p>
                </button>
                <button
                  onClick={() => setNotificationType('email')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                    notificationType === 'email'
                      ? 'border-primary bg-primary/10'
                      : 'border-dark-300 hover:border-dark-200'
                  }`}
                >
                  <Mail size={24} className={notificationType === 'email' ? 'text-primary' : 'text-gray-500'} />
                  <p className={`mt-2 font-medium ${notificationType === 'email' ? 'text-white' : 'text-gray-400'}`}>
                    Email
                  </p>
                  <p className="text-gray-500 text-sm mt-1">Send email to users</p>
                </button>
              </div>
            </div>

            {/* Message Content */}
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
              <h3 className="text-white font-semibold mb-4">Message Content</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Title *</label>
                  <input
                    type="text"
                    placeholder="Notification title..."
                    value={notification.title}
                    onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Message *</label>
                  <textarea
                    placeholder="Write your message here..."
                    value={notification.message}
                    onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none resize-none"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    {notification.message.length}/500 characters
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Category</label>
                    <select
                      value={notification.category}
                      onChange={(e) => setNotification(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Priority</label>
                    <select
                      value={notification.priority}
                      onChange={(e) => setNotification(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Action URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/page"
                    value={notification.actionUrl}
                    onChange={(e) => setNotification(prev => ({ ...prev, actionUrl: e.target.value }))}
                    className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Schedule (Optional)</label>
                  <input
                    type="datetime-local"
                    value={notification.scheduledAt}
                    onChange={(e) => setNotification(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Target Selection */}
          <div className="space-y-6">
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Target Audience
              </h3>
              <div className="space-y-2">
                {targetOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTargetType(option.value)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      targetType === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-dark-300 hover:border-dark-200'
                    }`}
                  >
                    <p className={`font-medium ${targetType === option.value ? 'text-white' : 'text-gray-400'}`}>
                      {option.label}
                    </p>
                    <p className="text-gray-500 text-sm">{option.description}</p>
                  </button>
                ))}
              </div>

              {/* Specific User Selection */}
              {targetType === 'specific' && (
                <div className="mt-4 pt-4 border-t border-dark-300">
                  <div className="relative mb-3">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        if (e.target.value.length > 2) searchUsers()
                      }}
                      className="w-full bg-dark-200 text-white rounded-lg pl-10 pr-4 py-2 border border-dark-300 focus:border-primary focus:outline-none text-sm"
                    />
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="bg-dark-200 rounded-lg border border-dark-300 max-h-32 overflow-y-auto mb-3">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => addTargetUser(user)}
                          className="w-full p-2 text-left hover:bg-dark-300 flex items-center gap-2"
                        >
                          <User size={14} className="text-gray-500" />
                          <span className="text-white text-sm">{user.username}</span>
                          <span className="text-gray-500 text-xs">({user.email})</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Users */}
                  {targetUsers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-gray-400 text-sm">{targetUsers.length} users selected</p>
                      <div className="flex flex-wrap gap-2">
                        {targetUsers.map((user) => (
                          <span
                            key={user.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-sm"
                          >
                            {user.username}
                            <button
                              onClick={() => removeTargetUser(user.id)}
                              className="hover:text-white"
                            >
                              <XCircle size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview & Send */}
            <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
              <h3 className="text-white font-semibold mb-4">Preview</h3>
              <div className="bg-dark-200 rounded-lg p-4 mb-4">
                {notification.title || notification.message ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      {notificationType === 'push' ? (
                        <Bell size={16} className="text-primary" />
                      ) : (
                        <Mail size={16} className="text-primary" />
                      )}
                      <span className="text-white font-medium">
                        {notification.title || 'Notification Title'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {notification.message || 'Your message will appear here...'}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Start typing to see preview
                  </p>
                )}
              </div>
              <button
                onClick={handleSendNotification}
                disabled={sending || !notification.title || !notification.message}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    {notification.scheduledAt ? 'Schedule Notification' : 'Send Now'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={historyFilters.type}
                onChange={(e) => setHistoryFilters(prev => ({ ...prev, type: e.target.value }))}
                className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="push">Push</option>
                <option value="email">Email</option>
              </select>

              <select
                value={historyFilters.status}
                onChange={(e) => setHistoryFilters(prev => ({ ...prev, status: e.target.value }))}
                className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="delivered">Delivered</option>
                <option value="partial">Partial</option>
                <option value="failed">Failed</option>
                <option value="scheduled">Scheduled</option>
              </select>

              <input
                type="date"
                value={historyFilters.dateFrom}
                onChange={(e) => setHistoryFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="bg-dark-200 text-white rounded-lg px-4 py-2 border border-dark-300 focus:border-primary focus:outline-none"
              />

              <button
                onClick={fetchNotificationHistory}
                className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {/* History Table */}
          <DataTable
            columns={columns}
            data={notifications}
            loading={loading}
            emptyMessage="No notifications sent yet"
          />
        </div>
      )}

      {/* View Notification Modal */}
      {showViewModal && selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 w-full max-w-lg">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Notification Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {selectedNotification.type === 'push' ? (
                  <Bell size={18} className="text-blue-400" />
                ) : (
                  <Mail size={18} className="text-purple-400" />
                )}
                <span className="text-gray-400 capitalize">{selectedNotification.type}</span>
                <StatusBadge
                  status={getStatusConfig(selectedNotification.status).label}
                  color={getStatusConfig(selectedNotification.status).color}
                />
              </div>

              <div>
                <p className="text-gray-500 text-sm mb-1">Title</p>
                <p className="text-white font-medium">{selectedNotification.title}</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm mb-1">Message</p>
                <p className="text-gray-300">{selectedNotification.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Target</p>
                  <p className="text-white capitalize">{selectedNotification.target.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Recipients</p>
                  <p className="text-white">{selectedNotification.recipients.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Category</p>
                  <p className="text-white capitalize">{selectedNotification.category}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Sent At</p>
                  <p className="text-white">{new Date(selectedNotification.sent_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowViewModal(false)}
              className="w-full mt-6 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default NotificationCenterPage
