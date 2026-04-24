/**
 * ModulesContext - Global State for Module Settings
 * Controls sidebar menu visibility for Employee dashboards
 * Single source of truth - fetched from DB, applied instantly
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import axiosInstance from '../api/axiosInstance'

const DEFAULT_EMPLOYEE_MENUS = {
  dashboard: true,
  myTasks: true,
  myProjects: true,
  timeTracking: false,
  events: true,
  myProfile: true,
  documents: true,
  attendance: false,
  hrm: false,
  leaveRequests: false,
  messages: false,
  tickets: false,
}

// Create context
const ModulesContext = createContext(null)

/**
 * ModulesProvider component
 * Wraps the app and provides module settings globally
 */
export const ModulesProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [employeeMenus, setEmployeeMenus] = useState(DEFAULT_EMPLOYEE_MENUS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Fetch module settings from backend
   */
  const fetchModuleSettings = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const companyId = user?.company_id ?? user?.companyId ?? localStorage.getItem('companyId') ?? localStorage.getItem('company_id')
      if (!companyId) {
        setLoading(false)
        return
      }

      let response;
      try {
        response = await axiosInstance.get('/module-settings', {
          params: { company_id: companyId }
        })
      } catch (err) {
        if (err.response?.status === 404) {
          console.warn('⚠️ Module settings endpoint not found, using defaults')
          setEmployeeMenus(DEFAULT_EMPLOYEE_MENUS)
          setLoading(false)
          return
        }
        throw err
      }

      if (response.data.success && response.data.data) {
        setEmployeeMenus({ ...DEFAULT_EMPLOYEE_MENUS, ...response.data.data.employee_menus })
      }
    } catch (err) {
      console.error('Error fetching module settings:', err)
      setError(err.message)
      // Keep defaults on error
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  /**
   * Update module settings
   * @param {object} updates - { employee_menus }
   * @returns {Promise<boolean>} Success status
   */
  const updateModuleSettings = useCallback(async (updates) => {
    try {
      const companyId = user?.company_id ?? user?.companyId ?? localStorage.getItem('companyId') ?? localStorage.getItem('company_id')
      if (!companyId) {
        throw new Error('Company ID not found')
      }

      const response = await axiosInstance.put('/module-settings', {
        company_id: companyId,
        ...updates,
      }, {
        params: { company_id: companyId }
      })

      if (response.data.success && response.data.data) {
        // Update local state immediately for instant UI effect
        if (response.data.data.employee_menus) {
          setEmployeeMenus({ ...DEFAULT_EMPLOYEE_MENUS, ...response.data.data.employee_menus })
        }
        return true
      }

      return false
    } catch (err) {
      console.error('Error updating module settings:', err)
      setError(err.message)
      return false
    }
  }, [user])

  /**
   * Update a single employee menu visibility
   * @param {string} menuKey - Menu key (e.g., 'myTasks', 'attendance')
   * @param {boolean} enabled - Whether menu should be visible
   */
  const updateEmployeeMenu = useCallback(async (menuKey, enabled) => {
    const newEmployeeMenus = { ...employeeMenus, [menuKey]: enabled }
    setEmployeeMenus(newEmployeeMenus) // Optimistic update

    const success = await updateModuleSettings({ employee_menus: newEmployeeMenus })
    if (!success) {
      // Revert on failure
      setEmployeeMenus(employeeMenus)
    }
    return success
  }, [employeeMenus, updateModuleSettings])

  /**
   * Reset all module settings to defaults
   */
  const resetToDefaults = useCallback(async () => {
    try {
      const companyId = user?.company_id ?? user?.companyId ?? localStorage.getItem('companyId') ?? localStorage.getItem('company_id')
      if (!companyId) {
        throw new Error('Company ID not found')
      }

      await axiosInstance.post('/module-settings/reset', { company_id: companyId }, {
        params: { company_id: companyId }
      })

      setEmployeeMenus(DEFAULT_EMPLOYEE_MENUS)
      return true
    } catch (err) {
      console.error('Error resetting module settings:', err)
      setError(err.message)
      return false
    }
  }, [user])

  /**
   * Check if a specific employee menu is enabled
   * @param {string} menuKey - Menu key
   * @returns {boolean}
   */
  const isEmployeeMenuEnabled = useCallback((menuKey) => {
    return employeeMenus[menuKey] !== false
  }, [employeeMenus])

  // Fetch settings on mount and when user changes
  useEffect(() => {
    fetchModuleSettings()
  }, [fetchModuleSettings])

  // Context value
  const value = {
    // State
    employeeMenus,
    loading,
    error,

    // Actions
    fetchModuleSettings,
    updateModuleSettings,
    updateEmployeeMenu,
    resetToDefaults,

    // Helpers
    isEmployeeMenuEnabled,

    // Defaults for reference
    DEFAULT_EMPLOYEE_MENUS,
  }

  return (
    <ModulesContext.Provider value={value}>
      {children}
    </ModulesContext.Provider>
  )
}

/**
 * Custom hook to use modules context
 * @returns {object} Modules context value
 */
export const useModules = () => {
  const context = useContext(ModulesContext)
  if (!context) {
    throw new Error('useModules must be used within a ModulesProvider')
  }
  return context
}

export default ModulesContext
