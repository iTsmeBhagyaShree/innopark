import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useSettings } from '../../../context/SettingsContext'
import { dashboardAPI } from '../../../api'
import { useLanguage } from '../../../context/LanguageContext.jsx'
import {
  IoPeople,
  IoTrendingUp,
  IoCash,
  IoCalendar,
  IoChatbubble,
  IoAdd,
  IoRefresh,
  IoCheckboxOutline,
} from 'react-icons/io5'
import Tasks from '../../../components/Tasks'
import Meetings from '../../../components/Meetings'
import Card from '../../../components/ui/Card'

const CHART_COLORS = ['#3B82F6', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#6B7280']

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { formatCurrency } = useSettings()
  const { t } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [adminData, setAdminData] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [eventsToday, setEventsToday] = useState(0)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [adminRes, completeRes] = await Promise.all([
        user?.role === 'SUPERADMIN' ? dashboardAPI.getSuperAdminStats() : dashboardAPI.getAdminStats(),
        dashboardAPI.getAll(),
      ])

      if (adminRes.data?.success && adminRes.data?.data) {
        setAdminData(adminRes.data.data)
        setEventsToday(adminRes.data.data.events_today ?? 0)
      }

      if (completeRes.data?.success && completeRes.data?.data?.timeline) {
        setTimeline(Array.isArray(completeRes.data.data.timeline) ? completeRes.data.data.timeline : [])
      }
      if (completeRes.data?.success && completeRes.data?.data?.summary?.eventsToday != null) {
        setEventsToday(completeRes.data.data.summary.eventsToday)
      }
    } catch (err) {
      console.error('Admin dashboard fetch error:', err)
      setError(err.response?.data?.error || err.message || t('common.loading_failed'))
      setAdminData(null)
      setTimeline([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">{t('dashboard.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2 mx-auto"
          >
            <IoRefresh size={18} /> {t('dashboard.retry')}
          </button>
        </div>
      </div>
    )
  }

  const data = adminData || {}
  const invoices = data.invoices || {}
  const leadsBySource = Array.isArray(data.leadsBySource) ? data.leadsBySource : []
  const pipelineStages = Array.isArray(data.pipelineStages) ? data.pipelineStages : []
  const dealsWonLost = data.dealsWonLost || { won: { count: 0, value: 0, percentage: 0 }, lost: { count: 0, value: 0, percentage: 0 } }

  const totalLeadsBySource = leadsBySource.reduce((sum, s) => sum + (s.count || 0), 0)
  const maxPipelineValue = pipelineStages.length ? Math.max(...pipelineStages.map((s) => Number(s.value) || 0), 1) : 1

  const stats = [
    {
      label: t('dashboard.total_leads'),
      value: String(data.leads ?? 0),
      icon: IoPeople,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      path: '/app/admin/leads',
    },
    {
      label: t('dashboard.projects'),
      value: String(data.projects ?? 0),
      icon: IoTrendingUp,
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
      textColor: 'text-green-600',
      path: '/app/admin/projects',
    },
    {
      label: t('dashboard.revenue'),
      value: formatCurrency ? formatCurrency(invoices.paid_amount || 0) : `$${Number(invoices.paid_amount || 0).toLocaleString()}`,
      icon: IoCash,
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
      textColor: 'text-green-600',
      path: '/app/admin/invoices',
    },
    {
      label: t('sidebar.tasks'),
      value: String(eventsToday ?? 0),
      icon: IoCheckboxOutline,
      color: 'bg-orange-500',
      bgLight: 'bg-orange-50',
      textColor: 'text-orange-600',
      path: '/app/admin/tasks',
    },
  ]

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('dashboard.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('dashboard.welcome')}, {user?.name || t('auth.roles.admin')}. {t('dashboard.overview')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/app/admin/leads')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <IoAdd size={18} /> {t('dashboard.add_lead')}
          </button>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <IoRefresh size={18} /> {t('common.refresh')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card
              key={i}
              className="p-6 transition-all hover:shadow-lg cursor-pointer"
              onClick={() => navigate(stat.path)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <h3 className={`text-2xl font-bold mt-2 ${stat.textColor}`}>{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgLight}`}>
                  <Icon size={24} className={stat.textColor} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <IoTrendingUp className="text-blue-500" size={20} /> {t('dashboard.sales_pipeline')}
            </h3>
            <p className="text-sm text-gray-500">{t('dashboard.lead_values')}</p>
          </div>
          {pipelineStages.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
              <IoTrendingUp size={40} className="opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">{t('dashboard.no_pipeline_data')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-48 flex items-end justify-between gap-2 px-2">
                {pipelineStages.map((stage, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full">
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                        {formatCurrency(stage.value || 0)}
                      </div>
                      <div
                        className="w-full rounded-t-lg transition-all duration-500 bg-blue-500/80 group-hover:bg-blue-600"
                        style={{ height: `${((Number(stage.value) || 0) / maxPipelineValue) * 150}px` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 font-black text-center uppercase truncate w-full">
                      {stage.stage}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.total_pipeline_value')}</span>
                <span className="text-lg font-black text-gray-900">
                  {formatCurrency(pipelineStages.reduce((sum, s) => sum + (Number(s.value) || 0), 0))}
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <IoPeople className="text-teal-500" size={20} /> {t('dashboard.leads_by_source')}
            </h3>
          </div>
          {leadsBySource.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
              <IoPeople size={40} className="opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">{t('common.noData')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex h-4 bg-gray-100 rounded-full overflow-hidden">
                {leadsBySource.map((source, i) => (
                  <div
                    key={i}
                    style={{
                      width: `${((source.count || 0) / totalLeadsBySource) * 100}%`,
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                    className="h-full transition-all duration-500"
                    title={`${source.source}: ${source.count}`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {leadsBySource.map((source, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 group hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors uppercase tracking-tight truncate">
                        {source.source}
                      </span>
                    </div>
                    <span className="text-xs font-black text-gray-900 ml-2">{source.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Meetings />
        <Card className="p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <IoChatbubble className="text-indigo-500" size={20} /> {t('dashboard.recent_activity')}
            </h3>
            <button
              onClick={() => navigate('/app/admin/audit-logs')}
              className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700"
            >
              {t('dashboard.view_all')}
            </button>
          </div>
          <div className="relative space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            {timeline.length === 0 ? (
              <div className="py-8 text-center text-gray-400 italic text-sm">{t('dashboard.no_recent_activity')}</div>
            ) : (
              timeline.slice(0, 5).map((item, i) => (
                <div key={i} className="relative pl-8 group">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-indigo-500 group-hover:scale-110 transition-transform z-10" />
                  <p className="text-sm text-gray-700 font-medium">{item.message}</p>
                  <p className="text-xs text-secondary-text mt-1 font-bold uppercase tracking-tighter">
                    {item.time} {item.date ? `• ${new Date(item.date).toLocaleDateString()}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="w-full">
        <Tasks />
      </div>
    </div>
  )
}

export default AdminDashboard
