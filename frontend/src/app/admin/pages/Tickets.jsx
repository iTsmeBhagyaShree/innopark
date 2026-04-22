import { useState, useEffect } from 'react'
import { ticketsAPI, employeesAPI } from '../../../api'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { IoPencil, IoTrashOutline, IoEye } from 'react-icons/io5'

const Tickets = () => {
  // Get company_id from localStorage
  const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [formData, setFormData] = useState({
    subject: '',
    priority: 'Medium',
    description: '',
    status: 'Open',
    assigned_to: '',
  })

  const [tickets, setTickets] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTickets()
    fetchEmployees()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchTickets:', companyId)
        setTickets([])
        setLoading(false)
        return
      }
      const response = await ticketsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        // Transform API data to match column keys
        const transformedTickets = (response.data.data || []).map(ticket => ({
          ...ticket,
          ticketId: ticket.ticket_id || `TKT-${ticket.id}`,
          assignedTo: ticket.assigned_to_name || 'Nicht zugewiesen',
          createdDate: ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'K.A.',
        }))
        setTickets(transformedTickets)
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      alert(error.response?.data?.error || 'Tickets konnten nicht abgerufen werden')
    } finally {
      setLoading(false)
    }
  }



  const fetchEmployees = async () => {
    try {
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchEmployees:', companyId)
        setEmployees([])
        return
      }
      const response = await employeesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        const employeesData = (response.data.data || []).map(emp => ({
          id: emp.user_id || emp.id,
          name: emp.name || emp.email || `Mitarbeiter #${emp.user_id || emp.id}`,
          email: emp.email || '',
        }))
        setEmployees(employeesData)
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
      setEmployees([])
    }
  }

  const columns = [
    { key: 'ticketId', label: 'Ticket-ID' },
    { key: 'subject', label: 'Betreff' },
    {
      key: 'priority',
      label: 'Priorität',
      render: (value) => {
        const priorityColors = {
          High: 'danger',
          Medium: 'warning',
          Low: 'info',
        }
        return <Badge variant={priorityColors[value] || 'default'}>{value}</Badge>
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusColors = {
          Open: 'info',
          Pending: 'warning',
          Closed: 'success',
        }
        return <Badge variant={statusColors[value] || 'default'}>{value}</Badge>
      },
    },
    { key: 'assignedTo', label: 'Zugewiesen' },
    { key: 'createdDate', label: 'Erstellt' },
  ]

  const handleAdd = () => {
    setFormData({
      subject: '',
      priority: 'Medium',
      description: '',
      status: 'Open',
      assigned_to: '',
    })
    setIsAddModalOpen(true)
  }

  const handleEdit = (ticket) => {
    setSelectedTicket(ticket)
    setFormData({
      subject: ticket.subject,
      priority: ticket.priority,
      description: ticket.description || '',
      status: ticket.status,
      assigned_to: ticket.assigned_to || ticket.assignedTo || '',
    })
    setIsEditModalOpen(true)
  }

  const handleView = (ticket) => {
    setSelectedTicket(ticket)
    setIsViewModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.subject) {
      alert('Betreff ist erforderlich')
      return
    }

    try {
      setSaving(true)
      const ticketData = {
        company_id: companyId,
        subject: formData.subject,
        description: formData.description || '',
        priority: formData.priority || 'Medium',
        status: formData.status || 'Open',
        assigned_to_id: formData.assigned_to ? parseInt(formData.assigned_to, 10) : null,
      }

      if (isEditModalOpen && selectedTicket) {
        const response = await ticketsAPI.update(selectedTicket.id, ticketData)
        if (response.data && response.data.success) {
          alert('Ticket erfolgreich aktualisiert!')
          setIsEditModalOpen(false)
          setSelectedTicket(null)
          setFormData({
            subject: '',
            priority: 'Medium',
            description: '',
            status: 'Open',
            assigned_to: '',
          })
          await fetchTickets()
        } else {
          alert(response.data?.error || 'Ticket konnte nicht aktualisiert werden')
        }
      } else {
        const response = await ticketsAPI.create(ticketData)
        if (response.data && response.data.success) {
          alert('Ticket erfolgreich erstellt!')
          setIsAddModalOpen(false)
          setFormData({
            subject: '',
            priority: 'Medium',
            description: '',
            status: 'Open',
            assigned_to: '',
          })
          await fetchTickets()
        } else {
          alert(response.data?.error || 'Ticket konnte nicht erstellt werden')
        }
      }
    } catch (error) {
      console.error('Failed to save ticket:', error)
      alert(error.response?.data?.error || 'Ticket konnte nicht gespeichert werden')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ticket) => {
    if (!window.confirm(`Ticket ${ticket.ticketId} löschen?`)) return

    try {
      const response = await ticketsAPI.delete(ticket.id, { company_id: companyId })
      if (response.data && response.data.success) {
        alert('Ticket erfolgreich gelöscht!')
        await fetchTickets()
      } else {
        alert(response.data?.error || 'Ticket konnte nicht gelöscht werden')
      }
    } catch (error) {
      console.error('Failed to delete ticket:', error)
      alert(error.response?.data?.error || 'Ticket konnte nicht gelöscht werden')
    }
  }

  const actions = (row) => (
    <div className="action-btn-container">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleView(row)
        }}
        className="action-btn action-btn-view"
        title="Ansehen"
      >
        <IoEye size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleEdit(row)
        }}
        className="action-btn action-btn-edit"
        title="Bearbeiten"
      >
        <IoPencil size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDelete(row)
        }}
        className="action-btn action-btn-delete"
        title="Löschen"
      >
        <IoTrashOutline size={18} />
      </button>
    </div>
  )

  if (loading && tickets.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">Tickets</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">Support-Tickets verwalten</p>
        </div>
        <div className="text-center py-8">
          <p className="text-secondary-text">Tickets werden geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">Tickets</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">Support-Tickets verwalten</p>
        </div>
        <AddButton onClick={handleAdd} label="Ticket hinzufügen" />
      </div>

      <DataTable
        columns={columns}
        data={tickets}
        searchPlaceholder="Search tickets..."
        filters={true}
        filterConfig={[
          { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Pending', 'Closed'] },
          { key: 'priority', label: 'Priorität', type: 'select', options: ['High', 'Medium', 'Low'] },
        ]}
        actions={actions}
        bulkActions={true}
        mobileColumns={2}
      />

      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setSelectedTicket(null)
          // Reset form
          setFormData({
            subject: '',
            priority: 'Medium',
            description: '',
            status: 'Open',
            assigned_to: '',
          })
        }}
        title={isAddModalOpen ? 'Neues Ticket hinzufügen' : 'Ticket bearbeiten'}
      >
        <div className="space-y-4">
          <Input
            label="Betreff"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-primary-text mb-1.5 sm:mb-2">
              Priorität
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none shadow-sm transition-all"
            >
              <option value="Low">Niedrig</option>
              <option value="Medium">Mittel</option>
              <option value="High">Hoch</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-1.5 sm:mb-2">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none shadow-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-1.5 sm:mb-2">
              Zugewiesen an
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none shadow-sm transition-all"
            >
              <option value="">-- Mitarbeiter auswählen --</option>
              {employees.length === 0 ? (
                <option value="" disabled>Keine Mitarbeiter gefunden</option>
              ) : (
                employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-1.5 sm:mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none shadow-sm transition-all"
            >
              <option value="Open">Offen</option>
              <option value="Pending">Ausstehend</option>
              <option value="Closed">Geschlossen</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-1.5 sm:mb-2">
              Anhang
            </label>
            <input
              type="file"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none shadow-sm transition-all"
            />
          </div>
          <div className="flex gap-3 pt-4 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
              }}
              className="px-4"
            >
              Abbrechen
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} className="px-4" disabled={saving}>
              {saving ? 'Wird gespeichert...' : (isAddModalOpen ? 'Ticket speichern' : 'Ticket aktualisieren')}
            </Button>
          </div>
        </div>
      </RightSideModal>

      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Ticket-Details"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-secondary-text">Ticket-ID</label>
              <p className="text-sm sm:text-base text-primary-text mt-1">{selectedTicket.ticketId}</p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-secondary-text">Betreff</label>
              <p className="text-sm sm:text-base text-primary-text mt-1">{selectedTicket.subject}</p>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium text-secondary-text">Priorität</label>
              <div className="mt-1">
                <Badge
                  variant={
                    selectedTicket.priority === 'High'
                      ? 'danger'
                      : selectedTicket.priority === 'Medium'
                        ? 'warning'
                        : 'info'
                  }
                >
                  {selectedTicket.priority}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-secondary-text">Status</label>
              <div className="mt-1">
                <Badge
                  variant={
                    selectedTicket.status === 'Closed'
                      ? 'success'
                      : selectedTicket.status === 'Pending'
                        ? 'warning'
                        : 'info'
                  }
                >
                  {selectedTicket.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-secondary-text">Zugewiesen an</label>
              <p className="text-sm sm:text-base text-primary-text mt-1">{selectedTicket.assignedTo}</p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-secondary-text">Erstelldatum</label>
              <p className="text-sm sm:text-base text-primary-text mt-1">{selectedTicket.createdDate}</p>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default Tickets
