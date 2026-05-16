import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  IoSearch,
  IoClose,
  IoChevronDown,
  IoDocumentText,
  IoBriefcase,
  IoCheckmarkCircle,
  IoApps,
} from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { tasksAPI, projectsAPI, leadsAPI, companiesAPI, estimatesAPI, invoicesAPI } from '../../api'
import adminSidebarData from '../../config/adminSidebarData.jsx'
import employeeSidebarData from '../../config/employeeSidebarData.jsx'
import superAdminSidebarData from '../../config/superAdminSidebarData.jsx'

function flattenNavItems(items, tFn, parentLabel = '') {
  const out = []
  if (!items || !Array.isArray(items)) return out
  for (const item of items) {
    const raw = item.label ? tFn(item.label) : ''
    const label =
      typeof raw === 'string' ? raw : String(item.label || '')
    const combined = parentLabel ? `${parentLabel} › ${label}` : label
    if (item.path) {
      out.push({
        path: item.path,
        label: combined,
        searchText: `${combined} ${item.path}`.toLowerCase(),
      })
    }
    if (item.children?.length) {
      out.push(...flattenNavItems(item.children, tFn, label))
    }
  }
  return out
}

function sidebarForRole(role) {
  const r = String(role || 'ADMIN').toUpperCase()
  if (r === 'EMPLOYEE') return employeeSidebarData
  if (r === 'SUPERADMIN') return superAdminSidebarData
  return adminSidebarData
}

const GlobalSearch = ({
  isOpen,
  onClose,
  mode = 'modal',
  dismissOnClickOutside = true,
}) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const searchTypeLabels = {
    Task: t('search.task'),
    Project: t('search.project'),
    Lead: t('search.lead'),
    Client: t('search.client'),
    Estimate: t('search.estimate'),
    Invoice: t('search.invoice'),
  }
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [dropdownBox, setDropdownBox] = useState(null)
  const searchContainerRef = useRef(null)
  const anchorRef = useRef(null)
  const inputRef = useRef(null)

  const companyId = useMemo(() => {
    const fromUser = user?.company_id
    const n = parseInt(String(fromUser ?? localStorage.getItem('companyId') ?? '1'), 10)
    return Number.isFinite(n) && n > 0 ? n : 1
  }, [user])

  const navEntries = useMemo(() => {
    const translate = (key) => (key ? t(key) : '')
    return flattenNavItems(sidebarForRole(user?.role), translate)
  }, [user?.role, t])

  /** Live query drives panel + menu matches so the dropdown reacts immediately; API stays debounced */
  const trimmedLive = (searchQuery || '').trim()

  const menuMatches = useMemo(() => {
    const q = trimmedLive.toLowerCase()
    if (!q) return []
    return navEntries.filter((entry) => entry.searchText.includes(q)).slice(0, 12)
  }, [trimmedLive, navEntries])

  const isEmployee = String(user?.role || '').toUpperCase() === 'EMPLOYEE'

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 150)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!dismissOnClickOutside) return undefined

    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        if (mode === 'modal' || mode === 'inline') onClose?.()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, mode, onClose, dismissOnClickOutside])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const q = debouncedQuery.trim()
        const params = { search: q, company_id: companyId, limit: 10, page: 1 }

        const [tasksRes, projectsRes, leadsRes, clientsRes, estimatesRes, invoicesRes] = await Promise.all([
          tasksAPI.getAll(params).catch(() => ({ data: { data: [] } })),
          projectsAPI.getAll(params).catch(() => ({ data: { data: [] } })),
          leadsAPI.getAll(params).catch(() => ({ data: { data: [] } })),
          companiesAPI.getAll(params).catch(() => ({ data: { data: [] } })),
          estimatesAPI.getAll(params).catch(() => ({ data: { data: [] } })),
          invoicesAPI.getAll(params).catch(() => ({ data: { data: [] } }))
        ])

        const combinedResults = [
          ...(tasksRes?.data?.data || []).map(item => ({ ...item, _searchType: 'Task' })),
          ...(projectsRes?.data?.data || []).map(item => ({ ...item, _searchType: 'Project' })),
          ...(leadsRes?.data?.data || []).map(item => ({ ...item, _searchType: 'Lead' })),
          ...(clientsRes?.data?.data || []).map(item => ({ ...item, _searchType: 'Client' })),
          ...(estimatesRes?.data?.data || []).map(item => ({ ...item, _searchType: 'Estimate' })),
          ...(invoicesRes?.data?.data || []).map(item => ({ ...item, _searchType: 'Invoice' }))
        ]
        
        setResults(combinedResults)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery, companyId])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setResults([])
  }, [])

  const handleMenuClick = useCallback(
    (path) => {
      if (path) navigate(path)
      clearSearch()
      onClose?.()
    },
    [navigate, clearSearch, onClose]
  )

  const handleResultClick = useCallback(
    (item) => {
      const type = item._searchType
      if (type === 'Task' || type === 'To do') {
        const title = encodeURIComponent(item.title || item.heading || item.name || '')
        if (item.project_id) {
          navigate(
            isEmployee
              ? `/app/employee/my-projects/${item.project_id}`
              : `/app/admin/projects/${item.project_id}`
          )
        } else {
          navigate(
            isEmployee
              ? `/app/employee/tasks?search=${title}`
              : `/app/admin/tasks?search=${title}`
          )
        }
      } else if (type === 'Project') {
        navigate(
          isEmployee
            ? `/app/employee/my-projects/${item.id}`
            : `/app/admin/projects/${item.id}`
        )
      } else if (type === 'Lead') {
        navigate(
          isEmployee
            ? `/app/employee/leads/${item.id}`
            : `/app/admin/leads/${item.id}`
        )
      } else if (type === 'Client') {
        navigate(`/app/admin/clients/${item.id}`)
      } else if (type === 'Estimate') {
        navigate(`/app/admin/estimates/${item.id}`)
      } else if (type === 'Invoice') {
        navigate(`/app/admin/invoices/${item.id}`)
      }

      clearSearch()
      onClose?.()
    },
    [navigate, isEmployee, clearSearch, onClose]
  )

  const trimmedDebounced = (debouncedQuery || '').trim()
  const showResultsPanel = trimmedLive.length >= 1

  useLayoutEffect(() => {
    if (mode !== 'inline' || !isOpen) {
      setDropdownBox(null)
      return
    }
    if (!showResultsPanel) {
      setDropdownBox(null)
      return
    }
    const el = anchorRef.current
    if (!el) return

    const place = () => {
      const r = el.getBoundingClientRect()
      const width = Math.min(Math.max(r.width, 280), window.innerWidth - 24)
      let left = r.left
      if (left + width > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - 12 - width)
      }
      setDropdownBox({
        top: r.bottom + 8,
        left,
        width,
      })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [mode, isOpen, showResultsPanel, trimmedLive, loading, results.length, menuMatches.length])

  const renderMenuSection = () => {
    if (!menuMatches.length) return null
    return (
      <div className="border-b border-gray-100 bg-gray-50/80">
        <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {t('search.pages')}
        </p>
        <ul className="pb-1">
          {menuMatches.map((entry) => (
            <li key={`${entry.path}-${entry.label}`}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-white"
                onClick={() => handleMenuClick(entry.path)}
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <IoApps size={15} />
                </span>
                <span className="min-w-0 truncate font-medium">{entry.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderApiSection = () => {
    if (trimmedLive.length < 2) return null
    if (debouncedQuery.trim().length < 2 || loading) {
      return (
        <div className="p-4 text-center text-sm text-gray-500">{t('search.searching')}</div>
      )
    }
    if (results.length > 0) {
      return (
        <ul className="divide-y divide-gray-100">
          {results.map((item, index) => (
            <li key={item.id ?? index}>
              <button
                type="button"
                className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                onClick={() => handleResultClick(item)}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                  {item._searchType === 'Project' ? (
                    <IoBriefcase size={14} />
                  ) : item._searchType === 'Lead' ? (
                    <IoDocumentText size={14} />
                  ) : (
                    <IoCheckmarkCircle size={14} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-600 flex items-center">
                    <span className="mr-2 text-[10px] font-bold uppercase tracking-wider text-primary-accent bg-primary-accent/10 px-1.5 py-0.5 rounded">
                      {searchTypeLabels[item._searchType] || item._searchType}
                    </span>
                    <span className="truncate">
                      {item.title ||
                        item.person_name ||
                        item.name ||
                        item.project_name ||
                        item.company_name ||
                        t('search.untitled')}
                    </span>
                  </p>
                  <p className="truncate text-xs text-secondary-text mt-0.5">
                    {item._searchType === 'Task' || item._searchType === 'To do'
                      ? item.project_name
                        ? `${t('search.project')}: ${item.project_name}`
                        : t('search.no_project')
                      : item._searchType === 'Lead'
                        ? [item.email, item.company_name].filter(Boolean).join(' · ') ||
                          item.status ||
                          t('search.no_status')
                        : item.status || t('search.no_status')}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )
    }
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        {(t('search.no_results') || '').includes('{{query}}')
          ? t('search.no_results').replace('{{query}}', debouncedQuery)
          : `${t('search.no_results')}: "${debouncedQuery}"`}
      </div>
    )
  }

  if (!isOpen) return null

  if (mode === 'modal') {
    return (
      <div className="animate-fadeIn fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 px-4 pt-20">
        <div
          ref={searchContainerRef}
          className="shadow-elevated w-full max-w-xl overflow-hidden rounded-2xl bg-white"
        >
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
            <IoSearch size={20} className="text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent text-base text-gray-700 outline-none placeholder:text-gray-400"
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setResults([])
                }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <IoClose size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onClose?.()}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              {t('search.esc')}
            </button>
          </div>



          <div className="max-h-[400px] overflow-y-auto">
            {showResultsPanel && renderMenuSection()}
            {showResultsPanel && trimmedLive.length >= 2 && (
              <>
                {results.length > 0 || loading || debouncedQuery.trim().length < 2 ? (
                  <p className="border-t border-gray-100 bg-white px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {t('search.results') || 'Results'}
                  </p>
                ) : null}
                {renderApiSection()}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const inlineDropdownBody = (
    <>
      {renderMenuSection()}
      {trimmedLive.length === 1 && menuMatches.length === 0 && (
        <div className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500">
          {t('search.type_more')}
        </div>
      )}
      {trimmedLive.length >= 2 && (
        <>
          {results.length > 0 || loading || debouncedQuery.trim().length < 2 ? (
            <p className="border-t border-gray-100 bg-white px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {t('search.results') || 'Results'}
            </p>
          ) : null}
          {renderApiSection()}
        </>
      )}
    </>
  )

  return (
    <>
      <div
        ref={(el) => {
          anchorRef.current = el
          if (mode === 'inline') searchContainerRef.current = el
        }}
        className="relative z-[60] w-full max-w-xl"
      >
        <div className="relative w-full">
        <div className="relative z-30 flex h-10 items-center overflow-visible rounded-full border border-gray-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary-accent/20">
          <div className="flex h-full flex-1 items-center px-4">
            <input
              ref={inputRef}
              type="text"
              className="h-full w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setResults([])
                }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <IoClose size={16} />
              </button>
            )}
          </div>
        </div>

      </div>
      </div>

      {showResultsPanel &&
        dropdownBox &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="max-h-[min(420px,calc(100vh-6rem))] overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-elevated"
            style={{
              position: 'fixed',
              top: dropdownBox.top,
              left: dropdownBox.left,
              width: dropdownBox.width,
              zIndex: 10050,
            }}
            onMouseDown={(e) => e.preventDefault()}
            role="listbox"
            aria-label={t('search.placeholder')}
          >
            {inlineDropdownBody}
          </div>,
          document.body
        )}
    </>
  )
}

export default GlobalSearch
