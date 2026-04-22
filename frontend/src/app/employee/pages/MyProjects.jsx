import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import { projectsAPI, tasksAPI } from '../../../api'
import { useLanguage } from '../../../context/LanguageContext'
import { IoEye } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'

const MyProjects = () => {
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id || localStorage.getItem('userId')
  const companyId = user?.company_id || localStorage.getItem('companyId')
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [projectTasks, setProjectTasks] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId && companyId) {
      fetchProjects()
    }
  }, [userId, companyId])

  useEffect(() => {
    if (selectedProject) {
      fetchProjectDetails()
    }
  }, [selectedProject])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      
      const response = await projectsAPI.getAll({ 
        company_id: companyId 
      })
      
      if (response.data.success) {
        const fetchedProjects = response.data.data || []
        
        const transformedProjects = fetchedProjects.map(proj => ({
          id: proj.id,
          project: proj.project_name || proj.projectName || `${t('sidebar.projects')} #${proj.id}`,
          deadline: proj.deadline ? new Date(proj.deadline).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US') : t('common.na'),
          ...proj
        }))
        setProjects(transformedProjects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      alert(error.response?.data?.error || t('projects.alerts.fetch_failed'))
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectDetails = async () => {
    if (!selectedProject) return

    try {
      const projectResponse = await projectsAPI.getById(selectedProject.id, { company_id: companyId })
      if (projectResponse.data.success) {
        const project = projectResponse.data.data
        setTeamMembers(project.members || [])
      }

      const tasksResponse = await tasksAPI.getAll({ 
        project_id: selectedProject.id,
        company_id: companyId 
      })
      if (tasksResponse.data.success) {
        setProjectTasks(tasksResponse.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching project details:', error)
    }
  }

  const handleView = (project) => {
    navigate(`/app/employee/my-projects/${project.id}`)
  }

  const columns = [
    { key: 'project', label: t('sidebar.projects') },
    {
      key: 'status',
      label: t('common.status'),
      render: (value) => {
        const statusColors = {
          'in_progress': 'info',
          'completed': 'success',
          'on_hold': 'warning',
          'cancelled': 'danger',
          'active': 'success',
        }
        const normalizedValue = value?.toLowerCase()
          .replace(/^common\.status\./, '')
          .replace(/\s+/g, '_')
          .replace('in_bearbeitung', 'in_progress')
        
        return (
          <Badge variant={statusColors[normalizedValue] || 'default'}>
            {t(`common.status.${normalizedValue}`) || value}
          </Badge>
        )
      },
    },
    {
      key: 'progress',
      label: t('projects.progress') || 'Progress',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-accent h-2 rounded-full"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm text-secondary-text">{value}%</span>
        </div>
      ),
    },
    { 
      key: 'deadline', 
      label: t('projects.deadline') || 'Deadline',
      render: (value) => {
        if (!value || value === 'K.A.' || value === 'N/A') return t('common.na')
        try {
          return new Date(value).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')
        } catch {
          return value
        }
      }
    },
  ]

  const actions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleView(row)
        }}
        className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
        title={t('common.view')}
      >
        <IoEye size={18} />
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">{t('sidebar.projects')}</h1>
        <p className="text-secondary-text mt-1">{t('projects.subtitle')}</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary-text">{t('common.loading')}</p>
        </div>
      ) : (
      <DataTable
        columns={columns}
        data={projects}
        searchPlaceholder={t('common.search')}
        filters={true}
        filterConfig={[
            { key: 'status', label: t('common.status'), type: 'select', options: [
              { value: 'in_progress', label: t('common.status.in_progress') },
              { value: 'completed', label: t('common.status.completed') },
              { value: 'on_hold', label: t('common.status.on_hold') },
              { value: 'cancelled', label: t('common.status.cancelled') }
            ] },
        ]}
        actions={actions}
        bulkActions={false}
      />
      )}

      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedProject(null)
          setTeamMembers([])
          setProjectTasks([])
        }}
        title={t('projects.details')}
        width="max-w-5xl"
      >
        {selectedProject && (
          <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('sidebar.projects')}</label>
                <p className="text-primary-text mt-1 font-semibold">{selectedProject.project}</p>
            </div>
              <div className="mt-1">
                  <Badge variant={
                    selectedProject.status?.toLowerCase() === 'in_progress' || selectedProject.status?.toLowerCase() === 'in bearbeitung' ? 'info' :
                    selectedProject.status?.toLowerCase() === 'completed' ? 'success' :
                    selectedProject.status?.toLowerCase() === 'on_hold' || selectedProject.status?.toLowerCase() === 'on hold' ? 'warning' :
                    selectedProject.status?.toLowerCase() === 'cancelled' ? 'danger' : 'default'
                  }>
                  {t(`common.status.${selectedProject.status?.toLowerCase().replace(/\s+/g, '_').replace('in_bearbeitung', 'in_progress')}`) || selectedProject.status}
                </Badge>
              </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('projects.progress')}</label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-accent h-2 rounded-full"
                      style={{ width: `${selectedProject.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-secondary-text">{selectedProject.progress || 0}%</span>
                </div>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('projects.deadline')}</label>
                <p className="text-primary-text mt-1">
                  {selectedProject.deadline && selectedProject.deadline !== 'K.A.' && selectedProject.deadline !== 'N/A'
                    ? (selectedProject.deadline.includes('T') 
                        ? new Date(selectedProject.deadline).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')
                        : selectedProject.deadline)
                    : t('common.na')}
                </p>
              </div>
            </div>

            {selectedProject.description && (
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('common.description')}</label>
                <p className="text-primary-text mt-1">{selectedProject.description}</p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-primary-text mb-4">{t('projects.team_members')}</h3>
              {teamMembers.length === 0 ? (
                <p className="text-secondary-text text-sm">{t('projects.no_members')}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-primary-text">{member.name || t('common.unknown')}</p>
                      <p className="text-xs text-secondary-text mt-1">{member.email || '--'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-primary-text mb-4">{t('projects.project_tasks')}</h3>
              {projectTasks.length === 0 ? (
                <p className="text-secondary-text text-sm">{t('projects.no_tasks_assigned')}</p>
              ) : (
                <div className="space-y-2">
                  {projectTasks.map((task) => (
                    <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary-text">{task.title || `${t('sidebar.tasks')} #${task.id}`}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant={
                              task.status === 'Done' ? 'success' :
                              task.status === 'Doing' ? 'info' : 'warning'
                            }>
                              {t(`common.status.${task.status?.toLowerCase()}`) || task.status}
                            </Badge>
                            {task.priority && (
                              <Badge variant={
                                task.priority === 'High' ? 'danger' :
                                task.priority === 'Medium' ? 'warning' : 'info'
                              }>
                                {task.priority}
                              </Badge>
                            )}
                            {task.due_date && (
                              <span className="text-xs text-secondary-text">
                                {t('tasks.due')} {new Date(task.due_date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default MyProjects
