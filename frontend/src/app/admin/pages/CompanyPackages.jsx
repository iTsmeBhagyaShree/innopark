import { useState, useEffect, useMemo, useCallback } from 'react'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { IoCreate, IoTrash, IoEye, IoCheckmarkCircle, IoPeople } from 'react-icons/io5'
import { companyPackagesAPI, companiesAPI } from '../../../api'
import { useLanguage } from '../../../context/LanguageContext'

const CompanyPackages = () => {
  const { t } = useLanguage()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isAssignCompanyModalOpen, setIsAssignCompanyModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    billingCycle: 'monthly',
    features: [],
    maxCompanies: '',
    maxUsers: '',
    maxStorage: '',
    isActive: true,
  })
  const [featureInput, setFeatureInput] = useState('')
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const priceShort = useCallback((cycle) => {
    const c = String(cycle || '').toLowerCase()
    if (c === 'monthly' || c === 'month') return t('company_packages.per_mo')
    if (c === 'quarterly' || c === 'quarter') return t('company_packages.per_q')
    return t('company_packages.per_yr')
  }, [t])

  const periodLabel = useCallback((cycle) => {
    const c = String(cycle || '').toLowerCase()
    if (c === 'monthly' || c === 'month') return t('company_packages.period_month')
    if (c === 'quarterly' || c === 'quarter') return t('company_packages.period_quarter')
    return t('company_packages.period_year')
  }, [t])

  useEffect(() => {
    fetchPackages()
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getAll()
      if (response.data.success) {
        setCompanies(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    }
  }

  const fetchPackages = async () => {
    try {
      setLoading(true)
      const response = await companyPackagesAPI.getAll()
      if (response.data.success) {
        const mappedPackages = response.data.data.map((pkg) => ({
          id: pkg.id,
          name: pkg.package_name,
          price: parseFloat(pkg.price),
          billingCycle: pkg.billing_cycle?.toLowerCase() || 'monthly',
          features: Array.isArray(pkg.features) ? pkg.features : [],
          isActive: pkg.status === 'Active',
          companiesCount: pkg.companies_count || 0,
          assignedCompanies: Array.isArray(pkg.assigned_companies) ? pkg.assigned_companies : [],
        }))
        setPackages(mappedPackages)
      } else {
        throw new Error(response.data.error || t('company_packages.fetch_failed'))
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        t('company_packages.fetch_failed')

      alert(t('company_packages.fetch_error_body').replace('{{msg}}', errorMessage))
    } finally {
      setLoading(false)
    }
  }

  const columns = useMemo(
    () => [
      { key: 'name', label: t('company_packages.col_name') },
      {
        key: 'price',
        label: t('company_packages.col_price'),
        render: (value, row) => (
          <div>
            <span className="font-semibold text-primary-text">
              ${value}/{priceShort(row.billingCycle)}
            </span>
          </div>
        ),
      },
      {
        key: 'features',
        label: t('company_packages.col_features'),
        render: (value) => (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 2).map((feature, idx) => (
              <Badge key={idx} variant="default" className="text-xs">
                {feature}
              </Badge>
            ))}
            {value.length > 2 && (
              <Badge variant="default" className="text-xs">
                {t('company_packages.more').replace('{{n}}', String(value.length - 2))}
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: 'companiesCount',
        label: t('company_packages.col_companies'),
        render: (value, row) => (
          <div className="flex flex-col">
            <span className="text-primary-text font-medium">
              {t('company_packages.assigned_count').replace('{{n}}', String(value || 0))}
            </span>
            {row.assignedCompanies && row.assignedCompanies.length > 0 && (
              <span className="text-xs text-secondary-text mt-1">
                {row.assignedCompanies.slice(0, 2).join(', ')}
                {row.assignedCompanies.length > 2 &&
                  ` ${t('company_packages.more').replace('{{n}}', String(row.assignedCompanies.length - 2))}`}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'isActive',
        label: t('company_packages.col_status'),
        render: (value) => (
          <Badge variant={value ? 'success' : 'default'}>
            {value ? t('company_packages.active') : t('company_packages.inactive')}
          </Badge>
        ),
      },
    ],
    [t, priceShort]
  )

  const handleAdd = () => {
    setSelectedPackage(null)
    setIsEditModalOpen(false)
    setFormData({
      name: '',
      price: '',
      billingCycle: 'monthly',
      features: [],
      maxCompanies: '',
      maxUsers: '',
      maxStorage: '',
      isActive: true,
    })
    setFeatureInput('')
    setIsAddModalOpen(true)
  }

  const handleEdit = (pkg) => {
    setSelectedPackage(pkg)
    setIsAddModalOpen(false)
    setFormData({
      name: pkg.name || '',
      price: pkg.price ? pkg.price.toString() : '',
      billingCycle: pkg.billingCycle || 'monthly',
      features: Array.isArray(pkg.features) ? pkg.features : [],
      maxCompanies: pkg.maxCompanies === -1 ? 'unlimited' : pkg.maxCompanies ? pkg.maxCompanies.toString() : '',
      maxUsers: pkg.maxUsers === -1 ? 'unlimited' : pkg.maxUsers ? pkg.maxUsers.toString() : '',
      maxStorage: pkg.maxStorage || '',
      isActive: pkg.isActive !== undefined ? pkg.isActive : true,
    })
    setFeatureInput('')
    setIsEditModalOpen(true)
  }

  const handleView = (pkg) => {
    setSelectedPackage(pkg)
    setIsViewModalOpen(true)
  }

  const handleAssignCompany = (pkg) => {
    setSelectedPackage(pkg)
    setSelectedCompanyId('')
    setIsAssignCompanyModalOpen(true)
  }

  const handleSaveAssignment = async () => {
    if (!selectedCompanyId) {
      alert(t('company_packages.alert_select_company'))
      return
    }

    try {
      setSaving(true)
      const response = await companiesAPI.update(selectedCompanyId, {
        package_id: selectedPackage.id,
      })

      if (response.data.success) {
        alert(t('company_packages.alert_assign_success'))
        setIsAssignCompanyModalOpen(false)
        await fetchPackages()
      }
    } catch (error) {
      console.error('Failed to assign company:', error)
      alert(error.response?.data?.error || t('company_packages.alert_assign_failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleAddFeature = () => {
    const trimmedFeature = featureInput.trim()
    if (trimmedFeature) {
      setFormData((prevData) => {
        const newFeatures = [...(prevData.features || []), trimmedFeature]
        return {
          ...prevData,
          features: newFeatures,
        }
      })
      setFeatureInput('')
    }
  }

  const handleRemoveFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      alert(t('company_packages.alert_name_price_required'))
      return
    }

    try {
      setSaving(true)
      const currentFeatures = Array.isArray(formData.features) ? formData.features : []

      const apiData = {
        package_name: formData.name,
        price: parseFloat(formData.price),
        billing_cycle: formData.billingCycle.charAt(0).toUpperCase() + formData.billingCycle.slice(1),
        features: currentFeatures,
        status: formData.isActive ? 'Active' : 'Inactive',
      }

      if (isEditModalOpen && selectedPackage) {
        const response = await companyPackagesAPI.update(selectedPackage.id, apiData)
        if (response.data.success) {
          alert(t('company_packages.alert_updated'))
          setIsEditModalOpen(false)
          await fetchPackages()
        }
      } else {
        const response = await companyPackagesAPI.create(apiData)
        if (response.data.success) {
          alert(t('company_packages.alert_created'))
          setIsAddModalOpen(false)
          await fetchPackages()
        } else {
          alert(response.data.error || t('company_packages.alert_create_failed'))
        }
      }
    } catch (error) {
      console.error('Failed to save package:', error)
      alert(error.response?.data?.error || t('company_packages.alert_save_failed'))
    } finally {
      setSaving(false)
    }
  }

  const actions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handleView(row)
        }}
        className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
        title={t('company_packages.title_view_details')}
      >
        <IoEye size={18} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handleAssignCompany(row)
        }}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title={t('company_packages.title_assign_company')}
      >
        <IoPeople size={18} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleEdit(row)
        }}
        className="p-2 text-warning hover:bg-warning hover:bg-opacity-10 rounded transition-colors"
        title={t('company_packages.title_edit')}
      >
        <IoCreate size={18} />
      </button>
      <button
        type="button"
        onClick={async (e) => {
          e.stopPropagation()
          if (window.confirm(t('company_packages.confirm_delete').replace('{{name}}', row.name))) {
            try {
              const response = await companyPackagesAPI.delete(row.id)
              if (response.data.success) {
                alert(t('company_packages.alert_deleted'))
                await fetchPackages()
              }
            } catch (error) {
              console.error('Failed to delete package:', error)
              alert(error.response?.data?.error || t('company_packages.alert_delete_failed'))
            }
          }
        }}
        className="p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded transition-colors"
        title={t('company_packages.title_delete')}
      >
        <IoTrash size={18} />
      </button>
    </div>
  )

  if (loading && packages.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">{t('company_packages.title')}</h1>
          <p className="text-secondary-text mt-1">{t('company_packages.subtitle')}</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <p className="text-secondary-text">{t('company_packages.loading')}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">{t('company_packages.title')}</h1>
          <p className="text-secondary-text mt-1">{t('company_packages.subtitle')}</p>
        </div>
        <AddButton onClick={handleAdd} label={t('company_packages.add_package')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-primary-text">{pkg.name}</h3>
                <p className="text-2xl font-semibold text-primary-accent mt-1">
                  ${pkg.price}
                  <span className="text-sm text-secondary-text font-normal">/{priceShort(pkg.billingCycle)}</span>
                </p>
              </div>
              <Badge variant={pkg.isActive ? 'success' : 'default'}>
                {pkg.isActive ? t('company_packages.active') : t('company_packages.inactive')}
              </Badge>
            </div>
            <div className="space-y-2 mb-4">
              {pkg.features.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-secondary-text">
                  <IoCheckmarkCircle className="text-primary-accent" size={16} />
                  <span>{feature}</span>
                </div>
              ))}
              {pkg.features.length > 3 && (
                <p className="text-xs text-secondary-text">
                  {t('company_packages.more_features').replace('{{n}}', String(pkg.features.length - 3))}
                </p>
              )}
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-secondary-text">
                {t('company_packages.companies_assigned_line').replace('{{n}}', String(pkg.companiesCount || 0))}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={packages}
        searchPlaceholder={t('company_packages.search_placeholder')}
        filters={true}
        actions={actions}
      />

      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setSelectedPackage(null)
          setFormData({
            name: '',
            price: '',
            billingCycle: 'monthly',
            features: [],
            maxCompanies: '',
            maxUsers: '',
            maxStorage: '',
            isActive: true,
          })
          setFeatureInput('')
        }}
        title={isAddModalOpen ? t('company_packages.modal_add') : t('company_packages.modal_edit')}
      >
        <div className="space-y-4">
          <Input
            label={t('company_packages.label_name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('company_packages.placeholder_name')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('company_packages.label_price')}
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0"
              required
            />
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">{t('company_packages.label_billing_cycle')}</label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              >
                <option value="monthly">{t('company_packages.billing_monthly')}</option>
                <option value="yearly">{t('company_packages.billing_yearly')}</option>
                <option value="quarterly">{t('company_packages.billing_quarterly')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('company_packages.features_heading')}{' '}
              {formData.features && formData.features.length > 0 && (
                <span className="text-xs text-secondary-text font-normal">
                  {t('company_packages.features_count').replace('{{n}}', String(formData.features.length))}
                </span>
              )}
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddFeature()
                  }
                }}
                placeholder={t('company_packages.feature_input_placeholder')}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.features && formData.features.length > 0 ? (
                formData.features.map((feature, index) => (
                  <Badge key={index} variant="default" className="flex items-center gap-1">
                    {feature}
                    <button onClick={() => handleRemoveFeature(index)} className="ml-1 hover:text-danger" type="button">
                      ×
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-secondary-text">{t('company_packages.features_empty')}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-primary-text">
              {t('company_packages.active_checkbox')}
            </label>
          </div>
          <div className="flex gap-2 pt-4 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
              }}
              className="px-4"
            >
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSave} className="px-4" disabled={saving}>
              {saving ? t('company_packages.saving') : isAddModalOpen ? t('company_packages.create_package') : t('company_packages.update_package')}
            </Button>
          </div>
        </div>
      </RightSideModal>

      <RightSideModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={t('company_packages.view_modal_title')}>
        {selectedPackage && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('company_packages.detail_name')}</label>
              <p className="text-primary-text mt-1 font-semibold">{selectedPackage.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('company_packages.detail_price')}</label>
              <p className="text-primary-text mt-1">
                ${selectedPackage.price}/{periodLabel(selectedPackage.billingCycle)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('company_packages.detail_companies')}</label>
              <p className="text-primary-text mt-1 font-semibold">
                {t('company_packages.companies_count').replace('{{n}}', String(selectedPackage.companiesCount || 0))}
              </p>
              {selectedPackage.assignedCompanies && selectedPackage.assignedCompanies.length > 0 && (
                <div className="mt-2 space-y-1">
                  {selectedPackage.assignedCompanies.map((companyName, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-primary-text">
                      <IoCheckmarkCircle className="text-primary-accent" size={14} />
                      <span>{companyName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('company_packages.detail_features')}</label>
              <ul className="mt-2 space-y-2">
                {selectedPackage.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-primary-text">
                    <IoCheckmarkCircle className="text-primary-accent" size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('company_packages.detail_status')}</label>
              <p className="mt-1">
                <Badge variant={selectedPackage.isActive ? 'success' : 'default'}>
                  {selectedPackage.isActive ? t('company_packages.active') : t('company_packages.inactive')}
                </Badge>
              </p>
            </div>
          </div>
        )}
      </RightSideModal>

      <RightSideModal
        isOpen={isAssignCompanyModalOpen}
        onClose={() => setIsAssignCompanyModalOpen(false)}
        title={t('company_packages.assign_title').replace('{{name}}', selectedPackage?.name || t('company_packages.package_fallback'))}
      >
        {selectedPackage && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                {t('company_packages.assign_select_label')} <span className="text-danger">*</span>
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              >
                <option value="">{t('company_packages.assign_placeholder')}</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-secondary-text mb-1">{t('company_packages.assign_summary')}</p>
              <p className="text-sm font-semibold text-primary-text">{selectedPackage.name}</p>
              <p className="text-xs text-secondary-text">
                ${selectedPackage.price}/{periodLabel(selectedPackage.billingCycle)}
              </p>
            </div>
            <div className="flex gap-2 pt-4 justify-end">
              <Button variant="outline" onClick={() => setIsAssignCompanyModalOpen(false)} className="px-4">
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={handleSaveAssignment} className="px-4" disabled={saving || !selectedCompanyId}>
                {saving ? t('company_packages.assigning') : t('company_packages.assign_btn')}
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default CompanyPackages
