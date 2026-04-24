/**
 * Email Templates Settings Page
 * Layout: App Settings Sidebar | Email Categories Sidebar | Template Editor
 * Route: /app/admin/settings/email-templates
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import { useLanguage } from '../../../context/LanguageContext.jsx'
import { emailTemplatesAPI } from '../../../api'
import { toast } from 'react-hot-toast'
import {
  IoChevronDown,
  IoChevronForward,
  IoMail,
  IoSave,
  IoRefresh,
  IoCheckmarkCircle,
  IoSettingsOutline,
  IoArrowUndo,
  IoArrowRedo,
  IoLink,
  IoImage,
  IoCode,
  IoRemove,
  IoClose,
  IoColorPalette,
  IoSettings,
  IoLanguage,
  IoDocumentText,
  IoNotifications,
  IoCloudUpload,
  IoPeople,
  IoLockClosed,
  IoShieldCheckmark,
  IoCart,
  IoBuild,
} from 'react-icons/io5'

/**
 * Get default contract template
 */
function getDefaultContractTemplate() {
  return `
<div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0;">
  <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">CONTRACT #{CONTRACT_ID}</h1>
</div>
<div style="padding: 30px; background: #fff;">
  <p style="color: #333; line-height: 1.6;">Hello {CONTACT_FIRST_NAME},</p>
  <p style="color: #333; line-height: 1.6;">{t('auto.auto_79564e01') || 'Here is a contract for you.'}</p>
  <p style="margin: 20px 0;">
    <a href="{PUBLIC_CONTRACT_URL}" style="display: inline-block; background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">{t('auto.auto_b5e8acd7') || 'Show Contract'}</a>
  </p>
  <p style="color: #666; font-size: 14px;">Public URL: {PUBLIC_CONTRACT_URL}</p>
  <p style="color: #333; margin-top: 30px;">{SIGNATURE}</p>
</div>
  `.trim()
}


// Email Template Categories
const EMAIL_TEMPLATE_CATEGORIES = [
  {
    id: 'account',
    label: 'Account',
    templates: [
      { key: 'account_created', label: 'Account created' },
      { key: 'password_reset', label: 'Password reset' },
      { key: 'email_verification', label: 'Email verification' },
    ],
  },
  {
    id: 'announcement',
    label: 'Announcement',
    templates: [
      { key: 'new_announcement', label: 'New announcement' },
    ],
  },
  {
    id: 'common',
    label: 'Common',
    templates: [
      { key: 'general_notification', label: 'General notification' },
    ],
  },
  {
    id: 'contract',
    label: 'Contract',
    templates: [
      { key: 'contract_sent', label: 'Contract sent' },
      { key: 'contract_accepted', label: 'Contract accepted' },
      { key: 'contract_rejected', label: 'Contract rejected' },
    ],
  },
  {
    id: 'estimate',
    label: 'Estimate',
    templates: [
      { key: 'estimate_sent', label: 'Estimate sent' },
      { key: 'estimate_accepted', label: 'Estimate accepted' },
      { key: 'estimate_rejected', label: 'Estimate rejected' },
      { key: 'estimate_request_received', label: 'Estimate request received' },
      { key: 'estimate_commented', label: 'Estimate commented' },
    ],
  },
  {
    id: 'event',
    label: 'Event',
    templates: [
      { key: 'upcoming_event', label: 'Upcoming event' },
    ],
  },
  {
    id: 'invoice',
    label: 'Invoice',
    templates: [
      { key: 'send_invoice', label: 'Send invoice' },
      { key: 'invoice_payment_confirmation', label: 'Invoice payment confirmation' },
      { key: 'invoice_due_reminder', label: 'Invoice due reminder before due date' },
      { key: 'invoice_overdue_reminder', label: 'Invoice overdue reminder' },
      { key: 'recurring_invoice_creation', label: 'Recurring invoice creation reminder' },
      { key: 'invoice_manual_payment', label: 'Invoice manual payment added' },
      { key: 'send_credit_note', label: 'Send credit note' },
    ],
  },
  {
    id: 'message',
    label: 'Message',
    templates: [
      { key: 'message_received', label: 'Message received' },
    ],
  },
  {
    id: 'order',
    label: 'Order',
    templates: [
      { key: 'new_order_received', label: 'New order received' },
      { key: 'order_status_updated', label: 'Order status updated' },
    ],
  },
  {
    id: 'project',
    label: 'Project',
    templates: [
      { key: 'project_completed', label: 'Project completed' },
      { key: 'project_task_deadline', label: 'Project task deadline reminder' },
    ],
  },
  {
    id: 'proposal',
    label: 'Proposal',
    templates: [
      { key: 'proposal_sent', label: 'Proposal sent' },
      { key: 'proposal_accepted', label: 'Proposal accepted' },
      { key: 'proposal_rejected', label: 'Proposal rejected' },
      { key: 'proposal_commented', label: 'Proposal commented' },
    ],
  },
  {
    id: 'reminder',
    label: 'Reminder',
    templates: [
      { key: 'upcoming_reminder', label: 'Upcoming reminder' },
    ],
  },
  {
    id: 'subscription',
    label: 'Subscription',
    templates: [
      { key: 'subscription_request_sent', label: 'Subscription request sent' },
      { key: 'subscription_started', label: 'Subscription started' },
      { key: 'subscription_cancelled', label: 'Subscription cancelled' },
      { key: 'subscription_invoice_cron', label: 'Subscription invoice created via Cron Job' },
      { key: 'subscription_renewal_reminder', label: 'Subscription renewal reminder' },
    ],
  },
  {
    id: 'task',
    label: 'Task',
    templates: [
      { key: 'task_commented', label: 'Task commented' },
      { key: 'task_assigned', label: 'Task assigned' },
      { key: 'task_general', label: 'Task general' },
    ],
  },
  {
    id: 'ticket',
    label: 'Ticket',
    templates: [
      { key: 'ticket_created', label: 'Ticket created' },
      { key: 'ticket_commented', label: 'Ticket commented' },
      { key: 'ticket_closed', label: 'Ticket closed' },
      { key: 'ticket_reopened', label: 'Ticket reopened' },
    ],
  },
]

// Available variables by category
const AVAILABLE_VARIABLES = {
  contract: [
    '{CONTACT_FIRST_NAME}', '{CONTACT_LAST_NAME}', '{CONTRACT_ID}', '{CONTRACT_URL}',
    '{PUBLIC_CONTRACT_URL}', '{PROJECT_TITLE}', '{SIGNATURE}', '{LOGO_URL}', '{RECIPIENTS_EMAIL_ADDRESS}'
  ],
  estimate: [
    '{CONTACT_FIRST_NAME}', '{CONTACT_LAST_NAME}', '{ESTIMATE_ID}', '{ESTIMATE_URL}',
    '{ESTIMATE_AMOUNT}', '{PROJECT_TITLE}', '{SIGNATURE}', '{LOGO_URL}'
  ],
  invoice: [
    '{CONTACT_FIRST_NAME}', '{CONTACT_LAST_NAME}', '{INVOICE_ID}', '{INVOICE_URL}',
    '{INVOICE_AMOUNT}', '{DUE_DATE}', '{PAYMENT_URL}', '{SIGNATURE}', '{LOGO_URL}'
  ],
  project: [
    '{CONTACT_FIRST_NAME}', '{PROJECT_TITLE}', '{PROJECT_URL}', '{DEADLINE}', '{SIGNATURE}', '{LOGO_URL}'
  ],
  task: [
    '{CONTACT_FIRST_NAME}', '{TASK_TITLE}', '{TASK_URL}', '{ASSIGNEE}', '{DEADLINE}', '{SIGNATURE}', '{LOGO_URL}'
  ],
  proposal: [
    '{CONTACT_FIRST_NAME}', '{PROPOSAL_TITLE}', '{PROPOSAL_URL}', '{PROPOSAL_AMOUNT}', '{SIGNATURE}', '{LOGO_URL}'
  ],
  ticket: [
    '{CONTACT_FIRST_NAME}', '{TICKET_ID}', '{TICKET_SUBJECT}', '{TICKET_URL}', '{SIGNATURE}', '{LOGO_URL}'
  ],
  subscription: [
    '{CONTACT_FIRST_NAME}', '{SUBSCRIPTION_NAME}', '{SUBSCRIPTION_AMOUNT}', '{RENEWAL_DATE}', '{SIGNATURE}', '{LOGO_URL}'
  ],
  default: [
    '{CONTACT_FIRST_NAME}', '{CONTACT_LAST_NAME}', '{COMPANY_NAME}', '{SIGNATURE}', '{LOGO_URL}'
  ]
}

const EmailTemplatesSettings = () => {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const editorRef = useRef(null)
  const isDark = theme.mode === 'dark'

  // Settings sidebar state
  const [activeSection, setActiveSection] = useState('app-settings')
  const [activeSubMenu, setActiveSubMenu] = useState('email-templates')
  const [expandedSections, setExpandedSections] = useState({
    'app-settings': true,
    'access-permission': false,
    'client-portal': false,
    'sales-prospects': false,
    'setup': false
  })

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Settings menu items
  const menuItems = [
    {
      id: 'app-settings',
      label: t('settings.app_settings'),
      icon: IoSettings,
      children: [
        { id: 'general', label: t('settings.general'), icon: IoSettings },
        { id: 'localization', label: t('settings.localization'), icon: IoLanguage },
        { id: 'email', label: t('settings.email'), icon: IoMail },
        { id: 'email-templates', label: t('settings.email_templates'), icon: IoDocumentText },
        { id: 'notifications', label: t('settings.notifications'), icon: IoNotifications },
        { id: 'updates', label: t('settings.updates'), icon: IoCloudUpload },
      ]
    },
    {
      id: 'access-permission',
      label: t('settings.access_permission'),
      icon: IoLockClosed,
      children: [
        { id: 'access-permission', label: t('settings.roles_permissions'), icon: IoShieldCheckmark },
      ]
    },
    {
      id: 'client-portal',
      label: t('settings.client_portal'),
      icon: IoPeople,
      children: [
        { id: 'client-portal', label: t('settings.portal_settings'), icon: IoPeople },
      ]
    },
    {
      id: 'sales-prospects',
      label: t('settings.sales_prospects'),
      icon: IoCart,
      children: [
        { id: 'sales-prospects', label: t('settings.pipeline_settings'), icon: IoCart },
      ]
    },
    {
      id: 'setup',
      label: t('settings.setup'),
      icon: IoBuild,
      children: [
        { id: 'setup', label: t('settings.system_setup'), icon: IoBuild },
      ]
    }
  ]

  // State
  const [expandedCategories, setExpandedCategories] = useState({ contract: true })
  const [selectedTemplate, setSelectedTemplate] = useState({ key: 'contract_sent', label: 'Contract sent', category: 'contract' })
  const [templates, setTemplates] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSourceCode, setShowSourceCode] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#000000')

  // Form state - initialize with default template
  const [formData, setFormData] = useState({
    subject: 'Contract sent',
    body: getDefaultContractTemplate(),
  })

  // Update editor content when switching templates or loading from DB
  useEffect(() => {
    // Add a small delay to ensure the editor is mounted
    const timer = setTimeout(() => {
      if (editorRef.current && !showSourceCode) {
        const newContent = formData.body || ''
        if (editorRef.current.innerHTML !== newContent) {
          editorRef.current.innerHTML = newContent
        }
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [selectedTemplate.key, showSourceCode, formData.body])

  // Get company_id
  const getCompanyId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.company_id || localStorage.getItem('company_id') || 1
  }

  /**
   * Fetch all email templates
   */
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const companyId = getCompanyId()
      const response = await emailTemplatesAPI.getAll({ company_id: companyId })

      if (response.data?.success) {
        const templatesMap = {}
        response.data.data.forEach(template => {
          // Use template_key if available, fallback to type for backward compatibility
          const key = template.template_key || template.type
          if (key) {
            templatesMap[key] = template
          }
        })
        setTemplates(templatesMap)

        // Load selected template if exists
        if (templatesMap['contract_sent']) {
          setFormData({
            subject: templatesMap['contract_sent'].subject || 'Contract sent',
            body: templatesMap['contract_sent'].body || getDefaultContractTemplate(),
          })
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])


  /**
   * Toggle category expansion
   */
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  /**
   * Select a template for editing
   */
  const handleSelectTemplate = (templateKey, templateLabel, categoryId) => {
    setSelectedTemplate({
      key: templateKey,
      label: templateLabel,
      category: categoryId,
    })

    // Load existing template data or set defaults
    const existingTemplate = templates[templateKey]
    if (existingTemplate) {
      setFormData({
        subject: existingTemplate.subject || templateLabel,
        body: existingTemplate.body || getDefaultTemplate(templateKey, templateLabel),
      })
    } else {
      setFormData({
        subject: templateLabel,
        body: getDefaultTemplate(templateKey, templateLabel),
      })
    }
    setShowSourceCode(false)
  }

  /**
   * Execute editor command
   */
  const execCommand = (command, value = null) => {
    if (!editorRef.current) return

    // Focus the editor first
    editorRef.current.focus()

    // Execute the command
    document.execCommand(command, false, value)

    // Update the formData state with the new content
    setTimeout(() => {
      if (editorRef.current) {
        setFormData(prev => ({ ...prev, body: editorRef.current.innerHTML }))
      }
    }, 10)
  }

  /**
   * Insert link
   */
  const insertLink = () => {
    if (!editorRef.current) return

    const url = prompt('Enter URL:')
    if (url) {
      const text = window.getSelection()?.toString() || url
      const linkHTML = `<a href="${url}" style="color: #17a2b8; text-decoration: underline;">${text}</a>`
      execCommand('insertHTML', linkHTML)
    }
  }

  /**
   * Insert image
   */
  const insertImage = () => {
    if (!editorRef.current) return

    // Create a temporary file input
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')

    input.onchange = async () => {
      const file = input.files[0]
      if (file) {
        // Convert to Base64
        const reader = new FileReader()
        reader.onload = (e) => {
          const imgHTML = `<img src="${e.target.result}" style="max-width: 100%; height: auto; display: block; margin: 10px 0;" alt="Image" />`
          execCommand('insertHTML', imgHTML)
        }
        reader.readAsDataURL(file)
      }
    }

    input.click()
  }

  /**
   * Insert table
   */
  const insertTable = () => {
    if (!editorRef.current) return

    const rows = prompt('Number of rows:', '3')
    const cols = prompt('Number of columns:', '3')
    if (rows && cols) {
      let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">'
      for (let i = 0; i < parseInt(rows); i++) {
        tableHTML += '<tr>'
        for (let j = 0; j < parseInt(cols); j++) {
          tableHTML += '<td style="padding: 8px; border: 1px solid #ddd; min-width: 50px;">' + (t('') || '') + '</td>'
        }
        tableHTML += '</tr>'
      }
      tableHTML += '</table><br>'
      execCommand('insertHTML', tableHTML)
    }
  }

  /**
   * Apply text color
   */
  const applyTextColor = (color) => {
    execCommand('foreColor', color)
    setShowColorPicker(false)
  }

  /**
   * Insert merge tag
   */
  const insertMergeTag = (tag) => {
    if (!editorRef.current) return

    const tagHTML = `<span style="background: #e3f2fd; padding: 2px 6px; border-radius: 3px; font-family: monospace; color: #1976d2;">{${tag}}</span>&nbsp;`
    execCommand('insertHTML', tagHTML)
  }

  /**
   * Save template
   */
  const handleSave = async () => {
    if (!selectedTemplate) return

    // Get content from editor
    const content = showSourceCode ? formData.body : (editorRef.current?.innerHTML || formData.body || '')

    try {
      setSaving(true)
      const companyId = getCompanyId()

      const templateData = {
        company_id: parseInt(companyId),
        name: selectedTemplate.label,
        type: selectedTemplate.key, // Keep for backward compatibility
        template_key: selectedTemplate.key, // New field
        category: selectedTemplate.category, // Category from EMAIL_TEMPLATE_CATEGORIES
        subject: formData.subject,
        body: content,
        is_active: true, // Default to active
      }

      const existingTemplate = templates[selectedTemplate.key]

      let response
      if (existingTemplate?.id) {
        response = await emailTemplatesAPI.update(existingTemplate.id, templateData)
      } else {
        response = await emailTemplatesAPI.create(templateData)
      }

      if (response.data?.success) {
        toast.success('Template saved successfully!')
        setFormData(prev => ({ ...prev, body: content }))
        await fetchTemplates()
      } else {
        toast.error(response.data?.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Restore to default
   */
  const handleRestoreDefault = () => {
    if (selectedTemplate) {
      const defaultBody = getDefaultTemplate(selectedTemplate.key, selectedTemplate.label)
      setFormData({
        subject: selectedTemplate?.label || 'Contract sent',
        body: defaultBody,
      })
      if (editorRef.current && defaultBody) {
        editorRef.current.innerHTML = defaultBody
      }
      toast.success('Template restored to default')
    }
  }

  /**
   * Toggle source code view
   */
  const toggleSourceCode = () => {
    if (showSourceCode) {
      // Switching from source to visual - update editor
      if (editorRef.current && formData.body) {
        editorRef.current.innerHTML = formData.body
      }
    } else {
      // Switching from visual to source - get editor content
      if (editorRef.current && editorRef.current.innerHTML) {
        setFormData(prev => ({ ...prev, body: editorRef.current.innerHTML }))
      }
    }
    setShowSourceCode(!showSourceCode)
  }

  /**
   * Get available variables for current template
   */
  const getVariables = () => {
    if (!selectedTemplate) return AVAILABLE_VARIABLES.default
    return AVAILABLE_VARIABLES[selectedTemplate.category] || AVAILABLE_VARIABLES.default
  }

  // Color palette
  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff',
    '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff',
    '#9900ff', '#ff00ff', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3',
    '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc',
  ]

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-4 sm:-m-6">
      {/* App Settings Sidebar */}
      <div
        className="w-full lg:w-64 flex-shrink-0 border-r overflow-y-auto bg-white rounded-lg shadow-sm border border-gray-200 relative"
        style={{
          backgroundColor: isDark ? '#1F2937' : '#ffffff',
          borderColor: isDark ? '#374151' : '#E5E7EB',
          zIndex: 40
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
          <h2 className="font-semibold text-primary-text">{t('settings.title')}</h2>
        </div>
        <nav className="p-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.children.length > 0) {
                    toggleSection(item.id)
                  } else {
                    setActiveSection(item.id)
                    setActiveSubMenu(item.id)
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors mb-1 ${activeSection === item.id
                  ? 'bg-primary-accent/10 text-primary-accent'
                  : 'text-primary-text hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <item.icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.children.length > 0 && (
                  expandedSections[item.id] ? <IoChevronDown size={16} /> : <IoChevronForward size={16} />
                )}
              </button>

              {item.children.length > 0 && expandedSections[item.id] && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => {
                        setActiveSection(item.id)
                        setActiveSubMenu(child.id)
                        if (child.id === 'email-templates') {
                          // Stay on current page
                        } else if (child.id === 'notifications') {
                          navigate('/app/admin/settings/notifications')
                        } else {
                          navigate('/app/admin/settings')
                        }
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${activeSubMenu === child.id
                        ? 'bg-primary-accent text-white'
                        : 'text-secondary-text hover:bg-gray-50'
                        }`}
                    >
                      <child.icon size={16} />
                      <span>{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Email Templates Categories Sidebar */}
      <div
        className="w-52 flex-shrink-0 border-r overflow-y-auto"
        style={{
          backgroundColor: isDark ? '#1F2937' : '#ffffff',
          borderColor: isDark ? '#374151' : '#E5E7EB',
        }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
          <h3 className="font-medium text-primary-text">{t('settings.email_templates') || 'Email templates'}</h3>
        </div>

        <div className="py-1">
          {EMAIL_TEMPLATE_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories[category.id]
            const hasSelectedChild = selectedTemplate?.category === category.id

            return (
              <div key={category.id}>
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  style={{
                    backgroundColor: hasSelectedChild && !isExpanded
                      ? (isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)')
                      : 'transparent',
                  }}
                >
                  <span
                    className="text-sm"
                    style={{ color: isDark ? '#E5E7EB' : '#374151' }}
                  >
                    {category.label}
                  </span>
                  {isExpanded ? (
                    <IoChevronDown size={14} style={{ color: isDark ? '#9CA3AF' : '#6B7280' }} />
                  ) : (
                    <IoChevronForward size={14} style={{ color: isDark ? '#9CA3AF' : '#6B7280' }} />
                  )}
                </button>

                {isExpanded && (
                  <div className="py-1">
                    {category.templates.map((template) => {
                      const isSelected = selectedTemplate?.key === template.key

                      return (
                        <button
                          key={template.key}
                          onClick={() => handleSelectTemplate(template.key, template.label, category.id)}
                          className="w-full text-left pl-8 pr-4 py-2 text-sm transition-colors"
                          style={{
                            backgroundColor: isSelected
                              ? (isDark ? 'rgba(33, 126, 69, 0.15)' : 'rgba(33, 126, 69, 0.08)')
                              : 'transparent',
                            color: isSelected
                              ? 'var(--color-primary-accent, #217E45)'
                              : (isDark ? '#9CA3AF' : '#6B7280'),
                          }}
                        >
                          {template.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content - Template Editor */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: isDark ? '#111827' : '#F9FAFB' }}>
        {selectedTemplate ? (
          <>
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-3 border-b"
              style={{
                backgroundColor: isDark ? '#1F2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#E5E7EB',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-primary-text font-medium">{t('') || ''}</span>
                <IoChevronDown size={14} className="text-gray-400" />
              </div>
              <button className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100 transition-colors">
                <span className="text-lg text-gray-400">⊕</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div
                className="rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: isDark ? '#1F2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                }}
              >
                {/* Template Title */}
                <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
                  <IoMail className="text-gray-400" size={18} />
                  <span className="font-medium text-primary-text">{selectedTemplate.label}</span>
                </div>

                {/* Subject Field */}
                <div className="px-4 py-3 border-b" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full text-sm font-medium text-primary-text bg-transparent outline-none"
                    placeholder="Email subject..."
                  />
                </div>

                {/* Toolbar */}
                <div
                  className="flex items-center gap-0.5 px-2 py-2 border-b flex-wrap"
                  style={{
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                    backgroundColor: isDark ? '#374151' : '#F9FAFB',
                  }}
                >
                  {/* Undo */}
                  <button
                    onClick={() => execCommand('undo')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Undo"
                  >
                    <IoArrowUndo size={16} />
                  </button>

                  {/* Bold */}
                  <button
                    onClick={() => execCommand('bold')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors font-bold"
                    title="Bold"
                  >
                    B
                  </button>

                  {/* Italic */}
                  <button
                    onClick={() => execCommand('italic')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors italic"
                    title="Italic"
                  >
                    I
                  </button>

                  {/* Underline */}
                  <button
                    onClick={() => execCommand('underline')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors underline"
                    title="Underline"
                  >
                    U
                  </button>

                  {/* Strikethrough */}
                  <button
                    onClick={() => execCommand('strikeThrough')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors line-through"
                    title="Strikethrough"
                  >
                    S
                  </button>

                  {/* Text Color */}
                  <div className="relative">
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors text-red-500 font-bold"
                      title="Text Color"
                    >
                      A
                    </button>
                    {showColorPicker && (
                      <div
                        className="absolute top-full left-0 mt-1 p-2 rounded-lg shadow-lg z-50 grid grid-cols-6 gap-1"
                        style={{ backgroundColor: isDark ? '#1F2937' : '#ffffff' }}
                      >
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => applyTextColor(color)}
                            className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-px h-6 bg-gray-300 mx-1"></div>

                  {/* Bullet List */}
                  <button
                    onClick={() => execCommand('insertUnorderedList')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Bullet List"
                  >
                    •≡
                  </button>

                  {/* Numbered List */}
                  <button
                    onClick={() => execCommand('insertOrderedList')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Numbered List"
                  >
                    1≡
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-1"></div>

                  {/* Alignment */}
                  <button
                    onClick={() => execCommand('justifyLeft')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Align Left"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M0 2h16v2H0V2zm0 4h10v2H0V6zm0 4h16v2H0v-2zm0 4h10v2H0v-2z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => execCommand('justifyCenter')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Align Center"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M0 2h16v2H0V2zm3 4h10v2H3V6zm-3 4h16v2H0v-2zm3 4h10v2H3v-2z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => execCommand('justifyRight')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Align Right"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M0 2h16v2H0V2zm6 4h10v2H6V6zm-6 4h16v2H0v-2zm6 4h10v2H6v-2z" />
                    </svg>
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-1"></div>

                  {/* Table */}
                  <button
                    onClick={insertTable}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Insert Table"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M0 2h16v12H0V2zm1 1v3h4V3H1zm5 0v3h4V3H6zm5 0v3h4V3h-4zM1 7v3h4V7H1zm5 0v3h4V7H6zm5 0v3h4V7h-4zM1 11v2h4v-2H1zm5 0v2h4v-2H6zm5 0v2h4v-2h-4z" />
                    </svg>
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-1"></div>

                  {/* Link */}
                  <button
                    onClick={insertLink}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Insert Link"
                  >
                    <IoLink size={16} />
                  </button>

                  {/* Horizontal Line */}
                  <button
                    onClick={() => execCommand('insertHorizontalRule')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Horizontal Line"
                  >
                    —
                  </button>

                  {/* Image */}
                  <button
                    onClick={insertImage}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Insert Image"
                  >
                    <IoImage size={16} />
                  </button>

                  {/* Clear Formatting */}
                  <button
                    onClick={() => execCommand('removeFormat')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Clear Formatting"
                  >
                    <IoClose size={16} />
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-1"></div>

                  {/* Text Color */}
                  <div className="relative">
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Text Color"
                    >
                      <IoColorPalette size={16} />
                    </button>

                    {showColorPicker && (
                      <div
                        className="absolute top-full left-0 mt-1 p-3 rounded shadow-lg z-50"
                        style={{
                          backgroundColor: isDark ? '#1F2937' : '#ffffff',
                          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                        }}
                      >
                        <div className="grid grid-cols-6 gap-1">
                          {colors.map((color) => (
                            <button
                              key={color}
                              onClick={() => applyTextColor(color)}
                              className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                              style={{
                                backgroundColor: color,
                                border: '1px solid #ccc'
                              }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Source Code */}
                  <button
                    onClick={toggleSourceCode}
                    className={`p-2 hover:bg-gray-200 rounded transition-colors ${showSourceCode ? 'bg-gray-300' : ''}`}
                    title="View Source Code"
                  >
                    <IoCode size={16} />
                  </button>
                </div>

                {/* Editor Content */}
                {showSourceCode ? (
                  <textarea
                    value={formData.body || ''}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    className="w-full min-h-[400px] p-4 font-mono text-sm outline-none resize-none"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      color: isDark ? '#E5E7EB' : '#1F2937',
                    }}
                  />
                ) : formData.body ? (
                  <div
                    key={selectedTemplate.key}
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="min-h-[400px] p-4 outline-none overflow-auto"
                    style={{
                      color: isDark ? '#E5E7EB' : '#1F2937',
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '4px',
                      lineHeight: '1.6',
                      fontSize: '14px',
                    }}
                    onInput={(e) => {
                      if (e.currentTarget) {
                        const content = e.currentTarget.innerHTML
                        setFormData(prev => ({ ...prev, body: content }))
                      }
                    }}
                    onPaste={(e) => {
                      // Allow paste but clean up formatting
                      e.preventDefault()
                      const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain')
                      document.execCommand('insertHTML', false, text)
                    }}
                  />
                ) : (
                  <div className="min-h-[400px] p-4 flex items-center justify-center text-secondary-text">
                    Loading template...
                  </div>
                )}
              </div>

              {/* Available Variables */}
              <div className="mt-4 p-3 rounded" style={{ backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }}>
                <div className="text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                  Available Variables (Click to insert):
                </div>
                <div className="flex flex-wrap gap-2">
                  {getVariables().map((variable) => (
                    <button
                      key={variable}
                      onClick={() => insertMergeTag(variable)}
                      className="px-3 py-1 rounded text-xs font-medium transition-all hover:shadow-md"
                      style={{
                        backgroundColor: isDark ? '#374151' : '#E0E7FF',
                        color: isDark ? '#93C5FD' : '#3B82F6',
                        border: `1px solid ${isDark ? '#4B5563' : '#BFDBFE'}`,
                      }}
                      title={`Click to insert {${variable}}`}
                    >
                      {`{${variable}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded text-white font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#17a2b8' }}
                >
                  <IoCheckmarkCircle size={18} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleRestoreDefault}
                  className="flex items-center gap-2 px-5 py-2.5 rounded text-white font-medium transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#e74c3c' }}
                >
                  <IoRefresh size={18} />
                  Restore to default
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-secondary-text">{t('auto.auto_280cd410') || 'Select a template to edit'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Get default template by type
 */
function getDefaultTemplate(key, label) {
  const templates = {
    contract_sent: getDefaultContractTemplate(),
    contract_accepted: `
<div style="padding: 30px;">
  <h2 style="color: #27ae60;">{t('auto.auto_4a790384') || 'Contract Accepted'}</h2>
  <p>Hello {CONTACT_FIRST_NAME},</p>
  <p>Great news! Your contract #{CONTRACT_ID} has been accepted.</p>
  <p>{SIGNATURE}</p>
</div>
    `.trim(),
    contract_rejected: `
<div style="padding: 30px;">
  <h2 style="color: #e74c3c;">{t('auto.auto_17c45184') || 'Contract Rejected'}</h2>
  <p>Hello {CONTACT_FIRST_NAME},</p>
  <p>Unfortunately, contract #{CONTRACT_ID} has been rejected.</p>
  <p>{SIGNATURE}</p>
</div>
    `.trim(),
    send_invoice: `
<div style="padding: 30px;">
  <h2 style="color: #3498db;">Invoice #{INVOICE_ID}</h2>
  <p>Hello {CONTACT_FIRST_NAME},</p>
  <p>Please find attached your invoice for {INVOICE_AMOUNT}.</p>
  <p>Due Date: {DUE_DATE}</p>
  <p><a href="{PAYMENT_URL}" style="display: inline-block; background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">{t('auto.auto_1b498eaa') || 'Pay Now'}</a></p>
  <p>{SIGNATURE}</p>
</div>
    `.trim(),
    proposal_sent: `
<div style="padding: 30px;">
  <h2 style="color: #9b59b6;">Proposal: {PROPOSAL_TITLE}</h2>
  <p>Hello {CONTACT_FIRST_NAME},</p>
  <p>{t('auto.auto_ea45fc10') || 'We are pleased to present our proposal for your consideration.'}</p>
  <p>Amount: {PROPOSAL_AMOUNT}</p>
  <p><a href="{PROPOSAL_URL}" style="display: inline-block; background: #9b59b6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">$" + (t('auto.auto_3ea46477') || "View Proposal") + "</a></p>
  <p>{SIGNATURE}</p>
</div>
    `.trim(),
  }

  return templates[key] || `
<div style="padding: 30px;">
  <h2 style="color: #333;">${label}</h2>
  <p>Hello {CONTACT_FIRST_NAME},</p>
  <p>This is a notification regarding ${label.toLowerCase()}.</p>
  <p>{SIGNATURE}</p>
</div>
  `.trim()
}

export default EmailTemplatesSettings
