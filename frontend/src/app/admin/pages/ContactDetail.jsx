import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    IoArrowBack,
    IoPerson,
    IoBusiness,
    IoBriefcase,
    IoAdd,
    IoCalendar,
    IoMail,
    IoCall,
    IoLocation,
    IoPencil,
    IoChevronDown
} from 'react-icons/io5'
import { contactsAPI, activitiesAPI } from '../../../api'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext.jsx'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import ActivityTimeline from '../../../components/ui/ActivityTimeline'
import PriorityActivities from '../../../components/shared/PriorityActivities'

const ContactDetail = () => {
    const { id } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const { t, language } = useLanguage()

    const companyId = useMemo(() => {
        const cid = user?.company_id || localStorage.getItem('companyId') || '1'
        return parseInt(cid, 10) || 1
    }, [user])

    const [contact, setContact] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false)
    const [activityFormData, setActivityFormData] = useState({
        type: 'Call',
        subject: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    })

    const contactsListPath = user?.role === 'EMPLOYEE' ? '/app/employee/contacts' : '/app/admin/contacts'

    useEffect(() => {
        fetchContactData()
    }, [id])

    const fetchContactData = async () => {
        try {
            setLoading(true)
            const res = await contactsAPI.getMasterById(id, { company_id: companyId })
            if (res.data.success) {
                setContact(res.data.data)
            }
        } catch (error) {
            console.error('Error fetching contact:', error)
        } finally {
            setLoading(false)
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
            }
        } catch (error) {
            console.error('Error adding activity:', error)
            alert(t('contacts.detail_page.activity_failed'))
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
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <IoPerson size={64} className="text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">{t('contacts.detail_page.not_found_title')}</h2>
                <Button variant="primary" className="mt-4" onClick={() => navigate(contactsListPath)}>
                    {t('contacts.detail_page.back_to_contacts')}
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
                            onClick={() => navigate(contactsListPath)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <IoArrowBack size={24} />
                        </button>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-200">
                            {contact.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                                {contact.name}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="primary" onClick={() => setIsAddActivityModalOpen(true)}>
                            <IoAdd size={18} className="mr-1" /> {t('contacts.detail_page.add_activity')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Priority Activities */}
                    <PriorityActivities
                        relatedToType="contact"
                        relatedToId={id}
                        companyId={companyId}
                        t={t}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT PANEL */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Contact Info */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">{t('contacts.detail_page.contact_information')}</h3>
                            <div className="space-y-3">
                                {contact.email && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <IoMail className="text-gray-400" size={18} />
                                        <a href={`mailto:${contact.email}`} className="text-primary-accent hover:underline">
                                            {contact.email}
                                        </a>
                                    </div>
                                )}
                                {contact.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <IoCall className="text-gray-400" size={18} />
                                        <a href={`tel:${contact.phone}`} className="text-gray-700">
                                            {contact.phone}
                                        </a>
                                    </div>
                                )}
                                {contact.address && (
                                    <div className="flex items-start gap-3 text-sm">
                                        <IoLocation className="text-gray-400 mt-0.5" size={18} />
                                        <span className="text-gray-700">{contact.address}</span>
                                    </div>
                                )}
                                {!contact.email && !contact.phone && !contact.address && (
                                    <p className="text-sm text-gray-400 italic">{t('common.no_data')}</p>
                                )}
                            </div>
                        </Card>

                        {/* Company Info */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">{t('contacts.detail_page.company')}</h3>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                                    <IoBusiness size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">
                                        {contact.linked_company_name || t('contacts.detail_page.individual')}
                                    </h4>
                                    {contact.client_id && (
                                        <button
                                            onClick={() => navigate(user?.role === 'EMPLOYEE' ? `/app/employee/companies/${contact.client_id}` : `/app/admin/companies/${contact.client_id}`)}
                                            className="text-xs text-primary-accent hover:underline mt-1 block font-bold"
                                        >
                                            {t('contacts.detail_page.view_company_profile')}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {contact.notes && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">{t('contacts.detail_page.internal_notes')}</p>
                                    <p className="text-sm text-gray-600 italic leading-relaxed">{contact.notes}</p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* RIGHT PANEL - Activity Timeline */}
                    <div className="lg:col-span-8">
                        <Card className="p-6 h-full min-h-[600px]">
                            <ActivityTimeline entityType="contact" entityId={id} companyId={companyId} contactId={id} />
                        </Card>
                    </div>
                </div>
            </div>
        </div>

            {/* Add Activity Modal */}
            <Modal
                isOpen={isAddActivityModalOpen}
                onClose={() => setIsAddActivityModalOpen(false)}
                title={t('activities.log_new')}
                size="md"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {t('contacts.detail_page.activity_type')}
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent outline-none appearance-none bg-white"
                                    value={activityFormData.type}
                                    onChange={(e) => setActivityFormData({ ...activityFormData, type: e.target.value })}
                                >
                                    <option value="Call">{t('activities.tabs.call')}</option>
                                    <option value="Email">{t('activities.tabs.email')}</option>
                                    <option value="Meeting">{t('activities.tabs.meeting')}</option>
                                    <option value="Note">{t('activities.tabs.note')}</option>
                                </select>
                                <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <Input
                            label={t('common.date')}
                            type="date"
                            value={activityFormData.date}
                            onChange={(e) => setActivityFormData({ ...activityFormData, date: e.target.value })}
                        />
                    </div>
                    <Input
                        label={t('contacts.detail_page.activity_subject')}
                        placeholder={t('contacts.detail_page.activity_subject_placeholder')}
                        value={activityFormData.subject}
                        onChange={(e) => setActivityFormData({ ...activityFormData, subject: e.target.value })}
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {t('contacts.detail_page.activity_description_outcome')}
                        </label>
                        <textarea
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px]"
                            placeholder={t('contacts.detail_page.activity_description_placeholder')}
                            value={activityFormData.description}
                            onChange={(e) => setActivityFormData({ ...activityFormData, description: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsAddActivityModalOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="primary" onClick={handleAddActivity} className="bg-primary-accent hover:bg-primary-accent/90">
                            {t('activities.save')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default ContactDetail
