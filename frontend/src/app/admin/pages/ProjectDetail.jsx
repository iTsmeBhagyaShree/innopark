import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsAPI, tasksAPI, documentsAPI, timeTrackingAPI, expensesAPI, employeesAPI, notesAPI, notificationsAPI, invoicesAPI, paymentsAPI, contractsAPI, usersAPI, eventsAPI } from '../../../api'
import EventsSection from '../../../components/shared/EventsSection'
import Timer from '../../../components/ui/Timer'
import Card from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import { useSettings } from '../../../context/SettingsContext'
import { useLanguage } from '../../../context/LanguageContext'
import {
  FormRow,
  FormSection,
  FormInput,
  FormSelect,
  FormCheckbox,
  FormActions
} from '../../../components/ui/FormRow'
import RichTextEditor from '../../../components/ui/RichTextEditor'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import RightSideModal from '../../../components/ui/RightSideModal'
import TaskFormModal from '../../../components/ui/TaskFormModal'
import {
  IoArrowBack,
  IoPerson,
  IoAdd,
  IoCreate,
  IoTrash,
  IoCheckmarkCircle,
  IoDocumentText,
  IoChatbubble,
  IoTime,
  IoChevronDown,
  IoSearch,
  IoFilter,
  IoGrid,
  IoPersonAdd,
  IoPrint,
  IoDownload,
  IoEye,
  IoClose,
  IoFileTray,
  IoStar,
  IoHelpCircle,
  IoBriefcase,
  IoCash,
  IoReceipt,
  IoList,
  IoEllipsisVertical,
  IoGlobe,
  IoBookmark,
  IoNotifications,
  IoSettings,
  IoStopwatch,
  IoCopy,
  IoCheckmark,
  IoBan,
  IoPlay,
  IoStop,
  IoFlag,
  IoCalendarOutline,
  IoMail,
  IoLocation,
  IoOpenOutline,
  IoPricetag
} from 'react-icons/io5'

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { settings } = useSettings() // Get settings for primary color
  const { t, language } = useLanguage()
  const [project, setProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerElapsedTime, setTimerElapsedTime] = useState(0)
  const [timerStartTime, setTimerStartTime] = useState(null)
  const timerIntervalRef = useRef(null)

  // Data states
  const [tasks, setTasks] = useState([])
  const [tasksKanban, setTasksKanban] = useState({ todo: [], doing: [], review: [], done: [] })
  const [milestones, setMilestones] = useState([])
  const [notes, setNotes] = useState([])
  const [files, setFiles] = useState([])
  const [comments, setComments] = useState([])
  const [timesheets, setTimesheets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [contracts, setContracts] = useState([])
  const [members, setMembers] = useState([])
  const [activities, setActivities] = useState([])
  const [employees, setEmployees] = useState([])

  // Loading states
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingMilestones, setLoadingMilestones] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [loadingContracts, setLoadingContracts] = useState(false)

  // Timesheet Modal State
  const [isAddTimesheetModalOpen, setIsAddTimesheetModalOpen] = useState(false)
  const [isViewTimesheetModalOpen, setIsViewTimesheetModalOpen] = useState(false)
  const [selectedTimesheet, setSelectedTimesheet] = useState(null)

  // Kanban Drag State
  const [draggedTask, setDraggedTask] = useState(null)
  const [kanbanColumns, setKanbanColumns] = useState([
    { id: 'Incomplete', label: 'To do', color: 'bg-orange-500', count: 0 },
    { id: 'Doing', label: 'In Bearbeitung', color: 'bg-blue-500', count: 0 },
    { id: 'Done', label: 'Done', color: 'bg-green-500', count: 0 },
  ])

  // Task Management State
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [taskLabels, setTaskLabels] = useState(['Bug', 'Design', 'Enhancement', 'Feedback'])

  // Task Form Data
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    points: '1',
    assign_to: '',
    collaborators: [],
    status: 'Incomplete',
    priority: 'Medium',
    labels: [],
    start_date: '',
    deadline: '',
    is_recurring: false,
    recurring_frequency: 'daily',
    uploaded_file: null,
  })

  const taskColumns = [
    {
      header: 'Code',
      accessor: 'code',
      key: 'code',
      className: 'font-medium text-gray-900 w-24'
    },
    {
      header: 'Task',
      accessor: 'title',
      key: 'title',
      className: 'font-medium text-gray-900 min-w-[200px]',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-primary-text">{row.title}</div>
          {row.deadline && (
            <div className={`text-xs flex items-center gap-1 mt-0.5 ${new Date(row.deadline) < new Date() ? 'text-red-600 font-medium' : 'text-secondary-text'}`}>
              <IoCalendarOutline size={12} />
              {new Date(row.deadline) < new Date() ? 'Overdue: ' : 'Due: '}
              {new Date(row.deadline).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Assigned To',
      accessor: 'assigned_to',
      key: 'assigned_to',
      render: (value, row) => (
        <div className="flex -space-x-2 overflow-hidden">
          {row.assigned_to && row.assigned_to.length > 0 ? (
            row.assigned_to.map((assignee, idx) => (
              <div key={idx} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs font-medium" title={assignee.name || assignee.email}>
                {assignee.avatar || (assignee.name ? assignee.name.charAt(0).toUpperCase() : 'U')}
              </div>
            ))
          ) : (
            <span className="text-gray-400 text-xs italic">Unassigned</span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      key: 'status',
      render: (value, row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.status === 'Done' ? 'bg-green-100 text-green-800' :
          row.status === 'Doing' ? 'bg-blue-100 text-blue-800' :
            'bg-orange-100 text-orange-800'
          }`}>
          {row.status === 'Incomplete' ? 'To do' : row.status === 'Doing' ? 'In Bearbeitung' : row.status}
        </span>
      )
    },
    {
      header: 'Action',
      accessor: 'id',
      key: 'id',
      className: 'text-right',
      render: (value, row) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => { setSelectedTask(row); setIsEditTaskModalOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
            <IoCreate size={16} />
          </button>
          <button onClick={() => handleDeleteTask(row)} className="p-1 text-red-600 hover:bg-red-50 rounded">
            <IoTrash size={16} />
          </button>
        </div>
      )
    }
  ]
  const [loadingTimesheets, setLoadingTimesheets] = useState(false)
  const [loadingExpenses, setLoadingExpenses] = useState(false)

  // Modals
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [isViewNoteModalOpen, setIsViewNoteModalOpen] = useState(false)
  const [viewingNote, setViewingNote] = useState(null)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [isViewExpenseModalOpen, setIsViewExpenseModalOpen] = useState(false)
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false)
  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false)
  const [isAddFileModalOpen, setIsAddFileModalOpen] = useState(false)
  const [isAddCommentModalOpen, setIsAddCommentModalOpen] = useState(false)
  const [isViewCommentModalOpen, setIsViewCommentModalOpen] = useState(false)
  const [selectedComment, setSelectedComment] = useState(null)
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false)
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false)
  const [isViewInvoiceModalOpen, setIsViewInvoiceModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false)
  const [isViewPaymentModalOpen, setIsViewPaymentModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [isAddContractModalOpen, setIsAddContractModalOpen] = useState(false)
  const [isViewContractModalOpen, setIsViewContractModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false)
  const [reminders, setReminders] = useState([])
  const [reminderFormData, setReminderFormData] = useState({
    title: '',
    description: '',
    reminder_date: '',
    reminder_time: ''
  })
  const [settingsFormData, setSettingsFormData] = useState({
    public_gantt_chart: 'enable',
    public_task_board: 'enable',
    task_approval: 'disable'
  })

  // Form data
  const [memberFormData, setMemberFormData] = useState({
    userId: ''
  })

  const [noteFormData, setNoteFormData] = useState({
    title: '',
    content: '',
    category: '',
    labels: [],
    is_public: true,
    color: '#3b82f6',
    file: null
  })

  // Note categories and labels
  const noteCategories = ['General', 'Meeting', 'Research', 'Important', 'Follow-up', 'Other']
  const noteLabels = ['Urgent', 'Important', 'Review', 'Completed', 'Pending']
  const noteColors = ['#3b82f6', '#22c55e', '#ef4444', '#f97316', '#8b5cf6', '#ec4899', '#64748b']

  // Files tab state
  const [filesActiveTab, setFilesActiveTab] = useState('list')
  const [fileCategories] = useState(['Documents', 'Images', 'Spreadsheets', 'Presentations', 'Others'])
  const [fileSearchQuery, setFileSearchQuery] = useState('')

  // Timesheets sub-tab state
  const [timesheetSubTab, setTimesheetSubTab] = useState('details')
  const [timesheetFilters, setTimesheetFilters] = useState({
    member: '',
    task: '',
    startDate: '',
    endDate: ''
  })

  // Comment input state
  const [newComment, setNewComment] = useState('')
  const [commentFile, setCommentFile] = useState(null)

  const [milestoneFormData, setMilestoneFormData] = useState({
    title: '',
    due_date: '',
    description: ''
  })

  const [fileFormData, setFileFormData] = useState({
    title: '',
    file: null,
    description: ''
  })

  const [commentFormData, setCommentFormData] = useState({
    content: ''
  })

  const [timesheetFormData, setTimesheetFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: ''
  })

  const [expenseFormData, setExpenseFormData] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    title: '',
    description: '',
    employee_id: '',
    tax: '',
    secondTax: '',
    isRecurring: false,
  })

  const [invoiceFormData, setInvoiceFormData] = useState({
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    status: 'unpaid',
    note: ''
  })

  const [paymentFormData, setPaymentFormData] = useState({
    invoice_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    transaction_id: '',
    remarks: ''
  })

  const [contractFormData, setContractFormData] = useState({
    subject: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    contract_value: '',
    contract_type: '',
    description: ''
  })


  useEffect(() => {
    if (id) {
      fetchProject()
      fetchProjects()
    }
  }, [id])

  useEffect(() => {
    if (project && id) {
      const tab = activeTab.toLowerCase()
      if (tab === 'tasks list' || tab === 'tasks kanban') {
        fetchTasks()
      } else if (tab === 'milestones') {
        fetchMilestones()
      } else if (tab === 'notes') {
        fetchNotes()
      } else if (tab === 'files') {
        fetchFiles()
      } else if (tab === 'comments') {
        fetchComments()
      } else if (tab === 'timesheets') {
        fetchTimesheets()
      } else if (tab === 'expenses') {
        fetchExpenses()
      } else if (tab === 'invoices') {
        fetchInvoices()
      } else if (tab === 'payments') {
        fetchPayments()
        fetchInvoices()
      } else if (tab === 'contracts') {
        fetchContracts()
      } else if (tab === 'overview') {
        fetchTasks()
        fetchMembers()
        fetchActivities()
        fetchTimesheets()
        fetchExpenses()
        fetchNotes()
      }
    }
  }, [project, activeTab, id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await projectsAPI.getById(id, { company_id: companyId })
      if (response.data.success) {
        const projectData = response.data.data
        setProject({
          id: projectData.id,
          name: projectData.project_name || '',
          code: projectData.short_code || '',
          description: projectData.description || '',
          startDate: projectData.start_date || '',
          deadline: projectData.deadline || '',
          status: projectData.status || 'In Bearbeitung',
          progress: projectData.progress || 0,
          budget: projectData.budget || null,
          label: projectData.label || '',
          clientName: projectData.client_name || '',
          clientId: projectData.client_id || '',
          projectManager: projectData.project_manager_name || '',
          members: projectData.members || [],
        })

        // Set members
        setMembers(projectData.members || [])
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await projectsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        const fetchedProjects = response.data.data || []
        const transformedProjects = fetchedProjects.map(p => ({
          id: p.id,
          name: p.project_name || '',
          status: p.status || 'In Bearbeitung',
          label: p.label || '',
          clientName: p.client_name || '',
        }))
        setProjects(transformedProjects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true)
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await tasksAPI.getAll({ project_id: id, company_id: companyId })
      if (response.data.success) {
        const fetchedTasks = response.data.data || []
        setTasks(fetchedTasks)

        // Organize tasks for Kanban
        const kanbanTasks = {
          todo: fetchedTasks.filter(t => t.status === 'Incomplete' || t.status === 'incomplete'),
          doing: fetchedTasks.filter(t => t.status === 'Doing' || t.status === 'doing'),
          review: fetchedTasks.filter(t => t.status === 'Review' || t.status === 'review'),
          done: fetchedTasks.filter(t => t.status === 'Done' || t.status === 'done' || t.status === 'Complete' || t.status === 'complete'),
        }
        setTasksKanban(kanbanTasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
    } finally {
      setLoadingTasks(false)
    }
  }

  const fetchMilestones = async () => {
    try {
      setLoadingMilestones(true)
      // Fetch milestones as tasks with milestone type
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await tasksAPI.getAll({
        company_id: companyId,
        project_id: id
      })
      if (response.data.success) {
        // Filter tasks that are milestones (task_category = 'milestone')
        const milestoneTasks = (response.data.data || []).filter(task =>
          task.task_category === 'milestone'
        )
        setMilestones(milestoneTasks)
      }
    } catch (error) {
      console.error('Error fetching milestones:', error)
      setMilestones([])
    } finally {
      setLoadingMilestones(false)
    }
  }

  const fetchNotes = async () => {
    try {
      setLoadingNotes(true)
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await notesAPI.getAll({
        company_id: companyId,
        project_id: id
      })
      if (response.data.success) {
        setNotes(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
      setNotes([])
    } finally {
      setLoadingNotes(false)
    }
  }

  const fetchFiles = async () => {
    try {
      setLoadingFiles(true)
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await documentsAPI.getAll({ project_id: id, company_id: companyId })
      if (response.data && response.data.success) {
        setFiles(response.data.data || [])
      } else {
        setFiles([])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      setFiles([])
    } finally {
      setLoadingFiles(false)
    }
  }

  const fetchComments = async () => {
    try {
      setLoadingComments(true)
      // Comments are stored as notes with a specific type
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await notesAPI.getAll({
        company_id: companyId,
        project_id: id
      })
      if (response.data && response.data.success) {
        // Filter notes that are comments (you can add a type field or use title/content to identify)
        const commentsList = response.data.data || []
        setComments(commentsList)
      } else {
        setComments([])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      setComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  const fetchTimesheets = async () => {
    try {
      setLoadingTimesheets(true)
      if (!id) {
        console.error('Project id is missing for fetchTimesheets')
        setTimesheets([])
        return
      }
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchTimesheets:', companyId)
        setTimesheets([])
        return
      }

      // Ensure params are properly constructed
      const params = {
        project_id: parseInt(id, 10),
        company_id: companyId
      }

      console.log('Fetching timesheets with params:', params)

      const response = await timeTrackingAPI.getAll(params)
      if (response.data && response.data.success) {
        setTimesheets(response.data.data || [])
      } else {
        setTimesheets([])
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error)
      console.error('Error response:', error.response?.data)
      console.error('Request URL:', error.config?.url)
      console.error('Request params:', error.config?.params)
      setTimesheets([])
    } finally {
      setLoadingTimesheets(false)
    }
  }

  const fetchExpenses = async () => {
    try {
      setLoadingExpenses(true)
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await expensesAPI.getAll({ project_id: id, company_id: companyId })
      if (response.data && response.data.success) {
        setExpenses(response.data.data || [])
      } else {
        setExpenses([])
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      setExpenses([])
    } finally {
      setLoadingExpenses(false)
    }
  }

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true)
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await invoicesAPI.getAll({ project_id: id, company_id: companyId })
      if (response.data && response.data.success) {
        setInvoices(response.data.data || [])
      } else {
        setInvoices([])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setInvoices([])
    } finally {
      setLoadingInvoices(false)
    }
  }

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true)
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await paymentsAPI.getAll({ project_id: id, company_id: companyId })
      if (response.data && response.data.success) {
        setPayments(response.data.data || [])
      } else {
        setPayments([])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      setPayments([])
    } finally {
      setLoadingPayments(false)
    }
  }

  const fetchContracts = async () => {
    try {
      setLoadingContracts(true)
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await contractsAPI.getAll({ project_id: id, company_id: companyId })
      if (response.data && response.data.success) {
        setContracts(response.data.data || [])
      } else {
        setContracts([])
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
      setContracts([])
    } finally {
      setLoadingContracts(false)
    }
  }



  const fetchMembers = async () => {
    try {
      if (project && project.members) {
        setMembers(project.members)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const fetchActivities = async () => {
    try {
      // Activities API might not exist, so create mock activities from tasks
      const activitiesList = []
      if (tasks.length > 0) {
        tasks.slice(0, 10).forEach(task => {
          activitiesList.push({
            id: task.id,
            type: 'task_added',
            user: 'John Doe',
            time: new Date().toLocaleString(),
            description: `Added Task: #${task.code || task.id} - ${task.title}`
          })
        })
      }
      setActivities(activitiesList)
    } catch (error) {
      console.error('Error fetching activities:', error)
      setActivities([])
    }
  }

  const filteredProjects = projects.filter(p => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'completed') return p.status === 'completed'
    if (activeFilter === 'high priority') return p.label === 'High Priority' || p.label === 'Urgent'
    if (activeFilter === 'open') return p.status === 'In Bearbeitung' || p.status === 'doing' || p.status === 'open'
    return true
  }).filter(p => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return p.name?.toLowerCase().includes(query)
  })

  // Calculate task stats
  const taskStats = {
    todo: tasks.filter(t => t.status === 'Incomplete' || t.status === 'incomplete').length,
    doing: tasks.filter(t => t.status === 'Doing' || t.status === 'doing').length,
    review: tasks.filter(t => t.status === 'Review' || t.status === 'review').length,
    done: tasks.filter(t => t.status === 'Done' || t.status === 'done' || t.status === 'Complete' || t.status === 'complete').length,
  }

  // Calculate total hours worked
  const totalHoursWorked = timesheets.reduce((sum, ts) => sum + parseFloat(ts.hours || 0), 0)

  const handleUpdateStatus = async (newStatus) => {
    if (!project) return

    try {
      const response = await projectsAPI.update(project.id, { status: newStatus })
      if (response.data.success) {
        alert(`Project marked as ${newStatus}`)
        fetchProject()
      }
    } catch (error) {
      console.error('Error updating project status:', error)
      alert('Failed to update project status')
    }
    setIsActionsDropdownOpen(false)
  }

  const handleCloneProject = async () => {
    if (!project) return

    try {
      const cloneData = {
        ...project,
        project_name: `${project.name} (Copy)`,
        short_code: `${project.code}-COPY`,
      }
      delete cloneData.id

      const response = await projectsAPI.create(cloneData)
      if (response.data.success) {
        alert('Project cloned successfully!')
        navigate(`/app/admin/projects/${response.data.data.id}`)
      }
    } catch (error) {
      console.error('Error cloning project:', error)
      alert('Failed to clone project')
    }
    setIsActionsDropdownOpen(false)
  }

  const handleStartTimer = async () => {
    const now = Date.now()
    setTimerStartTime(now)
    setIsTimerRunning(true)
    setTimerElapsedTime(0)

    // Start interval for real-time updates
    timerIntervalRef.current = setInterval(() => {
      setTimerElapsedTime((prev) => {
        const elapsed = Math.floor((Date.now() - now) / 1000)
        return elapsed
      })
    }, 1000)

    try {
      // Optionally save timer start to backend
      if (project?.id) {
        // await timeTrackingAPI.startTimer({ project_id: project.id })
      }
    } catch (error) {
      console.error('Error starting timer:', error)
    }
  }

  const handleStopTimer = async () => {
    setIsTimerRunning(false)
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    const hours = (timerElapsedTime / 3600).toFixed(2)

    try {
      // Save time entry to backend
      if (project?.id && timerElapsedTime > 0) {
        const storedUser = localStorage.getItem('user')
        let userId = null
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            userId = userData.id
          } catch (e) {
            console.error('Error parsing user data:', e)
          }
        }

        if (userId) {
          await timeTrackingAPI.create({
            user_id: userId,
            project_id: project.id,
            hours: parseFloat(hours),
            date: new Date().toISOString().split('T')[0],
            description: `Timer entry for project: ${project.name}`
          })
          alert(`Timer stopped. ${hours} hours logged.`)
          // Refresh timesheets
          fetchTimesheets()
        }
      }
    } catch (error) {
      console.error('Error stopping timer:', error)
      alert('Failed to save time entry')
    }

    setTimerElapsedTime(0)
    setTimerStartTime(null)
  }

  const formatTimerTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Cleanup timer interval on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  const fetchEmployees = async () => {
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await employeesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setEmployees(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setEmployees([])
    }
  }

  // Fetch employees when modal opens
  useEffect(() => {
    if (isAddMemberModalOpen) {
      fetchEmployees()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddMemberModalOpen])

  const handleAddMember = async () => {
    if (!memberFormData.userId) {
      alert('Please select a member')
      return
    }

    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const userId = parseInt(memberFormData.userId)

      // Get current members and add new one
      const currentMemberIds = members.map(m => m.id || m.user_id).filter(Boolean)

      // Check if member already exists
      if (currentMemberIds.includes(userId)) {
        alert('This member is already added to the project')
        return
      }

      // Add new member to the list
      const updatedMembers = [...currentMemberIds, userId]

      // Update project with new members list
      const response = await projectsAPI.update(id, {
        project_members: updatedMembers
      }, { company_id: companyId })

      if (response.data.success) {
        alert('Member added successfully!')
        setIsAddMemberModalOpen(false)
        setMemberFormData({ userId: '' })
        await fetchProject()
      } else {
        alert(response.data.error || t('projects.members.add_member_error'))
      }
    } catch (error) {
      console.error('Error adding member:', error)
      alert(error.response?.data?.error || t('projects.members.add_member_error'))
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!userId) return
    if (!window.confirm('Are you sure you want to remove this member from the project?')) return

    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)

      // Get current members and remove the one being deleted
      const currentMemberIds = members.map(m => m.id || m.user_id).filter(Boolean)
      const updatedMembers = currentMemberIds.filter(id => id !== userId)

      // Update project with new members list
      const response = await projectsAPI.update(id, {
        project_members: updatedMembers
      }, { company_id: companyId })

      if (response.data.success) {
        alert('Member removed successfully!')
        await fetchProject()
      } else {
        alert(response.data.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert(error.response?.data?.error || 'Failed to remove member')
    }
  }

  // Fetch employees for task assignment
  const fetchEmployeesForTasks = async () => {
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await employeesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setFilteredEmployees(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setFilteredEmployees([])
    }
  }

  // Load employees when task modal opens
  useEffect(() => {
    if (isAddTaskModalOpen || isEditTaskModalOpen) {
      if (filteredEmployees.length === 0) {
        fetchEmployeesForTasks()
      }
    }
  }, [isAddTaskModalOpen, isEditTaskModalOpen, filteredEmployees.length])

  const handleAdd = () => {
    setTaskFormData({
      title: '',
      description: '',
      points: '1',
      assign_to: '',
      collaborators: [],
      status: 'Incomplete',
      priority: 'Medium',
      labels: [],
      start_date: new Date().toISOString().split('T')[0],
      deadline: '',
      is_recurring: false,
      recurring_frequency: 'daily',
      uploaded_file: null,
    })
    setIsAddTaskModalOpen(true)
  }

  const handleEditTaskWrapper = (task) => {
    setSelectedTask(task)
    setTaskFormData({
      title: task.title || '',
      description: task.description || '',
      points: task.points?.toString() || '1',
      assign_to: task.assigned_to && task.assigned_to.length > 0 ? task.assigned_to[0].id : '',
      collaborators: task.collaborators ? task.collaborators.map(c => c.id || c.user_id || c) : [],
      status: task.status || 'Incomplete',
      priority: task.priority || 'Medium',
      labels: task.tags || [],
      start_date: task.start_date ? task.start_date.split('T')[0] : '',
      deadline: task.deadline ? task.deadline.split('T')[0] : (task.due_date ? task.due_date.split('T')[0] : ''),
      is_recurring: task.is_recurring || false,
      recurring_frequency: task.recurring_frequency || 'daily',
      uploaded_file: null,
    })
    setIsEditTaskModalOpen(true)
  }

  const handleDeleteTask = async (task) => {
    if (window.confirm(`Are you sure you want to delete ${task.title}?`)) {
      try {
        const response = await tasksAPI.delete(task.id)
        if (response.data.success) {
          alert('Task deleted successfully!')
          await fetchTasks()
        } else {
          alert(response.data.error || 'Failed to delete task')
        }
      } catch (error) {
        console.error('Error deleting task:', error)
        alert(error.response?.data?.error || 'Failed to delete task')
      }
    }
  }

  const handleSaveTask = async () => {
    const trimmedTitle = taskFormData.title?.trim()

    if (!trimmedTitle) {
      alert('Title is required')
      return
    }

    if (!taskFormData.assign_to) {
      alert('Please assign task to an employee')
      return
    }

    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)

      const collaboratorsArray = Array.isArray(taskFormData.collaborators)
        ? taskFormData.collaborators.map(c => parseInt(c))
        : []

      const taskData = {
        company_id: companyId,
        title: trimmedTitle,
        description: taskFormData.description || null,
        project_id: parseInt(id), // Force current project ID
        points: taskFormData.points ? parseInt(taskFormData.points) || 1 : 1,
        assign_to: taskFormData.assign_to ? parseInt(taskFormData.assign_to) || null : null,
        collaborators: collaboratorsArray,
        status: taskFormData.status || 'Incomplete',
        priority: taskFormData.priority || 'Medium',
        labels: Array.isArray(taskFormData.labels) ? taskFormData.labels : [],
        start_date: taskFormData.start_date || null,
        deadline: taskFormData.deadline || null,
        due_date: taskFormData.deadline || null,
        is_recurring: taskFormData.is_recurring || false,
        recurring_frequency: taskFormData.is_recurring ? taskFormData.recurring_frequency : null,

        // Mapped fields
        assigned_to: taskFormData.assign_to ? [parseInt(taskFormData.assign_to)] : [],
        tags: Array.isArray(taskFormData.labels) ? taskFormData.labels : [],
      }

      let response;
      const isEditing = isEditTaskModalOpen && selectedTask

      if (taskFormData.uploaded_file) {
        const formDataWithFile = new FormData()
        Object.keys(taskData).forEach(key => {
          if (Array.isArray(taskData[key])) {
            formDataWithFile.append(key, JSON.stringify(taskData[key]))
          } else if (taskData[key] !== null && taskData[key] !== undefined) {
            formDataWithFile.append(key, taskData[key])
          }
        })
        formDataWithFile.append('file', taskFormData.uploaded_file)

        if (isEditing) {
          response = await tasksAPI.updateWithFile(selectedTask.id, formDataWithFile)
        } else {
          response = await tasksAPI.createWithFile(formDataWithFile)
        }
      } else {
        if (isEditing) {
          response = await tasksAPI.update(selectedTask.id, taskData)
        } else {
          response = await tasksAPI.create(taskData)
        }
      }

      if (response.data.success) {
        alert(isEditing ? 'Task updated successfully!' : 'Task created successfully!')
        await fetchTasks()
        setIsAddTaskModalOpen(false)
        setIsEditTaskModalOpen(false)
        setSelectedTask(null)
      } else {
        alert(response.data.error || (isEditing ? 'Failed to update task' : 'Failed to create task'))
      }
    } catch (error) {
      console.error('Error saving task:', error)
      alert(error.response?.data?.error || error.message || 'Failed to save task')
    }
  }

  // Kanban Handlers
  const getTasksByStatus = (status) => {
    return tasks.filter(task => {
      // Normalize statuses
      const s = task.status?.toLowerCase() || ''
      const target = status?.toLowerCase() || ''
      if (target === 'incomplete') return s === 'incomplete' || s === 'to do' || s === 'pending'
      if (target === 'doing') return s === 'doing' || s === 'Doing' || s === 'In Bearbeitung'
      if (target === 'done') return s === 'done' || s === 'completed'
      return s === target
    })
  }

  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.target.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedTask(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault()
    if (!draggedTask) return
    if (draggedTask.status === targetStatus) return

    try {
      const response = await tasksAPI.update(draggedTask.id, { status: targetStatus })
      if (response.data.success) {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === draggedTask.id ? { ...t, status: targetStatus } : t))
        await fetchTasks()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
    setDraggedTask(null)
  }

  const fetchReminders = async () => {
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const userId = parseInt(localStorage.getItem('userId') || 1, 10)
      const response = await notificationsAPI.getAll({
        company_id: companyId,
        user_id: userId,
        type: 'reminder',
        related_entity_type: 'project',
        related_entity_id: id
      })
      if (response.data.success) {
        setReminders(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching reminders:', error)
      setReminders([])
    }
  }

  useEffect(() => {
    if (isRemindersModalOpen && id) {
      fetchReminders()
    }
  }, [isRemindersModalOpen, id])

  useEffect(() => {
    if (project) {
      setSettingsFormData({
        public_gantt_chart: project.public_gantt_chart || 'enable',
        public_task_board: project.public_task_board || 'enable',
        task_approval: project.task_approval || 'disable'
      })
    }
  }, [project])

  const handleAddReminder = async () => {
    if (!reminderFormData.title) {
      alert('Reminder title is required')
      return
    }

    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const userId = parseInt(localStorage.getItem('userId') || 1, 10)

      let reminderMessage = reminderFormData.description || `Reminder for project ${project?.name || id}`
      if (reminderFormData.reminder_date) {
        const reminderDate = new Date(reminderFormData.reminder_date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
        const reminderTime = reminderFormData.reminder_time || ''
        const dateTimeStr = reminderTime ? `${reminderDate} at ${reminderTime}` : reminderDate
        reminderMessage = `${reminderMessage}\n\nDue: ${dateTimeStr}`
      }

      const reminderPayload = {
        company_id: companyId,
        user_id: userId,
        type: 'reminder',
        title: reminderFormData.title,
        message: reminderMessage,
        related_entity_type: 'project',
        related_entity_id: parseInt(id),
        created_by: userId
      }

      const response = await notificationsAPI.create(reminderPayload)
      if (response.data.success) {
        alert('Reminder created successfully!')
        setIsRemindersModalOpen(false)
        setReminderFormData({ title: '', description: '', reminder_date: '', reminder_time: '' })
        await fetchReminders()
      } else {
        alert(response.data.error || 'Failed to create reminder')
      }
    } catch (error) {
      console.error('Error creating reminder:', error)
      alert(error.response?.data?.error || 'Failed to create reminder')
    }
  }

  const handleDeleteReminder = async (reminderId) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) {
      return
    }

    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await notificationsAPI.delete(reminderId, { company_id: companyId })
      if (response.data.success) {
        alert('Reminder deleted successfully!')
        await fetchReminders()
      } else {
        alert(response.data.error || 'Failed to delete reminder')
      }
    } catch (error) {
      console.error('Error deleting reminder:', error)
      alert(error.response?.data?.error || 'Failed to delete reminder')
    }
  }

  const handleSaveSettings = async () => {
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const response = await projectsAPI.update(id, {
        public_gantt_chart: settingsFormData.public_gantt_chart,
        public_task_board: settingsFormData.public_task_board,
        task_approval: settingsFormData.task_approval
      }, { company_id: companyId })

      if (response.data.success) {
        alert('Settings saved successfully!')
        setIsSettingsModalOpen(false)
        await fetchProject()
      } else {
        alert(response.data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(error.response?.data?.error || 'Failed to save settings')
    }
  }

  const handleAddNote = async () => {
    if (!noteFormData.content) {
      alert('Please enter a note')
      return
    }

    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const userId = parseInt(localStorage.getItem('userId') || 1, 10)

      const noteData = {
        company_id: companyId,
        user_id: userId,
        project_id: parseInt(id),
        title: noteFormData.title || 'Project Note',
        content: noteFormData.content
      }

      let response
      if (selectedNote) {
        // Update existing note
        response = await notesAPI.update(selectedNote.id, noteData)
        if (response.data.success) {
          alert('Note updated successfully!')
        }
      } else {
        // Create new note
        response = await notesAPI.create(noteData)
        if (response.data.success) {
          alert('Note added successfully!')
        }
      }

      if (response.data.success) {
        setIsAddNoteModalOpen(false)
        setNoteFormData({ title: '', content: '' })
        setSelectedNote(null)
        await fetchNotes()
      } else {
        alert(response.data.error || 'Failed to save note')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      alert(error.response?.data?.error || 'Failed to save note')
    }
  }

  const handleEditNote = (note) => {
    setNoteFormData({
      title: note.title || '',
      content: note.content || note.note || ''
    })
    setSelectedNote(note)
    setIsAddNoteModalOpen(true)
  }

  const handleDeleteNote = async (note) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return
    }
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      await notesAPI.delete(note.id, { company_id: companyId })
      alert('Note deleted successfully!')
      await fetchNotes()
    } catch (error) {
      console.error('Error deleting note:', error)
      alert(error.response?.data?.error || 'Failed to delete note')
    }
  }

  const handleViewNote = (note) => {
    setViewingNote(note)
    setIsViewNoteModalOpen(true)
  }

  // Helper function to render HTML content safely (strip tags for preview, render for full view)
  const renderHTMLContent = (htmlContent) => {
    if (!htmlContent) return '-'
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="prose prose-sm max-w-none" />
  }

  const stripHTMLTags = (html) => {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').trim()
  }

  const handleDownloadFile = (file) => {
    if (file.file_path || file.url) {
      window.open(file.file_path || file.url, '_blank')
    } else {
      alert('File path not available')
    }
  }

  const handleDeleteFile = async (file) => {
    if (!window.confirm(`Are you sure you want to delete file "${file.name || file.file_name || file.id}"?`)) {
      return
    }
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      await documentsAPI.delete(file.id, { company_id: companyId })
      alert('File deleted successfully!')
      await fetchFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
      alert(error.response?.data?.error || 'Failed to delete file')
    }
  }

  const handleDeleteExpense = async (expense) => {
    if (!window.confirm(`Are you sure you want to delete expense "${expense.expense_number || expense.id}"?`)) {
      return
    }
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      await expensesAPI.delete(expense.id, { company_id: companyId })
      alert('Expense deleted successfully!')
      await fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert(error.response?.data?.error || 'Failed to delete expense')
    }
  }

  const handleDeleteInvoice = async (invoice) => {
    if (!window.confirm(`Are you sure you want to delete invoice "${invoice.invoice_number || invoice.id}"?`)) {
      return
    }
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      await invoicesAPI.delete(invoice.id, { company_id: companyId })
      alert('Invoice deleted successfully!')
      await fetchInvoices()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert(error.response?.data?.error || 'Failed to delete invoice')
    }
  }

  const handleDeletePayment = async (payment) => {
    if (!window.confirm(`Are you sure you want to delete payment "${payment.id}"?`)) {
      return
    }
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      await paymentsAPI.delete(payment.id, { company_id: companyId })
      alert('Payment deleted successfully!')
      await fetchPayments()
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert(error.response?.data?.error || 'Failed to delete payment')
    }
  }

  const handleDeleteContract = async (contract) => {
    if (!window.confirm(`Are you sure you want to delete contract "${contract.subject || contract.id}"?`)) {
      return
    }
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      await contractsAPI.delete(contract.id, { company_id: companyId })
      alert('Contract deleted successfully!')
      await fetchContracts()
    } catch (error) {
      console.error('Error deleting contract:', error)
      alert(error.response?.data?.error || 'Failed to delete contract')
    }
  }

  const handleViewComment = (comment) => {
    setSelectedComment(comment)
    setIsViewCommentModalOpen(true)
  }

  const handleViewTimesheet = (timesheet) => {
    setSelectedTimesheet(timesheet)
    setIsViewTimesheetModalOpen(true)
  }

  const handleDeleteTimesheet = async (timesheet) => {
    if (!window.confirm(`Are you sure you want to delete this timesheet entry?`)) {
      return
    }
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      await timeTrackingAPI.delete(timesheet.id, { company_id: companyId })
      alert('Timesheet deleted successfully!')
      await fetchTimesheets()
    } catch (error) {
      console.error('Error deleting timesheet:', error)
      alert(error.response?.data?.error || 'Failed to delete timesheet')
    }
  }

  // Export to Excel (CSV format)
  const handleExportTimesheets = () => {
    const filteredData = timesheets.filter(ts => {
      if (timesheetFilters.member && ts.user_id != timesheetFilters.member) return false
      if (timesheetFilters.task && ts.task_id != timesheetFilters.task) return false
      return true
    })

    if (filteredData.length === 0) {
      alert('No data to export')
      return
    }

    const headers = ['Member', 'Task', 'Start Time', 'End Time', 'Hours', 'Note']
    const rows = filteredData.map(ts => [
      ts.user_name || ts.employee_name || 'User',
      ts.task_title || ts.task_name || '-',
      ts.start_time ? new Date(ts.start_time).toLocaleString() : '-',
      ts.end_time ? new Date(ts.end_time).toLocaleString() : '-',
      parseFloat(ts.hours || 0).toFixed(2),
      ts.description || ts.note || '-'
    ])

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `timesheets_${project?.name || 'project'}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Print timesheets
  const handlePrintTimesheets = () => {
    const filteredData = timesheets.filter(ts => {
      if (timesheetFilters.member && ts.user_id != timesheetFilters.member) return false
      if (timesheetFilters.task && ts.task_id != timesheetFilters.task) return false
      return true
    })

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Timesheets - ${project?.name || 'Project'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>Timesheets - ${project?.name || 'Project'}</h1>
          <p>Total Entries: ${filteredData.length} | Total Hours: ${filteredData.reduce((sum, ts) => sum + parseFloat(ts.hours || 0), 0).toFixed(2)}h</p>
          <table>
            <thead>
              <tr><th>Member</th><th>Task</th><th>Start</th><th>End</th><th>Hours</th><th>Note</th></tr>
            </thead>
            <tbody>
              ${filteredData.map(ts => `
                <tr>
                  <td>${ts.user_name || ts.employee_name || 'User'}</td>
                  <td>${ts.task_title || ts.task_name || '-'}</td>
                  <td>${ts.start_time ? new Date(ts.start_time).toLocaleString() : '-'}</td>
                  <td>${ts.end_time ? new Date(ts.end_time).toLocaleString() : '-'}</td>
                  <td>${parseFloat(ts.hours || 0).toFixed(2)}h</td>
                  <td>${ts.description || ts.note || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleDeleteMilestone = async (milestone) => {
    if (!window.confirm(`Are you sure you want to delete milestone "${milestone.title || milestone.id}"?`)) {
      return
    }
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      await tasksAPI.delete(milestone.id, { company_id: companyId })
      alert('Milestone deleted successfully!')
      await fetchMilestones()
    } catch (error) {
      console.error('Error deleting milestone:', error)
      alert(error.response?.data?.error || 'Failed to delete milestone')
    }
  }



  const handleViewExpense = (expense) => {
    setSelectedExpense(expense)
    setIsViewExpenseModalOpen(true)
  }

  const handleEditExpense = (expense) => {
    setExpenseFormData({
      expense_number: expense.expense_number || '',
      category: expense.category || '',
      amount: expense.total || expense.amount || '',
      description: expense.description || '',
      status: expense.status || 'Pending'
    })
    setSelectedExpense(expense)
    setIsAddExpenseModalOpen(true)
  }

  const handleAddMilestone = async () => {
    if (!milestoneFormData.title) {
      alert('Milestone title is required')
      return
    }

    try {
      // Milestones can be stored as tasks with a special type or in a separate table
      // For now, we'll create a task with milestone type
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const userId = parseInt(localStorage.getItem('userId') || 1, 10)

      const taskData = {
        company_id: companyId,
        project_id: parseInt(id),
        title: milestoneFormData.title,
        description: milestoneFormData.description || '',
        due_date: milestoneFormData.due_date || null,
        status: 'Incomplete',
        priority: 'High',
        task_category: 'milestone',
        created_by: userId
      }

      const response = await tasksAPI.create(taskData, { company_id: companyId })
      if (response.data.success) {
        alert('Milestone added successfully!')
        setIsAddMilestoneModalOpen(false)
        setMilestoneFormData({ title: '', due_date: '', description: '' })
        await fetchMilestones()
      } else {
        alert(response.data.error || 'Failed to add milestone')
      }
    } catch (error) {
      console.error('Error adding milestone:', error)
      alert(error.response?.data?.error || 'Failed to add milestone')
    }
  }

  const handleAddFile = async () => {
    if (!fileFormData.file) {
      alert('Please select a file')
      return
    }

    // Validate file object
    if (!(fileFormData.file instanceof File) && !(fileFormData.file instanceof Blob)) {
      alert('Invalid file selected. Please select a valid file.')
      return
    }

    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const formData = new FormData()

      // Ensure file is properly appended - this is critical for multer
      formData.append('file', fileFormData.file, fileFormData.file.name)

      // Add other fields
      if (fileFormData.title) {
        formData.append('title', fileFormData.title)
      }
      if (fileFormData.description) {
        formData.append('description', fileFormData.description)
      }
      // Add company_id to formData as well (some backends expect it in body)
      formData.append('company_id', companyId.toString())

      console.log('Uploading file:', {
        fileName: fileFormData.file.name,
        fileSize: fileFormData.file.size,
        fileType: fileFormData.file.type,
        companyId: companyId,
        projectId: id
      })

      const response = await projectsAPI.uploadFile(id, formData, { company_id: companyId })
      if (response.data && response.data.success) {
        alert('File uploaded successfully!')
        setIsAddFileModalOpen(false)
        setFileFormData({ title: '', file: null, description: '' })
        await fetchFiles()
      } else {
        alert(response.data?.error || t('common.save_failed'))
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        config: error.config
      })
      alert(error.response?.data?.error || error.response?.data?.message || t('common.save_failed'))
    }
  }

  const handleAddComment = async () => {
    if (!commentFormData.content) {
      alert('Please enter a comment')
      return
    }

    try {
      // Comments can be stored as notes or in a separate comments table
      // For now, we'll use notes API with a comment type
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const userId = parseInt(localStorage.getItem('userId') || 1, 10)

      const noteData = {
        company_id: companyId,
        user_id: userId,
        project_id: parseInt(id),
        title: 'Comment',
        content: commentFormData.content
      }

      const response = await notesAPI.create(noteData)
      if (response.data.success) {
        alert('Comment added successfully!')
        setIsAddCommentModalOpen(false)
        setCommentFormData({ content: '' })
        await fetchComments()
      } else {
        alert(response.data.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      alert(error.response?.data?.error || 'Failed to add comment')
    }
  }

  const handleAddTimesheet = async () => {
    // Validate hours
    const hoursValue = parseFloat(timesheetFormData.hours)
    if (!timesheetFormData.hours || isNaN(hoursValue) || hoursValue <= 0) {
      alert('Please enter valid hours (must be greater than 0)')
      return
    }

    // Validate member selection
    if (!timesheetFormData.user_id || timesheetFormData.user_id === '') {
      alert('Please select a member')
      return
    }

    // Validate project ID
    const projectId = parseInt(id, 10)
    if (!id || isNaN(projectId) || projectId <= 0) {
      alert('Invalid project ID: ' + id)
      return
    }

    try {
      const companyId = parseInt(localStorage.getItem('companyId') || '1', 10)
      const userId = parseInt(timesheetFormData.user_id, 10)

      // Validate userId is a valid number
      if (isNaN(userId) || userId <= 0) {
        alert('Please select a valid member. Selected: ' + timesheetFormData.user_id)
        return
      }

      // Extract date from start_time or use today
      let dateValue = new Date().toISOString().split('T')[0]
      if (timesheetFormData.start_time) {
        dateValue = new Date(timesheetFormData.start_time).toISOString().split('T')[0]
      } else if (timesheetFormData.date) {
        dateValue = timesheetFormData.date
      }

      // Ensure date is valid
      if (!dateValue || dateValue === 'Invalid Date') {
        dateValue = new Date().toISOString().split('T')[0]
      }

      const timesheetData = {
        company_id: companyId,
        user_id: userId,
        project_id: projectId,
        task_id: timesheetFormData.task_id ? parseInt(timesheetFormData.task_id, 10) : null,
        date: dateValue,
        hours: hoursValue,
        description: timesheetFormData.description || ''
      }

      // Debug: Log the exact data being sent
      console.log('Sending timesheet data:', JSON.stringify(timesheetData, null, 2))

      const response = await timeTrackingAPI.create(timesheetData)
      if (response.data.success) {
        alert('Time logged successfully!')
        setIsAddTimesheetModalOpen(false)
        setTimesheetFormData({ date: new Date().toISOString().split('T')[0], hours: '', description: '', user_id: '', task_id: '', start_time: '', end_time: '' })
        await fetchTimesheets()
      } else {
        alert(response.data.error || 'Failed to add timesheet')
      }
    } catch (error) {
      console.error('Error adding timesheet:', error)
      console.error('Error response:', error.response?.data)
      alert(error.response?.data?.error || 'Failed to add timesheet')
    }
  }

  const handleAddExpense = async () => {
    if (!expenseFormData.title) {
      alert('Expense title is required')
      return
    }
    if (!expenseFormData.amount || parseFloat(expenseFormData.amount) <= 0) {
      alert('Valid amount is required')
      return
    }

    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const userId = parseInt(localStorage.getItem('userId') || 1, 10)

      // Create expense item from form data
      const expenseItem = {
        item_name: expenseFormData.title,
        description: expenseFormData.description || expenseFormData.title,
        quantity: 1,
        unit: 'Pcs',
        unit_price: parseFloat(expenseFormData.amount),
        tax: null,
        tax_rate: 0,
        amount: parseFloat(expenseFormData.amount)
      }

      const expenseData = {
        company_id: companyId,
        project_id: parseInt(id),
        lead_id: null,
        description: expenseFormData.title,
        note: expenseFormData.description || '',
        category: expenseFormData.category || 'General',
        expense_date: expenseFormData.date || new Date().toISOString().split('T')[0],
        currency: 'USD',
        discount: 0,
        discount_type: '%',
        valid_till: expenseFormData.date || null,
        items: [expenseItem],
        require_approval: 1,
        created_by: userId
      }

      const response = await expensesAPI.create(expenseData)
      if (response.data.success) {
        alert('Expense added successfully!')
        setIsAddExpenseModalOpen(false)
        setExpenseFormData({ title: '', amount: '', date: new Date().toISOString().split('T')[0], category: '', description: '' })
        await fetchExpenses()
      } else {
        alert(response.data.error || 'Failed to add expense')
      }
    } catch (error) {
      console.error('Error adding expense:', error)
      alert(error.response?.data?.error || 'Failed to add expense')
    }
  }

  const handleOpenAddInvoice = () => {
    if (project) {
      setInvoiceFormData(prev => ({
        ...prev,
        client_id: project.clientId || '',
        // You might want to pre-fill other available data here if necessary
      }));
    }
    setIsAddInvoiceModalOpen(true);
  }

  const handleAddInvoice = async () => {
    if (!invoiceFormData.client_id) {
      alert('Please select a client')
      return
    }
    if (!invoiceFormData.due_date) {
      alert(`${t('common.please_enter')} ${t('projects.activity.invoices.due_date')}`)
      return
    }
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const userId = parseInt(localStorage.getItem('userId') || 1, 10)
      const invoiceData = {
        company_id: companyId,
        user_id: userId,
        created_by: userId,
        project_id: parseInt(id),
        client_id: parseInt(invoiceFormData.client_id),
        invoice_number: invoiceFormData.invoice_number || `INV-${Date.now()}`,
        bill_date: invoiceFormData.issue_date,
        invoice_date: invoiceFormData.issue_date,
        due_date: invoiceFormData.due_date,
        total: parseFloat(invoiceFormData.amount) || 0,
        status: invoiceFormData.status || 'unpaid',
        note: invoiceFormData.note || null
      }
      const response = await invoicesAPI.create(invoiceData)
      if (response.data.success) {
        alert('Invoice created successfully!')
        setIsAddInvoiceModalOpen(false)
        setInvoiceFormData({
          invoice_number: '',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: '',
          client_id: '',
          amount: '',
          status: 'unpaid',
          note: ''
        })
        fetchInvoices()
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert(error.response?.data?.error || 'Failed to create invoice')
    }
  }

  const handleAddPayment = async () => {
    if (!paymentFormData.invoice_id) {
      alert('Please select an invoice')
      return
    }
    if (!paymentFormData.amount || parseFloat(paymentFormData.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    if (!paymentFormData.payment_method) {
      alert('Please select a payment method')
      return
    }
    try {
      const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      const userId = parseInt(localStorage.getItem('userId') || 1, 10)
      const paymentData = {
        company_id: companyId,
        user_id: userId,
        invoice_id: parseInt(paymentFormData.invoice_id),
        amount: parseFloat(paymentFormData.amount),
        payment_date: paymentFormData.payment_date,
        payment_method: paymentFormData.payment_method,
        transaction_id: paymentFormData.transaction_id || null,
        note: paymentFormData.remarks || null
      }
      const response = await paymentsAPI.create(paymentData)
      if (response.data.success) {
        alert('Payment added successfully!')
        setIsAddPaymentModalOpen(false)
        setPaymentFormData({
          invoice_id: '',
          amount: '',
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'bank_transfer',
          transaction_id: '',
          remarks: ''
        })
        fetchPayments()
        fetchInvoices() // Refresh invoices to update paid amounts
      }
    } catch (error) {
      console.error('Error adding payment:', error)
      alert(error.response?.data?.error || 'Failed to add payment')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-primary-text">Loading...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-primary-text">Project not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-gray-50 w-full">
      {/* Main Content - Full Page Layout (No Sidebar) */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Action Bar */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => navigate('/app/admin/projects')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <IoArrowBack size={20} />
              </button>

              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{project.name}</h1>
                <button className="p-1 hover:bg-gray-100 rounded-lg flex-shrink-0">
                  <IoStar size={18} className="text-gray-400" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => setIsRemindersModalOpen(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-800 hover:text-white hover:border-gray-800 transition-all duration-200"
              >
                <IoNotifications size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t('projects.reminders')}</span>
              </button>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-800 hover:text-white hover:border-gray-800 transition-all duration-200"
              >
                <IoSettings size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t('projects.settings')}</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsActionsDropdownOpen(!isActionsDropdownOpen)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-800 hover:text-white hover:border-gray-800 transition-all duration-200"
                >
                  <IoEllipsisVertical size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t('projects.actions.title')}</span>
                  <IoChevronDown size={12} />
                </button>
                {isActionsDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => handleUpdateStatus('completed')}
                      className="w-full px-4 py-2 text-left text-sm text-primary-text hover:bg-gray-100 flex items-center gap-2"
                    >
                      <IoCheckmark size={16} />
                      {t('projects.actions.mark_completed')}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('on hold')}
                      className="w-full px-4 py-2 text-left text-sm text-primary-text hover:bg-gray-100 flex items-center gap-2"
                    >
                      <IoBan size={16} />
                      {t('projects.actions.mark_hold')}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('cancelled')}
                      className="w-full px-4 py-2 text-left text-sm text-primary-text hover:bg-gray-100 flex items-center gap-2"
                    >
                      <IoBan size={16} />
                      {t('projects.actions.mark_cancelled')}
                    </button>
                    <button
                      onClick={handleCloneProject}
                      className="w-full px-4 py-2 text-left text-sm text-primary-text hover:bg-gray-100 flex items-center gap-2"
                    >
                      <IoCopy size={16} />
                      {t('projects.actions.clone')}
                    </button>
                    <button
                      onClick={() => navigate(`/app/admin/projects?edit=${project.id}`)}
                      className="w-full px-4 py-2 text-left text-sm text-primary-text hover:bg-gray-100 flex items-center gap-2"
                    >
                      <IoCreate size={16} />
                      {t('projects.actions.edit')}
                    </button>
                    <button
                      onClick={handleOpenAddInvoice}
                      className="w-full px-4 py-2 text-left text-sm text-primary-text hover:bg-gray-100 flex items-center gap-2"
                    >
                      <IoReceipt size={16} />
                      {t('projects.actions.create_invoice')}
                    </button>
                  </div>
                )}
              </div>
              {/* Real-time Timer */}
              <div className="flex items-center gap-2">
                {isTimerRunning && (
                  <div className="text-sm font-mono font-semibold text-primary-text bg-primary-accent/10 px-3 py-1.5 rounded-lg">
                    {formatTimerTime(timerElapsedTime)}
                  </div>
                )}
                {isTimerRunning ? (
                  <button
                    onClick={handleStopTimer}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
                  >
                    <IoStop size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{t('common.stop')}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartTimer}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-accent text-white hover:bg-primary-accent/90 transition-all duration-200"
                  >
                    <IoPlay size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{t('common.start')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Project Header Info */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary-text">{t('projects.status.start_date')}:</span>
              <span className="text-sm font-medium text-primary-text">{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary-text">{t('projects.status.deadline')}:</span>
              <span className={`text-sm font-medium ${project.deadline && new Date(project.deadline) < new Date() ? 'text-red-600' : 'text-primary-text'}`}>
                {project.deadline ? new Date(project.deadline).toLocaleDateString() : '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary-text">{t('projects.status.status')}:</span>
              <Badge className={`text-xs ${project.status === 'completed' ? 'bg-green-100 text-green-800' :
                project.status === 'In Bearbeitung' || project.status === 'open' ? 'bg-blue-100 text-blue-800' :
                  project.status === 'on hold' ? 'bg-yellow-100 text-yellow-800' :
                    project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                }`}>
                {project.status === 'In Bearbeitung' || project.status === 'doing' ? t('common.status.in_progress') : project.status}
              </Badge>
            </div>
            {project.label && (
              <Badge className={`text-xs ${project.label === 'Urgent' ? 'bg-purple-100 text-purple-800' :
                project.label === 'On track' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                {project.label === 'Urgent' ? t('projects.status.urgent') :
                project.label === 'On track' ? t('projects.status.on_track') :
                  project.label}
              </Badge>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 overflow-x-auto -mx-3 sm:-mx-4 px-3 sm:px-4" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9',
            WebkitOverflowScrolling: 'touch'
          }}>
            {['Overview', 'Tasks List', 'Tasks Kanban', 'Notes', 'Files', 'Comments', 'Timesheets', 'Invoices', 'Payments', 'Expenses', 'Contracts', 'Events'].map((tabLabel) => {
              const tabKey = tabLabel.toLowerCase();
              const translationKey = tabKey.replace(' ', '_');
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 min-w-fit ${activeTab === tabKey
                    ? 'border-primary-accent text-primary-accent'
                    : 'border-transparent text-secondary-text hover:text-primary-text'
                    }`}
                >
                  {t(`projects.tabs.${translationKey}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 w-full min-w-0 max-w-full" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9'
        }}>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Progress & Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Progress Circle Card */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex flex-col items-center">
                      {/* Circular Progress */}
                      <div className="relative w-36 h-36 mb-6">
                        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="#e5e7eb"
                            strokeWidth="10"
                            fill="none"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="#3b82f6"
                            strokeWidth="10"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 42 * (project.progress / 100)} ${2 * Math.PI * 42}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold text-gray-900">{project.progress}%</span>
                        </div>
                      </div>

                      {/* Project Info */}
                      <div className="w-full space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('projects.status.start_date')}:</span>
                          <span className="font-medium text-gray-900">
                            {project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('projects.status.deadline')}:</span>
                          <span className={`font-medium ${project.deadline && new Date(project.deadline) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                            {project.deadline ? new Date(project.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">{t('projects.status.status')}:</span>
                          <span className="text-gray-900 font-medium">
                            {project.status === 'In Bearbeitung' || project.status === 'doing' ? t('common.status.in_progress') : project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Task Distribution Donut Chart */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex flex-col items-center">
                      {/* Donut Chart */}
                      <div className="relative w-36 h-36 mb-6">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          {/* Background circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="20"
                          />
                          {/* Segments */}
                          {(() => {
                            const total = taskStats.todo + taskStats.doing + taskStats.review + taskStats.done || 1
                            const segments = [
                              { value: taskStats.todo, color: '#f97316', label: t('projects.stats.to_do') },
                              { value: taskStats.doing, color: '#3b82f6', label: t('common.status.in_progress') },
                              { value: taskStats.review, color: '#a855f7', label: t('projects.stats.review') },
                              { value: taskStats.done, color: '#22c55e', label: t('projects.stats.done') },
                            ]
                            let accumulatedPercent = 0
                            const circumference = 2 * Math.PI * 40

                            return segments.map((segment, idx) => {
                              const percent = (segment.value / total) * 100
                              const dashOffset = circumference * (1 - accumulatedPercent / 100)
                              const dashArray = `${(percent / 100) * circumference} ${circumference}`
                              accumulatedPercent += percent

                              return (
                                <circle
                                  key={idx}
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="none"
                                  stroke={segment.color}
                                  strokeWidth="20"
                                  strokeDasharray={dashArray}
                                  strokeDashoffset={dashOffset}
                                  transform="rotate(-90 50 50)"
                                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                                />
                              )
                            })
                          })()}
                        </svg>
                      </div>

                      {/* Legend */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
                          <span className="text-gray-600">{t('projects.stats.to_do')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                          <span className="text-gray-600">{t('projects.stats.in_progress')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-purple-500"></div>
                          <span className="text-gray-600">{t('projects.stats.review')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                          <span className="text-gray-600">{t('projects.stats.done')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Hours Worked Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                      <IoTime size={28} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{totalHoursWorked.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{t('projects.stats.total_hours')}</p>
                    </div>
                  </div>
                </div>

                {/* Project Members Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('projects.members.title')}</h3>
                    <button
                      onClick={() => setIsAddMemberModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <IoPersonAdd size={16} />
                      <span>{t('projects.members.add')}</span>
                    </button>
                  </div>
                  {members.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <IoPerson size={40} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">{t('projects.members.no_members')}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {members.map((member, idx) => (
                        <div key={member.id || member.user_id || idx} className="flex items-center gap-4 py-3 group">
                          {/* Profile Avatar */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-base font-bold text-gray-600 shadow-sm overflow-hidden">
                            {member.avatar || member.profile_image ? (
                              <img src={member.avatar || member.profile_image} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              member.name ? member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'
                            )}
                          </div>

                          {/* Name and Position */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{member.name || member.email}</p>
                            <p className="text-xs text-gray-500 truncate">{member.position || member.role || member.job_title || 'Team Member'}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {member.email && (
                              <a
                                href={`mailto:${member.email}`}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title={`Email ${member.name}`}
                              >
                                <IoMail size={18} />
                              </a>
                            )}
                            <button
                              onClick={() => handleRemoveMember && handleRemoveMember(member.id || member.user_id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove member"
                            >
                              <IoClose size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Activity Feed */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">{t('projects.activity.title')}</h3>

                  {tasks.length === 0 && notes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <IoDocumentText size={40} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">{t('projects.activity.no_activity')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                      {/* Generate activity from tasks */}
                      {tasks.slice(0, 10).map((task, idx) => {
                        // Use task creator name, or project client name, or Admin as fallback
                        const creatorName = task.created_by_name || task.assigned_to?.[0]?.name || project.clientName || 'Admin'
                        const getInitials = (name) => {
                          if (!name || name === 'Admin') return 'AD'
                          return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        }
                        const initials = getInitials(creatorName)
                        const createdDate = task.created_at ? new Date(task.created_at) : new Date()
                        const formattedDate = createdDate.toLocaleDateString() === new Date().toLocaleDateString()
                          ? `Today at ${createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                          : createdDate.toLocaleDateString()

                        return (
                          <div key={task.id || idx} className="flex gap-3">
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-xs font-semibold text-white">
                              {initials}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-900">{creatorName}</span>
                                <span className="text-xs text-gray-400">{formattedDate}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500 text-white">
                                  Added
                                </span>
                                <span className="text-sm text-gray-700 truncate">
                                  Task: #{task.code || task.id} - {task.title}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {/* Show notes as activity */}
                      {notes.slice(0, 5).map((note, idx) => {
                        // Use note creator name, or project client name, or Admin as fallback
                        const creatorName = note.created_by_name || note.user_name || project.clientName || 'Admin'
                        const getInitials = (name) => {
                          if (!name || name === 'Admin') return 'AD'
                          return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        }
                        const initials = getInitials(creatorName)
                        const createdDate = note.created_at ? new Date(note.created_at) : new Date()
                        const formattedDate = createdDate.toLocaleDateString() === new Date().toLocaleDateString()
                          ? `Today at ${createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                          : createdDate.toLocaleDateString()

                        return (
                          <div key={`note-${note.id || idx}`} className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-semibold text-white">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-900">{creatorName}</span>
                                <span className="text-xs text-gray-400">{formattedDate}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500 text-white">
                                  Note
                                </span>
                                <span className="text-sm text-gray-700 truncate">
                                  {note.title || note.content?.substring(0, 50) || t('projects.activity.added_note')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {activeTab === 'members' && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-primary-text">{t('projects.members.title')}</h3>
                <Button onClick={() => setIsAddMemberModalOpen(true)} className="flex items-center gap-2">
                  <IoPersonAdd size={16} /> {t('projects.members.add')}
                </Button>
              </div>
              {members.length === 0 ? (
                <div className="text-center py-12 text-secondary-text">
                  <IoPeople size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-base font-medium text-gray-900">No members assigned</p>
                  <p className="text-sm mt-1">{t('projects.members.add')}s to this project to start collaborating.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {members.map((member) => (
                    <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-4 hover:shadow-md transition-shadow group">
                      <div className="w-12 h-12 rounded-full bg-primary-accent/10 flex items-center justify-center text-primary-accent font-bold text-lg flex-shrink-0">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          (member.name || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate" title={member.name}>{member.name}</h4>
                        <p className="text-sm text-secondary-text truncate" title={member.email}>{member.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {t('projects.members.role_fallback')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember && handleRemoveMember(member.id || member.user_id)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title={t('projects.activity.remove_member')}
                      >
                        <IoClose size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {activeTab === 'tasks list' && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-primary-text">{t('projects.activity.tasks')}</h3>
                <Button onClick={() => handleAdd()} className="flex items-center gap-2">
                  <IoAdd size={16} /> {t('projects.activity.add_task')}
                </Button>
              </div>
              <DataTable
                columns={taskColumns}
                data={tasks}
                loading={loadingTasks}
                pagination
                searchable
                onSearch={(query) => {
                  const lower = query.toLowerCase()
                  return tasks.filter(t => t.title.toLowerCase().includes(lower) || t.code?.toLowerCase().includes(lower))
                }}
              />
            </Card>
          )}

          {activeTab === 'tasks kanban' && (
            <div className="overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 300px)' }}>
              <div className="flex gap-4 min-w-max px-2">
                {kanbanColumns.map(column => {
                  const columnTasks = getTasksByStatus(column.id)
                  return (
                    <div
                      key={column.id}
                      className="w-80 flex-shrink-0 bg-gray-50 rounded-lg p-3 border border-gray-200"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, column.id)}
                    >
                      <div className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${column.id === 'Incomplete' ? 'border-orange-400' : column.id === 'Doing' ? 'border-blue-400' : 'border-green-400'}`}>
                        <h4 className="font-semibold text-gray-700">{column.label}</h4>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                      </div>

                      <div className="space-y-3 min-h-[200px]">
                        {columnTasks.map(task => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleEditTaskWrapper(task)}
                            className={`bg-white p-3 rounded shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-mono text-gray-500">{task.code || `#${task.id}`}</span>
                              <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} title={`Priority: ${task.priority}`} />
                            </div>
                            <h5 className="font-medium text-gray-800 text-sm mb-2">{task.title}</h5>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <IoCalendarOutline />
                                {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                              </div>
                              <div className="flex -space-x-1">
                                {task.assigned_to && task.assigned_to.map((u, i) => (
                                  <div key={i} className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-700 ring-1 ring-white">
                                    {u.name ? u.name[0] : 'U'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add/Edit Task Modal - Using unified TaskFormModal */}
          <TaskFormModal
            isOpen={isAddTaskModalOpen || isEditTaskModalOpen}
            onClose={() => {
              setIsAddTaskModalOpen(false)
              setIsEditTaskModalOpen(false)
              setSelectedTask(null)
            }}
            task={isEditTaskModalOpen ? selectedTask : null}
            onSave={() => fetchTasks()}
            relatedToType="project"
            relatedToId={project?.id}
            companyId={project?.company_id}
          />



          {activeTab === 'notes' && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-lg font-semibold text-primary-text">{t('projects.activity.notes')}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 sm:flex-initial">
                    <input
                      type="text"
                      placeholder={t('projects.activity.search_notes')}
                      className="w-full sm:w-48 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-accent focus:border-primary-accent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  <button className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Excel</button>
                  <button className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    <IoPrint size={16} />
                  </button>
                  <Button onClick={() => { setSelectedNote(null); setNoteFormData({ title: '', content: '', category: '', labels: [], is_public: true, color: '#3b82f6', file: null }); setIsAddNoteModalOpen(true); }} className="flex items-center gap-2">
                    <IoAdd size={16} /> {t('projects.activity.add_note')}
                  </Button>
                </div>
              </div>
              {loadingNotes ? (
                <div className="text-center py-8 text-secondary-text">{t('common.loading')}</div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12 text-secondary-text">
                  <IoDocumentText size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-base font-medium text-gray-900">{t('projects.activity.no_notes')}</p>
                  <p className="text-sm mt-1">Create your first note to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Created Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">{t('projects.activity.files.title')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-secondary-text uppercase tracking-wider w-32">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {notes.filter(note => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        return (note.title || '').toLowerCase().includes(query) || (note.content || '').toLowerCase().includes(query);
                      }).map((note) => (
                        <tr key={note.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-secondary-text whitespace-nowrap">
                            {note.created_at ? new Date(note.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-8 rounded-full" style={{ backgroundColor: note.color || '#3b82f6' }}></div>
                              <div>
                                <p className="text-sm font-medium text-primary-text">{note.title || 'Untitled'}</p>
                                <p className="text-xs text-secondary-text truncate max-w-xs">{stripHTMLTags(note.content || '').substring(0, 50)}{stripHTMLTags(note.content || '').length > 50 ? '...' : ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="text-xs bg-gray-100 text-gray-700">{note.category || 'General'}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-text">
                            {note.file_name ? (
                              <div className="flex items-center gap-1 text-primary-accent">
                                <IoDocumentText size={14} />
                                <span className="text-xs">1 file</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${note.is_public ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {note.is_public ? t('projects.visibility.public') : t('projects.visibility.private')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleViewNote(note)} className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors" title="View">
                                <IoEye size={16} />
                              </button>
                              <button onClick={() => handleEditNote(note)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Edit">
                                <IoCreate size={16} />
                              </button>
                              <button onClick={() => handleDeleteNote(note)} className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors" title="Delete">
                                <IoTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'files' && (
            <Card className="p-0 overflow-hidden">
              {/* Files Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-primary-text">{t('projects.activity.files.title')}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 sm:flex-initial">
                      <input
                        type="text"
                        placeholder={t('projects.activity.files.search')}
                        className="w-full sm:w-48 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-accent focus:border-primary-accent"
                        value={fileSearchQuery}
                        onChange={(e) => setFileSearchQuery(e.target.value)}
                      />
                      <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                    <button className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Excel</button>
                    <button className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                      <IoPrint size={16} />
                    </button>
                    <Button onClick={() => setIsAddFileModalOpen(true)} className="flex items-center gap-2">
                      <IoAdd size={16} /> {t('projects.activity.files.add')}
                    </Button>
                  </div>
                </div>
                {/* Sub-tabs */}
                <div className="flex gap-1 border-b border-gray-200 -mx-4 px-4">
                  {['List', 'Folders', 'Category'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilesActiveTab(tab.toLowerCase().replace(' ', ''))}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${filesActiveTab === tab.toLowerCase().replace(' ', '')
                        ? 'border-primary-accent text-primary-accent'
                        : 'border-transparent text-secondary-text hover:text-primary-text'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              {/* Files Content */}
              {loadingFiles ? (
                <div className="text-center py-8 text-secondary-text">Loading...</div>
              ) : files.length === 0 ? (
                <div className="text-center py-12 text-secondary-text">
                  <IoFileTray size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-base font-medium text-gray-900">{t('projects.activity.files.no_files')}</p>
                  <p className="text-sm mt-1">Upload your first file to get started.</p>
                </div>
              ) : filesActiveTab === 'list' || filesActiveTab === 'fileslist' ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">{t('projects.activity.files.table.name')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">{t('projects.activity.files.table.category')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">{t('projects.activity.files.table.size')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">{t('projects.activity.files.table.uploaded_by')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">{t('projects.activity.files.table.upload_date')}</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-secondary-text uppercase tracking-wider w-32">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {files.filter(file => {
                        if (!fileSearchQuery) return true;
                        const query = fileSearchQuery.toLowerCase();
                        return (file.name || file.file_name || '').toLowerCase().includes(query);
                      }).map((file) => (
                        <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                (file.file_type || '').includes('pdf') ? 'bg-red-100 text-red-600' :
                                (file.file_type || '').includes('doc') ? 'bg-blue-100 text-blue-600' :
                                (file.file_type || '').includes('xls') ? 'bg-green-100 text-green-600' :
                                (file.file_type || '').match(/jpg|jpeg|png|gif/) ? 'bg-purple-100 text-purple-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                <IoDocumentText size={20} />
                              </div>
                              <span className="text-sm font-medium text-primary-text">{file.name || file.file_name || file.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="text-xs bg-gray-100 text-gray-700">{file.category || 'Documents'}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-text">{file.size || '-'}</td>
                          <td className="px-4 py-3 text-sm text-secondary-text">{file.user_name || 'Admin'}</td>
                          <td className="px-4 py-3 text-sm text-secondary-text whitespace-nowrap">
                            {file.created_at ? new Date(file.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleDownloadFile(file)} className="p-1.5 text-primary-accent hover:bg-primary-accent/10 rounded transition-colors" title="Download">
                                <IoDownload size={16} />
                              </button>
                              <button onClick={() => handleDeleteFile(file)} className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors" title="Delete">
                                <IoTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : filesActiveTab === 'folders' ? (
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {['Documents', 'Images', 'Spreadsheets', 'Presentations', 'Others'].map((folder) => {
                      const folderFiles = files.filter(f => (f.category || 'Documents') === folder);
                      return (
                        <div key={folder} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer text-center">
                          <IoFileTray size={40} className="mx-auto mb-2 text-yellow-500" />
                          <p className="text-sm font-medium text-primary-text">{t(`projects.activity.files.categories.${folder}`)}</p>
                          <p className="text-xs text-secondary-text">{t('projects.activity.files.files_count', { count: folderFiles.length })}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="space-y-4">
                    {['Documents', 'Images', 'Spreadsheets', 'Presentations', 'Others'].map((category) => {
                      const categoryFiles = files.filter(f => (f.category || 'Documents') === category);
                      if (categoryFiles.length === 0) return null;
                      return (
                        <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-primary-text">{category}</h4>
                            <Badge className="text-xs bg-primary-accent/10 text-primary-accent">{categoryFiles.length} files</Badge>
                          </div>
                          <div className="p-3 space-y-2">
                            {categoryFiles.map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <IoDocumentText size={16} className="text-gray-400" />
                                  <span className="text-sm text-primary-text">{file.name || file.file_name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleDownloadFile(file)} className="p-1 text-primary-accent hover:bg-primary-accent/10 rounded">
                                    <IoDownload size={14} />
                                  </button>
                                  <button onClick={() => handleDeleteFile(file)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                    <IoTrash size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'comments' && (
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-primary-text mb-4">{t('projects.activity.comments.title')}</h3>
              {/* Comment Input */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-accent/20 flex items-center justify-center text-sm font-semibold text-primary-accent flex-shrink-0">
                    {localStorage.getItem('userName')?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={t('projects.activity.comments.placeholder')}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-accent focus:border-primary-accent resize-none"
                      rows={3}
                    />
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => setCommentFile(e.target.files[0])}
                          />
                          <IoDocumentText size={16} />
                          <span>{t('common.upload')}</span>
                        </label>
                        {commentFile && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                            {commentFile.name}
                            <button onClick={() => setCommentFile(null)} className="text-red-500 hover:text-red-700">
                              <IoClose size={14} />
                            </button>
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={async () => {
                          if (!newComment.trim()) {
                            alert(t('common.error'));
                            return;
                          }
                          try {
                            const companyId = parseInt(localStorage.getItem('companyId') || 1, 10);
                            const userId = parseInt(localStorage.getItem('userId') || 1, 10);
                            await notesAPI.create({
                              company_id: companyId,
                              user_id: userId,
                              project_id: parseInt(id),
                              title: 'Comment',
                              content: newComment
                            });
                            setNewComment('');
                            setCommentFile(null);
                            await fetchComments();
                          } catch (error) {
                            console.error('Error posting comment:', error);
                            alert(error.response?.data?.error || t('common.error'));
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <IoChatbubble size={16} />
                        {t('projects.activity.comments.add')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Comments List */}
              {loadingComments ? (
                <div className="text-center py-8 text-secondary-text">{t('common.loading')}</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-secondary-text">
                  <IoChatbubble size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-base font-medium text-gray-900">{t('projects.activity.comments.no_comments')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="w-10 h-10 rounded-full bg-primary-accent/20 flex items-center justify-center text-sm font-semibold text-primary-accent flex-shrink-0">
                        {comment.user_name || comment.created_by_name ? (comment.user_name || comment.created_by_name).substring(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-primary-text">{comment.user_name || comment.created_by_name || 'User'}</p>
                          <p className="text-xs text-secondary-text">{comment.created_at ? new Date(comment.created_at).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                        </div>
                        <p className="text-sm text-secondary-text whitespace-pre-wrap">{comment.content || comment.comment}</p>
                        {(comment.file_name || comment.file_path) && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <IoDocumentText className="text-blue-600" size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-primary-text truncate">{comment.file_name || 'Attachment'}</p>
                                <p className="text-xs text-secondary-text">{t('projects.activity.files.title')}</p>
                              </div>
                              <button
                                onClick={() => {
                                  if (comment.file_path) {
                                    window.open(comment.file_path, '_blank')
                                  } else {
                                    alert(t('common.error'))
                                  }
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                <IoDownload size={14} />
                                {t('common.download')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={async () => {
                            if (window.confirm(t('common.confirmation.delete'))) {
                              try {
                                const companyId = parseInt(localStorage.getItem('companyId') || 1, 10);
                                await notesAPI.delete(comment.id, { company_id: companyId });
                                await fetchComments();
                              } catch (error) {
                                console.error('Error deleting comment:', error);
                                alert(error.response?.data?.error || t('common.error'));
                              }
                            }
                          }}
                          className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                          title={t('common.delete')}
                        >
                          <IoTrash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {activeTab === 'timesheets' && (
            <Card className="p-0 overflow-hidden">
              {/* Timesheets Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-primary-text">{t('projects.activity.timesheets.title')}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-accent"
                      value={timesheetFilters.member}
                      onChange={(e) => setTimesheetFilters({ ...timesheetFilters, member: e.target.value })}
                    >
                      <option value="">{t('common.all')}</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-accent"
                      value={timesheetFilters.task}
                      onChange={(e) => setTimesheetFilters({ ...timesheetFilters, task: e.target.value })}
                    >
                      <option value="">{t('projects.activity.tasks')}</option>
                      {tasks.map(task => (
                        <option key={task.id} value={task.id}>{task.title}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-accent"
                      value={timesheetFilters.startDate}
                      onChange={(e) => setTimesheetFilters({ ...timesheetFilters, startDate: e.target.value })}
                    />
                    <button
                      onClick={handleExportTimesheets}
                      className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                    >
                      <IoDownload size={14} />
                      Excel
                    </button>
                    <button
                      onClick={handlePrintTimesheets}
                      className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      title={t('common.print')}
                    >
                      <IoPrint size={16} />
                    </button>
                    <Button onClick={() => setIsAddTimesheetModalOpen(true)} className="flex items-center gap-2">
                      <IoAdd size={16} /> {t('projects.activity.timesheets.add')}
                    </Button>
                  </div>
                </div>
                {/* Sub-tabs */}
                <div className="flex gap-1 border-b border-gray-200 -mx-4 px-4">
                  {['Details', 'Summary', 'Chart', 'Daily Activity'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setTimesheetSubTab(tab.toLowerCase().replace(' ', ''))}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${timesheetSubTab === tab.toLowerCase().replace(' ', '')
                        ? 'border-primary-accent text-primary-accent'
                        : 'border-transparent text-secondary-text hover:text-primary-text'
                      }`}
                    >
                      {t(`projects.tabs.${tab.toLowerCase().replace(' ', '_')}`) || tab}
                    </button>
                   ))}
                </div>
              </div>
              {/* Content based on sub-tab */}
              {loadingTimesheets ? (
                <div className="text-center py-8 text-secondary-text">{t('common.loading')}</div>
              ) : timesheetSubTab === 'details' ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">{t('common.name')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">{t('projects.activity.tasks')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">{t('projects.status.start_date')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">{t('projects.status.deadline')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">{t('common.total')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">{t('common.note')}</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-secondary-text uppercase tracking-wider w-24">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {timesheets.filter(ts => {
                        if (timesheetFilters.member && ts.user_id != timesheetFilters.member) return false;
                        if (timesheetFilters.task && ts.task_id != timesheetFilters.task) return false;
                        return true;
                      }).map((ts) => (
                        <tr key={ts.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary-accent/20 flex items-center justify-center text-xs font-semibold text-primary-accent">
                                {(ts.user_name || 'U').substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-primary-text">{ts.user_name || ts.employee_name || 'User'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-text">{ts.task_title || ts.task_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-secondary-text whitespace-nowrap">
                            {ts.start_time ? new Date(ts.start_time).toLocaleString(language === 'de' ? 'de-DE' : 'en-US') : (ts.date ? new Date(ts.date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US') + ' 09:00' : '-')}
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-text whitespace-nowrap">
                            {ts.end_time ? new Date(ts.end_time).toLocaleString(language === 'de' ? 'de-DE' : 'en-US') : (ts.date && ts.hours ? new Date(ts.date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US') + ' ' + (9 + parseFloat(ts.hours)).toFixed(0) + ':00' : '-')}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm bg-green-100 text-green-700 px-2 py-1 rounded">{parseFloat(ts.hours || 0).toFixed(2)}h</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-text truncate max-w-xs">{ts.description || ts.note || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleViewTimesheet(ts)} className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors" title={t('common.view')}>
                                <IoEye size={16} />
                              </button>
                              <button onClick={() => handleEditTimesheet && handleEditTimesheet(ts)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors" title={t('common.edit')}>
                                <IoCreate size={16} />
                              </button>
                              <button onClick={() => handleDeleteTimesheet(ts)} className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors" title={t('common.delete')}>
                                <IoTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Total Summary */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-end gap-4">
                      <span className="text-sm font-medium text-secondary-text">{t('common.total')}:</span>
                      <span className="text-lg font-bold text-primary-accent">{timesheets.reduce((sum, ts) => sum + parseFloat(ts.hours || 0), 0).toFixed(2)}h</span>
                    </div>
                  </div>
                </div>
              ) : timesheetSubTab === 'summary' ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-600 font-medium">{t('projects.stats.total_hours')}</p>
                      <p className="text-2xl font-bold text-blue-700">{timesheets.reduce((sum, ts) => sum + parseFloat(ts.hours || 0), 0).toFixed(2)}h</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-sm text-green-600 font-medium">{t('common.total')}</p>
                      <p className="text-2xl font-bold text-green-700">{timesheets.length}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-sm text-purple-600 font-medium">Avg Hours/Day</p>
                      <p className="text-2xl font-bold text-purple-700">{timesheets.length > 0 ? (timesheets.reduce((sum, ts) => sum + parseFloat(ts.hours || 0), 0) / timesheets.length).toFixed(2) : '0.00'}h</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <p className="text-sm text-orange-600 font-medium">{t('projects.members.title')}</p>
                      <p className="text-2xl font-bold text-orange-700">{[...new Set(timesheets.map(ts => ts.user_id))].length}</p>
                    </div>
                  </div>
                  {/* By Member Summary */}
                  <h4 className="text-sm font-semibold text-primary-text mb-3">Hours by Member</h4>
                  <div className="space-y-2">
                    {Object.entries(timesheets.reduce((acc, ts) => {
                      const name = ts.user_name || ts.employee_name || 'Unknown';
                      acc[name] = (acc[name] || 0) + parseFloat(ts.hours || 0);
                      return acc;
                    }, {})).map(([name, hours]) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-primary-text">{name}</span>
                        <span className="text-sm font-mono bg-primary-accent/10 text-primary-accent px-2 py-1 rounded">{hours.toFixed(2)}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : timesheetSubTab === 'chart' ? (
                <div className="p-6">
                  <div className="text-center py-12 text-secondary-text">
                    <IoStopwatch size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-base font-medium text-gray-900">Time Distribution Chart</p>
                    <p className="text-sm mt-1">Visual representation of time logged</p>
                    {/* Simple bar chart representation */}
                    <div className="mt-6 max-w-md mx-auto space-y-3">
                      {Object.entries(timesheets.reduce((acc, ts) => {
                        const name = ts.user_name || ts.employee_name || 'Unknown';
                        acc[name] = (acc[name] || 0) + parseFloat(ts.hours || 0);
                        return acc;
                      }, {})).map(([name, hours]) => {
                        const maxHours = Math.max(...Object.values(timesheets.reduce((acc, ts) => {
                          const n = ts.user_name || ts.employee_name || 'Unknown';
                          acc[n] = (acc[n] || 0) + parseFloat(ts.hours || 0);
                          return acc;
                        }, {})));
                        const percentage = maxHours > 0 ? (hours / maxHours) * 100 : 0;
                        return (
                          <div key={name} className="text-left">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium">{name}</span>
                              <span>{hours.toFixed(2)}h</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div className="bg-primary-accent h-3 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-primary-text mb-4">Daily Activity</h4>
                  {timesheets.length === 0 ? (
                    <div className="text-center py-8 text-secondary-text">{t('projects.activity.timesheets.no_data')}</div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(timesheets.reduce((acc, ts) => {
                        const date = ts.date ? new Date(ts.date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US') : 'Unknown Date';
                        if (!acc[date]) acc[date] = [];
                        acc[date].push(ts);
                        return acc;
                      }, {})).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, entries]) => (
                        <div key={date} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <span className="text-sm font-semibold text-primary-text">{date}</span>
                            <Badge className="text-xs bg-primary-accent/10 text-primary-accent">
                              {entries.reduce((sum, e) => sum + parseFloat(e.hours || 0), 0).toFixed(2)}h {t('common.total')}
                            </Badge>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {entries.map((entry) => (
                              <div key={entry.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary-accent/20 flex items-center justify-center text-xs font-semibold text-primary-accent">
                                    {(entry.user_name || 'U').substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-primary-text">{entry.user_name || 'User'}</p>
                                    <p className="text-xs text-secondary-text">{entry.task_title || entry.description || t('projects.activity.tasks')}</p>
                                  </div>
                                </div>
                                <span className="font-mono text-sm bg-green-100 text-green-700 px-2 py-1 rounded">{parseFloat(entry.hours || 0).toFixed(2)}h</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {activeTab === 'expenses' && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-primary-text">{t('projects.activity.expenses.title')}</h3>
                <Button onClick={() => setIsAddExpenseModalOpen(true)} className="flex items-center gap-2">
                  <IoAdd size={16} /> {t('projects.activity.expenses.add')}
                </Button>
              </div>
              <DataTable
                columns={[
                  {
                    header: 'ID',
                    accessor: 'id',
                    key: 'id',
                    className: 'font-medium w-20',
                    render: (value, row) => `EXP#${String(row.id).padStart(3, '0')}`
                  },
                  {
                    header: 'Title',
                    accessor: 'title',
                    key: 'title',
                    render: (value, row) => row.title || row.description || '-'
                  },
                  {
                    header: 'Category',
                    accessor: 'category',
                    key: 'category',
                    render: (value) => value || '-'
                  },
                  {
                    header: 'Amount',
                    accessor: 'amount',
                    key: 'amount',
                    render: (value, row) => <span className="font-semibold">${parseFloat(row.total || row.amount || 0).toFixed(2)}</span>
                  },
                  {
                    header: 'Date',
                    accessor: 'expense_date',
                    key: 'expense_date',
                    render: (value, row) => row.expense_date ? new Date(row.expense_date).toLocaleDateString() : (row.created_at ? new Date(row.created_at).toLocaleDateString() : '-')
                  },
                  {
                    header: 'Client',
                    accessor: 'client_name',
                    key: 'client_name',
                    render: (value) => value || '-'
                  },
                  {
                    header: 'Status',
                    accessor: 'status',
                    key: 'status',
                    render: (value) => (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value === 'Approved' ? 'bg-green-100 text-green-800' :
                        value === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {value || 'Pending'}
                      </span>
                    )
                  },
                  {
                    header: 'Action',
                    accessor: 'id',
                    key: 'actions',
                    className: 'text-right',
                    render: (value, row) => (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleViewExpense(row)} className="p-1 text-primary-accent hover:bg-primary-accent/10 rounded">
                          <IoEye size={16} />
                        </button>
                        <button onClick={() => handleEditExpense(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <IoCreate size={16} />
                        </button>
                        <button onClick={() => handleDeleteExpense(row)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <IoTrash size={16} />
                        </button>
                      </div>
                    )
                  }
                ]}
                data={expenses}
                loading={loadingExpenses}
                pagination
              />
            </Card>
          )}

          {activeTab === 'invoices' && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-primary-text">{t('projects.activity.invoices.title')}</h3>
                <Button onClick={handleOpenAddInvoice} className="flex items-center gap-2">
                  <IoAdd size={16} /> {t('projects.activity.invoices.add')}
                </Button>
              </div>
              <DataTable
                columns={[
                  {
                    header: 'Invoice #',
                    accessor: 'invoice_number',
                    key: 'invoice_number',
                    className: 'font-medium',
                    render: (value, row) => value || `INV-${row.id}`
                  },
                  {
                    header: 'Client',
                    accessor: 'client_name',
                    key: 'client_name',
                    render: (value) => value || '-'
                  },
                  {
                    header: 'Amount',
                    accessor: 'total',
                    key: 'total',
                    render: (value, row) => <span className="font-semibold">${parseFloat(row.total || row.amount || 0).toFixed(2)}</span>
                  },
                  {
                    header: t('projects.activity.invoices.issue_date'),
                    accessor: 'issue_date',
                    key: 'issue_date',
                    render: (value) => value ? new Date(value).toLocaleDateString() : '-'
                  },
                  {
                    header: t('projects.activity.invoices.due_date'),
                    accessor: 'due_date',
                    key: 'due_date',
                    render: (value) => value ? new Date(value).toLocaleDateString() : '-'
                  },
                  {
                    header: 'Status',
                    accessor: 'status',
                    key: 'status',
                    render: (value) => (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value === 'paid' ? 'bg-green-100 text-green-800' :
                        value === 'partial' ? 'bg-blue-100 text-blue-800' :
                          value === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {value || 'Unpaid'}
                      </span>
                    )
                  },
                  {
                    header: 'Action',
                    accessor: 'id',
                    key: 'actions',
                    className: 'text-right',
                    render: (value, row) => (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelectedInvoice(row); setIsViewInvoiceModalOpen(true); }} className="p-1 text-primary-accent hover:bg-primary-accent/10 rounded">
                          <IoEye size={16} />
                        </button>
                        <button onClick={() => handleDeleteInvoice(row)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <IoTrash size={16} />
                        </button>
                      </div>
                    )
                  }
                ]}
                data={invoices}
                loading={loadingInvoices}
                pagination
              />
            </Card>
          )}

          {activeTab === 'payments' && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-primary-text">{t('projects.activity.payments.title')}</h3>
                <Button onClick={() => setIsAddPaymentModalOpen(true)} className="flex items-center gap-2">
                  <IoAdd size={16} /> {t('projects.activity.payments.add')}
                </Button>
              </div>
              <DataTable
                columns={[
                  {
                    header: 'Payment #',
                    accessor: 'id',
                    key: 'id',
                    className: 'font-medium',
                    render: (value) => `PAY-${value}`
                  },
                  {
                    header: 'Invoice',
                    accessor: 'invoice_number',
                    key: 'invoice_number',
                    render: (value, row) => value || (row.invoice_id ? `INV-${row.invoice_id}` : '-')
                  },
                  {
                    header: 'Amount',
                    accessor: 'amount',
                    key: 'amount',
                    render: (value) => <span className="font-semibold">${parseFloat(value || 0).toFixed(2)}</span>
                  },
                  {
                    header: 'Payment Date',
                    accessor: 'payment_date',
                    key: 'payment_date',
                    render: (value) => value ? new Date(value).toLocaleDateString() : '-'
                  },
                  {
                    header: 'Method',
                    accessor: 'payment_method',
                    key: 'payment_method',
                    render: (value) => value ? value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'
                  },
                  {
                    header: 'Status',
                    accessor: 'status',
                    key: 'status',
                    render: (value) => (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value === 'completed' ? 'bg-green-100 text-green-800' :
                        value === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {value || 'Pending'}
                      </span>
                    )
                  },
                  {
                    header: 'Action',
                    accessor: 'id',
                    key: 'actions',
                    className: 'text-right',
                    render: (value, row) => (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelectedPayment(row); setIsViewPaymentModalOpen(true); }} className="p-1 text-primary-accent hover:bg-primary-accent/10 rounded">
                          <IoEye size={16} />
                        </button>
                        <button onClick={() => handleDeletePayment(row)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <IoTrash size={16} />
                        </button>
                      </div>
                    )
                  }
                ]}
                data={payments}
                loading={loadingPayments}
                pagination
              />
            </Card>
          )}

          {activeTab === 'contracts' && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-primary-text">{t('projects.activity.contracts.title')}</h3>
                <Button onClick={() => setIsAddContractModalOpen(true)} className="flex items-center gap-2">
                  <IoAdd size={16} /> {t('projects.activity.contracts.add')}
                </Button>
              </div>
              <DataTable
                columns={[
                  {
                    header: '#',
                    accessor: 'id',
                    key: 'id',
                    className: 'font-medium w-16',
                    render: (value) => `#${value}`
                  },
                  {
                    header: 'Subject',
                    accessor: 'subject',
                    key: 'subject',
                    render: (value) => value || '-'
                  },
                  {
                    header: 'Client',
                    accessor: 'client_name',
                    key: 'client_name',
                    render: (value) => value || '-'
                  },
                  {
                    header: 'Value',
                    accessor: 'contract_value',
                    key: 'contract_value',
                    render: (value) => value ? <span className="font-semibold">${parseFloat(value).toFixed(2)}</span> : '-'
                  },
                  {
                    header: 'Start Date',
                    accessor: 'start_date',
                    key: 'start_date',
                    render: (value) => value ? new Date(value).toLocaleDateString() : '-'
                  },
                  {
                    header: 'End Date',
                    accessor: 'end_date',
                    key: 'end_date',
                    render: (value) => value ? new Date(value).toLocaleDateString() : '-'
                  },
                  {
                    header: 'Action',
                    accessor: 'id',
                    key: 'actions',
                    className: 'text-right',
                    render: (value, row) => (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelectedContract(row); setIsViewContractModalOpen(true); }} className="p-1 text-primary-accent hover:bg-primary-accent/10 rounded">
                          <IoEye size={16} />
                        </button>
                        <button onClick={() => handleDeleteContract(row)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <IoTrash size={16} />
                        </button>
                      </div>
                    )
                  }
                ]}
                data={contracts}
                loading={loadingContracts}
                pagination
              />
            </Card>
          )}

          {activeTab === 'events' && (
            <EventsSection
              relatedToType="project"
              relatedToId={parseInt(id)}
              canCreate={true}
              canEdit={true}
              canDelete={true}
              title={t('projects.activity.events.title')}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {/* {t('projects.members.add')} Modal */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false)
          setMemberFormData({ userId: '' })
        }}
        title={t('projects.members.add')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('projects.members.select_employee')}</label>
            <select
              value={memberFormData.userId}
              onChange={(e) => setMemberFormData({ userId: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="">{t('projects.members.select_employee')}</option>
              {employees
                .filter(emp => {
                  // Filter out employees who are already members
                  const currentMemberIds = members.map(m => m.id || m.user_id || m.userId).filter(Boolean)
                  const empUserId = emp.user_id || emp.id
                  return !currentMemberIds.includes(empUserId)
                })
                .map((employee) => (
                  <option key={employee.id} value={employee.user_id || employee.id}>
                    {employee.name || employee.email || `Employee #${employee.id}`}
                    {employee.department_name ? ` - ${employee.department_name}` : ''}
                  </option>
                ))}
            </select>
            {employees.length === 0 && (
              <p className="text-xs text-secondary-text mt-1">{t('common.loading')}</p>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAddMemberModalOpen(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleAddMember} className="flex-1">
              {t('projects.members.add')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Note Modal - Enhanced */}
      <RightSideModal
        isOpen={isAddNoteModalOpen}
        onClose={() => {
          setIsAddNoteModalOpen(false)
          setSelectedNote(null)
          setNoteFormData({ title: '', content: '', category: '', labels: [], is_public: true, color: '#3b82f6', file: null })
        }}
        title={selectedNote ? t('common.edit') + ' ' + t('projects.activity.note') : t('projects.activity.add_note')}
        width="600px"
      >
        <div className="space-y-0 pb-4">
          <FormSection title="Note Details">
            <FormRow label="Title" required>
              <FormInput
                value={noteFormData.title || ''}
                onChange={(e) => setNoteFormData({ ...noteFormData, title: e.target.value })}
                placeholder="Enter note title"
              />
            </FormRow>
            <FormRow label="Description">
              <RichTextEditor
                value={noteFormData.content || ''}
                onChange={(content) => setNoteFormData({ ...noteFormData, content })}
                placeholder="Enter note content"
              />
            </FormRow>
            <FormRow label="Category">
              <FormSelect
                value={noteFormData.category || ''}
                onChange={(e) => setNoteFormData({ ...noteFormData, category: e.target.value })}
              >
                <option value="">Kategorie auswählen</option>
                {noteCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </FormSelect>
            </FormRow>
          </FormSection>

          <FormSection title="Labels & Settings">
            <FormRow label="Labels">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50 min-h-[50px]">
                  {noteFormData.labels && noteFormData.labels.length > 0 ? (
                    noteFormData.labels.map((label, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {label}
                        <button
                          type="button"
                          onClick={() => setNoteFormData({ ...noteFormData, labels: noteFormData.labels.filter((_, i) => i !== idx) })}
                          className="hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">{t('projects.labels.no_labels')}</span>
                  )}
                </div>
                <FormSelect
                  onChange={(e) => {
                    if (e.target.value && !(noteFormData.labels || []).includes(e.target.value)) {
                      setNoteFormData({ ...noteFormData, labels: [...(noteFormData.labels || []), e.target.value] })
                    }
                    e.target.value = ''
                  }}
                >
                  <option value="">+ Add Label</option>
                  {noteLabels.filter(l => !(noteFormData.labels || []).includes(l)).map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </FormSelect>
              </div>
            </FormRow>
            <FormRow label="Color">
              <div className="flex gap-2 flex-wrap">
                {noteColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNoteFormData({ ...noteFormData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${noteFormData.color === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </FormRow>
            <FormRow label={t('projects.visibility.title')}>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={t('projects.visibility.title')}
                    checked={noteFormData.is_public}
                    onChange={() => setNoteFormData({ ...noteFormData, is_public: true })}
                    className="w-4 h-4 text-primary-accent"
                  />
                  <span className="text-sm">{t('projects.visibility.public')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={t('projects.visibility.title')}
                    checked={!noteFormData.is_public}
                    onChange={() => setNoteFormData({ ...noteFormData, is_public: false })}
                    className="w-4 h-4 text-primary-accent"
                  />
                  <span className="text-sm">{t('projects.visibility.private')}</span>
                </label>
              </div>
            </FormRow>
          </FormSection>

          <FormSection title="Attachments" last>
            <FormRow label="Attach File" last>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-accent transition-colors">
                <input
                  type="file"
                  onChange={(e) => setNoteFormData({ ...noteFormData, file: e.target.files[0] })}
                  className="hidden"
                  id="note-file-upload"
                />
                <label htmlFor="note-file-upload" className="cursor-pointer">
                  <IoDocumentText size={32} className="mx-auto mb-2 text-gray-400" />
                  {noteFormData.file ? (
                    <p className="text-sm text-primary-accent">{noteFormData.file.name}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  )}
                </label>
              </div>
            </FormRow>
          </FormSection>

          <FormActions>
            <Button variant="outline" onClick={() => {
              setIsAddNoteModalOpen(false)
              setSelectedNote(null)
              setNoteFormData({ title: '', content: '', category: '', labels: [], is_public: true, color: '#3b82f6', file: null })
            }} className="px-6">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddNote} className="px-6 flex items-center gap-2">
              <IoCheckmarkCircle size={18} />
              {selectedNote ? 'Update Note' : 'Add Note'}
            </Button>
          </FormActions>
        </div>
      </RightSideModal>

      {/* View Note Modal */}
      <Modal
        isOpen={isViewNoteModalOpen}
        onClose={() => {
          setIsViewNoteModalOpen(false)
          setViewingNote(null)
        }}
        title="Note Details"
        maxWidth="2xl"
      >
        {viewingNote && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-2 h-12 rounded-full" style={{ backgroundColor: viewingNote.color || '#3b82f6' }}></div>
              <div>
                <h3 className="text-lg font-semibold text-primary-text">{viewingNote.title || 'Untitled'}</h3>
                <p className="text-sm text-secondary-text">
                  Created: {viewingNote.created_at ? new Date(viewingNote.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-secondary-text uppercase">Category</p>
                <p className="text-sm font-medium">{viewingNote.category || 'General'}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-text uppercase">Status</p>
                <Badge className={`text-xs ${viewingNote.is_public ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {viewingNote.is_public ? t('projects.visibility.public') : t('projects.visibility.private')}
                </Badge>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-xs text-secondary-text uppercase mb-2">Content</p>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                {renderHTMLContent(viewingNote.content || viewingNote.note)}
              </div>
            </div>
            {viewingNote.file_name && (
              <div className="pt-2">
                <p className="text-xs text-secondary-text uppercase mb-2">Attachment</p>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <IoDocumentText className="text-blue-600" size={24} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary-text">{viewingNote.file_name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadFile(viewingNote)}
                    className="flex items-center gap-1"
                  >
                    <IoDownload size={14} />
                    Download
                  </Button>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => { setIsViewNoteModalOpen(false); setViewingNote(null); }} className="flex-1">
                Close
              </Button>
              <Button onClick={() => { setIsViewNoteModalOpen(false); handleEditNote(viewingNote); }} className="flex-1 flex items-center justify-center gap-2">
                <IoCreate size={16} />
                Edit Note
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add File Modal - Enhanced with Category & Drag & Drop */}
      <RightSideModal
        isOpen={isAddFileModalOpen}
        onClose={() => {
          setIsAddFileModalOpen(false)
          setFileFormData({ title: '', file: null, description: '', category: '' })
        }}
        title="{t('common.upload_file')}"
        width="500px"
      >
        <div className="space-y-0 pb-4">
          <FormSection title="File Upload">
            <FormRow label="Category">
              <FormSelect
                value={fileFormData.category || ''}
                onChange={(e) => setFileFormData({ ...fileFormData, category: e.target.value })}
              >
                <option value="">Kategorie auswählen</option>
                {fileCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </FormSelect>
            </FormRow>
            <FormRow label="File" required last>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${fileFormData.file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-primary-accent'}`}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary-accent', 'bg-primary-accent/5'); }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary-accent', 'bg-primary-accent/5'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-primary-accent', 'bg-primary-accent/5');
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setFileFormData({ ...fileFormData, file: e.dataTransfer.files[0] });
                  }
                }}
              >
                <input
                  type="file"
                  onChange={(e) => setFileFormData({ ...fileFormData, file: e.target.files[0] })}
                  className="hidden"
                  id="project-file-upload"
                />
                <label htmlFor="project-file-upload" className="cursor-pointer">
                  {fileFormData.file ? (
                    <>
                      <IoCheckmarkCircle size={48} className="mx-auto mb-3 text-green-500" />
                      <p className="text-sm font-medium text-green-700">{fileFormData.file.name}</p>
                      <p className="text-xs text-green-600 mt-1">Click or drag to replace</p>
                    </>
                  ) : (
                    <>
                      <IoDocumentText size={48} className="mx-auto mb-3 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">Drag & drop your file here</p>
                      <p className="text-xs text-gray-500 mt-1">or click to browse</p>
                    </>
                  )}
                </label>
              </div>
            </FormRow>
          </FormSection>

          <FormSection title="Optional Details" last>
            <FormRow label="Title">
              <FormInput
                value={fileFormData.title || ''}
                onChange={(e) => setFileFormData({ ...fileFormData, title: e.target.value })}
                placeholder="Enter file title (optional)"
              />
            </FormRow>
            <FormRow label="Description" last>
              <textarea
                value={fileFormData.description || ''}
                onChange={(e) => setFileFormData({ ...fileFormData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-sm"
                placeholder="Enter file description (optional)"
              />
            </FormRow>
          </FormSection>

          <FormActions>
            <Button variant="outline" onClick={() => {
              setIsAddFileModalOpen(false)
              setFileFormData({ title: '', file: null, description: '', category: '' })
            }} className="px-6">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddFile} className="px-6 flex items-center gap-2">
              <IoDocumentText size={18} />
              {t('common.upload_file')}
            </Button>
          </FormActions>
        </div>
      </RightSideModal>

      {/* Add Comment Modal */}
      <Modal
        isOpen={isAddCommentModalOpen}
        onClose={() => {
          setIsAddCommentModalOpen(false)
          setCommentFormData({ content: '' })
        }}
        title="Add Comment"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Comment *</label>
            <textarea
              value={commentFormData.content}
              onChange={(e) => setCommentFormData({ content: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              placeholder="Enter your comment"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => {
              setIsAddCommentModalOpen(false)
              setCommentFormData({ content: '' })
            }} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleAddComment} className="flex-1">
              Add Comment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Timesheet Modal - Enhanced */}
      <RightSideModal
        isOpen={isAddTimesheetModalOpen}
        onClose={() => {
          setIsAddTimesheetModalOpen(false)
          setTimesheetFormData({ date: new Date().toISOString().split('T')[0], hours: '', description: '', user_id: '', task_id: '', start_time: '', end_time: '' })
        }}
        title="{t('projects.activity.timesheets.add')}"
        width="500px"
      >
        <div className="space-y-0 pb-4">
          <FormSection title="Time Details">
            <FormRow label="Member" required>
              <FormSelect
                value={timesheetFormData.user_id || ''}
                onChange={(e) => setTimesheetFormData({ ...timesheetFormData, user_id: e.target.value })}
              >
                <option value="">-- Select Member --</option>
                {employees.map(emp => (
                  <option key={emp.id || emp.user_id} value={emp.id || emp.user_id}>{emp.name || emp.email}</option>
                ))}
              </FormSelect>
            </FormRow>
            <FormRow label="Task">
              <FormSelect
                value={timesheetFormData.task_id || ''}
                onChange={(e) => setTimesheetFormData({ ...timesheetFormData, task_id: e.target.value })}
              >
                <option value="">-- Select Task --</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </FormSelect>
            </FormRow>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormRow label="Start Date/Time">
                <FormInput
                  type="datetime-local"
                  value={timesheetFormData.start_time || ''}
                  onChange={(e) => setTimesheetFormData({ ...timesheetFormData, start_time: e.target.value })}
                />
              </FormRow>
              <FormRow label="End Date/Time">
                <FormInput
                  type="datetime-local"
                  value={timesheetFormData.end_time || ''}
                  onChange={(e) => {
                    const endTime = e.target.value;
                    let hours = timesheetFormData.hours || '';
                    if (timesheetFormData.start_time && endTime) {
                      const start = new Date(timesheetFormData.start_time);
                      const end = new Date(endTime);
                      hours = ((end - start) / (1000 * 60 * 60)).toFixed(2);
                    }
                    setTimesheetFormData({ ...timesheetFormData, end_time: endTime, hours });
                  }}
                />
              </FormRow>
            </div>
            <FormRow label="Total Hours" required>
              <FormInput
                type="number"
                step="0.25"
                min="0"
                value={timesheetFormData.hours || ''}
                onChange={(e) => setTimesheetFormData({ ...timesheetFormData, hours: e.target.value })}
                placeholder="Enter hours worked"
              />
            </FormRow>
          </FormSection>

          <FormSection title="Note" last>
            <FormRow label="Note" last>
              <textarea
                value={timesheetFormData.description || ''}
                onChange={(e) => setTimesheetFormData({ ...timesheetFormData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-sm"
                placeholder="Enter work description or note"
              />
            </FormRow>
          </FormSection>

          <FormActions>
            <Button variant="outline" onClick={() => {
              setIsAddTimesheetModalOpen(false)
              setTimesheetFormData({ date: new Date().toISOString().split('T')[0], hours: '', description: '', user_id: '', task_id: '', start_time: '', end_time: '' })
            }} className="px-6">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddTimesheet} className="px-6 flex items-center gap-2">
              <IoTime size={18} />
              {t('projects.activity.timesheets.add')}
            </Button>
          </FormActions>
        </div>
      </RightSideModal>

      {/* Add Invoice Modal */}
      <Modal
        isOpen={isAddInvoiceModalOpen}
        onClose={() => {
          setIsAddInvoiceModalOpen(false)
          setInvoiceFormData({
            invoice_number: '',
            issue_date: new Date().toISOString().split('T')[0],
            due_date: '',
            client_id: '',
            amount: '',
            status: 'unpaid',
            note: ''
          })
        }}
        title="Add Invoice"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">{t('projects.activity.invoices.bill_date')}</label>
            <Input
              type="date"
              value={invoiceFormData.issue_date}
              onChange={(e) => setInvoiceFormData({ ...invoiceFormData, issue_date: e.target.value })}
              className="flex-1"
            />
          </div>
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">{t('projects.activity.invoices.due_date')} *</label>
            <Input
              type="date"
              value={invoiceFormData.due_date}
              onChange={(e) => setInvoiceFormData({ ...invoiceFormData, due_date: e.target.value })}
              className="flex-1"
              required
            />
          </div>
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">Client *</label>
            <select
              value={invoiceFormData.client_id}
              onChange={(e) => setInvoiceFormData({ ...invoiceFormData, client_id: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-accent"
              required
            >
              <option value="">Select Client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.client_name || client.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">Amount</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={invoiceFormData.amount}
              onChange={(e) => setInvoiceFormData({ ...invoiceFormData, amount: e.target.value })}
              placeholder="Enter amount"
              className="flex-1"
            />
          </div>
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-gray-700">Status</label>
            <select
              value={invoiceFormData.status}
              onChange={(e) => setInvoiceFormData({ ...invoiceFormData, status: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-accent"
            >
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="flex items-start">
            <label className="w-32 text-sm font-medium text-gray-700 pt-2">Note</label>
            <textarea
              value={invoiceFormData.note}
              onChange={(e) => setInvoiceFormData({ ...invoiceFormData, note: e.target.value })}
              placeholder="Add a note..."
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-primary-accent"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddInvoiceModalOpen(false)
                setInvoiceFormData({
                  invoice_number: '',
                  issue_date: new Date().toISOString().split('T')[0],
                  due_date: '',
                  client_id: '',
                  amount: '',
                  status: 'unpaid',
                  note: ''
                })
              }}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleAddInvoice} className="flex-1">
              <IoCheckmark size={18} className="mr-1" /> Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => {
          setIsAddPaymentModalOpen(false)
          setPaymentFormData({
            invoice_id: '',
            amount: '',
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'bank_transfer',
            transaction_id: '',
            remarks: ''
          })
        }}
        title="Add Payment"
      >
        <div className="space-y-4">
          <div className="flex items-center">
            <label className="w-36 text-sm font-medium text-gray-700">Invoice *</label>
            <select
              value={paymentFormData.invoice_id}
              onChange={(e) => {
                const invoiceId = e.target.value
                setPaymentFormData(prev => ({ ...prev, invoice_id: invoiceId }))
                if (invoiceId) {
                  const selectedInvoice = invoices.find(inv => inv.id === parseInt(invoiceId))
                  if (selectedInvoice) {
                    const dueAmount = parseFloat(selectedInvoice.total || 0) - parseFloat(selectedInvoice.paid_amount || 0)
                    setPaymentFormData(prev => ({ ...prev, invoice_id: invoiceId, amount: dueAmount > 0 ? dueAmount.toFixed(2) : '' }))
                  }
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-accent"
              required
            >
              <option value="">Select Invoice</option>
              {invoices.filter(inv => inv.status !== 'paid').map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number || `INV-${invoice.id}`} (Due: ${(parseFloat(invoice.total || 0) - parseFloat(invoice.paid_amount || 0)).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-36 text-sm font-medium text-gray-700">Payment Method *</label>
            <select
              value={paymentFormData.payment_method}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-accent"
              required
            >
              <option value="">Select Payment Method</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-36 text-sm font-medium text-gray-700">Payment Date</label>
            <Input
              type="date"
              value={paymentFormData.payment_date}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
              className="flex-1"
            />
          </div>
          <div className="flex items-center">
            <label className="w-36 text-sm font-medium text-gray-700">Amount *</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={paymentFormData.amount}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
              placeholder="Enter amount"
              className="flex-1"
              required
            />
          </div>
          <div className="flex items-center">
            <label className="w-36 text-sm font-medium text-gray-700">Transaction ID</label>
            <Input
              value={paymentFormData.transaction_id}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, transaction_id: e.target.value })}
              placeholder="Optional"
              className="flex-1"
            />
          </div>
          <div className="flex items-start">
            <label className="w-36 text-sm font-medium text-gray-700 pt-2">Note</label>
            <textarea
              value={paymentFormData.remarks}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, remarks: e.target.value })}
              placeholder="Add a note..."
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-primary-accent"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddPaymentModalOpen(false)
                setPaymentFormData({
                  invoice_id: '',
                  amount: '',
                  payment_date: new Date().toISOString().split('T')[0],
                  payment_method: 'bank_transfer',
                  transaction_id: '',
                  remarks: ''
                })
              }}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleAddPayment} className="flex-1">
              <IoCheckmark size={18} className="mr-1" /> Add Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddExpenseModalOpen}
        onClose={() => {
          setIsAddExpenseModalOpen(false)
          setExpenseFormData({ title: '', amount: '', date: new Date().toISOString().split('T')[0], category: '', description: '' })
        }}
        title="Add Expense"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Title *</label>
            <Input
              value={expenseFormData.title}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, title: e.target.value })}
              placeholder="Enter expense title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Amount *</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={expenseFormData.amount}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
              placeholder="Enter amount"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Date *</label>
            <Input
              type="date"
              value={expenseFormData.date}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Category</label>
            <Input
              value={expenseFormData.category}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value })}
              placeholder="Enter category"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Description</label>
            <textarea
              value={expenseFormData.description}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              placeholder="Enter expense description"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => {
              setIsAddExpenseModalOpen(false)
              setExpenseFormData({ title: '', amount: '', date: new Date().toISOString().split('T')[0], category: '', description: '' })
            }} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleAddExpense} className="flex-1">
              Add Expense
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reminders Modal */}
      <Modal
        isOpen={isRemindersModalOpen}
        onClose={() => {
          setIsRemindersModalOpen(false)
          setReminderFormData({ title: '', description: '', reminder_date: '', reminder_time: '' })
        }}
        title="Reminders"
      >
        <div className="space-y-4">
          <div>
            <Input
              label="Reminder Title *"
              value={reminderFormData.title}
              onChange={(e) => setReminderFormData({ ...reminderFormData, title: e.target.value })}
              placeholder="Enter reminder title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Description</label>
            <textarea
              value={reminderFormData.description}
              onChange={(e) => setReminderFormData({ ...reminderFormData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              placeholder="Enter reminder description"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Reminder Date"
              type="date"
              value={reminderFormData.reminder_date}
              onChange={(e) => setReminderFormData({ ...reminderFormData, reminder_date: e.target.value })}
            />
            <Input
              label="Reminder Time"
              type="time"
              value={reminderFormData.reminder_time}
              onChange={(e) => setReminderFormData({ ...reminderFormData, reminder_time: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsRemindersModalOpen(false)
                setReminderFormData({ title: '', description: '', reminder_date: '', reminder_time: '' })
              }}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleAddReminder} className="flex-1">
              Add Reminder
            </Button>
          </div>

          {/* Existing Reminders List */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-primary-text mb-3">Existing Reminders</h3>
            {reminders.length === 0 ? (
              <p className="text-sm text-secondary-text">No reminders set</p>
            ) : (
              <div className="space-y-2">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="p-3 bg-gray-50 rounded-lg flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-text">{reminder.title}</p>
                      <p className="text-xs text-secondary-text mt-1">{reminder.message}</p>
                      <p className="text-xs text-secondary-text mt-1">
                        Created: {new Date(reminder.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete Reminder"
                    >
                      <IoTrash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Project Settings"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('projects.visibility.public')} Gantt Chart</label>
            <select
              value={settingsFormData.public_gantt_chart}
              onChange={(e) => setSettingsFormData({ ...settingsFormData, public_gantt_chart: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="enable">Enable</option>
              <option value="disable">Disable</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('projects.visibility.public')} Task Board</label>
            <select
              value={settingsFormData.public_task_board}
              onChange={(e) => setSettingsFormData({ ...settingsFormData, public_task_board: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="enable">Enable</option>
              <option value="disable">Disable</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Task Approval</label>
            <select
              value={settingsFormData.task_approval}
              onChange={(e) => setSettingsFormData({ ...settingsFormData, task_approval: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="enable">Enable</option>
              <option value="disable">Disable</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSaveSettings} className="flex-1">
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Task Modal */}
      <Modal
        isOpen={isViewTaskModalOpen}
        onClose={() => {
          setIsViewTaskModalOpen(false)
          setSelectedTask(null)
        }}
        title={`Task: ${selectedTask?.title || ''}`}
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Title</label>
              <p className="text-primary-text">{selectedTask.title}</p>
            </div>
            {selectedTask.description && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Description</label>
                <p className="text-primary-text whitespace-pre-wrap">{selectedTask.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Status</label>
                <Badge variant={
                  selectedTask.status === 'Done' || selectedTask.status === 'done' ? 'success' :
                    selectedTask.status === 'Doing' || selectedTask.status === 'doing' ? 'info' : 'warning'
                }>
                  {selectedTask.status || 'Incomplete'}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Priority</label>
                <Badge variant={
                  selectedTask.priority === 'High' || selectedTask.priority === 'high' ? 'danger' :
                    selectedTask.priority === 'Medium' || selectedTask.priority === 'medium' ? 'warning' : 'info'
                }>
                  {selectedTask.priority || 'Medium'}
                </Badge>
              </div>
            </div>
            {selectedTask.due_date && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">{t('projects.activity.invoices.due_date')}</label>
                <p className="text-primary-text">{new Date(selectedTask.due_date).toLocaleDateString()}</p>
              </div>
            )}
            {selectedTask.code && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Task Code</label>
                <p className="text-primary-text">{selectedTask.code}</p>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewTaskModalOpen(false)
                  setSelectedTask(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewTaskModalOpen(false)
                  handleEditTask(selectedTask)
                }}
                className="flex-1"
              >
                Edit Task
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Timesheet Modal */}
      <Modal
        isOpen={isViewTimesheetModalOpen}
        onClose={() => {
          setIsViewTimesheetModalOpen(false)
          setSelectedTimesheet(null)
        }}
        title="Timesheet Details"
      >
        {selectedTimesheet && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">User</label>
                <p className="text-primary-text font-medium">{selectedTimesheet.user_name || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Hours</label>
                <p className="text-primary-text font-medium">{parseFloat(selectedTimesheet.hours || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Date</label>
                <p className="text-primary-text">{selectedTimesheet.date ? new Date(selectedTimesheet.date).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Task</label>
                <p className="text-primary-text">{selectedTimesheet.task_name || selectedTimesheet.task_title || '-'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Memo</label>
              <p className="text-primary-text whitespace-pre-wrap">{selectedTimesheet.memo || selectedTimesheet.description || '-'}</p>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewTimesheetModalOpen(false)
                  setSelectedTimesheet(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Expense Modal */}
      <Modal
        isOpen={isViewExpenseModalOpen}
        onClose={() => {
          setIsViewExpenseModalOpen(false)
          setSelectedExpense(null)
        }}
        title="Expense Details"
      >
        {selectedExpense && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Expense #</label>
                <p className="text-primary-text font-medium">{selectedExpense.expense_number || `EXP#${selectedExpense.id}`}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Status</label>
                <Badge className={`text-xs ${selectedExpense.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  selectedExpense.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                  {selectedExpense.status || 'Pending'}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Amount</label>
                <p className="text-primary-text font-semibold text-lg">${parseFloat(selectedExpense.total || selectedExpense.amount || 0).toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Category</label>
                <p className="text-primary-text">{selectedExpense.category || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Date</label>
                <p className="text-primary-text">{selectedExpense.expense_date ? new Date(selectedExpense.expense_date).toLocaleDateString() : selectedExpense.created_at ? new Date(selectedExpense.created_at).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Project</label>
                <p className="text-primary-text">{project?.project_name || '-'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Description</label>
              <p className="text-primary-text whitespace-pre-wrap">{selectedExpense.description || '-'}</p>
            </div>
            {selectedExpense.receipt_path && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Receipt</label>
                <a href={selectedExpense.receipt_path} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  View Receipt
                </a>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  const printWindow = window.open('', '_blank')
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Expense - ${selectedExpense.expense_number || `EXP#${selectedExpense.id}`}</title>
                        <style>
                          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
                          .header { text-align: center; margin-bottom: 30px; }
                          .title { font-size: 24px; font-weight: bold; }
                          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                          .label { color: #666; }
                          .value { font-weight: 500; }
                          .amount { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
                          .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <div class="title">EXPENSE REPORT</div>
                          <div>${selectedExpense.expense_number || `EXP#${selectedExpense.id}`}</div>
                        </div>
                        <div class="amount">€${parseFloat(selectedExpense.total || selectedExpense.amount || 0).toFixed(2)}</div>
                        <div class="row"><span class="label">Status</span><span class="value">${selectedExpense.status || 'Pending'}</span></div>
                        <div class="row"><span class="label">Category</span><span class="value">${selectedExpense.category || '-'}</span></div>
                        <div class="row"><span class="label">Date</span><span class="value">${selectedExpense.expense_date ? new Date(selectedExpense.expense_date).toLocaleDateString() : '-'}</span></div>
                        <div class="row"><span class="label">Project</span><span class="value">${project?.name || '-'}</span></div>
                        <div class="row"><span class="label">Description</span><span class="value">${selectedExpense.description || '-'}</span></div>
                      </body>
                    </html>
                  `)
                  printWindow.document.close()
                  printWindow.print()
                }}
                className="flex items-center gap-2"
              >
                <IoPrint size={16} />
                Print
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewExpenseModalOpen(false)
                  setSelectedExpense(null)
                }}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewExpenseModalOpen(false)
                  handleEditExpense(selectedExpense)
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Timesheet Modal */}
      <RightSideModal
        isOpen={isViewTimesheetModalOpen}
        onClose={() => {
          setIsViewTimesheetModalOpen(false)
          setSelectedTimesheet(null)
        }}
        title="Timesheet Details"
        width="500px"
      >
        {selectedTimesheet && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-accent/10 flex items-center justify-center text-primary-accent text-lg font-semibold">
                {selectedTimesheet.user_name ? selectedTimesheet.user_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{selectedTimesheet.user_name || 'User'}</h4>
                <p className="text-sm text-gray-500">Employee</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</label>
                <div className="mt-1 flex items-center gap-2 text-gray-900 font-medium">
                  <IoCalendarOutline className="text-gray-400" />
                  {selectedTimesheet.date ? new Date(selectedTimesheet.date).toLocaleDateString() : (selectedTimesheet.created_at ? new Date(selectedTimesheet.created_at).toLocaleDateString() : '-')}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hours Logged</label>
                <div className="mt-1 flex items-center gap-2">
                  <IoTime className="text-gray-400" />
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-900 font-semibold">
                    {parseFloat(selectedTimesheet.hours || 0).toFixed(2)}h
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">Description</label>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedTimesheet.description || <span className="text-gray-400 italic">No description provided</span>}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewTimesheetModalOpen(false)
                  setSelectedTimesheet(null)
                }}
              >
                Close
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setIsViewTimesheetModalOpen(false)
                  handleDeleteTimesheet(selectedTimesheet)
                }}
                className="flex items-center gap-2"
              >
                <IoTrash size={16} /> Delete
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>

      {/* Edit Task Modal */}

      {/* View Comment Modal */}
      <Modal
        isOpen={isViewCommentModalOpen}
        onClose={() => {
          setIsViewCommentModalOpen(false)
          setSelectedComment(null)
        }}
        title="Comment Details"
      >
        {selectedComment && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">By</label>
              <p className="text-primary-text font-medium">{selectedComment.user_name || 'User'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Date</label>
              <p className="text-primary-text">{selectedComment.created_at ? new Date(selectedComment.created_at).toLocaleString() : '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Comment</label>
              <p className="text-primary-text whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">{selectedComment.content || selectedComment.comment || '-'}</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsViewCommentModalOpen(false)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Invoice Modal */}
      <RightSideModal
        isOpen={isViewInvoiceModalOpen}
        onClose={() => {
          setIsViewInvoiceModalOpen(false)
          setSelectedInvoice(null)
        }}
        title="Invoice Details"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Invoice #</label>
                <p className="text-primary-text font-medium">{selectedInvoice.invoice_number || `INV-${selectedInvoice.id}`}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  selectedInvoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                  {selectedInvoice.status || 'Unpaid'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Client</label>
                <p className="text-primary-text">{selectedInvoice.client_name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Amount</label>
                <p className="text-primary-text font-semibold text-lg">${parseFloat(selectedInvoice.total || selectedInvoice.amount || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">{t('projects.activity.invoices.issue_date')}</label>
                <p className="text-primary-text">{selectedInvoice.issue_date ? new Date(selectedInvoice.issue_date).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">{t('projects.activity.invoices.due_date')}</label>
                <p className="text-primary-text">{selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : '-'}</p>
              </div>
            </div>
            {selectedInvoice.note && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Note</label>
                <p className="text-primary-text bg-gray-50 p-3 rounded-lg">{selectedInvoice.note}</p>
              </div>
            )}
            <div className="pt-6 border-t border-gray-200 flex justify-between gap-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const printWindow = window.open('', '_blank')
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Invoice - ${selectedInvoice.invoice_number || `INV-${selectedInvoice.id}`}</title>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
                            .invoice-title { font-size: 32px; font-weight: bold; color: #333; }
                            .invoice-number { font-size: 14px; color: #666; }
                            .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
                            .info-block { }
                            .info-label { font-size: 12px; color: #888; margin-bottom: 4px; }
                            .info-value { font-size: 14px; color: #333; }
                            .amount-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; }
                            .amount-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                            .total-row { font-size: 18px; font-weight: bold; border-top: 2px solid #ddd; padding-top: 8px; margin-top: 8px; }
                            .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
                            .status-paid { background: #d1fae5; color: #065f46; }
                            .status-unpaid { background: #fef3c7; color: #92400e; }
                            .footer { margin-top: 40px; text-align: center; color: #888; font-size: 12px; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <div>
                              <div class="invoice-title">INVOICE</div>
                              <div class="invoice-number">${selectedInvoice.invoice_number || `INV-${selectedInvoice.id}`}</div>
                            </div>
                            <div>
                              <span class="status ${selectedInvoice.status === 'paid' ? 'status-paid' : 'status-unpaid'}">${selectedInvoice.status || 'Unpaid'}</span>
                            </div>
                          </div>
                          <div class="info-section">
                            <div class="info-block">
                              <div class="info-label">Bill To:</div>
                              <div class="info-value"><strong>${selectedInvoice.client_name || 'Client'}</strong></div>
                            </div>
                            <div class="info-block">
                              <div class="info-label">Project:</div>
                              <div class="info-value">${project?.name || 'N/A'}</div>
                            </div>
                          </div>
                          <div class="info-section">
                            <div class="info-block">
                              <div class="info-label">{t('projects.activity.invoices.issue_date')}:</div>
                              <div class="info-value">${selectedInvoice.issue_date ? new Date(selectedInvoice.issue_date).toLocaleDateString() : '-'}</div>
                            </div>
                            <div class="info-block">
                              <div class="info-label">{t('projects.activity.invoices.due_date')}:</div>
                              <div class="info-value">${selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : '-'}</div>
                            </div>
                          </div>
                          <div class="amount-section">
                            <div class="amount-row">
                              <span>Subtotal</span>
                              <span>€${parseFloat(selectedInvoice.sub_total || selectedInvoice.total || 0).toFixed(2)}</span>
                            </div>
                            <div class="amount-row">
                              <span>Tax</span>
                              <span>€${parseFloat(selectedInvoice.tax_amount || 0).toFixed(2)}</span>
                            </div>
                            <div class="amount-row total-row">
                              <span>Total</span>
                              <span>€${parseFloat(selectedInvoice.total || selectedInvoice.amount || 0).toFixed(2)}</span>
                            </div>
                          </div>
                          ${selectedInvoice.note ? `<div><strong>Note:</strong> ${selectedInvoice.note}</div>` : ''}
                          <div class="footer">Thank you for your business!</div>
                        </body>
                      </html>
                    `)
                    printWindow.document.close()
                    printWindow.print()
                  }}
                  className="flex items-center gap-2"
                >
                  <IoPrint size={16} />
                  Print
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const csvContent = `Invoice Number,Client,Amount,Status,${t('projects.activity.invoices.issue_date')},${t('projects.activity.invoices.due_date')}\n"${selectedInvoice.invoice_number || `INV-${selectedInvoice.id}`}","${selectedInvoice.client_name || ''}","${parseFloat(selectedInvoice.total || 0).toFixed(2)}","${selectedInvoice.status || 'Unpaid'}","${selectedInvoice.issue_date ? new Date(selectedInvoice.issue_date).toLocaleDateString() : ''}","${selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : ''}"`
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                    const link = document.createElement('a')
                    link.href = URL.createObjectURL(blob)
                    link.download = `invoice_${selectedInvoice.invoice_number || selectedInvoice.id}.csv`
                    link.click()
                  }}
                  className="flex items-center gap-2"
                >
                  <IoDownload size={16} />
                  Download
                </Button>
              </div>
              <Button variant="outline" onClick={() => setIsViewInvoiceModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </RightSideModal>

      {/* View Payment Modal */}
      <RightSideModal
        isOpen={isViewPaymentModalOpen}
        onClose={() => {
          setIsViewPaymentModalOpen(false)
          setSelectedPayment(null)
        }}
        title="Payment Details"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Payment #</label>
                <p className="text-primary-text font-medium">PAY-{selectedPayment.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedPayment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedPayment.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                  {selectedPayment.status || 'Pending'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Invoice</label>
                <p className="text-primary-text">{selectedPayment.invoice_number || (selectedPayment.invoice_id ? `INV-${selectedPayment.invoice_id}` : '-')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Amount</label>
                <p className="text-primary-text font-semibold text-lg">${parseFloat(selectedPayment.amount || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Payment Date</label>
                <p className="text-primary-text">{selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Method</label>
                <p className="text-primary-text">{selectedPayment.payment_method ? selectedPayment.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'}</p>
              </div>
            </div>
            {selectedPayment.transaction_id && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Transaction ID</label>
                <p className="text-primary-text font-mono bg-gray-50 p-2 rounded">{selectedPayment.transaction_id}</p>
              </div>
            )}
            {selectedPayment.remarks && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Remarks</label>
                <p className="text-primary-text bg-gray-50 p-3 rounded-lg">{selectedPayment.remarks}</p>
              </div>
            )}
            <div className="pt-6 border-t border-gray-200 flex justify-between gap-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const printWindow = window.open('', '_blank')
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Payment Receipt - PAY-${selectedPayment.id}</title>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
                            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                            .receipt-title { font-size: 24px; font-weight: bold; color: #333; }
                            .receipt-number { font-size: 14px; color: #666; margin-top: 5px; }
                            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                            .label { color: #666; }
                            .value { font-weight: 500; color: #333; }
                            .amount-row { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
                            .amount { font-size: 24px; font-weight: bold; text-align: center; }
                            .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
                            .status-completed { background: #d1fae5; color: #065f46; }
                            .status-pending { background: #fef3c7; color: #92400e; }
                            .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <div class="receipt-title">PAYMENT RECEIPT</div>
                            <div class="receipt-number">PAY-${selectedPayment.id}</div>
                          </div>
                          <div class="amount-row">
                            <div class="amount">€${parseFloat(selectedPayment.amount || 0).toFixed(2)}</div>
                            <div style="text-align: center; margin-top: 5px;">
                              <span class="status ${selectedPayment.status === 'completed' ? 'status-completed' : 'status-pending'}">${selectedPayment.status || 'Pending'}</span>
                            </div>
                          </div>
                          <div class="row"><span class="label">Invoice</span><span class="value">${selectedPayment.invoice_number || (selectedPayment.invoice_id ? `INV-${selectedPayment.invoice_id}` : '-')}</span></div>
                          <div class="row"><span class="label">Payment Date</span><span class="value">${selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleDateString() : '-'}</span></div>
                          <div class="row"><span class="label">Payment Method</span><span class="value">${selectedPayment.payment_method ? selectedPayment.payment_method.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()) : '-'}</span></div>
                          ${selectedPayment.transaction_id ? `<div class="row"><span class="label">Transaction ID</span><span class="value">${selectedPayment.transaction_id}</span></div>` : ''}
                          <div class="footer">Thank you for your payment!</div>
                        </body>
                      </html>
                    `)
                    printWindow.document.close()
                    printWindow.print()
                  }}
                  className="flex items-center gap-2"
                >
                  <IoPrint size={16} />
                  Print
                </Button>
              </div>
              <Button variant="outline" onClick={() => setIsViewPaymentModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </RightSideModal>

      {/* View Contract Modal */}
      <RightSideModal
        isOpen={isViewContractModalOpen}
        onClose={() => {
          setIsViewContractModalOpen(false)
          setSelectedContract(null)
        }}
        title="Contract Details"
      >
        {selectedContract && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Contract #</label>
                <p className="text-primary-text font-medium">#{selectedContract.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Type</label>
                <p className="text-primary-text">{selectedContract.contract_type || '-'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Subject</label>
              <p className="text-primary-text font-medium">{selectedContract.subject || '-'}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Client</label>
                <p className="text-primary-text">{selectedContract.client_name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Value</label>
                <p className="text-primary-text font-semibold text-lg">{selectedContract.contract_value ? `$${parseFloat(selectedContract.contract_value).toFixed(2)}` : '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Start Date</label>
                <p className="text-primary-text">{selectedContract.start_date ? new Date(selectedContract.start_date).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">End Date</label>
                <p className="text-primary-text">{selectedContract.end_date ? new Date(selectedContract.end_date).toLocaleDateString() : '-'}</p>
              </div>
            </div>
            {selectedContract.description && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Description</label>
                <p className="text-primary-text bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedContract.description}</p>
              </div>
            )}
            <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsViewContractModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </RightSideModal>

    </div>
  )
}

export default ProjectDetail
