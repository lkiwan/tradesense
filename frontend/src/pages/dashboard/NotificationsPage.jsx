import { Bell, Check, Trash2, Settings, AlertCircle, TrendingUp, Gift, Info } from 'lucide-react'

const NotificationsPage = () => {
  const notifications = [
    { id: 1, type: 'alert', title: 'Drawdown a 7%', message: 'Attention, vous approchez de la limite de drawdown', time: '5 min', read: false },
    { id: 2, type: 'success', title: 'Trade Ferme', message: 'AAPL Long ferme avec +$125 de profit', time: '1h', read: false },
    { id: 3, type: 'promo', title: 'Offre Speciale', message: 'Profitez de 20% de reduction sur votre prochain challenge', time: '3h', read: true },
    { id: 4, type: 'info', title: 'Signal IA', message: 'Nouveau signal de vente sur BTC-USD avec 85% de confiance', time: '5h', read: true },
    { id: 5, type: 'success', title: 'Phase 1 Reussie', message: 'Felicitations! Vous passez a la phase 2', time: '1j', read: true },
  ]

  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert': return { icon: AlertCircle, bg: 'bg-red-500/10', color: 'text-red-400' }
      case 'success': return { icon: TrendingUp, bg: 'bg-green-500/10', color: 'text-green-400' }
      case 'promo': return { icon: Gift, bg: 'bg-pink-500/10', color: 'text-pink-400' }
      case 'info': return { icon: Info, bg: 'bg-blue-500/10', color: 'text-blue-400' }
      default: return { icon: Bell, bg: 'bg-gray-500/10', color: 'text-gray-400' }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <Bell className="text-primary-400" size={24} />
            </div>
            Notifications
          </h1>
          <p className="text-gray-400 mt-1">Restez informe de votre activite de trading</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-400 hover:text-white transition-colors">
            <Check size={18} />
            Tout marquer lu
          </button>
          <button className="p-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-400 hover:text-white transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="bg-dark-100 rounded-xl border border-dark-200 overflow-hidden">
        <div className="divide-y divide-dark-200">
          {notifications.map(notif => {
            const typeConfig = getTypeIcon(notif.type)
            return (
              <div key={notif.id} className={`p-4 flex items-start gap-4 hover:bg-dark-200/30 transition-colors ${!notif.read ? 'bg-dark-200/20' : ''}`}>
                <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
                  <typeConfig.icon className={typeConfig.color} size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{notif.title}</h4>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{notif.message}</p>
                  <span className="text-xs text-gray-500 mt-2 block">{notif.time}</span>
                </div>
                <button className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
