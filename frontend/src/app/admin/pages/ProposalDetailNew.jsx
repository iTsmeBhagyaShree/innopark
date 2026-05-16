import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    IoArrowBack,
    IoCash,
    IoTrendingUp,
    IoCalendar,
    IoAdd,
    IoDocumentText
} from 'react-icons/io5'
import { proposalsAPI, contactsAPI } from '../../../api'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext.jsx'
import { useSettings } from '../../../context/SettingsContext.jsx'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import ActivityTimeline from '../../../components/ui/ActivityTimeline'

const ProposalDetailNew = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { t, language } = useLanguage()
    const { formatCurrency } = useSettings()
    const localeTag = language === 'de' ? 'de-DE' : 'en-GB'

    const companyId = useMemo(() => {
        const cid = user?.company_id || localStorage.getItem('companyId') || '1'
        return parseInt(cid, 10) || 1
    }, [user])

    const [proposal, setProposal] = useState(null)
    const [loading, setLoading] = useState(true)
    const [contacts, setContacts] = useState([])
    const [availableContacts, setAvailableContacts] = useState([])
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)

    useEffect(() => {
        fetchProposalData()
    }, [id])

    const fetchProposalData = async () => {
        try {
            setLoading(true)
            const response = await proposalsAPI.getById(id, { company_id: companyId })
            if (response.data.success) {
                setProposal(response.data.data)

                if (response.data.data.linked_contacts) {
                    setContacts(response.data.data.linked_contacts)
                }
            }
        } catch (error) {
            console.error('Error fetching proposal:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddContactToProposal = async (contactId) => {
        try {
            await proposalsAPI.addContact(id, { contact_id: contactId })
            fetchProposalData()
            setIsAddContactModalOpen(false)
        } catch (error) {
            console.error('Error adding contact:', error)
            alert(t('proposal_detail_page.add_contact_failed'))
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

    const formatDate = (dateString) => {
        if (!dateString) return '—'
        return new Date(dateString).toLocaleDateString(localeTag, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getStatusColor = (status) => {
        const statusColors = {
            draft: 'neutral',
            sent: 'blue',
            accepted: 'success',
            declined: 'danger',
            expired: 'warning'
        }
        return statusColors[status?.toLowerCase()] || 'neutral'
    }

    const translateStatus = (status) => {
        const s = (status || '').toLowerCase()
        const keyMap = {
            draft: 'status_draft',
            sent: 'status_sent',
            accepted: 'status_accepted',
            declined: 'status_declined',
            expired: 'status_expired'
        }
        const key = keyMap[s]
        return key ? t(`proposal_detail_page.${key}`) : (status || t('proposal_detail_page.status_draft'))
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent"></div>
                <p className="text-sm text-gray-500">{t('proposal_detail_page.loading')}</p>
            </div>
        )
    }

    if (!proposal) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <IoDocumentText size={64} className="text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">{t('proposal_detail_page.not_found')}</h2>
                <Button variant="primary" className="mt-4" onClick={() => navigate('/app/admin/proposals')}>
                    {t('proposal_detail_page.back_to_list')}
                </Button>
            </div>
        )
    }

    const contactsTitle = t('proposal_detail_page.contacts_title').replace(
        /\{\{\s*count\s*\}\}/g,
        String(contacts.length)
    )

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-gray-50">
            <div className="bg-white border-b border-gray-200 p-4 sm:p-6 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            type="button"
                            onClick={() => navigate('/app/admin/proposals')}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <IoArrowBack size={24} />
                        </button>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-green-200">
                            <IoDocumentText size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                                {proposal.title || t('proposal_detail_page.untitled')}
                            </h1>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-medium">
                                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
                                    {proposal.estimate_number || `PROPOSAL-${id}`}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                    <div className="lg:col-span-4 space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">{t('proposal_detail_page.proposal_info')}</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoCash /> {t('proposal_detail_page.amount')}</span>
                                    <span className="font-bold text-gray-900 text-lg">
                                        {formatCurrency(proposal.total, proposal.currency)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoTrendingUp /> {t('proposal_detail_page.status')}</span>
                                    <Badge variant={getStatusColor(proposal.status)}>{translateStatus(proposal.status)}</Badge>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoCalendar /> {t('proposal_detail_page.valid_until')}</span>
                                    <span className="font-medium text-gray-700">{formatDate(proposal.valid_till)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><IoCalendar /> {t('proposal_detail_page.created')}</span>
                                    <span className="font-medium text-gray-700">{formatDate(proposal.created_at)}</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                                <h3 className="text-lg font-bold text-gray-800">{contactsTitle}</h3>
                                <button
                                    type="button"
                                    onClick={fetchAvailableContacts}
                                    className="p-1 hover:bg-gray-100 rounded-full text-primary-accent transition-colors"
                                >
                                    <IoAdd size={20} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {contacts.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">{t('proposal_detail_page.no_contacts')}</p>
                                ) : (
                                    contacts.map(contact => (
                                        <div key={contact.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group relative">
                                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                                {contact.name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{contact.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{contact.email || t('proposal_detail_page.no_email')}</p>
                                            </div>
                                            {contact.is_primary === 1 && (
                                                <div className="text-yellow-500 text-xs" title={t('proposal_detail_page.primary_contact')}>⭐</div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>

                        {proposal.items && proposal.items.length > 0 && (
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">{t('proposal_detail_page.proposal_items')}</h3>
                                <div className="space-y-2">
                                    {proposal.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm py-2 border-b border-dashed border-gray-50 last:border-0">
                                            <span className="text-gray-600">{item.item_name || item.description}</span>
                                            <span className="font-medium">{formatCurrency(item.amount, proposal.currency)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-gray-200">
                                        <span>{t('proposal_detail_page.total')}</span>
                                        <span>{formatCurrency(proposal.total, proposal.currency)}</span>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    <div className="lg:col-span-8">
                        <Card className="p-6 h-full min-h-[600px]">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">{t('proposal_detail_page.recent_activities')}</h3>
                            <ActivityTimeline entityType="deal" entityId={id} companyId={companyId} />
                        </Card>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isAddContactModalOpen}
                onClose={() => setIsAddContactModalOpen(false)}
                title={t('proposal_detail_page.modal_link_contact')}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">{t('proposal_detail_page.modal_hint')}</p>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {availableContacts.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">{t('proposal_detail_page.no_contacts_available')}</p>
                        ) : (
                            availableContacts.map(c => (
                                <button
                                    type="button"
                                    key={c.id}
                                    onClick={() => handleAddContactToProposal(c.id)}
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

export default ProposalDetailNew
