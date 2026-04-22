import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { useLanguage } from '../../../context/LanguageContext'
import { tasksAPI } from '../../../api/tasks'
import { IoEye, IoCreate, IoCloudUpload, IoDocumentText, IoDownload, IoTrash } from 'react-icons/io5'

const MyTasks = () => {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const userId = user?.id || localStorage.getItem('userId')
  const companyId = user?.company_id || localStorage.getItem('companyId')
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [tasks, setTasks] = useState([])
  const [comments, setComments] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    if (userId && companyId) {
      fetchTasks()
    }
  }, [userId, companyId])

  useEffect(() => {
    if (selectedTask) {
      fetchTaskDetails()
    }
  }, [selectedTask])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await tasksAPI.getAll({ 
        assigned_to: userId,
        company_id: companyId 
      })
      if (response.data.success) {
        const fetchedTasks = response.data.data || []
        const transformedTasks = fetchedTasks.map(task => ({
          id: task.id,
          task: task.title || `${t('projects.tasks')} #${task.id}`,
          project: task.project_name || task.projectName || t('common.na'),
          priority: task.priority || 'Medium',
          status: task.status || 'Pending',
          dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US') : t('common.na'),
          ...task
        }))
        setTasks(transformedTasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      alert(error.response?.data?.error || t('loading_failed'))
    } finally {
      setLoading(false)
    }
  }

  const fetchTaskDetails = async () => {
    if (!selectedTask) return

    try {
      const params = { company_id: companyId, user_id: userId }
      const [taskResponse, commentsResponse, filesResponse] = await Promise.all([
        tasksAPI.getById(selectedTask.id, params),
        tasksAPI.getComments(selectedTask.id, params),
        tasksAPI.getFiles(selectedTask.id, params)
      ])

      if (taskResponse.data.success) {
        setSelectedTask({ ...selectedTask, ...taskResponse.data.data })
      }
      if (commentsResponse.data.success) {
        setComments(commentsResponse.data.data || [])
      }
      if (filesResponse.data.success) {
        setFiles(filesResponse.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching task details:', error)
    }
  }

  const handleView = async (task) => {
    setSelectedTask(task)
    setNewStatus(task.status || '')
    setIsViewModalOpen(true)
  }

  const handleEdit = (task) => {
    setSelectedTask(task)
    setNewStatus(task.status || '')
    setIsEditModalOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedTask || !newStatus) {
      alert('Bitte wählen Sie einen Status aus')
      return
    }

    try {
      const response = await tasksAPI.update(selectedTask.id, { status: newStatus }, { company_id: companyId })
      if (response.data.success) {
        alert(t('projects.alerts.task_status_updated') || 'Task status updated!')
        await fetchTasks()
        setIsEditModalOpen(false)
        setIsViewModalOpen(false)
        setSelectedTask(null)
      } else {
        alert(response.data.error || t('projects.alerts.task_status_update_failed'))
      }
    } catch (error) {
      console.error('Error updating task:', error)
      alert(error.response?.data?.error || 'Fehler beim Aktualisieren des Aufgabenstatus')
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      alert('Bitte geben Sie einen Kommentar ein')
      return
    }

    try {
      const commentData = { 
        comment: commentText,
        company_id: companyId,
        user_id: userId
      }
      const response = await tasksAPI.addComment(selectedTask.id, commentData, { company_id: companyId })
      if (response.data.success) {
        alert(t('projects.alerts.comment_added') || 'Kommentar erfolgreich hinzugefügt!')
        setCommentText('')
        await fetchTaskDetails()
        setIsCommentModalOpen(false)
      } else {
        alert(response.data.error || t('projects.alerts.comment_failed'))
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      alert(error.response?.data?.error || 'Fehler beim Hinzufügen des Kommentars')
    }
  }

  const handleUploadFile = async () => {
    if (!uploadFile) {
      alert('Bitte wählen Sie eine Datei aus')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('company_id', companyId)
      formData.append('user_id', userId)
      
      const response = await tasksAPI.uploadFile(selectedTask.id, formData, { company_id: companyId })
      if (response.data.success) {
        alert(t('projects.alerts.file_uploaded') || 'Datei erfolgreich hochgeladen!')
        setUploadFile(null)
        await fetchTaskDetails()
      } else {
        alert(response.data.error || t('projects.alerts.file_upload_failed'))
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert(error.response?.data?.error || 'Fehler beim Hochladen der Datei')
    }
  }

  const handleDownloadFile = async (file) => {
    try {
      window.open(file.file_path, '_blank')
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Fehler beim Herunterladen der Datei')
    }
  }

  const priorityLabel = (value) => {
    const key = value?.toLowerCase()
    return t(`common.${key}`) || value
  }

  const statusLabel = (value) => {
    const key = value?.toLowerCase().replace(/^common\.status\./, '').replace(/\s+/g, '_')
    return t(`common.status.${key}`) || t(`projects.status.${key}`) || value
  }

  const columns = [
    { key: 'task', label: t('projects.tasks') },
    { key: 'project', label: t('sidebar.projects') },
    {
      key: 'priority',
      label: t('tasks.priority'),
      render: (value) => {
        const priorityColors = {
          High: 'danger',
          Medium: 'warning',
          Low: 'info',
        }
        return <Badge variant={priorityColors[value] || 'default'}>{priorityLabel(value)}</Badge>
      },
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (value) => {
        const statusColors = {
          Pending: 'warning',
          'In Bearbeitung': 'info',
          Completed: 'success',
          'Incomplete': 'warning',
          'Doing': 'info',
          'Done': 'success',
        }
        return <Badge variant={statusColors[value] || 'default'}>{statusLabel(value)}</Badge>
      },
    },
    { key: 'dueDate', label: t('tasks.due_date') },
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
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleEdit(row)
        }}
        className="p-2 text-warning hover:bg-warning hover:bg-opacity-10 rounded transition-colors"
        title={t('common.update')}
      >
        <IoCreate size={18} />
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">{t('tasks.title') || 'My Tasks'}</h1>
        <p className="text-secondary-text mt-1">{t('tasks.subtitle') || 'View and manage your assigned tasks'}</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary-text">{t('common.loading')}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tasks}
          searchPlaceholder={t('common.search')}
          filters={true}
          filterConfig={[
            { key: 'status', label: t('common.status'), type: 'select', options: ['Pending', 'In Bearbeitung', 'Completed', 'Incomplete', 'Doing', 'Done'] },
            { key: 'priority', label: t('tasks.priority'), type: 'select', options: ['High', 'Medium', 'Low'] },
            { key: 'project', label: t('sidebar.projects'), type: 'text' },
          ]}
          actions={actions}
          bulkActions={false}
        />
      )}

      {/* View Task Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedTask(null)
          setComments([])
          setFiles([])
        }}
        title={t('tasks.details')}
        width="max-w-5xl"
      >
        {selectedTask && (
          <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Task Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('projects.tasks')}</label>
                <p className="text-primary-text mt-1 font-semibold">{selectedTask.task || selectedTask.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('sidebar.projects')}</label>
                <p className="text-primary-text mt-1">{selectedTask.project || selectedTask.project_name || t('common.na')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">Priorität</label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedTask.priority === 'High'
                        ? 'danger'
                        : selectedTask.priority === 'Medium'
                        ? 'warning'
                        : 'info'
                    }
                  >
                    {priorityLabel(selectedTask.priority || 'Medium')}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('auto.auto_ec53a8c4') || 'Status'}</label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedTask.status === 'Completed' || selectedTask.status === 'Done'
                        ? 'success'
                        : selectedTask.status === 'In Bearbeitung' || selectedTask.status === 'Doing'
                        ? 'info'
                        : 'warning'
                    }
                  >
                    {statusLabel(selectedTask.status || 'Pending')}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">Fälligkeitsdatum</label>
                <p className="text-primary-text mt-1">
                  {selectedTask.dueDate || (selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString('de-DE') : 'K.A.')}
                </p>
              </div>
            </div>

            {selectedTask.description && (
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('auto.auto_35bedb45') || 'Beschreibung'}</label>
                <p className="text-primary-text mt-1">{selectedTask.description}</p>
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-text">{t('offline_requests.notes')}</h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCommentModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <IoCreate size={16} />
                  {t('projects.add_comment')}
                </Button>
              </div>
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-secondary-text text-sm">{t('auto.auto_455285f2') || 'Noch keine Kommentare'}</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary-text">{comment.user_name || 'Unbekannt'}</p>
                          <p className="text-primary-text mt-1">{comment.comment}</p>
                          <p className="text-xs text-secondary-text mt-1">
                            {new Date(comment.created_at).toLocaleString('de-DE')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Files Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-text">{t('projects.files')}</h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.onchange = (e) => {
                      if (e.target.files[0]) {
                        setUploadFile(e.target.files[0])
                        handleUploadFile()
                      }
                    }
                    input.click()
                  }}
                  className="flex items-center gap-2"
                >
                  <IoCloudUpload size={16} />
                  {t('projects.upload_file')}
                </Button>
              </div>
              <div className="space-y-2">
                {files.length === 0 ? (
                  <p className="text-secondary-text text-sm">{t('projects.no_files')}</p>
                ) : (
                  files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <IoDocumentText size={24} className="text-primary-accent" />
                        <div>
                          <p className="text-sm font-medium text-primary-text">{file.file_name}</p>
                          <p className="text-xs text-secondary-text">
                            {(file.file_size / 1024).toFixed(2)} KB • {new Date(file.created_at).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
                        title={t('common.download')}
                      >
                        <IoDownload size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </RightSideModal>

      {/* Edit Status Modal */}
      <RightSideModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedTask(null)
          setNewStatus('')
        }}
        title={t('tasks.update_status')}
        width="max-w-md"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">{t('projects.tasks')}</label>
              <p className="text-primary-text">{selectedTask.task || selectedTask.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">{t('common.status')}</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              >
                <option value="Incomplete">{t('projects.status.incomplete')}</option>
                <option value="Doing">{t('projects.status.doing')}</option>
                <option value="Done">{t('projects.status.done')}</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setSelectedTask(null)
                  setNewStatus('')
                }}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={handleUpdateStatus} className="flex-1">
                {t('common.update')}
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>

      {/* Add Comment Modal */}
      <RightSideModal
        isOpen={isCommentModalOpen}
        onClose={() => {
          setIsCommentModalOpen(false)
          setCommentText('')
        }}
        title={t('projects.add_comment')}
        width="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('offline_requests.notes')}</label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              placeholder={t('leads.placeholder_notes')}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCommentModalOpen(false)
                setCommentText('')
              }}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleAddComment} className="flex-1">
              {t('projects.add_comment')}
            </Button>
          </div>
        </div>
      </RightSideModal>
    </div>
  )
}

export default MyTasks
