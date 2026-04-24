import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useLanguage } from '../../../context/LanguageContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Modal from '../../../components/ui/Modal'
import FilterPanel from '../../../components/ui/FilterPanel'
import UniqueIdBadge, { ID_PREFIXES } from '../../../components/ui/UniqueIdBadge'
import BulkUpdateModal from '../../../components/ui/BulkUpdateModal'
import NotificationModal from '../../../components/ui/NotificationModal'
import { leadsAPI, employeesAPI, contactsAPI, eventsAPI, itemsAPI, companiesAPI, leadPipelinesAPI, tasksAPI, customFieldsAPI } from '../../../api'
import RichTextEditor from '../../../components/ui/RichTextEditor'
import TaskFormModal from '../../../components/ui/TaskFormModal'
import ColorPicker from '../../../components/ui/ColorPicker'
import { formatPhoneNumber, isValidPhone } from '../../../utils/formatters'
import { useAuth } from '../../../context/AuthContext'
import {
  IoEye,
  IoCreate,
  IoPencil,
  IoTrashOutline,
  IoMail,
  IoCheckbox,
  IoPersonAdd,
  IoList,
  IoGrid,
  IoClose,
  IoLocation,
  IoCall,
  IoTime,
  IoFilter,
  IoRefresh,
  IoAdd,
  IoBriefcase,
  IoOpenOutline,
  IoSearch,
  IoTimeOutline,
  IoDownload,
  IoPricetag,
  IoPerson,
  IoCalendar,
  IoDocumentText,
  IoArrowForward,
  IoStatsChart,
  IoTrendingUp,
  IoTrendingDown,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoChevronBack,
  IoChevronForward,
  IoChevronDown,
  IoLayers,
  IoBusiness,
  IoPeopleOutline,
  IoCalendarOutline,
  IoEllipsisHorizontal,
  IoLogoGoogle,
  IoLocationOutline,
  IoCallOutline,
  IoCheckmarkCircleOutline,
  IoDocumentTextOutline,
  IoReceipt
} from 'react-icons/io5'
import BarChart from '../../../components/charts/BarChart'
import DonutChart from '../../../components/charts/DonutChart'

/** Stage title for Kanban column header (i18n) */
const leadStageDisplayName = (stage, t) => {
  const n = (stage.name || '').toLowerCase()
  if (['new lead', 'new', 'neu'].includes(n)) return t('leads.stages.new')
  if (['contacted', 'kontaktiert'].includes(n)) return t('leads.stages.contacted')
  if (['qualified', 'qualifiziert'].includes(n)) return t('leads.stages.qualified')
  if (['converted', 'konvertiert'].includes(n)) return t('leads.stages.converted')
  if (['proposal', 'angebot'].includes(n)) return t('leads.stages.proposal')
  if (['negotiation', 'verhandlung'].includes(n)) return t('leads.stages.negotiation')
  if (['in progress', 'in bearbeitung'].includes(n)) return t('leads.stages.in_progress')
  if (['won', 'gewonnen'].includes(n)) return t('leads.stages.won')
  if (['lost', 'verloren'].includes(n)) return t('leads.stages.lost')
  return stage.name
}

/**
 * Leads in a column: exact stage_id match, or unplaced/orphan in first column only
 */
const getColumnLeadsForStage = (stage, allStages, boardLeads) =>
  boardLeads.filter((l) => {
    if (l.stage_id != null && l.stage_id !== '' && String(l.stage_id) === String(stage.id)) return true
    const inPipeline = (sid) => allStages.some((s) => String(s.id) === String(sid))
    if (l.stage_id == null || l.stage_id === '' || !inPipeline(l.stage_id)) {
      return String(stage.id) === String(allStages[0]?.id)
    }
    return false
  })

/** Synthetic stage id when pipeline has no stages — drag/drop disabled */
const LEAD_KANBAN_FALLBACK_STAGE_ID = '__lead_kanban_fallback__'

/**
 * Kanban column — same drag/drop + layout pattern as `Deals.jsx` (KanbanColumn)
 */
const LeadKanbanColumn = ({
  stage,
  stages: allStages,
  columnLeads,
  t,
  isDragOver,
  onDragOverCol,
  onDropCol,
  onDragStart,
  onDragEnd,
  onOpenLead,
  getTimeAgo,
  fmtShort: fmt,
  cardsDraggable = true,
}) => {
  const color = stage.color || '#6366f1'
  const totalValue = columnLeads.reduce((s, l) => s + parseFloat(l.value || 0), 0)
  return (
    <div
      className={`flex-shrink-0 w-[300px] flex flex-col rounded-2xl border transition-all duration-200 min-h-0 ${
        isDragOver ? 'border-primary-accent/50 bg-primary-accent/5 shadow-lg shadow-primary-accent/10' : 'border-gray-200/70 bg-gray-50/80'
      }`}
      onDragOver={onDragOverCol}
      onDrop={onDropCol}
    >
      <div className="p-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm shrink-0" style={{ backgroundColor: color }} />
            <h3 className="font-black text-gray-800 text-xs uppercase tracking-wider truncate" title={stage.name}>
              {leadStageDisplayName(stage, t)}
            </h3>
            <span className="shrink-0 bg-white px-2 py-0.5 rounded-full text-[10px] font-black text-gray-500 border border-gray-200 shadow-sm">
              {columnLeads.length}
            </span>
          </div>
        </div>
        {columnLeads.length > 0 && (
          <div className="text-[11px] font-bold text-gray-400 pl-5">{fmt(totalValue)}</div>
        )}
        <div className="mt-2 h-0.5 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ backgroundColor: color, width: `${Math.min(100, columnLeads.length * 10 || 4)}%` }}
          />
        </div>
      </div>
      <div className="flex-1 min-h-[120px] max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-hidden px-3 pb-3 space-y-2.5 custom-scrollbar">
        {columnLeads.map((lead) => (
          <div
            key={lead.id}
            draggable={cardsDraggable}
            onDragStart={cardsDraggable ? (e) => onDragStart(e, lead) : undefined}
            onDragEnd={onDragEnd}
            className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-accent/40 transition-all group select-none ${
              cardsDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
            }`}
          >
            <div className="h-1 rounded-t-xl" style={{ backgroundColor: color }} />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h4
                  className="font-bold text-sm text-gray-900 group-hover:text-primary-accent transition-colors flex-1 pr-2 leading-tight line-clamp-2 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenLead(lead)
                  }}
                >
                  {lead.personName || lead.companyName}
                </h4>
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IoEllipsisHorizontal size={18} />
                </button>
              </div>
              {lead.companyName && (
                <div className="flex items-center gap-2 text-xs text-secondary-text mb-2">
                  <IoBusiness size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate">{lead.companyName}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-50">
                <span className="font-bold text-sm text-gray-900">
                  {fmt(parseFloat(lead.value) || 0)}
                </span>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-red-50 border border-red-100 rounded-full text-[10px] font-bold text-red-500">
                    {getTimeAgo(lead.created_at || lead.created || lead.createdDate)}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-primary-accent/10 border border-primary-accent/20 flex items-center justify-center text-[10px] font-bold text-primary-accent ring-2 ring-white">
                    {(lead.employeeAvatar || (lead.employee?.[0] || 'U')).toUpperCase().slice(0, 1)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {columnLeads.length === 0 && (
          <div
            className={`h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all ${
              isDragOver ? 'border-primary-accent/40 bg-primary-accent/5' : 'border-gray-200 opacity-50'
            }`}
          >
            <IoBriefcase size={20} className="text-gray-300" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-2">
              {cardsDraggable ? t('deals.kanban.drop_here') : t('leads.kanban.no_stages_list')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const Leads = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const companyId = parseInt(user?.company_id || localStorage.getItem('companyId') || 0, 10)
  const companyName = user?.company_name || localStorage.getItem('companyName') || ''
  const userId = user?.id || localStorage.getItem('userId') || 1

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return t('common.today');
      return `${diffDays} ${t('common.days_ago')}`;
    } catch (e) {
      return '';
    }
  };

  // Debug logging - verify companyId
  useEffect(() => {
    if (companyId && companyId > 0) {
      console.log('Leads Component - CompanyId:', companyId)
      fetchPipelines()
      fetchCustomFields()
    } else {
      console.warn('Leads Component - Invalid or missing companyId:', companyId)
      setStagesLoading(false)
    }
  }, [companyId, user])

  const fetchCustomFields = async () => {
    try {
      setCfLoading(true)
      const res = await customFieldsAPI.getAll({ company_id: companyId, module: 'Leads' })
      if (res.data.success) {
        setCustomFields(res.data.data || [])
      }
    } catch (err) {
      console.error('Error fetching custom fields:', err)
    } finally {
      setCfLoading(false)
    }
  }

  const fetchStages = async (pipelineId) => {
    if (pipelineId == null || pipelineId === '') {
      setStages([])
      setStagesLoading(false)
      return
    }
    setStagesLoading(true)
    try {
      const res = await leadPipelinesAPI.getStages(pipelineId)
      if (res.data.success) {
        setStages(res.data.data || [])
      } else {
        setStages([])
      }
    } catch (err) {
      console.error('Error fetching stages:', err)
      setStages([])
    } finally {
      setStagesLoading(false)
    }
  }

  const fetchPipelines = async () => {
    if (!companyId || companyId <= 0) {
      setStagesLoading(false)
      return
    }
    setStagesLoading(true)
    try {
      const res = await leadPipelinesAPI.getAllPipelines({ company_id: companyId })
      if (res.data.success && res.data.data.length > 0) {
        setPipelines(res.data.data)
        const defaultP = res.data.data.find(p => p.is_default) || res.data.data[0]
        setCurrentPipeline(defaultP)
        await fetchStages(defaultP.id)
      } else {
        setPipelines([])
        setCurrentPipeline(null)
        setStages([])
      }
    } catch (err) {
      console.error('Error fetching pipelines:', err)
    } finally {
      setStagesLoading(false)
    }
  }

  const fmtShort = (n) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(n || 0)
  }

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'kanban')
  const [viewMode, setViewMode] = useState(searchParams.get('tab') === 'leads' ? 'list' : 'kanban')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [tasks, setTasks] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [selectedLeads, setSelectedLeads] = useState([])
  const [pipelines, setPipelines] = useState([])
  const [stages, setStages] = useState([])
  const [stagesLoading, setStagesLoading] = useState(true)
  const [currentPipeline, setCurrentPipeline] = useState(null)
  const [leads, setLeads] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [items, setItems] = useState([])
  const [sources, setSources] = useState([])
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [overviewData, setOverviewData] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [dateRange, setDateRange] = useState('all')
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [customFields, setCustomFields] = useState([])
  const [cfLoading, setCfLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all') // Default to 'all' for everyone so they see data like admin

  // Debug logging - verify companyId

  useEffect(() => {
    if (selectedLead && isViewModalOpen) {
      fetchLeadTasks(selectedLead.id)
    }
  }, [selectedLead, isViewModalOpen])

  const fetchLeadTasks = async (leadId) => {
    try {
      const res = await tasksAPI.getAll({ company_id: companyId, lead_id: leadId })
      if (res.data.success) {
        setTasks(res.data.data || [])
      }
    } catch (err) {
      console.error('Error fetching lead tasks:', err)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE')
  }

  const isDeadlineOverdue = (deadline) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isManageLabelsModalOpen, setIsManageLabelsModalOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [labels, setLabels] = useState([])
  const [loadingLabels, setLoadingLabels] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#22c55e') // Default green
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedLead, setDraggedLead] = useState(null)
  const [dragOverStageId, setDragOverStageId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [probabilityFilter, setProbabilityFilter] = useState(null) // '50', '90', null
  const [loggedInUser] = useState('Sarah Wilson') // In real app, get from auth context

  // Detail View State
  const [activeDetailTab, setActiveDetailTab] = useState('overview') // 'overview', 'estimates', 'proposals', 'contracts', 'files', 'tasks', 'notes'
  const [estimates, setEstimates] = useState([]) // For the estimates tab


  // New Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterOwner, setFilterOwner] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false)

  // RiceCRM-style Bulk Update Modal & Notification Modal States
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false)
  const [notification, setNotification] = useState({ isOpen: false, type: 'success', title: '', message: '' })

  // Show notification helper
  const showNotification = (type, title, message) => {
    setNotification({ isOpen: true, type, title, message })
  }

  // Strip HTML utility for Rich Text fields
  const stripHtml = (html) => {
    if (!html) return ''
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  }



  // Lead Form Data - matches CRM specification with backward compatibility
  const [formData, setFormData] = useState({
    // Core Lead Fields
    name: '',                    // Lead Name (required)
    personName: '',              // Person Name (for compatibility)
    email: '',                   // Email
    phone: '',                   // Phone
    companyName: '',             // Company Name
    leadSource: '',              // Lead Source (Website, Referral, etc.)
    source: '',                  // Legacy source field
    stage: t('leads.stages.new'),           // Pipeline Stage
    status: t('leads.stages.new'),          // Status (maps to stage)
    estimatedValue: '',          // Estimated Deal Value
    value: '',                   // Legacy value field
    tags: [],                    // Tags array
    ownerId: '',                 // Assigned Owner ID
    employee: '',                // Legacy employee field
    lastContacted: '',           // Last Contacted Date
    notes: '',                   // Notes/Comments
    // Additional Fields
    address: '',
    city: '',
    dueFollowup: '',             // Follow-up reminder date
    probability: '',             // Win probability
    callThisWeek: false,         // Flag for call this week
    label: '',                   // Label/Tag
    services: [],                // Services array (for backward compatibility)
    leadType: 'Organization',    // Lead type
    custom_fields: {},           // Custom fields
    pipeline_id: '',             // Modal: selected pipeline (defaults from view)
    stage_id: '',                // Auto: first stage of selected pipeline (no separate field in UI)
  })

  const [calendarView, setCalendarView] = useState('month') // 'month', 'week', 'day', 'list'
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [contactFormData, setContactFormData] = useState({
    name: '',
    company: companyName || '',
    email: '',
    phone: '',
    contact_type: 'Client',
    assigned_user_id: '',
    status: 'Active',
    notes: '',
    lead_id: null,
  })
  const [eventFormData, setEventFormData] = useState({
    event_name: '',
    description: '',
    where: '',
    starts_on_date: new Date().toISOString().split('T')[0],
    starts_on_time: '09:00',
    ends_on_date: new Date().toISOString().split('T')[0],
    ends_on_time: '10:00',
    label_color: '#FF0000',
    status: 'Pending',
    employee_ids: [],
    client_ids: [],
    department_ids: [],
    host_id: userId || null,
  })

  useEffect(() => {
    fetchLeads()
    fetchCompanies()
    fetchLabels()
    fetchEmployees(companyId) // Auto-fetch employees for logged-in company
    fetchItems(companyId) // Auto-fetch items/services for logged-in company
    if (activeTab === 'overview') {
      fetchOverview()
    }
    if (activeTab === 'contacts') {
      fetchContacts()
    }
    if (activeTab === 'events') {
      fetchEvents()
    }
  }, [activeFilter, searchQuery, probabilityFilter, activeTab, dateRange, companyId, currentMonth, filterOwner, filterStatus, filterSource, filterDate])

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setCompanies(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  // Fetch employees for employee dropdown (filtered by company)
  const fetchEmployees = async (companyId) => {
    try {
      const response = await employeesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setEmployees(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setEmployees([])
    }
  }

  const fetchItems = async (companyId) => {
    try {
      const response = await itemsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setItems(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching items:', error)
      setItems([])
    }
  }


  // Extract unique sources from leads
  const extractUniqueSources = (leadsData) => {
    const sourceSet = new Set()
    // Default sources
    const defaultSources = [
      'Website',
      'Call',
      'Email',
      'Google ads',
      'Facebook',
      'Twitter',
      'Youtube',
      'Google',
      'Elsewhere',
      'Social Media',
      'Referral',
      'Other'
    ]

    // Add default sources
    defaultSources.forEach(source => sourceSet.add(source))

    // Add sources from existing leads
    leadsData.forEach(lead => {
      if (lead.source && lead.source.trim()) {
        sourceSet.add(lead.source.trim())
      }
    })

    return Array.from(sourceSet).sort()
  }

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = {
        company_id: companyId // Always pass company_id from session
      }

      // Only filter by owner if the user specifically requested 'My Leads'
      if (activeFilter === 'my') {
        const userId = user?.id || localStorage.getItem('userId')
        if (userId) params.owner_id = userId
      }

      if (searchQuery) {
        // Search will be handled client-side for now
      }

      const response = await leadsAPI.getAll(params)
      if (response.data.success) {
        const fetchedLeads = response.data.data || []
        // Transform API data to match component format
        const transformedLeads = fetchedLeads.map(lead => ({
          id: lead.id,
          leadType: lead.lead_type || 'Organization',
          personName: lead.person_name || '',
          companyName: lead.company_name || '',
          email: lead.email || '',
          phone: lead.phone || '',
          employee: lead.owner_name || 'Unknown',
          employee_id: lead.owner_id,
          employeeId: lead.owner_id,
          pipeline_id: lead.pipeline_id,
          stage_id: lead.stage_id,
          employeeAvatar: lead.owner_name ? lead.owner_name.split(' ').map(n => n[0]).join('') : 'U',
          status: lead.status || 'Neu',
          source: lead.source || '',
          address: lead.address || '',
          city: lead.city || '',
          notes: lead.notes || '',
          value: parseFloat(lead.value || 0),
          dueFollowup: lead.due_followup || '',
          labels: lead.labels || [],
          createdDate: lead.created_at ? lead.created_at.split('T')[0] : '',
          createdBy: lead.created_by_name || '',
          probability: lead.probability || null,
          callThisWeek: lead.call_this_week || false,
          contacts: 1,
          custom_fields: lead.custom_fields || {},
        }))

        setLeads(transformedLeads)

        // Extract unique sources from fetched leads
        const uniqueSources = extractUniqueSources(fetchedLeads)
        setSources(uniqueSources)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = () => {
    if (filteredLeads.length === 0) {
      alert(t('leads.alerts.no_data_export'))
      return
    }

    // Define CSV header
    const headers = ['Lead ID', 'Type', 'Lead Name', 'Company Name', 'Email', 'Phone', 'Employee', 'Source', 'Status', 'Probability', 'Created Date']

    // Convert data to CSV rows
    const rows = filteredLeads.map(lead => [
      lead.id,
      lead.leadType,
      lead.personName,
      lead.companyName,
      lead.email,
      lead.phone,
      lead.employee,
      lead.source,
      lead.status,
      lead.probability ? `${lead.probability}%` : '-',
      lead.createdDate
    ])

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  // Filter leads based on active filter
  const getFilteredLeads = () => {
    let filtered = [...leads]

    // Apply search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(lead =>
        lead.personName?.toLowerCase().includes(q) ||
        lead.companyName?.toLowerCase().includes(q) ||
        lead.email?.toLowerCase().includes(q) ||
        lead.source?.toLowerCase().includes(q) ||
        lead.city?.toLowerCase().includes(q) ||
        lead.id.toString().includes(q)
      )
    }

    // Apply probability filter (RiceCRM style - strictly equals)
    if (probabilityFilter) {
      filtered = filtered.filter(lead => lead.probability === parseInt(probabilityFilter))
    }

    // Apply Advanced Filters
    if (filterOwner) {
      filtered = filtered.filter(lead => lead.employeeId == filterOwner)
    }
    if (filterStatus) {
      filtered = filtered.filter(lead => lead.status === filterStatus)
    }
    if (filterSource) {
      filtered = filtered.filter(lead => lead.source === filterSource)
    }
    if (filterDate) {
      filtered = filtered.filter(lead => lead.createdDate === filterDate)
    }
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom)
      filtered = filtered.filter(lead => new Date(lead.createdDate) >= fromDate)
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo)
      // Set to end of day
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(lead => new Date(lead.createdDate) <= toDate)
    }

    // Apply Main Quick Filter Tabs
    if (activeFilter === 'my') {
      filtered = filtered.filter(lead => lead.employeeId == userId)
    } else if (activeFilter === 'thisWeek') {
      const today = new Date()
      const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.createdDate)
        return leadDate >= weekStart
      })
    } else if (activeFilter === 'call') {
      filtered = filtered.filter(lead => lead.source?.toLowerCase().includes('call'))
    }

    return filtered
  }

  const filteredLeads = getFilteredLeads()

  const defaultPipelineId = useMemo(() => {
    const p = pipelines.find((x) => x.is_default) || pipelines[0]
    return p?.id
  }, [pipelines])

  const leadMatchesCurrentPipeline = useCallback(
    (l) => {
      if (currentPipeline?.id == null) return false
      const cur = String(currentPipeline.id)
      if (l.pipeline_id != null && l.pipeline_id !== '') {
        return String(l.pipeline_id) === cur
      }
      if (defaultPipelineId == null) return false
      return String(defaultPipelineId) === cur
    },
    [currentPipeline, defaultPipelineId]
  )

  const kanbanBoardLeads = useMemo(
    () => filteredLeads.filter(leadMatchesCurrentPipeline),
    [filteredLeads, leadMatchesCurrentPipeline]
  )

  const pipelineScopeTotals = useMemo(() => {
    const v = kanbanBoardLeads.reduce((s, d) => s + parseFloat(d.value || 0), 0)
    return { count: kanbanBoardLeads.length, value: v }
  }, [kanbanBoardLeads])

  const getLeadsByStatus = (status) => {
    return filteredLeads.filter(lead => lead.status === status)
  }

  const leadsTotals = useMemo(() => {
    const total = filteredLeads.reduce((s, d) => s + parseFloat(d.value || 0), 0)
    return { count: filteredLeads.length, value: total }
  }, [filteredLeads])

  // Kanban drag & drop — same flow as `Deals.jsx` (avoids type mismatch + no body overflow lock)
  const handleDragStart = (e, lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedLead(null)
    setDragOverStageId(null)
  }

  const handleDragOver = (e, stageId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (stageId != null) setDragOverStageId(stageId)
  }

  const handleDrop = async (e, stageId) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverStageId(null)
    if (String(stageId) === LEAD_KANBAN_FALLBACK_STAGE_ID) return
    if (!draggedLead || String(draggedLead.stage_id) === String(stageId)) return
    const pid = currentPipeline?.id
    // Optimistic UI (like Deals)
    setLeads((prev) =>
      prev.map((l) =>
        l.id === draggedLead.id ? { ...l, stage_id: stageId, pipeline_id: pid != null ? pid : l.pipeline_id } : l
      )
    )
    try {
      await leadsAPI.updateStage(draggedLead.id, { stage_id: stageId, pipeline_id: pid })
      if (activeTab === 'overview') await fetchOverview()
    } catch (error) {
      console.error('Error updating lead stage:', error)
      await fetchLeads()
      alert(t('leads.kanban.load_error'))
    }
  }

  // Fetch overview data
  const fetchOverview = async () => {
    try {
      // Validate companyId before making API call
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchOverview:', companyId)
        setOverviewLoading(false)
        return
      }

      setOverviewLoading(true)
      const params = {
        date_range: dateRange,
        company_id: companyId  // Always pass company_id to filter data
      }

      console.log('Fetching leads overview with params:', params)
      const response = await leadsAPI.getOverview(params)
      if (response.data.success) {
        console.log('Overview data received:', response.data.data)
        setOverviewData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching overview:', error)
      console.error('Error response:', error.response?.data)
    } finally {
      setOverviewLoading(false)
    }
  }

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      setContactsLoading(true)
      const params = { company_id: companyId }
      // If a lead is selected, filter by lead_id
      if (selectedLead?.id) {
        params.lead_id = selectedLead.id
      }
      const response = await contactsAPI.getAll(params)
      if (response.data.success) {
        setContacts(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
      setContacts([])
    } finally {
      setContactsLoading(false)
    }
  }

  // Fetch events
  const fetchEvents = async () => {
    try {
      setEventsLoading(true)
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchEvents:', companyId)
        setEvents([])
        setEventsLoading(false)
        return
      }
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const response = await eventsAPI.getAll({
        company_id: companyId,
        year,
        month
      })
      if (response.data.success) {
        setEvents(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }

  // Event handlers
  const handleAddEvent = async () => {
    if (!eventFormData.event_name) {
      alert(t('meetings.title_required') || 'Titel ist erforderlich')
      return
    }
    if (!eventFormData.where) {
      alert(t('meetings.location_required') || 'Ort ist erforderlich')
      return
    }
    if (!eventFormData.starts_on_date) {
      alert(t('meetings.date_required') || 'Datum ist erforderlich')
      return
    }
    if (!eventFormData.starts_on_time) {
      alert(t('meetings.time_required') || 'Zeit ist erforderlich')
      return
    }

    try {
      const eventData = {
        event_name: eventFormData.event_name,
        description: eventFormData.description || null,
        where: eventFormData.where,
        starts_on_date: eventFormData.starts_on_date,
        starts_on_time: eventFormData.starts_on_time,
        ends_on_date: eventFormData.ends_on_date || eventFormData.starts_on_date,
        ends_on_time: eventFormData.ends_on_time || eventFormData.starts_on_time,
        label_color: eventFormData.label_color,
        status: eventFormData.status || 'Pending',
        employee_ids: eventFormData.employee_ids || [],
        client_ids: eventFormData.client_ids || [],
        department_ids: eventFormData.department_ids || [],
        host_id: eventFormData.host_id || userId || null
      }

      const response = await eventsAPI.create(eventData, { company_id: companyId, user_id: userId })
      if (response.data.success) {
        alert(t('meetings.create_success'))
        setIsAddEventModalOpen(false)
        setEventFormData({
          event_name: '',
          description: '',
          where: '',
          starts_on_date: new Date().toISOString().split('T')[0],
          starts_on_time: '09:00',
          ends_on_date: new Date().toISOString().split('T')[0],
          ends_on_time: '10:00',
          label_color: '#FF0000',
          status: 'Pending',
          employee_ids: [],
          client_ids: [],
          department_ids: [],
          host_id: userId || null,
        })
        await fetchEvents()
      } else {
        alert(response.data.error || 'Termin konnte nicht erstellt werden')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert(error.response?.data?.error || 'Termin konnte nicht erstellt werden')
    }
  }

  // Contact handlers
  const handleAddContact = () => {
    setContactFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      contact_type: 'Client',
      assigned_user_id: '',
      status: 'Active',
      notes: '',
      lead_id: selectedLead?.id || null,
    })
    setIsContactModalOpen(true)
  }

  const handleEditContact = (contact) => {
    setSelectedContact(contact)
    setContactFormData({
      name: contact.name || '',
      company: contact.company || companyName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      contact_type: contact.contact_type || 'Client',
      assigned_user_id: contact.assigned_user_id || '',
      status: contact.status || 'Active',
      notes: contact.notes || '',
      lead_id: contact.lead_id || null,
    })
    setIsEditContactModalOpen(true)
  }

  const handleSaveContact = async () => {
    if (!contactFormData.name) {
      alert(t('leads.alerts.name_required'))
      return
    }

    try {
      const contactData = {
        name: contactFormData.name.trim(),
        company: contactFormData.company?.trim() || null,
        email: contactFormData.email?.trim() || null,
        phone: contactFormData.phone?.trim() || null,
        contact_type: contactFormData.contact_type || 'Client',
        assigned_user_id: contactFormData.assigned_user_id ? parseInt(contactFormData.assigned_user_id) : null,
        status: contactFormData.status || 'Active',
        notes: contactFormData.notes?.trim() || null,
        lead_id: contactFormData.lead_id ? parseInt(contactFormData.lead_id) : null,
        company_id: parseInt(companyId), // Auto-set from session
      }

      if (selectedContact) {
        await contactsAPI.update(selectedContact.id, contactData)
        alert(t('leads.alerts.contact_update'))
      } else {
        await contactsAPI.create(contactData)
        alert(t('leads.alerts.contact_success'))
      }
      setIsContactModalOpen(false)
      setIsEditContactModalOpen(false)
      setSelectedContact(null)
      fetchContacts()
    } catch (error) {
      console.error('Error saving contact:', error)
      alert(error.response?.data?.error || t('leads.alerts.save_failed'))
    }
  }

  const handleDeleteContact = async (id) => {
    if (!window.confirm(t('leads.confirm_delete_contact'))) return
    try {
      await contactsAPI.delete(id)
      alert(t('messages.deleteSuccess'))
      fetchContacts()
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert(error.response?.data?.error || t('messages.deleteError'))
    }
  }

  // Bulk actions handler
  const handleBulkAction = async (action, data) => {
    if (selectedLeads.length === 0) {
      alert(t('leads.alerts.select_lead'))
      return
    }

    try {
      await leadsAPI.bulkAction({
        lead_ids: selectedLeads,
        action,
        data,
      })
      alert(t('leads.alerts.bulk_success'))
      setSelectedLeads([])
      await fetchLeads()
      if (activeTab === 'overview') {
        await fetchOverview()
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      alert(error.response?.data?.error || t('leads.alerts.bulk_failed'))
    }
  }

  // File upload handlers for Import Leads
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      const validExtensions = ['.csv', '.xls', '.xlsx']
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()

      if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
        setSelectedFile(file)
      } else {
        alert('Bitte eine gültige Datei auswählen (CSV, XLS oder XLSX)')
      }
    }
  }

  const handleDragOverFile = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeaveFile = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDropFile = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      const validExtensions = ['.csv', '.xls', '.xlsx']
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()

      if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
        setSelectedFile(file)
      } else {
        alert('Bitte eine gültige Datei auswählen (CSV, XLS oder XLSX)')
      }
    }
  }

  const handleImportLeads = async () => {
    if (!selectedFile) {
      alert(t('leads.alerts.select_file'))
      return
    }

    try {
      // Parse CSV file
      const text = await selectedFile.text()
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length < 2) {
        alert(t('leads.alerts.csv_header_error'))
        return
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

      // Parse data rows
      const leads = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''))
        const lead = {}

        headers.forEach((header, index) => {
          const value = values[index] || ''
          // Map common header names
          if (header.includes('company') && !header.includes('person')) lead.company_name = value
          else if (header.includes('name') || header.includes('person')) lead.person_name = value
          else if (header.includes('email')) lead.email = value
          else if (header.includes('phone')) lead.phone = value
          else if (header.includes('status')) lead.status = value
          else if (header.includes('source')) lead.source = value
          else if (header.includes('address')) lead.address = value
          else if (header.includes('city')) lead.city = value
          else if (header.includes('value')) lead.value = value
          else if (header.includes('probability')) lead.probability = value
          else if (header.includes('note')) lead.notes = value
        })

        // Only add if has at least company_name or person_name
        if (lead.company_name || lead.person_name) {
          leads.push(lead)
        }
      }

      if (leads.length === 0) {
        alert(t('leads.alerts.no_valid_leads'))
        return
      }

      // Call API to import leads
      const response = await leadsAPI.importLeads({ leads, company_id: companyId })

      if (response.data.success) {
        alert(`${response.data.data.imported} ${t('leads.alerts.import_success') || 'Leads imported successfully!'}${response.data.data.failed > 0 ? ` (${response.data.data.failed} ${t('common.failed') || 'failed'})` : ''}`)
        setSelectedFile(null)
        setIsImportModalOpen(false)
        fetchLeads()
      } else {
        alert(response.data.error || t('leads.alerts.import_failed'))
      }
    } catch (error) {
      console.error('Error importing leads:', error)
      alert(error.response?.data?.error || t('leads.alerts.import_failed'))
    }
  }

  // Fetch labels from API
  const fetchLabels = async () => {
    try {
      setLoadingLabels(true)
      const response = await leadsAPI.getAllLabels({ company_id: companyId })
      if (response.data.success) {
        // Store labels with their colors as objects
        const labelData = (response.data.data || []).map(item => ({
          name: item.name || item.label,
          color: item.color || '#22c55e'
        }))
        setLabels(labelData)
      }
    } catch (error) {
      console.error('Error fetching labels:', error)
      // Keep default labels if API fails
      if (labels.length === 0) {
        setLabels([
          { name: 'Hot', color: '#ef4444' },
          { name: 'Warm', color: '#f97316' },
          { name: 'Cold', color: '#3b82f6' },
          { name: 'Neu', color: '#22c55e' },
          { name: 'Follow-up', color: '#a855f7' },
        ])
      }
    } finally {
      setLoadingLabels(false)
    }
  }

  // Label management handlers
  const handleAddLabel = async () => {
    if (!newLabel.trim()) return

    // Get existing label names for comparison
    const existingLabelNames = labels.map(label =>
      typeof label === 'object' ? label.name.toLowerCase() : label.toLowerCase()
    )

    // Check if label already exists
    if (existingLabelNames.includes(newLabel.trim().toLowerCase())) {
      // Update existing label color
      const updatedLabels = labels.map(label => {
        const labelName = typeof label === 'object' ? label.name : label
        if (labelName.toLowerCase() === newLabel.trim().toLowerCase()) {
          return { name: labelName, color: newLabelColor }
        }
        return typeof label === 'object' ? label : { name: label, color: '#22c55e' }
      })
      setLabels(updatedLabels)
      setNewLabel('')
      setNewLabelColor('#22c55e')
      alert('Label erfolgreich aktualisiert!')
      return
    }

    try {
      const response = await leadsAPI.createLabel({
        label: newLabel.trim(),
        color: newLabelColor,
        company_id: companyId
      })

      if (response.data.success) {
        setLabels([...labels, { name: newLabel.trim(), color: newLabelColor }])
        setNewLabel('')
        setNewLabelColor('#22c55e')
        alert('Label erfolgreich erstellt!')
      }
    } catch (error) {
      console.error('Error creating label:', error)
      // Still add locally if API fails
      setLabels([...labels, { name: newLabel.trim(), color: newLabelColor }])
      setNewLabel('')
      setNewLabelColor('#22c55e')
    }
  }

  const handleDeleteLabel = async (labelToDelete) => {
    if (!window.confirm(`Möchten Sie das Label "${labelToDelete}" wirklich löschen? Es wird von allen Leads entfernt.`)) {
      return
    }

    try {
      const response = await leadsAPI.deleteLabel(labelToDelete, { company_id: companyId })

      if (response.data.success) {
        setLabels(labels.filter(label => {
          const labelName = typeof label === 'object' ? label.name : label
          return labelName !== labelToDelete
        }))
        alert('Label erfolgreich gelöscht!')
        // Refresh leads to update their labels
        fetchLeads()
      }
    } catch (error) {
      console.error('Error deleting label:', error)
      alert(error.response?.data?.error || 'Label konnte nicht gelöscht werden')
    }
  }

  const handleSelectLead = (leadId) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId))
    } else {
      setSelectedLeads([...selectedLeads, leadId])
    }
  }

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id))
    }
  }

  const handleBulkEmail = () => {
    if (selectedLeads.length === 0) {
      alert('Bitte mindestens einen Lead auswählen')
      return
    }
    setIsBulkEmailModalOpen(true)
  }

  const handleCreateTask = (lead) => {
    setSelectedLead(lead)
    setIsTaskModalOpen(true)
  }

  const handleSendEmail = (lead) => {
    setSelectedLead(lead)
    setIsEmailModalOpen(true)
  }

  const handleAdd = () => {
    setFormData({
      leadType: 'Organization',
      companyName: '',
      personName: '',
      email: '',
      phone: '',
      employee: '',
      status: 'Neu',
      source: '',
      address: '',
      city: '',
      value: '',
      dueFollowup: '',
      notes: '',
      probability: '',
      callThisWeek: false,
      services: [], // Added services field
      pipeline_id: currentPipeline?.id != null ? String(currentPipeline.id) : '',
      stage_id: stages[0]?.id != null ? String(stages[0].id) : '',
    })
    setIsAddModalOpen(true)
  }
  // CRM Lead Table Columns - as per wireframe specification
  const columns = [
    {
      key: 'checkbox',
      label: '',
      width: '40px',
      render: (value, row) => (
        <input
          type="checkbox"
          checked={selectedLeads.includes(row.id)}
          onChange={() => handleSelectLead(row.id)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
      ),
    },
    {
      key: 'name',
      label: t('leads.columns.lead_name'),
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {(value || row.personName || row.companyName || 'L').charAt(0).toUpperCase()}
          </div>
          <div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const path = user?.role === 'EMPLOYEE' ? `/app/employee/leads/${row.id}` : `/app/admin/leads/${row.id}`;
                navigate(path);
              }}
              className="font-semibold text-gray-800 hover:text-blue-600 transition-colors"
            >
              {value || row.personName || row.companyName || '-'}
            </a>
            {row.email && (
              <p className="text-xs text-gray-400">{row.email}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: t('leads.columns.contact_name'),
      render: (value, row) => (
        <div className="text-sm">
          {row.email && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <IoMail size={14} className="text-gray-400" />
              <span className="truncate max-w-[150px]">{row.email}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-1.5 text-gray-600 mt-0.5">
              <IoCall size={14} className="text-gray-400" />
              <span>{row.phone}</span>
            </div>
          )}
          {!row.email && !row.phone && (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'companyName',
      label: t('leads.columns.company'),
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <IoBusiness size={16} className="text-gray-400" />
          <span className="text-gray-700">{value || '-'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('leads.columns.status'),
      render: (value, row) => {
        const stage = stages.find(s => String(s.id).toLowerCase() === String(value || row.stage || '').toLowerCase()) || stages[0]
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${stage?.color || '#cbd5e0'}15`, color: stage?.color || '#cbd5e0' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage?.color || '#cbd5e0' }} />
            {stage?.name || value || 'Neu'}
          </span>
        )
      },
    },
    {
      key: 'value',
      label: t('leads.columns.value'),
      render: (value, row) => {
        const amount = parseFloat(value || row.estimatedValue || 0)
        if (amount === 0) return <span className="text-gray-400">-</span>
        return (
          <span className="font-semibold text-green-600">
            ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
        )
      },
    },
    {
      key: 'source',
      label: t('leads.columns.source'),
      render: (value, row) => {
        const src = value || row.leadSource || '-'
        return (
          <Badge variant="default" className="text-xs bg-blue-50 text-blue-700 border border-blue-200">
            {src}
          </Badge>
        )
      },
    },
    {
      key: 'employee',
      label: t('leads.columns.owner'),
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
            {value ? value.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="text-sm text-gray-700">{value || 'Nicht zugewiesen'}</span>
        </div>
      ),
    },
    {
      key: 'createdDate',
      label: t('leads.columns.created_date'),
      render: (value) => {
        if (!value) return <span className="text-gray-400">-</span>
        const date = new Date(value)
        return (
          <div className="text-xs">
            <div className="font-medium text-gray-700">{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
        )
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



  const handleEdit = async (lead) => {
    if (!lead) {
      console.error('handleEdit: lead is null or undefined')
      return
    }
    setSelectedLead(lead)
    // Fetch full lead data to get company_id
    try {
      const response = await leadsAPI.getById(lead.id, { company_id: companyId })
      if (response.data.success) {
        const fullLead = response.data.data
        setFormData({
          leadType: fullLead.lead_type || lead.leadType || 'Organization',
          companyName: fullLead.company_name || lead.companyName || '',
          personName: fullLead.person_name || lead.personName || '',
          email: fullLead.email || lead.email || '',
          phone: fullLead.phone || lead.phone || '',
          employee: fullLead.owner_id || lead.owner_id || lead.ownerId || '',
          status: fullLead.status || lead.status || 'Neu',
          stage_id: fullLead.stage_id || lead.stage_id || '',
          pipeline_id: fullLead.pipeline_id || lead.pipeline_id || '',
          source: fullLead.source || lead.source || '',
          address: fullLead.address || lead.address || '',
          city: fullLead.city || lead.city || '',
          value: fullLead.value?.toString() || lead.value?.toString() || '',
          dueFollowup: fullLead.due_followup || lead.dueFollowup || '',
          notes: fullLead.notes || '',
          probability: fullLead.probability?.toString() || lead.probability?.toString() || '',
          callThisWeek: fullLead.call_this_week || lead.callThisWeek || false,
          label: (fullLead.labels && fullLead.labels[0]) || (lead.labels && lead.labels[0]) || '',
          services: (fullLead.services || lead.services || []).map(s => {
            if (typeof s === 'object' && s !== null && s.id) {
              return s.id.toString()
            }
            return s.toString()
          }),
          custom_fields: fullLead.custom_fields || {},
        })
      }
    } catch (error) {
      console.error('Error fetching lead details:', error)
      // Fallback to existing lead data
      setFormData({
        leadType: lead.leadType || lead.lead_type || 'Organization',
        companyName: lead.companyName || lead.company_name || '',
        personName: lead.personName || lead.person_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        employee: lead.owner_id || lead.ownerId || lead.owner || '',
        status: lead.status || 'Neu',
        source: lead.source || '',
        address: lead.address || '',
        city: lead.city || '',
        value: lead.value?.toString() || '',
        dueFollowup: lead.dueFollowup || '',
        notes: '',
        probability: lead.probability?.toString() || '',
        callThisWeek: lead.callThisWeek || false,
        label: (lead.labels && lead.labels[0]) || '',
        services: lead.services || [], // Added services field
        custom_fields: lead.custom_fields || {},
      })
    }
    setIsEditModalOpen(true)
  }

  const handleView = (lead) => {
    if (!lead) {
      console.error('handleView: lead is null or undefined')
      return
    }
    const path = user?.role === 'EMPLOYEE' ? `/app/employee/leads/${lead.id}` : `/app/admin/leads/${lead.id}`;
    navigate(path)
  }

  const handleDelete = async (lead) => {
    if (!lead) {
      console.error('handleDelete: lead is null or undefined')
      return
    }
    if (window.confirm(t('leads.confirm_delete_lead', { leadName: lead.personName || lead.companyName || 'this lead' }))) {
      try {
        await leadsAPI.delete(lead.id, { company_id: companyId })
        setLeads(leads.filter((l) => l.id !== lead.id))
        alert(t('messages.deleteSuccess'))
      } catch (error) {
        console.error('Error deleting lead:', error)
        alert(error.response?.data?.error || t('messages.deleteError'))
      }
    }
  }

  const handleSave = async () => {
    // Removed required validations - allow empty data

    try {
      // Always align with a real pipeline: form → header → first available (avoid backend "default" ≠ header Kanban)
      let resolvedPipelineId =
        (formData.pipeline_id && String(formData.pipeline_id)) ||
        (currentPipeline?.id != null ? String(currentPipeline.id) : '') ||
        (pipelines[0]?.id != null ? String(pipelines[0].id) : '')

      let resolvedStageId = formData.stage_id != null && formData.stage_id !== '' ? String(formData.stage_id) : ''

      if (resolvedPipelineId) {
        try {
          const st = await leadPipelinesAPI.getStages(resolvedPipelineId)
          const list = st.data?.success ? (st.data.data || []) : []
          if (list.length) {
            const valid = resolvedStageId && list.some((s) => String(s.id) === String(resolvedStageId))
            if (!resolvedStageId || !valid) {
              resolvedStageId = String(list[0].id)
            }
          }
        } catch (e) {
          console.error('resolve lead stage:', e)
          if (!resolvedStageId && stages.length > 0 && String(resolvedPipelineId) === String(currentPipeline?.id)) {
            resolvedStageId = String(stages[0].id)
          }
        }
      }

      const leadData = {
        lead_type: formData.leadType,
        company_name: formData.leadType === 'Organization' ? (formData.companyName || null) : null,
        person_name: formData.leadType === 'Person' ? formData.personName.trim() : (formData.personName || null),
        phone: formData.phone.trim(),
        owner_id: formData.employee, // Changed from owner to employee
        status: formData.status,
        source: formData.source || null,
        address: formData.address || null,
        city: formData.city || null,
        value: formData.value ? parseFloat(formData.value) : null,
        due_followup: formData.dueFollowup || null,
        notes: formData.notes || null,
        probability: formData.probability ? parseInt(formData.probability) : null,
        company_id: parseInt(companyId), // Auto-set from session
        user_id: parseInt(userId), // Auto-set from session for created_by
        created_by: parseInt(userId), // Auto-set from session
        call_this_week: formData.callThisWeek || false,
        labels: formData.label ? [formData.label] : [],
        services: formData.services || [],
        pipeline_id: resolvedPipelineId ? parseInt(resolvedPipelineId, 10) : null,
        stage_id: resolvedStageId ? parseInt(resolvedStageId, 10) : null,
        custom_fields: formData.custom_fields || {}
      }

      if (isEditModalOpen && selectedLead) {
        try {
          const response = await leadsAPI.update(selectedLead.id, leadData, { company_id: companyId })
          if (response.data && response.data.success) {
            alert(t('messages.updateSuccess'))
            await fetchLeads()
            setIsEditModalOpen(false)
            setSelectedLead(null)
          } else {
            alert(response.data?.error || t('messages.updateError'))
          }
        } catch (error) {
          console.error('Error updating lead:', error)
          console.error('Error response:', error.response)
          alert(error.response?.data?.error || error.message || t('messages.updateError'))
        }
      } else {
        const response = await leadsAPI.create(leadData)
        if (response.data.success) {
          alert(t('messages.createSuccess'))
          await fetchLeads()
          setIsAddModalOpen(false)
        } else {
          alert(response.data.error || t('messages.createError'))
        }
      }

      // Reset form
      setFormData({
        leadType: 'Organization',
        companyName: '',
        personName: '',
        phone: '',
        employee: '',
        status: 'Neu',
        source: '',
        address: '',
        city: '',
        value: '',
        dueFollowup: '',
        notes: '',
        probability: '',
        callThisWeek: false,
        label: '',
        services: [], // Added services field
        custom_fields: {},
        pipeline_id: '',
        stage_id: '',
      })
    } catch (error) {
      console.error('Error saving lead:', error)
      alert(error.response?.data?.error || 'Lead konnte nicht gespeichert werden')
    }
  }

  const actions = (row) => {
    if (!row) return null

    return (
      <div className="action-btn-container">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleView(row)
          }}
          className="action-btn action-btn-view"
          title={t('common.actions.view')}
          type="button"
        >
          <IoEye size={18} />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleEdit(row)
          }}
          className="action-btn action-btn-edit"
          title={t('common.actions.edit')}
          type="button"
        >
          <IoPencil size={18} />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDelete(row)
          }}
          className="action-btn action-btn-delete"
          title={t('common.actions.delete')}
          type="button"
        >
          <IoTrashOutline size={18} />
        </button>
      </div>
    )
  }

  return (
    isViewModalOpen && selectedLead ? (
      <div className="h-full flex flex-col font-sans text-primary-text bg-white rounded-lg shadow-sm p-6 w-full animate-in fade-in duration-200">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="mr-2 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              title={t('leads.back_to_leads') || "Zurück zu Leads"}
            >
              <IoChevronBack size={22} />
            </button>
            <div className="w-10 h-10 rounded bg-primary-accent text-white flex items-center justify-center text-lg font-bold shadow-sm">
              <IoBusiness />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 notranslate">{selectedLead.personName || selectedLead.companyName || t('leads.view.lead_details')}</h2>
              <p className="text-sm text-gray-500">{selectedLead.companyName || t('leads.view.no_company')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setIsViewModalOpen(false); handleEdit(selectedLead); }}
              className="p-2 border border-blue-100 text-blue-600 rounded hover:bg-blue-50 transition-colors" title={t('common.edit')}
            >
              <IoCreate size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-gray-200 mb-8 text-sm font-medium text-gray-500 overflow-x-auto scrollbar-hide -mx-2 sm:mx-0">
          <button className="px-4 py-3 border-b-2 border-primary-accent text-primary-accent hover:text-primary-accent transition-colors whitespace-nowrap">{t('leads.view.tabs.overview')}</button>
          <button className="px-4 py-3 border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700 transition-colors whitespace-nowrap">{t('leads.view.tabs.quotes')}</button>
          <button className="px-4 py-3 border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700 transition-colors whitespace-nowrap">{t('leads.view.tabs.deals')}</button>
          <button className="px-4 py-3 border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700 transition-colors whitespace-nowrap">{t('leads.view.tabs.contracts')}</button>
          <button className="px-4 py-3 border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700 transition-colors whitespace-nowrap">{t('leads.view.tabs.files')}</button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-8">

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-lg border border-gray-100 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-gray-700">0</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mt-1 font-medium">{t('leads.view.quotes_sent')}</div>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-100 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-gray-700">0</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mt-1 font-medium">{t('leads.view.quotes_inbox')}</div>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-100 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-gray-700">0</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mt-1 font-medium">{t('leads.view.deals_count')}</div>
              </div>
            </div>

            {/* Contacts Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                  <IoPeopleOutline size={20} />{t("sidebar.contacts")}</h3>
                <button className="text-primary-accent text-sm hover:underline flex items-center gap-1 font-medium">
                  <IoAdd />{t("common.add_contact")}</button>
              </div>
              {/* Placeholder Contact */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {(selectedLead.personName?.[0] || 'U').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-base">{selectedLead.personName || t('leads.view.unknown')}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                      {selectedLead.email || t("leads.view.no_email")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    <IoCall size={14} /> {selectedLead.phone || t("leads.view.no_phone")}
                  </div>
                </div>
              </div>
            </div>

            {/* Events Section (Calendar) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                  <IoCalendarOutline size={20} />{t("sidebar.calendar")}</h3>
                <button className="text-primary-accent text-sm hover:underline flex items-center gap-1 font-medium">
                  <IoAdd />{t("common.add_event")}</button>
              </div>
              {/* Simple Calendar View */}
              <div className="border border-gray-200 rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"><IoChevronBack size={18} /></button>
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"><IoChevronForward size={18} /></button>
                  </div>
                  <div className="font-bold text-gray-800 text-lg">{t('auto.auto_7022ed6d') || 'January 2026'}</div>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button className="text-xs px-3 py-1.5 bg-white rounded shadow-sm text-gray-800 font-medium">{t("common.month")}</button>
                    <button className="text-xs px-3 py-1.5 text-gray-500 font-medium hover:text-gray-800">{t("common.week")}</button>
                    <button className="text-xs px-3 py-1.5 text-gray-500 font-medium hover:text-gray-800">{t("common.day")}</button>
                  </div>
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden min-w-[500px]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase py-3 text-center tracking-wide">{d}</div>
                    ))}
                    {/* Mock Calendar Grid */}
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div key={i} className={`h-24 bg-white p-2 hover:bg-gray-50 transition-colors relative group border-t border-gray-100 ${i === 7 ? 'bg-yellow-50/50' : ''}`}>
                        <span className={`text-sm font-medium ${i === 7 ? 'text-primary-accent' : 'text-gray-700'}`}>{i + 1 > 31 ? '' : i + 1}</span>
                        {i === 7 && (
                          <div className="mt-1 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded truncate">{t("leads.view.followup")}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar Info */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                  <IoList size={20} /> Lead-Info
                </h3>
                <button className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><IoEllipsisHorizontal size={20} /></button>
              </div>

              <div className="space-y-6">
                {/* Organization */}
                {selectedLead.companyName && (
                  <div className="flex items-start gap-3">
                    <IoBusinessOutline className="mt-1 text-gray-400" size={18} />
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{t('auto.auto_17b83ae3') || 'Organisation'}</p>
                      <p className="text-base font-semibold text-gray-800">{selectedLead.companyName}</p>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-100">
                  <span className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full border ${selectedLead.status === 'Gewonnen' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                    {selectedLead.status || 'Neu'}
                  </span>
                  <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-50 text-gray-600 border border-gray-200 flex items-center gap-1.5">
                    <IoLogoGoogle size={14} /> Google
                  </span>
                  {selectedLead.probability && (
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                    {selectedLead.probability}% Wahrscheinlichkeit
                  </span>
                )}
                </div>

                {/* Owner */}
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">{t('auto.auto_8b0261a6') || 'Besitzer'}</p>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                      {(selectedLead.employee?.[0] || 'U')}
                    </div>
                    <p className="text-sm font-medium text-primary-accent hover:underline cursor-pointer">{selectedLead.employee || 'Nicht zugewiesen'}</p>
                  </div>
                </div>

                {/* Add Managers */}
                <div>
                  <button className="text-sm text-gray-500 hover:text-primary-accent flex items-center gap-2 transition-colors">
                    <div className="w-6 h-6 rounded-full border border-dashed border-gray-400 flex items-center justify-center">
                      <IoAdd size={14} />
                    </div>
                    Manager hinzufügen
                  </button>
                </div>

                {/* Address */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-start gap-3">
                    <IoLocationOutline className="text-gray-400 mt-1 shrink-0" size={18} />
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedLead.address || '84697 Lurline Track'}<br />
                      {selectedLead.city || 'Lake Benton'}, Massachusetts,<br />
                      Iceland
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <IoCallOutline className="text-gray-400 shrink-0" size={18} />
                    <p className="text-sm text-gray-600 font-medium">{selectedLead.phone || '(205) 360-2071'}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Additional Sections Placeholder */}
            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm transition-all hover:border-gray-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <IoCheckmarkCircleOutline className="text-gray-400" size={20} /> Aufgaben
                </h3>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">0</span>
              </div>
              <button className="text-sm text-primary-accent hover:underline flex items-center gap-1 font-medium">
                <IoAdd /> Aufgabe hinzufügen
              </button>
            </div>

            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm transition-all hover:border-gray-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <IoDocumentTextOutline className="text-gray-400" size={20} /> Notizen
                </h3>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">0</span>
              </div>
              <button className="text-sm text-primary-accent hover:underline flex items-center gap-1 font-medium">
                <IoAdd /> Notiz hinzufügen
              </button>
            </div>

            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm transition-all hover:border-gray-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <IoTimeOutline className="text-gray-400" size={20} /> Erinnerungen (Privat)
                </h3>
              </div>
              <button className="text-sm text-primary-accent hover:underline flex items-center gap-1 font-medium">
                <IoAdd /> Erinnerung hinzufügen
              </button>
            </div>

          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-gray-50">
        {/* ── Unified Header (Deals Style) ── */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex flex-col gap-3 shadow-sm z-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Title + tabs */}
            <div>
              <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <IoBriefcase className="text-primary-accent" size={22} /> <span className="notranslate">{t('Leads')}</span>
              </h1>
              <div className="flex items-center gap-1 mt-1.5">
                {[
                  { id: 'kanban', icon: IoGrid, label: 'Kanban', tab: 'kanban' },
                  { id: 'list', icon: IoList, label: 'Liste', tab: 'leads' }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setActiveTab(v.tab)
                      setViewMode(v.id)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === v.id ? 'bg-primary-accent/10 text-primary-accent' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                  >
                    <v.icon size={14} /> {v.label}
                  </button>
                ))}
              </div>

              {/* My Leads / All Leads Toggle (Admin only to simplify Employee view) */}
              {user?.role !== 'EMPLOYEE' && (
                <div className="flex items-center gap-1.5 p-1 bg-gray-100 border border-gray-200 rounded-xl mt-2 w-fit">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeFilter === 'all' ? 'bg-white text-primary-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t('common.all_leads')}
                  </button>
                  <button
                    onClick={() => setActiveFilter('my')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeFilter === 'my' ? 'bg-white text-primary-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t('common.my_leads')}
                  </button>
                </div>
              )}
            </div>

            {/* Right controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Pipeline selector */}
              {pipelines.length > 0 && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 transition-all hover:border-primary-accent shadow-sm">
                  <IoLayers size={14} className="text-gray-400" />
                  <select
                    className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
                    value={currentPipeline?.id || ''}
                    onChange={e => {
                      const v = e.target.value
                      const p = pipelines.find((x) => String(x.id) === String(v))
                      if (p) {
                        setCurrentPipeline(p)
                        fetchStages(p.id)
                      }
                    }}
                  >
                    {pipelines.map(p => <option key={p.id} value={p.id}>{['lead pipeline'].includes((p.name||'').replace(/['"]/g, '').toLowerCase().trim()) ? 'Lead-Pipeline' : ['international sales'].includes((p.name||'').replace(/['"]/g, '').toLowerCase().trim()) ? 'Internationaler Vertrieb' : ['sales pipeline'].includes((p.name||'').replace(/['"]/g, '').toLowerCase().trim()) ? 'Vertriebspipeline' : p.name}</option>)}
                  </select>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('leads.search_placeholder') || 'Search leads...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-sm w-52 transition-all"
                />
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              </div>

              {/* Filter btn */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-bold transition-all ${isFilterOpen ? 'bg-primary-accent text-white border-primary-accent shadow-lg shadow-primary-accent/30' : 'bg-white border-gray-200 text-gray-600 hover:border-primary-accent hover:text-primary-accent'}`}
              >
                <IoFilter size={15} /> {t('common.filter')}
                {(filterOwner || filterStatus || filterSource || filterDate) && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">!</span>
                )}
              </button>

              {/* Add Lead - Available for all roles */}
              <Button
                variant="primary"
                onClick={() => {
                  setIsAddModalOpen(true)
                  setEditingLead(null)
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold shadow-sm"
              >
                <IoAdd size={18} /> {t('leads.add_new_lead')}
              </Button>

              {/* Import */}
              <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="text-sm py-2 px-4">
                <IoDownload size={16} /> {t('common.import')}
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>
              {(viewMode === 'kanban' && currentPipeline ? pipelineScopeTotals.count : filteredLeads.length)}{' '}
              {t('leads.columns.lead') || 'Leads'}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="font-bold">
              {t('dashboard.total') || 'Total'}:{' '}
              <span className="text-primary-accent">
                {fmtShort((viewMode === 'kanban' && currentPipeline ? pipelineScopeTotals.value : leadsTotals.value))}
              </span>
            </span>
            {(filterOwner || filterStatus || filterSource || filterDate) && (
              <>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span className="text-amber-600 font-bold">{t('common.filters_active') || 'Filters Active'}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-5">
          {/* Export / Print */}
          <div className="flex items-center gap-2 ml-auto mb-4">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-green-500 hover:text-green-600 transition-all shadow-sm"
            >
              <IoDownload size={14} className="text-green-600" /> {t('common.export')}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
            >
              <IoReceipt size={14} className="text-blue-600" /> {t('common.print')}
            </button>
          </div>


          {/* Expanded Filter Row (Conditional) */}
          {isFilterOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('deals.form.assigned_to')}</label>
                <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent">
                    <option value="">{t('common.all_users')}</option>
                    {employees.map(e => <option key={e.id} value={e.user_id || e.id}>{e.name || e.employee_name}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('common.date_from')}</label>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent" />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('common.date_to')}</label>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent" />
              </div>

              {/* Quick Actions (Reset) */}
              {(filterOwner || filterStatus || filterSource || filterDate || filterDateFrom || filterDateTo) && (
                <div className="md:col-span-4 flex justify-end">
                  <button
                    onClick={() => {
                      setFilterOwner('')
                      setFilterStatus('')
                      setFilterSource('')
                      setFilterDate('')
                      setFilterDateFrom('')
                      setFilterDateTo('')
                      setProbabilityFilter(null)
                      setActiveFilter('all')
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl border border-red-200 transition-all"
                  >
                    <IoClose size={14} /> {t('common.clear_all')}
                  </button>
                </div>
              )}
            </div>
          )}


          {/* Kanban View — same UX as Deals (fallback column when no stages) */}
          {(activeTab === 'kanban' || viewMode === 'kanban') && (
            <div className="w-full pb-4" onDragOver={(e) => e.preventDefault()}>
              <div
                className="flex gap-4 h-full min-h-[320px] overflow-x-auto overflow-y-hidden pb-4 -mx-3 sm:mx-0 px-3 sm:px-0 custom-scrollbar items-stretch"
                onDragOver={(e) => e.preventDefault()}
              >
                {stagesLoading ? (
                  <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white/60">
                    <div className="h-8 w-8 rounded-full border-2 border-primary-accent border-t-transparent animate-spin" />
                    <p className="text-sm font-medium text-gray-500">{t('common.loading')}</p>
                  </div>
                ) : stages.length === 0 && currentPipeline?.id && kanbanBoardLeads.length > 0 ? (
                  <div className="w-full flex flex-col gap-3">
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 max-w-2xl">
                      {t('leads.kanban.no_stages_running')}
                    </p>
                    <div className="flex gap-4">
                      <LeadKanbanColumn
                        stage={{
                          id: LEAD_KANBAN_FALLBACK_STAGE_ID,
                          name: t('leads.kanban.fallback_title'),
                          color: '#6366f1',
                        }}
                        stages={[]}
                        columnLeads={kanbanBoardLeads}
                        t={t}
                        cardsDraggable={false}
                        isDragOver={false}
                        onDragOverCol={(e) => e.preventDefault()}
                        onDropCol={(e) => e.preventDefault()}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onOpenLead={handleView}
                        getTimeAgo={getTimeAgo}
                        fmtShort={fmtShort}
                      />
                    </div>
                    <p className="text-xs text-gray-400 pl-1">
                      <button
                        type="button"
                        onClick={() => navigate('/app/admin/settings/pipelines')}
                        className="text-primary-accent font-medium hover:underline"
                      >
                        {t('leads.kanban.manage_pipelines_short')}
                      </button>
                    </p>
                  </div>
                ) : stages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 min-h-[280px] w-full">
                    <IoLayers size={40} className="text-gray-200" />
                    <p className="font-bold text-sm text-center px-4 text-gray-600">{t('leads.kanban.no_stages')}</p>
                    <p className="text-xs text-gray-500 text-center max-w-md px-4">{t('leads.kanban.no_stages_hint')}</p>
                    <button
                      type="button"
                      onClick={() => navigate('/app/admin/settings/pipelines')}
                      className="mt-1 text-sm text-primary-accent/90 hover:underline"
                    >
                      {t('leads.kanban.manage_pipelines_short')}
                    </button>
                  </div>
                ) : (
                  stages.map((stage) => (
                    <LeadKanbanColumn
                      key={stage.id}
                      stage={stage}
                      stages={stages}
                      columnLeads={getColumnLeadsForStage(stage, stages, kanbanBoardLeads)}
                      t={t}
                      cardsDraggable
                      isDragOver={dragOverStageId === stage.id}
                      onDragOverCol={(e) => handleDragOver(e, stage.id)}
                      onDropCol={(e) => handleDrop(e, stage.id)}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onOpenLead={handleView}
                      getTimeAgo={getTimeAgo}
                      fmtShort={fmtShort}
                    />
                  ))
                )}
              </div>
            </div>
          )}


          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Date Range Filter */}
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-sm font-medium text-primary-text">{t('auto.auto_128bd84a') || 'Zeitraum:'}</span>
                  {['all', 'today', 'this_week', 'this_month', 'custom'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range)}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${dateRange === range
                        ? 'bg-primary-accent text-white'
                        : 'bg-white text-primary-text border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {range === 'all' ? 'Gesamt' : range === 'today' ? 'Heute' : range === 'this_week' ? 'Diese Woche' : range === 'this_month' ? 'Dieser Monat' : 'Benutzerdefiniert'}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Stats Cards */}
              {overviewLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-4 sm:p-6">
                      <div className="h-16 bg-gray-200 rounded animate-pulse" />
                    </Card>
                  ))}
                </div>
              ) : overviewData ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <Card
                    className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setActiveTab('leads')
                      setActiveFilter('all')
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm sm:text-base font-medium text-secondary-text">{t('leads.total_leads')}</h3>
                      <IoStatsChart className="text-primary-accent" size={20} />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-primary-text">{overviewData.totals.total_leads}</p>
                  </Card>
                  <Card
                    className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setActiveTab('leads')
                      setActiveFilter('all')
                      // Filter by New status
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm sm:text-base font-medium text-secondary-text">{t('auto.auto_c1d25382') || 'Neue Leads'}</h3>
                      <IoTrendingUp className="text-blue-500" size={20} />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{overviewData.totals.new_leads}</p>
                  </Card>
                  <Card
                    className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setActiveTab('leads')
                      // Filter by Won status
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm sm:text-base font-medium text-secondary-text">{t('auto.auto_50344533') || 'Konvertiert'}</h3>
                      <IoCheckmarkCircle className="text-green-500" size={20} />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">{overviewData.totals.converted_leads}</p>
                  </Card>
                  <Card
                    className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setActiveTab('leads')
                      // Filter by Lost status
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm sm:text-base font-medium text-secondary-text">{t('auto.auto_558fa744') || 'Verlorene Leads'}</h3>
                      <IoCloseCircle className="text-red-500" size={20} />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-red-600">{overviewData.totals.lost_leads}</p>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-medium text-secondary-text mb-2">{t('leads.total_leads')}</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-primary-text">{leads.length}</p>
                  </Card>
                  <Card className="p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-medium text-secondary-text mb-2">{t('leads.new_leads') || 'Neue Leads'}</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{leads.filter(l => l.status === 'Neu').length}</p>
                  </Card>
                  <Card className="p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-medium text-secondary-text mb-2">{t('leads.won_leads') || 'Gewonnen'}</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">{leads.filter(l => l.status === 'Gewonnen').length}</p>
                  </Card>
                  <Card className="p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-medium text-secondary-text mb-2">{t('leads.lost_leads') || 'Verloren'}</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-red-600">{leads.filter(l => l.status === 'Verloren').length}</p>
                  </Card>
                </div>
              )}

              {/* Charts Row */}
              {overviewData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Lead Sources Chart */}
                  <Card className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-primary-text">{t('auto.auto_be09b22e') || 'Lead-Quellen'}</h3>
                      <Button
                        variant="ghost"
                        onClick={() => setActiveTab('leads')}
                        className="text-sm"
                      >
                        Alle anzeigen
                      </Button>
                    </div>
                    {overviewData.sources && overviewData.sources.length > 0 ? (
                      <div className="h-64">
                        <BarChart
                          data={overviewData.sources.map(s => ({ name: s.source, value: s.count }))}
                          dataKey="value"
                          name="Leads"
                          height={250}
                          color="#0073EA"
                        />
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-secondary-text">
                        Keine Quellendaten verfügbar
                      </div>
                    )}
                  </Card>

                  {/* Lead Status Chart */}
                  <Card className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-primary-text">{t('auto.auto_65963846') || 'Lead-Status'}</h3>
                      <Button
                        variant="ghost"
                        onClick={() => setActiveTab('kanban')}
                        className="text-sm"
                      >
                        Kanban anzeigen
                      </Button>
                    </div>
                    {overviewData.statuses && overviewData.statuses.length > 0 ? (
                      <div className="h-64">
                        <DonutChart
                          data={overviewData.statuses.map(s => ({ name: s.status, value: s.count }))}
                          height={250}
                        />
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-secondary-text">
                        Keine Statusdaten verfügbar
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Assigned Users & Follow-ups */}
              {overviewData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Assigned Users */}
                  <Card className="p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">{t('leads.assigned_users') || 'Zugewiesene Benutzer'}</h3>
                    {overviewData.assigned_users && overviewData.assigned_users.length > 0 ? (
                      <div className="space-y-3">
                        {overviewData.assigned_users.slice(0, 5).map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => {
                              setActiveTab('leads')
                              setActiveFilter('my')
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-accent/20 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary-accent">
                                  {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-primary-text">{user.name}</p>
                                <p className="text-xs text-secondary-text">{user.email}</p>
                              </div>
                            </div>
                            <Badge variant="info">{user.leads_count} leads</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-secondary-text">{t('common.no_users_assigned') || 'Keine Benutzer zugewiesen'}</p>
                    )}
                  </Card>

                  {/* Follow-ups */}
                  <Card className="p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">{t('leads.follow_ups') || 'Wiedervorlagen'}</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IoCalendar className="text-blue-600" size={20} />
                            <h4 className="font-semibold text-primary-text">{t('common.today') || 'Heute'}</h4>
                          </div>
                          <Badge variant="info">{overviewData.follow_ups.today}</Badge>
                        </div>
                        <p className="text-sm text-secondary-text">{t('leads.overdose_today') || 'Fällige Leads für heute'}</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IoTime className="text-orange-600" size={20} />
                            <h4 className="font-semibold text-primary-text">{t('leads.upcoming') || 'Anstehend'}</h4>
                          </div>
                          <Badge variant="warning">{overviewData.follow_ups.upcoming}</Badge>
                        </div>
                        <p className="text-sm text-secondary-text">Leads fällig in den nächsten 7 Tagen</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Revenue Summary */}
              {overviewData && overviewData.revenue && (
                <Card className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-primary-text mb-4">Umsatzübersicht</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-secondary-text mb-1">{t('') || ''}</p>
                      <p className="text-2xl font-bold text-primary-text">
                        ${overviewData.revenue.total_value.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-text mb-1">{t('') || ''}</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${overviewData.revenue.converted_value.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-text mb-1">{t('') || ''}</p>
                      <p className="text-2xl font-bold text-primary-accent">
                        ${overviewData.revenue.avg_value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )
          }


          {/* Leads Tab - List View */}
          {activeTab === 'leads' && viewMode !== 'kanban' && (
            <div className="w-full overflow-x-hidden">
              <DataTable
                columns={columns}
                data={filteredLeads}
                searchPlaceholder="Search leads..."
                filters={true}
                filterConfig={[
                  {
                    key: 'status',
                    label: 'Status',
                    type: 'select',
                    options: stages.map(s => s.id)
                  },
                  {
                    key: 'source',
                    label: 'Quelle',
                    type: 'select',
                    options: sources.length > 0 ? sources : ['Website', 'Call', 'Email', 'Social Media', 'Referral', 'Other']
                  },
                  {
                    key: 'city',
                    label: 'Stadt',
                    type: 'text'
                  },
                ]}
                actions={actions}
                bulkActions={true}
                selectedRows={selectedLeads}
                onSelectAll={handleSelectAll}
                onRowClick={(row) => handleView(row)}
                loading={loading}
              />
            </div>
          )
          }


          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-primary-text">{t('crm.contacts')}</h2>
                  <p className="text-sm text-secondary-text mt-1">{t('leads.contacts_subtitle') || 'Alle Kontakte Ihrer Leads verwalten'}</p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleAddContact}
                  className="flex items-center gap-2"
                >
                  <IoPersonAdd size={18} />{t("common.add_contact")}</Button>
              </div>

              {/* Contacts Table */}
              {contactsLoading ? (
                <Card className="p-6">
                  <div className="text-center py-8 text-secondary-text">{t('common.loading') || 'Wird geladen...'}</div>
                </Card>
              ) : contacts.length === 0 ? (
                <Card className="p-6">
                  <div className="text-center py-8">
                    <IoPerson size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-secondary-text">{t('leads.no_contacts_found') || 'Keine Kontakte gefunden'}</p>
                    <Button
                      variant="primary"
                      onClick={handleAddContact}
                      className="mt-4 flex items-center gap-2 mx-auto"
                    >
                      <IoPersonAdd size={18} />
                      Ersten Kontakt hinzufügen
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-0">
                  <DataTable
                    data={contacts}
                    columns={[
                      { key: 'name', label: t('leads.columns.lead_name') },
                      { key: 'company', label: t('leads.columns.company'), render: (value) => value || '-' },
                      { key: 'email', label: t('leads.columns.email'), render: (value) => value || '-' },
                      { key: 'phone', label: t('leads.columns.phone'), render: (value) => value || '-' },
                      {
                        key: 'status',
                        label: t('leads.columns.status'),
                        render: (value) => (
                          <Badge variant={value === 'Active' ? 'success' : 'warning'}>
                            {value || 'Active'}
                          </Badge>
                        ),
                      },
                      {
                        key: 'assigned_user_name',
                        label: t('leads.columns.owner'),
                        render: (value) => value || '-',
                      },
                      {
                        key: 'actions',
                        label: t('leads.columns.actions'),
                        render: (_, row) => (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditContact(row)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={t('common.edit')}
                            >
                              <IoCreate size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteContact(row.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={t('common.delete')}
                            >
                              <IoTrash size={18} />
                            </button>
                          </div>
                        ),
                      },
                    ]}
                    loading={contactsLoading}
                    emptyMessage="Keine Kontakte gefunden"
                  />
                </Card>
              )}
            </div>
          )
          }


          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-primary-text">{t("sidebar.calendar")}</h2>
                  <p className="text-sm text-secondary-text mt-1">{t('leads.events_subtitle') || 'Termine und Wiedervorlagen verwalten'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {['month', 'week', 'day', 'list'].map((view) => (
                      <button
                        key={view}
                        onClick={() => setCalendarView(view)}
                        className={`px-2 sm:px-3 py-1 text-xs font-medium rounded transition-colors ${calendarView === view
                          ? 'bg-white text-primary-text shadow-sm'
                          : 'text-secondary-text hover:text-primary-text'
                          }`}
                      >
                        {view.charAt(0).toUpperCase() + view.slice(1)}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setIsAddEventModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <IoAdd size={18} />{t("common.add_event")}</Button>
                </div>
              </div>

              {/* Calendar Navigation */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <IoChevronBack size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <IoChevronForward size={18} />
                    </button>
                    <h3 className="text-lg font-semibold text-primary-text ml-4">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                </div>

                {/* Calendar Grid */}
                {calendarView === 'month' && (
                  <div className="border border-gray-200 rounded-lg overflow-x-auto scrollbar-hide">
                    <div className="min-w-[700px]">
                      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="px-4 py-3 text-xs font-medium text-secondary-text uppercase text-center">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 bg-white">
                        {(() => {
                          const year = currentMonth.getFullYear()
                          const month = currentMonth.getMonth()
                          const firstDay = new Date(year, month, 1)
                          const lastDay = new Date(year, month + 1, 0)
                          const daysInMonth = lastDay.getDate()
                          const startingDayOfWeek = firstDay.getDay()

                          const days = []
                          for (let i = 0; i < startingDayOfWeek; i++) {
                            days.push(null)
                          }
                          for (let day = 1; day <= daysInMonth; day++) {
                            days.push(day)
                          }

                          return days.map((day, index) => {
                            const dayEvents = day !== null ? events.filter(event => {
                              const eventDate = new Date(event.starts_on_date)
                              return eventDate.getDate() === day &&
                                eventDate.getMonth() === month &&
                                eventDate.getFullYear() === year
                            }) : []

                            return (
                              <div
                                key={index}
                                className="min-h-[100px] border-r border-b border-gray-200 p-2 hover:bg-gray-50 relative"
                              >
                                {day !== null && (
                                  <>
                                    <div className="text-sm font-medium text-primary-text mb-1">{day}</div>
                                    <div className="space-y-1">
                                      {dayEvents.slice(0, 2).map((event, idx) => (
                                        <div
                                          key={idx}
                                          className="text-xs px-2 py-1 rounded truncate"
                                          style={{ backgroundColor: event.label_color || '#FF0000', color: 'white' }}
                                          title={event.event_name}
                                        >
                                          {event.event_name}
                                        </div>
                                      ))}
                                      {dayEvents.length > 2 && (
                                        <div className="text-xs text-secondary-text">+{dayEvents.length - 2} more</div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* List View */}
                {calendarView === 'list' && (
                  <div className="space-y-2">
                    {eventsLoading ? (
                      <div className="text-center py-8 text-secondary-text">{t('auto.auto_91778c19') || 'Termine werden geladen...'}</div>
                    ) : events.length === 0 ? (
                      <div className="text-center py-8">
                        <IoCalendar size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-secondary-text">{t('') || ''}</p>
                      </div>
                    ) : (
                      events.map((event) => (
                        <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-primary-text">{event.event_name}</h4>
                              <p className="text-sm text-secondary-text mt-1">{event.description || 'Keine Beschreibung'}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-secondary-text">
                                <span className="flex items-center gap-1">
                                  <IoCalendar size={14} />
                                  {new Date(event.starts_on_date).toLocaleDateString()} {event.starts_on_time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IoLocation size={14} />
                                  {event.where || 'TBD'}
                                </span>
                              </div>
                            </div>
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: event.label_color || '#FF0000' }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            </div>
          )
          }

          {/* Add/Edit Modal - Same as before but with probability and callThisWeek fields */}
          <RightSideModal
            isOpen={isAddModalOpen || isEditModalOpen}
            onClose={() => {
              setIsAddModalOpen(false)
              setIsEditModalOpen(false)
            }}
            title={isAddModalOpen ? (t('leads.add_new_lead') || 'Add New Lead') : (t('leads.edit_lead') || 'Edit Lead')}
          >
            <div className="space-y-4">
              {/* Basic Info Section */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-primary-text mb-3">{t('leads.basic_info')}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-text mb-2">
                        {t('leads.lead_type_label')} <span className="text-danger">*</span>
                      </label>
                      <select
                        value={formData.leadType}
                        onChange={(e) => {
                          const newLeadType = e.target.value
                          setFormData({
                            ...formData,
                            leadType: newLeadType,
                            // Clear fields when switching types
                            personName: newLeadType === 'Organization' ? '' : formData.personName,
                            companyName: newLeadType === 'Person' ? '' : formData.companyName
                          })
                        }}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                      >
                        <option value="Organization">{t('leads.organization')}</option>
                        <option value="Person">{t('leads.person')}</option>
                      </select>
                    </div>
                    {formData.leadType === 'Person' ? (
                      <Input
                        label={t('leads.person_name')}
                        value={formData.personName}
                        onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                        placeholder={t('leads.enter_person_name')}
                      />
                    ) : (
                      <Input
                        label={t('leads.organization_name')}
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder={t('leads.enter_organization_name')}
                      />
                    )}
                  </div>
                  <Input
                    label={t('common.phone')}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                    placeholder={t('leads.enter_phone')}
                    helperText={formData.phone && !isValidPhone(formData.phone) ? t('leads.invalid_phone') : '+49 für Deutschland'}
                    error={formData.phone && !isValidPhone(formData.phone)}
                  />

                  {/* Custom Fields Section */}
                  {customFields.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <h4 className="text-sm font-semibold text-primary-text mb-3 flex items-center gap-2">
                        <IoList className="text-primary-accent" />
                        {t('leads.additional_info')}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customFields.map((field) => (
                          <div key={field.id}>
                            <label className="block text-sm font-medium text-primary-text mb-2">
                              {field.label}
                              {field.required === 1 && <span className="text-red-500 ml-1">*</span>}
                            </label>

                            {/* TEXTAREA */}
                            {field.type === 'textarea' ? (
                              <textarea
                                value={formData.custom_fields?.[field.name] || ''}
                                onChange={(e) => setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: e.target.value } })}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none"
                                rows={3}
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                              />

                            ) : field.type === 'dropdown' ? (
                              /* DROPDOWN */
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
                              /* MULTISELECT */
                              <div className="space-y-2">
                                {(field.options || []).map((opt, idx) => {
                                  const selected = (formData.custom_fields?.[field.name] || '').split(',').filter(Boolean)
                                  const isChecked = selected.includes(opt)
                                  return (
                                    <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          const current = (formData.custom_fields?.[field.name] || '').split(',').filter(Boolean)
                                          const updated = e.target.checked
                                            ? [...current, opt]
                                            : current.filter(v => v !== opt)
                                          setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: updated.join(',') } })
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-accent focus:ring-primary-accent"
                                      />
                                      <span className="text-sm text-secondary-text">{opt}</span>
                                    </label>
                                  )
                                })}
                              </div>

                            ) : field.type === 'radio' ? (
                              /* RADIO */
                              <div className="space-y-2">
                                {(field.options || []).map((opt, idx) => (
                                  <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`cf_${field.name}`}
                                      value={opt}
                                      checked={formData.custom_fields?.[field.name] === opt}
                                      onChange={() => setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: opt } })}
                                      className="w-4 h-4 border-gray-300 text-primary-accent focus:ring-primary-accent"
                                    />
                                    <span className="text-sm text-secondary-text">{opt}</span>
                                  </label>
                                ))}
                              </div>

                            ) : field.type === 'checkbox' ? (
                              /* CHECKBOX (single boolean) */
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.custom_fields?.[field.name] === 'true' || formData.custom_fields?.[field.name] === true}
                                  onChange={(e) => setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: e.target.checked } })}
                                  className="w-5 h-5 rounded border-gray-300 text-primary-accent focus:ring-primary-accent cursor-pointer"
                                />
                                <span className="text-sm text-secondary-text">{t('common.yes')}, {field.label}</span>
                              </label>

                            ) : field.type === 'file' ? (
                              /* FILE UPLOAD */
                              <div>
                                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-primary-accent transition-all">
                                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                                    <IoDocumentText size={24} className="text-gray-400 mb-1" />
                                    {formData.custom_fields?.[field.name] ? (
                                      <p className="text-sm text-primary-accent font-medium">
                                        ✅ {typeof formData.custom_fields[field.name] === 'string'
                                          ? formData.custom_fields[field.name]
                                          : formData.custom_fields[field.name]?.name || 'Datei ausgewählt'}
                                      </p>
                                    ) : (
                                      <>
                                        <p className="text-sm text-gray-500">{t('auto.auto_5427b3c0') || 'Klicken zum Hochladen'}<span className="font-semibold text-primary-accent">{field.label}</span></p>
                                        <p className="text-xs text-gray-400 mt-1">{t('') || ''}</p>
                                      </>
                                    )}
                                  </div>
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: file } })
                                      }
                                    }}
                                  />
                                </label>
                                {formData.custom_fields?.[field.name] && (
                                  <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, custom_fields: { ...formData.custom_fields, [field.name]: null } })}
                                    className="mt-1 text-xs text-red-500 hover:text-red-700"
                                  >
                                    ✕ Datei entfernen
                                  </button>
                                )}
                              </div>

                            ) : (
                              /* TEXT / NUMBER / DATE / DATETIME / EMAIL / PHONE / URL */
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
                                placeholder={field.placeholder || `${t('common.add')} ${field.label.toLowerCase()}`}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                              />
                            )}

                            {field.help_text && (
                              <p className="text-xs text-secondary-text mt-1">{field.help_text}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ownership Section */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-primary-text mb-3">{t('leads.ownership')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      {t('employees.title')}
                    </label>
                    <select
                      value={formData.employee}
                      onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                    >
                      <option value="">{t('employees.select_employee')}</option>
                      {employees.map(employee => (
                        <option key={employee.user_id || employee.id} value={employee.user_id || employee.id}>
                          {employee.name || employee.email}
                        </option>
                      ))}
                    </select>
                    {employees.length === 0 && (
                      <p className="text-xs text-secondary-text mt-1">{t('employees.no_employees_found')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lead Details Section */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-primary-text mb-3">{t('leads.lead_details_label')}</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-primary-text">
                        {t('deals.form.pipeline')}
                      </label>
                      <button
                        type="button"
                        onClick={() => navigate('/app/admin/settings/pipelines')}
                        className="text-[10px] text-primary-accent font-bold hover:underline"
                      >
                        {t('deals.kanban.manage_pipelines')}
                      </button>
                    </div>
                    <p className="text-xs text-secondary-text mb-2">{t('leads.form.pipeline_stage_hint')}</p>
                    <select
                      value={formData.pipeline_id || (currentPipeline?.id != null ? String(currentPipeline.id) : '')}
                      onChange={async (e) => {
                        const pid = e.target.value
                        if (!pid) {
                          setFormData((fd) => ({ ...fd, pipeline_id: '', stage_id: '' }))
                          return
                        }
                        try {
                          const res = await leadPipelinesAPI.getStages(pid)
                          const list = res.data?.success ? (res.data.data || []) : []
                          setFormData((fd) => ({ ...fd, pipeline_id: pid, stage_id: list[0]?.id != null ? String(list[0].id) : '' }))
                        } catch (err) {
                          console.error(err)
                          setFormData((fd) => ({ ...fd, pipeline_id: pid }))
                        }
                      }}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                    >
                      <option value="">{t('deals.form.select_pipeline')}</option>
                      {pipelines.map(p => (
                        <option key={p.id} value={p.id}>{['lead pipeline'].includes((p.name||'').replace(/['"]/g, '').toLowerCase().trim()) ? 'Lead-Pipeline' : ['international sales'].includes((p.name||'').replace(/['"]/g, '').toLowerCase().trim()) ? 'Internationaler Vertrieb' : ['sales pipeline'].includes((p.name||'').replace(/['"]/g, '').toLowerCase().trim()) ? 'Vertriebspipeline' : p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      {t('leads.columns.source')}
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                    >
                      <option value="">{t('leads.select_source')}</option>
                      {sources.map(source => (
                        <option key={source} value={source}>
                          {t(source.toLowerCase().replace(' ', '_')) || source}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      {t('common.labels')}
                    </label>
                    <select
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                    >
                      <option value="">{t('leads.select_label')}</option>
                      {labels.map(labelItem => {
                        const labelName = typeof labelItem === 'object' ? labelItem.name : labelItem
                        return (
                          <option key={labelName} value={labelName}>{labelName}</option>
                        )
                      })}
                    </select>
                    {labels.length === 0 && (
                      <p className="text-xs text-secondary-text mt-1">{t('leads.no_labels_found')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      {t('leads.address_label')}
                    </label>
                    <RichTextEditor
                      value={formData.address}
                      onChange={(content) => setFormData({ ...formData, address: content })}
                      placeholder={t('common.placeholder_address')}
                    />
                  </div>
                  <Input
                    label={t('common.city') || 'City'}
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder={t('common.placeholder_city') || 'Enter city'}
                  />
                  <Input
                    label={t('deals.form.amount')}
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={t('leads.placeholder_value') || 'Enter lead value'}
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-primary-text">
                      {t('leads.probability') || 'Probability'} (%)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={formData.probability || 0}
                        onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-accent"
                      />
                      <span className="w-12 text-center font-bold text-primary-accent">{formData.probability || 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <input
                      id="callThisWeek"
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-primary-accent focus:ring-primary-accent"
                      checked={formData.callThisWeek}
                      onChange={(e) => setFormData({ ...formData, callThisWeek: e.target.checked })}
                    />
                    <label htmlFor="callThisWeek" className="text-sm font-medium text-primary-text cursor-pointer">
                      {t('leads.call_this_week') || 'Call this week'}
                    </label>
                  </div>
                  <Input
                    label={t('leads.due_followup') || 'Due Date Follow-up'}
                    type="date"
                    value={formData.dueFollowup}
                    onChange={(e) => setFormData({ ...formData, dueFollowup: e.target.value })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      {t('offline_requests.notes')}
                    </label>
                    <RichTextEditor
                      value={formData.notes}
                      onChange={(content) => setFormData({ ...formData, notes: content })}
                      placeholder={t('leads.placeholder_notes') || 'Add notes...'}
                    />
                  </div>

                  {/* Services/Items Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      {t('leads.required_services') || 'Required Services'}
                    </label>
                    <select
                      multiple
                      value={formData.services}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value)
                        setFormData({ ...formData, services: selected })
                      }}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none min-h-[120px]"
                    >
                      <option value="" disabled>{t('leads.select_services_help') || 'Select services (Hold Ctrl/Cmd for multiple selection)'}</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title} {item.rate ? `($${parseFloat(item.rate).toFixed(2)})` : `(${t('leads.price_not_set') || 'Price: Not set'})`}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-secondary-text mt-1">
                      {t('leads.multi_select_help') || 'Hold Ctrl (Windows) or Cmd (Mac) for multiple selection'}
                    </p>
                    {formData.services.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {formData.services.map((serviceId) => {
                            const item = items.find(i => i.id === parseInt(serviceId))
                            return item ? (
                              <span
                                key={serviceId}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-sm"
                              >
                                <span className="font-medium">{item.title}</span>
                                {item.rate && (
                                  <span className="text-xs bg-purple-100 px-2 py-0.5 rounded">
                                    ${parseFloat(item.rate).toFixed(2)}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      services: formData.services.filter(id => id !== serviceId)
                                    })
                                  }}
                                  className="hover:bg-purple-100 rounded-full p-0.5 transition-colors"
                                >
                                  <IoClose size={14} />
                                </button>
                              </span>
                            ) : null
                          })}
                        </div>
                        {/* Total Estimated Value */}
                        {formData.services.length > 0 && (() => {
                          const total = formData.services.reduce((sum, serviceId) => {
                            const item = items.find(i => i.id === parseInt(serviceId))
                            return sum + (item?.rate ? parseFloat(item.rate) : 0)
                          }, 0)
                          return total > 0 ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                              <span className="text-sm font-medium text-green-700">
                                {t('leads.estimated_total') || 'Estimated Total Value'}:
                              </span>
                              <span className="text-lg font-bold text-green-600">
                                ${total.toFixed(2)}
                              </span>
                            </div>
                          ) : null
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 border-t border-gray-200 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setIsEditModalOpen(false)
                  }}
                  className="px-4 text-gray-900 hover:text-white min-w-[100px]"
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button variant="primary" onClick={handleSave} className="px-4 min-w-[120px]">
                  {isAddModalOpen ? (t('leads.save_lead') || 'Save Lead') : (t('leads.update_lead') || 'Update Lead')}
                </Button>
              </div>
            </div>
          </RightSideModal>

          {/* View Modal - Lead Details (Developo Style) */}

          {/* View Modal - Lead Details (Developo Style) */}
          <Modal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            size="xl" // Increased size for detailed view
            title="Lead-Details"
          >
            {selectedLead && (
              <div className="h-full flex flex-col font-sans text-primary-text">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary-accent text-white flex items-center justify-center text-lg font-bold">
                      <IoBusiness />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{selectedLead.personName || selectedLead.companyName || t('leads.view.lead_details') || 'Lead-Details'}</h2>
                      <p className="text-sm text-gray-500">{selectedLead.companyName || t('leads.view.no_company') || 'Kein Unternehmen'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">

                    <button
                      onClick={() => { setIsViewModalOpen(false); handleEdit(selectedLead); }}
                      className="p-2 border border-blue-100 text-blue-600 rounded hover:bg-blue-50" title={t('common.edit')}
                    >
                      <IoCreate size={18} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-gray-200 mb-6 text-sm font-medium text-gray-600 overflow-x-auto">
                  <button
                    onClick={() => setActiveDetailTab('overview')}
                    className={`pb-3 border-b-2 px-1 transition-colors ${activeDetailTab === 'overview' ? 'border-primary-accent text-primary-accent' : 'border-transparent hover:border-gray-300'}`}
                  >
                    {t('leads.view.tabs.overview') || 'Overview'}
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('estimates')}
                    className={`pb-3 border-b-2 px-1 transition-colors ${activeDetailTab === 'estimates' ? 'border-primary-accent text-primary-accent' : 'border-transparent hover:border-gray-300'}`}
                  >
                    {t('leads.view.tabs.quotes') || 'Quotes'}
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('proposals')}
                    className={`pb-3 border-b-2 px-1 transition-colors ${activeDetailTab === 'proposals' ? 'border-primary-accent text-primary-accent' : 'border-transparent hover:border-gray-300'}`}
                  >
                    {t('leads.view.tabs.deals') || 'Deals'}
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('contracts')}
                    className={`pb-3 border-b-2 px-1 transition-colors ${activeDetailTab === 'contracts' ? 'border-primary-accent text-primary-accent' : 'border-transparent hover:border-gray-300'}`}
                  >
                    {t('leads.view.tabs.contracts') || 'Contracts'}
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('files')}
                    className={`pb-3 border-b-2 px-1 transition-colors ${activeDetailTab === 'files' ? 'border-primary-accent text-primary-accent' : 'border-transparent hover:border-gray-300'}`}
                  >
                    {t('leads.view.tabs.files') || 'Files'}
                  </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left Column - Main Content based on Tab */}
                  <div className="flex-1 space-y-8">

                    {activeDetailTab === 'overview' && (
                      <>
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                            <div className="text-2xl font-bold text-gray-700">0</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{t('auto.auto_f0f7d233') || 'Angebote'}</div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                            <div className="text-2xl font-bold text-gray-700">0</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{t('proposals.title') || 'Proposals'}</div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                            <div className="text-2xl font-bold text-gray-700">0</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Vorschläge</div>
                          </div>
                        </div>

                        {/* Contacts Section */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                              <IoPeopleOutline size={20} />{t("sidebar.contacts")}</h3>
                            <button className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                              <IoAdd />{t("common.add_contact")}</button>
                          </div>
                          {/* Placeholder Contact */}
                          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                {(selectedLead.personName?.[0] || 'U').toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{selectedLead.personName || 'Unbekannt'}</p>
                                <p className="text-xs text-secondary-text">{selectedLead.email || t("leads.view.no_email")}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <IoCall size={12} /> {selectedLead.phone || t('leads.view.no_phone')}
                              </div>
                              <button className="text-gray-400 hover:text-red-500" title={t('common.actions.delete')}><IoClose size={16} /></button>
                            </div>
                          </div>
                        </div>

                        {/* Events Section (Calendar) */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                              <IoCalendarOutline size={20} />{t("sidebar.calendar")}</h3>
                            <button className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                              <IoAdd />{t("common.add_event")}</button>
                          </div>
                          {/* Simple Calendar View */}
                          <div className="border border-gray-200 rounded-lg bg-white p-4 overflow-x-auto scrollbar-hide">
                            <div className="flex items-center justify-between mb-4 min-w-[500px]">
                              <div className="flex gap-2">
                                <button className="p-1 hover:bg-gray-100 rounded"><IoChevronBack /></button>
                                <button className="p-1 hover:bg-gray-100 rounded"><IoChevronForward /></button>
                              </div>
                              <div className="font-semibold text-gray-700">{currentMonth.toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</div>
                              <button className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">today</button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-sm min-w-[500px]">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-gray-400 text-xs font-medium py-2">{d}</div>)}
                              {/* Mock Calendar Grid */}
                              {Array.from({ length: 35 }).map((_, i) => (
                                <div key={i} className={`py-4 border border-transparent hover:bg-gray-50 rounded-lg ${i === 7 ? 'bg-yellow-50' : ''} text-gray-600 hover:text-gray-900 cursor-pointer`}>
                                  {i + 1 > 31 ? '' : i + 1}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {activeDetailTab === 'estimates' && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold flex items-center gap-2">
                            Angebote
                          </h3>
                          <button
                            onClick={() => {
                              navigate('/app/admin/estimates/create')
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                          >
                            <IoAdd size={16} /> Angebot hinzufügen
                          </button>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          {/* Placeholder for Estimates Table */}
                          <div className="p-8 text-center text-gray-500">
                            <IoDocumentTextOutline size={48} className="mx-auto mb-3 text-gray-300" />
                            <p>Keine Angebote für diesen Lead gefunden.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add other tabs placeholders as needed */}
                  </div>

                  {/* Right Column - Sidebar Info */}
                  <div className="w-full lg:w-1/3 space-y-6">
                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <IoList size={18} /> Lead-Info
                        </h3>
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => handleEdit(selectedLead)}
                        >
                          <IoEllipsisHorizontal />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Organization */}
                        {selectedLead.companyName && (
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">{t('auto.auto_17b83ae3') || 'Organisation'}</p>
                            <p className="text-sm font-semibold text-gray-800">{selectedLead.companyName}</p>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${selectedLead.status === 'Gewonnen' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                            {selectedLead.status || 'Neu'}
                          </span>
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
                            <IoLogoGoogle size={12} /> Google
                          </span>
                          {selectedLead.probability && (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                              {selectedLead.probability}% Wahrscheinlichkeit
                            </span>
                          )}
                        </div>

                        {/* Owner */}
                        <div className="pt-2">
                          <p className="text-xs text-gray-500 font-medium mb-2">{t('auto.auto_8b0261a6') || 'Besitzer'}</p>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                              {(selectedLead.employee?.[0] || 'U')}
                            </div>
                            <p className="text-sm text-blue-600 hover:underline cursor-pointer">{selectedLead.employee || 'Nicht zugewiesen'}</p>
                          </div>
                        </div>

                        {/* Add Managers */}
                        <div>
                          <button className="text-xs text-blue-500 flex items-center gap-1 hover:underline">
                            <IoAdd /> Manager hinzufügen
                          </button>
                        </div>

                        {/* Address */}
                        <div className="pt-2 border-t border-gray-200 mt-2">
                          <div className="flex items-start gap-2 mt-2">
                            <IoLocationOutline className="text-gray-400 mt-1" size={16} />
                            <p className="text-sm text-gray-600">
                              {stripHtml(selectedLead.address) || 'Keine Adresse'}<br />
                              {selectedLead.city || 'Keine Stadt'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <IoCallOutline className="text-gray-400" size={16} />
                            <p className="text-sm text-gray-600">{selectedLead.phone || '(205) 360-2071'}</p>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Additional Sections Placeholder */}
                    {/* Tasks Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 text-lg">{t('sidebar.tasks') || 'Aufgaben'}</h3>
                        <button
                          onClick={() => setIsTaskModalOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:text-primary-accent hover:border-primary-accent transition-colors bg-white shadow-sm"
                        >
                          <IoAdd size={14} /> Aufgabe hinzufügen
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {tasks.length === 0 ? (
                          <div className="text-center py-4 text-gray-400 text-sm italic">{t('leads.no_tasks') || 'Noch keine Aufgaben hinzugefügt'}</div>
                        ) : (
                          tasks.map((task, idx) => (
                            <div key={idx} className="group p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-blue-50/50 hover:border-blue-100 transition-all cursor-pointer">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${task.status === 'Done' ? 'bg-green-500' :
                                    task.status === 'Doing' ? 'bg-yellow-500' : 'bg-blue-400'
                                    }`}></div>
                                  <span className="text-sm font-bold text-gray-700">{task.title}</span>
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border ${task.status === 'Done' ? 'text-green-600 bg-green-50 border-green-100' :
                                  task.status === 'Doing' ? 'text-yellow-600 bg-yellow-50 border-yellow-100' :
                                    'text-blue-600 bg-blue-50 border-blue-100'
                                  }`}>{task.status || 'Pending'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                <IoCalendarOutline size={12} />
                                <span className={isDeadlineOverdue(task.deadline || task.due_date) && task.status !== 'Done' ? 'text-red-500 font-bold' : ''}>
                                  {formatDate(task.deadline || task.due_date)}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 text-lg">{t('auto.auto_66855ac3') || 'Notizen'}</h3>
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:text-primary-accent hover:border-primary-accent transition-colors bg-white shadow-sm"
                        >
                          <IoAdd size={14} /> Notiz hinzufügen
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {selectedLead.notes ? (
                          <div className="group p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-blue-50/50 hover:border-blue-100 transition-all">
                            <p className="text-sm text-gray-700 leading-relaxed font-medium">
                              {stripHtml(selectedLead.notes)}
                            </p>
                            <div className="mt-2.5 pt-2.5 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
                              <span>{new Date().toLocaleDateString()}</span>
                              <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500">
                                <IoTrashOutline />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                            <p className="text-sm text-gray-400">Noch keine Notizen hinzugefügt</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reminders Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 text-lg">{t('leads.reminders') || 'Erinnerungen'}</h3>
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:text-primary-accent hover:border-primary-accent transition-colors bg-white shadow-sm"
                        >
                          <IoAdd size={14} /> Erinnerung hinzufügen
                        </button>
                      </div>
                      <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                        <p className="text-sm text-gray-400">{t('leads.no_reminders') || 'Keine Erinnerungen hinzugefügt'}</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </Modal>

          {/* Manage Labels Modal */}
          <Modal
            isOpen={isManageLabelsModalOpen}
            onClose={() => {
              setIsManageLabelsModalOpen(false)
              setNewLabel('')
              setNewLabelColor('#22c55e')
            }}
            title="Labels verwalten"
            size="md"
          >
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-inner">
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <IoAdd className="text-primary-accent" /> Neues Label erstellen
                </h4>

                <div className="space-y-4">
                  {/* Color Selection - Professional Small Swatches */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      '#22c55e', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6',
                      '#ef4444', '#f97316', '#eab308', '#ec4899', '#64748b',
                      '#166534', '#065f46', '#1e40af', '#3730a3', '#5b21b6',
                      '#991b1b', '#9a3412', '#854d0e', '#9d174d', '#334155'
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewLabelColor(color)}
                        className={`group relative w-7 h-7 rounded-full transition-all duration-200 ${newLabelColor === color ? 'ring-2 ring-primary-accent ring-offset-2 scale-110' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                      >
                        {newLabelColor === color && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <IoCheckmarkCircle className="text-white drop-shadow-sm" size={12} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1 group">
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="Label-Name (z.B. Hohe Priorität, VIP)"
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
                      <span>{t('common.add') || 'Add'}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* List of Labels */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <IoList className="text-gray-400" /> {t('labels.existing') || 'Existing Labels'}
                    {labels.length > 0 && <span className="text-xs font-normal text-gray-400">({labels.length})</span>}
                  </h4>
                </div>

                {labels.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {labels.map((labelItem, idx) => {
                      const labelName = typeof labelItem === 'object' ? labelItem.name : labelItem
                      const labelColor = typeof labelItem === 'object' ? labelItem.color : '#22c55e'
                      return (
                        <div
                          key={`${labelName}-${idx}`}
                          className="group flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all animate-in fade-in slide-in-from-left-2"
                          style={{ borderLeft: `4px solid ${labelColor}` }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="px-3 py-1 rounded-full text-white text-xs font-bold shadow-sm"
                              style={{ backgroundColor: labelColor }}
                            >
                              {labelName}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setNewLabel(labelName)
                                setNewLabelColor(labelColor)
                              }}
                              className="p-1.5 text-gray-400 hover:text-primary-accent hover:bg-gray-100 rounded-lg transition-colors"
                              title={t('common.edit')}
                            >
                              <IoPencil size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteLabel(labelName)
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title={t('common.delete')}
                            >
                              <IoTrashOutline size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <IoPricetag size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-sm text-gray-500 font-medium">{t('auto.auto_32f56b8a') || 'Noch keine benutzerdefinierten Labels erstellt'}</p>
                    <p className="text-xs text-gray-400 mt-1">Beginnen Sie oben mit dem {t('common.add') || 'Add'} von Labels</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setIsManageLabelsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-primary-accent transition-colors"
                >
                  {t('common.close') || 'Close'}
                </button>
              </div>
            </div>
          </Modal>

          {/* Import Leads Modal */}
          <Modal
            isOpen={isImportModalOpen}
            onClose={() => {
              setIsImportModalOpen(false)
              setSelectedFile(null)
              setIsDragging(false)
            }}
            title="t('leads.import')"
            size="md"
          >
            <div className="space-y-4">
              <div
                onDragOver={handleDragOverFile}
                onDragLeave={handleDragLeaveFile}
                onDrop={handleDropFile}
                onClick={() => document.getElementById('file-input')?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isDragging
                  ? 'border-primary-accent bg-primary-accent/10'
                  : selectedFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-primary-accent hover:bg-gray-50'
                  }`}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <IoDownload className={`mx-auto mb-2 ${selectedFile ? 'text-green-500' : 'text-gray-400'}`} size={32} />
                {selectedFile ? (
                  <>
                    <p className="text-sm font-medium text-primary-text mb-1">Datei ausgewählt:</p>
                    <p className="text-sm text-primary-text mb-1">{selectedFile.name}</p>
                    <p className="text-xs text-secondary-text">Klicken zum Ändern der Datei</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-secondary-text mb-1">{t('csv.drag_drop') || 'Drag CSV file here or click to browse'}</p>
                    <p className="text-xs text-secondary-text">Unterstützt: CSV, XLS, XLSX</p>
                  </>
                )}
              </div>

              {selectedFile && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>{t('auto.auto_ae21d822') || 'File:'}</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsImportModalOpen(false)
                    setSelectedFile(null)
                    setIsDragging(false)
                  }}
                  className="flex-1"
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImportLeads}
                  disabled={!selectedFile}
                  className="flex-1"
                >
                  {t('common.import') || 'Import'}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Bulk Email Modal */}
          <Modal
            isOpen={isBulkEmailModalOpen}
            onClose={() => setIsBulkEmailModalOpen(false)}
            title={`Massen-E-Mail an ${selectedLeads.length} Leads`}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Empfänger ({selectedLeads.length} ausgewählt)
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                  {leads.filter(l => selectedLeads.includes(l.id)).map(lead => (
                    <div key={lead.id} className="text-sm text-secondary-text">
                      {lead.personName} &lt;{lead.email}&gt;
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  E-Mail-Vorlage
                </label>
                <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none">
                  <option>Vorlage auswählen...</option>
                  <option>{t('leads.templates.follow_up') || 'Nachfass-E-Mail'}</option>
                  <option>{t('leads.templates.proposal') || 'Angebot gesendet'}</option>
                  <option>{t('leads.templates.negotiation') || 'Verhandlung'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Betreff
                </label>
                <Input
                  placeholder={t('auto.auto_ba86aa52') || "E-Mail-Betreff eingeben"}
                  defaultValue="Nachfassung zu Ihrer Anfrage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Nachricht
                </label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                  placeholder={t('auto.auto_0d466f15') || "Ihre Nachricht eingeben..."}
                  defaultValue="Sehr geehrte/r {{lead.name}},&#10;&#10;Vielen Dank für Ihr Interesse..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsBulkEmailModalOpen(false)}
                  className="flex-1"
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    alert(`E-Mail erfolgreich an ${selectedLeads.length} Leads gesendet!`)
                    setIsBulkEmailModalOpen(false)
                    setSelectedLeads([])
                  }}
                  className="flex-1"
                >
                  E-Mail senden
                </Button>
              </div>
            </div>
          </Modal>

          {/* Create Task Modal */}
          <TaskFormModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            onSave={() => {
              if (selectedLead) fetchLeadTasks(selectedLead.id)
            }}
            relatedToType="lead"
            relatedToId={selectedLead?.id}
            companyId={companyId}
            labels={labels}
          />

          {/* Send Email Modal */}
          <Modal
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            title={`E-Mail senden an ${selectedLead?.personName || selectedLead?.companyName}`}
            size="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  An
                </label>
                <Input
                  value={selectedLead?.email || ''}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Vorlage
                </label>
                <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none">
                  <option>Vorlage auswählen...</option>
                  <option>{t('leads.templates.follow_up') || 'Nachfass-E-Mail'}</option>
                  <option>{t('leads.templates.contract') || 'Vertragsentwurf'}</option>
                </select>
              </div>
              <Input label="Betreff" placeholder={t('auto.auto_02771a43') || "E-Mail-Betreff"} />
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Nachricht
                </label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                  placeholder={t('auto.auto_b6d172bb') || "Ihre Nachricht..."}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="flex-1"
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    alert('E-Mail erfolgreich gesendet!')
                    setIsEmailModalOpen(false)
                  }}
                  className="flex-1"
                >
                  E-Mail senden
                </Button>
              </div>
            </div>
          </Modal>

          {/* Add/Edit Contact Modal */}
          <RightSideModal
            isOpen={isContactModalOpen || isEditContactModalOpen}
            onClose={() => {
              setIsContactModalOpen(false)
              setIsEditContactModalOpen(false)
              setSelectedContact(null)
            }}
            title={selectedContact ? 'Kontakt bearbeiten' : 'Kontakt hinzufügen'}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={contactFormData.name}
                  onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                  placeholder="Name des Kontakts"
                />
                <Input
                  label="Position"
                  value={contactFormData.job_title}
                  onChange={(e) => setContactFormData({ ...contactFormData, job_title: e.target.value })}
                  placeholder="z.B. Geschäftsführer"
                />
              </div>
              {/* Company ID - Hidden field (auto-set from session) */}
              <input type="hidden" name="company_id" value={companyId} />

              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Unternehmen
                </label>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none appearance-none bg-white"
                  value={contactFormData.client_id || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const comp = companies.find(c => String(c.id) === String(val));
                    setContactFormData({
                      ...contactFormData,
                      client_id: val,
                      company: comp ? (comp.name || comp.company_name) : ''
                    });
                  }}
                >
                  <option value="">Unternehmen auswählen</option>
                  {companies.map(comp => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name || comp.company_name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="E-Mail"
                type="email"
                value={contactFormData.email}
                onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Zugewiesener Benutzer
                </label>
                <select
                  value={contactFormData.assigned_user_id}
                  onChange={(e) => setContactFormData({ ...contactFormData, assigned_user_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  <option value="">Benutzer auswählen</option>
                  {employees.map(emp => (
                    <option key={emp.user_id || emp.id} value={emp.user_id || emp.id}>
                      {emp.name || emp.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Status
                </label>
                <select
                  value={contactFormData.status}
                  onChange={(e) => setContactFormData({ ...contactFormData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  <option value="Active">{t('common.status.active') || 'Aktiv'}</option>
                  <option value="Inactive">{t('common.status.inactive') || 'Inaktiv'}</option>
                  <option value="Archived">{t('common.status.archived') || 'Archiviert'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Notes
                </label>
                <textarea
                  value={contactFormData.notes}
                  onChange={(e) => setContactFormData({ ...contactFormData, notes: e.target.value })}
                  placeholder="Notizen hinzufügen..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsContactModalOpen(false)
                    setIsEditContactModalOpen(false)
                    setSelectedContact(null)
                  }}
                  className="px-4"
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveContact}
                  className="px-5 bg-primary-accent text-white hover:bg-primary-accent/90 shadow-sm"
                >
                  Kontakt {selectedContact ? 'aktualisieren' : 'erstellen'}
                </Button>
              </div>
            </div>
          </RightSideModal>

          {/* Add Event Modal */}
          <Modal
            isOpen={isAddEventModalOpen}
            onClose={() => {
              setIsAddEventModalOpen(false)
              setEventFormData({
                event_name: '',
                description: '',
                where: '',
                starts_on_date: new Date().toISOString().split('T')[0],
                starts_on_time: '09:00',
                ends_on_date: new Date().toISOString().split('T')[0],
                ends_on_time: '10:00',
                label_color: '#FF0000',
                status: 'Pending',
                employee_ids: [],
                client_ids: [],
                department_ids: [],
                host_id: userId || null,
              })
            }}
            title="Termin hinzufügen"
          >
            <div className="space-y-4">
              <Input
                label="Terminname *"
                value={eventFormData.event_name}
                onChange={(e) => setEventFormData({ ...eventFormData, event_name: e.target.value })}
              />
              <Input
                label="Ort *"
                value={eventFormData.where}
                onChange={(e) => setEventFormData({ ...eventFormData, where: e.target.value })}
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  rows={3}
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Datum *"
                  type="date"
                  value={eventFormData.starts_on_date}
                  onChange={(e) => {
                    const newDate = e.target.value
                    setEventFormData({
                      ...eventFormData,
                      starts_on_date: newDate,
                      ends_on_date: newDate
                    })
                  }}
                  required
                />
                <Input
                  label="Startzeit *"
                  type="time"
                  value={eventFormData.starts_on_time}
                  onChange={(e) => setEventFormData({ ...eventFormData, starts_on_time: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Enddatum *"
                  type="date"
                  value={eventFormData.ends_on_date}
                  onChange={(e) => setEventFormData({ ...eventFormData, ends_on_date: e.target.value })}
                  required
                />
                <Input
                  label="Endzeit *"
                  type="time"
                  value={eventFormData.ends_on_time}
                  onChange={(e) => setEventFormData({ ...eventFormData, ends_on_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">{t('attendance.status') || 'Status'}</label>
                <select
                  value={eventFormData.status}
                  onChange={(e) => setEventFormData({ ...eventFormData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  <option value="Pending">{t('attendance.status.pending') || 'Wartend'}</option>
                  <option value="Confirmed">Bestätigt</option>
                  <option value="Cancelled">{t('attendance.status.cancelled') || 'Storniert'}</option>
                  <option value="Completed">{t('attendance.status.completed') || 'Abgeschlossen'}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddEventModalOpen(false)
                    setEventFormData({
                      event_name: '',
                      description: '',
                      where: '',
                      starts_on_date: new Date().toISOString().split('T')[0],
                      starts_on_time: '09:00',
                      ends_on_date: new Date().toISOString().split('T')[0],
                      ends_on_time: '10:00',
                      label_color: '#FF0000',
                      status: 'Pending',
                      employee_ids: [],
                      department_ids: [],
                      host_id: userId || null,
                    })
                  }}
                  className="flex-1"
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button variant="primary" onClick={handleAddEvent} className="flex-1">{t("common.add_event")}</Button>
              </div>
            </div>
          </Modal>

          {/* Bulk Update Modal - RiceCRM Style */}
          <BulkUpdateModal
            isOpen={isBulkUpdateModalOpen}
            onClose={() => setIsBulkUpdateModalOpen(false)}
            selectedCount={selectedLeads.length}
            entityType="leads"
            options={{
              employees: employees,
              sources: sources
            }}
            onUpdate={async (updateType, updateValue) => {
              try {
                if (updateType === 'delete') {
                  // Bulk delete
                  await handleBulkAction('delete', {})
                } else {
                  // Bulk update
                  await handleBulkAction('update', {
                    field: updateType,
                    value: updateValue
                  })
                }
                showNotification('success', 'Success', `Successfully updated ${selectedLeads.length} leads`)
                setSelectedLeads([])
              } catch (error) {
                showNotification('error', 'Error', error.message || 'Failed to update leads')
                throw error
              }
            }}
          />

          {/* Notification Modal - RiceCRM Style Centered Popup */}
          <NotificationModal
            isOpen={notification.isOpen}
            onClose={() => setNotification({ ...notification, isOpen: false })}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            autoClose={true}
            autoCloseDelay={3000}
          />


        </div>
      </div>
    )
  )
}

export default Leads
