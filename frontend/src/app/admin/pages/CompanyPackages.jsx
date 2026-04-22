import { useState, useEffect } from 'react'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { IoCreate, IoTrash, IoEye, IoCheckmarkCircle, IoPeople } from 'react-icons/io5'
import { companyPackagesAPI, companiesAPI } from '../../../api'

const CompanyPackages = () => {
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
        // Map API response to frontend format
        const mappedPackages = response.data.data.map(pkg => ({
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
        throw new Error(response.data.error || 'Failed to fetch packages')
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch company packages'
      
      alert(`Error: ${errorMessage}\n\nPlease check:\n1. You are logged in\n2. You have ADMIN role\n3. Your account has a company_id set\n4. Backend server is running`)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Package Name' },
    {
      key: 'price',
      label: 'Price',
      render: (value, row) => (
        <div>
          <span className="font-semibold text-primary-text">
            ${value}/{row.billingCycle === 'monthly' || row.billingCycle === 'Monthly' ? 'mo' : 'yr'}
          </span>
        </div>
      ),
    },
    {
      key: 'features',
      label: 'Features',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((feature, idx) => (
            <Badge key={idx} variant="default" className="text-xs">
              {feature}
            </Badge>
          ))}
          {value.length > 2 && (
            <Badge variant="default" className="text-xs">
              +{value.length - 2} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'companiesCount',
      label: 'Companies',
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="text-primary-text font-medium">{value || 0} assigned</span>
          {row.assignedCompanies && row.assignedCompanies.length > 0 && (
            <span className="text-xs text-secondary-text mt-1">
              {row.assignedCompanies.slice(0, 2).join(', ')}
              {row.assignedCompanies.length > 2 && ` +${row.assignedCompanies.length - 2} more`}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value, row) => (
        <Badge variant={value ? 'success' : 'default'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  const handleAdd = () => {
    setSelectedPackage(null)
    setIsEditModalOpen(false) // Ensure edit modal is closed
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
    setIsAddModalOpen(false) // Ensure add modal is closed
    setFormData({
      name: pkg.name || '',
      price: pkg.price ? pkg.price.toString() : '',
      billingCycle: pkg.billingCycle || 'monthly',
      features: Array.isArray(pkg.features) ? pkg.features : [],
      maxCompanies: pkg.maxCompanies === -1 ? 'unlimited' : (pkg.maxCompanies ? pkg.maxCompanies.toString() : ''),
      maxUsers: pkg.maxUsers === -1 ? 'unlimited' : (pkg.maxUsers ? pkg.maxUsers.toString() : ''),
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
      alert('Please select a company')
      return
    }

    try {
      setSaving(true)
      // Update company's package_id
      const response = await companiesAPI.update(selectedCompanyId, {
        package_id: selectedPackage.id
      })
      
      if (response.data.success) {
        alert('Company assigned to package successfully!')
        setIsAssignCompanyModalOpen(false)
        await fetchPackages()
      }
    } catch (error) {
      console.error('Failed to assign company:', error)
      alert(error.response?.data?.error || 'Failed to assign company to package')
    } finally {
      setSaving(false)
    }
  }

  const handleAddFeature = () => {
    const trimmedFeature = featureInput.trim()
    if (trimmedFeature) {
      setFormData(prevData => {
        const newFeatures = [...(prevData.features || []), trimmedFeature]
        console.log('Adding feature:', trimmedFeature)
        console.log('Updated features array:', newFeatures)
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
      alert('Package name and price are required')
      return
    }

    try {
      setSaving(true)
      // Ensure features is always an array - use current formData state
      const currentFeatures = Array.isArray(formData.features) ? formData.features : [];
      
      console.log('Current formData:', formData)
      console.log('Current features from formData:', formData.features)
      console.log('Features array to send:', currentFeatures)
      
      const apiData = {
        package_name: formData.name,
        price: parseFloat(formData.price),
        billing_cycle: formData.billingCycle.charAt(0).toUpperCase() + formData.billingCycle.slice(1),
        features: currentFeatures, // Always send as array
        status: formData.isActive ? 'Active' : 'Inactive',
      }
      
      console.log('Final API Data being sent:', JSON.stringify(apiData, null, 2));
      console.log('Features in API Data:', apiData.features);

      if (isEditModalOpen && selectedPackage) {
        const response = await companyPackagesAPI.update(selectedPackage.id, apiData)
        if (response.data.success) {
          alert('Package updated successfully!')
          setIsEditModalOpen(false)
          await fetchPackages()
        }
      } else {
        console.log('Creating new package...')
        console.log('Request payload:', JSON.stringify(apiData, null, 2))
        const response = await companyPackagesAPI.create(apiData)
        console.log('Create response:', response.data)
        if (response.data.success) {
          alert('Package created successfully!')
          setIsAddModalOpen(false)
          await fetchPackages()
        } else {
          alert(response.data.error || 'Failed to create package')
        }
      }
    } catch (error) {
      console.error('Failed to save package:', error)
      alert(error.response?.data?.error || 'Failed to save package')
    } finally {
      setSaving(false)
    }
  }

  const actions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleView(row)
        }}
        className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
        title="View Details"
      >
        <IoEye size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleAssignCompany(row)
        }}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Assign Company"
      >
        <IoPeople size={18} />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Edit button clicked for package:', row)
          handleEdit(row)
        }}
        className="p-2 text-warning hover:bg-warning hover:bg-opacity-10 rounded transition-colors"
        title="Edit"
        type="button"
      >
        <IoCreate size={18} />
      </button>
      <button
        onClick={async (e) => {
          e.stopPropagation()
          if (window.confirm(`Delete ${row.name} package?`)) {
            try {
              const response = await companyPackagesAPI.delete(row.id)
              if (response.data.success) {
                alert('Package deleted successfully!')
                await fetchPackages()
              }
            } catch (error) {
              console.error('Failed to delete package:', error)
              alert(error.response?.data?.error || 'Failed to delete package')
            }
          }
        }}
        className="p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded transition-colors"
        title="Delete"
      >
        <IoTrash size={18} />
      </button>
    </div>
  )

  if (loading && packages.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Company Packages</h1>
          <p className="text-secondary-text mt-1">Define subscription plans and assign packages to companies</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <p className="text-secondary-text">Loading packages...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Company Packages</h1>
          <p className="text-secondary-text mt-1">Define subscription plans and assign packages to companies</p>
        </div>
        <AddButton onClick={handleAdd} label="Add Package" />
      </div>

      {/* Package Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-primary-text">{pkg.name}</h3>
                <p className="text-2xl font-semibold text-primary-accent mt-1">
                  ${pkg.price}
                  <span className="text-sm text-secondary-text font-normal">/{pkg.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </p>
              </div>
              <Badge variant={pkg.isActive ? 'success' : 'default'}>
                {pkg.isActive ? 'Active' : 'Inactive'}
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
                <p className="text-xs text-secondary-text">+{pkg.features.length - 3} more features</p>
              )}
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-secondary-text">
                <span className="font-medium text-primary-text">{pkg.companiesCount}</span> companies assigned
              </p>
            </div>
          </Card>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={packages}
        searchPlaceholder="Search packages..."
        filters={true}
        actions={actions}
      />

      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setSelectedPackage(null)
          // Reset form data when closing
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
        title={isAddModalOpen ? 'Add New Package' : 'Edit Package'}
      >
        <div className="space-y-4">
          <Input
            label="Package Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Pro, Basic, Free"
          />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0"
              required
            />
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Billing Cycle
              </label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Features {formData.features && formData.features.length > 0 && (
                <span className="text-xs text-secondary-text font-normal">
                  ({formData.features.length} added)
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
                placeholder="Add a feature and press Enter"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.features && formData.features.length > 0 ? (
                formData.features.map((feature, index) => (
                  <Badge
                    key={index}
                    variant="default"
                    className="flex items-center gap-1"
                  >
                    {feature}
                    <button
                      onClick={() => handleRemoveFeature(index)}
                      className="ml-1 hover:text-danger"
                      type="button"
                    >
                      ×
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-secondary-text">No features added yet. Type a feature and press Enter.</p>
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
              Active (Package available for assignment)
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
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} className="px-4" disabled={saving}>
              {saving ? 'Saving...' : (isAddModalOpen ? 'Create Package' : 'Update Package')}
            </Button>
          </div>
        </div>
      </RightSideModal>

      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Package Details"
      >
        {selectedPackage && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-secondary-text">Package Name</label>
              <p className="text-primary-text mt-1 font-semibold">{selectedPackage.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Price</label>
              <p className="text-primary-text mt-1">
                ${selectedPackage.price}/{selectedPackage.billingCycle === 'monthly' || selectedPackage.billingCycle === 'Monthly' ? 'month' : selectedPackage.billingCycle === 'quarterly' || selectedPackage.billingCycle === 'Quarterly' ? 'quarter' : 'year'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Companies Assigned</label>
              <p className="text-primary-text mt-1 font-semibold">
                {selectedPackage.companiesCount || 0} companies
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
              <label className="text-sm font-medium text-secondary-text">Features</label>
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
              <label className="text-sm font-medium text-secondary-text">Status</label>
              <p className="mt-1">
                <Badge variant={selectedPackage.isActive ? 'success' : 'default'}>
                  {selectedPackage.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </p>
            </div>
          </div>
        )}
      </RightSideModal>

      {/* Assign Company Modal */}
      <RightSideModal
        isOpen={isAssignCompanyModalOpen}
        onClose={() => setIsAssignCompanyModalOpen(false)}
        title={`Assign Company to ${selectedPackage?.name || 'Package'}`}
      >
        {selectedPackage && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Select Company <span className="text-danger">*</span>
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              >
                <option value="">-- Select Company --</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-secondary-text mb-1">Package Details:</p>
              <p className="text-sm font-semibold text-primary-text">{selectedPackage.name}</p>
              <p className="text-xs text-secondary-text">
                ${selectedPackage.price}/{selectedPackage.billingCycle === 'monthly' || selectedPackage.billingCycle === 'Monthly' ? 'month' : 'year'}
              </p>
            </div>
            <div className="flex gap-2 pt-4 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAssignCompanyModalOpen(false)}
                className="px-4"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSaveAssignment} 
                className="px-4" 
                disabled={saving || !selectedCompanyId}
              >
                {saving ? 'Assigning...' : 'Assign Company'}
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default CompanyPackages

