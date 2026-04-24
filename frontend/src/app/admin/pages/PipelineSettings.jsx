import { useState, useEffect, useMemo } from 'react'
import {
    IoAdd,
    IoTrashOutline,
    IoPencil,
    IoArrowUp,
    IoArrowDown,
    IoCheckmarkCircle,
    IoList,
    IoLayers,
    IoColorPaletteOutline,
    IoSaveOutline,
    IoSyncOutline,
    IoReorderTwoOutline
} from 'react-icons/io5'
import { leadPipelinesAPI, dealPipelinesAPI } from '../../../api'
import { useLanguage } from '../../../context/LanguageContext'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import ColorPicker from '../../../components/ui/ColorPicker'

const PipelineSettings = () => {
    const { t } = useLanguage()
    const { user } = useAuth()
    const companyId = useMemo(() => {
        const id = user?.company_id || localStorage.getItem('companyId') || '1'
        return parseInt(id, 10) || 1
    }, [user])

    const [activeType, setActiveType] = useState('LEAD') // 'LEAD' or 'DEAL'
    const [pipelines, setPipelines] = useState([])
    const [selectedPipeline, setSelectedPipeline] = useState(null)
    const [stages, setStages] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Modal states
    const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false)
    const [isStageModalOpen, setIsStageModalOpen] = useState(false)
    const [editingStage, setEditingStage] = useState(null)
    const [editingPipeline, setEditingPipeline] = useState(null)

    // Form states
    const [pipelineForm, setPipelineForm] = useState({ name: '', is_default: false })
    const [stageForm, setStageForm] = useState({ name: '', color: '#3B82F6', is_default: false })

    // Reassignment Modal state
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false)
    const [stageToDelete, setStageToDelete] = useState(null)
    const [transferStageId, setTransferStageId] = useState('')
    const [affectedRecordsCount, setAffectedRecordsCount] = useState(0)

    const api = activeType === 'LEAD' ? leadPipelinesAPI : dealPipelinesAPI

    useEffect(() => {
        fetchPipelines()
    }, [activeType, companyId])

    const fetchPipelines = async () => {
        try {
            setLoading(true)
            const res = await api.getAllPipelines({ company_id: companyId })
            if (res.data.success) {
                setPipelines(res.data.data || [])
                if (res.data.data.length > 0) {
                    const defaultP = res.data.data.find(p => p.is_default) || res.data.data[0]
                    setSelectedPipeline(defaultP)
                    fetchStages(defaultP.id)
                } else {
                    setSelectedPipeline(null)
                    setStages([])
                }
            }
        } catch (err) {
            console.error('Error fetching pipelines:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchStages = async (pipelineId) => {
        try {
            const res = await api.getStages(pipelineId)
            if (res.data.success) {
                setStages(res.data.data || [])
            }
        } catch (err) {
            console.error('Error fetching stages:', err)
        }
    }

    const handleSavePipeline = async (e) => {
        e.preventDefault()
        try {
            setSaving(true)
            if (editingPipeline) {
                await api.updatePipeline(editingPipeline.id, { ...pipelineForm, company_id: companyId })
            } else {
                await api.createPipeline({ ...pipelineForm, company_id: companyId })
            }
            setIsPipelineModalOpen(false)
            setEditingPipeline(null)
            setPipelineForm({ name: '', is_default: false })
            fetchPipelines()
        } catch (err) {
            console.error('Error saving pipeline:', err)
        } finally {
            setSaving(false)
        }
    }

    const handleDeletePipeline = async (id) => {
        if (!window.confirm('Are you sure you want to delete this pipeline?')) return
        try {
            await api.deletePipeline(id)
            fetchPipelines()
        } catch (err) {
            console.error('Error deleting pipeline:', err)
        }
    }

    const handleSaveStage = async (e) => {
        e.preventDefault()
        if (!selectedPipeline) return
        try {
            setSaving(true)
            if (editingStage) {
                await api.updateStage(selectedPipeline.id, editingStage.id, stageForm)
            } else {
                await api.createStage(selectedPipeline.id, { ...stageForm, display_order: stages.length })
            }
            setIsStageModalOpen(false)
            setEditingStage(null)
            setStageForm({ name: '', color: '#3B82F6', is_default: false })
            fetchStages(selectedPipeline.id)
        } catch (err) {
            console.error('Error saving stage:', err)
        } finally {
            setSaving(false)
        }
    }

    const attemptDeleteStage = async (id) => {
        try {
            await api.deleteStage(selectedPipeline.id, id)
            fetchStages(selectedPipeline.id)
            setIsReassignModalOpen(false)
            setStageToDelete(null)
            setTransferStageId('')
        } catch (err) {
            if (err.response && err.response.data && err.response.data.requires_transfer) {
                setStageToDelete(id)
                setAffectedRecordsCount(err.response.data.lead_count || err.response.data.deal_count || 0)
                setIsReassignModalOpen(true)
            } else {
                console.error('Error deleting stage:', err)
                alert('Failed to delete stage')
            }
        }
    }

    const handleDeleteStage = async (id) => {
        if (!window.confirm('Are you sure you want to delete this stage?')) return
        attemptDeleteStage(id)
    }

    const handleConfirmReassignDelete = async () => {
        if (!transferStageId) return alert('Please select a stage to transfer records to')
        try {
            await api.deleteStage(selectedPipeline.id, stageToDelete, { transfer_stage_id: transferStageId })
            fetchStages(selectedPipeline.id)
            setIsReassignModalOpen(false)
            setStageToDelete(null)
            setTransferStageId('')
        } catch (err) {
            console.error('Error deleting stage with transfer:', err)
            alert('Failed to delete stage')
        }
    }

    const moveStage = async (index, direction) => {
        const newStages = [...stages]
        const targetIndex = index + direction
        if (targetIndex < 0 || targetIndex >= stages.length) return

        const temp = newStages[index]
        newStages[index] = newStages[targetIndex]
        newStages[targetIndex] = temp

        // Update local state for immediate feedback
        setStages(newStages)

        // Prep data for API
        const payload = newStages.map((s, idx) => ({ id: s.id, display_order: idx }))
        try {
            await api.reorderStages(selectedPipeline.id, { stages: payload })
        } catch (err) {
            console.error('Error reordering stages:', err)
            fetchStages(selectedPipeline.id) // Revert on error
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm z-10">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <IoLayers className="text-primary-accent" /> {t('settings.pipeline.title')}
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">{t('settings.pipeline.description')}</p>
                </div>
                <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveType('LEAD')}
                        className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${activeType === 'LEAD' ? 'bg-white text-primary-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {t('sidebar.leads').toUpperCase()}
                    </button>
                    <button
                        onClick={() => setActiveType('DEAL')}
                        className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${activeType === 'DEAL' ? 'bg-white text-primary-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {t('sidebar.deals').toUpperCase()}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-6 gap-6">
                {/* Pipelines List */}
                <div className="w-full md:w-80 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('settings.pipeline.pipelines')}</h3>
                        <button
                            onClick={() => {
                                setEditingPipeline(null)
                                setPipelineForm({ name: '', is_default: false })
                                setIsPipelineModalOpen(true)
                            }}
                            className="p-1.5 bg-primary-accent/10 text-primary-accent rounded-lg hover:bg-primary-accent/20 transition-all"
                        >
                            <IoAdd size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-accent mx-auto"></div></div>
                        ) : pipelines.length === 0 ? (
                            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 text-center">
                                <p className="text-sm text-gray-400 font-medium italic">{t('settings.pipeline.no_pipelines')}</p>
                            </div>
                        ) : (
                            pipelines.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => {
                                        setSelectedPipeline(p)
                                        fetchStages(p.id)
                                    }}
                                    className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedPipeline?.id === p.id ? 'bg-white border-primary-accent ring-4 ring-primary-accent/5' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold truncate ${selectedPipeline?.id === p.id ? 'text-gray-900' : 'text-gray-500'}`}>{['lead pipeline'].includes((p.name||'').replace(/['"]/g, '').toLowerCase().trim()) ? 'Lead-Pipeline' : ['international sales'].includes((p.name||'').replace(/['"]/g, '').toLowerCase().trim()) ? 'Internationaler Vertrieb' : ['sales pipeline'].includes((p.name||'').replace(/['"]/g, '').toLowerCase().trim()) ? 'Vertriebspipeline' : p.name}</span>
                                            {p.is_default === 1 && <span className="text-[9px] font-black bg-primary-accent/10 text-primary-accent px-1.5 py-0.5 rounded uppercase tracking-wider">{t('settings.pipeline.default_badge')}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setEditingPipeline(p)
                                                setPipelineForm({ name: p.name, is_default: !!p.is_default })
                                                setIsPipelineModalOpen(true)
                                            }}
                                            className="p-1 text-gray-400 hover:text-primary-accent"
                                        >
                                            <IoPencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeletePipeline(p.id) }}
                                            className="p-1 text-gray-400 hover:text-red-500"
                                        >
                                            <IoTrashOutline size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Stages Table */}
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-accent/10 flex items-center justify-center text-primary-accent">
                                <IoList size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900">{t('settings.pipeline.stages_for')}: {selectedPipeline?.name || '...'}</h2>
                                <p className="text-xs text-gray-500 font-medium">{t('settings.pipeline.stages_desc')}</p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            disabled={!selectedPipeline}
                            onClick={() => {
                                setEditingStage(null)
                                setStageForm({ name: '', color: '#3B82F6', is_default: false })
                                setIsStageModalOpen(true)
                            }}
                            className="flex items-center gap-2 shadow-lg shadow-primary-accent/30 hover:shadow-primary-accent/50"
                        >
                            <IoAdd size={20} /> {t('settings.pipeline.add_stage')}
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest w-16 text-center">{t('common.display') || 'Anzeige'}</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest min-w-[200px]">{t('settings.pipeline.stage_name') || 'Phasenname'}</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{t('common.color') || 'Farbe'}</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">{t('common.actions') || 'Aktionen'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stages.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-gray-400 italic font-medium">
                                            No stages defined for this pipeline. Start by adding one!
                                        </td>
                                    </tr>
                                ) : (
                                    stages.map((s, idx) => (
                                        <tr key={s.id} className="hover:bg-gray-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center gap-1">
                                                    <button onClick={() => moveStage(idx, -1)} disabled={idx === 0} className="hover:text-primary-accent disabled:opacity-20"><IoArrowUp size={14} /></button>
                                                    <button onClick={() => moveStage(idx, 1)} disabled={idx === stages.length - 1} className="hover:text-primary-accent disabled:opacity-20"><IoArrowDown size={14} /></button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-10 rounded-full" style={{ backgroundColor: s.color }} />
                                                    <span className="font-bold text-gray-900">{s.name}</span>
                                                    {s.is_default === 1 && <span className="text-[9px] font-black bg-primary-accent/10 text-primary-accent px-1.5 py-0.5 rounded uppercase tracking-wider">{t('common.default') || 'Standard'}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: s.color }}></div>
                                                    <span className="text-xs font-mono text-gray-500 uppercase">{s.color}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingStage(s)
                                                            setStageForm({ name: s.name, color: s.color, is_default: !!s.is_default })
                                                            setIsStageModalOpen(true)
                                                        }}
                                                        className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-primary-accent transition-all"
                                                    >
                                                        <IoPencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStage(s.id)}
                                                        className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-red-500 transition-all"
                                                    >
                                                        <IoTrashOutline size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Pipeline Modal */}
            <Modal
                isOpen={isPipelineModalOpen}
                onClose={() => setIsPipelineModalOpen(false)}
                title={editingPipeline ? 'Edit Pipeline' : 'Create Pipeline'}
                size="sm"
            >
                <form onSubmit={handleSavePipeline} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">{t('common.name') || 'Name'}</label>
                        <input
                            required
                            type="text"
                            value={pipelineForm.name}
                            onChange={e => setPipelineForm({ ...pipelineForm, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                            placeholder="e.g. Vertriebspipeline"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_default"
                            checked={pipelineForm.is_default}
                            onChange={e => setPipelineForm({ ...pipelineForm, is_default: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-primary-accent focus:ring-primary-accent"
                        />
                        <label htmlFor="is_default" className="text-sm font-bold text-gray-700">{t('common.default') || 'Standard'}</label>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-8">
                        <Button variant="outline" type="button" onClick={() => setIsPipelineModalOpen(false)}>{t('common.cancel') || 'Abbrechen'}</Button>
                        <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save Pipeline'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Stage Modal */}
            <Modal
                isOpen={isStageModalOpen}
                onClose={() => setIsStageModalOpen(false)}
                title={editingStage ? 'Edit Stage' : 'Add New Stage'}
                size="sm"
            >
                <form onSubmit={handleSaveStage} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">{t('settings.pipeline.stage_name') || 'Phasenname'}</label>
                        <input
                            required
                            type="text"
                            value={stageForm.name}
                            onChange={e => setStageForm({ ...stageForm, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                            placeholder="e.g. Negotiation"
                        />
                    </div>
                    <ColorPicker
                        label="Stage Color"
                        value={stageForm.color}
                        onChange={color => setStageForm({ ...stageForm, color })}
                    />
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="stage_is_default"
                            checked={stageForm.is_default}
                            onChange={e => setStageForm({ ...stageForm, is_default: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-primary-accent focus:ring-primary-accent"
                        />
                        <label htmlFor="stage_is_default" className="text-sm font-bold text-gray-700">{t('common.default') || 'Standard'}</label>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-8">
                        <Button variant="outline" type="button" onClick={() => setIsStageModalOpen(false)}>{t('common.cancel') || 'Abbrechen'}</Button>
                        <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save Stage'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Reassign Modal */}
            <Modal
                isOpen={isReassignModalOpen}
                onClose={() => setIsReassignModalOpen(false)}
                title="Delete Stage & Reassign Records"
                size="sm"
            >
                <div className="space-y-6">
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium">
                        This stage contains <strong>{affectedRecordsCount}</strong> active {activeType === 'LEAD' ? 'leads' : 'deals'}.
                        You must reassign them to another stage before deleting.
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">{t('settings.pipeline.reassign_to') || 'Neue Phase'}</label>
                        <select
                            value={transferStageId}
                            onChange={(e) => setTransferStageId(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent appearance-none"
                        >
                            <option value="">{t('common.select_stage') || 'Phase auswählen'}</option>
                            {stages.filter(s => s.id !== stageToDelete).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-8">
                        <Button variant="outline" onClick={() => setIsReassignModalOpen(false)}>{t('common.cancel') || 'Abbrechen'}</Button>
                        <Button variant="danger" onClick={handleConfirmReassignDelete} disabled={!transferStageId}>{t('modals.confirmDelete')}</Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e0; }
            `}</style>
        </div>
    )
}

export default PipelineSettings
