import { useState, useEffect } from 'react'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { bankAccountsAPI } from '../../../api'
import { 
  IoAdd,
  IoSearch,
  IoFilter,
  IoChevronDown,
  IoChevronUp,
  IoEllipsisVertical,
  IoCheckmarkCircle,
  IoTrash,
  IoCreate,
  IoEye,
  IoCard as IoCardIcon,
  IoInformationCircle
} from 'react-icons/io5'

const BankAccounts = () => {
  // Get company_id from localStorage
  const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [bankAccounts, setBankAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedBankAccount, setSelectedBankAccount] = useState(null)

  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    accountType: 'checking',
    routingNumber: '',
    swiftCode: '',
    iban: '',
    currency: 'USD',
    openingBalance: '',
    currentBalance: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    contactPerson: '',
    phone: '',
    email: '',
    notes: '',
    status: 'active',
  })

  useEffect(() => {
    fetchBankAccounts()
  }, [searchQuery, statusFilter, companyId])

  const fetchBankAccounts = async () => {
    try {
      setLoading(true)
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        console.error('Invalid companyId for fetchBankAccounts:', companyId)
        setBankAccounts([])
        setLoading(false)
        return
      }
      const response = await bankAccountsAPI.getAll({
        company_id: companyId,
        search: searchQuery,
        status: statusFilter !== 'All' ? statusFilter : undefined
      })
      if (response.data.success) {
        setBankAccounts(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Removed required validations - allow empty data

    if (!companyId || isNaN(companyId) || companyId <= 0) {
      alert('Invalid company ID. Please login again.')
      return
    }

    try {
      const payload = {
        company_id: companyId,
        account_name: formData.accountName,
        account_number: formData.accountNumber,
        bank_name: formData.bankName,
        account_type: formData.accountType,
        routing_number: formData.routingNumber,
        swift_code: formData.swiftCode,
        iban: formData.iban,
        currency: formData.currency,
        opening_balance: parseFloat(formData.openingBalance) || 0,
        current_balance: parseFloat(formData.currentBalance) || parseFloat(formData.openingBalance) || 0,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        contact_person: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        notes: formData.notes,
        status: formData.status === 'active' ? 'Active' : 'Inactive'
      }

      let response
      if (selectedBankAccount) {
        response = await bankAccountsAPI.update(selectedBankAccount.id, payload, { company_id: companyId })
      } else {
        response = await bankAccountsAPI.create(payload)
      }
      
      if (response.data.success) {
        alert('Bank account saved successfully!')
        setIsAddModalOpen(false)
        setIsEditModalOpen(false)
        resetForm()
        // Refresh immediately and also after a delay
        await fetchBankAccounts()
        setTimeout(() => fetchBankAccounts(), 500)
      } else {
        alert(response.data.error || 'Failed to save bank account')
      }
    } catch (error) {
      console.error('Error saving bank account:', error)
      alert(error.response?.data?.error || 'Failed to save bank account')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bank account?')) {
      try {
        const response = await bankAccountsAPI.delete(id, { company_id: companyId })
        if (response.data.success) {
          alert('Bank account deleted successfully!')
          // Refresh immediately and also after a delay
          await fetchBankAccounts()
          setTimeout(() => fetchBankAccounts(), 500)
        } else {
          alert(response.data.error || 'Failed to delete bank account')
        }
      } catch (error) {
        console.error('Error deleting bank account:', error)
        alert(error.response?.data?.error || 'Failed to delete bank account')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      accountName: '',
      accountNumber: '',
      bankName: '',
      accountType: 'checking',
      routingNumber: '',
      swiftCode: '',
      iban: '',
      currency: 'USD',
      openingBalance: '',
      currentBalance: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      contactPerson: '',
      phone: '',
      email: '',
      notes: '',
      status: 'active',
    })
    setSelectedBankAccount(null)
  }

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (value) => (
        <button className="flex items-center gap-1 hover:text-primary-accent font-semibold text-primary-text">
          {value}
          <div className="flex flex-col">
            <IoChevronUp size={10} className="-mb-1 opacity-30" />
            <IoChevronDown size={10} className="opacity-30" />
          </div>
        </button>
      ),
    },
    {
      key: 'account_name',
      label: 'Account Name',
      render: (value) => (
        <div className="flex items-center gap-2">
          <IoCardIcon className="text-primary-accent" size={18} />
          <span className="text-primary-text font-medium">{value || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'account_number',
      label: 'Account Number',
      render: (value) => (
        <span className="text-primary-text">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'bank_name',
      label: 'Bank Name',
      render: (value) => (
        <span className="text-primary-text">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'account_type',
      label: 'Type',
      render: (value) => (
        <Badge variant="default">{value || 'N/A'}</Badge>
      ),
    },
    {
      key: 'currency',
      label: 'Currency',
      render: (value) => (
        <span className="text-primary-text">{value || 'USD'}</span>
      ),
    },
    {
      key: 'current_balance',
      label: 'Balance',
      render: (value, row) => (
        <span className="font-semibold text-primary-text">
          {row.currency || 'USD'} {parseFloat(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge variant={value === 'Active' || value === 'active' ? 'success' : 'default'}>
          {value || 'Active'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedBankAccount(row)
              setIsViewModalOpen(true)
            }}
            className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
            title="View"
          >
            <IoEye size={18} />
          </button>
          <button
            onClick={() => {
              setSelectedBankAccount(row)
              setFormData({
                accountName: row.account_name || '',
                accountNumber: row.account_number || '',
                bankName: row.bank_name || '',
                accountType: row.account_type || 'checking',
                routingNumber: row.routing_number || '',
                swiftCode: row.swift_code || '',
                iban: row.iban || '',
                currency: row.currency || 'USD',
                openingBalance: row.opening_balance || '',
                currentBalance: row.current_balance || '',
                address: row.address || '',
                city: row.city || '',
                state: row.state || '',
                zip: row.zip || '',
                country: row.country || '',
                contactPerson: row.contact_person || '',
                phone: row.phone || '',
                email: row.email || '',
                notes: row.notes || '',
                status: row.status?.toLowerCase() || 'active',
              })
              setIsEditModalOpen(true)
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <IoCreate size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <IoTrash size={18} />
          </button>
        </div>
      ),
    },
  ]

  const filteredBankAccounts = bankAccounts.filter(account => {
    if (searchQuery && !account.account_name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !account.bank_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (statusFilter !== 'All' && account.status?.toLowerCase() !== statusFilter.toLowerCase()) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">Bank Accounts</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">Manage bank accounts and transactions</p>
        </div>
        <Button variant="primary" onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="flex items-center gap-2">
          <IoAdd size={18} />
          Add Bank Account
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bank accounts..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              />
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text" size={18} />
            </div>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <IoFilter size={18} />
              Filters
              <IoChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Bank Accounts Table */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary-text">Loading bank accounts...</p>
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.map((column, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBankAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-secondary-text">
                      No bank accounts found
                    </td>
                  </tr>
                ) : (
                  filteredBankAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      {columns.map((column, idx) => (
                        <td key={idx} className="px-4 py-3">
                          {column.render ? column.render(account[column.key], account) : (account[column.key] || '')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Bank Account Modal */}
      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          resetForm()
        }}
        title={isEditModalOpen ? 'Edit Bank Account' : 'Add Bank Account'}
      >
        <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div>
            <h3 className="text-lg font-semibold text-primary-text mb-4">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Account Name
                </label>
                <Input
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="e.g., Primary Account"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Account Number
                </label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Bank Name
                </label>
                <Input
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Account Type
                </label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                  <option value="deposit">Deposit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Routing Number
                </label>
                <Input
                  value={formData.routingNumber}
                  onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                  placeholder="Enter routing number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  SWIFT Code
                </label>
                <Input
                  value={formData.swiftCode}
                  onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                  placeholder="Enter SWIFT code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  IBAN
                </label>
                <Input
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  placeholder="Enter IBAN"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (€)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Opening Balance
                </label>
                <Input
                  type="number"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Current Balance
                </label>
                <Input
                  type="number"
                  value={formData.currentBalance}
                  onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-primary-text mb-4">Bank Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Address
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter bank address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  City
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  State
                </label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  ZIP Code
                </label>
                <Input
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  placeholder="Enter ZIP code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Country
                </label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-primary-text mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Contact Person
                </label>
                <Input
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Enter contact person name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Phone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none"
              placeholder="Enter any additional notes"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <IoCheckmarkCircle size={18} />
              Save
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* View Bank Account Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Bank Account Details"
      >
        {selectedBankAccount && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-secondary-text">Account Name</label>
              <p className="text-primary-text mt-1">{selectedBankAccount.account_name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Account Number</label>
              <p className="text-primary-text mt-1">{selectedBankAccount.account_number || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Bank Name</label>
              <p className="text-primary-text mt-1">{selectedBankAccount.bank_name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Account Type</label>
              <p className="text-primary-text mt-1">{selectedBankAccount.account_type || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Current Balance</label>
              <p className="text-primary-text mt-1 font-semibold">
                {selectedBankAccount.currency || 'USD'} {parseFloat(selectedBankAccount.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Status</label>
              <div className="mt-1">
                <Badge variant={selectedBankAccount.status === 'Active' || selectedBankAccount.status === 'active' ? 'success' : 'default'}>
                  {selectedBankAccount.status || 'Active'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default BankAccounts

