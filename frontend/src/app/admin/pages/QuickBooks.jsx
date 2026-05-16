import { useState } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { IoExtensionPuzzle, IoCheckmarkCircle, IoCloseCircle, IoRefresh } from 'react-icons/io5'
import { useLanguage } from '../../../context/LanguageContext.jsx'

const QuickBooks = () => {
  const { t } = useLanguage()
  const [isConnected, setIsConnected] = useState(false)
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    companyId: '',
    accessToken: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const product = t('admin_accounting_integration.product_qb')

  const handleConnect = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsConnected(true)
      setIsLoading(false)
      alert(t('admin_accounting_integration.alert_connected_qb'))
    }, 1500)
  }

  const handleDisconnect = () => {
    if (window.confirm(t('admin_accounting_integration.confirm_disconnect_qb'))) {
      setIsConnected(false)
      setFormData({
        clientId: '',
        clientSecret: '',
        companyId: '',
        accessToken: '',
      })
      alert(t('admin_accounting_integration.alert_disconnected_qb'))
    }
  }

  const handleSave = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      alert(t('admin_accounting_integration.alert_saved'))
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">{t('admin_accounting_integration.title_qb')}</h1>
        <p className="text-secondary-text mt-1">{t('admin_accounting_integration.subtitle_qb')}</p>
      </div>

      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-100 rounded-lg">
              <IoExtensionPuzzle className="text-green-600" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary-text">{product}</h2>
              <p className="text-sm text-secondary-text">{t('admin_accounting_integration.accounting_finance')}</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'success' : 'default'} className="flex items-center gap-2">
            {isConnected ? (
              <>
                <IoCheckmarkCircle size={16} />
                {t('admin_accounting_integration.connected')}
              </>
            ) : (
              <>
                <IoCloseCircle size={16} />
                {t('admin_accounting_integration.not_connected')}
              </>
            )}
          </Badge>
        </div>

        {isConnected ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ {t('admin_accounting_integration.connected_sync').replace('{{product}}', product)}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  {t('admin_accounting_integration.company_id')}
                </label>
                <Input value={formData.companyId} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  {t('admin_accounting_integration.last_sync')}
                </label>
                <Input value="5 minutes ago" readOnly />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDisconnect}>
                {t('admin_accounting_integration.disconnect')}
              </Button>
              <Button variant="primary" onClick={() => alert(t('admin_accounting_integration.syncing_alert'))}>
                <IoRefresh className="inline mr-2" size={18} />
                {t('admin_accounting_integration.sync_now')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">{t('admin_accounting_integration.connect_hint_qb')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('admin_accounting_integration.client_id')}
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                placeholder={t('admin_accounting_integration.ph_client_id_qb')}
              />
              <Input
                label={t('admin_accounting_integration.client_secret')}
                type="password"
                value={formData.clientSecret}
                onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                placeholder={t('admin_accounting_integration.ph_client_secret')}
              />
              <Input
                label={t('admin_accounting_integration.company_id')}
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                placeholder={t('admin_accounting_integration.ph_company_id')}
              />
              <Input
                label={t('admin_accounting_integration.access_token')}
                type="password"
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                placeholder={t('admin_accounting_integration.ph_access_token')}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleConnect}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <IoRefresh className="animate-spin" size={18} />
                    {t('admin_accounting_integration.connecting')}
                  </>
                ) : (
                  t('admin_accounting_integration.connect_qb')
                )}
              </Button>
              <Button variant="outline" onClick={() => window.open('https://developer.intuit.com/', '_blank')}>
                {t('admin_accounting_integration.get_credentials')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {isConnected && (
        <Card className="p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-primary-text mb-4">{t('admin_accounting_integration.sync_settings')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-semibold text-primary-text">{t('admin_accounting_integration.sync_invoices')}</h3>
                <p className="text-sm text-secondary-text">{t('admin_accounting_integration.sync_invoices_qb')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent" />
              </label>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-semibold text-primary-text">{t('admin_accounting_integration.sync_payments')}</h3>
                <p className="text-sm text-secondary-text">{t('admin_accounting_integration.sync_payments_desc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent" />
              </label>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-semibold text-primary-text">{t('admin_accounting_integration.sync_customers')}</h3>
                <p className="text-sm text-secondary-text">{t('admin_accounting_integration.sync_customers_qb')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent" />
              </label>
            </div>
            <div className="pt-4">
              <Button variant="primary" onClick={handleSave} disabled={isLoading}>
                {isLoading ? t('admin_accounting_integration.saving') : t('admin_accounting_integration.save_settings')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-primary-text mb-2">{t('admin_accounting_integration.need_help')}</h3>
        <p className="text-sm text-secondary-text mb-4">{t('admin_accounting_integration.help_qb')}</p>
        <Button variant="outline" onClick={() => window.open('https://developer.intuit.com/app/developer/qbo/docs', '_blank')}>
          {t('admin_accounting_integration.view_documentation')}
        </Button>
      </Card>
    </div>
  )
}

export default QuickBooks
