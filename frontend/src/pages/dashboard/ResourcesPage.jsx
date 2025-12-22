import { BookOpen, Play, FileText, Download, ExternalLink } from 'lucide-react'

const ResourcesPage = () => {
  const resources = [
    { id: 1, title: 'Guide du Debutant', type: 'pdf', category: 'Formation' },
    { id: 2, title: 'Strategies de Trading', type: 'video', category: 'Formation' },
    { id: 3, title: 'Analyse Technique', type: 'pdf', category: 'Technique' },
    { id: 4, title: 'Gestion du Risque', type: 'video', category: 'Risque' },
    { id: 5, title: 'Psychologie du Trading', type: 'pdf', category: 'Mental' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <BookOpen className="text-blue-400" size={24} />
          </div>
          Ressources
        </h1>
        <p className="text-gray-400 mt-1">Guides, videos et materiels de formation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map(resource => (
          <div key={resource.id} className="bg-dark-100 rounded-xl border border-dark-200 p-5 hover:border-primary-500/50 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${resource.type === 'video' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                {resource.type === 'video' ? (
                  <Play className="text-red-400" size={20} />
                ) : (
                  <FileText className="text-blue-400" size={20} />
                )}
              </div>
              <span className="text-xs text-gray-500 px-2 py-1 bg-dark-200 rounded">{resource.category}</span>
            </div>
            <h3 className="font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">{resource.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {resource.type === 'video' ? (
                <>
                  <Play size={14} />
                  <span>Regarder</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Telecharger PDF</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResourcesPage
