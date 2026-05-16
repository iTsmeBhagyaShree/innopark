import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { employeesAPI, projectsAPI, tasksAPI, attendanceAPI, documentsAPI, leaveRequestsAPI } from '../../../api'
import Badge from '../../../components/ui/Badge'
import DataTable from '../../../components/ui/DataTable'
import { useLanguage } from '../../../context/LanguageContext.jsx'
import {
  IoArrowBack,
  IoBriefcase,
  IoCheckmarkCircle,
  IoDocumentText,
  IoCalendarOutline,
  IoTime,
} from 'react-icons/io5'

function localeTag(language) {
  return String(language || '').toLowerCase().startsWith('de') ? 'de-DE' : 'en-GB'
}

function translateProjectRowStatus(status, t) {
  const k = String(status || '').toLowerCase()
  if (k === 'completed' || k === 'finished') return t('projects.form.status_completed')
  if (
    k === 'in bearbeitung' ||
    k === 'in progress' ||
    k === 'in_progress' ||
    k === 'doing' ||
    k === 'open'
  ) {
    return t('projects.form.status_in_bearbeitung')
  }
  return status || '--'
}

function translateTaskStatus(status, t) {
  const s = String(status || '')
  if (s === 'Done') return t('projects.kanban.done')
  if (s === 'Doing') return t('projects.kanban.in_progress')
  if (s === 'Incomplete') return t('projects.kanban.todo')
  return s
}

function translatePriority(priority, t) {
  const p = String(priority || '').toLowerCase()
  if (p === 'high') return t('tasks.high')
  if (p === 'medium') return t('tasks.medium')
  if (p === 'low') return t('tasks.low')
  return priority || '--'
}

const EmployeeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const dateLocale = localeTag(language)

  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')

  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [documents, setDocuments] = useState([])

  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [loadingLeaves, setLoadingLeaves] = useState(false)
  const [loadingDocuments, setLoadingDocuments] = useState(false)

  const currentDate = new Date()
  const [attendanceMonth, setAttendanceMonth] = useState(currentDate.getMonth() + 1)
  const [attendanceYear, setAttendanceYear] = useState(currentDate.getFullYear())

  const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)

  const tabDefs = useMemo(
    () => [
      { key: 'profile', label: t('employees.detail.tabs.profile') },
      { key: 'projects', label: t('employees.detail.tabs.projects') },
      { key: 'tasks', label: t('employees.detail.tabs.tasks') },
      { key: 'attendance', label: t('employees.detail.tabs.attendance') },
      { key: 'leaves', label: t('employees.detail.tabs.leaves') },
      { key: 'documents', label: t('employees.detail.tabs.documents') },
    ],
    [t]
  )

  const formatDate = useCallback(
    (dateStr) => {
      if (!dateStr) return '--'
      return new Date(dateStr).toLocaleDateString(dateLocale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    },
    [dateLocale]
  )

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) => ({
        value: idx + 1,
        label: new Date(2024, idx, 1).toLocaleDateString(dateLocale, { month: 'long' }),
      })),
    [dateLocale]
  )

  const fetchEmployee = useCallback(async () => {
    try {
      setLoading(true)
      const response = await employeesAPI.getById(id)
      if (response.data.success) {
        setEmployee(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
      navigate('/app/admin/employees')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  const fetchProjects = useCallback(async () => {
    if (!employee?.user_id) return
    try {
      setLoadingProjects(true)
      const response = await projectsAPI.getAll({
        company_id: companyId,
        member_user_id: employee.user_id,
      })
      if (response.data.success) {
        setProjects(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }, [employee?.user_id, companyId])

  const fetchTasks = useCallback(async () => {
    if (!employee?.user_id) return
    try {
      setLoadingTasks(true)
      const response = await tasksAPI.getAll({
        company_id: companyId,
        assigned_to: employee.user_id,
      })
      if (response.data.success) {
        setTasks(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoadingTasks(false)
    }
  }, [employee?.user_id, companyId])

  const fetchAttendance = useCallback(async () => {
    if (!employee?.id) return
    try {
      setLoadingAttendance(true)
      const response = await attendanceAPI.getEmployeeAttendance(employee.id, {
        month: attendanceMonth,
        year: attendanceYear,
      })
      if (response.data.success) {
        setAttendance(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoadingAttendance(false)
    }
  }, [employee?.id, attendanceMonth, attendanceYear])

  const fetchLeaves = useCallback(async () => {
    if (!employee?.user_id) return
    try {
      setLoadingLeaves(true)
      const response = await leaveRequestsAPI.getAll({
        company_id: companyId,
        user_id: employee.user_id,
      })
      if (response.data.success) {
        setLeaves(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching leaves:', error)
    } finally {
      setLoadingLeaves(false)
    }
  }, [employee?.user_id, companyId])

  const fetchDocuments = useCallback(async () => {
    if (!employee?.user_id) return
    try {
      setLoadingDocuments(true)
      const response = await documentsAPI.getAll({
        company_id: companyId,
        uploaded_by: employee.user_id,
      })
      if (response.data.success) {
        setDocuments(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoadingDocuments(false)
    }
  }, [employee?.user_id, companyId])

  useEffect(() => {
    if (activeTab === 'projects') fetchProjects()
    else if (activeTab === 'tasks') fetchTasks()
    else if (activeTab === 'attendance') fetchAttendance()
    else if (activeTab === 'leaves') fetchLeaves()
    else if (activeTab === 'documents') fetchDocuments()
  }, [activeTab, fetchProjects, fetchTasks, fetchAttendance, fetchLeaves, fetchDocuments])

  useEffect(() => {
    if (activeTab === 'attendance' && employee?.id) {
      fetchAttendance()
    }
  }, [attendanceMonth, attendanceYear, activeTab, employee?.id, fetchAttendance])

  useEffect(() => {
    fetchEmployee()
  }, [fetchEmployee])

  const projectColumns = useMemo(
    () => [
      {
        key: 'project_name',
        label: t('employees.detail.columns.project_name'),
        render: (val) => <span className="text-blue-600 font-medium">{val}</span>,
      },
      {
        key: 'client_name',
        label: t('employees.detail.columns.client'),
        render: (val) => val || <span className="text-gray-400">--</span>,
      },
      {
        key: 'deadline',
        label: t('employees.detail.columns.deadline'),
        render: (val) => formatDate(val),
      },
      {
        key: 'status',
        label: t('employees.detail.columns.status'),
        render: (val) => (
          <Badge variant={val === 'completed' ? 'success' : val === 'In Bearbeitung' ? 'primary' : 'warning'}>
            {translateProjectRowStatus(val, t)}
          </Badge>
        ),
      },
    ],
    [t, formatDate]
  )

  const taskColumns = useMemo(
    () => [
      {
        key: 'title',
        label: t('employees.detail.columns.task'),
        render: (val) => <span className="font-medium text-gray-900">{val}</span>,
      },
      {
        key: 'project_name',
        label: t('employees.detail.columns.project'),
        render: (val) => val || '--',
      },
      {
        key: 'due_date',
        label: t('employees.detail.columns.due_date'),
        render: (val) => formatDate(val),
      },
      {
        key: 'priority',
        label: t('employees.detail.columns.priority'),
        render: (val) => (
          <span
            className={`text-xs px-2 py-0.5 rounded ${val === 'High' ? 'bg-red-100 text-red-700' : val === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
          >
            {translatePriority(val, t)}
          </span>
        ),
      },
      {
        key: 'status',
        label: t('employees.detail.columns.status'),
        render: (val) => (
          <Badge variant={val === 'Done' ? 'success' : 'default'}>{translateTaskStatus(val, t)}</Badge>
        ),
      },
    ],
    [t, formatDate]
  )

  const attendanceColumns = useMemo(
    () => [
      {
        key: 'date',
        label: t('employees.detail.columns.date'),
        render: (val) => formatDate(val),
      },
      {
        key: 'status',
        label: t('employees.detail.columns.status'),
        render: (val) => {
          const statusColors = {
            present: 'bg-green-100 text-green-700',
            absent: 'bg-red-100 text-red-700',
            half_day: 'bg-orange-100 text-orange-700',
            late: 'bg-yellow-100 text-yellow-700',
            on_leave: 'bg-purple-100 text-purple-700',
            holiday: 'bg-amber-100 text-amber-700',
            day_off: 'bg-blue-100 text-blue-700',
          }
          const key = val ? String(val) : ''
          const labelKey = key ? `employees.detail.attendance_status.${key}` : ''
          const translated = labelKey ? t(labelKey) : key
          return (
            <span className={`text-xs px-2 py-1 rounded font-medium ${statusColors[key] || 'bg-gray-100'}`}>
              {translated}
            </span>
          )
        },
      },
      {
        key: 'clock_in',
        label: t('employees.detail.columns.clock_in'),
        render: (val) => val || '--',
      },
      {
        key: 'clock_out',
        label: t('employees.detail.columns.clock_out'),
        render: (val) => val || '--',
      },
      {
        key: 'work_from',
        label: t('employees.detail.columns.work_from'),
        render: (val) => (
          <span className="capitalize">{val || t('employees.detail.columns.office')}</span>
        ),
      },
    ],
    [t, formatDate]
  )

  const leaveColumns = useMemo(
    () => [
      {
        key: 'leave_type',
        label: t('employees.detail.columns.leave_type'),
        render: (val) => <span className="font-medium capitalize">{val}</span>,
      },
      {
        key: 'start_date',
        label: t('employees.detail.columns.from'),
        render: (val) => formatDate(val),
      },
      {
        key: 'end_date',
        label: t('employees.detail.columns.to'),
        render: (val) => formatDate(val),
      },
      {
        key: 'duration',
        label: t('employees.detail.columns.days'),
        render: (val) => val || '1',
      },
      {
        key: 'status',
        label: t('employees.detail.columns.status'),
        render: (val) => {
          const k = String(val || '').toLowerCase()
          const tk = k ? t(`employees.detail.leave_status.${k}`) : val
          return (
            <Badge variant={val === 'approved' ? 'success' : val === 'rejected' ? 'danger' : 'warning'}>
              {tk}
            </Badge>
          )
        },
      },
      {
        key: 'reason',
        label: t('employees.detail.columns.reason'),
        render: (val) => val || '--',
      },
    ],
    [t, formatDate]
  )

  const documentColumns = useMemo(
    () => [
      {
        key: 'name',
        label: t('employees.detail.columns.document_name'),
        render: (val) => <span className="font-medium text-blue-600">{val}</span>,
      },
      {
        key: 'type',
        label: t('employees.detail.columns.type'),
        render: (val) => val || '--',
      },
      {
        key: 'created_at',
        label: t('employees.detail.columns.uploaded'),
        render: (val) => formatDate(val),
      },
      {
        key: 'file_size',
        label: t('employees.detail.columns.size'),
        render: (val) => (val ? `${(val / 1024).toFixed(2)} KB` : '--'),
      },
    ],
    [t, formatDate]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!employee) {
    return <div className="p-6 text-center text-gray-500">{t('employees.detail.not_found')}</div>
  }

  const InfoRow = ({ label, value }) => (
    <div className="flex py-3 border-b border-gray-100 last:border-0">
      <span className="w-48 text-gray-500 text-sm shrink-0">{label}</span>
      <span className="text-gray-900 text-sm font-medium">{value || '--'}</span>
    </div>
  )

  const L = (key) => t(`employees.detail.labels.${key}`)

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/admin/employees')}
            className="text-gray-500 hover:text-gray-700"
          >
            <IoArrowBack size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-600">
              {employee.name?.charAt(0).toUpperCase() || 'E'}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{employee.name}</h1>
              <p className="text-sm text-gray-500">
                {employee.position_name || t('employees.detail.employee_fallback')} •{' '}
                {employee.department_name || t('employees.detail.no_department')} | {t('employees.detail.user_role')}:{' '}
                {employee.user_role || t('employees.detail.employee_fallback')}
              </p>
              <p className="text-xs text-gray-400">{t('employees.detail.last_login_placeholder')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex gap-12">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{tasks.filter((tk) => tk.status !== 'Done').length}</p>
            <p className="text-xs text-blue-600">{t('employees.detail.open_tasks')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            <p className="text-xs text-blue-600">{t('employees.detail.projects')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">--</p>
            <p className="text-xs text-blue-600">{t('employees.detail.hours_logged')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{leaves.filter((l) => l.status === 'approved').length}</p>
            <p className="text-xs text-blue-600">{t('employees.detail.leaves_taken')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          {tabDefs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 bg-gray-50">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                  <h3 className="text-base font-bold text-gray-900">{t('employees.detail.about')}</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 leading-relaxed">{employee.about || t('employees.detail.no_about')}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                  <h3 className="text-base font-bold text-gray-900">{t('employees.detail.profile_info')}</h3>
                </div>
                <div className="p-6">
                  <InfoRow label={L('employee_id')} value={employee.employee_number} />
                  <InfoRow label={L('full_name')} value={employee.name} />
                  <InfoRow label={L('designation')} value={employee.position_name} />
                  <InfoRow label={L('department')} value={employee.department_name} />
                  <InfoRow label={L('gender')} value={employee.gender} />
                  <InfoRow label={L('date_of_birth')} value={formatDate(employee.date_of_birth)} />
                  <InfoRow label={L('email')} value={employee.email} />
                  <InfoRow label={L('phone')} value={employee.phone} />
                  <InfoRow label={L('address')} value={employee.address} />
                  <InfoRow label={L('country')} value={employee.country} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                  <h3 className="text-base font-bold text-gray-900">{t('employees.detail.work_details')}</h3>
                </div>
                <div className="p-6">
                  <InfoRow label={L('reporting_to')} value={employee.reporting_to_name} />
                  <InfoRow label={L('office_shift')} value={employee.shift_name} />
                  <InfoRow label={L('salary')} value={employee.salary ? `$${Number(employee.salary).toLocaleString(dateLocale)}` : null} />
                  <InfoRow label={L('hourly_rate')} value={employee.hourly_rate ? `$${employee.hourly_rate}` : null} />
                  <InfoRow label={L('skills')} value={employee.skills} />
                  <InfoRow label={L('language')} value={employee.language} />
                  <InfoRow label={L('joining_date')} value={formatDate(employee.joining_date)} />
                  <InfoRow label={L('probation_end')} value={formatDate(employee.probation_end_date)} />
                  <InfoRow label={L('contract_end')} value={formatDate(employee.contract_end_date)} />
                  <InfoRow label={L('notice_period_start')} value={formatDate(employee.notice_period_start_date)} />
                  <InfoRow label={L('notice_period_end')} value={formatDate(employee.notice_period_end_date)} />
                  <InfoRow label={L('employment_type')} value={employee.employment_type} />
                  <InfoRow label={L('marital_status')} value={employee.marital_status} />
                  <InfoRow label={L('business_address')} value={employee.business_address} />
                  <InfoRow label={L('slack_member_id')} value={employee.slack_member_id} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:translate-y-[-2px] transition-transform duration-300">
                  <p className="text-3xl font-extrabold text-red-500">{attendance.filter((a) => a.status === 'late').length}</p>
                  <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wide">{t('employees.detail.late_days')}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:translate-y-[-2px] transition-transform duration-300">
                  <p className="text-3xl font-extrabold text-blue-500">{leaves.filter((l) => l.status === 'approved').length}</p>
                  <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wide">{t('employees.detail.leaves_taken')}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl flex justify-between items-center">
                  <h3 className="text-base font-bold text-gray-900">{t('employees.detail.recent_tasks')}</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tasks')}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    {t('employees.detail.view_all')}
                  </button>
                </div>
                <div className="p-4">
                  {tasks.length > 0 ? (
                    <div className="space-y-3">
                      {tasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors cursor-default"
                        >
                          <p className="font-semibold text-gray-900 truncate">{task.title}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">{task.project_name || t('employees.detail.no_project')}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${task.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {translateTaskStatus(task.status, t)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-6">{t('employees.detail.no_tasks_assigned')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <IoBriefcase className="text-blue-600" /> {t('employees.detail.assigned_projects')}
              </h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {projects.length} {t('employees.detail.total_suffix')}
              </span>
            </div>
            <DataTable columns={projectColumns} data={projects} loading={loadingProjects} emptyMessage={t('employees.detail.empty_projects')} />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <IoCheckmarkCircle className="text-green-600" /> {t('employees.detail.assigned_tasks')}
              </h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {tasks.length} {t('employees.detail.total_suffix')}
              </span>
            </div>
            <DataTable columns={taskColumns} data={tasks} loading={loadingTasks} emptyMessage={t('employees.detail.empty_tasks')} />
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <IoTime className="text-indigo-600" /> {t('employees.detail.attendance_history')}
              </h3>
              <div className="flex items-center gap-3">
                <select
                  value={attendanceMonth}
                  onChange={(e) => setAttendanceMonth(parseInt(e.target.value, 10))}
                  className="border border-gray-300 rounded px-2 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary-accent outline-none"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={attendanceYear}
                  onChange={(e) => setAttendanceYear(parseInt(e.target.value, 10))}
                  className="border border-gray-300 rounded px-2 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary-accent outline-none"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                  {attendance.length} {t('employees.detail.records_suffix')}
                </span>
              </div>
            </div>
            <DataTable
              columns={attendanceColumns}
              data={attendance}
              loading={loadingAttendance}
              emptyMessage={t('employees.detail.empty_attendance')}
            />
          </div>
        )}

        {activeTab === 'leaves' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <IoCalendarOutline className="text-purple-600" /> {t('employees.detail.leave_requests')}
              </h3>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                {leaves.length} {t('employees.detail.total_suffix')}
              </span>
            </div>
            <DataTable columns={leaveColumns} data={leaves} loading={loadingLeaves} emptyMessage={t('employees.detail.empty_leaves')} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <IoDocumentText className="text-orange-600" /> {t('employees.detail.documents')}
              </h3>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                {documents.length} {t('employees.detail.total_suffix')}
              </span>
            </div>
            <DataTable columns={documentColumns} data={documents} loading={loadingDocuments} emptyMessage={t('employees.detail.empty_documents')} />
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeDetail
