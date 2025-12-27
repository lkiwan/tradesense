import { BookOpen, Play, FileText, Download, ExternalLink, Video, Book, Brain, TrendingUp, Shield } from 'lucide-react'

const ResourcesPage = () => {
  const resources = [
    { id: 1, title: 'Guide du Debutant', type: 'pdf', category: 'Formation', icon: Book },
    { id: 2, title: 'Strategies de Trading', type: 'video', category: 'Formation', icon: TrendingUp },
    { id: 3, title: 'Analyse Technique', type: 'pdf', category: 'Technique', icon: FileText },
    { id: 4, title: 'Gestion du Risque', type: 'video', category: 'Risque', icon: Shield },
    { id: 5, title: 'Psychologie du Trading', type: 'pdf', category: 'Mental', icon: Brain },
  ]

  const categoryColors = {
    'Formation': { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/30' },
    'Technique': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    'Risque': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    'Mental': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
            <BookOpen className="text-blue-400" size={24} />
          </div>
          Ressources
        </h1>
        <p className="text-gray-400 mt-1">Guides, videos et materiels de formation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Documents</p>
              <p className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">3 PDFs</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-red-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Video size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Videos</p>
              <p className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">2 Videos</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-100/80 backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:border-green-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <BookOpen size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Categories</p>
              <p className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">4 Types</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map(resource => {
          const catColors = categoryColors[resource.category] || categoryColors['Formation']
          const ResourceIcon = resource.icon

          return (
            <div key={resource.id} className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-5 hover:border-primary-500/30 transition-all duration-300 cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${resource.type === 'video' ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30' : 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30'} group-hover:scale-105 transition-transform`}>
                  {resource.type === 'video' ? (
                    <Play className="text-red-400" size={20} />
                  ) : (
                    <FileText className="text-blue-400" size={20} />
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg ${catColors.bg} ${catColors.text} border ${catColors.border}`}>
                  {resource.category}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-3 group-hover:text-primary-400 transition-colors">{resource.title}</h3>
              <div className="flex items-center gap-2 text-sm">
                {resource.type === 'video' ? (
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/20 transition-colors">
                    <Play size={14} />
                    <span>Regarder</span>
                  </button>
                ) : (
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-colors">
                    <Download size={14} />
                    <span>Telecharger</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ResourcesPage
