import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { timeTrackingAPI, projectsAPI, tasksAPI } from '../../../api'
import { IoCreate, IoTrash, IoEye } from 'react-icons/io5'

const TimeTracking = () => {
  const { user } = useAuth()
  const userId = user?.id || localStorage.getItem('userId')
  const companyId = user?.company_id || localStorage.getItem('companyId')
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [timeEntries, setTimeEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({
    today_hours: 0,
    week_hours: 0,
    month_hours: 0,
    total_entries: 0
  })
  const [formData, setFormData] = useState({
    project_id: '',
    task_id: '',
    hours: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })

  useEffect(() => {
    if (userId && companyId) {
      fetchTimeEntries()
      fetchProjects()
      fetchStats()
    }
  }, [userId, companyId])

  useEffect(() => {
    if (formData.project_id && userId && companyId) {
      fetchTasksForProject(formData.project_id)
    } else {
      setTasks([])
    }
  }, [formData.project_id, userId, companyId])

  const fetchTimeEntries = async () => {
    try {
      setLoading(true)
      const response = await timeTrackingAPI.getAll({ 
        company_id: companyId,
        user_id: userId 
      })
      if (response.data.success) {
        const entries = response.data.data || []
        const transformedEntries = entries.map(entry => ({
          id: entry.id,
          project: entry.project_name || entry.projectName || 'K.A.',
          task: entry.task_title || entry.taskTitle || 'K.A.',
          hours: parseFloat(entry.hours || 0),
          date: entry.date ? new Date(entry.date).toLocaleDateString('de-DE') : 'K.A.',
          ...entry
        }))
        setTimeEntries(transformedEntries)
      }
    } catch (error) {
      console.error('Error fetching time entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const tasksResponse = await tasksAPI.getAll({ 
        assigned_to: userId,
        company_id: companyId 
      })
      
      if (!tasksResponse.data.success) {
        setProjects([])
        return
      }
      
      const tasks = tasksResponse.data.data || []
      
      const projectIds = [...new Set(tasks
        .map(task => task.project_id)
        .filter(pid => pid !== null && pid !== undefined)
      )]
      
      if (projectIds.length === 0) {
        setProjects([])
        return
      }
      
      const projectsResponse = await projectsAPI.getAll({ 
        company_id: companyId 
      })
      
      if (projectsResponse.data.success) {
        const allProjects = projectsResponse.data.data || []
        const userProjects = allProjects.filter(proj => projectIds.includes(proj.id))
        setProjects(userProjects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    }
  }

  const fetchTasksForProject = async (projectId) => {
    try {
      const response = await tasksAPI.getAll({ 
        company_id: companyId,
        assigned_to: userId,
        project_id: projectId
      })
      if (response.data.success) {
        setTasks(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
    }
  }

  const fetchStats = async () => {
    try {
      const response = await timeTrackingAPI.getStats({ 
        company_id: companyId,
        user_id: userId 
      })
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const columns = [
    { key: 'project', label: 'Projekt' },
    { key: 'task', label: 'Aufgabe' },
    {
      key: 'hours',
      label: 'Erfasste Zeit',
      render: (value) => `${value} Std.`,
    },
    { key: 'date', label: 'Datum' },
  ]

  const handleAdd = () => {
    setFormData({ 
      project_id: '', 
      task_id: '', 
      hours: '', 
      date: new Date().toISOString().split('T')[0],
      description: ''
    })
    setIsAddModalOpen(true)
  }

  const handleView = (entry) => {
    setSelectedEntry(entry)
    setIsViewModalOpen(true)
  }

  const handleEdit = (entry) => {
    setSelectedEntry(entry)
    setFormData({
      project_id: entry.project_id || '',
      task_id: entry.task_id || '',
      hours: entry.hours?.toString() || '',
      date: entry.date || new Date().toISOString().split('T')[0],
      description: entry.description || ''
    })
    setIsEditModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.project_id || !formData.hours || !formData.date) {
        alert('Bitte füllen Sie alle Pflichtfelder aus')
        return
      }

      const timeLogData = {
        company_id: companyId,
        user_id: userId,
        project_id: parseInt(formData.project_id),
        task_id: formData.task_id ? parseInt(formData.task_id) : null,
        hours: parseFloat(formData.hours),
        date: formData.date,
        description: formData.description || ''
      }

      if (isEditModalOpen && selectedEntry) {
        const response = await timeTrackingAPI.update(selectedEntry.id, timeLogData, { company_id: companyId })
        if (response.data.success) {
          alert('Zeiteintrag erfolgreich aktualisiert!')
          await fetchTimeEntries()
          await fetchStats()
          setIsEditModalOpen(false)
          setSelectedEntry(null)
          setFormData({ project_id: '', task_id: '', hours: '', date: new Date().toISOString().split('T')[0], description: '' })
        } else {
          alert(response.data.error || 'Zeiteintrag konnte nicht aktualisiert werden')
        }
      } else {
        const response = await timeTrackingAPI.create(timeLogData, { company_id: companyId })
        if (response.data.success) {
          alert('Zeiteintrag erfolgreich hinzugefügt!')
          await fetchTimeEntries()
          await fetchStats()
          setIsAddModalOpen(false)
          setFormData({ project_id: '', task_id: '', hours: '', date: new Date().toISOString().split('T')[0], description: '' })
        } else {
          alert(response.data.error || 'Zeiteintrag konnte nicht hinzugefügt werden')
        }
      }
    } catch (error) {
      console.error('Error saving time entry:', error)
      alert(error.response?.data?.error || 'Zeiteintrag konnte nicht gespeichert werden')
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
        title="Details ansehen"
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
          if (window.confirm('Diesen Zeiteintrag löschen?')) {
            try {
              const response = await timeTrackingAPI.delete(row.id, { company_id: companyId })
              if (response.data.success) {
                alert('Zeiteintrag erfolgreich gelöscht!')
                await fetchTimeEntries()
                await fetchStats()
              } else {
                alert(response.data.error || 'Zeiteintrag konnte nicht gelöscht werden')
              }
            } catch (error) {
              console.error('Error deleting time entry:', error)
              alert(error.response?.data?.error || 'Zeiteintrag konnte nicht gelöscht werden')
            }
          }
        }}
        className="p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded transition-colors"
      >
        <IoTrash size={18} />
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Zeiterfassung</h1>
          <p className="text-secondary-text mt-1">Ihre Arbeitszeiten erfassen</p>
        </div>
        <AddButton onClick={handleAdd} label="Zeiteintrag hinzufügen" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-secondary-text">Heute</p>
          <p className="text-2xl font-bold text-primary-text">{stats.today_hours.toFixed(1)} Std.</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-secondary-text">Diese Woche</p>
          <p className="text-2xl font-bold text-primary-accent">{stats.week_hours.toFixed(1)} Std.</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-secondary-text">Diesen Monat</p>
          <p className="text-2xl font-bold text-green-600">{stats.month_hours.toFixed(1)} Std.</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-secondary-text">Einträge gesamt</p>
          <p className="text-2xl font-bold text-purple-600">{stats.total_entries}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary-text">Zeiteinträge werden geladen...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={timeEntries}
          searchPlaceholder="Search time entries..."
          filters={true}
          filterConfig={[
            { key: 'project', label: 'Projekt', type: 'text' },
            { key: 'date', label: 'Datum', type: 'daterange' },
          ]}
          actions={actions}
          bulkActions={false}
        />
      )}

      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
        }}
        title={isAddModalOpen ? 'Zeiteintrag hinzufügen' : 'Zeiteintrag bearbeiten'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-2">Projekt *</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value, task_id: '' })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="">Projekt auswählen</option>
              {projects.map(proj => (
                <option key={proj.id} value={proj.id}>
                  {proj.project_name || proj.name || `Projekt #${proj.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-2">Aufgabe (optional)</label>
            <select
              value={formData.task_id}
              onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              disabled={!formData.project_id}
            >
              <option value="">
                {!formData.project_id ? 'Zuerst Projekt auswählen' : tasks.length === 0 ? 'Keine Aufgaben verfügbar' : 'Aufgabe auswählen'}
              </option>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.title || task.task_title || `Aufgabe #${task.id}`}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Stunden *"
            type="number"
            step="0.5"
            min="0"
            value={formData.hours}
            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
          />
          <Input
            label="Datum *"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-2">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              placeholder="Beschreibung hinzufügen (optional)"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
              }}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button variant="primary" onClick={handleSave} className="flex-1">
              {isAddModalOpen ? 'Eintrag speichern' : 'Eintrag aktualisieren'}
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* View Time Entry Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedEntry(null)
        }}
        title="Zeiteintrag-Details"
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-accent">{selectedEntry.hours} Std.</p>
                <p className="text-sm text-secondary-text mt-1">Erfasste Zeit</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Projekt</label>
                <p className="text-primary-text font-medium">{selectedEntry.project || selectedEntry.project_name || 'K.A.'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Aufgabe</label>
                <p className="text-primary-text">{selectedEntry.task || selectedEntry.task_title || 'K.A.'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Datum</label>
                <p className="text-primary-text">{selectedEntry.date || 'K.A.'}</p>
              </div>
              {selectedEntry.description && (
                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-1">Beschreibung</label>
                  <p className="text-primary-text whitespace-pre-wrap">{selectedEntry.description}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
                className="flex-1"
              >
                Schließen
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleEdit(selectedEntry)
                }}
                className="flex-1"
              >
                Eintrag bearbeiten
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default TimeTracking
