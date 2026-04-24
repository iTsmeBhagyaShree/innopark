import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../context/LanguageContext'
import {
    IoSearch, IoFilter, IoAdd, IoBriefcase, IoBusiness, IoPricetag,
    IoCheckmarkCircle, IoList, IoGrid, IoPerson,
    IoTimeOutline, IoEllipsisHorizontal, IoChevronBack, IoChevronForward,
    IoTrashOutline, IoPencil, IoEye, IoClose, IoCashOutline,
    IoCalendarOutline, IoDocumentTextOutline, IoLayers, IoFunnelOutline,
    IoRefreshOutline, IoColorPaletteOutline, IoPersonOutline, IoStatsChartOutline,
    IoChevronDown
} from 'react-icons/io5'
import { dealsAPI, companiesAPI, dealPipelinesAPI, employeesAPI, customFieldsAPI } from '../../../api'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import CustomFieldsSection from '../../../components/ui/CustomFieldsSection'

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (amount, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0)

const fmtShort = (n) => {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(n || 0)
}

const EMPTY_FORM = {
    title: '', company_id: '', total: '', currency: 'EUR',
    valid_till: '', status: 'Draft', description: '', pipeline_id: '', stage_id: '',
    assigned_to: '', custom_fields: {}
}

// ─── DealFormFields (top-level to avoid remount bug) ─────────────────────────
const DealFormFields = ({ data, setData, employees, pipelines, onPipelineChange }) => {
    const { t } = useLanguage()
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">{t('deals.form.title')} *</label>
                    <div className="relative">
                        <input required type="text" value={data.title}
                            onChange={e => setData(p => ({ ...p, title: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-sm transition-all"
                            placeholder={t('deals.form.placeholder_title')} />
                        <IoBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">{t('deals.form.assigned_to')}</label>
                    <div className="relative">
                        <select value={data.assigned_to} onChange={e => setData(p => ({ ...p, assigned_to: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-sm appearance-none transition-all">
                            <option value="">{t('deals.form.unassigned')}</option>
                            {(employees || []).map(e => <option key={e.id} value={e.user_id}>{e.name}</option>)}
                        </select>
                        <IoPersonOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">{t('deals.form.pipeline')} *</label>
                <p className="text-[11px] text-gray-500 mb-2 font-medium">{t('deals.form.stage_inherited_hint')}</p>
                <div className="relative">
                    <select required value={data.pipeline_id}
                        onChange={e => { const pid = e.target.value; setData(p => ({ ...p, pipeline_id: pid })); onPipelineChange && onPipelineChange(pid) }}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-sm appearance-none transition-all">
                        <option value="">{t('deals.form.select_pipeline')}</option>
                        {(pipelines || []).map(p => <option key={p.id} value={p.id}>{['sales pipeline'].includes((p.name||'').toLowerCase()) ? t('deals.pipelines.sales') : p.name}</option>)}
                    </select>
                    <IoLayers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">{t('deals.form.amount')} *</label>
                    <div className="relative">
                        <input required type="number" value={data.total} onChange={e => setData(p => ({ ...p, total: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-sm transition-all"
                            placeholder="0.00" min="0" step="0.01" />
                        <IoCashOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">{t('deals.form.valid_till')}</label>
                    <div className="relative">
                        <input type="date" value={data.valid_till} onChange={e => setData(p => ({ ...p, valid_till: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-sm transition-all" />
                        <IoCalendarOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">{t('deals.form.description')}</label>
                <div className="relative">
                    <textarea value={data.description} onChange={e => setData(p => ({ ...p, description: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-sm transition-all min-h-[80px] resize-none"
                        placeholder={t('deals.form.placeholder_desc')} />
                    <IoDocumentTextOutline className="absolute left-3 top-3 text-gray-400" size={16} />
                </div>
            </div>
        </div>
    )
}

// ─── DealCard ────────────────────────────────────────────────────────────────
const DealCard = ({ deal, onDragStart, onDragEnd, onEdit, onDelete, navigate, user, draggable = true }) => {
    const { t } = useLanguage()
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const daysLeft = deal.valid_till
        ? Math.ceil((new Date(deal.valid_till) - new Date()) / 86400000)
        : null

    return (
        <div
            draggable={draggable}
            onDragStart={draggable ? (e) => onDragStart(e, deal) : undefined}
            onDragEnd={onDragEnd}
            className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-accent/40 transition-all group select-none ${
                draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
            }`}
        >
            {/* Color bar */}
            <div className="h-1 rounded-t-xl" style={{ backgroundColor: deal.stage_color || '#6366f1' }} />

            <div className="p-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <h4
                        className="font-bold text-gray-900 group-hover:text-primary-accent transition-colors leading-tight line-clamp-2 text-sm cursor-pointer flex-1"
                        onClick={() => {
                            const path = user?.role === 'EMPLOYEE' ? `/app/employee/deals/${deal.id}` : `/app/admin/deals/${deal.id}`;
                            navigate(path);
                        }}
                    >
                        {deal.title}
                    </h4>
                    <div className="relative flex-shrink-0" ref={menuRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                        >
                            <IoEllipsisHorizontal size={16} />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-7 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-36 py-1 animate-in fade-in zoom-in-95 duration-150">
                                <button onClick={() => { 
                                    const path = user?.role === 'EMPLOYEE' ? `/app/employee/deals/${deal.id}` : `/app/admin/deals/${deal.id}`;
                                    navigate(path); 
                                    setMenuOpen(false);
                                }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    <IoEye size={14} /> {t('common.view')}
                                </button>
                                <button onClick={() => { onEdit(deal); setMenuOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    <IoPencil size={14} /> {t('common.edit')}
                                </button>
                                <button onClick={() => { onDelete(deal); setMenuOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <IoTrashOutline size={14} /> {t('common.delete')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Company */}
                {(deal.company_name || deal.client_name) && (
                    <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                        <IoBusiness size={12} className="flex-shrink-0" />
                        <span className="text-[11px] font-semibold truncate">{deal.company_name || deal.client_name}</span>
                    </div>
                )}

                {/* Assigned */}
                {deal.assigned_to_name && (
                    <div className="flex items-center gap-1.5 text-gray-400 mb-2">
                        <IoPersonOutline size={12} className="flex-shrink-0" />
                        <span className="text-[11px] truncate">{deal.assigned_to_name}</span>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
                    <div className="text-sm font-black text-gray-900">{fmt(deal.total, deal.currency)}</div>
                    <div className="flex items-center gap-2">
                        {daysLeft !== null && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${daysLeft < 0 ? 'bg-red-100 text-red-600' : daysLeft <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                {daysLeft < 0 ? `${Math.abs(daysLeft)} ${t('deals.summary.days_ago')}` : `${daysLeft} ${t('deals.summary.days_left')}`}
                            </span>
                        )}
                        <div className="w-6 h-6 rounded-full bg-primary-accent/10 flex items-center justify-center text-[10px] font-bold text-primary-accent uppercase" title={deal.created_by_name}>
                            {deal.created_by_name?.charAt(0) || 'U'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────
const KanbanColumn = ({ stage, deals, onDragStart, onDragEnd, onDragOver, onDrop, onEdit, onDelete, navigate, isDragOver, user, cardsDraggable = true }) => {
    const { t } = useLanguage()
    const totalValue = deals.reduce((s, d) => s + parseFloat(d.total || 0), 0)

    return (
        <div
            className={`flex-shrink-0 w-[300px] flex flex-col rounded-2xl border transition-all duration-200 ${isDragOver ? 'border-primary-accent/50 bg-primary-accent/5 shadow-lg shadow-primary-accent/10' : 'border-gray-200/70 bg-gray-50/80'}`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, stage.id)}
        >
            {/* Column header */}
            <div className="p-3 pb-2">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: stage.color || '#6366f1' }} />
                        <h3 className="font-black text-gray-800 text-xs uppercase tracking-wider">{['new','in progress','won','lost'].includes((stage.name||'').toLowerCase()) ? t('deals.stages.' + stage.name.toLowerCase().replace(' ', '_')) : stage.name}</h3>
                        <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-black text-gray-500 border border-gray-200 shadow-sm">{deals.length}</span>
                    </div>
                </div>
                {deals.length > 0 && (
                    <div className="text-[11px] font-bold text-gray-400 pl-5">{fmtShort(totalValue)}</div>
                )}
                {/* Progress bar */}
                <div className="mt-2 h-0.5 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: stage.color || '#6366f1', width: `${Math.min(100, deals.length * 10)}%` }} />
                </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5 min-h-[120px] max-h-[calc(100vh-280px)] custom-scrollbar">
                {deals.map(deal => (
                    <DealCard
                        key={deal.id}
                        deal={deal}
                        draggable={cardsDraggable}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        navigate={navigate}
                        user={user}
                    />
                ))}
                {deals.length === 0 && (
                    <div className={`h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all ${isDragOver ? 'border-primary-accent/40 bg-primary-accent/5' : 'border-gray-200 opacity-40'}`}>
                        <IoBriefcase size={20} className="text-gray-300" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {cardsDraggable ? t('deals.kanban.drop_here') : t('deals.kanban.no_stages_list')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Main Deals Component ─────────────────────────────────────────────────────
const Deals = () => {
    const { t } = useLanguage()
    const { user } = useAuth()
    const navigate = useNavigate()
    const companyId = useMemo(() => {
        const id = user?.company_id || localStorage.getItem('companyId') || '1'
        return parseInt(id, 10) || 1
    }, [user])

    // Data
    const [deals, setDeals] = useState([])
    const [pipelines, setPipelines] = useState([])
    const [stages, setStages] = useState([])
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // View & pipeline
    const [viewMode, setViewMode] = useState('kanban')
    const [activePipelineId, setActivePipelineId] = useState('')

    // Drag
    const [draggedDeal, setDraggedDeal] = useState(null)
    const [dragOverStageId, setDragOverStageId] = useState(null)

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [selectedDeal, setSelectedDeal] = useState(null)

    // Search & filters
    const [searchQuery, setSearchQuery] = useState('')
    const [filterAssignedTo, setFilterAssignedTo] = useState('')
    const [filterDateFrom, setFilterDateFrom] = useState('')
    const [filterDateTo, setFilterDateTo] = useState('')
    const [filterMinValue, setFilterMinValue] = useState('')
    const [filterMaxValue, setFilterMaxValue] = useState('')

    // Forms
    const [formData, setFormData] = useState({ ...EMPTY_FORM, company_id: companyId })
    const [editData, setEditData] = useState({ ...EMPTY_FORM })

    // ── fetch ──────────────────────────────────────────────────────────────────
    const fetchDeals = useCallback(async () => {
        try {
            setLoading(true)
            const params = { company_id: companyId }
            if (filterAssignedTo) params.assigned_to = filterAssignedTo
            if (filterDateFrom) params.date_from = filterDateFrom
            if (filterDateTo) params.date_to = filterDateTo
            if (filterMinValue) params.min_value = filterMinValue
            if (filterMaxValue) params.max_value = filterMaxValue
            const res = await dealsAPI.getAll(params)
            if (res.data.success) setDeals(res.data.data || [])
        } catch (err) {
            console.error('Error fetching deals:', err)
        } finally {
            setLoading(false)
        }
    }, [companyId, filterAssignedTo, filterDateFrom, filterDateTo, filterMinValue, filterMaxValue])

    const fetchPipelines = useCallback(async () => {
        try {
            const res = await dealPipelinesAPI.getAllPipelines({ company_id: companyId })
            if (res.data.success && res.data.data.length > 0) {
                setPipelines(res.data.data)
                const def = res.data.data.find(p => p.is_default) || res.data.data[0]
                setActivePipelineId(String(def.id))
                setFormData(prev => ({ ...prev, pipeline_id: String(def.id) }))
                fetchStages(def.id)
            }
        } catch (err) { console.error('fetchPipelines:', err) }
    }, [companyId])

    const fetchStages = async (pipelineId) => {
        try {
            const res = await dealPipelinesAPI.getStages(pipelineId)
            if (res.data.success) {
                const list = res.data.data || []
                setStages(list)
                if (list.length > 0) {
                    const first = String(list[0].id)
                    if (isEditModalOpen) {
                        setEditData(prev => ({ ...prev, stage_id: first, pipeline_id: String(pipelineId) }))
                    } else {
                        setFormData(prev => ({ ...prev, stage_id: first, pipeline_id: String(pipelineId) }))
                    }
                }
            }
        } catch (err) { console.error('fetchStages:', err) }
    }



    const fetchEmployees = useCallback(async () => {
        try {
            const res = await employeesAPI.getAll({ company_id: companyId })
            if (res.data.success) setEmployees(res.data.data || [])
        } catch (err) { console.error('fetchEmployees:', err) }
    }, [companyId])

    useEffect(() => {
        fetchDeals()
        fetchPipelines()
        fetchEmployees()
    }, [companyId])

    useEffect(() => { fetchDeals() }, [filterAssignedTo, filterDateFrom, filterDateTo, filterMinValue, filterMaxValue])

    // ── filtered deals ─────────────────────────────────────────────────────────
    const filteredDeals = useMemo(() => {
        const q = searchQuery.toLowerCase()
        return deals.filter(d =>
            !q ||
            (d.title || '').toLowerCase().includes(q) ||
            (d.company_name || '').toLowerCase().includes(q) ||
            (d.client_name || '').toLowerCase().includes(q) ||
            (d.deal_number || '').toLowerCase().includes(q)
        )
    }, [deals, searchQuery])

    /** Deals belonging to the selected pipeline (incl. legacy rows without pipeline_id on the default pipeline only) */
    const dealsInActivePipeline = useMemo(() => {
        if (!activePipelineId) return []
        const def = pipelines.find((p) => p.is_default) || pipelines[0]
        return filteredDeals.filter((d) => {
            if (d.pipeline_id == null || d.pipeline_id === '') {
                return def && String(def.id) === String(activePipelineId)
            }
            return String(d.pipeline_id) === String(activePipelineId)
        })
    }, [filteredDeals, activePipelineId, pipelines])

    const getDealsByStage = useCallback(
        (stageId) =>
            filteredDeals.filter((d) => {
                if (!activePipelineId) return false
                const def = pipelines.find((p) => p.is_default) || pipelines[0]
                const inPipeline =
                    String(d.pipeline_id) === String(activePipelineId) ||
                    ((d.pipeline_id == null || d.pipeline_id === '') && def && String(def.id) === String(activePipelineId))
                if (!inPipeline) return false
                if (d.stage_id != null && d.stage_id !== '' && String(d.stage_id) === String(stageId)) return true
                const inSet = (sid) => stages.some((s) => String(s.id) === String(sid))
                if (d.stage_id == null || d.stage_id === '' || !inSet(d.stage_id)) {
                    return String(stageId) === String(stages[0]?.id)
                }
                return false
            }),
        [filteredDeals, activePipelineId, pipelines, stages]
    )

    // List = all search-filtered deals; Kanban = selected pipeline
    const headerSummary = useMemo(() => {
        const list = viewMode === 'list' ? filteredDeals : dealsInActivePipeline
        const value = list.reduce((s, d) => s + parseFloat(d.total || 0), 0)
        return { count: list.length, value }
    }, [viewMode, filteredDeals, dealsInActivePipeline])

    // ── drag & drop ────────────────────────────────────────────────────────────
    const handleDragStart = (e, deal) => {
        setDraggedDeal(deal)
        e.dataTransfer.effectAllowed = 'move'
    }
    const handleDragEnd = () => { setDraggedDeal(null); setDragOverStageId(null) }
    const handleDragOver = (e, stageId) => { e.preventDefault(); setDragOverStageId(stageId) }

    const handleDrop = async (e, stageId) => {
        e.preventDefault()
        setDragOverStageId(null)
        if (!draggedDeal || String(draggedDeal.stage_id) === String(stageId)) return
        // Optimistic update
        setDeals(prev => prev.map(d => d.id === draggedDeal.id ? { ...d, stage_id: stageId, pipeline_id: activePipelineId } : d))
        try {
            await dealsAPI.updateStage(draggedDeal.id, { stage_id: stageId, pipeline_id: activePipelineId })
        } catch (err) {
            console.error('Stage update failed:', err)
            fetchDeals()
        }
    }

    // ── CRUD ───────────────────────────────────────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault()
        try {
            setSubmitting(true)
            const pipelineId = formData.pipeline_id || activePipelineId
            const stageId = formData.stage_id || (stages[0] && String(stages[0].id)) || undefined
            const res = await dealsAPI.create({
                ...formData,
                company_id: companyId,
                pipeline_id: pipelineId,
                stage_id: stageId,
            })
            if (res.data.success) {
                setIsAddModalOpen(false)
                setFormData({
                    ...EMPTY_FORM,
                    company_id: companyId,
                    pipeline_id: String(activePipelineId || pipelineId || ''),
                    stage_id: stages[0]?.id != null ? String(stages[0].id) : '',
                })
                await fetchDeals()
            }
        } catch (err) { console.error('Create deal error:', err); alert(t('messages.createError')) }
        finally { setSubmitting(false) }
    }

    const handleEdit = (deal) => {
        setSelectedDeal(deal)
        setEditData({
            title: deal.title || '',
            client_id: deal.client_id || '',
            company_id: deal.company_id || companyId,
            total: deal.total || '',
            currency: deal.currency || 'USD',
            valid_till: deal.valid_till ? deal.valid_till.split('T')[0] : '',
            status: deal.status || 'Draft',
            description: deal.description || '',
            pipeline_id: deal.pipeline_id || activePipelineId,
            stage_id: deal.stage_id || '',
            assigned_to: deal.assigned_to || '',
            custom_fields: deal.custom_fields || {}
        })
        setIsEditModalOpen(true)
    }

    const handleUpdate = async (e) => {
        e.preventDefault()
        try {
            setSubmitting(true)
            const res = await dealsAPI.update(selectedDeal.id, editData)
            if (res.data.success) { setIsEditModalOpen(false); fetchDeals() }
        } catch (err) { console.error('Update deal error:', err); alert(t('messages.updateError')) }
        finally { setSubmitting(false) }
    }

    const handleDelete = (deal) => { setSelectedDeal(deal); setIsDeleteModalOpen(true) }
    const confirmDelete = async () => {
        try {
            await dealsAPI.delete(selectedDeal.id)
            setIsDeleteModalOpen(false)
            fetchDeals()
        } catch (err) { console.error('Delete error:', err) }
    }

    const activeFiltersCount = [filterAssignedTo, filterDateFrom, filterDateTo, filterMinValue, filterMaxValue].filter(Boolean).length

    const clearFilters = () => {
        setFilterAssignedTo(''); setFilterDateFrom(''); setFilterDateTo('')
        setFilterMinValue(''); setFilterMaxValue('')
    }

    // DealFormFields is defined at top-level (above Deals component)

    // ── render ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-gray-50">

            {/* ── Header ── */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 flex flex-col gap-3 shadow-sm z-20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Title + tabs */}
                    <div>
                        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <IoBriefcase className="text-primary-accent" size={22} /> <span className="notranslate">{t('Deals')}</span>
                        </h1>
                        <div className="flex items-center gap-1 mt-1.5">
                            {[{ id: 'kanban', icon: IoGrid, label: 'Kanban' }, { id: 'list', icon: IoList, label: t('common.list') || 'Liste' }].map(v => (
                                <button key={v.id} onClick={() => setViewMode(v.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === v.id ? 'bg-primary-accent/10 text-primary-accent' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                                    <v.icon size={14} /> {v.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full lg:w-auto">
                        {/* Pipeline selector */}
                        {pipelines.length > 0 && (
                            <div className="relative w-full sm:w-auto">
                                <IoLayers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <select
                                    className="appearance-none bg-gray-50 border border-gray-200 rounded-xl w-full sm:w-auto py-2 pr-8 focus:outline-none cursor-pointer text-sm font-bold text-gray-700 w-full sm:w-auto transition-all"
                                    style={{ paddingLeft: '2.25rem' }}
                                    value={activePipelineId}
                                    onChange={(e) => {
                                        const v = e.target.value
                                        setActivePipelineId(v)
                                        fetchStages(v)
                                        setFormData((p) => ({ ...p, pipeline_id: v }))
                                    }}
                                >
                                    {pipelines.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {['sales pipeline'].includes((p.name || '').toLowerCase()) ? t('deals.pipelines.sales') : p.name}
                                        </option>
                                    ))}
                                </select>
                                <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative w-full sm:w-auto flex-1 sm:flex-none">
                            <input type="text" placeholder={t('deals.search_placeholder')} value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full sm:w-52 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent text-sm transition-all"
                                style={{ paddingLeft: '2.5rem' }}
                            />
                            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        </div>

                        {/* Filter btn */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button onClick={() => setIsFilterOpen(v => !v)}
                                className={`flex-1 sm:flex-none relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-bold transition-all ${isFilterOpen || activeFiltersCount > 0 ? 'bg-primary-accent text-white border-primary-accent shadow-lg shadow-primary-accent/30' : 'bg-white border-gray-200 text-gray-600 hover:border-primary-accent hover:text-primary-accent'}`}>
                                <IoFunnelOutline size={15} /> {t('common.filter')}
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{activeFiltersCount}</span>
                                )}
                            </button>

                            {/* Add Deal */}
                            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 shadow-lg shadow-primary-accent/30 text-sm py-2 px-4 whitespace-nowrap">
                                <IoAdd size={18} /> {t('deals.add_deal')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filter Panel */}
                {isFilterOpen && (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[160px]">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('common.assigned_to')}</label>
                                <select value={filterAssignedTo} onChange={e => setFilterAssignedTo(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent">
                                    <option value="">{t('common.all_users')}</option>
                                    {employees.map(e => <option key={e.id} value={e.user_id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('common.date_from')}</label>
                                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent" />
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('deals.date_to')}</label>
                                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent" />
                            </div>
                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('deals.min_value')}</label>
                                <input type="number" value={filterMinValue} onChange={e => setFilterMinValue(e.target.value)}
                                    placeholder="0" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent" />
                            </div>
                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('deals.max_value')}</label>
                                <input type="number" value={filterMaxValue} onChange={e => setFilterMaxValue(e.target.value)}
                                    placeholder="∞" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent" />
                            </div>
                            {activeFiltersCount > 0 && (
                                <button onClick={clearFilters}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl border border-red-200 transition-all">
                                    <IoClose size={14} /> {t('common.clear')}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Stats bar */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-bold"><span className="text-gray-900">{headerSummary.count}</span> {t('deals.items')}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="font-bold">{t('deals.summary.total')}: <span className="text-primary-accent">{fmtShort(headerSummary.value)}</span></span>
                    {activeFiltersCount > 0 && <><span className="w-1 h-1 bg-gray-300 rounded-full" /><span className="text-amber-600 font-bold">{activeFiltersCount} {t('deals.summary.active_filters')}</span></>}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-auto p-5">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-primary-accent/20 border-t-primary-accent rounded-full animate-spin" />
                            <span className="text-sm text-gray-500 font-medium">{t('deals.loading')}</span>
                        </div>
                    </div>
                ) : viewMode === 'kanban' ? (
                    /* ── KANBAN ── */
                    <div className="flex gap-4 h-full min-h-[320px] overflow-x-auto pb-4 custom-scrollbar scrollbar-hide">
                        {stages.length === 0 && activePipelineId && dealsInActivePipeline.length > 0 ? (
                            <div className="flex flex-col gap-2 w-full">
                                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 max-w-2xl">
                                    {t('deals.kanban.no_stages_running')}
                                </p>
                                <div className="flex gap-4">
                                    <KanbanColumn
                                        key="deals-fallback"
                                        stage={{ id: '_fallback', name: t('deals.kanban.fallback_title'), color: '#6366f1' }}
                                        deals={dealsInActivePipeline}
                                        cardsDraggable={false}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => e.preventDefault()}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        navigate={navigate}
                                        isDragOver={false}
                                        user={user}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 pl-1">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/app/admin/settings/pipelines')}
                                        className="text-primary-accent font-medium hover:underline"
                                    >
                                        {t('deals.kanban.manage_pipelines_short')}
                                    </button>
                                </p>
                            </div>
                        ) : stages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 min-h-[280px]">
                                <IoLayers size={40} className="text-gray-200" />
                                <p className="font-bold text-sm text-center px-4">{t('deals.kanban.no_stages')}</p>
                                <p className="text-xs text-gray-500 text-center max-w-md px-4">{t('deals.kanban.no_stages_hint')}</p>
                                <button
                                    type="button"
                                    onClick={() => navigate('/app/admin/settings/pipelines')}
                                    className="mt-1 text-sm text-primary-accent/90 hover:underline"
                                >
                                    {t('deals.kanban.manage_pipelines_short')}
                                </button>
                            </div>
                        ) : (
                            stages.map((stage) => (
                                <KanbanColumn
                                    key={stage.id}
                                    stage={stage}
                                    deals={getDealsByStage(stage.id)}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => handleDragOver(e, stage.id)}
                                    onDrop={handleDrop}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    navigate={navigate}
                                    isDragOver={dragOverStageId === stage.id}
                                    user={user}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    /* ── LIST ── */
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-5 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('deals.list.columns.deal')}</th>
                                        <th className="px-5 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('deals.list.columns.company_client')}</th>
                                        <th className="px-5 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('deals.list.columns.assigned')}</th>
                                        <th className="px-5 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('deals.list.columns.amount')}</th>
                                        <th className="px-5 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('deals.list.columns.stage')}</th>
                                        <th className="px-5 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('deals.list.columns.valid_till')}</th>
                                        <th className="px-5 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('deals.list.columns.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredDeals.length === 0 ? (
                                        <tr><td colSpan={7} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <IoBriefcase size={40} className="text-gray-200" />
                                                <span className="text-sm font-medium">{t('deals.no_deals')}</span>
                                            </div>
                                        </td></tr>
                                    ) : filteredDeals.map(deal => (
                                        <tr key={deal.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => {
                                            const path = user?.role === 'EMPLOYEE' ? `/app/employee/deals/${deal.id}` : `/app/admin/deals/${deal.id}`;
                                            navigate(path);
                                        }}>
                                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                                                <div className="font-bold text-gray-900 group-hover:text-primary-accent transition-colors text-sm">{deal.title}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">{deal.deal_number}</div>
                                            </td>
                                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <IoBusiness size={13} className="text-gray-400" />
                                                    <span className="text-sm text-gray-600">{deal.company_name || deal.client_name || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                                                {deal.assigned_to_name ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">{deal.assigned_to_name.charAt(0)}</div>
                                                        <span className="text-xs text-gray-600">{deal.assigned_to_name}</span>
                                                    </div>
                                                ) : <span className="text-xs text-gray-400">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 font-black text-gray-900 text-sm">{fmt(deal.total, deal.currency)}</td>
                                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                    style={{ backgroundColor: `${deal.stage_color || '#6366f1'}15`, color: deal.stage_color || '#6366f1' }}>
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: deal.stage_color || '#6366f1' }} />
                                                    {deal.stage_name || t('deals.stages.new')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-500">
                                                {deal.valid_till ? new Date(deal.valid_till).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => {
                                                        const path = user?.role === 'EMPLOYEE' ? `/app/employee/deals/${deal.id}` : `/app/admin/deals/${deal.id}`;
                                                        navigate(path);
                                                    }} title={t('common.view')} className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-all"><IoEye size={15} /></button>
                                                    <button onClick={() => handleEdit(deal)} title={t('common.edit')} className="p-1.5 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 transition-all"><IoPencil size={15} /></button>
                                                    <button onClick={() => handleDelete(deal)} title={t('common.delete')} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all"><IoTrashOutline size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ── ADD MODAL ── */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('deals.add_deal')} size="md">
                <form onSubmit={handleCreate}>
                    <DealFormFields
                        data={formData} setData={setFormData}
                        employees={employees}
                        pipelines={pipelines}
                        onPipelineChange={(pid) => fetchStages(pid)}
                    />
                    <CustomFieldsSection module="Deals" companyId={companyId}
                        values={formData.custom_fields || {}}
                        onChange={(name, value) => setFormData(p => ({ ...p, custom_fields: { ...p.custom_fields, [name]: value } }))} />
                    <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="primary" disabled={submitting} className="shadow-lg shadow-primary-accent/30">
                            {submitting ? t('common.loading') : t('deals.add_deal')}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── EDIT MODAL ── */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('deals.edit_deal')} size="md">
                <form onSubmit={handleUpdate}>
                    <DealFormFields
                        data={editData} setData={setEditData}
                        employees={employees}
                        pipelines={pipelines}
                        onPipelineChange={(pid) => fetchStages(pid)}
                    />
                    <CustomFieldsSection module="Deals" companyId={companyId}
                        values={editData.custom_fields || {}}
                        onChange={(name, value) => setEditData(p => ({ ...p, custom_fields: { ...p.custom_fields, [name]: value } }))} />
                    <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="primary" disabled={submitting} className="shadow-lg shadow-primary-accent/30">
                            {submitting ? t('common.loading') : t('common.save')}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── DELETE CONFIRM ── */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('deals.delete_confirm.title')} size="sm">
                <div className="text-center py-4">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IoTrashOutline size={28} className="text-red-500" />
                    </div>
                    <p className="text-gray-700 font-semibold mb-1"><span className="text-gray-900 font-black">"{selectedDeal?.title}"</span> {t('common.delete')}?</p>
                    <p className="text-sm text-gray-500 mb-6">{t('deals.delete_confirm.message')}</p>
                    <div className="flex items-center justify-center gap-3">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button variant="danger" onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white border-red-500">{t('common.delete')}</Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e0; }
            `}</style>
        </div>
    )
}

export default Deals
