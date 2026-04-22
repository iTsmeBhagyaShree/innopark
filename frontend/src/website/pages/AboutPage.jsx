import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { FaRocket, FaUsers, FaLightbulb, FaHeart } from 'react-icons/fa'
import premiumBg from '../../assets/premium_bg.png'

const AboutPage = () => {
  const values = [
    {
      icon: FaRocket,
      title: 'Innovation',
      description: 'We constantly push boundaries to deliver cutting-edge solutions that keep you ahead of the competition.'
    },
    {
      icon: FaUsers,
      title: 'Customer First',
      description: 'Your success is our success. We build features that solve real problems for real businesses.'
    },
    {
      icon: FaLightbulb,
      title: 'Simplicity',
      description: 'Powerful doesn\'t have to mean complicated. We make complex workflows simple and intuitive.'
    },
    {
      icon: FaHeart,
      title: 'Integrity',
      description: 'We believe in transparency, honesty, and building lasting relationships with our customers.'
    }
  ]

  const team = [
    { name: 'John Smith', role: 'CEO & Founder', image: 'https://ui-avatars.com/api/?name=John+Smith&background=217E45&color=fff' },
    { name: 'Sarah Johnson', role: 'CTO', image: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=76AF88&color=fff' },
    { name: 'Mike Williams', role: 'Head of Product', image: 'https://ui-avatars.com/api/?name=Mike+Williams&background=BCB474&color=fff' },
    { name: 'Emily Davis', role: 'Head of Customer Success', image: 'https://ui-avatars.com/api/?name=Emily+Davis&background=CC9CA4&color=fff' },
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-20 md:pt-20 pb-8 sm:pb-16 md:pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-4">
              About Develo CRM
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-2xl mx-auto px-4">
              We're on a mission to help businesses manage their operations more efficiently,
              empowering teams to focus on what matters most – growth.
            </p>
          </motion.div>
        </section>

        {/* Our Story */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8  sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 md:p-10 lg:p-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">Our Story</h2>
              <div className="space-y-4 text-slate-300 leading-relaxed text-base sm:text-lg">
                <p>
                  Develo CRM was founded in 2020 with a simple idea: businesses deserve better tools
                  to manage their operations. After years of working with clunky, disconnected software,
                  our founders decided to build something different.
                </p>
                <p>
                  Today, Develo CRM serves thousands of businesses worldwide, from small startups to
                  established enterprises. Our all-in-one platform brings together project management,
                  client relationships, invoicing, HR, and more – all in a single, intuitive interface.
                </p>
                <p>
                  We believe that great software should be accessible to everyone. That's why we've built
                  Develo CRM to be powerful enough for complex enterprises, yet simple enough for small
                  teams to get started in minutes.
                </p>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Our Values */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 px-4">Our Values</h2>
            <div className="w-24 h-1.5 bg-primary-accent mx-auto rounded-full shadow-[0_0_10px_rgba(33,126,69,0.5)]" />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full text-center bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:bg-white/10 transition-all duration-500 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 group">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:bg-primary-accent group-hover:scale-110 transition-all duration-500">
                      <Icon size={28} className="text-primary-accent group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{value.title}</h3>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{value.description}</p>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Team Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 px-4">Our Team</h2>
            <div className="w-24 h-1.5 bg-primary-accent mx-auto rounded-full shadow-[0_0_10px_rgba(33,126,69,0.5)]" />
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:bg-white/10 transition-all duration-500 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 group">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full mx-auto mb-3 sm:mb-4 border-2 border-primary-accent/30 group-hover:border-primary-accent transition-colors"
                  />
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-1">{member.name}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm">{member.role}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-10 md:py-15 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="bg-slate-900 border border-white/10 relative overflow-hidden text-white p-8 sm:p-12 md:p-16 lg:p-20 rounded-3xl sm:rounded-[4rem] shadow-2xl group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-accent/30 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-accent/20 blur-3xl rounded-full pointer-events-none" />

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 sm:mb-8 relative z-10 text-white px-4">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-8 sm:mb-10 relative z-10 px-4">
              Join thousands of businesses already using Develo CRM
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center relative z-10 px-4">
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-2 rounded-2xl text-base sm:text-lg font-bold shadow-2xl hover:shadow-primary-accent/20">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/contact" className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-2 rounded-2xl text-base sm:text-lg font-bold border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all duration-300">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Bottom Fade */}
        <div className="h-28 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}

export default AboutPage