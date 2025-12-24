import { useState, useEffect } from 'react'
import {
  Calendar, Plus, Edit2, Trash2, Eye, BarChart3, Play, Pause,
  Loader2, Gift, Zap, Tag, Clock, Users, ChevronDown, Search,
  Copy, ExternalLink, AlertCircle, Check
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const EVENT_TYPES = [
  { value: 'flash_sale', label: 'Flash Sale', icon: Zap },
  { value: 'seasonal', label: 'Seasonal', icon: Calendar },
  { value: 'holiday', label: 'Holiday', icon: Gift },
  { value: 'anniversary', label: 'Anniversary', icon: Calendar },
  { value: 'launch', label: 'Launch', icon: Play },
  { value: 'bonus', label: 'Bonus', icon: Tag },
  { value: 'custom', label: 'Custom', icon: Gift }
]

const EVENT_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'scheduled', label: 'Scheduled', color: 'blue' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'paused', label: 'Paused', color: 'yellow' },
  { value: 'ended', label: 'Ended', color: 'gray' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' }
]

const EventsManagementPage = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    event_type: 'custom',
    start_date: '',
    end_date: '',
    banner_image: '',
    background_color: '#1a1a2e',
    accent_color: '#6366f1',
    text_color: '#ffffff',
    show_banner: true,
    show_countdown: true,
    has_landing_page: false,
    max_redemptions: '',
    max_per_user: 1
  })

  const [offerForm, setOfferForm] = useState({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    applies_to: 'all',
    promo_code: '',
    requires_code: false,
    bonus_points: '',
    bonus_days: '',
    max_redemptions: ''
  })

  useEffect(() => {
    fetchEvents()
  }, [filterStatus])

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)

      const response = await api.get(`/api/events/admin/list?${params}`)
      setEvents(response.data.events)
    } catch (error) {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async (eventId) => {
    try {
      const response = await api.get(`/api/events/admin/${eventId}/analytics`)
      setAnalytics(response.data)
    } catch (error) {
      toast.error('Failed to load analytics')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingEvent) {
        await api.put(`/api/events/admin/${editingEvent.id}`, formData)
        toast.success('Event updated successfully')
      } else {
        await api.post('/api/events/admin/create', formData)
        toast.success('Event created successfully')
      }

      setShowModal(false)
      resetForm()
      fetchEvents()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save event')
    }
  }

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await api.patch(`/api/events/admin/${eventId}/status`, { status: newStatus })
      toast.success(`Event status updated to ${newStatus}`)
      fetchEvents()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      await api.delete(`/api/events/admin/${eventId}`)
      toast.success('Event deleted')
      fetchEvents()
    } catch (error) {
      toast.error('Failed to delete event')
    }
  }

  const handleAddOffer = async (e) => {
    e.preventDefault()

    try {
      await api.post(`/api/events/admin/${selectedEvent.id}/offers`, offerForm)
      toast.success('Offer added successfully')
      setShowOfferModal(false)
      setOfferForm({
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        applies_to: 'all',
        promo_code: '',
        requires_code: false,
        bonus_points: '',
        bonus_days: '',
        max_redemptions: ''
      })
      fetchEvents()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add offer')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      short_description: '',
      event_type: 'custom',
      start_date: '',
      end_date: '',
      banner_image: '',
      background_color: '#1a1a2e',
      accent_color: '#6366f1',
      text_color: '#ffffff',
      show_banner: true,
      show_countdown: true,
      has_landing_page: false,
      max_redemptions: '',
      max_per_user: 1
    })
    setEditingEvent(null)
  }

  const openEditModal = (event) => {
    setEditingEvent(event)
    setFormData({
      ...event,
      start_date: event.start_date?.slice(0, 16) || '',
      end_date: event.end_date?.slice(0, 16) || ''
    })
    setShowModal(true)
  }

  const getStatusColor = (status) => {
    const statusObj = EVENT_STATUSES.find(s => s.value === status)
    const colors = {
      gray: 'bg-gray-500/20 text-gray-400',
      blue: 'bg-blue-500/20 text-blue-400',
      green: 'bg-green-500/20 text-green-400',
      yellow: 'bg-yellow-500/20 text-yellow-400',
      red: 'bg-red-500/20 text-red-400'
    }
    return colors[statusObj?.color] || colors.gray
  }

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <Calendar className="text-primary-500" size={24} />
            </div>
            Events & Promotions
          </h1>
          <p className="text-gray-400 mt-1">Manage seasonal events, flash sales, and promotions</p>
        </div>

        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition"
        >
          <Plus size={20} />
          Create Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2 bg-dark-100 border border-dark-200 rounded-lg text-white"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-dark-100 border border-dark-200 rounded-lg text-white"
        >
          <option value="">All Statuses</option>
          {EVENT_STATUSES.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Events List */}
      <div className="bg-dark-100 rounded-xl border border-dark-200">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Calendar className="mx-auto mb-4 opacity-50" size={48} />
            <p>No events found</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-200">
            {filteredEvents.map((event) => (
              <div key={event.id} className="p-4 hover:bg-dark-200/50 transition">
                <div className="flex items-start gap-4">
                  {/* Color preview */}
                  <div
                    className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{
                      backgroundColor: event.background_color,
                      color: event.accent_color
                    }}
                  >
                    {event.event_type === 'flash_sale' ? <Zap size={24} /> : <Gift size={24} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{event.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 truncate mb-2">{event.short_description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag size={14} />
                        {event.offers?.length || 0} offers
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {event.current_redemptions} redemptions
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {event.views} views
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {event.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(event.id, 'scheduled')}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                        title="Schedule"
                      >
                        <Play size={18} />
                      </button>
                    )}

                    {event.status === 'scheduled' && (
                      <button
                        onClick={() => handleStatusChange(event.id, 'active')}
                        className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition"
                        title="Activate"
                      >
                        <Play size={18} />
                      </button>
                    )}

                    {event.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(event.id, 'paused')}
                        className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition"
                        title="Pause"
                      >
                        <Pause size={18} />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedEvent(event)
                        fetchAnalytics(event.id)
                      }}
                      className="p-2 text-gray-400 hover:bg-dark-200 rounded-lg transition"
                      title="Analytics"
                    >
                      <BarChart3 size={18} />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowOfferModal(true)
                      }}
                      className="p-2 text-gray-400 hover:bg-dark-200 rounded-lg transition"
                      title="Add Offer"
                    >
                      <Plus size={18} />
                    </button>

                    <button
                      onClick={() => openEditModal(event)}
                      className="p-2 text-gray-400 hover:bg-dark-200 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>

                    <a
                      href={`/promo/${event.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:bg-dark-200 rounded-lg transition"
                      title="View Page"
                    >
                      <ExternalLink size={18} />
                    </a>

                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Offers preview */}
                {event.offers && event.offers.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 ml-20">
                    {event.offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="px-3 py-1 bg-dark-200 rounded-lg text-sm flex items-center gap-2"
                      >
                        <Tag size={12} className="text-primary-400" />
                        <span className="text-gray-300">{offer.name}</span>
                        <span className="text-primary-400 font-medium">
                          {offer.discount_type === 'percentage'
                            ? `${offer.discount_value}%`
                            : `$${offer.discount_value}`
                          }
                        </span>
                        {offer.promo_code && (
                          <code className="text-xs bg-dark-300 px-1 rounded">{offer.promo_code}</code>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Event Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Event Type</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white"
                  >
                    {EVENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    value={formData.max_redemptions}
                    onChange={(e) => setFormData({ ...formData, max_redemptions: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Short Description</label>
                  <input
                    type="text"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Brief description for banners"
                    className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Full Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white"
                  />
                </div>

                {/* Colors */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="col-span-2 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_banner}
                      onChange={(e) => setFormData({ ...formData, show_banner: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-gray-300">Show Banner</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_countdown}
                      onChange={(e) => setFormData({ ...formData, show_countdown: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-gray-300">Show Countdown</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_landing_page}
                      onChange={(e) => setFormData({ ...formData, has_landing_page: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-gray-300">Has Landing Page</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 py-2 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Offer Modal */}
      {showOfferModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-2">Add Offer</h2>
            <p className="text-gray-400 text-sm mb-6">Add an offer to "{selectedEvent.name}"</p>

            <form onSubmit={handleAddOffer} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Offer Name</label>
                <input
                  type="text"
                  value={offerForm.name}
                  onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Discount Type</label>
                  <select
                    value={offerForm.discount_type}
                    onChange={(e) => setOfferForm({ ...offerForm, discount_type: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    {offerForm.discount_type === 'percentage' ? 'Discount %' : 'Discount $'}
                  </label>
                  <input
                    type="number"
                    value={offerForm.discount_value}
                    onChange={(e) => setOfferForm({ ...offerForm, discount_value: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Applies To</label>
                <select
                  value={offerForm.applies_to}
                  onChange={(e) => setOfferForm({ ...offerForm, applies_to: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white"
                >
                  <option value="all">All Products</option>
                  <option value="challenge">Challenges Only</option>
                  <option value="subscription">Subscriptions Only</option>
                  <option value="addon">Add-ons Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Promo Code (optional)</label>
                <input
                  type="text"
                  value={offerForm.promo_code}
                  onChange={(e) => setOfferForm({ ...offerForm, promo_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SAVE20"
                  className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white uppercase"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offerForm.requires_code}
                  onChange={(e) => setOfferForm({ ...offerForm, requires_code: e.target.checked })}
                  className="rounded"
                />
                <span className="text-gray-300 text-sm">Requires code entry</span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bonus Points</label>
                  <input
                    type="number"
                    value={offerForm.bonus_points}
                    onChange={(e) => setOfferForm({ ...offerForm, bonus_points: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bonus Days</label>
                  <input
                    type="number"
                    value={offerForm.bonus_days}
                    onChange={(e) => setOfferForm({ ...offerForm, bonus_days: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2 bg-dark-200 border border-dark-200 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 py-2 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
                >
                  Add Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {analytics && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold text-white mb-2">Event Analytics</h2>
            <p className="text-gray-400 text-sm mb-6">{selectedEvent.name}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-dark-200 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">{analytics.views}</p>
                <p className="text-sm text-gray-400">Views</p>
              </div>
              <div className="bg-dark-200 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">{analytics.clicks}</p>
                <p className="text-sm text-gray-400">Clicks</p>
              </div>
              <div className="bg-dark-200 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">{analytics.total_redemptions}</p>
                <p className="text-sm text-gray-400">Redemptions</p>
              </div>
              <div className="bg-dark-200 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-400">${analytics.total_revenue?.toFixed(2)}</p>
                <p className="text-sm text-gray-400">Revenue</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Click Rate</span>
                <span className="text-white">{analytics.click_rate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Conversion Rate</span>
                <span className="text-white">{analytics.conversion_rate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Unique Users</span>
                <span className="text-white">{analytics.unique_users}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Savings Given</span>
                <span className="text-yellow-400">${analytics.total_savings_given?.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setAnalytics(null)
                setSelectedEvent(null)
              }}
              className="w-full py-2 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventsManagementPage
