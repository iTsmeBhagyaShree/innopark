import { useState } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { IoServer, IoDownload, IoRefresh, IoTime, IoCheckmarkCircle, IoTrash } from 'react-icons/io5'

const DatabaseBackup = () => {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backups] = useState([
    {
      id: 1,
      name: 'backup_2024-02-15_10-30-00.sql',
      size: '245 MB',
      date: '2024-02-15 10:30 AM',
      status: 'completed',
    },
    {
      id: 2,
      name: 'backup_2024-02-14_02-00-00.sql',
      size: '238 MB',
      date: '2024-02-14 02:00 AM',
      status: 'completed',
    },
    {
      id: 3,
      name: 'backup_2024-02-13_02-00-00.sql',
      size: '231 MB',
      date: '2024-02-13 02:00 AM',
      status: 'completed',
    },
  ])

  const handleCreateBackup = () => {
    setIsBackingUp(true)
    setTimeout(() => {
      setIsBackingUp(false)
      alert('Backup created successfully!')
    }, 3000)
  }

  const handleDownload = (backup) => {
    alert(`Downloading ${backup.name}...`)
  }

  const handleDelete = (backup) => {
    if (window.confirm(`Are you sure you want to delete ${backup.name}?`)) {
      alert('Backup deleted successfully!')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">Database Backup</h1>
        <p className="text-secondary-text mt-1">Create and manage database backups</p>
      </div>

      {/* Backup Actions */}
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary-accent/10 rounded-lg">
              <IoServer className="text-primary-accent" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary-text">Database Backup</h2>
              <p className="text-sm text-secondary-text">Create manual backups or schedule automatic backups</p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={handleCreateBackup}
            disabled={isBackingUp}
            className="flex items-center gap-2"
          >
            <IoRefresh className={isBackingUp ? 'animate-spin' : ''} size={18} />
            {isBackingUp ? 'Creating Backup...' : 'Create Backup Now'}
          </Button>
        </div>

        {isBackingUp && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <IoRefresh className="animate-spin text-blue-600" size={20} />
              <div>
                <p className="text-sm font-medium text-blue-800">Backup in progress...</p>
                <p className="text-xs text-blue-700 mt-1">Please wait while we create your backup.</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Backup Settings */}
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-primary-text mb-4">Backup Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-primary-text">Automatic Backups</h3>
              <p className="text-sm text-secondary-text">Enable automatic daily backups</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-primary-text">Backup Time</h3>
              <p className="text-sm text-secondary-text">Schedule automatic backups</p>
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none">
              <option>2:00 AM</option>
              <option>3:00 AM</option>
              <option>4:00 AM</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-primary-text">Retention Period</h3>
              <p className="text-sm text-secondary-text">Keep backups for specified days</p>
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none">
              <option>7 days</option>
              <option>14 days</option>
              <option>30 days</option>
              <option>90 days</option>
            </select>
          </div>
          <div className="pt-4">
            <Button variant="primary">Save Settings</Button>
          </div>
        </div>
      </Card>

      {/* Backup List */}
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-primary-text mb-4">Recent Backups</h2>
        <div className="space-y-3">
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 bg-primary-accent/10 rounded-lg">
                  <IoServer className="text-primary-accent" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-primary-text truncate">{backup.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-secondary-text flex items-center gap-1">
                      <IoTime size={14} />
                      {backup.date}
                    </span>
                    <span className="text-xs text-secondary-text">{backup.size}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" className="flex items-center gap-1">
                  <IoCheckmarkCircle size={14} />
                  {backup.status}
                </Badge>
                <Button
                  variant="ghost"
                  onClick={() => handleDownload(backup)}
                  className="p-2"
                  title="Download"
                >
                  <IoDownload size={18} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(backup)}
                  className="p-2 text-danger hover:text-danger"
                  title="Delete"
                >
                  <IoTrash size={18} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Important Notes */}
      <Card className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-primary-text mb-2">Important Notes</h3>
        <ul className="space-y-2 text-sm text-secondary-text list-disc list-inside">
          <li>Backups are stored securely on the server</li>
          <li>Download backups regularly for additional safety</li>
          <li>Backups include all database tables and data</li>
          <li>Restore backups only if absolutely necessary</li>
        </ul>
      </Card>
    </div>
  )
}

export default DatabaseBackup

