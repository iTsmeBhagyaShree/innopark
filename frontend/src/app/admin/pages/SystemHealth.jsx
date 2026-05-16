import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import { useLanguage } from '../../../context/LanguageContext.jsx'

const SystemHealth = () => {
  const { t } = useLanguage()

  const healthStatus = [
    { serviceKey: 'api_server', statusKey: 'healthy', uptime: '99.9%' },
    { serviceKey: 'database', statusKey: 'healthy', uptime: '99.8%' },
    { serviceKey: 'cron', statusKey: 'running', uptime: '100%' },
    { serviceKey: 'email_service', statusKey: 'healthy', uptime: '99.5%' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">{t('admin_system_health_page.title')}</h1>
        <p className="text-secondary-text mt-1">{t('admin_system_health_page.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {healthStatus.map((item, index) => {
          const statusLabel = t(`admin_system_health_page.${item.statusKey}`)
          const ok = item.statusKey === 'healthy' || item.statusKey === 'running'
          return (
            <Card key={index}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-text">
                  {t(`admin_system_health_page.${item.serviceKey}`)}
                </h3>
                <Badge variant={ok ? 'success' : 'danger'}>{statusLabel}</Badge>
              </div>
              <div className="text-sm text-secondary-text">
                {t('admin_system_health_page.uptime')}:{' '}
                <span className="font-semibold text-primary-text">{item.uptime}</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default SystemHealth
