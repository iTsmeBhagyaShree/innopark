import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useSettings } from '../../../context/SettingsContext'
import { useLanguage } from '../../../context/LanguageContext.jsx'
import { employeesAPI, tasksAPI, eventsAPI, projectsAPI, leadsAPI, dealsAPI } from '../../../api'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { 
  IoCheckbox, 
  IoCalendar, 
  IoNotifications, 
  IoFlag,
  IoTime,
  IoArrowForward,
  IoFolderOpen,
  IoPerson,
  IoDocumentText,
  IoStopwatch,
  IoChatbubbles,
  IoSettings,
  IoAdd,
  IoEye,
  IoRefresh,
  IoLayers,
  IoPeople,
  IoTrendingUp,
  IoCash,
  IoReceipt,
  IoBriefcase,
} from 'react-icons/io5'

const EmployeeDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { formatCurrency } = useSettings()
  const { t } = useLanguage()
  const userId = user?.id || localStorage.getItem('userId')
  const companyId = user?.company_id || localStorage.getItem('companyId')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardStats, setDashboardStats] = useState({
    my_tasks: 0,
    pending_tasks: 0,
    completed_tasks: 0,
    my_projects: 0,
    active_projects: 0,
    attendance_percentage: 0,
    time_logged_this_week: 0,
    leave_requests: 0,
    upcoming_events: 0,
    unread_messages: 0,
    my_documents: 0,
    my_leads: 0,
    my_deals: 0,
    my_deals_value: 0,
    my_offers: 0,
    my_invoices: 0
  })
    const [todayTasks, setTodayTasks] = useState([])
    const [upcomingEvents, setUpcomingEvents] = useState([])
    const [recentNotifications, setRecentNotifications] = useState([])
    const [recentLeads, setRecentLeads] = useState([])
    const [goalProgress, setGoalProgress] = useState({
        label: t('dashboard.completedTasks'),
        current: 0,
        target: 100,
        unit: '%'
    })

    useEffect(() => {
        if (userId && companyId) {
            fetchDashboardData()
        }
    }, [userId, companyId])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            setError(null)

            const today = new Date().toISOString().split('T')[0]

            const [statsResponse, tasksResponse, eventsResponse, leadsResponse] = await Promise.all([
                employeesAPI.getDashboardStats({ user_id: userId, company_id: companyId }),
                tasksAPI.getAll({ company_id: companyId, assigned_to: userId, due_date: today }),
                eventsAPI.getAll({ company_id: companyId, user_id: userId }),
                leadsAPI.getAll({ company_id: companyId, assigned_to: user?.role === 'EMPLOYEE' ? userId : undefined, limit: 5 })
            ])

            if (statsResponse.data.success) {
                setDashboardStats(statsResponse.data.data)
                const totalTasks = statsResponse.data.data.my_tasks || 0
                const completedTasks = statsResponse.data.data.completed_tasks || 0
                const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                setGoalProgress(prev => ({ ...prev, current: taskCompletion }))
            }

            if (tasksResponse.data.success) {
                const tasksData = tasksResponse.data.data || []
                const transformedTasks = tasksData.map(task => {
                    const dueDate = task.due_date ? new Date(task.due_date) : null
                    const rawPriority = (task.priority || '').toString().toLowerCase()
                    const rawStatus = (task.status || '').toString().toLowerCase()
                    const localizedPriority =
                      rawPriority === 'high'
                        ? t('tasks.high_short')
                        : rawPriority === 'medium'
                          ? t('tasks.medium_short')
                          : rawPriority === 'low'
                            ? t('tasks.low_short')
                            : t('tasks.medium_short')
                    const localizedStatus =
                      rawStatus === 'completed' || rawStatus === 'done'
                        ? t('common.status.completed')
                        : rawStatus === 'in progress' || rawStatus === 'in_progress'
                          ? t('common.status.in_progress')
                          : rawStatus === 'pending'
                            ? t('common.status.pending')
                            : task.status || t('common.status.pending')
                    return {
                        id: task.id,
                        title: task.title || `${t('sidebar.tasks')} #${task.id}`,
                        project: task.project_name || task.projectName || t('common.na'),
                        priority: localizedPriority,
                        priorityLevel: rawPriority || 'medium',
                        status: localizedStatus,
                        dueTime: dueDate ? dueDate.toLocaleTimeString(t('locale') === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : t('common.na'),
                        completed: rawStatus === 'completed' || rawStatus === 'done'
                    }
                })
                setTodayTasks(transformedTasks)
            }

            if (eventsResponse.data.success) {
                const eventsData = eventsResponse.data.data || []
                const transformedEvents = eventsData.map(event => ({
                    id: event.id,
                    title: event.title || event.event_name || `${t('Event')} #${event.id}`,
                    time: event.starts_on_time || t('common.na'),
                    location: event.where || event.location || 'Büro'
                }))
                setUpcomingEvents(transformedEvents)
            }

            if (leadsResponse.data.success) {
                setRecentLeads((leadsResponse.data.data || []).slice(0, 5))
            }

        } catch (err) {
            console.error('Error fetching dashboard data:', err)
            setError(err.response?.data?.error || err.message || t('common.loading_failed'))
        } finally {
            setLoading(false)
        }
    }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <Button variant="primary" onClick={() => fetchDashboardData()} className="mt-4 flex items-center gap-2 mx-auto">
            <IoRefresh size={18} /> {t('common.retry')}
          </Button>
        </div>
      </div>
    )
  }

  const statsList = [
    { label: t('sidebar.leads'), value: dashboardStats.my_leads?.toString() || '0', subtitle: t('common.total'), icon: IoPeople, color: 'text-teal-600', bgColor: 'bg-teal-100', path: '/app/employee/leads' },
    { label: t('sidebar.deals'), value: dashboardStats.my_deals?.toString() || '0', subtitle: formatCurrency(dashboardStats.my_deals_value || 0), icon: IoBriefcase, color: 'text-blue-600', bgColor: 'bg-blue-100', path: '/app/employee/deals' },
    { label: t('sidebar.tasks'), value: dashboardStats.my_tasks?.toString() || '0', subtitle: `${t('tasks.pending')}: ${dashboardStats.pending_tasks || 0} | ${t('tasks.completed')}: ${dashboardStats.completed_tasks || 0}`, icon: IoCheckbox, color: 'text-primary-accent', bgColor: 'bg-primary-accent/10', path: '/app/employee/my-tasks' },
    { label: t('sidebar.estimates'), value: dashboardStats.my_offers?.toString() || '0', subtitle: t('status.draft'), icon: IoReceipt, color: 'text-violet-600', bgColor: 'bg-violet-100', path: '/app/employee/offers' },
    { label: t('sidebar.invoices'), value: dashboardStats.my_invoices?.toString() || '0', subtitle: t('invoices.unpaid'), icon: IoCash, color: 'text-green-600', bgColor: 'bg-green-100', path: '/app/employee/invoices' },
    { label: t('sidebar.messages'), value: dashboardStats.unread_messages?.toString() || '0', subtitle: t('status.pending'), icon: IoChatbubbles, color: 'text-orange-600', bgColor: 'bg-orange-100', path: '/app/employee/messages' },
  ]

  const quickAccessMenus = [
    { category: t('sidebar.crm'), items: [
      { label: t('my_leads'), icon: IoLayers, path: '/app/employee/leads', color: 'text-teal-600', bgColor: 'bg-teal-100', count: t('view') },
      { label: t('my_tasks'), icon: IoCheckbox, path: '/app/employee/my-tasks', color: 'text-orange-600', bgColor: 'bg-orange-100', count: dashboardStats.my_tasks?.toString() || '0' },
      { label: t('sidebar.calendar'), icon: IoCalendar, path: '/app/employee/calendar', color: 'text-violet-600', bgColor: 'bg-violet-100', count: `${dashboardStats.upcoming_events || 0}` },
    ]},
    { category: t('sidebar.employees'), items: [{ label: t('sidebar.my_profile'), icon: IoPerson, path: '/app/employee/my-profile', color: 'text-pink-600', bgColor: 'bg-pink-100', count: t('view') }]},
    { category: t('sidebar.communication'), items: [
      { label: t('sidebar.messages'), icon: IoChatbubbles, path: '/app/employee/messages', color: 'text-blue-600', bgColor: 'bg-blue-100', count: dashboardStats.unread_messages?.toString() || '0' },
      { label: t('sidebar.notifications'), icon: IoNotifications, path: '/app/employee/notifications', color: 'text-red-600', bgColor: 'bg-red-100', count: recentNotifications.length.toString() },
    ]},
    { category: t('sidebar.settings'), items: [{ label: t('sidebar.settings'), icon: IoSettings, path: '/app/employee/settings', color: 'text-gray-600', bgColor: 'bg-gray-100', count: t('sidebar.settings') }]},
  ]

  if (loading) {
    return <div className="p-6 text-center py-8"><p className="text-secondary-text">{t('common.loading')}</p></div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">{t('dashboard.title')}</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">{t('dashboard.overview')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate('/app/employee/leads')} className="flex items-center gap-2 shadow-lg shadow-teal-500/30 bg-teal-600 hover:bg-teal-700 border-none"><IoAdd size={18} /><span className="hidden sm:inline">{t('leads.add_lead')}</span><span className="sm:hidden">{t('leads.title')}</span></Button>
          <Button variant="primary" onClick={() => navigate('/app/employee/my-tasks')} className="flex items-center gap-2 shadow-lg shadow-primary-accent/30"><IoAdd size={18} /><span className="hidden sm:inline">{t('tasks.add_task')}</span><span className="sm:hidden">{t('tasks.title')}</span></Button>
          <Button variant="outline" onClick={() => fetchDashboardData()} className="flex items-center gap-2"><IoRefresh size={18} /><span className="hidden sm:inline">{t('common.refresh')}</span></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-4">
        {statsList.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100" onClick={() => navigate(stat.path)}>
              <div className="flex items-start justify-between min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 truncate">{stat.label}</p>
                  <p className="text-lg sm:text-xl font-black text-gray-900 mb-0.5">{stat.value}</p>
                  <p className="text-[10px] text-gray-500 font-medium truncate">{stat.subtitle}</p>
                </div>
                <div className={`${stat.color} ${stat.bgColor} p-2 rounded-lg flex-shrink-0 ml-1`}><Icon size={18} /></div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-4 sm:p-5 md:p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-primary-text flex items-center gap-2"><IoCheckbox className="text-primary-accent" size={24} />{t('dashboard.pendingTasks')}</h2>
          <Button variant="ghost" onClick={() => navigate('/app/employee/my-tasks')} className="text-sm flex items-center gap-1">{t('common.view_all')}<IoArrowForward size={16} /></Button>
        </div>
        <div className="space-y-3">
          {todayTasks.length === 0 ? <div className="text-center py-8 text-secondary-text"><IoCheckbox size={36} className="mx-auto mb-2 opacity-30" /><p className="text-sm">{t('common.no_data_found')}</p></div> : todayTasks.slice(0, 5).map((task) => (
            <div key={task.id} className={`p-3 sm:p-4 rounded-lg border transition-colors ${task.completed ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-200 hover:border-primary-accent/50'}`}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={task.completed} onChange={() => {}} className="mt-1 w-4 h-4 text-primary-accent rounded focus:ring-primary-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`font-semibold text-sm sm:text-base truncate ${task.completed ? 'line-through text-secondary-text' : 'text-primary-text'}`}>{task.title}</h3>
                    <Badge variant={task.priorityLevel === 'high' ? 'danger' : task.priorityLevel === 'medium' ? 'warning' : 'default'} className="flex-shrink-0 text-xs">{task.priority}</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-secondary-text mb-2 truncate">{task.project}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-secondary-text"><span className="flex items-center gap-1"><IoTime size={14} />{task.dueTime}</span><Badge variant={task.completed ? 'success' : task.status === t('common.status.in_progress') ? 'info' : 'warning'}>{task.status}</Badge></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5 md:p-6 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-primary-text flex items-center gap-2"><IoCalendar className="text-primary-accent" size={24} />{t('dashboard.upcomingEvents')}</h2>
            <Button variant="ghost" onClick={() => navigate('/app/employee/calendar')} className="text-sm">{t('sidebar.calendar')}</Button>
          </div>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? <div className="text-center py-8 text-secondary-text"><IoCalendar size={36} className="mx-auto mb-2 opacity-30" /><p className="text-sm">{t('common.no_data_found')}</p></div> : upcomingEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-sm sm:text-base text-primary-text mb-1 truncate">{event.title}</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-secondary-text"><IoTime size={14} /><span>{event.time}</span>{event.location && <><span>•</span><span className="truncate">{event.location}</span></>}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 md:p-6 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-primary-text flex items-center gap-2"><IoNotifications className="text-primary-accent" size={24} />{t('sidebar.notices')}</h2>
            <Button variant="ghost" onClick={() => navigate('/app/employee/notifications')} className="text-sm">{t('common.view_all')}</Button>
          </div>
          <div className="space-y-3">
            {recentNotifications.length === 0 ? <div className="text-center py-8 text-secondary-text"><IoNotifications size={36} className="mx-auto mb-2 opacity-30" /><p className="text-sm">{t('common.no_data_found')}</p></div> : recentNotifications.map((notification) => (
              <div key={notification.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200"><p className="text-sm text-primary-text mb-1">{notification.message}</p><p className="text-xs text-secondary-text">{notification.time}</p></div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5 md:p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6"><div><h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><IoBriefcase className="text-blue-500" size={20} /> {t('dashboard.sales_pipeline')}</h3><p className="text-sm text-gray-500">{t('dashboard.overview')}</p></div></div>
          {(!dashboardStats.pipeline_stages || dashboardStats.pipeline_stages.length === 0) ? <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2"><IoBriefcase size={40} className="opacity-20" /><p className="text-xs font-bold uppercase tracking-widest">{t('common.noData')}</p></div> : (
            <div className="overflow-x-auto scrollbar-hide"><div className="min-w-[400px]"><div className="h-48 flex items-end justify-between gap-4 px-2">{dashboardStats.pipeline_stages.map((stage, i) => { const maxVal = Math.max(...dashboardStats.pipeline_stages.map(s => s.value), 1); return ( <div key={i} className="flex-1 flex flex-col items-center group"><div className="relative w-full"><div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">{formatCurrency(stage.value)}</div><div className="w-full rounded-t-lg transition-all duration-500 bg-blue-500/80 group-hover:bg-blue-600" style={{ height: `${(stage.value / maxVal) * 150}px` }} /></div><p className="text-[10px] text-gray-500 mt-2 font-black text-center uppercase truncate w-full">{stage.stage}</p></div> )})}</div><div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between"><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.total_pipeline_value')}</span><span className="text-lg font-black text-gray-900">{formatCurrency(dashboardStats.my_deals_value || 0)}</span></div></div></div>
          )}
        </Card>

        <Card className="p-4 sm:p-5 md:p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6"><div><h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><IoPeople className="text-teal-500" size={20} /> {t('dashboard.leads_by_source')}</h3><p className="text-sm text-gray-500">{t('dashboard.overview')}</p></div></div>
          {(!dashboardStats.leads_by_source || dashboardStats.leads_by_source.length === 0) ? <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2"><IoPeople size={40} className="opacity-20" /><p className="text-xs font-bold uppercase tracking-widest">{t('common.noData')}</p></div> : (
            <div className="flex flex-col sm:flex-row items-center gap-8 h-48 sm:h-auto"><div className="relative w-32 h-32 flex-shrink-0"><svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90"><circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f3f4f6" strokeWidth="4" />{dashboardStats.leads_by_source.map((source, idx) => { const offset = dashboardStats.leads_by_source.slice(0, idx).reduce((sum, s) => sum + (s.percentage || 0), 0); const colors = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']; return <circle key={idx} cx="18" cy="18" r="15.915" fill="transparent" stroke={colors[idx % colors.length]} strokeWidth="4" strokeDasharray={`${source.percentage || 0} ${100 - (source.percentage || 0)}`} strokeDashoffset={-offset} /> })}</svg><div className="absolute inset-0 flex flex-col items-center justify-center text-center"><span className="text-xl font-black text-gray-900">{dashboardStats.my_leads}</span><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('sidebar.leads')}</span></div></div><div className="flex-1 w-full space-y-2 overflow-y-auto max-h-48 custom-scrollbar pr-2">{dashboardStats.leads_by_source.map((s, i) => { const colors = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']; return <div key={i} className="flex items-center justify-between group"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} /><span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors uppercase tracking-tight">{s.source}</span></div><div className="flex items-center gap-2"><span className="text-xs font-black text-gray-900">{s.count}</span><span className="text-[10px] font-bold text-gray-400">({s.percentage}%)</span></div></div> })}</div></div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5 md:p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><IoPeople size={22} className="text-teal-500" /> {t('leads.total_leads')}</h2><Button variant="ghost" onClick={() => navigate('/app/employee/leads')} className="text-xs font-bold uppercase tracking-widest text-teal-600">{t('common.view_all')}</Button></div>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-gray-50"><th className="py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('leads.columns.lead_name')}</th><th className="py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('common.status')}</th><th className="py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('common.bill_date')}</th></tr></thead><tbody className="divide-y divide-gray-50">{recentLeads.length === 0 ? <tr><td colSpan="3" className="py-8 text-center text-gray-400 italic">{t('common.no_data_found')}</td></tr> : recentLeads.map(lead => ( <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/app/employee/leads/${lead.id}`)}><td className="py-3 pr-2"><p className="font-bold text-gray-800">{lead.name}</p><p className="text-[10px] text-gray-400 font-medium">{lead.email}</p></td><td className="py-3 pr-2"><Badge variant="default" className="text-[9px] font-black uppercase">{lead.status}</Badge></td><td className="py-3 text-[10px] text-gray-400 font-bold whitespace-nowrap">{lead.created_at ? new Date(lead.created_at).toLocaleDateString(t('locale') === 'de' ? 'de-DE' : 'en-US') : t('common.na')}</td></tr> ))}</tbody></table></div>
        </Card>

        <Card className="p-4 sm:p-5 md:p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><IoCalendar size={22} className="text-blue-500" /> {t('upcoming_events')}</h2><Button variant="ghost" onClick={() => navigate('/app/employee/calendar')} className="text-xs font-bold uppercase tracking-widest text-blue-600">{t('sidebar.calendar')}</Button></div>
          <div className="space-y-3">{upcomingEvents.length === 0 ? <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2"><IoCalendar size={32} className="opacity-20" /><p className="text-xs font-bold uppercase tracking-widest">{t('no_events')}</p></div> : upcomingEvents.slice(0, 4).map((event) => ( <div key={event.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center gap-3 group hover:border-blue-200 transition-all cursor-pointer"><div className="w-10 h-10 rounded-lg bg-blue-100 flex flex-col items-center justify-center text-blue-600 font-black"><span className="text-[10px]">{new Date().toLocaleDateString(t('locale') === 'de' ? 'de-DE' : 'en-US', {weekday: 'short'}).toUpperCase()}</span><span className="text-sm leading-none">{new Date().getDate()}</span></div><div className="flex-1 min-w-0"><h3 className="font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{event.title}</h3><div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase"><IoTime size={12} /> {event.time} {event.location && <span className="truncate">• {event.location}</span>}</div></div></div> ))}</div>
        </Card>
      </div>

      {quickAccessMenus.map((section, sectionIndex) => (
        <Card key={sectionIndex} className="p-4 sm:p-5 md:p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold text-primary-text mb-4">{section.category}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon
              return (
                <button key={itemIndex} onClick={() => navigate(item.path)} className="group p-4 rounded-lg border border-gray-200 hover:border-primary-accent hover:shadow-md transition-all text-left bg-white hover:bg-primary-accent/5">
                  <div className="flex items-start justify-between mb-2"><div className={`${item.color} ${item.bgColor} p-2 rounded-lg`}><Icon size={20} /></div>{item.count && <Badge variant="default" className="text-xs">{item.count}</Badge>}</div>
                  <p className="text-sm font-medium text-primary-text group-hover:text-primary-accent transition-colors">{item.label}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-secondary-text group-hover:text-primary-accent transition-colors"><span>{t('view')}</span><IoArrowForward size={12} /></div>
                </button>
              )
            })}
          </div>
        </Card>
      ))}

      <Card className="p-4 sm:p-5 md:p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4"><h2 className="text-lg sm:text-xl font-semibold text-primary-text flex items-center gap-2"><IoFlag className="text-primary-accent" size={24} />{t('common.status')}</h2></div>
          <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40"><svg className="transform -rotate-90 w-full h-full"><circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200" /><circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${2 * Math.PI * 40 * (goalProgress.current / 100)} ${2 * Math.PI * 40}`} className="text-primary-accent" strokeLinecap="round" /></svg><div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><p className="text-2xl sm:text-3xl font-bold text-primary-text">{goalProgress.current}</p><p className="text-xs text-secondary-text">{goalProgress.unit}</p></div></div></div>
          <div className="flex-1"><h3 className="text-lg font-semibold text-primary-text mb-2">{goalProgress.label}</h3><p className="text-sm text-secondary-text mb-4">{`${goalProgress.current}% ${t('dashboard.achieved')}`}</p><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-primary-accent h-2 rounded-full transition-all" style={{ width: `${goalProgress.current}%` }} /></div></div>
        </div>
      </Card>
    </div>
  )
}

export default EmployeeDashboard
