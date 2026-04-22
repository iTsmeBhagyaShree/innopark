import { useState, useEffect } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import DataTable from '../../../components/ui/DataTable'
import axiosInstance from '../../../api/axiosInstance'
import { IoTicket, IoSearch } from 'react-icons/io5'

const SupportTickets = () => {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/superadmin/support-tickets', {
        params: {
          status: statusFilter || undefined
        }
      })
      if (response.data.success) {
        setTickets(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchTickets()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const columns = [
    { key: 'ticket_id', label: 'Ticket-ID' },
    { key: 'subject', label: 'Betreff' },
    { key: 'company_name', label: 'Unternehmen' },
    { key: 'client_name', label: 'Kunde' },
    {
      key: 'priority',
      label: 'Priorität',
      render: (value) => (
        <Badge variant={value === 'High' ? 'danger' : value === 'Medium' ? 'warning' : 'info'}>
          {value === 'High' ? 'Hoch' : value === 'Medium' ? 'Mittel' : 'Niedrig'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge variant={value === 'Closed' ? 'success' : value === 'Open' ? 'info' : 'warning'}>
          {value === 'Closed' ? 'Geschlossen' : value === 'Open' ? 'Offen' : 'Ausstehend'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Erstellt',
      render: (value) => (
        <span>{new Date(value).toLocaleDateString('de-DE')}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-text">Support-Tickets</h1>
          <p className="text-secondary-text mt-1">Support-Tickets aller Unternehmen anzeigen und verwalten</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text" size={20} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="pl-10"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            >
              <option value="">Alle Status</option>
              <option value="Open">Offen</option>
              <option value="Pending">Ausstehend</option>
              <option value="Closed">Geschlossen</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card className="p-0">
        <DataTable
          data={tickets}
          columns={columns}
          loading={loading}
          emptyMessage="Keine Support-Tickets gefunden"
        />
      </Card>
    </div>
  )
}

export default SupportTickets
