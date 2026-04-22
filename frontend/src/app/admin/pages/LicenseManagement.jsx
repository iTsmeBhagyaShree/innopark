import { useState } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { IoKey, IoCheckmarkCircle, IoCloseCircle, IoRefresh } from 'react-icons/io5'

const LicenseManagement = () => {
  const [licenseKey, setLicenseKey] = useState('XXXX-XXXX-XXXX-XXXX-XXXX')
  const [boundDomain, setBoundDomain] = useState('crm.example.com')
  const [licenseStatus, setLicenseStatus] = useState('active') // active, expired, invalid
  const [lastValidated, setLastValidated] = useState('2024-01-15 10:30 AM')
  const [isValidating, setIsValidating] = useState(false)

  const [licenseHistory] = useState([
    {
      id: 1,
      action: 'License Validated',
      timestamp: '2024-01-15 10:30 AM',
      status: 'success',
      ip: '192.168.1.100',
    },
    {
      id: 2,
      action: 'Domain Binding Updated',
      timestamp: '2024-01-10 02:15 PM',
      status: 'success',
      ip: '192.168.1.100',
    },
    {
      id: 3,
      action: 'License Validation Failed',
      timestamp: '2024-01-05 09:00 AM',
      status: 'error',
      ip: '192.168.1.50',
    },
  ])

  const handleValidateLicense = () => {
    setIsValidating(true)
    // Simulate API call
    setTimeout(() => {
      setLicenseStatus('active')
      setLastValidated(new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }))
      setIsValidating(false)
      alert('License validated successfully!')
    }, 1500)
  }

  const handleForceRevalidate = () => {
    if (window.confirm('Force re-validation will check the license server immediately. Continue?')) {
      setIsValidating(true)
      setTimeout(() => {
        setLicenseStatus('active')
        setLastValidated(new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }))
        setIsValidating(false)
        alert('License re-validated successfully!')
      }, 1500)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">License Management</h1>
        <p className="text-secondary-text mt-1">View active licenses, domain/IP bindings, and check status</p>
      </div>

      {/* License Status Card */}
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-primary-text mb-2">Current License</h2>
            <div className="flex items-center gap-2">
              <Badge variant={licenseStatus === 'active' ? 'success' : licenseStatus === 'expired' ? 'warning' : 'danger'}>
                {licenseStatus === 'active' ? (
                  <>
                    <IoCheckmarkCircle className="inline mr-1" size={16} />
                    Active
                  </>
                ) : licenseStatus === 'expired' ? (
                  <>
                    <IoCloseCircle className="inline mr-1" size={16} />
                    Expired
                  </>
                ) : (
                  <>
                    <IoCloseCircle className="inline mr-1" size={16} />
                    Invalid
                  </>
                )}
              </Badge>
              <span className="text-sm text-secondary-text">
                Last validated: {lastValidated}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleValidateLicense}
              disabled={isValidating}
              className="flex items-center gap-2"
            >
              <IoRefresh size={18} className={isValidating ? 'animate-spin' : ''} />
              Validate License
            </Button>
            <Button
              variant="primary"
              onClick={handleForceRevalidate}
              disabled={isValidating}
              className="flex items-center gap-2"
            >
              <IoRefresh size={18} className={isValidating ? 'animate-spin' : ''} />
              Force Re-validate
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              License Key
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="font-mono text-sm"
                readOnly
              />
              <Button
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(licenseKey)
                  alert('License key copied to clipboard!')
                }}
                className="flex-shrink-0"
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-secondary-text mt-1">
              Your license key is bound to your domain
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Bound Domain
            </label>
            <Input
              value={boundDomain}
              onChange={(e) => setBoundDomain(e.target.value)}
              placeholder="example.com"
            />
            <p className="text-xs text-secondary-text mt-1">
              Domain/IP address where this license is active
            </p>
          </div>
        </div>
      </Card>

      {/* License Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-accent/10 rounded-lg">
              <IoKey className="text-primary-accent" size={24} />
            </div>
            <div>
              <p className="text-sm text-secondary-text">License Type</p>
              <p className="text-lg font-semibold text-primary-text">SaaS Multi-Company</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <IoCheckmarkCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-secondary-text">Expiry Date</p>
              <p className="text-lg font-semibold text-primary-text">Never (Lifetime)</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <IoRefresh className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-secondary-text">Validation Frequency</p>
              <p className="text-lg font-semibold text-primary-text">Daily</p>
            </div>
          </div>
        </Card>
      </div>

      {/* License History */}
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-primary-text mb-4">License History</h2>
        <div className="space-y-3">
          {licenseHistory.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  entry.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-primary-text">{entry.action}</p>
                  <p className="text-xs text-secondary-text mt-1">
                    {entry.timestamp} • IP: <span className="font-mono">{entry.ip}</span>
                  </p>
                </div>
              </div>
              <Badge variant={entry.status === 'success' ? 'success' : 'danger'}>
                {entry.status === 'success' ? 'Success' : 'Failed'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Important Notes */}
      <Card className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-primary-text mb-2">Important Notes</h3>
        <ul className="space-y-2 text-sm text-secondary-text list-disc list-inside">
          <li>License validation occurs automatically every 24 hours</li>
          <li>Domain binding prevents unauthorized usage</li>
          <li>Force re-validation bypasses the scheduled check</li>
          <li>Contact support if you need to change the bound domain</li>
        </ul>
      </Card>
    </div>
  )
}

export default LicenseManagement

