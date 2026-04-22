import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../context/LanguageContext.jsx'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import DataTable from '../../../components/ui/DataTable'
import BarChart from '../../../components/charts/BarChart'
import DonutChart from '../../../components/charts/DonutChart'
import LineChart from '../../../components/charts/LineChart'
import { dashboardAPI } from '../../../api'
import { 
  IoBusiness,
  IoPeople,
  IoPerson,
  IoFolderOpen,
  IoReceipt,
  IoCash,
  IoArrowForward,
  IoRefresh,
  IoStatsChart,
  IoCube,
  IoCheckmarkCircle,
  IoTime,
  IoCalendar,
  IoDocumentText,
  IoWarning,
  IoCheckmark,
  IoEye,
  IoAdd,
  IoArrowUp,
  IoArrowDown,
} from 'react-icons/io5'

const SuperAdminDashboard = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totals: {
      companies: 0,
      users: 0,
      clients: 0,
      projects: 0,
      invoices: 0,
      payments: 0,
      packages: 0,
      active_companies: 0,
      inactive_companies: 0,
      license_expired: 0
    },
    revenue: {
      total: 0,
      this_month: 0,
      last_month: 0,
      growth: 0
    },
    package_distribution: [],
    companies_growth: [],
    revenue_over_time: [],
    recent: {
      companies: [],
      users: []
    }
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await dashboardAPI.getSuperAdminStats()
      if (response.data?.success && response.data?.data) {
        const d = response.data.data
        const overview = d.overview || {}
        setStats({
          totals: {
            companies: overview.totalCompanies ?? 0,
            users: overview.totalUsers ?? 0,
            clients: overview.totalClients ?? 0,
            projects: overview.totalProjects ?? 0,
            invoices: overview.totalInvoices ?? 0,
            payments: 0,
            packages: 0,
            active_companies: overview.totalCompanies ?? 0,
            inactive_companies: 0,
            license_expired: 0
          },
          revenue: {
            total: Number(overview.totalRevenue) ?? 0,
            this_month: 0,
            last_month: 0,
            growth: 0
          },
          package_distribution: [],
          companies_growth: [],
          revenue_over_time: [],
          recent: {
            companies: (d.recentCompanies || []).map(c => ({ id: c.id, name: c.name, created_at: c.created_at })),
            users: []
          }
        })
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(err.response?.data?.error || err.message || t('loading_failed'))
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <Button variant="primary" onClick={() => fetchStats()} className="mt-4 flex items-center gap-2 mx-auto">
            <IoRefresh size={18} /> {t('retry')}
          </Button>
        </div>
      </div>
    )
  }

  // Calculate trend percentages
  const calculateTrend = (current, previous = 0) => {
    if (previous === 0) return { value: '+0%', up: null }
    const change = ((current - previous) / previous * 100).toFixed(0)
    return {
      value: `${change >= 0 ? '+' : ''}${change}%`,
      up: change >= 0
    }
  }

  const statCards = [
    {
      label: t('total_companies'),
      value: stats.totals.companies,
      icon: IoBusiness,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/app/superadmin/companies',
      trend: calculateTrend(stats.totals.companies, stats.totals.companies - 1)
    },
    {
      label: t('active_companies'),
      value: stats.totals.active_companies,
      icon: IoCheckmarkCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      path: '/app/superadmin/companies',
      trend: calculateTrend(stats.totals.active_companies, stats.totals.active_companies - 1)
    },
    {
      label: t('total_packages'),
      value: stats.totals.packages,
      icon: IoCube,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      path: '/app/superadmin/packages',
      trend: { value: `+${stats.totals.packages}`, up: true }
    },
    {
      label: t('total_users'),
      value: stats.totals.users,
      icon: IoPeople,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      path: '/app/superadmin/users',
      trend: calculateTrend(stats.totals.users, stats.totals.users - 1)
    },
    {
      label: t('total_clients'),
      value: stats.totals.clients,
      icon: IoPerson,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      path: '/app/superadmin/companies',
      trend: calculateTrend(stats.totals.clients, stats.totals.clients - 1)
    },
    {
      label: t('total_projects'),
      value: stats.totals.projects,
      icon: IoFolderOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      path: '/app/superadmin/companies',
      trend: calculateTrend(stats.totals.projects, stats.totals.projects - 1)
    },
    {
      label: t('total_revenue'),
      value: `$${(stats.revenue.total / 1000).toFixed(1)}K`,
      icon: IoCash,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      path: '/app/superadmin/billing',
      trend: {
        value: `${stats.revenue.growth >= 0 ? '+' : ''}${stats.revenue.growth}%`,
        up: stats.revenue.growth >= 0
      }
    },
    {
      label: t('total_invoices'),
      value: stats.totals.invoices,
      icon: IoReceipt,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      path: '/app/superadmin/billing',
      trend: calculateTrend(stats.totals.invoices, stats.totals.invoices - 1)
    }
  ]

  const recentCompaniesColumns = [
    { key: 'id', label: 'Nr.' },
    {
      key: 'name',
      label: t('company_name'),
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{value?.charAt(0)?.toUpperCase() || 'C'}</span>
          </div>
          <span className="font-medium text-primary-text">{value || t('common.na')}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      label: t('registered_date'),
      render: (value) => {
        if (!value) return t('common.na')
        const date = new Date(value)
        return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      }
    },
    {
      key: 'actions',
      label: t('actions'),
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate('/app/superadmin/companies')
          }}
          className="text-primary-accent hover:text-primary-accent/80 transition-colors"
        >
          <IoEye size={18} />
        </button>
      )
    }
  ]

  const companiesChartData = (() => {
    const currentMonth = new Date().getMonth()
    const locale = t('locale') === 'de' ? 'de-DE' : 'en-GB'
    const data = []
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      const monthName = new Date(2000, monthIndex, 1).toLocaleDateString(locale, { month: 'short' })
      const monthData = stats.companies_growth.find(g => new Date(g.month + '-01').getMonth() === monthIndex)
      data.push({ name: monthName, value: monthData ? parseInt(monthData.count) : 0 })
    }
    return data
  })()

  const revenueChartData = (() => {
    const currentMonth = new Date().getMonth()
    const locale = t('locale') === 'de' ? 'de-DE' : 'en-GB'
    const data = []
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      const monthName = new Date(2000, monthIndex, 1).toLocaleDateString(locale, { month: 'short' })
      const monthData = stats.revenue_over_time.find(r => new Date(r.month + '-01').getMonth() === monthIndex)
      data.push({ name: monthName, value: monthData ? parseFloat(monthData.total_revenue) : 0 })
    }
    return data
  })()

  const packageDistributionData = stats.package_distribution.length > 0 
    ? stats.package_distribution.map(pkg => ({ name: pkg.package_name || t('packages.title'), value: parseInt(pkg.companies_count) || 0 }))
    : [ { name: t('packages.title'), value: 0 }, { name: t('packages.monthly'), value: 0 }, { name: t('packages.quarterly'), value: 0 }, { name: t('packages.yearly'), value: 0 } ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-text">{t('dashboard_title')}</h1>
          <p className="text-secondary-text mt-2">{t('dashboard_subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchStats} className="flex items-center gap-2" disabled={loading}>
            <IoRefresh size={18} className={loading ? 'animate-spin' : ''} />
            {t('refresh')}
          </Button>
          <Button variant="primary" onClick={() => navigate('/app/superadmin/companies')} className="flex items-center gap-2">
            <IoAdd size={18} />
            {t('add_company')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className={`p-4 sm:p-5 hover:shadow-lg transition-all cursor-pointer border border-gray-200 ${stat.bgColor}`} onClick={() => navigate(stat.path)}>
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}><Icon size={24} className={stat.color} /></div>
                  {stat.trend && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${stat.trend.up === true ? 'text-green-600' : stat.trend.up === false ? 'text-red-600' : 'text-gray-600'}`}>
                      {stat.trend.up === true ? <IoArrowUp size={14} /> : stat.trend.up === false ? <IoArrowDown size={14} /> : null}
                      {stat.trend.value}
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-secondary-text mb-1">{stat.label}</p>
                <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>
                  {loading ? <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" /> : (typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString())}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary-text">{t('companies_growth')}</h3>
            <Button variant="ghost" onClick={() => navigate('/app/superadmin/companies')} className="text-sm">{t('view_all')}</Button>
          </div>
          <div className="h-64"><BarChart data={companiesChartData} dataKey="value" name={t('sidebar.companies')} height={250} color="#3B82F6" /></div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary-text">{t('revenue_overview')}</h3>
            <Button variant="ghost" onClick={() => navigate('/app/superadmin/billing')} className="text-sm">{t('view_billing')}</Button>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2"><span className="text-sm text-secondary-text">{t('this_month')}</span><span className="text-lg font-bold text-green-600">${(stats.revenue.this_month / 1000).toFixed(1)}K</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-secondary-text">{t('last_month')}</span><span className="text-base font-semibold text-gray-600">${(stats.revenue.last_month / 1000).toFixed(1)}K</span></div>
          </div>
          <div className="h-48"><LineChart data={revenueChartData} dataKey="value" name={t('sidebar.billing')} height={200} /></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary-text">{t('package_distribution')}</h3>
            <Button variant="ghost" onClick={() => navigate('/app/superadmin/packages')} className="text-sm">{t('manage')}</Button>
          </div>
          <div className="h-48"><DonutChart data={packageDistributionData} height={200} /></div>
          <div className="mt-4 space-y-2">
            {packageDistributionData.map((pkg, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : idx === 2 ? 'bg-green-500' : 'bg-orange-500'}`} /><span className="text-secondary-text">{pkg.name}</span></div>
                <span className="font-semibold text-primary-text">{pkg.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary-text">{t('recent_companies')}</h3>
            <Button variant="ghost" onClick={() => navigate('/app/superadmin/companies')} className="text-sm flex items-center gap-1">{t('view_all')}<IoArrowForward size={16} /></Button>
          </div>
          {loading ? <div className="text-center py-8 text-secondary-text">{t('loading')}</div> : stats.recent.companies.length === 0 ? (
            <div className="text-center py-8 text-secondary-text"><IoBusiness size={48} className="mx-auto mb-2 text-gray-300" /><p>{t('no_company')}</p><Button variant="primary" onClick={() => navigate('/app/superadmin/companies')} className="mt-4">{t('add_company')}</Button></div>
          ) : <div className="overflow-x-auto"><DataTable data={stats.recent.companies} columns={recentCompaniesColumns} loading={false} onRowClick={() => navigate('/app/superadmin/companies')} /></div>}
        </Card>
      </div>

      <Card className="p-4 sm:p-5">
        <h3 className="text-lg font-semibold text-primary-text mb-4">{t('quick_actions')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button variant="outline" onClick={() => navigate('/app/superadmin/companies')} className="flex flex-col items-center gap-2 py-4"><IoBusiness size={24} className="text-primary-accent" /><span className="text-sm">{t('add_company')}</span></Button>
          <Button variant="outline" onClick={() => navigate('/app/superadmin/packages')} className="flex flex-col items-center gap-2 py-4"><IoCube size={24} className="text-primary-accent" /><span className="text-sm">{t('manage_packages')}</span></Button>
          <Button variant="outline" onClick={() => navigate('/app/superadmin/billing')} className="flex flex-col items-center gap-2 py-4"><IoReceipt size={24} className="text-primary-accent" /><span className="text-sm">{t('view_billing')}</span></Button>
          <Button variant="outline" onClick={() => navigate('/app/superadmin/users')} className="flex flex-col items-center gap-2 py-4"><IoPeople size={24} className="text-primary-accent" /><span className="text-sm">{t('manage_users')}</span></Button>
        </div>
      </Card>
    </div>
  )
}

export default SuperAdminDashboard
