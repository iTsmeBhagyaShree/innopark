import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../context/LanguageContext'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import axiosInstance from '../../../api/axiosInstance'
import { IoCreate, IoTrash, IoEye, IoSearch } from 'react-icons/io5'

const Companies = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [companies, setCompanies] = useState([])
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    address: '',
    notes: '',
    currency: 'USD',
    timezone: 'UTC',
    package_id: '',
  })

  useEffect(() => {
    fetchCompanies()
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await axiosInstance.get('/superadmin/packages')
      if (response.data.success) {
        setPackages(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
  }

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/superadmin/companies', {
        params: { search: searchQuery }
      })
      if (response.data.success) {
        setCompanies(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchCompanies()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleSave = async () => {
    try {
      if (selectedCompany) {
        await axiosInstance.put(`/superadmin/companies/${selectedCompany.id}`, formData)
      } else {
        await axiosInstance.post('/superadmin/companies', formData)
      }

      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
      setSelectedCompany(null)
      resetForm()
      fetchCompanies()
    } catch (error) {
      console.error('Error saving company:', error)
      alert(error.response?.data?.error || (t('save_failed') === 'save_failed' ? 'Unternehmen konnte nicht gespeichert werden' : t('save_failed')))
    }
  }

  const handleEdit = (company) => {
    setSelectedCompany(company)
    setFormData({
      name: company.name || '',
      industry: company.industry || '',
      website: company.website || '',
      address: company.address || '',
      notes: company.notes || '',
      currency: company.currency || 'USD',
      timezone: company.timezone || 'UTC',
      package_id: company.package_id || '',
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete') === 'confirm_delete' ? 'Sind Sie sicher, dass Sie dieses Unternehmen löschen möchten?' : t('confirm_delete'))) return

    try {
      await axiosInstance.delete(`/superadmin/companies/${id}`)
      fetchCompanies()
    } catch (error) {
      console.error('Error deleting company:', error)
      alert(error.response?.data?.error || (t('delete_failed') === 'delete_failed' ? 'Unternehmen konnte nicht gelöscht werden' : t('delete_failed')))
    }
  }

  const handleView = (company) => {
    setSelectedCompany(company)
    setIsViewModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      industry: '',
      website: '',
      address: '',
      notes: '',
      currency: 'USD',
      timezone: 'UTC',
      package_id: '',
    })
    setSelectedCompany(null)
  }

  const columns = [
    { key: 'name', label: t('companies.company_name') },
    { key: 'industry', label: t('companies.industry') },
    {
      key: 'package_name',
      label: t('companies.package'),
      render: (value) => (
        <span className="text-primary-accent font-medium">
          {value || t('companies.no_package')}
        </span>
      ),
    },
    {
      key: 'total_users',
      label: t('users'),
      render: (value) => <span>{value || 0}</span>,
    },
    {
      key: 'total_clients',
      label: t('clients'),
      render: (value) => <span>{value || 0}</span>,
    },
    {
      key: 'total_projects',
      label: t('projects'),
      render: (value) => <span>{value || 0}</span>,
    },
    {
      key: 'created_at',
      label: t('common.created'),
      render: (value) => (
        <span>{new Date(value).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}</span>
      ),
    },
    {
      key: 'actions',
      label: t('actions'),
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleView(row)}
            className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
          >
            <IoEye size={18} />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-primary-accent hover:bg-primary-accent hover:text-white rounded-lg transition-colors"
          >
            <IoCreate size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
          >
            <IoTrash size={18} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-text">{t('companies.title')}</h1>
          <p className="text-secondary-text mt-1">{t('companies.subtitle')}</p>
        </div>
        <AddButton onClick={() => { resetForm(); setIsAddModalOpen(true) }} label={t('companies.add_company')} />
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text" size={20} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('companies.search_placeholder')}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Companies Table */}
      <Card className="p-0">
        <DataTable
          data={companies}
          columns={columns}
          loading={loading}
          emptyMessage={t('companies.no_companies_found')}
        />
      </Card>

      {/* Add/Edit Modal */}
      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          resetForm()
        }}
        title={selectedCompany ? t('companies.edit_company') : t('companies.add_company')}
      >
        <div className="space-y-4">
          <Input
            label={t('companies.company_name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('companies.company_name_placeholder')}
            required
          />

          <Input
            label={t('companies.industry')}
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            placeholder={t('companies.industry_placeholder')}
          />

          <Input
            label={t('companies.website')}
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://example.com"
          />

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('companies.package')}
            </label>
            <select
              value={formData.package_id}
              onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            >
              <option value="">{t('companies.select_package')}</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.package_name} - ${pkg.price}/{pkg.billing_cycle}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                {t('companies.currency')}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              >
                <option value="USD">USD – US Dollar</option>
                <option value="EUR">EUR – Euro</option>
                <option value="GBP">GBP – British Pound</option>
                <option value="INR">INR – Indian Rupee</option>
                <option value="JPY">JPY – Japanese Yen</option>
                <option value="AUD">AUD – Australian Dollar</option>
                <option value="CAD">CAD – Canadian Dollar</option>
                <option value="CHF">CHF – Swiss Franc</option>
                <option value="CNY">CNY – Chinese Yuan</option>
                <option value="AED">AED – UAE Dirham</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                {t('companies.timezone')}
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              >
                <option value="UTC">UTC</option>
                <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                <option value="Europe/Rome">Europe/Rome (CET/CEST)</option>
                <option value="Europe/Madrid">Europe/Madrid (CET/CEST)</option>
                <option value="Europe/Amsterdam">Europe/Amsterdam (CET/CEST)</option>
                <option value="Europe/Warsaw">Europe/Warsaw (CET/CEST)</option>
                <option value="Europe/Moscow">Europe/Moscow (MSK)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                <option value="America/Denver">America/Denver (MST/MDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                <option value="Pacific/Auckland">Pacific/Auckland (NZST)</option>
              </select>
            </div>
          </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                {t('companies.address')}
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t('companies.address_placeholder')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              />
            </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('companies.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('companies.notes_placeholder')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                resetForm()
              }}
              className="px-6 py-2.5"
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="px-6 py-2.5 bg-primary-accent text-white hover:bg-primary-accent/90"
            >
              {t('common.save') || 'Save'}
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* View Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedCompany(null)
        }}
        title={t('companies.view_company')}
      >
        {selectedCompany && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('companies.company_name')}</label>
              <p className="text-primary-text font-semibold">{selectedCompany.name || 'K.A.'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('companies.industry')}</label>
              <p className="text-primary-text">{selectedCompany.industry || 'K.A.'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('companies.website')}</label>
              <p className="text-primary-text">
                {selectedCompany.website ? (
                  <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-primary-accent hover:underline">
                    {selectedCompany.website}
                  </a>
                ) : 'K.A.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">{t('companies.currency')}</label>
                <p className="text-primary-text">{selectedCompany.currency || 'USD'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">{t('companies.timezone')}</label>
                <p className="text-primary-text">{selectedCompany.timezone || 'UTC'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('users')}</label>
              <p className="text-primary-text">{selectedCompany.total_users || 0}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('clients')}</label>
              <p className="text-primary-text">{selectedCompany.total_clients || 0}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('projects')}</label>
              <p className="text-primary-text">{selectedCompany.total_projects || 0}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('companies.address')}</label>
              <p className="text-primary-text">{selectedCompany.address || 'K.A.'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('companies.notes')}</label>
              <p className="text-primary-text">{selectedCompany.notes || 'K.A.'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('common.created')}</label>
              <p className="text-primary-text">
                {selectedCompany.created_at ? new Date(selectedCompany.created_at).toLocaleString(language === 'de' ? 'de-DE' : 'en-US') : t('common.na')}
              </p>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedCompany(null)
                }}
                className="px-6 py-2.5"
              >
                {t('close')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleEdit(selectedCompany)
                }}
                className="px-6 py-2.5 bg-primary-accent text-white hover:bg-primary-accent/90"
              >
                {t('edit_company')}
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default Companies
