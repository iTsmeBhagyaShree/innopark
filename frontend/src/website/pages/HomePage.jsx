import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { FaChartLine, FaUsers, FaCog, FaShieldAlt, FaRocket, FaQuoteLeft } from 'react-icons/fa'
import premiumBg from '../../assets/premium_bg.png'
import axiosInstance from '../../api/axiosInstance'
import { useLanguage } from '../../context/LanguageContext.jsx'

const HomePage = () => {
  const { t } = useLanguage()
  const [packages, setPackages] = useState([])
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [requestFormData, setRequestFormData] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    package_id: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await axiosInstance.get('/superadmin/packages')
      if (response.data.success) {
        setPackages(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    if (!requestFormData.company_name || !requestFormData.contact_name || !requestFormData.contact_email || !requestFormData.package_id) {
      alert('Please fill all required fields')
      return
    }

    setSubmitting(true)
    try {
      const response = await axiosInstance.post('/superadmin/offline-requests', {
        company_name: requestFormData.company_name,
        request_type: 'Company Request',
        contact_name: requestFormData.contact_name,
        contact_email: requestFormData.contact_email,
        contact_phone: requestFormData.contact_phone || null,
        package_id: requestFormData.package_id,
        description: requestFormData.description || null,
        status: 'Pending',
      })
      if (response.data.success) {
        alert('Request submitted successfully! We will contact you soon.')
        setIsRequestModalOpen(false)
        setRequestFormData({
          company_name: '',
          contact_name: '',
          contact_email: '',
          contact_phone: '',
          package_id: '',
          description: '',
        })
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      alert(error.response?.data?.error || 'Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16 md:pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-primary-accent uppercase bg-primary-accent/20 rounded-full border border-primary-accent/40 shadow-[0_0_15px_rgba(33,126,69,0.3)]">
              Transforming Modern Business
            </span> */}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-6 sm:mb-8 leading-tight tracking-tight drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] px-2"
          >
            {t('homepage.hero.title')}
            <br />
            <span className="text-primary-accent">{t('homepage.hero.titleHighlight')}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-200 font-medium mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4"
          >
            {t('homepage.hero.subtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4"
          >
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-2 rounded-2xl shadow-xl hover:shadow-primary-accent/40 hover:scale-105 active:scale-95 transition-all duration-300 text-base sm:text-lg">
                {t('homepage.hero.getStarted')}
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-2 rounded-2xl backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300 text-base sm:text-lg">
                {t('homepage.hero.login')}
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20" id="Features">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 px-4">
              Everything You Need
            </h2>
            <div className="w-24 h-1.5 bg-primary-accent mx-auto rounded-full shadow-[0_0_10px_rgba(33,126,69,0.5)]" />
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {[
              { icon: FaChartLine, title: "Analytics Dashboard", desc: "Track your business metrics and make data-driven decisions with real-time insights." },
              { icon: FaUsers, title: "Team Collaboration", desc: "Work together seamlessly with your team members across projects and tasks." },
              { icon: FaCog, title: "Customizable Workflows", desc: "Adapt the system to match your unique business processes and organizational structure." },
              { icon: FaShieldAlt, title: "Secure & Reliable", desc: "Your data is protected with enterprise-grade security and automated backups." },
              { icon: FaRocket, title: "Fast & Responsive", desc: "Lightning-fast performance on all devices, ensuring productivity anywhere." },
              { icon: FaUsers, title: "Role-Based Access", desc: "Control access precision with Admin and Employee dedicated roles." }
            ].map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full group hover:bg-white/10 bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl hover:shadow-primary-accent/10 transition-all duration-500 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 overflow-hidden relative">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-primary-accent/10 rounded-full group-hover:bg-primary-accent/20 transition-colors duration-500" />
                  <div className="text-primary-accent mb-4 sm:mb-6 p-3 sm:p-4 bg-primary-accent/10 w-fit rounded-xl sm:rounded-2xl group-hover:scale-110 group-hover:bg-primary-accent group-hover:text-white transition-all duration-500 shadow-sm border border-primary-accent/20">
                    <feature.icon size={32} className="sm:w-9 sm:h-9" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                    {feature.desc}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Role-Based Preview */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-15">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 px-4">
              Built for Everyone
            </h2>
            <p className="text-slate-400 text-lg sm:text-xl px-4">Tailored experiences for every user type</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Card className="h-full bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 md:p-10 hover:bg-white/10 transition-all duration-500 group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary-accent/20 blur-3xl rounded-full -mr-24 -mt-24 group-hover:bg-primary-accent/40 transition-all duration-700" />
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-3 text-white">
                  <span className="w-1.5 h-8 bg-primary-accent rounded-full shadow-[0_0_10px_rgba(33,126,69,0.8)]" />
                  Admin Dashboard
                </h3>
                <p className="text-slate-400 mb-6 sm:mb-8 text-base sm:text-lg">
                  Full control over your business with comprehensive management tools.
                </p>
                <div className="space-y-4">
                  {['Complete system access', 'User management', 'Advanced analytics', 'All modules available'].map(item => (
                    <div key={item} className="flex items-center gap-4 text-slate-300">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-accent/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-accent" />
                      </div>
                      <span className="text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {[
              { title: "Employee Dashboard", items: ['Task management', 'Client interactions', 'Work tracking', 'Team collaboration'], desc: "Everything your team needs to stay productive and organized." },
              { title: "Project Management", items: ['Real-time visibility', 'Collaborative tracking', 'Integrated communication', 'Full transparency'], desc: "Keep everyone aligned with clear project roadmaps and milestones." }
            ].map((role, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 * (idx + 1) }}
              >
                <Card className="h-full bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 md:p-10 hover:bg-white/10 transition-all duration-500 group">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary-accent/50 rounded-full group-hover:bg-primary-accent transition-all shadow-[0_0_5px_rgba(33,126,69,0.5)]" />
                    {role.title}
                  </h3>
                  <p className="text-slate-400 mb-6 sm:mb-8 text-base sm:text-lg">
                    {role.desc}
                  </p>
                  <div className="space-y-4 font-medium">
                    {role.items.map(item => (
                      <div key={item} className="flex items-center gap-4 text-slate-300">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-accent/40 group-hover:bg-primary-accent transition-colors" />
                        </div>
                        <span className="text-base">{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 px-4">
                What Our Customers Say
              </h2>
              <p className="text-slate-400 text-lg sm:text-xl px-4">Trusted by industry leaders worldwide</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                { name: "Sarah Johnson", role: "CEO, TechCorp", text: "Develo CRM has transformed how we manage our clients. The interface is intuitive and powerful." },
                { name: "Michael Chen", role: "Director, SalesPro", text: "Best CRM solution we've used. The role-based access makes it perfect for our team structure." },
                { name: "Emily Davis", role: "Manager, Growth Inc", text: "The mobile responsiveness is excellent. We can manage everything on the go seamlessly." }
              ].map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                >
                  <Card className="h-full bg-white/5 backdrop-blur-md border border-white/10 p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[3rem] shadow-lg hover:shadow-2xl transition-all duration-500 relative flex flex-col justify-between group">
                    <div>
                      <div className="text-white/5 absolute top-8 right-8 transition-colors group-hover:text-primary-accent/20">
                        <FaQuoteLeft size={60} />
                      </div>
                      <p className="text-slate-300 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 leading-relaxed italic relative z-10">
                        "{t.text}"
                      </p>
                    </div>
                    <div>
                      <div className="w-12 h-1 bg-primary-accent mb-4 rounded-full shadow-[0_0_10px_rgba(33,126,69,0.5)]" />
                      <p className="font-bold text-white text-lg sm:text-xl">{t.name}</p>
                      <p className="text-sm text-primary-accent font-bold tracking-wide uppercase">{t.role}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing/Packages Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20" id="Pricing">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 px-4">
              Choose Your Plan
            </h2>
            <p className="text-slate-400 text-lg sm:text-xl px-4">Select the perfect plan for your business needs</p>
            <div className="w-24 h-1.5 bg-primary-accent mx-auto rounded-full shadow-[0_0_10px_rgba(33,126,69,0.5)] mt-4" />
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {packages.map((pkg, index) => (
              <motion.div key={pkg.id} variants={itemVariants}>
                <Card className="h-full bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 md:p-10 hover:bg-white/10 transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-accent/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary-accent/20 transition-all duration-700" />
                  <div className="relative z-10">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{pkg.package_name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl sm:text-5xl font-extrabold text-primary-accent">${pkg.price}</span>
                      <span className="text-slate-400 text-lg ml-2">/{pkg.billing_cycle}</span>
                    </div>
                    {pkg.features && Array.isArray(pkg.features) && pkg.features.length > 0 && (
                      <ul className="space-y-3 mb-8">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-slate-300">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-accent/20 flex items-center justify-center mt-0.5">
                              <div className="w-2 h-2 rounded-full bg-primary-accent" />
                            </div>
                            <span className="text-base">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button
                      variant="primary"
                      onClick={() => {
                        setRequestFormData({ ...requestFormData, package_id: pkg.id })
                        setIsRequestModalOpen(true)
                      }}
                      className="w-full py-3 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
                    >
                      Request This Plan
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="bg-slate-900 border border-white/10 relative overflow-hidden text-white p-8 sm:p-12 md:p-16 lg:p-20 rounded-3xl sm:rounded-[4rem] shadow-2xl group"
          >
            {/* Animated Background Gradients for CTA */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-accent/30 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-accent/20 blur-3xl rounded-full pointer-events-none" />

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 sm:mb-8 relative z-10 tracking-tight text-white px-4">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed opacity-90 px-4">
              Join thousands of businesses using Develo CRM to streamline operations and accelerate growth.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center relative z-10 px-4"
            >
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-2 rounded-2xl text-base sm:text-lg md:text-xl font-bold shadow-2xl hover:shadow-primary-accent/20">
                  {t('website.start_free_trial')}
                </Button>
              </Link>
              <Link to="/contact" className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-2 rounded-2xl text-base sm:text-lg md:text-xl font-bold border-white/20 text-white hover:bg-primary-accent hover:text-primary-accent transition-all duration-200">
                  {t('website.contact_sales')}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Bottom Fade */}
        <div className="h-28 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      </div>

      {/* Company Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title={t('common.request_company_account')}
        size="lg"
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <Input
            label={t('website.company_name')}
            value={requestFormData.company_name}
            onChange={(e) => setRequestFormData({ ...requestFormData, company_name: e.target.value })}
            placeholder={t('website.company_name_placeholder')}
            required
          />
          <Input
            label={t('website.contact_name')}
            value={requestFormData.contact_name}
            onChange={(e) => setRequestFormData({ ...requestFormData, contact_name: e.target.value })}
            placeholder={t('website.contact_name_placeholder')}
            required
          />
          <Input
            label="Email"
            type="email"
            value={requestFormData.contact_email}
            onChange={(e) => setRequestFormData({ ...requestFormData, contact_email: e.target.value })}
            placeholder={t('website.email_placeholder')}
            required
          />
          <Input
            label={t('common.phone')}
            value={requestFormData.contact_phone}
            onChange={(e) => setRequestFormData({ ...requestFormData, contact_phone: e.target.value })}
            placeholder={t('website.phone_placeholder')}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Plan
            </label>
            <select
              value={requestFormData.package_id}
              onChange={(e) => setRequestFormData({ ...requestFormData, package_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              required
            >
              <option value="">Select a plan</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.package_name} - ${pkg.price}/{pkg.billing_cycle}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Information
            </label>
            <textarea
              value={requestFormData.description}
              onChange={(e) => setRequestFormData({ ...requestFormData, description: e.target.value })}
              placeholder="Tell us about your business needs..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRequestModalOpen(false)}
              className="px-6 py-2.5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary-accent text-white hover:bg-primary-accent/90"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default HomePage