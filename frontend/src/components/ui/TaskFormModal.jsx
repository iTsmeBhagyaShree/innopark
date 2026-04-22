import { useState, useEffect, useCallback } from 'react'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'
import RichTextEditor from './RichTextEditor'
import {
  FormRow,
  FormSection,
  FormInput,
  FormSelect,
  FormActions
} from './FormRow'
import {
  IoClose,
  IoCloudUpload,
  IoMic,
  IoCheckmarkCircle,
  IoSave,
  IoEye,
  IoAttach,
  IoHelpCircle
} from 'react-icons/io5'
import { tasksAPI, projectsAPI, employeesAPI, leadsAPI, dealsAPI, contactsAPI, companiesAPI } from '../../api'
import CustomFieldsSection from './CustomFieldsSection'
import { useLanguage } from '../../context/LanguageContext.jsx'

// Default task form data
const getDefaultFormData = () => ({
  title: '',
  description: '',
  related_to: '',
  related_to_type: 'project', // project, lead, deal, contact, company
  points: '1',
  assign_to: '',
  collaborators: [],
  status: 'Incomplete',
  priority: 'Medium',
  labels: [],
  start_date: '',
  deadline: '',
  is_recurring: false,
  repeat_every: '1',
  repeat_unit: 'Month(s)',
  cycles: '',
  uploaded_file: null,
  custom_fields: {},
})

// Points options
const pointsOptions = [
  { value: '1', label: '1 Point' },
  { value: '2', label: '2 Points' },
  { value: '3', label: '3 Points' },
  { value: '5', label: '5 Points' },
  { value: '8', label: '8 Points' },
  { value: '13', label: '13 Points' },
]

// Status options (matching backend ENUM)
const statusOptions = [
  { value: 'Incomplete', label: 'To do' },
  { value: 'Doing', label: 'In Bearbeitung' },
  { value: 'Done', label: 'Done' },
]

// Priority options
const priorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' },
]

// Repeat unit options
const repeatUnitOptions = [
  { value: 'Day(s)', label: 'Day(s)' },
  { value: 'Week(s)', label: 'Week(s)' },
  { value: 'Month(s)', label: 'Month(s)' },
  { value: 'Year(s)', label: 'Year(s)' },
]

// Default labels
const defaultLabels = [
  { name: 'Bug', color: '#ef4444' },
  { name: 'Design', color: '#3b82f6' },
  { name: 'Enhancement', color: '#22c55e' },
  { name: 'Feedback', color: '#f97316' },
]

/**
 * Unified Task Form Modal Component
 * 
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {object} task - Task to edit (null for new task)
 * @param {function} onSave - Callback after save (optional)
 * @param {string} relatedToType - Pre-set related_to_type (project/lead)
 * @param {number} relatedToId - Pre-set related_to ID
 * @param {array} labels - Available labels (optional, uses default if not provided)
 * @param {number} companyId - Company ID (optional, uses localStorage if not provided)
 */
const TaskFormModal = ({
  isOpen,
  onClose,
  task = null,
  onSave,
  relatedToType = null,
  relatedToId = null,
  labels = defaultLabels,
  companyId: propCompanyId = null,
}) => {
  const { t } = useLanguage()
  // Get company ID
  const companyId = propCompanyId || parseInt(localStorage.getItem('companyId') || 1, 10)

  // Form state
  const [formData, setFormData] = useState(getDefaultFormData())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Dropdown data
  const [projects, setProjects] = useState([])
  const [leads, setLeads] = useState([])
  const [deals, setDeals] = useState([])
  const [contacts, setContacts] = useState([])
  const [companies, setCompanies] = useState([])
  const [employees, setEmployees] = useState([])

  // File upload
  const [fileInputKey, setFileInputKey] = useState(Date.now())

  // Determine if editing
  const isEditing = !!task

  // Format date for display (DD-MM-YYYY)
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  // Parse date from input (YYYY-MM-DD format from input)
  const parseDateFromInput = (dateStr) => {
    if (!dateStr) return ''
    return dateStr.split('T')[0]
  }

  // Fetch dropdown data
  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setProjects(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }, [companyId])



  const fetchLeads = useCallback(async () => {
    try {
      const response = await leadsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setLeads(response.data.data || response.data || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    }
  }, [companyId])

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await employeesAPI.getAll({ company_id: companyId })
      const empData = response.data?.data || response.data || []
      setEmployees(empData)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }, [companyId])

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await companiesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setCompanies(response.data.data || response.data || [])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }, [companyId])

  const fetchDeals = useCallback(async () => {
    try {
      const response = await dealsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setDeals(response.data.data || response.data || [])
      }
    } catch (error) {
      console.error('Error fetching deals:', error)
    }
  }, [companyId])

  const fetchContacts = useCallback(async () => {
    try {
      const response = await contactsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setContacts(response.data.data || response.data || [])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }, [companyId])

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      Promise.all([
        fetchProjects(),
        fetchLeads(),
        fetchEmployees(),
        fetchDeals(),
        fetchContacts(),
        fetchCompanies(),
      ]).finally(() => setLoading(false))

      // Initialize form data
      if (task) {
        // Editing existing task
        setFormData({
          title: task.title || '',
          description: task.description || '',
          related_to: task.project_id || task.lead_id || task.deal_id || task.contact_id || task.related_company_id || task.related_to || '',
          related_to_type: task.project_id ? 'project' : (task.lead_id ? 'lead' : (task.deal_id ? 'deal' : (task.contact_id ? 'contact' : (task.related_company_id ? 'company' : 'project')))),
          points: task.points?.toString() || '1',
          assign_to: task.assign_to || (task.assigned_to && task.assigned_to.length > 0 ? task.assigned_to[0].id : '') || '',
          collaborators: task.collaborators ? task.collaborators.map(c => c.id || c.user_id || c) : [],
          status: task.status || 'Incomplete',
          priority: task.priority || 'Medium',
          labels: normalizeLabels(task.labels || task.tags || []),
          start_date: parseDateFromInput(task.start_date) || '',
          deadline: parseDateFromInput(task.deadline || task.due_date) || '',
          is_recurring: task.is_recurring || false,
          repeat_every: task.repeat_every?.toString() || '1',
          repeat_unit: task.repeat_unit || 'Month(s)',
          cycles: task.cycles?.toString() || '',
          uploaded_file: null,
        })
      } else {
        // New task
        const newFormData = getDefaultFormData()

        // Pre-set related_to if provided
        if (relatedToType && relatedToId) {
          newFormData.related_to_type = relatedToType
          newFormData.related_to = relatedToId.toString()
        }

        setFormData(newFormData)
      }

      setFileInputKey(Date.now())
    }
  }, [isOpen, task, relatedToType, relatedToId, fetchProjects, fetchLeads, fetchEmployees])

  // Normalize labels to array of strings
  const normalizeLabels = (labelsData) => {
    if (!labelsData) return []
    if (Array.isArray(labelsData)) {
      return labelsData.map(l => typeof l === 'string' ? l : l.name || l)
    }
    return []
  }

  // Get related_to options based on type
  const getRelatedToOptions = () => {
    switch (formData.related_to_type) {
      case 'project':
        return projects.filter(p => parseInt(p.company_id) === parseInt(companyId)).map(p => ({
          value: p.id,
          label: p.project_name || p.name || p.title || `Project #${p.id}`
        }))

      case 'lead':
        return leads.map(l => ({
          value: l.id,
          label: l.name || l.company_name || `Lead #${l.id}`
        }))
      case 'deal':
        return deals.map(d => ({
          value: d.id,
          label: d.deal_name || d.pipeline || `Deal #${d.id}`
        }))
      case 'contact':
        return contacts.map(c => ({
          value: c.id,
          label: c.name || c.email || `Contact #${c.id}`
        }))
      case 'company':
        return companies.map(c => ({
          value: c.id,
          label: c.name || c.company_name || `Company #${c.id}`
        }))
      default:
        return []
    }
  }

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, uploaded_file: file })
    }
  }

  // Handle add collaborator
  const handleAddCollaborator = (empId) => {
    const id = parseInt(empId)
    if (id && !formData.collaborators.map(c => parseInt(c)).includes(id)) {
      setFormData({ ...formData, collaborators: [...formData.collaborators, id] })
    }
  }

  // Handle remove collaborator
  const handleRemoveCollaborator = (empId) => {
    setFormData({
      ...formData,
      collaborators: formData.collaborators.filter(id => parseInt(id) !== parseInt(empId))
    })
  }

  // Handle add label
  const handleAddLabel = (labelName) => {
    if (labelName && !formData.labels.includes(labelName)) {
      setFormData({ ...formData, labels: [...formData.labels, labelName] })
    }
  }

  // Handle remove label
  const handleRemoveLabel = (index) => {
    setFormData({
      ...formData,
      labels: formData.labels.filter((_, i) => i !== index)
    })
  }

  // Handle save
  const handleSave = async (showAfterSave = false) => {
    const trimmedTitle = formData.title?.trim()
    if (!trimmedTitle) {
      alert('Task Name is required')
      return
    }

    if (!formData.assign_to) {
      alert('Please assign task to an employee')
      return
    }

    if (!formData.deadline) {
      alert('Deadline / Due Date is required')
      return
    }

    if (!formData.related_to) {
      alert('Please select a Related To option')
      return
    }

    setSaving(true)

    try {
      // Prepare task data
      const taskData = {
        company_id: companyId,
        title: trimmedTitle,
        description: formData.description || null,
        related_to: formData.related_to || null,
        related_to_type: formData.related_to_type || 'project',
        points: formData.points ? parseInt(formData.points) || 1 : 1,
        assign_to: formData.assign_to ? parseInt(formData.assign_to) || null : null,
        collaborators: formData.collaborators.map(c => parseInt(c)),
        status: formData.status || 'Incomplete',
        priority: formData.priority || 'Medium',
        labels: formData.labels || [],
        start_date: formData.start_date || null,
        deadline: formData.deadline || null,
        due_date: formData.deadline || null,
        is_recurring: formData.is_recurring || false,
        repeat_every: formData.is_recurring ? parseInt(formData.repeat_every) || 1 : null,
        repeat_unit: formData.is_recurring ? formData.repeat_unit : null,
        cycles: formData.is_recurring && formData.cycles ? parseInt(formData.cycles) || null : null,

        // Map to backend fields
        project_id: formData.related_to_type === 'project' && formData.related_to ? parseInt(formData.related_to) || null : null,

        lead_id: formData.related_to_type === 'lead' && formData.related_to ? parseInt(formData.related_to) || null : null,
        deal_id: formData.related_to_type === 'deal' && formData.related_to ? parseInt(formData.related_to) || null : null,
        contact_id: formData.related_to_type === 'contact' && formData.related_to ? parseInt(formData.related_to) || null : null,
        related_company_id: formData.related_to_type === 'company' && formData.related_to ? parseInt(formData.related_to) || null : null,
        assigned_to: formData.assign_to ? [parseInt(formData.assign_to)] : [],
        tags: formData.labels || [],
      }

      let response

      // If file is uploaded, use FormData
      if (formData.uploaded_file) {
        const formDataWithFile = new FormData()
        Object.keys(taskData).forEach(key => {
          if (Array.isArray(taskData[key])) {
            formDataWithFile.append(key, JSON.stringify(taskData[key]))
          } else if (taskData[key] !== null && taskData[key] !== undefined) {
            formDataWithFile.append(key, taskData[key])
          }
        })
        formDataWithFile.append('file', formData.uploaded_file)

        if (isEditing) {
          response = await tasksAPI.updateWithFile(task.id, formDataWithFile)
        } else {
          response = await tasksAPI.createWithFile(formDataWithFile)
        }
      } else {
        if (isEditing) {
          response = await tasksAPI.update(task.id, taskData)
        } else {
          response = await tasksAPI.create(taskData)
        }
      }

      if (response.data.success) {
        // Call onSave callback
        if (onSave) {
          onSave(response.data.data || response.data, showAfterSave)
        }

        // Reset form and close
        setFormData(getDefaultFormData())
        onClose()

        alert(isEditing ? 'Task updated successfully!' : 'Task created successfully!')
      } else {
        alert(response.data.error || (isEditing ? 'Failed to update task' : 'Failed to create task'))
      }
    } catch (error) {
      console.error('Error saving task:', error)
      alert(error.response?.data?.error || error.message || 'Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  // Handle close
  const handleClose = () => {
    setFormData(getDefaultFormData())
    onClose()
  }

  // Get employee name by ID
  const getEmployeeName = (empId) => {
    const emp = employees.find(e => parseInt(e.user_id || e.id) === parseInt(empId))
    return emp ? (emp.name || emp.email) : `Employee #${empId}`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit task' : 'Add task'}
      maxWidth="2xl"
    >
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {loading ? (
          <div className="py-12 text-center text-gray-500">{t('auto.auto_8524de96') || 'Loading...'}</div>
        ) : (
          <div className="space-y-4 p-1">
            {/* Title */}
            <FormRow label="Title" required>
              <FormInput
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </FormRow>
            <FormRow label="Description">
              <textarea
                value={formData.description?.replace(/<[^>]*>/g, '') || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent resize-none"
              />
            </FormRow>

            {/* Related to */}
            <FormRow label="Related to">
              <div className="flex gap-2">
                <FormSelect
                  value={formData.related_to_type}
                  onChange={(e) => setFormData({ ...formData, related_to_type: e.target.value, related_to: '' })}
                  className="w-1/3"
                  disabled={!!relatedToType}
                >
                  <option value="project">{t('auto.auto_9e727fdd') || 'Project'}</option>
                  <option value="lead">{t('auto.auto_a745d95c') || 'Lead'}</option>
                  <option value="deal">{t('auto.auto_e09e91c8') || 'Deal'}</option>
                  <option value="contact">{t('auto.auto_bbaff128') || 'Contact'}</option>
                  <option value="company">{t('auto.auto_38d26750') || 'Corporate Company'}</option>
                </FormSelect>
                <FormSelect
                  value={formData.related_to}
                  onChange={(e) => setFormData({ ...formData, related_to: e.target.value })}
                  className="flex-1"
                  disabled={!!relatedToId}
                >
                  <option value="">-</option>
                  {getRelatedToOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </FormSelect>
              </div>
            </FormRow>

            {/* Points */}
            <FormRow label={
              <span className="flex items-center gap-1">
                {t('tasks.fields.points')}
                <IoHelpCircle className="text-gray-400" size={14} title={t('common.story_points_help')} />
              </span>
            }>
              <FormSelect
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
              >
                {pointsOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </FormSelect>
            </FormRow>

            {/* Assign to */}
            <FormRow label={t('tasks.fields.assign_to')} required>
              <FormSelect
                value={formData.assign_to}
                onChange={(e) => setFormData({ ...formData, assign_to: e.target.value })}
              >
                <option value="">-</option>
                {employees.map(emp => (
                  <option key={emp.user_id || emp.id} value={emp.user_id || emp.id}>
                    {emp.name || emp.email}
                  </option>
                ))}
              </FormSelect>
            </FormRow>

            {/* Collaborators */}
            <FormRow label={t('tasks.fields.collaborators')}>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 min-h-[38px] p-2 border border-gray-300 rounded-lg bg-gray-50">
                  {formData.collaborators.length > 0 ? (
                    formData.collaborators.map((collabId) => (
                      <span key={collabId} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-accent/10 text-primary-accent rounded-full text-sm">
                        {getEmployeeName(collabId)}
                        <button
                          type="button"
                          onClick={() => handleRemoveCollaborator(collabId)}
                          className="hover:text-red-600 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">{t('tasks.fields.collaborators')}</span>
                  )}
                </div>
                <FormSelect
                  onChange={(e) => {
                    handleAddCollaborator(e.target.value)
                    e.target.value = ''
                  }}
                >
                  <option value="">{t('tasks.add_collaborator')}</option>
                  {employees
                    .filter(emp => {
                      const empId = parseInt(emp.user_id || emp.id)
                      return empId !== parseInt(formData.assign_to) && !formData.collaborators.map(c => parseInt(c)).includes(empId)
                    })
                    .map(emp => (
                      <option key={emp.user_id || emp.id} value={emp.user_id || emp.id}>
                        {emp.name || emp.email}
                      </option>
                    ))}
                </FormSelect>
              </div>
            </FormRow>

            {/* Status */}
            <FormRow label="Status">
              <FormSelect
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </FormSelect>
            </FormRow>

            {/* Priority */}
            <FormRow label="Priority">
              <FormSelect
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </FormSelect>
            </FormRow>

            {/* Labels */}
            <FormRow label="Labels">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 min-h-[38px] p-2 border border-gray-300 rounded-lg bg-gray-50">
                  {formData.labels.length > 0 ? (
                    formData.labels.map((label, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {label}
                        <button
                          type="button"
                          onClick={() => handleRemoveLabel(idx)}
                          className="hover:text-red-600 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">{t('auto.auto_3ad6cb61') || 'Labels'}</span>
                  )}
                </div>
                <FormSelect
                  onChange={(e) => {
                    handleAddLabel(e.target.value)
                    e.target.value = ''
                  }}
                >
                  <option value="">+ Add Label</option>
                  {labels.filter(l => !formData.labels.includes(l.name)).map(l => (
                    <option key={l.name} value={l.name}>{l.name}</option>
                  ))}
                </FormSelect>
              </div>
            </FormRow>

            {/* Start Date */}
            <FormRow label="Start date">
              <FormInput
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </FormRow>

            <FormRow label="Deadline" required>
              <FormInput
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </FormRow>
            <FormRow label={
              <span className="flex items-center gap-1">
                Recurring
                <IoHelpCircle className="text-gray-400" size={14} title={t('common.enable_recurring_tasks')} />
              </span>
            }>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="w-5 h-5 text-primary-accent border-gray-300 rounded focus:ring-primary-accent"
                />
              </div>
            </FormRow>

            {/* Recurring Fields - Show only when recurring is checked */}
            {formData.is_recurring && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 pl-4 border-l-2 border-primary-accent/20 ml-2">
                {/* Repeat Every */}
                <FormRow label="Repeat every">
                  <div className="flex gap-2">
                    <FormInput
                      type="number"
                      value={formData.repeat_every}
                      onChange={(e) => setFormData({ ...formData, repeat_every: e.target.value })}
                      min="1"
                      className="w-24"
                    />
                    <FormSelect
                      value={formData.repeat_unit}
                      onChange={(e) => setFormData({ ...formData, repeat_unit: e.target.value })}
                      className="flex-1"
                    >
                      {repeatUnitOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </FormSelect>
                  </div>
                </FormRow>

                {/* Cycles */}
                <FormRow label="Cycles">
                  <div className="flex items-center gap-2">
                    <FormInput
                      type="number"
                      value={formData.cycles}
                      onChange={(e) => setFormData({ ...formData, cycles: e.target.value })} title="Number of times to repeat (leave empty for infinite)" />
                  </div>
                </FormRow>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Fields Section */}
      <div className="px-1 pb-2">
        <CustomFieldsSection
          module="Tasks"
          companyId={companyId}
          values={formData.custom_fields || {}}
          onChange={(name, value) => setFormData(prev => ({ ...prev, custom_fields: { ...prev.custom_fields, [name]: value } }))}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
        {/* Left side - Upload and Mic */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
            <IoAttach size={18} className="text-gray-500" />
            <span>{t('auto.auto_fbb7d719') || 'Upload File'}</span>
            <input
              key={fileInputKey}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {formData.uploaded_file && (
            <span className="text-xs text-gray-500 truncate max-w-[150px]">
              {formData.uploaded_file.name}
            </span>
          )}
          <button
            type="button"
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('common.voice_input')}
          >
            <IoMic size={18} />
          </button>
        </div>

        {/* Right side - Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="px-4 py-2 flex items-center gap-2"
            disabled={saving}
          >
            <IoClose size={16} />
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSave(true)}
            className="px-4 py-2 flex items-center gap-2 bg-primary-accent hover:opacity-90"
            disabled={saving}
          >
            <IoCheckmarkCircle size={16} />
            Save & show
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSave(false)}
            className="px-4 py-2 flex items-center gap-2 bg-primary-accent hover:opacity-90"
            disabled={saving}
          >
            <IoSave size={16} />
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default TaskFormModal

