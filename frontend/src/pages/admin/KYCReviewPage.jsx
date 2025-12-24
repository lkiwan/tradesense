import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  Search,
  Filter,
  Loader2,
  Download,
  AlertTriangle,
  Calendar
} from 'lucide-react'

const KYCReviewPage = ({ embedded = false }) => {
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])
  const [stats, setStats] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selectedKYC, setSelectedKYC] = useState(null)
  const [viewingDoc, setViewingDoc] = useState(null)
  const [processing, setProcessing] = useState(false)

  // Review form
  const [reviewNotes, setReviewNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [newTier, setNewTier] = useState(2)

  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get(`/kyc/admin/pending?page=${page}&status=${statusFilter}`)
      setSubmissions(response.data.kyc_submissions)
      setTotalPages(response.data.pages)
    } catch (error) {
      console.error('Error loading KYC submissions:', error)
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  const loadStats = async () => {
    try {
      const response = await api.get('/kyc/admin/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  useEffect(() => {
    loadSubmissions()
    loadStats()
  }, [loadSubmissions])

  const loadKYCDetail = async (kycId) => {
    try {
      const response = await api.get(`/kyc/admin/${kycId}`)
      setSelectedKYC(response.data)
      setNewTier(response.data.kyc.current_tier + 1)
    } catch (error) {
      toast.error('Failed to load KYC details')
    }
  }

  const handleApprove = async () => {
    if (!selectedKYC) return
    setProcessing(true)

    try {
      await api.post(`/kyc/admin/${selectedKYC.kyc.id}/approve`, {
        tier: newTier,
        notes: reviewNotes
      })
      toast.success('KYC approved successfully')
      setSelectedKYC(null)
      setReviewNotes('')
      loadSubmissions()
      loadStats()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedKYC || !rejectionReason) {
      toast.error('Please provide a rejection reason')
      return
    }
    setProcessing(true)

    try {
      await api.post(`/kyc/admin/${selectedKYC.kyc.id}/reject`, {
        reason: rejectionReason
      })
      toast.success('KYC rejected')
      setSelectedKYC(null)
      setRejectionReason('')
      loadSubmissions()
      loadStats()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject')
    } finally {
      setProcessing(false)
    }
  }

  const viewDocument = async (kycId, docId) => {
    try {
      const response = await api.get(`/kyc/admin/${kycId}/document/${docId}`, {
        responseType: 'blob'
      })
      const url = URL.createObjectURL(response.data)
      setViewingDoc(url)
    } catch (error) {
      toast.error('Failed to load document')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      not_started: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
      under_review: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
      approved: { bg: 'bg-green-500/10', text: 'text-green-400' },
      rejected: { bg: 'bg-red-500/10', text: 'text-red-400' }
    }
    const style = styles[status] || styles.not_started
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${style.bg} ${style.text}`}>
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className={embedded ? "p-4" : "space-y-6"}>
      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/10">
                <Shield className="text-primary-400" size={24} />
              </div>
              KYC Review
            </h1>
            <p className="text-gray-400 mt-1">
              Review and approve user verification requests
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="text-yellow-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-xl font-bold text-white">{stats.status_counts.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Approved</p>
                <p className="text-xl font-bold text-white">{stats.status_counts.approved}</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle className="text-red-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Rejected</p>
                <p className="text-xl font-bold text-white">{stats.status_counts.rejected}</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-100 rounded-xl border border-dark-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FileText className="text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-xl font-bold text-white">{stats.total_submissions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-dark-100 border border-dark-200 rounded-lg text-white focus:outline-none focus:border-primary-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Submissions Table */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-200">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Tier</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Submitted</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Documents</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Loader2 className="animate-spin mx-auto text-primary-400" size={32} />
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  No submissions found
                </td>
              </tr>
            ) : (
              submissions.map((kyc) => (
                <tr key={kyc.id} className="hover:bg-dark-200/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">
                        {kyc.first_name} {kyc.last_name}
                      </p>
                      <p className="text-sm text-gray-400">User #{kyc.user_id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-primary-500/10 text-primary-400 text-sm rounded">
                      Tier {kyc.current_tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(kyc.status)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDate(kyc.submitted_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400">
                      {kyc.documents?.length || 0} files
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => loadKYCDetail(kyc.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg"
                    >
                      <Eye size={14} /> Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-200">
            <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-dark-200 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-dark-200 rounded-lg disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedKYC && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-xl border border-dark-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-100 border-b border-dark-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">KYC Review</h2>
              <button
                onClick={() => setSelectedKYC(null)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">User Information</h3>
                  <div className="space-y-2">
                    <p className="text-white"><strong>Username:</strong> {selectedKYC.user.username}</p>
                    <p className="text-white"><strong>Email:</strong> {selectedKYC.user.email}</p>
                    <p className="text-white"><strong>Registered:</strong> {formatDate(selectedKYC.user.created_at)}</p>
                    <p className="text-white">
                      <strong>Email Verified:</strong>{' '}
                      {selectedKYC.user.email_verified ? (
                        <span className="text-green-400">Yes</span>
                      ) : (
                        <span className="text-red-400">No</span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Personal Information</h3>
                  <div className="space-y-2">
                    <p className="text-white"><strong>Name:</strong> {selectedKYC.kyc.first_name} {selectedKYC.kyc.last_name}</p>
                    <p className="text-white"><strong>DOB:</strong> {selectedKYC.kyc.date_of_birth || '-'}</p>
                    <p className="text-white"><strong>Nationality:</strong> {selectedKYC.kyc.nationality || '-'}</p>
                    <p className="text-white"><strong>Phone:</strong> {selectedKYC.kyc.phone_number || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Address</h3>
                <p className="text-white">
                  {selectedKYC.kyc.address?.line_1 || '-'}
                  {selectedKYC.kyc.address?.line_2 && `, ${selectedKYC.kyc.address.line_2}`}
                  {selectedKYC.kyc.address?.city && `, ${selectedKYC.kyc.address.city}`}
                  {selectedKYC.kyc.address?.state_province && `, ${selectedKYC.kyc.address.state_province}`}
                  {selectedKYC.kyc.address?.postal_code && ` ${selectedKYC.kyc.address.postal_code}`}
                </p>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Documents</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedKYC.kyc.documents?.map((doc) => (
                    <div key={doc.id} className="bg-dark-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} className="text-primary-400" />
                        <span className="text-sm text-white font-medium">
                          {doc.document_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{doc.file_name}</p>
                      <button
                        onClick={() => viewDocument(selectedKYC.kyc.id, doc.id)}
                        className="mt-2 text-xs text-primary-400 hover:text-primary-300"
                      >
                        View Document
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Actions */}
              {selectedKYC.kyc.status === 'pending' && (
                <div className="border-t border-dark-200 pt-6 space-y-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Review Decision</h3>

                  {/* Approve Section */}
                  <div className="bg-green-500/5 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-green-400 font-medium mb-3">Approve Verification</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">New Tier</label>
                        <select
                          value={newTier}
                          onChange={(e) => setNewTier(parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white"
                        >
                          <option value={1}>Tier 1 - $500/month</option>
                          <option value={2}>Tier 2 - $5,000/month</option>
                          <option value={3}>Tier 3 - $25,000/month</option>
                          <option value={4}>Tier 4 - Unlimited</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
                        <input
                          type="text"
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Review notes..."
                          className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleApprove}
                      disabled={processing}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      {processing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                      Approve
                    </button>
                  </div>

                  {/* Reject Section */}
                  <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-4">
                    <h4 className="text-red-400 font-medium mb-3">Reject Verification</h4>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Rejection Reason *</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why the documents are being rejected..."
                        rows={3}
                        className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white resize-none"
                      />
                    </div>
                    <button
                      onClick={handleReject}
                      disabled={processing || !rejectionReason}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      {processing ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto">
            <button
              onClick={() => { setViewingDoc(null); URL.revokeObjectURL(viewingDoc); }}
              className="absolute top-2 right-2 p-2 bg-dark-100 rounded-full text-white hover:bg-dark-200"
            >
              <XCircle size={24} />
            </button>
            <img src={viewingDoc} alt="Document" className="max-w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}

export default KYCReviewPage
