import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Video,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Users,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Radio,
  CheckCircle,
  X,
  Save,
  Upload,
  Link as LinkIcon,
  Loader2,
  Download
} from 'lucide-react';

const STATUS_STYLES = {
  draft: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  live: 'bg-red-500/10 text-red-400 border-red-500/30',
  completed: 'bg-green-500/10 text-green-400 border-green-500/30',
  cancelled: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
};

const CATEGORIES = {
  trading_basics: 'Trading Basics',
  technical_analysis: 'Technical Analysis',
  fundamental_analysis: 'Fundamental Analysis',
  risk_management: 'Risk Management',
  psychology: 'Trading Psychology',
  platform_tutorial: 'Platform Tutorial',
  market_analysis: 'Market Analysis',
  qa_session: 'Q&A Session',
  special_event: 'Special Event'
};

const WebinarManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState(null);
  const [showRegistrations, setShowRegistrations] = useState(null);
  const [registrations, setRegistrations] = useState([]);

  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    loadWebinars();
  }, [currentPage, statusFilter]);

  const loadWebinars = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, per_page: 10 };
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/api/webinars/admin/webinars', { params });
      setWebinars(response.data.webinars || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Failed to load webinars:', error);
      toast.error('Failed to load webinars');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (webinarId) => {
    if (!confirm('Are you sure you want to delete this webinar?')) return;

    try {
      await api.delete(`/api/webinars/admin/webinars/${webinarId}`);
      toast.success('Webinar deleted');
      loadWebinars();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  const handleStartWebinar = async (webinarId) => {
    try {
      await api.post(`/api/webinars/admin/webinars/${webinarId}/start`);
      toast.success('Webinar started!');
      loadWebinars();
    } catch (error) {
      toast.error('Failed to start webinar');
    }
  };

  const handleEndWebinar = async (webinarId) => {
    const recordingUrl = prompt('Enter recording URL (optional):');
    try {
      await api.post(`/api/webinars/admin/webinars/${webinarId}/end`, {
        recording_url: recordingUrl || undefined
      });
      toast.success('Webinar ended');
      loadWebinars();
    } catch (error) {
      toast.error('Failed to end webinar');
    }
  };

  const loadRegistrations = async (webinarId) => {
    try {
      const response = await api.get(`/api/webinars/admin/webinars/${webinarId}/registrations`);
      setRegistrations(response.data.registrations || []);
      setShowRegistrations(webinarId);
    } catch (error) {
      toast.error('Failed to load registrations');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Video className="h-7 w-7 text-purple-400" />
            Webinar Management
          </h1>
          <p className="text-gray-400 mt-1">Manage live webinars and recordings</p>
        </div>
        <button
          onClick={() => {
            setEditingWebinar(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium"
        >
          <Plus className="h-5 w-5" />
          Create Webinar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search webinars..."
              className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Webinars Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
          </div>
        ) : webinars.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No webinars found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-700">
                <th className="text-left px-6 py-3 text-gray-400 font-medium">Webinar</th>
                <th className="text-left px-6 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-6 py-3 text-gray-400 font-medium">Schedule</th>
                <th className="text-left px-6 py-3 text-gray-400 font-medium">Registrations</th>
                <th className="text-right px-6 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {webinars.map(webinar => (
                <tr key={webinar.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {webinar.thumbnail ? (
                        <img
                          src={webinar.thumbnail}
                          alt=""
                          className="w-16 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-gray-700 rounded flex items-center justify-center">
                          <Video className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-white font-medium line-clamp-1">{webinar.title}</h3>
                        <p className="text-gray-500 text-sm">{webinar.host?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_STYLES[webinar.status] || STATUS_STYLES.draft}`}>
                      {webinar.status === 'live' && <Radio className="inline h-3 w-3 mr-1 animate-pulse" />}
                      {webinar.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-300 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {formatDate(webinar.scheduled_at)}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="h-4 w-4" />
                        {webinar.duration_minutes} min
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => loadRegistrations(webinar.id)}
                      className="flex items-center gap-2 text-gray-400 hover:text-white"
                    >
                      <Users className="h-4 w-4" />
                      <span>{webinar.registration_count}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {webinar.status === 'scheduled' && (
                        <button
                          onClick={() => handleStartWebinar(webinar.id)}
                          className="p-2 bg-green-600/20 rounded-lg text-green-400 hover:bg-green-600/30"
                          title="Start Live"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {webinar.status === 'live' && (
                        <button
                          onClick={() => handleEndWebinar(webinar.id)}
                          className="p-2 bg-red-600/20 rounded-lg text-red-400 hover:bg-red-600/30"
                          title="End Webinar"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingWebinar(webinar);
                          setShowModal(true);
                        }}
                        className="p-2 bg-gray-700 rounded-lg text-gray-400 hover:text-purple-400"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(webinar.id)}
                        className="p-2 bg-gray-700 rounded-lg text-gray-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-gray-400 text-sm">
            Page {currentPage} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSearchParams({ page: currentPage - 1 })}
              disabled={!pagination.has_prev}
              className="flex items-center gap-1 px-3 py-2 bg-gray-800 rounded-lg text-gray-300 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setSearchParams({ page: currentPage + 1 })}
              disabled={!pagination.has_next}
              className="flex items-center gap-1 px-3 py-2 bg-gray-800 rounded-lg text-gray-300 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <WebinarModal
          webinar={editingWebinar}
          onClose={() => {
            setShowModal(false);
            setEditingWebinar(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingWebinar(null);
            loadWebinars();
          }}
        />
      )}

      {/* Registrations Modal */}
      {showRegistrations && (
        <RegistrationsModal
          registrations={registrations}
          onClose={() => setShowRegistrations(null)}
        />
      )}
    </div>
  );
};

// Webinar Create/Edit Modal
const WebinarModal = ({ webinar, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: webinar?.title || '',
    description: webinar?.description || '',
    short_description: webinar?.short_description || '',
    host_name: webinar?.host?.name || '',
    host_title: webinar?.host?.title || '',
    host_bio: webinar?.host?.bio || '',
    scheduled_at: webinar?.scheduled_at ? new Date(webinar.scheduled_at).toISOString().slice(0, 16) : '',
    duration_minutes: webinar?.duration_minutes || 60,
    timezone: webinar?.timezone || 'UTC',
    status: webinar?.status || 'draft',
    category: webinar?.category || 'trading_basics',
    thumbnail: webinar?.thumbnail || '',
    platform: webinar?.platform || 'zoom',
    join_url: webinar?.join_url || '',
    meeting_id: webinar?.meeting_id || '',
    meeting_password: webinar?.meeting_password || '',
    is_free: webinar?.is_free !== false,
    price: webinar?.price || 0,
    max_attendees: webinar?.max_attendees || 500,
    has_recording: webinar?.has_recording || false,
    recording_url: webinar?.recording_url || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (webinar) {
        await api.put(`/api/webinars/admin/webinars/${webinar.id}`, formData);
        toast.success('Webinar updated');
      } else {
        await api.post('/api/webinars/admin/webinars', formData);
        toast.success('Webinar created');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save webinar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {webinar ? 'Edit Webinar' : 'Create New Webinar'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white h-32"
            />
          </div>

          {/* Host Info */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-white font-medium mb-4">Host Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Host Name *</label>
                <input
                  type="text"
                  value={formData.host_name}
                  onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Host Title</label>
                <input
                  type="text"
                  value={formData.host_title}
                  onChange={(e) => setFormData({ ...formData, host_title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="e.g., Senior Trading Analyst"
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-white font-medium mb-4">Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  min={15}
                  max={480}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Meeting Details */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-white font-medium mb-4">Meeting Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="zoom">Zoom</option>
                  <option value="google_meet">Google Meet</option>
                  <option value="youtube_live">YouTube Live</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Max Attendees</label>
                <input
                  type="number"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Join URL</label>
                <input
                  type="url"
                  value={formData.join_url}
                  onChange={(e) => setFormData({ ...formData, join_url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-white font-medium mb-4">Media</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Thumbnail URL</label>
              <input
                type="url"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Recording */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-white font-medium mb-4">Recording</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_recording}
                  onChange={(e) => setFormData({ ...formData, has_recording: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 text-purple-600"
                />
                <span className="text-gray-300">Has Recording Available</span>
              </label>
              {formData.has_recording && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Recording URL</label>
                  <input
                    type="url"
                    value={formData.recording_url}
                    onChange={(e) => setFormData({ ...formData, recording_url: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg text-white font-medium"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {webinar ? 'Update Webinar' : 'Create Webinar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Registrations Modal
const RegistrationsModal = ({ registrations, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Registrations ({registrations.length})
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {registrations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No registrations yet
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-400 font-medium">User</th>
                  <th className="text-left px-6 py-3 text-gray-400 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-gray-400 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(reg => (
                  <tr key={reg.id} className="border-b border-gray-700/50">
                    <td className="px-6 py-3">
                      <div>
                        <div className="text-white">{reg.user?.username}</div>
                        <div className="text-gray-500 text-sm">{reg.user?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        reg.status === 'attended' ? 'bg-green-600/20 text-green-400' :
                        reg.status === 'no_show' ? 'bg-red-600/20 text-red-400' :
                        'bg-gray-600/20 text-gray-400'
                      }`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-sm">
                      {new Date(reg.registered_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-between items-center">
          <button
            onClick={() => {
              // Export to CSV
              const csv = registrations.map(r =>
                `${r.user?.username},${r.user?.email},${r.status},${r.registered_at}`
              ).join('\n');
              const blob = new Blob([`Username,Email,Status,Registered At\n${csv}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'registrations.csv';
              a.click();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebinarManagementPage;
