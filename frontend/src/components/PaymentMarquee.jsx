import { Shield, CreditCard, Wallet, Bitcoin, Banknote, CheckCircle2 } from 'lucide-react'

const PaymentMarquee = () => {
    // Payment methods with icons as fallback
    const paymentMethods = [
        { name: 'Visa', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { name: 'Mastercard', color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { name: 'PayPal', color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { name: 'Bitcoin', color: 'text-orange-400', bg: 'bg-orange-400/10' },
        { name: 'Ethereum', color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { name: 'Apple Pay', color: 'text-gray-300', bg: 'bg-gray-500/10' },
        { name: 'Google Pay', color: 'text-green-400', bg: 'bg-green-400/10' },
        { name: 'Bank Transfer', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    ]

    // Trust badges
    const trustBadges = [
        { icon: Shield, text: 'SSL Secured', color: 'text-green-500' },
        { icon: CheckCircle2, text: '24h Payouts', color: 'text-primary-500' },
        { icon: Wallet, text: 'Instant Deposits', color: 'text-blue-500' },
    ]

    return (
        <section className="relative py-12 bg-gradient-to-b from-dark-400 via-dark-300 to-dark-400 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-primary-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Top Border Glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
            {/* Bottom Border Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Trust Badges Row */}
                <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
                    {trustBadges.map((badge, index) => {
                        const Icon = badge.icon
                        return (
                            <div
                                key={index}
                                className="flex items-center gap-2 px-4 py-2 bg-dark-200/50 backdrop-blur-sm rounded-full border border-white/5"
                            >
                                <Icon size={16} className={badge.color} />
                                <span className="text-sm font-medium text-gray-400">{badge.text}</span>
                            </div>
                        )
                    })}
                </div>

                {/* Section Title */}
                <div className="text-center mb-8">
                    <p className="text-xs font-bold text-primary-500 uppercase tracking-[0.3em] mb-2">
                        Trusted Worldwide
                    </p>
                    <h3 className="text-xl md:text-2xl font-semibold text-white">
                        Secure Payments & <span className="text-primary-500">Fast Withdrawals</span>
                    </h3>
                </div>

                {/* Payment Methods - Horizontal Marquee */}
                <div className="relative overflow-hidden">
                    {/* Fade Gradients */}
                    <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-dark-300 to-transparent z-10 pointer-events-none" />
                    <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-dark-300 to-transparent z-10 pointer-events-none" />

                    {/* Horizontal Scrolling Container */}
                    <div className="overflow-hidden whitespace-nowrap">
                        <div className="inline-flex animate-marquee items-center gap-6 py-4">
                            {[...paymentMethods, ...paymentMethods, ...paymentMethods].map((payment, index) => (
                                <div
                                    key={index}
                                    className={`inline-flex items-center gap-3 px-6 py-3 ${payment.bg} backdrop-blur-sm rounded-xl border border-white/5 hover:border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer group`}
                                >
                                    <div className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center ${payment.color}`}>
                                        {payment.name === 'Bitcoin' || payment.name === 'Ethereum' ? (
                                            <Bitcoin size={18} />
                                        ) : payment.name === 'Bank Transfer' ? (
                                            <Banknote size={18} />
                                        ) : (
                                            <CreditCard size={18} />
                                        )}
                                    </div>
                                    <span className={`text-sm font-semibold ${payment.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                                        {payment.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Stats - Horizontal */}
                <div className="flex flex-wrap items-center justify-center gap-8 mt-10 pt-8 border-t border-white/5">
                    <div className="text-center">
                        <p className="text-2xl md:text-3xl font-bold text-white">$2M+</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Paid to Traders</p>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-white/10" />
                    <div className="text-center">
                        <p className="text-2xl md:text-3xl font-bold text-primary-500">5 hrs</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Avg. Payout Time</p>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-white/10" />
                    <div className="text-center">
                        <p className="text-2xl md:text-3xl font-bold text-white">10,000+</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Happy Traders</p>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-white/10" />
                    <div className="text-center">
                        <p className="text-2xl md:text-3xl font-bold text-green-500">99.9%</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Success Rate</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default PaymentMarquee
