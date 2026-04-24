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
  IoLockClosed,
  IoShieldCheckmark,
  IoCart,
  IoBuild,
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

  const handleMenuClick = (item, child) => {
    if (child) {
      if (child.id === 'notifications') {
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
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({})

  const getCompanyId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.company_id || localStorage.getItem('company_id') || 1
  }

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const companyId = getCompanyId()
      const params = { company_id: companyId }
      if (selectedCategory && selectedCategory !== '') params.category = selectedCategory
      if (searchTerm) params.search = searchTerm
      const response = await notificationSettingsAPI.getAll(params)
      if (response.data?.success) setNotifications(response.data.data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notification settings')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchTerm])

  const fetchCategories = useCallback(async () => {
    try {
      const companyId = getCompanyId()
      const response = await notificationSettingsAPI.getCategories({ company_id: companyId })
      if (response.data?.success) setCategories(response.data.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchNotifications()
  }, [fetchCategories, fetchNotifications])

  const handleToggle = async (notificationId, field, currentValue) => {
    try {
      setSaving(prev => ({ ...prev, [notificationId]: field }))
      const companyId = getCompanyId()
      const response = await notificationSettingsAPI.update(notificationId, { [field]: !currentValue }, { company_id: companyId })
      if (response.data?.success) {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, [field]: !currentValue } : n))
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

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const category = notification.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(notification)
    return acc
  }, {})

  useEffect(() => {
    if (selectedCategory && selectedCategory !== '') setExpandedCategories({ [selectedCategory]: true })
    else setExpandedCategories({})
  }, [selectedCategory])

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)]">
      <div className="w-full lg:w-64 bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto flex-shrink-0 relative" style={{ zIndex: 40 }}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-primary-text">{t('settings.title')}</h2>
        </div>
        <nav className="p-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.children.length > 0) toggleSection(item.id)
                  else { setActiveSection(item.id); setActiveSubMenu(item.id) }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors mb-1 ${activeSection === item.id ? 'bg-primary-accent/10 text-primary-accent' : 'text-primary-text hover:bg-gray-100'}`}
              >
                <div className="flex items-center gap-2">
                  <item.icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.children.length > 0 && (expandedSections[item.id] ? <IoChevronDown size={16} /> : <IoChevronForward size={16} />)}
              </button>
              {item.children.length > 0 && expandedSections[item.id] && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => {
                        setActiveSection(item.id); setActiveSubMenu(child.id)
                        if (child.id === 'notifications') {}
                        else if (child.id === 'email-templates') navigate('/app/admin/settings/email-templates')
                        else navigate('/app/admin/settings')
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${activeSubMenu === child.id ? 'bg-primary-accent text-white' : 'text-secondary-text hover:bg-gray-50'}`}
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

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
              {t('settings.notifications')}
            </h2>
            <p className="text-sm mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              {t('settings.notifications_desc') || 'Configure email, web, and slack notifications for different events'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded border outline-none appearance-none"
                style={{ backgroundColor: isDark ? '#1F2937' : '#ffffff', borderColor: isDark ? '#374151' : '#E5E7EB', color: isDark ? '#E5E7EB' : '#1F2937' }}
              >
                <option value="">{t('common.all_categories') || 'All Categories'}</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <IoFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text pointer-events-none" size={18} />
              <IoChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-text pointer-events-none" size={18} />
            </div>

            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={t('common.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded border outline-none"
                style={{ backgroundColor: isDark ? '#1F2937' : '#ffffff', borderColor: isDark ? '#374151' : '#E5E7EB', color: isDark ? '#E5E7EB' : '#1F2937' }}
              />
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text" size={18} />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 rounded" style={{ backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }}>
              <p style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>{t('common.no_data_found')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedNotifications).map(([category, categoryNotifications]) => (
                <div key={category} className="rounded overflow-hidden" style={{ backgroundColor: isDark ? '#1F2937' : '#ffffff', border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}` }}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: isDark ? '#111827' : '#F9FAFB', borderBottom: expandedCategories[category] ? `1px solid ${isDark ? '#374151' : '#E5E7EB'}` : 'none' }}
                  >
                    <span className="font-semibold text-lg" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>{category}</span>
                    {expandedCategories[category] ? <IoChevronUp size={20} style={{ color: isDark ? '#E5E7EB' : '#1F2937' }} /> : <IoChevronDown size={20} style={{ color: isDark ? '#E5E7EB' : '#1F2937' }} />}
                  </button>
                  {expandedCategories[category] && (
                    <div>
                      <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 text-sm font-medium" style={{ backgroundColor: isDark ? '#1F2937' : '#ffffff', color: isDark ? '#9CA3AF' : '#6B7280' }}>
                        <div className="col-span-3">{t('common.event')}</div>
                        <div className="col-span-2">{t('common.notify_to')}</div>
                        <div className="col-span-2">{t('common.category')}</div>
                        <div className="col-span-1 text-center">{t('common.email')}</div>
                        <div className="col-span-2 text-center">{t('common.web')}</div>
                        <div className="col-span-2 text-center">{t('common.slack')}</div>
                      </div>
                      <div className="divide-y" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
                        {categoryNotifications.map((notification) => (
                          <div key={notification.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center">
                            <div className="col-span-1 md:col-span-3"><div className="font-medium text-sm" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>{notification.event_name}</div></div>
                            <div className="col-span-1 md:col-span-2"><div className="flex flex-wrap gap-1">{notification.notify_to?.map((recipient, idx) => <span key={idx} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: isDark ? '#3B82F6' : '#DBEAFE', color: isDark ? '#ffffff' : '#1E40AF' }}>{recipient}</span>)}</div></div>
                            <div className="col-span-1 md:col-span-2"><span className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>{notification.category}</span></div>
                            <div className="col-span-1 md:col-span-1 flex justify-center"><button onClick={() => handleToggle(notification.id, 'enable_email', notification.enable_email)} disabled={saving[notification.id] === 'enable_email'} className="disabled:opacity-50">{notification.enable_email ? <IoCheckmarkCircle size={24} className="text-green-500" /> : <IoCloseCircle size={24} className="text-gray-400" />}</button></div>
                            <div className="col-span-1 md:col-span-2 flex justify-center"><button onClick={() => handleToggle(notification.id, 'enable_web', notification.enable_web)} disabled={saving[notification.id] === 'enable_web'} className="disabled:opacity-50">{notification.enable_web ? <IoCheckmarkCircle size={24} className="text-green-500" /> : <IoCloseCircle size={24} className="text-gray-400" />}</button></div>
                            <div className="col-span-1 md:col-span-2 flex justify-center"><button onClick={() => handleToggle(notification.id, 'enable_slack', notification.enable_slack)} disabled={saving[notification.id] === 'enable_slack'} className="disabled:opacity-50">{notification.enable_slack ? <IoCheckmarkCircle size={24} className="text-green-500" /> : <IoCloseCircle size={24} className="text-gray-400" />}</button></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="p-4 rounded text-sm" style={{ backgroundColor: isDark ? '#1F2937' : '#EFF6FF', borderLeft: `4px solid #3B82F6` }}>
            <p className="font-medium mb-1" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>💡 {t('common.info')}</p>
            <ul className="list-disc list-inside space-y-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              <li>{t('settings.notifications_info_1') || 'Email notifications are sent to your verified email addresses'}</li>
              <li>{t('settings.notifications_info_2') || 'Web notifications appear in the top notification bell'}</li>
              <li>{t('settings.notifications_info_3') || 'Slack notifications require the Slack integration to be configured'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings
