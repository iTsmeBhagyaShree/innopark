import { useState, useEffect } from 'react'
import {
    IoFilter,
    IoClose,
    IoChevronDown,
    IoChevronUp,
    IoRefresh,
    IoCheckmark
} from 'react-icons/io5'

/**
 * RiceCRM-Style Expandable Filter Panel
 * 
 * Features:
 * - Collapsible/expandable panel
 * - Multi-select filters
 * - Date range filters
 * - Employee-based filters
 * - Clear all filters option
 */

const FilterPanel = ({
    filters = [],
    activeFilters = {},
    onFilterChange,
    onClearAll,
    isOpen = false,
    onToggle,
    title = 'Filters'
}) => {
    const [expandedSections, setExpandedSections] = useState({})

    // Toggle individual filter section
    const toggleSection = (filterId) => {
        setExpandedSections(prev => ({
            ...prev,
            [filterId]: !prev[filterId]
        }))
    }

    // Count active filters
    const activeFilterCount = Object.values(activeFilters).filter(v =>
        v !== '' && v !== null && v !== undefined &&
        (Array.isArray(v) ? v.length > 0 : true)
    ).length

    // Handle single/multi select changes
    const handleChange = (filterId, value, isMulti = false) => {
        if (isMulti) {
            const currentValues = activeFilters[filterId] || []
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value]
            onFilterChange(filterId, newValues)
        } else {
            onFilterChange(filterId, value)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
            >
                <IoFilter className="text-gray-600" size={18} />
                <span className="text-sm font-medium text-gray-700">Filters</span>
                {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                        {activeFilterCount}
                    </span>
                )}
            </button>
        )
    }

    return (
        <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-slideDown">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                    <IoFilter className="text-blue-600" size={20} />
                    <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
                    {activeFilterCount > 0 && (
                        <span className="flex items-center justify-center px-2 py-0.5 text-xs font-bold text-blue-700 bg-blue-100 rounded-full">
                            {activeFilterCount} active
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                        <button
                            onClick={onClearAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                            <IoRefresh size={14} />
                            Clear All
                        </button>
                    )}
                    <button
                        onClick={onToggle}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                        <IoClose size={18} />
                    </button>
                </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
                {filters.map((filter) => (
                    <FilterSection
                        key={filter.id}
                        filter={filter}
                        value={activeFilters[filter.id]}
                        onChange={(value) => handleChange(filter.id, value, filter.multi)}
                        isExpanded={expandedSections[filter.id] !== false}
                        onToggle={() => toggleSection(filter.id)}
                    />
                ))}
            </div>
        </div>
    )
}

// Individual Filter Section Component
const FilterSection = ({ filter, value, onChange, isExpanded, onToggle }) => {
    const { id, label, type, options = [], placeholder } = filter

    const renderFilterInput = () => {
        switch (type) {
            case 'select':
                return (
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                    >
                        <option value="">{placeholder || `All ${label}`}</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                )

            case 'multi-select':
                return (
                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                        {options.map((opt) => {
                            const isSelected = (value || []).includes(opt.value)
                            return (
                                <label
                                    key={opt.value}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${isSelected
                                            ? 'bg-blue-50 border border-blue-200'
                                            : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                >
                                    <div className={`flex items-center justify-center w-4 h-4 rounded border-2 transition-all duration-200 ${isSelected
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'border-gray-300'
                                        }`}>
                                        {isSelected && <IoCheckmark size={12} className="text-white" />}
                                    </div>
                                    <span className={`text-sm ${isSelected ? 'font-medium text-blue-800' : 'text-gray-700'}`}>
                                        {opt.label}
                                    </span>
                                </label>
                            )
                        })}
                    </div>
                )

            case 'date':
                return (
                    <input
                        type="date"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                    />
                )

            case 'date-range':
                return (
                    <div className="flex flex-col gap-2">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">From</label>
                            <input
                                type="date"
                                value={value?.from || ''}
                                onChange={(e) => onChange({ ...value, from: e.target.value })}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">To</label>
                            <input
                                type="date"
                                value={value?.to || ''}
                                onChange={(e) => onChange({ ...value, to: e.target.value })}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                            />
                        </div>
                    </div>
                )

            case 'text':
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
                        className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                    />
                )

            default:
                return null
        }
    }

    // Check if filter has a value
    const hasValue = value !== '' && value !== null && value !== undefined &&
        (Array.isArray(value) ? value.length > 0 : true) &&
        (typeof value === 'object' && !Array.isArray(value) ? (value.from || value.to) : true)

    return (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div
                className="flex items-center justify-between cursor-pointer mb-3"
                onClick={onToggle}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{label}</span>
                    {hasValue && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                </div>
                {(type === 'multi-select' || type === 'date-range') && (
                    isExpanded ? (
                        <IoChevronUp size={16} className="text-gray-400" />
                    ) : (
                        <IoChevronDown size={16} className="text-gray-400" />
                    )
                )}
            </div>
            {(isExpanded || type === 'select' || type === 'date' || type === 'text') && renderFilterInput()}
        </div>
    )
}

export default FilterPanel
