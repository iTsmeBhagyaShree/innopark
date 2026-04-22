import { useState, useEffect } from 'react'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import axiosInstance from '../../../api/axiosInstance'
import { useSettings } from '../../../context/SettingsContext'
import { useLanguage } from '../../../context/LanguageContext'
import { 
  IoSettings, 
  IoCheckmarkCircle, 
  IoMail, 
  IoCloud, 
  IoDocument, 
  IoShield, 
  IoTime,
  IoGlobe,
  IoSend,
  IoRefresh,
  IoEye,
  IoEyeOff,
  IoWarning,
  IoCheckmark,
  IoClose,
  IoCloudUpload,
  IoFootsteps,
  IoLink,
  IoList,
  IoAlertCircle
} from 'react-icons/io5'

const Settings = () => {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const { refreshSettings, getLogoUrl, logoVersion } = useSettings()

  const [formData, setFormData] = useState({
    system_name: 'Develo CRM',
    default_currency: 'USD',
    default_timezone: 'UTC',
    session_timeout: '30',
    
    max_file_size: '10',
    allowed_file_types: 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,zip',
    
    email_from: 'noreply@develo.com',
    email_from_name: 'Develo CRM',
    smtp_host: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    
    backup_frequency: 'daily',
    last_backup_time: null,
    
    enable_audit_log: true,

    footer_company_address: '',
    footer_privacy_link: '',
    footer_terms_link: '',
    footer_refund_link: '',
    footer_custom_link_1_text: '',
    footer_custom_link_1_url: '',
    footer_custom_link_2_text: '',
    footer_custom_link_2_url: '',
  })

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
  ]

  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
    { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
    { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
  ]

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs()
    }
  }, [activeTab])

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000)
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/superadmin/settings')
      if (response.data.success) {
        setFormData(prev => ({ ...prev, ...response.data.data }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      showToast(t('system_settings.messages.fetch_error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(t('system_settings.messages.logo_size_error'), 'error')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true)
      const response = await axiosInstance.get('/superadmin/audit-logs', {
        params: { limit: 100, module: 'system_settings' }
      })
      if (response.data.success) {
        setAuditLogs(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setAuditLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const response = await axiosInstance.put('/superadmin/settings', formData)
      
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFile);
        logoFormData.append('setting_key', 'company_logo');
        await axiosInstance.put('/settings', logoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data.success) {
        showToast(t('system_settings.messages.save_success'), 'success')
        
        await refreshSettings()
        
        fetchSettings()
        setLogoFile(null)
        setLogoPreview(null)
        if (formData.enable_audit_log) {
          fetchAuditLogs()
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast(error.response?.data?.error || 'Einstellungen konnten nicht gespeichert werden', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      showToast(t('system_settings.messages.test_email_empty'), 'error')
      return
    }

    try {
      setTestingEmail(true)
      const response = await axiosInstance.post('/superadmin/settings/test-email', {
        test_email: testEmail
      })
      if (response.data.success) {
        showToast(response.data.message || 'Test-E-Mail erfolgreich gesendet!', 'success')
        setTestEmailModalOpen(false)
        setTestEmail('')
      }
    } catch (error) {
      console.error('Error testing email:', error)
      showToast(error.response?.data?.error || 'Test-E-Mail konnte nicht gesendet werden', 'error')
    } finally {
      setTestingEmail(false)
    }
  }

  const tabs = [
    { id: 'general', label: t('system_settings.general'), icon: IoSettings },
    { id: 'files', label: t('system_settings.files'), icon: IoCloudUpload },
    { id: 'email', label: t('system_settings.email'), icon: IoMail },
    { id: 'backup', label: t('system_settings.backup'), icon: IoCloud },
    { id: 'footer', label: t('system_settings.footer'), icon: IoFootsteps },
    { id: 'audit', label: t('system_settings.audit'), icon: IoShield },
  ]

  const auditColumns = [
    {
      key: 'created_at',
      label: t('system_settings.audit_settings.columns.date'),
      render: (value) => new Date(value).toLocaleString('de-DE')
    },
    { key: 'admin_name', label: t('system_settings.audit_settings.columns.admin') },
    { key: 'action', label: t('system_settings.audit_settings.columns.action') },
    {
      key: 'ip_address',
      label: t('system_settings.audit_settings.columns.ip'),
      render: (value) => <span className="font-mono text-xs">{value || 'K.A.'}</span>
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent mx-auto"></div>
          <p className="mt-4 text-secondary-text">{t('system_settings.messages.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.type === 'success' ? <IoCheckmarkCircle size={20} /> : <IoWarning size={20} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:opacity-80">
            <IoClose size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-text">{t('system_settings.title')}</h1>
          <p className="text-secondary-text mt-1">{t('system_settings.subtitle')}</p>
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t('common.saving')}
            </>
          ) : (
            <>
              <IoCheckmark size={18} />
              {t('common.save')}
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-accent text-primary-accent'
                    : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-6">
              <IoSettings size={24} className="text-primary-accent" />
              <h2 className="text-lg font-semibold text-primary-text">{t('system_settings.general_settings.title')}</h2>
            </div>
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="flex-1 w-full text-left">
                  <Input
                    label={t('system_settings.general_settings.system_name')}
                    value={formData.system_name}
                    onChange={(e) => setFormData({ ...formData, system_name: e.target.value })}
                  />
                  <p className="text-xs text-secondary-text mt-1 text-left">{t('system_settings.general_settings.system_name_desc')}</p>
                </div>
                <div className="flex-shrink-0 text-center">
                  <div className="text-sm font-medium text-primary-text mb-2">{t('system_settings.general_settings.logo')}</div>
                  <div className="relative group w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {logoPreview || getLogoUrl() ? (
                      <img 
                        src={logoPreview || getLogoUrl()} 
                        alt={t('system_settings.general_settings.logoPreview')} 
                        className={`w-full h-full object-contain ${!logoPreview && !getLogoUrl() ? 'hidden' : ''}`} 
                      />
                    ) : (
                      <IoCloudUpload size={24} className="text-secondary-text" />
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                      <span className="text-[10px] text-white font-medium">{t('common.edit')}</span>
                    </label>
                  </div>
                  <div className="text-xs text-secondary-text mt-2">
                    <p>{t('system_settings.general_settings.logo_desc')}</p>
                    <p>{t('system_settings.general_settings.logo_max')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-2">
                    {t('system_settings.general_settings.currency')}
                  </label>
                  <select
                    value={formData.default_currency}
                    onChange={(e) => setFormData({ ...formData, default_currency: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent bg-white text-gray-900"
                  >
                    {currencies.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-secondary-text mt-1">{t('system_settings.general_settings.currency_desc')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-text mb-2">
                    {t('system_settings.general_settings.timezone')}
                  </label>
                  <select
                    value={formData.default_timezone}
                    onChange={(e) => setFormData({ ...formData, default_timezone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent bg-white text-gray-900"
                  >
                    {timezones.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-secondary-text mt-1">{t('system_settings.general_settings.timezone_desc')}</p>
                </div>
              </div>

              <div>
                <Input
                  label={t('system_settings.general_settings.timeout')}
                  type="number"
                  min="1"
                  max="1440"
                  value={formData.session_timeout}
                  onChange={(e) => setFormData({ ...formData, session_timeout: e.target.value })}
                  placeholder="30"
                />
                <p className="text-xs text-secondary-text mt-1">{t('system_settings.general_settings.timeout_desc')}</p>
              </div>
            </div>
          </Card>
        )}

        {/* File Upload Settings Tab */}
        {activeTab === 'files' && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-6">
              <IoCloudUpload size={24} className="text-primary-accent" />
              <h2 className="text-lg font-semibold text-primary-text">{t('system_settings.file_settings.title')}</h2>
            </div>
            <div className="space-y-5">
              <div>
                <Input
                  label={t('system_settings.file_settings.max_size')}
                  type="number"
                  min="1"
                  max="100"
                  value={formData.max_file_size}
                  onChange={(e) => setFormData({ ...formData, max_file_size: e.target.value })}
                  placeholder="10"
                />
                <p className="text-xs text-secondary-text mt-1">{t('system_settings.file_settings.max_size_desc')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  {t('system_settings.file_settings.allowed_types')}
                </label>
                <textarea
                  value={formData.allowed_file_types}
                  onChange={(e) => setFormData({ ...formData, allowed_file_types: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent bg-white text-gray-900"
                  placeholder="pdf,doc,docx,jpg,png"
                />
                <p className="text-xs text-secondary-text mt-1">{t('system_settings.file_settings.allowed_types_desc')}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <IoAlertCircle className="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">{t('system_settings.file_settings.info_title')}</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>{t('system_settings.file_settings.info_frontend')}</li>
                      <li>{t('system_settings.file_settings.info_backend')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Email/SMTP Settings Tab */}
        {activeTab === 'email' && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <IoMail size={24} className="text-primary-accent" />
                <h2 className="text-lg font-semibold text-primary-text">{t('system_settings.email_settings.title')}</h2>
              </div>
              <Button
                variant="outline"
                onClick={() => setTestEmailModalOpen(true)}
                className="flex items-center gap-2"
              >
                <IoSend size={16} />
                {t('system_settings.email_settings.test_email')}
              </Button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('system_settings.email_settings.sender_email')}
                  type="email"
                  value={formData.email_from}
                  onChange={(e) => setFormData({ ...formData, email_from: e.target.value })}
                  placeholder="noreply@beispiel.de"
                />
                <Input
                  label={t('system_settings.email_settings.sender_name')}
                  value={formData.email_from_name}
                  onChange={(e) => setFormData({ ...formData, email_from_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('system_settings.email_settings.smtp_host')}
                  value={formData.smtp_host}
                  onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('system_settings.email_settings.smtp_port')}
                    value={formData.smtp_port}
                    onChange={(e) => setFormData({ ...formData, smtp_port: e.target.value })}
                    placeholder="587"
                  />
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      {t('system_settings.email_settings.encryption')}
                    </label>
                    <select
                      value={formData.smtp_encryption}
                      onChange={(e) => setFormData({ ...formData, smtp_encryption: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent bg-white text-gray-900"
                    >
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="none">None / Keine</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('system_settings.email_settings.username')}
                  value={formData.smtp_username}
                  onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
                  placeholder="ihre-email@gmail.com"
                />
                <div className="relative">
                  <Input
                    label={t('system_settings.email_settings.password')}
                    type={showSmtpPassword ? 'text' : 'password'}
                    value={formData.smtp_password}
                    onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    className="absolute right-3 top-[38px] text-secondary-text hover:text-primary-text"
                  >
                    {showSmtpPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <IoWarning className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium mb-1">{t('system_settings.email_settings.security_note_title')}</p>
                    <p>{t('system_settings.email_settings.security_note_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Backup Settings Tab */}
        {activeTab === 'backup' && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-6">
              <IoCloud size={24} className="text-primary-accent" />
              <h2 className="text-lg font-semibold text-primary-text">{t('system_settings.backup_settings.title')}</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  {t('system_settings.backup_settings.frequency')}
                </label>
                <select
                  value={formData.backup_frequency}
                  onChange={(e) => setFormData({ ...formData, backup_frequency: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent bg-white text-gray-900"
                >
                  <option value="daily">{t('common.daily')}</option>
                  <option value="weekly">{t('common.weekly')}</option>
                  <option value="monthly">{t('common.monthly')}</option>
                </select>
                <p className="text-xs text-secondary-text mt-1">{t('system_settings.backup_settings.frequency_desc')}</p>
              </div>

              {formData.last_backup_time && (
                <div className="flex items-center gap-2 text-sm text-secondary-text">
                  <IoTime size={16} />
                  <span>{t('system_settings.backup_settings.last_backup')}: {new Date(formData.last_backup_time).toLocaleString('de-DE')}</span>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <IoCheckmarkCircle className="text-green-600 mt-0.5 flex-shrink-0" size={20} />
                  <div className="text-sm text-green-700">
                    <p className="font-medium mb-1">{t('system_settings.backup_settings.info_title')}</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>{t('system_settings.backup_settings.info_1')}</li>
                      <li>{t('system_settings.backup_settings.info_2')}</li>
                      <li>{t('system_settings.backup_settings.info_3')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Login Footer Settings Tab */}
        {activeTab === 'footer' && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-6">
              <IoLink size={24} className="text-primary-accent" />
              <h2 className="text-lg font-semibold text-primary-text">{t('system_settings.footer_settings.title')}</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">{t('system_settings.footer_settings.company_address')}</label>
                <textarea
                  value={formData.footer_company_address || ''}
                  onChange={(e) => setFormData({ ...formData, footer_company_address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label={t('system_settings.footer_settings.privacy_link')}
                  value={formData.footer_privacy_link || ''}
                  onChange={(e) => setFormData({ ...formData, footer_privacy_link: e.target.value })}
                  placeholder="https://beispiel.de/datenschutz"
                />
                <Input
                  label={t('system_settings.footer_settings.terms_link')}
                  value={formData.footer_terms_link || ''}
                  onChange={(e) => setFormData({ ...formData, footer_terms_link: e.target.value })}
                  placeholder="https://beispiel.de/agb"
                />
                <Input
                  label={t('system_settings.footer_settings.refund_link')}
                  value={formData.footer_refund_link || ''}
                  onChange={(e) => setFormData({ ...formData, footer_refund_link: e.target.value })}
                  placeholder="https://beispiel.de/rueckerstattung"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-primary-text mb-4">{t('system_settings.footer_settings.additional_links')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    label={`${t('system_settings.footer_settings.link_text')} 1`}
                    value={formData.footer_custom_link_1_text || ''}
                    onChange={(e) => setFormData({ ...formData, footer_custom_link_1_text: e.target.value })}
                    placeholder="z.B. Cookie-Richtlinie"
                  />
                  <Input
                    label={`${t('system_settings.footer_settings.link_url')} 1`}
                    value={formData.footer_custom_link_1_url || ''}
                    onChange={(e) => setFormData({ ...formData, footer_custom_link_1_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={`${t('system_settings.footer_settings.link_text')} 2`}
                    value={formData.footer_custom_link_2_text || ''}
                    onChange={(e) => setFormData({ ...formData, footer_custom_link_2_text: e.target.value })}
                    placeholder="z.B. Hilfe-Center"
                  />
                  <Input
                    label={`${t('system_settings.footer_settings.link_url')} 2`}
                    value={formData.footer_custom_link_2_url || ''}
                    onChange={(e) => setFormData({ ...formData, footer_custom_link_2_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <IoShield size={24} className="text-primary-accent" />
                  <h2 className="text-lg font-semibold text-primary-text">{t('system_settings.audit_settings.title')}</h2>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-primary-text">{t('system_settings.audit_settings.enable')}</p>
                  <p className="text-sm text-secondary-text">{t('system_settings.audit_settings.enable_desc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enable_audit_log}
                    onChange={(e) => setFormData({ ...formData, enable_audit_log: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
                </label>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-text flex items-center gap-2">
                  <IoList size={20} />
                  {t('system_settings.audit_settings.recent_logs')}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAuditLogs}
                  disabled={auditLoading}
                  className="flex items-center gap-2"
                >
                  <IoRefresh size={16} className={auditLoading ? 'animate-spin' : ''} />
                  {t('common.refresh')}
                </Button>
              </div>

              {auditLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-accent mx-auto"></div>
                  <p className="mt-2 text-secondary-text">{t('system_settings.messages.loading')}</p>
                </div>
              ) : auditLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <DataTable
                    data={auditLogs}
                    columns={auditColumns}
                    emptyMessage="Keine Prüfprotokolle gefunden"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-secondary-text">
                  <IoShield size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Keine Prüfprotokolle verfügbar</p>
                  <p className="text-sm mt-1">Änderungen an Systemeinstellungen werden hier protokolliert</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Test Email Modal */}
      <Modal
        isOpen={testEmailModalOpen}
        onClose={() => setTestEmailModalOpen(false)}
        title={t('system_settings.email_settings.test_email_modal_title')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-secondary-text text-sm">
            {t('system_settings.email_settings.test_email_modal_desc')}
          </p>
          <Input
            label={t('system_settings.email_settings.test_email')}
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@beispiel.de"
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setTestEmailModalOpen(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={handleTestEmail}
              disabled={testingEmail || !testEmail}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {testingEmail ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Wird gesendet...
                </>
              ) : (
                <>
                  <IoSend size={16} />
                  Test senden
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Settings
