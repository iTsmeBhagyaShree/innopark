import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    IoArrowBack,
    IoBriefcase,
    IoBusiness,
    IoAdd,
    IoCalendar,
    IoCash,
    IoTrendingUp,
    IoCheckmarkCircle,
    IoMail,
    IoCall,
    IoLocation,
    IoPeople
} from 'react-icons/io5'
import { dealsAPI, contactsAPI } from '../../../api'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext.jsx'
import { useSettings } from '../../../context/SettingsContext.jsx'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import ActivityTimeline from '../../../components/ui/ActivityTimeline'
import PriorityActivities from '../../../components/shared/PriorityActivities'

function translateDealStatus(status, t) {
    const s = String(status || '').trim().toLowerCase()
    if (s === 'active') return t('common.status.active')
    if (s === 'inactive') return t('common.status.inactive')
    if (s === 'won') return t('deals.stages.won')
    if (s === 'lost') return t('deals.stages.lost')
    if (s === 'draft') return t('deals.detail.status_draft')
    if (s === 'sent') return t('deals.detail.status_sent')
    if (s === 'accepted') return t('deals.detail.status_accepted')
    if (s === 'declined') return t('deals.detail.status_declined')
    if (s === 'expired') return t('deals.detail.status_expired')
    return String(status || '').trim()
}

function dealStatusBadgeVariant(status) {
    const s = String(status || '').trim().toLowerCase()
    if (s === 'accepted' || s === 'won' || s === 'active') return 'success'
    if (s === 'declined' || s === 'lost') return 'danger'
    if (s === 'expired') return 'warning'
    if (s === 'sent') return 'info'
    return 'default'
}

const DealDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { t, language } = useLanguage()
    const { formatCurrency } = useSettings()

    const companyId = useMemo(() => {
        const cid = user?.company_id || localStorage.getItem('companyId') || '1'
        return parseInt(cid, 10) || 1
    }, [user])

    const [deal, setDeal] = useState(null)
    const [loading, setLoading] = useState(true)
    const [contacts, setContacts] = useState([])
    const [availableContacts, setAvailableContacts] = useState([])
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)

    const dealsListPath = user?.role === 'EMPLOYEE' ? '/app/employee/deals' : '/app/admin/deals'

    useEffect(() => {
        fetchDealData()
    }, [id])

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        const locale = String(language || '').toLowerCase().startsWith('de') ? 'de-DE' : 'en-GB'
        return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    const fetchDealData = async () => {
        try {
            setLoading(true)
            const response = await dealsAPI.getById(id, { company_id: companyId })
            if (response.data.success) {
                setDeal(response.data.data)
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
            const contactsRes = await dealsAPI.getDealContacts(id)
            if (contactsRes.data.success) {
                setContacts(contactsRes.data.data || [])
            }
            setIsAddContactModalOpen(false)
        } catch (error) {
            console.error('Error adding contact:', error)
            alert(t('deals.detail.add_contact_failed'))
        }
    }

    const fetchAvailableContacts = async () => {
        try {
            setIsAddContactModalOpen(true)
            const res = await contactsAPI.getMasterList({ company_id: companyId })
            if (res && res.data) {
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
                <h2 className="text-2xl font-bold text-gray-800">{t('deals.detail.not_found')}</h2>
                <Button variant="primary" className="mt-4" onClick={() => navigate(dealsListPath)}>
                    {t('deals.detail.back_to_deals')}
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
                            onClick={() => navigate(dealsListPath)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <IoArrowBack size={24} />
                        </button>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <IoBriefcase size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                                {deal.title || t('deals.detail.title')}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Priority Activities */}
                    <PriorityActivities
                        relatedToType="deal"
                        relatedToId={id}
                        companyId={companyId}
                        t={t}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT PANEL */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Deal Info */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">{t('deals.detail.deal_information')}</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoCash /> {t('deals.detail.amount')}</span>
                                    <span className="font-bold text-gray-900 text-lg">
                                        {deal.total ? formatCurrency(deal.total, deal.currency) : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoTrendingUp /> {t('deals.detail.status')}</span>
                                    <Badge variant={dealStatusBadgeVariant(deal.status)}>{translateDealStatus(deal.status, t)}</Badge>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoCalendar /> {t('deals.detail.closing_date')}</span>
                                    <span className="font-medium text-gray-700">{deal.valid_till ? formatDate(deal.valid_till) : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoBusiness /> {t('common.company')}</span>
                                    <span className="font-medium text-gray-700">{deal.company_name || deal.client_name || 'N/A'}</span>
                                </div>
                            </div>
                        </Card>

                        {/* Linked Contacts */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                                <h3 className="text-lg font-bold text-gray-800">{t('sidebar.contacts')} ({contacts.length})</h3>
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
                            <ActivityTimeline entityType="deal" entityId={id} companyId={companyId} dealId={id} />
                        </Card>
                    </div>
                </div>
            </div>
        </div>


            {/* Add Contact Modal */}
            <Modal
                isOpen={isAddContactModalOpen}
                onClose={() => setIsAddContactModalOpen(false)}
                title={t('deals.detail.modal_link_contact_title')}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">{t('deals.detail.modal_link_contact_hint')}</p>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {availableContacts.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">{t('common.no_data')}</p>
                        ) : (
                            availableContacts.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
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
