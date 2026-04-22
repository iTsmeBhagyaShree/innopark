import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { leaveRequestsAPI } from '../../../api'
import { IoCreate } from 'react-icons/io5'

const LeaveRequests = () => {
  const { user } = useAuth()
  const userId = user?.id || localStorage.getItem('userId')
  const companyId = user?.company_id || localStorage.getItem('companyId')
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  })

  useEffect(() => {
    if (userId && companyId) {
      fetchLeaves()
    }
  }, [userId, companyId])

  const fetchLeaves = async () => {
    try {
      setLoading(true)
      const response = await leaveRequestsAPI.getAll({
        company_id: companyId,
        user_id: userId
      })
      if (response.data.success) {
        setLeaves(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.leave_type || !formData.start_date || !formData.end_date) {
      alert('Bitte füllen Sie alle Pflichtfelder aus')
      return
    }

    try {
      const leaveData = {
        ...formData,
        company_id: companyId,
        user_id: userId
      }
      
      if (selectedLeave) {
        await leaveRequestsAPI.update(selectedLeave.id, leaveData, { company_id: companyId })
      } else {
        await leaveRequestsAPI.create(leaveData)
      }
      alert('Urlaubsantrag erfolgreich gespeichert!')
      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
      resetForm()
      await fetchLeaves()
    } catch (error) {
      console.error('Error saving leave request:', error)
      alert(error.response?.data?.error || 'Urlaubsantrag konnte nicht gespeichert werden')
    }
  }

  const handleEdit = (leave) => {
    setSelectedLeave(leave)
    setFormData({
      leave_type: leave.leave_type || '',
      start_date: leave.start_date || '',
      end_date: leave.end_date || '',
      reason: leave.reason || '',
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Urlaubsantrag löschen möchten?')) {
      try {
        await leaveRequestsAPI.delete(id, { company_id: companyId, user_id: userId })
        alert('Urlaubsantrag erfolgreich gelöscht!')
        await fetchLeaves()
      } catch (error) {
        console.error('Error deleting leave request:', error)
        alert(error.response?.data?.error || 'Urlaubsantrag konnte nicht gelöscht werden')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      leave_type: '',
      start_date: '',
      end_date: '',
      reason: '',
    })
    setSelectedLeave(null)
  }

  const columns = [
    { 
      key: 'leave_type', 
      label: 'Urlaubsart',
      render: (value) => <span className="font-medium">{value || 'K.A.'}</span>
    },
    { 
      key: 'start_date', 
      label: 'Von',
      render: (value) => new Date(value).toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    },
    { 
      key: 'end_date', 
      label: 'Bis',
      render: (value) => new Date(value).toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    },
    {
      key: 'days',
      label: 'Tage',
      render: (value) => <span>{value || 0}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusColors = {
          Approved: 'success',
          Pending: 'warning',
          Rejected: 'danger',
        }
        const statusLabels = {
          Approved: 'Genehmigt',
          Pending: 'Ausstehend',
          Rejected: 'Abgelehnt',
        }
        return <Badge variant={statusColors[value] || 'default'}>{statusLabels[value] || value || 'Ausstehend'}</Badge>
      },
    },
    {
      key: 'actions',
      label: 'Aktionen',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.status === 'Pending' && (
            <>
              <button
                onClick={() => handleEdit(row)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Bearbeiten"
              >
                <IoCreate size={18} />
              </button>
              <button
                onClick={() => handleDelete(row.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Löschen"
              >
                Löschen
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Urlaubsanträge</h1>
          <p className="text-secondary-text mt-1">Ihre Urlaubsanträge verwalten</p>
        </div>
        <AddButton onClick={() => { resetForm(); setIsAddModalOpen(true) }} label="Urlaub beantragen" />
      </div>

      <DataTable
        columns={columns}
        data={leaves}
        loading={loading}
        emptyMessage="Keine Urlaubsanträge gefunden"
      />

      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          resetForm()
        }}
        title={selectedLeave ? 'Urlaubsantrag bearbeiten' : 'Urlaubsantrag erstellen'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Urlaubsart <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.leave_type}
              onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="">Urlaubsart auswählen</option>
              <option value="Annual">Jahresurlaub</option>
              <option value="Sick Leave">Krankheitsurlaub</option>
              <option value="Vacation">Urlaub</option>
              <option value="Personal">Persönlich</option>
              <option value="Emergency">Notfall</option>
            </select>
          </div>
          <Input
            label="Von Datum"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
          <Input
            label="Bis Datum"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Begründung</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              placeholder="Begründung für den Urlaub eingeben..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                resetForm()
              }}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button variant="primary" onClick={handleSave} className="flex-1">
              Urlaubsantrag {selectedLeave ? 'aktualisieren' : 'einreichen'}
            </Button>
          </div>
        </div>
      </RightSideModal>
    </div>
  )
}

export default LeaveRequests
