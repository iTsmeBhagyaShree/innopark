import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import { messagesAPI } from '../../../api'
import {
  IoSend,
  IoSearch,
  IoEllipsisVertical,
  IoCheckmark,
  IoCheckmarkDone,
  IoPerson,
  IoPeople,
  IoTrash,
  IoArchive,
  IoVolumeOff,
  IoFlag,
  IoChatbubbles
} from 'react-icons/io5'

import { useLanguage } from '../../../context/LanguageContext'

const Messages = () => {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const userId = user?.id || localStorage.getItem('userId')
  const companyId = user?.company_id || localStorage.getItem('companyId')
  const userRole = user?.role || localStorage.getItem('userRole')

  const [activeTab, setActiveTab] = useState('admins')
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessageText, setNewMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showChatMenu, setShowChatMenu] = useState(false)
  const chatMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setShowChatMenu(false)
      }
    }
    if (showChatMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showChatMenu])

  useEffect(() => {
    if (userId && companyId && userRole) {
      fetchConversations()
      fetchAvailableUsers()
    }
  }, [userId, companyId, userRole])

  useEffect(() => {
    const loadData = async () => {
      if (selectedConversation) {
        await fetchConversationMessages(selectedConversation.other_user_id)
        await fetchConversations()
      }
    }
    loadData()

    let interval;
    if (selectedConversation) {
      interval = setInterval(async () => {
        await fetchConversationMessages(selectedConversation.other_user_id)
        fetchConversations()
      }, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [selectedConversation?.other_user_id])

  const fetchConversations = useCallback(async () => {
    try {
      if (conversations.length === 0) setLoading(true)
      const response = await messagesAPI.getAll({
        user_id: userId,
        company_id: companyId
      })
      if (response.data.success) {
        setConversations(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, companyId, conversations.length])

  const fetchAvailableUsers = async () => {
    try {
      const response = await messagesAPI.getAvailableUsers({
        user_id: userId,
        company_id: companyId,
        user_role: userRole
      })
      if (response.data.success) {
        setAvailableUsers(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching available users:', error)
    }
  }

  const fetchConversationMessages = async (otherUserId) => {
    try {
      const response = await messagesAPI.getConversation(otherUserId, {
        user_id: userId,
        company_id: companyId
      })
      if (response.data.success) {
        setMessages(response.data.data || [])
        setConversations(prev => prev.map(c => 
          String(c.other_user_id) === String(otherUserId) ? { ...c, unread_count: 0 } : c
        ));
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!newMessageText.trim() || !selectedConversation) return

    try {
      setSending(true)
      const response = await messagesAPI.create({
        to_user_id: selectedConversation.other_user_id,
        subject: 'Chat Message',
        message: newMessageText.trim(),
        user_id: userId,
        company_id: companyId
      })

      if (response.data.success) {
        setNewMessageText('')
        fetchConversationMessages(selectedConversation.other_user_id)
        fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleSelectUser = (user) => {
    const targetId = user.id || user.other_user_id;
    setConversations(prev => prev.map(c => 
      String(c.other_user_id) === String(targetId) ? { ...c, unread_count: 0 } : c
    ));
    setAvailableUsers(prev => prev.map(u => 
      String(u.id) === String(targetId) ? { ...u, unread_count: 0 } : u
    ));

    setSelectedConversation({
      other_user_id: targetId,
      other_user_name: user.display_name || user.name || user.other_user_name,
      other_user_email: user.email || user.other_user_email,
      other_user_role: user.role || user.other_user_role,
      unread_count: 0
    })
  }

  const filteredUsers = availableUsers.filter(user => {
    if (activeTab === 'admins' && user.role !== 'ADMIN') return false
    if (activeTab === 'colleagues' && user.role !== 'EMPLOYEE') return false

    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    )
  })

  const displayUsers = [
    ...conversations.filter(conv => {
      if (activeTab === 'admins' && conv.other_user_role !== 'ADMIN') return false
      if (activeTab === 'colleagues' && conv.other_user_role !== 'EMPLOYEE') return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          conv.other_user_name?.toLowerCase().includes(query) ||
          conv.other_user_email?.toLowerCase().includes(query)
        )
      }
      return true
    }),
    ...filteredUsers.filter(u =>
      !conversations.some(c => c.other_user_id === u.id)
    ).map(u => ({
      other_user_id: u.id,
      other_user_name: u.display_name || u.name,
      other_user_email: u.email,
      other_user_role: u.role,
      last_message: null,
      last_message_time: null,
      unread_count: 0
    }))
  ]

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className={`${selectedConversation ? 'hidden md:block' : ''}`}>
        <h1 className="text-3xl font-bold text-primary-text">{t('sidebar.messages')}</h1>
        <p className="text-secondary-text mt-1">{t('messages.subtitle') || 'Chat with your colleagues and administrators'}</p>
      </div>

      <Card className="overflow-hidden flex-1 shadow-2xl rounded-2xl border border-gray-200" style={{ height: 'calc(100vh - 180px)' }}>
        <div className="flex h-full relative">
          
          {/* User List Sidebar */}
          <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-gray-200 flex-col bg-white overflow-hidden`}>
            <div className="flex border-b border-gray-200 bg-gray-50/50">
              <button
                onClick={() => setActiveTab('admins')}
                className={`flex-1 py-4 text-xs font-bold border-b-2 transition-all duration-200 ${activeTab === 'admins' ? 'border-primary-accent text-primary-accent bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
              >
                {t('messages.admins') || t('messages.admins')}
              </button>
              <button
                onClick={() => setActiveTab('colleagues')}
                className={`flex-1 py-4 text-xs font-bold border-b-2 transition-all duration-200 ${activeTab === 'colleagues' ? 'border-primary-accent text-primary-accent bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
              >
                {t('messages.colleagues') || t('messages.colleagues')}
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="relative group">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-accent transition-colors" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('messages.search_contacts') || 'Search contacts...'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-accent/20 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
              {displayUsers.length > 0 ? (
                displayUsers.map((u) => (
                  <div
                    key={u.other_user_id}
                    onClick={() => handleSelectUser(u)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 group relative ${selectedConversation?.other_user_id === u.other_user_id ? 'bg-primary-accent/5 border-l-4 border-l-primary-accent' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-accent to-info flex items-center justify-center text-white font-bold shadow-soft">
                          {u.other_user_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className="text-sm font-bold text-gray-800 truncate group-hover:text-primary-accent transition-colors">{u.other_user_name}</h4>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {u.last_message_time ? new Date(u.last_message_time).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US') : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-gray-500 truncate italic">
                            {u.last_message || u.other_user_role}
                          </p>
                          {(u.unread_count > 0 && String(u.other_user_id) !== String(selectedConversation?.other_user_id)) && (
                            <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                              {u.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-sm">{t('messages.no_contacts_found') || 'No contacts found'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#FDFDFD]`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="w-10 h-10 rounded-full bg-primary-accent flex items-center justify-center text-white font-bold shadow-card">
                      {selectedConversation.other_user_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 leading-tight">{selectedConversation.other_user_name}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{selectedConversation.other_user_role}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="relative" ref={chatMenuRef}>
                      <button onClick={() => setShowChatMenu(!showChatMenu)} className="p-2.5 hover:bg-gray-100 rounded-full transition-all text-gray-500">
                        <IoEllipsisVertical size={20} />
                      </button>
                      {showChatMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          <button className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 text-gray-700 flex items-center gap-3">
                            <IoArchive size={18} className="text-gray-400" /> {t('messages.archive_conversation') || 'Archive conversation'}
                          </button>
                          <button className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 text-gray-700 flex items-center gap-3">
                            <IoVolumeOff size={18} className="text-gray-400" /> {t('messages.mute_notifications') || 'Mute notifications'}
                          </button>
                          <div className="my-1 border-t border-gray-50"></div>
                          <button className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3">
                            <IoTrash size={18} /> {t('messages.delete_conversation') || 'Delete conversation'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-pattern custom-scrollbar">
                  {messages.length > 0 ? (
                    messages.map((msg, index) => {
                      const isMyMessage = String(msg.from_user_id) === String(userId)
                      return (
                        <div key={msg.id || index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl p-4 ${
                            isMyMessage 
                              ? 'bg-primary-accent text-white rounded-tr-none shadow-premium-green' 
                              : 'bg-white text-gray-800 border border-gray-100 shadow-premium-white rounded-tl-none'
                          }`}>
                            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            <div className={`flex items-center gap-1.5 justify-end mt-2 text-[9px] font-bold ${isMyMessage ? 'text-white/80' : 'text-gray-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isMyMessage && (msg.is_read ? <IoCheckmarkDone size={14} className="text-blue-200" /> : <IoCheckmark size={14} />)}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-12 text-center">
                      <div className="space-y-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                          <IoChatbubbles size={32} className="text-gray-300" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">{t('messages.no_messages_yet') || 'No messages yet. Say hello!'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input Container */}
                <div className="p-4 md:p-6 bg-white border-t border-gray-100">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary-accent/20 focus-within:bg-white transition-all">
                    <input
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder={t('messages.type_message') || 'Type your message...'}
                      className="flex-1 px-4 py-2.5 bg-transparent outline-none text-sm font-medium text-gray-700"
                      disabled={sending}
                    />
                    <button 
                      type="submit" 
                      disabled={sending || !newMessageText.trim()} 
                      className="w-11 h-11 rounded-xl bg-primary-accent text-white flex items-center justify-center hover:bg-primary-accent/90 disabled:opacity-50 transition-all active:scale-95 shadow-lg group"
                    >
                      <IoSend size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 animate-in fade-in duration-700">
                <div className="relative mb-8">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner">
                    <IoPeople size={64} className="text-gray-200" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                    <IoChatbubbles size={24} className="text-primary-accent" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">{t('messages.select_chat') || 'Select a chat'}</h3>
                <p className="text-gray-500 mt-2 max-w-xs font-medium">{t('messages.select_chat_desc') || 'Connect with your team members and administrators instantly.'}</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Messages
