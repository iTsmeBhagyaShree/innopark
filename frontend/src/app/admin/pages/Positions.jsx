import { useState, useEffect } from 'react'
import { positionsAPI, departmentsAPI } from '../../../api'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { IoCreate, IoTrash, IoEye } from 'react-icons/io5'
import { useAuth } from '../../../context/AuthContext'

const Positions = () => {
  const { user } = useAuth()
  const companyId = user?.company_id || localStorage.getItem('companyId') || 1

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    department_id: '',
    description: '',
  })

  const [positions, setPositions] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPositions()
    fetchDepartments()
  }, [])

  const fetchPositions = async () => {
    try {
      setLoading(true)
      const response = await positionsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        const positionsData = response.data.data || []
        const transformedPositions = positionsData.map(pos => ({
          ...pos,
          department: pos.department_name || 'K.A.',
          company_name: pos.company_name || 'Nicht zugewiesen'
        }))
        setPositions(transformedPositions)
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error)
      alert(error.response?.data?.error || 'Positionen konnten nicht abgerufen werden')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setDepartments(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const columns = [
    { key: 'name', label: 'Positionsname' },
    { key: 'department', label: 'Abteilung' },
  ]

  const handleAdd = () => {
    setFormData({ name: '', department_id: '', description: '' })
    setIsAddModalOpen(true)
  }

  const handleView = (position) => {
    setSelectedPosition(position)
    setIsViewModalOpen(true)
  }

  const handleEdit = async (position) => {
    try {
      setLoading(true)
      const response = await positionsAPI.getById(position.id, { company_id: companyId })
      if (response.data.success) {
        const pos = response.data.data
        setSelectedPosition(position)
        setFormData({ 
          name: pos.name || '', 
          department_id: pos.department_id?.toString() || '',
          description: pos.description || '',
        })
        setIsEditModalOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch position:', error)
      alert(error.response?.data?.error || 'Positionsdetails konnten nicht abgerufen werden')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.name.trim()) {
      alert('Positionsname ist erforderlich')
      return
    }

    try {
      setSaving(true)
      const positionData = {
        name: formData.name.trim(),
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        description: formData.description || null,
        company_id: parseInt(companyId) // Auto-set from session
      }
      
      console.log('Saving position with data:', positionData)

      if (isEditModalOpen && selectedPosition) {
        const response = await positionsAPI.update(selectedPosition.id, positionData, { company_id: companyId })
        if (response.data.success) {
          alert('Position erfolgreich aktualisiert!')
          setIsEditModalOpen(false)
          setSelectedPosition(null)
          await fetchPositions()
        } else {
          alert(response.data.error || 'Position konnte nicht aktualisiert werden')
        }
      } else {
        const response = await positionsAPI.create(positionData)
        if (response.data.success) {
          alert('Position erfolgreich erstellt!')
          setIsAddModalOpen(false)
          await fetchPositions()
        } else {
          alert(response.data.error || 'Position konnte nicht erstellt werden')
        }
      }
      
      setFormData({ name: '', department_id: '', description: '' })
    } catch (error) {
      console.error('Failed to save position:', error)
      alert(error.response?.data?.error || 'Position konnte nicht gespeichert werden')
    } finally {
      setSaving(false)
    }
  }

  const actions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleView(row)
        }}
        className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
        title="Ansehen"
      >
        <IoEye size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleEdit(row)
        }}
        className="p-2 text-warning hover:bg-warning hover:bg-opacity-10 rounded transition-colors"
        title="Bearbeiten"
      >
        <IoCreate size={18} />
      </button>
      <button
        onClick={async (e) => {
          e.stopPropagation()
          if (window.confirm(`${row.name || row.position_name} löschen?`)) {
            try {
              const response = await positionsAPI.delete(row.id, { company_id: companyId })
              if (response.data.success) {
                alert('Position erfolgreich gelöscht!')
                await fetchPositions()
              } else {
                alert(response.data.error || 'Position konnte nicht gelöscht werden')
              }
            } catch (error) {
              console.error('Failed to delete position:', error)
              alert(error.response?.data?.error || 'Position konnte nicht gelöscht werden')
            }
          }
        }}
        className="p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded transition-colors"
        title="Löschen"
      >
        <IoTrash size={18} />
      </button>
    </div>
  )

  if (loading && positions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Positionen</h1>
          <p className="text-secondary-text mt-1">Stellenpositionen verwalten</p>
        </div>
        <div className="text-center py-8">
          <p className="text-secondary-text">Positionen werden geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Positionen</h1>
          <p className="text-secondary-text mt-1">Stellenpositionen verwalten</p>
        </div>
        <AddButton onClick={handleAdd} label="Position hinzufügen" />
      </div>

      <DataTable
        columns={columns}
        data={positions}
        loading={loading}
        searchPlaceholder="Search positions..."
        filters={true}
        filterConfig={[
          { key: 'name', label: 'Positionsname', type: 'text' },
          { key: 'department', label: 'Abteilung', type: 'text' },
        ]}
        actions={actions}
        bulkActions={true}
      />

      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setFormData({ name: '', department_id: '', description: '' })
          setSelectedPosition(null)
        }}
        title={isAddModalOpen ? 'Position hinzufügen' : 'Position bearbeiten'}
      >
        <div className="space-y-4">
          {/* Company ID - Hidden field (auto-set from session) */}
          <input type="hidden" name="company_id" value={companyId} />
          
          <Input
            label="Positionsname"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Positionsname eingeben"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Abteilung
            </label>
            <select
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="">-- Abteilung auswählen --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {departments.length === 0 && (
              <p className="text-xs text-secondary-text mt-1">Keine Abteilungen verfügbar. Bitte fügen Sie zuerst Abteilungen hinzu.</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              rows={4}
              placeholder="Positionsbeschreibung eingeben"
            />
          </div>
          
          <div className="flex gap-3 pt-4 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                setFormData({ name: '', department_id: '', description: '' })
                setSelectedPosition(null)
              }}
              className="px-4"
            >
              Abbrechen
            </Button>
            <Button variant="primary" onClick={handleSave} className="px-4" disabled={saving}>
              {saving ? 'Wird gespeichert...' : (isAddModalOpen ? 'Position speichern' : 'Position aktualisieren')}
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* View Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Positionsdetails"
      >
        {selectedPosition && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-secondary-text">Positionsname</label>
              <p className="text-primary-text mt-1 text-base">{selectedPosition.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Firmenname</label>
              <p className="text-primary-text mt-1 text-base">
                {selectedPosition.company_name || 'Nicht zugewiesen'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Abteilung</label>
              <p className="text-primary-text mt-1 text-base">{selectedPosition.department || 'K.A.'}</p>
            </div>
            {selectedPosition.description && (
              <div>
                <label className="text-sm font-medium text-secondary-text">Beschreibung</label>
                <p className="text-primary-text mt-1 text-base">{selectedPosition.description}</p>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t border-gray-200 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4"
              >
                Schließen
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleEdit(selectedPosition)
                }}
                className="px-4"
              >
                Bearbeiten
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default Positions
