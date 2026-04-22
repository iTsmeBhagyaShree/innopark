import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { FaUserShield, FaUserTie, FaUser, FaArrowLeft, FaCrown, FaGlobe } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { languageConfig } from '../../config/languageConfig'
import { useSettings } from '../../context/SettingsContext.jsx'

const LoginPage = () => {
  // Pre-filled with Kavya's credentials
  const [email, setEmail] = useState('kavya@gmail.com')
  const [password, setPassword] = useState('123456')
  const [role, setRole] = useState('ADMIN')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [retryAfter, setRetryAfter] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  // Demo Credentials (Updated with actual database users from screenshot)
  const DEMO_CREDENTIALS = {
    'SUPERADMIN': { email: 'superadmin@crmapp', password: '123456' },
    'ADMIN': { email: 'kavya@gmail.com', password: '123456' },
    'EMPLOYEE': { email: 'devesh@gmail.com', password: '123456' }
  }

  const { login } = useAuth()
  const { settings } = useSettings()
  const { t, language, languages, changeLanguage } = useLanguage()
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const navigate = useNavigate()

  // Check for rate limiting on mount
  useEffect(() => {
    const checkRateLimit = () => {
      const retryAfter = localStorage.getItem('loginRetryAfter')
      if (retryAfter && Date.now() < parseInt(retryAfter)) {
        const secondsLeft = Math.ceil((parseInt(retryAfter) - Date.now()) / 1000)
        setRetryAfter(secondsLeft)

        // Update countdown every second
        const interval = setInterval(() => {
          const remaining = Math.ceil((parseInt(retryAfter) - Date.now()) / 1000)
          if (remaining > 0) {
            setRetryAfter(remaining)
          } else {
            setRetryAfter(null)
            localStorage.removeItem('loginRetryAfter')
            clearInterval(interval)
          }
        }, 1000)

        return () => clearInterval(interval)
      } else {
        setRetryAfter(null)
        if (retryAfter) {
          localStorage.removeItem('loginRetryAfter')
        }
      }
    }

    checkRateLimit()
    const interval = setInterval(checkRateLimit, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-generate credentials based on role
  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole)
    setError('')

    if (DEMO_CREDENTIALS[selectedRole]) {
      setEmail(DEMO_CREDENTIALS[selectedRole].email)
      setPassword(DEMO_CREDENTIALS[selectedRole].password)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    console.log('LoginPage: Attempting login with:', { email, role })

    // Check rate limiting before attempting login
    const retryLimit = localStorage.getItem('loginRetryAfter')
    if (retryLimit && Date.now() < parseInt(retryLimit)) {
      const secondsLeft = Math.ceil((parseInt(retryLimit) - Date.now()) / 1000)
      setError(t('auth.errors.too_many_attempts', { seconds: secondsLeft }))
      setRetryAfter(secondsLeft)
      setIsLoading(false)
      return
    }

    if (!email || !password) {
      setError(t('auth.errors.fill_fields'))
      setIsLoading(false)
      return
    }

    if (!role) {
      setError(t('auth.errors.select_role'))
      setIsLoading(false)
      return
    }

    try {
      const result = await login(email, password, role)
      console.log('LoginPage: Login result:', result)

      if (result.success) {
        localStorage.removeItem('loginRetryAfter')
        setRetryAfter(null)
        
        const userRole = result.user?.role || role
        
        setTimeout(() => {
          if (userRole === 'SUPERADMIN') {
            navigate('/app/superadmin/dashboard', { replace: true })
          } else if (userRole === 'ADMIN') {
            navigate('/app/admin/dashboard', { replace: true })
          } else if (userRole === 'EMPLOYEE') {
            navigate('/app/employee/dashboard', { replace: true })
          } else {
            navigate('/app/admin/dashboard', { replace: true })
          }
        }, 100)
      } else {
        if (result.isRateLimited) {
          setRetryAfter(result.retryAfter || 60)
        }
        setError(result.error || t('auth.errors.invalid_credentials'))
        setIsLoading(false)
      }
    } catch (err) {
      console.error('LoginPage: Catch block error:', err)
      setError(err.response?.data?.error || err.message || t('auth.errors.login_failed'))
      setIsLoading(false)
    }
  }

  const roleCards = [
    {
      id: 'SUPERADMIN',
      label: t('auth.roles.superadmin'),
      icon: FaCrown,
      description: t('auth.descriptions.superadmin'),
      color: 'bg-purple-500'
    },
    {
      id: 'ADMIN',
      label: t('auth.roles.admin'),
      icon: FaUserShield,
      description: t('auth.descriptions.admin'),
      color: 'bg-primary-accent'
    },
    {
      id: 'EMPLOYEE',
      label: t('auth.roles.employee'),
      icon: FaUserTie,
      description: t('auth.descriptions.employee'),
      color: 'bg-secondary-accent'
    }
  ]

  return (
    <Card className="w-full max-w-md mx-auto relative">
      <div className="text-center mb-6 md:mb-8 pt-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-text mb-2">{t('auth.welcome_back')}</h1>
        <p className="text-secondary-text text-sm md:text-base">{t('auth.select_role')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 mb-6">
        {roleCards.map((roleCard) => {
          const Icon = roleCard.icon
          const isSelected = role === roleCard.id
          return (
            <button
              key={roleCard.id}
              type="button"
              onClick={() => handleRoleSelect(roleCard.id)}
              className={`p-3 md:p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 hover:-translate-y-1 h-full min-h-[110px] sm:min-h-[130px] flex flex-col items-center justify-center text-center ${isSelected
                ? 'border-primary-accent bg-primary-accent shadow-lg'
                : 'border-gray-200 hover:border-primary-accent hover:shadow-md'
                }`}
            >
              <div
                className={`w-10 h-10 md:w-11 md:h-11 rounded-full ${roleCard.color} bg-opacity-20 flex items-center justify-center mb-2 flex-shrink-0`}
              >
                <Icon
                  size={18}
                  className={isSelected ? 'text-white' : 'text-secondary-text shadow-sm'}
                />
              </div>
              <p
                className={`text-[11px] md:text-sm font-bold leading-tight ${isSelected ? 'text-white' : 'text-primary-text'
                  }`}
              >
                {roleCard.label}
              </p>
              <p className={`text-[10px] mt-1 line-clamp-2 md:line-clamp-none ${isSelected ? 'text-white/90' : 'text-muted-text'}`}>
                {roleCard.description}
              </p>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 md:space-y-5">
        <input type="text" name="username" autoComplete="username" tabIndex={-1} aria-hidden="true" className="hidden" />
        <input type="password" name="password" autoComplete="new-password" tabIndex={-1} aria-hidden="true" className="hidden" />

        {error && (
          <div className={`${retryAfter ? 'bg-warning bg-opacity-10 border-warning' : 'bg-danger bg-opacity-10 border-danger'} border rounded-lg p-3 text-sm ${retryAfter ? 'text-warning' : 'text-danger'}`}>
            <div className="font-semibold mb-1">{error}</div>
            {retryAfter && (
              <div className="text-xs mt-2">
                ⏱️ {t('rate_limit.retry_in')} <span className="font-bold">{retryAfter} {t('rate_limit.seconds')}</span>
              </div>
            )}
          </div>
        )}

        <Input
          label={t('auth.email')}
          type="email"
          name="login_email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          required
          autoComplete="off"
        />

        <Input
          label={t('auth.password')}
          type="password"
          name="login_password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.password')}
          required
          autoComplete="off"
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2 rounded" />
            <span className="text-sm text-secondary-text">{t('auth.remember_me')}</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-primary-accent hover:underline"
          >
            {t('auth.forgot_password')}
          </Link>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            variant="primary"
            className="px-8 min-w-[220px] shadow-lg transform hover:scale-105 active:scale-95 transition-all"
            disabled={!role || !email || !password || isLoading || (retryAfter !== null && retryAfter > 0)}
          >
            {isLoading
              ? t('auth.signing_in')
              : retryAfter !== null && retryAfter > 0
                ? `${t('auth.please_wait')} ${retryAfter}s...`
                : `${t('auth.sign_in_as')} ${role ? roleCards.find(r => r.id === role)?.label : '...'}`
            }
          </Button>
        </div>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <div className="flex flex-wrap justify-center gap-4 text-xs text-secondary-text">
          {[
            { text: t('footer.privacy_policy'), url: settings?.footer_privacy_link },
            { text: t('footer.terms_of_service'), url: settings?.footer_terms_link },
            { text: t('footer.refund_policy'), url: settings?.footer_refund_link },
            { text: settings?.footer_custom_link_1_text, url: settings?.footer_custom_link_1_url },
            { text: settings?.footer_custom_link_2_text, url: settings?.footer_custom_link_2_url }
          ].filter(link => link.text && link.url).map((link, index) => {
            const isInternal = link.url.startsWith('/')
            if (isInternal) {
              return (
                <Link key={index} to={link.url} className="hover:text-primary-accent transition-colors">
                  {link.text}
                </Link>
              )
            }
            return (
              <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-accent transition-colors">
                {link.text}
              </a>
            )
          })}
        </div>
        {settings?.footer_company_address && (
          <div className="text-xs text-secondary-text whitespace-pre-line mt-3 opacity-70">
            {settings.footer_company_address}
          </div>
        )}
      </div>
    </Card>
  )
}

export default LoginPage