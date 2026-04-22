import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    IoSearch,
    IoFilter,
    IoAdd,
    IoDocumentText,
    IoBusiness,
    IoPricetag,
    IoTrendingUp,
    IoCheckmarkCircle,
    IoClose
} from 'react-icons/io5'
import { proposalsAPI, companiesAPI } from '../../../api'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import RichTextEditor from '../../../components/ui/RichTextEditor'

const ProposalsNew = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const companyId = useMemo(() => {
        const id = user?.company_id || localStorage.getItem('companyId') || '1'
        return parseInt(id, 10) || 1
    }, [user])

    const [proposals, setProposals] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('All')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [companies, setCompanies] = useState([])


    // Form state
    const [formData, setFormData] = useState({
        title: '',
        company_id: '',
        total: '',
        currency: 'USD',
        valid_till: '',
        status: 'draft',
        description: ''
    })

    useEffect(() => {
        fetchProposals()
        fetchCompanies()
    }, [companyId])

    const fetchProposals = async () => {
        try {
            setLoading(true)
            const response = await proposalsAPI.getAll({ company_id: companyId })
            if (response.data.success) {
                setProposals(response.data.data || [])
            }
        } catch (error) {
            console.error('Error fetching proposals:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchCompanies = async () => {
        try {
            const response = await companiesAPI.getAll({ company_id: companyId })
            if (response.data.success) {
                setCompanies(response.data.data || [])
            }
        } catch (error) {
            console.error('Error fetching companies:', error)
        }
    }




    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const dealData = {
                title: formData.title,
                company_id: formData.company_id || companyId,
                total: formData.total,
                sub_total: formData.total, // Backend might need this
                currency: formData.currency,
                valid_till: formData.valid_till,
                status: formData.status,
                description: formData.description,
                discount: '0.00',
                discount_type: '%',
                tax_amount: '0.00'
            }

            console.log('Sending deal data:', dealData)

            const response = await proposalsAPI.create(dealData)
            if (response.data.success) {
                setIsAddModalOpen(false)
                fetchProposals()
                // Reset form
                setFormData({
                    title: '',
                    company_id: '',
                    total: '',
                    currency: 'USD',
                    valid_till: '',
                    status: 'draft',
                    description: ''
                })
            }
        } catch (error) {
            console.error('Error creating deal:', error)
            alert('Failed to create deal')
        }
    }

    const filteredProposals = proposals.filter(proposal => {
        const matchesSearch = (proposal.title || proposal.estimate_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (proposal.company_name || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = filterStatus === 'All' || proposal.status?.toLowerCase() === filterStatus.toLowerCase()
        return matchesSearch && matchesStatus
    })

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount || 0)
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getStatusColor = (status) => {
        const statusColors = {
            'draft': 'neutral',
            'sent': 'blue',
            'accepted': 'success',
            'declined': 'danger',
            'expired': 'warning'
        }
        return statusColors[status?.toLowerCase()] || 'neutral'
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm z-10">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <IoDocumentText className="text-primary-accent" /> Deals
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Manage your proposals and deals</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="primary"
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 shadow-lg shadow-primary-accent/30 hover:shadow-primary-accent/50"
                    >
                        <IoAdd size={20} /> Add Deal
                    </Button>
                </div>
            </div>

            {/* Filters & Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search deals..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {['All', 'Draft', 'Sent', 'Accepted', 'Declined'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                                    ? 'bg-primary-accent text-white shadow-lg'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Deal Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Valid Until</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-accent"></div></div>
                                        </td>
                                    </tr>
                                ) : filteredProposals.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            No deals found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProposals.map((proposal) => (
                                        <tr
                                            key={proposal.id}
                                            onClick={() => navigate(`/app/admin/proposals/${proposal.id}`)}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{proposal.title || 'Untitled'}</div>
                                                <div className="text-xs text-gray-400 font-mono mt-0.5">{proposal.estimate_number || `DEAL-${proposal.id}`}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {proposal.company_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {formatCurrency(proposal.total, proposal.currency)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDate(proposal.valid_till)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={getStatusColor(proposal.status)}>
                                                    {proposal.status || 'Draft'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Deal Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Deal"
                size="large"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Deal Title */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Deal Title <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder="Enter deal title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        {/* Company */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company <span className="text-red-500">*</span>
                            </label>
                            <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                                value={formData.company_id}
                                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                                required
                            >
                                <option value="">Select Company</option>
                                {companies.map(company => (
                                    <option key={company.id} value={company.id}>
                                        {company.company_name || company.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.total}
                                onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                                required
                            />
                        </div>

                        {/* Currency */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Currency
                            </label>
                            <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="INR">INR</option>
                            </select>
                        </div>

                        {/* Valid Until */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valid Until
                            </label>
                            <Input
                                type="date"
                                value={formData.valid_till}
                                onChange={(e) => setFormData({ ...formData, valid_till: e.target.value })}
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="draft">Draft</option>
                                <option value="sent">Sent</option>
                                <option value="accepted">Accepted</option>
                                <option value="declined">Declined</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent min-h-[100px]"
                                placeholder="Enter deal description..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                        >
                            Create Deal
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

export default ProposalsNew
