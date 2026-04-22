import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Modal from '../../../components/ui/Modal'
import { useSettings } from '../../../context/SettingsContext'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import CustomFieldsSection from '../../../components/ui/CustomFieldsSection'
import { estimatesAPI, projectsAPI, companiesAPI, itemsAPI, customFieldsAPI } from '../../../api'
import RichTextEditor from '../../../components/ui/RichTextEditor'
import {
  IoAdd,
  IoClose,
  IoSearch,
  IoFilter,
  IoDownload,
  IoChevronDown,
  IoChevronUp,
  IoEllipsisVertical,
  IoCheckmarkCircle,
  IoCloudUpload,
  IoTrash,
  IoCreate,
  IoEye,
  IoDocumentText,
  IoHelpCircle,
  IoInformationCircle,
  IoPrint,
  IoCopy,
  IoOpenOutline,
  IoCamera,
  IoCalendar,
  IoGrid,
  IoCheckmark,
  IoChevronBack,
  IoChevronForward
} from 'react-icons/io5'
import { useLanguage } from '../../../context/LanguageContext.jsx'

const Estimates = () => {
  const navigate = useNavigate()
  const { settings, formatCurrency, formatDate: formatDateSetting } = useSettings();
  const { t } = useLanguage()

  const primaryColor = useMemo(() => {
    const fromSettings = settings?.primary_color;
    if (fromSettings) return fromSettings;
    if (typeof window !== "undefined") {
      const cssVar = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary-accent")
        .trim();
      if (cssVar) return cssVar;
    }
    return "#217E45";
  }, [settings?.primary_color]);

  const hexToHsl = (hex) => {
    if (!hex) return { h: 210, s: 100, l: 45 };
    let clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
      clean = clean.split("").map((c) => c + c).join("");
    }
    const num = parseInt(clean, 16);
    if (Number.isNaN(num)) return { h: 210, s: 100, l: 45 };
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  // Get and validate company_id from localStorage
  const [companyId, setCompanyId] = useState(() => {
    const storedId = localStorage.getItem('companyId')
    const parsed = parseInt(storedId, 10)

    if (!storedId || isNaN(parsed) || parsed <= 0) {
      console.error('Invalid or missing companyId in localStorage')
      return null
    }

    return parsed
  })

  // Show error if companyId is invalid
  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{t('common.errors.invalid_access') || 'Ungültiger Zugriff'}</h2>
          <p className="text-gray-600 mb-4">{t('common.errors.invalid_company_id') || 'Unternehmen-ID fehlt'}</p>
          <button
            onClick={() => {
              localStorage.clear()
              navigate('/login')
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }
  const [activeTab, setActiveTab] = useState('estimates') // 'estimates', 'estimate-requests', 'estimate-request-forms'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [productItems, setProductItems] = useState([]) // Dynamic product items from API
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [newItemImagePreview, setNewItemImagePreview] = useState(null)
  const [newItemFormData, setNewItemFormData] = useState({
    title: '',
    description: '',
    category: '',
    unit_type: '',
    rate: '',
    image: null,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' })
  const [estimateItems, setEstimateItems] = useState([])
  const [discountType, setDiscountType] = useState('%')
  const [companies, setCompanies] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([]) // Projects filtered by company (previously by client)
  const [loading, setLoading] = useState(true)
  const [selectedEstimate, setSelectedEstimate] = useState(null)
  const [estimates, setEstimates] = useState([]) // Moved before useEffect

  // Filter states

  const [periodFilter, setPeriodFilter] = useState('yearly') // monthly, yearly, custom, dynamic
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [customDateStart, setCustomDateStart] = useState('')
  const [customDateEnd, setCustomDateEnd] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [activeFilters, setActiveFilters] = useState([]) // Track active filters

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [formData, setFormData] = useState({
    company: '',
    estimateNumber: '',
    estimateDate: new Date().toISOString().split('T')[0],
    validTill: '',
    currency: 'USD',
    project: '',
    calculateTax: 'After Discount',
    tax: '',
    taxRate: 0,
    secondTax: '',
    secondTaxRate: 0,
    description: '',
    note: '',
    terms: 'Thank you for your business.',
    discount: 0,
    discountType: '%',
    items: [],
    custom_fields: {},
  })

  const fetchEstimates = useCallback(async () => {
    try {
      setLoading(true)
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchEstimates:', companyId)
        setEstimates([])
        setLoading(false)
        return
      }
      const params = { company_id: companyId }
      if (statusFilter !== 'All') {
        params.status = statusFilter
      }

      console.log('Fetching estimates with params:', params)
      const response = await estimatesAPI.getAll(params)
      console.log('Estimates API response:', response.data)

      if (response.data && response.data.success) {
        const fetchedEstimates = response.data.data || []
        console.log('Fetched estimates count:', fetchedEstimates.length)

        // Transform API data to match component format
        const transformedEstimates = fetchedEstimates.map(estimate => {
          // Fix estimate number format - convert any format to "ESTIMATE #XXX"
          let estNumber = estimate.estimate_number || ''
          // Extract numeric part from any format (EST#, PROP#, ESTIMATE#, etc.)
          const numMatch = estNumber.match(/\d+/)
          const numPart = numMatch ? numMatch[0].padStart(3, '0') : String(estimate.id).padStart(3, '0')
          const formattedEstimateNumber = `ESTIMATE #${numPart}`

          return {
            id: estimate.id,
            estimateNumber: formattedEstimateNumber,
            company_id: estimate.company_id,
            company_name: estimate.company_name || '--',
            project: estimate.project_name || '--',
            total: parseFloat(estimate.total || estimate.total_amount || 0),
            validTill: estimate.valid_till ? estimate.valid_till.split('T')[0] : '',
            created: estimate.proposal_date || estimate.created_at || estimate.estimate_date || '',
            created_by_name: estimate.created_by_name || estimate.created_by || '-',
            estimateRequestNumber: estimate.estimate_request_number || '--',
            status: (estimate.status || 'Draft').charAt(0).toUpperCase() + (estimate.status || 'Draft').slice(1).toLowerCase(),
            items: estimate.items || [],
            custom_fields: estimate.custom_fields || {},
          }
        })
        console.log('Transformed estimates:', transformedEstimates)
        setEstimates(transformedEstimates)
      } else {
        console.error('Failed to fetch estimates:', response.data?.error)
        setEstimates([])
      }
    } catch (error) {
      console.error('Error fetching estimates:', error)
      console.error('Error details:', error.response?.data || error.message)
      setEstimates([])
      alert(error.response?.data?.error || 'Failed to fetch estimates. Please check console for details.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, companyId])

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



  const fetchProjects = useCallback(async () => {
    try {
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
  }, [companyId])

  const fetchProductItems = useCallback(async () => {
    try {
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        setProductItems([])
        return
      }
      const response = await itemsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setProductItems(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching product items:', error)
      setProductItems([])
    }
  }, [companyId])

  // Fetch estimates, companies, clients, and projects on component mount
  useEffect(() => {
    fetchEstimates()
    fetchCompanies()
    fetchProjects()
    fetchProductItems()
  }, [fetchEstimates, fetchCompanies, fetchProjects, fetchProductItems])

  // Clients are already filtered by company_id from localStorage - no need for Company dropdown


  // Filter projects by client (which is already filtered by company)
  useEffect(() => {
    setFilteredProjects(projects)
  }, [projects])

  const taxOptions = [
    { value: '', label: 'Nothing selected' },
    { value: 'GST: 10%', label: 'GST: 10%', rate: 10 },
    { value: 'CGST: 18%', label: 'CGST: 18%', rate: 18 },
    { value: 'VAT: 10%', label: 'VAT: 10%', rate: 10 },
    { value: 'IGST: 10%', label: 'IGST: 10%', rate: 10 },
    { value: 'UTGST: 10%', label: 'UTGST: 10%', rate: 10 },
  ]

  const unitOptions = ['Pcs', 'Kg', 'Hours', 'Days']

  // Generate estimate number
  const generateEstimateNumber = () => {
    const nextNum = (estimates || []).length + 1
    return `EST#${String(nextNum).padStart(3, '0')}`
  }

  // Filter products based on search and exclude already selected items
  const filteredProducts = productItems.filter(product => {
    const productName = product.title || product.name || ''
    const matchesSearch = productName.toLowerCase().includes(productSearchQuery.toLowerCase())
    const isAlreadyAdded = estimateItems.some(item => item.itemName === productName)
    return matchesSearch && !isAlreadyAdded
  })

  // Open the Add Item Modal instead of adding a row directly
  const handleAddItem = () => {
    setNewItemFormData({
      title: '',
      description: '',
      category: '',
      unit_type: '',
      rate: '',
      show_in_client_portal: false,
      image: null,
    })
    setNewItemImagePreview(null)
    setIsAddItemModalOpen(true)
  }

  const handleNewItemImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setNewItemFormData({ ...newItemFormData, image: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewItemImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveNewItem = async (e) => {
    e.preventDefault()
    try {
      const submitData = new FormData()
      submitData.append('company_id', companyId)
      submitData.append('title', newItemFormData.title)
      submitData.append('description', newItemFormData.description)
      submitData.append('category', newItemFormData.category)
      submitData.append('unit_type', newItemFormData.unit_type)
      submitData.append('rate', newItemFormData.rate)
      submitData.append('show_in_client_portal', newItemFormData.show_in_client_portal ? 1 : 0)
      if (newItemFormData.image) {
        submitData.append('image', newItemFormData.image)
      }

      const response = await itemsAPI.create(submitData)

      if (response.data.success) {
        fetchProductItems()

        const createdItem = {
          id: response.data.data?.id || Date.now(),
          itemName: newItemFormData.title,
          description: newItemFormData.description,
          quantity: 1,
          unit: newItemFormData.unit_type,
          unitPrice: parseFloat(newItemFormData.rate || 0),
          tax: '',
          taxRate: 0,
          file: null,
          fileName: 'No file chosen',
          amount: parseFloat(newItemFormData.rate || 0),
        }

        setEstimateItems([...estimateItems, createdItem])

        setIsAddItemModalOpen(false)
        setNewItemFormData({
          title: '',
          description: '',
          category: '',
          unit_type: '',
          rate: '',
          show_in_client_portal: false,
          image: null,
        })
        setNewItemImagePreview(null)

      } else {
        alert(response.data.error || 'Failed to create item')
      }
    } catch (error) {
      console.error('Error creating item:', error)
      alert(error.response?.data?.error || 'Failed to create item')
    }
  }

  // Add product as estimate item
  const handleAddProduct = () => {
    if (!selectedProduct) {
      alert('Please select a product')
      return
    }

    const product = productItems.find(p => p.id === parseInt(selectedProduct))
    if (!product) return

    const newItem = {
      id: Date.now(),
      itemName: product.title || product.name,
      description: product.description || '',
      quantity: 1,
      unit: product.unit_type || product.unit || 'Pcs',
      unitPrice: parseFloat(product.rate || product.unitPrice || 0),
      tax: '',
      taxRate: 0,
      file: null,
      fileName: 'No file chosen',
      amount: parseFloat(product.rate || product.unitPrice || 0),
    }

    setEstimateItems([...estimateItems, newItem])
    setSelectedProduct('')
    setProductSearchQuery('')
    setShowProductDropdown(false)
  }

  // Update estimate item
  const handleItemChange = (id, field, value) => {
    setEstimateItems(estimateItems.map(item => {
      if (item.id === id) {
        let updatedItem = { ...item, [field]: value }

        if (field === 'tax') {
          const taxOption = taxOptions.find(t => t.value === value)
          updatedItem.taxRate = taxOption ? taxOption.rate : 0
        }

        const quantity = updatedItem.quantity || 0
        const unitPrice = updatedItem.unitPrice || 0
        const subtotal = quantity * unitPrice
        const taxAmount = updatedItem.taxRate ? (subtotal * updatedItem.taxRate / 100) : 0
        updatedItem.amount = subtotal + taxAmount

        return updatedItem
      }
      return item
    }))
  }

  // Remove estimate item
  const handleRemoveItem = (id) => {
    setEstimateItems(estimateItems.filter(item => item.id !== id))
  }

  // Handle file upload
  const handleFileUpload = (id, file) => {
    setEstimateItems(estimateItems.map(item =>
      item.id === id ? { ...item, file, fileName: file.name } : item
    ))
  }

  // Calculate totals
  const calculateSubTotal = () => {
    return (estimateItems || []).reduce((sum, item) => sum + ((item?.quantity || 0) * (item?.unitPrice || 0)), 0)
  }

  const calculateTaxTotal = () => {
    return (estimateItems || []).reduce((sum, item) => {
      const subtotal = (item?.quantity || 0) * (item?.unitPrice || 0)
      const taxAmount = item?.taxRate ? (subtotal * item.taxRate / 100) : 0
      return sum + taxAmount
    }, 0)
  }

  const calculateDiscount = () => {
    const subTotal = calculateSubTotal()
    if (discountType === '%') {
      return (subTotal * formData.discount) / 100
    }
    return formData.discount
  }

  const calculateGrandTotal = () => {
    const subTotal = calculateSubTotal()
    const taxTotal = calculateTaxTotal()
    const discount = calculateDiscount()
    return subTotal + taxTotal - discount
  }



  const resetForm = async () => {
    const today = new Date()
    const validTillDate = new Date(today)
    validTillDate.setDate(validTillDate.getDate() + 30)

    setFormData({
      company: companyId,
      estimateNumber: generateEstimateNumber(),
      estimateDate: today.toISOString().split('T')[0],
      validTill: validTillDate.toISOString().split('T')[0],
      currency: 'USD',
      project: '',
      calculateTax: 'After Discount',
      description: '',
      note: '',
      terms: 'Thank you for your business.',
      discount: 0,
      discountType: '%',
      tax: '',
      taxRate: 0,
      secondTax: '',
      secondTaxRate: 0,
    })
    setEstimateItems([])
    setSelectedProduct('')
    setProductSearchQuery('')

    setFilteredProjects([])
  }

  const handleSave = async (asDraft = false) => {
    if (!formData.validTill) {
      alert('Valid Till is required')
      return
    }

    try {
      const selectedProject = filteredProjects.find(p => p.id === parseInt(formData.project)) || projects.find(p => p.id === parseInt(formData.project))

      const adminCompanyId = companyId

      const estimateData = {
        company_id: parseInt(adminCompanyId),
        estimate_number: formData.estimateNumber || generateEstimateNumber(),
        estimate_date: formData.estimateDate || new Date().toISOString().split('T')[0],
        valid_till: formData.validTill,
        client_id: null,
        project_id: selectedProject?.id || null,
        status: asDraft ? 'Draft' : 'Sent',
        currency: formData.currency || 'USD',
        discount: formData.discount || 0,
        discount_type: formData.discountType || '%',
        description: formData.description || null,
        note: formData.note || null,
        terms: formData.terms || null,
        tax: formData.tax || null,
        second_tax: formData.secondTax || null,
        items: estimateItems.map(item => ({
          item_name: item.itemName,
          description: item.description || null,
          quantity: item.quantity || 1,
          unit: item.unit || 'Pcs',
          unit_price: item.unitPrice || 0,
          tax: item.tax || null,
          tax_rate: item.taxRate || 0,
          amount: item.amount || (item.unitPrice * item.quantity),
        })),
        custom_fields: formData.custom_fields || {},
      }

      if (isEditModalOpen && selectedEstimate) {
        const response = await estimatesAPI.update(selectedEstimate.id, estimateData)
        if (response.data.success) {
          alert('Estimate updated successfully!')
          await fetchEstimates()
          setIsEditModalOpen(false)
          setSelectedEstimate(null)
          resetForm()
        } else {
          alert(response.data.error || 'Failed to update estimate')
        }
      } else {
        const response = await estimatesAPI.create(estimateData)
        if (response.data.success) {
          alert('Estimate created successfully!')
          await fetchEstimates()
          setIsAddModalOpen(false)
          resetForm()
        } else {
          alert(response.data.error || 'Failed to create estimate')
        }
      }
    } catch (error) {
      console.error('Error saving estimate:', error)
      alert(error.response?.data?.error || 'Failed to save estimate')
    }
  }

  const handleEdit = async (estimate) => {
    try {
      const adminCompanyId = parseInt(localStorage.getItem('companyId') || 1, 10)

      const response = await estimatesAPI.getById(estimate.id)
      if (response.data.success) {
        const data = response.data.data

        setSelectedEstimate(estimate)
        const clientId = data.client_id?.toString() || ''
        const projectId = data.project_id?.toString() || ''

        setFormData({
          company: adminCompanyId.toString(),
          estimateNumber: data.estimate_number || estimate.estimateNumber || '',
          estimateDate: data.proposal_date ? data.proposal_date.split('T')[0] : (data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
          validTill: data.valid_till ? data.valid_till.split('T')[0] : estimate.validTill || '',
          currency: data.currency || 'USD',
          tax: data.tax || '',
          secondTax: data.second_tax || '',
          custom_fields: data.custom_fields || estimate.custom_fields || {},
        })
        setEstimateItems(data.items || estimate.items || [])
        setIsEditModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching estimate:', error)
      alert('Failed to load estimate details')
    }
  }

  const handleDelete = async (estimate) => {
    if (window.confirm(`Are you sure you want to delete ${estimate.estimateNumber}?`)) {
      try {
        const response = await estimatesAPI.delete(estimate.id)
        if (response.data.success) {
          alert('Estimate deleted successfully!')
          await fetchEstimates()
        } else {
          alert(response.data.error || 'Failed to delete estimate')
        }
      } catch (error) {
        console.error('Error deleting estimate:', error)
        alert(error.response?.data?.error || 'Failed to delete estimate')
      }
    }
  }

  const handleView = (estimate) => {
    navigate(`/app/admin/estimates/${estimate.id}`)
  }

  const handleCopy = async (estimate) => {
    try {
      const response = await estimatesAPI.getById(estimate.id)
      if (response.data.success) {
        const data = response.data.data
        // Create a copy with new estimate number
        const copyData = {
          ...data,
          estimate_number: generateEstimateNumber(),
          status: 'Draft',
        }
        delete copyData.id
        delete copyData.created_at
        delete copyData.updated_at

        const createResponse = await estimatesAPI.create(copyData)
        if (createResponse.data.success) {
          alert('Estimate copied successfully!')
          await fetchEstimates()
        }
      }
    } catch (error) {
      console.error('Error copying estimate:', error)
      alert('Failed to copy estimate')
    }
  }

  // Handle Excel Export
  const handleExportExcel = () => {
    const csvData = filteredEstimates.map(e => ({
      'Estimate #': e.estimateNumber || '',
      'Project': e.project || '',
      'Company': e.company_name || '',
      'Client': e.client?.name || '',
      'Total': e.total || 0,
      'Valid Till': e.validTill || '',
      'Estimate Date': e.created || '',
      'Created By': e.created_by_name || '',
      'Status': e.status || ''
    }))

    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `estimates_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Handle Print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    const tableHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>{t('auto.auto_9042a776') || 'Estimates List'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #fafafa; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>{t('Quotes')} ${t('common.list')}</h1>
          <table>
            <thead>
              <tr>
                <th>Estimate #</th>
                <th>{t('sidebar.projects') || 'Project'}</th>
                <th>{t('auto.auto_1c76cbfe') || 'Company'}</th>
                <th>{t('sidebar.contacts') || 'Client'}</th>
                <th>{t('auto.auto_96b01412') || 'Total'}</th>
                <th>{t('estimates.columns.valid_till') || 'Valid Till'}</th>
                <th>{t('auto.auto_319ab3bf') || 'Estimate Date'}</th>
                <th>{t('common.status') || 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEstimates.map(e => `
                <tr>
                  <td>${e.estimateNumber || ''}</td>
                  <td>${e.project || ''}</td>
                  <td>${e.company_name || ''}</td>
                  <td>${e.client?.name || ''}</td>
                  <td>€${parseFloat(e.total || 0).toFixed(2)}</td>
                  <td>${e.validTill || ''}</td>
                  <td>${e.created || ''}</td>
                  <td>${e.status || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `
    printWindow.document.write(tableHTML)
    printWindow.document.close()
  }

  // Apply filters
  const handleApplyFilters = () => {
    fetchEstimates()
  }

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('All')

    setPeriodFilter('yearly')
    setSelectedYear(new Date().getFullYear())
    setSelectedMonth(new Date().getMonth() + 1)
    setCustomDateStart('')
    setCustomDateEnd('')
    setSearchQuery('')
    setShowFilterPanel(false)
    fetchEstimates()
  }

  // Status colors with background (Aligned with Invoices HSL style)
  const getStatusStyle = (status) => {
    const base = hexToHsl(primaryColor);
    const s = status?.toLowerCase() || "";
    const hueOffsets = {
      accepted: 0,
      sent: 200,
      declined: 145,
      rejected: 145,
      waiting: 25,
      expired: 55,
    };
    if (s === "draft") {
      return {
        backgroundColor: `hsl(${base.h} 10% 92%)`,
        color: `hsl(${base.h} 20% 35%)`,
        borderColor: `hsl(${base.h} 15% 85%)`,
      };
    }
    const hue = (base.h + (hueOffsets[s] || 0)) % 360;
    return {
      backgroundColor: `hsl(${hue} ${Math.max(45, base.s)}% 90%)`,
      color: `hsl(${hue} ${Math.max(55, base.s)}% 35%)`,
      borderColor: `hsl(${hue} ${Math.max(45, base.s)}% 80%)`,
    };
  };

  const filteredEstimates = (estimates || []).filter(estimate => {
    if (!estimate) return false

    // Search filter
    if (searchQuery && !estimate.estimateNumber?.toLowerCase().includes(searchQuery.toLowerCase()) && !estimate.client?.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Status filter
    if (statusFilter !== 'All' && estimate.status !== statusFilter) {
      return false
    }



    // Date filters
    const estimateDate = estimate.created ? new Date(estimate.created) : null

    // Period filter (Monthly/Yearly)
    if (periodFilter === 'yearly' && estimateDate) {
      if (estimateDate.getFullYear() !== selectedYear) {
        return false
      }
    }

    if (periodFilter === 'monthly' && estimateDate) {
      if (estimateDate.getFullYear() !== selectedYear || estimateDate.getMonth() + 1 !== selectedMonth) {
        return false
      }
    }

    // Custom date range filter
    if (customDateStart && estimateDate) {
      const startDate = new Date(customDateStart)
      if (estimateDate < startDate) {
        return false
      }
    }

    if (customDateEnd && estimateDate) {
      const endDate = new Date(customDateEnd)
      endDate.setHours(23, 59, 59, 999) // Include the entire end day
      if (estimateDate > endDate) {
        return false
      }
    }

    return true
  })

  // Pagination logic
  const totalItems = filteredEstimates.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedEstimates = filteredEstimates.slice(startIndex, endIndex)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, periodFilter, selectedYear, selectedMonth, customDateStart, customDateEnd, searchQuery])

  return (
    <div className="space-y-3 sm:space-y-4 bg-main-bg min-h-screen p-2 sm:p-4 text-primary-text">
      {/* Header with Tabs */}
      <div className="bg-card-bg rounded-lg shadow-soft border border-border-light overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 border-b border-border-light">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('estimates')}
              className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'estimates'
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-secondary-text hover:text-primary-text'
                }`}
            >
              {t('Quotes')}
            </button>
            <button
              onClick={() => setActiveTab('estimate-requests')}
              className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'estimate-requests'
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-secondary-text hover:text-primary-text'
                }`}
            >
              {t('estimates.requests')}
            </button>
            <button
              onClick={() => setActiveTab('estimate-request-forms')}
              className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'estimate-request-forms'
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-secondary-text hover:text-primary-text'
                }`}
            >
              {t('estimates.requestForms')}
            </button>
          </div>
          <AddButton onClick={async () => {
            resetForm();
            setIsAddModalOpen(true);
          }} label={t('estimates.addEstimate')} className="py-3 h-11 bg-green-500 hover:bg-green-600" />
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'estimates' && (
        <>
          {/* Filter Bar */}
          <div className="bg-card-bg rounded-lg shadow-soft border border-border-light p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left side - Add new filter */}
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-2 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
                  <IoGrid size={14} className="text-gray-500" />
                </button>
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-xs border rounded-lg transition-colors ${showFilterPanel ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 hover:bg-gray-50 text-gray-600'}`}
                >
                  <IoAdd size={14} />
                  {t('common.add_new_filter')}
                </button>
                {/* Active filter tags */}
                {statusFilter !== 'All' && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter('All')} className="hover:text-blue-900">
                      <IoClose size={14} />
                    </button>
                  </span>
                )}
                {clientFilter !== 'All' && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Client: {clients.find(c => c.id === parseInt(clientFilter))?.client_name || clientFilter}
                    <button onClick={() => setClientFilter('All')} className="hover:text-green-900">
                      <IoClose size={14} />
                    </button>
                  </span>
                )}
              </div>

              {/* Right side - Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Dropdown */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none bg-white"
                  >
                    <option value="All">- {t('common.status')} -</option>
                    <option value="Waiting">{t('auto.auto_5706de96') || 'Waiting'}</option>
                    <option value="Draft">{t('') || ''}</option>
                    <option value="Sent">{t('') || ''}</option>
                    <option value="Accepted">{t('') || ''}</option>
                    <option value="Declined">{t('') || ''}</option>
                  </select>
                  <IoChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>

                {/* Period Buttons */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setPeriodFilter('monthly')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${periodFilter === 'monthly' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    {t('common.monthly')}
                  </button>
                  <button
                    onClick={() => setPeriodFilter('yearly')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${periodFilter === 'yearly' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    {t('common.yearly')}
                  </button>
                  <button
                    onClick={() => setPeriodFilter('custom')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${periodFilter === 'custom' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    {t('common.custom')}
                  </button>
                  <button
                    onClick={() => setPeriodFilter('dynamic')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${periodFilter === 'dynamic' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    {t('common.dynamic')}
                  </button>
                </div>

                {/* Month Selector (for Monthly filter) */}
                {periodFilter === 'monthly' && (
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="appearance-none px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none bg-white"
                    >
                      <option value={1}>{t('auto.auto_86f5978d') || 'January'}</option>
                      <option value={2}>{t('') || ''}</option>
                      <option value={3}>{t('') || ''}</option>
                      <option value={4}>{t('') || ''}</option>
                      <option value={5}>{t('') || ''}</option>
                      <option value={6}>{t('') || ''}</option>
                      <option value={7}>{t('') || ''}</option>
                      <option value={8}>{t('') || ''}</option>
                      <option value={9}>{t('') || ''}</option>
                      <option value={10}>{t('') || ''}</option>
                      <option value={11}>{t('') || ''}</option>
                      <option value={12}>{t('') || ''}</option>
                    </select>
                    <IoChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                )}

                {/* Year Selector */}
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-8">
                  <button
                    onClick={() => setSelectedYear(prev => prev - 1)}
                    className="px-2 py-1.5 hover:bg-gray-100 border-r border-gray-300"
                  >
                    <IoChevronBack size={14} />
                  </button>
                  <span className="px-3 py-1.5 text-xs font-medium">{selectedYear}</span>
                  <button
                    onClick={() => setSelectedYear(prev => prev + 1)}
                    className="px-2 py-1.5 hover:bg-gray-100 border-l border-gray-300"
                  >
                    <IoChevronForward size={14} />
                  </button>
                </div>

                {/* Apply & Reset Buttons */}
                <button
                  onClick={handleApplyFilters}
                  className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  title={t('common.apply_filters')}
                >
                  <IoCheckmark size={16} />
                </button>
                <button
                  onClick={handleResetFilters}
                  className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  title={t('common.reset_filters')}
                >
                  <IoClose size={16} />
                </button>
              </div>
            </div>

            {/* Expandable Filter Panel */}
            {showFilterPanel && (
              <div className="mt-4 pt-4 border-t border-border-light">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">


                  {/* Date Range - Start */}
                  <div>
                    <label className="w-32 text-sm font-medium text-gray-700">{t('common.bill_date')}</label>
                    <input
                      type="date"
                      value={customDateStart}
                      onChange={(e) => setCustomDateStart(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                    />
                  </div>

                  {/* Date Range - End */}
                  <div>
                    <label className="w-32 text-sm font-medium text-gray-700">{t('common.due_date')}</label>
                    <input
                      type="date"
                      value={customDateEnd}
                      onChange={(e) => setCustomDateEnd(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                    />
                  </div>

                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.search')}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('common.search') + " estimates..."}
                        className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                      />
                      <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button
                    onClick={() => {

                      setCustomDateStart('')
                      setCustomDateEnd('')
                      setSearchQuery('')
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {t('common.clear')}
                  </button>
                  <button
                    onClick={() => {
                      handleApplyFilters()
                      setShowFilterPanel(false)
                    }}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {t('common.apply')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Estimates Table */}
          <Card className="p-0 overflow-hidden bg-card-bg border border-border-light">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-xs sm:text-sm">
                <thead className="bg-main-bg border-b border-border-light">
                  <tr>
                    <th className="w-[15%] px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">
                      Estimate
                    </th>
                    <th className="w-[20%] px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">
                      Client
                    </th>
                    <th className="w-[12%] px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">
                      Estimate date
                    </th>
                    <th className="w-[15%] px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">
                      Created by
                    </th>
                    <th className="w-[12%] px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="w-[12%] px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-[14%] px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card-bg divide-y divide-border-light">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-secondary-text">
                        Loading estimates...
                      </td>
                    </tr>
                  ) : filteredEstimates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-secondary-text">
                        No estimates found
                      </td>
                    </tr>
                  ) : (
                    paginatedEstimates.map((estimate) => (
                      <tr key={estimate.id} className="hover:bg-main-bg transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap align-top">
                          <button
                            onClick={() => handleView(estimate)}
                            className="text-primary-accent hover:underline font-semibold text-xs sm:text-sm"
                          >
                            {estimate.estimateNumber}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap align-top">
                          <button
                            onClick={() => handleView(estimate)}
                            className="text-primary-text hover:underline text-xs sm:text-sm font-medium"
                          >
                            {estimate.client?.name || 'Unknown Client'}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-secondary-text text-xs sm:text-sm align-top">
                          {formatDate(estimate.created)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap align-top">
                          {estimate.created_by_name && estimate.created_by_name !== '-' ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary-accent/10 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-primary-accent">
                                  {estimate.created_by_name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-secondary-text text-xs sm:text-sm">{estimate.created_by_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-text">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-primary-text font-semibold text-xs sm:text-sm align-top">
                          {formatCurrency(estimate.total)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap align-top">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border whitespace-nowrap" style={getStatusStyle(estimate.status)}>
                            {estimate.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap align-top">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopy(estimate)
                              }}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                              title="Copy"
                            >
                              <IoCopy size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(estimate)
                              }}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                              title="Edit"
                            >
                              <IoCreate size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(estimate)
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <IoTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredEstimates.length > 0 && (
                  <tfoot className="bg-main-bg border-t border-border-light">
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-right font-semibold text-gray-700">
                        Total:
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-800 font-bold">
                        {formatCurrency(filteredEstimates.reduce((sum, est) => sum + (parseFloat(est.total) || 0), 0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border-light flex items-center justify-between bg-main-bg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>items per page</span>
              </div>
              <div className="text-sm text-gray-600">
                {totalItems > 0 ? `${startIndex + 1}-${endIndex} / ${totalItems}` : '0 / 0'}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-1.5 border border-gray-300 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                  <IoChevronBack size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`p-1.5 border border-gray-300 rounded ${currentPage === totalPages || totalPages === 0 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                  <IoChevronForward size={16} />
                </button>
              </div>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'estimate-requests' && (
        <Card className="p-6">
          <div className="text-center py-8 text-secondary-text">
            <p>{t('auto.auto_c1060bbe') || 'Estimate Requests feature coming soon'}</p>
          </div>
        </Card>
      )}

      {activeTab === 'estimate-request-forms' && (
        <Card className="p-6">
          <div className="text-center py-8 text-secondary-text">
            <p>{t('') || ''}</p>
          </div>
        </Card>
      )}

      {/* Create/Edit Estimate Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setSelectedEstimate(null)
          resetForm()
        }}
        title={isEditModalOpen ? "Edit Estimate" : "Add Estimate"}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Estimate date
            </label>
            <div className="relative">
              <Input
                type="date"
                value={formData.estimateDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, estimateDate: e.target.value })} />
              <IoCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-text pointer-events-none" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Valid until
            </label>
            <div className="relative">
              <Input
                type="date"
                value={formData.validTill}
                onChange={(e) => setFormData({ ...formData, validTill: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Client
            </label>
            <div className="relative">
              <select
                value={formData.client}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    client: e.target.value,
                    project: ''
                  })
                }}
                className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none appearance-none"
                required
              >
                <option value="">{t('') || ''}</option>
                {clients.length === 0 ? (
                  <option value="" disabled>{t('') || ''}</option>
                ) : (
                  clients.map(client => {
                    const name = client.client_name || client.name || client.company_name || `Client #${client.id}`
                    const phone = client.phone || client.phone_number || ''
                    const company = client.company_name || client.companyName || ''
                    const label = `${name}${phone ? ` (${phone})` : ''}${company && company !== name ? ` - ${company}` : ''}`
                    return (
                      <option key={client.id} value={client.id}>
                        {label}
                      </option>
                    )
                  })
                )}
              </select>
              <IoChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-text pointer-events-none" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Project / Job Card
            </label>
            <div className="relative">
              <select
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none appearance-none"
              >
                <option value="">{t('common.select_project')}</option>
                {filteredProjects.length === 0 ? (
                  <option value="" disabled>{t('auto.auto_b6ef6732') || 'No projects found for this client'}</option>
                ) : (
                  filteredProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.project_name || project.name || `Project #${project.id}`}
                    </option>
                  ))
                )}
              </select>
              <IoChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-text pointer-events-none" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              TAX
            </label>
            <div className="relative">
              <select
                value={formData.tax || ''}
                onChange={(e) => {
                  const selectedTax = taxOptions.find(t => t.value === e.target.value)
                  setFormData({
                    ...formData,
                    tax: e.target.value,
                    taxRate: selectedTax ? selectedTax.rate : 0
                  })
                }}
                className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none appearance-none"
              >
                <option value="">-</option>
                {taxOptions.filter(t => t.value).map(tax => (
                  <option key={tax.value} value={tax.value}>{tax.label}</option>
                ))}
              </select>
              <IoChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-text pointer-events-none" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Second TAX
            </label>
            <div className="relative">
              <select
                value={formData.secondTax || ''}
                onChange={(e) => {
                  const selectedTax = taxOptions.find(t => t.value === e.target.value)
                  setFormData({
                    ...formData,
                    secondTax: e.target.value,
                    secondTaxRate: selectedTax ? selectedTax.rate : 0
                  })
                }}
                className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none appearance-none"
              >
                <option value="">-</option>
                {taxOptions.filter(t => t.value).map(tax => (
                  <option key={tax.value} value={tax.value}>{tax.label}</option>
                ))}
              </select>
              <IoChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-text pointer-events-none" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Note
            </label>
            <textarea
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none"
            />
          </div>

          {/* Custom Fields Section */}
          <div className="mt-4">
            <CustomFieldsSection
              module="Estimates"
              companyId={companyId}
              values={formData.custom_fields || {}
              }
              onChange={(name, value) => setFormData(prev => ({ ...prev, custom_fields: { ...prev.custom_fields, [name]: value } }))}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                setSelectedEstimate(null)
                resetForm()
              }}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <IoClose size={18} />
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSave(false)}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <IoCheckmarkCircle size={18} />
              {isEditModalOpen ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Add item"
        size="lg"
      >
        <form onSubmit={handleSaveNewItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newItemFormData.title}
                  onChange={(e) => setNewItemFormData({ ...newItemFormData, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={newItemFormData.category}
                  onChange={(e) => setNewItemFormData({ ...newItemFormData, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                  required
                >
                  <option value="">{t('common.select_client')}</option>
                  <option value="Design">{t('') || ''}</option>
                  <option value="Development">{t('') || ''}</option>
                  <option value="Marketing">{t('') || ''}</option>
                  <option value="Services">{t('') || ''}</option>
                  <option value="Products">{t('') || ''}</option>
                  <option value="Other">{t('') || ''}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Unit type <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newItemFormData.unit_type}
                  onChange={(e) => setNewItemFormData({ ...newItemFormData, unit_type: e.target.value })}
                  placeholder="Unit type (Ex: hours, pc, etc.)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Rate <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItemFormData.rate}
                  onChange={(e) => setNewItemFormData({ ...newItemFormData, rate: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show_in_client_portal"
                  checked={newItemFormData.show_in_client_portal}
                  onChange={(e) => setNewItemFormData({ ...newItemFormData, show_in_client_portal: e.target.checked })}
                  className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent"
                />
                <label htmlFor="show_in_client_portal" className="text-sm font-medium text-primary-text">
                  Show in client portal
                </label>
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Item Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-accent transition-colors">
                  {newItemImagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={newItemImagePreview}
                        alt="Preview"
                        className="max-w-full h-48 object-contain mx-auto rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewItemImagePreview(null)
                          setNewItemFormData({ ...newItemFormData, image: null })
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <IoCamera className="mx-auto text-gray-400" size={48} />
                      <p className="text-sm text-secondary-text">{t('') || ''}</p>
                    </div>
                  )}
                  <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-accent text-white rounded-lg cursor-pointer hover:bg-primary-accent/90 transition-colors">
                    <IoCloudUpload size={18} />
                    <span>" + (t('auto.auto_1f98842c') || "Upload Image") + "</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewItemImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddItemModalOpen(false)}
              className="flex items-center gap-2"
            >
              <IoClose size={18} />
              Close
            </Button>
            <Button
              type="submit"
              className="flex items-center gap-2"
            >
              <IoCheckmarkCircle size={18} />
              Save
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}

export default Estimates
