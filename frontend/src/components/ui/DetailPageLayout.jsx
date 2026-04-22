import { useState } from 'react'
import { IoChevronDown, IoChevronUp } from 'react-icons/io5'

/**
 * DetailPageLayout Component
 * 
 * RiceCRM-style layout with:
 * - Left: Main information panel
 * - Right: Related activities (tasks, notes, calendar, follow-ups)
 * 
 * Clean, box-based layout with proper spacing and alignment
 */

const DetailPageLayout = ({
    children,
    leftContent,
    rightContent,
    leftWidth = 'w-2/3',
    rightWidth = 'w-1/3',
    showRightPanel = true,
    rightPanelTitle = 'Activities',
    className = ''
}) => {
    const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false)

    return (
        <div className={`flex gap-6 ${className}`}>
            {/* Left Panel - Main Content */}
            <div className={`${showRightPanel && !isRightPanelCollapsed ? leftWidth : 'w-full'} transition-all duration-300`}>
                {leftContent || children}
            </div>

            {/* Right Panel - Activities */}
            {showRightPanel && (
                <div className={`${isRightPanelCollapsed ? 'w-12' : rightWidth} transition-all duration-300`}>
                    <RightActivityPanel
                        title={rightPanelTitle}
                        isCollapsed={isRightPanelCollapsed}
                        onToggleCollapse={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                    >
                        {rightContent}
                    </RightActivityPanel>
                </div>
            )}
        </div>
    )
}

/**
 * Right Activity Panel Component
 * 
 * Collapsible side panel for activities
 */
const RightActivityPanel = ({
    title,
    children,
    isCollapsed,
    onToggleCollapse
}) => {
    if (isCollapsed) {
        return (
            <div
                onClick={onToggleCollapse}
                className="sticky top-6 bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-all duration-200"
            >
                <div className="flex items-center justify-center py-4">
                    <div className="writing-mode-vertical text-sm font-medium text-gray-600 transform rotate-180">
                        {title}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="sticky top-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
                <button
                    onClick={onToggleCollapse}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all duration-200"
                    title="Collapse panel"
                >
                    <IoChevronUp size={16} className="transform rotate-90" />
                </button>
            </div>

            {/* Panel Content */}
            <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                {children}
            </div>
        </div>
    )
}

/**
 * InfoCard Component
 * 
 * RiceCRM-style information card with clean layout
 */
export const InfoCard = ({
    title,
    icon: Icon,
    children,
    actions,
    collapsible = false,
    defaultExpanded = true,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)

    return (
        <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
            {/* Card Header */}
            <div
                className={`flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100 ${collapsible ? 'cursor-pointer' : ''
                    }`}
                onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon size={18} className="text-blue-600" />}
                    <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    {actions}
                    {collapsible && (
                        isExpanded ? (
                            <IoChevronUp size={16} className="text-gray-400" />
                        ) : (
                            <IoChevronDown size={16} className="text-gray-400" />
                        )
                    )}
                </div>
            </div>

            {/* Card Content */}
            {(!collapsible || isExpanded) && (
                <div className="p-5">
                    {children}
                </div>
            )}
        </div>
    )
}

/**
 * InfoRow Component
 * 
 * Single row of information with label and value
 */
export const InfoRow = ({
    label,
    value,
    icon: Icon,
    className = ''
}) => (
    <div className={`flex items-start gap-3 py-2.5 ${className}`}>
        {Icon && <Icon size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">{label}</div>
            <div className="text-sm text-gray-800 font-medium truncate">
                {value || <span className="text-gray-400 italic">Not specified</span>}
            </div>
        </div>
    </div>
)

/**
 * ActivityItem Component
 * 
 * Single activity item for the right panel
 */
export const ActivityItem = ({
    icon: Icon,
    iconColor = 'text-blue-600',
    iconBgColor = 'bg-blue-50',
    title,
    subtitle,
    time,
    actions,
    onClick
}) => (
    <div
        className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 ${onClick ? 'cursor-pointer' : ''
            }`}
        onClick={onClick}
    >
        {/* Icon */}
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${iconBgColor} flex-shrink-0`}>
            {Icon && <Icon size={18} className={iconColor} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{title}</div>
            {subtitle && (
                <div className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</div>
            )}
            {time && (
                <div className="text-xs text-gray-400 mt-1">{time}</div>
            )}
        </div>

        {/* Actions */}
        {actions && (
            <div className="flex items-center gap-1 flex-shrink-0">
                {actions}
            </div>
        )}
    </div>
)

/**
 * QuickActionsBar Component
 * 
 * Horizontal bar with action buttons
 */
export const QuickActionsBar = ({
    actions = [],
    className = ''
}) => (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        {actions.map((action, index) => (
            <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`
          flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
          transition-all duration-200
          ${action.variant === 'primary'
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : action.variant === 'success'
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                            : action.variant === 'danger'
                                ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }
          ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                {action.icon && <action.icon size={16} />}
                {action.label}
            </button>
        ))}
    </div>
)

/**
 * EmptyState Component
 * 
 * Display when no data is available
 */
export const EmptyState = ({
    icon: Icon,
    title,
    description,
    action
}) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        {Icon && (
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100">
                <Icon size={28} className="text-gray-400" />
            </div>
        )}
        <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
        {description && (
            <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
        )}
        {action && (
            <button
                onClick={action.onClick}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm"
            >
                {action.icon && <action.icon size={16} />}
                {action.label}
            </button>
        )}
    </div>
)

export default DetailPageLayout
