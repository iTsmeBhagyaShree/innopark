import { useState } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { IoLockClosed } from 'react-icons/io5'
import { useLanguage } from '../../../context/LanguageContext.jsx'

const PaymentGateways = () => {
  const { t } = useLanguage()

  const [gateways] = useState([
    {
      id: 1,
      name: 'Stripe',
      descKey: 'stripe_desc',
      icon: '💳',
      isEnabled: true,
      credentials: {
        publishableKey: 'pk_test_...',
        secretKey: 'sk_test_...',
      },
    },
    {
      id: 2,
      name: 'PayPal',
      descKey: 'paypal_desc',
      icon: '🔵',
      isEnabled: true,
      credentials: {
        clientId: 'client_id_...',
        clientSecret: 'client_secret_...',
      },
    },
    {
      id: 3,
      name: 'Razorpay',
      descKey: 'razorpay_desc',
      icon: '💸',
      isEnabled: false,
      credentials: {
        keyId: '',
        keySecret: '',
      },
    },
  ])

  const [selectedGateway, setSelectedGateway] = useState(null)
  const [formData, setFormData] = useState({})

  const handleToggle = (gateway) => {
    const action = gateway.isEnabled
      ? t('admin_payment_gateways_page.action_disable')
      : t('admin_payment_gateways_page.action_enable')
    if (
      window.confirm(
        t('admin_payment_gateways_page.confirm_toggle').replace('{{action}}', action).replace('{{name}}', gateway.name)
      )
    ) {
      const state = gateway.isEnabled
        ? t('admin_payment_gateways_page.state_disabled')
        : t('admin_payment_gateways_page.state_enabled')
      alert(
        t('admin_payment_gateways_page.alert_toggled').replace('{{name}}', gateway.name).replace('{{state}}', state)
      )
    }
  }

  const handleEdit = (gateway) => {
    setSelectedGateway(gateway)
    setFormData(gateway.credentials)
  }

  const handleSave = () => {
    alert(t('admin_payment_gateways_page.alert_saved'))
    setSelectedGateway(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">{t('admin_payment_gateways_page.title')}</h1>
        <p className="text-secondary-text mt-1">{t('admin_payment_gateways_page.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gateways.map((gateway) => (
          <Card key={gateway.id} className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{gateway.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-text">{gateway.name}</h3>
                  <Badge variant={gateway.isEnabled ? 'success' : 'default'} className="mt-1">
                    {gateway.isEnabled ? t('admin_payment_gateways_page.enabled') : t('admin_payment_gateways_page.disabled')}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-secondary-text mb-4">{t(`admin_payment_gateways_page.${gateway.descKey}`)}</p>
            <div className="flex gap-2 justify-end">
              <Button
                variant={gateway.isEnabled ? 'outline' : 'primary'}
                onClick={() => handleToggle(gateway)}
                className="px-4"
              >
                {gateway.isEnabled ? t('admin_payment_gateways_page.disable') : t('admin_payment_gateways_page.enable')}
              </Button>
              <Button variant="outline" onClick={() => handleEdit(gateway)} className="px-4">
                {t('admin_payment_gateways_page.configure')}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedGateway && (
        <Card className="p-6 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{selectedGateway.icon}</div>
              <div>
                <h2 className="text-xl font-semibold text-primary-text">
                  {t('admin_payment_gateways_page.configuration_title').replace('{{name}}', selectedGateway.name)}
                </h2>
                <p className="text-sm text-secondary-text">{t('admin_payment_gateways_page.enter_api_credentials')}</p>
              </div>
            </div>
            <Badge variant={selectedGateway.isEnabled ? 'success' : 'default'}>
              {selectedGateway.isEnabled ? t('admin_payment_gateways_page.enabled') : t('admin_payment_gateways_page.disabled')}
            </Badge>
          </div>

          <div className="space-y-4">
            {selectedGateway.name === 'Stripe' && (
              <>
                <Input
                  label={t('admin_payment_gateways_page.publishable_key')}
                  value={formData.publishableKey || ''}
                  onChange={(e) => setFormData({ ...formData, publishableKey: e.target.value })}
                  placeholder="pk_test_..."
                />
                <Input
                  label={t('admin_payment_gateways_page.secret_key')}
                  type="password"
                  value={formData.secretKey || ''}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  placeholder="sk_test_..."
                />
              </>
            )}

            {selectedGateway.name === 'PayPal' && (
              <>
                <Input
                  label={t('admin_accounting_integration.client_id')}
                  value={formData.clientId || ''}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder={t('admin_payment_gateways_page.ph_paypal_client')}
                />
                <Input
                  label={t('admin_accounting_integration.client_secret')}
                  type="password"
                  value={formData.clientSecret || ''}
                  onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                  placeholder={t('admin_payment_gateways_page.ph_paypal_secret')}
                />
              </>
            )}

            {selectedGateway.name === 'Razorpay' && (
              <>
                <Input
                  label={t('admin_payment_gateways_page.key_id')}
                  value={formData.keyId || ''}
                  onChange={(e) => setFormData({ ...formData, keyId: e.target.value })}
                  placeholder={t('admin_payment_gateways_page.ph_razorpay_key')}
                />
                <Input
                  label={t('admin_payment_gateways_page.key_secret')}
                  type="password"
                  value={formData.keySecret || ''}
                  onChange={(e) => setFormData({ ...formData, keySecret: e.target.value })}
                  placeholder={t('admin_payment_gateways_page.ph_razorpay_secret')}
                />
              </>
            )}

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <IoLockClosed className="text-yellow-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-yellow-800">{t('admin_payment_gateways_page.security_notice')}</p>
                  <p className="text-xs text-yellow-700 mt-1">{t('admin_payment_gateways_page.security_body')}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 justify-end">
              <Button variant="outline" onClick={() => setSelectedGateway(null)} className="px-4">
                {t('admin_payment_gateways_page.cancel')}
              </Button>
              <Button variant="primary" onClick={handleSave} className="px-4">
                {t('admin_payment_gateways_page.save_credentials')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {selectedGateway && selectedGateway.isEnabled && (
        <Card className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-primary-text mb-2">{t('admin_payment_gateways_page.test_payment')}</h3>
          <p className="text-sm text-secondary-text mb-4">
            {t('admin_payment_gateways_page.test_payment_desc').replace('{{name}}', selectedGateway.name)}
          </p>
          <Button variant="outline" onClick={() => alert(t('admin_payment_gateways_page.test_payment_alert'))}>
            {t('admin_payment_gateways_page.test_payment_btn')}
          </Button>
        </Card>
      )}
    </div>
  )
}

export default PaymentGateways
