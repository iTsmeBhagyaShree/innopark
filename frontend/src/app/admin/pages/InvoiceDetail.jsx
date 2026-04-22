import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { invoicesAPI, projectsAPI, companiesAPI, paymentsAPI, itemsAPI, emailTemplatesAPI } from '../../../api'
import baseUrl from '../../../api/baseUrl'
import { useSettings } from '../../../context/SettingsContext'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
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
  IoSearch,
  IoFilter,
  IoEllipsisVertical,
  IoRefresh,
  IoAttach,
  IoMic,
  IoCloseCircle,
  IoOpenOutline,
  IoHappyOutline,
  IoCreateOutline,
  IoMailOutline,
  IoCopy,
  IoLocation,
  IoGlobe,
  IoCall,
  IoCash,
  IoWarning,
  IoCheckmark,
  IoPricetag,
  IoLink
} from 'react-icons/io5'

const InvoiceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { formatDate, formatCurrency, getCompanyInfo } = useSettings()

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

  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState(null)
  const [payments, setPayments] = useState([])
  const [tasks, setTasks] = useState([])
  const [reminders, setReminders] = useState([])
  const [note, setNote] = useState('')
  const [labels, setLabels] = useState(() => {
    try {
      const stored = localStorage.getItem('invoiceLabels')
      if (stored) return JSON.parse(stored)
    } catch (error) {
      console.warn('Failed to load labels', error)
    }
    return []
  })

  // Stored items for dropdown
  const [storedItems, setStoredItems] = useState([])
  const [itemSearchQuery, setItemSearchQuery] = useState('')

  // Modal states
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false)
  const [emailForm, setEmailForm] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    message: ''
  })
  const [sendingEmail, setSendingEmail] = useState(false)
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false)
  const [isEditDiscountModalOpen, setIsEditDiscountModalOpen] = useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false)

  // Form states
  const [editingItem, setEditingItem] = useState(null)
  const [newItem, setNewItem] = useState({
    item_name: '',
    description: '',
    quantity: 1,
    unit: 'PC',
    unit_price: 0
  })
  const [discountValue, setDiscountValue] = useState(0)
  const [newTask, setNewTask] = useState({ title: '', due_date: '' })
  const [newReminder, setNewReminder] = useState({ title: '', remind_at: '' })

  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    reference_note: '',
  })

  useEffect(() => {
    fetchInvoice()
    fetchPayments()
    fetchStoredItems()
  }, [id])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchInvoice:', companyId)
        setLoading(false)
        return
      }
      const response = await invoicesAPI.getById(id, { company_id: companyId })
      if (response.data.success) {
        const data = response.data.data
        setInvoice({
          id: data.id,
          invoice_number: data.invoice_number || `INV #${data.id}`,
          client_id: data.client_id,
          client_name: data.client_name || '--',
          project_id: data.project_id,
          project_name: data.project_name || '--',
          bill_date: data.bill_date || data.invoice_date || data.created_at || '',
          due_date: data.due_date || '--',
          status: (data.status || 'draft').toLowerCase(),
          description: data.description || '',
          note: data.note || '',
          terms: data.terms || '',
          currency: data.currency || 'USD',
          sub_total: parseFloat(data.sub_total) || 0,
          discount: parseFloat(data.discount) || 0,
          discount_type: data.discount_type || '%',
          discount_amount: parseFloat(data.discount_amount) || 0,
          tax_amount: parseFloat(data.tax_amount) || 0,
          total: parseFloat(data.total) || 0,
          paid_amount: parseFloat(data.paid_amount || data.paid || 0),
          due_amount: parseFloat(data.due_amount || data.unpaid || (data.total || 0) - (data.paid_amount || data.paid || 0)),
          items: data.items || [],
          created_by: data.created_by || null,
          labels: parseLabels(data.labels),
        })
        setNote(data.note || '')
        setDiscountValue(parseFloat(data.discount) || 0)

        // Fetch company details
        if (data.company_id) {
          try {
            const companyResponse = await companiesAPI.getById(data.company_id)
            if (companyResponse.data && companyResponse.data.success && companyResponse.data.data) {
              setCompany(companyResponse.data.data)
            }
          } catch (err) {
            console.log('Company not found:', err.response?.status)
            setCompany(null)
          }
        }


      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchPayments:', companyId)
        setPayments([])
        return
      }
      const response = await paymentsAPI.getAll({ invoice_id: id, company_id: companyId })
      if (response.data.success) {
        setPayments(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  const fetchStoredItems = async () => {
    try {
      const response = await itemsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setStoredItems(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching stored items:', error)
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
    let currencyCode = invoice?.currency || 'USD'
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

  const isOverdue = () => {
    if (!invoice?.due_date || invoice.due_date === '--') return false
    const dueDate = new Date(invoice.due_date)
    return dueDate < new Date() && invoice.status !== 'paid' && invoice.status !== 'fully paid'
  }

  const getComputedStatus = () => {
    if (!invoice) return 'Draft'
    const total = parseFloat(invoice.total || 0)
    const paid = parseFloat(invoice.paid_amount || 0)
    if (!total) return 'Draft'
    if (paid >= total) return 'Paid'
    if (paid > 0 && paid < total) return 'Partially Paid'
    if (isOverdue()) return 'Overdue'
    return 'Not Paid'
  }

  const parseLabels = (value) => {
    if (!value) return []
    if (Array.isArray(value)) return value
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  const hexToHsl = (hex) => {
    if (!hex) return { h: 210, s: 100, l: 45 }
    let clean = hex.replace('#', '').trim()
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('')
    }
    const num = parseInt(clean, 16)
    if (Number.isNaN(num)) return { h: 210, s: 100, l: 45 }
    const r = ((num >> 16) & 255) / 255
    const g = ((num >> 8) & 255) / 255
    const b = (num & 255) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2
    const d = max - min
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1))
      switch (max) {
        case r:
          h = ((g - b) / d) % 6
          break
        case g:
          h = (b - r) / d + 2
          break
        default:
          h = (r - g) / d + 4
      }
      h = Math.round(h * 60)
      if (h < 0) h += 360
    }
    return { h, s: Math.round(s * 100), l: Math.round(l * 100) }
  }

  const hexToRgb = (hex) => {
    if (!hex) return { r: 33, g: 126, b: 69 }
    let clean = hex.replace('#', '').trim()
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('')
    }
    const num = parseInt(clean, 16)
    if (Number.isNaN(num)) return { r: 33, g: 126, b: 69 }
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    }
  }

  const primaryColor = useMemo(() => {
    if (typeof window !== 'undefined') {
      const cssVar = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary-accent')
        .trim()
      if (cssVar) return cssVar
    }
    return '#217E45'
  }, [])

  const getStatusStyle = (status) => {
    const base = hexToHsl(primaryColor)
    const s = status?.toLowerCase() || ''
    const hueOffsets = {
      paid: 0,
      'fully paid': 0,
      'partially paid': 25,
      unpaid: 55,
      'not paid': 55,
      overdue: 145,
    }
    if (s === 'draft') {
      return {
        backgroundColor: `hsl(${base.h} 10% 92%)`,
        color: `hsl(${base.h} 20% 35%)`,
        borderColor: `hsl(${base.h} 15% 85%)`,
      }
    }
    const hue = (base.h + (hueOffsets[s] || 0)) % 360
    return {
      backgroundColor: `hsl(${hue} ${Math.max(45, base.s)}% 90%)`,
      color: `hsl(${hue} ${Math.max(55, base.s)}% 35%)`,
      borderColor: `hsl(${hue} ${Math.max(45, base.s)}% 80%)`,
    }
  }

  const labelColorMap = useMemo(() => {
    const map = new Map()
    labels.forEach((label) => {
      map.set(label.name, label.color)
    })
    return map
  }, [labels])

  const getLabelStyle = (labelName) => {
    const color = labelColorMap.get(labelName) || primaryColor
    const { r, g, b } = hexToRgb(color)
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
      color,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.35)`,
    }
  }

  // Action handlers
  const handlePreview = () => {
    setIsPreviewModalOpen(true)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(generatePDFContent())
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
  }

  const generatePDFContent = () => {
    const companyName = company?.name || getCompanyInfo()?.name || 'Company'
    const companyAddress = company?.address || getCompanyInfo()?.address || ''
    const companyPhone = company?.phone || getCompanyInfo()?.phone || ''
    const companyEmail = company?.email || getCompanyInfo()?.email || ''
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #fff; color: #333; }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
          .company-info h1 { font-size: 28px; color: #1a5f4a; margin-bottom: 10px; }
          .company-info p { font-size: 12px; color: #666; line-height: 1.6; }
          .invoice-badge { background: #1a5f4a; color: white; font-size: 18px; font-weight: bold; padding: 10px 20px; border-radius: 4px; }
          .dates { text-align: right; margin-top: 15px; font-size: 13px; color: #666; }
          .dates span { font-weight: 600; color: #333; }
          .bill-to { margin-bottom: 30px; }
          .bill-to h3 { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .bill-to p { font-size: 14px; color: #333; line-height: 1.5; }
          .bill-to .client-name { font-weight: 600; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f8f9fa; text-align: left; padding: 12px 15px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e9ecef; }
          td { padding: 12px 15px; border-bottom: 1px solid #e9ecef; font-size: 13px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .item-name { font-weight: 500; color: #333; }
          .item-desc { font-size: 11px; color: #888; margin-top: 3px; }
          .totals { margin-top: 30px; margin-left: auto; width: 300px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
          .totals-row.total { font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 12px; margin-top: 8px; }
          .totals-row.balance { color: #1a5f4a; font-weight: bold; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e9ecef; }
          .footer p { font-size: 11px; color: #888; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="company-info">
            <h1>${companyName}</h1>
            <p>${companyAddress}</p>
            ${companyPhone ? `<p>Phone: ${companyPhone}</p>` : ''}
            ${companyEmail ? `<p>Email: ${companyEmail}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <div class="invoice-badge">${invoice.invoice_number}</div>
            <div class="dates">
              <p>Bill Date: <span>${localFormatDate(invoice.bill_date)}</span></p>
              <p>Due Date: <span>${localFormatDate(invoice.due_date)}</span></p>
            </div>
          </div>
        </div>
        
        <div class="bill-to">
          <h3>Bill To</h3>
          <p class="client-name">${invoice.client_name}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 40%;">Item</th>
              <th class="text-center" style="width: 15%;">Qty</th>
              <th class="text-right" style="width: 20%;">Rate</th>
              <th class="text-right" style="width: 25%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(invoice.items || []).map(item => `
              <tr>
                <td>
                  <div class="item-name">${item.item_name || 'Item'}</div>
                  ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
                </td>
                <td class="text-center">${item.quantity || 0} ${item.unit || 'PC'}</td>
                <td class="text-right">${localFormatCurrency(item.unit_price || 0)}</td>
                <td class="text-right">${localFormatCurrency(item.amount || (item.quantity * item.unit_price) || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span>Sub Total:</span>
            <span>${localFormatCurrency(invoice.sub_total)}</span>
          </div>
          ${invoice.discount_amount > 0 ? `
            <div class="totals-row">
              <span>Discount:</span>
              <span>-${localFormatCurrency(invoice.discount_amount)}</span>
            </div>
          ` : ''}
          ${invoice.tax_amount > 0 ? `
            <div class="totals-row">
              <span>Tax:</span>
              <span>${localFormatCurrency(invoice.tax_amount)}</span>
            </div>
          ` : ''}
          <div class="totals-row total">
            <span>Total:</span>
            <span>${localFormatCurrency(invoice.total)}</span>
          </div>
          ${invoice.paid_amount > 0 ? `
            <div class="totals-row">
              <span>Paid:</span>
              <span>${localFormatCurrency(invoice.paid_amount)}</span>
            </div>
          ` : ''}
          <div class="totals-row balance">
            <span>Balance Due:</span>
            <span>${localFormatCurrency(invoice.due_amount)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `
  }

  const handleViewPDF = () => {
    const pdfWindow = window.open('', '_blank')
    pdfWindow.document.write(generatePDFContent())
    pdfWindow.document.close()
  }

  const handleDownloadPDF = () => {
    const pdfWindow = window.open('', '_blank')
    pdfWindow.document.write(generatePDFContent())
    pdfWindow.document.close()
    pdfWindow.focus()
    setTimeout(() => {
      pdfWindow.print()
    }, 500)
  }

  // Load email template when modal opens
  useEffect(() => {
    if (isSendEmailModalOpen && invoice) {
      loadEmailTemplate()
    }
  }, [isSendEmailModalOpen, invoice])

  const loadEmailTemplate = async () => {
    try {
      const companyId = localStorage.getItem('companyId') || 1
      // Fetch template by template_key
      const response = await emailTemplatesAPI.getByTemplateKey('invoice_sent', { company_id: companyId })
      
      if (response.data?.success && response.data.data) {
        const template = response.data.data
        
        // Build data object for placeholder replacement
        const templateData = {
          INVOICE_NUMBER: invoice.invoice_number || `INV-${invoice.id}`,
          CONTACT_FIRST_NAME: invoice.client_name?.split(' ')[0] || 'Valued Customer',
          PUBLIC_INVOICE_URL: `${window.location.origin}/public/invoices/${invoice.id}`,
          INVOICE_AMOUNT: localFormatCurrency(invoice.total || 0),
          COMPANY_NAME: company?.name || 'Our Company',
          SIGNATURE: 'Best regards,<br>Your Team'
        }

        // Replace placeholders
        let subject = template.subject || `Invoice ${invoice.invoice_number}`
        let body = template.body || ''
        
        Object.keys(templateData).forEach(key => {
          const placeholder = `{${key}}`
          subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), templateData[key])
          body = body.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), templateData[key])
        })

        setEmailForm({
          to: invoice.client_email || '',
          cc: '',
          bcc: '',
          subject: subject,
          message: body
        })
      } else {
        // Fallback if template not found
        setEmailForm({
          to: client?.email || invoice.client_email || '',
          cc: '',
          bcc: '',
          subject: `Invoice ${invoice.invoice_number}`,
          message: `<p>Hello ${invoice.client_name || 'Valued Customer'},</p><p>Please find attached invoice ${invoice.invoice_number}.</p><p>Amount: ${localFormatCurrency(invoice.total || 0)}</p>`
        })
      }
    } catch (error) {
      console.error('Error loading email template:', error)
      // Fallback
      setEmailForm({
        to: invoice.client_email || '',
        cc: '',
        bcc: '',
        subject: `Invoice ${invoice.invoice_number}`,
        message: `<p>Hello ${invoice.client_name || 'Valued Customer'},</p><p>Please find attached invoice ${invoice.invoice_number}.</p>`
      })
    }
  }

  const handleSendEmail = async () => {
    try {
      if (!emailForm.to) {
        alert('To email is required')
        return
      }
      setSendingEmail(true)
      const response = await invoicesAPI.sendEmail(id, {
        to: emailForm.to,
        cc: emailForm.cc,
        bcc: emailForm.bcc,
        subject: emailForm.subject,
        message: emailForm.message
      })
      if (response.data.success) {
        alert('Email sent successfully!')
        setIsSendEmailModalOpen(false)
        setEmailForm({ to: '', cc: '', bcc: '', subject: '', message: '' })
      } else {
        alert('Failed to send email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert(error.response?.data?.error || 'Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleAddPayment = async () => {
    try {
      const response = await paymentsAPI.create({
        invoice_id: id,
        company_id: companyId,
        amount: parseFloat(paymentFormData.amount),
        payment_date: paymentFormData.payment_date,
        payment_method: paymentFormData.payment_method,
        reference_note: paymentFormData.reference_note,
      })
      if (response.data.success) {
        await fetchInvoice()
        await fetchPayments()
        setIsAddPaymentModalOpen(false)
        setPaymentFormData({
          amount: '',
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'Cash',
          reference_note: '',
        })
      }
    } catch (error) {
      console.error('Error adding payment:', error)
      alert('Failed to add payment')
    }
  }

  const handleAddItem = async () => {
    try {
      const itemData = {
        ...newItem,
        amount: newItem.quantity * newItem.unit_price
      }
      const updatedItems = [...(invoice.items || []), itemData]
      const response = await invoicesAPI.update(id, { items: updatedItems })
      if (response.data.success) {
        await fetchInvoice()
        setIsAddItemModalOpen(false)
        setNewItem({ item_name: '', description: '', quantity: 1, unit: 'PC', unit_price: 0 })
        setItemSearchQuery('')
      }
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Failed to add item')
    }
  }

  // Handle selecting an item from stored items dropdown
  const handleSelectStoredItem = async (item) => {
    try {
      const itemData = {
        item_name: item.title || item.name || item.item_name || 'Item',
        description: item.description || '',
        quantity: 1,
        unit: item.unit_type || item.unit || 'PC',
        unit_price: parseFloat(item.rate || item.price || item.unit_price || 0),
        amount: parseFloat(item.rate || item.price || item.unit_price || 0)
      }
      const updatedItems = [...(invoice.items || []), itemData]
      const response = await invoicesAPI.update(id, { items: updatedItems })
      if (response.data.success) {
        await fetchInvoice()
        setIsAddItemModalOpen(false)
        setItemSearchQuery('')
      }
    } catch (error) {
      console.error('Error adding stored item:', error)
      alert('Failed to add item')
    }
  }

  const handleEditItem = async () => {
    try {
      const updatedItems = (invoice.items || []).map((item, idx) =>
        idx === editingItem.index ? { ...editingItem, amount: editingItem.quantity * editingItem.unit_price } : item
      )
      const response = await invoicesAPI.update(id, { items: updatedItems })
      if (response.data.success) {
        await fetchInvoice()
        setIsEditItemModalOpen(false)
        setEditingItem(null)
      }
    } catch (error) {
      console.error('Error editing item:', error)
      alert('Failed to update item')
    }
  }

  const handleDeleteItem = async (index) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return
    try {
      const updatedItems = (invoice.items || []).filter((_, idx) => idx !== index)
      const response = await invoicesAPI.update(id, { items: updatedItems })
      if (response.data.success) {
        await fetchInvoice()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  const handleUpdateDiscount = async () => {
    try {
      const response = await invoicesAPI.update(id, { discount: discountValue })
      if (response.data.success) {
        await fetchInvoice()
        setIsEditDiscountModalOpen(false)
      }
    } catch (error) {
      console.error('Error updating discount:', error)
      alert('Failed to update discount')
    }
  }

  const handleSaveNote = async () => {
    try {
      const response = await invoicesAPI.update(id, { note })
      if (response.data.success) {
        await fetchInvoice()
      }
    } catch (error) {
      console.error('Error saving note:', error)
    }
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

  const handleAddReminder = () => {
    if (newReminder.title) {
      setReminders([...reminders, { ...newReminder, id: Date.now() }])
      setNewReminder({ title: '', remind_at: '' })
      setIsAddReminderModalOpen(false)
    }
  }

  const handleDeleteReminder = (reminderId) => {
    setReminders(reminders.filter(r => r.id !== reminderId))
  }

  const handleCopyPublicUrl = () => {
    const publicUrl = `${window.location.origin}/pay/invoice/${id}`
    navigator.clipboard.writeText(publicUrl)
    alert('Public pay URL copied to clipboard!')
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary-accent mb-4">Invoice Not Found</h2>
          <p className="text-gray-600 mb-4">The invoice you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/invoices' : '/app/admin/invoices')}>
            <IoArrowBack className="mr-2" />
            Back to Invoices
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-main-bg text-primary-text">
      {/* Header */}
      <div className="bg-card-bg border-b border-border-light px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/invoices' : '/app/admin/invoices')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IoArrowBack size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <IoLink className="text-gray-400" size={20} />
              <span className="text-lg font-semibold text-gray-800">{invoice.invoice_number}</span>
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-semibold border"
              style={getStatusStyle(getComputedStatus())}
            >
              {getComputedStatus()}
            </span>
            {invoice.labels?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {invoice.labels.map((label) => (
                  <span
                    key={`label-${label}`}
                    className="px-2 py-0.5 text-[10px] font-semibold rounded-full border"
                    style={getLabelStyle(label)}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <IoCalendar size={16} />
              <span>{localFormatDate(invoice.bill_date)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleCopyPublicUrl}
              className="flex items-center gap-2"
            >
              <IoOpenOutline size={16} />
              Invoice URL
            </Button>
            <Button
              onClick={() => setIsSendEmailModalOpen(true)}
              className="flex items-center gap-2 bg-primary-accent hover:opacity-90 text-white"
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
          <div className="bg-card-bg rounded-lg shadow-sm border border-border-light p-6">
            {/* Company Info Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-accent/90 flex items-center justify-center text-white font-bold text-lg">
                    {(company?.name || getCompanyInfo()?.name || 'D').substring(0, 1)}
                  </div>
                  <span className="text-3xl font-bold text-primary-accent">
                    {company?.name || getCompanyInfo()?.name || 'Developo'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-800">{company?.name || getCompanyInfo()?.name || 'Developo'}</p>
                  {(company?.address || getCompanyInfo()?.address) && <p>{company?.address || getCompanyInfo()?.address}</p>}
                  {company?.city && <p>{company.city}, {company?.state || ''}</p>}
                  {(company?.phone || getCompanyInfo()?.phone) && <p>Phone: {company?.phone || getCompanyInfo()?.phone}</p>}
                  {(company?.email || getCompanyInfo()?.email) && <p>Email: {company?.email || getCompanyInfo()?.email}</p>}
                  {(company?.website || getCompanyInfo()?.website) && <p>Website: {company?.website || getCompanyInfo()?.website}</p>}
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block bg-primary-accent text-white font-bold text-lg px-4 py-2 mb-3 rounded">
                  {invoice.invoice_number}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Bill date: <span className="font-medium">{localFormatDate(invoice.bill_date)}</span></p>
                  <p>Due date: <span className={`font-medium ${isOverdue() ? 'text-primary-accent' : ''}`}>
                    {localFormatDate(invoice.due_date)} {isOverdue() && '(Overdue)'}
                  </span></p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
              <div className="text-gray-800">
                <p className="font-semibold">{invoice.client_name}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <table className="w-full">
                <thead className="bg-main-bg border-b border-border-light">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600">Item</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-600">Quantity</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Rate</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Taxable</th>
                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Total</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-border-light hover:bg-main-bg">
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-gray-800">{item.item_name || 'Item'}</p>
                            {item.description && (
                              <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center text-gray-600">
                          {item.quantity || 0} {item.unit || 'PC'}
                        </td>
                        <td className="p-3 text-right text-gray-600">
                          {localFormatCurrency(item.unit_price || 0)}
                        </td>
                        <td className="p-3 text-right text-gray-600">
                          {item.taxable === false ? 'No' : (item.taxable ? 'Yes' : (invoice.tax_amount > 0 ? 'Yes' : 'No'))}
                        </td>
                        <td className="p-3 text-right font-semibold text-gray-800">
                          {localFormatCurrency(item.amount || (item.quantity * item.unit_price) || 0)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => {
                                setEditingItem({ ...item, index: idx })
                                setIsEditItemModalOpen(true)
                              }}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                              title="Edit"
                            >
                              <IoCreate size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(idx)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
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
                      <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                        No items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Add Item Button */}
              <div className="mt-4">
                <button
                  onClick={() => setIsAddItemModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-accent text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                >
                  <IoAdd size={18} /> Add item
                </button>
              </div>

              {/* Totals Section */}
              <div className="mt-6 flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sub Total:</span>
                    <span className="text-gray-800">{localFormatCurrency(invoice.sub_total)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      Discount:
                      <button
                        onClick={() => setIsEditDiscountModalOpen(true)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <IoCreate size={14} />
                      </button>
                    </span>
                    <span className="text-gray-800">
                      {invoice.discount_type === '%'
                        ? `${invoice.discount}%`
                        : localFormatCurrency(invoice.discount_amount || 0)}
                    </span>
                  </div>
                  {invoice.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tax:</span>
                      <span className="text-gray-800">{localFormatCurrency(invoice.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-800">Total:</span>
                    <span className="text-gray-800">{localFormatCurrency(invoice.total)}</span>
                  </div>
                  {invoice.paid_amount > 0 && (
                    <div className="flex justify-between text-sm text-primary-accent">
                      <span>Paid:</span>
                      <span>{localFormatCurrency(invoice.paid_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-primary-accent">
                    <span>Balance Due:</span>
                    <span>{localFormatCurrency(invoice.due_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            {invoice.description && (
              <div className="mt-8 border-t pt-6 overflow-hidden">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">DESCRIPTION</h3>
                <div className="text-gray-700 prose max-w-full break-words overflow-wrap-anywhere text-sm" 
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  dangerouslySetInnerHTML={{ __html: invoice.description }} />
              </div>
            )}

            {/* Terms Section */}
            {invoice.terms && (
              <div className="mt-6 border-t pt-6 overflow-hidden">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">TERMS & CONDITIONS</h3>
                <div className="text-gray-700 prose max-w-full break-words overflow-wrap-anywhere text-sm"
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  dangerouslySetInnerHTML={{ __html: invoice.terms }} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar (30%) */}
          <div className="w-80 space-y-4">
          {/* Invoice Info Card */}
          <div className="bg-card-bg rounded-lg shadow-sm border border-border-light p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <IoDocumentText className="text-gray-500" size={18} />
                Invoice info
              </h3>
              <button className="text-gray-400 hover:text-gray-600">
                <IoEllipsisVertical size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-accent/10 flex items-center justify-center text-primary-accent text-sm font-bold">
                  {(invoice.client_name || 'C').substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm text-primary-accent hover:underline cursor-pointer">
                  {invoice.client_name}
                </span>
              </div>
              {invoice.project_name && invoice.project_name !== '--' && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-accent/10 flex items-center justify-center text-primary-accent">
                    <IoBriefcase size={14} />
                  </div>
                  <span className="text-sm text-gray-700">{invoice.project_name}</span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                <p className="flex justify-between py-1">
                  <span>Bill date:</span>
                  <span className="font-medium">{localFormatDate(invoice.bill_date)}</span>
                </p>
                <p className="flex justify-between py-1">
                  <span>Due date:</span>
                  <span className={`font-medium ${isOverdue() ? 'text-primary-accent' : ''}`}>
                    {localFormatDate(invoice.due_date)} {isOverdue() && '(Overdue)'}
                  </span>
                </p>
                <p className="flex justify-between py-1">
                  <span>Total:</span>
                  <span className="font-medium">{localFormatCurrency(invoice.total)}</span>
                </p>
                <p className="flex justify-between py-1">
                  <span>Paid:</span>
                  <span className="font-medium text-primary-accent">{localFormatCurrency(invoice.paid_amount)}</span>
                </p>
                <p className="flex justify-between py-1">
                  <span>Balance:</span>
                  <span className="font-medium text-primary-accent">{localFormatCurrency(invoice.due_amount)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="bg-card-bg rounded-lg shadow-sm border border-border-light p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handlePreview}
                className="flex flex-col items-center gap-2 p-3 hover:bg-primary-accent/5 rounded-lg transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-accent/10 text-primary-accent flex items-center justify-center group-hover:bg-primary-accent/20 transition-colors">
                  <IoEye size={14} />
                </div>
                <span className="text-xs font-semibold text-gray-600">Preview</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex flex-col items-center gap-2 p-3 hover:bg-green-50 rounded-lg transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <IoPrint size={14} />
                </div>
                <span className="text-xs font-semibold text-gray-600">Print</span>
              </button>
              <button
                onClick={handleViewPDF}
                className="flex flex-col items-center gap-2 p-3 hover:bg-red-50 rounded-lg transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <IoDocumentText size={14} />
                </div>
                <span className="text-xs font-semibold text-gray-600">View PDF</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex flex-col items-center gap-2 p-3 hover:bg-blue-50 rounded-lg transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <IoDownload size={14} />
                </div>
                <span className="text-xs font-semibold text-gray-600">Download PDF</span>
              </button>
            </div>
          </div>

          {/* Public Pay URL Section */}
          <div className="bg-card-bg rounded-lg shadow-sm border border-border-light p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <IoLink className="text-gray-500" size={18} />
                Public Pay URL
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/pay/invoice/${id}`}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600 truncate"
              />
              <button
                onClick={handleCopyPublicUrl}
                className="p-2 text-primary-accent hover:bg-main-bg rounded-lg"
                title="Copy URL"
              >
                <IoCopy size={18} />
              </button>
            </div>
          </div>

          {/* Note Section */}
          <div className="bg-card-bg rounded-lg shadow-sm border border-border-light p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Note</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleSaveNote}
              placeholder="Add a note..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none bg-input-bg"
            />
          </div>

          {/* Tasks Section */}
          <div className="bg-card-bg rounded-lg shadow-sm border border-border-light p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <IoCheckmarkCircle className="text-gray-500" size={18} />
                Tasks
              </h3>
            </div>
            <div className="space-y-2 mb-3">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No tasks yet</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{task.title}</span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-primary-accent hover:opacity-80"
                    >
                      <IoClose size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setIsAddTaskModalOpen(true)}
              className="flex items-center gap-1 text-sm text-primary-accent hover:underline"
            >
              <IoAdd size={16} /> Add task
            </button>
          </div>

          {/* Reminders Section */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <IoTime className="text-gray-500" size={18} />
                Reminders (Private)
              </h3>
            </div>
            <div className="space-y-2 mb-3">
              {reminders.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No reminders yet</p>
              ) : (
                reminders.map(reminder => (
                  <div key={reminder.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{reminder.title}</span>
                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="text-primary-accent hover:opacity-80"
                    >
                      <IoClose size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setIsAddReminderModalOpen(true)}
              className="flex items-center gap-1 text-sm text-primary-accent hover:underline"
            >
              <IoAdd size={16} /> Add reminder
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Invoice Preview"
        size="lg"
      >
        <div className="bg-white p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-6">
            <div>
              <h1 className="text-2xl font-bold text-primary-accent mb-2">
                {company?.name || getCompanyInfo()?.name || 'Company'}
              </h1>
              <div className="text-sm text-gray-600 space-y-0.5">
                {(company?.address || getCompanyInfo()?.address) && <p>{company?.address || getCompanyInfo()?.address}</p>}
                {(company?.phone || getCompanyInfo()?.phone) && <p>Phone: {company?.phone || getCompanyInfo()?.phone}</p>}
                {(company?.email || getCompanyInfo()?.email) && <p>Email: {company?.email || getCompanyInfo()?.email}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-primary-accent text-white font-bold text-lg px-4 py-2 rounded mb-3">
                {invoice.invoice_number}
              </div>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p>Bill Date: <span className="font-medium text-gray-800">{localFormatDate(invoice.bill_date)}</span></p>
                <p>Due Date: <span className="font-medium text-gray-800">{localFormatDate(invoice.due_date)}</span></p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
            <p className="font-semibold text-gray-800">{invoice.client_name}</p>
          </div>

          {/* Items Table */}
          {invoice.items && invoice.items.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-y">
                  <th className="text-left p-3 font-semibold text-gray-600">Item</th>
                  <th className="text-center p-3 font-semibold text-gray-600">Qty</th>
                  <th className="text-right p-3 font-semibold text-gray-600">Rate</th>
                  <th className="text-right p-3 font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3">
                      <p className="font-medium text-gray-800">{item.item_name || 'Item'}</p>
                      {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    </td>
                    <td className="p-3 text-center text-gray-600">{item.quantity || 0} {item.unit || 'PC'}</td>
                    <td className="p-3 text-right text-gray-600">{localFormatCurrency(item.unit_price || 0)}</td>
                    <td className="p-3 text-right font-medium text-gray-800">{localFormatCurrency(item.amount || (item.quantity * item.unit_price) || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sub Total:</span>
                <span className="text-gray-800">{localFormatCurrency(invoice.sub_total)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount:</span>
                  <span className="text-gray-800">-{localFormatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax:</span>
                  <span className="text-gray-800">{localFormatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total:</span>
                <span>{localFormatCurrency(invoice.total)}</span>
              </div>
              {invoice.paid_amount > 0 && (
                <div className="flex justify-between text-primary-accent">
                  <span>Paid:</span>
                  <span>{localFormatCurrency(invoice.paid_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-primary-accent">
                <span>Balance Due:</span>
                <span>{localFormatCurrency(invoice.due_amount)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            Thank you for your business!
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>Close</Button>
            <Button onClick={handleDownloadPDF} className="bg-primary-accent hover:opacity-90 text-white">
              <IoDownload size={16} className="mr-2" /> Download PDF
            </Button>
          </div>
        </div>
      </Modal>

      {/* Send Email Modal */}
      <Modal
        isOpen={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        title="Send Invoice"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="To"
            type="email"
            value={emailForm.to}
            onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
            placeholder="Recipient email"
            required
          />
          <Input
            label="CC"
            type="email"
            value={emailForm.cc}
            onChange={(e) => setEmailForm({ ...emailForm, cc: e.target.value })}
            placeholder="CC email (optional)"
          />
          <Input
            label="BCC"
            type="email"
            value={emailForm.bcc}
            onChange={(e) => setEmailForm({ ...emailForm, bcc: e.target.value })}
            placeholder="BCC email (optional)"
          />
          <Input
            label="Subject"
            value={emailForm.subject}
            onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
            placeholder="Email subject"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              rows={8}
              value={emailForm.message}
              onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              placeholder="Email message"
            />
            <p className="text-xs text-gray-500 mt-1">
              Template loaded from Email Templates Settings. You can edit it before sending.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsSendEmailModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={sendingEmail}
              className="flex-1 bg-primary-accent hover:opacity-90 text-white disabled:opacity-50"
            >
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        title="Add Payment"
      >
        <div className="space-y-4">
          <Input
            type="number"
            label="Amount"
            value={paymentFormData.amount}
            onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
            placeholder="Enter amount"
          />
          <Input
            type="date"
            label="Payment Date"
            value={paymentFormData.payment_date}
            onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              value={paymentFormData.payment_method}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
              className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none bg-input-bg"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Check">Check</option>
              <option value="PayPal">PayPal</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
          <Input
            label="Reference Note"
            value={paymentFormData.reference_note}
            onChange={(e) => setPaymentFormData({ ...paymentFormData, reference_note: e.target.value })}
            placeholder="Optional reference note"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsAddPaymentModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleAddPayment} className="bg-primary-accent hover:opacity-90 text-white">
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => { setIsAddItemModalOpen(false); setItemSearchQuery(''); }}
        title="Add Item"
        size="lg"
      >
        <div className="space-y-4">
          {/* Search stored items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select from stored items</label>
            <div className="relative">
              <Input
                placeholder="Search items..."
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
              />
              <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          {/* Stored items list */}
          {storedItems.length > 0 && (
            <div className="max-h-[250px] overflow-y-auto border border-border-light rounded-lg divide-y divide-gray-100">
              {storedItems
                .filter(item => {
                  const search = (itemSearchQuery || '').toLowerCase()
                  const title = (item.title || item.name || item.item_name || '').toLowerCase()
                  const desc = (item.description || '').toLowerCase()
                  return title.includes(search) || desc.includes(search)
                })
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 hover:bg-primary-accent/5 cursor-pointer transition-colors group flex items-center justify-between"
                    onClick={() => handleSelectStoredItem(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 group-hover:text-primary-accent truncate">
                        {item.title || item.name || item.item_name || 'Item'}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="font-bold text-gray-900">{localFormatCurrency(item.rate || item.price || item.unit_price || 0)}</p>
                      <p className="text-[10px] text-gray-400 uppercase">{item.unit_type || item.unit || 'PC'}</p>
                    </div>
                  </div>
                ))}
              {storedItems.filter(item => {
                const search = (itemSearchQuery || '').toLowerCase()
                const title = (item.title || item.name || item.item_name || '').toLowerCase()
                const desc = (item.description || '').toLowerCase()
                return title.includes(search) || desc.includes(search)
              }).length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">No items found</div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <div className="flex-1 border-t border-gray-200"></div>
            <span>OR add custom item</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Manual entry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <Input
              value={newItem.item_name}
              onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
              placeholder="Enter item name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Enter description"
              rows={2}
              className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-accent outline-none bg-input-bg"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <Input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <Input
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
              <Input
                type="number"
                value={newItem.unit_price}
                onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => { setIsAddItemModalOpen(false); setItemSearchQuery(''); }} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddItem} className="flex-1 bg-primary-accent hover:opacity-90 text-white">
              Add Custom Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={isEditItemModalOpen}
        onClose={() => setIsEditItemModalOpen(false)}
        title="Edit Item"
      >
        {editingItem && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <Input
                value={editingItem.item_name}
                onChange={(e) => setEditingItem({ ...editingItem, item_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editingItem.description || ''}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-accent outline-none bg-input-bg"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <Input
                  type="number"
                  value={editingItem.quantity}
                  onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <Input
                  value={editingItem.unit}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                <Input
                  type="number"
                  value={editingItem.unit_price}
                  onChange={(e) => setEditingItem({ ...editingItem, unit_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditItemModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleEditItem} className="flex-1 bg-primary-accent hover:opacity-90 text-white">
                Save Changes
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
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">Discount ({invoice.discount_type === '%' ? '%' : 'Amount'})</label>
            <Input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              placeholder="Enter discount"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditDiscountModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpdateDiscount} className="flex-1 bg-primary-accent hover:opacity-90 text-white">
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Task Modal - Using unified TaskFormModal */}
      <TaskFormModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSave={() => {
          // Refresh tasks list if needed
        }}
        relatedToType="invoice"
        relatedToId={invoice?.id}
        companyId={companyId}
      />

      {/* Add Reminder Modal */}
      <Modal
        isOpen={isAddReminderModalOpen}
        onClose={() => setIsAddReminderModalOpen(false)}
        title="Add Reminder"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">Reminder Title</label>
            <Input
              value={newReminder.title}
              onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
              placeholder="Enter reminder title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">Remind At</label>
            <Input
              type="datetime-local"
              value={newReminder.remind_at}
              onChange={(e) => setNewReminder({ ...newReminder, remind_at: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAddReminderModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddReminder} className="flex-1 bg-primary-accent hover:opacity-90 text-white">
              Add Reminder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default InvoiceDetail
