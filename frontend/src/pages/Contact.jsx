import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Mail, Phone, MapPin, Send, MessageCircle,
  Clock, CheckCircle2, HelpCircle, Users, FileText,
  ArrowRight, Sparkles, Globe, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

const Contact = () => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'partnership', label: 'Partnership Inquiry' },
    { value: 'feedback', label: 'Feedback & Suggestions' }
  ]

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Get a response within 24 hours',
      value: 'support@tradesense.com',
      action: 'mailto:support@tradesense.com',
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
      hoverBorder: 'hover:border-blue-500/30',
      hoverShadow: 'hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)]'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Available 24/7',
      value: 'Start a conversation',
      action: '#',
      color: 'text-green-400',
      bg: 'bg-green-500/20',
      hoverBorder: 'hover:border-green-500/30',
      hoverShadow: 'hover:shadow-[0_20px_50px_rgba(34,197,94,0.15)]'
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Mon-Fri, 9am-6pm CET',
      value: '+212 XXX XXX XXX',
      action: 'tel:+212000000000',
      color: 'text-purple-400',
      bg: 'bg-purple-500/20',
      hoverBorder: 'hover:border-purple-500/30',
      hoverShadow: 'hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)]'
    }
  ]

  const offices = [
    {
      city: 'Casablanca',
      country: 'Morocco',
      address: 'Twin Center, Boulevard Zerktouni',
      flag: '🇲🇦'
    },
    {
      city: 'Dubai',
      country: 'UAE',
      address: 'Dubai Marina, JBR',
      flag: '🇦🇪'
    }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))

    toast.success('Message sent successfully! We\'ll get back to you soon.')
    setFormData({
      name: '',
      email: '',
      subject: '',
      category: 'general',
      message: ''
    })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-dark-400">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-8 animate-float">
            <Mail className="text-primary-400" size={18} />
            <span className="text-primary-300 text-sm font-medium">Contact Us</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Get in <span className="gradient-text-animated">Touch</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
            Have a question or need assistance? We're here to help. Choose your preferred contact method below.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="relative py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => {
              const Icon = method.icon
              return (
                <a
                  key={index}
                  href={method.action}
                  className={`group glass-card rounded-2xl p-8 text-center transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${method.hoverBorder} ${method.hoverShadow}`}
                >
                  <div className={`w-16 h-16 mx-auto mb-5 ${method.bg} rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                    <Icon size={28} className={method.color} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                    {method.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">
                    {method.description}
                  </p>
                  <p className={`${method.color} font-medium`}>
                    {method.value}
                  </p>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="glass-card rounded-3xl p-8 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                    <Send size={24} className="text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Send us a Message</h2>
                    <p className="text-gray-500 text-sm">We'll get back to you within 24 hours</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                        className="w-full px-5 py-4 bg-dark-300/50 rounded-xl text-white placeholder-gray-500 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="john@example.com"
                        className="w-full px-5 py-4 bg-dark-300/50 rounded-xl text-white placeholder-gray-500 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-dark-300/50 rounded-xl text-white border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 cursor-pointer"
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value} className="bg-dark-300">
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="How can we help?"
                        className="w-full px-5 py-4 bg-dark-300/50 rounded-xl text-white placeholder-gray-500 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Describe your question or issue in detail..."
                      className="w-full px-5 py-4 bg-dark-300/50 rounded-xl text-white placeholder-gray-500 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group w-full flex items-center justify-center gap-3 px-8 py-5 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Send Message
                        <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Office Locations */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Globe size={20} className="text-orange-400" />
                  </div>
                  Our Offices
                </h3>
                <div className="space-y-4">
                  {offices.map((office, index) => (
                    <div
                      key={index}
                      className="p-4 bg-dark-300/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{office.flag}</span>
                        <span className="font-medium text-white">
                          {office.city}, {office.country}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 ml-8">
                        {office.address}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support Hours */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Clock size={20} className="text-cyan-400" />
                  </div>
                  Support Hours
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-dark-300/50 rounded-xl">
                    <span className="text-gray-400">Live Chat</span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">24/7</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-dark-300/50 rounded-xl">
                    <span className="text-gray-400">Email Support</span>
                    <span className="text-white font-medium">24h response</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-dark-300/50 rounded-xl">
                    <span className="text-gray-400">Phone Support</span>
                    <span className="text-white font-medium">Mon-Fri, 9-18h</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Sparkles size={20} className="text-purple-400" />
                  </div>
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <Link
                    to="/faq"
                    className="group flex items-center gap-3 p-4 rounded-xl hover:bg-dark-300/50 transition-all duration-300"
                  >
                    <HelpCircle size={20} className="text-gray-500 group-hover:text-primary-400 transition-colors" />
                    <span className="text-gray-300 group-hover:text-primary-400 transition-colors">
                      Frequently Asked Questions
                    </span>
                    <ArrowRight size={16} className="ml-auto text-gray-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                  </Link>
                  <Link
                    to="/how-it-works"
                    className="group flex items-center gap-3 p-4 rounded-xl hover:bg-dark-300/50 transition-all duration-300"
                  >
                    <FileText size={20} className="text-gray-500 group-hover:text-primary-400 transition-colors" />
                    <span className="text-gray-300 group-hover:text-primary-400 transition-colors">
                      How It Works
                    </span>
                    <ArrowRight size={16} className="ml-auto text-gray-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                  </Link>
                  <Link
                    to="/community"
                    className="group flex items-center gap-3 p-4 rounded-xl hover:bg-dark-300/50 transition-all duration-300"
                  >
                    <Users size={20} className="text-gray-500 group-hover:text-primary-400 transition-colors" />
                    <span className="text-gray-300 group-hover:text-primary-400 transition-colors">
                      Community Forum
                    </span>
                    <ArrowRight size={16} className="ml-auto text-gray-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                  </Link>
                </div>
              </div>

              {/* Response Time */}
              <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-primary-500/10 via-blue-500/10 to-purple-500/10 border border-primary-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-[60px]" />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap size={24} className="text-primary-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      We Respond Fast
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Our average response time is under 2 hours during business hours.
                      We're committed to helping you succeed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Optional placeholder) */}
      <section className="relative py-16 bg-dark-300/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-orange-400 text-sm font-medium mb-4">
              <MapPin size={16} />
              Locations
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Find Us <span className="gradient-text-animated">Worldwide</span>
            </h2>
          </div>

          <div className="glass-card rounded-2xl p-2 overflow-hidden">
            <div className="aspect-[21/9] bg-dark-200 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <MapPin size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Interactive map coming soon</p>
                <p className="text-gray-600 text-sm mt-1">Casablanca, Morocco | Dubai, UAE</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
