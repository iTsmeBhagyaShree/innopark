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
    IoCalendar
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

const CompanyDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
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
        terms: 'Thank you for your business.', discount: 0, discount_type: '%', amount: '', status: 'draft', project_id: null, items: []
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
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
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
                alert('Name and Email are required');
                return;
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
            alert(error.response?.data?.error || 'Failed to create contact');
        } finally {
            setCreateContactLoading(false);
        }
    }

    const handleAddFile = async () => {
        if (!fileFormData.file) {
            alert('Please select a file')
            return
        }
        if (!fileFormData.title) {
            alert('File title is required')
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
                alert('File uploaded successfully!')
                setIsAddFileModalOpen(false)
                setFileFormData({ title: '', category: '', description: '', file: null })
                fetchFiles(id)
            } else {
                alert(response.data.error || 'Failed to upload file')
            }
        } catch (error) {
            console.error('Error uploading file:', error)
            alert(error.response?.data?.error || 'Failed to upload file')
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
            alert(`File Details:\nTitle: ${file.title || file.name || file.file_name || '-'}\nSize: ${file.size || '-'}\nUploaded By: ${file.user_name || '-'}\nDate: ${file.date || '-'}`)
        }
    }

    const handleDeleteFile = async (file) => {
        if (window.confirm(`Are you sure you want to delete file "${file.title || file.name || file.file_name || file.id}"?`)) {
            try {
                await documentsAPI.delete(file.id, { company_id: companyId })
                alert('File deleted successfully!')
                fetchFiles(id)
            } catch (error) {
                console.error('Error deleting file:', error)
                alert(error.response?.data?.error || 'Failed to delete file')
            }
        }
    }

    const handleAddProposal = async () => {
        try {
            const currencyCode = proposalFormData.currency ? proposalFormData.currency.split(' ')[0] : 'USD'

            const proposalData = {
                title: proposalFormData.title || null,
                valid_till: proposalFormData.valid_till || null,
                currency: currencyCode,
                description: proposalFormData.description || '',
                note: proposalFormData.note || '',
                terms: proposalFormData.terms || 'Thank you for your business.',
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
                alert('Deal created successfully!')
                setIsAddProposalModalOpen(false)
                setProposalFormData({
                    title: '', valid_till: '', currency: 'USD', description: '', note: '',
                    terms: 'Thank you for your business.', discount: 0, discount_type: '%', amount: '', status: 'draft', project_id: null, items: []
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
                alert(response.data.error || 'Failed to create deal')
            }
        } catch (error) {
            console.error('Error creating deal:', error)
            alert(error.response?.data?.error || 'Failed to create deal')
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
                <h2 className="text-2xl font-bold text-gray-800">Company Not Found</h2>
                <Button variant="primary" className="mt-4" onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/companies' : '/app/admin/companies')}>
                    Back to Companies
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
                            onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/companies' : '/app/admin/companies')}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <IoArrowBack size={24} />
                        </button>
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-200">
                            {company.logo ? (
                                <img src={company.logo} alt={company.name} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <span className="text-3xl font-black">{company.name?.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">{company.name}</h1>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 font-medium">
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100/50 border border-gray-200/50">
                                    <IoGlobe size={14} className="text-gray-400" />
                                    {company.website || 'No website'}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="text-primary-accent">{company.industry || 'No industry'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                            <IoPrint size={16} /> Print
                        </Button>
                        <Button variant="primary" size="sm" className="flex items-center gap-2" onClick={() => setIsAddProposalModalOpen(true)}>
                            <IoAdd size={18} /> New Deal
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-8">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['Overview', 'Contacts', 'Deals', 'Tasks', 'Meetings', 'Files'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`px-5 py-2.5 text-sm font-bold transition-all relative rounded-xl whitespace-nowrap ${activeTab === tab.toLowerCase()
                                ? 'text-primary-accent bg-primary-accent/10'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* LEFT PANEL: Company Info + Contacts */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Company Info Card */}
                                <Card className="p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Company Info</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Company Name</p>
                                            <p className="font-medium text-gray-900">{company.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Address</p>
                                            <p className="text-sm text-gray-700">
                                                {[company.address, company.city, company.state, company.country].filter(Boolean).join(', ') || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Website</p>
                                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                {company.website || 'N/A'}
                                            </a>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Phone</p>
                                            <p className="text-sm text-gray-700">{company.phone || 'N/A'}</p>
                                        </div>
                                        {company.email && (
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-semibold">Email</p>
                                                <p className="text-sm text-gray-700">{company.email}</p>
                                            </div>
                                        )}
                                        {company.notes && (
                                            <div className="pt-2 border-t border-gray-50 mt-2">
                                                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Notes</p>
                                                <p className="text-xs text-gray-600 italic leading-relaxed">{company.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Contacts List Card */}
                                <Card className="p-6">
                                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                                        <h3 className="text-lg font-bold text-gray-800">Contacts ({contacts.length})</h3>
                                        <button
                                            onClick={() => setIsAddContactModalOpen(true)}
                                            className="text-primary-accent hover:bg-primary-accent/10 p-1 rounded transition-colors"
                                        >
                                            <IoAdd size={20} />
                                        </button>
                                    </div>
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {contacts.map((contact, idx) => (
                                            <div key={idx} className="flex items-center justify-between group p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                        {contact.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{contact.name}</p>
                                                        <p className="text-xs text-gray-500">{contact.job_title || 'No Title'}</p>
                                                        <p className="text-[10px] text-gray-400">{contact.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded">
                                                        <IoEye size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {contacts.length === 0 && (
                                            <p className="text-sm text-gray-500 text-center py-4">No contacts added.</p>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            {/* RIGHT PANEL: Activity Timeline */}
                            <div className="lg:col-span-8">
                                <Card className="p-6 h-full min-h-[600px]">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Recent Activities</h3>
                                    <ActivityTimeline entityType="company" entityId={id} companyId={id} />
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contacts' && (
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Company Contacts</h3>
                                    <p className="text-sm text-gray-500 mt-1">Manage all personnel linked to this organization</p>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    onClick={() => setIsAddContactModalOpen(true)}
                                >
                                    <IoAdd size={18} /> Add Contact
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
                                                    <p className="text-xs text-gray-500 font-medium">{contact.job_title || 'No Title'}</p>
                                                </div>
                                            </div>
                                            <Badge variant="ghost">Primary</Badge>
                                        </div>
                                        <div className="mt-6 space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <IoMail className="text-gray-400" />
                                                <span className="truncate">{contact.email || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <IoCall className="text-gray-400" />
                                                <span>{contact.phone || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-gray-50 flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1">Message</Button>
                                            <Button variant="ghost" size="sm" className="px-3" title="View Detail">
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
                                    <h3 className="text-xl font-bold text-gray-800">Business Deals</h3>
                                    <p className="text-sm text-gray-500 mt-1">Ongoing and closed opportunities with this company</p>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    onClick={() => setIsAddProposalModalOpen(true)}
                                >
                                    <IoAdd size={18} /> New Deal
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                                        <tr>
                                            <th className="pb-4 pl-4 font-semibold">Deal Title</th>
                                            <th className="pb-4 font-semibold">Value</th>
                                            <th className="pb-4 font-semibold">Stage</th>
                                            <th className="pb-4 font-semibold">Closing Date</th>
                                            <th className="pb-4 text-right pr-4 font-semibold">Actions</th>
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
                                                <td className="py-4 font-bold text-gray-800">${deal.amount || '0'}</td>
                                                <td className="py-4">
                                                    <Badge variant="primary" className="text-[10px] uppercase">{deal.status}</Badge>
                                                </td>
                                                <td className="py-4 text-sm text-gray-500">{deal.closing_date || 'N/A'}</td>
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
                                                    <p>No deals records available for this company.</p>
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
                                    <h3 className="text-xl font-bold text-gray-800">Company Tasks</h3>
                                    <p className="text-sm text-gray-500">Manage activities and deadlines</p>
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
                                    <h3 className="text-xl font-bold text-gray-800">Company Meetings</h3>
                                    <p className="text-sm text-gray-500">Scheduled meetings</p>
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
                                    <h3 className="text-xl font-bold text-gray-800">Files Vault</h3>
                                    <p className="text-sm text-gray-500 mt-1">Manage all documents linked to this company</p>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    onClick={() => setIsAddFileModalOpen(true)}
                                >
                                    <IoAdd size={18} /> Upload Document
                                </Button>
                            </div>

                            {loadingFiles ? (
                                <div className="py-12 text-center text-gray-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p>Loading documents...</p>
                                </div>
                            ) : files.length === 0 ? (
                                <div className="py-12 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                                    <IoFileTrayFull size={48} className="text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-500">No documents uploaded yet.</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-4 text-blue-600"
                                        onClick={() => setIsAddFileModalOpen(true)}
                                    >
                                        Click here to upload your first file
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
                                                    <p className="text-xs text-gray-500 mt-1">{file.category || 'Uncategorized'}</p>
                                                    <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                        <span className="flex items-center gap-1"><IoTime size={10} /> {file.date || 'N/A'}</span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        <span>{file.size || '0 KB'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleViewFile(file)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="View/Download"
                                                >
                                                    <IoDownload size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFile(file)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete"
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
                                                    View File
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
                title="Add New Contact"
            >
                <div className="space-y-4">
                    <Input
                        label="Contact Name *"
                        value={contactFormData.name}
                        onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                        placeholder="Enter contact name"
                        required
                    />
                    <Input
                        label="Email Address *"
                        type="email"
                        value={contactFormData.email}
                        onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                        placeholder="example@company.com"
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Phone Number"
                            value={contactFormData.phone}
                            onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                        />
                        <Input
                            label="Job Title"
                            value={contactFormData.job_title}
                            onChange={(e) => setContactFormData({ ...contactFormData, job_title: e.target.value })}
                            placeholder="e.g. CEO, Manager"
                        />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddContactModalOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateContact}
                            className="flex-1"
                            disabled={createContactLoading}
                        >
                            {createContactLoading ? 'Creating...' : 'Create Contact'}
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
                title="Upload Document"
            >
                <div className="space-y-4">
                    <Input
                        label="File Title *"
                        value={fileFormData.title}
                        onChange={(e) => setFileFormData({ ...fileFormData, title: e.target.value })}
                        placeholder="e.g. Service Agreement, Invoice"
                        required
                    />
                    <Input
                        label="Category"
                        value={fileFormData.category}
                        onChange={(e) => setFileFormData({ ...fileFormData, category: e.target.value })}
                        placeholder="e.g. Legal, Finance, Contract"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            value={fileFormData.description}
                            onChange={(e) => setFileFormData({ ...fileFormData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Briefly describe this document"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select File *</label>
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
                                    {fileFormData.file ? fileFormData.file.name : 'Click to browse or drag and drop'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">PDF, DOC, Images up to 20MB</p>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddFileModalOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleAddFile} className="flex-1">
                            Upload Now
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
                        title: '', valid_till: '', currency: 'USD', description: '', note: '',
                        terms: 'Thank you for your business.', discount: 0, discount_type: '%', amount: '', status: 'draft', client_id: null, project_id: null, items: []
                    })
                }}
                title="Create New Deal"
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <Input
                        label="Deal Title *"
                        value={proposalFormData.title}
                        onChange={(e) => setProposalFormData({ ...proposalFormData, title: e.target.value })}
                        placeholder="Enter deal title"
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Valid Till"
                            type="date"
                            value={proposalFormData.valid_till}
                            onChange={(e) => setProposalFormData({ ...proposalFormData, valid_till: e.target.value })}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                            <select
                                value={proposalFormData.currency}
                                onChange={(e) => setProposalFormData({ ...proposalFormData, currency: e.target.value.split(' ')[0] })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="INR">INR (€)</option>
                            </select>
                        </div>
                    </div>
                    <Input
                        label="Deal Value ($) *"
                        type="number"
                        value={proposalFormData.amount}
                        onChange={(e) => setProposalFormData({ ...proposalFormData, amount: e.target.value })}
                        placeholder="0.00"
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Discount"
                            type="number"
                            value={proposalFormData.discount}
                            onChange={(e) => setProposalFormData({ ...proposalFormData, discount: e.target.value })}
                            placeholder="0"
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                            <select
                                value={proposalFormData.discount_type}
                                onChange={(e) => setProposalFormData({ ...proposalFormData, discount_type: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="%">Percentage (%)</option>
                                <option value="flat">Flat Amount</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={proposalFormData.status}
                            onChange={(e) => setProposalFormData({ ...proposalFormData, status: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="accepted">Accepted</option>
                            <option value="declined">Declined</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            value={proposalFormData.description}
                            onChange={(e) => setProposalFormData({ ...proposalFormData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Enter deal details"
                        />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddProposalModalOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleAddProposal} className="flex-1">
                            Create Deal
                        </Button>
                    </div>
                </div>
            </Modal>


        </div>
    )
}

export default CompanyDetail
