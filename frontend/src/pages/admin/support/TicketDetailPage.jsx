import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Clock, CheckCircle, XCircle, AlertCircle,
  Send, Paperclip, Tag, UserPlus, MoreVertical, RefreshCw
} from 'lucide-react'
import { AdminLayout, StatusBadge, ConfirmationModal } from '../../../components/admin'
import adminApi from '../../../services/adminApi'

const TicketDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)

  useEffect(() => {
    fetchTicketDetails()
  }, [id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchTicketDetails = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getTicketDetails(id)
      setTicket(response.data.ticket)
      setMessages(response.data.messages || [])
    } catch (error) {
      console.error('Error fetching ticket:', error)
      // Mock data
      setTicket({
        id: `TKT-${id?.padStart(3, '0')}`,
        user: { id: 1, username: 'trader_pro', email: 'trader@example.com', avatar: null },
        subject: 'Cannot withdraw funds from my funded account',
        category: 'payout',
        priority: 'high',
        status: 'open',
        created_at: '2024-12-24T10:30:00Z',
        updated_at: '2024-12-24T14:45:00Z',
        assigned_to: null
      })
      setMessages([
        {
          id: 1,
          sender: 'user',
          sender_name: 'trader_pro',
          content: 'Hello, I\'ve been trying to withdraw my profits from my funded account but the withdrawal button is not working. I\'ve tried multiple times over the past 2 days. Can you please help?',
          created_at: '2024-12-24T10:30:00Z',
          attachments: []
        },
        {
          id: 2,
          sender: 'admin',
          sender_name: 'Support Agent',
          content: 'Hi trader_pro, thank you for reaching out. I\'m sorry to hear you\'re experiencing issues with withdrawals. Let me look into your account and I\'ll get back to you shortly.',
          created_at: '2024-12-24T11:15:00Z',
          attachments: []
        },
        {
          id: 3,
          sender: 'user',
          sender_name: 'trader_pro',
          content: 'Thank you for looking into this. My account email is trader@example.com and I\'m trying to withdraw $2,500.',
          created_at: '2024-12-24T14:45:00Z',
          attachments: []
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim()) return

    setSending(true)
    try {
      await adminApi.replyToTicket(id, { content: replyText })
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'admin',
        sender_name: 'Admin',
        content: replyText,
        created_at: new Date().toISOString(),
        attachments: []
      }])
      setReplyText('')
      // Update ticket status if it was open
      if (ticket?.status === 'open') {
        setTicket(prev => ({ ...prev, status: 'in_progress' }))
      }
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setSending(false)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    try {
      await adminApi.updateTicketStatus(id, { status: newStatus })
      setTicket(prev => ({ ...prev, status: newStatus }))
      setShowCloseModal(false)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      open: { color: 'yellow', icon: AlertCircle, label: 'Open' },
      in_progress: { color: 'blue', icon: Clock, label: 'In Progress' },
      resolved: { color: 'green', icon: CheckCircle, label: 'Resolved' },
      closed: { color: 'gray', icon: XCircle, label: 'Closed' }
    }
    return configs[status] || configs.open
  }

  const getPriorityConfig = (priority) => {
    const configs = {
      low: { color: 'bg-gray-500/20 text-gray-400', label: 'Low' },
      medium: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Medium' },
      high: { color: 'bg-orange-500/20 text-orange-400', label: 'High' },
      urgent: { color: 'bg-red-500/20 text-red-400', label: 'Urgent' }
    }
    return configs[priority] || configs.medium
  }

  if (loading) {
    return (
      <AdminLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    )
  }

  if (!ticket) {
    return (
      <AdminLayout title="Ticket Not Found">
        <div className="text-center py-12">
          <p className="text-gray-400">Ticket not found</p>
          <button
            onClick={() => navigate('/admin/tickets')}
            className="mt-4 text-primary hover:underline"
          >
            Back to Tickets
          </button>
        </div>
      </AdminLayout>
    )
  }

  const statusConfig = getStatusConfig(ticket.status)
  const priorityConfig = getPriorityConfig(ticket.priority)

  return (
    <AdminLayout
      title={ticket.id}
      subtitle={ticket.subject}
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Support Tickets', href: '/admin/tickets' },
        { label: ticket.id }
      ]}
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/tickets')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Tickets
        </button>

        <div className="flex items-center gap-3">
          {ticket.status !== 'closed' && (
            <>
              <button
                onClick={() => handleUpdateStatus('resolved')}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                <CheckCircle size={18} />
                Mark Resolved
              </button>
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
              >
                <XCircle size={18} />
                Close Ticket
              </button>
            </>
          )}
          <button
            onClick={fetchTicketDetails}
            className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:text-white hover:bg-dark-300 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Conversation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Messages */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
            <div className="p-4 border-b border-dark-200">
              <h3 className="text-lg font-semibold text-white">Conversation</h3>
            </div>

            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.sender === 'admin' ? 'order-2' : 'order-1'}`}>
                    <div className={`rounded-xl p-4 ${
                      message.sender === 'admin'
                        ? 'bg-primary/20 text-white'
                        : 'bg-dark-200 text-white'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          message.sender === 'admin'
                            ? 'bg-primary text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {message.sender_name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{message.sender_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Box */}
            {ticket.status !== 'closed' && (
              <div className="p-4 border-t border-dark-200">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="w-full bg-dark-200 text-white rounded-lg px-4 py-3 border border-dark-300 focus:border-primary focus:outline-none resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleSendReply()
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Press Ctrl+Enter to send</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sending}
                      className="p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                    <button
                      className="p-3 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors"
                      title="Attach file"
                    >
                      <Paperclip size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Ticket Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <StatusBadge status={ticket.status.replace('_', ' ')} color={statusConfig.color} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Priority</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig.color}`}>
                  {priorityConfig.label}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Category</span>
                <span className="text-white capitalize">{ticket.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Created</span>
                <span className="text-white text-sm">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Last Update</span>
                <span className="text-white text-sm">
                  {new Date(ticket.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Customer</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {ticket.user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">{ticket.user?.username}</p>
                <p className="text-gray-400 text-sm">{ticket.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/admin/users/${ticket.user?.id}`)}
              className="w-full py-2 px-4 bg-dark-200 text-gray-400 rounded-lg hover:text-white hover:bg-dark-300 transition-colors text-sm"
            >
              View Profile
            </button>
          </div>

          {/* Assigned Agent */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Assigned To</h3>
            {ticket.assigned_to ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  {ticket.assigned_to.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-white">{ticket.assigned_to.username}</span>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-3">No agent assigned</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                >
                  <UserPlus size={18} />
                  Assign Agent
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors text-left">
                <Tag size={18} className="text-gray-400" />
                <span className="text-white text-sm">Change Priority</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors text-left">
                <User size={18} className="text-gray-400" />
                <span className="text-white text-sm">View User Activity</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Close Modal */}
      {showCloseModal && (
        <ConfirmationModal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          onConfirm={() => handleUpdateStatus('closed')}
          title="Close Ticket"
          message="Are you sure you want to close this ticket? The customer will be notified that their ticket has been closed."
          confirmText="Close Ticket"
          variant="warning"
        />
      )}
    </AdminLayout>
  )
}

export default TicketDetailPage
