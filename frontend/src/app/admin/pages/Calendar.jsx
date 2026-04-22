import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import RightSideModal from '../../../components/ui/RightSideModal'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import { eventsAPI, employeesAPI, departmentsAPI } from '../../../api'
import { useAuth } from '../../../context/AuthContext'
import {
  IoAdd,
  IoSearch,
  IoFilter,
  IoChevronDown,
  IoChevronBack,
  IoChevronForward,
  IoRefresh,
  IoGrid,
  IoList,
  IoCheckmarkCircle,
  IoCloudUpload,
  IoClose,
  IoCalendarOutline
} from 'react-icons/io5'

const CalendarPage = () => {
  const location = useLocation()
  const { user } = useAuth()
  const companyId = user?.company_id || localStorage.getItem('companyId') || 1
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState('month') // 'month', 'week', 'day', 'list'
  const [currentDate, setCurrentDate] = useState(new Date()) // Current date
  const [employeeFilter, setEmployeeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState('')

  // Check if modal should open from navigation state (and prefill form)
  useEffect(() => {
    if (location.state?.openAddModal) {
      setIsAddModalOpen(true)

      // Optional prefill support (used when navigating from Contacts/Clients/etc.)
      const prefill = location.state?.prefill
      if (prefill && typeof prefill === 'object') {
        setFormData((prev) => ({
          ...prev,
          ...(prefill.eventName !== undefined ? { eventName: prefill.eventName } : {}),
          ...(prefill.description !== undefined ? { description: prefill.description } : {}),
          ...(prefill.where !== undefined ? { where: prefill.where } : {}),
          ...(prefill.selectEmployee !== undefined ? { selectEmployee: prefill.selectEmployee } : {}),
          ...(prefill.startsOnDate !== undefined ? { startsOnDate: prefill.startsOnDate } : {}),
          ...(prefill.startsOnTime !== undefined ? { startsOnTime: prefill.startsOnTime } : {}),
          ...(prefill.endsOnDate !== undefined ? { endsOnDate: prefill.endsOnDate } : {}),
          ...(prefill.endsOnTime !== undefined ? { endsOnTime: prefill.endsOnTime } : {}),
          ...(prefill.status !== undefined ? { status: prefill.status } : {}),
          ...(prefill.labelColor !== undefined ? { labelColor: prefill.labelColor } : {}),
        }))
      }

      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    eventName: '',
    labelColor: '#3B82F6',
    where: '',
    description: '',
    startsOnDate: getTodayDate(),
    startsOnTime: '16:00',
    endsOnDate: getTodayDate(),
    endsOnTime: '16:00',
    department: [],
    selectEmployee: [],
    host: '',
    status: '',
    eventLink: '',
    file: null,
    labels: '',
    shareWith: 'only_me', // 'only_me', 'all_team', 'specific'
    repeat: false,
  })

  // Preset colors for event labels
  const presetColors = [
    '#22C55E', '#10B981', '#3B82F6', '#6366F1', '#EAB308',
    '#F97316', '#EF4444', '#EC4899', '#D946EF', '#8B5CF6',
    '#06B6D4', '#14B8A6', '#1F2937', '#6B7280'
  ]

  const [events, setEvents] = useState([])
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch events, employees, clients, departments on component mount
  useEffect(() => {
    fetchEvents()
    fetchEmployees()
    fetchDepartments()
  }, [currentDate, yearFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchEvents:', companyId)
        setEvents([])
        setLoading(false)
        return
      }
      const year = yearFilter || currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const response = await eventsAPI.getAll({
        company_id: companyId,
        year,
        month
      })
      if (response.data.success) {
        const fetchedEvents = response.data.data || []
        setEvents(fetchedEvents)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await employeesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setEmployees(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }



  const fetchDepartments = async () => {
    try {
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchDepartments:', companyId)
        setDepartments([])
        return
      }
      const response = await departmentsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setDepartments(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const statuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed']

  // Generate calendar days for December 2025
  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7 // Monday = 0

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const calendarDays = getCalendarDays()
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  // Filter events based on filters
  const getFilteredEvents = () => {
    return events.filter(event => {
      // Employee filter
      if (employeeFilter !== 'All') {
        const hasEmployee = event.employees?.some(emp => emp.id === parseInt(employeeFilter))
        if (!hasEmployee) return false
      }
      // Status filter
      if (statusFilter !== 'All' && event.status !== statusFilter) {
        return false
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!event.event_name?.toLowerCase().includes(query) &&
          !event.where?.toLowerCase().includes(query) &&
          !event.description?.toLowerCase().includes(query)) {
          return false
        }
      }
      return true
    })
  }

  const filteredEvents = getFilteredEvents()

  // Get events for a specific day from filtered events
  const getEventsForDay = (day) => {
    if (!day) return []
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    return filteredEvents.filter(event => {
      if (!event.starts_on_date) return false
      const eventDate = new Date(event.starts_on_date)
      // Handle timezone offset - use UTC date
      const eventDay = eventDate.getUTCDate()
      const eventMonth = eventDate.getUTCMonth()
      const eventYear = eventDate.getUTCFullYear()
      return eventDay === day &&
        eventMonth === month &&
        eventYear === year
    })
  }

  // State for view event modal
  const [isViewEventModalOpen, setIsViewEventModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const handleViewEvent = (event) => {
    setSelectedEvent(event)
    setIsViewEventModalOpen(true)
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1)
    setCurrentDate(newDate)
    // Update year filter if year changes
    if (newDate.getFullYear() !== yearFilter) {
      setYearFilter(newDate.getFullYear())
    }
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setYearFilter(today.getFullYear())
  }

  const formatDate = (date) => {
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':')
    const hour12 = parseInt(hours) % 12 || 12
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM'
    return `${hour12}:${minutes} ${ampm}`
  }

  const handleSave = async () => {
    if (!formData.eventName) {
      alert('Veranstaltungsname ist erforderlich')
      return
    }
    if (!formData.startsOnDate) {
      alert('Startdatum ist erforderlich')
      return
    }
    if (!formData.startsOnTime) {
      alert('Startzeit ist erforderlich')
      return
    }
    if (!formData.endsOnDate) {
      alert('Enddatum ist erforderlich')
      return
    }
    if (!formData.endsOnTime) {
      alert('Endzeit ist erforderlich')
      return
    }
    // If "specific" is selected, require at least one employee
    if (formData.shareWith === 'specific' && formData.selectEmployee.length === 0) {
      alert('Bitte wählen Sie mindestens einen Mitarbeiter aus, wenn Sie mit bestimmten Mitgliedern teilen')
      return
    }

    try {
      const userId = user?.id || localStorage.getItem('userId')

      const eventData = {
        event_name: formData.eventName,
        description: formData.description || null,
        where: formData.where || 'TBD',
        starts_on_date: formData.startsOnDate,
        starts_on_time: formData.startsOnTime,
        ends_on_date: formData.endsOnDate,
        ends_on_time: formData.endsOnTime,
        label_color: formData.labelColor,
        employee_ids: formData.selectEmployee.map(id => parseInt(id)),
        department_ids: formData.department.map(id => parseInt(id)),
        host_id: formData.host ? parseInt(formData.host) : (userId ? parseInt(userId) : null),
        status: formData.status || 'Pending',
        event_link: formData.eventLink || null,
        company_id: parseInt(companyId),
        user_id: userId ? parseInt(userId) : null,
        share_with: formData.shareWith,
        labels: formData.labels || '',
        repeat: formData.repeat || false,
      }

      const response = await eventsAPI.create(eventData)
      if (response.data.success) {
        alert('Veranstaltung erfolgreich erstellt!')
        await fetchEvents()
        setIsAddModalOpen(false)
        resetForm()
      } else {
        alert(response.data.error || 'Veranstaltung konnte nicht erstellt werden')
      }
    } catch (error) {
      console.error('Error saving event:', error)
      alert(error.response?.data?.error || 'Veranstaltung konnte nicht gespeichert werden')
    }
  }

  const resetForm = () => {
    setFormData({
      eventName: '',
      labelColor: '#3B82F6',
      where: '',
      description: '',
      startsOnDate: getTodayDate(),
      startsOnTime: '16:00',
      endsOnDate: getTodayDate(),
      endsOnTime: '16:00',
      department: [],
      selectEmployee: [],
      host: '',
      status: '',
      eventLink: '',
      file: null,
      labels: '',
      shareWith: 'only_me',
      repeat: false,
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">Veranstaltung</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">Veranstaltungen anzeigen und verwalten</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
          >
            <option value="All">Mitarbeiter Alle</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name || emp.email}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
          >
            <option value="All">Status Alle</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => {
              const selectedYear = parseInt(e.target.value, 10)
              setYearFilter(selectedYear)
              setCurrentDate(new Date(selectedYear, currentDate.getMonth(), 1))
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
          >
            {Array.from({ length: 10 }, (_, i) => {
              const year = new Date().getFullYear() - 5 + i
              return (
                <option key={year} value={year}>{year}</option>
              )
            })}
          </select>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suche eingeben"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              />
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text" size={18} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200">
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1.5">
            <IoAdd size={14} />
            Veranstaltung hinzufügen
          </Button>
        </div>
      </div>

      {/* Calendar View Controls */}
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
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()}
            >
              Heute
            </button>
            <span className="ml-2 sm:ml-4 text-base sm:text-lg font-semibold text-primary-text whitespace-nowrap">{formatDate(currentDate)}</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-1 scrollbar-hide">
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1 min-w-max">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'month' ? 'bg-primary-accent text-white' : 'text-gray-600'}`}
              >
                Monat
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'week' ? 'bg-primary-accent text-white' : 'text-gray-600'}`}
              >
                Woche
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'day' ? 'bg-primary-accent text-white' : 'text-gray-600'}`}
              >
                Tag
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'list' ? 'bg-primary-accent text-white' : 'text-gray-600'}`}
              >
                Liste
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        {viewMode === 'month' && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {weekDays.map(day => (
                <div key={day} className="px-4 py-3 text-xs font-medium text-secondary-text uppercase text-center">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 bg-white">
              {calendarDays.map((day, index) => {
                const dayEvents = day ? getEventsForDay(day) : []
                return (
                  <div
                    key={index}
                    className="min-h-[100px] border-r border-b border-gray-200 p-2 hover:bg-gray-50 cursor-pointer relative"
                  >
                    {day !== null && (
                      <>
                        <div className="text-sm font-medium text-primary-text mb-1">{day}</div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <button
                              key={event.id}
                              onClick={() => handleViewEvent(event)}
                              className="w-full px-2 py-1 text-white text-xs rounded hover:opacity-80 truncate text-left"
                              style={{ backgroundColor: event.label_color || '#3B82F6' }}
                              title={event.event_name}
                            >
                              {event.event_name}
                            </button>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-secondary-text text-center">
                              +{dayEvents.length - 3} weitere
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
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase">Veranstaltungsname</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase">Datum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase">Uhrzeit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase">Ort</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-secondary-text">Keine Veranstaltungen gefunden</td>
                    </tr>
                  ) : (
                    filteredEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.label_color || '#3B82F6' }}></div>
                            <span className="text-primary-text font-medium">{event.event_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-primary-text">
                          {new Date(event.starts_on_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-primary-text">
                          {event.starts_on_time?.slice(0, 5)} - {event.ends_on_time?.slice(0, 5)}
                        </td>
                        <td className="px-4 py-3 text-sm text-secondary-text">{event.where || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge className={event.status === 'Confirmed' ? 'bg-green-100 text-green-800' : event.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                            {event.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="outline" size="sm" onClick={() => handleViewEvent(event)}>Ansehen</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <Card className="p-4">
            <div className="space-y-2">
              {filteredEvents
                .filter(event => {
                  const eventDate = new Date(event.starts_on_date)
                  const startOfWeek = new Date(currentDate)
                  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1)
                  const endOfWeek = new Date(startOfWeek)
                  endOfWeek.setDate(startOfWeek.getDate() + 6)
                  return eventDate >= startOfWeek && eventDate <= endOfWeek
                })
                .map((event) => (
                  <div key={event.id} onClick={() => handleViewEvent(event)} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.label_color || '#3B82F6' }}></div>
                    <div className="flex-1">
                      <p className="font-medium text-primary-text">{event.event_name}</p>
                      <p className="text-sm text-secondary-text">{new Date(event.starts_on_date).toLocaleDateString()} • {event.starts_on_time?.slice(0, 5)}</p>
                    </div>
                    <Badge className={event.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{event.status}</Badge>
                  </div>
                ))
              }
              {filteredEvents.filter(event => {
                const eventDate = new Date(event.starts_on_date)
                const startOfWeek = new Date(currentDate)
                startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1)
                const endOfWeek = new Date(startOfWeek)
                endOfWeek.setDate(startOfWeek.getDate() + 6)
                return eventDate >= startOfWeek && eventDate <= endOfWeek
              }).length === 0 && (
                  <p className="text-secondary-text text-center py-8">Keine Veranstaltungen diese Woche</p>
                )}
            </div>
          </Card>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <Card className="p-4">
            <div className="space-y-2">
              {filteredEvents
                .filter(event => {
                  const eventDate = new Date(event.starts_on_date)
                  return eventDate.toDateString() === currentDate.toDateString()
                })
                .map((event) => (
                  <div key={event.id} onClick={() => handleViewEvent(event)} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.label_color || '#3B82F6' }}></div>
                    <div className="flex-1">
                      <p className="font-medium text-primary-text">{event.event_name}</p>
                      <p className="text-sm text-secondary-text">{event.starts_on_time?.slice(0, 5)} - {event.ends_on_time?.slice(0, 5)} • {event.where}</p>
                    </div>
                    <Badge className={event.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{event.status}</Badge>
                  </div>
                ))
              }
              {filteredEvents.filter(event => {
                const eventDate = new Date(event.starts_on_date)
                return eventDate.toDateString() === currentDate.toDateString()
              }).length === 0 && (
                  <p className="text-secondary-text text-center py-8">Keine Veranstaltungen heute</p>
                )}
            </div>
          </Card>
        )}
      </div>

      {/* Add Event Modal */}
      <RightSideModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          resetForm()
        }}
        title="Veranstaltung hinzufügen"
      >
        <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Veranstaltungsname <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              placeholder="Veranstaltungsname eingeben"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none"
              placeholder="Beschreibung eingeben"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Ort
            </label>
            <Input
              value={formData.where}
              onChange={(e) => setFormData({ ...formData, where: e.target.value })}
              placeholder="Ort eingeben"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Bezeichnungen
            </label>
            <Input
              value={formData.labels}
              onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
              placeholder="Bezeichnungen eingeben"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Teilen mit
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="shareWith"
                  value="only_me"
                  checked={formData.shareWith === 'only_me'}
                  onChange={(e) => setFormData({ ...formData, shareWith: e.target.value })}
                  className="w-4 h-4 text-primary-accent"
                />
                <span className="text-sm text-primary-text">Nur ich</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="shareWith"
                  value="all_team"
                  checked={formData.shareWith === 'all_team'}
                  onChange={(e) => setFormData({ ...formData, shareWith: e.target.value })}
                  className="w-4 h-4 text-primary-accent"
                />
                <span className="text-sm text-primary-text">Alle Teammitglieder</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="shareWith"
                  value="specific"
                  checked={formData.shareWith === 'specific'}
                  onChange={(e) => setFormData({ ...formData, shareWith: e.target.value })}
                  className="w-4 h-4 text-primary-accent"
                />
                <span className="text-sm text-primary-text">Bestimmte Mitglieder und Teams</span>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.repeat}
                onChange={(e) => setFormData({ ...formData, repeat: e.target.checked })}
                className="w-4 h-4 text-primary-accent rounded"
              />
              <span className="text-sm font-medium text-primary-text">Wiederholen</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Farbe
            </label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, labelColor: color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${formData.labelColor === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Startdatum <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.startsOnDate}
                onChange={(e) => setFormData({ ...formData, startsOnDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Startzeit <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                value={formData.startsOnTime}
                onChange={(e) => setFormData({ ...formData, startsOnTime: e.target.value })}
                required
              />
              <span className="text-xs text-secondary-text mt-1 block">
                {formatTime(formData.startsOnTime)}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Enddatum <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.endsOnDate}
                onChange={(e) => setFormData({ ...formData, endsOnDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Endzeit <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                value={formData.endsOnTime}
                onChange={(e) => setFormData({ ...formData, endsOnTime: e.target.value })}
                required
              />
              <span className="text-xs text-secondary-text mt-1 block">
                {formatTime(formData.endsOnTime)}
              </span>
            </div>
          </div>

          {/* Employee and Client selection - only show when "specific" is selected */}
          {formData.shareWith === 'specific' && (
            <>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Mitarbeiter auswählen
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {employees.map(emp => {
                    const empId = emp.id || emp.user_id || emp
                    const empName = emp.name || emp.email || emp
                    return (
                      <label key={empId} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectEmployee.includes(empId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, selectEmployee: [...formData.selectEmployee, empId] })
                            } else {
                              setFormData({ ...formData, selectEmployee: formData.selectEmployee.filter(e => e !== empId) })
                            }
                          }}
                          className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent"
                        />
                        <span className="text-sm text-primary-text">{empName}</span>
                      </label>
                    )
                  })}
                </div>
                {formData.selectEmployee.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.selectEmployee.map(empId => {
                      const emp = employees.find(e => (e.id || e.user_id || e) === empId)
                      const empName = emp ? (emp.name || emp.email || emp) : empId
                      return (
                        <Badge key={empId} variant="default" className="flex items-center gap-1">
                          {empName}
                          <button
                            onClick={() => setFormData({ ...formData, selectEmployee: formData.selectEmployee.filter(e => e !== empId) })}
                          >
                            <IoClose size={14} />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Kunde auswählen <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {clients.map(client => {
                    const clientId = client.id || client.client_id || client
                    const clientName = client.company_name || client.name || client.email || client
                    return (
                      <label key={clientId} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectClient.includes(clientId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, selectClient: [...formData.selectClient, clientId] })
                            } else {
                              setFormData({ ...formData, selectClient: formData.selectClient.filter(c => c !== clientId) })
                            }
                          }}
                          className="w-4 h-4 text-primary-accent rounded focus:ring-primary-accent"
                        />
                        <span className="text-sm text-primary-text">{clientName}</span>
                      </label>
                    )
                  })}
                </div>
                {formData.selectClient.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.selectClient.map(clientId => {
                      const client = clients.find(c => (c.id || c.client_id || c) === clientId)
                      const clientName = client ? (client.company_name || client.name || client.email || client) : clientId
                      return (
                        <Badge key={clientId} variant="default" className="flex items-center gap-1">
                          {clientName}
                          <button
                            onClick={() => setFormData({ ...formData, selectClient: formData.selectClient.filter(c => c !== clientId) })}
                          >
                            <IoClose size={14} />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="">--</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Veranstaltungslink
            </label>
            <Input
              type="url"
              value={formData.eventLink}
              onChange={(e) => setFormData({ ...formData, eventLink: e.target.value })}
              placeholder="e.g. https://www.example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Datei hinzufügen
            </label>
            <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-accent transition-colors">
              <IoCloudUpload className="text-gray-400 mr-2" size={20} />
              <span className="text-sm text-secondary-text">Datei auswählen</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
              />
            </label>
            {formData.file && (
              <div className="mt-2 text-sm text-primary-text">
                Ausgewählt: {formData.file.name}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                resetForm()
              }}
              className="px-4"
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="px-4 flex items-center justify-center gap-2"
            >
              <IoCheckmarkCircle size={18} />
              Speichern
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* View Event Modal */}
      <Modal
        isOpen={isViewEventModalOpen}
        onClose={() => {
          setIsViewEventModalOpen(false)
          setSelectedEvent(null)
        }}
        title="Veranstaltungsdetails"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedEvent.label_color || '#3B82F6' }}></div>
              <h3 className="text-lg font-semibold text-primary-text">{selectedEvent.event_name}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Datum</label>
                <p className="text-primary-text">{new Date(selectedEvent.starts_on_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Uhrzeit</label>
                <p className="text-primary-text">{selectedEvent.starts_on_time?.slice(0, 5)} - {selectedEvent.ends_on_time?.slice(0, 5)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Ort</label>
                <p className="text-primary-text">{selectedEvent.where || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Status</label>
                <Badge className={selectedEvent.status === 'Confirmed' ? 'bg-green-100 text-green-800' : selectedEvent.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                  {selectedEvent.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Beschreibung</label>
              <p className="text-primary-text whitespace-pre-wrap">{selectedEvent.description || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Gastgeber</label>
              <p className="text-primary-text">{selectedEvent.host_name || '-'}</p>
            </div>
            {selectedEvent.employees?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Mitarbeiter</label>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.employees.map(emp => (
                    <Badge key={emp.id} className="bg-blue-100 text-blue-800">{emp.name || emp.email}</Badge>
                  ))}
                </div>
              </div>
            )}
            {selectedEvent.clients?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Kunden</label>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.clients.map(client => (
                    <Badge key={client.id} className="bg-purple-100 text-purple-800">{client.company_name || client.email}</Badge>
                  ))}
                </div>
              </div>
            )}
            {selectedEvent.event_link && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">Veranstaltungslink</label>
                <a href={selectedEvent.event_link} target="_blank" rel="noopener noreferrer" className="text-primary-accent hover:underline">{selectedEvent.event_link}</a>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewEventModalOpen(false)
                  setSelectedEvent(null)
                }}
                className="flex-1"
              >
                Schließen
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CalendarPage
