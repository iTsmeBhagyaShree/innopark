import { useState, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
    IoClose,
    IoCheckmarkCircle,
    IoPencil,
    IoTrash,
    IoPerson,
    IoFlag,
    IoSwapHorizontal
} from 'react-icons/io5'

/**
 * BulkUpdateModal Component
 * 
 * RiceCRM-style bulk update modal for mass editing selected items
 * Supports changing status, owner, labels, and bulk delete
 */

const BulkUpdateModal = ({
    isOpen,
    onClose,
    selectedCount = 0,
    entityType = 'leads', // 'leads', 'clients', 'projects', 'tasks'
    onUpdate,
    options = {}
}) => {
    const [updateType, setUpdateType] = useState('')
    const [updateValue, setUpdateValue] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [portalContainer, setPortalContainer] = useState(null)
    const portalRef = useRef(null)

    // Create portal container synchronously before render
    useLayoutEffect(() => {
        if (isOpen) {
            // Create a dedicated container for this modal
            const container = document.createElement('div')
            container.setAttribute('data-modal-portal', 'true')
            document.body.appendChild(container)
            portalRef.current = container
            setPortalContainer(container)

            return () => {
                // Cleanup: remove the container when modal closes
                if (portalRef.current && document.body.contains(portalRef.current)) {
                    document.body.removeChild(portalRef.current)
                }
                portalRef.current = null
                setPortalContainer(null)
            }
        }
    }, [isOpen])

    // Default options based on entity type
    const defaultOptions = {
        leads: {
            statusOptions: [
                { value: 'Neu', label: 'Neu' },
                { value: 'Qualified', label: 'Qualified' },
                { value: 'Discussion', label: 'Discussion' },
                { value: 'Negotiation', label: 'Negotiation' },
                { value: 'Gewonnen', label: 'Gewonnen' },
                { value: 'Verloren', label: 'Verloren' }
            ],
            ownerOptions: options.employees || [],
            sourceOptions: options.sources || []
        },
        clients: {
            statusOptions: [
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' }
            ],
            ownerOptions: options.employees || []
        },
        projects: {
            statusOptions: [
                { value: 'Not Started', label: 'Not Started' },
                { value: 'In Bearbeitung', label: 'In Bearbeitung' },
                { value: 'On Hold', label: 'On Hold' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' }
            ],
            ownerOptions: options.employees || []
        },
        tasks: {
            statusOptions: [
                { value: 'Pending', label: 'Pending' },
                { value: 'In Bearbeitung', label: 'In Bearbeitung' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' }
            ],
            priorityOptions: [
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' }
            ],
            ownerOptions: options.employees || []
        }
    }

    const entityOptions = defaultOptions[entityType] || defaultOptions.leads

    const updateTypes = [
        { value: 'status', label: 'Change Status', icon: IoSwapHorizontal },
        { value: 'owner', label: 'Assign Owner', icon: IoPerson },
        ...(entityType === 'leads' ? [{ value: 'source', label: 'Update Source', icon: IoFlag }] : []),
        ...(entityType === 'tasks' ? [{ value: 'priority', label: 'Set Priority', icon: IoFlag }] : []),
        { value: 'delete', label: 'Delete Selected', icon: IoTrash }
    ]

    const handleSubmit = async () => {
        if (!updateType) {
            alert('Please select an action')
            return
        }

        if (updateType !== 'delete' && !updateValue) {
            alert('Please select a value')
            return
        }

        if (updateType === 'delete') {
            const confirmed = window.confirm(
                `Are you sure you want to delete ${selectedCount} ${entityType}? This action cannot be undone.`
            )
            if (!confirmed) return
        }

        setIsSubmitting(true)
        try {
            await onUpdate(updateType, updateValue)
            onClose()
        } catch (error) {
            console.error('Bulk update error:', error)
            alert(error.message || 'Failed to perform bulk update')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getOptionsForType = () => {
        switch (updateType) {
            case 'status':
                return entityOptions.statusOptions || []
            case 'owner':
                return (entityOptions.ownerOptions || []).map(emp => ({
                    value: emp.id,
                    label: emp.name || `${emp.first_name} ${emp.last_name}`
                }))
            case 'source':
                return (entityOptions.sourceOptions || []).map(s => ({
                    value: s,
                    label: s
                }))
            case 'priority':
                return entityOptions.priorityOptions || []
            default:
                return []
        }
    }

    if (!isOpen || !portalContainer) return null

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-900/50">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                            <IoPencil size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Bulk Update</h3>
                            <p className="text-sm text-gray-500">
                                {selectedCount} {entityType} selected
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Action Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Action
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {updateTypes.map((type) => {
                                const Icon = type.icon
                                const isDelete = type.value === 'delete'
                                const isSelected = updateType === type.value

                                return (
                                    <button
                                        key={type.value}
                                        onClick={() => {
                                            setUpdateType(type.value)
                                            setUpdateValue('')
                                        }}
                                        className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200
                      ${isSelected
                                                ? isDelete
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }
                    `}
                                    >
                                        <div className={`
                      flex items-center justify-center w-8 h-8 rounded-lg
                      ${isSelected
                                                ? isDelete
                                                    ? 'bg-red-100'
                                                    : 'bg-blue-100'
                                                : 'bg-gray-100'
                                            }
                    `}>
                                            <Icon
                                                size={18}
                                                className={
                                                    isSelected
                                                        ? isDelete
                                                            ? 'text-red-600'
                                                            : 'text-blue-600'
                                                        : 'text-gray-500'
                                                }
                                            />
                                        </div>
                                        <span className={`
                      text-sm font-medium
                      ${isSelected
                                                ? isDelete
                                                    ? 'text-red-700'
                                                    : 'text-blue-700'
                                                : 'text-gray-700'
                                            }
                    `}>
                                            {type.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Value Selection (not shown for delete) */}
                    {updateType && updateType !== 'delete' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select {updateType === 'status' ? 'Status' : updateType === 'owner' ? 'Owner' : updateType === 'source' ? 'Source' : 'Priority'}
                            </label>
                            <select
                                value={updateValue}
                                onChange={(e) => setUpdateValue(e.target.value)}
                                className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                            >
                                <option value="">Select...</option>
                                {getOptionsForType().map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Delete Warning */}
                    {updateType === 'delete' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <IoTrash size={20} className="text-red-600 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-red-800 mb-1">
                                        Warning: This action is irreversible
                                    </h4>
                                    <p className="text-sm text-red-600">
                                        You are about to permanently delete {selectedCount} {entityType}.
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !updateType || (updateType !== 'delete' && !updateValue)}
                        className={`
              flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              ${updateType === 'delete'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }
            `}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <IoCheckmarkCircle size={18} />
                                {updateType === 'delete' ? 'Delete' : 'Apply Changes'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        portalContainer
    )
}

export default BulkUpdateModal
