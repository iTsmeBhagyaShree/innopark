import { useState, useEffect } from 'react'
import { usersAPI } from '../../../api'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { IoCreate, IoTrash, IoKey, IoEye } from 'react-icons/io5'
import { useLanguage } from '../../../context/LanguageContext.jsx'

const Users = () => {
  const { t } = useLanguage()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    status: 'Active',
  })

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.getAll({  })
      if (response.data.success) {
        setUsers(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      alert(error.response?.data?.error || t('admin_users_page.alert_fetch_failed'))
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { key: 'name', label: t('admin_users_page.col_name') },
    { key: 'email', label: t('admin_users_page.col_email') },
    {
      key: 'role',
      label: t('admin_users_page.col_role'),
      render: (value) => <Badge variant="info">{value}</Badge>,
    },
    {
      key: 'status',
      label: t('admin_users_page.col_status'),
      render: (value) => (
        <Badge variant={value === 'Active' ? 'success' : 'default'}>
          {value === 'Active' ? t('admin_users_page.status_active') : t('admin_users_page.status_inactive')}
        </Badge>
      ),
    },
  ]

  const handleAdd = () => {
    setFormData({ name: '', email: '', role: 'EMPLOYEE', status: 'Active' })
    setIsAddModalOpen(true)
  }

  const handleView = (user) => {
    setSelectedUser(user)
    setIsViewModalOpen(true)
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    })
    setIsEditModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      alert(t('admin_users_page.alert_name_email_required'))
      return
    }

    try {
      setSaving(true)
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status === 'Active' ? 'active' : 'inactive',
      }

      if (isEditModalOpen && selectedUser) {
        alert(t('admin_users_page.alert_update_not_implemented'))
        setIsEditModalOpen(false)
      } else {
        const response = await usersAPI.create(userData)
        if (response.data.success) {
          alert(t('admin_users_page.alert_created'))
          setIsAddModalOpen(false)
          await fetchUsers()
        }
      }
    } catch (error) {
      console.error('Failed to save user:', error)
      alert(error.response?.data?.error || t('admin_users_page.alert_save_failed'))
    } finally {
      setSaving(false)
    }
  }

  const actions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleView(row)
        }}
        className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
        title={t('admin_users_page.view')}
      >
        <IoEye size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          alert(t('admin_users_page.alert_reset_confirm').replace('{{name}}', row.name))
        }}
        className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
        title={t('admin_users_page.reset_password')}
      >
        <IoKey size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleEdit(row)
        }}
        className="p-2 text-warning hover:bg-warning hover:bg-opacity-10 rounded transition-colors"
        title={t('admin_users_page.edit')}
      >
        <IoCreate size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (window.confirm(t('admin_users_page.alert_delete_confirm').replace('{{name}}', row.name))) {
            try {
              alert(t('admin_users_page.alert_delete_not_implemented'))
            } catch (error) {
              console.error('Failed to delete user:', error)
              alert(error.response?.data?.error || t('admin_users_page.alert_delete_failed'))
            }
          }
        }}
        className="p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded transition-colors"
        title={t('admin_users_page.delete')}
      >
        <IoTrash size={18} />
      </button>
    </div>
  )

  const filterConfig = [
    {
      key: 'status',
      label: t('admin_users_page.filter_status'),
      type: 'select',
      options: [
        { value: 'Active', label: t('admin_users_page.status_active') },
        { value: 'Inactive', label: t('admin_users_page.status_inactive') },
      ],
    },
    {
      key: 'role',
      label: t('admin_users_page.filter_role'),
      type: 'select',
      options: [
        { value: 'ADMIN', label: t('admin_users_page.role_admin') },
        { value: 'EMPLOYEE', label: t('admin_users_page.role_employee') },
      ],
    },
  ]

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">{t('admin_users_page.title')}</h1>
          <p className="text-secondary-text mt-1">{t('admin_users_page.subtitle')}</p>
        </div>
        <div className="text-center py-8">
          <p className="text-secondary-text">{t('admin_users_page.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">{t('admin_users_page.title')}</h1>
          <p className="text-secondary-text mt-1">{t('admin_users_page.subtitle')}</p>
        </div>
        <AddButton onClick={handleAdd} label={t('admin_users_page.add_user')} />
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder={t('admin_users_page.search_placeholder')}
        filters={true}
        filterConfig={filterConfig}
        actions={actions}
        bulkActions={true}
      />

      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
        }}
        title={isAddModalOpen ? t('admin_users_page.modal_add') : t('admin_users_page.modal_edit')}
      >
        <div className="space-y-4">
          <Input
            label={t('admin_users_page.label_name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label={t('admin_users_page.label_email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('admin_users_page.label_role')}</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="ADMIN">{t('admin_users_page.role_admin')}</option>
              <option value="EMPLOYEE">{t('admin_users_page.role_employee')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('admin_users_page.label_status')}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="Active">{t('admin_users_page.status_active')}</option>
              <option value="Inactive">{t('admin_users_page.status_inactive')}</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
              }}
              className="px-4"
            >
              {t('admin_users_page.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSave} className="px-4" disabled={saving}>
              {isAddModalOpen ? t('admin_users_page.save_user') : t('admin_users_page.update_user')}
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* View Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={t('admin_users_page.modal_view')}
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('admin_users_page.label_name')}</label>
              <p className="text-primary-text mt-1 text-base">{selectedUser.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('admin_users_page.label_email')}</label>
              <p className="text-primary-text mt-1 text-base">{selectedUser.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('admin_users_page.label_role')}</label>
              <p className="mt-1">
                <Badge variant="info">{selectedUser.role}</Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">{t('admin_users_page.label_status')}</label>
              <p className="mt-1">
                <Badge variant={selectedUser.status === 'Active' ? 'success' : 'default'}>
                  {selectedUser.status === 'Active' ? t('admin_users_page.status_active') : t('admin_users_page.status_inactive')}
                </Badge>
              </p>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
                className="flex-1"
              >
                {t('admin_users_page.close')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleEdit(selectedUser)
                }}
                className="flex-1"
              >
                {t('admin_users_page.edit')}
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default Users
