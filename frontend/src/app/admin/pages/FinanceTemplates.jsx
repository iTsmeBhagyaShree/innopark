import { useState, useEffect, useCallback, useRef } from 'react'
import { financeTemplatesAPI } from '../../../api'
import { useTheme } from '../../../context/ThemeContext'
import AddButton from '../../../components/ui/AddButton'
import RightSideModal from '../../../components/ui/RightSideModal'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { IoCreate, IoTrash, IoEye, IoDocumentText, IoColorPalette, IoDownload, IoCopy, IoImage } from 'react-icons/io5'
import ColorPicker from '../../../components/ui/ColorPicker'
import RichTextEditor from '../../../components/ui/RichTextEditor'

const FinanceTemplates = () => {
  const fileInputRef = useRef(null)
  const { theme } = useTheme()
  const primaryColor = theme?.primaryAccent || '#0891b2'

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    type: 'proposal',
    template_data: {
      logo: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      template: '',
      background: '',
      scope: '',
      terms: '',
    },
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const response = await financeTemplatesAPI.getAll({ type: 'proposal' })

      if (response.data && response.data.success) {
        const fetchedTemplates = response.data.data || []
        const transformedTemplates = fetchedTemplates
          .filter(t => t.type === 'proposal')
          .map(template => {
            const templateData = template.template_data || {}
            return {
              id: template.id,
              company_id: template.company_id,
              company_name: template.company_name || '--',
              name: template.name,
              type: template.type,
              status: 'Active',
              preview: `${template.type} template`,
              primaryColor: templateData.primaryColor || '#3B82F6',
              secondaryColor: templateData.secondaryColor || '#1E40AF',
              logo: templateData.logo || '',
              template: templateData.template || '',
              background: templateData.background || '',
              scope: templateData.scope || '',
              terms: templateData.terms || '',
              template_data: templateData,
            }
          })
        setTemplates(transformedTemplates)
      } else {
        setTemplates([])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAdd = () => {
    setFormData({
      name: '',
      type: 'proposal',
      template_data: {
        logo: '',
        primaryColor: primaryColor,
        secondaryColor: '#1E40AF',
        template: '',
        background: '',
        scope: '',
        terms: '',
      },
    })
    setSelectedTemplate(null)
    setIsAddModalOpen(true)
  }

  const handleEdit = async (template) => {
    try {
      const response = await financeTemplatesAPI.getById(template.id)
      if (response.data.success) {
        const data = response.data.data
        const templateData = data.template_data || {}
        setSelectedTemplate(template)
        setFormData({
          name: data.name || '',
          type: data.type || 'proposal',
          template_data: {
            logo: templateData.logo || '',
            primaryColor: templateData.primaryColor || primaryColor,
            secondaryColor: templateData.secondaryColor || '#1E40AF',
            template: templateData.template || '',
            background: templateData.background || '',
            scope: templateData.scope || '',
            terms: templateData.terms || '',
          },
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
      const response = await financeTemplatesAPI.getById(template.id)
      if (response.data.success) {
        const data = response.data.data
        const templateData = data.template_data || {}
        setSelectedTemplate({
          ...template,
          ...data,
          company_name: data.company_name || '--',
          primaryColor: templateData.primaryColor || primaryColor,
          secondaryColor: templateData.secondaryColor || '#1E40AF',
          logo: templateData.logo || '',
          template: templateData.template || '',
          background: templateData.background || '',
          scope: templateData.scope || '',
          terms: templateData.terms || '',
        })
        setIsViewModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching template:', error)
      setSelectedTemplate(template)
      setIsViewModalOpen(true)
    }
  }

  const handlePreview = async (template) => {
    try {
      const response = await financeTemplatesAPI.getById(template.id)
      if (response.data.success) {
        const data = response.data.data
        const templateData = data.template_data || {}
        setSelectedTemplate({
          ...template,
          ...data,
          primaryColor: templateData.primaryColor || primaryColor,
          secondaryColor: templateData.secondaryColor || '#1E40AF',
          logo: templateData.logo || '',
          template: templateData.template || '',
          background: templateData.background || '',
          scope: templateData.scope || '',
          terms: templateData.terms || '',
        })
        setIsPreviewModalOpen(true)
      }
    } catch (error) {
      setSelectedTemplate(template)
      setIsPreviewModalOpen(true)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.type) {
      alert('Name and type are required')
      return
    }

    try {
      const templateData = {
        name: formData.name,
        type: formData.type,
        template_data: formData.template_data,
      }

      if (isEditModalOpen && selectedTemplate) {
        const response = await financeTemplatesAPI.update(selectedTemplate.id, templateData)
        if (response.data.success) {
          alert('Template updated successfully!')
          await fetchTemplates()
          setIsEditModalOpen(false)
          setSelectedTemplate(null)
        } else {
          alert(response.data.error || 'Failed to update template')
        }
      } else {
        const response = await financeTemplatesAPI.create(templateData)
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
        const response = await financeTemplatesAPI.delete(template.id)
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

  const handleLogoClick = () => {
    fileInputRef.current?.click()
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          template_data: {
            ...prev.template_data,
            logo: reader.result
          }
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">Finance Templates</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">Manage templates for invoices, proposals, estimates, and expenses</p>
        </div>
        <AddButton onClick={handleAdd} label="Add Template" />
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-secondary-text">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-secondary-text">No templates found. Create your first template!</p>
          </div>
        ) : (
          templates.map((template) => (
            <Card
              key={template.id}
              className="p-5 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handlePreview(template)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-primary-text">{template.name}</h3>
                  <Badge variant="default" className="mt-1">{template.type}</Badge>
                </div>
                <Badge variant={template.status === 'Active' ? 'success' : 'default'}>
                  {template.status}
                </Badge>
              </div>
              <div className="mb-3">
                <div
                  className="h-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden"
                  style={{ borderColor: template.primaryColor || primaryColor }}
                >
                  {template.logo ? (
                    <img
                      src={template.logo}
                      alt="Template logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <IoDocumentText
                        className="mx-auto mb-2"
                        size={32}
                        style={{ color: template.primaryColor || primaryColor }}
                      />
                      <p className="text-xs text-secondary-text">{template.preview}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: template.primaryColor || primaryColor }}
                  />
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: template.secondaryColor || '#1E40AF' }}
                  />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(template)
                    }}
                    className="p-1.5 text-warning hover:bg-warning/10 rounded"
                  >
                    <IoCreate size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleView(template)
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded"
                    style={{ color: primaryColor }}
                  >
                    <IoEye size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setSelectedTemplate(null)
        }}
        title={isAddModalOpen ? 'Add Proposal Template' : 'Edit Proposal Template'}
        width="max-w-5xl"
      >
        <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <Input
            label="Template Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Modern Proposal"
            required
          />

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Logo Upload
            </label>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleLogoChange}
            />
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-accent transition-colors cursor-pointer relative group"
              onClick={handleLogoClick}
            >
              {formData.template_data.logo ? (
                <div className="relative">
                  <img
                    src={formData.template_data.logo}
                    alt="Logo preview"
                    className="mx-auto h-32 object-contain"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                    <p className="text-transparent group-hover:text-white font-medium">Click to change</p>
                  </div>
                </div>
              ) : (
                <>
                  <IoImage className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-secondary-text">Click to upload logo</p>
                  <p className="text-xs text-secondary-text mt-1">PNG, JPG (Max 2MB)</p>
                </>
              )}
            </div>
            {formData.template_data.logo && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  template_data: { ...prev.template_data, logo: '' }
                }))}
                className="text-xs text-red-500 mt-2 hover:underline"
              >
                Remove logo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2 flex items-center gap-2">
                <IoColorPalette size={16} />
                Primary Color
              </label>
              <div className="flex items-center gap-2">
                <ColorPicker
                  value={formData.template_data.primaryColor}
                  onChange={(color) => setFormData({
                    ...formData,
                    template_data: {
                      ...formData.template_data,
                      primaryColor: color
                    }
                  })}
                />
                <Input
                  value={formData.template_data.primaryColor}
                  onChange={(e) => setFormData({
                    ...formData,
                    template_data: {
                      ...formData.template_data,
                      primaryColor: e.target.value
                    }
                  })}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2 flex items-center gap-2">
                <IoColorPalette size={16} />
                Secondary Color
              </label>
              <div className="flex items-center gap-2">
                <ColorPicker
                  value={formData.template_data.secondaryColor}
                  onChange={(color) => setFormData({
                    ...formData,
                    template_data: {
                      ...formData.template_data,
                      secondaryColor: color
                    }
                  })}
                />
                <Input
                  value={formData.template_data.secondaryColor}
                  onChange={(e) => setFormData({
                    ...formData,
                    template_data: {
                      ...formData.template_data,
                      secondaryColor: e.target.value
                    }
                  })}
                  placeholder="#1E40AF"
                />
              </div>
            </div>
          </div>

          {/* Proposal Template Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Proposal Background
              </label>
              <RichTextEditor
                value={formData.template_data.background}
                onChange={(content) => setFormData({
                  ...formData,
                  template_data: {
                    ...formData.template_data,
                    background: content
                  }
                })}
                placeholder="Enter proposal background..."
              />
              <div className="mt-2 flex gap-2 flex-wrap">
                {['{CLIENT_NAME}', '{CLIENT_COMPANY}', '{PROPOSAL_DATE}'].map(variable => (
                  <Badge
                    key={variable}
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => {
                      navigator.clipboard.writeText(variable)
                      alert(`Copied ${variable} to clipboard!`)
                    }}
                  >
                    {variable} <IoCopy size={10} className="ml-1 inline" />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Scope of Work
              </label>
              <RichTextEditor
                value={formData.template_data.scope}
                onChange={(content) => setFormData({
                  ...formData,
                  template_data: {
                    ...formData.template_data,
                    scope: content
                  }
                })}
                placeholder="Enter scope of work..."
              />
              <div className="mt-2 flex gap-2 flex-wrap">
                {['{PROPOSAL_ITEMS}', '{TOTAL_AMOUNT}'].map(variable => (
                  <Badge
                    key={variable}
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => {
                      navigator.clipboard.writeText(variable)
                      alert(`Copied ${variable} to clipboard!`)
                    }}
                  >
                    {variable} <IoCopy size={10} className="ml-1 inline" />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Terms & Conditions
              </label>
              <RichTextEditor
                value={formData.template_data.terms}
                onChange={(content) => setFormData({
                  ...formData,
                  template_data: {
                    ...formData.template_data,
                    terms: content
                  }
                })}
                placeholder="Enter terms and conditions..."
              />
            </div>
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

      {/* View Modal - Full Template Preview */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedTemplate(null)
        }}
        title="Template Details"
        size="xl"
      >
        {selectedTemplate && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Header with Logo */}
            <div className="flex items-start justify-between p-6 rounded-lg" style={{ backgroundColor: `${selectedTemplate.primaryColor}10` }}>
              <div className="flex items-center gap-4">
                {selectedTemplate.logo ? (
                  <img
                    src={selectedTemplate.logo}
                    alt="Template logo"
                    className="h-20 w-auto object-contain"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: selectedTemplate.primaryColor }}
                  >
                    {selectedTemplate.name?.charAt(0) || 'P'}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h3>
                  <Badge variant="default">{selectedTemplate.type}</Badge>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            {/* Template Content */}
            <div className="space-y-4">
              {selectedTemplate.background && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Background</h4>
                  <div className="prose max-w-full text-gray-700" dangerouslySetInnerHTML={{ __html: selectedTemplate.background }} />
                </div>
              )}

              {selectedTemplate.scope && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Scope of Work</h4>
                  <div className="prose max-w-full text-gray-700" dangerouslySetInnerHTML={{ __html: selectedTemplate.scope }} />
                </div>
              )}

              {selectedTemplate.terms && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Terms & Conditions</h4>
                  <div className="prose max-w-full text-gray-700" dangerouslySetInnerHTML={{ __html: selectedTemplate.terms }} />
                </div>
              )}

              {selectedTemplate.template && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Template Content</h4>
                  <div className="prose max-w-full text-gray-700" dangerouslySetInnerHTML={{ __html: selectedTemplate.template }} />
                </div>
              )}
            </div>

            {/* Colors */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Colors:</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: selectedTemplate.primaryColor }}
                />
                <span className="text-sm text-gray-500">{selectedTemplate.primaryColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: selectedTemplate.secondaryColor }}
                />
                <span className="text-sm text-gray-500">{selectedTemplate.secondaryColor}</span>
              </div>
            </div>

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
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Proposal Template Preview"
        size="xl"
      >
        {selectedTemplate && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Proposal Preview */}
            <div className="bg-white border-2 rounded-lg overflow-hidden" style={{ borderColor: selectedTemplate.primaryColor }}>
              {/* Header */}
              <div className="p-6" style={{ backgroundColor: selectedTemplate.primaryColor }}>
                <div className="flex items-center justify-between">
                  {selectedTemplate.logo ? (
                    <img
                      src={selectedTemplate.logo}
                      alt="Logo"
                      className="h-16 w-auto object-contain bg-white rounded p-2"
                    />
                  ) : (
                    <div className="text-white text-2xl font-bold">
                      {selectedTemplate.name}
                    </div>
                  )}
                  <div className="text-right text-white">
                    <p className="text-xl font-bold">PROPOSAL</p>
                    <p className="text-sm opacity-80">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Client Info Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Prepared For</p>
                    <p className="font-semibold text-gray-900">[Client Name]</p>
                    <p className="text-sm text-gray-600">[Client Company]</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase mb-1">Proposal #</p>
                    <p className="font-semibold text-gray-900">PROP-001</p>
                    <p className="text-sm text-gray-600">Valid until: [Date]</p>
                  </div>
                </div>

                {/* Background */}
                {selectedTemplate.background && (
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: selectedTemplate.primaryColor }}>Background</h4>
                    <div className="text-gray-600 prose max-w-full" dangerouslySetInnerHTML={{ __html: selectedTemplate.background }} />
                  </div>
                )}

                {/* Scope */}
                {selectedTemplate.scope && (
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: selectedTemplate.primaryColor }}>Scope of Work</h4>
                    <div className="text-gray-600 prose max-w-full" dangerouslySetInnerHTML={{ __html: selectedTemplate.scope }} />
                  </div>
                )}

                {/* Items Preview */}
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: selectedTemplate.primaryColor }}>Pricing</h4>
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: `${selectedTemplate.primaryColor}15` }}>
                        <th className="text-left py-2 px-3 text-sm font-semibold">Item</th>
                        <th className="text-center py-2 px-3 text-sm font-semibold">Qty</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold">Rate</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-3 text-sm">Sample Item 1</td>
                        <td className="py-3 px-3 text-sm text-center">1</td>
                        <td className="py-3 px-3 text-sm text-right">€500.00</td>
                        <td className="py-3 px-3 text-sm text-right font-medium">€500.00</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-3 text-sm">Sample Item 2</td>
                        <td className="py-3 px-3 text-sm text-center">2</td>
                        <td className="py-3 px-3 text-sm text-right">€250.00</td>
                        <td className="py-3 px-3 text-sm text-right font-medium">€500.00</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="py-3 px-3 text-right font-semibold">Total:</td>
                        <td className="py-3 px-3 text-right font-bold" style={{ color: selectedTemplate.primaryColor }}>€1,000.00</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Terms */}
                {selectedTemplate.terms && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-semibold mb-2" style={{ color: selectedTemplate.primaryColor }}>Terms & Conditions</h4>
                    <div className="text-gray-600 text-sm prose max-w-full" dangerouslySetInnerHTML={{ __html: selectedTemplate.terms }} />
                  </div>
                )}
              </div>
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
                  alert('Template applied successfully!')
                  setIsPreviewModalOpen(false)
                }}
                className="flex-1"
              >
                Use This Template
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default FinanceTemplates
