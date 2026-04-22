import React, { useState, useEffect, useRef } from 'react'
import {
  IoSearch,
  IoFilter,
  IoChevronBack,
  IoChevronForward,
  IoEllipsisVertical,
  IoClose,
  IoDownload,
  IoGrid,
  IoCheckmark,
  IoAdd,
  IoTrash,
  IoCreate,
  IoArrowUp,
  IoArrowDown,
} from 'react-icons/io5'
import Button from './Button'
import Badge from './Badge'
import Modal from './Modal'

const EnhancedDataTable = ({
  columns,
  data,
  searchPlaceholder = 'Search...',
  onSearch,
  filters = true,
  filterConfig = [],
  onRowClick,
  actions,
  pagination = false,
  bulkActions = false,
  selectedRows: externalSelectedRows,
  onSelectAll: externalOnSelectAll,
  module = 'default', // For saving preferences per module
  quickFilters = [], // [{ label: 'All Records', filter: {} }, { label: 'My Records', filter: { owner: 'current_user' } }]
  exportOptions = true,
  savedFilters = [], // [{ id, name, filters: {}, isShared: false }]
  onSaveFilter,
  onDeleteFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [internalSelectedRows, setInternalSelectedRows] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [showColumnManager, setShowColumnManager] = useState(false)
  const [showSavedFilters, setShowSavedFilters] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})
  const [filterLogic, setFilterLogic] = useState('AND') // AND or OR
  const [activeQuickFilter, setActiveQuickFilter] = useState(null)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(`table_columns_${module}`)
    return saved ? JSON.parse(saved) : columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  })
  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem(`table_order_${module}`)
    return saved ? JSON.parse(saved) : columns.map(col => col.key)
  })
  const [draggedColumn, setDraggedColumn] = useState(null)
  const [isResizing, setIsResizing] = useState(null)
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem(`table_widths_${module}`)
    return saved ? JSON.parse(saved) : {}
  })
  const [exportMenuPosition, setExportMenuPosition] = useState({ top: 0, right: 0 })
  const exportMenuRef = useRef(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

  const selectedRows = externalSelectedRows !== undefined ? externalSelectedRows : internalSelectedRows
  const setSelectedRows = externalSelectedRows !== undefined ? () => {} : setInternalSelectedRows

  // Handle sorting
  const handleSort = (columnKey) => {
    let direction = 'asc'
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key: columnKey, direction })
  }

  // Calculate export menu position
  useEffect(() => {
    if (showExportMenu && exportMenuRef.current) {
      const rect = exportMenuRef.current.getBoundingClientRect()
      setExportMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [showExportMenu])

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(`table_columns_${module}`, JSON.stringify(visibleColumns))
  }, [visibleColumns, module])

  useEffect(() => {
    localStorage.setItem(`table_order_${module}`, JSON.stringify(columnOrder))
  }, [columnOrder, module])

  useEffect(() => {
    localStorage.setItem(`table_widths_${module}`, JSON.stringify(columnWidths))
  }, [columnWidths, module])

  // Apply quick filter
  useEffect(() => {
    if (activeQuickFilter) {
      const quickFilter = quickFilters.find(qf => qf.label === activeQuickFilter)
      if (quickFilter && quickFilter.filter) {
        setActiveFilters(quickFilter.filter)
      }
    }
  }, [activeQuickFilter, quickFilters])

  // Get ordered and visible columns
  const orderedColumns = columnOrder
    .map(key => columns.find(col => col.key === key))
    .filter(col => col && visibleColumns[col.key] !== false)

  const filteredData = data.filter((row) => {
    // Search filter
    if (searchTerm) {
      const matchesSearch = Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (!matchesSearch) return false
    }

    // Quick filter
    if (activeQuickFilter) {
      const quickFilter = quickFilters.find(qf => qf.label === activeQuickFilter)
      if (quickFilter && quickFilter.filter) {
        for (const [key, value] of Object.entries(quickFilter.filter)) {
          if (value === 'current_user') {
            // Handle current user filter
            if (row[key] !== 'current_user_id') return false
          } else if (row[key] !== value) {
            return false
          }
        }
      }
    }

    // Advanced filters with AND/OR logic
    const filterEntries = Object.entries(activeFilters).filter(([_, value]) => {
      if (value === undefined || value === '' || value === null) return false
      if (typeof value === 'object' && !value.start && !value.end) return false
      return true
    })

    if (filterEntries.length === 0) return true

    if (filterLogic === 'AND') {
      // All filters must match
      for (const [key, value] of filterEntries) {
        const filter = filterConfig.find(f => f.key === key)
        if (!filter) continue

        if (filter.type === 'select') {
          if (Array.isArray(value)) {
            if (!value.includes(row[key])) return false
          } else {
            if (row[key] !== value) return false
          }
        } else if (filter.type === 'daterange') {
          const rowDate = new Date(row[key])
          const startDate = value.start ? new Date(value.start) : null
          const endDate = value.end ? new Date(value.end) : null
          if (startDate && rowDate < startDate) return false
          if (endDate && rowDate > endDate) return false
        } else if (filter.type === 'date') {
          const rowDate = new Date(row[key]).toDateString()
          const filterDate = new Date(value).toDateString()
          if (rowDate !== filterDate) return false
        } else if (filter.type === 'text') {
          if (!String(row[key]).toLowerCase().includes(String(value).toLowerCase())) return false
        }
      }
      return true
    } else {
      // OR logic - at least one filter must match
      return filterEntries.some(([key, value]) => {
        const filter = filterConfig.find(f => f.key === key)
        if (!filter) return false

        if (filter.type === 'select') {
          return Array.isArray(value) ? value.includes(row[key]) : row[key] === value
        } else if (filter.type === 'daterange') {
          const rowDate = new Date(row[key])
          const startDate = value.start ? new Date(value.start) : null
          const endDate = value.end ? new Date(value.end) : null
          return (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate)
        } else if (filter.type === 'date') {
          return new Date(row[key]).toDateString() === new Date(value).toDateString()
        } else if (filter.type === 'text') {
          return String(row[key]).toLowerCase().includes(String(value).toLowerCase())
        }
        return false
      })
    }
  })

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    if (onSearch) onSearch(value)
  }

  // Apply sorting to filtered data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0
    
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]
    
    // Handle null/undefined values
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1
    
    // Handle different types
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    // Handle dates
    const aDate = new Date(aValue)
    const bDate = new Date(bValue)
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
      return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate
    }
    
    // Handle strings (default)
    const aString = String(aValue).toLowerCase()
    const bString = String(bValue).toLowerCase()
    if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1
    if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const handleSelectAll = (e) => {
    if (externalOnSelectAll) {
      externalOnSelectAll()
    } else {
      if (e.target.checked) {
        setInternalSelectedRows(sortedData.map((row) => row.id))
      } else {
        setInternalSelectedRows([])
      }
    }
  }

  const handleSelectRow = (id) => {
    if (externalSelectedRows === undefined) {
      setInternalSelectedRows((prev) =>
        prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
      )
    }
  }

  const handleDragStart = (e, columnKey) => {
    setDraggedColumn(columnKey)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetColumnKey) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === targetColumnKey) return

    const newOrder = [...columnOrder]
    const draggedIndex = newOrder.indexOf(draggedColumn)
    const targetIndex = newOrder.indexOf(targetColumnKey)

    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedColumn)

    setColumnOrder(newOrder)
    setDraggedColumn(null)
  }

  const handleExport = (format) => {
    const exportData = sortedData.map(row => {
      const rowData = {}
      orderedColumns.forEach(col => {
        rowData[col.label] = col.render ? col.render(row[col.key], row) : row[col.key]
      })
      return rowData
    })

    if (format === 'csv') {
      const headers = orderedColumns.map(col => col.label).join(',')
      const rows = exportData.map(row => Object.values(row).join(','))
      const csv = [headers, ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${module}_export.csv`
      a.click()
    } else if (format === 'excel') {
      // For Excel, you'd typically use a library like xlsx
      alert('Excel export requires xlsx library. CSV exported instead.')
      handleExport('csv')
    } else if (format === 'pdf') {
      // For PDF, you'd typically use a library like jsPDF
      alert('PDF export requires jsPDF library.')
    }

    setShowExportMenu(false)
  }

  const handleSaveFilter = () => {
    const filterName = prompt('Enter filter name:')
    if (filterName && onSaveFilter) {
      onSaveFilter({
        name: filterName,
        filters: activeFilters,
        logic: filterLogic,
        module,
      })
    }
  }

  const activeFilterCount = Object.values(activeFilters).filter(v => {
    if (v === undefined || v === '' || v === null) return false
    if (typeof v === 'object' && !v.start && !v.end) return false
    return true
  }).length

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Top Bar: Search, Quick Filters, Actions */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            />
          </div>

          {/* Quick Filters */}
          {quickFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {quickFilters.map((qf) => (
                <button
                  key={qf.label}
                  onClick={() => {
                    setActiveQuickFilter(activeQuickFilter === qf.label ? null : qf.label)
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activeQuickFilter === qf.label
                      ? 'bg-primary-accent text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {qf.label}
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {filters && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm ${
                  showFilters || activeFilterCount > 0
                    ? 'border-primary-accent bg-primary-accent/10 text-primary-accent'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <IoFilter size={16} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="ml-1">{activeFilterCount}</Badge>
                )}
              </button>
            )}

            <button
              onClick={() => setShowColumnManager(!showColumnManager)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <IoGrid size={16} />
              <span className="hidden sm:inline">Manage Columns</span>
            </button>

            {exportOptions && (
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <IoDownload size={16} />
                  <span className="hidden sm:inline">Export</span>
                </button>
                {showExportMenu && (
                  <div 
                    className="fixed w-40 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden" 
                    style={{ 
                      zIndex: 9999,
                      top: `${exportMenuPosition.top}px`,
                      right: `${exportMenuPosition.right}px`
                    }}
                  >
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Export Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg"
                    >
                      Export PDF
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {Object.entries(activeFilters).map(([key, value]) => {
              if (!value || value === '' || (typeof value === 'object' && !value.start && !value.end)) return null
              const filter = filterConfig.find(f => f.key === key)
              if (!filter) return null
              return (
                <Badge
                  key={key}
                  variant="default"
                  className="flex items-center gap-1 bg-primary-accent/10 text-primary-accent"
                >
                  {filter.label}: {typeof value === 'object' ? `${value.start || ''} - ${value.end || ''}` : String(value)}
                  <button
                    onClick={() => {
                      const newFilters = { ...activeFilters }
                      delete newFilters[key]
                      setActiveFilters(newFilters)
                    }}
                    className="ml-1 hover:text-primary-accent"
                  >
                    <IoClose size={14} />
                  </button>
                </Badge>
              )
            })}
            <button
              onClick={() => {
                setActiveFilters({})
                setActiveQuickFilter(null)
              }}
              className="text-sm text-red-600 hover:underline"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && filters && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterLogic(filterLogic === 'AND' ? 'OR' : 'AND')}
                className="px-3 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50"
              >
                Logic: {filterLogic}
              </button>
              {savedFilters.length > 0 && (
                <button
                  onClick={() => setShowSavedFilters(!showSavedFilters)}
                  className="px-3 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50"
                >
                  Saved Filters ({savedFilters.length})
                </button>
              )}
              <button
                onClick={handleSaveFilter}
                className="px-3 py-1 text-xs border border-primary-accent text-primary-accent rounded bg-white hover:bg-primary-accent/10"
              >
                Save Filter
              </button>
            </div>
          </div>

          {/* Saved Filters Dropdown */}
          {showSavedFilters && savedFilters.length > 0 && (
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="space-y-2">
                {savedFilters.map((sf) => (
                  <div key={sf.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{sf.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveFilters(sf.filters)
                          setFilterLogic(sf.logic || 'AND')
                          setShowSavedFilters(false)
                        }}
                        className="text-xs text-primary-accent hover:underline"
                      >
                        Apply
                      </button>
                      {onDeleteFilter && (
                        <button
                          onClick={() => onDeleteFilter(sf.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterConfig.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {filter.label}
                </label>
                {filter.type === 'select' && (
                  <select
                    value={Array.isArray(activeFilters[filter.key]) ? '' : (activeFilters[filter.key] || '')}
                    onChange={(e) => {
                      if (filter.multiSelect) {
                        const current = Array.isArray(activeFilters[filter.key]) ? activeFilters[filter.key] : []
                        if (e.target.value) {
                          setActiveFilters({
                            ...activeFilters,
                            [filter.key]: [...current, e.target.value],
                          })
                        }
                      } else {
                        setActiveFilters({ ...activeFilters, [filter.key]: e.target.value })
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                  >
                    <option value="">All</option>
                    {filter.options?.map((opt) => (
                      <option key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt}>
                        {typeof opt === 'object' ? opt.label : opt}
                      </option>
                    ))}
                  </select>
                )}
                {filter.type === 'date' && (
                  <input
                    type="date"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => setActiveFilters({ ...activeFilters, [filter.key]: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                  />
                )}
                {filter.type === 'daterange' && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      placeholder="Start Date"
                      value={activeFilters[filter.key]?.start || ''}
                      onChange={(e) => setActiveFilters({
                        ...activeFilters,
                        [filter.key]: { ...activeFilters[filter.key], start: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                    />
                    <input
                      type="date"
                      placeholder="End Date"
                      value={activeFilters[filter.key]?.end || ''}
                      onChange={(e) => setActiveFilters({
                        ...activeFilters,
                        [filter.key]: { ...activeFilters[filter.key], end: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                    />
                  </div>
                )}
                {filter.type === 'text' && (
                  <input
                    type="text"
                    placeholder={filter.placeholder || `Filter by ${filter.label}`}
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => setActiveFilters({ ...activeFilters, [filter.key]: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                  />
                )}
                {filter.type === 'multiselect' && (
                  <div className="space-y-1">
                    {Array.isArray(activeFilters[filter.key]) && activeFilters[filter.key].length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {activeFilters[filter.key].map((val, idx) => (
                          <Badge key={idx} variant="default" className="flex items-center gap-1">
                            {val}
                            <button
                              onClick={() => {
                                const newValues = activeFilters[filter.key].filter((_, i) => i !== idx)
                                setActiveFilters({ ...activeFilters, [filter.key]: newValues })
                              }}
                            >
                              <IoClose size={12} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const current = Array.isArray(activeFilters[filter.key]) ? activeFilters[filter.key] : []
                          if (!current.includes(e.target.value)) {
                            setActiveFilters({
                              ...activeFilters,
                              [filter.key]: [...current, e.target.value],
                            })
                          }
                          e.target.value = ''
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                    >
                      <option value="">Add {filter.label}...</option>
                      {filter.options?.map((opt) => {
                        const value = typeof opt === 'object' ? opt.value : opt
                        const current = Array.isArray(activeFilters[filter.key]) ? activeFilters[filter.key] : []
                        if (current.includes(value)) return null
                        return (
                          <option key={value} value={value}>
                            {typeof opt === 'object' ? opt.label : opt}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Column Manager */}
      {showColumnManager && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Manage Columns</h3>
            <button
              onClick={() => {
                const allVisible = columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
                setVisibleColumns(allVisible)
              }}
              className="text-xs text-primary-accent hover:underline"
            >
              Show All
            </button>
          </div>
          <div className="space-y-2">
            {columns.map((col) => (
              <div
                key={col.key}
                draggable
                onDragStart={(e) => handleDragStart(e, col.key)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.key)}
                className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200 cursor-move hover:border-primary-accent"
              >
                <div className="flex items-center gap-2 flex-1">
                  <IoGrid size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">{col.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (columnOrder.indexOf(col.key) > 0) {
                        const newOrder = [...columnOrder]
                        const index = newOrder.indexOf(col.key)
                        newOrder[index] = newOrder[index - 1]
                        newOrder[index - 1] = col.key
                        setColumnOrder(newOrder)
                      }
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                    disabled={columnOrder.indexOf(col.key) === 0}
                  >
                    <IoArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (columnOrder.indexOf(col.key) < columnOrder.length - 1) {
                        const newOrder = [...columnOrder]
                        const index = newOrder.indexOf(col.key)
                        newOrder[index] = newOrder[index + 1]
                        newOrder[index + 1] = col.key
                        setColumnOrder(newOrder)
                      }
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                    disabled={columnOrder.indexOf(col.key) === columnOrder.length - 1}
                  >
                    <IoArrowDown size={14} />
                  </button>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key] !== false}
                      onChange={(e) => setVisibleColumns({ ...visibleColumns, [col.key]: e.target.checked })}
                      className="w-4 h-4 text-primary-accent rounded"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              {(actions || bulkActions) && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === sortedData.length && sortedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              {orderedColumns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap ${col.key !== 'checkbox' && col.key !== 'actions' ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}`}
                  style={{ width: columnWidths[col.key] || 'auto', minWidth: '100px' }}
                  onClick={() => col.key !== 'checkbox' && col.key !== 'actions' && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.key !== 'checkbox' && col.key !== 'actions' && (
                      <span className="flex flex-col">
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === 'asc' ? (
                            <IoArrowUp className="w-3 h-3 text-primary-accent" />
                          ) : (
                            <IoArrowDown className="w-3 h-3 text-primary-accent" />
                          )
                        ) : (
                          <div className="flex flex-col -space-y-1 opacity-30">
                            <IoArrowUp className="w-2.5 h-2.5" />
                            <IoArrowDown className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Aktionen</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={orderedColumns.length + ((actions || bulkActions) ? 2 : 0)}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {(actions || bulkActions) && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  {orderedColumns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-600">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default EnhancedDataTable

