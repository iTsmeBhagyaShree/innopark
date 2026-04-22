import { useState } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { IoCloudUpload, IoCheckmarkCircle, IoAlertCircle, IoRefresh, IoDownload } from 'react-icons/io5'

const SystemUpdates = () => {
  const [isChecking, setIsChecking] = useState(false)
  const [currentVersion] = useState('v2.1.0')
  const [latestVersion] = useState('v2.2.0')
  const [updateAvailable, setUpdateAvailable] = useState(true)
  const [updateHistory] = useState([
    {
      id: 1,
      version: 'v2.1.0',
      date: '2024-01-15',
      changes: ['Bug fixes', 'Performance improvements', 'New features'],
      status: 'installed',
    },
    {
      id: 2,
      version: 'v2.0.5',
      date: '2024-01-01',
      changes: ['Security patches', 'UI improvements'],
      status: 'installed',
    },
  ])

  const handleCheckUpdates = () => {
    setIsChecking(true)
    setTimeout(() => {
      setIsChecking(false)
      setUpdateAvailable(true)
      alert('Update check completed! New version available.')
    }, 2000)
  }

  const handleUpdate = () => {
    if (window.confirm(`Update to ${latestVersion}? The system will restart after update.`)) {
      alert('Update started. Please wait...')
      // Simulate update process
      setTimeout(() => {
        alert('Update completed successfully! System will restart.')
      }, 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">System Updates</h1>
        <p className="text-secondary-text mt-1">Check for and apply system updates</p>
      </div>

      {/* Current Version */}
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary-accent/10 rounded-lg">
              <IoCloudUpload className="text-primary-accent" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary-text">Current Version</h2>
              <p className="text-lg font-bold text-primary-accent mt-1">{currentVersion}</p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={handleCheckUpdates}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            <IoRefresh className={isChecking ? 'animate-spin' : ''} size={18} />
            {isChecking ? 'Checking...' : 'Check for Updates'}
          </Button>
        </div>

        {updateAvailable && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <IoAlertCircle className="text-green-600 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 mb-1">Update Available</h3>
                <p className="text-sm text-green-700 mb-3">
                  New version <span className="font-semibold">{latestVersion}</span> is available for download.
                </p>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={handleUpdate} className="flex items-center gap-2">
                    <IoDownload size={18} />
                    Update Now
                  </Button>
                  <Button variant="outline" onClick={() => alert('Update scheduled for tonight at 2 AM')}>
                    Schedule Update
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!updateAvailable && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <IoCheckmarkCircle className="text-blue-600" size={20} />
              <p className="text-sm text-blue-800">
                Your system is up to date. You're running the latest version.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Update Settings */}
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-primary-text mb-4">Update Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-primary-text">Auto Update</h3>
              <p className="text-sm text-secondary-text">Automatically download and install updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-primary-text">Update Notifications</h3>
              <p className="text-sm text-secondary-text">Receive notifications when updates are available</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-primary-text">Beta Updates</h3>
              <p className="text-sm text-secondary-text">Include beta and pre-release updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Update History */}
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-primary-text mb-4">Update History</h2>
        <div className="space-y-3">
          {updateHistory.map((update) => (
            <div
              key={update.id}
              className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="success">{update.version}</Badge>
                  <span className="text-sm text-secondary-text">{update.date}</span>
                </div>
                <ul className="list-disc list-inside text-sm text-secondary-text space-y-1">
                  {update.changes.map((change, idx) => (
                    <li key={idx}>{change}</li>
                  ))}
                </ul>
              </div>
              <Badge variant="success" className="flex items-center gap-1">
                <IoCheckmarkCircle size={14} />
                Installed
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Important Notes */}
      <Card className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-primary-text mb-2">Important Notes</h3>
        <ul className="space-y-2 text-sm text-secondary-text list-disc list-inside">
          <li>Updates are gated by license validation</li>
          <li>Always backup your database before updating</li>
          <li>System will restart automatically after update</li>
          <li>Updates may take 5-10 minutes to complete</li>
        </ul>
      </Card>
    </div>
  )
}

export default SystemUpdates

