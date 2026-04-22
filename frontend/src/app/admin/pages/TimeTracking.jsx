import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../../context/LanguageContext'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { IoCreate, IoTrash } from 'react-icons/io5'
import { timeTrackingAPI, projectsAPI, tasksAPI, employeesAPI } from '../../../api'
import { useAuth } from '../../../context/AuthContext'

const TimeTracking = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const companyId = user?.company_id || localStorage.getItem('companyId') || 1
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [timeEntries, setTimeEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    user_id: '',
    project_id: '',
    task_id: '',
    hours: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })

  const fetchTimeEntries = useCallback(async () => {
    try {
      setLoading(true)
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchTimeEntries:', companyId)
        setTimeEntries([])
        setLoading(false)
        return
      }
      const response = await timeTrackingAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        const entries = response.data.data || []
        const transformedEntries = entries.map(entry => {
          const dateObj = new Date(entry.date)
          const formattedDate = dateObj.toLocaleDateString('de-DE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
          return {
            id: entry.id,
            employee: entry.employee_name || t('common.unknown'),
            project: entry.project_name || 'N/A',
            task: entry.task_title || 'N/A',
            hours: parseFloat(entry.hours || 0),
            date: formattedDate,
            user_id: entry.user_id,
            project_id: entry.project_id,
            task_id: entry.task_id,
            description: entry.description,
            rawDate: entry.date
          }
        })
        setTimeEntries(transformedEntries)
      }
    } catch (error) {
      console.error('Error fetching time entries:', error)
      alert(error.response?.data?.error || t('timelog.fetch_error') || 'Fehler beim Abrufen der Zeiteintrtage')
    } finally {
      setLoading(false)
    }
  }, [companyId, t])

  const fetchProjects = useCallback(async () => {
    try {
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchProjects:', companyId)
        setProjects([])
        return
      }
      const response = await projectsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setProjects(response.data.data || [])
      } else {
        setProjects([])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    }
  }, [companyId])

  const fetchTasks = useCallback(async () => {
    try {
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchTasks:', companyId)
        setTasks([])
        return
      }
      const response = await tasksAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setTasks(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }, [companyId])

  const fetchEmployees = useCallback(async () => {
    try {
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchEmployees:', companyId)
        setEmployees([])
        return
      }
      const response = await employeesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setEmployees(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }, [companyId])

  useEffect(() => {
    if (companyId) {
      fetchTimeEntries()
      fetchProjects()
      fetchTasks()
      fetchEmployees()
    }
  }, [companyId]) 

  const columns = [
    { key: 'employee', label: t('timelog.columns.employee') || 'Mitarbeiter' },
    { key: 'project', label: t('timelog.columns.project') || 'Projekt' },
    { key: 'task', label: t('timelog.columns.task') || 'Aufgabe' },
    {
      key: 'hours',
      label: t('timelog.columns.hours') || 'Zeit',
      render: (value) => `${value} ${t('common.hrs') || 'Std.'}`,
    },
    { key: 'date', label: t('timelog.columns.date') || 'Datum' },
  ]

  const handleAdd = async () => {
    setSelectedEntry(null)
    setFormData({
      user_id: '',
      project_id: '',
      task_id: '',
      hours: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    })
    setIsAddModalOpen(true)
  }

  const handleEdit = (entry) => {
    setSelectedEntry(entry)
    setFormData({
      user_id: entry.user_id || '',
      project_id: entry.project_id || '',
      task_id: entry.task_id || '',
      hours: entry.hours?.toString() || '',
      date: entry.rawDate || new Date().toISOString().split('T')[0],
      description: entry.description || '',
    })
    setIsEditModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.user_id || !formData.project_id || !formData.hours || !formData.date) {
      alert(t('timelog.validation') || 'Bitte füllen Sie alle Pflichtfelder aus')
      return
    }

    try {
      setSaving(true)
      const timeLogData = {
        user_id: parseInt(formData.user_id),
        project_id: parseInt(formData.project_id),
        task_id: formData.task_id ? parseInt(formData.task_id) : null,
        hours: parseFloat(formData.hours),
        date: formData.date,
        description: formData.description || '',
        company_id: parseInt(companyId)
      }

      if (isEditModalOpen && selectedEntry) {
        const response = await timeTrackingAPI.update(selectedEntry.id, timeLogData, { company_id: companyId })
        if (response.data.success) {
          alert(t('timelog.update_success') || 'Zeiteintrag aktualisiert')
          setIsEditModalOpen(false)
          await fetchTimeEntries()
        } else {
          alert(response.data.error || t('timelog.update_error'))
        }
      } else {
        const response = await timeTrackingAPI.create(timeLogData, { company_id: companyId })
        if (response.data.success) {
          alert(t('timelog.create_success') || 'Zeiteintrag erstellt')
          setIsAddModalOpen(false)
          await fetchTimeEntries()
        } else {
          alert(response.data.error || t('timelog.create_error'))
        }
      }
    } catch (error) {
      console.error('Error saving time entry:', error)
      alert(error.response?.data?.error || t('timelog.save_error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (entry) => {
    if (window.confirm(t('common.confirm_delete') || 'Sind Sie sicher?')) {
      try {
        const response = await timeTrackingAPI.delete(entry.id, { company_id: companyId })
        if (response.data.success) {
          alert(t('timelog.delete_success') || 'Eintrag gelöscht')
          await fetchTimeEntries()
        } else {
          alert(response.data.error || t('timelog.delete_error'))
        }
      } catch (error) {
        console.error('Error deleting time entry:', error)
        alert(error.response?.data?.error || t('timelog.delete_error'))
      }
    }
  }

  const actions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleEdit(row)
        }}
        className="p-2 text-warning hover:bg-warning hover:bg-opacity-10 rounded transition-colors"
        title={t('common.edit')}
      >
        <IoCreate size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDelete(row)
        }}
        className="p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded transition-colors"
        title={t('common.delete')}
      >
        <IoTrash size={18} />
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">{t('timelog.title') || 'Zeiterfassung'}</h1>
          <p className="text-secondary-text mt-1">{t('timelog.subtitle') || 'Stundenzettel verwalten'}</p>
        </div>
        <AddButton onClick={handleAdd} label={t('timelog.add_entry') || 'Zeit hinzufügen'} />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary-text">{t('common.loading')}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={timeEntries}
          searchPlaceholder={t('timelog.search_placeholder') || 'Suchen...'}
          filters={true}
          actions={actions}
        />
      )}

      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setSelectedEntry(null)
        }}
        title={isAddModalOpen ? t('timelog.add_entry') : t('timelog.edit_entry')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('timelog.fields.employee') || 'Mitarbeiter'} <span className="text-danger">*</span>
            </label>
            <select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none"
              required
            >
              <option value="">-- {t('timelog.select.employee')} --</option>
              {employees.map((emp) => (
                <option key={emp.user_id || emp.id} value={emp.user_id || emp.id}>
                  {emp.name || emp.user_name || `Employee #${emp.user_id || emp.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('timelog.fields.project') || 'Projekt'} <span className="text-danger">*</span>
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => {
                setFormData({ ...formData, project_id: e.target.value, task_id: '' })
              }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none"
              required
            >
              <option value="">-- {t('timelog.select.project')} --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_name || project.name || `Project #${project.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('timelog.fields.task') || 'Aufgabe'} ({t('common.optional')})
            </label>
            <select
              value={formData.task_id}
              onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none"
              disabled={!formData.project_id}
            >
              <option value="">-- {t('timelog.select.task')} --</option>
              {tasks
                .filter((task) => !formData.project_id || task.project_id == formData.project_id)
                .map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title || task.task_title || `Task #${task.id}`}
                  </option>
                ))}
            </select>
          </div>
          <Input
            label={t('timelog.fields.hours') || 'Stunden'}
            type="number"
            step="0.5"
            min="0"
            value={formData.hours}
            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
            required
          />
          <Input
            label={t('timelog.fields.date') || 'Datum'}
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Input
            label={t('timelog.fields.description') || 'Beschreibung'}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('timelog.placeholders.description')}
          />
          <div className="flex gap-3 pt-4 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={saving || !formData.user_id || !formData.project_id || !formData.hours || !formData.date}
            >
              {saving ? t('common.saving') : (isAddModalOpen ? t('common.save') : t('common.update'))}
            </Button>
          </div>
        </div>
      </RightSideModal>
    </div>
  )
}

export default TimeTracking
