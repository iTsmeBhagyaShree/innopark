import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { estimatesAPI, projectsAPI, companiesAPI, itemsAPI, emailTemplatesAPI, customFieldsAPI } from '../../../api'
import baseUrl from '../../../api/baseUrl'
import { useSettings } from '../../../context/SettingsContext'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import TaskFormModal from '../../../components/ui/TaskFormModal'
import RichTextEditor from '../../../components/ui/RichTextEditor'
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
  IoPerson,
  IoLink,
  IoList,
  IoCash
} from 'react-icons/io5'

const EstimateDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { formatDate: settingsFormatDate, formatCurrency: settingsFormatCurrency, getCompanyInfo } = useSettings()

  const [estimate, setEstimate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState(null)

  // Stored items for dropdown
  const [storedItems, setStoredItems] = useState([])
  const [itemSearchQuery, setItemSearchQuery] = useState('')

  // Modal states
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false)
  const [isEditDiscountModalOpen, setIsEditDiscountModalOpen] = useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false)

  // Email state
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({
    template: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    message: ''
  });

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
  const [tasks, setTasks] = useState([])
  const [reminders, setReminders] = useState([])
  const [note, setNote] = useState('')
  const [customFields, setCustomFields] = useState([])

  // Get companyId safely
  const [companyId] = useState(() => {
    try {
      const stored = localStorage.getItem('companyId')
      return parseInt(stored || 1, 10)
    } catch (e) {
      console.error('Error accessing localStorage:', e)
      return 1
    }
  })

  useEffect(() => {
    fetchEstimate()
    fetchEstimate()
    fetchStoredItems()
    fetchEmailTemplates()
    fetchCustomFields()
  }, [id])

  const fetchCustomFields = async () => {
    try {
      const res = await customFieldsAPI.getAll({ company_id: companyId, module: 'Estimates' })
      if (res.data?.success) {
        setCustomFields(res.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching custom fields:', error)
    }
  }

  // Load email template when modal opens
  useEffect(() => {
    if (isSendEmailModalOpen && estimate) {
      loadEmailTemplate()
    }
  }, [isSendEmailModalOpen, estimate])

  const loadEmailTemplate = async () => {
    try {
      const companyId = localStorage.getItem('companyId') || 1
      // Fetch template by template_key
      const response = await emailTemplatesAPI.getByTemplateKey('estimate_sent', { company_id: companyId })

      if (response.data?.success && response.data.data) {
        const template = response.data.data

        // Build data object for placeholder replacement
        const templateData = {
          ESTIMATE_NUMBER: estimate.estimate_number || `EST-${estimate.id}`,
          CONTACT_FIRST_NAME: client?.name?.split(' ')[0] || estimate.client_name?.split(' ')[0] || 'Valued Customer',
          PUBLIC_ESTIMATE_URL: `${window.location.origin}/public/estimates/${estimate.id}`,
          ESTIMATE_AMOUNT: formatCurrency(estimate.total || 0),
          COMPANY_NAME: company?.name || 'Our Company',
          SIGNATURE: 'Best regards,<br>Your Team'
        }

        // Replace placeholders
        let subject = template.subject || `Estimate ${estimate.estimate_number}`
        let body = template.body || ''

        Object.keys(templateData).forEach(key => {
          const placeholder = `{${key}}`
          subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), templateData[key])
          body = body.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), templateData[key])
        })

        setEmailForm(prev => ({
          ...prev,
          to: estimate.signer_email || prev.to || '',
          subject: subject,
          message: body
        }))
      }
    } catch (error) {
      console.error('Error loading email template:', error)
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

  const fetchEstimate = async () => {
    try {
      setLoading(true)
      const response = await estimatesAPI.getById(id)
      if (response.data.success) {
        const data = response.data.data
        setEstimate({
          id: data.id,
          estimate_number: data.estimate_number || `ESTIMATE #${data.id}`,
          client_id: data.client_id,
          client_name: data.client_name || '--',
          project_id: data.project_id,
          project_name: data.project_name || '--',
          estimate_date: data.created_at || data.estimate_date || '',
          valid_till: data.valid_till || '--',
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
          items: data.items || [],
          created_by: data.created_by || null,
          signer_name: data.signer_name || '',
          signer_email: data.signer_email || '',
          custom_fields: data.custom_fields || {},
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
      console.error('Error fetching estimate:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString || dateString === '--') return '--'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount) => {
    let currencyCode = estimate?.currency || 'USD'
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

  const parseTemplateVariables = (content) => {
    if (!content) return ''
    let parsed = content
    const variables = {
      '{ESTIMATE_NUMBER}': estimate?.estimate_number || '',
      '{CLIENT_NAME}': client?.name || estimate?.client_name || 'Client',
      '{PROJECT_NAME}': estimate?.project_name || '',
      '{ESTIMATE_DATE}': formatDate(estimate?.estimate_date),
      '{VALID_UNTIL}': formatDate(estimate?.valid_till),
      '{TOTAL_AMOUNT}': formatCurrency(estimate?.total),
      '{ESTIMATE_URL}': `${window.location.origin}/public/estimates/${estimate?.id}`, // Adjusted URL
      '{COMPANY_NAME}': company?.name || getCompanyInfo()?.name || '',
      // Add common aliases
      '{CONTACT_FIRST_NAME}': (client?.name || '').split(' ')[0],
      '{CONTACT_LAST_NAME}': (client?.name || '').split(' ').slice(1).join(' '),
      '{SIGNATURE}': '', // Can be improved
    }

    Object.keys(variables).forEach(key => {
      const regex = new RegExp(key, 'g')
      parsed = parsed.replace(regex, variables[key])
    })
    return parsed
  }

  const handleTemplateSelect = (e) => {
    const templateId = e.target.value
    const template = emailTemplates.find(t => t.id === parseInt(templateId))
    if (template) {
      setEmailForm(prev => ({
        ...prev,
        template: templateId,
        subject: parseTemplateVariables(template.subject || prev.subject),
        message: parseTemplateVariables(template.content || '')
      }))
    } else {
      setEmailForm(prev => ({ ...prev, template: '' }))
    }
  }

  const isExpired = () => {
    if (!estimate?.valid_till || estimate.valid_till === '--') return false
    const validDate = new Date(estimate.valid_till)
    return validDate < new Date()
  }

  const statusColors = {
    draft: 'bg-gray-500 text-white',
    sent: 'bg-blue-500 text-white',
    accepted: 'bg-green-500 text-white',
    rejected: 'bg-red-500 text-white',
    declined: 'bg-red-500 text-white',
  }

  // Action handlers
  const handlePreview = () => {
    setIsPreviewModalOpen(true)
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
        <title>Estimate ${estimate.estimate_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #fff; color: #333; }
          .estimate-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
          .company-info h1 { font-size: 28px; color: #1a5f4a; margin-bottom: 10px; }
          .company-info p { font-size: 12px; color: #666; line-height: 1.6; }
          .estimate-badge { background: #1a5f4a; color: white; font-size: 18px; font-weight: bold; padding: 10px 20px; border-radius: 4px; }
          .dates { text-align: right; margin-top: 15px; font-size: 13px; color: #666; }
          .dates span { font-weight: 600; color: #333; }
          .estimate-to { margin-bottom: 30px; }
          .estimate-to h3 { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .estimate-to p { font-size: 14px; color: #333; line-height: 1.5; }
          .estimate-to .client-name { font-weight: 600; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f8f9fa; text-align: left; padding: 12px 15px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e9ecef; }
          td { padding: 12px 15px; border-bottom: 1px solid #e9ecef; font-size: 13px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .item-name { font-weight: 500; color: #333; }
          .item-desc { font-size: 11px; color: #888; margin-top: 3px; }
          .totals { margin-top: 30px; margin-left: auto; width: 300px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
          .totals-row.total { font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 12px; margin-top: 8px; color: #1a5f4a; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e9ecef; }
          .footer p { font-size: 11px; color: #888; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="estimate-header">
          <div class="company-info">
            <h1>${companyName}</h1>
            <p>${companyAddress}</p>
            ${companyPhone ? `<p>Phone: ${companyPhone}</p>` : ''}
            ${companyEmail ? `<p>Email: ${companyEmail}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <div class="estimate-badge">${estimate.estimate_number}</div>
            <div class="dates">
              <p>Estimate Date: <span>${formatDate(estimate.estimate_date)}</span></p>
              <p>Valid Until: <span>${formatDate(estimate.valid_till)}</span></p>
            </div>
          </div>
        </div>
        
        <div class="estimate-to">
          <h3>Estimate To</h3>
          <p class="client-name">${client?.company_name || client?.name || estimate.client_name}</p>
          ${client?.address ? `<p>${client.address}</p>` : ''}
          ${client?.city ? `<p>${client.city}, ${client?.country || ''}</p>` : ''}
          ${client?.email ? `<p>${client.email}</p>` : ''}
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
            ${(estimate.items || []).map(item => `
              <tr>
                <td>
                  <div class="item-name">${item.item_name || 'Item'}</div>
                  ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
                </td>
                <td class="text-center">${item.quantity || 0} ${item.unit || 'PC'}</td>
                <td class="text-right">${formatCurrency(item.unit_price || 0)}</td>
                <td class="text-right">${formatCurrency(item.amount || (item.quantity * item.unit_price) || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span>Sub Total:</span>
            <span>${formatCurrency(estimate.sub_total)}</span>
          </div>
          ${estimate.discount_amount > 0 ? `
            <div class="totals-row">
              <span>Discount:</span>
              <span>-${formatCurrency(estimate.discount_amount)}</span>
            </div>
          ` : ''}
          ${estimate.tax_amount > 0 ? `
            <div class="totals-row">
              <span>Tax:</span>
              <span>${formatCurrency(estimate.tax_amount)}</span>
            </div>
          ` : ''}
          <div class="totals-row total">
            <span>Total:</span>
            <span>${formatCurrency(estimate.total)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for considering our estimate!</p>
        </div>
      </body>
      </html>
    `
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(generatePDFContent())
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
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

  const handleSendEmail = async () => {
    try {
      if (!emailForm.to) {
        alert('To email is required')
        return
      }
      setSendingEmail(true)
      const response = await estimatesAPI.send(id, {
        to: emailForm.to,
        cc: emailForm.cc,
        bcc: emailForm.bcc,
        subject: emailForm.subject,
        message: emailForm.message
      })
      if (response.data.success) {
        alert('Email sent successfully!')
        setIsSendEmailModalOpen(false)
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

  const handleAddItem = async () => {
    try {
      const itemData = {
        ...newItem,
        amount: newItem.quantity * newItem.unit_price
      }
      const updatedItems = [...(estimate.items || []), itemData]
      const response = await estimatesAPI.update(id, { items: updatedItems })
      if (response.data.success) {
        await fetchEstimate()
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
      const updatedItems = [...(estimate.items || []), itemData]
      const response = await estimatesAPI.update(id, { items: updatedItems })
      if (response.data.success) {
        await fetchEstimate()
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
      const updatedItems = (estimate.items || []).map((item, idx) =>
        idx === editingItem.index ? { ...editingItem, amount: editingItem.quantity * editingItem.unit_price } : item
      )
      const response = await estimatesAPI.update(id, { items: updatedItems })
      if (response.data.success) {
        await fetchEstimate()
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
      const updatedItems = (estimate.items || []).filter((_, idx) => idx !== index)
      const response = await estimatesAPI.update(id, { items: updatedItems })
      if (response.data.success) {
        await fetchEstimate()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  const handleUpdateDiscount = async () => {
    try {
      const response = await estimatesAPI.update(id, { discount: discountValue })
      if (response.data.success) {
        await fetchEstimate()
        setIsEditDiscountModalOpen(false)
      }
    } catch (error) {
      console.error('Error updating discount:', error)
      alert('Failed to update discount')
    }
  }

  const handleSaveNote = async () => {
    try {
      const response = await estimatesAPI.update(id, { note })
      if (response.data.success) {
        await fetchEstimate()
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading estimate details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (!estimate) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Estimate Not Found</h2>
          <p className="text-gray-600 mb-4">The estimate you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => navigate('/app/admin/estimates')}>
            <IoArrowBack className="mr-2" />
            Back to Estimates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Premium Header with Glassmorphism */}
      <div className="bg-white border-b border-gray-200 p-6 sm:p-8 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/app/admin/estimates')}
              className="p-3 bg-white/50 hover:bg-white rounded-2xl transition-all shadow-soft border border-gray-100 text-gray-600 active:scale-95"
            >
              <IoArrowBack size={20} />
            </button>
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary-accent flex items-center justify-center text-white font-black text-2xl">
                  <IoDocumentText size={32} />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${estimate.status === 'accepted' ? 'bg-green-500' : (estimate.status === 'declined' ? 'bg-red-500' : 'bg-gray-400')}`}></div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">
                  Estimate #{estimate.estimate_number.replace('ESTIMATE #', '')}
                </h1>
                <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 font-medium">
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[estimate.status] || statusColors.draft} text-white`}>
                    {estimate.status}
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="flex items-center gap-1.5"><IoCalendar size={16} className="text-gray-400" />{formatDate(estimate.estimate_date)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                const url = `${window.location.origin}/estimate/${id}`
                navigator.clipboard.writeText(url)
                alert('Estimate URL copied!')
              }}
              className="flex items-center gap-2 rounded-2xl font-bold border-gray-200 hover:bg-gray-50 bg-white"
            >
              <IoLink size={18} /> Public URL
            </Button>
            <Button
              onClick={() => setIsSendEmailModalOpen(true)}
              size="md"
              className="flex items-center gap-2 rounded-2xl font-bold bg-primary-accent hover:bg-primary-accent/90"
            >
              <IoMail size={22} className="mr-1" /> Send Email
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex gap-6 p-6">
        {/* Left Column - Main Content (70%) */}
        <div className="flex-1 lg:col-span-8">
          <Card className="p-8 border border-gray-100 shadow-sm bg-white rounded-2xl transition-all duration-300">
            {/* Company Info Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12 pb-8 border-b border-gray-50">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-xl bg-primary-accent/10 flex items-center justify-center text-primary-accent border border-primary-accent/5">
                  <IoBusiness size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                    {company?.name || getCompanyInfo()?.name || 'Developo'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-500 font-medium">
                    {company?.address && <p className="flex items-center gap-2"><IoLocation className="text-gray-300" />{company.address}</p>}
                    {company?.email && <p className="flex items-center gap-2"><IoMail className="text-gray-300" />{company.email}</p>}
                    {company?.phone && <p className="flex items-center gap-2"><IoCall className="text-gray-300" />{company.phone}</p>}
                    {company?.website && <p className="flex items-center gap-2"><IoGlobe className="text-gray-300" />{company.website.replace(/^https?:\/\//, '')}</p>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block bg-primary-accent/10 text-primary-accent font-black text-xl px-6 py-3 rounded-xl border border-primary-accent/10 mb-4 uppercase tracking-widest">
                  {estimate.estimate_number}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 uppercase font-black tracking-widest">Valid Until</p>
                  <p className={`text-base font-black ${isExpired() ? 'text-red-500' : 'text-gray-900'}`}>
                    {formatDate(estimate.valid_till)} {isExpired() && '(Expired)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Estimate To Section */}
            <div className="mb-12 bg-gray-50 p-8 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-8">
              <div className="flex-1 w-full">
                <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-[0.2em]">Estimate To</h3>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                    <IoPerson size={22} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-gray-900">{estimate.client_name}</p>
                    <div className="text-sm text-gray-500 font-medium space-y-1 mt-1">
                      {estimate.signer_email && <p className="flex items-center gap-2"><IoMail size={14} className="text-gray-300" />{estimate.signer_email}</p>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
                <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-[0.2em] w-full text-center sm:text-right">Total Amount</h3>
                <div className="text-4xl font-black text-primary-accent tracking-tighter">
                  {formatCurrency(estimate.total)}
                </div>
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
                    <th className="text-right p-3 text-sm font-semibold text-gray-600">Total</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.items && estimate.items.length > 0 ? (
                    estimate.items.map((item, idx) => (
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
                          {formatCurrency(item.unit_price || 0)}
                        </td>
                        <td className="p-3 text-right font-semibold text-gray-800">
                          {formatCurrency(item.amount || (item.quantity * item.unit_price) || 0)}
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
                      <td colSpan={5} className="p-8 text-center text-gray-400 italic">
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
                    <span className="text-gray-800">{formatCurrency(estimate.sub_total)}</span>
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
                      {estimate.discount_type === '%'
                        ? `${estimate.discount}%`
                        : formatCurrency(estimate.discount_amount || 0)}
                    </span>
                  </div>
                  {estimate.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tax:</span>
                      <span className="text-gray-800">{formatCurrency(estimate.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-800">Total:</span>
                    <span className="text-primary-accent">{formatCurrency(estimate.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            {estimate.description && (
              <div className="mt-8 border-t pt-6 overflow-hidden">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">DESCRIPTION</h3>
                <div className="text-gray-700 prose max-w-full break-words overflow-wrap-anywhere text-sm"
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  dangerouslySetInnerHTML={{ __html: estimate.description }} />
              </div>
            )}

            {/* Terms Section */}
            {estimate.terms && (
              <div className="mt-6 border-t pt-6 overflow-hidden">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">TERMS & CONDITIONS</h3>
                <div className="text-gray-700 prose max-w-full break-words overflow-wrap-anywhere text-sm"
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  dangerouslySetInnerHTML={{ __html: estimate.terms }} />
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          {/* Estimate Info Card */}
          <Card className="p-6 border-none shadow-premium bg-white rounded-[24px] group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <IoDocumentText className="text-gray-500" size={18} />
                Estimate info
              </h3>
              <button className="text-gray-400 hover:text-gray-600">
                <IoEllipsisVertical size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-accent/10 flex items-center justify-center text-primary-accent text-sm font-bold">
                  {(client?.name || estimate.client_name || 'C').substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm text-primary-accent hover:underline cursor-pointer">
                  {client?.name || estimate.client_name}
                </span>
              </div>
              {estimate.project_name && estimate.project_name !== '--' && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-accent/10 flex items-center justify-center text-primary-accent">
                    <IoBriefcase size={14} />
                  </div>
                  <span className="text-sm text-gray-700">{estimate.project_name}</span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                <p className="flex justify-between py-1">
                  <span>Estimate date:</span>
                  <span className="font-medium">{formatDate(estimate.estimate_date)}</span>
                </p>
                <p className="flex justify-between py-1">
                  <span>Valid until:</span>
                  <span className={`font-medium ${isExpired() ? 'text-red-500' : ''}`}>
                    {formatDate(estimate.valid_till)} {isExpired() && '(Expired)'}
                  </span>
                </p>
                <p className="flex justify-between py-1">
                  <span>Total:</span>
                  <span className="font-medium text-primary-accent">{formatCurrency(estimate.total)}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons Grid */}
          <Card className="p-6 border-none shadow-premium bg-white rounded-[24px]">
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
          </Card>

          {/* Estimate URL Section */}
          <Card className="p-6 border-none shadow-premium bg-white rounded-[24px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <IoLink className="text-gray-500" size={18} />
                Estimate URL
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/estimate/${id}`}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600 truncate"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/estimate/${id}`)
                  alert('URL copied!')
                }}
                className="p-2 text-primary-accent hover:bg-main-bg rounded-lg"
                title="Copy URL"
              >
                <IoCopy size={18} />
              </button>
            </div>
          </Card>

          {/* Signer Info Card */}
          <Card className="p-6 border-none shadow-premium bg-white rounded-[24px]">
            <div className="flex items-center gap-2 mb-3">
              <IoCreateOutline className="text-gray-500" size={18} />
              <h3 className="font-semibold text-gray-800">Signer Info</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase">Name</p>
                <p className="font-medium text-gray-800">{estimate.signer_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Email</p>
                <p className="text-sm text-gray-600">{estimate.signer_email || '-'}</p>
              </div>
            </div>
          </Card>

          {/* Custom Fields Card */}
          {customFields.length > 0 && (
            <Card className="p-6 border-none shadow-premium bg-white rounded-[24px]">
              <div className="flex items-center gap-2 mb-3">
                <IoList className="text-gray-500" size={18} />
                <h3 className="font-semibold text-gray-800">Additional Information</h3>
              </div>
              <div className="space-y-3">
                {customFields.map((field) => {
                  const value = estimate.custom_fields?.[field.name]
                  if (!value && value !== 0) return null
                  return (
                    <div key={field.id}>
                      <p className="text-xs text-gray-500 uppercase">{field.label}</p>
                      <p className="font-medium text-gray-800 break-words">
                        {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                      </p>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Tasks Card */}
          <Card className="p-6 border-none shadow-premium bg-white rounded-[24px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <IoCheckmarkCircle className="text-gray-500" size={18} />
                Tasks
              </h3>
              <button
                onClick={() => setIsAddTaskModalOpen(true)}
                className="flex items-center gap-1 text-sm text-primary-accent hover:opacity-80"
              >
                <IoAdd size={16} /> Add task
              </button>
            </div>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No tasks yet</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border border-gray-300"></div>
                      <span className="text-sm text-gray-700">{task.title}</span>
                    </div>
                    <button onClick={() => handleDeleteTask(task.id)} className="text-red-400 hover:text-red-500">
                      <IoClose size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Reminders Card */}
          <Card className="p-6 border-none shadow-premium bg-white rounded-[24px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <IoTime className="text-gray-500" size={18} />
                Reminders
              </h3>
              <button
                onClick={() => setIsAddReminderModalOpen(true)}
                className="flex items-center gap-1 text-sm text-primary-accent hover:opacity-80"
              >
                <IoAdd size={16} /> Add reminder
              </button>
            </div>
            <div className="space-y-2">
              {reminders.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No reminders yet</p>
              ) : (
                reminders.map(reminder => (
                  <div key={reminder.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{reminder.title}</span>
                      {reminder.remind_at && (
                        <p className="text-xs text-gray-500">{new Date(reminder.remind_at).toLocaleString()}</p>
                      )}
                    </div>
                    <button onClick={() => handleDeleteReminder(reminder.id)} className="text-red-400 hover:text-red-500">
                      <IoClose size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Note Section */}
          <Card className="p-6 border-none shadow-premium bg-white rounded-[24px]">
            <div className="flex items-center gap-2 mb-3">
              <IoDocumentText className="text-gray-500" size={18} />
              <h3 className="font-semibold text-gray-800">Private Note</h3>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleSaveNote}
              placeholder="Add a private note only you can see..."
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent outline-none transition-all resize-none text-gray-600 placeholder:text-gray-400 min-h-[100px]"
            />
          </Card>
        </div>
      </div>

      {/* Modals */}

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Estimate Preview"
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
                {estimate.estimate_number}
              </div>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p>Estimate Date: <span className="font-medium text-gray-800">{formatDate(estimate.estimate_date)}</span></p>
                <p>Valid Until: <span className={`font-medium ${isExpired() ? 'text-red-500' : 'text-gray-800'}`}>{formatDate(estimate.valid_till)}</span></p>
              </div>
            </div>
          </div>

          {/* Estimate To */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Estimate To</h3>
            <p className="font-semibold text-gray-800">{client?.company_name || client?.name || estimate.client_name}</p>
            {client?.address && <p className="text-sm text-gray-600">{client.address}</p>}
            {client?.city && <p className="text-sm text-gray-600">{client.city}, {client?.country || ''}</p>}
            {client?.email && <p className="text-sm text-gray-600">{client.email}</p>}
          </div>

          {/* Items Table */}
          {estimate.items && estimate.items.length > 0 && (
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
                {estimate.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3">
                      <p className="font-medium text-gray-800">{item.item_name || 'Item'}</p>
                      {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    </td>
                    <td className="p-3 text-center text-gray-600">{item.quantity || 0} {item.unit || 'PC'}</td>
                    <td className="p-3 text-right text-gray-600">{formatCurrency(item.unit_price || 0)}</td>
                    <td className="p-3 text-right font-medium text-gray-800">{formatCurrency(item.amount || (item.quantity * item.unit_price) || 0)}</td>
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
                <span className="text-gray-800">{formatCurrency(estimate.sub_total)}</span>
              </div>
              {estimate.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount:</span>
                  <span className="text-gray-800">-{formatCurrency(estimate.discount_amount)}</span>
                </div>
              )}
              {estimate.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax:</span>
                  <span className="text-gray-800">{formatCurrency(estimate.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t text-primary-accent">
                <span>Total:</span>
                <span>{formatCurrency(estimate.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            Thank you for considering our estimate!
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
      {/* Send Email Modal */}
      <Modal
        isOpen={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        title="Send to client"
        size="lg"
      >
        <div className="space-y-4">
          {/* Template Selection */}
          {emailTemplates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
              <select
                value={emailForm.template}
                onChange={handleTemplateSelect}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none transition-all"
              >
                <option value="">Select a template...</option>
                {emailTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* To, CC, BCC */}
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="To"
              value={emailForm.to}
              onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
              placeholder="Client email"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="CC"
                value={emailForm.cc}
                onChange={(e) => setEmailForm({ ...emailForm, cc: e.target.value })}
                placeholder="CC"
              />
              <Input
                label="BCC"
                value={emailForm.bcc}
                onChange={(e) => setEmailForm({ ...emailForm, bcc: e.target.value })}
                placeholder="BCC"
              />
            </div>
          </div>

          {/* Subject */}
          <Input
            label="Subject"
            value={emailForm.subject}
            onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
            placeholder="Email subject"
          />

          {/* Message Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <RichTextEditor
              value={emailForm.message}
              onChange={(content) => setEmailForm({ ...emailForm, message: content })}
              placeholder="Enter email message..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setIsSendEmailModalOpen(false)}
              className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              disabled={sendingEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 flex items-center gap-2"
              disabled={sendingEmail}
            >
              {sendingEmail ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <IoMailOutline size={18} />
                  Send Email
                </>
              )}
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
                      <p className="font-bold text-gray-900">{formatCurrency(item.rate || item.price || item.unit_price || 0)}</p>
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
        title="Edit Line Item"
      >
        {editingItem && (
          <div className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Item Name"
                value={editingItem.item_name}
                onChange={(e) => setEditingItem({ ...editingItem, item_name: e.target.value })}
                className="bg-white border-gray-200 text-slate-700"
              />
              <div className="w-full">
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500/50 outline-none transition-all resize-none text-slate-700 placeholder:text-slate-300"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  value={editingItem.quantity}
                  onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 0 })}
                  className="bg-white border-gray-200"
                />
                <Input
                  label="Unit"
                  value={editingItem.unit}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                  className="bg-white border-gray-200"
                />
                <Input
                  label="Rate"
                  type="number"
                  value={editingItem.unit_price}
                  onChange={(e) => setEditingItem({ ...editingItem, unit_price: parseFloat(e.target.value) || 0 })}
                  className="bg-white border-gray-200"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditItemModalOpen(false)} className="flex-1 bg-white border-gray-200 text-slate-500 hover:bg-gray-50">
                Cancel
              </Button>
              <Button onClick={handleEditItem} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 font-bold">
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
        title="Adjust Discount"
      >
        <div className="space-y-6">
          <Input
            label={`Discount Amount (${estimate.discount_type})`}
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
            className="bg-white border-gray-200 text-slate-700"
          />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditDiscountModalOpen(false)} className="flex-1 bg-white border-gray-200 text-slate-500 hover:bg-gray-50">
              Cancel
            </Button>
            <Button onClick={handleUpdateDiscount} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/20 font-bold">
              Apply Discount
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
        relatedToType="client"
        relatedToId={estimate?.client_id}
        companyId={companyId}
      />

      {/* Add Reminder Modal */}
      <Modal
        isOpen={isAddReminderModalOpen}
        onClose={() => setIsAddReminderModalOpen(false)}
        title="Set Reminder"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <Input
              label="Reminder Title"
              value={newReminder.title}
              onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
              placeholder="Remind me to..."
              className="bg-white border-gray-200 text-slate-700"
            />
            <Input
              label="Remind At"
              type="datetime-local"
              value={newReminder.remind_at}
              onChange={(e) => setNewReminder({ ...newReminder, remind_at: e.target.value })}
              className="bg-white border-gray-200 text-slate-700"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAddReminderModalOpen(false)} className="flex-1 bg-white border-gray-200 text-slate-500 hover:bg-gray-50">
              Cancel
            </Button>
            <Button onClick={handleAddReminder} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20 font-bold">
              Set Reminder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EstimateDetail
