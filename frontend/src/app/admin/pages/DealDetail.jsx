import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    IoArrowBack,
    IoBriefcase,
    IoBusiness,
    IoPerson,
    IoAdd,
    IoCalendar,
    IoCash,
    IoTrendingUp,
    IoCheckmarkCircle,
    IoTime,
    IoTrash,
    IoCheckmarkCircleOutline
} from 'react-icons/io5'
import { dealsAPI, companiesAPI, tasksAPI, employeesAPI } from '../../../api'
import Tasks from '../../../components/Tasks'
import Meetings from '../../../components/Meetings'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import ActivityTimeline from '../../../components/ui/ActivityTimeline'

const DealDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const companyId = useMemo(() => {
        const cid = user?.company_id || localStorage.getItem('companyId') || '1'
        return parseInt(cid, 10) || 1
    }, [user])

    const [deal, setDeal] = useState(null)
    const [loading, setLoading] = useState(true)
    const [contacts, setContacts] = useState([])
    const [availableContacts, setAvailableContacts] = useState([]) // For adding contacts
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)

    useEffect(() => {
        fetchDealData()
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

    const fetchDealData = async () => {
        try {
            setLoading(true)
            const response = await dealsAPI.getById(id, { company_id: companyId })
            if (response.data.success) {
                setDeal(response.data.data)
                // Fetch linked contacts
                // Assuming dealsAPI.getById returns linked_contacts, if not we might need a separate call
                // But per controller read earlier, it tries to include them.
                // Let's also fetch explicitly to be safe or if controller structure is different
                const contactsRes = await dealsAPI.getDealContacts(id)
                if (contactsRes.data.success) {
                    setContacts(contactsRes.data.data || [])
                }
            }
        } catch (error) {
            console.error('Error fetching deal:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddContactToDeal = async (contactId) => {
        try {
            await dealsAPI.addContact(id, { contact_id: contactId })
            // Refresh contacts
            const contactsRes = await dealsAPI.getDealContacts(id)
            if (contactsRes.data.success) {
                setContacts(contactsRes.data.data || [])
            }
            setIsAddContactModalOpen(false)
        } catch (error) {
            console.error('Error adding contact:', error)
            alert('Failed to add contact')
        }
    }

    const fetchAvailableContacts = async () => {
        try {
            setIsAddContactModalOpen(true)

            // Fetch all contacts from master list
            const { contactsAPI } = await import('../../../api')
            const res = await contactsAPI.getMasterList({ company_id: companyId })

            console.log('Contacts response:', res)

            if (res && res.data) {
                // Handle different response formats
                const contactsList = res.data.data || res.data || []
                setAvailableContacts(Array.isArray(contactsList) ? contactsList : [])
            } else {
                setAvailableContacts([])
            }
        } catch (e) {
            console.error('Error fetching contacts:', e)
            setAvailableContacts([])
        }
    }

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount || 0)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent"></div>
            </div>
        )
    }

    if (!deal) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <IoBriefcase size={64} className="text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Deal Not Found</h2>
                <Button variant="primary" className="mt-4" onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/deals' : '/app/admin/deals')}>
                    Back to Deals
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 sm:p-6 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/deals' : '/app/admin/deals')}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <IoArrowBack size={24} />
                        </button>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <IoBriefcase size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{deal.title}</h1>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-medium">
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{deal.deal_number}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT PANEL */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Deal Info */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2 notranslate">Deal Information</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoCash /> <span className="notranslate">Amount</span></span>
                                    <span className="font-bold text-gray-900 text-lg">{formatCurrency(deal.total, deal.currency)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoTrendingUp /> <span className="notranslate">Stage</span></span>
                                    <Badge variant="neutral">{deal.pipeline_stage || 'Unknown'}</Badge>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoCalendar /> <span className="notranslate">Closing Date</span></span>
                                    <span className="font-medium text-gray-700">{deal.valid_till ? new Date(deal.valid_till).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoCheckmarkCircle /> <span className="notranslate">Status</span></span>
                                    <Badge variant={deal.status === 'Active' ? 'success' : 'default'}>{deal.status}</Badge>
                                </div>
                            </div>
                        </Card>

                        {/* Company Info */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2 notranslate">Company</h3>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                                    <IoBusiness size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{deal.company_name || 'No Company Linked'}</h4>
                                    {/* Add website or other details here if available in deal object or separate fetch */}
                                </div>
                            </div>
                        </Card>

                        {/* Contacts */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                                <h3 className="text-lg font-bold text-gray-800"><span className="notranslate">Contacts</span> ({contacts.length})</h3>
                                <button
                                    onClick={fetchAvailableContacts}
                                    className="p-1 hover:bg-gray-100 rounded-full text-primary-accent transition-colors"
                                >
                                    <IoAdd size={20} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {contacts.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">No contacts linked.</p>
                                ) : (
                                    contacts.map(contact => (
                                        <div key={contact.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group relative">
                                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                                {contact.name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{contact.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{contact.job_title || 'No Title'}</p>
                                            </div>
                                            {contact.is_primary === 1 && (
                                                <div className="text-yellow-500 text-xs" title="Primary Contact">⭐</div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>

                        {/* Deal Items Summary if needed, per screenshot description */}
                        {deal.items && deal.items.length > 0 && (
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Deal Items</h3>
                                <div className="space-y-2">
                                    {deal.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{item.item_name}</span>
                                            <span className="font-medium">{formatCurrency(item.amount, deal.currency)}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* RIGHT PANEL - Activity Timeline & Tasks */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Tasks Section */}
                        {/* Tasks Section */}
                        <Card className="p-6 h-[500px] flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                                    <IoCheckmarkCircleOutline size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 notranslate">Deal Tasks</h3>
                            </div>
                            <div className="flex-1 min-h-0">
                                <Tasks relatedToType="deal" relatedToId={id} />
                            </div>
                        </Card>

                        {/* Meetings Section */}
                        <Card className="p-6 h-[500px] flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white">
                                    <IoCalendar size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 notranslate">Meetings</h3>
                            </div>
                            <div className="flex-1 min-h-0">
                                <Meetings relatedToType="deal" relatedToId={id} />
                            </div>
                        </Card>

                        <Card className="p-6 h-full min-h-[400px]">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4 notranslate">Recent Activities</h3>
                            <ActivityTimeline entityType="deal" entityId={id} companyId={companyId} />
                        </Card>
                    </div>
                </div>
            </div>

            {/* Add Contact Modal */}
            <Modal
                isOpen={isAddContactModalOpen}
                onClose={() => setIsAddContactModalOpen(false)}
                title={<span className="notranslate">Link Contact to Deal</span>}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Select a contact to link to this deal.</p>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {availableContacts.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No available contacts found.</p>
                        ) : (
                            availableContacts.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handleAddContactToDeal(c.id)}
                                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center justify-between border border-transparent hover:border-gray-200 transition-all"
                                >
                                    <div>
                                        <p className="font-bold text-gray-800">{c.name}</p>
                                        <p className="text-xs text-gray-500">{c.email}</p>
                                    </div>
                                    <IoAdd className="text-primary-accent" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Modal>


        </div>
    )
}

export default DealDetail
