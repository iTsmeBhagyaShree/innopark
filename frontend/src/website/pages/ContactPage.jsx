import { useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa'
import premiumBg from '../../assets/premium_bg.png'

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    alert('Thank you for your message! We will get back to you soon.')
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const contactInfo = [
    {
      icon: FaEnvelope,
      title: 'Email',
      content: 'support@Develo.com',
      color: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      icon: FaPhone,
      title: 'Phone',
      content: '+1 (555) 123-4567',
      color: 'from-green-500/20 to-emerald-500/20'
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Address',
      content: '123 Business St, Suite 100\nSan Francisco, CA 94105',
      color: 'from-purple-500/20 to-pink-500/20'
    }
  ]

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden">
      {/* Premium Animated Background Layer */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [-20, 20, -20],
          y: [-10, 10, -10],
          rotate: [0, 1, 0]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat w-full h-full transform-gpu"
        style={{
          backgroundImage: `url(${premiumBg})`,
          filter: 'brightness(0.55)'
        }}
      />
      {/* Dynamic Overlay Layer */}
      <div className="fixed inset-0 z-0 bg-gradient-to-tr from-slate-950/90 via-slate-950/50 to-primary-accent/10 backdrop-blur-[1px] pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-20 pb-12 sm:pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-4">
              Get in Touch
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-2xl mx-auto px-4">
              Have questions? We'd love to hear from you. Send us a message and we'll
              respond as soon as possible.
            </p>
          </motion.div>
        </section>

        {/* Contact Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Contact Info */}
            <div className="space-y-4 sm:space-y-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:bg-white/10 transition-all duration-500 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 group relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${info.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="bg-primary-accent/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl group-hover:bg-primary-accent group-hover:scale-110 transition-all duration-500 border border-primary-accent/20">
                        <info.icon className="text-primary-accent group-hover:text-white transition-colors" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-1 sm:mb-2 text-base sm:text-lg">{info.title}</h3>
                        <p className="text-slate-300 text-sm sm:text-base whitespace-pre-line">
                          {info.content}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 md:p-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Name</label>
                        <input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent focus:outline-none transition-all backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Email</label>
                        <input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your.email@example.com"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent focus:outline-none transition-all backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Subject</label>
                      <input
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What is this regarding?"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent focus:outline-none transition-all backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Your message..."
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent focus:outline-none transition-all backdrop-blur-sm resize-none"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full px-8 py-3 rounded-2xl text-lg font-bold shadow-2xl hover:shadow-primary-accent/20 hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      Send Message
                    </Button>
                  </form>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Bottom Fade */}
        <div className="h-28 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}

export default ContactPage