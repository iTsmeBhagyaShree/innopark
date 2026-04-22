import { useState, useRef, useEffect } from 'react'
import { IoClose, IoAdd, IoSearch } from 'react-icons/io5'
import SendMessageModal from './SendMessageModal'

const MessagesPanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('messages')
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const panelRef = useRef(null)

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const messages = [
    {
      id: 1,
      avatar: 'ES',
      name: 'Emily Smith',
      message: 'Hey, can you review the design mockups?',
      time: '10:30 AM',
      unread: true,
    },
    {
      id: 2,
      avatar: 'MW',
      name: 'Michael Wood',
      message: 'The project timeline looks good.',
      time: '9:15 AM',
      unread: false,
    },
    {
      id: 3,
      avatar: 'JD',
      name: 'John Doe',
      message: 'Meeting scheduled for tomorrow.',
      time: 'Yesterday',
      unread: true,
    },
    {
      id: 4,
      avatar: 'SW',
      name: 'Sarah Wilson',
      message: 'Thanks for the update!',
      time: 'Yesterday',
      unread: false,
    },
  ]

  const teamMembers = [
    { id: 1, avatar: 'SW', name: 'Sarah Wilson', role: 'Designer' },
    { id: 2, avatar: 'MJ', name: 'Mike Johnson', role: 'Developer' },
    { id: 3, avatar: 'ED', name: 'Emily Davis', role: 'Manager' },
  ]

  const clients = [
    { id: 1, avatar: 'JT', name: 'Jalen Turner', company: 'Stiedemann Inc' },
    { id: 2, avatar: 'TM', name: 'Trent Morar', company: 'Torp-Spinka' },
    { id: 3, avatar: 'EP', name: 'Edwina Prohaska', company: 'Zboncak Inc' },
  ]

  const handleMessageClick = (message) => {
    setSelectedMessage(message)
    setIsSendModalOpen(true)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay for mobile/tablet */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      
      {/* Messages Panel - Positioned as dropdown */}
      <div 
        ref={panelRef}
        className="fixed w-[calc(100vw-2rem)] sm:w-96 lg:w-[28rem] max-w-md bg-white shadow-lg border border-gray-200 flex flex-col rounded-t-lg lg:rounded-lg overflow-hidden"
        style={{ zIndex: 10000, maxHeight: 'calc(100vh - 6rem)', height: 'auto', top: '5.5rem', right: '1rem' }}
      >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h2 className="text-lg font-semibold text-gray-900">Nachrichten</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSendModalOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Neue Nachricht"
              >
                <IoAdd size={20} className="text-gray-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IoClose size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Nachrichten suchen..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-sm"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'messages'
                  ? 'text-primary-accent border-b-2 border-primary-accent bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Nachrichten
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'team'
                  ? 'text-primary-accent border-b-2 border-primary-accent bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Teammitglieder
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'clients'
                  ? 'text-primary-accent border-b-2 border-primary-accent bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kunden
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'messages' && (
              <div className="divide-y divide-gray-100">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => handleMessageClick(msg)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      msg.unread ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">{msg.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-900">{msg.name}</p>
                          <span className="text-xs text-gray-500">{msg.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="divide-y divide-gray-100">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => handleMessageClick({ ...member, name: member.name })}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-accent flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">{member.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'clients' && (
              <div className="divide-y divide-gray-100">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleMessageClick({ ...client, name: client.name })}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-accent flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">{client.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                        <p className="text-xs text-gray-500">{client.company}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      <SendMessageModal
        isOpen={isSendModalOpen}
        onClose={() => {
          setIsSendModalOpen(false)
          setSelectedMessage(null)
        }}
        recipient={selectedMessage}
      />
    </>
  )
}

export default MessagesPanel

