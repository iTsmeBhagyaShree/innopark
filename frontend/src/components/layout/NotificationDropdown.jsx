import { useState, useRef, useEffect } from 'react'
import { IoCheckmarkCircle, IoSettings, IoChevronForward } from 'react-icons/io5'
import { useLanguage } from '../../context/LanguageContext.jsx'

const NotificationDropdown = ({ isOpen, onClose, notifications = [] }) => {
  const { t } = useLanguage()
  const dropdownRef = useRef(null)
  const [position, setPosition] = useState({ top: 80, right: 16 })

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Check if click is on the notification button
        const button = event.target.closest('button')
        if (button && button.querySelector('svg')) {
          return // Don't close if clicking the button
        }
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Calculate position based on navbar height
      setPosition({ top: 80, right: 16 })
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const defaultNotifications = [
    {
      id: 1,
      avatar: 'SW',
      name: 'Sarah Wilson',
      time: '2 hours ago',
      taskTitle: 'Task #3425 - Implement product zoom',
      comment: 'Functionality testing done.',
      project: 'Product Photography and Cataloging',
      read: false,
    },
    {
      id: 2,
      avatar: 'JD',
      name: 'John Doe',
      time: '3 hours ago',
      taskTitle: 'Task #3281 - Create database schema',
      comment: 'Schema design completed.',
      project: 'Mobile App Development',
      read: false,
    },
    {
      id: 3,
      avatar: 'ED',
      name: 'Emily Davis',
      time: '5 hours ago',
      taskTitle: 'Task #3419 - Create product categories',
      comment: 'Categories added successfully.',
      project: 'Product Photography and Cataloging',
      read: true,
    },
  ]

  const displayNotifications = notifications.length > 0 ? notifications : defaultNotifications

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="fixed w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col"
      style={{ zIndex: 10000, maxHeight: 'calc(100vh - 6rem)', top: '88px', right: '16px' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('notifications.title')}</h3>
          <span className="text-sm text-gray-500">{displayNotifications.filter(n => !n.read).length} {t('common.add_new').toLowerCase().split(' ')[0]}</span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9', maxHeight: '400px' }}>
        {displayNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>{t('notifications.no_notifications')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">{notification.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900">{notification.name}</p>
                      <span className="text-xs text-gray-500">{notification.time}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-1">{notification.taskTitle}</p>
                    <p className="text-sm text-gray-600 mb-1">{notification.comment}</p>
                    <p className="text-xs text-gray-500">{notification.project}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 space-y-2">
        <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <span className="flex items-center gap-2">
            <IoCheckmarkCircle size={18} />
            {t('notifications.mark_all_read')}
          </span>
        </button>
        <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <span className="flex items-center gap-2">
            <IoSettings size={18} />
            {t('notifications.settings')}
          </span>
        </button>
        <button className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-primary-accent hover:bg-primary-accent/10 rounded-lg transition-colors">
          {t('notifications.see_all')}
          <IoChevronForward size={16} className="ml-1" />
        </button>
      </div>
    </div>
  )
}

export default NotificationDropdown

