import { useState, useEffect } from 'react'
import { Award, Download, Share2, CheckCircle, Trophy, Star, ExternalLink } from 'lucide-react'
import api from '../../services/api'
import { showSuccessToast, showErrorToast } from '../../utils/errorHandler'

const CertificatesPage = () => {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCertificates()
  }, [])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      const response = await api.get('/certificates')
      setCertificates(response.data?.certificates || [])
    } catch (error) {
      // Use mock data for development
      setCertificates([
        { id: 1, title: 'Challenge Phase 1 - Reussi', date: '15 Jan 2024', type: 'phase1', status: 'completed' },
        { id: 2, title: 'Trader Funde', date: '20 Jan 2024', type: 'funded', status: 'completed' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (certificate) => {
    try {
      const response = await api.get(`/certificates/${certificate.id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `certificate_${certificate.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      showSuccessToast('Certificate downloaded successfully')
    } catch (error) {
      showErrorToast('Failed to download certificate')
    }
  }

  const handleShare = async (certificate) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: certificate.title,
          text: `Check out my trading certificate: ${certificate.title}`,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        showSuccessToast('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const getCertificateIcon = (type) => {
    switch (type) {
      case 'phase1':
        return <CheckCircle className="text-green-400" size={28} />
      case 'phase2':
        return <Star className="text-yellow-400" size={28} />
      case 'funded':
        return <Trophy className="text-primary-400" size={28} />
      default:
        return <Award className="text-purple-400" size={28} />
    }
  }

  const getCertificateGradient = (type) => {
    switch (type) {
      case 'phase1':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30'
      case 'phase2':
        return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30'
      case 'funded':
        return 'from-primary-500/20 to-purple-500/20 border-primary-500/30'
      default:
        return 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <Award className="text-purple-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Certificats</h1>
          <p className="text-gray-400 text-sm">Vos certificats de reussite et accomplissements</p>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-primary-500/10 backdrop-blur-xl rounded-2xl border border-white/5 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <p className="text-3xl font-bold text-white">{certificates.filter(c => c.type === 'phase1').length}</p>
            <p className="text-sm text-gray-400">Phase 1 Completees</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Star className="text-yellow-400" size={24} />
            </div>
            <p className="text-3xl font-bold text-white">{certificates.filter(c => c.type === 'phase2').length}</p>
            <p className="text-sm text-gray-400">Phase 2 Completees</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <Trophy className="text-primary-400" size={24} />
            </div>
            <p className="text-3xl font-bold text-white">{certificates.filter(c => c.type === 'funded').length}</p>
            <p className="text-sm text-gray-400">Comptes Fundes</p>
          </div>
        </div>
      </div>

      {/* Certificates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
            <Award className="text-gray-500" size={40} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Aucun certificat</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Completez un challenge pour obtenir votre premier certificat. Chaque etape reussie vous rapproche de devenir un trader funde!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert, index) => (
            <div
              key={cert.id}
              className={`bg-gradient-to-br ${getCertificateGradient(cert.type)} backdrop-blur-xl rounded-2xl border p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                    {getCertificateIcon(cert.type)}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={20} />
                    <span className="text-xs text-green-400 font-medium">Verifie</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{cert.title}</h3>
                <p className="text-sm text-gray-400 mb-4">Obtenu le {cert.date}</p>

                {/* Certificate Preview (mock) */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 bg-gradient-to-br from-primary-500/30 to-purple-500/30 rounded-lg flex items-center justify-center">
                      <Award className="text-primary-400" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Certificat</p>
                      <p className="text-sm text-white font-medium">{cert.title}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(cert)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-primary-500/25"
                  >
                    <Download size={16} />
                    Telecharger
                  </button>
                  <button
                    onClick={() => handleShare(cert)}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all backdrop-blur-sm"
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all backdrop-blur-sm"
                  >
                    <ExternalLink size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-500/10 backdrop-blur-xl rounded-xl border border-blue-500/30 p-5 flex items-start gap-4">
        <div className="p-2 rounded-lg bg-blue-500/20 mt-0.5">
          <Award className="text-blue-400" size={20} />
        </div>
        <div>
          <h4 className="font-medium text-white mb-1">A propos des certificats</h4>
          <p className="text-sm text-gray-300">
            Chaque certificat est une preuve verifiable de vos accomplissements. Vous pouvez les telecharger en format PDF
            et les partager sur les reseaux sociaux pour mettre en valeur vos competences de trading.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CertificatesPage
