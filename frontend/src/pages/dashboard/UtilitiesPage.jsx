import { useState } from 'react'
import { FolderOpen, FileText, Download, Video, Image, Calculator, BookOpen, Settings, ExternalLink, Search, Filter } from 'lucide-react'

const UtilitiesPage = () => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = [
    { key: 'all', label: 'All Resources', icon: FolderOpen },
    { key: 'trading_guide', label: 'Trading Guides', icon: BookOpen },
    { key: 'platform_setup', label: 'Platform Setup', icon: Settings },
    { key: 'brand_assets', label: 'Brand Assets', icon: Image },
    { key: 'video', label: 'Videos', icon: Video },
    { key: 'tool', label: 'Tools', icon: Calculator }
  ]

  const resources = [
    { id: 1, title: 'Trading Plan Template', description: 'Professional trading plan template to structure your trading approach', category: 'trading_guide', type: 'pdf', size: '245 KB', downloads: 1234 },
    { id: 2, title: 'Risk Management Guide', description: 'Complete guide to managing risk in prop trading', category: 'trading_guide', type: 'pdf', size: '1.2 MB', downloads: 892 },
    { id: 3, title: 'MT5 Installation Guide', description: 'Step-by-step guide to install and configure MetaTrader 5', category: 'platform_setup', type: 'pdf', size: '3.5 MB', downloads: 2341 },
    { id: 4, title: 'MT5 for Windows', description: 'Download MetaTrader 5 trading platform for Windows', category: 'platform_setup', type: 'exe', size: '45 MB', downloads: 5678 },
    { id: 5, title: 'TradeSense Logo Pack', description: 'Official logos in various formats for funded traders', category: 'brand_assets', type: 'zip', size: '8.2 MB', downloads: 456 },
    { id: 6, title: 'Certificate Templates', description: 'Customizable certificate templates for your achievements', category: 'brand_assets', type: 'zip', size: '12 MB', downloads: 234 },
    { id: 7, title: 'Getting Started Video', description: 'Introduction to TradeSense platform and challenge rules', category: 'video', type: 'video', duration: '15:30', views: 4567 },
    { id: 8, title: 'Position Size Calculator', description: 'Excel spreadsheet for calculating optimal position sizes', category: 'tool', type: 'xlsx', size: '125 KB', downloads: 3456 },
    { id: 9, title: 'Trading Journal Template', description: 'Track and analyze your trades with this professional journal', category: 'tool', type: 'xlsx', size: '340 KB', downloads: 2890 }
  ]

  const filteredResources = resources.filter(r => {
    const matchesCategory = activeCategory === 'all' || r.category === activeCategory
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="text-red-400" size={24} />
      case 'video': return <Video className="text-purple-400" size={24} />
      case 'zip': return <FolderOpen className="text-yellow-400" size={24} />
      case 'xlsx': return <Calculator className="text-green-400" size={24} />
      case 'exe': return <Settings className="text-blue-400" size={24} />
      default: return <FileText className="text-gray-400" size={24} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-500/10">
            <FolderOpen className="text-primary-400" size={24} />
          </div>
          Files & Utilities
        </h1>
        <p className="text-gray-400 mt-1">Trading guides, platform setup files, brand assets, and useful tools</p>
      </div>

      {/* Categories & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-wrap gap-2 flex-1">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === cat.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-100 text-gray-400 hover:text-white'
              }`}
            >
              <cat.icon size={16} />
              {cat.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 bg-dark-100 border border-dark-200 rounded-lg pl-10 pr-4 py-2 text-white focus:border-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map(resource => (
          <div
            key={resource.id}
            className="bg-dark-100 rounded-xl border border-dark-200 p-5 hover:border-primary-500/30 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-dark-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {getFileIcon(resource.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{resource.title}</h3>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{resource.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-200">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {resource.type === 'video' ? (
                  <>
                    <span>{resource.duration}</span>
                    <span>•</span>
                    <span>{resource.views?.toLocaleString()} views</span>
                  </>
                ) : (
                  <>
                    <span className="uppercase">{resource.type}</span>
                    <span>•</span>
                    <span>{resource.size}</span>
                  </>
                )}
              </div>
              <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors">
                <Download size={14} />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="bg-dark-100 rounded-xl border border-dark-200 p-12 text-center">
          <FolderOpen className="mx-auto text-gray-500 mb-4" size={48} />
          <p className="text-gray-400">No resources found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your search or category filter</p>
        </div>
      )}

      {/* External Links */}
      <div className="bg-dark-100 rounded-xl border border-dark-200 p-6">
        <h3 className="font-semibold text-white mb-4">External Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://fundednext.com/symbols"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <ExternalLink className="text-primary-400" size={20} />
            <div>
              <p className="font-medium text-white">Trading Symbols</p>
              <p className="text-sm text-gray-400">View all available trading instruments</p>
            </div>
          </a>
          <a
            href="https://www.mql5.com/en/market/mt5/expert"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <ExternalLink className="text-primary-400" size={20} />
            <div>
              <p className="font-medium text-white">MT5 Expert Advisors</p>
              <p className="text-sm text-gray-400">Browse trading robots and indicators</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}

export default UtilitiesPage
