import { useState } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { IoKey, IoCheckmarkCircle, IoCloseCircle, IoRefresh } from 'react-icons/io5'
import { useLanguage } from '../../../context/LanguageContext'

const LicenseManagement = () => {
  const { t, language } = useLanguage()
  const dateLocale = language === 'de' ? 'de-DE' : language === 'en' ? 'en-GB' : language || 'de-DE'

  const formatNow = () =>
    new Date().toLocaleString(dateLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: language !== 'de',
    })

  const [licenseKey, setLicenseKey] = useState('XXXX-XXXX-XXXX-XXXX-XXXX')
  const [boundDomain, setBoundDomain] = useState('crm.example.com')
  const [licenseStatus, setLicenseStatus] = useState('active')
  const [lastValidated, setLastValidated] = useState(formatNow)
  const [isValidating, setIsValidating] = useState(false)

  const [licenseHistory] = useState([
    {
      id: 1,
      actionKey: 'validated',
      timestamp: '2024-01-15 10:30 AM',
      status: 'success',
      ip: '192.168.1.100',
    },
    {
      id: 2,
      actionKey: 'domain',
      timestamp: '2024-01-10 02:15 PM',
      status: 'success',
      ip: '192.168.1.100',
    },
    {
      id: 3,
      actionKey: 'failed',
      timestamp: '2024-01-05 09:00 AM',
      status: 'error',
      ip: '192.168.1.50',
    },
  ])

  const historyActionLabel = (key) => {
    if (key === 'validated') return t('license_management.history_validated')
    if (key === 'domain') return t('license_management.history_domain')
    if (key === 'failed') return t('license_management.history_failed')
    return key
  }

  const handleValidateLicense = () => {
    setIsValidating(true)
    setTimeout(() => {
      setLicenseStatus('active')
      setLastValidated(formatNow())
      setIsValidating(false)
      alert(t('license_management.validated_ok'))
    }, 1500)
  }

  const handleForceRevalidate = () => {
    if (window.confirm(t('license_management.confirm_force'))) {
      setIsValidating(true)
      setTimeout(() => {
        setLicenseStatus('active')
        setLastValidated(formatNow())
        setIsValidating(false)
        alert(t('license_management.revalidated_ok'))
      }, 1500)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">{t('license_management.title')}</h1>
        <p className="text-secondary-text mt-1">{t('license_management.subtitle')}</p>
      </div>

      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-primary-text mb-2">{t('license_management.current_license')}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={licenseStatus === 'active' ? 'success' : licenseStatus === 'expired' ? 'warning' : 'danger'}>
                {licenseStatus === 'active' ? (
                  <>
                    <IoCheckmarkCircle className="inline mr-1" size={16} />
                    {t('license_management.status_active')}
                  </>
                ) : licenseStatus === 'expired' ? (
                  <>
                    <IoCloseCircle className="inline mr-1" size={16} />
                    {t('license_management.status_expired')}
                  </>
                ) : (
                  <>
                    <IoCloseCircle className="inline mr-1" size={16} />
                    {t('license_management.status_invalid')}
                  </>
                )}
              </Badge>
              <span className="text-sm text-secondary-text">
                {t('license_management.last_validated').replace('{{date}}', lastValidated)}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              onClick={handleValidateLicense}
              disabled={isValidating}
              className="flex items-center gap-2"
            >
              <IoRefresh size={18} className={isValidating ? 'animate-spin' : ''} />
              {t('license_management.validate_license')}
            </Button>
            <Button variant="primary" onClick={handleForceRevalidate} disabled={isValidating} className="flex items-center gap-2">
              <IoRefresh size={18} className={isValidating ? 'animate-spin' : ''} />
              {t('license_management.force_revalidate')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('license_management.license_key')}</label>
            <div className="flex items-center gap-2">
              <Input value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} className="font-mono text-sm" readOnly />
              <Button
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(licenseKey)
                  alert(t('license_management.key_copied'))
                }}
                className="flex-shrink-0"
              >
                {t('license_management.copy')}
              </Button>
            </div>
            <p className="text-xs text-secondary-text mt-1">{t('license_management.key_bound_hint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('license_management.bound_domain')}</label>
            <Input
              value={boundDomain}
              onChange={(e) => setBoundDomain(e.target.value)}
              placeholder={t('license_management.domain_placeholder')}
            />
            <p className="text-xs text-secondary-text mt-1">{t('license_management.domain_hint')}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-accent/10 rounded-lg">
              <IoKey className="text-primary-accent" size={24} />
            </div>
            <div>
              <p className="text-sm text-secondary-text">{t('license_management.license_type')}</p>
              <p className="text-lg font-semibold text-primary-text">{t('license_management.license_type_value')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <IoCheckmarkCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-secondary-text">{t('license_management.expiry_date')}</p>
              <p className="text-lg font-semibold text-primary-text">{t('license_management.expiry_never')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <IoRefresh className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-secondary-text">{t('license_management.validation_frequency')}</p>
              <p className="text-lg font-semibold text-primary-text">{t('license_management.validation_daily')}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-primary-text mb-4">{t('license_management.history_title')}</h2>
        <div className="space-y-3">
          {licenseHistory.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${entry.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm font-medium text-primary-text">{historyActionLabel(entry.actionKey)}</p>
                  <p className="text-xs text-secondary-text mt-1">
                    {entry.timestamp} • {entry.ip}
                  </p>
                </div>
              </div>
              <Badge variant={entry.status === 'success' ? 'success' : 'danger'}>
                {entry.status === 'success' ? t('license_management.badge_success') : t('license_management.badge_failed')}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-primary-text mb-2">{t('license_management.notes_title')}</h3>
        <ul className="space-y-2 text-sm text-secondary-text list-disc list-inside">
          <li>{t('license_management.note_1')}</li>
          <li>{t('license_management.note_2')}</li>
          <li>{t('license_management.note_3')}</li>
          <li>{t('license_management.note_4')}</li>
        </ul>
      </Card>
    </div>
  )
}

export default LicenseManagement
