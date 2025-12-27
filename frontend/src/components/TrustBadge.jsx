import { Star } from 'lucide-react'

const TrustBadge = ({ className = '', theme = 'dark' }) => {
    const isDark = theme === 'dark'

    return (
        <div className={`flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl sm:rounded-full border transition-all cursor-pointer group ${isDark
                ? 'bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/50'
                : 'bg-white/80 backdrop-blur-md border-gray-200 hover:bg-white'
            } ${className}`}>

            {/* Top row on mobile: Stars + Rating */}
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1">
                    <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Excellent</span>
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className="sm:w-4 sm:h-4 text-green-500 fill-green-500" />
                        ))}
                    </div>
                </div>

                <div className={`hidden sm:block w-px h-5 ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />

                <div className="flex items-center gap-1 sm:gap-2">
                    <span className={`font-semibold text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>4.9</span>
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs sm:text-sm`}>2,847 avis</span>
                </div>
            </div>

            {/* Bottom row on mobile: Trustpilot */}
            <div className="flex items-center gap-1">
                <Star size={12} className="sm:w-[14px] sm:h-[14px] text-green-500 fill-green-500" />
                <span className="text-green-500 text-xs sm:text-sm font-medium">Trustpilot</span>
            </div>
        </div>
    )
}

export default TrustBadge
