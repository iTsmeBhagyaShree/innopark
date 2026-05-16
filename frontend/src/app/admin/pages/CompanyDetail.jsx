import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    IoArrowBack,
    IoBusiness,
    IoCall,
    IoGlobe,
    IoLocation,
    IoPeople,
    IoTrendingUp,
    IoDocumentText,
    IoFileTrayFull,
    IoAdd,
    IoEllipsisHorizontal,
    IoTime,
    IoMail,
    IoEye,
    IoDownload,
    IoPrint,
    IoCheckmarkCircleOutline,
    IoCalendar,
    IoPencil
} from 'react-icons/io5'
import { companiesAPI, dealsAPI, documentsAPI, tasksAPI, employeesAPI } from '../../../api'
import BaseUrl from '../../../api/baseUrl.js'
import Tasks from '../../../components/Tasks'
import Meetings from '../../../components/Meetings'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import ActivityTimeline from '../../../components/ui/ActivityTimeline'
import { useLanguage } from '../../../context/LanguageContext.jsx'
import PriorityActivities from '../../../components/shared/PriorityActivities'

const CompanyDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { t, language } = useLanguage()
    const companyId = useMemo(() => {
        const cid = user?.company_id || localStorage.getItem('companyId') || '1'
        return parseInt(cid, 10) || 1
    }, [user])

    const [activeTab, setActiveTab] = useState('overview')
    const [loading, setLoading] = useState(true)
    const [company, setCompany] = useState(null)
    const [contacts, setContacts] = useState([])
    const [deals, setDeals] = useState([])
    const [files, setFiles] = useState([])
    const [loadingFiles, setLoadingFiles] = useState(false)

    const [contactFormData, setContactFormData] = useState({
        name: '', email: '', phone: '', job_title: ''
    })
    const [fileFormData, setFileFormData] = useState({
        title: '', category: '', description: '', file: null
    })
    const [proposalFormData, setProposalFormData] = useState({
        title: '', valid_till: '', currency: 'USD', description: '', note: '',
        terms: '', discount: 0, discount_type: '%', amount: '', status: 'draft', project_id: null, items: []
    })

    // Modal states
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)
    const [isAddFileModalOpen, setIsAddFileModalOpen] = useState(false)
    const [isAddProposalModalOpen, setIsAddProposalModalOpen] = useState(false)
    const [createContactLoading, setCreateContactLoading] = useState(false)

    useEffect(() => {
        fetchCompanyData()
    }, [id])

    const fetchCompanyData = async () => {
        try {
            setLoading(true)
            const response = await companiesAPI.getById(id)
            if (response.data.success) {
                setCompany(response.data.data)
                // Load related data
                fetchRelatedData(response.data.data.id)
            }
        } catch (error) {
            console.error('Error fetching company:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        const loc = String(language || '').toLowerCase().startsWith('de') ? 'de-DE' : 'en-GB'
        return date.toLocaleDateString(loc, { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    }

    const isDeadlineOverdue = (deadline) => {
        if (!deadline) return false
        return new Date(deadline) < new Date()
    }

    const fetchRelatedData = async (cid) => {
        try {
            // Fetch contacts for this company
            const contactsRes = await companiesAPI.getContacts(cid)
            if (contactsRes.data.success) {
                setContacts(contactsRes.data.data || [])
            }

            // Fetch deals for this company
            // We want deals belonging to THIS company (as a client), but within the current Tenant (companyId)
            const dealsRes = await dealsAPI.getAll({
                company_id: companyId,
                client_id: cid
            })
            if (dealsRes.data.success) {
                setDeals(dealsRes.data.data || [])
            }

            // Fetch files for this company
            fetchFiles(cid)
        } catch (error) {
            console.error('Error fetching related data:', error)
        }
    }

    const fetchFiles = async (cid) => {
        try {
            setLoadingFiles(true)
            const response = await documentsAPI.getAll({
                client_id: cid,
                company_id: companyId
            })
            if (response.data.success) {
                setFiles(response.data.data || [])
            }
        } catch (error) {
            console.error('Error fetching files:', error)
        } finally {
            setLoadingFiles(false)
        }
    }

    const handleCreateContact = async () => {
        try {
            if (!contactFormData.name || !contactFormData.email) {
                alert(t('companies.detail_page.alerts.name_email_required'))
                return
            }
            setCreateContactLoading(true);

            await companiesAPI.addContact(id, {
                name: contactFormData.name,
                email: contactFormData.email,
                phone: contactFormData.phone,
                job_title: contactFormData.job_title,
                is_primary: false
            });

            alert('Contact added successfully!');
            setIsAddContactModalOpen(false);
            setContactFormData({ name: '', email: '', phone: '', job_title: '' });
            fetchCompanyData(); // Refresh data
        } catch (error) {
            console.error('Error creating contact:', error);
            alert(error.response?.data?.error || t('companies.detail_page.alerts.contact_failed'))
        } finally {
            setCreateContactLoading(false);
        }
    }

    const handleAddFile = async () => {
        if (!fileFormData.file) {
            alert(t('companies.detail_page.alerts.select_file'))
            return
        }
        if (!fileFormData.title) {
            alert(t('companies.detail_page.alerts.file_title_required'))
            return
        }

        try {
            const uploadFormData = new FormData()
            uploadFormData.append('company_id', companyId)
            uploadFormData.append('client_id', id)
            uploadFormData.append('title', fileFormData.title)
            uploadFormData.append('category', fileFormData.category || '')
            uploadFormData.append('description', fileFormData.description || '')
            uploadFormData.append('file', fileFormData.file)

            const response = await documentsAPI.create(uploadFormData)
            if (response.data.success) {
                alert(t('companies.detail_page.alerts.upload_success'))
                setIsAddFileModalOpen(false)
                setFileFormData({ title: '', category: '', description: '', file: null })
                fetchFiles(id)
            } else {
                alert(response.data.error || t('companies.detail_page.alerts.upload_failed'))
            }
        } catch (error) {
            console.error('Error uploading file:', error)
            alert(error.response?.data?.error || t('companies.detail_page.alerts.upload_failed'))
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFileFormData({ ...fileFormData, file })
        }
    }

    const handleViewFile = (file) => {
        // Construct URL for local development/production
        const API_URL = BaseUrl

        if (file.file_path) {
            // Replace backslashes with forward slashes for URL
            const cleanPath = file.file_path.replace(/\\/g, '/')
            // Ensure path doesn't start with / if we append to base
            const finalPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath

            window.open(`${API_URL}/${finalPath}`, '_blank')
        } else if (file.url) {
            window.open(file.url, '_blank')
        } else {
            alert(
                `${t('companies.detail_page.alerts.file_details_title')}: ${file.title || file.name || file.file_name || '-'}\n` +
                    `${t('companies.detail_page.alerts.file_details_size')}: ${file.size || '-'}\n` +
                    `${t('companies.detail_page.alerts.file_details_by')}: ${file.user_name || '-'}\n` +
                    `${t('companies.detail_page.alerts.file_details_date')}: ${file.date || '-'}`
            )
        }
    }

    const handleDeleteFile = async (file) => {
        const fname = file.title || file.name || file.file_name || file.id
        if (window.confirm(String(t('companies.detail_page.alerts.delete_file_confirm')).replace('{{name}}', fname))) {
            try {
                await documentsAPI.delete(file.id, { company_id: companyId })
                alert('File deleted successfully!')
                fetchFiles(id)
            } catch (error) {
                console.error('Error deleting file:', error)
                alert(error.response?.data?.error || t('companies.detail_page.alerts.delete_file_failed'))
            }
        }
    }

    const handleAddProposal = async () => {
        try {
            const currencyCode = proposalFormData.currency ? proposalFormData.currency.split(' ')[0] : 'USD'

            const proposalData = {
                title: proposalFormData.title || null,
                valid_till: proposalFormData.valid_till || null,
                currency: 'EUR',
                description: proposalFormData.description || '',
                note: proposalFormData.note || '',
                terms: proposalFormData.terms || t('companies.detail_page.deal_modal.default_terms'),
                discount: parseFloat(proposalFormData.discount) || 0,
                discount_type: proposalFormData.discount_type || '%',
                sub_total: parseFloat(proposalFormData.amount) || 0,
                total: parseFloat(proposalFormData.amount) || 0,
                status: (proposalFormData.status || 'draft').toString().toLowerCase(),
                client_id: parseInt(id),
                company_id: parseInt(companyId),
                items: []
            }

            const response = await dealsAPI.create(proposalData)
            if (response.data.success) {
                alert(t('companies.detail_page.alerts.deal_created'))
                setIsAddProposalModalOpen(false)
                setProposalFormData({
                    title: '', valid_till: '', currency: 'EUR', description: '', note: '',
                    terms: '', discount: 0, discount_type: '%', amount: '', status: 'draft', project_id: null, items: []
                })
                // Refresh deals
                const dealsRes = await dealsAPI.getAll({
                    company_id: companyId,
                    client_id: id
                })
                if (dealsRes.data.success) {
                    setDeals(dealsRes.data.data || [])
                }
            } else {
                alert(response.data.error || t('companies.detail_page.alerts.deal_failed'))
            }
        } catch (error) {
            console.error('Error creating deal:', error)
            alert(error.response?.data?.error || t('companies.detail_page.alerts.deal_failed'))
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <IoBusiness size={64} className="text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">{t('companies.detail_page.not_found_title')}</h2>
                <Button variant="primary" className="mt-4" onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/companies' : '/app/admin/companies')}>
                    {t('companies.detail_page.back_to_companies')}
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 p-8 shadow-sm z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/companies' : '/app/admin/companies')}
                            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all text-gray-600"
                        >
                            <IoArrowBack size={20} />
                        </button>
                        <div className="relative">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-green-200">
                                {company.logo ? (
                                    <img src={company.logo} alt={company.name} className="w-full h-full object-cover rounded-3xl" />
                                ) : (
                                    <span className="text-3xl font-black">{company.name?.charAt(0)}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-sm"></div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{company.name}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="primary" size="md" className="flex items-center gap-2 rounded-2xl font-bold shadow-lg shadow-blue-500/20" onClick={() => setIsAddProposalModalOpen(true)}>
                            <IoAdd size={18} /> {t('companies.detail_page.new_deal')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-8">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {[
                        { key: 'overview', labelKey: 'companies.detail_tabs.overview' },
                        { key: 'contacts', labelKey: 'companies.detail_tabs.contacts' },
                        { key: 'deals', labelKey: 'companies.detail_tabs.deals' },
                        { key: 'tasks', labelKey: 'companies.detail_tabs.tasks' },
                        { key: 'meetings', labelKey: 'companies.detail_tabs.meetings' },
                        { key: 'files', labelKey: 'companies.detail_tabs.files' },
                    ].map(({ key, labelKey }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key)}
                            className={`px-5 py-2.5 text-sm font-bold transition-all relative rounded-xl whitespace-nowrap ${activeTab === key
                                ? 'text-primary-accent bg-primary-accent/10'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {t(labelKey)}
                        </button>
                    ))}
                </div>
            </div>
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Priority Activities */}
                            <PriorityActivities
                                relatedToType="company"
                                relatedToId={id}
                                companyId={companyId}
                                t={t}
                            />

                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                {/* Left Column - Info Cards (5/12) */}
                                <div className="xl:col-span-5 space-y-8">
                                    {/* Company Information Card */}
                                    <Card className="p-8 border border-gray-100 shadow-sm bg-white rounded-3xl transition-all duration-300">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{t('companies.detail_page.company_info')}</h3>
                                            <IoBusiness size={24} className="text-gray-200" />
                                        </div>
                                        
                                        <div className="space-y-8">
                                            <div className="flex items-start gap-4 group">
                                                <div className="w-10 h-10 rounded-xl bg-primary-accent/5 flex items-center justify-center text-primary-accent border border-primary-accent/10 group-hover:scale-105 transition-transform">
                                                    <IoLocation size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{t('companies.detail_page.address')}</p>
                                                    <p className="text-sm font-bold text-gray-800">
                                                        {[company.address, company.city, company.state, company.country].filter(Boolean).join(', ') || t('common.na')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4 group">
                                                <div className="w-10 h-10 rounded-xl bg-secondary-accent/5 flex items-center justify-center text-secondary-accent border border-secondary-accent/10 group-hover:scale-105 transition-transform">
                                                    <IoCall size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{t('companies.detail_page.phone')}</p>
                                                    <p className="text-sm font-bold text-gray-800">{company.phone || t('common.na')}</p>
                                                </div>
                                            </div>

                                            {company.email && (
                                                <div className="flex items-start gap-4 group">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 group-hover:scale-105 transition-transform">
                                                        <IoMail size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{t('companies.detail_page.email')}</p>
                                                        <p className="text-sm font-bold text-gray-800">{company.email}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {company.notes && (
                                            <div className="mt-8 pt-6 border-t border-gray-50">
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-3">{t('companies.detail_page.notes')}</p>
                                                <div className="text-sm text-gray-600 leading-relaxed italic bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                    {company.notes}
                                                </div>
                                            </div>
                                        )}
                                    </Card>

                                    {/* Linked Contacts Card */}
                                    <Card className="p-8 border border-gray-100 shadow-sm bg-white rounded-3xl">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                                                {String(t('companies.detail_page.contacts_with_count')).replace('{{count}}', String(contacts.length))}
                                            </h3>
                                            <button
                                                onClick={() => setIsAddContactModalOpen(true)}
                                                className="p-2 bg-primary-accent/10 text-primary-accent rounded-xl hover:bg-primary-accent/20 transition-all"
                                            >
                                                <IoAdd size={20} />
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {contacts.map((contact, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-100">
                                                            {contact.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 text-sm">{contact.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-medium">{contact.job_title || t('companies.detail_page.no_job_title')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {contacts.length === 0 && (
                                                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                                                    <IoPeople size={32} className="mx-auto text-gray-300 mb-2" />
                                                    <p className="text-sm text-gray-400 font-medium">{t('companies.detail_page.no_contacts_yet')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </div>

                                {/* Right Column - Activities (7/12) */}
                                <div className="xl:col-span-7 space-y-8">
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <ActivityTimeline entityType="company" entityId={id} companyId={id} />
                                    </div>
                                </div>
                            </div>
                    </div>
                )}

                    {activeTab === 'contacts' && (
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{t('companies.detail_page.contacts_tab_title')}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{t('companies.detail_page.contacts_tab_subtitle')}</p>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    onClick={() => setIsAddContactModalOpen(true)}
                                >
                                    <IoAdd size={18} /> {t('companies.detail_page.add_contact')}
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {contacts.map((contact, idx) => (
                                    <div key={idx} className="p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300 group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                    {contact.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{contact.name}</h4>
                                                    <p className="text-xs text-gray-500 font-medium">{contact.job_title || t('companies.detail_page.no_job_title')}</p>
                                                </div>
                                            </div>
                                            <Badge variant="ghost">{t('companies.detail_page.primary_contact')}</Badge>
                                        </div>
                                        <div className="mt-6 space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <IoMail className="text-gray-400" />
                                                <span className="truncate">{contact.email || t('common.na')}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <IoCall className="text-gray-400" />
                                                <span>{contact.phone || t('common.na')}</span>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-gray-50 flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1">{t('companies.detail_page.message')}</Button>
                                            <Button variant="ghost" size="sm" className="px-3" title={t('companies.detail_page.view_detail')}>
                                                <IoEye size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {activeTab === 'deals' && (
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{t('companies.detail_page.deals_tab_title')}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{t('companies.detail_page.deals_tab_subtitle')}</p>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    onClick={() => setIsAddProposalModalOpen(true)}
                                >
                                    <IoAdd size={18} /> {t('companies.detail_page.new_deal')}
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                                        <tr>
                                            <th className="pb-4 pl-4 font-semibold">{t('companies.detail_page.table_deal_title')}</th>
                                            <th className="pb-4 font-semibold">{t('companies.detail_page.table_value')}</th>
                                            <th className="pb-4 font-semibold">{t('companies.detail_page.table_stage')}</th>
                                            <th className="pb-4 font-semibold">{t('companies.detail_page.table_closing_date')}</th>
                                            <th className="pb-4 text-right pr-4 font-semibold">{t('companies.detail_page.table_actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {deals.map((deal, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                                <td className="py-4 pl-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                                                            <IoFileTrayFull size={18} />
                                                        </div>
                                                        <span className="font-bold text-gray-800">{deal.title}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 font-bold text-gray-800">{formatCurrency(deal.amount || 0)}</td>
                                                <td className="py-4">
                                                    <Badge variant="primary" className="text-[10px] uppercase">{deal.status}</Badge>
                                                </td>
                                                <td className="py-4 text-sm text-gray-500">{deal.closing_date || t('common.na')}</td>
                                                <td className="py-4 text-right pr-4">
                                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onClick={() => navigate(user?.role === 'EMPLOYEE' ? `/app/employee/deals/${deal.id}` : `/app/admin/deals/${deal.id}`)}>
                                                        <IoEye size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {deals.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="py-12 text-center text-gray-400">
                                                    <IoTrendingUp size={48} className="mx-auto mb-2 opacity-20" />
                                                    <p>{t('companies.detail_page.deals_empty')}</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'tasks' && (
                        <Card className="p-6 h-[600px] flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <IoCheckmarkCircleOutline size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{t('companies.detail_page.tasks_tab_title')}</h3>
                                    <p className="text-sm text-gray-500">{t('companies.detail_page.tasks_tab_subtitle')}</p>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <Tasks relatedToType="company" relatedToId={id} />
                            </div>
                        </Card>
                    )}

                    {activeTab === 'meetings' && (
                        <Card className="p-6 h-[600px] flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                                    <IoCalendar size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{t('companies.detail_page.meetings_tab_title')}</h3>
                                    <p className="text-sm text-gray-500">{t('companies.detail_page.meetings_tab_subtitle')}</p>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <Meetings relatedToType="company" relatedToId={id} />
                            </div>
                        </Card>
                    )}



                    {activeTab === 'files' && (
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{t('companies.detail_page.files_tab_title')}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{t('companies.detail_page.files_tab_subtitle')}</p>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    onClick={() => setIsAddFileModalOpen(true)}
                                >
                                    <IoAdd size={18} /> {t('companies.detail_page.upload_document')}
                                </Button>
                            </div>

                            {loadingFiles ? (
                                <div className="py-12 text-center text-gray-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p>{t('companies.detail_page.loading_documents')}</p>
                                </div>
                            ) : files.length === 0 ? (
                                <div className="py-12 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                                    <IoFileTrayFull size={48} className="text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-500">{t('companies.detail_page.no_documents_yet')}</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-4 text-blue-600"
                                        onClick={() => setIsAddFileModalOpen(true)}
                                    >
                                        {t('companies.detail_page.upload_first_hint')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {files.map((file, idx) => (
                                        <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-all group relative">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                                                    <IoDocumentText size={24} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-800 truncate pr-8" title={file.title || file.file_name}>
                                                        {file.title || file.file_name}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1">{file.category || t('companies.detail_page.uncategorized')}</p>
                                                    <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                        <span className="flex items-center gap-1"><IoTime size={10} /> {file.date || t('common.na')}</span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        <span>{file.size || '0 KB'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleViewFile(file)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title={t('companies.detail_page.view_download')}
                                                >
                                                    <IoDownload size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFile(file)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title={t('companies.detail_page.delete')}
                                                >
                                                    <IoEllipsisHorizontal size={16} />
                                                </button>
                                            </div>

                                            <div className="mt-4 flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="xs"
                                                    className="flex-1 text-[11px]"
                                                    onClick={() => handleViewFile(file)}
                                                >
                                                    {t('companies.detail_page.view_file')}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </div>

            {/* Add Contact Modal */}
            <Modal
                isOpen={isAddContactModalOpen}
                onClose={() => {
                    setIsAddContactModalOpen(false)
                    setContactFormData({ name: '', email: '', phone: '', job_title: '' })
                }}
                title={t('contacts.add_modal.title')}
            >
                <div className="space-y-4">
                    <Input
                        label={t('contacts.add_modal.contact_name_label')}
                        value={contactFormData.name}
                        onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                        placeholder={t('contacts.add_modal.contact_name_placeholder')}
                        required
                    />
                    <Input
                        label={t('contacts.add_modal.email_label')}
                        type="email"
                        value={contactFormData.email}
                        onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                        placeholder={t('contacts.add_modal.email_placeholder')}
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label={t('contacts.add_modal.phone_label')}
                            value={contactFormData.phone}
                            onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                            placeholder={t('contacts.add_modal.phone_placeholder')}
                        />
                        <Input
                            label={t('contacts.add_modal.job_title_label')}
                            value={contactFormData.job_title}
                            onChange={(e) => setContactFormData({ ...contactFormData, job_title: e.target.value })}
                            placeholder={t('contacts.add_modal.job_title_placeholder')}
                        />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddContactModalOpen(false)}
                            className="flex-1"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateContact}
                            className="flex-1"
                            disabled={createContactLoading}
                        >
                            {createContactLoading ? t('contacts.add_modal.creating') : t('contacts.add_modal.create_contact')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Add File Modal */}
            <Modal
                isOpen={isAddFileModalOpen}
                onClose={() => {
                    setIsAddFileModalOpen(false)
                    setFileFormData({ title: '', category: '', description: '', file: null })
                }}
                title={t('companies.detail_page.file_modal.title')}
            >
                <div className="space-y-4">
                    <Input
                        label={t('companies.detail_page.file_modal.file_title')}
                        value={fileFormData.title}
                        onChange={(e) => setFileFormData({ ...fileFormData, title: e.target.value })}
                        placeholder={t('companies.detail_page.file_modal.file_title_placeholder')}
                        required
                    />
                    <Input
                        label={t('companies.detail_page.file_modal.category')}
                        value={fileFormData.category}
                        onChange={(e) => setFileFormData({ ...fileFormData, category: e.target.value })}
                        placeholder={t('companies.detail_page.file_modal.category_placeholder')}
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('companies.detail_page.file_modal.description')}</label>
                        <textarea
                            value={fileFormData.description}
                            onChange={(e) => setFileFormData({ ...fileFormData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder={t('companies.detail_page.file_modal.description_placeholder')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('companies.detail_page.file_modal.select_file')}</label>
                        <div className="relative">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={handleFileChange}
                                required
                            />
                            <label
                                htmlFor="file-upload"
                                className={`w-full flex flex-col items-center justify-center px-4 py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${fileFormData.file ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:border-blue-400'
                                    }`}
                            >
                                <IoDownload size={32} className={fileFormData.file ? 'text-blue-500' : 'text-gray-400'} />
                                <p className="mt-2 text-sm font-semibold text-gray-700">
                                    {fileFormData.file ? fileFormData.file.name : t('companies.detail_page.file_modal.browse_hint')}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{t('companies.detail_page.file_modal.file_types_hint')}</p>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddFileModalOpen(false)}
                            className="flex-1"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button variant="primary" onClick={handleAddFile} className="flex-1">
                            {t('companies.detail_page.file_modal.upload_now')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Add Deal (Proposal) Modal */}
            <Modal
                isOpen={isAddProposalModalOpen}
                onClose={() => {
                    setIsAddProposalModalOpen(false)
                    setProposalFormData({
                        title: '', valid_till: '', currency: 'EUR', description: '', note: '',
                        terms: '', discount: 0, discount_type: '%', amount: '', status: 'draft', client_id: null, project_id: null, items: []
                    })
                }}
                title={t('companies.detail_page.deal_modal.title')}
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <Input
                        label={t('companies.detail_page.deal_modal.deal_title')}
                        value={proposalFormData.title}
                        onChange={(e) => setProposalFormData({ ...proposalFormData, title: e.target.value })}
                        placeholder={t('companies.detail_page.deal_modal.deal_title_placeholder')}
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label={t('companies.detail_page.deal_modal.valid_till')}
                            type="date"
                            value={proposalFormData.valid_till}
                            onChange={(e) => setProposalFormData({ ...proposalFormData, valid_till: e.target.value })}
                        />
                        <div className="hidden">
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('companies.detail_page.deal_modal.currency')}</label>
                            <select
                                value={proposalFormData.currency}
                                onChange={(e) => setProposalFormData({ ...proposalFormData, currency: e.target.value.split(' ')[0] })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="EUR">EUR (€)</option>
                            </select>
                        </div>
                    </div>
                    <Input
                        label={t('companies.detail_page.deal_modal.deal_value')}
                        type="number"
                        value={proposalFormData.amount}
                        onChange={(e) => setProposalFormData({ ...proposalFormData, amount: e.target.value })}
                        placeholder="0.00"
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label={t('companies.detail_page.deal_modal.discount')}
                            type="number"
                            value={proposalFormData.discount}
                            onChange={(e) => setProposalFormData({ ...proposalFormData, discount: e.target.value })}
                            placeholder="0"
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('companies.detail_page.deal_modal.discount_type')}</label>
                            <select
                                value={proposalFormData.discount_type}
                                onChange={(e) => setProposalFormData({ ...proposalFormData, discount_type: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="%">{t('companies.detail_page.deal_modal.discount_percent')}</option>
                                <option value="flat">{t('companies.detail_page.deal_modal.discount_flat')}</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('companies.detail_page.deal_modal.status')}</label>
                        <select
                            value={proposalFormData.status}
                            onChange={(e) => setProposalFormData({ ...proposalFormData, status: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="draft">{t('companies.detail_page.deal_modal.status_draft')}</option>
                            <option value="sent">{t('companies.detail_page.deal_modal.status_sent')}</option>
                            <option value="accepted">{t('companies.detail_page.deal_modal.status_accepted')}</option>
                            <option value="declined">{t('companies.detail_page.deal_modal.status_declined')}</option>
                            <option value="expired">{t('companies.detail_page.deal_modal.status_expired')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('companies.detail_page.deal_modal.description')}</label>
                        <textarea
                            value={proposalFormData.description}
                            onChange={(e) => setProposalFormData({ ...proposalFormData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder={t('companies.detail_page.deal_modal.description_placeholder')}
                        />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddProposalModalOpen(false)}
                            className="flex-1"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button variant="primary" onClick={handleAddProposal} className="flex-1">
                            {t('companies.detail_page.deal_modal.create_deal')}
                        </Button>
                    </div>
                </div>
            </Modal>


        </div>
    )
}

export default CompanyDetail
