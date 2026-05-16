import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { useLanguage } from '../../../context/LanguageContext'
import { projectTemplatesAPI } from '../../../api'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import { IoArrowBack, IoSave, IoFolder, IoCheckbox, IoSquareOutline, IoTime, IoCalendar } from 'react-icons/io5'
import RichTextEditor from '../../../components/ui/RichTextEditor'

const ProjectTemplateForm = () => {
  const { t } = useLanguage()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme } = useTheme()
  const primaryColor = theme?.primaryAccent || '#0891b2'
  const companyId = parseInt(user?.company_id || localStorage.getItem('companyId') || 1, 10)
  
  const isEditing = !!id && id !== 'add'
  const isViewing = window.location.pathname.includes('/edit') ? false : isEditing
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sub_category: '',
    summary: '',
    notes: '',
    allow_manual_time_logs: false,
  })

  const categories = [
    'Development',
    'Design',
    'Marketing',
    'Sales',
    'Support',
    'HR',
    'Finance',
    'Other'
  ]

  const categoryLabel = (cat) => {
    if (!cat) return ''
    const key = `project_templates_ui.categories.${String(cat).toLowerCase()}`
    const tr = t(key)
    return tr === key ? cat : tr
  }

  useEffect(() => {
    if (isEditing) {
      fetchTemplate()
    }
  }, [id])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const response = await projectTemplatesAPI.getById(id, { company_id: companyId })
      if (response.data?.success) {
        const template = response.data.data
        setFormData({
          name: template.name || '',
          category: template.category || '',
          sub_category: template.sub_category || '',
          summary: template.summary || '',
          notes: template.notes || '',
          allow_manual_time_logs: template.allow_manual_time_logs || false,
        })
      }
    } catch (error) {
      console.error('Error fetching template:', error)
      alert(t('project_templates_ui.load_failed'))
      navigate('/app/admin/project-templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert(t('project_templates_ui.required_name'))
      return
    }

    try {
      setSaving(true)
      const templateData = {
        ...formData,
        company_id: companyId,
      }

      let response
      if (isEditing) {
        response = await projectTemplatesAPI.update(id, templateData)
      } else {
        response = await projectTemplatesAPI.create(templateData)
      }

      if (response.data.success) {
        alert(isEditing ? t('project_templates_ui.updated') : t('project_templates_ui.created'))
        navigate('/app/admin/project-templates')
      } else {
        alert(response.data.error || t('project_templates_ui.save_failed'))
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert(error.response?.data?.error || t('project_templates_ui.save_failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = () => {
    navigate(`/app/admin/project-templates/${id}/edit`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-transparent" style={{ borderColor: `${primaryColor} transparent ${primaryColor} ${primaryColor}` }}></div>
          <p className="text-secondary-text mt-4">{t('project_templates_ui.loading_template')}</p>
        </div>
      </div>
    )
  }

  // View Mode
  if (isViewing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/admin/project-templates')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <IoArrowBack size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary-text">{t('project_templates_ui.detail_heading')}</h1>
            <p className="text-secondary-text mt-1">{t('project_templates_ui.detail_subtitle')}</p>
          </div>
          <Button variant="primary" onClick={handleEdit}>
            {t('project_templates_ui.edit_template_btn')}
          </Button>
        </div>

        {/* Template Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-start gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {formData.name?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{formData.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    {formData.category && <Badge variant="default">{categoryLabel(formData.category)}</Badge>}
                    {formData.sub_category && <Badge variant="default">{formData.sub_category}</Badge>}
                  </div>
                </div>
              </div>
            </Card>

            {/* Summary */}
            {formData.summary && (
              <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{t('project_templates_ui.summary_heading')}</h3>
                <div className="prose max-w-full text-gray-700 overflow-hidden break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }} dangerouslySetInnerHTML={{ __html: formData.summary }} />
              </Card>
            )}

            {/* Notes */}
            {formData.notes && (
              <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{t('project_templates_ui.notes_heading')}</h3>
                <div className="prose max-w-full text-gray-700 overflow-hidden break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }} dangerouslySetInnerHTML={{ __html: formData.notes }} />
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">{t('project_templates_ui.settings_heading')}</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {formData.allow_manual_time_logs ? (
                    <>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                        <IoCheckbox size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{t('project_templates_ui.manual_time_logs')}</p>
                        <p className="text-sm text-gray-500">{t('project_templates_ui.enabled')}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <IoSquareOutline size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{t('project_templates_ui.manual_time_logs')}</p>
                        <p className="text-sm text-gray-500">{t('project_templates_ui.disabled')}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <IoFolder size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('project_templates_ui.category')}</p>
                    <p className="text-sm text-gray-500">{formData.category ? categoryLabel(formData.category) : t('project_templates_ui.not_set')}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">{t('project_templates_ui.actions_heading')}</h3>
              <div className="space-y-3">
                <Button variant="primary" onClick={handleEdit} className="w-full">
                  {t('project_templates_ui.edit_template_btn')}
                </Button>
                <Button variant="outline" onClick={() => navigate('/app/admin/project-templates')} className="w-full">
                  {t('project_templates_ui.back_to_list')}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Edit/Add Mode
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/app/admin/project-templates')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <IoArrowBack size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary-text">
            {isEditing ? t('project_templates_ui.form_edit_title') : t('project_templates_ui.form_add_title')}
          </h1>
          <p className="text-secondary-text mt-1">
            {isEditing ? t('project_templates_ui.form_edit_subtitle') : t('project_templates_ui.form_add_subtitle')}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('project_templates_ui.section_details')}</h2>
        
        <div className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: primaryColor }}>
                {t('project_templates_ui.project_name')} <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('project_templates_ui.name_placeholder')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('project_templates_ui.project_category')}
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent outline-none"
                  style={{ '--tw-ring-color': primaryColor }}
                >
                  <option value="">--</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{categoryLabel(cat)}</option>
                  ))}
                </select>
                <Button variant="outline" className="px-4">{t('project_templates_ui.add')}</Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('project_templates_ui.project_subcategory')}
              </label>
              <div className="flex gap-2">
                <Input
                  value={formData.sub_category}
                  onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                  placeholder="--"
                  className="flex-1"
                />
                <Button variant="outline" className="px-4">{t('project_templates_ui.add')}</Button>
              </div>
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allow_manual_time_logs"
              checked={formData.allow_manual_time_logs}
              onChange={(e) => setFormData({ ...formData, allow_manual_time_logs: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300"
              style={{ accentColor: primaryColor }}
            />
            <label htmlFor="allow_manual_time_logs" className="text-sm font-medium" style={{ color: primaryColor }}>
              {t('project_templates_ui.allow_manual_time_logs')}
            </label>
          </div>

          {/* Project Summary */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: primaryColor }}>
              {t('project_templates_ui.project_summary')}
            </label>
            <RichTextEditor
              value={formData.summary}
              onChange={(content) => setFormData({ ...formData, summary: content })}
              placeholder={t('project_templates_ui.summary_placeholder')}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: primaryColor }}>
              {t('project_templates_ui.notes_label')}
            </label>
            <RichTextEditor
              value={formData.notes}
              onChange={(content) => setFormData({ ...formData, notes: content })}
              placeholder={t('project_templates_ui.notes_placeholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <IoSave size={18} />
              {saving ? t('project_templates_ui.saving') : t('project_templates_ui.save')}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/app/admin/project-templates')}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ProjectTemplateForm

