import { useState, useEffect, useCallback } from 'react'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { 
  socialMediaIntegrationsAPI, 
  companiesAPI, 
  usersAPI 
} from '../../../api'
import { 
  IoCreate, 
  IoTrash, 
  IoCheckmarkCircle, 
  IoCloseCircle, 
  IoLogoFacebook, 
  IoLogoInstagram, 
  IoLogoLinkedin,
  IoEye
} from 'react-icons/io5'

const SocialMediaLeads = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [integrations, setIntegrations] = useState([])
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    company_id: '',
    platform: 'Facebook',
    name: '',
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    autoCreateLead: true,
    autoAssignTo: '',
    autoEmailTemplate: '',
    autoTaskTemplate: '',
  })

  const platforms = [
    { value: 'Facebook', label: 'Facebook', icon: IoLogoFacebook, color: '#1877F2' },
    { value: 'Instagram', label: 'Instagram', icon: IoLogoInstagram, color: '#E4405F' },
    { value: 'LinkedIn', label: 'LinkedIn', icon: IoLogoLinkedin, color: '#0077B5' },
  ]

  // Fetch data on mount
  useEffect(() => {
    fetchIntegrations()
    fetchCompanies()
    fetchUsers()
  }, [])

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Fetching social media integrations...')
      const response = await socialMediaIntegrationsAPI.getAll()
      console.log('Integrations API response:', response.data)
      
      if (response.data && response.data.success) {
        const fetchedIntegrations = response.data.data || []
        console.log('Fetched integrations count:', fetchedIntegrations.length)
        
        const transformedIntegrations = fetchedIntegrations.map(integration => ({
          id: integration.id,
          company_id: integration.company_id,
          company_name: integration.company_name || '--',
          platform: integration.platform,
          name: integration.name,
          status: integration.status || 'Disconnected',
          lastSync: integration.last_sync 
            ? new Date(integration.last_sync).toLocaleString() 
            : 'Never',
          leadsCaptured: integration.leads_captured || 0,
          autoCreateLead: integration.auto_create_lead === 1,
          autoAssignTo: integration.auto_assign_to_name || integration.auto_assign_to || '',
          webhookUrl: integration.webhook_url || '',
          autoEmailTemplate: integration.auto_email_template || '',
          autoTaskTemplate: integration.auto_task_template || '',
        }))
        console.log('Transformed integrations:', transformedIntegrations)
        setIntegrations(transformedIntegrations)
      } else {
        console.error('Failed to fetch integrations:', response.data?.error)
        setIntegrations([])
      }
    } catch (error) {
      console.error('Error fetching integrations:', error)
      console.error('Error details:', error.response?.data || error.message)
      setIntegrations([])
      alert(error.response?.data?.error || 'Failed to fetch integrations. Please check console for details.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getAll()
      if (response.data.success) {
        setCompanies(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll()
      if (response.data.success) {
        setUsers(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const columns = [
    {
      key: 'platform',
      label: 'Platform',
      render: (value) => {
        const platform = platforms.find(p => p.value === value)
        const Icon = platform?.icon || IoLogoFacebook
        return (
          <div className="flex items-center gap-2">
            <Icon size={20} style={{ color: platform?.color }} />
            <span className="text-sm">{value}</span>
          </div>
        )
      },
    },
    { key: 'name', label: 'Integration Name' },
    { key: 'company_name', label: 'Company' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge variant={value === 'Connected' ? 'success' : 'default'}>
          {value === 'Connected' ? (
            <span className="flex items-center gap-1">
              <IoCheckmarkCircle size={14} />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <IoCloseCircle size={14} />
              Disconnected
            </span>
          )}
        </Badge>
      ),
    },
    { 
      key: 'lastSync', 
      label: 'Last Sync',
      render: (value) => <span className="text-sm">{value}</span>
    },
    {
      key: 'leadsCaptured',
      label: 'Leads Captured',
      render: (value) => (
        <span className="font-semibold text-primary-text">{value}</span>
      ),
    },
    {
      key: 'autoCreateLead',
      label: 'Auto Create',
      render: (value) => (
        <Badge variant={value ? 'success' : 'default'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      ),
    },
  ]

  const handleAdd = () => {
    setFormData({
      company_id: '',
      platform: 'Facebook',
      name: '',
      apiKey: '',
      apiSecret: '',
      webhookUrl: '',
      autoCreateLead: true,
      autoAssignTo: '',
      autoEmailTemplate: '',
      autoTaskTemplate: '',
    })
    setSelectedIntegration(null)
    setIsAddModalOpen(true)
  }

  const handleEdit = async (integration) => {
    try {
      const response = await socialMediaIntegrationsAPI.getById(integration.id)
      if (response.data.success) {
        const data = response.data.data
        setSelectedIntegration(integration)
        setFormData({
          company_id: data.company_id?.toString() || '',
          platform: data.platform || 'Facebook',
          name: data.name || '',
          apiKey: data.api_key || '',
          apiSecret: data.api_secret || '',
          webhookUrl: data.webhook_url || '',
          autoCreateLead: data.auto_create_lead === 1,
          autoAssignTo: data.auto_assign_to?.toString() || '',
          autoEmailTemplate: data.auto_email_template || '',
          autoTaskTemplate: data.auto_task_template || '',
        })
        setIsEditModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching integration:', error)
      alert('Failed to load integration details')
    }
  }

  const handleView = async (integration) => {
    try {
      const response = await socialMediaIntegrationsAPI.getById(integration.id)
      if (response.data.success) {
        const data = response.data.data
        setSelectedIntegration({
          ...integration,
          ...data,
          company_name: data.company_name || '--',
          auto_assign_to_name: data.auto_assign_to_name || '--',
        })
        setIsViewModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching integration:', error)
      setSelectedIntegration(integration)
      setIsViewModalOpen(true)
    }
  }

  const handleConnect = async (integration) => {
    if (window.confirm(`Connect ${integration.name}?`)) {
      try {
        const response = await socialMediaIntegrationsAPI.connect(integration.id)
        if (response.data.success) {
          alert('Integration connected successfully!')
          await fetchIntegrations()
        } else {
          alert(response.data.error || 'Failed to connect integration')
        }
      } catch (error) {
        console.error('Error connecting integration:', error)
        alert(error.response?.data?.error || 'Failed to connect integration')
      }
    }
  }

  const handleDisconnect = async (integration) => {
    if (window.confirm(`Disconnect ${integration.name}?`)) {
      try {
        const response = await socialMediaIntegrationsAPI.disconnect(integration.id)
        if (response.data.success) {
          alert('Integration disconnected successfully!')
          await fetchIntegrations()
        } else {
          alert(response.data.error || 'Failed to disconnect integration')
        }
      } catch (error) {
        console.error('Error disconnecting integration:', error)
        alert(error.response?.data?.error || 'Failed to disconnect integration')
      }
    }
  }

  const handleSave = async () => {
    if (!formData.company_id) {
      alert('Company is required')
      return
    }
    if (!formData.name) {
      alert('Integration name is required')
      return
    }

    try {
      const integrationData = {
        company_id: parseInt(formData.company_id),
        platform: formData.platform,
        name: formData.name,
        api_key: formData.apiKey || null,
        api_secret: formData.apiSecret || null,
        webhook_url: formData.webhookUrl || null,
        auto_create_lead: formData.autoCreateLead,
        auto_assign_to: formData.autoAssignTo ? parseInt(formData.autoAssignTo) : null,
        auto_email_template: formData.autoEmailTemplate || null,
        auto_task_template: formData.autoTaskTemplate || null,
      }

      if (isEditModalOpen && selectedIntegration) {
        const response = await socialMediaIntegrationsAPI.update(selectedIntegration.id, integrationData)
        if (response.data.success) {
          alert('Integration updated successfully!')
          await fetchIntegrations()
          setIsEditModalOpen(false)
          setSelectedIntegration(null)
        } else {
          alert(response.data.error || 'Failed to update integration')
        }
      } else {
        const response = await socialMediaIntegrationsAPI.create(integrationData)
        if (response.data.success) {
          alert('Integration created successfully!')
          await fetchIntegrations()
          setIsAddModalOpen(false)
        } else {
          alert(response.data.error || 'Failed to create integration')
        }
      }
    } catch (error) {
      console.error('Error saving integration:', error)
      alert(error.response?.data?.error || 'Failed to save integration')
    }
  }

  const handleDelete = async (integration) => {
    if (window.confirm(`Delete integration "${integration.name}"?`)) {
      try {
        const response = await socialMediaIntegrationsAPI.delete(integration.id)
        if (response.data.success) {
          alert('Integration deleted successfully!')
          await fetchIntegrations()
        } else {
          alert(response.data.error || 'Failed to delete integration')
        }
      } catch (error) {
        console.error('Error deleting integration:', error)
        alert(error.response?.data?.error || 'Failed to delete integration')
      }
    }
  }

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1 sm:gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleView(row)
        }}
        className="p-1.5 sm:p-2 text-primary-accent hover:bg-primary-accent/10 rounded transition-colors"
        title="View"
      >
        <IoEye size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
      {row.status === 'Connected' ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDisconnect(row)
          }}
          className="p-1.5 sm:p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded transition-colors"
          title="Disconnect"
        >
          <IoCloseCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleConnect(row)
          }}
          className="p-1.5 sm:p-2 text-success hover:bg-success hover:bg-opacity-10 rounded transition-colors"
          title="Connect"
        >
          <IoCheckmarkCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleEdit(row)
        }}
        className="p-1.5 sm:p-2 text-warning hover:bg-warning hover:bg-opacity-10 rounded transition-colors"
        title="Edit"
      >
        <IoCreate size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDelete(row)
        }}
        className="p-1.5 sm:p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded transition-colors"
        title="Delete"
      >
        <IoTrash size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">Social Media Leads Integration</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">Connect Facebook, Instagram, and LinkedIn to automatically capture leads</p>
        </div>
        <AddButton onClick={handleAdd} label="Add Integration" />
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map((platform) => {
          const integration = integrations.find(i => i.platform === platform.value)
          const Icon = platform.icon
          return (
            <Card
              key={platform.value}
              className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${platform.color}20` }}
                >
                  <Icon size={24} style={{ color: platform.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-text">{platform.label}</h3>
                  <Badge
                    variant={integration?.status === 'Connected' ? 'success' : 'default'}
                    className="mt-1"
                  >
                    {integration?.status || 'Not Connected'}
                  </Badge>
                </div>
              </div>
              {integration && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-text">Leads Captured:</span>
                    <span className="font-semibold text-primary-text">{integration.leadsCaptured}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-text">Last Sync:</span>
                    <span className="text-primary-text">{integration.lastSync}</span>
                  </div>
                </div>
              )}
              <Button
                variant={integration?.status === 'Connected' ? 'outline' : 'primary'}
                className="w-full mt-4"
                onClick={() => integration ? handleEdit(integration) : handleAdd()}
              >
                {integration ? 'Manage' : 'Connect'}
              </Button>
            </Card>
          )
        })}
      </div>

      <DataTable
        columns={columns}
        data={integrations}
        loading={loading}
        searchPlaceholder="Search integrations..."
        filters={true}
        actions={actions}
        mobileColumns={2}
      />

      {/* Add/Edit Modal */}
      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setSelectedIntegration(null)
        }}
        title={isAddModalOpen ? 'Add Social Media Integration' : 'Edit Integration'}
        width="max-w-5xl"
      >
        <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Company - MUST BE FIRST */}
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Company <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              required
            >
              <option value="">-- Select Company First --</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name || company.company_name || `Company #${company.id}`}
                </option>
              ))}
            </select>
            {!formData.company_id && (
              <p className="text-xs text-secondary-text mt-1">Please select a company to continue</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Platform
            </label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              {platforms.map(platform => (
                <option key={platform.value} value={platform.value}>{platform.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="Integration Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Facebook Lead Ads"
            required
          />
          <Input
            label="API Key"
            type="password"
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            placeholder="Enter API key"
          />
          <Input
            label="API Secret"
            type="password"
            value={formData.apiSecret}
            onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
            placeholder="Enter API secret"
          />
          <Input
            label="Webhook URL"
            value={formData.webhookUrl}
            onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
            placeholder="https://your-domain.com/webhook/social-media"
          />
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Automation Settings</p>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoCreateLead"
                  checked={formData.autoCreateLead}
                  onChange={(e) => setFormData({ ...formData, autoCreateLead: e.target.checked })}
                  className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent"
                />
                <label htmlFor="autoCreateLead" className="text-sm text-primary-text">
                  Automatically create lead when form is submitted
                </label>
              </div>
              {formData.autoCreateLead && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      Auto Assign To
                    </label>
                    <select
                      value={formData.autoAssignTo}
                      onChange={(e) => setFormData({ ...formData, autoAssignTo: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                    >
                      <option value="">Select user...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email || `User #${user.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      Auto Send Email Template
                    </label>
                    <select
                      value={formData.autoEmailTemplate}
                      onChange={(e) => setFormData({ ...formData, autoEmailTemplate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                    >
                      <option value="">Select template...</option>
                      <option value="welcome">Welcome Email</option>
                      <option value="follow-up">Follow-up Email</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      Auto Create Task Template
                    </label>
                    <select
                      value={formData.autoTaskTemplate}
                      onChange={(e) => setFormData({ ...formData, autoTaskTemplate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                    >
                      <option value="">Select template...</option>
                      <option value="follow-up">Follow-up Task</option>
                      <option value="qualify">Qualify Lead Task</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-4 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                setSelectedIntegration(null)
              }}
              className="px-4"
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} className="px-4">
              {isAddModalOpen ? 'Save Integration' : 'Update Integration'}
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* View Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedIntegration(null)
        }}
        title="Integration Details"
        width="max-w-5xl"
      >
        {selectedIntegration && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-text">Company</label>
                <p className="text-primary-text mt-1 text-base">{selectedIntegration.company_name || '--'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">Platform</label>
                <p className="text-primary-text mt-1 text-base">{selectedIntegration.platform || '--'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">Integration Name</label>
                <p className="text-primary-text mt-1 text-base">{selectedIntegration.name || '--'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">Status</label>
                <div className="mt-1">
                  <Badge variant={selectedIntegration.status === 'Connected' ? 'success' : 'default'}>
                    {selectedIntegration.status || 'Disconnected'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">Last Sync</label>
                <p className="text-primary-text mt-1 text-base">{selectedIntegration.lastSync || 'Never'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">Leads Captured</label>
                <p className="text-primary-text mt-1 text-base font-semibold">{selectedIntegration.leadsCaptured || 0}</p>
              </div>
              {selectedIntegration.webhookUrl && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-secondary-text">Webhook URL</label>
                  <p className="text-primary-text mt-1 text-base break-all">{selectedIntegration.webhookUrl}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-secondary-text">Auto Create Lead</label>
                <div className="mt-1">
                  <Badge variant={selectedIntegration.autoCreateLead ? 'success' : 'default'}>
                    {selectedIntegration.autoCreateLead ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
              {selectedIntegration.autoAssignTo && (
                <div>
                  <label className="text-sm font-medium text-secondary-text">Auto Assign To</label>
                  <p className="text-primary-text mt-1 text-base">{selectedIntegration.auto_assign_to_name || selectedIntegration.autoAssignTo || '--'}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleEdit(selectedIntegration)
                }}
                className="flex-1"
              >
                Edit Integration
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedIntegration(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default SocialMediaLeads
