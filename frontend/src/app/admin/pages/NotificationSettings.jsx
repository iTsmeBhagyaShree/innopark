/**
 * Notification Settings Page
 * Route: /app/admin/settings/notifications
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import { useLanguage } from '../../../context/LanguageContext.jsx'
import { notificationSettingsAPI } from '../../../api'
import { toast } from 'react-hot-toast'
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoMail,
  IoGlobe,
  IoLogoSlack,
  IoSearch,
  IoFilter,
  IoChevronDown,
  IoChevronUp,
  IoSettings,
  IoLanguage,
  IoDocumentText,
  IoNotifications,
  IoCloudUpload,
  IoPeople,
  IoTime,
  IoCalendar,
  IoLockClosed,
  IoShieldCheckmark,
  IoCart,
  IoBuild,
  IoCube,
  IoChevronForward,
} from 'react-icons/io5'

const NotificationSettings = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme.mode === 'dark'

  // Settings sidebar state
  const [activeSection, setActiveSection] = useState('app-settings')
  const [activeSubMenu, setActiveSubMenu] = useState('notifications')
  const [expandedSections, setExpandedSections] = useState({
    'app-settings': true,
    'hrm': false,
    'access-permission': false,
    'client-portal': false,
    'sales-prospects': false,
    'setup': false,
    'plugins': false
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
      id: 'hrm',
      label: 'HR Settings',
      icon: IoPeople,
      children: [
        { id: 'hrm-attendance', label: 'Attendance Settings', icon: IoTime },
        { id: 'hrm-leaves', label: 'Leave Settings', icon: IoCalendar },
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
    },
    {
      id: 'plugins',
      label: t('settings.plugins'),
      icon: IoCube,
      children: [
        { id: 'plugins', label: t('settings.manage_plugins'), icon: IoCube },
      ]
    }
  ]

  const handleMenuClick = (item, child) => {
    if (child) {
      if (child.id === 'notifications') {
        // Stay on current page
        setActiveSubMenu('notifications')
      } else if (child.path) {
        navigate(child.path)
      } else {
        navigate(`/app/admin/settings?tab=${child.id}`)
      }
    } else {
      if (item.children.length > 0) {
        toggleSection(item.id)
      } else {
        setActiveSection(item.id)
        setActiveSubMenu(item.id)
      }
    }
  }

  // State
  const [notifications, setNotifications] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [selectedCategory, setSelectedCategory] = useState('') // Empty means show all
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({})

  // Get company_id
  const getCompanyId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.company_id || localStorage.getItem('company_id') || 1
  }

  /**
   * Fetch notification settings
   */
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const companyId = getCompanyId()

      const params = {
        company_id: companyId,
      }

      if (selectedCategory && selectedCategory !== '') {
        params.category = selectedCategory
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await notificationSettingsAPI.getAll(params)

      if (response.data?.success) {
        setNotifications(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notification settings')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchTerm])

  /**
   * Fetch categories
   */
  const fetchCategories = useCallback(async () => {
    try {
      const companyId = getCompanyId()
      const response = await notificationSettingsAPI.getCategories({ company_id: companyId })

      if (response.data?.success) {
        setCategories(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchNotifications()
  }, [fetchCategories, fetchNotifications])

  /**
   * Toggle notification channel (email, web, slack)
   */
  const handleToggle = async (notificationId, field, currentValue) => {
    try {
      setSaving(prev => ({ ...prev, [notificationId]: field }))
      const companyId = getCompanyId()

      const updateData = {
        [field]: !currentValue
      }

      const response = await notificationSettingsAPI.update(
        notificationId,
        updateData,
        { company_id: companyId }
      )

      if (response.data?.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, [field]: !currentValue }
              : n
          )
        )
        toast.success('Notification setting updated')
      } else {
        toast.error(response.data?.error || 'Failed to update setting')
      }
    } catch (error) {
      console.error('Error updating notification:', error)
      toast.error('Failed to update notification setting')
    } finally {
      setSaving(prev => {
        const newState = { ...prev }
        delete newState[notificationId]
        return newState
      })
    }
  }

  /**
   * Toggle category expansion
   */
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  /**
   * Group notifications by category
   */
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const category = notification.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(notification)
    return acc
  }, {})

  // Auto-expand selected category
  useEffect(() => {
    if (selectedCategory && selectedCategory !== '') {
      setExpandedCategories({ [selectedCategory]: true })
    } else {
      // When showing all, collapse all by default
      setExpandedCategories({})
    }
  }, [selectedCategory])

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)]">
      {/* Settings Sidebar */}
      <div className="w-full lg:w-64 bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto flex-shrink-0 relative" style={{ zIndex: 40 }}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-primary-text">{t('settings.title')}</h2>
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
                        if (child.id === 'notifications') {
                          // Stay on current page
                        } else if (child.id === 'email-templates') {
                          navigate('/app/admin/settings/email-templates')
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
              Notification Settings
            </h2>
            <p className="text-sm mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              Configure email, web, and slack notifications for different events
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Category Dropdown */}
            <div className="relative w-full sm:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded border outline-none appearance-none"
                style={{
                  backgroundColor: isDark ? '#1F2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                  color: isDark ? '#E5E7EB' : '#1F2937',
                }}
              >
                <option value="">{t('auto.auto_a6a2a55b') || 'All Categories'}</option>
                <option value="Announcement">{t('') || ''}</option>
                <option value="Client">{t('') || ''}</option>
                <option value="Contract">{t('') || ''}</option>
                <option value="Estimate">{t('') || ''}</option>
                <option value="Event">{t('') || ''}</option>
                <option value="Invoice">{t('') || ''}</option>
                <option value="Message">{t('') || ''}</option>
                <option value="Order">{t('') || ''}</option>
                <option value="Project">{t('') || ''}</option>
                <option value="Proposal">{t('') || ''}</option>
                <option value="Reminder">{t('') || ''}</option>
                <option value="Task">{t('') || ''}</option>
                <option value="Ticket">{t('') || ''}</option>
              </select>
              <IoFilter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text pointer-events-none"
                size={18}
              />
              <IoChevronDown
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-text pointer-events-none"
                size={18}
              />
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={t('auto.auto_13348442') || "Search"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded border outline-none"
                style={{
                  backgroundColor: isDark ? '#1F2937' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                  color: isDark ? '#E5E7EB' : '#1F2937',
                }}
              />
              <IoSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text"
                size={18}
              />
            </div>
          </div>

          {/* Notification Table/List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div
              className="text-center py-12 rounded"
              style={{ backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }}
            >
              <p style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                No notifications found
              </p>
            </div>
          ) : (
            // Always show accordion view (filtered by backend when category is selected)
            <div className="space-y-4">
              {Object.entries(groupedNotifications).map(([category, categoryNotifications]) => (
                <div
                  key={category}
                  className="rounded overflow-hidden"
                  style={{
                    backgroundColor: isDark ? '#1F2937' : '#ffffff',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                  }}
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#F9FAFB',
                      borderBottom: expandedCategories[category] ? `1px solid ${isDark ? '#374151' : '#E5E7EB'}` : 'none',
                    }}
                  >
                    <span className="font-semibold text-lg" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
                      {category}
                    </span>
                    {expandedCategories[category] ? (
                      <IoChevronUp size={20} style={{ color: isDark ? '#E5E7EB' : '#1F2937' }} />
                    ) : (
                      <IoChevronDown size={20} style={{ color: isDark ? '#E5E7EB' : '#1F2937' }} />
                    )}
                  </button>

                  {/* Category Notifications */}
                  {expandedCategories[category] && (
                    <div>
                      {/* Table Header - Hidden on mobile */}
                      <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 text-sm font-medium"
                        style={{
                          backgroundColor: isDark ? '#1F2937' : '#ffffff',
                          color: isDark ? '#9CA3AF' : '#6B7280',
                        }}
                      >
                        <div className="col-span-3">{t('auto.auto_a4ecfc70') || 'Event'}</div>
                        <div className="col-span-2">{t('') || ''}</div>
                        <div className="col-span-2">{t('') || ''}</div>
                        <div className="col-span-1 text-center">{t('') || ''}</div>
                        <div className="col-span-2 text-center">{t('') || ''}</div>
                        <div className="col-span-2 text-center">{t('') || ''}</div>
                      </div>

                      {/* Notifications */}
                      <div className="divide-y" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
                        {categoryNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center"
                          >
                            {/* Event Name */}
                            <div className="col-span-1 md:col-span-3">
                              <div className="font-medium text-sm" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
                                {notification.event_name}
                              </div>
                            </div>

                            {/* Notify to */}
                            <div className="col-span-1 md:col-span-2">
                              <div className="flex flex-wrap gap-1">
                                {notification.notify_to && notification.notify_to.length > 0 ? (
                                  notification.notify_to.map((recipient, index) => (
                                    <span
                                      key={index}
                                      className="text-xs px-2 py-1 rounded"
                                      style={{
                                        backgroundColor: isDark ? '#3B82F6' : '#DBEAFE',
                                        color: isDark ? '#ffffff' : '#1E40AF',
                                      }}
                                    >
                                      Team members: {recipient}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                    -
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Category */}
                            <div className="col-span-1 md:col-span-2">
                              <span className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                                {notification.category}
                              </span>
                            </div>

                            {/* Enable Email */}
                            <div className="col-span-1 md:col-span-1 flex justify-center">
                              <button
                                onClick={() => handleToggle(notification.id, 'enable_email', notification.enable_email)}
                                disabled={saving[notification.id] === 'enable_email'}
                                className="disabled:opacity-50"
                              >
                                {notification.enable_email ? (
                                  <IoCheckmarkCircle size={24} className="text-green-500" />
                                ) : (
                                  <IoCloseCircle size={24} className="text-gray-400" />
                                )}
                              </button>
                            </div>

                            {/* Enable Web */}
                            <div className="col-span-1 md:col-span-2 flex justify-center">
                              <button
                                onClick={() => handleToggle(notification.id, 'enable_web', notification.enable_web)}
                                disabled={saving[notification.id] === 'enable_web'}
                                className="disabled:opacity-50"
                              >
                                {notification.enable_web ? (
                                  <IoCheckmarkCircle size={24} className="text-green-500" />
                                ) : (
                                  <IoCloseCircle size={24} className="text-gray-400" />
                                )}
                              </button>
                            </div>

                            {/* Enable Slack */}
                            <div className="col-span-1 md:col-span-2 flex justify-center">
                              <button
                                onClick={() => handleToggle(notification.id, 'enable_slack', notification.enable_slack)}
                                disabled={saving[notification.id] === 'enable_slack'}
                                className="disabled:opacity-50"
                              >
                                {notification.enable_slack ? (
                                  <IoCheckmarkCircle size={24} className="text-green-500" />
                                ) : (
                                  <IoCloseCircle size={24} className="text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div
            className="p-4 rounded text-sm"
            style={{
              backgroundColor: isDark ? '#1F2937' : '#EFF6FF',
              borderLeft: `4px solid #3B82F6`,
            }}
          >
            <p className="font-medium mb-1" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
              💡 Information
            </p>
            <ul className="list-disc list-inside space-y-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              <li>{t('auto.auto_5cd0776d') || "Email notifications will be sent to the specified recipients' email addresses"}</li>
              <li>{t('') || ''}</li>
              <li>{t('') || ''}</li>
              <li>{t('auto.auto_50fd8f22') || 'Changes take effect immediately for all users in your company'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings

