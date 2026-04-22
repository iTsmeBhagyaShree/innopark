import { useState, useEffect } from 'react'
import AddButton from '../../../components/ui/AddButton'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Button from '../../../components/ui/Button'
import axiosInstance from '../../../api/axiosInstance'
import { IoCreate, IoTrash, IoEye, IoSearch, IoFilter, IoClose } from 'react-icons/io5'
import { useLanguage } from '../../../context/LanguageContext'

const Users = () => {
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN',
    company_id: '',
    status: 'Active',
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchCompanies()
  }, [roleFilter, companyFilter, statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers()
    }, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/superadmin/users', {
        params: {
          search: searchQuery,
          role: roleFilter || undefined,
          company_id: companyFilter || undefined
        }
      })
      if (response.data.success) {
        let filteredUsers = response.data.data || []
        
        if (statusFilter) {
          filteredUsers = filteredUsers.filter(user => user.status === statusFilter)
        }
        
        setUsers(filteredUsers)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'ADMIN',
      company_id: '',
      status: 'Active',
    })
    setShowPassword(false)
    setIsAddModalOpen(true)
  }

  const handleEdit = async (user) => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(`/superadmin/users/${user.id}`)
      if (response.data.success) {
        const userData = response.data.data
        setSelectedUser(user)
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          password: '',
          role: userData.role || 'ADMIN',
          company_id: userData.company_id?.toString() || '',
          status: userData.status || 'Active',
        })
        setIsEditModalOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      alert(error.response?.data?.error || t('load_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (user) => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(`/superadmin/users/${user.id}`)
      if (response.data.success) {
        setSelectedUser(response.data.data)
        setIsViewModalOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setSelectedUser(user)
      setIsViewModalOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('delete_confirm'))) return

    try {
      await axiosInstance.delete(`/superadmin/users/${id}`)
      alert(t('delete_success'))
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(error.response?.data?.error || t('error'))
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.name.trim()) {
      alert(t('name_required'))
      return
    }

    if (!formData.email || !formData.email.trim()) {
      alert(t('email_required'))
      return
    }

    if (isAddModalOpen && !formData.password) {
      alert(t('password_required'))
      return
    }

    if (!formData.role) {
      alert(t('role_required'))
      return
    }

    try {
      setSaving(true)
      
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        company_id: formData.company_id ? parseInt(formData.company_id) : null,
        status: formData.status,
      }

      if (formData.password) {
        userData.password = formData.password
      }

      if (isEditModalOpen && selectedUser) {
        await axiosInstance.put(`/superadmin/users/${selectedUser.id}`, userData)
        alert(t('save_success'))
      } else {
        await axiosInstance.post('/superadmin/users', userData)
        alert(t('save_success'))
      }

      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
      setSelectedUser(null)
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error('Error saving user:', error)
      alert(error.response?.data?.error || t('error'))
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'ADMIN',
      company_id: '',
      status: 'Active',
    })
    setShowPassword(false)
    setSelectedUser(null)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setRoleFilter('')
    setCompanyFilter('')
    setStatusFilter('')
  }

  const hasActiveFilters = searchQuery || roleFilter || companyFilter || statusFilter

  const columns = [
    { 
      key: 'name', 
      label: t('name'),
      className: 'font-medium text-primary-text'
    },
    { 
      key: 'email', 
      label: t('email'),
      className: 'text-secondary-text'
    },
    {
      key: 'role',
      label: t('role'),
      render: (value) => (
        <Badge variant={value === 'ADMIN' ? 'info' : value === 'SUPERADMIN' ? 'default' : 'default'}>
          {value}
        </Badge>
      ),
    },
    { 
      key: 'company_name', 
      label: t('company'),
      className: 'text-secondary-text'
    },
    {
      key: 'status',
      label: t('status'),
      render: (value) => (
        <Badge variant={value === 'Active' ? 'success' : 'warning'}>
          {value === 'Active' ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: t('created_at'),
      render: (value) => (
        <span className="text-sm text-secondary-text">
          {new Date(value).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: t('actions'),
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleView(row)}
            className="p-2 text-primary-accent hover:bg-primary-accent/10 rounded-lg transition-colors"
            title={t('view')}
          >
            <IoEye size={18} />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('edit')}
          >
            <IoCreate size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title={t('delete')}
          >
            <IoTrash size={18} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">{t('users.title')}</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">{t('users.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <IoFilter size={18} />
            {t('filter')}
            {hasActiveFilters && (
              <span className="bg-primary-accent text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {[searchQuery, roleFilter, companyFilter, statusFilter].filter(Boolean).length}
              </span>
            )}
          </Button>
          <AddButton onClick={handleAdd} label={t('users.add_user')} />
        </div>
      </div>

      {/* Filters */}
      {(showFilters || hasActiveFilters) && (
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary-text">{t('filter')}</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-accent hover:underline flex items-center gap-1"
              >
                <IoClose size={16} />
                {t('common.clear_all')}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text" size={20} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search_placeholder')}
                className="pl-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">{t('role')}</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none text-sm"
              >
                <option value="">{t('users.all_roles')}</option>
                <option value="SUPERADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">{t('company')}</label>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none text-sm"
              >
                <option value="">{t('users.all_companies')}</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">{t('status')}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent outline-none text-sm"
              >
                <option value="">{t('users.all_status')}</option>
                <option value="Active">{t('active')}</option>
                <option value="Inactive">{t('inactive')}</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary-text">
              {t('users.users_count')?.replace('{{count}}', users.length)}
            </h3>
          </div>
        </div>
        <DataTable
          data={users}
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
          setSelectedUser(null)
          resetForm()
        }}
        title={isAddModalOpen ? t('users.add_user') : t('users.edit_user')}
      >
        <div className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('name')} <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('common.name')}
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('email')} <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('common.email')}
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {isAddModalOpen ? t('users.password') : t('users.new_password')} {isAddModalOpen && <span className="text-red-500">*</span>}
              {!isAddModalOpen && <span className="text-xs text-secondary-text ml-2">({t('users.leave_empty_to_keep')})</span>}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={isAddModalOpen ? t('users.password') : t('users.new_password')}
                required={isAddModalOpen}
                className="w-full pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-text hover:text-primary-text text-sm"
              >
                {showPassword ? t('users.hide') : t('users.show')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('role')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-sm"
              required
            >
              <option value="ADMIN">Admin</option>
              {/* <option value="SUPERADMIN">Super Admin</option> */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('company')}
            </label>
            <select
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-sm"
            >
              <option value="">{t('users.select_company_optional')}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              {t('status')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-sm"
              required
            >
              <option value="Active">{t('active')}</option>
              <option value="Inactive">{t('inactive')}</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? t('common.saving') : isAddModalOpen ? t('common.create') : t('common.update')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                setSelectedUser(null)
                resetForm()
              }}
              className="flex-1 sm:flex-initial"
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* View Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedUser(null)
        }}
        title={t('users.user_details')}
      >
        {selectedUser && (
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('name')}</label>
              <p className="text-primary-text mt-1.5 text-base font-medium">{selectedUser.name || t('na')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('email')}</label>
              <p className="text-primary-text mt-1.5 text-base">{selectedUser.email || t('na')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('role')}</label>
              <div className="mt-1.5">
                <Badge variant={selectedUser.role === 'ADMIN' ? 'info' : 'default'}>
                  {selectedUser.role || t('na')}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('company')}</label>
              <p className="text-primary-text mt-1.5 text-base">{selectedUser.company_name || t('not_assigned')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('status')}</label>
              <div className="mt-1.5">
                <Badge variant={selectedUser.status === 'Active' ? 'success' : 'warning'}>
                  {selectedUser.status === 'Active' ? t('active') : selectedUser.status === 'Inactive' ? t('inactive') : selectedUser.status || t('na')}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('created_at')}</label>
              <p className="text-primary-text mt-1.5 text-base">
                {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString(language === 'de' ? 'de-DE' : 'en-US') : t('na')}
              </p>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default Users
