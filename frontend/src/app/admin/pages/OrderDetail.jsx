import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ordersAPI, companiesAPI, itemsAPI, tasksAPI, invoicesAPI } from '../../../api'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import TaskFormModal from '../../../components/ui/TaskFormModal'
import { useLanguage } from '../../../context/LanguageContext.jsx'
import { 
  IoArrowBack,
  IoBriefcase,
  IoPerson,
  IoCalendar,
  IoTime,
  IoMail,
  IoAdd,
  IoCreate,
  IoTrash,
  IoCheckmarkCircle,
  IoDocumentText,
  IoPrint,
  IoDownload,
  IoEye,
  IoClose,
  IoChevronDown,
  IoSearch,
  IoFilter,
  IoEllipsisVertical,
  IoRefresh,
  IoStorefront,
  IoCheckmark,
  IoLocation,
  IoCall,
  IoGlobe,
  IoCart,
  IoReceipt,
  IoList,
  IoCash
} from 'react-icons/io5'

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [order, setOrder] = useState(null)
  const [orders, setOrders] = useState([])
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false)
  const [items, setItems] = useState([])
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [itemCategoryFilter, setItemCategoryFilter] = useState('')
  const [tasks, setTasks] = useState([])
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'Medium'
  })
  const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
  const userId = parseInt(localStorage.getItem('userId') || 1, 10)

  useEffect(() => {
    fetchOrder()
    fetchOrders()
    fetchItems()
    fetchTasks()
  }, [id])

  useEffect(() => {
    if (order) {
      // Set company from order data if available
      if (order.company_name || order.company_address) {
        setCompany({
          name: order.company_name || 'Company Name',
          address: order.company_address || '',
          phone: '',
          email: '',
          website: ''
        })
      } else {
        // Only fetch if not in order data
        fetchCompany()
      }
    }
  }, [order])

  useEffect(() => {
    fetchItems()
  }, [itemCategoryFilter])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await ordersAPI.getById(id, { company_id: companyId })
      if (response.data.success) {
        setOrder(response.data.data)
      } else {
        alert(response.data.error || 'Order not found')
        navigate('/app/admin/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      alert('Failed to fetch order details')
      navigate('/app/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const params = { company_id: companyId }
      if (statusFilter && statusFilter !== 'All') {
        params.status = statusFilter
      }
      if (searchQuery) {
        params.search = searchQuery
      }
      const response = await ordersAPI.getAll(params)
      if (response.data.success) {
        setOrders(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }



  const fetchCompany = async () => {
    try {
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.log('Invalid companyId for fetchCompany:', companyId)
        setCompany(null)
        return
      }
      const response = await companiesAPI.getById(companyId)
      if (response.data && response.data.success && response.data.data) {
        setCompany(response.data.data)
      } else {
        // Company not found or invalid response - set to null, don't break page
        setCompany(null)
      }
    } catch (error) {
      // Silently fail - company data is optional, don't break the page
      console.log('Company not found or error:', error.response?.status || error.message)
      // Set to null instead of default object - page will handle null gracefully
      setCompany(null)
    }
  }

  const fetchItems = async () => {
    try {
      const params = { company_id: companyId }
      if (itemCategoryFilter) {
        params.category = itemCategoryFilter
      }
      const response = await itemsAPI.getAll(params)
      if (response.data.success) {
        setItems(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await tasksAPI.getAll(params)
      if (response.data.success) {
        setTasks(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const handleAddItemFromModal = async (selectedItems) => {
    try {
      const currentItems = order.items || []
      const newItems = selectedItems.map(item => ({
        item_id: item.id,
        item_name: item.title,
        description: item.description || '',
        quantity: 1,
        unit: item.unit_type || 'PC',
        unit_price: parseFloat(item.rate || 0),
        amount: parseFloat(item.rate || 0)
      }))
      
      const updatedItems = [...currentItems, ...newItems]
      const totalAmount = updatedItems.reduce((sum, item) => sum + (parseFloat(item.amount || 0)), 0)
      
      const response = await ordersAPI.update(id, {
        items: updatedItems,
        amount: totalAmount
      }, { company_id: companyId })
      
      if (response.data.success) {
        setIsAddItemModalOpen(false)
        await fetchOrder()
      } else {
        alert(response.data.error || 'Failed to add item')
      }
    } catch (error) {
      console.error('Error adding item:', error)
      alert(error.response?.data?.error || 'Failed to add item')
    }
  }

  const handleRemoveItem = async (itemIndex) => {
    if (!window.confirm('Are you sure you want to remove this item?')) {
      return
    }
    
    try {
      const currentItems = order.items || []
      const updatedItems = currentItems.filter((_, index) => index !== itemIndex)
      const totalAmount = updatedItems.reduce((sum, item) => sum + (parseFloat(item.amount || 0)), 0)
      
      const response = await ordersAPI.update(id, {
        items: updatedItems,
        amount: totalAmount
      }, { company_id: companyId })
      
      if (response.data.success) {
        await fetchOrder()
      } else {
        alert(response.data.error || 'Failed to remove item')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      alert(error.response?.data?.error || 'Failed to remove item')
    }
  }

  const handleCreateInvoice = async () => {
    try {
      if (!order) return
      
      const invoiceData = {
        company_id: companyId,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: 'USD',
        items: (order.items || []).map(item => ({
          item_name: item.item_name,
          description: item.description || '',
          quantity: parseFloat(item.quantity || 1),
          unit_price: parseFloat(item.unit_price || 0),
          amount: parseFloat(item.amount || 0)
        })),
        sub_total: order.amount,
        total: order.amount,
        status: 'Unpaid'
      }
      
      const response = await invoicesAPI.create(invoiceData)
      if (response.data.success) {
        // Link invoice to order
        await ordersAPI.update(id, {
          invoice_id: response.data.data.id
        }, { company_id: companyId })
        
        alert('Invoice created successfully!')
        setIsCreateInvoiceModalOpen(false)
        await fetchOrder()
      } else {
        alert(response.data.error || 'Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert(error.response?.data?.error || 'Failed to create invoice')
    }
  }

  const handleSaveTask = async () => {
    try {
      const taskData = {
        company_id: companyId,
        title: taskFormData.title,
        description: taskFormData.description,
        due_date: taskFormData.due_date,
        priority: taskFormData.priority,
        status: 'Not Started',
        created_by: userId
      }
      
      const response = await tasksAPI.create(taskData)
      if (response.data.success) {
        alert('Task created successfully!')
        setIsAddTaskModalOpen(false)
        setTaskFormData({ title: '', description: '', due_date: '', priority: 'Medium' })
        await fetchTasks()
      } else {
        alert(response.data.error || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      alert(error.response?.data?.error || 'Failed to create task')
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!order) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .client-info, .company-info { width: 45%; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .totals { text-align: right; margin-top: 20px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ORDER #${order.id}</h1>
          <p>Date: ${formatDate(order.order_date)}</p>
          <p>Status: ${order.status}</p>
        </div>
        <div class="order-info">
          <div class="company-info">
            <h3>${company?.name || 'Company Name'}</h3>
            ${company?.address ? `<p>${company.address}</p>` : ''}
            ${company?.phone ? `<p>Phone: ${company.phone}</p>` : ''}
            ${company?.email ? `<p>Email: ${company.email}</p>` : ''}
          </div>
          <div class="client-info">
            <h3>{t('auto.auto_c5c8ac6b') || 'Order Details'}</h3>
            <p>Order ID: #${order.id}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>{t('auto.auto_7d74f3b9') || 'Item'}</th>
              <th>{t('auto.auto_694e8d1f') || 'Quantity'}</th>
              <th>{t('auto.auto_dcb66ff6') || 'Rate'}</th>
              <th>{t('auto.auto_96b01412') || 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            ${order.items && order.items.length > 0 ? order.items.map(item => `
              <tr>
                <td>${item.item_name || 'Item'}</td>
                <td>${item.quantity} ${item.unit || 'PC'}</td>
                <td>${formatCurrency(item.unit_price || 0)}</td>
                <td>${formatCurrency(item.amount || 0)}</td>
              </tr>
            `).join('') : '<tr><td colspan="4"></td></tr>'}
          </tbody>
        </table>
        <div class="totals">
          <p>Sub Total: ${formatCurrency(subTotal)}</p>
          <p>Discount: ${formatCurrency(0)}</p>
          <p><strong>Total: ${formatCurrency(total)}</strong></p>
        </div>
        ${order.description ? `<div class="footer"><p>${order.description}</p></div>` : ''}
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

  const handleViewPdf = async () => {
    try {
      // Use relative URL to leverage Vite proxy
      const pdfUrl = `/api/v1/orders/${id}/pdf?company_id=${companyId}`
      window.open(pdfUrl, '_blank')
    } catch (error) {
      console.error('Error viewing PDF:', error)
      alert('Failed to view PDF')
    }
  }

  const handleDownloadPdf = async () => {
    try {
      // Use relative URL to leverage Vite proxy
      const pdfUrl = `/api/v1/orders/${id}/pdf?company_id=${companyId}&download=1`
      const response = await fetch(pdfUrl)
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `order-${order.id}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF')
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      'Neu': 'warning',
      'Pending': 'warning',
      'Processing': 'info',
      'Completed': 'success',
      'Confirmed': 'success',
      'Cancelled': 'danger',
      'Shipped': 'info',
      'Delivered': 'success'
    }
    return <Badge variant={variants[status] || 'default'}>{status || 'Neu'}</Badge>
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

  // Filter items for modal
  const filteredItems = items.filter(item => {
    const matchesSearch = !itemSearchQuery || 
      item.title?.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(itemSearchQuery.toLowerCase())
    const matchesCategory = !itemCategoryFilter || item.category === itemCategoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(items.map(item => item.category).filter(Boolean))]

  // Calculate totals
  const subTotal = order?.items?.reduce((sum, item) => sum + (parseFloat(item.amount || 0)), 0) || 0
  const discount = 0
  const total = subTotal - discount

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-secondary-text">{t('auto.auto_ded71747') || 'Loading order details...'}</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-secondary-text">{t('') || ''}</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Orders List */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/app/admin/orders')}
              className="flex items-center gap-2 text-primary-text hover:text-primary-accent"
            >
              <IoArrowBack size={20} />
              <span className="font-semibold">{t('auto.auto_7442e29d') || 'Orders'}</span>
            </button>
            <button onClick={() => setIsSidebarOpen(false)}>
              <IoEllipsisVertical size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="All">{t('') || ''}</option>
              <option value="Neu">{t('') || ''}</option>
              <option value="Processing">{t('') || ''}</option>
              <option value="Completed">{t('') || ''}</option>
            </select>
            <Button size="sm" onClick={() => navigate('/app/admin/orders')}>
              <IoAdd size={18} />
            </Button>
          </div>
          
          <div className="relative mb-4">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder={t('auto.auto_b98920c3') || "Search orders..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {orders.map((o) => (
            <div
              key={o.id}
              onClick={() => navigate(`/app/admin/orders/${o.id}`)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                o.id === parseInt(id) ? 'bg-blue-50 border-l-4 border-l-primary-accent' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-primary-text">ORDER #{o.id}</span>
                {getStatusBadge(o.status)}
              </div>
              <p className="text-sm text-secondary-text">Order #${o.id}</p>
              <p className="text-sm font-medium text-primary-text">{formatCurrency(o.amount)}</p>
              <p className="text-xs text-secondary-text">{formatDate(o.order_date)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <IoEllipsisVertical size={20} />
                </button>
              )}
              {!isRightSidebarOpen && (
                <button
                  onClick={() => setIsRightSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <IoEllipsisVertical size={20} />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-primary-text">ORDER #{order.id}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(order.status)}
                  <span className="text-sm text-secondary-text">{formatDate(order.order_date)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <IoPrint size={18} />
                Print
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Card className="p-6">
            {/* Company and Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              {/* Company Info */}
              <div>
                <div className="mb-4">
                  <div className="w-16 h-16 bg-primary-accent/10 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold text-primary-accent">
                      {company?.name?.substring(0, 2).toUpperCase() || 'CO'}
                    </span>
                  </div>
                      <h3 className="font-semibold text-primary-text">{company?.name || t('common.name')}</h3>
                      {company?.address && (
                        <p className="text-sm text-secondary-text mt-1 flex items-start gap-1">
                          <IoLocation size={14} className="mt-0.5 flex-shrink-0" />
                          {company.address}
                        </p>
                      )}
                      {company?.phone && (
                        <p className="text-sm text-secondary-text mt-1 flex items-center gap-1">
                          <IoCall size={14} />
                          {company.phone}
                        </p>
                      )}
                      {company?.email && (
                        <p className="text-sm text-secondary-text mt-1 flex items-center gap-1">
                          <IoMail size={14} />
                          {company.email}
                        </p>
                      )}
                      {company?.website && (
                        <p className="text-sm text-secondary-text mt-1 flex items-center gap-1">
                          <IoGlobe size={14} />
                          {company.website}
                        </p>
                      )}
                    </div>
              </div>

              <div>
                <h3 className="font-semibold text-primary-text mb-2">{t('auto.auto_4a998251') || 'Order Info'}</h3>
                <p className="text-secondary-text">Order #${order.id}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary-text">{t('') || ''}</h3>
                <Button size="sm" onClick={() => setIsAddItemModalOpen(true)}>
                  <IoAdd size={16} />
                  Add item
                </Button>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-secondary-text">{t('') || ''}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-secondary-text">{t('') || ''}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-secondary-text">{t('') || ''}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-secondary-text">{t('') || ''}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-secondary-text">{t('') || ''}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-primary-text">{item.item_name || 'Item'}</p>
                            {item.description && (
                              <p className="text-sm text-secondary-text">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-primary-text">{item.quantity} {item.unit || 'PC'}</td>
                        <td className="px-4 py-3 text-primary-text">{formatCurrency(item.unit_price || 0)}</td>
                        <td className="px-4 py-3 text-primary-text font-medium">{formatCurrency(item.amount || 0)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <IoTrash size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-secondary-text">
                        No items added
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-secondary-text">{t('') || ''}</span>
                  <span className="text-primary-text font-medium">{formatCurrency(subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-text">{t('') || ''}</span>
                  <span className="text-primary-text font-medium">{formatCurrency(discount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-primary-text font-semibold">{t('') || ''}</span>
                  <span className="text-primary-text font-bold text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className={`${isRightSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-l border-gray-200 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-primary-text">{t('projects.activity.actions') || 'Actions'}</h3>
            <button onClick={() => setIsRightSidebarOpen(false)}>
              <IoClose size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <Button className="w-full" onClick={() => setIsCreateInvoiceModalOpen(true)}>
            <IoReceipt size={18} />
            Create Invoice
          </Button>

          <div>
            <h4 className="font-medium text-primary-text mb-2 flex items-center gap-2">
              <IoCart size={18} />
              Order info
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-secondary-text">
                <IoBriefcase size={16} />
                <span>Order #${order.id}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-primary-text mb-2">{t('') || ''}</h4>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={handleViewPdf}>
                <IoEye size={16} />
                View PDF
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={handleDownloadPdf}>
                <IoDownload size={16} />
                Download PDF
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-primary-text mb-2 flex items-center gap-2">
              <IoReceipt size={18} />
              Invoices
            </h4>
            {order.invoice_id || order.invoice_number ? (
              <button
                onClick={() => navigate(`/app/admin/invoices/${order.invoice_id}`)}
                className="text-sm text-primary-accent hover:underline"
              >
                Invoice #{order.invoice_number || order.invoice_id}
              </button>
            ) : (
              <p className="text-sm text-secondary-text">{t('') || ''}</p>
            )}
          </div>

          <div>
            <h4 className="font-medium text-primary-text mb-2 flex items-center gap-2">
              <IoList size={18} />
              {t('sidebar.tasks')}
            </h4>
            <Button size="sm" variant="outline" className="w-full mb-2" onClick={() => setIsAddTaskModalOpen(true)}>
              <IoAdd size={16} />
              {t('tasks.add_task')}
            </Button>
            <div className="space-y-2">
              {tasks.slice(0, 5).map(task => (
                <div key={task.id} className="text-sm text-secondary-text flex items-center gap-2">
                  <IoCheckmarkCircle size={16} />
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title={t('common.add_items')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={t('items.search_placeholder')}
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              className="flex-1"
            />
            <select
              value={itemCategoryFilter}
              onChange={(e) => setItemCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t('items.all_categories')}</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <p className="text-center text-secondary-text py-8">{t('items.no_items_found')}</p>
            ) : (
              <div className="space-y-2">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleAddItemFromModal([item])}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-secondary-text">{item.description}</p>
                        <p className="text-sm font-medium text-primary-accent mt-1">
                          {formatCurrency(item.rate)} / {item.unit_type}
                        </p>
                      </div>
                      <IoAdd size={20} className="text-primary-accent" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={() => setIsAddItemModalOpen(false)} className="flex-1">
              {t('common.close')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Task Modal - Using unified TaskFormModal */}
      <TaskFormModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSave={async () => {
          await fetchTasks()
        }}
        relatedToType="client"
        relatedToId={order?.client_id}
        companyId={companyId}
      />

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isCreateInvoiceModalOpen}
        onClose={() => setIsCreateInvoiceModalOpen(false)}
        title={t('common.create_invoice')}
      >
        <div className="space-y-4">
          <p className="text-secondary-text">{t('orders.create_invoice_confirm')}</p>
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleCreateInvoice} className="flex-1">
              {t('common.create_invoice')}
            </Button>
            <Button variant="outline" onClick={() => setIsCreateInvoiceModalOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default OrderDetail

