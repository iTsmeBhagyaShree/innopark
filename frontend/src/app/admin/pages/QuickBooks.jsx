import { useState } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { IoExtensionPuzzle, IoCheckmarkCircle, IoCloseCircle, IoRefresh } from 'react-icons/io5'

const QuickBooks = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    companyId: '',
    accessToken: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsConnected(true)
      setIsLoading(false)
      alert('QuickBooks connected successfully!')
    }, 1500)
  }

  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect QuickBooks?')) {
      setIsConnected(false)
      setFormData({
        clientId: '',
        clientSecret: '',
        companyId: '',
        accessToken: '',
      })
      alert('QuickBooks disconnected successfully!')
    }
  }

  const handleSave = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      alert('Settings saved successfully!')
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">QuickBooks Integration</h1>
        <p className="text-secondary-text mt-1">Connect and manage your QuickBooks account</p>
      </div>

      {/* Connection Status */}
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-100 rounded-lg">
              <IoExtensionPuzzle className="text-green-600" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary-text">QuickBooks</h2>
              <p className="text-sm text-secondary-text">Accounting and financial management</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'success' : 'default'} className="flex items-center gap-2">
            {isConnected ? (
              <>
                <IoCheckmarkCircle size={16} />
                Connected
              </>
            ) : (
              <>
                <IoCloseCircle size={16} />
                Not Connected
              </>
            )}
          </Badge>
        </div>

        {isConnected ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ QuickBooks is connected and syncing data automatically.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Company ID
                </label>
                <Input value={formData.companyId} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Last Sync
                </label>
                <Input value="5 minutes ago" readOnly />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
              <Button variant="primary" onClick={() => alert('Syncing data...')}>
                <IoRefresh className="inline mr-2" size={18} />
                Sync Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Connect your QuickBooks account to sync invoices, payments, and financial data automatically.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Client ID"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                placeholder="Enter QuickBooks Client ID"
              />
              <Input
                label="Client Secret"
                type="password"
                value={formData.clientSecret}
                onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                placeholder="Enter Client Secret"
              />
              <Input
                label="Company ID"
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                placeholder="Enter Company ID"
              />
              <Input
                label="Access Token"
                type="password"
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                placeholder="Enter Access Token"
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
                    Connecting...
                  </>
                ) : (
                  'Connect QuickBooks'
                )}
              </Button>
              <Button variant="outline" onClick={() => window.open('https://developer.intuit.com/', '_blank')}>
                Get Credentials
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Sync Settings */}
      {isConnected && (
        <Card className="p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-primary-text mb-4">Sync Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-semibold text-primary-text">Sync Invoices</h3>
                <p className="text-sm text-secondary-text">Automatically sync invoices from QuickBooks</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-semibold text-primary-text">Sync Payments</h3>
                <p className="text-sm text-secondary-text">Automatically sync payment records</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-semibold text-primary-text">Sync Customers</h3>
                <p className="text-sm text-secondary-text">Sync customer data from QuickBooks</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
              </label>
            </div>
            <div className="pt-4">
              <Button variant="primary" onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Documentation */}
      <Card className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-primary-text mb-2">Need Help?</h3>
        <p className="text-sm text-secondary-text mb-4">
          Learn how to get your QuickBooks API credentials and set up the integration.
        </p>
        <Button variant="outline" onClick={() => window.open('https://developer.intuit.com/app/developer/qbo/docs', '_blank')}>
          View Documentation
        </Button>
      </Card>
    </div>
  )
}

export default QuickBooks

