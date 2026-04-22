/**
 * UniqueIdBadge Component
 * 
 * Displays auto-generated unique IDs for CRM entities
 * Follows RiceCRM pattern for clean, professional ID display
 */

const UniqueIdBadge = ({
    prefix = 'ID',
    id,
    size = 'md',
    variant = 'default',
    copyable = true
}) => {
    // Format ID with prefix and padding
    const formattedId = `${prefix}-${String(id).padStart(4, '0')}`

    const handleCopy = async (e) => {
        e.stopPropagation()
        if (copyable) {
            try {
                await navigator.clipboard.writeText(formattedId)
                // Could add a toast notification here
            } catch (err) {
                console.error('Failed to copy:', err)
            }
        }
    }

    // Size classes
    const sizeClasses = {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5'
    }

    // Variant classes
    const variantClasses = {
        default: 'bg-gray-100 text-gray-700 border-gray-200',
        primary: 'bg-blue-50 text-blue-700 border-blue-200',
        success: 'bg-green-50 text-green-700 border-green-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        danger: 'bg-red-50 text-red-700 border-red-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200'
    }

    // Prefix to variant mapping for automatic coloring
    const prefixVariants = {
        'LEAD': 'primary',
        'CLT': 'success',
        'PRJ': 'purple',
        'TSK': 'warning',
        'INV': 'danger',
        'EST': 'default',
        'PROP': 'default',
        'CNT': 'default'
    }

    const calculatedVariant = variant === 'default' ? (prefixVariants[prefix] || 'default') : variant

    return (
        <span
            onClick={copyable ? handleCopy : undefined}
            title={copyable ? `Click to copy: ${formattedId}` : formattedId}
            className={`
        inline-flex items-center font-mono font-semibold rounded-md border
        ${sizeClasses[size]}
        ${variantClasses[calculatedVariant]}
        ${copyable ? 'cursor-pointer hover:opacity-80 transition-opacity duration-200' : ''}
      `}
        >
            {formattedId}
        </span>
    )
}

/**
 * Helper function to generate unique ID prefixes
 */
export const ID_PREFIXES = {
    LEAD: 'LEAD',
    CLIENT: 'CLT',
    PROJECT: 'PRJ',
    TASK: 'TSK',
    INVOICE: 'INV',
    ESTIMATE: 'EST',
    PROPOSAL: 'PROP',
    CONTRACT: 'CNT'
}

export default UniqueIdBadge
