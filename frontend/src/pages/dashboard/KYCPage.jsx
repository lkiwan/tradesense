import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  AlertTriangle,
  ChevronRight,
  FileText,
  User,
  MapPin,
  CreditCard,
  Trash2,
  Loader2,
  Info,
  Lock
} from 'lucide-react'

const TIER_INFO = [
  { tier: 0, name: 'Unverified', limit: '$0/month', color: 'gray', requirements: ['Complete email verification'] },
  { tier: 1, name: 'Email Verified', limit: '$500/month', color: 'blue', requirements: ['Verify email address'] },
  { tier: 2, name: 'ID Verified', limit: '$5,000/month', color: 'green', requirements: ['Upload ID document', 'Take a selfie'] },
  { tier: 3, name: 'Address Verified', limit: '$25,000/month', color: 'purple', requirements: ['Upload proof of address'] },
  { tier: 4, name: 'Full KYC', limit: 'Unlimited', color: 'yellow', requirements: ['Enhanced due diligence'] }
]

const DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport', icon: FileText },
  { value: 'national_id', label: 'National ID Card', icon: CreditCard },
  { value: 'drivers_license', label: "Driver's License", icon: CreditCard },
  { value: 'utility_bill', label: 'Utility Bill', icon: FileText },
  { value: 'bank_statement', label: 'Bank Statement', icon: FileText },
  { value: 'selfie', label: 'Selfie Photo', icon: User },
  { value: 'selfie_with_id', label: 'Selfie with ID', icon: User }
]

const KYCPage = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [kycData, setKycData] = useState(null)
  const [emailVerified, setEmailVerified] = useState(false)
  const [activeStep, setActiveStep] = useState('status')
  const [uploadingDoc, setUploadingDoc] = useState(null)

  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    nationality: '',
    country_of_residence: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state_province: '',
    postal_code: '',
    id_type: '',
    id_number: '',
    id_expiry_date: '',
    id_issuing_country: '',
    phone_number: ''
  })

  const loadKYCStatus = useCallback(async () => {
    try {
      const response = await api.get('/kyc/status')
      setKycData(response.data.kyc)
      setEmailVerified(response.data.email_verified)

      // Pre-fill form data
      if (response.data.kyc) {
        const kyc = response.data.kyc
        setFormData({
          first_name: kyc.first_name || '',
          last_name: kyc.last_name || '',
          date_of_birth: kyc.date_of_birth || '',
          nationality: kyc.nationality || '',
          country_of_residence: kyc.country_of_residence || '',
          address_line_1: kyc.address?.line_1 || '',
          address_line_2: kyc.address?.line_2 || '',
          city: kyc.address?.city || '',
          state_province: kyc.address?.state_province || '',
          postal_code: kyc.address?.postal_code || '',
          id_type: kyc.id_type || '',
          id_number: kyc.id_number || '',
          id_expiry_date: kyc.id_expiry_date || '',
          id_issuing_country: kyc.id_issuing_country || '',
          phone_number: kyc.phone_number || ''
        })
      }
    } catch (error) {
      console.error('Error loading KYC status:', error)
      toast.error('Failed to load KYC status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadKYCStatus()
  }, [loadKYCStatus])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitInfo = async (submitForReview = false) => {
    setSubmitting(true)
    try {
      await api.post('/kyc/submit', {
        ...formData,
        submit_for_review: submitForReview
      })
      toast.success(submitForReview ? 'KYC submitted for review' : 'Information saved')
      loadKYCStatus()
      if (submitForReview) {
        setActiveStep('status')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save information')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = async (e, documentType, documentSide = 'front') => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB')
      return
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: PNG, JPG, GIF, WEBP, PDF')
      return
    }

    setUploadingDoc(documentType)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)
    formData.append('document_side', documentSide)

    try {
      await api.post('/kyc/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Document uploaded successfully')
      loadKYCStatus()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload document')
    } finally {
      setUploadingDoc(null)
    }
  }

  const handleDeleteDocument = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await api.delete(`/kyc/documents/${docId}`)
      toast.success('Document deleted')
      loadKYCStatus()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete document')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      not_started: { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: Clock },
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: Clock },
      under_review: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Clock },
      approved: { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle },
      rejected: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
      expired: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: AlertTriangle }
    }
    const style = styles[status] || styles.not_started
    const Icon = style.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
        <Icon size={14} />
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const getTierBadge = (tier) => {
    const info = TIER_INFO[tier] || TIER_INFO[0]
    const colorClasses = {
      gray: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
      blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      green: 'bg-green-500/10 text-green-400 border-green-500/30',
      purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${colorClasses[info.color]}`}>
        <Shield size={14} />
        Tier {tier} - {info.name}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary-400" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30">
              <Shield className="text-primary-400" size={20} />
            </div>
            KYC Verification
          </h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">
            Verify your identity to increase payout limits
          </p>
        </div>
        {kycData && getTierBadge(kycData.current_tier)}
      </div>

      {/* Current Status Card */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-semibold text-white mb-2">Verification Status</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              {getStatusBadge(kycData?.status)}
              <span className="text-gray-400 text-sm md:text-base">
                Monthly Limit: <span className="text-white font-medium">
                  {kycData?.payout_limit === null ? 'Unlimited' : `$${kycData?.payout_limit?.toLocaleString()}`}
                </span>
              </span>
            </div>
          </div>
          {kycData?.status === 'rejected' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 lg:max-w-sm">
              <p className="text-red-400 text-xs md:text-sm break-words">
                <strong>Rejection Reason:</strong> {kycData.rejection_reason}
              </p>
            </div>
          )}
        </div>

        {/* Tier Progress */}
        <div className="mt-4 md:mt-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Verification Tiers</h3>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="grid grid-cols-5 gap-1.5 md:gap-2 min-w-[500px] md:min-w-0">
              {TIER_INFO.map((tier) => (
                <div
                  key={tier.tier}
                  className={`relative p-2 md:p-3 rounded-lg border transition-all ${
                    kycData?.current_tier >= tier.tier
                      ? 'bg-primary-500/10 border-primary-500/30'
                      : 'bg-dark-200 border-dark-300'
                  }`}
                >
                  {kycData?.current_tier >= tier.tier && (
                    <CheckCircle className="absolute top-1.5 right-1.5 md:top-2 md:right-2 text-primary-400" size={12} />
                  )}
                  <p className={`text-xs md:text-sm font-medium ${kycData?.current_tier >= tier.tier ? 'text-primary-400' : 'text-gray-400'}`}>
                    Tier {tier.tier}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-1 truncate">{tier.limit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 md:gap-2 bg-dark-100/80 backdrop-blur-xl rounded-xl p-1 md:p-1.5 border border-white/5 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-1 md:gap-2 min-w-max mx-auto md:mx-0 md:w-full">
          {[
            { id: 'status', label: 'Status', icon: Shield },
            { id: 'personal', label: 'Personal Info', icon: User },
            { id: 'address', label: 'Address', icon: MapPin },
            { id: 'documents', label: 'Documents', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStep(tab.id)}
                className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 rounded-lg font-medium transition-all duration-300 whitespace-nowrap min-h-[44px] flex-1 md:flex-none text-xs md:text-sm ${
                  activeStep === tab.id
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
                }`}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5">
        {/* Status Tab */}
        {activeStep === 'status' && (
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            <h3 className="text-base md:text-lg font-semibold text-white">How to Upgrade Your Tier</h3>

            {/* Email Verification */}
            <div className={`p-3 md:p-4 rounded-xl border transition-all duration-300 ${emailVerified ? 'bg-green-500/10 border-green-500/30' : 'bg-dark-200/50 border-white/5 hover:border-primary-500/30'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  {emailVerified ? (
                    <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                  ) : (
                    <Clock className="text-gray-400 flex-shrink-0" size={20} />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm md:text-base">Email Verification</p>
                    <p className="text-xs md:text-sm text-gray-400">Unlocks Tier 1 ($500/month)</p>
                  </div>
                </div>
                {emailVerified ? (
                  <span className="text-green-400 text-sm">Verified</span>
                ) : (
                  <button className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg min-h-[44px] w-full sm:w-auto">
                    Verify Email
                  </button>
                )}
              </div>
            </div>

            {/* ID Verification */}
            <div className={`p-3 md:p-4 rounded-xl border transition-all duration-300 ${kycData?.current_tier >= 2 ? 'bg-green-500/10 border-green-500/30' : 'bg-dark-200/50 border-white/5 hover:border-primary-500/30'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  {kycData?.current_tier >= 2 ? (
                    <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                  ) : (
                    <CreditCard className="text-gray-400 flex-shrink-0" size={20} />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm md:text-base">ID Verification</p>
                    <p className="text-xs md:text-sm text-gray-400">Unlocks Tier 2 ($5,000/month)</p>
                  </div>
                </div>
                {kycData?.current_tier >= 2 ? (
                  <span className="text-green-400 text-sm">Verified</span>
                ) : (
                  <button
                    onClick={() => setActiveStep('documents')}
                    className="flex items-center justify-center gap-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg min-h-[44px] w-full sm:w-auto"
                  >
                    Upload Documents <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Address Verification */}
            <div className={`p-3 md:p-4 rounded-xl border transition-all duration-300 ${kycData?.current_tier >= 3 ? 'bg-green-500/10 border-green-500/30' : 'bg-dark-200/50 border-white/5 hover:border-primary-500/30'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  {kycData?.current_tier >= 3 ? (
                    <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                  ) : (
                    <MapPin className="text-gray-400 flex-shrink-0" size={20} />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm md:text-base">Address Verification</p>
                    <p className="text-xs md:text-sm text-gray-400">Unlocks Tier 3 ($25,000/month)</p>
                  </div>
                </div>
                {kycData?.current_tier >= 3 ? (
                  <span className="text-green-400 text-sm">Verified</span>
                ) : (
                  <button
                    onClick={() => setActiveStep('documents')}
                    className="flex items-center justify-center gap-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg min-h-[44px] w-full sm:w-auto"
                  >
                    Upload Proof <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-3 p-3 md:p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <Info className="text-blue-400 mt-0.5 flex-shrink-0" size={18} />
              <div className="min-w-0">
                <p className="text-blue-400 font-medium text-sm md:text-base">Why verify your identity?</p>
                <p className="text-xs md:text-sm text-gray-400 mt-1 break-words">
                  KYC verification is required to request payouts. Higher verification tiers allow you to withdraw more money each month.
                  Your documents are securely stored and only used for identity verification.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Personal Info Tab */}
        {activeStep === 'personal' && (
          <div className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm text-gray-400 mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-primary-500/50 transition-colors min-h-[48px]"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm text-gray-400 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-primary-500/50 transition-colors min-h-[48px]"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm text-gray-400 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-primary-500/50 transition-colors min-h-[48px]"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm text-gray-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="+1 234 567 8900"
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-primary-500/50 transition-colors min-h-[48px]"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm text-gray-400 mb-1">Nationality *</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-primary-500/50 transition-colors min-h-[48px]"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm text-gray-400 mb-1">Country of Residence *</label>
                <input
                  type="text"
                  name="country_of_residence"
                  value={formData.country_of_residence}
                  onChange={handleInputChange}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-primary-500/50 transition-colors min-h-[48px]"
                />
              </div>
            </div>

            <div className="mt-4 md:mt-6 flex justify-end">
              <button
                onClick={() => handleSubmitInfo(false)}
                disabled={submitting}
                className="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:scale-105 transition-all duration-300 disabled:opacity-50 min-h-[48px] w-full sm:w-auto text-sm md:text-base"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Save Information'}
              </button>
            </div>
          </div>
        )}

        {/* Address Tab */}
        {activeStep === 'address' && (
          <div className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm text-gray-400 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  name="address_line_1"
                  value={formData.address_line_1}
                  onChange={handleInputChange}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-primary-500/50 transition-colors min-h-[48px]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm text-gray-400 mb-1">Address Line 2</label>
                <input
                  type="text"
                  name="address_line_2"
                  value={formData.address_line_2}
                  onChange={handleInputChange}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-primary-500/50 transition-colors min-h-[48px]"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm text-gray-400 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-primary-500/50 transition-colors min-h-[48px]"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm text-gray-400 mb-1">State / Province</label>
                <input
                  type="text"
                  name="state_province"
                  value={formData.state_province}
                  onChange={handleInputChange}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-primary-500/50 transition-colors min-h-[48px]"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm text-gray-400 mb-1">Postal Code *</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-dark-200/50 border border-white/10 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-primary-500/50 transition-colors min-h-[48px]"
                />
              </div>
            </div>

            <div className="mt-4 md:mt-6 flex justify-end">
              <button
                onClick={() => handleSubmitInfo(false)}
                disabled={submitting}
                className="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:scale-105 transition-all duration-300 disabled:opacity-50 min-h-[48px] w-full sm:w-auto text-sm md:text-base"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Save Address'}
              </button>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeStep === 'documents' && (
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            <h3 className="text-base md:text-lg font-semibold text-white">Upload Documents</h3>

            {/* ID Document Section */}
            <div className="border border-white/10 rounded-xl p-3 md:p-4 bg-dark-200/30">
              <h4 className="font-medium text-white mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                <CreditCard size={16} className="text-primary-400 flex-shrink-0" />
                <span className="break-words">ID Document (Passport, National ID, or Driver's License)</span>
              </h4>
              <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4">
                Upload a clear photo of your government-issued ID. Both sides if it's an ID card.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Front Side */}
                <div className="border-2 border-dashed border-dark-300 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400 mb-2">Front Side</p>
                  {kycData?.documents?.find(d => d.document_type === 'id_document' && d.document_side === 'front') ? (
                    <div className="flex items-center justify-between bg-dark-200 rounded-lg p-3">
                      <span className="text-sm text-white truncate">
                        {kycData.documents.find(d => d.document_type === 'id_document' && d.document_side === 'front').file_name}
                      </span>
                      <button
                        onClick={() => handleDeleteDocument(kycData.documents.find(d => d.document_type === 'id_document' && d.document_side === 'front').id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'id_document', 'front')}
                        disabled={uploadingDoc === 'id_document'}
                      />
                      <div className="flex flex-col items-center gap-2 py-4">
                        {uploadingDoc === 'id_document' ? (
                          <Loader2 className="animate-spin text-primary-400" size={24} />
                        ) : (
                          <>
                            <Upload className="text-gray-400" size={24} />
                            <span className="text-sm text-primary-400">Click to upload</span>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </div>

                {/* Back Side */}
                <div className="border-2 border-dashed border-dark-300 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400 mb-2">Back Side (if applicable)</p>
                  {kycData?.documents?.find(d => d.document_type === 'id_document' && d.document_side === 'back') ? (
                    <div className="flex items-center justify-between bg-dark-200 rounded-lg p-3">
                      <span className="text-sm text-white truncate">
                        {kycData.documents.find(d => d.document_type === 'id_document' && d.document_side === 'back').file_name}
                      </span>
                      <button
                        onClick={() => handleDeleteDocument(kycData.documents.find(d => d.document_type === 'id_document' && d.document_side === 'back').id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'id_document', 'back')}
                      />
                      <div className="flex flex-col items-center gap-2 py-4">
                        <Upload className="text-gray-400" size={24} />
                        <span className="text-sm text-primary-400">Click to upload</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Selfie Section */}
            <div className="border border-white/10 rounded-xl p-3 md:p-4 bg-dark-200/30">
              <h4 className="font-medium text-white mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                <User size={16} className="text-primary-400 flex-shrink-0" />
                Selfie Verification
              </h4>
              <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4">
                Take a clear selfie holding your ID document next to your face.
              </p>

              <div className="border-2 border-dashed border-dark-300 rounded-lg p-4 text-center">
                {kycData?.documents?.find(d => d.document_type === 'selfie_with_id') ? (
                  <div className="flex items-center justify-between bg-dark-200 rounded-lg p-3">
                    <span className="text-sm text-white truncate">
                      {kycData.documents.find(d => d.document_type === 'selfie_with_id').file_name}
                    </span>
                    <button
                      onClick={() => handleDeleteDocument(kycData.documents.find(d => d.document_type === 'selfie_with_id').id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'selfie_with_id')}
                      disabled={uploadingDoc === 'selfie_with_id'}
                    />
                    <div className="flex flex-col items-center gap-2 py-4">
                      {uploadingDoc === 'selfie_with_id' ? (
                        <Loader2 className="animate-spin text-primary-400" size={24} />
                      ) : (
                        <>
                          <Upload className="text-gray-400" size={24} />
                          <span className="text-sm text-primary-400">Click to upload selfie</span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Proof of Address Section */}
            <div className="border border-white/10 rounded-xl p-3 md:p-4 bg-dark-200/30">
              <h4 className="font-medium text-white mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                <MapPin size={16} className="text-primary-400 flex-shrink-0" />
                Proof of Address
              </h4>
              <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4">
                Upload a utility bill or bank statement from the last 3 months showing your name and address.
              </p>

              <div className="border-2 border-dashed border-dark-300 rounded-lg p-4 text-center">
                {kycData?.documents?.find(d => d.document_type === 'proof_of_address') ? (
                  <div className="flex items-center justify-between bg-dark-200 rounded-lg p-3">
                    <span className="text-sm text-white truncate">
                      {kycData.documents.find(d => d.document_type === 'proof_of_address').file_name}
                    </span>
                    <button
                      onClick={() => handleDeleteDocument(kycData.documents.find(d => d.document_type === 'proof_of_address').id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'proof_of_address')}
                      disabled={uploadingDoc === 'proof_of_address'}
                    />
                    <div className="flex flex-col items-center gap-2 py-4">
                      {uploadingDoc === 'proof_of_address' ? (
                        <Loader2 className="animate-spin text-primary-400" size={24} />
                      ) : (
                        <>
                          <Upload className="text-gray-400" size={24} />
                          <span className="text-sm text-primary-400">Click to upload</span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Submit for Review Button */}
            {kycData?.status !== 'pending' && kycData?.status !== 'under_review' && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleSubmitInfo(true)}
                  disabled={submitting || !kycData?.documents?.length}
                  className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:scale-105 transition-all duration-300 disabled:opacity-50 min-h-[48px] w-full sm:w-auto text-sm md:text-base"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Shield size={18} />
                      Submit for Review
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Pending Review Notice */}
            {(kycData?.status === 'pending' || kycData?.status === 'under_review') && (
              <div className="flex items-start gap-3 p-3 md:p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <Clock className="text-yellow-400 mt-0.5 flex-shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="text-yellow-400 font-medium text-sm md:text-base">Verification in Progress</p>
                  <p className="text-xs md:text-sm text-gray-400 mt-1 break-words">
                    Your documents are being reviewed. This usually takes 1-2 business days.
                    You'll receive an email once the review is complete.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default KYCPage
