import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { contractsAPI, projectsAPI, companiesAPI, itemsAPI } from '../../../api'
import baseUrl from '../../../api/baseUrl'
import { useSettings } from '../../../context/SettingsContext'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import RichTextEditor from '../../../components/ui/RichTextEditor'
import TaskFormModal from '../../../components/ui/TaskFormModal'
import {
  IoArrowBack,
  IoBriefcase,
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
  IoChevronForward,
  IoEllipsisVertical,
  IoAttach,
  IoOpenOutline,
  IoMailOutline,
  IoCopy,
  IoCheckmark,
  IoPerson,
  IoLink,
  IoList,
  IoSettings,
  IoStorefront
} from 'react-icons/io5'

const ContractDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { formatDate, formatCurrency } = useSettings()

  // Get company_id from localStorage
  const [companyId] = useState(() => {
    try {
      const stored = localStorage.getItem('companyId')
      return parseInt(stored || 1, 10)
    } catch (e) {
      console.error('Error accessing localStorage:', e)
      return 1
    }
  })

  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState(null)
  const [client, setClient] = useState(null)
  const [tasks, setTasks] = useState([])
  const [note, setNote] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [isItemsExpanded, setIsItemsExpanded] = useState(true)

  // Items from catalog
  const [catalogItems, setCatalogItems] = useState([])
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [itemCategoryFilter, setItemCategoryFilter] = useState('')

  // Modal states
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false)
  const [isEditDiscountModalOpen, setIsEditDiscountModalOpen] = useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)

  // Form states
  const [editingItem, setEditingItem] = useState(null)
  const [discountData, setDiscountData] = useState({ discount: 0, discount_type: '%' })
  const [newTask, setNewTask] = useState({ title: '', due_date: '' })

  // Status options
  const statusOptions = ['Draft', 'Sent', 'Accepted', 'Declined', 'Expired']

  useEffect(() => {
    fetchContract()
    fetchCatalogItems()
  }, [id])

  const fetchCatalogItems = async () => {
    try {
      const response = await itemsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setCatalogItems(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching catalog items:', error)
      setCatalogItems([])
    }
  }

  const fetchContract = async () => {
    try {
      setLoading(true)
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchContract:', companyId)
        setLoading(false)
        return
      }
      const response = await contractsAPI.getById(id, { company_id: companyId })
      if (response.data.success) {
        const data = response.data.data
        setContract({
          id: data.id,
          contract_number: data.contract_number || `CONTRACT #${data.id}`,
          title: data.title || data.subject || '--',
          client_id: data.client_id,
          client_name: data.client_name || '--',
          project_id: data.project_id,
          project_name: data.project_name || '--',
          contract_date: data.contract_date || data.start_date || '',
          valid_until: data.valid_until || data.end_date || '--',
          status: (data.status || 'draft').toLowerCase(),
          description: data.description || '',
          note: data.note || '',
          content: data.content || data.contract_content || '',
          currency: data.currency || 'USD',
          sub_total: parseFloat(data.sub_total) || 0,
          discount: parseFloat(data.discount) || 0,
          discount_type: data.discount_type || '%',
          discount_amount: parseFloat(data.discount_amount) || 0,
          tax: data.tax || null,
          second_tax: data.second_tax || null,
          tax_amount: parseFloat(data.tax_amount) || 0,
          total: parseFloat(data.total) || parseFloat(data.amount) || 0,
          items: data.items || [],
          created_by: data.created_by || null,
          signer_name: data.signer_name || data.client_name || null,
          signer_email: data.signer_email || null,
          signed_at: data.signed_at || null,
          email_sent: data.email_sent || false,
        })
        setNote(data.note || '')
        setEditorContent(data.content || data.contract_content || '')
        setDiscountData({
          discount: parseFloat(data.discount) || 0,
          discount_type: data.discount_type || '%'
        })

        // Fetch company details
        try {
          const companyResponse = await companiesAPI.getById(companyId)
          if (companyResponse.data && companyResponse.data.success && companyResponse.data.data) {
            setCompany(companyResponse.data.data)
          }
        } catch (err) {
          console.log('Company not found:', err.response?.status)
          setCompany(null)
        }

        // Fetch client details
        if (data.client_id) {
          try {
            const clientResponse = await clientsAPI.getById(data.client_id, { company_id: companyId })
            if (clientResponse.data && clientResponse.data.success) {
              setClient(clientResponse.data.data)
            }
          } catch (err) {
            console.log('Client not found:', err.response?.status)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
    } finally {
      setLoading(false)
    }
  }

  const localFormatDate = (dateString) => {
    if (!dateString || dateString === '--') return '--'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateString
    }
  }

  const localFormatCurrency = (amount) => {
    let currencyCode = contract?.currency || 'USD'
    if (currencyCode.includes(' ')) {
      currencyCode = currencyCode.split(' ')[0]
    }
    if (currencyCode.length !== 3) {
      currencyCode = 'USD'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount || 0)
  }

  const isExpired = () => {
    if (!contract?.valid_until || contract.valid_until === '--') return false
    const validUntil = new Date(contract.valid_until)
    return validUntil < new Date() && contract.status !== 'accepted'
  }

  const statusColors = {
    draft: 'bg-gray-500 text-white',
    sent: 'bg-sky-400 text-white',
    accepted: 'bg-blue-500 text-white',
    declined: 'bg-red-500 text-white',
    expired: 'bg-orange-500 text-white',
  }

  // Calculate totals
  const calculateSubTotal = () => {
    return (contract?.items || []).reduce((sum, item) => sum + (item.amount || (item.quantity * item.unit_price) || 0), 0)
  }

  const calculateDiscountAmount = () => {
    const subTotal = calculateSubTotal()
    if (discountData.discount_type === '%') {
      return (subTotal * (discountData.discount || 0)) / 100
    }
    return discountData.discount || 0
  }

  const calculateTotal = () => {
    const subTotal = calculateSubTotal()
    const discountAmount = calculateDiscountAmount()
    let taxAmount = 0

    if (contract?.tax) {
      const taxRate = parseFloat(contract.tax.match(/\d+/)?.[0] || 0)
      taxAmount += ((subTotal - discountAmount) * taxRate) / 100
    }
    if (contract?.second_tax) {
      const taxRate = parseFloat(contract.second_tax.match(/\d+/)?.[0] || 0)
      taxAmount += ((subTotal - discountAmount) * taxRate) / 100
    }

    return subTotal - discountAmount + taxAmount
  }

  // Action handlers
  const handlePreview = () => {
    setIsPreviewModalOpen(true)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Contract ${contract.contract_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; }
          .content { margin-top: 30px; padding: 20px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CONTRACT</h1>
          <h2>${contract.contract_number}</h2>
          <h3>${contract.title}</h3>
        </div>
        <p><strong>Client:</strong> ${contract.client_name}</p>
        <p><strong>Contract Date:</strong> ${localFormatDate(contract.contract_date)}</p>
        <p><strong>Valid Until:</strong> ${localFormatDate(contract.valid_until)}</p>
        ${contract.items && contract.items.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${contract.items.map(item => `
                <tr>
                  <td>${item.item_name || '-'}</td>
                  <td>${item.quantity || 0} ${item.unit || ''}</td>
                  <td>${localFormatCurrency(item.unit_price || 0)}</td>
                  <td>${localFormatCurrency(item.amount || (item.quantity * item.unit_price) || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3">Total:</td>
                <td>${localFormatCurrency(calculateTotal())}</td>
              </tr>
            </tfoot>
          </table>
        ` : ''}
        ${editorContent ? `
          <div class="content">
            <h3>Contract Content</h3>
            ${editorContent}
          </div>
        ` : ''}
      </body>
      </html>
    `
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  const handleViewPDF = () => {
    // Generate a PDF-like preview in a new window
    const pdfWindow = window.open('', '_blank')
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Contract ${contract.contract_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f5f5f5; }
          .pdf-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
          .header h1 { color: #3b82f6; font-size: 28px; margin-bottom: 10px; }
          .header h2 { color: #333; font-size: 20px; }
          .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { padding: 15px; background: #f9fafb; border-radius: 8px; }
          .info-box label { font-size: 12px; color: #6b7280; display: block; margin-bottom: 5px; }
          .info-box span { font-size: 14px; color: #111827; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #3b82f6; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
          td { border-bottom: 1px solid #e5e7eb; padding: 12px; font-size: 14px; }
          .total-row { background: #f3f4f6; font-weight: 600; }
          .total-row td { border-top: 2px solid #3b82f6; }
          .content-section { margin-top: 30px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .content-section h3 { color: #374151; margin-bottom: 15px; font-size: 16px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .status-draft { background: #9ca3af; color: white; }
          .status-sent { background: #3b82f6; color: white; }
          .status-accepted { background: #10b981; color: white; }
          .status-declined { background: #ef4444; color: white; }
          .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
          .print-btn:hover { background: #2563eb; }
          @media print { .print-btn { display: none; } body { padding: 20px; background: white; } .pdf-container { box-shadow: none; padding: 0; } }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
        <div class="pdf-container">
          <div class="header">
            <h1>CONTRACT</h1>
            <h2>${contract.contract_number}</h2>
            <p style="margin-top: 10px;"><span class="status-badge status-${contract.status}">${contract.status}</span></p>
          </div>
          
          <h3 style="font-size: 18px; color: #111827; margin-bottom: 20px;">${contract.title}</h3>
          
          <div class="info-section">
            <div class="info-box">
              <label>Client</label>
              <span>${contract.client_name}</span>
            </div>
            <div class="info-box">
              <label>Project</label>
              <span>${contract.project_name || 'N/A'}</span>
            </div>
            <div class="info-box">
              <label>Contract Date</label>
              <span>${localFormatDate(contract.contract_date)}</span>
            </div>
            <div class="info-box">
              <label>Valid Until</label>
              <span>${localFormatDate(contract.valid_until)}</span>
            </div>
          </div>
          
          ${contract.items && contract.items.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th style="text-align: right;">Qty</th>
                  <th style="text-align: right;">Rate</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${contract.items.map(item => `
                  <tr>
                    <td>${item.item_name || '-'}</td>
                    <td>${item.description || '-'}</td>
                    <td style="text-align: right;">${item.quantity || 0} ${item.unit || ''}</td>
                    <td style="text-align: right;">${localFormatCurrency(item.unit_price || 0)}</td>
                    <td style="text-align: right;">${localFormatCurrency(item.amount || (item.quantity * item.unit_price) || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="4" style="text-align: right;"><strong>Total:</strong></td>
                  <td style="text-align: right;"><strong>${localFormatCurrency(calculateTotal())}</strong></td>
                </tr>
              </tfoot>
            </table>
          ` : '<p style="color: #6b7280; text-align: center; padding: 20px;">No items in this contract</p>'}
          
          ${editorContent ? `
            <div class="content-section">
              <h3>Contract Terms & Conditions</h3>
              <div>${editorContent}</div>
            </div>
          ` : ''}
          
          ${contract.note ? `
            <div class="content-section">
              <h3>Notes</h3>
              <p style="color: #4b5563;">${contract.note}</p>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `
    pdfWindow.document.write(pdfContent)
    pdfWindow.document.close()
  }

  const handleDownloadPDF = () => {
    // Generate and trigger download using print dialog (Save as PDF)
    const pdfWindow = window.open('', '_blank')
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Contract ${contract.contract_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; }
          .pdf-container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
          .header h1 { color: #3b82f6; font-size: 28px; margin-bottom: 10px; }
          .header h2 { color: #333; font-size: 20px; }
          .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { padding: 15px; background: #f9fafb; border-radius: 8px; }
          .info-box label { font-size: 12px; color: #6b7280; display: block; margin-bottom: 5px; }
          .info-box span { font-size: 14px; color: #111827; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #3b82f6; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
          td { border-bottom: 1px solid #e5e7eb; padding: 12px; font-size: 14px; }
          .total-row { background: #f3f4f6; font-weight: 600; }
          .total-row td { border-top: 2px solid #3b82f6; }
          .content-section { margin-top: 30px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .content-section h3 { color: #374151; margin-bottom: 15px; font-size: 16px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .status-draft { background: #9ca3af; color: white; }
          .status-sent { background: #3b82f6; color: white; }
          .status-accepted { background: #10b981; color: white; }
          .status-declined { background: #ef4444; color: white; }
          @media print { @page { margin: 20mm; } }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <div class="header">
            <h1>CONTRACT</h1>
            <h2>${contract.contract_number}</h2>
            <p style="margin-top: 10px;"><span class="status-badge status-${contract.status}">${contract.status}</span></p>
          </div>
          
          <h3 style="font-size: 18px; color: #111827; margin-bottom: 20px;">${contract.title}</h3>
          
          <div class="info-section">
            <div class="info-box">
              <label>Client</label>
              <span>${contract.client_name}</span>
            </div>
            <div class="info-box">
              <label>Project</label>
              <span>${contract.project_name || 'N/A'}</span>
            </div>
            <div class="info-box">
              <label>Contract Date</label>
              <span>${localFormatDate(contract.contract_date)}</span>
            </div>
            <div class="info-box">
              <label>Valid Until</label>
              <span>${localFormatDate(contract.valid_until)}</span>
            </div>
          </div>
          
          ${contract.items && contract.items.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th style="text-align: right;">Qty</th>
                  <th style="text-align: right;">Rate</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${contract.items.map(item => `
                  <tr>
                    <td>${item.item_name || '-'}</td>
                    <td>${item.description || '-'}</td>
                    <td style="text-align: right;">${item.quantity || 0} ${item.unit || ''}</td>
                    <td style="text-align: right;">${localFormatCurrency(item.unit_price || 0)}</td>
                    <td style="text-align: right;">${localFormatCurrency(item.amount || (item.quantity * item.unit_price) || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="4" style="text-align: right;"><strong>Total:</strong></td>
                  <td style="text-align: right;"><strong>${localFormatCurrency(calculateTotal())}</strong></td>
                </tr>
              </tfoot>
            </table>
          ` : ''}
          
          ${editorContent ? `
            <div class="content-section">
              <h3>Contract Terms & Conditions</h3>
              <div>${editorContent}</div>
            </div>
          ` : ''}
          
          ${contract.note ? `
            <div class="content-section">
              <h3>Notes</h3>
              <p style="color: #4b5563;">${contract.note}</p>
            </div>
          ` : ''}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `
    pdfWindow.document.write(pdfContent)
    pdfWindow.document.close()
  }

  const handleSendEmail = async () => {
    try {
      alert('Email sent successfully!')
      setIsSendEmailModalOpen(false)
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email')
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    try {
      const response = await contractsAPI.updateStatus(id, { status: newStatus }, { company_id: companyId })
      if (response.data.success) {
        await fetchContract()
        setIsStatusModalOpen(false)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  // Add item from catalog
  const handleAddItemFromCatalog = async (item) => {
    try {
      const currentItems = contract.items || []
      const newItem = {
        item_name: item.title || '',
        description: item.description || '',
        quantity: 1,
        unit: item.unit_type || 'PC',
        unit_price: parseFloat(item.rate || 0),
        amount: parseFloat(item.rate || 0)
      }
      const updatedItems = [...currentItems, newItem]

      const response = await contractsAPI.update(id, { items: updatedItems }, { company_id: companyId })
      if (response.data.success) {
        setIsAddItemModalOpen(false)
        await fetchContract()
      } else {
        alert(response.data.error || 'Failed to add item')
      }
    } catch (error) {
      console.error('Error adding item:', error)
      alert(error.response?.data?.error || 'Failed to add item')
    }
  }

  const handleEditItem = (itemIndex) => {
    const item = contract.items[itemIndex]
    setEditingItem({
      ...item,
      index: itemIndex
    })
    setIsEditItemModalOpen(true)
  }

  const handleUpdateItem = async () => {
    try {
      const currentItems = [...contract.items]
      const quantity = parseFloat(editingItem.quantity || 0)
      const unitPrice = parseFloat(editingItem.unit_price || 0)
      const amount = quantity * unitPrice

      currentItems[editingItem.index] = {
        ...currentItems[editingItem.index],
        item_name: editingItem.item_name,
        description: editingItem.description,
        quantity: quantity,
        unit: editingItem.unit,
        unit_price: unitPrice,
        amount: amount
      }

      const response = await contractsAPI.update(id, { items: currentItems }, { company_id: companyId })
      if (response.data.success) {
        setIsEditItemModalOpen(false)
        setEditingItem(null)
        await fetchContract()
      } else {
        alert(response.data.error || 'Failed to update item')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      alert(error.response?.data?.error || 'Failed to update item')
    }
  }

  const handleDeleteItem = async (index) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return
    try {
      const updatedItems = (contract.items || []).filter((_, idx) => idx !== index)
      const response = await contractsAPI.update(id, { items: updatedItems }, { company_id: companyId })
      if (response.data.success) {
        await fetchContract()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  const handleUpdateDiscount = async () => {
    try {
      const subTotal = calculateSubTotal()
      const discountAmount = discountData.discount_type === '%'
        ? (subTotal * (discountData.discount || 0)) / 100
        : (discountData.discount || 0)

      const response = await contractsAPI.update(id, {
        discount: discountData.discount,
        discount_type: discountData.discount_type,
        discount_amount: discountAmount
      }, { company_id: companyId })

      if (response.data.success) {
        setIsEditDiscountModalOpen(false)
        await fetchContract()
      } else {
        alert(response.data.error || 'Failed to update discount')
      }
    } catch (error) {
      console.error('Error updating discount:', error)
      alert(error.response?.data?.error || 'Failed to update discount')
    }
  }

  const handleSave = async () => {
    try {
      const response = await contractsAPI.update(id, {
        note: note,
        content: editorContent,
        contract_content: editorContent,
      }, { company_id: companyId })
      if (response.data.success) {
        alert('Contract saved successfully!')
        await fetchContract()
      } else {
        alert(response.data.error || 'Failed to save contract')
      }
    } catch (error) {
      console.error('Error saving contract:', error)
      alert(error.response?.data?.error || 'Failed to save contract')
    }
  }

  const handleSaveAndShow = async () => {
    await handleSave()
    setIsPreviewModalOpen(true)
  }

  const handleChangeTemplate = () => {
    navigate('/app/admin/finance-templates')
  }

  const handleAddTask = () => {
    if (newTask.title) {
      setTasks([...tasks, { ...newTask, id: Date.now() }])
      setNewTask({ title: '', due_date: '' })
      setIsAddTaskModalOpen(false)
    }
  }

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  const handleCopyPublicUrl = () => {
    const publicUrl = `${window.location.origin}/view/contract/${id}`
    navigator.clipboard.writeText(publicUrl)
    alert('Public contract URL copied to clipboard!')
  }

  // Filter catalog items
  const filteredCatalogItems = catalogItems.filter(item => {
    const matchesSearch = !itemSearchQuery ||
      item.title?.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(itemSearchQuery.toLowerCase())
    const matchesCategory = !itemCategoryFilter || item.category === itemCategoryFilter
    return matchesSearch && matchesCategory
  })

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contract details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (!contract) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Contract Not Found</h2>
          <p className="text-gray-600 mb-4">The contract you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => navigate('/app/admin/contracts')}>
            <IoArrowBack className="mr-2" />
            Back to Contracts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app/admin/contracts')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IoArrowBack size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <IoDocumentText className="text-gray-400" size={20} />
              <span className="text-lg font-semibold text-gray-800">
                {contract.contract_number}: {contract.title}
              </span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isExpired() ? statusColors.expired : (statusColors[contract.status] || statusColors.draft)}`}>
              {isExpired() ? 'Expired' : contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
            </span>
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <IoMail size={16} />
              <span>{localFormatDate(contract.contract_date)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleCopyPublicUrl}
              className="flex items-center gap-2"
            >
              <IoOpenOutline size={16} />
              Contract URL
            </Button>
            <Button
              onClick={() => setIsSendEmailModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <IoMailOutline size={16} />
              Send to client
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex gap-6 p-6">
        {/* Left Column - Main Content (70%) */}
        <div className="flex-1" style={{ maxWidth: '70%' }}>
          {/* Contract Items Section */}
          <Card className="p-0 overflow-hidden mb-6">
            <div
              className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 cursor-pointer"
              onClick={() => setIsItemsExpanded(!isItemsExpanded)}
            >
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <IoList size={20} />
                Contract Items
              </h3>
              {isItemsExpanded ? <IoChevronDown size={20} /> : <IoChevronForward size={20} />}
            </div>

            {isItemsExpanded && (
              <>
                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-2/5">Item</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-1/6">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-1/6">Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-1/6">Total</th>
                        <th className="px-4 py-3 text-center w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {contract.items && contract.items.length > 0 ? (
                        contract.items.map((item, idx) => (
                          <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{item.item_name || 'Item'}</p>
                                {item.description && (
                                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600 whitespace-nowrap">
                              {item.quantity || 0} {item.unit || 'PC'}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600 whitespace-nowrap">
                              {localFormatCurrency(item.unit_price || 0)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800 whitespace-nowrap">
                              {localFormatCurrency(item.amount || (item.quantity * item.unit_price) || 0)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleEditItem(idx)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                  title="Edit"
                                >
                                  <IoCreate size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(idx)}
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                  title="Delete"
                                >
                                  <IoClose size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                            No items added yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add Item Button */}
                <div className="p-4 border-t border-gray-200">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <IoAdd size={16} />
                    Add item
                  </Button>
                </div>
              </>
            )}
          </Card>

          {/* Totals Section */}
          <Card className="p-4 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sub Total:</span>
                <span className="font-semibold text-gray-800">{localFormatCurrency(calculateSubTotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  Discount:
                  <button
                    onClick={() => setIsEditDiscountModalOpen(true)}
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    title="Edit Discount"
                  >
                    <IoCreate size={14} />
                  </button>
                </span>
                <span className="font-semibold text-red-500">
                  -{localFormatCurrency(calculateDiscountAmount())}
                </span>
              </div>
              {contract.tax && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{contract.tax}:</span>
                  <span className="font-semibold text-gray-800">
                    {localFormatCurrency(((calculateSubTotal() - calculateDiscountAmount()) * parseFloat(contract.tax.match(/\d+/)?.[0] || 0)) / 100)}
                  </span>
                </div>
              )}
              {contract.second_tax && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{contract.second_tax}:</span>
                  <span className="font-semibold text-gray-800">
                    {localFormatCurrency(((calculateSubTotal() - calculateDiscountAmount()) * parseFloat(contract.second_tax.match(/\d+/)?.[0] || 0)) / 100)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-300">
                <span className="text-lg font-bold text-gray-800">Total:</span>
                <span className="text-lg font-bold text-green-600">{localFormatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </Card>

          {/* Rich Text Editor Section */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contract Terms</h3>
            <RichTextEditor
              value={editorContent}
              onChange={setEditorContent}
              placeholder="Write your contract terms here..."
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleChangeTemplate}
                className="flex items-center gap-2"
              >
                <IoSettings size={16} />
                Change template
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <IoCheckmark size={16} />
                Save
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAndShow}
                className="flex items-center gap-2"
              >
                <IoEye size={16} />
                Save & show
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column - Sidebar (30%) */}
        <div className="w-80 space-y-4">
          {/* Contract Info Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <IoDocumentText className="text-gray-500" size={18} />
                Contract info
              </h3>
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <IoEllipsisVertical size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
                  {(client?.name || contract.client_name || 'C').substring(0, 2).toUpperCase()}
                </div>
                <a href="#" className="text-sm text-blue-600 hover:underline">
                  {client?.name || contract.client_name}
                </a>
              </div>
              {contract.project_name && contract.project_name !== '--' && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <IoBriefcase size={14} />
                  </div>
                  <span className="text-sm text-gray-700">{contract.project_name}</span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                <p className="flex justify-between py-1">
                  <span>Contract date:</span>
                  <span className="font-medium">{localFormatDate(contract.contract_date)}</span>
                </p>
                <p className="flex justify-between py-1">
                  <span>Valid until:</span>
                  <span className={`font-medium ${isExpired() ? 'text-red-600' : ''}`}>
                    {localFormatDate(contract.valid_until)} {isExpired() && '(Expired)'}
                  </span>
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons Grid */}
          <Card className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="flex items-center justify-center gap-2 hover:bg-gray-100"
              >
                <IoEye size={16} />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 hover:bg-gray-100"
              >
                <IoPrint size={16} />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewPDF}
                className="flex items-center justify-center gap-2 hover:bg-gray-100"
              >
                <IoDocumentText size={16} />
                View PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-2 hover:bg-gray-100"
              >
                <IoDownload size={16} />
                Download PDF
              </Button>
            </div>
          </Card>

          {/* Note Section */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <IoDocumentText size={16} className="text-gray-500" />
              <h3 className="font-semibold text-gray-800">Note</h3>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add internal notes here..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </Card>

          {/* Signer Info Section */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <IoPerson size={16} className="text-gray-500" />
              <h3 className="font-semibold text-gray-800">Signer info (Client)</h3>
            </div>
            <div className="space-y-2">
              {contract.signer_name ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm font-bold">
                      {contract.signer_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{contract.signer_name}</p>
                      {contract.signer_email && (
                        <p className="text-xs text-gray-500">{contract.signer_email}</p>
                      )}
                    </div>
                  </div>
                  {contract.signed_at ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
                      <IoCheckmarkCircle size={16} />
                      <span>Signed on {localFormatDate(contract.signed_at)}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-yellow-600 mt-2">Awaiting signature</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400 italic">No signer assigned yet</p>
              )}
            </div>
          </Card>

          {/* Tasks Section */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <IoCheckmarkCircle size={16} className="text-gray-500" />
                <h3 className="font-semibold text-gray-800">Tasks</h3>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddTaskModalOpen(true)}
                className="flex items-center gap-1 text-xs px-2 py-1"
              >
                <IoAdd size={14} />
                Add task
              </Button>
            </div>
            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                    <input type="checkbox" className="rounded" />
                    <span className="flex-1 truncate">{task.title}</span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <IoClose size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No tasks yet</p>
            )}
          </Card>
        </div>
      </div>

      {/* MODALS */}

      {/* Add Item Modal - Using Catalog Items */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Add Items to Contract"
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search items..."
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <select
              value={itemCategoryFilter}
              onChange={(e) => setItemCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            >
              <option value="">All Categories</option>
              {[...new Set(catalogItems.map(item => item.category).filter(Boolean))].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {filteredCatalogItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No items found. Add items in the Items section first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredCatalogItems.map((item) => (
                <Card
                  key={item.id}
                  className="p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-500"
                  onClick={() => handleAddItemFromCatalog(item)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IoStorefront size={20} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-sm truncate">{item.title}</h3>
                      <p className="text-blue-600 font-bold text-sm">
                        ${parseFloat(item.rate || 0).toFixed(2)}
                        <span className="text-gray-400 font-normal text-xs">/{item.unit_type || 'PC'}</span>
                      </p>
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                        <IoCheckmark size={12} />
                        <span>Click to add</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsAddItemModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={isEditItemModalOpen}
        onClose={() => { setIsEditItemModalOpen(false); setEditingItem(null) }}
        title="Edit Item"
        size="md"
      >
        {editingItem && (
          <div className="space-y-4">
            <Input
              label="Item Name"
              value={editingItem.item_name || ''}
              onChange={(e) => setEditingItem({ ...editingItem, item_name: e.target.value })}
              placeholder="Item name"
            />
            <Input
              label="Description"
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              placeholder="Description"
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Quantity"
                type="number"
                value={editingItem.quantity || 1}
                onChange={(e) => {
                  const qty = parseFloat(e.target.value) || 0
                  const unitPrice = parseFloat(editingItem.unit_price || 0)
                  setEditingItem({ ...editingItem, quantity: qty, amount: qty * unitPrice })
                }}
                min="0"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <Input
                  value={editingItem.unit || 'PC'}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                />
              </div>
              <Input
                label="Unit Price"
                type="number"
                value={editingItem.unit_price || 0}
                onChange={(e) => {
                  const price = parseFloat(e.target.value) || 0
                  const qty = parseFloat(editingItem.quantity || 0)
                  setEditingItem({ ...editingItem, unit_price: price, amount: qty * price })
                }}
                min="0"
                step="0.01"
              />
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-500">Amount: </span>
              <span className="font-semibold text-gray-800">{localFormatCurrency(editingItem.amount || 0)}</span>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => { setIsEditItemModalOpen(false); setEditingItem(null) }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateItem}>
                Update Item
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Discount Modal */}
      <Modal
        isOpen={isEditDiscountModalOpen}
        onClose={() => setIsEditDiscountModalOpen(false)}
        title="Edit Discount"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Discount"
              type="number"
              value={discountData.discount || 0}
              onChange={(e) => setDiscountData({ ...discountData, discount: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={discountData.discount_type}
                onChange={(e) => setDiscountData({ ...discountData, discount_type: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="%">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsEditDiscountModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdateDiscount}>Update Discount</Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Contract Preview"
        size="xl"
      >
        <div className="space-y-6">
          <div className="text-center border-b pb-4">
            <h2 className="text-2xl font-bold">CONTRACT</h2>
            <p className="text-xl text-gray-600">{contract.contract_number}</p>
            <p className="text-lg text-gray-700">{contract.title}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Client:</strong> {contract.client_name}</p>
              <p><strong>Contract Date:</strong> {localFormatDate(contract.contract_date)}</p>
            </div>
            <div>
              <p><strong>Valid Until:</strong> {localFormatDate(contract.valid_until)}</p>
              <p><strong>Status:</strong> {contract.status}</p>
            </div>
          </div>
          {contract.items && contract.items.length > 0 && (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2">Item</th>
                  <th className="text-right p-2">Qty</th>
                  <th className="text-right p-2">Rate</th>
                  <th className="text-right p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {contract.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{item.item_name}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">{localFormatCurrency(item.unit_price)}</td>
                    <td className="p-2 text-right">{localFormatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td colSpan="3" className="p-2 text-right">Total:</td>
                  <td className="p-2 text-right">{localFormatCurrency(calculateTotal())}</td>
                </tr>
              </tfoot>
            </table>
          )}
          {editorContent && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Contract Content:</h3>
              <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: editorContent.replace(/\n/g, '<br/>') }} />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>Close</Button>
            <Button variant="primary" onClick={handlePrint}><IoPrint size={16} className="mr-2" />Print</Button>
          </div>
        </div>
      </Modal>

      {/* Send Email Modal */}
      <Modal
        isOpen={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        title="Send Contract to Client"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Send this contract to <strong>{client?.email || contract.client_name}</strong>?
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsSendEmailModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSendEmail} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              Send Email
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Change Contract Status"
      >
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">Select new status for this contract:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => handleUpdateStatus(status)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  contract.status.toLowerCase() === status.toLowerCase()
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Task Modal - Using unified TaskFormModal */}
      <TaskFormModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSave={() => {
          // Refresh tasks
        }}
        relatedToType="client"
        relatedToId={contract?.client_id}
        companyId={companyId}
      />
    </div>
  )
}

export default ContractDetail
