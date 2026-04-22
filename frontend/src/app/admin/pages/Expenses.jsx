import { useState, useEffect, useRef } from 'react'
import AddButton from '../../../components/ui/AddButton'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { expensesAPI, companiesAPI, projectsAPI, usersAPI } from '../../../api'
import {
  IoAdd,
  IoSearch,
  IoDownload,
  IoPrint,
  IoCheckmarkCircle,
  IoCloudUpload,
  IoTrash,
  IoCreate,
  IoEye,
  IoChevronBack,
  IoChevronForward,
  IoClose,
  IoDocumentAttach,
  IoFilter
} from 'react-icons/io5'

const Expenses = () => {
  const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
  const fileInputRef = useRef(null)

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [memberFilter, setMemberFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [dateFilterType, setDateFilterType] = useState('all') // all, monthly, yearly, custom

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Categories from API
  const [categories, setCategories] = useState([])

  const taxOptions = [
    { value: '', label: '-' },
    { value: 'GST 10%', label: 'GST 10%', rate: 10 },
    { value: 'CGST 18%', label: 'CGST 18%', rate: 18 },
    { value: 'VAT 10%', label: 'VAT 10%', rate: 10 },
    { value: 'IGST 10%', label: 'IGST 10%', rate: 10 },
    { value: 'UTGST 10%', label: 'UTGST 10%', rate: 10 },
  ]

  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    title: '',
    description: '',
    project_id: '',
    employee_id: '',
    tax: '',
    secondTax: '',
    isRecurring: false,
    recurringType: 'monthly',
    recurringInterval: 1,
    recurringCycles: '',
    file: null,
  })

  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])

  // Calculate tax amount from string like "GST 10%"
  const parseTaxRate = (taxString) => {
    if (!taxString) return 0
    const match = taxString.match(/(\d+(?:\.\d+)?)/)
    return match ? parseFloat(match[1]) : 0
  }

  // Calculate total = Amount + TAX Amount + Second TAX Amount
  const calculateTotal = (amount, tax, secondTax) => {
    const baseAmount = parseFloat(amount) || 0
    const taxRate = parseTaxRate(tax)
    const secondTaxRate = parseTaxRate(secondTax)
    const taxAmount = (baseAmount * taxRate) / 100
    const secondTaxAmount = (baseAmount * secondTaxRate) / 100
    return {
      amount: baseAmount,
      taxAmount,
      secondTaxAmount,
      total: baseAmount + taxAmount + secondTaxAmount
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchExpenses()
    fetchProjects()
    fetchEmployees()
    fetchCategories()
  }, [])

  // Refetch when filters change
  useEffect(() => {
    fetchExpenses()
  }, [statusFilter, categoryFilter, memberFilter, startDate, endDate, dateFilterType, selectedMonth, selectedYear, currentPage, perPage, searchQuery])

  useEffect(() => {
    setFilteredProjects(projects)
  }, [projects])

  useEffect(() => {
    setFilteredEmployees(employees)
  }, [employees])

  const fetchCategories = async () => {
    try {
      const response = await expensesAPI.getCategories({ company_id: companyId })
      if (response.data.success) {
        setCategories(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Set default categories
      setCategories(['Office Supplies', 'Travel', 'Meals & Entertainment', 'Software & Subscriptions', 'Marketing', 'Professional Services', 'Utilities', 'Equipment', 'Rent', 'Insurance', 'Other'])
    }
  }



  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setProjects(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await usersAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setEmployees(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const params = {
        company_id: companyId,
        page: currentPage,
        limit: perPage
      }

      // Add filters
      if (statusFilter !== 'All') params.status = statusFilter
      if (categoryFilter) params.category = categoryFilter
      if (memberFilter) params.employee_id = memberFilter
      if (searchQuery) params.search = searchQuery

      // Date filters
      if (dateFilterType === 'custom' && startDate && endDate) {
        params.start_date = startDate
        params.end_date = endDate
      } else if (dateFilterType === 'monthly') {
        params.month = selectedMonth
        params.year = selectedYear
      } else if (dateFilterType === 'yearly') {
        params.year = selectedYear
      }

      const response = await expensesAPI.getAll(params)
      if (response.data.success) {
        const fetchedExpenses = response.data.data || []
        setExpenses(fetchedExpenses)

        // Set pagination from response
        if (response.data.pagination) {
          setTotalRecords(response.data.pagination.total_records)
          setTotalPages(response.data.pagination.total_pages)
        }
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        alert('Bitte geben Sie einen gültigen Betrag ein')
        return
      }

      const expenseData = {
        company_id: companyId,
        expense_date: formData.expenseDate,
        category: formData.category,
        amount: parseFloat(formData.amount) || 0,
        title: formData.title,
        description: formData.description,
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
        employee_id: formData.employee_id ? parseInt(formData.employee_id) : null,
        tax: formData.tax || null,
        second_tax: formData.secondTax || null,
        is_recurring: formData.isRecurring ? 1 : 0,
      }

      let response
      let expenseId

      if (selectedExpense && isEditModalOpen) {
        response = await expensesAPI.update(selectedExpense.id, expenseData, { company_id: companyId })
        expenseId = selectedExpense.id
      } else {
        response = await expensesAPI.create(expenseData)
        expenseId = response.data.data?.id
      }

      if (response.data.success) {
        // Upload file if selected
        if (formData.file && expenseId) {
          try {
            await expensesAPI.uploadFile(expenseId, formData.file)
          } catch (uploadError) {
            console.error('File upload failed:', uploadError)
          }
        }

        alert(isEditModalOpen ? 'Ausgabe erfolgreich aktualisiert!' : 'Ausgabe erfolgreich erstellt!')
        setIsAddModalOpen(false)
        setIsEditModalOpen(false)
        resetForm()
        await fetchExpenses()
      } else {
        alert(response.data.error || 'Ausgabe konnte nicht gespeichert werden')
      }
    } catch (error) {
      console.error('Error saving expense:', error)
      alert(error.response?.data?.error || 'Ausgabe konnte nicht gespeichert werden')
    }
  }

  const handleEdit = (expense) => {
    setSelectedExpense(expense)
    setFormData({
      expenseDate: expense.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      category: expense.category || '',
      amount: expense.amount || '',
      title: expense.title || '',
      description: expense.description || '',
      project_id: expense.project_id?.toString() || '',
      employee_id: expense.employee_id?.toString() || '',
      tax: expense.tax || '',
      secondTax: expense.second_tax || '',
      isRecurring: expense.is_recurring || false,
      recurringType: 'monthly',
      recurringInterval: 1,
      recurringCycles: '',
      file: null,
    })

    // Set filtered projects and employees based on existing data
    setFilteredProjects(projects)
    setFilteredEmployees(employees)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (expense) => {
    if (window.confirm('Möchten Sie diese Ausgabe wirklich löschen?')) {
      try {
        const response = await expensesAPI.delete(expense.id, { company_id: companyId })
        if (response.data.success) {
          alert('Ausgabe erfolgreich gelöscht!')
          await fetchExpenses()
        } else {
          alert(response.data.error || 'Ausgabe konnte nicht gelöscht werden')
        }
      } catch (error) {
        console.error('Error deleting expense:', error)
        alert(error.response?.data?.error || 'Ausgabe konnte nicht gelöscht werden')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      expenseDate: new Date().toISOString().split('T')[0],
      category: '',
      amount: '',
      title: '',
      description: '',
      project_id: '',
      employee_id: '',
      tax: '',
      secondTax: '',
      isRecurring: false,
      recurringType: 'monthly',
      recurringInterval: 1,
      recurringCycles: '',
      file: null,
    })
    setSelectedExpense(null)
    setFilteredProjects(projects)
    setFilteredEmployees(employees)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      const params = { company_id: companyId }
      if (statusFilter !== 'All') params.status = statusFilter
      if (categoryFilter) params.category = categoryFilter
      if (memberFilter) params.employee_id = memberFilter
      if (searchQuery) params.search = searchQuery
      if (dateFilterType === 'custom' && startDate && endDate) {
        params.start_date = startDate
        params.end_date = endDate
      }

      const response = await expensesAPI.exportExcel(params)
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `expenses_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
    } catch (error) {
      console.error('Export failed:', error)
      // Fallback to CSV export
      handleExportCSV()
    }
  }

  // Fallback CSV export
  const handleExportCSV = () => {
    const csvData = expenses.map(exp => {
      const calc = calculateTotal(exp.amount, exp.tax, exp.second_tax)
      return {
        'Date': exp.expense_date || '',
        'Category': exp.category || '',
        'Title': exp.title || '',
        'Description': exp.description || '',
        'Amount': calc.amount.toFixed(2),
        'TAX': exp.tax || '',
        'TAX Amount': calc.taxAmount.toFixed(2),
        'Second TAX': exp.second_tax || '',
        'Second TAX Amount': calc.secondTaxAmount.toFixed(2),
        'Total': calc.total.toFixed(2),
        'Status': exp.status || ''
      }
    })

    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Print expenses
  const handlePrint = async () => {
    try {
      const params = { company_id: companyId }
      if (statusFilter !== 'All') params.status = statusFilter
      if (categoryFilter) params.category = categoryFilter

      const response = await expensesAPI.exportPrint(params)
      if (response.data.success) {
        const printData = response.data.data
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
          <html>
            <head>
              <title>Ausgabenbericht</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                th { background-color: #4472C4; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
                .total-row { font-weight: bold; background-color: #e6e6e6; }
                h1 { color: #333; }
                .summary { margin-top: 20px; font-weight: bold; }
              </style>
            </head>
            <body>
              <h1>Ausgabenbericht</h1>
              <p>Erstellt am: ${new Date().toLocaleDateString('de-DE')}</p>
              <table>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Kategorie</th>
                    <th>Titel</th>
                    <th>Beschreibung</th>
                    <th>Betrag</th>
                    <th>Steuer</th>
                    <th>Zweite Steuer</th>
                    <th>Gesamt</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${printData.map(exp => `
                    <tr>
                      <td>${exp.expense_date ? new Date(exp.expense_date).toLocaleDateString() : ''}</td>
                      <td>${exp.category || ''}</td>
                      <td>${exp.title || ''}</td>
                      <td>${exp.description || ''}</td>
                      <td>€${parseFloat(exp.amount || 0).toFixed(2)}</td>
                      <td>${exp.tax || ''}</td>
                      <td>${exp.second_tax || ''}</td>
                      <td>€${parseFloat(exp.total || 0).toFixed(2)}</td>
                      <td>${exp.status || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="summary">
                <p>Gesamtanzahl: ${response.data.summary?.total_records || printData.length}</p>
                <p>Gesamtsumme: €${parseFloat(response.data.summary?.grand_total || 0).toFixed(2)}</p>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (error) {
      console.error('Print failed:', error)
      window.print()
    }
  }

  // Navigate month
  const navigateMonth = (direction) => {
    let newMonth = selectedMonth + direction
    let newYear = selectedYear

    if (newMonth > 12) {
      newMonth = 1
      newYear++
    } else if (newMonth < 1) {
      newMonth = 12
      newYear--
    }

    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
  }

  // Clear filters
  const clearFilters = () => {
    setStatusFilter('All')
    setCategoryFilter('')
    setMemberFilter('')
    setStartDate('')
    setEndDate('')
    setDateFilterType('all')
    setSearchQuery('')
    setCurrentPage(1)
  }

  // Table columns: Date | Category | Title | Description | Files | Amount | TAX | Second TAX | Total | Actions
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    } catch { return '-' }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">Ausgaben</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">Ausgaben verwalten</p>
        </div>
        <AddButton onClick={() => setIsAddModalOpen(true)} label="Ausgabe erstellen" />
      </div>

      {/* Filters Section */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-xs shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none shadow-sm"
          >
            <option value="All">Alle Status</option>
            <option value="Pending">Ausstehend</option>
            <option value="Approved">Genehmigt</option>
            <option value="Rejected">Abgelehnt</option>
            <option value="Paid">Bezahlt</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none shadow-sm"
          >
            <option value="">Alle Kategorien</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Member Filter */}
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none shadow-sm"
          >
            <option value="">Alle Mitglieder</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>

          {/* More Filters Button */}
          <Button variant="outline" size="sm" onClick={() => setIsFilterModalOpen(true)} className="flex items-center gap-2">
            <IoFilter size={16} />
            Weitere Filter
          </Button>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200">
          {/* Date Filter Type */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary-text">Zeitraum:</span>
            <select
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none shadow-sm"
            >
              <option value="all">Gesamter Zeitraum</option>
              <option value="monthly">Monatlich</option>
              <option value="yearly">Jährlich</option>
              <option value="custom">Benutzerdefiniert</option>
            </select>
          </div>

          {/* Monthly Navigation */}
          {dateFilterType === 'monthly' && (
            <div className="flex items-center gap-2">
              <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-gray-100 rounded">
                <IoChevronBack size={20} />
              </button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-gray-100 rounded">
                <IoChevronForward size={20} />
              </button>
            </div>
          )}

          {/* Yearly Selection */}
          {dateFilterType === 'yearly' && (
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedYear(y => y - 1)} className="p-1 hover:bg-gray-100 rounded">
                <IoChevronBack size={20} />
              </button>
              <span className="text-sm font-medium min-w-[60px] text-center">{selectedYear}</span>
              <button onClick={() => setSelectedYear(y => y + 1)} className="p-1 hover:bg-gray-100 rounded">
                <IoChevronForward size={20} />
              </button>
            </div>
          )}

          {/* Custom Date Range */}
          {dateFilterType === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none shadow-sm"
              />
              <span className="text-xs text-secondary-text">bis</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none shadow-sm"
              />
            </div>
          )}

          {/* Clear Filters */}
          {(statusFilter !== 'All' || categoryFilter || memberFilter || searchQuery || dateFilterType !== 'all') && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-red-600 border-red-300 hover:bg-red-50">
              <IoClose size={16} className="mr-1" />
              Filter zurücksetzen
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <IoAdd size={16} />
            Ausgabe erstellen
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="flex items-center gap-2">
            <IoDownload size={16} />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-2">
            <IoPrint size={16} />
            Drucken
          </Button>
        </div>
      </Card>

      {/* Expenses Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase">Datum</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase">Kategorie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase">Titel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase">Beschreibung</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase">Dateien</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-text uppercase">Betrag</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-text uppercase">Steuer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-text uppercase">Zweite Steuer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-text uppercase">Gesamt</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-secondary-text uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-secondary-text">
                    Ausgaben werden geladen...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-secondary-text">
                    Keine Ausgaben gefunden
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => {
                  const calc = calculateTotal(expense.amount, expense.tax, expense.second_tax)
                  return (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-primary-text whitespace-nowrap">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-primary-text">
                        {expense.category || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-primary-text">
                        {expense.title || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-text max-w-[200px] truncate">
                        {expense.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {expense.file_path ? (
                          <a href={expense.file_path} target="_blank" rel="noopener noreferrer" className="text-primary-accent hover:underline">
                            <IoDocumentAttach size={18} />
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-primary-text">
                        ${calc.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-secondary-text">
                        {expense.tax || '-'}
                        {expense.tax && <span className="block text-xs">(${calc.taxAmount.toFixed(2)})</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-secondary-text">
                        {expense.second_tax || '-'}
                        {expense.second_tax && <span className="block text-xs">(${calc.secondTaxAmount.toFixed(2)})</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-primary-text">
                        ${calc.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setSelectedExpense(expense); setIsViewModalOpen(true); }}
                            className="p-1.5 text-primary-accent hover:bg-primary-accent/10 rounded"
                            title="Ansehen"
                          >
                            <IoEye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(expense)}
                            className="p-1.5 text-primary-accent hover:bg-primary-accent/10 rounded"
                            title="Bearbeiten"
                          >
                            <IoCreate size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(expense)}
                            className="p-1.5 text-danger hover:bg-danger/10 rounded"
                            title="Löschen"
                          >
                            <IoTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-secondary-text">
            <span>Anzeigen</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-accent outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>Einträge</span>
          </div>
          <div className="text-sm text-secondary-text">
            Zeige {expenses.length > 0 ? ((currentPage - 1) * perPage) + 1 : 0} bis {Math.min(currentPage * perPage, totalRecords)} von {totalRecords} Einträgen
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-sm border rounded ${currentPage === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-primary-accent border-primary-accent hover:bg-primary-accent/10'}`}
            >
              Zurück
            </button>
            <span className="text-sm text-secondary-text">Seite {currentPage} von {totalPages || 1}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`px-3 py-1 text-sm border rounded ${currentPage >= totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-primary-accent border-primary-accent hover:bg-primary-accent/10'}`}
            >
              Weiter
            </button>
          </div>
        </div>
      </Card>

      {/* Add/Edit Expense Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); }}
        title={isEditModalOpen ? "Ausgabe bearbeiten" : "Ausgabe hinzufügen"}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Date of expense */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-primary-text">Datum *</label>
            <input
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
            />
          </div>

          {/* Category */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-primary-text">Kategorie</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
            >
              <option value="">Kategorie auswählen</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-primary-text">Betrag *</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
              min="0"
              step="0.01"
            />
          </div>

          {/* Title */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-primary-text">Titel</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ausgabentitel"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
            />
          </div>

          {/* Description */}
          <div className="flex items-start">
            <label className="w-32 text-sm font-medium text-primary-text pt-2">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ausgabenbeschreibung"
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm resize-none"
            />
          </div>

          {/* Client */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-primary-text">Kunde</label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value, project_id: '' })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
            >
              <option value="">Kunde auswählen</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.company_name || client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-primary-text">Projekt</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
            >
              <option value="">Projekt auswählen</option>
              {filteredProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.project_name || project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team member */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-primary-text">Teammitglied</label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
            >
              <option value="">Mitglied auswählen</option>
              {filteredEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name || emp.email}
                </option>
              ))}
            </select>
          </div>

          {/* TAX */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-primary-text">Steuer</label>
            <select
              value={formData.tax}
              onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
            >
              {taxOptions.map(tax => (
                <option key={tax.value} value={tax.value}>{tax.label}</option>
              ))}
            </select>
          </div>

          {/* Second TAX */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-primary-text">Zweite Steuer</label>
            <select
              value={formData.secondTax}
              onChange={(e) => setFormData({ ...formData, secondTax: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
            >
              {taxOptions.map(tax => (
                <option key={tax.value} value={tax.value}>{tax.label}</option>
              ))}
            </select>
          </div>

          {/* Recurring */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-primary-text">Wiederkehrend</label>
            <div className="flex-1 flex items-center gap-4">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent"
              />
              {formData.isRecurring && (
                <>
                  <span className="text-sm text-secondary-text">Alle</span>
                  <input
                    type="number"
                    value={formData.recurringInterval}
                    onChange={(e) => setFormData({ ...formData, recurringInterval: e.target.value })}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="1"
                  />
                  <select
                    value={formData.recurringType}
                    onChange={(e) => setFormData({ ...formData, recurringType: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="daily">Tag(e)</option>
                    <option value="weekly">Woche(n)</option>
                    <option value="monthly">Monat(e)</option>
                    <option value="yearly">Jahr(e)</option>
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Cycles (if recurring) */}
          {formData.isRecurring && (
            <div className="flex items-center">
              <label className="w-32 text-sm font-medium text-primary-text">Zyklen</label>
              <input
                type="number"
                value={formData.recurringCycles}
                onChange={(e) => setFormData({ ...formData, recurringCycles: e.target.value })}
                placeholder="Unbegrenzt wenn leer"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
                min="1"
              />
            </div>
          )}

          {/* File Upload */}
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium text-primary-text">Datei</label>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                className="hidden"
                id="expense-file"
              />
              <label
                htmlFor="expense-file"
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <IoCloudUpload size={20} className="text-gray-400" />
                <span className="text-sm text-secondary-text">
                  {formData.file ? formData.file.name : 'Klicken zum Hochladen'}
                </span>
              </label>
            </div>
          </div>

          {/* Calculated Total Preview */}
          {formData.amount && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-secondary-text">Betrag:</span>
                  <span className="font-medium">${parseFloat(formData.amount || 0).toFixed(2)}</span>
                </div>
                {formData.tax && (
                  <div className="flex justify-between">
                    <span className="text-secondary-text">TAX ({formData.tax}):</span>
                    <span>${calculateTotal(formData.amount, formData.tax, formData.secondTax).taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {formData.secondTax && (
                  <div className="flex justify-between">
                    <span className="text-secondary-text">Second TAX ({formData.secondTax}):</span>
                    <span>${calculateTotal(formData.amount, formData.tax, formData.secondTax).secondTaxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-medium text-primary-text">Gesamt:</span>
                  <span className="font-bold text-primary-accent">
                    ${calculateTotal(formData.amount, formData.tax, formData.secondTax).total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); }}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button variant="primary" onClick={handleSave} className="flex-1 flex items-center justify-center gap-2">
              <IoCheckmarkCircle size={18} />
              {isEditModalOpen ? 'Aktualisieren' : 'Speichern'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Expense Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setSelectedExpense(null); }}
        title="Ausgabendetails"
      >
        {selectedExpense && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Ausgabe #</label>
                <p className="text-primary-text font-medium">{selectedExpense.expense_number || `EXP#${selectedExpense.id}`}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Status</label>
                <Badge variant="default" className={
                  selectedExpense.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    selectedExpense.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      selectedExpense.status === 'Paid' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                }>
                  {selectedExpense.status || 'Ausstehend'}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Datum</label>
                <p className="text-primary-text">{formatDate(selectedExpense.expense_date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Kategorie</label>
                <p className="text-primary-text">{selectedExpense.category || '-'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Titel</label>
              <p className="text-primary-text font-medium">{selectedExpense.title || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Beschreibung</label>
              <p className="text-primary-text whitespace-pre-wrap">{selectedExpense.description || '-'}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Kunde</label>
                <p className="text-primary-text">{selectedExpense.client_name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Projekt</label>
                <p className="text-primary-text">{selectedExpense.project_name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Teammitglied</label>
                <p className="text-primary-text">{selectedExpense.employee_name || '-'}</p>
              </div>
            </div>

            {/* Amount breakdown */}
            <div className="bg-gray-50 p-4 rounded-lg">
              {(() => {
                const calc = calculateTotal(selectedExpense.amount, selectedExpense.tax, selectedExpense.second_tax)
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-text">Betrag:</span>
                      <span className="font-medium">${calc.amount.toFixed(2)}</span>
                    </div>
                    {selectedExpense.tax && (
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary-text">TAX ({selectedExpense.tax}):</span>
                        <span>${calc.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedExpense.second_tax && (
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary-text">Second TAX ({selectedExpense.second_tax}):</span>
                        <span>${calc.secondTaxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium">Gesamt:</span>
                      <span className="font-bold text-lg text-primary-accent">${calc.total.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* File attachment */}
            {selectedExpense.file_path && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Anhang</label>
                <a
                  href={selectedExpense.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary-accent hover:underline"
                >
                  <IoDocumentAttach size={18} />
                  Datei ansehen
                </a>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => { setIsViewModalOpen(false); setSelectedExpense(null); }}
                className="flex-1"
              >
                Schließen
              </Button>
              <Button
                variant="primary"
                onClick={() => { setIsViewModalOpen(false); handleEdit(selectedExpense); }}
                className="flex-1"
              >
                Ausgabe bearbeiten
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Advanced Filters Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Erweiterte Filter"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Kategorie</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
            >
              <option value="">Alle Kategorien</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Teammitglied</label>
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
            >
              <option value="">Alle Mitglieder</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Datumsbereich</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setDateFilterType('custom'); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setDateFilterType('custom'); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none text-sm"
                placeholder="End Date"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={clearFilters} className="flex-1">
              Alle zurücksetzen
            </Button>
            <Button variant="primary" onClick={() => setIsFilterModalOpen(false)} className="flex-1">
              Filter anwenden
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Expenses
