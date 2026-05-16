import { useMemo, useState } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { IoCloudUpload, IoCheckmarkCircle, IoAlertCircle, IoRefresh, IoDownload } from 'react-icons/io5'
import { useLanguage } from '../../../context/LanguageContext.jsx'

const SystemUpdates = () => {
  const { t } = useLanguage()
  const [isChecking, setIsChecking] = useState(false)
  const [currentVersion] = useState('v2.1.0')
  const [latestVersion] = useState('v2.2.0')
  const [updateAvailable, setUpdateAvailable] = useState(true)

  const updateHistory = useMemo(
    () => [
      {
        id: 1,
        version: 'v2.1.0',
        date: '2024-01-15',
        changes: [
          t('admin_system_updates_page.demo_c1'),
          t('admin_system_updates_page.demo_c2'),
          t('admin_system_updates_page.demo_c3'),
        ],
        status: 'installed',
      },
      {
        id: 2,
        version: 'v2.0.5',
        date: '2024-01-01',
        changes: [t('admin_system_updates_page.demo_c4'), t('admin_system_updates_page.demo_c5')],
        status: 'installed',
      },
    ],
    [t]
  )

  const handleCheckUpdates = () => {
    setIsChecking(true)
    setTimeout(() => {
      setIsChecking(false)
      setUpdateAvailable(true)
      alert(t('admin_system_updates_page.alert_check_done'))
    }, 2000)
  }

  const handleUpdate = () => {
    if (
      window.confirm(t('admin_system_updates_page.confirm_update').replace('{{version}}', latestVersion))
    ) {
      alert(t('admin_system_updates_page.alert_update_started'))
      setTimeout(() => {
        alert(t('admin_system_updates_page.alert_update_done'))
      }, 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">{t('admin_system_updates_page.title')}</h1>
        <p className="text-secondary-text mt-1">{t('admin_system_updates_page.subtitle')}</p>
      </div>

      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary-accent/10 rounded-lg">
              <IoCloudUpload className="text-primary-accent" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary-text">{t('admin_system_updates_page.current_version')}</h2>
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
            {isChecking ? t('admin_system_updates_page.checking') : t('admin_system_updates_page.check_updates')}
          </Button>
        </div>

        {updateAvailable && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <IoAlertCircle className="text-green-600 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 mb-1">{t('admin_system_updates_page.update_available')}</h3>
                <p className="text-sm text-green-700 mb-3">
                  {t('admin_system_updates_page.update_available_body').replace('{{version}}', latestVersion)}
                </p>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={handleUpdate} className="flex items-center gap-2">
                    <IoDownload size={18} />
                    {t('admin_system_updates_page.update_now')}
                  </Button>
                  <Button variant="outline" onClick={() => alert(t('admin_system_updates_page.alert_scheduled'))}>
                    {t('admin_system_updates_page.schedule_update')}
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
              <p className="text-sm text-blue-800">{t('admin_system_updates_page.up_to_date')}</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-primary-text mb-4">{t('admin_system_updates_page.update_settings')}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-primary-text">{t('admin_system_updates_page.auto_update')}</h3>
              <p className="text-sm text-secondary-text">{t('admin_system_updates_page.auto_update_desc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent" />
            </label>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-primary-text">{t('admin_system_updates_page.update_notifications')}</h3>
              <p className="text-sm text-secondary-text">{t('admin_system_updates_page.update_notifications_desc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent" />
            </label>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-primary-text">{t('admin_system_updates_page.beta_updates')}</h3>
              <p className="text-sm text-secondary-text">{t('admin_system_updates_page.beta_updates_desc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent" />
            </label>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-primary-text mb-4">{t('admin_system_updates_page.history_title')}</h2>
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
                {t('admin_system_updates_page.installed')}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-primary-text mb-2">{t('admin_system_updates_page.important_notes')}</h3>
        <ul className="space-y-2 text-sm text-secondary-text list-disc list-inside">
          <li>{t('admin_system_updates_page.note_1')}</li>
          <li>{t('admin_system_updates_page.note_2')}</li>
          <li>{t('admin_system_updates_page.note_3')}</li>
          <li>{t('admin_system_updates_page.note_4')}</li>
        </ul>
      </Card>
    </div>
  )
}

export default SystemUpdates
