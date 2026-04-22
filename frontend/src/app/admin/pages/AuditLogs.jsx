import { useState, useEffect } from 'react'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Card from '../../../components/ui/Card'
import { auditLogsAPI } from '../../../api'
import { IoSearch, IoFilter } from 'react-icons/io5'

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [actionFilter, userFilter, startDate, endDate])

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
        user_id: userFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: searchQuery || undefined
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

  const columns = [
    {
      key: 'user_name',
      label: 'User',
      render: (value, row) => (
        <div>
          <p className="font-medium text-primary-text">{value || row.user_email || 'System'}</p>
          {row.user_email && value && (
            <p className="text-sm text-secondary-text">{row.user_email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (value) => (
        <Badge variant={
          value === 'Created' ? 'success' :
          value === 'Updated' ? 'info' :
          value === 'Deleted' ? 'danger' : 'default'
        }>
          {value}
        </Badge>
      ),
    },
    {
      key: 'entity_type',
      label: 'Module',
      render: (value) => (
        <span className="text-primary-text font-medium">{value}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => (
        <span className="text-primary-text">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (value) => (
        <span className="text-secondary-text">
          {new Date(value).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      ),
    },
  ]

  const filteredLogs = logs.filter(log => {
    if (searchQuery && !log.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">Audit Logs</h1>
        <p className="text-secondary-text mt-1">View system activity logs</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text" size={18} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="pl-10"
            />
          </div>
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="">All Actions</option>
              <option value="Created">Created</option>
              <option value="Updated">Updated</option>
              <option value="Deleted">Deleted</option>
              <option value="Viewed">Viewed</option>
            </select>
          </div>
          <div>
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Input
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={filteredLogs}
        loading={loading}
        emptyMessage="No audit logs found"
      />
    </div>
  )
}

export default AuditLogs
