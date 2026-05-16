import { useMemo, useState } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { useLanguage } from '../../../context/LanguageContext.jsx'

const Integrations = () => {
  const { t } = useLanguage()
  const rows = useMemo(
    () => [
      { id: 1, nameKey: 'stripe', descKey: 'stripe_desc' },
      { id: 2, nameKey: 'email', descKey: 'email_desc' },
      { id: 3, nameKey: 'whatsapp', descKey: 'whatsapp_desc' },
      { id: 4, nameKey: 'slack', descKey: 'slack_desc' },
    ],
    []
  )

  const [enabledMap, setEnabledMap] = useState(() =>
    Object.fromEntries(rows.map((r) => [r.id, r.id <= 2]))
  )

  const toggleIntegration = (id) => {
    setEnabledMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">{t('admin_integrations_list.title')}</h1>
        <p className="text-secondary-text mt-1">{t('admin_integrations_list.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rows.map((integration) => {
          const enabled = !!enabledMap[integration.id]
          return (
            <Card key={integration.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary-text">
                    {t(`admin_integrations_list.${integration.nameKey}`)}
                  </h3>
                  <p className="text-sm text-secondary-text mt-1">
                    {t(`admin_integrations_list.${integration.descKey}`)}
                  </p>
                </div>
                <Badge variant={enabled ? 'success' : 'default'}>
                  {enabled ? t('admin_integrations_list.enabled') : t('admin_integrations_list.disabled')}
                </Badge>
              </div>
              <Button
                variant={enabled ? 'outline' : 'primary'}
                onClick={() => toggleIntegration(integration.id)}
                className="w-full"
              >
                {enabled ? t('admin_integrations_list.disable') : t('admin_integrations_list.enable')}
              </Button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default Integrations
