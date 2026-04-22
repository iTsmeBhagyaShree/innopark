import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import RichTextEditor from '../../../components/ui/RichTextEditor'
import CustomFieldsSection from '../../../components/ui/CustomFieldsSection'
import { proposalsAPI, projectsAPI, companiesAPI, itemsAPI } from '../../../api'
import {
  IoAdd,
  IoSearch,
  IoFilter,
  IoDownload,
  IoChevronDown,
  IoChevronUp,
  IoEllipsisVertical,
  IoCheckmarkCircle,
  IoTrash,
  IoCreate,
  IoEye,
  IoDocumentText,
  IoClose,
  IoCalendar,
  IoGrid,
  IoList,
  IoPrint,
  IoCopy,
  IoOpenOutline,
  IoMailOutline,
  IoCreateOutline,
  IoHappyOutline,
  IoRefresh,
  IoCheckmark,
  IoLayers
} from 'react-icons/io5'

const Proposals = () => {
  const navigate = useNavigate()
  // Get company_id from localStorage - auto-set for all operations
  const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)

  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [projectFilter, setProjectFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [amountMinFilter, setAmountMinFilter] = useState('')
  const [amountMaxFilter, setAmountMaxFilter] = useState('')
  const [createdByFilter, setCreatedByFilter] = useState('')
  const [quickFilter, setQuickFilter] = useState('All') // All, Draft, Edit, Mail
  const [sortColumn, setSortColumn] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('DESC')
  const [proposals, setProposals] = useState([])
  const [companies, setCompanies] = useState([])
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([]) // Projects filtered by company
  const [loading, setLoading] = useState(true)
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [filterOptions, setFilterOptions] = useState({
    projects: [],
    created_by_users: []
  })

  // New filter system state
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false)
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false)
  const [quickStatusFilter, setQuickStatusFilter] = useState('All')
  const [dateRangeType, setDateRangeType] = useState('Monthly')
  const [lastEmailSeenFrom, setLastEmailSeenFrom] = useState('')
  const [lastEmailSeenTo, setLastEmailSeenTo] = useState('')
  const [lastPreviewSeenFrom, setLastPreviewSeenFrom] = useState('')
  const [lastPreviewSeenTo, setLastPreviewSeenTo] = useState('')
  const [proposalDateFrom, setProposalDateFrom] = useState('')
  const [proposalDateTo, setProposalDateTo] = useState('')

  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  // Column visibility state (Deals list)
  const [columnVisibility, setColumnVisibility] = useState({
    estimate_number: true,   // Deal Name (ID / reference)
    total: true,             // Value
    status: true,            // Stage
    owner_name: true,        // Owner
    close_date: true,        // Close Date
    linked_entities: true,   // Linked Contact / Company
    note: true,              // Notes
  })

  // CRM Deal Pipeline Stages
  const dealPipelineStages = [
    { id: 'new', label: t('proposals.stages.new'), color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'contacted', label: t('proposals.stages.contacted'), color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'qualified', label: t('proposals.stages.qualified'), color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { id: 'proposal_sent', label: t('proposals.stages.proposal_sent'), color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'negotiation', label: t('proposals.stages.negotiation'), color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 'closed_won', label: t('proposals.stages.closed_won'), color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'closed_lost', label: t('proposals.stages.closed_lost'), color: 'bg-red-100 text-red-700 border-red-200' },
  ]

  // CRM Deal Form Data
  const [formData, setFormData] = useState({
    company_id: companyId,
    // CRM Deal Fields
    deal_name: '',          // Deal Name
    value: '',              // Deal Value
    stage: 'new',           // Pipeline Stage
    owner_name: '',         // Owner name
    close_date: '',         // Expected Close Date
    client_id: 0,          // Removed client link
    company_name: '',       // Linked Company Name
    note: '',               // Notes/Activities
    // Fields for backward compatibility
    items: [],
    currency: 'USD',
    custom_fields: {},
  })

  // Catalog items from /api/v1/items
  const [catalogItems, setCatalogItems] = useState([])

  // Calculate totals helper
  const calculateTotals = (items) => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  }

  const handleAddItem = () => {
    const newItem = {
      item_name: '',
      description: '',
      quantity: 1,
      unit: 'Pcs',
      unit_price: 0,
      tax_rate: 0,
      amount: 0
    }
    setFormData(prev => {
      const updatedItems = [...(prev.items || []), newItem]
      return {
        ...prev,
        items: updatedItems,
        amount: calculateTotals(updatedItems)
      }
    })
  }

  const handleRemoveItem = (index) => {
    setFormData(prev => {
      const updatedItems = [...prev.items]
      updatedItems.splice(index, 1)
      return {
        ...prev,
        items: updatedItems,
        amount: calculateTotals(updatedItems)
      }
    })
  }

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updatedItems = [...prev.items]
      const item = { ...updatedItems[index], [field]: value }

      // Auto-calculate amount
      if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate') {
        const qty = parseFloat(field === 'quantity' ? value : item.quantity) || 0
        const price = parseFloat(field === 'unit_price' ? value : item.unit_price) || 0
        const tax = parseFloat(field === 'tax_rate' ? value : item.tax_rate) || 0
        const subtotal = qty * price
        item.amount = subtotal + (subtotal * tax / 100)
      }

      updatedItems[index] = item
      return {
        ...prev,
        items: updatedItems,
        amount: calculateTotals(updatedItems)
      }
    })
  }

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('user')
      const params = {}
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          if (userData.company_id) {
            params.company_id = userData.company_id
          }
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }
      const response = await proposalsAPI.getFilters(params)
      if (response.data.success) {
        setFilterOptions(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }, [])

  // Fetch functions
  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true)
      // Build query params
      const params = {}

      // Search
      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery
      }

      // Status filter
      if (statusFilter && statusFilter !== 'All') {
        params.status = statusFilter.toLowerCase()
      }



      // Project filter
      if (projectFilter) {
        params.project_id = projectFilter
      }

      // Date range filters
      if (startDateFilter) {
        params.start_date = startDateFilter
      }
      if (endDateFilter) {
        params.end_date = endDateFilter
      }

      // Amount range filters
      if (amountMinFilter) {
        params.amount_min = amountMinFilter
      }
      if (amountMaxFilter) {
        params.amount_max = amountMaxFilter
      }

      // Created by filter
      if (createdByFilter) {
        params.created_by = createdByFilter
      }

      // Sorting
      if (sortColumn) {
        params.sort_by = sortColumn
        params.sort_order = sortDirection
      }

      // Get company_id from localStorage or user context
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          if (userData.company_id) {
            params.company_id = userData.company_id
          }
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }

      const response = await proposalsAPI.getAll(params)
      console.log('Proposals API response:', response)
      console.log('Proposals API response.data:', response.data)
      console.log('Proposals API response.data.data:', response.data?.data)
      console.log('Proposals count:', response.data?.data?.length || 0)

      if (response && response.data && response.data.success) {
        const proposalsData = (response.data.data || []).map(est => {
          // Handle status - convert to lowercase for consistency
          const status = (est.status || 'draft').toLowerCase()

          // Derive CRM Deal fields
          const dealName =
            est.deal_name ||
            est.title ||
            est.estimate_number ||
            `Deal #${est.id}`

          const ownerName =
            est.owner_name ||
            est.assigned_to_name ||
            est.created_by_name ||
            est.created_by ||
            ''

          const closeDate = est.close_date || est.valid_till || null

          // Format estimate_number - keep original reference but prefer a nice deal label
          let estimateNumber = est.estimate_number || dealName

          return {
            id: est.id,
            estimate_number: estimateNumber,
            company_id: est.company_id,
            company_name: est.company_name || '--',
            project_id: est.project_id,
            project_name: est.project_name || '--',
            proposal_date: est.created_at || est.proposal_date || '',
            valid_till: est.valid_till || '--',
            last_email_seen: est.last_email_seen || null,
            last_preview_seen: est.last_preview_seen || null,
            status: status,
            description: est.description || '',
            note: est.note || '',
            terms: est.terms || '',
            currency: est.currency || 'USD',
            sub_total: parseFloat(est.sub_total) || 0,
            discount_amount: parseFloat(est.discount_amount) || 0,
            tax_amount: parseFloat(est.tax_amount) || 0,
            total: parseFloat(est.total) || 0,
            items: est.items || [],
            custom_fields: est.custom_fields || {},
            // CRM Deals fields
            deal_name: dealName,
            owner_name: ownerName,
            close_date: closeDate,
          }
        })
        console.log('Transformed proposals data:', proposalsData)
        setProposals(proposalsData)
      } else {
        console.error('Failed to fetch proposals:', response?.data?.error || 'Unknown error')
        setProposals([])
        if (response?.data?.error) {
          alert(response.data.error)
        }
      }
    } catch (error) {
      console.error('Error fetching proposals:', error)
      console.error('Error response:', error.response)
      setProposals([])
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch proposals'
      console.error('Error message:', errorMessage)
      // Don't show alert on every error, just log it
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchQuery, statusFilter, projectFilter, startDateFilter, endDateFilter, amountMinFilter, amountMaxFilter, createdByFilter, sortColumn, sortDirection])



  const fetchCompanies = useCallback(async () => {
    try {
      const response = await companiesAPI.getAll()
      if (response.data.success) {
        setCompanies(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }, [])

  const fetchCatalogItems = useCallback(async () => {
    try {
      const response = await itemsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setCatalogItems(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching catalog items:', error)
      setCatalogItems([])
    }
  }, [companyId])

  const fetchProjects = useCallback(async () => {
    try {
      // Get company_id from localStorage
      const storedUser = localStorage.getItem('user')
      let companyId = null
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          companyId = userData.company_id
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }
      if (!companyId) {
        companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
      }
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchProjects:', companyId)
        setProjects([])
        return
      }
      const response = await projectsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setProjects(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }, [])

  // Fetch initial data on mount
  useEffect(() => {
    fetchCompanies()
    fetchProjects()
    fetchTemplates()
    fetchCatalogItems()
  }, [fetchCompanies, fetchProjects, fetchCatalogItems])

  const fetchTemplates = async () => {
    try {
      const { financeTemplatesAPI } = await import('../../../api/financeTemplates')
      const templatesRes = await financeTemplatesAPI.getAll({ type: 'proposal', company_id: companyId })
      console.log('Templates Response:', templatesRes.data)
      if (templatesRes.data.success) {
        const proposalTemplates = templatesRes.data.data.filter(t => t.type === 'proposal')
        console.log('Proposal Templates:', proposalTemplates)
        setTemplates(proposalTemplates)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      setTemplates([])
    }
  }

  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId)
    if (!templateId) return

    const template = templates.find(t => t.id === parseInt(templateId))
    if (template) {
      const tData = template.template_data || {}

      let descriptionHTML = ''
      if (tData.background) {
        descriptionHTML += `<h2 class="text-xl font-bold mb-2">Background</h2>${tData.background}<br/>`
      }
      if (tData.scope) {
        descriptionHTML += `<h2 class="text-xl font-bold mb-2">Scope of Work</h2>${tData.scope}`
      }

      setFormData(prev => ({
        ...prev,
        description: descriptionHTML,
        terms: tData.terms || prev.terms
      }))
    }
  }

  // Fetch proposals on mount and when statusFilter changes
  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  // Fetch proposals when filters change
  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  // Show all clients (no company filter)
  useEffect(() => {
    setFilteredClients(clients)
  }, [clients])

  useEffect(() => {
    setFilteredProjects(projects)
  }, [projects])

  const handleAdd = async () => {


    setFormData({
      company_id: companyId,
      deal_name: '',
      value: '',
      stage: 'new',
      owner_name: '',
      close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      company_name: '',
      note: '',
      items: [],
      currency: 'USD',
      custom_fields: {},
    })
    setSelectedTemplateId('')
    setFilteredProjects([])
    setIsAddModalOpen(true)
  }

  const handleEdit = async (proposal) => {
    try {


      const response = await proposalsAPI.getById(proposal.id)
      if (response.data.success) {
        const data = response.data.data

        setFormData({
          company_id: adminCompanyId.toString(),
          deal_name: data.deal_name || data.title || data.estimate_number || '',
          value: data.total || data.value || 0,
          stage: (data.status || 'new').toLowerCase(),
          owner_name: data.owner_name || '',
          close_date: data.close_date ? data.close_date.split('T')[0] : (data.valid_till ? data.valid_till.split('T')[0] : ''),
          company_name: data.company_name || '',
          note: data.note || '',
          items: data.items || [],
          currency: data.currency || 'USD',
          custom_fields: data.custom_fields || {},
        })

        setIsEditModalOpen(true)
        setSelectedProposal(proposal)
      }
    } catch (error) {
      console.error('Error fetching proposal:', error)
      alert('Failed to load proposal details')
    }
  }

  const handleView = (proposal) => {
    navigate(`/app/admin/proposals/${proposal.id}`)
  }

  const handleDelete = async (proposal) => {
    if (window.confirm(`Are you sure you want to delete deal ${proposal.estimate_number || proposal.id}?`)) {
      try {
        // DELETE API - DELETE request
        const response = await proposalsAPI.delete(proposal.id)
        if (response.data.success) {
          alert('Deal deleted successfully!')
          await fetchProposals()
        } else {
          alert(response.data.error || 'Failed to delete deal')
        }
      } catch (error) {
        console.error('Error deleting proposal:', error)
        const errorMessage = error.response?.data?.error || error.message || 'Failed to delete deal'
        alert(errorMessage)
      }
    }
  }

  const handleDuplicate = async (proposal) => {
    try {
      const response = await proposalsAPI.duplicate(proposal.id)
      if (response.data.success) {
        alert('Deal duplicated successfully!')
        await fetchProposals()
      } else {
        alert(response.data.error || 'Failed to duplicate deal')
      }
    } catch (error) {
      console.error('Error duplicating proposal:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to duplicate deal'
      alert(errorMessage)
    }
  }

  const handleStatusChange = async (proposal, newStatus) => {
    try {
      const response = await proposalsAPI.updateStatus(proposal.id, newStatus)
      if (response.data.success) {
        alert(`Deal status updated to ${newStatus}!`)
        await fetchProposals()
      } else {
        alert(response.data.error || 'Failed to update deal status')
      }
    } catch (error) {
      console.error('Error updating proposal status:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update deal status'
      alert(errorMessage)
    }
  }

  const handleSendEmail = async (proposal) => {
    try {
      const email = prompt('Enter recipient email:', proposal.client_email || '')
      if (!email) return

      const response = await proposalsAPI.sendEmail(proposal.id, {
        to: email,
        subject: `Deal ${proposal.estimate_number}`,
        message: 'Please review the attached deal.'
      })
      if (response.data.success) {
        alert('Deal sent successfully!')
        await fetchProposals()
      } else {
        alert(response.data.error || 'Failed to send deal')
      }
    } catch (error) {
      console.error('Error sending proposal:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send deal'
      alert(errorMessage)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const handleDownloadExcel = () => {
    try {
      // Create CSV content
      const headers = ['Deal Number', 'Client', 'Project', 'Valid Until', 'Total', 'Status', 'Created At']
      const rows = filteredProposals.map(proposal => [
        proposal.estimate_number || `DEAL#${proposal.id}`,
        proposal.client_name || '-',
        proposal.project_name || '-',
        formatDate(proposal.valid_till),
        proposal.total || 0,
        proposal.status || 'draft',
        formatDate(proposal.created_at)
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `deals_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading Excel:', error)
      alert('Failed to download deals')
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to print')
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Deals Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .text-right { text-align: right; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>{t('Deals')} ${t('common.reports')}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Deal Number</th>
              <th>Client</th>
              <th>Project</th>
              <th>Valid Until</th>
              <th class="text-right">Total</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            ${filteredProposals.map(proposal => `
              <tr>
                <td>${(proposal.estimate_number || `PROP#${proposal.id}`).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                <td>${(proposal.client_name || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                <td>${(proposal.project_name || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                <td>${formatDate(proposal.valid_till)}</td>
                <td class="text-right">${formatCurrency(proposal.total)}</td>
                <td>${(proposal.status || 'draft').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                <td>${formatDate(proposal.created_at)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align: right; font-weight: bold;">Total:</td>
              <td class="text-right" style="font-weight: bold;">${formatCurrency(filteredProposals.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0))}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  // Handlers for new filter system
  const handleQuickStatusFilter = (status) => {
    setQuickStatusFilter(status)
    // Sync with main status filter for actual filtering
    setStatusFilter(status)
  }

  const toggleColumnVisibility = (column) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  const clearAllFilters = () => {
    setQuickStatusFilter('All')
    setDateRangeType('Monthly')
    setLastEmailSeenFrom('')
    setLastEmailSeenTo('')
    setLastPreviewSeenFrom('')
    setLastPreviewSeenTo('')
    setProposalDateFrom('')
    setProposalDateTo('')
    // Also clear existing filters
    setStatusFilter('All')

    setProjectFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setAmountMinFilter('')
    setAmountMaxFilter('')
    setCreatedByFilter('')
    setQuickFilter('All')
    setIsFiltersOpen(false)
    setIsFilterBarOpen(false)
  }

  const handleSave = async () => {
    // Validation
    if (!formData.deal_name) {
      alert('Deal Name is required')
      return
    }
    if (!formData.client_id) {
      alert('Client/Lead is required')
      return
    }

    try {
      const proposalData = {
        company_id: companyId,
        deal_name: formData.deal_name,
        value: parseFloat(formData.value) || 0,
        status: formData.stage,
        owner_name: formData.owner_name,
        close_date: formData.close_date,
        client_id: parseInt(formData.client_id),
        company_name: formData.company_name,
        note: formData.note,
        // Keep legacy fields for API compatibility if needed
        proposal_date: new Date().toISOString().split('T')[0],
        valid_till: formData.close_date,
        total: parseFloat(formData.value) || 0,
        items: formData.items,
        currency: formData.currency || 'USD',
        custom_fields: formData.custom_fields || {},
      }

      if (isEditModalOpen && selectedProposal) {
        // UPDATE API
        const response = await proposalsAPI.update(selectedProposal.id, proposalData)
        if (response.data.success) {
          alert('Deal updated successfully!')
          await fetchProposals()
          setIsEditModalOpen(false)
          setSelectedProposal(null)
        } else {
          alert(response.data.error || 'Failed to update deal')
        }
      } else {
        // CREATE API
        const response = await proposalsAPI.create(proposalData)
        if (response.data.success) {
          alert('Deal created successfully!')
          await fetchProposals()
          setIsAddModalOpen(false)
        } else {
          alert(response.data.error || 'Failed to create deal')
        }
      }
    } catch (error) {
      console.error('Error saving deal:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save deal'
      alert(errorMessage)
    }
  }

  const handleConvertToInvoice = async () => {
    if (!selectedProposal) return

    if (window.confirm('Convert this proposal to an invoice?')) {
      try {
        const response = await proposalsAPI.convertToInvoice(selectedProposal.id, {})
        if (response.data.success) {
          alert('Proposal converted to invoice successfully!')
          setIsViewModalOpen(false)
          await fetchProposals()
        } else {
          alert(response.data.error || 'Failed to convert proposal')
        }
      } catch (error) {
        console.error('Error converting proposal:', error)
        alert(error.response?.data?.error || 'Failed to convert proposal')
      }
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase()
    return `${dateStr} ${timeStr}`
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const handleCopy = async (proposal) => {
    await handleDuplicate(proposal)
  }

  const allColumns = [
    {
      key: 'estimate_number',
      label: 'Deal Name',
      render: (value, row) => (
        <button
          onClick={() => navigate(`/app/admin/proposals/${row.id}`)}
          className="hover:text-[#4F46E5] font-bold text-gray-900 transition-colors"
        >
          {row.deal_name || value || '--'}
        </button>
      ),
    },
    {
      key: 'total',
      label: 'Value',
      render: (value) => (
        <span className="font-semibold text-primary-text">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Stage',
      render: (value) => {
        // CRM Deal Pipeline Stages
        const stageColors = {
          // Pipeline stages
          'new': 'bg-blue-100 text-blue-700 border border-blue-200',
          'contacted': 'bg-purple-100 text-purple-700 border border-purple-200',
          'qualified': 'bg-indigo-100 text-indigo-700 border border-indigo-200',
          'proposal_sent': 'bg-amber-100 text-amber-700 border border-amber-200',
          'proposal sent': 'bg-amber-100 text-amber-700 border border-amber-200',
          'negotiation': 'bg-orange-100 text-orange-700 border border-orange-200',
          'closed_won': 'bg-green-100 text-green-700 border border-green-200',
          'closed won': 'bg-green-100 text-green-700 border border-green-200',
          'won': 'bg-green-100 text-green-700 border border-green-200',
          'closed_lost': 'bg-red-100 text-red-700 border border-red-200',
          'closed lost': 'bg-red-100 text-red-700 border border-red-200',
          'lost': 'bg-red-100 text-red-700 border border-red-200',
          // Legacy status mapping
          'draft': 'bg-gray-100 text-gray-700 border border-gray-200',
          'sent': 'bg-amber-100 text-amber-700 border border-amber-200',
          'accepted': 'bg-green-100 text-green-700 border border-green-200',
          'declined': 'bg-red-100 text-red-700 border border-red-200',
          'pending': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        }
        const stageLabels = {
          'new': 'Neu',
          'contacted': 'Contacted',
          'qualified': 'Qualified',
          'proposal_sent': 'Proposal Sent',
          'proposal sent': 'Proposal Sent',
          'negotiation': 'Negotiation',
          'closed_won': 'Closed Won',
          'closed won': 'Closed Won',
          'won': 'Gewonnen',
          'closed_lost': 'Closed Lost',
          'closed lost': 'Closed Lost',
          'lost': 'Verloren',
          // Legacy
          'draft': 'Neu',
          'sent': 'Proposal Sent',
          'accepted': 'Gewonnen',
          'declined': 'Verloren',
          'pending': 'Negotiation',
        }
        const normalizedValue = (value || 'new').toLowerCase()
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${stageColors[normalizedValue] || 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
            {stageLabels[normalizedValue] || (value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Neu')}
          </span>
        )
      },
    },
    {
      key: 'owner_name',
      label: 'Owner',
      render: (value) => (
        <span className="text-primary-text">{value || '-'}</span>
      ),
    },
    {
      key: 'close_date',
      label: 'Close Date',
      render: (value, row) => (
        <span className="text-primary-text">{formatDate(value || row.valid_till || '')}</span>
      ),
    },
    {
      key: 'linked_entities',
      label: 'Contact / Company',
      render: (_, row) => (
        <div className="flex flex-col text-sm text-primary-text">
          <span>{row.client_name || '-'}</span>
          <span className="text-xs text-gray-500">{row.company_name || ''}</span>
        </div>
      ),
    },
    {
      key: 'note',
      label: 'Notes / Activities',
      render: (value, row) => {
        const text = value || row.description || ''
        if (!text) return <span className="text-gray-400">-</span>
        const short = text.length > 60 ? `${text.slice(0, 60)}…` : text
        return <span className="text-sm text-primary-text" title={text}>{short}</span>
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDuplicate(row)
            }}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Duplicate"
          >
            <IoCopy size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleView(row)
            }}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="View"
          >
            <IoOpenOutline size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(row)
            }}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Edit"
          >
            <IoCreate size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(row)
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <IoTrash size={16} />
          </button>
        </div>
      ),
    },
  ]

  const columns = allColumns.filter(column =>
    column.key === 'actions' || columnVisibility[column.key]
  )

  const filteredProposals = proposals.filter(proposal => {
    // Search filter (use debounced search query)
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      if (!proposal.estimate_number?.toLowerCase().includes(query) &&
        !proposal.client_name?.toLowerCase().includes(query) &&
        !proposal.project_name?.toLowerCase().includes(query) &&
        !proposal.id?.toString().includes(query)) {
        return false
      }
    }

    // Status filter
    if (statusFilter !== 'All') {
      const proposalStatus = (proposal.status || '').toLowerCase()
      const filterStatus = statusFilter.toLowerCase()
      if (proposalStatus !== filterStatus) {
        return false
      }
    }

    // Quick filter
    if (quickFilter === 'Draft') {
      if (proposal.status !== 'draft') return false
    } else if (quickFilter === 'Edit') {
      // Filter for editable proposals (draft or sent)
      if (proposal.status !== 'draft' && proposal.status !== 'sent') return false
    } else if (quickFilter === 'Mail') {
      // Filter for proposals with email activity
      if (!proposal.last_email_seen) return false
    }

    return true
  }).sort((a, b) => {
    let aVal = a[sortColumn] || ''
    let bVal = b[sortColumn] || ''

    if (sortColumn === 'estimate_number') {
      // Extract number for sorting
      const aNum = parseInt(aVal.toString().replace(/\D/g, '')) || 0
      const bNum = parseInt(bVal.toString().replace(/\D/g, '')) || 0
      return sortDirection === 'desc' ? bNum - aNum : aNum - bNum
    }

    if (sortColumn === 'total') {
      return sortDirection === 'desc' ? (bVal || 0) - (aVal || 0) : (aVal || 0) - (bVal || 0)
    }

    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()

    if (sortDirection === 'desc') {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    } else {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    }
  })

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen bg-[#F5F5F5] p-4 sm:p-6 -m-4 sm:-m-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">Deals</h1>
          <p className="text-gray-500 text-sm mt-1">Track revenue & pipeline opportunities</p>
        </div>
        <AddButton onClick={handleAdd} label="Add Deal" />
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        {/* Top Row - Quick Actions and Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Column Visibility Toggle */}
            <div className="relative">
              <button
                onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                title="Column Visibility"
              >
                <IoGrid size={18} />
              </button>

              {/* Column Dropdown */}
              {isColumnDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-48">
                  <div className="p-2">
                    {Object.keys(columnVisibility).map(column => (
                      <label key={column} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={columnVisibility[column]}
                          onChange={() => toggleColumnVisibility(column)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm capitalize">
                          {column.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1.5 h-8">
              <IoFilter size={14} />
              <select
                value={quickStatusFilter}
                onChange={(e) => handleQuickStatusFilter(e.target.value)}
                className="outline-none bg-transparent text-xs"
              >
                <option value="All">{t('common.all')}</option>
                <option value="Sent">{t('status.sent')}</option>
                <option value="Draft">{t('status.draft')}</option>
                <option value="Accepted">{t('status.accepted')}</option>
                <option value="Declined">{t('status.declined')}</option>
              </select>
              {quickStatusFilter !== 'All' && (
                <button
                  onClick={() => handleQuickStatusFilter('All')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>

            {/* Quick Status Buttons */}
            <button
              onClick={() => handleQuickStatusFilter('Accepted')}
              className={`p-2 rounded-lg border transition-colors ${quickStatusFilter === 'Accepted'
                ? 'bg-green-100 border-green-300 text-green-700'
                : 'border-gray-300 hover:bg-gray-100'
                }`}
              title="Accepted"
            >
              <IoCheckmarkCircle size={18} />
            </button>

            <button
              onClick={() => handleQuickStatusFilter('All')}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${quickStatusFilter === 'All'
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'border-gray-300 hover:bg-gray-100'
                }`}
            >
              {t('common.all')}
            </button>

            <button
              onClick={() => handleQuickStatusFilter('Declined')}
              className={`p-2 rounded-lg border transition-colors ${quickStatusFilter === 'Declined'
                ? 'bg-red-100 border-red-300 text-red-700'
                : 'border-gray-300 hover:bg-gray-100'
                }`}
              title="Declined"
            >
              <IoHappyOutline size={18} />
            </button>

            <button
              onClick={() => handleQuickStatusFilter('Draft')}
              className={`p-2 rounded-lg border transition-colors ${quickStatusFilter === 'Draft'
                ? 'bg-gray-100 border-gray-300 text-gray-700'
                : 'border-gray-300 hover:bg-gray-100'
                }`}
              title="Draft"
            >
              <IoCreateOutline size={18} />
            </button>

            <button
              onClick={() => handleQuickStatusFilter('Sent')}
              className={`p-2 rounded-lg border transition-colors ${quickStatusFilter === 'Sent'
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'border-gray-300 hover:bg-gray-100'
                }`}
              title="Sent"
            >
              <IoMailOutline size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Plus Button to Toggle Filter Bar */}
            <button
              onClick={() => setIsFilterBarOpen(!isFilterBarOpen)}
              className={`p-1.5 rounded-lg border transition-colors ${isFilterBarOpen
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'border-gray-300 hover:bg-gray-100'
                }`}
              title="Toggle Filters"
            >
              <IoAdd size={16} />
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-2 sm:px-3 hover:bg-gray-800 hover:text-white hover:border-gray-800"
              title="Download Excel"
            >
              <IoDownload size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-xs sm:text-sm">Excel</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2 sm:px-3 hover:bg-gray-800 hover:text-white hover:border-gray-800"
              title="Print"
            >
              <IoPrint size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-xs sm:text-sm">Print</span>
            </Button>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search')}
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-xs w-full sm:w-56"
              />
              <IoSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-secondary-text" size={14} />
            </div>
          </div>
        </div>

        {/* Bottom Row - Advanced Filters (shown when plus is clicked) */}
        {isFilterBarOpen && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <IoFilter size={16} />
                <select
                  value={quickStatusFilter}
                  onChange={(e) => handleQuickStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-accent"
                >
                  <option value="All">{t('common.all')}</option>
                  <option value="Sent">{t('status.sent')}</option>
                  <option value="Draft">{t('status.draft')}</option>
                  <option value="Accepted">{t('status.accepted')}</option>
                  <option value="Declined">{t('status.declined')}</option>
                </select>
              </div>

              {/* Last Email Seen */}
              <div className="flex items-center gap-2">
                <IoCalendar size={16} />
                <span className="text-sm text-gray-600">{t('common.last_email_seen')}</span>
                <input
                  type="date"
                  value={lastEmailSeenFrom}
                  onChange={(e) => setLastEmailSeenFrom(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-accent"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={lastEmailSeenTo}
                  onChange={(e) => setLastEmailSeenTo(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>

              {/* Last Preview Seen */}
              <div className="flex items-center gap-2">
                <IoCalendar size={16} />
                <span className="text-sm text-gray-600">{t('common.last_preview_seen')}</span>
                <input
                  type="date"
                  value={lastPreviewSeenFrom}
                  onChange={(e) => setLastPreviewSeenFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-accent"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={lastPreviewSeenTo}
                  onChange={(e) => setLastPreviewSeenTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>

              {/* Date Range Type */}
              <div className="flex items-center gap-2">
                <div className="flex border border-gray-300 rounded-lg overflow-hidden h-8">
                  <button
                    onClick={() => setDateRangeType('Monthly')}
                    className={`px-2.5 py-1.5 text-xs transition-colors ${dateRangeType === 'Monthly'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setDateRangeType('Yearly')}
                    className={`px-2.5 py-1.5 text-xs transition-colors ${dateRangeType === 'Yearly'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    Yearly
                  </button>
                  <button
                    onClick={() => setDateRangeType('Custom')}
                    className={`px-2.5 py-1.5 text-xs transition-colors ${dateRangeType === 'Custom'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    Custom
                  </button>
                  <button
                    onClick={() => setDateRangeType('Dynamic')}
                    className={`px-3 py-2 text-sm transition-colors ${dateRangeType === 'Dynamic'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    Dynamic
                  </button>
                </div>
              </div>

              {/* Proposal Date Range */}
              <div className="flex items-center gap-2">
                <IoCalendar size={16} />
                <input
                  type="date"
                  value={proposalDateFrom}
                  onChange={(e) => setProposalDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-accent"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={proposalDateTo}
                  onChange={(e) => setProposalDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={clearAllFilters}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Clear Filters"
                >
                  <IoRefresh size={16} />
                </button>
                <button
                  className="p-2 border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-green-600"
                  title="Apply Filters"
                >
                  <IoCheckmark size={16} />
                </button>
                <button
                  onClick={() => setIsFilterBarOpen(false)}
                  className="p-2 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                  title="Close Filters"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Proposals View - Table or Grid */}
      {viewMode === 'list' ? (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto min-w-[1200px]">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  {columns.map((column, idx) => (
                    <th
                      key={idx}
                      onClick={() => column.key !== 'actions' && handleSort(column.key)}
                      className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap transition-colors ${column.key !== 'actions' ? 'cursor-pointer hover:bg-gray-200' : ''
                        } ${column.key === 'estimate_number' ? 'w-48' :
                          column.key === 'total' ? 'w-32' :
                            column.key === 'status' ? 'w-36' :
                              column.key === 'owner_name' ? 'w-40' :
                                column.key === 'close_date' ? 'w-36' :
                                  column.key === 'linked_entities' ? 'w-64' :
                                    column.key === 'note' ? 'w-72' :
                                      column.key === 'actions' ? 'w-44' : ''
                        }`}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {column.key !== 'actions' && sortColumn === column.key && (
                          sortDirection === 'desc' ? <IoChevronDown size={14} /> : <IoChevronUp size={14} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-secondary-text">
                      Loading...
                    </td>
                  </tr>
                ) : filteredProposals.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-secondary-text">
                      No proposals found
                    </td>
                  </tr>
                ) : (
                  filteredProposals.map((proposal, index) => (
                    <tr
                      key={proposal.id}
                      className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      {columns.map((column, idx) => (
                        <td key={idx} className="px-4 py-3 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                          {column.render ? column.render(proposal[column.key], proposal) : (proposal[column.key] || '')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Grid View - Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-8 text-secondary-text">Loading...</div>
          ) : filteredProposals.length === 0 ? (
            <div className="col-span-full text-center py-8 text-secondary-text">No proposals found</div>
          ) : (
            filteredProposals.map((proposal) => (
              <Card key={proposal.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/app/admin/proposals/${proposal.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-primary-text text-sm">#{proposal.proposal_number || proposal.id}</h3>
                    <p className="text-xs text-secondary-text mt-1">{proposal.client_name || 'No Client'}</p>
                  </div>
                  <Badge className={`text-xs ${proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    proposal.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      proposal.status === 'declined' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {proposal.status || 'Draft'}
                  </Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-secondary-text">Amount:</span>
                    <span className="font-medium text-primary-text">${parseFloat(proposal.total || proposal.amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-text">Valid Till:</span>
                    <span className="text-primary-text">{proposal.valid_till ? new Date(proposal.valid_till).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-text">Project:</span>
                    <span className="text-primary-text truncate max-w-[120px]">{proposal.project_name || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleView(proposal); }}
                    className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                    title="View"
                  >
                    <IoEye size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(proposal); }}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="Edit"
                  >
                    <IoCreate size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(proposal); }}
                    className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Delete"
                  >
                    <IoTrash size={16} />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Proposal Modal */}
      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setSelectedProposal(null)
          setFormData({
            company_id: companyId,
            proposal_date: '',
            valid_till: '',
            client_id: '',
            tax: '',
            second_tax: '',
            note: '',
            description: '',
            terms: '',
            items: [],
            amount: 0,
            currency: 'USD'
          })
          setFilteredClients([])
          setFilteredProjects([])
        }}
        title={isEditModalOpen ? "Edit Proposal" : "Add Proposal"}
        width="max-w-5xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
          {/* Proposal Template Dropdown */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-blue-700 flex items-center gap-2">
                <IoLayers className="text-blue-500" /> Use Proposal Template
              </label>
              <button
                onClick={() => {
                  window.open('/app/admin/finance-templates', '_blank')
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
              >
                Manage Templates
              </button>
            </div>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none bg-white text-sm"
            >
              <option value="">-- Select a Template --</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-blue-500 mt-2">Selecting a template will auto-fill the Background and Scope sections.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Deal Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-primary-text mb-2">
                Deal Name*
              </label>
              <Input
                type="text"
                value={formData.deal_name}
                onChange={(e) => setFormData({ ...formData, deal_name: e.target.value })}
                placeholder="Enter deal name"
                required
              />
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Value ($)
              </label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0.00"
              />
            </div>

            {/* Stage */}
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Stage
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none bg-white font-medium"
              >
                {dealPipelineStages.map(stage => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Owner */}
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Owner
              </label>
              <select
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none bg-white"
              >
                <option value="">- Select Owner -</option>
                {filterOptions.created_by_users?.map(user => (
                  <option key={user.id} value={user.name}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Close Date */}
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Close Date
              </label>
              <Input
                type="date"
                value={formData.close_date}
                onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
              />
            </div>

            {/* Linked Contact */}
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Linked Contact (Client/Lead)*
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => {
                  const client = filteredClients.find(c => c.id.toString() === e.target.value)
                  setFormData({
                    ...formData,
                    client_id: e.target.value,
                    company_name: client ? (client.company_name || client.name || '') : ''
                  })
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none bg-white"
                required
              >
                <option value="">- Select Contact -</option>
                {filteredClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.client_name || client.name || client.company_name || `Client #${client.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Linked Company */}
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Linked Company
              </label>
              <Input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Company name"
              />
            </div>
          </div>

          {/* Notes / Activities */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-primary-text mb-2">
              Notes / Activities
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none"
              placeholder="Add deal notes or activity logs..."
            />
          </div>

          {/* Items Section */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-primary-text">
                Proposal Items
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <IoAdd size={16} />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left w-1/4">Item Name</th>
                    <th className="px-3 py-2 text-left w-1/3">Description</th>
                    <th className="px-3 py-2 text-right w-20">Qty</th>
                    <th className="px-3 py-2 text-right w-24">Unit Price</th>
                    <th className="px-3 py-2 text-right w-20">Tax %</th>
                    <th className="px-3 py-2 text-right w-24">Amount</th>
                    <th className="px-3 py-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {formData.items && formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="p-2 align-top">
                        <select
                          value={item.item_name}
                          onChange={(e) => {
                            const selectedItem = catalogItems.find(ci => ci.title === e.target.value)
                            if (selectedItem) {
                              const updatedItems = [...formData.items]
                              updatedItems[index] = {
                                ...updatedItems[index],
                                item_name: selectedItem.title,
                                description: selectedItem.description || '',
                                unit_price: parseFloat(selectedItem.rate) || 0,
                                unit: selectedItem.unit_type || '',
                                amount: (updatedItems[index].quantity || 1) * (parseFloat(selectedItem.rate) || 0)
                              }
                              setFormData({
                                ...formData,
                                items: updatedItems,
                                amount: calculateTotals(updatedItems)
                              })
                            } else {
                              handleItemChange(index, 'item_name', e.target.value)
                            }
                          }}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                        >
                          <option value="">-- Select Item --</option>
                          {catalogItems.map(ci => (
                            <option key={ci.id} value={ci.title}>{ci.title}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 align-top">
                        <textarea
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Description"
                          rows={1}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-right"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-right"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.tax_rate}
                          onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-right"
                        />
                      </td>
                      <td className="p-2 align-top text-right font-medium pt-3">
                        {parseFloat(item.amount || 0).toFixed(2)}
                      </td>
                      <td className="p-2 align-top text-center pt-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <IoTrash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!formData.items || formData.items.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500 italic">
                        No items added yet. Click "Add Item" to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-4">
              <div className="w-64 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                  <span>Total:</span>
                  <span>${formData.amount ? parseFloat(formData.amount).toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description / Content */}
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Background & Scope
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(content) => setFormData({ ...formData, description: content })}
              placeholder="Explain the background, objectives, and scope of work..."
            />
          </div>

          {/* Terms */}
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Terms & Conditions
            </label>
            <RichTextEditor
              value={formData.terms}
              onChange={(content) => setFormData({ ...formData, terms: content })}
              placeholder="Payment terms, validity, etc."
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Note (Internal)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none text-sm"
              placeholder="Internal notes..."
            />
          </div>

          {/* Custom Fields */}
          <div className="mt-4">
            <CustomFieldsSection
              module="Proposals"
              companyId={companyId}
              values={formData.custom_fields || {}}
              onChange={(name, value) => {
                setFormData(prev => ({
                  ...prev,
                  custom_fields: {
                    ...prev.custom_fields,
                    [name]: value
                  }
                }))
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                setSelectedProposal(null)
              }}
              className="px-6"
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="px-6"
            >
              Save
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* View Proposal Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedProposal(null)
        }}
        title="Proposal Details"
        width="800px"
      >
        {selectedProposal && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-text">Proposal #</label>
                <p className="text-primary-text mt-1 text-base font-semibold">{selectedProposal.estimate_number || selectedProposal.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">Status</label>
                <div className="mt-1">
                  <Badge variant={selectedProposal.status === 'accepted' ? 'success' : selectedProposal.status === 'declined' ? 'danger' : selectedProposal.status === 'sent' ? 'info' : 'default'}>
                    {selectedProposal.status ? selectedProposal.status.charAt(0).toUpperCase() + selectedProposal.status.slice(1) : 'Draft'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-text">Company</label>
                <p className="text-primary-text mt-1 text-base">{selectedProposal.company_name || '--'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">Client</label>
                <p className="text-primary-text mt-1 text-base">{selectedProposal.client_name || '--'}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-secondary-text">Project</label>
              <p className="text-primary-text mt-1 text-base">{selectedProposal.project_name || '--'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-secondary-text">Valid Until</label>
              <p className="text-primary-text mt-1 text-base">{formatDate(selectedProposal.valid_till)}</p>
            </div>

            {selectedProposal.description && (
              <div>
                <label className="text-sm font-medium text-secondary-text">Description</label>
                <p className="text-primary-text mt-1 text-base whitespace-pre-wrap">{selectedProposal.description}</p>
              </div>
            )}

            {/* Items */}
            {selectedProposal.items && selectedProposal.items.length > 0 && (
              <div>
                <label className="text-sm font-medium text-secondary-text mb-3 block">Items</label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-secondary-text">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-secondary-text">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-secondary-text">Unit Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-secondary-text">Tax</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-secondary-text">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedProposal.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-primary-text">{item.item_name || item.description || '--'}</td>
                          <td className="px-4 py-2 text-right text-primary-text">{item.quantity || 0}</td>
                          <td className="px-4 py-2 text-right text-primary-text">{formatCurrency(item.unit_price || 0)}</td>
                          <td className="px-4 py-2 text-right text-primary-text">{item.tax_rate || 0}%</td>
                          <td className="px-4 py-2 text-right font-semibold text-primary-text">{formatCurrency(item.amount || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-text">Sub Total:</span>
                  <span className="font-semibold text-primary-text">{formatCurrency(selectedProposal.sub_total || 0)}</span>
                </div>
                {selectedProposal.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary-text">Discount:</span>
                    <span className="font-semibold text-primary-text">-{formatCurrency(selectedProposal.discount_amount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-text">Tax:</span>
                  <span className="font-semibold text-primary-text">{formatCurrency(selectedProposal.tax_amount || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-lg font-bold text-primary-text">Total:</span>
                  <span className="text-lg font-bold text-primary-accent">{formatCurrency(selectedProposal.total || 0)}</span>
                </div>
              </div>
            </div>

            {selectedProposal.note && (
              <div>
                <label className="text-sm font-medium text-secondary-text">Notes</label>
                <p className="text-primary-text mt-1 text-base whitespace-pre-wrap">{selectedProposal.note}</p>
              </div>
            )}

            {selectedProposal.terms && (
              <div>
                <label className="text-sm font-medium text-secondary-text">Terms & Conditions</label>
                <p className="text-primary-text mt-1 text-base whitespace-pre-wrap">{selectedProposal.terms}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleEdit(selectedProposal)
                }}
                className="flex-1"
              >
                Edit Proposal
              </Button>
              {selectedProposal.status === 'accepted' && (
                <Button
                  variant="primary"
                  onClick={handleConvertToInvoice}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <IoDocumentText size={18} />
                  Convert to Invoice
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedProposal(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default Proposals
