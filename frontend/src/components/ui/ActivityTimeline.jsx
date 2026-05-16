import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { activitiesAPI, employeesAPI, tasksAPI, meetingsAPI } from '../../api'
import Button from './Button'
import Card from './Card'
import Badge from './Badge'
import Input from './Input'
import { FormRow, FormInput, FormSelect } from './FormRow'
import {
    IoCall,
    IoPeople,
    IoDocumentText,
    IoMail,
    IoTime,
    IoAdd,
    IoChatbubble,
    IoCheckmarkCircle,
    IoCalendar,
    IoTrash,
    IoEye,
    IoCreate,
    IoClose,
    IoAlertCircle,
    IoCalendarOutline,
    IoCheckmarkCircleOutline
} from 'react-icons/io5'
import Modal from './Modal'

/**
 * ActivityTimeline Component
 * Displays a unified history of activities for a given entity
 */
const ActivityTimeline = ({
    entityType,
    entityId,
    companyId,
    dealId,
    contactId,
    leadId,
    showReferenceTag = true,
}) => {
    const { t, language } = useLanguage()
    const [activities, setActivities] = useState([])
    const [scheduledItems, setScheduledItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [activeTab, setActiveTab] = useState('activity')
    const [viewActivity, setViewActivity] = useState(null)
    const [newActivity, setNewActivity] = useState({
        type: 'comment',
        description: '',
        title: '',
        assigned_to: '',
        deadline: '',
        meeting_date: '',
        meeting_time: '',
        participants: ''
    })
    const [employees, setEmployees] = useState([])

    useEffect(() => {
        fetchData()
        fetchEmployees()
    }, [entityId, companyId, dealId, contactId, leadId])

    const fetchEmployees = async () => {
        try {
            const response = await employeesAPI.getAll()
            if (response.data.success) {
                setEmployees(response.data.data || [])
            }
        } catch (error) {
            console.error('Error fetching employees:', error)
        }
    }

    const fetchData = async () => {
        try {
            setLoading(true)
            const params = {}
            const priorityParams = {
                company_id: companyId,
                related_to_type: entityType,
                related_to_id: entityId
            }

            if (companyId) { params.company_id = companyId }
            else if (contactId) { params.contact_id = contactId }
            else if (dealId) { params.deal_id = dealId }
            else if (leadId) { params.lead_id = leadId }
            else {
                params.reference_type = entityType
                params.reference_id = entityId
            }

            // Fetch History and Scheduled items in parallel
            const [historyRes, tasksRes, meetingsRes] = await Promise.all([
                activitiesAPI.getAll(params),
                tasksAPI.getAll({ ...priorityParams, status: 'Pending' }),
                meetingsAPI.getAll({ ...priorityParams, status: 'Scheduled' })
            ])

            if (historyRes.data.success) {
                const sorted = (historyRes.data.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                setActivities(sorted)
            }

            // Combine and format scheduled items
            const scheduled = []
            if (tasksRes.data.success) {
                (tasksRes.data.data || []).forEach(task => {
                    scheduled.push({
                        ...task,
                        type: 'task',
                        displayDate: task.due_date,
                        isScheduled: true
                    })
                })
            }
            if (meetingsRes.data.success) {
                (meetingsRes.data.data || []).forEach(meeting => {
                    scheduled.push({
                        ...meeting,
                        type: 'meeting',
                        displayDate: meeting.meeting_date || meeting.start_time,
                        isScheduled: true
                    })
                })
            }
            setScheduledItems(scheduled.sort((a, b) => new Date(a.displayDate) - new Date(b.displayDate)))

        } catch (error) {
            console.error('Error fetching timeline data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddActivity = async () => {
        if (!newActivity.description.trim() && !newActivity.title.trim()) return
        try {
            const response = await activitiesAPI.create({
                ...newActivity,
                reference_type: entityType,
                reference_id: entityId
            })
            if (response.data.success) {
                setNewActivity({ type: 'comment', description: '', title: '', assigned_to: '', deadline: '', meeting_date: '', meeting_time: '', participants: '' })
                setIsAdding(false)
                fetchData()
            }
        } catch (error) { console.error('Error adding activity:', error) }
    }

    const handleDeleteActivity = async (id) => {
        if (!window.confirm(t('activities.confirm_delete'))) return
        try {
            const response = await activitiesAPI.delete(id)
            if (response.data.success) {
                if (viewActivity && viewActivity.id === id) setViewActivity(null)
                fetchData()
            }
        } catch (error) { console.error('Error deleting activity:', error) }
    }

    const handleUpdateActivity = async () => {
        if (!viewActivity || (!viewActivity.description?.trim() && !viewActivity.title?.trim())) return
        try {
            const response = await activitiesAPI.update(viewActivity.id, { ...viewActivity })
            if (response.data.success) {
                setViewActivity(null)
                fetchData()
            }
        } catch (error) { console.error('Error updating activity:', error) }
    }

    const getIcon = (type) => {
        switch (type) {
            case 'call': return <IoCall className="text-blue-500" />
            case 'meeting': return <IoPeople className="text-purple-500" />
            case 'email': return <IoMail className="text-green-500" />
            case 'task': return <IoCheckmarkCircle className="text-indigo-500" />
            case 'comment': return <IoChatbubble className="text-teal-500" />
            default: return <IoDocumentText className="text-amber-500" />
        }
    }

    const getTypeLabel = (type) => t(`activities.tabs.${type}`) || type.charAt(0).toUpperCase() + type.slice(1)
    const getReferenceLabel = (referenceType) => {
        const type = String(referenceType || '').toLowerCase().trim()
        return t(`activities.references.${type}`) || type.toUpperCase()
    }

    const filteredActivities = activities.filter(a => activeTab === 'activity' || a.type === activeTab)

    const tabs = [
        { id: 'activity', label: t('activities.tabs.activity'), icon: IoDocumentText },
        { id: 'comment', label: t('activities.tabs.comment'), icon: IoChatbubble },
        { id: 'task', label: t('activities.tabs.task'), icon: IoCheckmarkCircle },
        { id: 'email', label: t('activities.tabs.email'), icon: IoMail },
        { id: 'call', label: t('activities.tabs.call'), icon: IoCall },
        { id: 'meeting', label: t('activities.tabs.meeting'), icon: IoCalendar }
    ]

    const TimelineItem = ({ activity, isScheduled = false }) => (
        <div className="flex gap-6 group">
            <div className={`relative z-10 w-12 h-12 rounded-xl bg-white border shadow-sm flex items-center justify-center flex-shrink-0 ${isScheduled ? 'border-amber-200 ring-4 ring-amber-50' : 'border-gray-100'}`}>
                {getIcon(activity.type)}
            </div>
            <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">
                            {activity.title || activity.subject || getTypeLabel(activity.type)}
                        </span>
                        {isScheduled && (
                            <Badge variant="warning" className="text-[10px] uppercase font-black tracking-wider">
                                {t('common.scheduled')}
                            </Badge>
                        )}
                        {!isScheduled && showReferenceTag && (
                            <Badge variant="ghost" className="text-[10px] uppercase">
                                {getReferenceLabel(activity.reference_type)}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                        <IoTime size={14} />
                        {new Date(isScheduled ? activity.displayDate : activity.created_at).toLocaleString(language === 'de' ? 'de-DE' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>

                <div className="space-y-1 mb-2">
                    {activity.assigned_to_name && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <IoPeople size={12} /> {t('common.assigned_to')}: <span className="font-medium text-gray-700">{activity.assigned_to_name}</span>
                        </div>
                    )}
                    {(activity.type === 'meeting' && (activity.meeting_date || activity.meeting_time)) && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <IoCalendar size={12} /> {t('activities.schedule')}:
                            <span className="font-medium text-gray-700 ml-1">
                                {activity.meeting_date ? new Date(activity.meeting_date).toLocaleDateString() : ''}
                                {activity.meeting_time ? ` @ ${activity.meeting_time}` : ''}
                            </span>
                        </div>
                    )}
                </div>

                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {activity.description}
                </p>

                {!isScheduled && (
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">{t('activities.logged_by')}: {activity.creator_name || t('activities.system')}</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewActivity(activity)} className="p-1 text-gray-400 hover:text-blue-500 rounded hover:bg-blue-50"><IoEye size={16} /></button>
                            <button onClick={() => handleDeleteActivity(activity.id)} className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50"><IoTrash size={16} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider">{t('activities.history')}</h3>
                <Button variant="primary" size="sm" onClick={() => setIsAdding(true)} className="flex items-center gap-2">
                    <IoAdd size={16} /> {t('activities.new')}
                </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
                {tabs.map((tab) => {
                    const TabIcon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${isActive ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}>
                            <TabIcon size={16} /> {tab.label}
                        </button>
                    )
                })}
            </div>

            <div className="relative">
                <div className="absolute left-6 top-2 bottom-0 w-0.5 bg-gray-100" />
                
                <div className="space-y-12 relative">
                    {/* SCHEDULED SECTION */}
                    {scheduledItems.length > 0 && activeTab === 'activity' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                    <IoCalendarOutline size={24} />
                                </div>
                                <h4 className="text-sm font-black text-amber-600 uppercase tracking-[0.2em]">
                                    {t('activities.scheduled_activities')}
                                </h4>
                            </div>
                            <div className="space-y-8 ml-0">
                                {scheduledItems.map(item => (
                                    <TimelineItem key={`${item.type}-${item.id}`} activity={item} isScheduled={true} />
                                ))}
                            </div>
                            {/* Divider Line */}
                            <div className="py-4 flex items-center gap-4">
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{t('activities.history_starts')}</span>
                                <div className="flex-1 h-px bg-gray-100" />
                            </div>
                        </div>
                    )}

                    {/* HISTORY SECTION */}
                    <div className="space-y-6">
                        {activities.length > 0 && activeTab === 'activity' && (
                           <div className="flex items-center gap-4 relative z-10 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shadow-sm border border-gray-200">
                                    <IoTime size={24} />
                                </div>
                                <h4 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">
                                    {t('leads.detail.recent_activities')}
                                </h4>
                            </div>
                        )}
                        
                        {loading ? (
                            <div className="text-center py-8 text-gray-400 animate-pulse font-medium">{t('activities.loading')}</div>
                        ) : filteredActivities.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                                <IoTime size={48} className="mx-auto text-gray-200 mb-2" />
                                <p className="text-gray-400 font-medium">{t('activities.no_activities')}</p>
                            </div>
                        ) : (
                            filteredActivities.map(activity => (
                                <TimelineItem key={activity.id} activity={activity} />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modals remain same but use cleaned up design */}
            <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title={t('activities.log_new')} size="lg">
                <div className="space-y-6">
                    <div className="flex gap-2 flex-wrap p-1 bg-gray-50 rounded-xl">
                        {['comment', 'task', 'meeting', 'call', 'email', 'note'].map((type) => (
                            <button key={type} onClick={() => setNewActivity({ ...newActivity, type })} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${newActivity.type === type ? 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
                                {getIcon(type)} {getTypeLabel(type)}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {newActivity.type === 'task' && (
                            <>
                                <div className="md:col-span-2"><FormInput label={t('activities.task_name')} placeholder={t('activities.enter_subject')} value={newActivity.title} onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })} required /></div>
                                <FormSelect label={t('common.assigned_to')} value={newActivity.assigned_to} onChange={(e) => setNewActivity({ ...newActivity, assigned_to: e.target.value })}>
                                    <option value="">{t('activities.select_employee')}</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                </FormSelect>
                                <FormInput label={t('activities.deadline')} type="date" value={newActivity.deadline} onChange={(e) => setNewActivity({ ...newActivity, deadline: e.target.value })} />
                            </>
                        )}
                        {newActivity.type === 'meeting' && (
                            <>
                                <div className="md:col-span-2"><FormInput label={t('activities.title_subject')} placeholder={t('activities.enter_subject')} value={newActivity.title} onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })} required /></div>
                                <div className="md:col-span-2"><FormInput label={t('activities.participants')} placeholder={t('activities.participants')} value={newActivity.participants} onChange={(e) => setNewActivity({ ...newActivity, participants: e.target.value })} /></div>
                                <FormInput label={t('activities.meeting_date')} type="date" value={newActivity.meeting_date} onChange={(e) => setNewActivity({ ...newActivity, meeting_date: e.target.value })} />
                                <FormInput label={t('activities.meeting_time')} type="time" value={newActivity.meeting_time} onChange={(e) => setNewActivity({ ...newActivity, meeting_time: e.target.value })} />
                            </>
                        )}
                        {(['call', 'email', 'note', 'comment'].includes(newActivity.type)) && (
                            <div className="md:col-span-2"><FormInput label={t('activities.title_subject')} placeholder={t('activities.enter_subject')} value={newActivity.title} onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })} /></div>
                        )}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">{newActivity.type === 'task' || newActivity.type === 'meeting' ? t('activities.notes_description') : t('activities.description')}</label>
                            <textarea className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none text-sm min-h-[120px] resize-none shadow-sm" placeholder={t('activities.describe_details')} value={newActivity.description} onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="ghost" onClick={() => setIsAdding(false)}>{t('common.cancel')}</Button>
                        <Button variant="primary" onClick={handleAddActivity} disabled={!newActivity.description.trim() && !newActivity.title.trim()}>{t('activities.save')}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!viewActivity} onClose={() => setViewActivity(null)} title={viewActivity ? `${getTypeLabel(viewActivity.type)} ${t('activities.details')}` : t('activities.details')} size="lg">
                {viewActivity && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">{getIcon(viewActivity.type)}</div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800">{getTypeLabel(viewActivity.type)}</h4>
                                <p className="text-xs text-gray-500">{t('activities.logged_on')} {new Date(viewActivity.created_at).toLocaleString()}</p>
                            </div>
                            {showReferenceTag && <Badge variant="primary" className="uppercase">{getReferenceLabel(viewActivity.reference_type)}</Badge>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2"><FormInput label={t('activities.title_subject')} value={viewActivity.title || ''} onChange={(e) => setViewActivity({ ...viewActivity, title: e.target.value })} /></div>
                            {viewActivity.type === 'task' && (
                                <>
                                    <FormSelect label={t('common.assigned_to')} value={viewActivity.assigned_to || ''} onChange={(e) => setViewActivity({ ...viewActivity, assigned_to: e.target.value })}>
                                        <option value="">{t('activities.select_employee')}</option>
                                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                    </FormSelect>
                                    <FormInput label={t('activities.deadline')} type="date" value={viewActivity.deadline ? viewActivity.deadline.split('T')[0] : ''} onChange={(e) => setViewActivity({ ...viewActivity, deadline: e.target.value })} />
                                </>
                            )}
                            {viewActivity.type === 'meeting' && (
                                <>
                                    <div className="md:col-span-2"><FormInput label={t('activities.participants')} value={viewActivity.participants || ''} onChange={(e) => setViewActivity({ ...viewActivity, participants: e.target.value })} /></div>
                                    <FormInput label={t('activities.meeting_date')} type="date" value={viewActivity.meeting_date ? viewActivity.meeting_date.split('T')[0] : ''} onChange={(e) => setViewActivity({ ...viewActivity, meeting_date: e.target.value })} />
                                    <FormInput label={t('activities.meeting_time')} type="time" value={viewActivity.meeting_time || ''} onChange={(e) => setViewActivity({ ...viewActivity, meeting_time: e.target.value })} />
                                </>
                            )}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('activities.description')}</label>
                                <textarea className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none text-sm min-h-[150px] shadow-sm" value={viewActivity.description || ''} onChange={(e) => setViewActivity({ ...viewActivity, description: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-between pt-6 border-t border-gray-100">
                            <Button variant="destructive" onClick={() => handleDeleteActivity(viewActivity.id)} className="bg-red-50 text-red-600 hover:bg-red-100 border-none">{t('activities.delete')}</Button>
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setViewActivity(null)}>{t('activities.close')}</Button>
                                <Button variant="primary" onClick={handleUpdateActivity}>{t('activities.save_changes')}</Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default ActivityTimeline

