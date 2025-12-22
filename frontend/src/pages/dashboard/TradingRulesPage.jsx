import { FileText, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

const TradingRulesPage = () => {
  const rules = [
    { id: 1, title: 'Objectif de Profit', description: 'Atteindre 10% de profit pour passer la phase', icon: CheckCircle, color: 'text-green-400' },
    { id: 2, title: 'Drawdown Maximum', description: 'Ne pas depasser 10% de perte maximale', icon: AlertTriangle, color: 'text-red-400' },
    { id: 3, title: 'Drawdown Journalier', description: 'Ne pas depasser 5% de perte par jour', icon: AlertTriangle, color: 'text-orange-400' },
    { id: 4, title: 'Jours de Trading', description: 'Minimum 5 jours de trading actif', icon: Info, color: 'text-blue-400' },
    { id: 5, title: 'Pas de Trading Weekend', description: 'Aucune position ouverte le weekend', icon: XCircle, color: 'text-gray-400' },
    { id: 6, title: 'Pas de News Trading', description: 'Eviter de trader pendant les annonces majeures', icon: Info, color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <FileText className="text-orange-400" size={24} />
          </div>
          Regles de Trading
        </h1>
        <p className="text-gray-400 mt-1">Respectez ces regles pour reussir votre challenge</p>
      </div>

      <div className="bg-yellow-500/10 rounded-xl border border-yellow-500/20 p-4 flex items-start gap-3">
        <AlertTriangle className="text-yellow-400 mt-0.5" size={20} />
        <div>
          <h4 className="font-medium text-white mb-1">Important</h4>
          <p className="text-sm text-gray-400">
            Le non-respect de ces regles entrainera l'echec de votre challenge. Assurez-vous de bien les comprendre avant de commencer.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map(rule => (
          <div key={rule.id} className="bg-dark-100 rounded-xl border border-dark-200 p-5">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg bg-dark-200 ${rule.color}`}>
                <rule.icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{rule.title}</h3>
                <p className="text-sm text-gray-400">{rule.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TradingRulesPage
