import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { useTheme } from '../../../context/ThemeContext.jsx'
import { useLanguage } from '../../../context/LanguageContext'
import { useSettings } from '../../../context/SettingsContext.jsx'
import { settingsAPI, companiesAPI } from '../../../api'
import BaseUrl from '../../../api/baseUrl'
import ColorPicker from '../../../components/ui/ColorPicker'
import {
  IoSettings,
  IoChevronDown,
  IoChevronForward,
  IoGlobe,
  IoMail,
  IoDocumentText,
  IoGrid,
  IoMenu,
  IoNotifications,
  IoExtensionPuzzle,
  IoRefresh,
  IoColorPalette,
  IoText,
  IoMoon,
  IoSunny,
  IoCheckmarkCircle,
  IoClose,
  IoImage,
  IoColorFill,
  IoDesktop,
  IoPhonePortrait,
  IoLockClosed,
  IoCart,
  IoBuild,
  IoHome,
  IoShieldCheckmark,
  IoCloudUpload,
  IoServer,
  IoLanguage,
  IoCodeWorking,
  IoCalendar,
  IoPrint,
  IoDownload,
  IoTrash,
  IoAdd,
  IoCreate,
  IoEye,
  IoEyeOff,
  IoBusiness,
  IoCall,
  IoGlobeOutline,
  IoLocation,
  IoImageOutline,
  IoSave
} from 'react-icons/io5'
const Settings = () => {
  const navigate = useNavigate()
  const { theme, updateTheme, resetTheme } = useTheme()
  const { changeLanguage, t } = useLanguage()
  const {
    refreshSettings,
    updateCompany,
    updateSettings: updateContextSettings,
    timezoneOptions,
    dateFormatOptions,
    timeFormatOptions,
    currencySymbols,
    logoVersion
  } = useSettings()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })


  // Sidebar menu state
  const [activeSection, setActiveSection] = useState('app-settings')
  const [activeSubMenu, setActiveSubMenu] = useState('general')
  const [expandedSections, setExpandedSections] = useState({
    'app-settings': true,
    'access-permission': false,
    'sales-prospects': false,
    'setup': false
  })

  // Handle auto-navigation for sections that have dedicated pages
  useEffect(() => {
    if (activeSubMenu === 'email-templates') {
      navigate('/app/admin/settings/email-templates')
    } else if (activeSubMenu === 'notifications') {
      navigate('/app/admin/settings/notifications')
    }
  }, [activeSubMenu, navigate])

  // Company Information State
  const [companyInfo, setCompanyInfo] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    logo: ''
  })

  // Settings data state (system settings only)
  const [settings, setSettings] = useState({
    // System Settings
    system_name: 'Developo',
    default_currency: 'EUR',
    default_timezone: 'Europe/Berlin',
    date_format: 'Y-m-d',
    time_format: 'H:i',
    currency_symbol_position: 'before',

    // Localization
    default_language: 'de',

    // Email Settings
    email_from: 'noreply@developo.com',
    email_from_name: 'Developo',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    email_driver: 'smtp',

    // UI Options
    theme_mode: 'light',
    font_family: 'Inter, sans-serif',
    primary_color: '#217E45',
    secondary_color: '#76AF88',
    sidebar_style: 'default',
    top_menu_style: 'default',

    // Top Menu
    top_menu_items: [],
    top_menu_logo: '',
    top_menu_color: '#ffffff',

    // Footer
    footer_text: '© 2024 Developo. All rights reserved.',
    footer_links: [],
    footer_color: '#102D2C',

    // PWA
    pwa_app_name: 'Developo',
    pwa_app_short_name: 'Developo',
    pwa_app_description: 'Developo Application',
    pwa_app_icon: '',
    pwa_app_color: '#217E45',
    pwa_enabled: false,

    // Modules
    module_leads: true,
    module_projects: true,
    module_tasks: true,
    module_invoices: true,
    module_estimates: true,
    module_proposals: true,
    module_payments: true,
    module_expenses: true,
    module_contracts: true,
    module_employees: true,
    module_attendance: true,
    module_hrm: true,
    module_time_tracking: true,
    module_events: true,
    module_departments: true,
    module_positions: true,
    module_messages: true,
    module_tickets: true,
    module_documents: true,
    module_reports: true,

    // Left Menu
    left_menu_items: [],
    left_menu_style: 'default',

    // Notifications
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    notification_sound: true,

    // Integration
    google_calendar_enabled: false,
    google_calendar_client_id: '',
    google_calendar_client_secret: '',
    slack_enabled: false,
    slack_webhook_url: '',
    zapier_enabled: false,
    zapier_api_key: '',

    // Cron Job
    cron_job_enabled: true,
    cron_job_frequency: 'daily',
    cron_job_last_run: null,

    // Updates
    auto_update_enabled: false,
    update_channel: 'stable',
    last_update_check: null,
  })

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  // Fetch settings and company info on mount
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const companyId = localStorage.getItem('companyId') || 1

      // Fetch company info
      try {
        const companyResponse = await companiesAPI.getById(companyId)
        if (companyResponse.data.success && companyResponse.data.data) {
          const company = companyResponse.data.data
          setCompanyInfo({
            id: company.id,
            name: company.name || '',
            email: company.email || '',
            phone: company.phone || '',
            website: company.website || '',
            address: company.address || '',
            logo: company.logo || ''
          })
        }
      } catch (err) {
        console.error('Error fetching company:', err)
      }

      // Fetch settings
      const response = await settingsAPI.get({ company_id: companyId })
      if (response.data.success) {
        const settingsData = response.data.data || []
        const settingsObj = {}

        // Transform settings array to object
        settingsData.forEach(setting => {
          try {
            if (setting.setting_value && (setting.setting_value.startsWith('{') || setting.setting_value.startsWith('['))) {
              settingsObj[setting.setting_key] = JSON.parse(setting.setting_value)
            } else {
              settingsObj[setting.setting_key] = setting.setting_value
            }
          } catch (e) {
            settingsObj[setting.setting_key] = setting.setting_value
          }
        })

        // Update company info from settings if not already set
        if (!companyInfo.name && settingsObj.company_name) {
          setCompanyInfo(prev => ({
            ...prev,
            name: settingsObj.company_name || prev.name,
            email: settingsObj.company_email || prev.email,
            phone: settingsObj.company_phone || prev.phone,
            website: settingsObj.company_website || prev.website,
            address: settingsObj.company_address || prev.address,
            logo: settingsObj.company_logo || prev.logo
          }))
        }

        // Merge with defaults
        setSettings(prev => ({
          ...prev,
          ...settingsObj,
          // Ensure boolean values
          email_notifications: settingsObj.email_notifications === 'true' || settingsObj.email_notifications === true,
          sms_notifications: settingsObj.sms_notifications === 'true' || settingsObj.sms_notifications === true,
          push_notifications: settingsObj.push_notifications === 'true' || settingsObj.push_notifications === true,
          notification_sound: settingsObj.notification_sound === 'true' || settingsObj.notification_sound === true,
          pwa_enabled: settingsObj.pwa_enabled === 'true' || settingsObj.pwa_enabled === true,
          auto_update_enabled: settingsObj.auto_update_enabled === 'true' || settingsObj.auto_update_enabled === true,
          google_calendar_enabled: settingsObj.google_calendar_enabled === 'true' || settingsObj.google_calendar_enabled === true,
          slack_enabled: settingsObj.slack_enabled === 'true' || settingsObj.slack_enabled === true,
          zapier_enabled: settingsObj.zapier_enabled === 'true' || settingsObj.zapier_enabled === true,
          cron_job_enabled: settingsObj.cron_job_enabled === 'true' || settingsObj.cron_job_enabled === true,
          // Module settings
          module_leads: settingsObj.module_leads !== 'false' && settingsObj.module_leads !== false,
          module_projects: settingsObj.module_projects !== 'false' && settingsObj.module_projects !== false,
          module_tasks: settingsObj.module_tasks !== 'false' && settingsObj.module_tasks !== false,
          module_invoices: settingsObj.module_invoices !== 'false' && settingsObj.module_invoices !== false,
          module_estimates: settingsObj.module_estimates !== 'false' && settingsObj.module_estimates !== false,
          module_proposals: settingsObj.module_proposals !== 'false' && settingsObj.module_proposals !== false,
          module_payments: settingsObj.module_payments !== 'false' && settingsObj.module_payments !== false,
          module_expenses: settingsObj.module_expenses !== 'false' && settingsObj.module_expenses !== false,
          module_contracts: settingsObj.module_contracts !== 'false' && settingsObj.module_contracts !== false,
          module_employees: settingsObj.module_employees !== 'false' && settingsObj.module_employees !== false,
          module_attendance: settingsObj.module_attendance !== 'false' && settingsObj.module_attendance !== false,
          module_hrm: settingsObj.module_hrm !== 'false' && settingsObj.module_hrm !== false,
          module_time_tracking: settingsObj.module_time_tracking !== 'false' && settingsObj.module_time_tracking !== false,
          module_events: settingsObj.module_events !== 'false' && settingsObj.module_events !== false,
          module_departments: settingsObj.module_departments !== 'false' && settingsObj.module_departments !== false,
          module_positions: settingsObj.module_positions !== 'false' && settingsObj.module_positions !== false,
          module_messages: settingsObj.module_messages !== 'false' && settingsObj.module_messages !== false,
          module_tickets: settingsObj.module_tickets !== 'false' && settingsObj.module_tickets !== false,
          module_documents: settingsObj.module_documents !== 'false' && settingsObj.module_documents !== false,
          module_reports: settingsObj.module_reports !== 'false' && settingsObj.module_reports !== false,
        }))

        // Load theme settings
        if (settingsObj.theme_mode) {
          updateTheme({ mode: settingsObj.theme_mode })
        }
        if (settingsObj.font_family) {
          updateTheme({ fontFamily: settingsObj.font_family })
        }
        if (settingsObj.primary_color) {
          updateTheme({ primaryAccent: settingsObj.primary_color })
        }
        if (settingsObj.secondary_color) {
          updateTheme({ secondaryAccent: settingsObj.secondary_color })
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      showToast(t('settings.alerts.load_failed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyChange = (field, value) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async (category = null) => {
    try {
      setSaving(true)
      const companyId = localStorage.getItem('companyId') || 1

      // Save company info to companies table
      if (category === 'general' || !category) {
        try {
          await companiesAPI.update(companyId, {
            name: companyInfo.name,
            email: companyInfo.email,
            phone: companyInfo.phone,
            website: companyInfo.website,
            address: companyInfo.address,
            logo: companyInfo.logo
          })
          // Update context
          updateCompany(companyInfo)
        } catch (err) {
          console.error('Error saving company info:', err)
        }
      }

      // Prepare settings to save
      let settingsToSave = []

      // Also save company info to settings table for backwards compatibility
      if (category === 'general' || !category) {
        settingsToSave.push(
          { setting_key: 'company_name', setting_value: String(companyInfo.name || '') },
          { setting_key: 'company_email', setting_value: String(companyInfo.email || '') },
          { setting_key: 'company_phone', setting_value: String(companyInfo.phone || '') },
          { setting_key: 'company_website', setting_value: String(companyInfo.website || '') },
          { setting_key: 'company_address', setting_value: String(companyInfo.address || '') },
          { setting_key: 'company_logo', setting_value: String(companyInfo.logo || '') }
        )
      }

      if (category) {
        const categoryPrefixes = {
          'general': ['system_', 'default_currency', 'default_timezone', 'date_format', 'time_format', 'currency_symbol_position', 'default_language'],
          'localization': ['default_language', 'currency_symbol_position'],
          'email': ['email_', 'smtp_'],
          'ui-options': ['theme_mode', 'font_family', 'primary_color', 'secondary_color', 'sidebar_style', 'top_menu_style'],
          'top-menu': ['top_menu_'],
          'footer': ['footer_'],
          'pwa': ['pwa_'],
          'notifications': ['notification_', 'email_notifications', 'sms_notifications', 'push_notifications'],
          'updates': ['auto_update_', 'update_', 'last_update_']
        }

        const prefixes = categoryPrefixes[category] || []
        Object.keys(settings).forEach(key => {
          if (prefixes.some(prefix => key.startsWith(prefix) || key === prefix)) {
            settingsToSave.push({
              setting_key: key,
              setting_value: typeof settings[key] === 'object' ? JSON.stringify(settings[key]) : String(settings[key])
            })
          }
        })
      } else {
        // Save all settings
        Object.keys(settings).forEach(key => {
          settingsToSave.push({
            setting_key: key,
            setting_value: typeof settings[key] === 'object' ? JSON.stringify(settings[key]) : String(settings[key])
          })
        })
      }

      if (settingsToSave.length === 0) {
        showToast(t('settings.alerts.no_changes'), 'warning')
        return
      }

      // Use bulk update API
      const response = await settingsAPI.bulkUpdate(settingsToSave, { company_id: companyId })

      if (response.data.success) {
        // Apply theme changes immediately
        if (settings.theme_mode) {
          updateTheme({ mode: settings.theme_mode })
        }
        if (settings.primary_color) {
          updateTheme({ primaryAccent: settings.primary_color })
        }
        if (settings.secondary_color) {
          updateTheme({ secondaryAccent: settings.secondary_color })
        }
        if (settings.font_family) {
          updateTheme({ fontFamily: settings.font_family })
        }

        // Refresh global settings context
        await refreshSettings()

        showToast(t('settings.alerts.save_success'), 'success')
      } else {
        showToast(response.data.error || t('settings.alerts.save_failed'), 'error')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast(error.response?.data?.error || error.message || t('settings.alerts.save_failed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast(t('settings.alerts.upload_image_only'), 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(t('settings.alerts.file_too_large'), 'error')
      return
    }

    try {
      setSaving(true)
      const companyId = localStorage.getItem('companyId') || 1

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('logo', file)
      formData.append('setting_key', 'company_logo')
      // Also append company_id directly to FormData for the backend
      formData.append('company_id', companyId)

      // Pass company_id as query param to ensure backend uses correct company
      const response = await settingsAPI.update(formData, {
        params: { company_id: companyId },
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.success) {
        // Get the uploaded file URL from API response
        const logoUrl = response.data.data?.setting_value || `/uploads/${file.name}`

        // Update local state
        setCompanyInfo(prev => ({ ...prev, logo: logoUrl }))

        // Update company in database (ensure companies table is synced)
        await companiesAPI.update(companyId, { logo: logoUrl })

        // Update global context immediately so header refreshes
        updateCompany({ logo: logoUrl })

        // Refresh settings (re-fetches from DB to confirm persistence)
        await refreshSettings()

        showToast(t('settings.alerts.logo_success'), 'success')
      } else {
        showToast(response.data.error || t('settings.alerts.save_failed'), 'error')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      showToast(error.response?.data?.error || t('settings.alerts.logo_upload_failed') || 'Logo-Upload fehlgeschlagen', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const menuItems = [
    {
      id: 'app-settings',
      label: t('settings.app_settings'),
      icon: IoSettings,
      children: [
        { id: 'general', label: t('settings.general_settings_label'), icon: IoSettings },
        { id: 'localization', label: t('settings.localization'), icon: IoLanguage },
        { id: 'email', label: t('settings.email'), icon: IoMail },
        { id: 'email-templates', label: t('settings.email_templates'), icon: IoDocumentText },
        { id: 'notifications', label: t('settings.notifications'), icon: IoNotifications },
        { id: 'updates', label: t('settings.updates_label'), icon: IoCloudUpload },
      ]
    },
    {
      id: 'access-permission',
      label: t('sidebar.access_permission'),
      icon: IoLockClosed,
      children: [
        { id: 'access-permission', label: t('sidebar.access_permission'), icon: IoShieldCheckmark },
      ]
    },

    {
      id: 'setup',
      label: t('sidebar.setup'),
      icon: IoBuild,
      children: [
        { id: 'setup', label: t('sidebar.setup'), icon: IoBuild },
      ]
    }
  ]

  const renderContent = () => {
    switch (activeSubMenu) {
      case 'general':
        return (
          <GeneralSettings
            companyInfo={companyInfo}
            settings={settings}
            handleCompanyChange={handleCompanyChange}
            handleChange={handleChange}
            handleLogoUpload={handleLogoUpload}
            timezoneOptions={timezoneOptions}
            dateFormatOptions={dateFormatOptions}
            timeFormatOptions={timeFormatOptions}
            currencySymbols={currencySymbols}
            logoVersion={logoVersion}
            onLanguageChange={changeLanguage}
          />
        )
      case 'localization':
        return <LocalizationSettings settings={settings} handleChange={handleChange} onLanguageChange={changeLanguage} />
      case 'email':
        return <EmailSettings settings={settings} handleChange={handleChange} />
      case 'email-templates':
      case 'notifications':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-accent mx-auto"></div>
              <p className="mt-2 text-secondary-text">{t('common.loading')}</p>
            </div>
          </div>
        )
      case 'updates':
        return <UpdatesSettings settings={settings} handleChange={handleChange} />
      case 'access-permission':
        return <AccessPermissionSettings settings={settings} handleChange={handleChange} />
      case 'sales-prospects':
        return <SalesProspectsSettings settings={settings} handleChange={handleChange} />
      case 'setup':
        return <SetupSettings settings={settings} handleChange={handleChange} />
      default:
        return (
          <GeneralSettings
            companyInfo={companyInfo}
            settings={settings}
            handleCompanyChange={handleCompanyChange}
            handleChange={handleChange}
            handleLogoUpload={handleLogoUpload}
            timezoneOptions={timezoneOptions}
            dateFormatOptions={dateFormatOptions}
            timeFormatOptions={timeFormatOptions}
            currencySymbols={currencySymbols}
            logoVersion={logoVersion}
            onLanguageChange={changeLanguage}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent mx-auto"></div>
          <p className="mt-4 text-secondary-text">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)]">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-yellow-500 text-white'
          }`}>
          {toast.type === 'success' && <IoCheckmarkCircle size={20} />}
          {toast.type === 'error' && <IoClose size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Left Sidebar Menu */}
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <Card className="p-4 sm:p-6">
          {renderContent()}
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => fetchAllData()}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              <IoRefresh size={18} className="mr-2" />
              {t('common.reset')}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSave(activeSubMenu)}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <IoSave size={18} className="mr-2" />
                  {t('common.save')}
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

// General Settings Component - Updated with proper company info
const GeneralSettings = ({
  companyInfo,
  settings,
  handleCompanyChange,
  handleChange,
  handleLogoUpload,
  timezoneOptions,
  dateFormatOptions,
  timeFormatOptions,
  currencySymbols,
  logoVersion,
  onLanguageChange
}) => {
  const [activeTab, setActiveTab] = useState('general')
  const { t } = useLanguage()
  const logoInputRef = useRef(null)

  const tabs = [
    { id: 'general', label: t('settings.general_settings_label') },
    { id: 'ui-options', label: t('settings.ui_options_label') },
    { id: 'pwa', label: t('settings.pwa_settings_label') }
  ]

  // Get logo URL
  const getLogoUrl = () => {
    if (!companyInfo.logo) return null
    if (companyInfo.logo.startsWith('http') || companyInfo.logo.startsWith('blob:') || companyInfo.logo.startsWith('data:')) {
      return companyInfo.logo
    }
    const baseUrl = BaseUrl.endsWith('/') ? BaseUrl : `${BaseUrl}/`
    const cleanLogoPath = companyInfo.logo.startsWith('/') ? companyInfo.logo.slice(1) : companyInfo.logo
    const fullPath = `${baseUrl}${cleanLogoPath}`
    const separator = fullPath.includes('?') ? '&' : '?'
    return `${fullPath}${separator}v=${logoVersion || Date.now()}`
  }

  const handleLanguageChange = (e) => {
    const newLang = e.target.value
    handleChange('default_language', newLang)
    if (onLanguageChange) {
      onLanguageChange(newLang)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-primary-text mb-2">{t('settings.general_settings.title')}</h1>
        <p className="text-secondary-text text-sm sm:text-base">{t('settings.general_settings.description')}</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
              ? 'border-primary-accent text-primary-accent'
              : 'border-transparent text-secondary-text hover:text-primary-text'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Company Information Section */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <IoBusiness size={24} className="text-primary-accent" />
              <h3 className="text-lg font-semibold text-primary-text">{t('settings.general_settings.company_information')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('settings.general_settings.company_name')}
                value={companyInfo.name || ''}
                onChange={(e) => handleCompanyChange('name', e.target.value)}
                placeholder={t('settings.general_settings.enter_company_name')}
                icon={IoBusiness}
              />
              <Input
                label={t('settings.general_settings.company_email')}
                type="email"
                value={companyInfo.email || ''}
                onChange={(e) => handleCompanyChange('email', e.target.value)}
                placeholder="company@example.com"
                icon={IoMail}
              />
              <Input
                label={t('settings.general_settings.company_phone')}
                value={companyInfo.phone || ''}
                onChange={(e) => handleCompanyChange('phone', e.target.value)}
                placeholder="+1 234 567 8900"
                icon={IoCall}
              />
              <Input
                label={t('settings.general_settings.company_website')}
                value={companyInfo.website || ''}
                onChange={(e) => handleCompanyChange('website', e.target.value)}
                placeholder="https://example.com"
                icon={IoGlobeOutline}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-primary-text mb-2">
                  <div className="flex items-center gap-2">
                    <IoLocation size={18} />
                    {t('settings.general_settings.company_address')}
                  </div>
                </label>
                <textarea
                  value={companyInfo.address || ''}
                  onChange={(e) => handleCompanyChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none"
                  placeholder={t('settings.enter_company_address')}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-primary-text mb-2">
                  <div className="flex items-center gap-2">
                    <IoImageOutline size={18} />
                    {t('settings.general_settings.company_logo')}
                  </div>
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        {t('common.choose_file')}
                      </button>
                      <input
                        type="file"
                        ref={logoInputRef}
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <span className="text-xs text-secondary-text">
                        {settings.company_logo ? t('common.file_selected') || 'Datei ausgewählt' : t('common.no_file_chosen') || 'Keine Datei ausgewählt'}
                      </span>
                    </div>
                    <p className="text-xs text-secondary-text mt-1">{t('settings.general_settings.logo_recommendation')}</p>
                  </div>
                  {getLogoUrl() && (
                    <div className="flex-shrink-0">
                      <img
                        src={getLogoUrl()}
                        alt="Unternehmenslogo"
                        className="h-16 w-auto max-w-[200px] object-contain rounded-lg border border-gray-200 p-2 bg-white"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* System Settings Section */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <IoSettings size={24} className="text-primary-accent" />
              <h3 className="text-lg font-semibold text-primary-text">{t('settings.general_settings.system_settings')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('settings.general_settings.system_name')}
                value={settings.system_name || ''}
                onChange={(e) => setSettings({ ...settings, system_name: e.target.value })} />
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.general_settings.default_currency')}</label>
                <select
                  value={settings.default_currency || 'USD'}
                  onChange={(e) => handleChange('default_currency', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  {Object.entries(currencySymbols || {}).map(([code, symbol]) => (
                    <option key={code} value={code}>{code} ({symbol})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.general_settings.timezone')}</label>
                <select
                  value={settings.default_timezone || 'UTC'}
                  onChange={(e) => handleChange('default_timezone', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  {(timezoneOptions || []).map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.general_settings.date_format')}</label>
                <select
                  value={settings.date_format || 'Y-m-d'}
                  onChange={(e) => handleChange('date_format', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  {(dateFormatOptions || []).map(df => (
                    <option key={df.value} value={df.value}>{df.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.general_settings.time_format')}</label>
                <select
                  value={settings.time_format || 'H:i'}
                  onChange={(e) => handleChange('time_format', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  {(timeFormatOptions || []).map(tf => (
                    <option key={tf.value} value={tf.value}>{tf.label.replace('Hour', t('common.hour'))}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.general_settings.currency_position')}</label>
                <select
                  value={settings.currency_symbol_position || 'before'}
                  onChange={(e) => handleChange('currency_symbol_position', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  <option value="before">{t('settings.general_settings.before_amount')}</option>
                  <option value="after">{t('settings.general_settings.after_amount')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.general_settings.default_language')}</label>
                <select
                  value={settings.default_language || 'de'}
                  onChange={handleLanguageChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  <option value="de">Deutsch 🇩🇪</option>
                  <option value="en">Englisch 🇬🇧</option>
                  <option value="fr">Französisch 🇫🇷</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ui-options' && (
        <UIOptionsTab settings={settings} handleChange={handleChange} />
      )}

      {activeTab === 'pwa' && (
        <PWATab settings={settings} handleChange={handleChange} handleLogoUpload={handleLogoUpload} />
      )}
    </div>
  )
}

// UI Options Tab Component
const UIOptionsTab = ({ settings, handleChange }) => {
  const { theme, updateTheme } = useTheme()
  const { t } = useLanguage()

  const fontOptions = [
    { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif', label: t('settings.font_system') || 'Systemstandard' },
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Poppins, sans-serif', label: 'Poppins' },
    { value: 'Roboto, sans-serif', label: 'Roboto' },
    { value: 'Open Sans, sans-serif', label: 'Open Sans' },
    { value: 'Lato, sans-serif', label: 'Lato' },
    { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary-text mb-4">{t('settings.ui_settings.design_settings')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.ui_settings.design_mode')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleChange('theme_mode', 'light')
                  updateTheme({ mode: 'light' })
                }}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${(settings.theme_mode || 'light') === 'light'
                  ? 'border-primary-accent bg-primary-accent/10 text-primary-accent'
                  : 'border-gray-300 hover:border-gray-400'
                  }`}
              >
                <IoSunny size={18} className="mx-auto mb-1" />
                {t('settings.ui_settings.light')}
              </button>
              <button
                onClick={() => {
                  handleChange('theme_mode', 'dark')
                  updateTheme({ mode: 'dark' })
                }}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${settings.theme_mode === 'dark'
                  ? 'border-primary-accent bg-primary-accent/10 text-primary-accent'
                  : 'border-gray-300 hover:border-gray-400'
                  }`}
              >
                <IoMoon size={18} className="mx-auto mb-1" />
                {t('settings.ui_settings.dark')}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.ui_settings.font_family')}</label>
            <select
              value={settings.font_family || fontOptions[0].value}
              onChange={(e) => {
                handleChange('font_family', e.target.value)
                updateTheme({ fontFamily: e.target.value })
              }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              style={{ fontFamily: settings.font_family || fontOptions[0].value }}
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.ui_settings.primary_color')}</label>
            <div className="flex items-center gap-2">
              <ColorPicker
                value={settings.primary_color || '#217E45'}
                onChange={(color) => {
                  handleChange('primary_color', color)
                  updateTheme({ primaryAccent: color })
                }}
              />
              <Input
                value={settings.primary_color || '#217E45'}
                onChange={(e) => {
                  handleChange('primary_color', e.target.value)
                  updateTheme({ primaryAccent: e.target.value })
                }}
                placeholder="#217E45"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.ui_settings.secondary_color')}</label>
            <div className="flex items-center gap-2">
              <ColorPicker
                value={settings.secondary_color || '#76AF88'}
                onChange={(color) => {
                  handleChange('secondary_color', color)
                  updateTheme({ secondaryAccent: color })
                }}
              />
              <Input
                value={settings.secondary_color || '#76AF88'}
                onChange={(e) => {
                  handleChange('secondary_color', e.target.value)
                  updateTheme({ secondaryAccent: e.target.value })
                }}
                placeholder="#76AF88"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.ui_settings.sidebar_style')}</label>
            <select
              value={settings.sidebar_style || 'default'}
              onChange={(e) => handleChange('sidebar_style', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="default">{t('settings.ui_settings.default')}</option>
              <option value="compact">{t('settings.ui_settings.compact')}</option>
              <option value="icon-only">{t('settings.ui_settings.icon_only')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.ui_settings.top_menu_style')}</label>
            <select
              value={settings.top_menu_style || 'default'}
              onChange={(e) => handleChange('top_menu_style', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="default">{t('settings.ui_settings.default')}</option>
              <option value="centered">{t('settings.ui_settings.centered')}</option>
              <option value="minimal">{t('settings.ui_settings.minimal')}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// PWA Tab Component
const PWATab = ({ settings, handleChange, handleLogoUpload }) => {
  const { t } = useLanguage()
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary-text mb-4">{t('settings.pwa.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={settings.pwa_enabled || false}
                onChange={(e) => handleChange('pwa_enabled', e.target.checked)}
                className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent"
              />
              <span className="text-sm font-medium text-primary-text">{t('settings.pwa.enable')}</span>
            </label>
          </div>
          <Input
            label={t('settings.pwa.app_name')}
            value={settings.pwa_app_name || ''}
            onChange={(e) => handleChange('pwa_app_name', e.target.value)}
          />
          <Input
            label={t('settings.pwa.app_short_name')}
            value={settings.pwa_app_short_name || ''}
            onChange={(e) => handleChange('pwa_app_short_name', e.target.value)}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.pwa.app_description')}</label>
            <textarea
              value={settings.pwa_app_description || ''}
              onChange={(e) => handleChange('pwa_app_description', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent outline-none"
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.pwa.app_icon')}</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e, 'pwa_app_icon')}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                />
                <p className="text-xs text-secondary-text mt-1">{t('settings.pwa.icon_recommendation')}</p>
              </div>
              {settings.pwa_app_icon && (
                <div className="relative">
                  <img
                    src={settings.pwa_app_icon.startsWith('http') || settings.pwa_app_icon.startsWith('blob:')
                      ? settings.pwa_app_icon
                      : `${BaseUrl}${settings.pwa_app_icon.startsWith('/') ? '' : '/'}${settings.pwa_app_icon}`
                    }
                    alt="PWA-Symbol"
                    className="w-24 h-24 object-contain rounded-lg border border-gray-200 p-2 bg-gray-50"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.pwa.app_design_color')}</label>
            <div className="flex items-center gap-2">
              <ColorPicker
                value={settings.pwa_app_color || '#217E45'}
                onChange={(color) => handleChange('pwa_app_color', color)}
              />
              <Input
                value={settings.pwa_app_color || '#217E45'}
                onChange={(e) => handleChange('pwa_app_color', e.target.value)}
                placeholder="#217E45"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Localization Settings Component
const LocalizationSettings = ({ settings, handleChange, onLanguageChange }) => {
  const { theme } = useTheme()
  const { language: currentLanguage, t } = useLanguage()
  const [languageChanged, setLanguageChanged] = useState(false)
  const isDark = theme.mode === 'dark'

  const languageOptions = [
    { code: 'en', name: 'Englisch', flag: '🇬🇧', native: 'English' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', native: 'Deutsch' },
    { code: 'fr', name: 'Franzoesisch', flag: '🇫🇷', native: 'Français' },
    { code: 'ar', name: 'Arabisch', flag: '🇸🇦', native: 'العربية' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', native: 'हिंदी' }
  ]

  const handleLanguageSelect = (e) => {
    const newLang = e.target.value
    handleChange('default_language', newLang)
    if (onLanguageChange) {
      onLanguageChange(newLang)
      setLanguageChanged(true)
      setTimeout(() => setLanguageChanged(false), 2000)
    }
  }

  const getCurrentLanguageInfo = () => {
    return languageOptions.find(lang => lang.code === (settings.default_language || currentLanguage || 'en'))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: isDark ? '#374151' : '#F3F4F6' }}
          >
            <IoGlobeOutline size={24} style={{ color: '#217E45' }} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}>
              {t('settings.localization_settings.title')}
            </h1>
            <p className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              {t('settings.localization')}
            </p>
          </div>
        </div>
      </div>

      {/* Current Language Status */}
      {languageChanged && (
        <div
          className="p-4 rounded-lg border flex items-center gap-3 animate-fadeIn"
          style={{
            backgroundColor: isDark ? '#065F46' : '#D1FAE5',
            borderColor: isDark ? '#047857' : '#10B981',
            color: isDark ? '#D1FAE5' : '#065F46'
          }}
        >
          <IoCheckmarkCircle size={24} style={{ color: '#10B981' }} />
          <div>
            <p className="font-medium">{t('settings.language_changed_success')}</p>
            <p className="text-sm opacity-90">{t('settings.interface_updated')}</p>
          </div>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Default Language */}
        <div
          className="p-6 rounded-xl border"
          style={{
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isDark ? '#374151' : '#E5E7EB'
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <IoLanguage size={20} style={{ color: '#217E45' }} />
            <label
              className="text-sm font-semibold"
              style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}
            >
              {t('settings.default_language')}
            </label>
          </div>

          <select
            value={currentLanguage || settings.default_language || 'de'}
            onChange={handleLanguageSelect}
            className="w-full px-4 py-3 rounded-lg border outline-none transition-all"
            style={{
              backgroundColor: isDark ? '#374151' : '#FFFFFF',
              borderColor: isDark ? '#4B5563' : '#D1D5DB',
              color: isDark ? '#F9FAFB' : '#1F2937'
            }}
          >
            {languageOptions.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name} ({lang.native})
              </option>
            ))}
          </select>

          {/* Current Language Display */}
          <div
            className="mt-4 p-3 rounded-lg flex items-center justify-between"
            style={{ backgroundColor: isDark ? '#374151' : '#F9FAFB' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getCurrentLanguageInfo()?.flag}</span>
              <div>
                <p
                   className="text-sm font-medium"
                   style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}
                 >
                   {(t('settings.current_language') || '').replace('{{language}}', getCurrentLanguageInfo()?.native)}
                 </p>
                 <p
                   className="text-xs"
                   style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                 >
                   {t('settings.interface_updated')}
                 </p>
              </div>
            </div>
            <IoCheckmarkCircle size={20} style={{ color: '#10B981' }} />
          </div>
        </div>

        {/* Currency Symbol Position */}
        <div
          className="p-6 rounded-xl border"
          style={{
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isDark ? '#374151' : '#E5E7EB'
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <IoColorFill size={20} style={{ color: '#217E45' }} />
            <label
              className="text-sm font-semibold"
              style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}
            >
              {t('settings.currency_symbol_position')}
            </label>
          </div>

          <select
            value={settings.currency_symbol_position || 'before'}
            onChange={(e) => handleChange('currency_symbol_position', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border outline-none transition-all"
            style={{
              backgroundColor: isDark ? '#374151' : '#FFFFFF',
              borderColor: isDark ? '#4B5563' : '#D1D5DB',
              color: isDark ? '#F9FAFB' : '#1F2937'
            }}
          >
            <option value="before">{t('settings.before_amount')} (€100)</option>
            <option value="after">{t('settings.after_amount')} (100$)</option>
          </select>

          {/* Preview */}
          <div
            className="mt-4 p-3 rounded-lg"
            style={{ backgroundColor: isDark ? '#374151' : '#F9FAFB' }}
          >
            <p
               className="text-xs mb-1"
               style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
             >
               {t('common.preview')}:
             </p>
            <p
              className="text-lg font-bold"
              style={{ color: isDark ? '#F9FAFB' : '#1F2937' }}
            >
              {settings.currency_symbol_position === 'after' ? '100$' : '€100'}
            </p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div
        className="p-4 rounded-lg border-l-4 flex items-start gap-3"
        style={{
          backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE',
          borderColor: '#3B82F6'
        }}
      >
        <IoGlobe size={20} style={{ color: '#3B82F6', marginTop: '2px' }} />
        <div>
          <p
             className="text-sm font-medium mb-1"
             style={{ color: isDark ? '#DBEAFE' : '#1E3A8A' }}
           >
             {t('settings.localization_info_title')}
           </p>
           <p
             className="text-xs"
             style={{ color: isDark ? '#BFDBFE' : '#1E40AF' }}
           >
             {t('settings.localization_info_text')}
           </p>
        </div>
      </div>
    </div>
  )
}

// Email Settings Component
const EmailSettings = ({ settings, handleChange }) => {
  const { t } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-text mb-2">{t('settings.email_settings')}</h1>
        <p className="text-secondary-text text-sm sm:text-base">{t('settings.configure_email_desc')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.email_driver')}</label>
          <select
            value={settings.email_driver || 'smtp'}
            onChange={(e) => handleChange('email_driver', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
          >
            <option value="smtp">SMTP</option>
            <option value="sendmail">Sendmail</option>
            <option value="mailgun">Mailgun</option>
            <option value="ses">Amazon SES</option>
          </select>
        </div>
        <Input
          label={t('settings.sender_email')}
          type="email"
          value={settings.email_from || ''}
          onChange={(e) => handleChange('email_from', e.target.value)}
          placeholder="noreply@developo.com"
        />
        <Input
          label={t('settings.sender_name')}
          value={settings.email_from_name || ''}
          onChange={(e) => handleChange('email_from_name', e.target.value)}
        />
        <Input
          label={t('settings.smtp_host')}
          value={settings.smtp_host || ''}
          onChange={(e) => handleChange('smtp_host', e.target.value)}
          placeholder="smtp.gmail.com"
        />
        <Input
          label={t('settings.smtp_port')}
          type="number"
          value={settings.smtp_port || 587}
          onChange={(e) => handleChange('smtp_port', parseInt(e.target.value))}
          placeholder="587"
        />
        <div>
          <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.smtp_encryption')}</label>
          <select
            value={settings.smtp_encryption || 'tls'}
            onChange={(e) => handleChange('smtp_encryption', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
          >
            <option value="tls">{t('settings.tls')}</option>
            <option value="ssl">{t('settings.ssl')}</option>
            <option value="none">{t('settings.none')}</option>
          </select>
        </div>
        <Input
          label={t('settings.smtp_username')}
          value={settings.smtp_username || ''}
          onChange={(e) => handleChange('smtp_username', e.target.value)}
          placeholder="your-email@gmail.com"
        />
        <div>
          <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.smtp_password')}</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={settings.smtp_password || ''}
              onChange={(e) => handleChange('smtp_password', e.target.value)}
              placeholder={t('settings.enter_smtp_password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-text hover:text-primary-text"
            >
              {showPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Email Templates Settings Component - Redirects to dedicated page
const EmailTemplatesSettings = ({ navigate }) => {
  const { t } = useLanguage()
  // Auto-navigate to Email Templates page
  useEffect(() => {
    navigate('/app/admin/settings/email-templates')
  }, [navigate])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-accent mx-auto"></div>
        <p className="mt-2 text-secondary-text">{t('settings.loading_email_templates')}</p>
      </div>
    </div>
  )
}

// Modules Settings Component
const ModulesSettings = ({ settings, handleChange }) => {
  const { t } = useLanguage()
  const modules = [
    { key: 'module_leads', label: t('sidebar.leads') || 'Leads' },
    { key: 'module_projects', label: t('sidebar.projects') || 'Projekte' },
    { key: 'module_tasks', label: t('sidebar.tasks') || 'Aufgaben' },
    { key: 'module_invoices', label: t('sidebar.invoices') || 'Rechnungen' },
    { key: 'module_estimates', label: t('sidebar.estimates') || 'Kostenvoranschläge' },
    { key: 'module_proposals', label: t('sidebar.proposals') || 'Angebote' },
    { key: 'module_payments', label: t('sidebar.payments') || 'Zahlungen' },
    { key: 'module_expenses', label: t('sidebar.expenses') || 'Ausgaben' },
    { key: 'module_contracts', label: t('sidebar.contracts') || 'Verträge' },
    { key: 'module_employees', label: t('sidebar.employees') || 'Mitarbeiter' },
    { key: 'module_attendance', label: t('sidebar.attendance') || 'Anwesenheit' },
    { key: 'module_time_tracking', label: t('sidebar.time_tracking') || 'Zeiterfassung' },
    { key: 'module_events', label: t('sidebar.events') || 'Termine' },
    { key: 'module_departments', label: t('sidebar.departments') || 'Abteilungen' },
    { key: 'module_positions', label: t('sidebar.positions') || 'Positionen' },
    { key: 'module_messages', label: t('sidebar.messages') || 'Nachrichten' },
    { key: 'module_tickets', label: t('sidebar.tickets') || 'Tickets' },
    { key: 'module_documents', label: t('sidebar.documents') || 'Dokumente' },
    { key: 'module_reports', label: t('sidebar.reports') || 'Berichte' },
    { key: 'module_hrm', label: t('dashboard.hr_settings') || 'HR-Einstellungen' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-text mb-2">{t('sidebar.administration')}</h1>
        <p className="text-secondary-text text-sm sm:text-base">{t('settings.modules_desc')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => (
          <label
            key={module.key}
            className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={settings[module.key] !== false}
              onChange={(e) => handleChange(module.key, e.target.checked)}
              className="w-5 h-5 text-primary-accent rounded focus:ring-primary-accent"
            />
            <span className="text-sm font-medium text-primary-text">{module.label}</span>
            <Badge variant={settings[module.key] !== false ? 'success' : 'danger'} className="ml-auto">
              {settings[module.key] !== false ? t('settings.modules.enabled') : t('settings.modules.disabled')}
            </Badge>
          </label>
        ))}
      </div>
    </div>
  )
}

// Left Menu Settings Component
const LeftMenuSettings = ({ settings, handleChange }) => {
  const { t } = useLanguage()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-text mb-2">{t('settings.ui_settings.sidebar_style')}</h1>
        <p className="text-secondary-text text-sm sm:text-base">{t('settings.configure_sidebar_desc')}</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.ui_settings.sidebar_style')}</label>
          <select
            value={settings.left_menu_style || 'default'}
            onChange={(e) => handleChange('left_menu_style', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
          >
            <option value="default">{t('settings.ui_settings.default')}</option>
            <option value="compact">{t('settings.ui_settings.compact')}</option>
            <option value="icon-only">{t('settings.ui_settings.icon_only')}</option>
            <option value="collapsed">{t('settings.ui_settings.collapsed') || 'Eingeklappt'}</option>
          </select>
        </div>
        <div className="text-center py-8 text-secondary-text">
          <IoMenu size={48} className="mx-auto mb-2 text-gray-300" />
          <p>Menüelemente werden in der Seitenleistenkonfiguration verwaltet</p>
        </div>
      </div>
    </div>
  )
}

// Notifications Settings Component
const NotificationsSettings = ({ settings, handleChange }) => {
  const { t } = useLanguage()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-text mb-2">{t('settings.notification_settings.title')}</h1>
        <p className="text-secondary-text text-sm sm:text-base">{t('settings.notification_settings.description')}</p>
      </div>
      <div className="space-y-4">
        <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={settings.email_notifications !== false}
            onChange={(e) => handleChange('email_notifications', e.target.checked)}
            className="w-5 h-5 text-primary-accent rounded focus:ring-primary-accent"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-primary-text block">{t('settings.notification_settings.email')}</span>
            <span className="text-xs text-secondary-text">{t('settings.notification_settings.email_desc')}</span>
          </div>
        </label>
        <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={settings.sms_notifications === true}
            onChange={(e) => handleChange('sms_notifications', e.target.checked)}
            className="w-5 h-5 text-primary-accent rounded focus:ring-primary-accent"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-primary-text block">{t('settings.notification_settings.sms')}</span>
            <span className="text-xs text-secondary-text">{t('settings.notification_settings.sms_desc')}</span>
          </div>
        </label>
        <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={settings.push_notifications !== false}
            onChange={(e) => handleChange('push_notifications', e.target.checked)}
            className="w-5 h-5 text-primary-accent rounded focus:ring-primary-accent"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-primary-text block">{t('settings.notification_settings.push')}</span>
            <span className="text-xs text-secondary-text">{t('settings.notification_settings.push_desc')}</span>
          </div>
        </label>
        <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={settings.notification_sound !== false}
            onChange={(e) => handleChange('notification_sound', e.target.checked)}
            className="w-5 h-5 text-primary-accent rounded focus:ring-primary-accent"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-primary-text block">{t('settings.notification_settings.sound')}</span>
            <span className="text-xs text-secondary-text">{t('settings.notification_settings.sound_desc')}</span>
          </div>
        </label>
      </div>
    </div>
  )
}

// Integration Settings Component
const IntegrationSettings = ({ settings, handleChange }) => {
  const { t } = useLanguage()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-text mb-2">{t('settings.integrations.title')}</h1>
        <p className="text-secondary-text text-sm sm:text-base">{t('settings.integrations.description')}</p>
      </div>

      {/* Google Calendar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3">
            <IoCalendar size={24} className="text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-primary-text">{t('settings.integrations.google_calendar')}</h3>
              <p className="text-sm text-secondary-text">{t('settings.integrations.google_calendar_desc')}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.google_calendar_enabled === true}
              onChange={(e) => handleChange('google_calendar_enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
          </label>
        </div>
        {settings.google_calendar_enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <Input
              label="Client-ID"
              value={settings.google_calendar_client_id || ''}
              onChange={(e) => handleChange('google_calendar_client_id', e.target.value)}
            />
            <Input
              label="Client-Geheimnis"
              type="password"
              value={settings.google_calendar_client_secret || ''}
              onChange={(e) => handleChange('google_calendar_client_secret', e.target.value)}
            />
          </div>
        )}
      </Card>

      {/* Slack */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3">
            <IoNotifications size={24} className="text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold text-primary-text">{t('settings.integrations.slack')}</h3>
              <p className="text-sm text-secondary-text">{t('settings.integrations.slack_desc')}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.slack_enabled === true}
              onChange={(e) => handleChange('slack_enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
          </label>
        </div>
        {settings.slack_enabled && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Input
              label="Webhook-URL"
              value={settings.slack_webhook_url || ''}
              onChange={(e) => handleChange('slack_webhook_url', e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>
        )}
      </Card>

      {/* Zapier */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3">
            <IoExtensionPuzzle size={24} className="text-orange-600" />
            <div>
              <h3 className="text-lg font-semibold text-primary-text">{t('settings.integrations.zapier')}</h3>
              <p className="text-sm text-secondary-text">{t('settings.integrations.zapier_desc')}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.zapier_enabled === true}
              onChange={(e) => handleChange('zapier_enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
          </label>
        </div>
        {settings.zapier_enabled && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Input
              label="API-Schlüssel"
              value={settings.zapier_api_key || ''}
              onChange={(e) => handleChange('zapier_api_key', e.target.value)}
              placeholder="Zapier API-Schlüssel eingeben"
            />
          </div>
        )}
      </Card>
    </div>
  )
}

// Cron Job Settings Component
const CronJobSettings = ({ settings, handleChange }) => {
  const { t } = useLanguage()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-text mb-2">{t('settings.cron.title')}</h1>
        <p className="text-secondary-text text-sm sm:text-base">{t('settings.cron.description')}</p>
      </div>
      <div className="space-y-4">
        <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={settings.cron_job_enabled !== false}
            onChange={(e) => handleChange('cron_job_enabled', e.target.checked)}
            className="w-5 h-5 text-primary-accent rounded focus:ring-primary-accent"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-primary-text block">{t('settings.cron.enable')}</span>
            <span className="text-xs text-secondary-text">{t('settings.cron.enable_desc')}</span>
          </div>
        </label>
        {settings.cron_job_enabled && (
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.cron.frequency')}</label>
            <select
              value={settings.cron_job_frequency || 'daily'}
              onChange={(e) => handleChange('cron_job_frequency', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="hourly">{t('settings.cron.hourly')}</option>
              <option value="daily">{t('settings.cron.daily')}</option>
              <option value="weekly">{t('settings.cron.weekly')}</option>
              <option value="monthly">{t('settings.cron.monthly')}</option>
            </select>
          </div>
        )}
        {settings.cron_job_last_run && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-secondary-text">
              {(t('settings.cron.last_run') || '').replace('{{time}}', new Date(settings.cron_job_last_run).toLocaleString())}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Updates Settings Component
const UpdatesSettings = ({ settings, handleChange }) => {
  const { t } = useLanguage()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-text mb-2">{t('settings.updates.title')}</h1>
        <p className="text-secondary-text text-sm sm:text-base">{t('settings.updates.description')}</p>
      </div>
      <div className="space-y-4">
        <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={settings.auto_update_enabled === true}
            onChange={(e) => handleChange('auto_update_enabled', e.target.checked)}
            className="w-5 h-5 text-primary-accent rounded focus:ring-primary-accent"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-primary-text block">{t('settings.updates.auto_update')}</span>
            <span className="text-xs text-secondary-text">{t('settings.updates.auto_update_desc')}</span>
          </div>
        </label>
        {settings.auto_update_enabled && (
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('') || ''}</label>
            <select
              value={settings.update_channel || 'stable'}
              onChange={(e) => handleChange('update_channel', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="stable">{t('settings.updates.stable')}</option>
              <option value="beta">{t('settings.updates.beta')}</option>
              <option value="alpha">{t('settings.updates.alpha')}</option>
            </select>
          </div>
        )}
        {settings.last_update_check && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-secondary-text">
              {(t('settings.updates.last_check') || '').replace('{{time}}', new Date(settings.last_update_check).toLocaleString())}
            </p>
          </div>
        )}
        <Button
          variant="outline"
          onClick={() => handleChange('last_update_check', new Date().toISOString())}
          className="flex items-center gap-2"
        >
          <IoRefresh size={18} />
          {t('settings.updates.check_now')}
        </Button>
      </div>
    </div>
  )
}

// Access Permission Settings Component
const AccessPermissionSettings = ({ settings, handleChange }) => {
  const { t } = useLanguage()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-text mb-2">{t('settings.access.title')}</h1>
        <p className="text-secondary-text text-sm sm:text-base">{t('settings.access.description')}</p>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {t('settings.access.info')}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.access.default_role')}</label>
          <select
            value={settings.default_role || 'employee'}
            onChange={(e) => handleChange('default_role', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
          >
            <option value="admin">{t('settings.access.admin')}</option>
            <option value="employee">{t('settings.access.employee')}</option>
          </select>
        </div>
        <div>
          <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.enable_two_factor === true}
              onChange={(e) => handleChange('enable_two_factor', e.target.checked)}
              className="w-5 h-5 text-primary-accent rounded focus:ring-primary-accent"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-primary-text block">{t('settings.access.enable_2fa')}</span>
              <span className="text-xs text-secondary-text">{t('settings.access.enable_2fa_desc')}</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}



// Sales & Prospects Settings Component
const SalesProspectsSettings = ({ settings, handleChange }) => {
  const { t } = useLanguage()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-text mb-2">{t('settings.sales.title')}</h1>
        <p className="text-secondary-text text-sm sm:text-base">{t('settings.sales.description')}</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.sales.default_stages') || 'Standard-Vertriebspipeline-Stufen'}</label>
          <div className="space-y-2">
            {[t('sidebar.leads'), t('settings.sales.qualified'), t('settings.sales.proposal'), t('settings.sales.negotiation'), t('sidebar.deals_won'), t('sidebar.deals_lost')].map((stage, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="text-sm text-primary-text">{stage}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.auto_convert_lead === true}
              onChange={(e) => handleChange('auto_convert_lead', e.target.checked)}
              className="w-5 h-5 text-primary-accent rounded focus:ring-primary-accent"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-primary-text block">{t('settings.sales.auto_convert')}</span>
              <span className="text-xs text-secondary-text">{t('settings.sales.auto_convert_desc')}</span>
            </div>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.sales.default_lead_source') || 'Standard-Lead-Quelle'}</label>
          <Input
            type="text"
            value={settings.default_lead_source || ''}
            onChange={(e) => handleChange('default_lead_source', e.target.value)}
            placeholder={t('settings.sales.source_placeholder')}
          />
        </div>
      </div>
    </div>
  )
}

// Setup Settings Component
const SetupSettings = ({ settings, handleChange }) => {
  const { t } = useLanguage()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-text mb-2">{t('settings.setup.title')}</h1>
        <p className="text-secondary-text text-sm sm:text-base">{t('settings.setup.description')}</p>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            {t('settings.setup.info')}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.setup.system_status') || 'Systemstatus'}</label>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <IoCheckmarkCircle className="text-green-600" size={20} />
              <span className="text-sm text-green-800">{t('settings.setup.system_ready')}</span>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-text mb-2">{t('settings.setup.database_status') || 'Datenbankstatus'}</label>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm text-blue-800">{t('settings.setup.database_active')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
