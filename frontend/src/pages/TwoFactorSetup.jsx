import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { twoFactorAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  Shield,
  Loader2,
  CheckCircle,
  Copy,
  Download,
  ArrowRight,
  ArrowLeft,
  Key,
  Smartphone,
  AlertTriangle
} from 'lucide-react'

const TwoFactorSetup = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1: intro, 2: QR code, 3: verify, 4: backup codes, 5: complete
  const [loading, setLoading] = useState(false)
  const [setupData, setSetupData] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false)

  // Check if 2FA is already enabled
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await twoFactorAPI.getStatus()
        if (response.data.enabled) {
          toast.error('2FA is already enabled on your account')
          navigate('/dashboard/settings')
        }
      } catch (error) {
        console.error('Error checking 2FA status:', error)
      }
    }
    checkStatus()
  }, [navigate])

  const handleStartSetup = async () => {
    setLoading(true)
    try {
      const response = await twoFactorAPI.setup()
      setSetupData(response.data)
      setStep(2)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start 2FA setup')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    try {
      await twoFactorAPI.confirm(verificationCode)
      setStep(4) // Show backup codes
      toast.success('2FA verified successfully!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const copySecret = () => {
    navigator.clipboard.writeText(setupData?.secret || '')
    setCopiedSecret(true)
    toast.success('Secret key copied!')
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  const copyBackupCodes = () => {
    const codes = setupData?.backup_codes?.join('\n') || ''
    navigator.clipboard.writeText(codes)
    setCopiedBackupCodes(true)
    toast.success('Backup codes copied!')
    setTimeout(() => setCopiedBackupCodes(false), 2000)
  }

  const downloadBackupCodes = () => {
    const codes = setupData?.backup_codes?.join('\n') || ''
    const content = `TradeSense 2FA Backup Codes\n${'='.repeat(30)}\n\nKeep these codes safe. Each code can only be used once.\n\n${codes}\n\nGenerated: ${new Date().toISOString()}`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tradesense-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Backup codes downloaded!')
  }

  const handleComplete = () => {
    toast.success('2FA has been enabled on your account!')
    navigate('/dashboard/settings')
  }

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-dark-200 text-gray-500'
                }`}
              >
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 ${
                    step > s ? 'bg-primary-500' : 'bg-gray-200 dark:bg-dark-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl p-8">
          {/* Step 1: Introduction */}
          {step === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="text-primary-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Enable Two-Factor Authentication
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add an extra layer of security to your account by enabling 2FA.
                You'll need an authenticator app like Google Authenticator or Authy.
              </p>

              <div className="bg-gray-50 dark:bg-dark-200 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  How it works:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <Smartphone className="text-primary-500 mt-0.5" size={16} />
                    Scan a QR code with your authenticator app
                  </li>
                  <li className="flex items-start gap-2">
                    <Key className="text-primary-500 mt-0.5" size={16} />
                    Enter a 6-digit code to verify setup
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="text-primary-500 mt-0.5" size={16} />
                    Use the code when logging in for extra security
                  </li>
                </ul>
              </div>

              <button
                onClick={handleStartSetup}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Setting up...
                  </>
                ) : (
                  <>
                    Get Started
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: QR Code */}
          {step === 2 && setupData && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Scan QR Code
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Open your authenticator app and scan this QR code
              </p>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <img
                    src={setupData.qr_code}
                    alt="2FA QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* Manual entry */}
              <div className="bg-gray-50 dark:bg-dark-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Can't scan? Enter this key manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-dark-300 px-3 py-2 rounded-lg text-sm font-mono text-gray-900 dark:text-white break-all">
                    {setupData.secret}
                  </code>
                  <button
                    onClick={copySecret}
                    className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    {copiedSecret ? <CheckCircle size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all"
              >
                Continue
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* Step 3: Verify */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Verify Setup
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Enter the 6-digit code from your authenticator app
              </p>

              <form onSubmit={handleVerify}>
                <div className="mb-6">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setVerificationCode(value)
                    }}
                    className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 border-2 border-gray-200 dark:border-dark-200 rounded-xl focus:border-primary-500 focus:outline-none bg-white dark:bg-dark-200 text-gray-900 dark:text-white"
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-all"
                  >
                    <ArrowLeft size={20} />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify
                        <CheckCircle size={20} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Backup Codes */}
          {step === 4 && setupData && (
            <div>
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-yellow-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Save Your Backup Codes
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Store these codes safely. You can use them to access your account if you lose your phone.
              </p>

              {/* Backup codes grid */}
              <div className="bg-gray-50 dark:bg-dark-200 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  {setupData.backup_codes?.map((code, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-dark-300 px-3 py-2 rounded-lg font-mono text-sm text-center text-gray-900 dark:text-white"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={copyBackupCodes}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all"
                >
                  {copiedBackupCodes ? <CheckCircle size={18} /> : <Copy size={18} />}
                  Copy
                </button>
                <button
                  onClick={downloadBackupCodes}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-dark-200 hover:bg-gray-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all"
                >
                  <Download size={18} />
                  Download
                </button>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> Each backup code can only be used once.
                  Keep them somewhere safe and secure.
                </p>
              </div>

              <button
                onClick={handleComplete}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all"
              >
                Done
                <CheckCircle size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TwoFactorSetup
