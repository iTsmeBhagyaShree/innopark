import { useState } from 'react'
import { IoChevronBack, IoChevronForward, IoAdd } from 'react-icons/io5'
import Card from './Card'
import Button from './Button'

const Calendar = ({ onEventClick, floatingButton }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month') // month, week, day, list

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getDaysArray = () => {
    const days = []
    const startDate = new Date(year, month, 1 - firstDayOfWeek)
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      days.push(date)
    }
    return days
  }

  const isToday = (date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isCurrentMonth = (date) => {
    return date.getMonth() === month
  }

  const days = getDaysArray()

  if (view === 'list') {
    return (
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary-text">List View</h3>
            <div className="flex gap-2">
              <Button
                variant={view === 'month' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                Month
              </Button>
              <Button
                variant={view === 'week' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Week
              </Button>
              <Button
                variant={view === 'day' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('day')}
              >
                Day
              </Button>
              <Button
                variant={view === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('list')}
              >
                List
              </Button>
            </div>
          </div>
          <p className="text-secondary-text text-center py-8">
            List view will display events in a list format
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="relative">
      {/* Header Controls */}
      <div className="p-3 md:p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          {/* Left: Type Filter & Navigation */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <select className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none">
              <option>All</option>
              <option>Events</option>
              <option>Tasks</option>
              <option>Meetings</option>
            </select>
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-1.5 md:p-2 hover:bg-main-bg rounded-lg transition-colors"
              >
                <IoChevronBack size={18} className="md:w-5 md:h-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-2 md:px-3 py-1 text-xs md:text-sm border border-gray-300 rounded-lg hover:bg-main-bg transition-colors"
              >
                Today
              </button>
              <button
                onClick={goToNextMonth}
                className="p-1.5 md:p-2 hover:bg-main-bg rounded-lg transition-colors"
              >
                <IoChevronForward size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
            <h2 className="text-base md:text-lg font-semibold text-primary-text">
              {monthNames[month]} {year}
            </h2>
          </div>

          {/* Right: View Options */}
          <div className="flex gap-1 md:gap-2 flex-wrap">
            <Button
              variant={view === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
              className="text-xs md:text-sm"
            >
              month
            </Button>
            <Button
              variant={view === 'week' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
              className="text-xs md:text-sm"
            >
              week
            </Button>
            <Button
              variant={view === 'day' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('day')}
              className="text-xs md:text-sm"
            >
              day
            </Button>
            <Button
              variant={view === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('list')}
              className="text-xs md:text-sm"
            >
              list
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-2 md:p-4">
        {view === 'month' && (
          <div className="overflow-x-auto -mx-2 md:mx-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  {dayNames.map((day) => (
                    <th
                      key={day}
                      className="p-1.5 md:p-2 text-xs md:text-sm font-semibold text-primary-text text-center border-b border-gray-200"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, weekIndex) => (
                  <tr key={weekIndex}>
                    {dayNames.map((_, dayIndex) => {
                      const dateIndex = weekIndex * 7 + dayIndex
                      const date = days[dateIndex]
                      const isCurrentMonthDate = isCurrentMonth(date)
                      const isTodayDate = isToday(date)

                      return (
                        <td
                          key={dateIndex}
                          className={`p-1 md:p-2 border border-gray-200 min-w-[60px] md:min-w-[80px] h-16 md:h-20 lg:h-24 cursor-pointer hover:bg-main-bg transition-colors ${
                            !isCurrentMonthDate ? 'bg-gray-50 text-gray-400' : ''
                          } ${isTodayDate ? 'bg-primary-accent bg-opacity-10' : ''}`}
                          onClick={() => onEventClick && onEventClick(date)}
                        >
                          <div className="text-xs md:text-sm font-medium mb-1">
                            {date.getDate()}
                          </div>
                          <div className="text-xs space-y-0.5">
                            {/* Events would be rendered here */}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'week' && (
          <div className="text-center py-12">
            <p className="text-secondary-text">Week view will be displayed here</p>
          </div>
        )}

        {view === 'day' && (
          <div className="text-center py-12">
            <p className="text-secondary-text">Day view will be displayed here</p>
          </div>
        )}
      </div>

      {/* Floating Button */}
      {floatingButton && (
        <button
          onClick={floatingButton.onClick}
          className="fixed md:absolute right-4 bottom-4 bg-primary-accent text-white p-3 md:p-4 rounded-full shadow-lg hover:shadow-2xl transform hover:scale-110 hover:-translate-y-1 active:translate-y-0 active:scale-100 transition-all duration-200 z-10"
          style={{
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
          }}
          title={floatingButton.label || 'Add Event'}
        >
          <IoAdd size={20} className="md:w-6 md:h-6" />
        </button>
      )}
    </Card>
  )
}

export default Calendar

