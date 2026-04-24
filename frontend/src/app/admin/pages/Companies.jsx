import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { companiesAPI } from '../../../api'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import {
  IoCreate,
  IoTrash,
  IoEye,
  IoBusiness,
  IoGlobe,
  IoCall,
  IoLocation,
  IoPeople,
  IoTrendingUp,
  IoSearch,
  IoGrid,
  IoList,
  IoAdd,
  IoDocument,
  IoMail,
} from 'react-icons/io5'

/**
 * Companies Module - CRM
 * 
 * Purpose: Store business accounts/organizations
 * 
 * Fields:
 * - Company Name (required)
 * - Industry
 * - Website
 * - Address
 * - Phone
 * - Contacts under Company (computed)
 * - Open Deals (computed)
 * - Notes
 */

const Companies = () => {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const companyId = useMemo(() => {
    const id = user?.company_id || localStorage.getItem('companyId') || '1'
    return parseInt(id, 10) || 1
  }, [user])

  // State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [searchQuery, setSearchQuery] = useState('')

  // Form Data - matches CRM specification
  const [formData, setFormData] = useState({
    companyName: '',       // Company Name (required)
    industry: '',          // Industry type
    website: '',           // Website URL
    address: '',           // Full address
    city: '',              // City
    state: '',             // State/Province
    country: '',           // Country
    phone: '',             // Phone number
    notes: '',             // Notes
  })

  const [companies, setCompanies] = useState([])

  // Industry options
  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Manufacturing',
    'Retail',
    'Education',
    'Real Estate',
    'Consulting',
    'Marketing',
    'Legal',
    'Other'
  ]

  // Fetch companies on mount
  const dateLocale = language === 'de' ? 'de-DE' : language === 'en' ? 'en-GB' : (language || 'en-GB')

  useEffect(() => {
    fetchCompanies()
  }, [companyId, language])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const response = await companiesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        const fetchedCompanies = response.data.data || []
        const transformedCompanies = fetchedCompanies.map(company => ({
          id: company.id,
          companyName: company.name || company.company_name || '',
          industry: company.industry || '',
          website: company.website || '',
          address: company.address || '',
          city: company.city || '',
          state: company.state || '',
          country: company.country || '',
          phone: company.phone || '',
          notes: company.notes || '',
          contactsCount: company.contacts_count || company.total_contacts || 0,
          openDealsCount: company.open_deals_count || company.total_deals || 0,
          totalDealValue: company.total_deal_value || 0,
          status: company.status || 'Active',
          createdDate: company.created_at ? new Date(company.created_at).toLocaleDateString(dateLocale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) : '',
        }))
        setCompanies(transformedCompanies)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  // Filter companies based on search
  const filteredCompanies = companies.filter(company => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      company.companyName?.toLowerCase().includes(q) ||
      company.industry?.toLowerCase().includes(q) ||
      company.website?.toLowerCase().includes(q) ||
      company.city?.toLowerCase().includes(q)
    )
  })

  // Table columns
  const columns = [
    {
      key: 'logo',
      label: '',
      width: '60px',
      render: (value, row) => (
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          {row.companyName?.substring(0, 2).toUpperCase() || 'CO'}
        </div>
      ),
    },
    {
      key: 'companyName',
      label: t('companies.columns.company_name'),
      render: (value, row) => (
        <div>
          <a
            href="#"
            className="text-blue-600 hover:underline font-semibold"
            onClick={(e) => {
              e.preventDefault()
              handleView(row)
            }}
          >
            {value || '-'}
          </a>
        </div>
      ),
    },
    {
      key: 'industry',
      label: t('companies.columns.industry'),
      render: (value) => (
        <Badge variant="info" className="text-xs">
          {value || t('common.noData')}
        </Badge>
      ),
    },
    {
      key: 'website',
      label: t('companies.columns.website'),
      render: (value) => (
        value ? (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline flex items-center gap-1 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {value} <IoGlobe size={14} />
          </a>
        ) : <span className="text-gray-400">-</span>
      ),
    },
    {
      key: 'phone',
      label: t('companies.columns.phone'),
      render: (value) => value || '-',
    },
    {
      key: 'status',
      label: t('companies.columns.status'),
      render: (value) => (
        <Badge variant={value === 'Active' ? 'success' : 'danger'}>
          {value === 'Active' ? t('companies.active') : t('status.inactive')}
        </Badge>
      ),
    },
  ]

  // Handlers
  const handleAdd = () => {
    setFormData({
      companyName: '',
      industry: '',
      website: '',
      address: '',
      city: '',
      state: '',
      country: '',
      phone: '',
      notes: '',
    })
    setIsAddModalOpen(true)
  }

  const handleEdit = async (company) => {
    try {
      const response = await companiesAPI.getById(company.id)
      if (response.data.success && response.data.data) {
        const fullData = response.data.data
        setSelectedCompany(fullData)
        setFormData({
          companyName: fullData.name || fullData.company_name || '',
          industry: fullData.industry || '',
          website: fullData.website || '',
          address: fullData.address || '',
          city: fullData.city || '',
          state: fullData.state || '',
          country: fullData.country || '',
          phone: fullData.phone || '',
          notes: fullData.notes || '',
        })
        setIsEditModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching company:', error)
      // Fallback to row data
      setSelectedCompany(company)
      setFormData({
        companyName: company.companyName || '',
        industry: company.industry || '',
        website: company.website || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        country: company.country || '',
        phone: company.phone || '',
        notes: company.notes || '',
      })
      setIsEditModalOpen(true)
    }
  }

  const handleView = (company) => {
    const path = user?.role === 'EMPLOYEE' ? `/app/employee/companies/${company.id}` : `/app/admin/companies/${company.id}`;
    navigate(path)
  }

  const handleSave = async () => {
    if (!formData.companyName.trim()) {
      alert(t('messages.fieldRequired', { field: t('companies.columns.company_name') }))
      return
    }

    try {
      const companyData = {
        name: formData.companyName.trim(),
        industry: formData.industry || null,
        website: formData.website || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        phone: formData.phone || null,
        notes: formData.notes || null,
        company_id: companyId,
      }

      if (isEditModalOpen && selectedCompany) {
        const response = await companiesAPI.update(selectedCompany.id, companyData)
        if (response.data.success) {
          alert(t('messages.saveSuccess'))
          await fetchCompanies()
          setIsEditModalOpen(false)
        } else {
          alert(response.data.error || 'Unternehmen konnte nicht aktualisiert werden')
        }
      } else {
        const response = await companiesAPI.create(companyData)
        if (response.data.success) {
          alert(t('messages.saveSuccess'))
          await fetchCompanies()
          setIsAddModalOpen(false)
        } else {
          alert(response.data.error || 'Unternehmen konnte nicht erstellt werden')
        }
      }
    } catch (error) {
      console.error('Error saving company:', error)
      alert(error.response?.data?.error || 'Unternehmen konnte nicht gespeichert werden')
    }
  }

  const handleDelete = async (company) => {
    if (!window.confirm(t('messages.confirmDelete', { item: company.companyName }))) return
    try {
      const response = await companiesAPI.delete(company.id)
      if (response.data.success) {
        alert(t('messages.deleteSuccess'))
        await fetchCompanies()
      } else {
        alert(response.data.error || 'Unternehmen konnte nicht gelöscht werden')
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      alert(error.response?.data?.error || 'Unternehmen konnte nicht gelöscht werden')
    }
  }

  // Actions column
  const actions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); handleView(row) }}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Details ansehen"
      >
        <IoEye size={18} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); handleEdit(row) }}
        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        title="Bearbeiten"
      >
        <IoCreate size={18} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); handleDelete(row) }}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Löschen"
      >
        <IoTrash size={18} />
      </button>
    </div>
  )

  return (
    <div className="p-3 sm:p-6 space-y-6 sm:space-y-8 bg-[#F8FAFC] min-h-full">
      {/* Header Section with Glassmorphism Effect */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-0 z-10 mx-[-4px]">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight notranslate">{t('companies.title')}</h1>
          <p className="text-gray-500 mt-1 font-medium italic notranslate">{t('companies.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-accent transition-colors" size={20} />
            <input
              type="text"
              placeholder={t('companies.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 border-0 bg-gray-100/50 rounded-2xl text-sm focus:ring-2 focus:ring-primary-accent/30 focus:bg-white outline-none w-72 shadow-inner transition-all duration-300"
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-primary-accent hover:bg-primary-accent/90 text-white px-4 py-2 rounded-2xl font-bold transition-all active:scale-95 group"
          >
            <IoAdd size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="notranslate">{t('companies.add_company')}</span>
          </button>
        </div>
      </div>

      {/* Companies List */}
      <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl">
        {viewMode === 'list' ? (
          <DataTable
            columns={columns}
            data={filteredCompanies}
            loading={loading}
            actions={actions}
            searchPlaceholder={t("companies.search_placeholder")}
            filterConfig={[
              { key: 'industry', label: t('companies.columns.industry'), type: 'select', options: industries },
              { key: 'status', label: t('common.status'), type: 'select', options: ['Active', 'Inactive'] },
              { key: 'country', label: t('common.country'), type: 'text' },
              { key: 'city', label: t('common.city'), type: 'text' },
            ]}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {filteredCompanies.map((company) => (
              <Card
                key={company.id}
                className="p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleView(company)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {company.companyName?.substring(0, 2).toUpperCase() || 'CO'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{company.companyName}</h3>
                    <p className="text-sm text-gray-500 truncate">{company.industry || 'Keine Branche'}</p>
                    {company.website && (
                      <p className="text-xs text-blue-500 truncate mt-1">{company.website}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <IoPeople size={14} /> {company.contactsCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <IoTrendingUp size={14} /> {company.openDealsCount || 0}
                    </span>
                  </div>
                  <Badge variant={company.status === 'Active' ? 'success' : 'danger'}>
                    {company.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setSelectedCompany(null)
        }}
        title={isAddModalOpen ? t('companies.add_company') : t('companies.edit_company')}
      >
        <div className="space-y-4">
          <Input
            label={`${t('companies.form.company_name')} *`}
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder={t('companies.form.company_name')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('companies.form.industry')}</label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">{t('companies.form.select_industry')}</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{t('companies.industries.' + ind.toLowerCase().replace(' ', '_'))}</option>
              ))}
            </select>
          </div>

          <Input
            label={t('companies.form.website')}
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder={t('companies.form.website_placeholder') || "https://example.com"}
          />

          <Input
            label={t('companies.form.phone')}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder={t('companies.form.phone_placeholder') || "+1 234 567 8900"}
          />

          <Input
            label={t('companies.form.address')}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder={t('companies.form.address')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('companies.form.city')}
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder={t('companies.form.city')}
            />
            <Input
              label={t('companies.form.state')}
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder={t('companies.form.state')}
            />
          </div>

          <Input
            label={t('companies.form.country')}
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder={t('companies.form.country')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('companies.form.notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder={t('companies.form.notes') + '...'}
            />
          </div>

          <div className="flex gap-3 pt-4 justify-end border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                setSelectedCompany(null)
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {isAddModalOpen ? t('common.save') : t('common.save')}
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
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                {selectedCompany.companyName?.substring(0, 2).toUpperCase() || 'CO'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedCompany.companyName}</h2>
                <p className="text-gray-500">{selectedCompany.industry || t('common.noData')}</p>
              </div>
            </div>


            {/* Details */}
            <div className="space-y-4">
              {selectedCompany.website && (
                <div className="flex items-start gap-3">
                  <IoGlobe className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{t('companies.columns.website')}</p>
                    <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {selectedCompany.website}
                    </a>
                  </div>
                </div>
              )}

              {selectedCompany.phone && (
                <div className="flex items-start gap-3">
                  <IoCall className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{t('companies.columns.phone')}</p>
                    <p className="text-gray-800">{selectedCompany.phone}</p>
                  </div>
                </div>
              )}

              {(selectedCompany.address || selectedCompany.city) && (
                <div className="flex items-start gap-3">
                  <IoLocation className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{t('companies.columns.address')}</p>
                    <p className="text-gray-800">
                      {[selectedCompany.address, selectedCompany.city, selectedCompany.state, selectedCompany.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {selectedCompany.notes && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t('companies.columns.notes')}</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedCompany.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" className="flex-1" onClick={() => handleEdit(selectedCompany)}>
                <IoCreate className="mr-2" /> {t('common.edit')}
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => {
                const path = user?.role === 'EMPLOYEE' ? `/app/employee/contacts?company=${selectedCompany.id}` : `/app/admin/contacts?company=${selectedCompany.id}`;
                navigate(path);
              }}>
                <IoPeople className="mr-2" /> {t('companies.view_contacts')}
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default Companies
