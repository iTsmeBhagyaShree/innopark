import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { IoCreate, IoTrash, IoEye, IoSettingsOutline, IoChevronDown, IoChevronUp, IoCheckmarkCircle, IoArrowBack } from 'react-icons/io5'
import Badge from '../../../components/ui/Badge'
import rolesAPI from '../../../api/roles'
import { useLanguage } from '../../../context/LanguageContext.jsx'

const RolesPermissions = () => {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const moduleParam = searchParams.get('module')
  const typeParam = searchParams.get('type')
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState(null)

  // Data for New Role
  const [roleFormData, setRoleFormData] = useState({
    roleName: '',
    description: ''
  })

  // Data for Permissions
  // Structure: { [module]: { view: bool, add: bool, edit: bool, delete: bool, expanded: bool } }
  const [permissionsData, setPermissionsData] = useState({})

  const modules = [
    'leads', 'projects', 'tasks',
    'products', 'invoices', 'estimates', 'proposals',
    'payments', 'expenses', 'contracts',
    'employees', 'attendance', 'leaves',
    'events', 'messages', 'tickets',
    'reports', 'settings', 'notice_board'
  ]

  useEffect(() => {
    fetchRoles()
  }, [])

  // Auto-open permission modal if moduleParam is provided and roles are loaded
  useEffect(() => {
    if (moduleParam && roles.length > 0 && !isPermissionModalOpen) {
      // Find CLIENT or EMPLOYEE role based on typeParam
      const roleToOpen = roles.find(r => {
        const roleName = r.role_name?.toUpperCase()
        if (typeParam === 'employee') {
          return roleName === 'EMPLOYEE'
        }
        return false
      })
      
      if (roleToOpen) {
        openPermissionModal(roleToOpen)
      }
    }
  }, [moduleParam, roles, typeParam])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await rolesAPI.getAll()
      if (response.data.success) {
        setRoles(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast.error(t('roles.errors.load_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddRole = async () => {
    try {
      if (!roleFormData.roleName) {
        toast.error(t('roles.errors.role_name_required'))
        return
      }
      const response = await rolesAPI.create({ roleName: roleFormData.roleName, description: roleFormData.description })
      if (response.data.success) {
        toast.success(t('roles.success.created'))
        setIsAddModalOpen(false)
        setRoleFormData({ roleName: '', description: '' })
        fetchRoles()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || t('roles.errors.create_failed'))
    }
  }

  const handleDeleteRole = async (id) => {
    if (!window.confirm(t('roles.confirm.delete_role'))) return;
    try {
      const response = await rolesAPI.delete(id)
      if (response.data.success) {
        toast.success(t('roles.success.deleted'))
        fetchRoles()
      }
    } catch (error) {
      toast.error(t('roles.errors.delete_failed'))
    }
  }

  const openPermissionModal = async (role) => {
    setSelectedRole(role)
    setLoading(true)

    // Initialize permissions state
    const initialPerms = {}
    modules.forEach(m => {
      initialPerms[m] = { can_view: false, can_add: false, can_edit: false, can_delete: false, expanded: false }
    })

    try {
      const response = await rolesAPI.getPermissions(role.id)
      if (response.data.success) {
        const dbPerms = response.data.data
        dbPerms.forEach(p => {
          if (initialPerms[p.module]) {
            initialPerms[p.module] = {
              can_view: !!p.can_view,
              can_add: !!p.can_add,
              can_edit: !!p.can_edit,
              can_delete: !!p.can_delete,
              expanded: false
            }
          }
        })
      }
      // Auto-expand the module if moduleParam is provided
      if (moduleParam && initialPerms[moduleParam]) {
        initialPerms[moduleParam].expanded = true
      }
      
      setPermissionsData(initialPerms)
      setIsPermissionModalOpen(true)
    } catch (error) {
      toast.error('Failed to fetch permissions')
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (module, type, value) => {
    setPermissionsData(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [type]: value
      }
    }))
  }

  const toggleModuleAll = (module, value) => {
    setPermissionsData(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        can_view: value,
        can_add: value,
        can_edit: value,
        can_delete: value
      }
    }))
  }

  // Filter modules if moduleParam is provided
  const filteredModules = moduleParam 
    ? modules.filter(m => m === moduleParam)
    : modules

  const toggleExpand = (module) => {
    setPermissionsData(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        expanded: !prev[module].expanded
      }
    }))
  }

  const savePermissions = async () => {
    try {
      const payload = Object.entries(permissionsData).map(([module, perms]) => ({
        module,
        can_view: perms.can_view,
        can_add: perms.can_add,
        can_edit: perms.can_edit,
        can_delete: perms.can_delete
      }))

      await rolesAPI.updatePermissions(selectedRole.id, payload)
      toast.success('Permissions updated successfully')
      setIsPermissionModalOpen(false)
    } catch (error) {
      toast.error('Failed to update permissions')
    }
  }

  const columns = [
    {
      key: 'role_name', label: 'Role Name',
      render: (val) => <span className="font-semibold text-primary-text">{val}</span>
    },
    {
      key: 'description', label: 'Description',
      render: (val) => <span className="text-secondary-text">{val || '-'}</span>
    },
  ]

  const actions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => openPermissionModal(row)}
        className="p-2 text-primary-accent hover:bg-primary-accent/10 rounded transition-colors flex items-center gap-1"
        title={t('common.manage_permissions')}
      >
        <IoSettingsOutline size={18} />
      </button>
      {/* Protect default roles */}
      {!['ADMIN', 'EMPLOYEE', 'MANAGER'].includes(row.role_name?.toUpperCase()) && (
        <button
          onClick={() => handleDeleteRole(row.id)}
          className="p-2 text-danger hover:bg-danger/10 rounded transition-colors"
          title={t('common.delete_role')}
        >
          <IoTrash size={18} />
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {moduleParam && (
            <button
              onClick={() => navigate('/app/admin/settings/modules')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={t('common.back_to_module_settings')}
            >
              <IoArrowBack size={20} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-primary-text">
              {moduleParam
                ? `${t('roles.permissions_title')}: ${moduleParam.charAt(0).toUpperCase() + moduleParam.slice(1).replace('_', ' ')}`
                : t('roles.title')}
            </h1>
            <p className="text-secondary-text mt-1">
              {moduleParam ? t('roles.permissions_subtitle') : t('roles.subtitle')}
            </p>
          </div>
        </div>
        {!moduleParam && (
          <AddButton onClick={() => setIsAddModalOpen(true)} label={t('roles.add_new')} />
        )}
      </div>

      <DataTable
        columns={columns}
        data={roles}
        searchPlaceholder={t('roles.search_placeholder')}
        actions={actions}
        loading={loading}
      />

      {/* Add Role Modal */}
      <RightSideModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('common.create_role')}
        width="w-[500px]"
      >
        <div className="space-y-6">
          <Input
            label={t('roles.fields.role_name')}
            placeholder={t('roles.fields.role_name_placeholder')}
            value={roleFormData.roleName}
            onChange={(e) => setRoleFormData({ ...roleFormData, roleName: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('roles.fields.description')}</label>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-accent focus:ring-primary-accent sm:text-sm p-2 bg-white"
              rows={3}
              value={roleFormData.description}
              onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddRole}>{t('common.create')}</Button>
          </div>
        </div>
      </RightSideModal>

      {/* Permissions Modal */}
      <RightSideModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        title={`Permissions: ${selectedRole?.role_name}`}
        width="w-[800px]"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 border border-blue-100">
            {t('roles.permissions_help')}
          </div>

          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-4 py-3 grid grid-cols-12 gap-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">{t('auto.auto_e55f75a2') || 'Module'}</div>
              <div className="col-span-8 flex justify-between items-center">
                <span>{t('') || ''}</span>
                <span className="text-xs normal-case font-normal text-gray-400">{t('') || ''}</span>
              </div>
            </div>

            {/* Modules List */}
            {filteredModules.map(module => {
              const data = permissionsData[module] || { can_view: false, expanded: false }
              // Determine if "All" is selected (if all granular are true)
              const isAll = data.can_view && data.can_add && data.can_edit && data.can_delete
              const isAny = data.can_view || data.can_add || data.can_edit || data.can_delete

              return (
                <div key={module} className="bg-white transition-colors hover:bg-gray-50/50">
                  {/* Top Row */}
                  <div className="px-4 py-3 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-accent focus:ring-primary-accent h-4 w-4 cursor-pointer"
                        checked={isAll}
                        ref={input => {
                          if (input) input.indeterminate = isAny && !isAll
                        }}
                        onChange={(e) => toggleModuleAll(module, e.target.checked)}
                        title="Full Access - Enable all permissions"
                      />
                      <span className="font-medium text-gray-900 capitalize">{module.replace('_', ' ')}</span>
                    </div>

                    <div className="col-span-8 flex justify-end">
                      <button
                        onClick={() => toggleExpand(module)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${data.expanded
                            ? 'bg-primary-accent/10 text-primary-accent'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {data.expanded ? 'Hide Details' : 'More Options'}
                        {data.expanded ? <IoChevronUp /> : <IoChevronDown />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details - Always show if moduleParam is set */}
                  {(data.expanded || moduleParam) && (
                    <div className="px-4 pb-4 pl-12 grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-1">
                      <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-blue-50 border border-gray-200 transition-colors">
                        <input
                          type="checkbox"
                          checked={data.can_view}
                          onChange={(e) => handlePermissionChange(module, 'can_view', e.target.checked)}
                          className="rounded border-gray-300 text-primary-accent h-4 w-4"
                        />
                        <div>
                          <span className="text-sm font-medium block">{t('') || ''}</span>
                          <span className="text-xs text-gray-500">{t('') || ''}</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-green-50 border border-gray-200 transition-colors">
                        <input
                          type="checkbox"
                          checked={data.can_add}
                          onChange={(e) => handlePermissionChange(module, 'can_add', e.target.checked)}
                          className="rounded border-gray-300 text-primary-accent h-4 w-4"
                        />
                        <div>
                          <span className="text-sm font-medium block">{t('') || ''}</span>
                          <span className="text-xs text-gray-500">{t('') || ''}</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-yellow-50 border border-gray-200 transition-colors">
                        <input
                          type="checkbox"
                          checked={data.can_edit}
                          onChange={(e) => handlePermissionChange(module, 'can_edit', e.target.checked)}
                          className="rounded border-gray-300 text-primary-accent h-4 w-4"
                        />
                        <div>
                          <span className="text-sm font-medium block">{t('') || ''}</span>
                          <span className="text-xs text-gray-500">{t('') || ''}</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-red-50 border border-gray-200 transition-colors">
                        <input
                          type="checkbox"
                          checked={data.can_delete}
                          onChange={(e) => handlePermissionChange(module, 'can_delete', e.target.checked)}
                          className="rounded border-gray-300 text-primary-accent h-4 w-4"
                        />
                        <div>
                          <span className="text-sm font-medium block">{t('') || ''}</span>
                          <span className="text-xs text-gray-500">{t('') || ''}</span>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsPermissionModalOpen(false)}>{t('') || ''}</Button>
            <Button onClick={savePermissions}>{t('auto.auto_b939b52f') || 'Save Permission Settings'}</Button>
          </div>
        </div>
      </RightSideModal>
    </div>
  )
}

export default RolesPermissions
