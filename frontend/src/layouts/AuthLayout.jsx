import { Outlet } from 'react-router-dom'
import { FaChartLine, FaUsers, FaCog } from 'react-icons/fa'
import companyLogo from '../assets/innopark.jpeg'
import { useLanguage } from '../context/LanguageContext'

const AuthLayout = () => {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen flex" style={{ background: '#000000' }}>
      {/* Left Branding Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 text-white p-12 flex-col justify-center items-center relative"
        style={{ background: '#000000' }}
      >
        <div className="max-w-md">
          {/* Company Logo */}
          <div className="mb-2 lg:mb-4 -ml-3 sm:-ml-4">
            <img
              src={companyLogo}
              alt="Company Logo"
              className="h-20 lg:h-24 w-auto object-contain"
            />
          </div>

          <h1 className="text-4xl font-bold mb-4">Develo CRM</h1>
          <p className="text-gray-400 text-lg mb-8">{t('auth.tagline')}</p>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary-accent p-3 rounded-lg">
                <FaChartLine size={24} />
              </div>
              <div>
                <h3 className="font-semibold">{t('auth.analytics_dashboard')}</h3>
                <p className="text-gray-400 text-sm">{t('auth.track_metrics')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary-accent p-3 rounded-lg">
                <FaUsers size={24} />
              </div>
              <div>
                <h3 className="font-semibold">{t('auth.team_collaboration')}</h3>
                <p className="text-gray-400 text-sm">{t('auth.work_seamlessly')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary-accent p-3 rounded-lg">
                <FaCog size={24} />
              </div>
              <div>
                <h3 className="font-semibold">{t('auth.customizable_workflows')}</h3>
                <p className="text-gray-400 text-sm">{t('auth.adapt_needs')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Auth Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-6" style={{ background: '#111111' }}>
        <div className="w-full max-w-md">
          {/* Logo on mobile (shown only on small screens, left panel hidden) */}
          <div className="flex justify-center mb-2 lg:hidden relative -left-2 sm:-left-3">
            <img
              src={companyLogo}
              alt="Company Logo"
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout

