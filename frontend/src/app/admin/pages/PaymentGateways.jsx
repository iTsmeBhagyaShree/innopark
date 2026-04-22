import { useState } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { IoCard, IoCheckmarkCircle, IoCloseCircle, IoLockClosed } from 'react-icons/io5'

const PaymentGateways = () => {
  const [gateways] = useState([
    {
      id: 1,
      name: 'Stripe',
      description: 'Accept payments via credit cards, debit cards, and digital wallets',
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
      description: 'Accept PayPal payments and credit cards',
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
      description: 'Accept payments via UPI, cards, netbanking, and wallets',
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
    if (window.confirm(`Are you sure you want to ${gateway.isEnabled ? 'disable' : 'enable'} ${gateway.name}?`)) {
      // Update gateway status
      alert(`${gateway.name} ${gateway.isEnabled ? 'disabled' : 'enabled'} successfully!`)
    }
  }

  const handleEdit = (gateway) => {
    setSelectedGateway(gateway)
    setFormData(gateway.credentials)
  }

  const handleSave = () => {
    alert('Payment gateway credentials saved successfully!')
    setSelectedGateway(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">Payment Gateways</h1>
        <p className="text-secondary-text mt-1">Configure payment gateways for invoice payments</p>
      </div>

      {/* Payment Gateways List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gateways.map((gateway) => (
          <Card key={gateway.id} className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{gateway.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-text">{gateway.name}</h3>
                  <Badge variant={gateway.isEnabled ? 'success' : 'default'} className="mt-1">
                    {gateway.isEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-secondary-text mb-4">{gateway.description}</p>
            <div className="flex gap-2 justify-end">
              <Button
                variant={gateway.isEnabled ? 'outline' : 'primary'}
                onClick={() => handleToggle(gateway)}
                className="px-4"
              >
                {gateway.isEnabled ? 'Disable' : 'Enable'}
              </Button>
              <Button variant="outline" onClick={() => handleEdit(gateway)} className="px-4">
                Configure
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Configuration Modal */}
      {selectedGateway && (
        <Card className="p-6 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{selectedGateway.icon}</div>
              <div>
                <h2 className="text-xl font-semibold text-primary-text">{selectedGateway.name} Configuration</h2>
                <p className="text-sm text-secondary-text">Enter your API credentials</p>
              </div>
            </div>
            <Badge variant={selectedGateway.isEnabled ? 'success' : 'default'}>
              {selectedGateway.isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="space-y-4">
            {selectedGateway.name === 'Stripe' && (
              <>
                <Input
                  label="Publishable Key"
                  value={formData.publishableKey || ''}
                  onChange={(e) => setFormData({ ...formData, publishableKey: e.target.value })}
                  placeholder="pk_test_..."
                />
                <Input
                  label="Secret Key"
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
                  label="Client ID"
                  value={formData.clientId || ''}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder="Enter PayPal Client ID"
                />
                <Input
                  label="Client Secret"
                  type="password"
                  value={formData.clientSecret || ''}
                  onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                  placeholder="Enter PayPal Client Secret"
                />
              </>
            )}

            {selectedGateway.name === 'Razorpay' && (
              <>
                <Input
                  label="Key ID"
                  value={formData.keyId || ''}
                  onChange={(e) => setFormData({ ...formData, keyId: e.target.value })}
                  placeholder="Enter Razorpay Key ID"
                />
                <Input
                  label="Key Secret"
                  type="password"
                  value={formData.keySecret || ''}
                  onChange={(e) => setFormData({ ...formData, keySecret: e.target.value })}
                  placeholder="Enter Razorpay Key Secret"
                />
              </>
            )}

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <IoLockClosed className="text-yellow-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Security Notice</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Your credentials are encrypted and stored securely. Never share your API keys publicly.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 justify-end">
              <Button variant="outline" onClick={() => setSelectedGateway(null)} className="px-4">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} className="px-4">
                Save Credentials
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Test Payment */}
      {selectedGateway && selectedGateway.isEnabled && (
        <Card className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-primary-text mb-2">Test Payment</h3>
          <p className="text-sm text-secondary-text mb-4">
            Test your {selectedGateway.name} integration with a test transaction.
          </p>
          <Button variant="outline" onClick={() => alert('Test payment initiated...')}>
            Test Payment
          </Button>
        </Card>
      )}
    </div>
  )
}

export default PaymentGateways

