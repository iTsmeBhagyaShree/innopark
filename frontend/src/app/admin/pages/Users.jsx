import { useState, useEffect } from 'react'
import { usersAPI } from '../../../api'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { IoCreate, IoTrash, IoKey, IoEye } from 'react-icons/io5'

const Users = () => {
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
      alert(error.response?.data?.error || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (value) => <Badge variant="info">{value}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge variant={value === 'Active' ? 'success' : 'default'}>{value}</Badge>
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
      alert('Name and email are required')
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
        // Note: usersAPI might not have update method, check backend
        alert('Update functionality needs backend API endpoint')
        setIsEditModalOpen(false)
      } else {
        const response = await usersAPI.create(userData)
        if (response.data.success) {
          alert('User created successfully!')
          setIsAddModalOpen(false)
          await fetchUsers()
        }
      }
    } catch (error) {
      console.error('Failed to save user:', error)
      alert(error.response?.data?.error || 'Failed to save user')
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
        title="View"
      >
        <IoEye size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          alert(`Reset password for ${row.name}?`)
        }}
        className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
        title="Reset Password"
      >
        <IoKey size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleEdit(row)
        }}
        className="p-2 text-warning hover:bg-warning hover:bg-opacity-10 rounded transition-colors"
        title="Edit"
      >
        <IoCreate size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (window.confirm(`Delete user ${row.name}?`)) {
            try {
              // Note: usersAPI might not have delete method, check backend
              alert('Delete functionality needs backend API endpoint')
              // await usersAPI.delete(row.id)
              // await fetchUsers()
            } catch (error) {
              console.error('Failed to delete user:', error)
              alert(error.response?.data?.error || 'Failed to delete user')
            }
          }
        }}
        className="p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded transition-colors"
        title="Delete"
      >
        <IoTrash size={18} />
      </button>
    </div>
  )

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Users</h1>
          <p className="text-secondary-text mt-1">Manage system users</p>
        </div>
        <div className="text-center py-8">
          <p className="text-secondary-text">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Users</h1>
          <p className="text-secondary-text mt-1">Manage system users</p>
        </div>
        <AddButton onClick={handleAdd} label="Add User" />
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search users..."
        filters={true}
        filterConfig={[
          { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
          { key: 'role', label: 'Role', type: 'select', options: ['ADMIN', 'EMPLOYEE'] },
        ]}
        actions={actions}
        bulkActions={true}
      />

      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
        }}
        title={isAddModalOpen ? 'Add New User' : 'Edit User'}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="ADMIN">Admin</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
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
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} className="px-4">
              {isAddModalOpen ? 'Save User' : 'Update User'}
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* View Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="User Details"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-secondary-text">Name</label>
              <p className="text-primary-text mt-1 text-base">{selectedUser.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Email</label>
              <p className="text-primary-text mt-1 text-base">{selectedUser.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Role</label>
              <p className="mt-1">
                <Badge variant="info">{selectedUser.role}</Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Status</label>
              <p className="mt-1">
                <Badge variant={selectedUser.status === 'Active' ? 'success' : 'default'}>
                  {selectedUser.status}
                </Badge>
              </p>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleEdit(selectedUser)
                }}
                className="flex-1"
              >
                Edit
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>
    </div>
  )
}

export default Users
