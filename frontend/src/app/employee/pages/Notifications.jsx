import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Card from '../../../components/ui/Card'
import { notificationsAPI } from '../../../api'
import { IoSearch, IoNotifications } from 'react-icons/io5'

const Notifications = () => {
  const { user } = useAuth()
  const userId = user?.id || localStorage.getItem('userId')
  const companyId = user?.company_id || localStorage.getItem('companyId')
  
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (userId && companyId) {
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [userId, companyId])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchNotifications()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsAPI.getAll({
        company_id: companyId,
        user_id: userId,
        is_read: undefined,
        search: searchQuery || undefined
      })
      if (response.data.success) {
        setNotifications(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount({
        company_id: companyId,
        user_id: userId
      })
      if (response.data.success) {
        setUnreadCount(response.data.data.unread_count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id, { user_id: userId })
      await fetchNotifications()
      await fetchUnreadCount()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead({ user_id: userId })
      await fetchNotifications()
      await fetchUnreadCount()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const columns = [
    { 
      key: 'title', 
      label: 'Titel',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {!row.is_read && (
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
          <span className={`font-medium ${!row.is_read ? 'text-primary-text' : 'text-secondary-text'}`}>
            {value}
          </span>
        </div>
      )
    },
    { 
      key: 'message', 
      label: 'Nachricht',
      render: (value) => (
        <span className="text-primary-text">{value}</span>
      )
    },
    { 
      key: 'type', 
      label: 'Typ',
      render: (value) => (
        <Badge variant="info">{value || 'Allgemein'}</Badge>
      )
    },
    { 
      key: 'created_at', 
      label: 'Datum',
      render: (value) => (
        <span className="text-secondary-text">
          {new Date(value).toLocaleString('de-DE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )
    },
    {
      key: 'is_read',
      label: 'Status',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Badge variant={value ? 'default' : 'info'}>
            {value ? 'Gelesen' : 'Ungelesen'}
          </Badge>
          {!value && (
            <button
              onClick={() => handleMarkAsRead(row.id)}
              className="text-xs text-blue-600 hover:underline"
            >
              Als gelesen markieren
            </button>
          )}
        </div>
      ),
    },
  ]

  const filteredNotifications = notifications.filter(notif => {
    if (searchQuery && !notif.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notif.message?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Benachrichtigungen</h1>
          <p className="text-secondary-text mt-1">Ihre Benachrichtigungen anzeigen</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Alle als gelesen markieren ({unreadCount})
          </button>
        )}
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text" size={18} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="pl-10"
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={filteredNotifications}
        loading={loading}
        emptyMessage="Keine Benachrichtigungen gefunden"
      />
    </div>
  )
}

export default Notifications
