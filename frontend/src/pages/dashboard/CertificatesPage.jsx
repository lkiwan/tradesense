import { Award, Download, Share2, CheckCircle } from 'lucide-react'

const CertificatesPage = () => {
  const certificates = [
    { id: 1, title: 'Challenge Phase 1 - Reussi', date: '15 Jan 2024', type: 'phase1' },
    { id: 2, title: 'Trader Funde', date: '20 Jan 2024', type: 'funded' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Award className="text-purple-400" size={24} />
          </div>
          Certificats
        </h1>
        <p className="text-gray-400 mt-1">Vos certificats de reussite et accomplissements</p>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-12 text-center">
          <Award className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-bold text-white mb-2">Aucun certificat</h3>
          <p className="text-gray-400">Completez un challenge pour obtenir votre premier certificat</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map(cert => (
            <div key={cert.id} className="bg-dark-100 rounded-xl border border-dark-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20">
                  <Award className="text-primary-400" size={32} />
                </div>
                <CheckCircle className="text-green-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{cert.title}</h3>
              <p className="text-sm text-gray-400 mb-4">Obtenu le {cert.date}</p>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
                  <Download size={16} />
                  Telecharger
                </button>
                <button className="p-2 bg-dark-200 hover:bg-dark-300 text-gray-400 hover:text-white rounded-lg transition-colors">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CertificatesPage
