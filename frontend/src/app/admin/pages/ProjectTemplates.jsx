import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { projectTemplatesAPI } from '../../../api'
import AddButton from '../../../components/ui/AddButton'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { IoCreate, IoTrash, IoEye, IoFolder, IoAdd, IoCheckbox, IoSquareOutline, IoSearch } from 'react-icons/io5'

const ProjectTemplates = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme } = useTheme()
  const primaryColor = theme?.primaryAccent || '#0891b2'
  const companyId = parseInt(user?.company_id || localStorage.getItem('companyId') || 1, 10)
  
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [companyId])

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const response = await projectTemplatesAPI.getAll({ company_id: companyId })

      if (response.data && response.data.success) {
        const fetchedTemplates = response.data.data || []
        setTemplates(fetchedTemplates)
      } else {
        setTemplates([])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [companyId])

  const handleAdd = () => {
    navigate('/app/admin/project-templates/add')
  }

  const handleEdit = (template) => {
    navigate(`/app/admin/project-templates/${template.id}/edit`)
  }

  const handleView = (template) => {
    navigate(`/app/admin/project-templates/${template.id}`)
  }

  const handleDelete = async (template) => {
    if (window.confirm(`Delete template "${template.name}"?`)) {
      try {
        const response = await projectTemplatesAPI.delete(template.id, { company_id: companyId })
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

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      t.name?.toLowerCase().includes(query) ||
      t.category?.toLowerCase().includes(query) ||
      t.summary?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">Project Templates</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">Create and manage reusable project templates</p>
        </div>
        <AddButton onClick={handleAdd} label="Add Template" />
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': primaryColor }}
          />
        </div>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-transparent" style={{ borderColor: `${primaryColor} transparent ${primaryColor} ${primaryColor}` }}></div>
            <p className="text-secondary-text mt-4">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <IoFolder size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-secondary-text">
              {searchQuery ? 'No templates match your search' : 'No templates found. Create your first project template!'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAdd}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                <IoAdd size={18} />
                Create Template
              </button>
            )}
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200"
              onClick={() => handleView(template)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {template.name?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    {template.category && (
                      <Badge variant="default" className="mt-1">{template.category}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {template.summary && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3" dangerouslySetInnerHTML={{ __html: template.summary }} />
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {template.allow_manual_time_logs ? (
                    <span className="flex items-center gap-1">
                      <IoCheckbox size={16} style={{ color: primaryColor }} />
                      Time logs
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <IoSquareOutline size={16} />
                      No time logs
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleView(template)
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    style={{ color: primaryColor }}
                    title="View"
                  >
                    <IoEye size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(template)
                    }}
                    className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <IoCreate size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(template)
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <IoTrash size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default ProjectTemplates
