import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    IoArrowBack,
    IoPerson,
    IoBusiness,
    IoAdd,
    IoCalendar,
    IoCash,
    IoTrendingUp,
    IoCheckmarkCircle,
    IoTime,
    IoMail,
    IoCall,
    IoLocation
} from 'react-icons/io5'
import { leadsAPI, companiesAPI, contactsAPI } from '../../../api'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import ActivityTimeline from '../../../components/ui/ActivityTimeline'

const LeadDetailNew = () => {
    const { id } = useParams()
    const { t } = useLanguage()
    const navigate = useNavigate()
    const { user } = useAuth()
    const companyId = useMemo(() => {
        const cid = user?.company_id || localStorage.getItem('companyId') || '1'
        return parseInt(cid, 10) || 1
    }, [user])

    const [lead, setLead] = useState(null)
    const [loading, setLoading] = useState(true)
    const [contacts, setContacts] = useState([])
    const [availableContacts, setAvailableContacts] = useState([])
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)

    useEffect(() => {
        fetchLeadData()
    }, [id])

    const fetchLeadData = async () => {
        try {
            setLoading(true)
            const response = await leadsAPI.getById(id, { company_id: companyId })
            if (response.data.success) {
                setLead(response.data.data)

                // Fetch contacts linked to this lead
                if (response.data.data.contacts) {
                    setContacts(response.data.data.contacts)
                }
            }
        } catch (error) {
            console.error('Error fetching lead:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddContactToLead = async (contactId) => {
        try {
            // Link contact to lead via API
            await leadsAPI.addContact(id, { contact_id: contactId })

            // Refresh lead data
            fetchLeadData()
            setIsAddContactModalOpen(false)
        } catch (error) {
            console.error('Error adding contact:', error)
            alert(t('common.error'))
        }
    }

    const fetchAvailableContacts = async () => {
        try {
            setIsAddContactModalOpen(true)

            // Fetch all contacts from master list
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
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: currency
        }).format(amount || 0)
    }

    const getStatusColor = (status) => {
        const statusColors = {
            'Neu': 'blue',
            'Contacted': 'purple',
            'Qualified': 'green',
            'Proposal': 'yellow',
            'Negotiation': 'orange',
            'Gewonnen': 'success',
            'Verloren': 'danger'
        }
        return statusColors[status] || 'neutral'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent"></div>
            </div>
        )
    }

    if (!lead) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <IoPerson size={64} className="text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">{t('common.lead_not_found')}</h2>
                <Button variant="primary" className="mt-4" onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/leads' : '/app/admin/leads')}>
                    {t('common.back_to_leads')}
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
                            onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/leads' : '/app/admin/leads')}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <IoArrowBack size={24} />
                        </button>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
                            <IoPerson size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                                {lead.person_name || lead.company_name || 'Unnamed Lead'}
                            </h1>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-medium">
                                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">
                                    {lead.lead_number || `LEAD-${id}`}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => navigate(user?.role === 'EMPLOYEE' ? `/app/employee/leads/${id}/edit` : `/app/admin/leads/${id}/edit`)}>
                            {t('common.edit_lead')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT PANEL */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Lead Info */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">{t('leads.detail.lead_info')}</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoCash /> {t('leads.detail.fields.value')}</span>
                                    <span className="font-bold text-gray-900 text-lg">
                                        {lead.value ? formatCurrency(lead.value, lead.currency || 'USD') : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoTrendingUp /> {t('leads.detail.fields.status')}</span>
                                    <Badge variant={getStatusColor(lead.status)}>{lead.status || 'Neu'}</Badge>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoCalendar /> {t('leads.detail.fields.source')}</span>
                                    <span className="font-medium text-gray-700">{lead.source || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoCheckmarkCircle /> {t('leads.detail.fields.priority')}</span>
                                    <Badge variant={lead.priority === 'High' ? 'danger' : lead.priority === 'Medium' ? 'warning' : 'neutral'}>
                                        {lead.priority || 'Medium'}
                                    </Badge>
                                </div>
                            </div>
                        </Card>

                        {/* Contact Information */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">{t('leads.detail.contact_details')}</h3>
                            <div className="space-y-3">
                                {lead.email && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <IoMail className="text-gray-400" size={18} />
                                        <a href={`mailto:${lead.email}`} className="text-primary-accent hover:underline">
                                            {lead.email}
                                        </a>
                                    </div>
                                )}
                                {lead.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <IoCall className="text-gray-400" size={18} />
                                        <a href={`tel:${lead.phone}`} className="text-gray-700">
                                            {lead.phone}
                                        </a>
                                    </div>
                                )}
                                {lead.address && (
                                    <div className="flex items-start gap-3 text-sm">
                                        <IoLocation className="text-gray-400 mt-0.5" size={18} />
                                        <span className="text-gray-700">{lead.address}</span>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Company Info */}
                        {lead.company_name && (
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">{t('leads.detail.company_info')}</h3>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                                        <IoBusiness size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{lead.company_name}</h4>
                                        {lead.website && (
                                            <a href={lead.website} target="_blank" rel="noopener noreferrer"
                                                className="text-xs text-primary-accent hover:underline mt-1 block">
                                                {lead.website}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Contacts */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                                <h3 className="text-lg font-bold text-gray-800">{t('leads.detail.linked_contacts')} ({contacts.length})</h3>
                                <button
                                    onClick={fetchAvailableContacts}
                                    className="p-1 hover:bg-gray-100 rounded-full text-primary-accent transition-colors"
                                >
                                    <IoAdd size={20} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {contacts.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">{t('common.no_data')}</p>
                                ) : (
                                    contacts.map(contact => (
                                        <div key={contact.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group relative">
                                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                                {contact.name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{contact.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{contact.email || 'No email'}</p>
                                            </div>
                                            {contact.is_primary === 1 && (
                                                <div className="text-yellow-500 text-xs" title="Primary Contact">⭐</div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT PANEL - Activity Timeline */}
                    <div className="lg:col-span-8">
                        <Card className="p-6 h-full min-h-[600px]">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">{t('leads.detail.recent_activities')}</h3>
                            <ActivityTimeline entityType="lead" entityId={id} companyId={companyId} />
                        </Card>
                    </div>
                </div>
            </div>

            {/* Add Contact Modal */}
            <Modal
                isOpen={isAddContactModalOpen}
                onClose={() => setIsAddContactModalOpen(false)}
                title={t('common.add_contact')}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">{t('common.select')}</p>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {availableContacts.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">{t('common.no_data')}</p>
                        ) : (
                            availableContacts.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handleAddContactToLead(c.id)}
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

export default LeadDetailNew
