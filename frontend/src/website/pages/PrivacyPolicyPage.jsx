import { motion } from 'framer-motion'
import Card from '../../components/ui/Card'
import premiumBg from '../../assets/premium_bg.png'
import { useSettings } from '../../context/SettingsContext.jsx'

const PrivacyPolicyPage = () => {
  const { settings } = useSettings()
  const companyName = settings?.company_name || 'Developo'
  const companyEmail = settings?.company_email || 'support@developo.com'
  const companyAddress = settings?.footer_company_address || settings?.company_address || '123 Business Street, Suite 100, New York, NY 10001'

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
        <section className="max-w-7xl mx-auto sm:px-6 lg:px-8 pt-20 sm:pt-20 md:pt-20 pb-8 sm:pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-4">
              Privacy Policy
            </h1>
            <p className="text-base sm:text-lg text-slate-400 px-4">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </motion.div>
        </section>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 md:p-10 lg:p-12">
              <div className="space-y-6 sm:space-y-8 text-slate-300">
                <section>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary-accent rounded-full shadow-[0_0_10px_rgba(33,126,69,0.8)]" />
                    1. Introduction
                  </h2>
                  <p className="leading-relaxed text-base sm:text-lg">
                    {companyName} ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
                    explains how we collect, use, disclose, and safeguard your information when you use our
                    customer relationship management platform and related services.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary-accent rounded-full shadow-[0_0_10px_rgba(33,126,69,0.8)]" />
                    2. Information We Collect
                  </h2>
                  <p className="leading-relaxed mb-4 text-base sm:text-lg">We collect information you provide directly to us, including:</p>
                  <ul className="list-none space-y-3 ml-4">
                    {[
                      'Account information (name, email address, password, company name)',
                      'Profile information (job title, phone number, profile photo)',
                      'Payment information (credit card details, billing address)',
                      'Content you create (projects, tasks, documents, messages)',
                      'Communications with us (support requests, feedback)'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-base sm:text-lg">
                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary-accent/10 flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary-accent" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary-accent rounded-full shadow-[0_0_10px_rgba(33,126,69,0.8)]" />
                    3. How We Use Your Information
                  </h2>
                  <p className="leading-relaxed mb-4 text-base sm:text-lg">We use the information we collect to:</p>
                  <ul className="list-none space-y-3 ml-4">
                    {[
                      'Provide, maintain, and improve our services',
                      'Process transactions and send related information',
                      'Send you technical notices, updates, and support messages',
                      'Respond to your comments, questions, and requests',
                      'Monitor and analyze trends, usage, and activities',
                      'Detect, investigate, and prevent fraudulent transactions'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-base sm:text-lg">
                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary-accent/10 flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary-accent" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary-accent rounded-full shadow-[0_0_10px_rgba(33,126,69,0.8)]" />
                    4. Contact Us
                  </h2>
                  <p className="leading-relaxed mb-4 text-base sm:text-lg">
                    If you have any questions about this Privacy Policy, please contact us at:
                  </p>
                  <div className="mt-4 p-4 sm:p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                    <p className="text-base sm:text-lg mb-2"><strong className="text-primary-accent">Email:</strong> <span className="text-slate-300">{companyEmail}</span></p>
                    <p className="text-base sm:text-lg"><strong className="text-primary-accent">Address:</strong> <span className="text-slate-300">{companyAddress}</span></p>
                  </div>
                </section>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Bottom Fade */}
        <div className="h-28 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}

export default PrivacyPolicyPage