import { useCallback, useEffect, useState } from 'react'
import { reportsAPI, employeesAPI, projectsAPI, contactsAPI } from '../../../api'
import { useLanguage } from '../../../context/LanguageContext'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import {
  IoDownload, IoRefresh, IoPieChart, IoBarChart, IoPeople, IoFolder, IoTrendingUp,
  IoBusiness, IoPerson, IoFilter, IoCheckmarkCircle, IoTime, IoHourglass, IoDocumentText,
  IoCash, IoReceipt, IoCalendar, IoSearch, IoPrint, IoChevronDown
} from 'react-icons/io5'
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'

const Reports = () => {
  const { t } = useLanguage()
  const companyId = localStorage.getItem('companyId') || '1'
  const currentYear = new Date().getFullYear()

  // Main tab state - default to CRM Sales Pipeline
  const [activeTab, setActiveTab] = useState('sales-pipeline')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter states
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedView, setSelectedView] = useState('yearly')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [selectedClient, setSelectedClient] = useState('')

  // Data states
  const [employees, setEmployees] = useState([])
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])

  // Report data states
  const [expensesData, setExpensesData] = useState({ data: [], chartData: {}, totals: {} })
  const [invoicesSummaryData, setInvoicesSummaryData] = useState({ data: [], totals: {} })
  const [invoiceDetailsData, setInvoiceDetailsData] = useState({ data: [], totals: {} })
  const [incomeExpenseData, setIncomeExpenseData] = useState({ data: [], summary: {} })
  const [paymentsSummaryData, setPaymentsSummaryData] = useState({ data: [], totals: {} })
  const [timesheetsData, setTimesheetsData] = useState({ data: [], totals: {} })
  const [projectsReportData, setProjectsReportData] = useState({ data: [], totals: {} })

  // Sub-view states
  const [expensesView, setExpensesView] = useState('yearly')
  const [invoicesView, setInvoicesView] = useState('yearly')
  const [paymentsView, setPaymentsView] = useState('monthly')
  const [timesheetsView, setTimesheetsView] = useState('details')
  const [projectsView, setProjectsView] = useState('team')

  const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  useEffect(() => {
    fetchDropdownData()
  }, [])

  useEffect(() => {
    fetchReportData()
  }, [activeTab, selectedYear, selectedView, dateRange, selectedEmployee, selectedProject, selectedClient, selectedCurrency, selectedPaymentMethod, expensesView, invoicesView, paymentsView, timesheetsView, projectsView])

  const fetchDropdownData = async () => {
    try {
      const [employeesRes, projectsRes, clientsRes] = await Promise.all([
        employeesAPI.getAll({ company_id: companyId }).catch(() => ({ data: { data: [] } })),
        projectsAPI.getAll({ company_id: companyId }).catch(() => ({ data: { data: [] } })),
        contactsAPI.getAll({ company_id: companyId }).catch(() => ({ data: { data: [] } }))
      ])
      setEmployees(employeesRes.data?.data || employeesRes.data || [])
      setProjects(projectsRes.data?.data || projectsRes.data || [])
      setClients(clientsRes.data?.data || clientsRes.data || [])
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const fetchReportData = useCallback(async () => {
    setLoading(true)
    const baseParams = {
      company_id: companyId,
      year: selectedYear,
      ...(dateRange.start && { start_date: dateRange.start }),
      ...(dateRange.end && { end_date: dateRange.end }),
      ...(selectedCurrency && { currency: selectedCurrency }),
      ...(selectedClient && { client_id: selectedClient })
    }

    try {
      switch (activeTab) {
        case 'expenses':
          const expRes = await reportsAPI.getExpensesSummary({ ...baseParams, view: expensesView })
          if (expRes.data?.success) setExpensesData(expRes.data)
          break
        case 'invoices-summary':
          const invSumRes = await reportsAPI.getInvoicesSummary({ ...baseParams, view: invoicesView })
          if (invSumRes.data?.success) setInvoicesSummaryData(invSumRes.data)
          break
        case 'invoice-details':
          const invDetRes = await reportsAPI.getInvoiceDetails(baseParams)
          if (invDetRes.data?.success) setInvoiceDetailsData(invDetRes.data)
          break
        case 'income-expense':
          const incExpRes = await reportsAPI.getIncomeVsExpenses({ ...baseParams, project_id: selectedProject })
          if (incExpRes.data?.success) setIncomeExpenseData(incExpRes.data)
          break
        case 'payments':
          const payRes = await reportsAPI.getPaymentsSummary({ ...baseParams, view: paymentsView, payment_method: selectedPaymentMethod })
          if (payRes.data?.success) setPaymentsSummaryData(payRes.data)
          break
        case 'timesheets':
          const timeRes = await reportsAPI.getTimesheetsReport({ ...baseParams, view: timesheetsView, user_id: selectedEmployee, project_id: selectedProject })
          if (timeRes.data?.success) setTimesheetsData(timeRes.data)
          break
        case 'projects':
          const projRes = await reportsAPI.getProjectsReport({ ...baseParams, view: projectsView })
          if (projRes.data?.success) setProjectsReportData(projRes.data)
          break
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }, [companyId, activeTab, selectedYear, dateRange, selectedEmployee, selectedProject, selectedClient, selectedCurrency, selectedPaymentMethod, expensesView, invoicesView, paymentsView, timesheetsView, projectsView])

  const handleExport = (type = 'excel') => {
    let data = []
    let filename = `report_${activeTab}_${new Date().toISOString().split('T')[0]}`

    switch (activeTab) {
      case 'expenses': data = expensesData.data; break
      case 'invoices-summary': data = invoicesSummaryData.data; break
      case 'invoice-details': data = invoiceDetailsData.data; break
      case 'payments': data = paymentsSummaryData.data; break
      case 'timesheets': data = timesheetsData.data; break
      case 'projects': data = projectsReportData.data; break
      default: data = []
    }

    if (type === 'excel') {
      const headers = data.length > 0 ? Object.keys(data[0]).join(',') : ''
      const rows = data.map(row => Object.values(row).join(',')).join('\n')
      const csv = `${headers}\n${rows}`
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.csv`
      a.click()
    } else {
      window.print()
    }
  }

  const formatCurrency = (value) => `$${parseFloat(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Filter data by search term
  const filterData = (data) => {
    if (!searchTerm) return data
    return data.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }

  const tabs = [
    // CRM Reports
    { id: 'sales-pipeline', label: t('reports.tabs.sales_pipeline'), icon: IoTrendingUp },
    { id: 'leads-analytics', label: t('reports.tabs.leads_analytics'), icon: IoPeople },
    { id: 'deals-analytics', label: t('reports.tabs.deals_analytics'), icon: IoBusiness },
    { id: 'activity-report', label: t('reports.tabs.activity_report'), icon: IoCalendar },
    // Finanzberichte
    { id: 'expenses', label: t('reports.tabs.expenses_summary'), icon: IoCash },
    { id: 'invoices-summary', label: t('reports.tabs.invoices_summary'), icon: IoReceipt },
    { id: 'invoice-details', label: t('reports.tabs.invoice_details'), icon: IoDocumentText },
    { id: 'income-expense', label: t('reports.tabs.income_expense'), icon: IoTrendingUp },
    { id: 'payments', label: t('reports.tabs.payments_summary'), icon: IoCash },
    { id: 'timesheets', label: t('reports.tabs.timesheets'), icon: IoTime },
    { id: 'projects', label: t('reports.tabs.projects_report'), icon: IoFolder }
  ]

  // ============ CRM REPORT RENDER FUNCTIONS ============

  // Mock data for CRM reports (will be replaced with API calls)
  const pipelineData = [
    { stage: 'Neu', value: 45000, deals: 12 },
    { stage: 'Contacted', value: 32000, deals: 8 },
    { stage: 'Qualified', value: 58001, deals: 15 },
    { stage: 'Proposal', value: 42000, deals: 6 },
    { stage: 'Negotiation', value: 28001, deals: 4 },
    { stage: 'Gewonnen', value: 85000, deals: 18 },
    { stage: 'Verloren', value: 15000, deals: 5 },
  ]

  const leadSourceData = [
    { name: 'Website', value: 450, color: '#3B82F6' },
    { name: 'Referral', value: 320, color: '#10B981' },
    { name: 'Social Media', value: 280, color: '#F59E0B' },
    { name: 'Email Campaign', value: 134, color: '#8B5CF6' },
    { name: 'Cold Call', value: 95, color: '#EF4444' },
    { name: 'Others', value: 100, color: '#6B7280' },
  ]

  const activityData = [
    { month: 'Jan', calls: 45, emails: 120, meetings: 12 },
    { month: 'Feb', calls: 52, emails: 135, meetings: 15 },
    { month: 'Mar', calls: 48, emails: 110, meetings: 18 },
    { month: 'Apr', calls: 60, emails: 145, meetings: 20 },
    { month: 'May', calls: 55, emails: 130, meetings: 16 },
    { month: 'Jun', calls: 65, emails: 160, meetings: 22 },
  ]

  // Sales Pipeline Report
  const renderSalesPipeline = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50">
          <p className="text-sm text-gray-600">{t('reports.summary.total_pipeline_value')}</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(pipelineData.reduce((sum, s) => sum + s.value, 0))}
          </p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-sm text-gray-600">{t('reports.summary.won_deals')}</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(85000)}</p>
        </Card>
        <Card className="p-4 bg-red-50">
          <p className="text-sm text-gray-600">{t('reports.summary.lost_deals')}</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(15000)}</p>
        </Card>
        <Card className="p-4 bg-purple-50">
          <p className="text-sm text-gray-600">{t('reports.summary.win_rate')}</p>
          <p className="text-2xl font-bold text-purple-600">78%</p>
        </Card>
      </div>

      {/* Pipeline Chart */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">{t('reports.charts.deal_value_by_stage')}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Pipeline Table */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">{t('reports.tabs.sales_pipeline')}</h3>
        <DataTable
          columns={[
            { key: 'stage', header: t('deals.form.stage') },
            { key: 'deals', header: t('deals.items') },
            { key: 'value', header: t('deals.form.amount'), render: (row) => formatCurrency(row?.value) },
            {
              key: 'percentage', header: '% der Pipeline', render: (row) => {
                const total = pipelineData.reduce((sum, s) => sum + s.value, 0)
                return `${((row?.value / total) * 100).toFixed(1)}%`
              }
            }
          ]}
          data={pipelineData}
          searchable={false}
        />
      </Card>
    </div>
  )

  // Leads Analytics Report
  const renderLeadsAnalytics = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50">
          <p className="text-sm text-gray-600">{t('reports.summary.total_leads')}</p>
          <p className="text-2xl font-bold text-blue-600">1,379</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-sm text-gray-600">{t('reports.summary.converted')}</p>
          <p className="text-2xl font-bold text-green-600">284</p>
        </Card>
        <Card className="p-4 bg-yellow-50">
          <p className="text-sm text-gray-600">{t('reports.summary.in_process')}</p>
          <p className="text-2xl font-bold text-yellow-600">892</p>
        </Card>
        <Card className="p-4 bg-red-50">
          <p className="text-sm text-gray-600">{t('reports.summary.lost')}</p>
          <p className="text-2xl font-bold text-red-600">203</p>
        </Card>
      </div>

      {/* Leads by Source Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">{t('reports.charts.leads_by_source')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={leadSourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {leadSourceData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">{t('reports.charts.conversion_rate_by_source')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={leadSourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Source Table */}
      <Card className="p-4">
        <DataTable
          columns={[
            { key: 'name', header: t('offline_requests.type') },
            { key: 'value', header: t('leads.items') },
            {
              key: 'percentage', header: '% von Gesamt', render: (row) => {
                const total = leadSourceData.reduce((sum, s) => sum + s.value, 0)
                return `${((row?.value / total) * 100).toFixed(1)}%`
              }
            }
          ]}
          data={leadSourceData}
          searchable={false}
        />
      </Card>
    </div>
  )

  // Deals Analytics Report
  const renderDealsAnalytics = () => (
    <div className="space-y-6">
      {/* Won vs Lost Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">{t('reports.summary.won_deals')}</p>
              <p className="text-3xl font-bold text-green-700">28</p>
              <p className="text-lg text-green-600">{formatCurrency(84200)}</p>
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <IoCheckmarkCircle className="text-green-600" size={32} />
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">{t('reports.summary.lost_deals')}</p>
              <p className="text-3xl font-bold text-red-700">13</p>
              <p className="text-lg text-red-600">{formatCurrency(38400)}</p>
            </div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <IoHourglass className="text-red-600" size={32} />
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">{t('reports.charts.monthly_deal_trend')}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              { month: 'Jan', won: 3, lost: 2, value: 12000 },
              { month: 'Feb', won: 5, lost: 1, value: 18001 },
              { month: 'Mar', won: 4, lost: 3, value: 15000 },
              { month: 'Apr', won: 6, lost: 2, value: 22000 },
              { month: 'May', won: 5, lost: 2, value: 19000 },
              { month: 'Jun', won: 5, lost: 3, value: 17000 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="won" name="Gewonnen" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="lost" name="Verloren" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )

  // Activity Report
  const renderActivityReport = () => (
    <div className="space-y-6">
      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50">
          <p className="text-sm text-gray-600">{t('reports.summary.total_calls') || 'Total Calls'}</p>
          <p className="text-2xl font-bold text-blue-600">325</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-sm text-gray-600">{t('reports.summary.emails_sent') || 'Emails Sent'}</p>
          <p className="text-2xl font-bold text-green-600">800</p>
        </Card>
        <Card className="p-4 bg-purple-50">
          <p className="text-sm text-gray-600">{t('reports.summary.meetings') || 'Meetings'}</p>
          <p className="text-2xl font-bold text-purple-600">103</p>
        </Card>
        <Card className="p-4 bg-orange-50">
          <p className="text-sm text-gray-600">{t('reports.summary.follow_ups') || 'Follow-ups'}</p>
          <p className="text-2xl font-bold text-orange-600">256</p>
        </Card>
      </div>

      {/* Activity Trend Chart */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">{t('reports.charts.activity_trend')}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="calls" name="Calls" stroke="#3B82F6" fill="#3B82F633" />
              <Area type="monotone" dataKey="emails" name="Emails" stroke="#10B981" fill="#10B98133" />
              <Area type="monotone" dataKey="meetings" name="Meetings" stroke="#8B5CF6" fill="#8B5CF633" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Activity by User */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">{t('reports.charts.activity_by_user') || 'Activity by Team Member'}</h3>
        <DataTable
          columns={[
            { key: 'member', header: t('deals.list.columns.assigned') },
            { key: 'calls', header: t('reports.summary.calls') || 'Calls' },
            { key: 'emails', header: t('reports.summary.emails') || 'Emails' },
            { key: 'meetings', header: t('reports.summary.meetings') || 'Meetings' },
            { key: 'total', header: t('reports.summary.total_activities') || 'Total Activities' }
          ]}
          data={[
            { member: 'John Smith', calls: 85, emails: 210, meetings: 28, total: 323 },
            { member: 'Sarah Wilson', calls: 72, emails: 185, meetings: 32, total: 289 },
            { member: 'Mike Johnson', calls: 68, emails: 165, meetings: 18, total: 251 },
            { member: 'Emily Davis', calls: 55, emails: 140, meetings: 15, total: 210 },
            { member: 'Robert Brown', calls: 45, emails: 100, meetings: 10, total: 155 },
          ]}
          searchable={false}
        />
      </Card>
    </div>
  )

  // Render functions for each report type
  const renderExpensesSummary = () => (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {['yearly', 'monthly', 'custom', 'yearly-chart', 'category-chart'].map(view => (
          <button
            key={view}
            onClick={() => setExpensesView(view)}
            className={`px-3 py-1.5 text-sm rounded-lg ${expensesView === view ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {view.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {expensesView.includes('chart') ? (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">{expensesView === 'yearly-chart' ? 'Yearly Expenses Chart' : 'Expenses by Category'}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {expensesView === 'yearly-chart' ? (
                <ReBarChart data={expensesData.chartData?.monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </ReBarChart>
              ) : (
                <RePieChart>
                  <Pie data={expensesData.chartData?.category || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                    {(expensesData.chartData?.category || []).map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                </RePieChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <DataTable
            columns={[
              { key: 'category', header: t('common.category') || 'Category' },
              { key: 'amount', header: t('deals.form.amount'), render: (row) => formatCurrency(row?.amount) },
              { key: 'tax', header: t('invoices.tax') || 'TAX', render: (row) => formatCurrency(row?.tax) },
              { key: 'second_tax', header: t('invoices.second_tax') || 'Second TAX', render: (row) => formatCurrency(row?.second_tax) },
              { key: 'total', header: t('deals.summary.total'), render: (row) => formatCurrency(row?.total) }
            ]}
            data={filterData(expensesData.data || [])}
            searchable={false}
          />
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-end gap-8 font-semibold">
            <span>Total: {formatCurrency(expensesData.totals?.total)}</span>
          </div>
        </Card>
      )}
    </div>
  )

  const renderInvoicesSummary = () => (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {['yearly', 'monthly', 'custom'].map(view => (
          <button
            key={view}
            onClick={() => setInvoicesView(view)}
            className={`px-3 py-1.5 text-sm rounded-lg ${invoicesView === view ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      <Card className="p-4">
        <DataTable
          columns={[
            { key: 'count', header: t('common.count') || 'Count' },
            { key: 'invoice_total', header: t('invoices.total') || 'Invoice Total', render: (row) => formatCurrency(row?.invoice_total) },
            { key: 'discount', header: t('invoices.discount') || 'Discount', render: (row) => formatCurrency(row?.discount) },
            { key: 'tax', header: t('invoices.tax') || 'TAX', render: (row) => formatCurrency(row?.tax) },
            { key: 'second_tax', header: t('invoices.second_tax') || 'Second TAX', render: (row) => formatCurrency(row?.second_tax) },
            { key: 'tds', header: t('invoices.tds') || 'TDS', render: (row) => formatCurrency(row?.tds) },
            { key: 'payment_received', header: t('invoices.received') || 'Payment Received', render: (row) => formatCurrency(row?.payment_received) },
            { key: 'due', header: t('invoices.due') || 'Due', render: (row) => formatCurrency(row?.due) }
          ]}
          data={filterData(invoicesSummaryData.data || [])}
          searchable={false}
        />
        <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-end gap-6 text-sm font-semibold">
          <span>Total: {formatCurrency(invoicesSummaryData.totals?.invoice_total)}</span>
          <span>Received: {formatCurrency(invoicesSummaryData.totals?.payment_received)}</span>
          <span>Due: {formatCurrency(invoicesSummaryData.totals?.due)}</span>
        </div>
      </Card>
    </div>
  )

  const renderInvoiceDetails = () => (
    <Card className="p-4">
      <DataTable
        columns={[
          { key: 'invoice_number', header: t('invoices.invoice_id') || 'Invoice ID' },
          { key: 'vat_gst', header: t('invoices.vat_gst') || 'VAT/GST' },
          { key: 'bill_date', header: t('common.bill_date') },
          { key: 'due_date', header: t('invoices.due_date') || 'Due Date' },
          { key: 'invoice_total', header: t('invoices.total') || 'Invoice Total', render: (row) => formatCurrency(row?.invoice_total) },
          { key: 'discount', header: t('invoices.discount') || 'Discount', render: (row) => formatCurrency(row?.discount) },
          { key: 'tax', header: t('invoices.tax') || 'TAX', render: (row) => formatCurrency(row?.tax) },
          { key: 'payment_received', header: t('invoices.received') || 'Payment Received', render: (row) => formatCurrency(row?.payment_received) },
          { key: 'due', header: t('invoices.due') || 'Due', render: (row) => formatCurrency(row?.due) },
          {
            key: 'status', header: t('common.status'), render: (row) => (
              <span className={`px-2 py-1 rounded text-xs font-medium ${row?.status === 'Paid' ? 'bg-green-100 text-green-700' :
                row?.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
                  row?.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}>
                {row?.status || '-'}
              </span>
            )
          }
        ]}
        data={filterData(invoiceDetailsData.data || [])}
        searchable={false}
      />
      <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-end gap-6 text-sm font-semibold">
        <span>Total: {formatCurrency(invoiceDetailsData.totals?.invoice_total)}</span>
        <span>Due: {formatCurrency(invoiceDetailsData.totals?.due)}</span>
      </div>
    </Card>
  )

  const renderIncomeVsExpenses = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <Card className="p-4 bg-green-50">
          <p className="text-sm text-gray-600">{t('reports.summary.total_income')}</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(incomeExpenseData.summary?.total_income)}</p>
        </Card>
        <Card className="p-4 bg-red-50">
          <p className="text-sm text-gray-600">{t('reports.summary.total_expense')}</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(incomeExpenseData.summary?.total_expense)}</p>
        </Card>
        <Card className="p-4 bg-blue-50">
          <p className="text-sm text-gray-600">{t('reports.summary.profit')}</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(incomeExpenseData.summary?.profit)}</p>
        </Card>
        <Card className="p-4 bg-purple-50">
          <p className="text-sm text-gray-600">{t('reports.summary.profit_percentage')}</p>
          <p className="text-2xl font-bold text-purple-600">{incomeExpenseData.summary?.profit_percentage || 0}%</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">{t('reports.charts.income_vs_expense_chart')}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={incomeExpenseData.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Area type="monotone" dataKey="income" name="Income" stroke="#10B981" fill="#10B98133" />
              <Area type="monotone" dataKey="expense" name="Expense" stroke="#EF4444" fill="#EF444433" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )

  const renderPaymentsSummary = () => (
    <div className="space-y-4">


      <Card className="p-4">
        <DataTable
          columns={[
            { key: 'period', header: t('common.month') || 'Month' },
            { key: 'count', header: t('common.count') || 'Count' },
            { key: 'amount', header: t('deals.form.amount'), render: (row) => formatCurrency(row?.amount) }
          ]}
          data={filterData(paymentsSummaryData.data || [])}
          searchable={false}
        />
        <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-end gap-6 text-sm font-semibold">
          <span>Total Count: {paymentsSummaryData.totals?.count || 0}</span>
          <span>Total Amount: {formatCurrency(paymentsSummaryData.totals?.amount)}</span>
        </div>
      </Card>
    </div>
  )

  const renderTimesheets = () => (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {['details', 'summary', 'chart', 'daily'].map(view => (
          <button
            key={view}
            onClick={() => setTimesheetsView(view)}
            className={`px-3 py-1.5 text-sm rounded-lg ${timesheetsView === view ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {view === 'daily' ? 'Daily Activity' : view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {timesheetsView === 'chart' ? (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">{t('reports.charts.time_logged_by_project')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={timesheetsData.data || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                  {(timesheetsData.data || []).map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v} hours`} />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <DataTable
            columns={timesheetsView === 'details' ? [
              { key: 'member', header: t('deals.list.columns.assigned') },
              { key: 'project', header: t('projects.title') },
              { key: 'task', header: t('tasks.title') },
              { key: 'start_time', header: t('timesheets.start_time') || 'Start Time' },
              { key: 'end_time', header: t('timesheets.end_time') || 'End Time' },
              { key: 'total', header: t('deals.summary.total'), render: (row) => `${row?.total || 0}h` },
              { key: 'note', header: t('offline_requests.notes') }
            ] : timesheetsView === 'summary' ? [
              { key: 'member', header: t('deals.list.columns.assigned') },
              { key: 'entries', header: t('timesheets.entries') || 'Entries' },
              { key: 'total_hours', header: t('timesheets.total_hours') || 'Total Hours', render: (row) => `${row?.total_hours || 0}h` }
            ] : [
              { key: 'date', header: t('common.date') || 'Date' },
              { key: 'member', header: t('deals.list.columns.assigned') },
              { key: 'total_hours', header: t('timesheets.total_hours') || 'Total Hours', render: (row) => `${row?.total_hours || 0}h` },
              { key: 'entries', header: t('timesheets.entries') || 'Entries' }
            ]}
            data={filterData(timesheetsData.data || [])}
            searchable={false}
          />
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-end gap-6 text-sm font-semibold">
            <span>Total Hours: {timesheetsData.totals?.total_hours || 0}h</span>
            <span>Total Entries: {timesheetsData.totals?.total_entries || 0}</span>
          </div>
        </Card>
      )}
    </div>
  )

  const renderProjectsReport = () => (
    <div className="space-y-4">


      <Card className="p-4">
        <DataTable
          columns={[
            { key: 'team_member', header: t('deals.list.columns.assigned') },
            { key: 'open_projects', header: t('projects.status_open') || 'Open Projects' },
            { key: 'completed_projects', header: t('projects.status_completed') || 'Completed Projects' },
            { key: 'hold_projects', header: t('projects.status_on_hold') || 'Hold Projects' },
            { key: 'open_tasks', header: t('tasks.status_open') || 'Open Tasks' },
            { key: 'completed_tasks', header: t('tasks.status_completed') || 'Completed Tasks' },
            { key: 'total_time_logged', header: t('timesheets.total_time') || 'Total Time Logged', render: (row) => `${row?.total_time_logged || 0}h` }
          ]}
          data={filterData(projectsReportData.data || [])}
          searchable={false}
        />
        <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-end gap-6 text-sm font-semibold">
          <span>Open: {projectsReportData.totals?.open_projects || 0}</span>
          <span>Completed: {projectsReportData.totals?.completed_projects || 0}</span>
          <span>Hold: {projectsReportData.totals?.hold_projects || 0}</span>
        </div>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
          <p className="text-gray-500">{t('reports.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReportData} className="flex items-center gap-2">
            <IoRefresh size={18} /> {t('reports.refresh')}
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')} className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50">
            <IoDocumentText size={18} /> {t('reports.excel')}
          </Button>
          <Button variant="primary" onClick={() => handleExport('print')} className="flex items-center gap-2">
            <IoPrint size={18} /> {t('reports.print')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <IoFilter size={20} className="text-blue-600" />
          <span className="font-medium">{t('auto.auto_d7778d0c') || 'Filter'}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('') || ''}</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('') || ''}</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('') || ''}</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Client Filter */}
          {['invoices-summary', 'invoice-details', 'timesheets'].includes(activeTab) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('') || ''}</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('') || ''}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name || `Client #${c.id}`}</option>)}
              </select>
            </div>
          )}

          {/* Member Filter */}
          {activeTab === 'timesheets' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auto.auto_7c1878b1') || 'Mitglied'}</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('') || ''}</option>
                {employees.map(e => <option key={e.id} value={e.user_id || e.id}>{e.name || e.email || `Employee #${e.id}`}</option>)}
              </select>
            </div>
          )}

          {/* Project Filter */}
          {['income-expense', 'timesheets'].includes(activeTab) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auto.auto_ac4f2b92') || 'Projekt'}</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('') || ''}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name || `Project #${p.id}`}</option>)}
              </select>
            </div>
          )}

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('') || ''}</label>
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={t('common.search') || 'Suchen...'}
              />
            </div>
          </div>
        </div>
      </Card>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">{t('') || ''}</span>
        </div>
      ) : (
        <>
          {/* CRM Reports */}
          {activeTab === 'sales-pipeline' && renderSalesPipeline()}
          {activeTab === 'leads-analytics' && renderLeadsAnalytics()}
          {activeTab === 'deals-analytics' && renderDealsAnalytics()}
          {activeTab === 'activity-report' && renderActivityReport()}
          {/* Finance Reports */}
          {activeTab === 'expenses' && renderExpensesSummary()}
          {activeTab === 'invoices-summary' && renderInvoicesSummary()}
          {activeTab === 'invoice-details' && renderInvoiceDetails()}
          {activeTab === 'income-expense' && renderIncomeVsExpenses()}
          {activeTab === 'payments' && renderPaymentsSummary()}
          {activeTab === 'timesheets' && renderTimesheets()}
          {activeTab === 'projects' && renderProjectsReport()}
        </>
      )}
    </div>
  )
}

export default Reports
