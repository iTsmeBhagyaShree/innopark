import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { leaveRequestsAPI } from '../../../api'
import { IoCheckmark, IoClose, IoEye } from 'react-icons/io5'

const LeaveRequests = () => {
  const { user } = useAuth()
  const companyId = parseInt(user?.company_id || localStorage.getItem('companyId') || 1, 10)

  const [leaveRequests, setLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLoading(true)
      const params = { company_id: companyId }
      if (statusFilter) {
        params.status = statusFilter
      }
      // Don't pass user_id to get ALL employees' leave requests for this company
      const response = await leaveRequestsAPI.getAll(params)
      if (response.data.success) {
        const requests = response.data.data || []
        const transformedRequests = requests.map(req => ({
          id: req.id,
          employeeName: req.employee_name || 'Unbekannter Mitarbeiter',
          employeeEmail: req.employee_email || '',
          leaveType: req.leave_type || 'K.A.',
          startDate: req.start_date ? new Date(req.start_date).toLocaleDateString() : 'K.A.',
          endDate: req.end_date ? new Date(req.end_date).toLocaleDateString() : 'K.A.',
          days: req.days || 0,
          reason: req.reason || '',
          status: req.status || 'Pending',
          createdAt: req.created_at ? new Date(req.created_at).toLocaleDateString() : 'K.A.',
          ...req
        }))
        setLeaveRequests(transformedRequests)
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error)
    } finally {
      setLoading(false)
    }
  }, [companyId, statusFilter])

  useEffect(() => {
    if (companyId) {
      fetchLeaveRequests()
    }
  }, [fetchLeaveRequests, companyId])

  const handleView = (request) => {
    setSelectedRequest(request)
    setIsViewModalOpen(true)
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await leaveRequestsAPI.update(id, { status: newStatus }, { company_id: companyId })
      alert(`Urlaubsantrag erfolgreich ${newStatus === 'Approved' ? 'genehmigt' : 'abgelehnt'}!`)
      await fetchLeaveRequests()
      setIsViewModalOpen(false)
    } catch (error) {
      console.error('Error updating leave request:', error)
      alert(error.response?.data?.error || 'Urlaubsantrag konnte nicht aktualisiert werden')
    }
  }

  const columns = [
    {
      key: 'employeeName',
      label: 'Mitarbeiter',
      render: (value, row) => (
        <div>
          <p className="font-medium text-primary-text">{value}</p>
          <p className="text-xs text-secondary-text">{row.employeeEmail}</p>
        </div>
      )
    },
    { key: 'leaveType', label: 'Urlaubsart' },
    { key: 'startDate', label: 'Von' },
    { key: 'endDate', label: 'Bis' },
    {
      key: 'days',
      label: 'Tage',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusColors = {
          Pending: 'warning',
          Approved: 'success',
          Rejected: 'danger',
        }
        return <Badge variant={statusColors[value] || 'default'}>{value}</Badge>
      },
    },
  ]

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleView(row)
        }}
        className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
        title="Details ansehen"
      >
        <IoEye size={18} />
      </button>
      {row.status === 'Pending' && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm(`Urlaubsantrag für ${row.employeeName} genehmigen?`)) {
                handleUpdateStatus(row.id, 'Approved')
              }
            }}
            className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
            title="Genehmigen"
          >
            <IoCheckmark size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm(`Urlaubsantrag für ${row.employeeName} ablehnen?`)) {
                handleUpdateStatus(row.id, 'Rejected')
              }
            }}
            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Ablehnen"
          >
            <IoClose size={18} />
          </button>
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Urlaubsanträge</h1>
          <p className="text-secondary-text mt-1">Urlaubsanträge der Mitarbeiter verwalten</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-sm shadow-sm"
          >
            <option value="">Alle Status</option>
            <option value="Pending">Ausstehend</option>
            <option value="Approved">Genehmigt</option>
            <option value="Rejected">Abgelehnt</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary-text">Urlaubsanträge werden geladen...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={leaveRequests}
          searchPlaceholder="Search leave requests..."
          filters={true}
          filterConfig={[
            {
              key: 'leaveType',
              label: 'Urlaubsart',
              type: 'select',
              options: ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Other']
            },
          ]}
          actions={actions}
          emptyMessage="Keine Urlaubsanträge gefunden"
        />
      )}

      {/* View Leave Request Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Urlaubsantrag-Details"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Mitarbeiter</label>
                <p className="text-primary-text font-medium">{selectedRequest.employeeName}</p>
                <p className="text-xs text-secondary-text">{selectedRequest.employeeEmail}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Urlaubsart</label>
                <p className="text-primary-text">{selectedRequest.leaveType}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Von</label>
                <p className="text-primary-text">{selectedRequest.startDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Bis</label>
                <p className="text-primary-text">{selectedRequest.endDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Tage</label>
                <p className="text-primary-text font-medium">{selectedRequest.days}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Grund</label>
              <p className="text-primary-text whitespace-pre-wrap">{selectedRequest.reason || 'Kein Grund angegeben'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Status</label>
              <Badge variant={
                selectedRequest.status === 'Approved' ? 'success' :
                  selectedRequest.status === 'Rejected' ? 'danger' : 'warning'
              }>
                {selectedRequest.status}
              </Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Beantragt am</label>
              <p className="text-primary-text">{selectedRequest.createdAt}</p>
            </div>

            {selectedRequest.status === 'Pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsViewModalOpen(false)}
                  className="flex-1"
                >
                  Schließen
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'Rejected')}
                  className="flex-1"
                >
                  Ablehnen
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'Approved')}
                  className="flex-1"
                >
                  Genehmigen
                </Button>
              </div>
            )}
            {selectedRequest.status !== 'Pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsViewModalOpen(false)}
                  className="flex-1"
                >
                  Schließen
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default LeaveRequests
