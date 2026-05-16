import { useState, useEffect, useMemo } from 'react'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Card from '../../../components/ui/Card'
import { auditLogsAPI } from '../../../api'
import { IoSearch } from 'react-icons/io5'
import { useLanguage } from '../../../context/LanguageContext.jsx'

const AuditLogs = () => {
  const { t, language } = useLanguage()
  const localeTag = language === 'de' ? 'de-DE' : 'en-GB'

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [actionFilter, startDate, endDate])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchLogs()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await auditLogsAPI.getAll({
        action: actionFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: searchQuery || undefined,
      })
      if (response.data.success) {
        setLogs(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'user_name',
        label: t('admin_audit_logs_page.col_user'),
        render: (value, row) => (
          <div>
            <p className="font-medium text-primary-text">{value || row.user_email || t('admin_audit_logs_page.system')}</p>
            {row.user_email && value && <p className="text-sm text-secondary-text">{row.user_email}</p>}
          </div>
        ),
      },
      {
        key: 'action',
        label: t('admin_audit_logs_page.col_action'),
        render: (value) => {
          const labelMap = {
            Created: t('admin_audit_logs_page.action_created'),
            Updated: t('admin_audit_logs_page.action_updated'),
            Deleted: t('admin_audit_logs_page.action_deleted'),
            Viewed: t('admin_audit_logs_page.action_viewed'),
          }
          const display = labelMap[value] || value
          return (
            <Badge
              variant={
                value === 'Created' ? 'success' : value === 'Updated' ? 'info' : value === 'Deleted' ? 'danger' : 'default'
              }
            >
              {display}
            </Badge>
          )
        },
      },
      {
        key: 'entity_type',
        label: t('admin_audit_logs_page.col_module'),
        render: (value) => <span className="text-primary-text font-medium">{value}</span>,
      },
      {
        key: 'description',
        label: t('admin_audit_logs_page.col_description'),
        render: (value) => <span className="text-primary-text">{value || t('admin_audit_logs_page.na')}</span>,
      },
      {
        key: 'created_at',
        label: t('admin_audit_logs_page.col_timestamp'),
        render: (value) => (
          <span className="text-secondary-text">
            {new Date(value).toLocaleString(localeTag, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ),
      },
    ],
    [t, localeTag]
  )

  const filteredLogs = logs.filter((log) => {
    if (
      searchQuery &&
      !log.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">{t('admin_audit_logs_page.title')}</h1>
        <p className="text-secondary-text mt-1">{t('admin_audit_logs_page.subtitle')}</p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text" size={18} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin_audit_logs_page.search_placeholder')}
              className="pl-10"
            />
          </div>
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="">{t('admin_audit_logs_page.all_actions')}</option>
              <option value="Created">{t('admin_audit_logs_page.action_created')}</option>
              <option value="Updated">{t('admin_audit_logs_page.action_updated')}</option>
              <option value="Deleted">{t('admin_audit_logs_page.action_deleted')}</option>
              <option value="Viewed">{t('admin_audit_logs_page.action_viewed')}</option>
            </select>
          </div>
          <div>
            <Input type="date" label={t('admin_audit_logs_page.start_date')} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Input type="date" label={t('admin_audit_logs_page.end_date')} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </Card>

      <DataTable columns={columns} data={filteredLogs} loading={loading} emptyMessage={t('admin_audit_logs_page.empty')} />
    </div>
  )
}

export default AuditLogs
