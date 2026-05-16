/**
 * PermissionsContext - Global State for User Permissions
 * Checks user permissions for modules based on module_settings
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import axiosInstance from '../api/axiosInstance'

// Create context
const PermissionsContext = createContext(null)

/**
 * PermissionsProvider component
 * Provides permission checking functionality
 */
export const PermissionsProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [modulePermissions, setModulePermissions] = useState({})
  const [strictRbac, setStrictRbac] = useState(false)
  const [loading, setLoading] = useState(true)

  /**
   * Fetch user permissions from backend
   */
  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setStrictRbac(false)
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const rbacRoleNum = parseInt(String(user.rbac_role_id ?? ''), 10)
      const useStrictRbac =
        user.role === 'EMPLOYEE' &&
        Number.isFinite(rbacRoleNum) &&
        rbacRoleNum > 0

      if (useStrictRbac) {
        const rbacPerm = user.rbac_permissions && typeof user.rbac_permissions === 'object'
          ? user.rbac_permissions
          : {}
        setModulePermissions(rbacPerm)
        setStrictRbac(true)
        setLoading(false)
        return
      }

      setStrictRbac(false)

      const companyId = user?.company_id ?? user?.companyId ?? localStorage.getItem('companyId') ?? localStorage.getItem('company_id')

      if (!companyId) {
        setLoading(false)
        return
      }

      const response = await axiosInstance.get('/module-settings', {
        params: { company_id: companyId }
      })

      if (response.data && response.data.success) {
        const data = response.data.data
        const perms = data.module_permissions || {}
        setModulePermissions(perms)
      }
    } catch (axErr) {
      if (axErr.response?.status === 404) {
        setModulePermissions({})
      } else {
        console.error('Error fetching permissions:', axErr)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  /**
   * Check if user has permission for a module
   * @param {string} moduleKey - Module key (e.g., 'myTasks', 'proposals')
   * @param {string} permission - 'can_view', 'can_add', 'can_edit', 'can_delete'
   * @returns {boolean}
   */
  const hasPermission = useCallback((moduleKey, permission = 'can_view') => {
    if (user?.role === 'SUPERADMIN' || user?.role === 'ADMIN') {
      return true
    }

    if (loading) {
      return true
    }

    // Assigned RBAC role on hire: only modules listed in role_permissions are accessible
    if (user?.role === 'EMPLOYEE' && strictRbac) {
      const mod = modulePermissions[moduleKey]
      if (!mod) return false
      const perm = mod[permission]
      if (perm === false || perm === 0) return false
      if (perm === true || perm === 1) return true
      return false
    }

    if (modulePermissions[moduleKey]) {
      const perm = modulePermissions[moduleKey][permission]
      if (perm === false || perm === 0) return false
      if (perm === true || perm === 1) return true
      return true
    }

    return true
  }, [modulePermissions, user, loading, strictRbac])

  /**
   * Check if user can view a module
   */
  const canView = useCallback((moduleKey) => {
    return hasPermission(moduleKey, 'can_view')
  }, [hasPermission])

  /**
   * Check if user can add to a module
   */
  const canAdd = useCallback((moduleKey) => {
    return hasPermission(moduleKey, 'can_add')
  }, [hasPermission])

  /**
   * Check if user can edit a module
   */
  const canEdit = useCallback((moduleKey) => {
    return hasPermission(moduleKey, 'can_edit')
  }, [hasPermission])

  /**
   * Check if user can delete from a module
   */
  const canDelete = useCallback((moduleKey) => {
    return hasPermission(moduleKey, 'can_delete')
  }, [hasPermission])

  // Fetch permissions on mount and when user changes
  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  // Context value
  const value = {
    modulePermissions,
    strictRbac,
    loading,
    hasPermission,
    canView,
    canAdd,
    canEdit,
    canDelete,
    refreshPermissions: fetchPermissions,
  }

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

/**
 * Custom hook to use permissions context
 */
export const usePermissions = () => {
  const context = useContext(PermissionsContext)
  // Return default values if context is not available (prevents errors)
  if (!context) {
    return {
      modulePermissions: {},
      strictRbac: false,
      loading: false,
      hasPermission: () => true,
      canView: () => true,
      canAdd: () => true,
      canEdit: () => true,
      canDelete: () => true,
      refreshPermissions: () => { },
    }
  }
  return context
}

export default PermissionsContext
