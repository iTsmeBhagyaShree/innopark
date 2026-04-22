import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import RightSideModal from '../../../components/ui/RightSideModal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { eventsAPI } from '../../../api'
import { useLanguage } from '../../../context/LanguageContext'
import {
  IoChevronBack,
  IoChevronForward
} from 'react-icons/io5'

const CalendarPage = () => {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const userId = user?.id || localStorage.getItem('userId')
  const companyId = user?.company_id || localStorage.getItem('companyId')
  const [viewMode, setViewMode] = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  useEffect(() => {
    if (userId && companyId) {
      fetchEvents()
    }
  }, [currentDate, userId, companyId])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      console.log(`Fetching events for year: ${year}, month: ${month}`)

      const response = await eventsAPI.getAll({
        year,
        month,
        company_id: companyId,
        page: 1,
        pageSize: 100
      })

      console.log('Events API response:', response.data)

      if (response.data.success) {
        const fetchedEvents = response.data.data || []
        console.log(`Received ${fetchedEvents.length} events from API`)

        const transformedEvents = fetchedEvents.map(event => {
          let eventDate = event.starts_on_date || event.start_date || event.date
          if (eventDate && typeof eventDate === 'string') {
            const date = new Date(eventDate)
            if (!isNaN(date.getTime())) {
              eventDate = date.toISOString().split('T')[0]
            }
          }

          return {
            id: event.id,
            title: event.title || event.event_name || `${t('sidebar.events')} #${event.id}`,
            date: eventDate || new Date().toISOString().split('T')[0],
            time: event.starts_on_time || event.start_time || '10:00',
            color: event.label_color || '#3B82F6',
            ...event
          }
        })
        setEvents(transformedEvents)
        console.log(`Transformed ${transformedEvents.length} events`)
      } else {
        console.error('API returned success:false', response.data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      console.error('Error response:', error.response?.data)
      alert(`${t('events.alerts.fetch_failed')}: ${error.response?.data?.error || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }

  const getMonthName = () => {
    return currentDate.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' })
  }

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleViewEvent = async (event) => {
    try {
      const response = await eventsAPI.getById(event.id, { company_id: companyId })
      if (response.data.success) {
        setSelectedEvent(response.data.data)
        setIsViewModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching event details:', error)
      setSelectedEvent(event)
      setIsViewModalOpen(true)
    }
  }

  const getEventsForDay = (day) => {
    if (!day) return []
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => {
      const eventDate = e.date || e.starts_on_date || e.start_date
      if (!eventDate) return false
      const date = new Date(eventDate)
      if (isNaN(date.getTime())) return false
      const formattedDate = date.toISOString().split('T')[0]
      return formattedDate === dateStr
    })
  }

  const calendarDays = getCalendarDays()
  const weekDays = [
    t('days.monday_short') || 'Mo', 
    t('days.tuesday_short') || 'Di', 
    t('days.wednesday_short') || 'Mi', 
    t('days.thursday_short') || 'Do', 
    t('days.friday_short') || 'Fr', 
    t('days.saturday_short') || 'Sa', 
    t('days.sunday_short') || 'So'
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">{t('events.title')}</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">{t('events.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 w-full">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-4">
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <IoChevronBack size={18} />
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <IoChevronForward size={18} />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              {t('common.today') || 'Heute'}
            </button>
            <span className="ml-2 sm:ml-4 text-base sm:text-lg font-semibold text-primary-text whitespace-nowrap">{getMonthName()}</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-1 scrollbar-hide">
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1 min-w-max">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'month' ? 'bg-primary-accent text-white' : 'text-gray-600'}`}
              >
                {t('events.modes.month')}
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'week' ? 'bg-primary-accent text-white' : 'text-gray-600'}`}
              >
                {t('events.modes.week')}
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'day' ? 'bg-primary-accent text-white' : 'text-gray-600'}`}
              >
                {t('events.modes.day')}
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'list' ? 'bg-primary-accent text-white' : 'text-gray-600'}`}
              >
                {t('events.modes.list')}
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'month' && (
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {weekDays.map(day => (
                  <div key={day} className="px-2 py-3 text-xs font-medium text-secondary-text uppercase text-center">
                    {day}
                  </div>
                ))}
              </div>
            <div className="grid grid-cols-7 bg-white">
              {calendarDays.map((day, index) => {
                const dayEvents = day ? getEventsForDay(day) : []
                const isToday = day && new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()

                return (
                  <div
                    key={index}
                    className={`min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-200 p-1 sm:p-2 ${!day ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                      } ${isToday ? 'bg-blue-50' : ''}`}
                  >
                    {day && (
                      <>
                        <div className={`text-xs sm:text-sm font-medium mb-1 ${isToday ? 'text-primary-accent' : 'text-primary-text'}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewEvent(event)
                              }}
                              className="group relative text-[10px] sm:text-xs px-1.5 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: event.color || event.label_color || '#3B82F6' }}
                            >
                              {event.title || event.event_name}
                              <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] text-primary-text">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color || event.label_color || '#3B82F6' }}></div>
                                  <p className="font-semibold text-sm">{event.title || event.event_name}</p>
                                </div>
                                <div className="text-xs text-secondary-text space-y-1">
                                  <p><span className="font-medium">{t('events.fields.uhrzeit')}:</span> {event.time || event.starts_on_time || t('common.na')}</p>
                                  {event.where && <p><span className="font-medium">{t('events.fields.ort')}:</span> {event.where}</p>}
                                  {event.status && <p><span className="font-medium">{t('events.fields.status')}:</span> {event.status}</p>}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2">{t('common.view_detail') || 'Klicken für Details'}</p>
                              </div>
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-[10px] sm:text-xs text-secondary-text">
                              +{dayEvents.length - 2} {t('events.more')}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          </div>
        )}
      </div>

      {/* View Event Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedEvent(null)
        }}
        title={t('events.details')}
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: selectedEvent.label_color || selectedEvent.color || '#3B82F6' }}
              />
              <h3 className="text-xl font-semibold text-primary-text">
                {selectedEvent.event_name || selectedEvent.title}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-secondary-text">{t('events.fields.date')}</label>
                <p className="text-primary-text font-medium">
                  {selectedEvent.starts_on_date
                    ? new Date(selectedEvent.starts_on_date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                    : t('common.na')}
                </p>
              </div>
              <div>
                <label className="text-sm text-secondary-text">{t('events.fields.time')}</label>
                <p className="text-primary-text font-medium">
                  {selectedEvent.starts_on_time || t('common.na')}
                </p>
              </div>
              <div>
                <label className="text-sm text-secondary-text">{t('projects.status.deadline') || t('common.end_date')}</label>
                <p className="text-primary-text font-medium">
                  {selectedEvent.ends_on_date
                    ? new Date(selectedEvent.ends_on_date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                    : t('common.na')}
                </p>
              </div>
              <div>
                <label className="text-sm text-secondary-text">{t('common.end_time') || 'End Time'}</label>
                <p className="text-primary-text font-medium">
                  {selectedEvent.ends_on_time || t('common.na')}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm text-secondary-text">{t('events.fields.where')}</label>
              <p className="text-primary-text">{selectedEvent.where || t('common.na')}</p>
            </div>

            <div>
              <label className="text-sm text-secondary-text">{t('common.status')}</label>
              <Badge variant={
                selectedEvent.status === 'Confirmed' ? 'success' :
                  selectedEvent.status === 'Cancelled' ? 'danger' :
                    selectedEvent.status === 'Completed' ? 'info' : 'warning'
              }>
                {t(`common.status.${selectedEvent.status?.toLowerCase()}`) || selectedEvent.status || t('common.status.pending')}
              </Badge>
            </div>

            {selectedEvent.description && (
              <div>
                <label className="text-sm text-secondary-text">{t('common.description')}</label>
                <p className="text-primary-text">{selectedEvent.description}</p>
              </div>
            )}

            {selectedEvent.event_link && (
              <div>
                <label className="text-sm text-secondary-text">{t('events.fields.link')}</label>
                <a
                  href={selectedEvent.event_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-accent hover:underline"
                >
                  {selectedEvent.event_link}
                </a>
              </div>
            )}

            {selectedEvent.host_name && (
              <div>
                <label className="text-sm text-secondary-text">{t('events.fields.host')}</label>
                <p className="text-primary-text">{selectedEvent.host_name}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedEvent(null)
                }}
                className="flex-1"
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default CalendarPage
