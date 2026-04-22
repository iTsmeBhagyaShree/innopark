import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { proposalsAPI, projectsAPI, itemsAPI, tasksAPI, notificationsAPI, emailTemplatesAPI, contactsAPI, customFieldsAPI } from '../../../api'
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
  IoLink,
  IoSend,
  IoEllipsisVertical,
  IoStorefront,
  IoCheckmark,
  IoAlertCircle,
  IoBookmark,
  IoList,
  IoNotifications,
  IoSettings,
  IoChevronDown,
  IoShareOutline,
  IoTimeOutline,
  IoPerson,
  IoPersonAdd,
  IoUnlink
} from 'react-icons/io5'
import { FaAnchor, FaRegFilePdf, FaPrint, FaDownload, FaEye } from 'react-icons/fa'
import BaseUrl from '../../../api/baseUrl'

const ProposalDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false)
  const [isEditDiscountModalOpen, setIsEditDiscountModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false)
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false)
  const [selectedItemIndex, setSelectedItemIndex] = useState(null)
  const [items, setItems] = useState([])
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [itemCategoryFilter, setItemCategoryFilter] = useState('')
  const [editItemData, setEditItemData] = useState({})
  const [discountData, setDiscountData] = useState({ discount: 0, discount_type: '%' })
  const [taskData, setTaskData] = useState({ title: '', description: '', due_date: '', priority: 'Medium' })
  const [reminderData, setReminderData] = useState({ title: '', description: '', reminder_date: '', reminder_time: '' })
  const [emailData, setEmailData] = useState({ to: '', subject: '', message: '' })
  const [tasks, setTasks] = useState([])
  const [reminders, setReminders] = useState([])
  const [noteContent, setNoteContent] = useState('')
  const [descriptionContent, setDescriptionContent] = useState('')
  const [isLinkContactModalOpen, setIsLinkContactModalOpen] = useState(false)
  const [masterContactsList, setMasterContactsList] = useState([])
  const [linkContactSearch, setLinkContactSearch] = useState('')
  const [linkingContact, setLinkingContact] = useState(false)
  const [customFields, setCustomFields] = useState([])
  const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
  const userId = parseInt(localStorage.getItem('userId') || 1, 10)

  useEffect(() => {
    fetchProposal()
    fetchProposal()
    fetchItems()
    fetchCustomFields()
  }, [id])

  useEffect(() => {
    if (proposal) {
      fetchTasks()
      fetchReminders()
      setNoteContent(proposal.note || '')
      setDescriptionContent(proposal.description || '')
    }
  }, [proposal?.id])

  // Load email template when modal opens
  useEffect(() => {
    if (isSendEmailModalOpen && proposal) {
      loadEmailTemplate()
    }
  }, [isSendEmailModalOpen, proposal])

  // Load master contacts when Link contact modal opens
  useEffect(() => {
    if (isLinkContactModalOpen) {
      setLinkContactSearch('')
      const fetchMaster = async () => {
        try {
          const res = await contactsAPI.getMasterList({ company_id: companyId })
          const list = res?.data?.data ?? (Array.isArray(res?.data) ? res.data : [])
          setMasterContactsList(Array.isArray(list) ? list : [])
        } catch (e) {
          console.error('Error fetching contacts:', e)
          setMasterContactsList([])
        }
      }
      fetchMaster()
    }
  }, [isLinkContactModalOpen, companyId])

  const loadEmailTemplate = async () => {
    try {
      const companyId = localStorage.getItem('companyId') || 1
      // Fetch template by template_key
      const response = await emailTemplatesAPI.getByTemplateKey('proposal_sent', { company_id: companyId })

      if (response.data?.success && response.data.data) {
        const template = response.data.data

        // Build data object for placeholder replacement
        const templateData = {
          PROPOSAL_NUMBER: proposal.estimate_number || proposal.title || `DEAL-${proposal.id}`,
          CONTACT_FIRST_NAME: proposal.client_name?.split(' ')[0] || 'Valued Customer',
          PUBLIC_PROPOSAL_URL: `${window.location.origin}/public/proposals/${proposal.id}`,
          PROPOSAL_AMOUNT: `$${parseFloat(proposal.total || 0).toFixed(2)}`,
          COMPANY_NAME: 'Our Company',
          SIGNATURE: 'Best regards,<br>Your Team'
        }

        // Replace placeholders
        let subject = template.subject || `Deal ${proposal.estimate_number || proposal.title}`
        let body = template.body || ''

        Object.keys(templateData).forEach(key => {
          const placeholder = `{${key}}`
          subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), templateData[key])
          body = body.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), templateData[key])
        })

        setEmailData({
          to: proposal.client_email || '',
          subject: subject,
          message: body
        })
      }
    } catch (error) {
      console.error('Error loading email template:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const params = { company_id: companyId }
      if (proposal?.client_id) params.client_id = proposal.client_id
      if (proposal?.project_id) params.project_id = proposal.project_id
      const response = await tasksAPI.getAll(params)
      if (response.data.success) {
        setTasks((response.data.data || []).slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchReminders = async () => {
    try {
      const response = await notificationsAPI.getAll({
        user_id: userId,
        company_id: companyId,
        type: 'reminder',
        related_entity_type: 'proposal',
        related_entity_id: id
      })
      if (response.data.success) {
        setReminders(response.data.data || [])
      }
    } catch (error) {
      setReminders([])
    }
  }

  const fetchItems = async () => {
    try {
      const params = { company_id: companyId }
      if (itemCategoryFilter) params.category = itemCategoryFilter
      const response = await itemsAPI.getAll(params)
      if (response.data.success) {
        setItems(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const fetchCustomFields = async () => {
    try {
      const res = await customFieldsAPI.getAll({ company_id: companyId, module: 'Proposals' })
      if (res.data?.success) {
        setCustomFields(res.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching custom fields:', error)
    }
  }

  const fetchProposal = async () => {
    try {
      setLoading(true)
      const response = await proposalsAPI.getById(id, { company_id: companyId })
      if (response.data.success) {
        const data = response.data.data
        setProposal({
          id: data.id,
          estimate_number: data.estimate_number || `DEAL #${data.id}`,
          client_id: data.client_id,
          client_name: data.client_name || 'No Client',
          project_id: data.project_id,
          project_name: data.project_name || '',
          proposal_date: data.created_at || data.proposal_date || '',
          valid_till: data.valid_till || '',
          status: data.status || 'draft',
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
          last_email_seen: data.last_email_seen || null,
          last_preview_seen: data.last_preview_seen || null,
          email_sent_at: data.email_sent_at || null,
          signer_name: data.signer_name || '',
          signer_email: data.signer_email || '',
          signer_email: data.signer_email || '',
          linked_contacts: data.linked_contacts || [],
          custom_fields: data.custom_fields || {},
        })
      }
    } catch (error) {
      console.error('Error fetching proposal:', error)
    } finally {
      setLoading(false)
    }
  }

  // Format helpers
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: proposal?.currency || 'USD'
    }).format(amount || 0)
  }

  const isExpired = () => {
    if (!proposal?.valid_till) return false
    return new Date(proposal.valid_till) < new Date()
  }

  const getEmailStatus = () => {
    if (proposal?.last_email_seen) return 'Viewed'
    if (proposal?.email_sent_at) return 'Sent'
    return 'Never'
  }

  // Status colors
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-600 text-white',
      sent: 'bg-green-500 text-white',
      accepted: 'bg-emerald-500 text-white',
      declined: 'bg-red-500 text-white',
      expired: 'bg-red-600 text-white',
    }
    return colors[status] || 'bg-gray-500 text-white'
  }

  // Handlers
  const handleSave = async () => {
    try {
      const response = await proposalsAPI.update(id, {
        note: noteContent,
        description: descriptionContent,
      })
      if (response.data.success) {
        alert('Deal saved successfully!')
        await fetchProposal()
      } else {
        alert(response.data.error || 'Failed to save deal')
      }
    } catch (error) {
      console.error('Error saving proposal:', error)
      alert(error.response?.data?.error || 'Failed to save deal')
    }
  }

  const handleSaveAndShow = async () => {
    await handleSave()
    setIsPreviewModalOpen(true)
  }


  const handleAddItemFromModal = async (item) => {
    try {
      const currentItems = proposal.items || []
      const newItem = {
        item_name: item.title || '',
        description: item.description || '',
        quantity: 1,
        unit: item.unit_type || 'PC',
        unit_price: parseFloat(item.rate || 0),
        tax_rate: 0,
        amount: parseFloat(item.rate || 0)
      }
      const updatedItems = [...currentItems, newItem]

      const response = await proposalsAPI.update(id, {
        items: updatedItems.map(item => ({
          item_name: item.item_name || item.description || '',
          description: item.description || '',
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          tax_rate: parseFloat(item.tax_rate) || 0,
          amount: parseFloat(item.amount) || 0,
        }))
      })

      if (response.data.success) {
        setIsAddItemModalOpen(false)
        await fetchProposal()
      } else {
        alert(response.data.error || 'Failed to add item')
      }
    } catch (error) {
      console.error('Error adding item:', error)
      alert(error.response?.data?.error || 'Failed to add item')
    }
  }

  const handleRemoveItem = async (itemIndex) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return

    try {
      const currentItems = proposal.items || []
      const updatedItems = currentItems.filter((_, index) => index !== itemIndex)

      const response = await proposalsAPI.update(id, {
        items: updatedItems.map(item => ({
          item_name: item.item_name || item.description || '',
          description: item.description || '',
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          tax_rate: parseFloat(item.tax_rate) || 0,
          amount: parseFloat(item.amount) || 0,
        }))
      })

      if (response.data.success) {
        await fetchProposal()
      } else {
        alert(response.data.error || 'Failed to remove item')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      alert(error.response?.data?.error || 'Failed to remove item')
    }
  }

  const handleEditItem = (itemIndex) => {
    const item = proposal.items[itemIndex]
    setSelectedItemIndex(itemIndex)
    setEditItemData({
      item_name: item.item_name || '',
      description: item.description || '',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      tax_rate: item.tax_rate || 0,
      amount: item.amount || 0
    })
    setIsEditItemModalOpen(true)
  }

  const handleUpdateItem = async () => {
    try {
      const currentItems = [...proposal.items]
      const quantity = parseFloat(editItemData.quantity || 0)
      const unitPrice = parseFloat(editItemData.unit_price || 0)
      const taxRate = parseFloat(editItemData.tax_rate || 0)
      let amount = quantity * unitPrice
      if (taxRate > 0) amount += (amount * taxRate / 100)

      currentItems[selectedItemIndex] = {
        ...currentItems[selectedItemIndex],
        item_name: editItemData.item_name,
        description: editItemData.description,
        quantity: quantity,
        unit_price: unitPrice,
        tax_rate: taxRate,
        amount: amount
      }

      const response = await proposalsAPI.update(id, {
        items: currentItems.map(item => ({
          item_name: item.item_name || item.description || '',
          description: item.description || '',
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          tax_rate: parseFloat(item.tax_rate) || 0,
          amount: parseFloat(item.amount) || 0,
        }))
      })

      if (response.data.success) {
        setIsEditItemModalOpen(false)
        setSelectedItemIndex(null)
        await fetchProposal()
      } else {
        alert(response.data.error || 'Failed to update item')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      alert(error.response?.data?.error || 'Failed to update item')
    }
  }

  const handleEditDiscount = () => {
    setDiscountData({
      discount: proposal.discount || 0,
      discount_type: proposal.discount_type || '%'
    })
    setIsEditDiscountModalOpen(true)
  }

  const handleUpdateDiscount = async () => {
    try {
      const subTotal = proposal.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
      const discount = parseFloat(discountData.discount) || 0
      const discountAmount = discountData.discount_type === '%'
        ? (subTotal * discount / 100)
        : discount
      const totalAfterDiscount = subTotal - discountAmount
      const taxAmount = proposal.items.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity || 0)
        const unitPrice = parseFloat(item.unit_price || 0)
        const taxRate = parseFloat(item.tax_rate || 0)
        return sum + (quantity * unitPrice * taxRate / 100)
      }, 0)
      const total = totalAfterDiscount + taxAmount

      const response = await proposalsAPI.update(id, {
        discount: discount,
        discount_type: discountData.discount_type,
        discount_amount: discountAmount,
        sub_total: subTotal,
        tax_amount: taxAmount,
        total: total
      })

      if (response.data.success) {
        setIsEditDiscountModalOpen(false)
        await fetchProposal()
      } else {
        alert(response.data.error || 'Failed to update discount')
      }
    } catch (error) {
      console.error('Error updating discount:', error)
      alert(error.response?.data?.error || 'Failed to update discount')
    }
  }

  const handlePrint = () => {
    if (!proposal) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to print')
      return
    }

    const subtotal = proposal.items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0
    const discountAmount = proposal.discount_type === '%'
      ? (subtotal * (parseFloat(proposal.discount) || 0) / 100)
      : (parseFloat(proposal.discount) || 0)
    const taxAmount = proposal.items?.reduce((sum, item) => {
      const itemAmount = parseFloat(item.amount) || 0
      const taxRate = parseFloat(item.tax_rate) || 0
      return sum + (itemAmount * taxRate / 100)
    }, 0) || 0
    const total = subtotal - discountAmount + taxAmount

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Deal ${proposal.estimate_number || proposal.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .company-info, .client-info { width: 45%; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .text-right { text-align: right; }
          .totals { margin-top: 20px; }
          .totals table { width: 300px; margin-left: auto; }
          .totals td { border: none; padding: 5px 10px; }
          .totals .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #333; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DEAL</h1>
          <p><strong>${proposal.estimate_number || `DEAL#${proposal.id}`}</strong></p>
        </div>
        <div class="info-section">
          <div class="company-info">
            <h3>From:</h3>
            <p><strong>${proposal.company_name || 'Company Name'}</strong></p>
          </div>
          <div class="client-info">
            <h3>To:</h3>
            <p><strong>${proposal.client_name || '-'}</strong></p>
          </div>
        </div>
        <div style="margin-bottom: 20px;">
          <p><strong>Valid Until:</strong> ${formatDate(proposal.valid_till)}</p>
          <p><strong>Status:</strong> ${(proposal.status || 'draft').toUpperCase()}</p>
        </div>
        ${proposal.description ? `<div style="margin-bottom: 20px;"><p>${proposal.description}</p></div>` : ''}
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(proposal.items || []).map(item => `
              <tr>
                <td>${item.item_name || '-'}</td>
                <td>${item.description || '-'}</td>
                <td class="text-right">${item.quantity || 1} ${item.unit || 'PC'}</td>
                <td class="text-right">${formatCurrency(item.unit_price || 0)}</td>
                <td class="text-right">${formatCurrency(item.amount || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <table>
            <tr><td>Sub Total:</td><td class="text-right">${formatCurrency(subtotal)}</td></tr>
            ${discountAmount > 0 ? `<tr><td>Discount:</td><td class="text-right">-${formatCurrency(discountAmount)}</td></tr>` : ''}
            ${taxAmount > 0 ? `<tr><td>Tax:</td><td class="text-right">${formatCurrency(taxAmount)}</td></tr>` : ''}
            <tr class="total-row"><td>Total:</td><td class="text-right">${formatCurrency(total)}</td></tr>
          </table>
        </div>
        ${proposal.terms ? `<div style="margin-top: 30px;"><h3>Terms & Conditions:</h3><p>${proposal.terms}</p></div>` : ''}
      </body>
      </html>
    `
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await proposalsAPI.getPDF(id, { company_id: companyId, download: 1 })
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `proposal-${proposal?.estimate_number || id}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF')
    }
  }

  const handleViewPDF = () => {
    const pdfUrl = `${BaseUrl}/api/v1/proposals/${id}/pdf?company_id=${companyId}`
    window.open(pdfUrl, '_blank')
  }

  const handleAddTask = async () => {
    try {
      if (!taskData.title) {
        alert('Task title is required')
        return
      }

      const taskPayload = {
        company_id: companyId,
        title: taskData.title,
        description: taskData.description || '',
        due_date: taskData.due_date || null,
        priority: taskData.priority || 'Medium',
        status: 'To do',
        project_id: proposal?.project_id || null,
        client_id: proposal?.client_id || null,
        user_id: userId
      }

      const response = await tasksAPI.create(taskPayload, { company_id: companyId })
      if (response.data.success) {
        alert('Task created successfully!')
        setIsAddTaskModalOpen(false)
        setTaskData({ title: '', description: '', due_date: '', priority: 'Medium' })
        await fetchTasks()
      } else {
        alert(response.data.error || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      alert(error.response?.data?.error || 'Failed to create task')
    }
  }

  const handleAddReminder = async () => {
    try {
      if (!reminderData.title) {
        alert('Reminder title is required')
        return
      }

      let reminderMessage = reminderData.description || `Reminder for deal ${proposal?.estimate_number || id}`
      if (reminderData.reminder_date) {
        const reminderDate = formatDate(reminderData.reminder_date)
        const reminderTime = reminderData.reminder_time || ''
        const dateTimeStr = reminderTime ? `${reminderDate} at ${reminderTime}` : reminderDate
        reminderMessage = `${reminderMessage}\n\nDue: ${dateTimeStr}`
      }

      const reminderPayload = {
        company_id: companyId,
        user_id: userId,
        type: 'reminder',
        title: reminderData.title,
        message: reminderMessage,
        related_entity_type: 'proposal',
        related_entity_id: parseInt(id),
        created_by: userId
      }

      const response = await notificationsAPI.create(reminderPayload)
      if (response.data.success) {
        alert('Reminder created successfully!')
        setIsAddReminderModalOpen(false)
        setReminderData({ title: '', description: '', reminder_date: '', reminder_time: '' })
        await fetchReminders()
      } else {
        alert(response.data.error || 'Failed to create reminder')
      }
    } catch (error) {
      console.error('Error creating reminder:', error)
      alert(error.response?.data?.error || 'Failed to create reminder')
    }
  }

  const handleCopyPublicUrl = () => {
    const url = `${window.location.origin}/proposal/${id}/view`
    navigator.clipboard.writeText(url)
    alert('Deal URL copied to clipboard!')
  }

  const handleSendProposalToClient = () => {
    setEmailData({
      ...emailData,
      to: proposal.client_email || '',
      subject: `Deal ${proposal.estimate_number}`,
      message: `Dear ${proposal.client_name},\n\nPlease find the deal ${proposal.estimate_number} for your review.\n\nYou can view it online at: ${window.location.origin}/proposal/${id}/view\n\nBest regards,\n${proposal.company_name}`
    })
    setIsSendEmailModalOpen(true)
  }

  const handleSendEmail = async () => {
    try {
      if (!emailData.to) {
        alert('Recipient email is required')
        return
      }
      const response = await proposalsAPI.sendEmail(id, {
        to: emailData.to,
        subject: emailData.subject,
        message: emailData.message
      })
      if (response.data.success) {
        alert('Deal sent successfully!')
        setIsSendEmailModalOpen(false)
        await fetchProposal()
      } else {
        alert(response.data.error || 'Failed to send deal')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert(error.response?.data?.error || 'Failed to send deal')
    }
  }

  const handleChangeTemplate = () => {
    navigate('/app/admin/finance-templates')
  }

  const linkedContacts = proposal?.linked_contacts || []

  const handleLinkContact = async (contactId) => {
    try {
      setLinkingContact(true)
      const res = await proposalsAPI.addContact(id, { contact_id: contactId, is_primary: 0, role: '' })
      if (res?.data?.success) {
        setIsLinkContactModalOpen(false)
        await fetchProposal()
      } else {
        alert(res?.data?.error || 'Failed to link contact')
      }
    } catch (err) {
      console.error('Error linking contact:', err)
      alert(err?.response?.data?.error || 'Failed to link contact')
    } finally {
      setLinkingContact(false)
    }
  }

  const handleUnlinkContact = async (contactId) => {
    if (!window.confirm('Remove this contact from the deal?')) return
    try {
      await proposalsAPI.removeContact(id, contactId)
      await fetchProposal()
    } catch (err) {
      console.error('Error unlinking contact:', err)
      alert(err?.response?.data?.error || 'Failed to remove contact')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8F9FA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent mx-auto mb-4"></div>
          <p className="text-secondary-text">Loading deal...</p>
        </div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8F9FA]">
        <div className="text-center">
          <IoAlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-secondary-text">Deal not found</p>
          <Button variant="primary" className="mt-4" onClick={() => navigate('/app/admin/proposals')}>
            Back to Deals
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-[1600px] mx-auto">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app/admin/proposals')}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              title="Back"
            >
              <IoArrowBack size={20} />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <FaAnchor className="text-gray-400" size={18} />
                <h1 className="text-xl font-bold text-[#374151]">
                  {proposal.estimate_number}
                </h1>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(isExpired() ? 'expired' : proposal.status)} shadow-sm`}>
                  {isExpired() ? 'Expired' : (proposal.status || 'Draft').toUpperCase()}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <IoMail size={14} />
                  <span>{getEmailStatus()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyPublicUrl}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all bg-white"
            >
              <IoShareOutline size={18} />
              <span>Deal URL</span>
            </button>

            <button
              onClick={handleSendProposalToClient}
              className="flex items-center gap-2 px-4 py-2 bg-primary-accent text-white rounded-md text-sm font-medium hover:opacity-90 transition-all shadow-md"
            >
              <IoSend size={16} />
              <span>Send to client</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-[1600px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT SIDE - ITEMS & EDITOR (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Items Table Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-accent/10 flex items-center justify-center text-primary-accent">
                    <IoList size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-800">Deal items</h3>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <IoChevronDown size={20} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white text-left">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Quantity</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Rate</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total</th>
                      <th className="px-6 py-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {proposal.items && proposal.items.length > 0 ? (
                      proposal.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-primary-accent/5 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <div className="mt-1 cursor-grab text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                <IoEllipsisVertical size={14} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{item.item_name || '-'}</p>
                                {item.description && (
                                  <p className="text-xs text-secondary-text mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-700 font-medium">
                            {item.quantity || 0} {item.unit || 'PC'}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-700">
                            {formatCurrency(item.unit_price || 0)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 border-l border-transparent">
                            {formatCurrency(item.amount || 0)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="p-1.5 text-primary-accent hover:bg-primary-accent/10 rounded"
                                onClick={() => handleEditItem(idx)}
                              >
                                <IoCreate size={16} />
                              </button>
                              <button
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                onClick={() => handleRemoveItem(idx)}
                              >
                                <IoClose size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <IoList size={40} className="text-gray-200" />
                            <p className="text-sm">No items added to this proposal</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="px-6 py-4 bg-white border-t border-gray-50">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <button
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-accent text-white rounded-md text-sm font-medium hover:opacity-90 transition-all self-start shadow-sm"
                  >
                    <IoAdd size={18} />
                    <span>Add item</span>
                  </button>

                  <div className="w-full sm:w-80 space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Sub Total</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(proposal.sub_total)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 group">
                      <span className="flex items-center gap-1">
                        Discount
                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{proposal.discount}{proposal.discount_type}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">-{formatCurrency(proposal.discount_amount)}</span>
                        <button onClick={handleEditDiscount} className="text-primary-accent hover:opacity-80 opacity-0 group-hover:opacity-100 transition-opacity">
                          <IoCreate size={14} />
                        </button>
                      </div>
                    </div>
                    {proposal.tax_amount > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Tax</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(proposal.tax_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
                      <span>Total</span>
                      <span>{formatCurrency(proposal.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Template & Editor Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={handleChangeTemplate}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <IoTimeOutline size={16} />
                    Change template
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 border border-primary-accent text-primary-accent rounded text-sm font-medium hover:bg-primary-accent/5 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleSaveAndShow}
                    className="px-4 py-1.5 bg-primary-accent text-white rounded text-sm font-medium hover:opacity-90 transition-colors shadow-sm"
                  >
                    Save & Show
                  </button>
                </div>
              </div>

              <div className="editor-container border border-gray-200 rounded-lg overflow-hidden">
                <RichTextEditor
                  value={descriptionContent}
                  onChange={setDescriptionContent}
                  placeholder="Type proposal content here..."
                />
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - INFO & ACTIONS (4 cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Proposal Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                    <FaAnchor size={16} />
                  </div>
                  <h3 className="font-semibold text-gray-800">Proposal info</h3>
                </div>
                <IoEllipsisVertical className="text-gray-400 cursor-pointer" />
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                    <IoStorefront size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{proposal.client_name}</span>
                    <span className="text-xs text-gray-500">Client</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Proposal date</span>
                    <span className="text-sm font-semibold text-gray-700">{formatDate(proposal.proposal_date)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Valid until</span>
                    <span className={`text-sm font-semibold ${isExpired() ? 'text-red-500' : 'text-gray-700'}`}>
                      {formatDate(proposal.valid_till)}
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-primary-accent/5 rounded-lg transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-accent/10 text-primary-accent flex items-center justify-center group-hover:bg-primary-accent/20 transition-colors">
                      <FaEye size={14} />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">Preview</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-green-50 rounded-lg transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <FaPrint size={14} />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">Print</span>
                  </button>
                  <button
                    onClick={handleViewPDF}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-red-50 rounded-lg transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                      <FaRegFilePdf size={14} />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">View PDF</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-blue-50 rounded-lg transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <FaDownload size={14} />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">Download PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Fields Card */}
            {customFields.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <IoList size={18} />
                  </div>
                  <h3 className="font-semibold text-gray-800">Additional Information</h3>
                </div>
                <div className="p-6 space-y-4">
                  {customFields.map((field) => {
                    const value = proposal.custom_fields?.[field.name]
                    if (!value && value !== 0) return null
                    return (
                      <div key={field.id}>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{field.label}</p>
                        <p className="text-sm font-medium text-gray-800 break-words">
                          {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                        </p>
                      </div>
                    )
                  })}
                  {customFields.every(f => !proposal.custom_fields?.[f.name]) && (
                    <p className="text-sm text-gray-400 italic">No additional information provided</p>
                  )}
                </div>
              </div>
            )}

            {/* Linked contacts Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <IoPerson size={18} />
                  </div>
                  <h3 className="font-semibold text-gray-800">Linked contacts</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLinkContactModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-accent hover:bg-primary-accent/10 rounded-lg transition-colors"
                >
                  <IoPersonAdd size={16} />
                  <span>Link contact</span>
                </button>
              </div>
              <div className="p-4 space-y-2">
                {linkedContacts.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No contacts linked to this deal. Use &quot;Link contact&quot; to add from your Contacts list.</p>
                ) : (
                  linkedContacts.map((lc) => (
                    <div
                      key={lc.contact_id || lc.id}
                      className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <IoPerson size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{lc.name || lc.contact_name || `Contact #${lc.contact_id || lc.id}`}</p>
                          {lc.email && <p className="text-xs text-gray-500 truncate">{lc.email}</p>}
                          {lc.role && <span className="text-xs text-gray-400">{lc.role}</span>}
                          {lc.is_primary && <span className="ml-1 text-xs font-medium text-primary-accent">Primary</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlinkContact(lc.contact_id || lc.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        title="Remove from deal"
                      >
                        <IoUnlink size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Note Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <IoDocumentText className="text-gray-400" size={18} />
                <h3 className="font-semibold text-gray-800">Note</h3>
              </div>
              <div className="p-6">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Internal notes here..."
                  className="w-full min-h-[100px] border-none focus:ring-0 text-sm p-0 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Reminders / Tasks Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IoNotifications className="text-gray-400" size={18} />
                  <h3 className="font-semibold text-gray-800">Reminders</h3>
                </div>
                <button
                  onClick={() => setIsAddReminderModalOpen(true)}
                  className="text-xs font-bold text-primary-accent hover:opacity-80"
                >
                  + Add reminder
                </button>
              </div>
              <div className="p-4 space-y-3">
                {reminders.length > 0 ? (
                  reminders.map((reminder, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="mt-1 w-2 h-2 rounded-full bg-primary-accent animate-pulse"></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{reminder.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{reminder.message}</p>
                        <span className="text-[10px] text-gray-400 mt-2 block italic">{new Date(reminder.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center text-gray-400 py-4 italic">No reminders set</p>
                )}
              </div>
            </div>

            {/* Tasks Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IoCheckmarkCircle className="text-gray-400" size={18} />
                  <h3 className="font-semibold text-gray-800">Tasks</h3>
                </div>
                <button
                  onClick={() => setIsAddTaskModalOpen(true)}
                  className="text-xs font-bold text-primary-accent hover:opacity-80"
                >
                  + Add task
                </button>
              </div>
              <div className="p-4 space-y-3">
                {tasks.length > 0 ? (
                  tasks.map((task, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-400' : 'bg-blue-400'}`}></div>
                        <span className="text-sm text-gray-700 font-medium">{task.title}</span>
                      </div>
                      <IoChevronDown size={14} className="text-gray-300 -rotate-90" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center text-gray-400 py-4 italic">No tasks found</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* (Modal implementations remain similar but with improved styling in their content) */}

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Select Item to Add"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search items..."
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-lg">
            {items
              .filter(item =>
                (item.title?.toLowerCase().includes((itemSearchQuery || '').toLowerCase())) ||
                (item.description?.toLowerCase().includes((itemSearchQuery || '').toLowerCase()))
              )
              .map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 hover:bg-primary-accent/5 cursor-pointer transition-colors group flex items-center justify-between"
                  onClick={() => handleAddItemFromModal(item)}
                >
                  <div>
                    <h4 className="font-semibold text-gray-800 group-hover:text-primary-accent">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(item.rate)}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{item.unit_type}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={isEditItemModalOpen}
        onClose={() => setIsEditItemModalOpen(false)}
        title="Edit Item"
      >
        <div className="space-y-4">
          <Input
            label="Item Name"
            value={editItemData.item_name}
            onChange={(e) => setEditItemData({ ...editItemData, item_name: e.target.value })}
          />
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg text-sm"
            placeholder="Description"
            rows={3}
            value={editItemData.description}
            onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              value={editItemData.quantity}
              onChange={(e) => {
                const qty = parseFloat(e.target.value) || 0
                const unitPrice = parseFloat(editItemData.unit_price || 0)
                const taxRate = parseFloat(editItemData.tax_rate || 0)
                let amount = qty * unitPrice
                if (taxRate > 0) amount += (amount * taxRate / 100)
                setEditItemData({ ...editItemData, quantity: qty, amount })
              }}
            />
            <Input
              label="Rate"
              type="number"
              value={editItemData.unit_price}
              onChange={(e) => {
                const price = parseFloat(e.target.value) || 0
                const qty = parseFloat(editItemData.quantity || 0)
                const taxRate = parseFloat(editItemData.tax_rate || 0)
                let amount = qty * price
                if (taxRate > 0) amount += (amount * taxRate / 100)
                setEditItemData({ ...editItemData, unit_price: price, amount })
              }}
            />
          </div>
          <Button variant="primary" className="w-full py-3" onClick={handleUpdateItem}>Update Item</Button>
        </div>
      </Modal>

      {/* Discount Modal */}
      <Modal
        isOpen={isEditDiscountModalOpen}
        onClose={() => setIsEditDiscountModalOpen(false)}
        title="Edit Discount"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Discount"
              type="number"
              value={discountData.discount}
              onChange={(e) => setDiscountData({ ...discountData, discount: e.target.value })}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                className="p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                value={discountData.discount_type}
                onChange={(e) => setDiscountData({ ...discountData, discount_type: e.target.value })}
              >
                <option value="%">Percent (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
          </div>
          <Button variant="primary" className="w-full" onClick={handleUpdateDiscount}>Apply Discount</Button>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Proposal Preview"
        size="xl"
      >
        <div className="bg-white p-8 border border-gray-100 shadow-inner rounded-md max-h-[80vh] overflow-y-auto">
          <div className="space-y-8">
            <div className="flex justify-between items-start border-b pb-6">
              <h1 className="text-3xl font-extrabold text-primary-accent uppercase tracking-wider">PROPOSAL</h1>
              <div className="text-right">
                <p className="font-bold text-lg text-gray-900">{proposal.estimate_number}</p>
                <p className="text-gray-500 text-sm">Date: {formatDate(proposal.proposal_date)}</p>
              </div>
            </div>

            <div className="flex justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">From:</h4>
                <p className="font-bold text-gray-900">{proposal.company_name || 'CRM WORKSUITE'}</p>
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">To:</h4>
                <p className="font-bold text-gray-900">{proposal.client_name}</p>
              </div>
            </div>

            <div className="py-4 border-t border-b overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-50">
                    <th className="p-3 text-gray-700 font-semibold">Item</th>
                    <th className="p-3 text-right text-gray-700 font-semibold">Qty</th>
                    <th className="p-3 text-right text-gray-700 font-semibold">Rate</th>
                    <th className="p-3 text-right text-gray-700 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(proposal.items || []).map((item, i) => (
                    <tr key={i}>
                      <td className="p-3">
                        <p className="font-medium text-gray-900">{item.item_name}</p>
                        {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                      </td>
                      <td className="p-3 text-right text-gray-700">{item.quantity} {item.unit}</td>
                      <td className="p-3 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
                      <td className="p-3 text-right font-bold text-gray-900">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-72 space-y-3 pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Sub Total</span>
                  <span className="font-medium text-gray-900">{formatCurrency(proposal.sub_total)}</span>
                </div>
                {proposal.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Discount ({proposal.discount}{proposal.discount_type})</span>
                    <span className="font-medium text-red-500">-{formatCurrency(proposal.discount_amount)}</span>
                  </div>
                )}
                {proposal.tax_amount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax</span>
                    <span className="font-medium text-gray-900">{formatCurrency(proposal.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl pt-3 border-t border-gray-100 text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(proposal.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={() => setIsPreviewModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">Close</button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-primary-accent text-white rounded-md text-sm font-medium hover:opacity-90 transition-colors shadow-sm">
            <IoPrint size={18} />
            <span>Print View</span>
          </button>
        </div>
      </Modal>

      {/* Send Email Modal */}
      <Modal
        isOpen={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        title="Send Proposal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <Input
              type="email"
              placeholder="client@example.com"
              value={emailData.to}
              onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <Input
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-accent focus:border-primary-accent transition-all"
              rows={6}
              value={emailData.message}
              onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setIsSendEmailModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button>
            <button
              onClick={handleSendEmail}
              className="flex items-center gap-2 px-6 py-2 bg-primary-accent text-white rounded-md text-sm font-medium hover:opacity-90 transition-all shadow-md"
            >
              <IoSend size={16} />
              <span>Send Now</span>
            </button>
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
        relatedToType="project"
        relatedToId={proposal?.project_id}
        companyId={companyId}
      />

      {/* Add Reminder Modal */}
      <Modal
        isOpen={isAddReminderModalOpen}
        onClose={() => setIsAddReminderModalOpen(false)}
        title="Add Reminder"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={reminderData.title}
            onChange={(e) => setReminderData({ ...reminderData, title: e.target.value })}
          />
          <div className="flex flex-col gap-1.5 text-sm">
            <label className="font-medium text-gray-700">Message</label>
            <textarea
              className="p-3 border rounded-lg focus:ring-2 focus:ring-primary-accent outline-none border-gray-300"
              rows={3}
              value={reminderData.description}
              onChange={(e) => setReminderData({ ...reminderData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={reminderData.reminder_date}
              onChange={(e) => setReminderData({ ...reminderData, reminder_date: e.target.value })}
            />
            <Input
              label="Time"
              type="time"
              value={reminderData.reminder_time}
              onChange={(e) => setReminderData({ ...reminderData, reminder_time: e.target.value })}
            />
          </div>
          <Button variant="primary" className="w-full py-3" onClick={handleAddReminder}>Set Reminder</Button>
        </div>
      </Modal>

      {/* Link contact to deal Modal */}
      <Modal
        isOpen={isLinkContactModalOpen}
        onClose={() => setIsLinkContactModalOpen(false)}
        title="Link contact to deal"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select a contact from your Contacts list to link to this deal. Linked contacts are the people involved in this opportunity.</p>
          <Input
            placeholder="Search contacts by name or email..."
            value={linkContactSearch}
            onChange={(e) => setLinkContactSearch(e.target.value)}
          />
          <div className="max-h-[320px] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {masterContactsList
              .filter((c) => {
                const q = (linkContactSearch || '').toLowerCase()
                if (!q) return true
                const name = (c.name || c.contact_name || '').toLowerCase()
                const email = (c.email || '').toLowerCase()
                return name.includes(q) || email.includes(q)
              })
              .filter((c) => !linkedContacts.some((lc) => (lc.contact_id || lc.id) === (c.id)))
              .map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <IoPerson size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{contact.name || contact.contact_name || `Contact #${contact.id}`}</p>
                      {contact.email && <p className="text-xs text-gray-500 truncate">{contact.email}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={linkingContact}
                    onClick={() => handleLinkContact(contact.id)}
                    className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-primary-accent border border-primary-accent rounded-lg hover:bg-primary-accent/10 disabled:opacity-50 transition-colors"
                  >
                    {linkingContact ? 'Linking...' : 'Link'}
                  </button>
                </div>
              ))}
            {masterContactsList.filter((c) => {
              const q = (linkContactSearch || '').toLowerCase()
              if (!q) return true
              const name = (c.name || c.contact_name || '').toLowerCase()
              const email = (c.email || '').toLowerCase()
              return name.includes(q) || email.includes(q)
            }).filter((c) => !linkedContacts.some((lc) => (lc.contact_id || lc.id) === (c.id))).length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500">
                  No contacts found. Add contacts from the Contacts tab first, or clear the search.
                </div>
              )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ProposalDetail
