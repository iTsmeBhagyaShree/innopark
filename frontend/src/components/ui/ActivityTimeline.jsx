import React, { useState, useEffect } from 'react'
import { activitiesAPI, employeesAPI } from '../../api'
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
    IoClose
} from 'react-icons/io5'
import Modal from './Modal'

/**
 * ActivityTimeline Component
 * Displays a unified history of activities for a given entity
 * 
 * Props:
 * - entityType: 'lead' | 'company' | 'contact' | 'deal'
 * - entityId: ID of the primary entity
 * - companyId: (optional) Filter for company_id
 * - dealId: (optional) Filter for deal_id
 * - contactId: (optional) Filter for contact_id
 * - leadId: (optional) Filter for lead_id
 */
const ActivityTimeline = ({
    entityType,
    entityId,
    companyId,
    dealId,
    contactId,
    leadId
}) => {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [activeTab, setActiveTab] = useState('activity') // activity, comment, task, email, call, meeting
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
        fetchActivities()
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

    const fetchActivities = async () => {
        try {
            setLoading(true)
            const params = {}

            // CLIENT REQUIREMENT: Fetch ALL related activities
            // For Company: Show activities from company, all its contacts, and all its deals
            // For Contact: Show activities from contact, its company, and all its deals
            // For Deal: Show activities from deal, its company, and its contact

            if (companyId) {
                // Fetch all activities related to this company
                // This includes: direct company activities, contact activities, deal activities
                params.company_id = companyId
            } else if (contactId) {
                // Fetch all activities related to this contact
                // This includes: direct contact activities, company activities, deal activities
                params.contact_id = contactId
            } else if (dealId) {
                // Fetch all activities related to this deal
                // This includes: direct deal activities, company activities, contact activities
                params.deal_id = dealId
            } else if (leadId) {
                params.lead_id = leadId
            } else {
                // If no specific IDs provided, use the primary entity
                params.reference_type = entityType
                params.reference_id = entityId
            }

            const response = await activitiesAPI.getAll(params)
            if (response.data.success) {
                // Sort by created_at DESC (latest first)
                const sortedActivities = (response.data.data || []).sort((a, b) => {
                    return new Date(b.created_at) - new Date(a.created_at)
                })
                setActivities(sortedActivities)
            }
        } catch (error) {
            console.error('Error fetching activities:', error)
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
                setNewActivity({
                    type: 'comment',
                    description: '',
                    title: '',
                    assigned_to: '',
                    deadline: '',
                    meeting_date: '',
                    meeting_time: '',
                    participants: ''
                })
                setIsAdding(false)
                fetchActivities()
            }
        } catch (error) {
            console.error('Error adding activity:', error)
        }
    }

    const handleDeleteActivity = async (id) => {
        if (!window.confirm('Are you sure you want to delete this activity?')) return

        try {
            const response = await activitiesAPI.delete(id)
            if (response.data.success) {
                // If we are in the view modal, close it
                if (viewActivity && viewActivity.id === id) {
                    setViewActivity(null)
                }
                fetchActivities()
            }
        } catch (error) {
            console.error('Error deleting activity:', error)
            alert('Failed to delete activity')
        }
    }

    const handleUpdateActivity = async () => {
        if (!viewActivity || (!viewActivity.description?.trim() && !viewActivity.title?.trim())) return

        try {
            const response = await activitiesAPI.update(viewActivity.id, {
                description: viewActivity.description,
                title: viewActivity.title,
                assigned_to: viewActivity.assigned_to,
                deadline: viewActivity.deadline,
                meeting_date: viewActivity.meeting_date,
                meeting_time: viewActivity.meeting_time,
                participants: viewActivity.participants,
                is_pinned: viewActivity.is_pinned
            })
            if (response.data.success) {
                setViewActivity(null)
                fetchActivities()
            }
        } catch (error) {
            console.error('Error updating activity:', error)
            alert('Failed to update activity')
        }
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

    const getTypeLabel = (type) => {
        const labels = {
            'call': 'Call',
            'meeting': 'Meeting',
            'email': 'Email',
            'task': 'Task',
            'comment': 'Comment',
            'note': 'Note'
        }
        return labels[type] || type.charAt(0).toUpperCase() + type.slice(1)
    }

    // Filter activities by active tab
    const filteredActivities = activities.filter(activity => {
        if (activeTab === 'activity') return true // Show all activities
        return activity.type === activeTab
    })

    // Tab configuration
    const tabs = [
        { id: 'activity', label: 'Activity', icon: IoDocumentText },
        { id: 'comment', label: 'Comment', icon: IoChatbubble },
        { id: 'task', label: 'Task', icon: IoCheckmarkCircle },
        { id: 'email', label: 'Email', icon: IoMail },
        { id: 'call', label: 'Call', icon: IoCall },
        { id: 'meeting', label: 'Meeting', icon: IoCalendar }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Activity History</h3>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2"
                >
                    <IoAdd size={16} /> New Activity
                </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
                {tabs.map((tab) => {
                    const TabIcon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive
                                ? 'bg-gray-800 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <TabIcon size={16} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Add Activity Modal */}
            <Modal
                isOpen={isAdding}
                onClose={() => setIsAdding(false)}
                title="Log New Activity"
                size="lg"
            >
                <div className="space-y-6">
                    <div className="flex gap-2 flex-wrap p-1 bg-gray-50 rounded-xl">
                        {['comment', 'task', 'meeting', 'call', 'email', 'note'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setNewActivity({ ...newActivity, type: t })}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${newActivity.type === t
                                    ? 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-200'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {getIcon(t)}
                                {getTypeLabel(t)}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Task specific fields */}
                        {newActivity.type === 'task' && (
                            <>
                                <div className="md:col-span-2">
                                    <FormInput
                                        label="Task Name"
                                        placeholder="e.g. Follow up on proposal"
                                        value={newActivity.title}
                                        onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <FormSelect
                                    label="Assigned To"
                                    value={newActivity.assigned_to}
                                    onChange={(e) => setNewActivity({ ...newActivity, assigned_to: e.target.value })}
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </FormSelect>
                                <FormInput
                                    label="Deadline / Due Date"
                                    type="date"
                                    value={newActivity.deadline}
                                    onChange={(e) => setNewActivity({ ...newActivity, deadline: e.target.value })}
                                />
                            </>
                        )}

                        {/* Meeting specific fields */}
                        {newActivity.type === 'meeting' && (
                            <>
                                <div className="md:col-span-2">
                                    <FormInput
                                        label="Meeting Title"
                                        placeholder="e.g. Project Discovery Session"
                                        value={newActivity.title}
                                        onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <FormInput
                                        label="Participants"
                                        placeholder="e.g. John Doe, Jane Smith"
                                        value={newActivity.participants}
                                        onChange={(e) => setNewActivity({ ...newActivity, participants: e.target.value })}
                                    />
                                </div>
                                <FormInput
                                    label="Meeting Date"
                                    type="date"
                                    value={newActivity.meeting_date}
                                    onChange={(e) => setNewActivity({ ...newActivity, meeting_date: e.target.value })}
                                />
                                <FormInput
                                    label="Meeting Time"
                                    type="time"
                                    value={newActivity.meeting_time}
                                    onChange={(e) => setNewActivity({ ...newActivity, meeting_time: e.target.value })}
                                />
                            </>
                        )}

                        {/* Common fields for all types */}
                        {(['call', 'email', 'note', 'comment'].includes(newActivity.type)) && (
                            <div className="md:col-span-2">
                                <FormInput
                                    label="Subject / Title"
                                    placeholder={`Enter ${newActivity.type} subject...`}
                                    value={newActivity.title}
                                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {newActivity.type === 'task' || newActivity.type === 'meeting' ? 'Notes / Description' : 'Description'}
                            </label>
                            <textarea
                                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-accent outline-none text-sm min-h-[120px] resize-none shadow-sm"
                                placeholder={`Describe the details...`}
                                value={newActivity.description}
                                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleAddActivity}
                            disabled={!newActivity.description.trim() && !newActivity.title.trim()}
                        >
                            Save Activity
                        </Button>
                    </div>
                </div>
            </Modal>

            <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-2 bottom-0 w-0.5 bg-gray-200" />

                <div className="space-y-8 relative">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading activities...</div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                            <IoTime size={48} className="mx-auto text-gray-200 mb-2" />
                            <p className="text-gray-500">No activities found</p>
                        </div>
                    ) : filteredActivities.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                            <IoTime size={48} className="mx-auto text-gray-200 mb-2" />
                            <p className="text-gray-500">No {activeTab === 'activity' ? 'activities' : activeTab + 's'} found</p>
                        </div>
                    ) : (
                        filteredActivities.map((activity, index) => (
                            <div key={activity.id} className="flex gap-6 group">
                                <div className="relative z-10 w-12 h-12 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0">
                                    {getIcon(activity.type)}
                                </div>
                                <div className="flex-1 pt-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-800">
                                                {activity.title || getTypeLabel(activity.type)}
                                            </span>
                                            <Badge variant="ghost" className="text-[10px] uppercase">
                                                {activity.reference_type}
                                            </Badge>
                                            {activity.type === 'task' && activity.deadline && (
                                                <Badge variant="danger" className="text-[10px]">
                                                    Due: {new Date(activity.deadline).toLocaleDateString()}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <IoTime size={14} />
                                            {new Date(activity.created_at).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    {/* Enhanced Details */}
                                    <div className="space-y-1 mb-2">
                                        {activity.assigned_to_name && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <IoPeople size={12} /> Assigned to: <span className="font-medium text-gray-700">{activity.assigned_to_name}</span>
                                            </div>
                                        )}
                                        {activity.type === 'meeting' && (activity.meeting_date || activity.meeting_time) && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <IoCalendar size={12} /> Schedule:
                                                <span className="font-medium text-gray-700">
                                                    {activity.meeting_date ? new Date(activity.meeting_date).toLocaleDateString() : ''}
                                                    {activity.meeting_time ? ` at ${activity.meeting_time}` : ''}
                                                </span>
                                            </div>
                                        )}
                                        {activity.participants && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <IoPeople size={12} /> Participants: <span className="font-medium text-gray-700">{activity.participants}</span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                        {activity.description}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400">Logged by: {activity.creator_name || 'System'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setViewActivity(activity)}
                                                className="p-1 text-gray-400 hover:text-blue-500 rounded hover:bg-blue-50 transition-colors"
                                                title="View/Edit"
                                            >
                                                <IoEye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteActivity(activity.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                                                title="Delete"
                                            >
                                                <IoTrash size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {/* View/Edit Activity Modal */}
            <Modal
                isOpen={!!viewActivity}
                onClose={() => setViewActivity(null)}
                title={`${viewActivity ? getTypeLabel(viewActivity.type) : 'Activity'} Details`}
                size="lg"
            >
                {viewActivity && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                {getIcon(viewActivity.type)}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800">{getTypeLabel(viewActivity.type)}</h4>
                                <p className="text-xs text-gray-500">
                                    Logged on {new Date(viewActivity.created_at).toLocaleString()}
                                </p>
                            </div>
                            <Badge variant="primary" className="uppercase">{viewActivity.reference_type}</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <FormInput
                                    label="Title / Subject"
                                    value={viewActivity.title || ''}
                                    onChange={(e) => setViewActivity({ ...viewActivity, title: e.target.value })}
                                />
                            </div>

                            {viewActivity.type === 'task' && (
                                <>
                                    <FormSelect
                                        label="Assigned To"
                                        value={viewActivity.assigned_to || ''}
                                        onChange={(e) => setViewActivity({ ...viewActivity, assigned_to: e.target.value })}
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </FormSelect>
                                    <FormInput
                                        label="Deadline"
                                        type="date"
                                        value={viewActivity.deadline ? viewActivity.deadline.split('T')[0] : ''}
                                        onChange={(e) => setViewActivity({ ...viewActivity, deadline: e.target.value })}
                                    />
                                </>
                            )}

                            {viewActivity.type === 'meeting' && (
                                <>
                                    <div className="md:col-span-2">
                                        <FormInput
                                            label="Participants"
                                            value={viewActivity.participants || ''}
                                            onChange={(e) => setViewActivity({ ...viewActivity, participants: e.target.value })}
                                        />
                                    </div>
                                    <FormInput
                                        label="Meeting Date"
                                        type="date"
                                        value={viewActivity.meeting_date ? viewActivity.meeting_date.split('T')[0] : ''}
                                        onChange={(e) => setViewActivity({ ...viewActivity, meeting_date: e.target.value })}
                                    />
                                    <FormInput
                                        label="Meeting Time"
                                        type="time"
                                        value={viewActivity.meeting_time || ''}
                                        onChange={(e) => setViewActivity({ ...viewActivity, meeting_time: e.target.value })}
                                    />
                                </>
                            )}

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-accent outline-none text-sm min-h-[150px] shadow-sm"
                                    value={viewActivity.description || ''}
                                    onChange={(e) => setViewActivity({ ...viewActivity, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between pt-6 border-t border-gray-100">
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (window.confirm('Delete this activity permanently?')) {
                                        handleDeleteActivity(viewActivity.id)
                                    }
                                }}
                                className="bg-red-50 text-red-600 hover:bg-red-100 border-none"
                            >
                                Delete Activity
                            </Button>
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setViewActivity(null)}>Close</Button>
                                <Button variant="primary" onClick={handleUpdateActivity}>Save Changes</Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal >
        </div >
    )
}

export default ActivityTimeline
