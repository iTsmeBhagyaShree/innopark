import { useState, useEffect } from 'react'
import { customFieldsAPI } from '../../../api'
import { useAuth } from '../../../context/AuthContext'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { IoCreate, IoTrash, IoAdd, IoClose } from 'react-icons/io5'
import { useLanguage } from '../../../context/LanguageContext.jsx'

const CustomFields = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedField, setSelectedField] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'text',
    module: 'Leads',
    required: false,
    options: [],
    defaultValue: '',
    placeholder: '',
    helpText: '',
    visibility: ['all'],
    enabledIn: ['create', 'edit', 'table', 'filters'],
  })

  const [customFields, setCustomFields] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCustomFields()
  }, [])

  const fetchCustomFields = async () => {
    try {
      setLoading(true)
      const companyId = user?.company_id || parseInt(localStorage.getItem('companyId') || 0, 10)
      const params = companyId ? { company_id: companyId } : {}
      const response = await customFieldsAPI.getAll(params)
      if (response.data && response.data.success) {
        setCustomFields(response.data.data || [])
      } else {
        console.error('Failed to fetch custom fields:', response.data?.error)
        setCustomFields([])
      }
    } catch (error) {
      console.error('Failed to fetch custom fields:', error)
      console.error('Error details:', error.response?.data || error.message)
      setCustomFields([])
      alert(error.response?.data?.error || t('custom_fields.errors.fetch_failed'))
    } finally {
      setLoading(false)
    }
  }

  const fieldTypes = [
    { value: 'text', label: t('custom_fields.types.text') },
    { value: 'textarea', label: t('custom_fields.types.textarea') },
    { value: 'number', label: t('custom_fields.types.number') },
    { value: 'email', label: t('custom_fields.types.email') },
    { value: 'phone', label: t('custom_fields.types.phone') },
    { value: 'date', label: t('custom_fields.types.date') },
    { value: 'datetime', label: t('custom_fields.types.datetime') },
    { value: 'dropdown', label: t('custom_fields.types.dropdown') },
    { value: 'multiselect', label: t('custom_fields.types.multiselect') },
    { value: 'checkbox', label: t('custom_fields.types.checkbox') },
    { value: 'radio', label: t('custom_fields.types.radio') },
    { value: 'file', label: t('custom_fields.types.file') },
    { value: 'url', label: t('custom_fields.types.url') },
  ]

  const visibilityOptions = [
    { value: 'admin', label: t('auth.roles.admin') },
    { value: 'employee', label: t('auth.roles.employee') },
    { value: 'client', label: t('custom_fields.visibility.client') },
    { value: 'all', label: t('common.all') },
  ]

  const enabledInOptions = [
    { value: 'create', label: t('custom_fields.enabled_in.create') },
    { value: 'edit', label: t('custom_fields.enabled_in.edit') },
    { value: 'table', label: t('custom_fields.enabled_in.table') },
    { value: 'filters', label: t('custom_fields.enabled_in.filters') },
    { value: 'reports', label: t('custom_fields.enabled_in.reports') },
  ]

  const modules = ['Leads', 'Deals', 'Contacts', 'Clients', 'Projects', 'Tasks', 'Finance', 'Invoices', 'Proposals', 'Estimates', 'Contracts']

  const columns = [
    { key: 'label', label: t('custom_fields.columns.field_label') },
    { key: 'name', label: t('custom_fields.columns.field_name') },
    {
      key: 'type',
      label: t('custom_fields.columns.type'),
      render: (value) => (
        <Badge variant="default">{value}</Badge>
      ),
    },
    {
      key: 'module',
      label: t('custom_fields.columns.module'),
      render: (value) => (
        <Badge variant="info">{value}</Badge>
      ),
    },
    {
      key: 'required',
      label: t('custom_fields.columns.required'),
      render: (value) => (
        <Badge variant={value ? 'danger' : 'default'}>
          {value ? t('common.yes') : t('common.no')}
        </Badge>
      ),
    },
  ]

  const handleAdd = () => {
    setFormData({
      name: '',
      label: '',
      type: 'text',
      module: 'Leads',
      required: false,
      options: [],
      defaultValue: '',
      placeholder: '',
      helpText: '',
      visibility: ['all'],
      enabledIn: ['create', 'edit', 'table', 'filters'],
    })
    setIsAddModalOpen(true)
  }

  const handleEdit = (field) => {
    setSelectedField(field)
    // Ensure visibility and enabledIn are arrays
    let visibility = ['all']
    if (field.visibility) {
      if (Array.isArray(field.visibility)) {
        visibility = field.visibility
      } else if (typeof field.visibility === 'string') {
        try {
          visibility = JSON.parse(field.visibility)
        } catch {
          visibility = [field.visibility]
        }
      }
    }

    const enabledSource = field.enabled_in != null ? field.enabled_in : field.enabledIn
    let enabledIn = ['create', 'edit', 'table', 'filters']
    if (enabledSource) {
      if (Array.isArray(enabledSource)) {
        enabledIn = enabledSource
      } else if (typeof enabledSource === 'string') {
        try {
          enabledIn = JSON.parse(enabledSource)
        } catch {
          enabledIn = [enabledSource]
        }
      }
    }

    setFormData({
      name: field.name,
      label: field.label,
      type: field.type,
      module: field.module,
      required: !!field.required,
      options: Array.isArray(field.options) ? [...field.options] : [],
      defaultValue: field.defaultValue || '',
      placeholder: field.placeholder || '',
      helpText: field.help_text || field.helpText || '',
      visibility: visibility,
      enabledIn: enabledIn,
    })
    setIsEditModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.label) {
      alert('Field label is required')
      return
    }

    try {
      setSaving(true)
      const fieldData = {
        company_id: user?.company_id || null,
        name: formData.name || undefined,   // optional — backend auto-generates from label
        label: formData.label,
        type: formData.type,
        module: formData.module,
        required: formData.required || false,
        options: formData.options || [],
        placeholder: formData.placeholder || '',
        help_text: formData.helpText || '',
        visibility: formData.visibility || ['all'],
        enabled_in: formData.enabledIn || ['create', 'edit', 'table', 'filters'],
      }

      if (isEditModalOpen && selectedField) {
        const response = await customFieldsAPI.update(selectedField.id, {
          label: formData.label,
          type: formData.type,
          module: formData.module,
          required: formData.required || false,
          placeholder: formData.placeholder || '',
          help_text: formData.helpText || '',
          options: formData.options || [],
          visibility: formData.visibility || ['all'],
          enabled_in: formData.enabledIn || ['create', 'edit', 'table', 'filters'],
        })
        if (response.data && response.data.success) {
          alert(t('custom_fields.save_success') || 'Saved successfully')
          setIsEditModalOpen(false)
          setSelectedField(null)
          await fetchCustomFields()
        } else {
          alert(response.data?.error || t('custom_fields.errors.save_failed'))
        }
      } else {
        const response = await customFieldsAPI.create(fieldData)
        if (response.data && response.data.success) {
          alert(t('custom_fields.create_success') || 'Custom field created successfully!')
          setIsAddModalOpen(false)
          // Reset form
          setFormData({
            name: '',
            label: '',
            type: 'text',
            module: 'Leads',
            required: false,
            options: [],
            defaultValue: '',
            placeholder: '',
            helpText: '',
            visibility: ['all'],
            enabledIn: ['create', 'edit', 'table', 'filters'],
          })
          // Refresh the list
          await fetchCustomFields()
        } else {
          alert(response.data?.error || t('custom_fields.errors.create_failed'))
        }
      }
    } catch (error) {
      console.error('Failed to save custom field:', error)
      alert(error.response?.data?.error || 'Failed to save custom field')
    } finally {
      setSaving(false)
    }
  }

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, ''],
    })
  }

  const updateOption = (index, value) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  const removeOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index)
    setFormData({ ...formData, options: newOptions })
  }

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1 sm:gap-2">
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
          if (window.confirm(`Delete field "${row.label}"?`)) {
            (async () => {
              try {
                const companyId = user?.company_id || parseInt(localStorage.getItem('companyId') || '0', 10)
                const res = await customFieldsAPI.delete(row.id, companyId ? { company_id: companyId } : {})
                if (res.data?.success) {
                  await fetchCustomFields()
                } else {
                  alert(res.data?.error || t('custom_fields.errors.delete_failed'))
                }
              } catch (error) {
                console.error('Failed to delete custom field:', error)
                alert(error.response?.data?.error || t('custom_fields.errors.delete_failed'))
              }
            })()
          }
        }}
        className="p-1.5 sm:p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded transition-colors"
        title="Delete"
      >
        <IoTrash size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
    </div>
  )

  const needsOptions = ['dropdown', 'radio', 'multiselect'].includes(formData.type)

  if (loading && customFields.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">{t('custom_fields.title')}</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">{t('custom_fields.subtitle')}</p>
        </div>
        <div className="text-center py-8">
          <p className="text-secondary-text">{t('custom_fields.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">{t('custom_fields.title')}</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">{t('custom_fields.subtitle')}</p>
        </div>
        <AddButton onClick={handleAdd} label={t('custom_fields.add')} />
      </div>

      {/* Module Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {modules.map((module) => {
          const count = customFields.filter(f => f.module === module).length
          return (
            <Card
              key={module}
              className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer text-center"
            >
              <p className="text-2xl font-bold text-primary-text">{count}</p>
              <p className="text-sm text-secondary-text mt-1">{module}</p>
            </Card>
          )
        })}
      </div>

      <DataTable
        columns={columns}
        data={customFields}
        searchPlaceholder={t('custom_fields.search_placeholder')}
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
          setSelectedField(null)
          // Reset form
          setFormData({
            name: '',
            label: '',
            type: 'text',
            module: 'Leads',
            required: false,
            options: [],
            defaultValue: '',
            placeholder: '',
            helpText: '',
            visibility: ['all'],
            enabledIn: ['create', 'edit', 'table', 'filters'],
          })
        }}
        title={isAddModalOpen ? t('custom_fields.add_title') : t('custom_fields.edit_title')}
      >
        <div className="space-y-4">
          <Input
            label={t('custom_fields.fields.label')}
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder={t('custom_fields.fields.label_placeholder')}
            required
          />
          <Input
            label={t('custom_fields.fields.name_internal')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            placeholder="e.g., industry"
            required
          />
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Module
            </label>
            <select
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              {modules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Field Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({
                ...formData,
                type: e.target.value,
                options: ['dropdown', 'radio', 'checkbox', 'multiselect'].includes(e.target.value) ? formData.options : []
              })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              {fieldTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          {needsOptions && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-primary-text">
                  Options
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="flex items-center gap-1"
                >
                  <IoAdd size={14} />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="p-2 text-danger hover:bg-danger/10 rounded"
                    >
                      <IoClose size={18} />
                    </button>
                  </div>
                ))}
                {formData.options.length === 0 && (
                  <p className="text-sm text-secondary-text text-center py-2">
                    {t('custom_fields.options.empty')}
                  </p>
                )}
              </div>
            </div>
          )}
          <Input
            label={t('custom_fields.fields.placeholder_text')}
            value={formData.placeholder}
            onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
            placeholder={t('custom_fields.fields.placeholder_text_placeholder')}
          />
          <Input
            label={t('custom_fields.fields.default_value')}
            value={formData.defaultValue}
            onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
            placeholder={t('custom_fields.fields.default_value_placeholder')}
          />
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('custom_fields.fields.help_text')}
            </label>
            <textarea
              value={formData.helpText}
              onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              placeholder={t('custom_fields.fields.help_text_placeholder')}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent"
              />
              <label htmlFor="required" className="text-sm font-medium text-primary-text">
                {t('custom_fields.fields.required_field')}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                {t('custom_fields.fields.visibility')}
              </label>
              <div className="space-y-2">
                {visibilityOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Array.isArray(formData.visibility) && formData.visibility.includes(opt.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            visibility: [...formData.visibility, opt.value],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            visibility: formData.visibility.filter(v => v !== opt.value),
                          })
                        }
                      }}
                      className="w-4 h-4 text-primary-accent rounded"
                    />
                    <span className="text-sm text-secondary-text">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Enabled In
              </label>
              <div className="space-y-2">
                {enabledInOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Array.isArray(formData.enabledIn) && formData.enabledIn.includes(opt.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            enabledIn: [...formData.enabledIn, opt.value],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            enabledIn: formData.enabledIn.filter(v => v !== opt.value),
                          })
                        }
                      }}
                      className="w-4 h-4 text-primary-accent rounded"
                    />
                    <span className="text-sm text-secondary-text">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4 justify-end">
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
              {saving ? 'Saving...' : (isAddModalOpen ? 'Save Field' : 'Update Field')}
            </Button>
          </div>
        </div>
      </RightSideModal>
    </div>
  )
}

export default CustomFields

