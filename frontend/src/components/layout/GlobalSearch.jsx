import { useState, useEffect, useRef } from 'react'
import { IoSearch, IoClose, IoChevronDown, IoDocumentText, IoPerson, IoBriefcase, IoCheckmarkCircle } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { tasksAPI, projectsAPI, leadsAPI } from '../../api'

const GlobalSearch = ({ isOpen, onClose, mode = 'modal' }) => {
    const { t } = useLanguage()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [searchType, setSearchType] = useState('Task')
    const searchTypeLabels = {
        'Task': t('search.task'),
        'Project': t('search.project'),
        'Lead': t('search.lead'),
        'Client': t('search.client')
    }
    const [showTypeDropdown, setShowTypeDropdown] = useState(false)
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const searchContainerRef = useRef(null)
    const inputRef = useRef(null)

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                if (mode === 'modal') onClose()
                if (mode === 'inline') onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, mode, onClose])

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    // Fetch search results
    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedQuery || debouncedQuery.length < 2) {
                setResults([])
                return
            }

            setLoading(true)
            try {
                const companyId = parseInt(localStorage.getItem('companyId') || 1)
                let response

                switch (searchType) {
                    case 'Task':
                    case 'To do':
                        response = await tasksAPI.getAll({ search: debouncedQuery, company_id: companyId })
                        break
                    case 'Project':
                        response = await projectsAPI.getAll({ search: debouncedQuery, company_id: companyId })
                        break

                    case 'Lead':
                        response = await leadsAPI.getAll({ search: debouncedQuery, company_id: companyId })
                        break
                    default:
                        break
                }

                if (response?.data?.success) {
                    setResults(response.data.data || [])
                } else {
                    setResults([])
                }
            } catch (error) {
                console.error('Search error:', error)
                setResults([])
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [debouncedQuery, searchType])

    const handleResultClick = (item) => {
        if (searchType === 'Task' || searchType === 'To do') {
            if (item.project_id) {
                navigate(`/app/admin/projects/${item.project_id}`)
            } else {
                navigate(`/app/admin/tasks?search=${item.heading || item.title}`)
            }
        } else if (searchType === 'Project') {
            navigate(`/app/admin/projects/${item.id}`)

        } else if (searchType === 'Lead') {
            navigate(`/app/admin/leads/${item.id}`)
        }

        if (mode === 'modal' || mode === 'inline') {
            onClose()
        }
        setSearchQuery('')
        setResults([])
        setShowTypeDropdown(false)
    }

    if (!isOpen) return null

    // Modal mode
    if (mode === 'modal') {
        return (
            <div className="fixed inset-0 bg-black/50 z-[9999] flex items-start justify-center pt-20 px-4 animate-fadeIn">
                <div
                    ref={searchContainerRef}
                    className="w-full max-w-xl bg-white rounded-2xl shadow-elevated overflow-hidden"
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                        <IoSearch size={20} className="text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="flex-1 outline-none text-base text-gray-700 placeholder-gray-400 bg-transparent"
                            placeholder={t('search.placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); setResults([]) }}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                            >
                                <IoClose size={18} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                        >
                            {t('search.esc')}
                        </button>
                    </div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
                        <span className="text-xs text-gray-500">{t('search.search_in')}</span>
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                            {['Task', 'Project', 'Lead'].map(type => (
                                <button
                                    key={type}
                                    className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${searchType === type
                                        ? 'bg-primary-accent text-white'
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    onClick={() => setSearchType(type)}
                                >
                                    {searchTypeLabels[type] || type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading && (
                            <div className="p-4 text-center text-gray-500 text-sm">{t('search.searching')}</div>
                        )}
                        {!loading && results.length > 0 && (
                            <ul className="divide-y divide-gray-100">
                                {results.map((item, index) => (
                                    <li key={item.id || index}>
                                        <button
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                                            onClick={() => handleResultClick(item)}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                                {searchType === 'Client' ? <IoPerson size={14} /> :
                                                    searchType === 'Project' ? <IoBriefcase size={14} /> :
                                                        searchType === 'Lead' ? <IoDocumentText size={14} /> :
                                                            <IoCheckmarkCircle size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                    {item.title || item.name || item.project_name || item.company_name || t('search.untitled')}
                                                </p>
                                                <p className="text-xs text-secondary-text truncate">
                                                    {searchType === 'Task' ? (item.project_name ? `${t('search.project')}: ${item.project_name}` : t('search.no_project')) :
                                                        (item.status || t('search.no_status'))}
                                                </p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!loading && searchQuery && results.length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                {(t('search.no_results') || '').replace('{{query}}', searchQuery)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // Inline mode (Desktop)
    return (
        <div className="hidden md:block relative w-[350px] mx-4" ref={searchContainerRef}>
            <div className="relative w-full">
                {/* Pill Container */}
                <div className="flex items-center border border-gray-300 rounded-full bg-white shadow-sm h-10 overflow-visible z-30 relative focus-within:ring-2 focus-within:ring-primary-accent/20">

                    {/* Type/Dropdown Trigger */}
                    <div className="relative h-full border-r border-gray-200">
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 h-full bg-transparent hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors min-w-[90px] justify-between cursor-pointer rounded-l-full"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowTypeDropdown(!showTypeDropdown);
                            }}
                        >
                            <span>{searchTypeLabels[searchType] || searchType}</span>
                            <IoChevronDown size={12} className={`text-gray-400 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Type Dropdown */}
                        {showTypeDropdown && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-[140%] min-w-[140px] bg-white shadow-elevated rounded-xl border border-gray-100 py-1.5 z-50 animate-fadeIn">
                                {['Task', 'Project', 'Lead'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-primary-accent/5 hover:text-primary-accent transition-colors ${searchType === type ? 'text-primary-accent font-medium bg-primary-accent/5' : 'text-gray-700'}`}
                                        onClick={() => {
                                            setSearchType(type)
                                            setShowTypeDropdown(false)
                                        }}
                                    >
                                        {searchTypeLabels[type] || type}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="flex-1 flex items-center px-3 h-full">
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full h-full outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                            placeholder={t('search.placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); setResults([]) }}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                            >
                                <IoClose size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Inline Results Dropdown */}
                {(results.length > 0 || (loading && searchQuery)) && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-xl shadow-elevated border border-gray-100 overflow-hidden max-h-[400px] overflow-y-auto z-40 animate-fadeIn">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500 text-sm">{t('search.searching')}</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {results.map((item, index) => (
                                    <li key={item.id || index}>
                                        <button
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                                            onClick={() => handleResultClick(item)}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                                {searchType === 'Project' ? <IoBriefcase size={14} /> :
                                                    searchType === 'Lead' ? <IoDocumentText size={14} /> :
                                                        <IoCheckmarkCircle size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                    {item.title || item.name || item.project_name || item.company_name || t('search.untitled')}
                                                </p>
                                                <p className="text-xs text-secondary-text truncate">
                                                    {searchType === 'Task' ? (item.project_name ? `${t('search.project')}: ${item.project_name}` : t('search.no_project')) :
                                                        (item.status || t('search.no_status'))}
                                                </p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {searchQuery && !loading && results.length === 0 && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-xl shadow-elevated border border-gray-100 p-4 text-center text-gray-500 text-sm z-40">
                        {(t('search.no_results') || '').replace('{{query}}', searchQuery)}
                    </div>
                )}
            </div>
        </div>
    )
}

export default GlobalSearch
