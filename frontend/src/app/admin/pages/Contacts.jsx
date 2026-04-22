import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { contactsAPI, companiesAPI, employeesAPI } from '../../../api'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import {
    IoEye,
    IoPencil,
    IoTrashOutline,
    IoMail,
    IoCall,
    IoBriefcaseOutline,
    IoPeople,
    IoCalendarOutline,
    IoCheckboxOutline,
    IoSearch,
    IoFilter,
    IoChevronDown,
    IoBusiness,
    IoAdd,
    IoTrendingUp,
} from 'react-icons/io5'

const Contacts = () => {
    const { t } = useLanguage()
    const { user } = useAuth()
    const navigate = useNavigate()

    const companyId = useMemo(() => {
        const id = user?.company_id || localStorage.getItem('companyId') || '1'
        return parseInt(id, 10) || 1
    }, [user])

    // State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedContact, setSelectedContact] = useState(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [contacts, setContacts] = useState([])
    const [companies, setCompanies] = useState([])
    const [employees, setEmployees] = useState([])

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        job_title: '',
        company_id: '',      // For multi-tenant
        client_id: '',       // Linked Organization ID (The "Company")
        company_name: '',    // Display name of organization
        lead_source: '',
        status: 'Active',
        tags: '',
        notes: '',
    })

    useEffect(() => {
        fetchContacts()
        fetchCompanies()
        fetchEmployees()
    }, [companyId])

    const fetchContacts = async () => {
        try {
            setLoading(true)
            const response = await contactsAPI.getMasterList({ company_id: companyId })
            if (response.data.success) {
                setContacts(response.data.data || [])
            }
        } catch (error) {
            console.error('Error fetching contacts:', error)
            setContacts([])
        } finally {
            setLoading(false)
        }
    }

    const fetchCompanies = async () => {
        try {
            // Fetching from the companies module specifically
            const response = await companiesAPI.getAll({ company_id: companyId })
            if (response.data.success) {
                setCompanies(response.data.data || [])
            }
        } catch (error) {
            console.error('Error fetching companies:', error)
        }
    }

    const fetchEmployees = async () => {
        try {
            const response = await employeesAPI.getAll({ company_id: companyId })
            if (response.data.success) {
                setEmployees(response.data.data || [])
            }
        } catch (error) {
            console.error('Error fetching employees:', error)
        }
    }

    const handleAdd = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            job_title: '',
            client_id: '',
            company_name: '',
            lead_source: '',
            status: 'Active',
            tags: '',
            notes: '',
        })
        setIsAddModalOpen(true)
    }

    const handleEdit = (contact) => {
        setSelectedContact(contact)
        setFormData({
            name: contact.name || '',
            email: contact.email || '',
            phone: contact.phone || '',
            job_title: contact.job_title || '',
            client_id: contact.client_id || '',
            company_name: contact.linked_company_name || contact.company || '',
            lead_source: contact.lead_source || '',
            status: contact.status || 'Active',
            tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : (contact.tags || ''),
            notes: contact.notes || '',
        })
        setIsEditModalOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name) {
            alert(t('messages.fieldRequired', { field: t('contacts.columns.name') }))
            return
        }

        try {
            const payload = {
                ...formData,
                company_id: companyId,
                // Ensure tags are handled as array or string as per backend
                tags: typeof formData.tags === 'string' ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : formData.tags
            }

            let response;
            if (isEditModalOpen && selectedContact) {
                response = await contactsAPI.updateMaster(selectedContact.id, payload)
            } else {
                response = await contactsAPI.createMaster(payload)
            }

            if (response.data.success) {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                fetchContacts()
            } else {
                alert(response.data.error || t('messages.saveError'))
            }
        } catch (error) {
            console.error('Error saving contact:', error)
            alert(error.response?.data?.error || 'Kontakt konnte nicht gespeichert werden')
        }
    }

    const handleDelete = async (contact) => {
        if (!window.confirm(t('messages.confirmDelete', { item: contact.name }))) return
        try {
            const response = await contactsAPI.deleteMaster(contact.id, { company_id: companyId })
            if (response.data.success) {
                fetchContacts()
            }
        } catch (error) {
            console.error('Error deleting contact:', error)
        }
    }

    const filteredContacts = contacts.filter(c => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
            c.name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.linked_company_name?.toLowerCase().includes(q)
        )
    })

    const columns = [
        {
            key: 'name',
            label: t('contacts.columns.name'),
            render: (value, row) => (
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => {
                        const path = user?.role === 'EMPLOYEE' ? `/app/employee/contacts/${row.id}` : `/app/admin/contacts/${row.id}`;
                        navigate(path);
                    }}
                >
                    <div className="w-9 h-9 rounded-full bg-primary-accent/10 border border-primary-accent/20 flex items-center justify-center text-primary-accent font-bold text-sm shadow-sm group-hover:bg-primary-accent/20 transition-colors">
                        {(value || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800 group-hover:text-primary-accent transition-colors">{value}</div>
                        {row.job_title && <div className="text-xs text-gray-500">{row.job_title}</div>}
                    </div>
                </div>
            ),
        },
        {
            key: 'email',
            label: t('contacts.columns.email'),
            render: (value, row) => (
                <div className="text-sm space-y-0.5">
                    {value && <div className="text-gray-700">{value}</div>}
                    {row.phone && <div className="text-gray-500 font-medium">{row.phone}</div>}
                </div>
            ),
        },
        {
            key: 'linked_company_name',
            label: t('contacts.columns.company'),
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    <IoBusiness className="text-gray-400" size={16} />
                    <span className="text-sm font-medium text-gray-700">{value || row.company || <span className="text-gray-400">{t('common.no_company')}</span>}</span>
                </div>
            ),
        },
        {
            key: 'status',
            label: t('contacts.columns.status'),
            render: (value) => (
                <Badge variant={value === 'Active' ? 'success' : 'default'} className="text-xs">
                    {value === 'Active' ? t('contacts.status_active') : value === 'Inactive' ? t('contacts.status_inactive') : value || t('contacts.status_active')}
                </Badge>
            ),
        },
    ]

    return (
        <div className="p-3 sm:p-6 space-y-6 sm:space-y-8 bg-[#F8FAFC] min-h-full">
            {/* Header Section with Glassmorphism Effect */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-0 z-10 mx-[-4px]">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight notranslate">{t('contacts.title')}</h1>
                    <p className="text-gray-500 mt-1 font-medium italic notranslate">{t('contacts.subtitle')}</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
                    <div className="relative group w-full sm:w-auto">
                        <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-accent transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder={t('contacts.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-72 pr-6 py-3 border-0 bg-gray-100/50 rounded-2xl text-sm focus:ring-2 focus:ring-primary-accent/30 focus:bg-white outline-none shadow-inner transition-all duration-300"
                            style={{ paddingLeft: '3rem' }}
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center justify-center gap-2 bg-primary-accent hover:bg-primary-accent/90 text-white px-4 py-3 sm:py-2 w-full sm:w-auto rounded-2xl font-bold transition-all active:scale-95 group"
                    >
                        <IoAdd size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span className="notranslate">{t('contacts.add_contact')}</span>
                    </button>
                </div>
            </div>



            {/* List */}
            <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl">
                <DataTable
                    columns={columns}
                    data={filteredContacts}
                    loading={loading}
                    actions={(row) => (
                        <div className="flex items-center gap-1">
                            <button onClick={() => {
                                const path = user?.role === 'EMPLOYEE' ? `/app/employee/contacts/${row.id}` : `/app/admin/contacts/${row.id}`;
                                navigate(path);
                            }} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title={t('common.view_detail')}><IoEye size={18} /></button>
                            <button onClick={() => handleEdit(row)} className="p-2 text-primary-accent hover:bg-primary-accent/10 rounded-lg" title={t('common.edit')}><IoPencil size={18} /></button>
                            <button onClick={() => handleDelete(row)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title={t('common.delete')}><IoTrashOutline size={18} /></button>
                        </div>
                    )}
                />
            </Card>

            {/* Add/Edit Modal - Styled to match screenshot */}
            <Modal
                isOpen={isAddModalOpen || isEditModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false)
                    setIsEditModalOpen(false)
                }}
                title={<span className="notranslate">{isEditModalOpen ? t('contacts.edit_contact') : t('contacts.add_contact')}</span>}
                size="lg"
            >
                <div className="p-1 space-y-5">
                    {/* Contact Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label={t('contacts.columns.name')}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('contacts.columns.name')}
                            required
                        />
                        <Input
                            label={t('common.job_title')}
                            value={formData.job_title}
                            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                            placeholder="z.B. CEO, Marketing Manager"
                        />
                    </div>

                    {/* Email & Phone Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label={t('common.email')}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="contact@example.com"
                        />
                        <Input
                            label={t('common.phone')}
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 234-567-8900"
                        />
                    </div>

                    {/* Company Dropdown (Fetching Organizations from /companies) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.company')}</label>
                        <div className="relative">
                            <select
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none appearance-none bg-white shadow-sm"
                                value={formData.client_id}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const comp = companies.find(c => String(c.id) === String(val));
                                    setFormData({
                                        ...formData,
                                        client_id: val,
                                        company_name: comp ? (comp.name || comp.company_name) : ''
                                    });
                                }}
                            >
                                <option value="">-- {t('common.select_company')} --</option>
                                {companies.map((comp) => (
                                    <option key={comp.id} value={comp.id}>
                                        {comp.name || comp.company_name}
                                    </option>
                                ))}
                            </select>
                            <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Lead Source & Status Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.lead_source')}</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent outline-none appearance-none bg-white shadow-sm"
                                    value={formData.lead_source}
                                    onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                                >
                                    <option value="">{t('common.select_source')}</option>
                                    <option value="Website">{t('common.website')}</option>
                                    <option value="Referral">{t('common.referral')}</option>
                                    <option value="Social Media">{t('common.social_media')}</option>
                                    <option value="Email Campaign">{t('common.email_campaign')}</option>
                                    <option value="Cold Call">{t('common.cold_call')}</option>
                                    <option value="Event">{t('common.event')}</option>
                                    <option value="Other">{t('common.other')}</option>
                                </select>
                                <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.status')}</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent outline-none appearance-none bg-white shadow-sm"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Active">{t('common.active')}</option>
                                    <option value="Inactive">{t('common.inactive')}</option>
                                </select>
                                <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.tags')}</label>
                        <Input
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder={t('common.tags_placeholder')}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            {isEditModalOpen ? t('common.save_changes') : t('contacts.add_contact')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Contacts
