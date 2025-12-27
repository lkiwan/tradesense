import { FileText, AlertTriangle, CheckCircle, XCircle, Info, Shield } from 'lucide-react'

const TradingRulesPage = () => {
  const rules = [
    { id: 1, title: 'Objectif de Profit', description: 'Atteindre 10% de profit pour passer la phase', icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
    { id: 2, title: 'Drawdown Maximum', description: 'Ne pas depasser 10% de perte maximale', icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
    { id: 3, title: 'Drawdown Journalier', description: 'Ne pas depasser 5% de perte par jour', icon: AlertTriangle, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
    { id: 4, title: 'Jours de Trading', description: 'Minimum 5 jours de trading actif', icon: Info, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
    { id: 5, title: 'Pas de Trading Weekend', description: 'Aucune position ouverte le weekend', icon: XCircle, color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30' },
    { id: 6, title: 'Pas de News Trading', description: 'Eviter de trader pendant les annonces majeures', icon: Info, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
            <FileText className="text-orange-400" size={24} />
          </div>
          Regles de Trading
        </h1>
        <p className="text-gray-400 mt-1">Respectez ces regles pour reussir votre challenge</p>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-500/10 backdrop-blur-xl rounded-xl border border-yellow-500/30 p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-yellow-500/20">
          <AlertTriangle className="text-yellow-400" size={18} />
        </div>
        <div>
          <h4 className="font-medium text-white mb-1">Important</h4>
          <p className="text-sm text-gray-400">
            Le non-respect de ces regles entrainera l'echec de votre challenge. Assurez-vous de bien les comprendre avant de commencer.
          </p>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map(rule => (
          <div key={rule.id} className="bg-dark-100/80 backdrop-blur-xl rounded-xl border border-white/5 p-5 hover:border-primary-500/30 transition-all duration-300 group">
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl ${rule.bgColor} border ${rule.borderColor} group-hover:scale-105 transition-transform`}>
                <rule.icon size={20} className={rule.color} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">{rule.title}</h3>
                <p className="text-sm text-gray-400">{rule.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Tip */}
      <div className="bg-primary-500/10 backdrop-blur-xl rounded-xl border border-primary-500/30 p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-primary-500/20">
          <Shield className="text-primary-400" size={18} />
        </div>
        <div>
          <h4 className="font-medium text-white mb-1">Conseil</h4>
          <p className="text-sm text-gray-400">
            Utilisez toujours un stop-loss et ne risquez jamais plus de 1-2% de votre capital par trade pour respecter facilement les regles de drawdown.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TradingRulesPage
