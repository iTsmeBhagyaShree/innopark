import { useState, useEffect } from 'react'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import axiosInstance from '../../../api/axiosInstance'
import { IoCreate, IoTrash, IoEye, IoSearch, IoBriefcase, IoAdd } from 'react-icons/io5'
import { useLanguage } from '../../../context/LanguageContext'

const OfflineRequests = () => {
  const { t, language } = useLanguage()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [companies, setCompanies] = useState([])
  const [packages, setPackages] = useState([])
  const [formData, setFormData] = useState({
    company_id: '',
    company_name: '',
    package_id: '',
    request_type: 'Payment',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    amount: '',
    currency: 'USD',
    payment_method: '',
    description: '',
    status: 'Pending',
    notes: '',
  })

  useEffect(() => {
    fetchRequests()
    fetchCompanies()
    fetchPackages()
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchRequests()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, statusFilter])

  const fetchCompanies = async () => {
    try {
      const response = await axiosInstance.get('/superadmin/companies')
      if (response.data.success) {
        setCompanies(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchPackages = async () => {
    try {
      const response = await axiosInstance.get('/superadmin/packages')
      if (response.data.success) {
        setPackages(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
  }

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/superadmin/offline-requests', {
        params: {
          search: searchQuery || undefined,
          status: statusFilter || undefined
        }
      })
      if (response.data.success) {
        setRequests(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching offline requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        package_id: formData.package_id ? parseInt(formData.package_id) : null
      }

      if (selectedRequest) {
        await axiosInstance.put(`/superadmin/offline-requests/${selectedRequest.id}`, payload)
      } else {
        await axiosInstance.post('/superadmin/offline-requests', payload)
      }

      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
      setSelectedRequest(null)
      resetForm()
      fetchRequests()
    } catch (error) {
      console.error('Error saving request:', error)
      alert(error.response?.data?.error || t('error'))
    }
  }

  const handleEdit = (request) => {
    setSelectedRequest(request)
    setFormData({
      company_id: request.company_id || '',
      company_name: request.company_name || request.company_name_from_db || '',
      package_id: request.package_id || '',
      request_type: request.request_type || 'Payment',
      contact_name: request.contact_name || '',
      contact_email: request.contact_email || '',
      contact_phone: request.contact_phone || '',
      amount: request.amount || '',
      currency: request.currency || 'USD',
      payment_method: request.payment_method || '',
      description: request.description || '',
      status: request.status || 'Pending',
      notes: request.notes || '',
    })
    setIsEditModalOpen(true)
  }

  const handleView = (request) => {
    setSelectedRequest(request)
    setIsViewModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('delete_confirm'))) return

    try {
      await axiosInstance.delete(`/superadmin/offline-requests/${id}`)
      fetchRequests()
    } catch (error) {
      console.error('Error deleting request:', error)
      alert(error.response?.data?.error || t('error'))
    }
  }

  const resetForm = () => {
    setFormData({
      company_id: '',
      company_name: '',
      package_id: '',
      request_type: 'Payment',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      amount: '',
      currency: 'USD',
      payment_method: '',
      description: '',
      status: 'Pending',
      notes: '',
    })
    setSelectedRequest(null)
  }

  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'warning',
      'Approved': 'success',
      'Rejected': 'danger',
      'Completed': 'info'
    }
    const labels = {
      'Pending': t('offline_requests.status_pending'),
      'Approved': t('offline_requests.status_approved'),
      'Rejected': t('offline_requests.status_rejected'),
      'Completed': t('offline_requests.status_completed')
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  const handleAccept = async (id) => {
    if (!window.confirm(t('offline_requests.accept_confirm'))) return

    try {
      const response = await axiosInstance.post(`/superadmin/offline-requests/${id}/accept`)
      if (response.data.success) {
        alert(t('offline_requests.accept_success'))
        fetchRequests()
      }
    } catch (error) {
      console.error('Error accepting request:', error)
      alert(error.response?.data?.error || t('error'))
    }
  }

  const handleReject = async (id) => {
    const reason = window.prompt(t('offline_requests.reject_reason'))
    if (reason === null) return

    try {
      const response = await axiosInstance.post(`/superadmin/offline-requests/${id}/reject`, {
        rejection_reason: reason || undefined
      })
      if (response.data.success) {
        alert(t('offline_requests.reject_success'))
        fetchRequests()
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      alert(error.response?.data?.error || t('offline_requests.error'))
    }
  }

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'company_name',
      label: t('offline_requests.company'),
      render: (value, row) => row.company_name_from_db || value || t('common.na')
    },
    {
      key: 'request_type',
      label: t('offline_requests.type'),
      render: (value) => <Badge variant="info">{value}</Badge>
    },
    {
      key: 'package_name',
      label: t('offline_requests.package'),
      render: (value) => value ? <span className="text-primary-accent font-medium">{value}</span> : t('common.na')
    },
    {
      key: 'contact_name',
      label: t('offline_requests.contact')
    },
    {
      key: 'amount',
      label: t('offline_requests.amount'),
      render: (value, row) => value ? `EUR ${new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(value)}` : t('common.na')
    },
    {
      key: 'status',
      label: t('offline_requests.status'),
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'created_at',
      label: t('offline_requests.date'),
      render: (value) => new Date(value).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')
    },
    {
      key: 'actions',
      label: t('offline_requests.actions'),
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleView(row)}
            className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
            title={t('offline_requests.view')}
          >
            <IoEye size={18} />
          </button>
          {row.request_type === 'Company Request' && row.status === 'Pending' && (
            <>
              <button
                onClick={() => handleAccept(row.id)}
                className="p-2 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-colors"
                title={t('offline_requests.accept')}
              >
                ✓
              </button>
              <button
                onClick={() => handleReject(row.id)}
                className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                title={t('offline_requests.reject')}
              >
                ✗
              </button>
            </>
          )}
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-primary-accent hover:bg-primary-accent hover:text-white rounded-lg transition-colors"
            title={t('offline_requests.edit')}
          >
            <IoCreate size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
            title={t('offline_requests.delete')}
          >
            <IoTrash size={18} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-text">{t('offline_requests.title')}</h1>
          <p className="text-secondary-text mt-1">{t('offline_requests.description')}</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-accent hover:bg-primary-accent/90 text-white flex items-center gap-2"
        >
          <IoAdd size={20} />
          {t('offline_requests.add_request')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text" size={20} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search_placeholder')}
              className="pl-10"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            >
              <option value="">{t('common.all_status')}</option>
              <option value="Pending">{t('offline_requests.status_pending')}</option>
              <option value="Approved">{t('offline_requests.status_approved')}</option>
              <option value="Rejected">{t('offline_requests.status_rejected')}</option>
              <option value="Completed">{t('offline_requests.status_completed')}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Requests Table */}
      <Card className="p-0">
        <DataTable
          data={requests}
          columns={columns}
          loading={loading}
          emptyMessage={t('no_data')}
        />
      </Card>

      {/* Add/Edit Modal */}
      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          resetForm()
        }}
        title={selectedRequest ? t('offline_requests.edit') : t('offline_requests.add_request')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('company')}
            </label>
            <select
              value={formData.company_id}
              onChange={(e) => {
                const company = companies.find(c => c.id === parseInt(e.target.value))
                setFormData({
                  ...formData,
                  company_id: e.target.value,
                  company_name: company?.name || ''
                })
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            >
              <option value="">{t('select_company')}</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>

          <Input
            label={t('offline_requests.company_name')}
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder={t('offline_requests.company_name')}
            required
          />

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('offline_requests.package')}
            </label>
            <select
              value={formData.package_id}
              onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            >
              <option value="">{t('offline_requests.select_package') || t('companies.select_package')}</option>
              {packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>{pkg.package_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('offline_requests.type')}
            </label>
            <select
              value={formData.request_type}
              onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            >
              <option value="Payment">{t('payment')}</option>
              <option value="Service">{t('service')}</option>
              <option value="Support">{t('support')}</option>
              <option value="Other">{t('other')}</option>
            </select>
          </div>

          <Input
            label={t('contact_name')}
            value={formData.contact_name}
            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            placeholder={t('offline_requests.contact')}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('contact_email')}
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="email@beispiel.de"
            />
            <Input
              label={t('contact_phone')}
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="+491234567890"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('amount')}
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
            />
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                {t('offline_requests.currency') || t('companies.currency')}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              >
                <option value="USD">USD – US Dollar</option>
                <option value="EUR">EUR – Euro</option>
                <option value="GBP">GBP – British Pound</option>
                <option value="INR">INR – Indian Rupee</option>
                <option value="JPY">JPY – Japanese Yen</option>
                <option value="AUD">AUD – Australian Dollar</option>
                <option value="CAD">CAD – Canadian Dollar</option>
                <option value="CHF">CHF – Swiss Franc</option>
                <option value="AED">AED – UAE Dirham</option>
              </select>
            </div>
          </div>

          <Input
            label={t('common.payment_method')}
            value={formData.payment_method}
            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            placeholder={t('common.payment_method')}
          />

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('common.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('common.description')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('status')}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            >
              <option value="Pending">{t('offline_requests.status_pending')}</option>
              <option value="Approved">{t('offline_requests.status_approved')}</option>
              <option value="Rejected">{t('offline_requests.status_rejected')}</option>
              <option value="Completed">{t('offline_requests.status_completed')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('notes')}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                resetForm()
              }}
              className="px-6 py-2.5"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="px-6 py-2.5 bg-primary-accent text-white hover:bg-primary-accent/90"
            >
              {selectedRequest ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* View Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedRequest(null)
        }}
        title={t('offline_requests.view')}
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-text">{t('company')}</p>
                <p className="font-medium">{selectedRequest.company_name_from_db || selectedRequest.company_name || t('na')}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-text">{t('type')}</p>
                <p className="font-medium">{selectedRequest.request_type}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-text">{t('status')}</p>
                {getStatusBadge(selectedRequest.status)}
              </div>
              <div>
                <p className="text-sm text-secondary-text">{t('amount')}</p>
                <p className="font-medium">
                  {selectedRequest.amount ? `EUR ${new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(selectedRequest.amount)}` : t('common.na')}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-text">{t('contact_name')}</p>
                <p className="font-medium">{selectedRequest.contact_name || t('na')}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-text">{t('contact_email')}</p>
                <p className="font-medium">{selectedRequest.contact_email || t('na')}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-text">{t('contact_phone')}</p>
                <p className="font-medium">{selectedRequest.contact_phone || t('na')}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-text">{t('payment_method')}</p>
                <p className="font-medium">{selectedRequest.payment_method || t('na')}</p>
              </div>
            </div>
            {selectedRequest.description && (
              <div>
                <p className="text-sm text-secondary-text mb-1">{t('description_label')}</p>
                <p className="text-primary-text">{selectedRequest.description}</p>
              </div>
            )}
            {selectedRequest.notes && (
              <div>
                <p className="text-sm text-secondary-text mb-1">{t('notes')}</p>
                <p className="text-primary-text">{selectedRequest.notes}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-secondary-text">{t('date')}</p>
              <p className="font-medium">{new Date(selectedRequest.created_at).toLocaleString(language === 'de' ? 'de-DE' : 'en-US')}</p>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setSelectedRequest(null)
                }}
                className="px-6 py-2.5"
              >
                {t('close')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleEdit(selectedRequest)
                }}
                className="px-6 py-2.5 bg-primary-accent text-white hover:bg-primary-accent/90"
              >
                {t('common.edit')}
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default OfflineRequests
