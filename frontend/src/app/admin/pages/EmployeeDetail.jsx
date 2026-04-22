import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { employeesAPI, projectsAPI, tasksAPI, attendanceAPI, documentsAPI, leaveRequestsAPI } from '../../../api'
import Badge from '../../../components/ui/Badge'
import DataTable from '../../../components/ui/DataTable'
import {
    IoArrowBack, IoBriefcase, IoCheckmarkCircle,
    IoPencil, IoDocumentText, IoCalendarOutline, IoTime
} from 'react-icons/io5'

const EmployeeDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
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

    const companyId = parseInt(localStorage.getItem('companyId') || 1)

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
                member_user_id: employee.user_id
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
                assigned_to: employee.user_id
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
                year: attendanceYear
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
                user_id: employee.user_id
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
                uploaded_by: employee.user_id
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

    const formatDate = (dateStr) => {
        if (!dateStr) return '--'
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!employee) {
        return <div className="p-6 text-center text-gray-500">Employee not found</div>
    }

    const tabs = ['Profile', 'Projects', 'Tasks', 'Attendance', 'Leaves', 'Documents']

    const InfoRow = ({ label, value }) => (
        <div className="flex py-3 border-b border-gray-100 last:border-0">
            <span className="w-48 text-gray-500 text-sm shrink-0">{label}</span>
            <span className="text-gray-900 text-sm font-medium">{value || '--'}</span>
        </div>
    )

    const projectColumns = [
        { key: 'project_name', label: 'Project Name', render: (val) => <span className="text-blue-600 font-medium">{val}</span> },
        { key: 'client_name', label: 'Client', render: (val) => val || <span className="text-gray-400">--</span> },
        { key: 'deadline', label: 'Deadline', render: (val) => formatDate(val) },
        { key: 'status', label: 'Status', render: (val) => <Badge variant={val === 'completed' ? 'success' : val === 'In Bearbeitung' ? 'primary' : 'warning'}>{val}</Badge> }
    ]

    const taskColumns = [
        { key: 'title', label: 'Task', render: (val) => <span className="font-medium text-gray-900">{val}</span> },
        { key: 'project_name', label: 'Project', render: (val) => val || '--' },
        { key: 'due_date', label: 'Due Date', render: (val) => formatDate(val) },
        {
            key: 'priority', label: 'Priority', render: (val) => (
                <span className={`text-xs px-2 py-0.5 rounded ${val === 'High' ? 'bg-red-100 text-red-700' : val === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{val}</span>
            )
        },
        { key: 'status', label: 'Status', render: (val) => <Badge variant={val === 'Done' ? 'success' : 'default'}>{val}</Badge> }
    ]

    const attendanceColumns = [
        { key: 'date', label: 'Date', render: (val) => formatDate(val) },
        {
            key: 'status', label: 'Status', render: (val) => {
                const statusColors = {
                    present: 'bg-green-100 text-green-700',
                    absent: 'bg-red-100 text-red-700',
                    half_day: 'bg-orange-100 text-orange-700',
                    late: 'bg-yellow-100 text-yellow-700',
                    on_leave: 'bg-purple-100 text-purple-700',
                    holiday: 'bg-amber-100 text-amber-700',
                    day_off: 'bg-blue-100 text-blue-700'
                }
                return <span className={`text-xs px-2 py-1 rounded font-medium capitalize ${statusColors[val] || 'bg-gray-100'}`}>{val?.replace('_', ' ')}</span>
            }
        },
        { key: 'clock_in', label: 'Clock In', render: (val) => val || '--' },
        { key: 'clock_out', label: 'Clock Out', render: (val) => val || '--' },
        { key: 'work_from', label: 'Work From', render: (val) => <span className="capitalize">{val || 'Office'}</span> }
    ]

    const leaveColumns = [
        { key: 'leave_type', label: 'Leave Type', render: (val) => <span className="font-medium capitalize">{val}</span> },
        { key: 'start_date', label: 'From', render: (val) => formatDate(val) },
        { key: 'end_date', label: 'To', render: (val) => formatDate(val) },
        { key: 'duration', label: 'Days', render: (val) => val || '1' },
        {
            key: 'status', label: 'Status', render: (val) => (
                <Badge variant={val === 'approved' ? 'success' : val === 'rejected' ? 'danger' : 'warning'}>{val}</Badge>
            )
        },
        { key: 'reason', label: 'Reason', render: (val) => val || '--' }
    ]

    const documentColumns = [
        { key: 'name', label: 'Document Name', render: (val) => <span className="font-medium text-blue-600">{val}</span> },
        { key: 'type', label: 'Type', render: (val) => val || '--' },
        { key: 'created_at', label: 'Uploaded', render: (val) => formatDate(val) },
        { key: 'file_size', label: 'Size', render: (val) => val ? `${(val / 1024).toFixed(2)} KB` : '--' }
    ]

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    return (
        <div className="bg-white min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/app/admin/employees')} className="text-gray-500 hover:text-gray-700">
                            <IoArrowBack size={20} />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-600">
                                {employee.name?.charAt(0).toUpperCase() || 'E'}
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">{employee.name}</h1>
                                <p className="text-sm text-gray-500">
                                    {employee.position_name || 'Employee'} • {employee.department_name || 'No Department'} | User Role: {employee.user_role || 'Employee'}
                                </p>
                                <p className="text-xs text-gray-400">Last login at --</p>
                            </div>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors active:scale-95">
                        <IoPencil size={14} /> Edit Profile
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex gap-12">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status !== 'Done').length}</p>
                        <p className="text-xs text-blue-600">Open Tasks</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                        <p className="text-xs text-blue-600">Projects</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">--</p>
                        <p className="text-xs text-blue-600">Hours Logged</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{leaves.filter(l => l.status === 'approved').length}</p>
                        <p className="text-xs text-blue-600">Leaves Taken</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === tab.toLowerCase()
                                ? 'border-red-500 text-red-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 bg-gray-50">
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="lg:col-span-2 space-y-6">
                            {/* About */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                                    <h3 className="text-base font-bold text-gray-900">About</h3>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-gray-600 leading-relaxed">{employee.about || 'No information provided.'}</p>
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                                    <h3 className="text-base font-bold text-gray-900">Profile Info</h3>
                                </div>
                                <div className="p-6">
                                    <InfoRow label="Employee ID" value={employee.employee_number} />
                                    <InfoRow label="Full Name" value={employee.name} />
                                    <InfoRow label="Designation" value={employee.position_name} />
                                    <InfoRow label="Department" value={employee.department_name} />
                                    <InfoRow label="Gender" value={employee.gender} />
                                    <InfoRow label="Date of Birth" value={formatDate(employee.date_of_birth)} />
                                    <InfoRow label="Email" value={employee.email} />
                                    <InfoRow label="Phone" value={employee.phone} />
                                    <InfoRow label="Address" value={employee.address} />
                                    <InfoRow label="Country" value={employee.country} />
                                </div>
                            </div>

                            {/* Work Details */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                                    <h3 className="text-base font-bold text-gray-900">Work Details</h3>
                                </div>
                                <div className="p-6">
                                    <InfoRow label="Reporting To" value={employee.reporting_to_name} />
                                    <InfoRow label="Office Shift" value={employee.shift_name} />
                                    <InfoRow label="Salary" value={employee.salary ? `$${Number(employee.salary).toLocaleString()}` : null} />
                                    <InfoRow label="Hourly Rate" value={employee.hourly_rate ? `$${employee.hourly_rate}` : null} />
                                    <InfoRow label="Skills" value={employee.skills} />
                                    <InfoRow label="Language" value={employee.language} />
                                    <InfoRow label="Joining Date" value={formatDate(employee.joining_date)} />
                                    <InfoRow label="Probation End" value={formatDate(employee.probation_end_date)} />
                                    <InfoRow label="Contract End" value={formatDate(employee.contract_end_date)} />
                                    <InfoRow label="Notice Period Start" value={formatDate(employee.notice_period_start_date)} />
                                    <InfoRow label="Notice Period End" value={formatDate(employee.notice_period_end_date)} />
                                    <InfoRow label="Employment Type" value={employee.employment_type} />
                                    <InfoRow label="Marital Status" value={employee.marital_status} />
                                    <InfoRow label="Business Address" value={employee.business_address} />
                                    <InfoRow label="Slack Member ID" value={employee.slack_member_id} />
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:translate-y-[-2px] transition-transform duration-300">
                                    <p className="text-3xl font-extrabold text-red-500">{attendance.filter(a => a.status === 'late').length}</p>
                                    <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wide">Late Days</p>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:translate-y-[-2px] transition-transform duration-300">
                                    <p className="text-3xl font-extrabold text-blue-500">{leaves.filter(l => l.status === 'approved').length}</p>
                                    <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wide">Leaves Taken</p>
                                </div>
                            </div>

                            {/* Tasks Widget */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl flex justify-between items-center">
                                    <h3 className="text-base font-bold text-gray-900">Recent Tasks</h3>
                                    <button onClick={() => setActiveTab('tasks')} className="text-xs font-medium text-blue-600 hover:text-blue-700">View All</button>
                                </div>
                                <div className="p-4">
                                    {tasks.length > 0 ? (
                                        <div className="space-y-3">
                                            {tasks.slice(0, 3).map(task => (
                                                <div key={task.id} className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors cursor-default">
                                                    <p className="font-semibold text-gray-900 truncate">{task.title}</p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-xs text-gray-500">{task.project_name || 'No Project'}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${task.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{task.status}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm text-center py-6">No tasks assigned</p>
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
                                <IoBriefcase className="text-blue-600" /> Assigned Projects
                            </h3>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{projects.length} Total</span>
                        </div>
                        <DataTable columns={projectColumns} data={projects} loading={loadingProjects} emptyMessage="No projects assigned." />
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <IoCheckmarkCircle className="text-green-600" /> Assigned Tasks
                            </h3>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{tasks.length} Total</span>
                        </div>
                        <DataTable columns={taskColumns} data={tasks} loading={loadingTasks} emptyMessage="No tasks assigned." />
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <IoTime className="text-indigo-600" /> Attendance History
                            </h3>
                            <div className="flex items-center gap-3">
                                <select value={attendanceMonth} onChange={(e) => setAttendanceMonth(parseInt(e.target.value))}
                                    className="border border-gray-300 rounded px-2 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary-accent outline-none">
                                    {months.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
                                </select>
                                <select value={attendanceYear} onChange={(e) => setAttendanceYear(parseInt(e.target.value))}
                                    className="border border-gray-300 rounded px-2 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary-accent outline-none">
                                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{attendance.length} Records</span>
                            </div>
                        </div>
                        <DataTable columns={attendanceColumns} data={attendance} loading={loadingAttendance} emptyMessage="No attendance records found for this month." />
                    </div>
                )}

                {activeTab === 'leaves' && (
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <IoCalendarOutline className="text-purple-600" /> Leave Requests
                            </h3>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">{leaves.length} Total</span>
                        </div>
                        <DataTable columns={leaveColumns} data={leaves} loading={loadingLeaves} emptyMessage="No leave requests found." />
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <IoDocumentText className="text-orange-600" /> Documents
                            </h3>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">{documents.length} Total</span>
                        </div>
                        <DataTable columns={documentColumns} data={documents} loading={loadingDocuments} emptyMessage="No documents found." />
                    </div>
                )}
            </div>
        </div>
    )
}

export default EmployeeDetail
