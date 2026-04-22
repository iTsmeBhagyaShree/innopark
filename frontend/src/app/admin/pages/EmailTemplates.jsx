import { useState, useEffect, useCallback } from 'react'
import { emailTemplatesAPI, companiesAPI } from '../../../api'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { IoCreate, IoTrash, IoEye, IoDocumentText, IoClose } from 'react-icons/io5'

const EmailTemplates = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templates, setTemplates] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    company_id: '',
    name: '',
    type: 'General',
    subject: '',
    body: '',
  })

  const categories = ['General', 'Finance', 'Leads', 'Projects', 'Tasks', 'Custom']

  useEffect(() => {
    fetchTemplates()
    fetchCompanies()
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Fetching email templates...')
      const response = await emailTemplatesAPI.getAll()
      console.log('Templates API response:', response.data)
      
      if (response.data && response.data.success) {
        const fetchedTemplates = response.data.data || []
        console.log('Fetched templates count:', fetchedTemplates.length)
        
        const transformedTemplates = fetchedTemplates.map(template => ({
          id: template.id,
          company_id: template.company_id,
          company_name: template.company_name || '--',
          name: template.name,
          category: template.type || 'General',
          subject: template.subject,
          body: template.body,
          mergeTags: template.mergeTags || [],
        }))
        console.log('Transformed templates:', transformedTemplates)
        setTemplates(transformedTemplates)
      } else {
        console.error('Failed to fetch templates:', response.data?.error)
        setTemplates([])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      console.error('Error details:', error.response?.data || error.message)
      setTemplates([])
      alert(error.response?.data?.error || 'Failed to fetch templates. Please check console for details.')
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

  const columns = [
    { key: 'name', label: 'Template Name' },
    { key: 'company_name', label: 'Company' },
    { 
      key: 'category', 
      label: 'Category',
      render: (value) => (
        <Badge variant="default">{value}</Badge>
      ),
    },
    { key: 'subject', label: 'Subject' },
    {
      key: 'mergeTags',
      label: 'Merge Tags',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {value?.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="text-xs bg-gray-100 px-2 py-0.5 rounded text-secondary-text">
              {tag}
            </span>
          ))}
          {value?.length > 2 && (
            <span className="text-xs text-secondary-text">+{value.length - 2} more</span>
          )}
        </div>
      ),
    },
  ]

  const handleAdd = () => {
    setFormData({ 
      company_id: '',
      name: '', 
      type: 'General', 
      subject: '', 
      body: '' 
    })
    setSelectedTemplate(null)
    setIsAddModalOpen(true)
  }

  const handleEdit = async (template) => {
    try {
      const response = await emailTemplatesAPI.getById(template.id)
      if (response.data.success) {
        const data = response.data.data
        setSelectedTemplate(template)
        setFormData({
          company_id: data.company_id?.toString() || '',
          name: data.name || '',
          type: data.type || 'General',
          subject: data.subject || '',
          body: data.body || '',
        })
        setIsEditModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching template:', error)
      alert('Failed to load template details')
    }
  }

  const handleView = async (template) => {
    try {
      const response = await emailTemplatesAPI.getById(template.id)
      if (response.data.success) {
        const data = response.data.data
        setSelectedTemplate({
          ...template,
          ...data,
          company_name: data.company_name || '--',
        })
        setIsViewModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching template:', error)
      setSelectedTemplate(template)
      setIsViewModalOpen(true)
    }
  }

  const handlePreview = (template) => {
    setSelectedTemplate(template)
    setIsPreviewModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.company_id) {
      alert('Company is required')
      return
    }
    if (!formData.name || !formData.subject || !formData.body) {
      alert('Name, subject, and body are required')
      return
    }

    try {
      const templateData = {
        company_id: parseInt(formData.company_id),
        name: formData.name,
        type: formData.type || null,
        subject: formData.subject,
        body: formData.body,
      }

      if (isEditModalOpen && selectedTemplate) {
        const response = await emailTemplatesAPI.update(selectedTemplate.id, templateData)
        if (response.data.success) {
          alert('Template updated successfully!')
          await fetchTemplates()
          setIsEditModalOpen(false)
          setSelectedTemplate(null)
        } else {
          alert(response.data.error || 'Failed to update template')
        }
      } else {
        const response = await emailTemplatesAPI.create(templateData)
        if (response.data.success) {
          alert('Template created successfully!')
          await fetchTemplates()
          setIsAddModalOpen(false)
        } else {
          alert(response.data.error || 'Failed to create template')
        }
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert(error.response?.data?.error || 'Failed to save template')
    }
  }

  const handleDelete = async (template) => {
    if (window.confirm(`Delete template "${template.name}"?`)) {
      try {
        const response = await emailTemplatesAPI.delete(template.id)
        if (response.data.success) {
          alert('Template deleted successfully!')
          await fetchTemplates()
        } else {
          alert(response.data.error || 'Failed to delete template')
        }
      } catch (error) {
        console.error('Error deleting template:', error)
        alert(error.response?.data?.error || 'Failed to delete template')
      }
    }
  }

  const extractMergeTags = (text) => {
    const matches = text.match(/\{\{(\w+)\}\}/g)
    return matches ? [...new Set(matches)] : []
  }

  const insertMergeTag = (tag) => {
    setFormData({ ...formData, body: formData.body + ' ' + tag })
  }

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1 sm:gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleView(row)
        }}
        className="p-1.5 sm:p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
        title="View"
      >
        <IoEye size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handlePreview(row)
        }}
        className="p-1.5 sm:p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
        title="Preview"
      >
        <IoDocumentText size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
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

  const commonMergeTags = [
    '{{client_name}}',
    '{{company_name}}',
    '{{sender_name}}',
    '{{invoice_number}}',
    '{{invoice_amount}}',
    '{{due_date}}',
    '{{lead_name}}',
    '{{project_name}}',
    '{{task_title}}',
    '{{current_date}}',
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">Email Templates</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">Create and manage email templates</p>
        </div>
        <AddButton onClick={handleAdd} label="Add Template" />
      </div>

      <DataTable
        columns={columns}
        data={templates}
        loading={loading}
        searchPlaceholder="Search templates..."
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
          setSelectedTemplate(null)
        }}
        title={isAddModalOpen ? 'Add Email Template' : 'Edit Email Template'}
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

          <Input
            label="Template Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Welcome Email"
            required
          />
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Category
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Email subject line"
            required
          />
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Merge Tags (Click to insert)
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {commonMergeTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => insertMergeTag(tag)}
                  className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-primary-accent hover:text-white hover:border-primary-accent transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Email Body (HTML supported) <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-lg mb-2">
              <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                <button className="p-1 hover:bg-gray-200 rounded" title="Bold">
                  <strong>B</strong>
                </button>
                <button className="p-1 hover:bg-gray-200 rounded" title="Italic">
                  <em>I</em>
                </button>
                <button className="p-1 hover:bg-gray-200 rounded" title="Underline">
                  <u>U</u>
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <button className="p-1 hover:bg-gray-200 rounded" title="Link">
                  🔗
                </button>
                <button className="p-1 hover:bg-gray-200 rounded" title="Image">
                  🖼️
                </button>
              </div>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={12}
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none font-mono text-sm"
                placeholder="Enter email body HTML..."
                required
              />
            </div>
            <p className="text-xs text-secondary-text mt-1">
              Tip: Use merge tags like {'{{client_name}}'} for personalization
            </p>
          </div>
          <div className="flex gap-3 pt-4 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                setSelectedTemplate(null)
              }}
              className="px-4"
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} className="px-4">
              {isAddModalOpen ? 'Save Template' : 'Update Template'}
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* View Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedTemplate(null)
        }}
        title="Template Details"
        width="max-w-5xl"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-text">Company</label>
                <p className="text-primary-text mt-1 text-base">{selectedTemplate.company_name || '--'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">Category</label>
                <p className="text-primary-text mt-1 text-base">
                  <Badge variant="default">{selectedTemplate.category || selectedTemplate.type || '--'}</Badge>
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-secondary-text">Template Name</label>
                <p className="text-primary-text mt-1 text-base font-semibold">{selectedTemplate.name || '--'}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-secondary-text">Subject</label>
                <p className="text-primary-text mt-1 text-base">{selectedTemplate.subject || '--'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text mb-2 block">Email Body</label>
              <div className="p-4 bg-white border border-gray-200 rounded-lg min-h-[200px]">
                <div
                  dangerouslySetInnerHTML={{ __html: selectedTemplate.body || '' }}
                  className="prose prose-sm max-w-none"
                />
              </div>
            </div>
            {selectedTemplate.mergeTags && selectedTemplate.mergeTags.length > 0 && (
              <div>
                <label className="text-sm font-medium text-secondary-text mb-2 block">Merge Tags</label>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.mergeTags.map((tag, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded text-secondary-text">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleEdit(selectedTemplate)
                }}
                className="flex-1"
              >
                Edit Template
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedTemplate(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Email Preview"
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-secondary-text mb-1">From:</p>
              <p className="text-sm text-primary-text font-medium">your-email@company.com</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-secondary-text mb-1">To:</p>
              <p className="text-sm text-primary-text font-medium">client@example.com</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-secondary-text mb-1">Subject:</p>
              <p className="text-sm text-primary-text font-medium">{selectedTemplate.subject}</p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg min-h-[300px]">
              <div
                dangerouslySetInnerHTML={{ __html: selectedTemplate.body }}
                className="prose prose-sm max-w-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsPreviewModalOpen(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  alert('Test email sent!')
                  setIsPreviewModalOpen(false)
                }}
                className="flex-1"
              >
                Send Test Email
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default EmailTemplates
