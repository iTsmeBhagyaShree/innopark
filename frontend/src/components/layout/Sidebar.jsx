import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useModules } from '../../context/ModulesContext'
import { usePermissions } from '../../context/PermissionsContext'
import { IoClose, IoChevronDown, IoLogOut, IoChevronForward } from 'react-icons/io5'
import adminSidebarData from '../../config/adminSidebarData'
import employeeSidebarData from '../../config/employeeSidebarData'
import superAdminSidebarData from '../../config/superAdminSidebarData'

import { useLanguage } from '../../context/LanguageContext.jsx'

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { employeeMenus } = useModules()
  const { canView, loading: permissionsLoading, modulePermissions } = usePermissions()
  const isDark = theme.mode === 'dark'
  const location = useLocation()
  const navigate = useNavigate()

  /**
   * ACCORDION STATE - Single source of truth
   * Only ONE dropdown can be open at a time
   * Value: string (menu path) or null (all closed)
   */
  const [activeMenu, setActiveMenu] = useState(null)

  /**
   * Track previous pathname to detect actual route changes
   * This prevents auto-expand from overriding user clicks
   */
  const prevPathnameRef = useRef(null) // Start with null to trigger initial expand

  /**
   * Track if this is the first mount - for initial auto-expand
   */
  const isFirstMountRef = useRef(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Check if a path matches the current location (path + search so only one menu highlights)
  const isActive = (path) => {
    const [pathBase, pathSearch] = path.split('?')


    // EXACT MATCH ONLY: Settings base path should not activate for child routes
    // e.g. /app/admin/settings should NOT match /app/admin/settings/pipelines
    const exactMatchPaths = ['/app/admin/settings', '/app/employee/settings']
    if (exactMatchPaths.includes(pathBase)) {
      return location.pathname === pathBase
    }

    const pathnameMatch = location.pathname === pathBase || location.pathname.startsWith(pathBase + '/')
    if (!pathnameMatch) return false
    if (pathSearch && pathSearch.trim()) {
      const query = new URLSearchParams(location.search)
      const pathParams = new URLSearchParams(pathSearch.trim())
      for (const [k, v] of pathParams) {
        if (query.get(k) !== v) return false
      }
      return true
    }
    // Path has no query: active only when current URL has no conflicting query (e.g. context=project)
    if (location.search && location.search.includes('context=project')) return false
    return true
  }

  // Close mobile sidebar when menu item is clicked
  const handleMenuItemClick = () => {
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  /**
   * ACCORDION TOGGLE LOGIC
   * - If clicking the currently active menu → close it (set to null)
   * - If clicking a different menu → open it (close previous automatically)
   * This ensures only ONE dropdown is open at any time
   */
  const toggleSubmenu = useCallback((menuPath) => {
    setActiveMenu((currentActive) => {
      // If this menu is already open, close it
      if (currentActive === menuPath) {
        return null
      }
      // Otherwise, open this menu (automatically closes any other)
      return menuPath
    })
  }, [])

  /**
   * Helper to check if the active menu is a descendant of the current item
   * This allows nested dropdowns (like CRM > Sales) to both stay open
   */
  const isDescendantActive = useCallback((item, activePath) => {
    if (!item.children || !activePath) return false
    return item.children.some(child =>
      child.path === activePath || isDescendantActive(child, activePath)
    )
  }, [])

  /**
   * Filter menu items based on permissions
   * @param {Array} menuItems - Raw menu items from sidebar data
   * @param {Object} moduleSettings - Module settings (employeeMenus)
   * @returns {Array} Filtered menu items
   */
  const filterMenusByModuleSettings = useCallback((menuItems, moduleSettings) => {
    if (!moduleSettings) return menuItems

    return menuItems.filter(item => {
      // Keep section dividers (items with only 'section' property)
      if (item.section && !item.label) {
        return true
      }

      // Check if this menu has a moduleKey and if user has view permission
      if (item.moduleKey) {
        // Check if module is enabled in module settings
        const isEnabled = moduleSettings[item.moduleKey] !== false
        if (!isEnabled) {
          console.log(`🚫 Module disabled: ${item.label} (${item.moduleKey})`)
          return false
        }

        // Check if user has view permission (for EMPLOYEE only)
        // SUPERADMIN and ADMIN see all menus
        if (user && user.role === 'EMPLOYEE' && !permissionsLoading) {
          const hasViewPermission = canView(item.moduleKey)
          console.log(`👁️ ${item.label} (${item.moduleKey}) - canView: ${hasViewPermission}`)
          // Only hide if explicitly false - if true or undefined (default), show menu
          if (hasViewPermission === false) {
            console.log(`❌ HIDING: ${item.label} (${item.moduleKey})`)
            return false
          }
        }
      }

      // For parent menus with children, filter children as well
      if (item.children && item.children.length > 0) {
        const filteredChildren = item.children.filter(child => {
          if (child.moduleKey) {
            const isEnabled = moduleSettings[child.moduleKey] !== false
            if (!isEnabled) return false

            // Check if user has view permission (for EMPLOYEE only)
            if (user && user.role === 'EMPLOYEE' && !permissionsLoading) {
              const hasViewPermission = canView(child.moduleKey)
              // Only hide if explicitly false - if true or undefined (default), show menu
              if (hasViewPermission === false) return false
            }
          }
          return true
        })

        // If no children remain, hide the parent too
        if (filteredChildren.length === 0) return false

        // Return item with filtered children
        item.children = filteredChildren
      }

      return true
    }).filter((item, index, arr) => {
      // Remove orphaned section dividers (sections with no following items)
      if (item.section && !item.label) {
        const nextItem = arr[index + 1]
        // Keep section only if next item exists and has the same section
        return nextItem && nextItem.section === item.section
      }
      return true
    })
  }, [canView, user])

  // Get sidebar data based on user role with module filtering
  const getSidebarData = useCallback(() => {
    if (!user) return []
    if (user.role === 'SUPERADMIN') return superAdminSidebarData
    if (user.role === 'ADMIN') return adminSidebarData
    if (user.role === 'EMPLOYEE') return employeeSidebarData
    return []
  }, [user])

  /**
   * Filtered menu data based on role and module settings
   * - SUPERADMIN and ADMIN see all menus (no filtering)
   * - EMPLOYEE menus filtered by employeeMenus settings
   */
  const menuData = useMemo(() => {
    const rawData = getSidebarData()

    if (!user) return rawData

    // Apply module filtering for EMPLOYEE only

    if (user.role === 'EMPLOYEE') {
      return filterMenusByModuleSettings([...rawData.map(item => ({ ...item, children: item.children ? [...item.children] : undefined }))], employeeMenus)
    }

    // SUPERADMIN and ADMIN see everything
    return rawData
  }, [getSidebarData, user, employeeMenus, filterMenusByModuleSettings])

  /**
   * AUTO-EXPAND: When navigating to a child page, auto-expand its parent
   * - On first mount: Always expand parent of active child
   * - On route change: Only expand if route actually changed
   * - Does NOT run on user clicks (prevents override of manual toggles)
   */
  useEffect(() => {
    // Check if this is first mount OR if pathname actually changed
    const isFirstMount = isFirstMountRef.current
    const pathnameChanged = prevPathnameRef.current !== location.pathname

    if (isFirstMount || pathnameChanged) {
      // Find the deepest parent menu that contains the active child route
      const findActivePath = (items) => {
        for (const item of items) {
          if (item.children && item.children.length > 0) {
            // Check children recursively first to get the deepest parent
            for (const child of item.children) {
              if (child.children && child.children.length > 0) {
                const deepest = findActivePath([child])
                if (deepest) return deepest
              }
              if (child.path && isActive(child.path)) {
                return item.path
              }
            }
          }
        }
        return null
      }

      const activeParentPath = findActivePath(menuData)

      // If we found a parent with active child, expand it
      if (activeParentPath) {
        setActiveMenu(activeParentPath)
      }

      // Update refs
      prevPathnameRef.current = location.pathname
      isFirstMountRef.current = false
    }
  }, [location.pathname, menuData])

  /**
   * COLLAPSE EFFECT: Close all dropdowns when sidebar is collapsed
   */
  useEffect(() => {
    if (isCollapsed) {
      setActiveMenu(null)
    }
  }, [isCollapsed])

  /**
   * RENDER MENU ITEM
   * Handles both parent menus (with children) and standalone items
   */
  const renderMenuItem = (item, level = 0) => {
    // Skip section-only items without labels
    if (item.section && !item.label) {
      return null
    }

    // PARENT MENU: Menu item with children (dropdown submenu)
    if (item.label && item.children && item.children.length > 0) {
      const Icon = item.icon
      const hasActiveChild = item.children.some((child) => {
        if (isActive(child.path)) return true;
        if (child.children) return child.children.some(gc => isActive(gc.path));
        return false;
      })

      const isExpanded = activeMenu === item.path || isDescendantActive(item, activeMenu)

      return (
        <li key={item.path} className="mb-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!isCollapsed) {
                toggleSubmenu(item.path)
              }
            }}
            className={`w-full flex items-center transition-all duration-200 ${isCollapsed
              ? 'justify-center px-2 py-2 rounded-lg cursor-default'
              : 'gap-2 px-4 py-2.5 justify-between rounded-lg cursor-pointer'
              } ${hasActiveChild
                ? 'bg-primary-accent/10 text-primary-accent'
                : ''
              }`}
            style={{
              color: hasActiveChild ? undefined : (isDark ? '#e0e0e0' : '#4B5563'),
            }}
            onMouseEnter={(e) => {
              if (!hasActiveChild && !isCollapsed) {
                e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6'
                e.currentTarget.style.color = isDark ? '#ffffff' : '#1f2937'
              }
            }}
            onMouseLeave={(e) => {
              if (!hasActiveChild && !isCollapsed) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = isDark ? '#e0e0e0' : '#4B5563'
              }
            }}
            title={isCollapsed ? t(item.label) : ''}
            aria-expanded={isExpanded}
            aria-haspopup="true"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {Icon && <Icon size={18} className="flex-shrink-0" />}
              {!isCollapsed && (
                <span className={`truncate text-sm ${level > 0 ? 'font-medium' : 'font-bold'}`}>{t(item.label)}</span>
              )}
            </div>
            {!isCollapsed && (
              <IoChevronDown
                size={14}
                className={`flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                  }`}
              />
            )}
          </button>

          {!isCollapsed && isExpanded && (
            <div
              className="overflow-hidden"
              style={{
                marginTop: '2px',
                marginLeft: level === 0 ? '12px' : '8px',
                paddingLeft: '4px',
                borderLeft: isDark ? '1px solid #4B5563' : '1px solid #D1D5DB',
              }}
            >
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {item.children.map((child) => renderMenuItem(child, level + 1))}
              </ul>
            </div>
          )}
        </li>
      )
    }

    // STANDALONE MENU ITEM: No children, direct link
    if (item.label) {
      const Icon = item.icon
      const active = isActive(item.path)

      return (
        <li key={item.path} className="mb-0.5">
          <Link
            to={item.path}
            onClick={handleMenuItemClick}
            className={`flex items-center transition-all duration-200 ${isCollapsed
              ? 'justify-center px-2 py-2 rounded-lg'
              : 'gap-2 px-4 py-2.5 rounded-lg'
              } ${active
                ? 'bg-primary-accent text-white shadow-soft font-bold'
                : ''
              }`}
            style={{
              color: active ? '#ffffff' : (isDark ? '#e0e0e0' : '#4B5563'),
              backgroundColor: active ? undefined : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6'
                e.currentTarget.style.color = isDark ? '#ffffff' : '#1f2937'
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = isDark ? '#e0e0e0' : '#4B5563'
              }
            }}
            title={isCollapsed ? t(item.label) : ''}
          >
            {Icon && <Icon size={18} className="flex-shrink-0" />}
            {!isCollapsed && (
              <span className="flex-1 truncate text-sm font-medium">{t(item.label)}</span>
            )}
          </Link>
        </li>
      )
    }

    return null
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 border-r z-40 transform transition-all duration-300 ease-smooth shadow-elevated ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 ${isCollapsed
            ? 'w-16'
            : 'w-56'
          } top-14`}
        style={{
          height: 'calc(100vh - 3.5rem)',
          maxHeight: 'calc(100vh - 3.5rem)',
          backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
          borderColor: isDark ? '#404040' : '#e5e7eb',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Close button for mobile only */}
          <div className="p-2 flex items-center justify-end flex-shrink-0 lg:hidden border-b border-border-light">
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-primary-text p-1.5 rounded-lg hover:bg-sidebar-hover transition-all duration-200"
              aria-label={t('common.close_sidebar')}
            >
              <IoClose size={20} />
            </button>
          </div>

          {/* Menu Items - Scrollable */}
          <nav
            className="flex-1 overflow-y-auto overflow-x-hidden p-2 pb-24"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#D1D5DB #F7F8FA',
              WebkitOverflowScrolling: 'touch', // Fixed slow mobile scrolling issue
              overscrollBehavior: 'contain',
              touchAction: 'pan-y'
            }}
          >
            <ul className="space-y-0.5">
              {menuData.map((item) => renderMenuItem(item))}
            </ul>

          </nav>

          {/* Logout - Fixed at bottom (Hidden for EMPLOYEE as per request) */}
          {user?.role !== 'EMPLOYEE' && (
            <div
              className="p-2 border-t flex-shrink-0"
              style={{ borderColor: isDark ? '#404040' : '#e5e7eb' }}
            >
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${isCollapsed ? 'justify-center' : ''
                  } hover:bg-red-50 hover:text-red-600`}
                style={{ color: isDark ? '#e0e0e0' : '#6B7280' }}
                title={isCollapsed ? t('Logout') : ''}
              >
                <IoLogOut size={18} className="flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{t('Logout')}</span>}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar
