import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

/** Stable tenant id for admin pages — never guess company `1` (wrong org / empty lists). */
const resolveCompanyId = (u) => {
  const candidates = [
    u?.company_id,
    u?.companyId,
  ]
  for (const c of candidates) {
    if (c == null || c === '') continue
    const n = parseInt(String(c).trim(), 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  const ls = localStorage.getItem('companyId') || localStorage.getItem('company_id')
  if (ls) {
    const n = parseInt(ls, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../context/LanguageContext'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import UniqueIdBadge, { ID_PREFIXES } from '../../../components/ui/UniqueIdBadge'
import ColorPicker from '../../../components/ui/ColorPicker'
import { projectsAPI, usersAPI, employeesAPI, departmentsAPI, projectTemplatesAPI, customFieldsAPI } from '../../../api'
import { useAuth } from '../../../context/AuthContext'
import {
  IoEye,
  IoPencil,
  IoTrashOutline,
  IoList,
  IoGrid,
  IoDocumentText,
  IoTime,
  IoPeople,
  IoFolder,
  IoAdd,
  IoClose,
  IoDownload,
  IoSearch,
  IoFilter,
  IoCalendar,
  IoPin,
  IoPrint,
  IoChevronDown,
  IoChevronUp,
  IoEllipsisVertical,
  IoGlobe,
  IoCheckmarkCircle,
  IoRadioButtonOn,
  IoRadioButtonOff,
  IoPricetag,
  IoBriefcase
} from 'react-icons/io5'
import {
  FormRow,
  FormSection,
  FormInput,
  FormSelect,
  FormTextarea,
  FormCheckbox,
  FormActions
} from '../../../components/ui/FormRow'
import RichTextEditor from '../../../components/ui/RichTextEditor'

/** Shown in the create/edit form when the API has not returned any project labels yet (same names as list badges). */
const DEFAULT_PROJECT_PRIORITY_LABELS = [
  { id: 'fb-urgent', name: 'Urgent' },
  { id: 'fb-ontrack', name: 'On track' },
  { id: 'fb-high', name: 'High Priority' },
]

/** YYYY-MM-DD for table cells; bad API values show as empty to avoid "Invalid Date" */
const toDateInput = (v) => {
  if (v == null || v === '') return ''
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.split('T')[0].slice(0, 10)
  const t = new Date(v)
  if (Number.isNaN(t.getTime()) || t.getFullYear() < 1970) return ''
  return t.toISOString().split('T')[0]
}

const Projects = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const companyId = useMemo(() => resolveCompanyId(user), [user])

  // Keep localStorage in sync so axios + list calls always send the same company as the session
  useEffect(() => {
    if (user?.company_id && !localStorage.getItem('companyId')) {
      localStorage.setItem('companyId', String(user.company_id))
    }
  }, [user?.company_id])
  const [viewMode, setViewMode] = useState('list') // 'list', 'card', 'calendar', 'pin'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  const handleView = (project) => {
    navigate(`/app/admin/projects/${project.id}`)
  }
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [projectTemplates, setProjectTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [isManageLabelsModalOpen, setIsManageLabelsModalOpen] = useState(false)
  const [availableLabels, setAvailableLabels] = useState([])
  const [newLabelColor, setNewLabelColor] = useState('#78be20')
  const [newLabel, setNewLabel] = useState('')

  const PREDEFINED_COLORS = [
    '#22c55e', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6',
    '#ef4444', '#f97316', '#eab308', '#ec4899', '#64748b',
    '#166534', '#065f46', '#1e40af', '#3730a3', '#5b21b6',
    '#991b1b', '#9a3412', '#854d0e', '#9d174d', '#334155'
  ]
  const [showOtherDetails, setShowOtherDetails] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [progressFilter, setProgressFilter] = useState('')
  const [labelFilter, setLabelFilter] = useState('')
  const [assignedUserFilter, setAssignedUserFilter] = useState('')
  const [projectTypeFilter, setProjectTypeFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [sortColumn, setSortColumn] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('DESC')
  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    priorities: [],
    categories: [],
    assigned_users: []
  })

  const [formData, setFormData] = useState({
    company_id: (companyId && !isNaN(companyId) && companyId > 0) ? companyId : '', // Auto-set from Admin session
    department_id: '', // Cascading from company
    projectManager: '', // Employee cascading from company/department
    shortCode: '',
    projectName: '',
    description: '', // Project description
    startDate: '',
    deadline: '',
    noDeadline: false,
    budget: '', // Budget field
    projectCategory: '',
    projectSubCategory: '',
    projectSummary: '',
    notes: '',
    publicGanttChart: 'enable',
    publicTaskBoard: 'enable',
    taskApproval: 'disable',
    label: '',
    projectMembers: [],
    createPublicProject: false,
    status: 'In Bearbeitung',
    projectType: 'Internal Project',
    custom_fields: {},
  })

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(null)
  const [customFields, setCustomFields] = useState([])
  const [cfLoading, setCfLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [filteredDepartments, setFilteredDepartments] = useState([])
  const [departments, setDepartments] = useState([])
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('')

  // Fetch custom fields for Projects module
  useEffect(() => {
    const fetchCustomFields = async () => {
      try {
        setCfLoading(true)
        const res = await customFieldsAPI.getAll({ company_id: companyId, module: 'Projects' })
        if (res.data?.success) {
          setCustomFields(res.data.data || [])
        }
      } catch (err) {
        console.error('Error fetching custom fields for Projects:', err)
      } finally {
        setCfLoading(false)
      }
    }
    if (companyId) fetchCustomFields()
  }, [companyId])

  // Memoize fetch functions to prevent recreation
  const fetchUsers = useCallback(async () => {
    try {
      const response = await usersAPI.getAll()
      if (response.data.success) {
        setUsers(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [])


  const fetchDepartments = useCallback(async (companyId) => {
    try {
      // Ensure companyId is a valid number
      const validCompanyId = parseInt(companyId, 10)
      if (!validCompanyId || isNaN(validCompanyId) || validCompanyId <= 0) {
        console.error('Invalid companyId for fetchDepartments:', companyId, 'parsed:', validCompanyId)
        setDepartments([])
        setFilteredDepartments([])
        return
      }
      const response = await departmentsAPI.getAll({ company_id: validCompanyId })
      if (response.data.success) {
        const depts = response.data.data || []
        setDepartments(depts)
        setFilteredDepartments(depts)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
      console.error('Error response:', error.response?.data)
      setDepartments([])
      setFilteredDepartments([])
    }
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch filter options
  const fetchLabels = useCallback(async () => {
    try {
      const response = await projectsAPI.getAllLabels({ company_id: companyId })
      if (response.data.success) {
        setAvailableLabels(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching labels:', error)
    }
  }, [companyId])

  useEffect(() => {
    fetchLabels()
  }, [fetchLabels])

  useEffect(() => {
    if (isAddModalOpen || isEditModalOpen) {
      fetchLabels()
    }
  }, [isAddModalOpen, isEditModalOpen, fetchLabels])

  const priorityLabelOptions = useMemo(
    () => (availableLabels.length > 0 ? availableLabels : DEFAULT_PROJECT_PRIORITY_LABELS),
    [availableLabels]
  )

  const handleAddLabel = async () => {
    if (!newLabel.trim()) return
    try {
      const response = await projectsAPI.createLabel({
        name: newLabel.trim(),
        color: newLabelColor,
        company_id: companyId
      })
      if (response.data.success) {
        setNewLabel('')
        setNewLabelColor('#3b82f6')
        fetchLabels()
      }
    } catch (error) {
      console.error('Error creating label:', error)
      alert(error.response?.data?.error || 'Failed to create label')
    }
  }

  const handleDeleteLabel = async (labelId) => {
    if (!window.confirm('Are you sure you want to delete this label?')) return
    try {
      const response = await projectsAPI.deleteLabel(labelId, { company_id: companyId })
      if (response.data.success) {
        fetchLabels()
      }
    } catch (error) {
      console.error('Error deleting label:', error)
    }
  }

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await projectsAPI.getFilters()
      if (response.data.success) {
        setFilterOptions(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }, [])

  const fetchProjects = useCallback(async () => {
    let requestParams = { company_id: null }
    try {
      const validCompanyId = companyId
      if (!validCompanyId || validCompanyId <= 0) {
        console.error('Invalid companyId for fetchProjects — cannot call GET /projects without company_id')
        setListError(t('projects.errors.missing_company') || 'Company is required. Please sign in again.')
        setProjects([])
        setLoading(false)
        return
      }

      setLoading(true)
      setListError(null)
      const params = {
        company_id: validCompanyId,
      }
      requestParams = { ...params }

      // Search
      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery
      }

      // Status / tab filters: high_priority = label; upcoming = date query; not raw status=high_priority
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'high_priority') {
          params.priority = 'High Priority'
        } else if (statusFilter === 'upcoming') {
          params.upcoming = 'true'
        } else {
          params.status = statusFilter
        }
      }

      // Priority/Label filter
      if (labelFilter) {
        params.priority = labelFilter
      }

      // Assigned user filter
      if (assignedUserFilter) {
        params.assigned_user_id = assignedUserFilter
      }

      // Project type filter
      if (projectTypeFilter) {
        params.project_type = projectTypeFilter
      }

      // Date range filters
      if (startDateFilter) {
        params.start_date = startDateFilter
      }
      if (endDateFilter) {
        params.end_date = endDateFilter
      }

      // Progress filter
      if (progressFilter) {
        const [min, max] = progressFilter.split(' - ').map(s => parseInt(s.replace('%', '')))
        if (min !== undefined) params.progress_min = min
        if (max !== undefined) params.progress_max = max
      }

      // Sorting
      if (sortColumn) {
        params.sort_by = sortColumn
        params.sort_order = sortDirection
      }

      const response = await projectsAPI.getAll(params)
      const raw = response.data
      if (raw?.success === false) {
        setListError(raw?.error || t('projects.errors.load_failed') || 'Could not load projects')
        setProjects([])
        return
      }
      const fetchedProjects = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []
      if (raw?.success !== false) {
        // Transform API data to match component format
        const transformedProjects = fetchedProjects.map((project) => ({
          id: project.id,
          code: project.short_code || '',
          name: project.project_name || '',
          projectType: project.project_type || '',
          company_name: project.company_name || '',
          department_name: project.department_name || '',
          client_name: project.client_name || '',
          project_manager_name: project.project_manager_name || '',
          budget: project.budget || null,
          members: (project.members || []).map((member) => ({
            id: member.id || member.user_id,
            name: member.name || member.email,
            avatar: member.name ? member.name.split(' ').map((n) => n[0]).join('') : member.email.substring(0, 2).toUpperCase(),
          })),
          startDate: toDateInput(project.start_date),
          deadline: project.deadline == null || project.deadline === '' ? null : toDateInput(project.deadline) || null,
          status: project.status || 'In Bearbeitung',
          progress: project.progress || 0,
          label: project.label || '',
          price: project.budget || project.price || null,
          company_id: project.company_id,
          department_id: project.department_id,
          project_manager_id: project.project_manager_id,
          description: project.description,
          custom_fields: project.custom_fields || {},
        }))
        setProjects(transformedProjects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      console.error('Error response:', error.response?.data)
      console.error('Request params:', requestParams)
      const msg =
        error.response?.data?.error ||
        error.message ||
        (t('projects.errors.load_failed') || 'Could not load projects')
      setListError(msg)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [companyId, debouncedSearchQuery, statusFilter, labelFilter, assignedUserFilter, projectTypeFilter, startDateFilter, endDateFilter, progressFilter, sortColumn, sortDirection, t])

  // Fetch departments by company
  const fetchDepartmentsByCompany = useCallback(async (companyId) => {
    try {
      const response = await departmentsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setFilteredDepartments(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
      setFilteredDepartments([])
    }
  }, [])

  // Fetch employees by company (and optionally department)
  const fetchEmployeesByCompany = useCallback(async (companyId, departmentId = null) => {
    try {
      // Ensure companyId is a valid number
      const validCompanyId = parseInt(companyId, 10)
      if (!validCompanyId || isNaN(validCompanyId) || validCompanyId <= 0) {
        console.error('Invalid companyId for fetchEmployeesByCompany:', companyId, 'parsed:', validCompanyId)
        setFilteredEmployees([])
        return
      }
      const params = { company_id: validCompanyId }
      if (departmentId) {
        params.department_id = departmentId
      }
      const response = await employeesAPI.getAll(params)
      if (response.data.success) {
        setFilteredEmployees(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      // Fallback to users if employees API fails
      const allUsers = users.filter(u => u.company_id === companyId || u.company_id === parseInt(companyId))
      setFilteredEmployees(allUsers)
    }
  }, [users])

  const availableMembers = [
    'Alanna Jones',
    'Anthony Cummerata Jr.',
    'Axel Homenick',
    'Clyde Schimmel II',
    'Dr. Cassidy McGlynn MD',
    'Fred Upton',
    'Miss Halie Gleichner',
    'Mr. Hermann Hegmann',
    'River Abbott',
    'Sheldon Lemke II',
    'Sonny Steuber',
    'Sterling Buckridge',
  ]

  // Fetch initial data filtered by Admin's company - ONLY ONCE on mount
  useEffect(() => {
    if (companyId && !isNaN(companyId) && companyId > 0) {
      // Parallelize initial data fetch for better performance
      Promise.all([
        fetchDepartments(companyId),
        fetchEmployeesByCompany(companyId),
        fetchUsers()
      ]).catch(error => {
        console.error('Error fetching initial data:', error)
      })
    } else {
      console.warn('Invalid companyId:', companyId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]) // Only re-fetch when companyId changes

  // When department changes, filter employees
  useEffect(() => {
    if (formData.department_id) {
      fetchEmployeesByCompany(companyId, formData.department_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.department_id])

  // Fetch filter options on mount - ONLY ONCE
  useEffect(() => {
    fetchFilterOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch projects on mount and when filters change
  useEffect(() => {
    if (companyId && companyId > 0) {
      fetchProjects()
    } else {
      setLoading(false)
      setProjects([])
      if (!companyId) {
        setListError(t('projects.errors.missing_company'))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, debouncedSearchQuery, statusFilter, labelFilter, assignedUserFilter, projectTypeFilter, startDateFilter, endDateFilter, progressFilter, sortColumn, sortDirection])

  const projectCategories = ['Web Development', 'Mobile App', 'Design', 'Marketing', 'Consulting', 'Other']

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const formatDate = (dateString) => {
    if (dateString == null || dateString === '') return '-'
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
  }

  const isDeadlineOverdue = (deadline) => {
    if (!deadline) return false
    const d = new Date(deadline)
    if (Number.isNaN(d.getTime())) return false
    return d < new Date()
  }


  // Fetch project templates
  const fetchProjectTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true)
      const response = await projectTemplatesAPI.getAll({ company_id: companyId })
      if (response.data?.success) {
        setProjectTemplates(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching project templates:', error)
      setProjectTemplates([])
    } finally {
      setLoadingTemplates(false)
    }
  }, [companyId])

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setFormData(prev => ({
      ...prev,
      company_id: companyId,
      projectName: template.name || '',
      description: template.summary || '',
      projectCategory: template.category || '',
      projectSubCategory: template.sub_category || '',
      projectSummary: template.summary || '',
      notes: template.notes || '',
    }))
    setIsTemplateModalOpen(false)
    setIsAddModalOpen(true)
  }

  // Open template modal
  const handleOpenTemplateModal = () => {
    fetchProjectTemplates()
    setIsTemplateModalOpen(true)
  }

  const handleAdd = () => {
    // Auto-set company_id from Admin session and fetch filtered data
    const adminCompanyId = companyId
    setFormData({
      company_id: adminCompanyId, // Auto-set from Admin session
      department_id: '',
      projectManager: '',
      shortCode: '',
      projectName: '',
      description: '',
      startDate: '',
      deadline: '',
      noDeadline: false,
      budget: '',
      projectCategory: '',
      projectSubCategory: '',
      projectSummary: '',
      notes: '',
      publicGanttChart: 'enable',
      publicTaskBoard: 'enable',
      taskApproval: 'disable',
      label: '',
      projectMembers: [],
      createPublicProject: false,
      status: 'In Bearbeitung',
      projectType: 'Client Project',
      custom_fields: {},
    })
    // Fetch filtered data for Admin's company
    if (adminCompanyId) {
      fetchDepartments(adminCompanyId)
      fetchEmployeesByCompany(adminCompanyId)
    }
    setEmployeeSearchQuery('')
    setIsAddModalOpen(true)
  }

  const resetFormAfterSuccessfulSave = () => {
    setFormData({
      company_id: companyId,
      department_id: '',
      projectManager: '',
      shortCode: '',
      projectName: '',
      description: '',
      startDate: '',
      deadline: '',
      noDeadline: false,
      budget: '',
      projectCategory: '',
      projectSubCategory: '',
      projectSummary: '',
      notes: '',
      publicGanttChart: 'enable',
      publicTaskBoard: 'enable',
      taskApproval: 'disable',
      label: '',
      projectMembers: [],
      createPublicProject: false,
      status: 'In Bearbeitung',
    })
    setFilteredEmployees([])
    setFilteredDepartments([])
    setEmployeeSearchQuery('')
  }

  const handleSave = async () => {
    // Auto-set company_id from Admin session
    const adminCompanyId = companyId
    if (!adminCompanyId) {
      alert('Company ID is required. Please login again.')
      return
    }
    if (!formData.projectName) {
      alert('Project Name is required')
      return
    }
    // Only require date/deadline for new projects or if fields are touched/cleared
    if (!formData.startDate) {
      alert('Start Date is required')
      return
    }
    if (!formData.noDeadline && !formData.deadline) {
      alert('Deadline is required')
      return
    }
    // Warn if project manager is missing but don't block strictly if editing legacy data
    if (!formData.projectManager) {
      if (!isEditModalOpen) {
        alert('Project Manager is required')
        return
      }
    }

    try {
      // Ensure selected employee is included in members (if not already selected and valid)
      const employeeId = parseInt(formData.projectManager)
      const validEmployeeId = !isNaN(employeeId) ? employeeId : null

      const baseMembers = Array.isArray(formData.projectMembers)
        ? formData.projectMembers.map(m => parseInt(m)).filter(m => !isNaN(m))
        : []

      const projectMembers = validEmployeeId
        ? [...new Set([validEmployeeId, ...baseMembers])]
        : [...new Set(baseMembers)]

      const projectData = {
        company_id: parseInt(adminCompanyId), // Auto-set from Admin session
        short_code: formData.shortCode || formData.projectName.substring(0, 3).toUpperCase(),
        project_name: formData.projectName,
        description: formData.description || null,
        start_date: formData.startDate,
        deadline: formData.noDeadline ? null : formData.deadline,
        no_deadline: formData.noDeadline ? 1 : 0,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        project_category: formData.projectCategory || null,
        project_sub_category: formData.projectSubCategory || null,
        department_id: formData.department_id || null,
        project_manager_id: validEmployeeId || null,
        project_summary: formData.projectSummary || null,
        notes: formData.notes || null,
        public_gantt_chart: formData.publicGanttChart || 'enable',
        public_task_board: formData.publicTaskBoard || 'enable',
        task_approval: formData.taskApproval || 'disable',
        label: formData.label || null,
        project_members: projectMembers, // Array of user IDs (includes selected employee)
        status: formData.status || 'In Bearbeitung',
        progress: 0,
        custom_fields: formData.custom_fields || {}
      }

      if (isEditModalOpen && selectedProject) {
        const response = await projectsAPI.update(selectedProject.id, projectData)
        if (response.data.success) {
          alert('Project updated successfully!')
          setIsEditModalOpen(false)
          setSelectedProject(null)
          resetFormAfterSuccessfulSave()
          try {
            await fetchProjects()
          } catch (refreshErr) {
            console.error('Project list refresh failed (save still succeeded):', refreshErr)
          }
        } else {
          alert(response.data.error || 'Failed to update project')
        }
      } else {
        const response = await projectsAPI.create(projectData)
        if (response.data.success) {
          alert('Project created successfully!')
          setIsAddModalOpen(false)
          resetFormAfterSuccessfulSave()
          try {
            await fetchProjects()
          } catch (refreshErr) {
            console.error('Project list refresh failed (save still succeeded):', refreshErr)
          }
        } else {
          alert(response.data.error || 'Failed to create project')
        }
      }
    } catch (error) {
      console.error('Error saving project:', error)
      alert(error.response?.data?.error || 'Failed to save project')
    }
  }

  // Placeholder for hidden file input ref
  const fileInputRef = useRef(null)

  const handleImportProjects = () => {
    setIsImportModalOpen(true)
  }

  const handleFileImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Simple CSV parser
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const text = evt.target.result
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) {
        alert('CSV file must have at least a header row and one data row')
        e.target.value = ''
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const nameIndex = headers.findIndex(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('title') || h.toLowerCase().includes('project'))

      if (nameIndex === -1) {
        alert('CSV must contain a column with "name", "title", or "project" in the header')
        e.target.value = ''
        return
      }

      let successCount = 0
      let failCount = 0

      // Skip header, process rows
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const projectData = {
          company_id: companyId,
          project_name: values[nameIndex] || `Imported Project ${i}`,
          status: 'In Bearbeitung',
          start_date: new Date().toISOString().slice(0, 10),
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        }

        try {
          await projectsAPI.create(projectData, { company_id: companyId })
          successCount++
        } catch (err) {
          console.error('Error importing project:', err)
          failCount++
        }
      }

      alert(`Import complete. Successfully imported ${successCount} projects. ${failCount} failed.`)
      e.target.value = '' // Reset
      await fetchProjects() // Refresh the list
    }
    reader.onloaderror = () => {
      alert('Error reading file')
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  const handleManageLabels = () => {
    setIsManageLabelsModalOpen(true)
  }

  const handleEdit = async (project) => {
    setSelectedProject(project)

    // Fetch full project data with company_id
    try {
      const response = await projectsAPI.getById(project.id, { company_id: companyId })
      if (response.data.success) {
        const fullProject = response.data.data

        setFormData({
          company_id: fullProject.company_id || '',
          department_id: fullProject.department_id ? fullProject.department_id.toString() : '',
          projectManager: fullProject.project_manager_id ? fullProject.project_manager_id.toString() : '',
          shortCode: fullProject.short_code || project.code || '',
          projectName: fullProject.project_name || project.name || '',
          description: fullProject.description || '',
          startDate: fullProject.start_date ? fullProject.start_date.split('T')[0] : project.startDate || '',
          deadline: fullProject.deadline ? fullProject.deadline.split('T')[0] : project.deadline || '',
          noDeadline: fullProject.no_deadline || !fullProject.deadline,
          budget: fullProject.budget?.toString() || '',
          projectCategory: fullProject.project_category || '',
          projectSubCategory: fullProject.project_sub_category || '',
          projectSummary: fullProject.project_summary || '',
          notes: fullProject.notes || '',
          publicGanttChart: fullProject.public_gantt_chart || 'enable',
          publicTaskBoard: fullProject.public_task_board || 'enable',
          taskApproval: fullProject.task_approval || 'disable',
          label: fullProject.label || '',
          projectMembers: fullProject.members?.map(m => (m.id || m.user_id).toString()) || project.members?.map(m => m.id.toString()) || [],
          createPublicProject: fullProject.create_public_project ? true : false,
          status: fullProject.status || 'In Bearbeitung',
          custom_fields: fullProject.custom_fields || {},
        })

        // Fetch cascading data filtered by Admin's company
        if (companyId) {
          await fetchDepartments(companyId)
          await fetchEmployeesByCompany(companyId, fullProject.department_id || null)
        }
      }
    } catch (error) {
      console.error('Error fetching project details:', error)
      // Fallback to existing project data


      setFormData({
        company_id: '',
        department_id: '',
        projectManager: '', // Can't guess this easily from list view if not present
        shortCode: project.code || '',
        projectName: project.name || '',
        description: '',
        startDate: project.startDate || '',
        deadline: project.deadline || '',
        noDeadline: !project.deadline,
        budget: '',
        projectCategory: '',
        projectSubCategory: '',
        projectSummary: '',
        notes: '',
        publicGanttChart: 'enable',
        publicTaskBoard: 'enable',
        taskApproval: 'disable',
        label: '',
        projectMembers: project.members?.map(m => m.id) || [],
        createPublicProject: false,
        status: 'In Bearbeitung',
      })
    }

    setIsEditModalOpen(true)
  }

  const handleDelete = async (project) => {
    if (window.confirm(`Are you sure you want to delete ${project.name}?`)) {
      try {
        const response = await projectsAPI.delete(project.id, { company_id: companyId })
        if (response.data.success) {
          alert('Project deleted successfully!')
          await fetchProjects()
        } else {
          alert(response.data.error || 'Failed to delete project')
        }
      } catch (error) {
        console.error('Error deleting project:', error)
        alert(error.response?.data?.error || 'Failed to delete project')
      }
    }
  }

  // Handle Excel Export
  const handleExportExcel = () => {
    // Flatten data for export
    const csvData = filteredProjects.map(p => ({
      ID: p.id,
      Code: p.code,
      Name: p.name,
      Status: p.status,
      Progress: p.progress + '%',
      Budget: p.budget,
      StartDate: p.startDate,
      Deadline: p.deadline
    }))

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {}).join(',')
    const rows = csvData.map(obj => Object.values(obj).map(val => `"${val || ''}"`).join(','))
    const csvString = [headers, ...rows].join('\n')

    // Download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `projects_export_${new Date().toISOString().slice(0, 10)}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    setIsExcelModalOpen(false)
  }

  // Handle Print
  const handlePrint = () => {
    // Create a print-friendly table
    const printWindow = window.open('', '_blank')
    const tableHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>{t('auto.auto_be25f2c6') || 'Projects Report'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>{t('auto.auto_be25f2c6') || 'Projects Report'}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>{t('') || ''}</th>
                <th>{t('auto.auto_8e3a4215') || 'Project Name'}</th>
                <th>{t('') || ''}</th>
                <th>{t('auto.auto_ec53a8c4') || 'Status'}</th>
                <th>{t('') || ''}</th>
                <th>{t('auto.auto_db3794c7') || 'Start Date'}</th>
                <th>{t('') || ''}</th>
                <th>{t('auto.auto_b021df6a') || 'Label'}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProjects.map(project => `
                <tr>
                  <td>${project.id}</td>
                  <td>${project.name || project.project_name || '-'}</td>
                  <td>${project.code || project.short_code || '-'}</td>
                  <td>${project.client?.name || project.client_name || '-'}</td>
                  <td>${project.status || '-'}</td>
                  <td>${project.progress || 0}%</td>
                  <td>${project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</td>
                  <td>${project.deadline ? new Date(project.deadline).toLocaleDateString() : '-'}</td>
                  <td>${project.label || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    printWindow.document.write(tableHTML)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const columns = [
    {
      key: 'checkbox',
      label: '',
      render: (value, row) => (
        <input type="checkbox" className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent" />
      ),
    },
    {
      key: 'id',
      label: t('projects.columns.id'),
      render: (value, row) => <UniqueIdBadge prefix={ID_PREFIXES.PROJECT} id={row.id} size="sm" />,
    },
    {
      key: 'name',
      label: t('projects.columns.name'),
      width: '260px',
      render: (value, row) => (
        <div className="flex flex-col gap-1 min-w-0">
          <a
            href="#"
            className="text-gray-900 hover:text-blue-600 hover:underline font-medium text-sm truncate"
            onClick={(e) => {
              e.preventDefault()
              handleView(row)
            }}
          >
            {value || row.project_name || '-'}
          </a>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
            {row.code && <span className="font-mono">{row.code}</span>}
            {row.projectType && <span className="text-gray-400 capitalize">{row.projectType}</span>}
          </div>
          {row.label && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white w-fit shadow-sm uppercase tracking-wide whitespace-nowrap"
              style={{ backgroundColor: availableLabels.find((l) => l.name === row.label)?.color || '#3b82f6' }}
            >
              {['urgent'].includes((row.label || '').toLowerCase())
                ? 'Dringend'
                : ['on track'].includes((row.label || '').toLowerCase())
                  ? 'Auf Kurs'
                  : ['high priority'].includes((row.label || '').toLowerCase())
                    ? 'Hohe Priorität'
                    : row.label}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'startDate',
      label: t('projects.columns.start_date'),
      width: '120px',
      render: (value) => <span className="text-sm text-gray-600">{formatDate(value)}</span>
    },
    {
      key: 'deadline',
      label: t('projects.columns.deadline'),
      width: '120px',
      render: (value) => (
        <span className={`text-sm ${value && isDeadlineOverdue(value) ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
          {value ? formatDate(value) : t('common.never')}
        </span>
      )
    },
    {
      key: 'label',
      label: t('projects.columns.priority'),
      render: (value) => value ? <Badge variant="default" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>{value}</Badge> : '-'
    },
    {
      key: 'progress',
      label: t('projects.columns.progress'),
      width: '180px',
      render: (value) => (
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">{value}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${getProgressColor(value)}`} style={{ width: `${value}%` }} />
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: t('projects.columns.status'),
      width: '120px',
      render: (value) => (
        <Badge variant={value?.toLowerCase() === 'finished' || value?.toLowerCase() === 'completed' ? 'success' : 'default'} className="capitalize">
          {t(`common.status.${value?.toLowerCase().replace(/^common\.status\./, '').replace(/\s+/g, '_')}`) || value}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: t('common.actions.title'),
      render: (value, row) => {
        const actions = (row) => (
          <div className="action-btn-container">
            <button onClick={(e) => { e.stopPropagation(); handleView(row) }} className="action-btn action-btn-view" title={t('common.actions.view')}><IoEye size={18} /></button>
            <button onClick={(e) => { e.stopPropagation(); handleEdit(row) }} className="action-btn action-btn-edit" title={t('common.actions.edit')}><IoPencil size={18} /></button>
            <button
              onClick={async (e) => {
                e.stopPropagation()
                if (window.confirm(t('common.confirmation.delete'))) {
                  try {
                    await projectsAPI.delete(row.id)
                    alert(t('messages.deleteSuccess'))
                    await fetchProjects()
                  } catch (error) {
                    alert(error.response?.data?.error)
                  }
                }
              }}
              className="action-btn action-btn-delete"
              title={t('common.actions.delete')}
            >
              <IoTrashOutline size={18} />
            </button>
          </div>
        )
        return actions(row)
      },
    },
    // Custom Fields Columns
    ...customFields.map(field => ({
      key: `cf_${field.name}`,
      label: field.label,
      render: (_, row) => {
        const val = row.custom_fields?.[field.name];
        return <span className="text-sm text-gray-700">{val || '-'}</span>
      }
    }))
  ]

  // Projects are already filtered server-side, so use them directly
  const filteredProjects = projects

  return (
    <div className="space-y-4 sm:space-y-6">
      {listError && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 flex flex-wrap items-center justify-between gap-2"
        >
          <span>{listError}</span>
          {companyId ? (
            <button
              type="button"
              onClick={() => fetchProjects()}
              className="shrink-0 rounded-md bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900"
            >
              {t('projects.retry_load')}
            </button>
          ) : null}
        </div>
      )}
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 className="text-xl font-semibold text-gray-900">{t('sidebar.projects')}</h1>
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <button
              onClick={handleManageLabels}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors shadow-sm"
            >
              <IoPricetag size={14} />
              <span className="hidden sm:inline">{t('projects.actions.manage_labels')}</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors shadow-sm"
            >
              <IoDownload size={14} />
              <span className="hidden sm:inline">{t('projects.actions.import_projects')}</span>
            </button>
            {/* Hidden Input for Import */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv,.xlsx,.xls"
              onChange={handleFileImport}
            />
            <button
              onClick={handleOpenTemplateModal}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors shadow-sm"
              style={{ backgroundColor: '#0891b2' }}
            >
              <IoFolder size={14} />
              <span className="hidden sm:inline">{t('projects.actions.use_template')}</span>
            </button>
            <AddButton onClick={handleAdd} label={t('projects.actions.add_project')} />
          </div>
        </div>

        {/* View Mode and Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5">
              <button
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                onClick={() => setViewMode('list')}
              >
                <IoList size={14} />
              </button>
              <button
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${viewMode === 'card' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                onClick={() => setViewMode('card')}
              >
                <IoGrid size={14} />
              </button>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-[32px]"
            >
              <option value="all">- {t('common.filter')} -</option>
              <option value="all">{t('projects.filters.all')}</option>
              <option value="completed">{t('projects.filters.completed')}</option>
              <option value="high_priority">{t('projects.filters.high_priority')}</option>
              <option value="open">{t('projects.filters.open')}</option>
              <option value="upcoming">{t('projects.filters.upcoming')}</option>
            </select>
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="p-1.5 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors shadow-sm"
              title={t('projects.actions.advanced_filters')}
            >
              <IoFilter size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
            >
              <IoDownload size={14} />
              <span className="hidden sm:inline">{t('common.export')}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
            >
              <IoPrint size={14} />
              <span className="hidden sm:inline">{t('common.print')}</span>
            </button>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('projects.search_placeholder')}
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs w-40"
              />
              <IoSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            </div>
          </div>
        </div>

        {/* Status Quick Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {[
            { id: 'all', label: t('projects.filters.all') },
            { id: 'completed', label: t('projects.filters.completed') },
            { id: 'high_priority', label: t('projects.filters.high_priority') },
            { id: 'open', label: t('projects.filters.open') },
            { id: 'upcoming', label: t('projects.filters.upcoming') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${statusFilter === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      {viewMode === 'list' && (
        <Card className="p-0 overflow-hidden">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-600 border-b border-gray-100">{t('common.loading')}</div>
          )}
          <DataTable
            columns={columns}
            data={filteredProjects}
            searchPlaceholder={t('projects.search_placeholder')}
            filterConfig={[
              { key: 'status', label: t('common.status'), type: 'select', options: ['In Bearbeitung', 'completed', 'on hold', 'cancelled'] },
              { key: 'company_name', label: t('common.company'), type: 'text' },
              { key: 'project_manager_name', label: t('common.employee'), type: 'text' },
            ]}
            bulkActions={true}
            selectedRows={[]}
            onSelectAll={() => { }}
          />
        </Card>
      )}

      {/* Projects Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8 text-secondary-text">{t('common.loading')}</div>
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-8 text-secondary-text">
              <IoBriefcase size={48} className="mx-auto mb-2 text-gray-300" />
              <p>{t('projects.no_projects_found')}</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Card key={project.id} className="p-3 sm:p-4 lg:p-5 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleView(project)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-primary-text truncate mb-1">{project.name}</h3>
                    <div className="flex flex-wrap gap-1 mb-1">
                      <p className="text-xs sm:text-sm text-secondary-text mr-2">ID: {project.id}</p>
                      {project.label && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm uppercase tracking-tight"
                          style={{ backgroundColor: availableLabels.find(l => l.name === project.label)?.color || '#3b82f6' }}
                        >{['urgent'].includes((project.label||'').toLowerCase()) ? 'Dringend' : ['on track'].includes((project.label||'').toLowerCase()) ? 'Auf Kurs' : ['high priority'].includes((project.label||'').toLowerCase()) ? 'Hohe Priorität' : project.label}</span>
                      )}
                    </div>
                  </div>
                  <Badge className={`text-xs flex-shrink-0 ${project.status === 'completed' ? 'bg-green-100 text-green-800' :
                    project.status === 'In Bearbeitung' || project.status === 'open' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'on hold' ? 'bg-yellow-100 text-yellow-800' :
                        project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                    {project.status === 'In Bearbeitung' ? 'In Bearbeitung' : ['completed', 'finished'].includes((project.status || '').toLowerCase()) ? 'Abgeschlossen' : ['on hold', 'common.status.on_hold'].includes((project.status || '').toLowerCase()) ? 'Pausiert' : ['cancelled'].includes((project.status || '').toLowerCase()) ? 'Abgebrochen' : project.status}
                  </Badge>
                </div>

                {project.label && (
                  <div className="mb-3">
                    <Badge className={`text-xs ${project.label === 'Urgent' ? 'bg-purple-100 text-purple-800' :
                      project.label === 'On track' ? 'bg-green-100 text-green-800' :
                        project.label === 'High Priority' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>{['urgent'].includes((project.label||'').toLowerCase()) ? 'Dringend' : ['on track'].includes((project.label||'').toLowerCase()) ? 'Auf Kurs' : ['high priority'].includes((project.label||'').toLowerCase()) ? 'Hohe Priorität' : project.label}</Badge>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-secondary-text">{t('projects.form.budget')} :</span>
                    <span className="text-primary-text font-medium">
                      {project.budget || project.price ? `$${parseFloat(project.budget || project.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-secondary-text">{t('projects.form.start_date')} :</span>
                    <span className="text-primary-text font-medium">
                      {project.startDate ? formatDate(project.startDate) : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-secondary-text">{t('projects.form.deadline')} :</span>
                    <span className={`font-medium ${project.deadline && isDeadlineOverdue(project.deadline) ? 'text-red-600' : 'text-primary-text'
                      }`}>
                      {project.deadline ? formatDate(project.deadline) : '-'}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-secondary-text">{t('common.progress')}</span>
                    <span className="text-xs font-semibold text-primary-text">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${project.progress >= 90 ? 'bg-green-600' :
                        project.progress >= 50 ? 'bg-blue-600' :
                          project.progress >= 30 ? 'bg-yellow-600' :
                            'bg-gray-400'
                        }`}
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleView(project)
                    }}
                    className="flex-1 px-3 py-1.5 text-xs sm:text-sm font-medium bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 transition-colors"
                  >
                    {t('common.view')}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(project)
                      }}
                      className="px-2 sm:px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-800 hover:text-white hover:border-gray-800 transition-colors flex-1 sm:flex-none"
                      title={t('common.edit')}
                    >
                      <IoPencil size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(project)
                      }}
                      className="px-2 sm:px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-800 hover:text-white hover:border-gray-800 transition-colors flex-1 sm:flex-none"
                      title={t('common.delete')}
                    >
                      <IoTrashOutline size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Project Modal - Modern Spacious Design */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setSelectedProject(null)
          setFormData({
            company_id: companyId,
            department_id: '',
            projectManager: '',
            shortCode: '',
            projectName: '',
            description: '',
            startDate: '',
            deadline: '',
            noDeadline: false,
            budget: '',
            projectCategory: '',
            projectSubCategory: '',
            projectSummary: '',
            notes: '',
            publicGanttChart: 'enable',
            publicTaskBoard: 'enable',
            taskApproval: 'disable',
            label: '',
            projectMembers: [],
            createPublicProject: false,
            status: 'In Bearbeitung',
          })
          setFilteredEmployees([])
          setFilteredDepartments([])
          setEmployeeSearchQuery('')
        }}
        title={isAddModalOpen ? t('projects.form.create_project') : t('projects.form.edit_project')}
        size="full"
      >
        <div className="space-y-8 p-2">
          {/* Section 1: Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <IoBriefcase className="text-primary-accent" />
              {t('projects.form.project_info')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-2">
                <Input
                  label={t('projects.form.project_name')}
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <IoCalendar className="text-primary-accent" />
              {t('projects.form.schedule_budget')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                type="date"
                label={t('projects.form.start_date')}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <div className="relative">
                <Input
                  type="date"
                  label={t('projects.form.deadline')}
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  disabled={formData.noDeadline}
                />
                <div className="absolute right-0 top-0">
                  <FormCheckbox
                    label={t('projects.form.no_deadline')}
                    checked={formData.noDeadline}
                    onChange={(e) => setFormData({ ...formData, noDeadline: e.target.checked, deadline: e.target.checked ? '' : formData.deadline })}
                  />
                </div>
              </div>
              <Input
                type="number"
                label={t('projects.form.budget')}
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6"></div>

          {/* Section 3: Team */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <IoPeople className="text-primary-accent" />
              {t('projects.form.team_assignment')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('projects.form.department')}</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => {
                    const deptId = e.target.value
                    setFormData({
                      ...formData,
                      department_id: deptId,
                      projectManager: '',
                      projectMembers: []
                    })
                    if (deptId && companyId) {
                      fetchEmployeesByCompany(companyId, deptId)
                    } else if (companyId) {
                      fetchEmployeesByCompany(companyId)
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all"
                >
                  <option value="">{t('projects.form.all_departments')}</option>
                  {filteredDepartments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name || dept.department_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('projects.form.project_manager')}</label>
                <select
                  value={formData.projectManager}
                  onChange={(e) => {
                    const managerId = e.target.value
                    setFormData({
                      ...formData,
                      projectManager: managerId,
                      projectMembers: managerId && !formData.projectMembers.includes(parseInt(managerId))
                        ? [...formData.projectMembers, parseInt(managerId)]
                        : formData.projectMembers
                    })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all"
                  required
                >
                  <option value="">{t('projects.form.select_manager')}</option>
                  {filteredEmployees.map(employee => (
                    <option key={employee.user_id || employee.id} value={employee.user_id || employee.id}>
                      {employee.name || employee.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('projects.form.project_members')}</label>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-[200px] overflow-y-auto">
                  <div className="mb-3 relative">
                    <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('projects.form.search_members')}
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-primary-accent"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredEmployees
                      .filter(employee => {
                        if (!employeeSearchQuery) return true
                        const searchTerm = employeeSearchQuery.toLowerCase()
                        return (
                          (employee.name || '').toLowerCase().includes(searchTerm) ||
                          (employee.email || '').toLowerCase().includes(searchTerm)
                        )
                      })
                      .map(employee => {
                        const employeeId = parseInt(employee.user_id || employee.id)
                        const isManager = parseInt(formData.projectManager) === employeeId
                        const isSelected = formData.projectMembers.map(m => parseInt(m)).includes(employeeId)

                        return (
                          <label
                            key={employeeId}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${isSelected || isManager ? 'bg-primary-accent/10 border border-primary-accent/30' : 'hover:bg-white border border-transparent'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected || isManager}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (!formData.projectMembers.map(m => parseInt(m)).includes(employeeId)) {
                                    setFormData(prev => ({
                                      ...prev,
                                      projectMembers: [...prev.projectMembers, employeeId]
                                    }))
                                  }
                                } else {
                                  if (isManager) return
                                  setFormData(prev => ({
                                    ...prev,
                                    projectMembers: prev.projectMembers.filter(id => parseInt(id) !== employeeId)
                                  }))
                                }
                              }}
                              className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{employee.name || employee.email}</p>
                              {isManager && <p className="text-xs text-primary-accent">{t('projects.form.manager')}</p>}
                            </div>
                          </label>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6"></div>

          {/* Section 4: Details & Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <IoDocumentText className="text-primary-accent" />
              {t('projects.form.additional_details')}
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('projects.form.project_summary')}</label>
                <div className="h-40">
                  <RichTextEditor
                    value={formData.projectSummary}
                    onChange={(content) => setFormData({ ...formData, projectSummary: content })}
                    placeholder={t('projects.form.project_summary')}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('projects.form.priority_label')}</label>
                  <p className="text-xs text-muted-text mb-2"></p>
                  <select
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none"
                  >
                    <option value="">{t('projects.form.none')}</option>
                    {priorityLabelOptions.map((label) => (
                      <option key={label.id ?? label.name} value={label.name}>{label.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('projects.form.status')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none"
                  >
                    <option value="In Bearbeitung">{t('projects.form.status_in_bearbeitung')}</option>
                    <option value="on hold">{t('projects.form.status_on_hold')}</option>
                    <option value="cancelled">{t('projects.form.status_cancelled')}</option>
                    <option value="completed">{t('projects.form.status_completed')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          {customFields.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <IoList className="text-primary-accent" />
                {t('projects.form.additional_information')}
              </h3>
              {cfLoading ? (
                <p className="text-sm text-gray-400">{t('common.loading')}</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                        {field.required === 1 && <span className="text-red-500 ml-1">*</span>}
                      </label>

                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData.custom_fields?.[field.name] || ''}
                          onChange={(e) => setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: e.target.value } })}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none"
                          rows={3}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        />
                      ) : field.type === 'dropdown' ? (
                        <select
                          value={formData.custom_fields?.[field.name] || ''}
                          onChange={(e) => setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: e.target.value } })}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none bg-white"
                        >
                          <option value="">— Select {field.label} —</option>
                          {(field.options || []).map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'multiselect' ? (
                        <div className="space-y-2">
                          {(field.options || []).map((opt, idx) => {
                            const selected = (formData.custom_fields?.[field.name] || '').split(',').filter(Boolean)
                            return (
                              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selected.includes(opt)}
                                  onChange={(e) => {
                                    const current = (formData.custom_fields?.[field.name] || '').split(',').filter(Boolean)
                                    const updated = e.target.checked ? [...current, opt] : current.filter(v => v !== opt)
                                    setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: updated.join(',') } })
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-primary-accent focus:ring-primary-accent"
                                />
                                <span className="text-sm text-gray-600">{opt}</span>
                              </label>
                            )
                          })}
                        </div>
                      ) : field.type === 'radio' ? (
                        <div className="space-y-2">
                          {(field.options || []).map((opt, idx) => (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`cf_proj_${field.name}`}
                                value={opt}
                                checked={formData.custom_fields?.[field.name] === opt}
                                onChange={() => setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: opt } })}
                                className="w-4 h-4 border-gray-300 text-primary-accent focus:ring-primary-accent"
                              />
                              <span className="text-sm text-gray-600">{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : field.type === 'checkbox' ? (
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.custom_fields?.[field.name] === 'true' || formData.custom_fields?.[field.name] === true}
                            onChange={(e) => setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: e.target.checked } })}
                            className="w-5 h-5 rounded border-gray-300 text-primary-accent focus:ring-primary-accent cursor-pointer"
                          />
                          <span className="text-sm text-gray-600">Yes, {field.label}</span>
                        </label>
                      ) : field.type === 'file' ? (
                        <div>
                          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-primary-accent transition-all">
                            <div className="flex flex-col items-center justify-center">
                              <IoDocumentText size={24} className="text-gray-400 mb-1" />
                              {formData.custom_fields?.[field.name] ? (
                                <p className="text-sm text-primary-accent font-medium">
                                  ✅ {typeof formData.custom_fields[field.name] === 'string'
                                    ? formData.custom_fields[field.name]
                                    : formData.custom_fields[field.name]?.name || 'File selected'}
                                </p>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-500">{t('auto.auto_634a1fb9') || 'Click to upload'}<span className="font-semibold text-primary-accent">{field.label}</span></p>
                                  <p className="text-xs text-gray-400 mt-1">{t('') || ''}</p>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: file } })
                              }}
                            />
                          </label>
                          {formData.custom_fields?.[field.name] && (
                            <button type="button" onClick={() => setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: null } })} className="mt-1 text-xs text-red-500 hover:text-red-700">
                              ✕ Remove file
                            </button>
                          )}
                        </div>
                      ) : (
                        <input
                          type={
                            field.type === 'number' ? 'number' :
                              field.type === 'date' ? 'date' :
                                field.type === 'datetime' ? 'datetime-local' :
                                  field.type === 'email' ? 'email' :
                                    field.type === 'phone' ? 'tel' :
                                      field.type === 'url' ? 'url' : 'text'
                          }
                          value={formData.custom_fields?.[field.name] || ''}
                          onChange={(e) => setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: e.target.value } })}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                        />
                      )}

                      {field.help_text && (
                        <p className="text-xs text-gray-400 mt-1">{field.help_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
              }}
              className="px-6 py-2"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="px-8 py-2 flex items-center gap-2 shadow-lg shadow-primary-accent/20"
            >
              <IoCheckmarkCircle size={20} />
              {isEditModalOpen ? t('common.save') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Excel Export Modal */}
      <Modal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        title="Export to Excel"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary-text">{t('auto.auto_76bd1386') || 'Export project data to Excel format'}</p>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent" defaultChecked />
              <span className="text-sm text-primary-text">{t('common.export')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent" />
              <span className="text-sm text-primary-text">{t('') || ''}</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsExcelModalOpen(false)}
              className="flex-1"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert('Excel export started!')
                setIsExcelModalOpen(false)
              }}
              className="flex-1"
              size="sm"
            >
              Export
            </Button>
          </div>
        </div>
      </Modal>

      {/* Print Modal */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Print Projects"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary-text">{t('') || ''}</p>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent" defaultChecked />
              <span className="text-sm text-primary-text">{t('common.print')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent" />
              <span className="text-sm text-primary-text">{t('') || ''}</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsPrintModalOpen(false)}
              className="flex-1"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                window.print()
                setIsPrintModalOpen(false)
              }}
              className="flex-1"
              size="sm"
            >
              Print
            </Button>
          </div>
        </div>
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title={t('projects.actions.advanced_filters')}
        size="md"
      >
        <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('common.status')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="all">{t('projects.filters.all')}</option>
              {filterOptions.statuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('projects.filters.priority_label')}</label>
            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="">{t('projects.filters.all_priorities')}</option>
              {filterOptions.priorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>



          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('') || ''}</label>
            <select
              value={assignedUserFilter}
              onChange={(e) => setAssignedUserFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="">{t('') || ''}</option>
              {filterOptions.assigned_users.map(user => (
                <option key={user.id} value={user.id}>{user.name || user.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('') || ''}</label>
            <select
              value={projectTypeFilter}
              onChange={(e) => setProjectTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="">{t('') || ''}</option>
              {filterOptions.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('') || ''}</label>
            <select
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="">{t('') || ''}</option>
              <option value="0% - 20%">0% - 20%</option>
              <option value="21% - 50%">21% - 50%</option>
              <option value="51% - 80%">51% - 80%</option>
              <option value="81% - 100%">81% - 100%</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">{t('') || ''}</label>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">{t('') || ''}</label>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('All Projects')
                setProgressFilter('')
                setLabelFilter('')

                setAssignedUserFilter('')
                setProjectTypeFilter('')
                setStartDateFilter('')
                setEndDateFilter('')
                setIsFilterModalOpen(false)
              }}
              className="flex-1"
              size="sm"
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsFilterModalOpen(false)}
              className="flex-1"
              size="sm"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Project Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedProject(null)
        }}
        title="Project Details"
        width="700px"
      >
        {selectedProject && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                <p className="text-primary-text mt-1 text-base font-semibold">{selectedProject.code || selectedProject.short_code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                <div className="mt-1">
                  <Badge variant={selectedProject.status === 'completed' ? 'success' : selectedProject.status === 'on hold' ? 'warning' : selectedProject.status === 'cancelled' ? 'danger' : 'info'}>
                    {selectedProject.status || 'In Bearbeitung'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
              <p className="text-primary-text mt-1 text-base">{selectedProject.name || selectedProject.project_name}</p>
            </div>

            {selectedProject.description && (
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                <p className="text-primary-text mt-1 text-base">{selectedProject.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                <p className="text-primary-text mt-1 text-base">{selectedProject.company_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                <p className="text-primary-text mt-1 text-base">{selectedProject.department_name || '-'}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
              <p className="text-primary-text mt-1 text-base">{selectedProject.client?.name || selectedProject.client_name || '-'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
              <p className="text-primary-text mt-1 text-base">{selectedProject.project_manager_name || '-'}</p>
            </div>

            {selectedProject.budget && (
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                <p className="text-primary-text mt-1 text-base font-semibold">${parseFloat(selectedProject.budget).toLocaleString()}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-accent h-2 rounded-full"
                    style={{ width: `${selectedProject.progress || 0}%` }}
                  />
                </div>
                <p className="text-sm text-secondary-text mt-1">{selectedProject.progress || 0}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('auto.auto_db3794c7') || 'Start Date'}</label>
                <p className="text-primary-text mt-1 text-base">{formatDate(selectedProject.startDate || selectedProject.start_date)}</p>
              </div>
              {selectedProject.deadline && (
                <div>
                  <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                  <p className={`mt-1 text-base ${isDeadlineOverdue(selectedProject.deadline) ? 'text-red-600' : 'text-primary-text'}`}>
                    {formatDate(selectedProject.deadline)}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-secondary-text">{t('auto.auto_8196446d') || 'Team Members'}</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedProject.members && selectedProject.members.length > 0 ? (
                  selectedProject.members.map((member) => (
                    <Badge key={member.id || member.user_id} variant="default" className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-primary-accent/20 flex items-center justify-center text-xs font-semibold text-primary-accent">
                        {member.avatar || (member.name ? member.name.substring(0, 2).toUpperCase() : 'U')}
                      </div>
                      {member.name || member.email}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-secondary-text">{t('') || ''}</p>
                )}
              </div>
            </div>

            {selectedProject.project_summary && (
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                <p className="text-primary-text mt-1 text-base whitespace-pre-wrap">{selectedProject.project_summary}</p>
              </div>
            )}

            {selectedProject.notes && (
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                <p className="text-primary-text mt-1 text-base whitespace-pre-wrap">{selectedProject.notes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleEdit(selectedProject)
                }}
                className="flex-1"
              >
                Edit Project
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedProject(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Projects"
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <IoDownload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm text-secondary-text mb-1">{t('') || ''}</p>
            <p className="text-xs text-secondary-text">{t('') || ''}</p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert('Import started!')
                setIsImportModalOpen(false)
              }}
              className="flex-1"
            >
              Import
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manage Labels Modal */}
      <Modal
        isOpen={isManageLabelsModalOpen}
        onClose={() => {
          setIsManageLabelsModalOpen(false)
          setNewLabel('')
          setNewLabelColor('#22c55e')
        }}
        title="Manage Labels"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-inner">
            <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <IoAdd className="text-primary-accent" /> Create New Label
            </h4>

            <div className="space-y-4">
              {/* Color Selection - Premium Grid */}
              <div className="mb-4">
                <ColorPicker
                  value={newLabelColor}
                  onChange={setNewLabelColor}
                />
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Label name (e.g. High Priority, VIP)"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent outline-none transition-all shadow-sm group-hover:border-gray-300"
                  />
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: newLabelColor }}
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleAddLabel}
                  disabled={!newLabel.trim()}
                  className="flex items-center gap-2 rounded-xl transition-all active:scale-95"
                >
                  <IoAdd size={20} />
                  <span>{t('') || ''}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* List of Labels */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <IoList className="text-gray-400" /> Existing Labels
                {availableLabels.length > 0 && <span className="text-xs font-normal text-gray-400">({availableLabels.length})</span>}
              </h4>
            </div>

            {availableLabels.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {availableLabels.map((label, idx) => (
                  <div
                    key={`${label.id}-${idx}`}
                    className="group flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all animate-in fade-in slide-in-from-left-2"
                    style={{ borderLeft: `4px solid ${label.color}` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="px-3 py-1 rounded-full text-white text-xs font-bold shadow-sm"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setNewLabel(label.name)
                          setNewLabelColor(label.color)
                        }}
                        className="p-1.5 text-gray-400 hover:text-primary-accent hover:bg-gray-100 rounded-lg transition-colors"
                        title={t('common.edit')}
                      >
                        <IoPencil size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteLabel(label.id)
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('common.delete')}
                      >
                        <IoTrashOutline size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                <IoPricetag size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-500 font-medium">{t('') || ''}</p>
                <p className="text-xs text-gray-400 mt-1">{t('') || ''}</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => setIsManageLabelsModalOpen(false)}
              className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-primary-accent transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Project Templates Selection Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Select Project Template"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{t('') || ''}</p>

          {loadingTemplates ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-accent border-t-transparent"></div>
              <p className="text-gray-500 mt-2">{t('') || ''}</p>
            </div>
          ) : projectTemplates.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <IoFolder size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">{t('') || ''}</p>
              <button
                onClick={() => {
                  setIsTemplateModalOpen(false)
                  window.location.href = '/app/admin/project-templates'
                }}
                className="mt-3 text-sm text-primary-accent hover:underline"
              >
                Create a template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
              {projectTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-accent hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary-accent flex items-center justify-center text-white font-bold">
                      {template.name?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      {template.category && (
                        <span className="text-xs text-gray-500">{template.category}</span>
                      )}
                    </div>
                  </div>
                  {template.summary && (
                    <p className="text-sm text-gray-600 line-clamp-2" dangerouslySetInnerHTML={{ __html: template.summary }} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsTemplateModalOpen(false)
                handleAdd()
              }}
              className="text-sm text-primary-accent hover:underline"
            >
              Skip, create without template
            </button>
            <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Projects

