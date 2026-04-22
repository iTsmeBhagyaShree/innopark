import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { eventsAPI } from '../../api'
import {
  IoAdd,
  IoCalendar,
  IoTime,
  IoLocation,
  IoEye,
  IoCreate,
  IoTrash,
  IoChevronDown,
  IoChevronUp,
  IoPeople,
  IoCheckmarkCircle,
} from 'react-icons/io5'
import { useLanguage } from '../../context/LanguageContext.jsx'

/**
 * Shared Events Section Component
 * Can be used in Lead, Client, Project detail pages
 * 
 * @param {string} relatedToType - 'lead', 'client', 'project'
 * @param {number} relatedToId - The ID of the related entity
 * @param {boolean} canCreate - Whether the user can create new events
 * @param {boolean} canEdit - Whether the user can edit events
 * @param {boolean} canDelete - Whether the user can delete events
 * @param {string} title - Section title (default: 'Events')
 * @param {boolean} collapsible - Whether the section can be collapsed
 * @param {boolean} defaultExpanded - Whether the section is expanded by default
 */
const EventsSection = ({
  relatedToType,
  relatedToId,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  title = null,
  collapsible = false,
  defaultExpanded = true,
}) => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const companyId = user?.company_id || localStorage.getItem('companyId')
  const userId = user?.id || localStorage.getItem('userId')

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [formData, setFormData] = useState({
    event_name: '',
    description: '',
    starts_on_date: new Date().toISOString().split('T')[0],
    starts_on_time: '09:00',
    ends_on_date: new Date().toISOString().split('T')[0],
    ends_on_time: '10:00',
    where: '',
    label_color: '#3B82F6',
    status: 'Scheduled',
    repeat: 'none',
  })

  useEffect(() => {
    if (companyId && relatedToId) {
      fetchEvents()
    }
  }, [companyId, relatedToId])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = {
        company_id: companyId,
      }
      
      // Add related entity filter
      if (relatedToType === 'lead') {
        params.lead_id = relatedToId

      } else if (relatedToType === 'project') {
        params.project_id = relatedToId
      }

      const response = await eventsAPI.getAll(params)
      if (response.data?.success) {
        setEvents(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setSelectedEvent(null)
    setFormData({
      event_name: '',
      description: '',
      starts_on_date: new Date().toISOString().split('T')[0],
      starts_on_time: '09:00',
      ends_on_date: new Date().toISOString().split('T')[0],
      ends_on_time: '10:00',
      where: '',
      label_color: '#3B82F6',
      status: 'Scheduled',
      repeat: 'none',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (event) => {
    setSelectedEvent(event)
    setFormData({
      event_name: event.event_name || event.title || '',
      description: event.description || '',
      starts_on_date: event.starts_on_date ? event.starts_on_date.split('T')[0] : new Date().toISOString().split('T')[0],
      starts_on_time: event.starts_on_time || '09:00',
      ends_on_date: event.ends_on_date ? event.ends_on_date.split('T')[0] : new Date().toISOString().split('T')[0],
      ends_on_time: event.ends_on_time || '10:00',
      where: event.where || '',
      label_color: event.label_color || '#3B82F6',
      status: event.status || 'Scheduled',
      repeat: event.repeat || 'none',
    })
    setIsModalOpen(true)
  }

  const handleView = (event) => {
    setSelectedEvent(event)
    setIsViewModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('events.confirm.delete'))) {
      try {
        await eventsAPI.delete(id, { company_id: companyId })
        fetchEvents()
      } catch (error) {
        console.error('Error deleting event:', error)
        alert(t('events.errors.delete_failed'))
      }
    }
  }

  const handleSave = async () => {
    if (!formData.event_name.trim()) {
      alert(t('events.errors.name_required'))
      return
    }

    try {
      const eventData = {
        ...formData,
        company_id: companyId,
        created_by: userId,
      }

      // Add related entity
      if (relatedToType === 'lead') {
        eventData.lead_id = relatedToId

      } else if (relatedToType === 'project') {
        eventData.project_id = relatedToId
      }

      if (selectedEvent) {
        await eventsAPI.update(selectedEvent.id, eventData, { company_id: companyId })
      } else {
        await eventsAPI.create(eventData, { company_id: companyId })
      }

      setIsModalOpen(false)
      fetchEvents()
    } catch (error) {
      console.error('Error saving event:', error)
      alert(t('events.errors.save_failed'))
    }
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      Scheduled: { bg: 'bg-blue-100', text: 'text-blue-600' },
      Confirmed: { bg: 'bg-green-100', text: 'text-green-600' },
      Completed: { bg: 'bg-purple-100', text: 'text-purple-600' },
      Cancelled: { bg: 'bg-red-100', text: 'text-red-600' },
    }
    const style = statusStyles[status] || statusStyles.Scheduled
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {status}
      </span>
    )
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div 
        className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 ${collapsible ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <IoCalendar className="text-primary-accent" size={20} />
          <h3 className="font-semibold text-gray-900">{title || t('events.title')}</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {events.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={(e) => { e.stopPropagation(); handleAdd() }}
              className="p-1.5 text-primary-accent hover:bg-primary-accent/10 rounded-lg transition-colors"
              title={t('common.add_event')}
            >
              <IoAdd size={20} />
            </button>
          )}
          {collapsible && (
            isExpanded ? <IoChevronUp size={20} className="text-gray-400" /> : <IoChevronDown size={20} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {(!collapsible || isExpanded) && (
        <div className="p-4">
          {loading ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary-accent border-t-transparent"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <IoCalendar size={40} className="mx-auto mb-2 opacity-30" />
              <p>{t('events.empty')}</p>
              {canCreate && (
                <button
                  onClick={handleAdd}
                  className="mt-2 text-sm font-medium text-primary-accent hover:underline"
                >
                  + {t('events.add_first')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  {/* Color indicator */}
                  <div
                    className="w-1 h-full min-h-[60px] rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.label_color || '#3B82F6' }}
                  />
                  
                  {/* Event details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {event.event_name || event.title}
                      </h4>
                      {getStatusBadge(event.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <IoCalendar size={14} />
                        <span>{formatDate(event.starts_on_date)}</span>
                      </div>
                      {event.starts_on_time && (
                        <div className="flex items-center gap-1">
                          <IoTime size={14} />
                          <span>{event.starts_on_time}</span>
                        </div>
                      )}
                    </div>
                    
                    {event.where && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                        <IoLocation size={14} />
                        <span className="truncate">{event.where}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleView(event)}
                      className="p-1.5 text-primary-accent hover:bg-primary-accent/10 rounded transition-colors"
                      title={t('common.view')}
                    >
                      <IoEye size={16} />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title={t('common.edit')}
                      >
                        <IoCreate size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title={t('common.delete')}
                      >
                        <IoTrash size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedEvent ? t('events.edit_title') : t('events.add_title')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('events.fields.name')} *</label>
            <input
              type="text"
              value={formData.event_name}
              onChange={(e) => setFormData(prev => ({ ...prev, event_name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent"
              placeholder={t('events.fields.name_placeholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('events.fields.start_date')}</label>
              <input
                type="date"
                value={formData.starts_on_date}
                onChange={(e) => setFormData(prev => ({ ...prev, starts_on_date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('events.fields.start_time')}</label>
              <input
                type="time"
                value={formData.starts_on_time}
                onChange={(e) => setFormData(prev => ({ ...prev, starts_on_time: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('events.fields.end_date')}</label>
              <input
                type="date"
                value={formData.ends_on_date}
                onChange={(e) => setFormData(prev => ({ ...prev, ends_on_date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('events.fields.end_time')}</label>
              <input
                type="time"
                value={formData.ends_on_time}
                onChange={(e) => setFormData(prev => ({ ...prev, ends_on_time: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent"
              />
            </div>
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('events.fields.location')}</label>
            <input
              type="text"
              value={formData.where}
              onChange={(e) => setFormData(prev => ({ ...prev, where: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent"
              placeholder={t('events.fields.location_placeholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auto.auto_ec53a8c4') || 'Status'}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent"
              >
                <option value="Scheduled">{t('auto.auto_2b7dabba') || 'Scheduled'}</option>
                <option value="Confirmed">{t('auto.auto_205bc73c') || 'Confirmed'}</option>
                <option value="Completed">{t('auto.auto_07ca5050') || 'Completed'}</option>
                <option value="Cancelled">{t('auto.auto_a149e85a') || 'Cancelled'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auto.auto_7020426c') || 'Repeat'}</label>
              <select
                value={formData.repeat}
                onChange={(e) => setFormData(prev => ({ ...prev, repeat: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent"
              >
                <option value="none">{t('auto.auto_52b058fc') || 'Does not repeat'}</option>
                <option value="daily">{t('auto.auto_c512b685') || 'Daily'}</option>
                <option value="weekly">{t('auto.auto_6c25e6a6') || 'Weekly'}</option>
                <option value="monthly">{t('auto.auto_9030e39f') || 'Monthly'}</option>
                <option value="yearly">{t('auto.auto_cf5ea795') || 'Yearly'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('auto.auto_cb5feb1b') || 'Color'}</label>
            <div className="flex gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, label_color: color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.label_color === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} className="flex-1">
              {selectedEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Event Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Event Details"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedEvent.label_color || '#3B82F6' }}
              />
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedEvent.event_name || selectedEvent.title}
              </h3>
              {getStatusBadge(selectedEvent.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase font-medium">{t('auto.auto_a6122a65') || 'Start'}</p>
                <p className="font-medium text-gray-900 mt-1">
                  {formatDate(selectedEvent.starts_on_date)}
                </p>
                {selectedEvent.starts_on_time && (
                  <p className="text-sm text-gray-600">{selectedEvent.starts_on_time}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase font-medium">{t('events.fields.end')}</p>
                <p className="font-medium text-gray-900 mt-1">
                  {formatDate(selectedEvent.ends_on_date)}
                </p>
                {selectedEvent.ends_on_time && (
                  <p className="text-sm text-gray-600">{selectedEvent.ends_on_time}</p>
                )}
              </div>
            </div>

            {selectedEvent.where && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">{t('events.fields.location')}</p>
                <div className="flex items-center gap-2 text-gray-700">
                  <IoLocation size={16} />
                  <span>{selectedEvent.where}</span>
                </div>
              </div>
            )}

            {selectedEvent.description && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">{t('common.description')}</p>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedEvent.description}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="flex-1">
                {t('common.close')}
              </Button>
              {canEdit && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsViewModalOpen(false)
                    handleEdit(selectedEvent)
                  }}
                  className="flex-1"
                >
                  {t('events.edit_title')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default EventsSection

