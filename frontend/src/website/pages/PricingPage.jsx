import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { FaCheck } from 'react-icons/fa'
import premiumBg from '../../assets/premium_bg.png'

const PricingPage = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Perfect for small teams',
      features: [
        'Up to 5 users',
        'Basic CRM features',
        'Email support',
        'Mobile app access',
        '5GB storage',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: '$79',
      period: '/month',
      description: 'For growing businesses',
      features: [
        'Up to 25 users',
        'Advanced CRM features',
        'Priority support',
        'Mobile app access',
        '50GB storage',
        'Custom integrations',
        'Advanced analytics',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$199',
      period: '/month',
      description: 'For large organizations',
      features: [
        'Unlimited users',
        'All features included',
        '24/7 dedicated support',
        'Mobile app access',
        'Unlimited storage',
        'Custom integrations',
        'Advanced analytics',
        'Custom workflows',
        'API access',
      ],
      popular: false,
    },
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
              Simple, Transparent Pricing
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-2xl mx-auto px-4">
              Choose the plan that's right for your business. All plans include a
              14-day free trial.
            </p>
          </motion.div>
        </section>

        {/* Pricing Cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card
                  className={`h-full relative bg-white/5 backdrop-blur-2xl border shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 md:p-10 group ${plan.popular
                      ? 'border-primary-accent shadow-primary-accent/20 hover:shadow-primary-accent/30'
                      : 'border-white/10 hover:bg-white/10'
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-primary-accent text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {plan.popular && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-accent/20 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-500 rounded-3xl sm:rounded-[3rem] pointer-events-none" />
                  )}

                  <div className="text-center mb-6 sm:mb-8 relative z-10">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-slate-400 mb-4 sm:mb-6 text-sm sm:text-base">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl sm:text-5xl font-bold text-white">
                        {plan.price}
                      </span>
                      <span className="text-slate-400 ml-2 text-base sm:text-lg">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 relative z-10">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary-accent/10 flex items-center justify-center mt-0.5">
                          <FaCheck className="text-primary-accent text-xs sm:text-sm" />
                        </div>
                        <span className="text-slate-300 text-sm sm:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/login" className="block relative z-10">
                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      className={`w-full px-6 sm:px-8 py-3 rounded-2xl text-base sm:text-lg font-bold transition-all duration-300 ${plan.popular
                          ? 'shadow-2xl hover:shadow-primary-accent/20 hover:scale-105 active:scale-95'
                          : 'border-white/20 text-white hover:bg-white/10'
                        }`}
                    >
                      Get Started
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Custom Solution CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 md:p-10 inline-block">
              <p className="text-slate-300 text-base sm:text-lg mb-4">
                Need a custom solution?{' '}
                <Link to="/contact" className="text-primary-accent hover:underline font-bold transition-all hover:text-primary-accent/80">
                  Contact us
                </Link>
              </p>
            </Card>
          </motion.div>
        </section>

        {/* Bottom Fade */}
        <div className="h-28 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}

export default PricingPage