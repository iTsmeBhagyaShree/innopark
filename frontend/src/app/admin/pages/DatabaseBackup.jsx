import { useState } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { IoServer, IoDownload, IoRefresh, IoTime, IoCheckmarkCircle, IoTrash } from 'react-icons/io5'
import { useLanguage } from '../../../context/LanguageContext.jsx'

const DatabaseBackup = () => {
  const { t } = useLanguage()
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
      alert(t('admin_database_backup_page.alert_created'))
    }, 3000)
  }

  const handleDownload = (backup) => {
    alert(t('admin_database_backup_page.alert_download').replace('{{name}}', backup.name))
  }

  const handleDelete = (backup) => {
    if (window.confirm(t('admin_database_backup_page.confirm_delete').replace('{{name}}', backup.name))) {
      alert(t('admin_database_backup_page.alert_deleted'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">{t('admin_database_backup_page.title')}</h1>
        <p className="text-secondary-text mt-1">{t('admin_database_backup_page.subtitle')}</p>
      </div>

      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary-accent/10 rounded-lg">
              <IoServer className="text-primary-accent" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary-text">{t('admin_database_backup_page.card_title')}</h2>
              <p className="text-sm text-secondary-text">{t('admin_database_backup_page.card_desc')}</p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={handleCreateBackup}
            disabled={isBackingUp}
            className="flex items-center gap-2"
          >
            <IoRefresh className={isBackingUp ? 'animate-spin' : ''} size={18} />
            {isBackingUp ? t('admin_database_backup_page.creating') : t('admin_database_backup_page.create_now')}
          </Button>
        </div>

        {isBackingUp && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <IoRefresh className="animate-spin text-blue-600" size={20} />
              <div>
                <p className="text-sm font-medium text-blue-800">{t('admin_database_backup_page.progress_title')}</p>
                <p className="text-xs text-blue-700 mt-1">{t('admin_database_backup_page.progress_desc')}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-primary-text mb-4">{t('admin_database_backup_page.settings_title')}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-primary-text">{t('admin_database_backup_page.automatic')}</h3>
              <p className="text-sm text-secondary-text">{t('admin_database_backup_page.automatic_desc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent" />
            </label>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-primary-text">{t('admin_database_backup_page.backup_time')}</h3>
              <p className="text-sm text-secondary-text">{t('admin_database_backup_page.schedule_desc')}</p>
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none">
              <option>2:00 AM</option>
              <option>3:00 AM</option>
              <option>4:00 AM</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-primary-text">{t('admin_database_backup_page.retention')}</h3>
              <p className="text-sm text-secondary-text">{t('admin_database_backup_page.retention_desc')}</p>
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none">
              <option>{t('admin_database_backup_page.days_7')}</option>
              <option>{t('admin_database_backup_page.days_14')}</option>
              <option>{t('admin_database_backup_page.days_30')}</option>
              <option>{t('admin_database_backup_page.days_90')}</option>
            </select>
          </div>
          <div className="pt-4">
            <Button variant="primary">{t('admin_database_backup_page.save_settings')}</Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-primary-text mb-4">{t('admin_database_backup_page.recent_title')}</h2>
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
                  {t('admin_database_backup_page.status_completed')}
                </Badge>
                <Button
                  variant="ghost"
                  onClick={() => handleDownload(backup)}
                  className="p-2"
                  title={t('admin_database_backup_page.download')}
                >
                  <IoDownload size={18} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(backup)}
                  className="p-2 text-danger hover:text-danger"
                  title={t('admin_database_backup_page.delete')}
                >
                  <IoTrash size={18} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-primary-text mb-2">{t('admin_database_backup_page.important_notes')}</h3>
        <ul className="space-y-2 text-sm text-secondary-text list-disc list-inside">
          <li>{t('admin_database_backup_page.n1')}</li>
          <li>{t('admin_database_backup_page.n2')}</li>
          <li>{t('admin_database_backup_page.n3')}</li>
          <li>{t('admin_database_backup_page.n4')}</li>
        </ul>
      </Card>
    </div>
  )
}

export default DatabaseBackup
