import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    IoArrowBack,
    IoMail,
    IoCall,
    IoBusiness,
    IoBriefcase,
    IoEye,
    IoAdd,
    IoTime,
    IoLocation,
    IoCalendar,
    IoTrashOutline,
    IoPencil,
    IoChevronDown,
    IoCheckmarkCircle,
    IoCheckmarkCircleOutline,
    IoPeople
} from 'react-icons/io5'
import { contactsAPI, companiesAPI, activitiesAPI, tasksAPI, employeesAPI } from '../../../api'
import Tasks from '../../../components/Tasks'
import Meetings from '../../../components/Meetings'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'

const ContactDetail = () => {
    const { id } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const companyId = useMemo(() => {
        const cid = user?.company_id || localStorage.getItem('companyId') || '1'
        return parseInt(cid, 10) || 1
    }, [user])

    const [contact, setContact] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [activities, setActivities] = useState([])
    const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false)
    const [activityFormData, setActivityFormData] = useState({
        type: 'Call',
        subject: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        fetchContactData()
    }, [id])

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    }

    const isDeadlineOverdue = (deadline) => {
        if (!deadline) return false
        return new Date(deadline) < new Date()
    }

    const fetchContactData = async () => {
        try {
            setLoading(true)
            const res = await contactsAPI.getMasterById(id, { company_id: companyId })
            if (res.data.success) {
                setContact(res.data.data)
                // Fetch activities for this contact
                fetchActivities()
            }
        } catch (error) {
            console.error('Error fetching contact:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchActivities = async () => {
        try {
            // Assuming activitiesAPI has a method for contact activities
            const res = await activitiesAPI.getAll({
                company_id: companyId,
                contact_id: id
            })
            if (res.data.success) {
                setActivities(res.data.data || [])
            }
        } catch (error) {
            console.error('Error fetching activities:', error)
        }
    }

    const handleAddActivity = async () => {
        try {
            const payload = {
                ...activityFormData,
                contact_id: id,
                company_id: companyId,
                user_id: user?.id,
                reference_type: 'contact',
                reference_id: id
            }
            const res = await activitiesAPI.create(payload)
            if (res.data.success) {
                setIsAddActivityModalOpen(false)
                setActivityFormData({
                    type: 'Call',
                    subject: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0]
                })
                fetchActivities()
            }
        } catch (error) {
            console.error('Error adding activity:', error)
            alert('Failed to add activity')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent"></div>
            </div>
        )
    }

    if (!contact) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <IoBriefcase size={40} className="text-gray-300" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Contact Not Found</h2>
                <p className="text-gray-500 mt-2">The contact you are looking for doesn't exist or you don't have access.</p>
                <Button variant="primary" className="mt-6" onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/contacts' : '/app/admin/contacts')}>
                    Back to Contacts
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-[#F8FAFC]">
            {/* Premium Header with Glassmorphism */}
            <div className="bg-white border-b border-gray-200 p-6 sm:p-8 shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/contacts' : '/app/admin/contacts')}
                            className="p-3 bg-white/50 hover:bg-white rounded-2xl transition-all shadow-soft border border-gray-100 text-gray-600 active:scale-95"
                        >
                            <IoArrowBack size={20} />
                        </button>
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-primary-accent flex items-center justify-center text-white font-black text-2xl">
                                    {contact.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-white"></div>
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{contact.name}</h1>
                                <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 font-medium">
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-primary-accent/10 text-primary-accent rounded-full text-xs font-bold uppercase tracking-wider">{contact.job_title || 'No Position'}</span>
                                    {contact.linked_company_name && (
                                        <>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span className="flex items-center gap-1.5 text-gray-600"><IoBusiness size={16} className="text-gray-400" />{contact.linked_company_name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="md" className="flex items-center gap-2 rounded-2xl font-bold border-gray-200 hover:bg-gray-50 bg-white" onClick={() => navigate(user?.role === 'EMPLOYEE' ? `/app/employee/contacts` : `/app/admin/contacts`)}>
                            <IoPencil size={18} /> Edit
                        </Button>
                        <Button variant="primary" size="md" className="flex items-center gap-2 rounded-2xl font-bold bg-primary-accent hover:bg-primary-accent/90" onClick={() => setIsAddActivityModalOpen(true)}>
                            <IoAdd size={22} /> Add Activity
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-8">
                <div className="max-w-7xl mx-auto flex gap-8">
                    {['Overview', 'Tasks', 'Meetings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`py-4 text-sm font-bold border-b-2 transition-all truncate ${activeTab === tab.toLowerCase()
                                ? 'border-primary-accent text-primary-accent'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                            <div className="lg:col-span-4 space-y-8">
                                <Card className="p-8 border border-gray-100 shadow-sm bg-white rounded-2xl transition-all duration-300 group">
                                    <h3 className="text-lg font-black text-gray-900 mb-8 border-b border-gray-50 pb-6 uppercase tracking-widest">Contact Information</h3>
                                    <div className="space-y-8">
                                        <div className="flex items-start gap-5 group/item">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary-accent border border-gray-100 group-hover/item:scale-110 transition-transform shadow-soft">
                                                <IoMail size={22} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Email Address</p>
                                                <a href={`mailto:${contact.email}`} className="text-base font-bold text-gray-800 hover:text-primary-accent break-all transition-colors">{contact.email || 'N/A'}</a>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-5 group/item">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-secondary-accent border border-gray-100 group-hover/item:scale-110 transition-transform shadow-soft">
                                                <IoCall size={22} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Phone Number</p>
                                                <p className="text-base font-bold text-gray-800">{contact.phone || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-5 group/item">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary-accent border border-gray-100 group-hover/item:scale-110 transition-transform shadow-soft">
                                                <IoBusiness size={22} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Company</p>
                                                <p className="text-base font-bold text-gray-800">{contact.linked_company_name || 'Individual'}</p>
                                                {contact.client_id && (
                                                    <button
                                                        onClick={() => navigate(user?.role === 'EMPLOYEE' ? `/app/employee/companies/${contact.client_id}` : `/app/admin/companies/${contact.client_id}`)}
                                                        className="inline-flex items-center gap-2 text-xs text-primary-accent hover:text-primary-accent/70 mt-2 font-bold transition-colors group/btn"
                                                    >
                                                        View Company Profile
                                                        <IoChevronDown className="-rotate-90 group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-5 group/item">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-amber-500 border border-gray-100 group-hover/item:scale-110 transition-transform shadow-soft">
                                                <IoCalendar size={22} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Lead Source</p>
                                                <Badge variant="soft" className="mt-1 font-bold">{contact.lead_source || 'Direct'}</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 pt-8 border-t border-gray-50">
                                        <h4 className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-4">Internal Notes</h4>
                                        <div className="relative">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary-accent/20 rounded-full"></div>
                                            <p className="text-sm text-gray-600 leading-relaxed italic pl-5">
                                                {contact.notes || 'No internal notes found for this contact.'}
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-8 border border-gray-100 shadow-sm bg-white rounded-2xl text-gray-800">
                                    <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center justify-between uppercase tracking-widest">
                                        Active Deals
                                        <span className="bg-primary-accent px-3 py-1 rounded-full text-xs font-black text-white">0</span>
                                    </h3>
                                    <div className="text-center py-6">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                            <IoBriefcase size={32} className="text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">Capture more value. Start a new deal with {contact.name.split(' ')[0]}.</p>
                                        <button className="mt-6 text-xs font-black uppercase tracking-widest text-primary-accent hover:text-primary-accent/70 transition-colors">Create Deal Now</button>
                                    </div>
                                </Card>
                            </div>

                            <div className="lg:col-span-8 space-y-8">
                                {/* Tasks Section */}
                                <Card className="p-8 border border-gray-100 shadow-sm bg-white rounded-2xl h-[500px] flex flex-col">
                                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner">
                                            <IoCheckmarkCircleOutline size={24} />
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-wider">
                                            Pending Tasks
                                        </h3>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <Tasks relatedToType="contact" relatedToId={id} />
                                    </div>
                                </Card>

                                {/* Meetings Section */}
                                <Card className="p-8 border border-gray-100 shadow-sm bg-white rounded-2xl h-[500px] flex flex-col pt-6">
                                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 shadow-inner">
                                            <IoCalendar size={24} />
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-wider">
                                            Meetings
                                        </h3>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <Meetings relatedToType="contact" relatedToId={id} />
                                    </div>
                                </Card>

                                <Card className="p-8 border border-gray-100 shadow-sm bg-white rounded-2xl min-h-[400px]">
                                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-50">
                                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-wider">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                                                <IoTime size={24} />
                                            </div>
                                            Activity Timeline
                                        </h3>
                                        <div className="px-4 py-2 bg-gray-50 rounded-2xl flex items-center gap-2 border border-gray-100">
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Filter:</span>
                                            <select className="text-xs border-none bg-transparent font-black text-gray-900 focus:ring-0 cursor-pointer uppercase tracking-tight">
                                                <option>All Activities</option>
                                                <option>Calls Only</option>
                                                <option>Emails</option>
                                                <option>Meetings</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Activities List */}
                                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary-accent/20 before:via-gray-100 before:to-transparent">
                                        {activities.length > 0 ? (
                                            activities.map((activity, idx) => (
                                                <div key={idx} className="relative flex items-start gap-6 group">
                                                    <div className="absolute left-0 w-10 h-10 rounded-full bg-white border-2 border-primary-accent/20 flex items-center justify-center z-10 shadow-sm group-hover:scale-110 transition-transform">
                                                        {activity.type === 'Call' && <IoCall className="text-primary-accent" size={16} />}
                                                        {activity.type === 'Email' && <IoMail className="text-secondary-accent" size={16} />}
                                                        {activity.type === 'Meeting' && <IoPeople className="text-primary-accent" size={16} />}
                                                    </div>
                                                    <div className="ml-12 flex-1 bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                                                        <div className="flex items-center justify-between gap-4 mb-2">
                                                            <h4 className="font-bold text-gray-800">{activity.subject}</h4>
                                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{activity.date}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 leading-relaxed">{activity.description}</p>
                                                        <div className="mt-4 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-primary-accent/10 flex items-center justify-center text-[10px] font-bold text-primary-accent">
                                                                    {user?.name?.charAt(0)}
                                                                </div>
                                                                <span className="text-xs font-medium text-gray-500">Logged by You</span>
                                                            </div>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button className="text-gray-400 hover:text-primary-accent"><IoEye size={16} /></button>
                                                                <button className="text-gray-400 hover:text-red-500"><IoTrashOutline size={16} /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <>
                                                {/* Dummy Data for demonstration as per user screenshot request */}
                                                <div className="relative flex items-start gap-6 group">
                                                    <div className="absolute left-0 w-10 h-10 rounded-full bg-white border-2 border-primary-accent/20 flex items-center justify-center z-10 shadow-sm">
                                                        <IoCall className="text-primary-accent" size={16} />
                                                    </div>
                                                    <div className="ml-12 flex-1 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                                        <div className="flex items-center justify-between gap-4 mb-2">
                                                            <h4 className="font-bold text-gray-800">Initial Discovery Call</h4>
                                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">2 hrs ago</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 leading-relaxed">Discussed project requirements and pricing. client is interested in the premium package.</p>
                                                    </div>
                                                </div>

                                                <div className="relative flex items-start gap-6 group">
                                                    <div className="absolute left-0 w-10 h-10 rounded-full bg-white border-2 border-secondary-accent/20 flex items-center justify-center z-10 shadow-sm">
                                                        <IoMail className="text-secondary-accent" size={16} />
                                                    </div>
                                                    <div className="ml-12 flex-1 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                                        <div className="flex items-center justify-between gap-4 mb-2">
                                                            <h4 className="font-bold text-gray-800">Sent Proposal Email</h4>
                                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">1 day ago</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 leading-relaxed">Uploaded the formal proposal to the portal and notified the client via email.</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="mt-12 text-center">
                                        <Button
                                            variant="outline"
                                            className="rounded-full px-5 py-2 border-dashed border-2 hover:border-primary-accent/40 hover:bg-primary-accent/5 text-primary-accent font-bold"
                                            onClick={() => setIsAddActivityModalOpen(true)}
                                        >
                                            <IoAdd size={20} className="mr-2" /> Record New Activity
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <Card className="p-8 border border-gray-100 shadow-sm bg-white rounded-2xl h-[600px] flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                                    <IoCheckmarkCircleOutline size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Contact Tasks</h3>
                                    <p className="text-sm text-gray-400 font-medium">Active assignments and follow-ups</p>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <Tasks relatedToType="contact" relatedToId={id} />
                            </div>
                        </Card>
                    )}

                    {activeTab === 'meetings' && (
                        <Card className="p-8 border border-gray-100 shadow-sm bg-white rounded-2xl h-[600px] flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white">
                                    <IoCalendar size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Meetings</h3>
                                    <p className="text-sm text-gray-400 font-medium">Scheduled syncs and calls</p>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <Meetings relatedToType="contact" relatedToId={id} />
                            </div>
                        </Card>
                    )}
                </div>
            </div>


            {/* Add Activity Modal */}
            <Modal
                isOpen={isAddActivityModalOpen}
                onClose={() => setIsAddActivityModalOpen(false)}
                title="Log New Activity"
                size="md"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Activity Type</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent outline-none appearance-none bg-white"
                                    value={activityFormData.type}
                                    onChange={(e) => setActivityFormData({ ...activityFormData, type: e.target.value })}
                                >
                                    <option>Call</option>
                                    <option>Email</option>
                                    <option>Meeting</option>
                                    <option>Note</option>
                                </select>
                                <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <Input
                            label="Date"
                            type="date"
                            value={activityFormData.date}
                            onChange={(e) => setActivityFormData({ ...activityFormData, date: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Subject"
                        placeholder="e.g., Follow up call"
                        value={activityFormData.subject}
                        onChange={(e) => setActivityFormData({ ...activityFormData, subject: e.target.value })}
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description / Outcome</label>
                        <textarea
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px]"
                            placeholder="What was discussed?"
                            value={activityFormData.description}
                            onChange={(e) => setActivityFormData({ ...activityFormData, description: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsAddActivityModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleAddActivity} className="bg-primary-accent hover:bg-primary-accent/90">Save Activity</Button>
                    </div>
                </div>
            </Modal>

        </div >
    )
}

export default ContactDetail
