import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { ordersAPI, invoicesAPI, itemsAPI } from '../../../api'
import Modal from '../../../components/ui/Modal'
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
  IoCart,
  IoStorefront,
  IoCheckmark,
  IoRefresh
} from 'react-icons/io5'

const Orders = () => {
  const navigate = useNavigate()
  const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
  
  const [viewMode, setViewMode] = useState('list')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [amountMinFilter, setAmountMinFilter] = useState('')
  const [amountMaxFilter, setAmountMaxFilter] = useState('')
  const [quickFilter, setQuickFilter] = useState('All') // All, New
  const [sortColumn, setSortColumn] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('DESC')
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [items, setItems] = useState([])
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [itemCategoryFilter, setItemCategoryFilter] = useState('')

  const [formData, setFormData] = useState({
    company_id: companyId,
    invoice_id: '',
    title: '',
    description: '',
    amount: 0,
    status: 'Neu',
    items: [],
  })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch functions
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = { company_id: companyId }
      
      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery
      }
      
      if (statusFilter && statusFilter !== 'All') {
        params.status = statusFilter
      }

      const response = await ordersAPI.getAll(params)
      
      if (response && response.data && response.data.success) {
        const ordersData = (response.data.data || []).map(order => ({
          id: order.id,
          company_id: order.company_id,
          invoice_id: order.invoice_id,
          invoice_number: order.invoice_number || null,
          title: order.title || `Bestellung #${order.id}`,
          description: order.description || '',
          amount: parseFloat(order.amount) || 0,
          status: order.status || 'Neu',
          order_date: order.order_date || order.created_at || '',
          created_at: order.created_at || '',
          items: order.items || [],
        }))
        setOrders(ordersData)
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [companyId, debouncedSearchQuery, statusFilter])



  const fetchInvoices = useCallback(async () => {
    try {
      const response = await invoicesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setInvoices(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }, [companyId])

  const fetchItems = useCallback(async () => {
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
  }, [companyId, itemCategoryFilter])

  useEffect(() => {
    fetchOrders()
    fetchInvoices()
    fetchItems()
  }, [fetchOrders, fetchInvoices, fetchItems])

  // Filter orders based on quick filter
  useEffect(() => {
    if (quickFilter === 'Neu') {
      setStatusFilter('Neu')
    } else if (quickFilter === 'All') {
      setStatusFilter('All')
    }
  }, [quickFilter])

  const handleAdd = () => {
    setFormData({
      company_id: companyId,
      client_id: 0,
      invoice_id: '',
      title: '',
      description: '',
      amount: 0,
      status: 'Neu',
      items: [],
    })
    setIsAddModalOpen(true)
  }

  const handleEdit = async (order) => {
    try {
      const response = await ordersAPI.getById(order.id, { company_id: companyId })
      if (response.data.success) {
        const data = response.data.data
        setFormData({
          company_id: data.company_id || companyId,
          client_id: '0',
          invoice_id: data.invoice_id?.toString() || '',
          title: data.title || '',
          description: data.description || '',
          amount: parseFloat(data.amount) || 0,
          status: data.status || 'Neu',
          items: data.items || [],
        })
        setIsEditModalOpen(true)
        setSelectedOrder(order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      alert('Bestellungsdetails konnten nicht geladen werden')
    }
  }

  const handleView = (order) => {
    navigate(`/app/admin/orders/${order.id}`)
  }

  const handleDelete = async (order) => {
    if (window.confirm(`Möchten Sie die Bestellung #${order.id} wirklich löschen?`)) {
      try {
        const response = await ordersAPI.delete(order.id, { company_id: companyId })
        if (response.data.success) {
          alert('Bestellung erfolgreich gelöscht!')
          await fetchOrders()
        } else {
          alert(response.data.error || 'Bestellung konnte nicht gelöscht werden')
        }
      } catch (error) {
        console.error('Error deleting order:', error)
        alert(error.response?.data?.error || 'Bestellung konnte nicht gelöscht werden')
      }
    }
  }

  const handleDuplicate = async (order) => {
    try {
      const orderData = {
        company_id: companyId,
        client_id: 0,
        invoice_id: order.invoice_id,
        title: `${order.title} (Kopie)`,
        description: order.description,
        amount: order.amount,
        status: 'Neu',
        items: order.items || [],
      }
      const response = await ordersAPI.create(orderData)
      if (response.data.success) {
        alert('Bestellung erfolgreich dupliziert!')
        await fetchOrders()
      } else {
        alert(response.data.error || 'Bestellung konnte nicht dupliziert werden')
      }
    } catch (error) {
      console.error('Error duplicating order:', error)
      alert(error.response?.data?.error || 'Bestellung konnte nicht dupliziert werden')
    }
  }

  const handleStatusChange = async (order, newStatus) => {
    try {
      const response = await ordersAPI.updateStatus(order.id, newStatus, { company_id: companyId })
      if (response.data.success) {
        alert(`Bestellstatus auf ${newStatus} aktualisiert!`)
        await fetchOrders()
      } else {
        alert(response.data.error || 'Bestellstatus konnte nicht aktualisiert werden')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert(error.response?.data?.error || 'Bestellstatus konnte nicht aktualisiert werden')
    }
  }

  const handleSave = async () => {
    try {
      // Calculate total from items if amount not provided
      let finalAmount = parseFloat(formData.amount) || 0
      if (formData.items && formData.items.length > 0) {
        finalAmount = formData.items.reduce((sum, item) => {
          return sum + (parseFloat(item.amount || 0))
        }, 0)
      }

      const orderData = {
        company_id: companyId,
        client_id: 0,
        invoice_id: formData.invoice_id || null,
        title: formData.title || `Bestellung - ${new Date().toLocaleDateString()}`,
        description: formData.description || '',
        amount: finalAmount,
        status: formData.status || 'Neu',
        items: formData.items || [],
      }

      let response
      if (isEditModalOpen && selectedOrder) {
        response = await ordersAPI.update(selectedOrder.id, orderData, { company_id: companyId })
      } else {
        response = await ordersAPI.create(orderData)
      }

      if (response.data.success) {
        alert(isEditModalOpen ? 'Bestellung erfolgreich aktualisiert!' : 'Bestellung erfolgreich erstellt!')
        setIsAddModalOpen(false)
        setIsEditModalOpen(false)
        setFormData({
          company_id: companyId,
          client_id: '',
          invoice_id: '',
          title: '',
          description: '',
          amount: 0,
          status: 'Neu',
          items: [],
        })
        await fetchOrders()
      } else {
        alert(response.data.error || 'Bestellung konnte nicht gespeichert werden')
      }
    } catch (error) {
      console.error('Error saving order:', error)
      alert(error.response?.data?.error || 'Bestellung konnte nicht gespeichert werden')
    }
  }

  const handleAddItemFromModal = (selectedItems) => {
    const newItems = selectedItems.map(item => ({
      item_id: item.id,
      item_name: item.title,
      description: item.description || '',
      quantity: 1,
      unit: item.unit_type || 'PC',
      unit_price: parseFloat(item.rate || 0),
      amount: parseFloat(item.rate || 0),
    }))
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, ...newItems]
    }))
    setIsAddItemModalOpen(false)
  }

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = {
        ...newItems[index],
        [field]: value
      }
      // Recalculate amount
      if (field === 'quantity' || field === 'unit_price') {
        const quantity = parseFloat(field === 'quantity' ? value : newItems[index].quantity) || 1
        const unitPrice = parseFloat(field === 'unit_price' ? value : newItems[index].unit_price) || 0
        newItems[index].amount = quantity * unitPrice
      }
      return {
        ...prev,
        items: newItems
      }
    })
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.amount || 0)), 0)
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

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortColumn(column)
      setSortDirection('ASC')
    }
  }

  const handleDownloadExcel = () => {
    try {
      // Create CSV content
      const headers = ['Bestell-ID', 'Titel', 'Rechnung', 'Bestelldatum', 'Betrag', 'Status']
      const rows = filteredOrders.map(order => [
        order.id,
        order.title || `Bestellung #${order.id}`,
        order.invoice_number || '-',
        formatDate(order.order_date),
        order.amount || 0,
        order.status || 'Neu'
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
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading Excel:', error)
      alert('Bestellungen konnten nicht heruntergeladen werden')
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Bitte erlauben Sie Popups zum Drucken')
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bestellbericht</title>
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
        <h1>Bestellbericht</h1>
        <p>Erstellt am: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Bestell-ID</th>
              <th>Titel</th>
              <th>Kunde</th>
              <th>Rechnung</th>
              <th>Bestelldatum</th>
              <th class="text-right">Betrag</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.map(order => `
              <tr>
                <td>ORDER #${order.id}</td>
                <td>${(order.title || `Bestellung #${order.id}`).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                <td>${order.invoice_number ? `INV #${order.invoice_number}` : '-'}</td>
                <td>${formatDate(order.order_date)}</td>
                <td class="text-right">${formatCurrency(order.amount)}</td>
                <td>${(order.status || 'Neu').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align: right; font-weight: bold;">Gesamt:</td>
              <td class="text-right" style="font-weight: bold;">${formatCurrency(filteredOrders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0))}</td>
              <td></td>
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

  // Filter orders client-side for additional filters and search
  const filteredOrders = orders.filter(order => {
    // Search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      const matchesSearch = 
        order.id?.toString().includes(query) ||
        order.title?.toLowerCase().includes(query) ||
        order.invoice_number?.toString().includes(query) ||
        order.description?.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }
    
    // Date filters
    if (startDateFilter && order.order_date) {
      const orderDate = new Date(order.order_date)
      const startDate = new Date(startDateFilter)
      if (orderDate < startDate) return false
    }
    if (endDateFilter && order.order_date) {
      const orderDate = new Date(order.order_date)
      const endDate = new Date(endDateFilter)
      endDate.setHours(23, 59, 59, 999)
      if (orderDate > endDate) return false
    }
    
    // Amount filters
    if (amountMinFilter) {
      const minAmount = parseFloat(amountMinFilter)
      if (order.amount < minAmount) return false
    }
    if (amountMaxFilter) {
      const maxAmount = parseFloat(amountMaxFilter)
      if (order.amount > maxAmount) return false
    }
    
    return true
  })

  const columns = [
    { 
      key: 'id', 
      label: 'Bestellung',
      render: (value, row) => (
        <span className="text-primary-accent font-medium cursor-pointer hover:underline" onClick={() => handleView(row)}>
          ORDER #{row.id}
        </span>
      )
    },
    { 
      key: 'invoice_number', 
      label: 'Rechnungen',
      render: (value) => value ? (
        <span className="text-primary-accent">INV #{value}</span>
      ) : '-'
    },
    { 
      key: 'order_date', 
      label: 'Bestelldatum',
      render: (value) => formatDate(value)
    },
    { 
      key: 'amount', 
      label: 'Betrag',
      render: (value) => formatCurrency(value)
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => getStatusBadge(value)
    },
  ]

  const actions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDuplicate(row)
        }}
        className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
        title="Duplizieren"
      >
        <IoCopy size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleEdit(row)
        }}
        className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
        title="Bearbeiten"
      >
        <IoCreate size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDelete(row)
        }}
        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
        title="Löschen"
      >
        <IoTrash size={18} />
      </button>
    </div>
  )

  // Get unique categories for items
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))]

  // Filter items for modal
  const filteredItems = items.filter(item => {
    const matchesSearch = !itemSearchQuery || 
      item.title?.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(itemSearchQuery.toLowerCase())
    const matchesCategory = !itemCategoryFilter || item.category === itemCategoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Bestellungen</h1>
          <p className="text-secondary-text mt-1">Alle Bestellungen verwalten</p>
        </div>
        <Button 
          onClick={handleAdd}
          className="flex items-center gap-2"
        >
          <IoAdd size={20} />
          Bestellung hinzufügen
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title={viewMode === 'list' ? 'Rasteransicht' : 'Listenansicht'}
          >
            {viewMode === 'list' ? <IoGrid size={20} /> : <IoList size={20} />}
          </button>
          
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <IoFilter size={18} />
            Filter
            {isFiltersOpen ? <IoChevronUp size={16} /> : <IoChevronDown size={16} />}
          </button>

          <div className="flex items-center gap-2 border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setQuickFilter('All')}
              className={`px-4 py-2 transition-colors ${
                quickFilter === 'All' ? 'bg-primary-accent text-white' : 'hover:bg-gray-50'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setQuickFilter('Neu')}
              className={`px-4 py-2 transition-colors ${
                quickFilter === 'Neu' ? 'bg-primary-accent text-white' : 'hover:bg-gray-50'
              }`}
            >
              Neu
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownloadExcel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Excel herunterladen"
          >
            <IoDownload size={18} />
          </button>
          <button 
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Drucken"
          >
            <IoPrint size={18} />
          </button>
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {isFiltersOpen && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <div>
              <label className="block text-sm font-medium text-primary-text mb-1">Startdatum</label>
              <Input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-1">Enddatum</label>
              <Input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-1">Betragsbereich</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={amountMinFilter}
                  onChange={(e) => setAmountMinFilter(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={amountMaxFilter}
                  onChange={(e) => setAmountMaxFilter(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary-text">Bestellungen werden geladen...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <IoCart size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-primary-text mb-2">Keine Bestellungen gefunden</h3>
          <p className="text-secondary-text mb-4">Erstellen Sie Ihre erste Bestellung.</p>
          <Button onClick={handleAdd} className="inline-flex items-center gap-2">
            <IoAdd size={20} />
            Bestellung erstellen
          </Button>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={filteredOrders}
          searchPlaceholder="Search orders..."
          filters={false}
          actions={actions}
          bulkActions={false}
          emptyMessage="Keine Bestellungen gefunden"
        />
      )}

      {/* Add/Edit Order Modal */}
      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setSelectedOrder(null)
        }}
        title={isEditModalOpen ? 'Bestellung bearbeiten' : 'Bestellung hinzufügen'}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-1">Kunde *</label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
            >
              <option value="">Kunde auswählen</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.company_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-1">Rechnung (Optional)</label>
            <select
              value={formData.invoice_id}
              onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
            >
              <option value="">Rechnung auswählen</option>
              {invoices.map(invoice => (
                <option key={invoice.id} value={invoice.id}>{invoice.invoice_number || `Rechnung #${invoice.id}`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-1">Titel *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Bestelltitel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-1">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              rows={3}
              placeholder="Bestellbeschreibung"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
            >
              <option value="Neu">Neu</option>
              <option value="Pending">Ausstehend</option>
              <option value="Processing">In Bearbeitung</option>
              <option value="Completed">Abgeschlossen</option>
              <option value="Confirmed">Bestätigt</option>
              <option value="Shipped">Versendet</option>
              <option value="Delivered">Geliefert</option>
              <option value="Cancelled">Storniert</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-primary-text">Artikel</label>
              <Button
                onClick={() => setIsAddItemModalOpen(true)}
                className="flex items-center gap-2"
                size="sm"
              >
                <IoAdd size={16} />
                Artikel hinzufügen
              </Button>
            </div>
            {formData.items.length === 0 ? (
              <p className="text-secondary-text text-sm">Keine Artikel hinzugefügt</p>
            ) : (
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.item_name || `Artikel ${index + 1}`}</span>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <IoTrash size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-secondary-text">Menge</label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-secondary-text">Einzelpreis</label>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-sm font-medium">Betrag: {formatCurrency(item.amount || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-primary-text">Gesamtbetrag:</span>
              <span className="text-lg font-bold text-primary-text">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              className="flex-1"
            >
              {isEditModalOpen ? 'Bestellung aktualisieren' : 'Bestellung erstellen'}
            </Button>
            <Button
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                setSelectedOrder(null)
              }}
              variant="outline"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Artikel hinzufügen"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search items..."
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              className="flex-1"
            />
            <select
              value={itemCategoryFilter}
              onChange={(e) => setItemCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Alle Kategorien</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <p className="text-center text-secondary-text py-8">Keine Artikel gefunden</p>
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
            <Button
              onClick={() => setIsAddItemModalOpen(false)}
              className="flex-1"
            >
              Fertig
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Order Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedOrder(null)
        }}
        title={selectedOrder ? `Bestellung #${selectedOrder.id}` : 'Bestellungsdetails'}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-text">Kunde</label>
                <p className="text-primary-text">{selectedOrder.client_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">Status</label>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">Bestelldatum</label>
                <p className="text-primary-text">{formatDate(selectedOrder.order_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">Betrag</label>
                <p className="text-primary-text font-bold">{formatCurrency(selectedOrder.amount)}</p>
              </div>
            </div>
            {selectedOrder.description && (
              <div>
                <label className="text-sm font-medium text-secondary-text">Beschreibung</label>
                <p className="text-primary-text">{selectedOrder.description}</p>
              </div>
            )}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div>
                <label className="text-sm font-medium text-secondary-text mb-2 block">Artikel</label>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.item_name}</span>
                        <span>{formatCurrency(item.amount)}</span>
                      </div>
                      <p className="text-sm text-secondary-text">Menge: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => {
                  handleEdit(selectedOrder)
                  setIsViewModalOpen(false)
                }}
                className="flex-1"
              >
                Bestellung bearbeiten
              </Button>
              <Button
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedOrder(null)
                }}
                variant="outline"
              >
                Schließen
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Orders

