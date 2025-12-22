import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Mail, Phone, MapPin, Send, MessageCircle,
  Clock, CheckCircle2, HelpCircle, Users, FileText
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
      action: 'mailto:support@tradesense.com'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Available 24/7',
      value: 'Start a conversation',
      action: '#'
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Mon-Fri, 9am-6pm CET',
      value: '+212 XXX XXX XXX',
      action: 'tel:+212000000000'
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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full text-primary-500 text-sm font-medium mb-4">
            <Mail size={16} />
            Contact Us
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Have a question or need assistance? We're here to help. Choose your preferred contact method below.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {contactMethods.map((method, index) => {
            const Icon = method.icon
            return (
              <a
                key={index}
                href={method.action}
                className="bg-white dark:bg-dark-100 rounded-2xl p-6 text-center border border-gray-200 dark:border-dark-100 hover:border-primary-500/50 hover:shadow-lg transition-all group"
              >
                <div className="w-14 h-14 mx-auto mb-4 bg-primary-500/10 rounded-xl flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                  <Icon size={24} className="text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {method.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {method.description}
                </p>
                <p className="text-primary-500 font-medium">
                  {method.value}
                </p>
              </a>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-dark-100 rounded-2xl p-8 border border-gray-200 dark:border-dark-100">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-200 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 border border-gray-200 dark:border-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-200 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 border border-gray-200 dark:border-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-200 rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="How can we help?"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-200 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 border border-gray-200 dark:border-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Describe your question or issue in detail..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-200 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 border border-gray-200 dark:border-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Office Locations */}
            <div className="bg-white dark:bg-dark-100 rounded-2xl p-6 border border-gray-200 dark:border-dark-100">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-primary-500" />
                Our Offices
              </h3>
              <div className="space-y-4">
                {offices.map((office, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-dark-200 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{office.flag}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {office.city}, {office.country}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                      {office.address}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Hours */}
            <div className="bg-white dark:bg-dark-100 rounded-2xl p-6 border border-gray-200 dark:border-dark-100">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock size={20} className="text-primary-500" />
                Support Hours
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Live Chat</span>
                  <span className="text-green-500 font-medium">24/7</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Email Support</span>
                  <span className="text-gray-900 dark:text-white font-medium">24h response</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Phone Support</span>
                  <span className="text-gray-900 dark:text-white font-medium">Mon-Fri, 9-18h</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white dark:bg-dark-100 rounded-2xl p-6 border border-gray-200 dark:border-dark-100">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Links
              </h3>
              <div className="space-y-2">
                <Link
                  to="/faq"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors group"
                >
                  <HelpCircle size={18} className="text-gray-400 group-hover:text-primary-500" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-primary-500">
                    Frequently Asked Questions
                  </span>
                </Link>
                <Link
                  to="/how-it-works"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors group"
                >
                  <FileText size={18} className="text-gray-400 group-hover:text-primary-500" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-primary-500">
                    How It Works
                  </span>
                </Link>
                <Link
                  to="/community"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors group"
                >
                  <Users size={18} className="text-gray-400 group-hover:text-primary-500" />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-primary-500">
                    Community Forum
                  </span>
                </Link>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-gradient-to-r from-primary-500/10 to-blue-500/10 rounded-2xl p-6 border border-primary-500/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={24} className="text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    We Respond Fast
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Our average response time is under 2 hours during business hours.
                    We're committed to helping you succeed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
