import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    IoCheckmarkCircle,
    IoCloseCircle,
    IoWarning,
    IoInformationCircle,
    IoClose
} from 'react-icons/io5'

/**
 * NotificationModal Component
 * 
 * Centered modal popup for success/error/warning messages
 * Replaces top alerts with clean, non-intrusive centered popups
 * Following RiceCRM pattern
 */

const NotificationModal = ({
    isOpen,
    onClose,
    type = 'success', // 'success', 'error', 'warning', 'info'
    title,
    message,
    autoClose = true,
    autoCloseDelay = 3000,
    showCloseButton = true,
    actions = [] // [{ label: 'OK', onClick: () => {}, variant: 'primary' }]
}) => {
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

    // Auto-close functionality
    useEffect(() => {
        if (isOpen && autoClose && autoCloseDelay > 0) {
            const timer = setTimeout(() => {
                onClose()
            }, autoCloseDelay)
            return () => clearTimeout(timer)
        }
    }, [isOpen, autoClose, autoCloseDelay, onClose])

    if (!isOpen || !portalContainer) return null

    // Type configurations
    const typeConfig = {
        success: {
            icon: IoCheckmarkCircle,
            iconColor: 'text-green-500',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            titleColor: 'text-green-800'
        },
        error: {
            icon: IoCloseCircle,
            iconColor: 'text-red-500',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            titleColor: 'text-red-800'
        },
        warning: {
            icon: IoWarning,
            iconColor: 'text-amber-500',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200',
            titleColor: 'text-amber-800'
        },
        info: {
            icon: IoInformationCircle,
            iconColor: 'text-blue-500',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            titleColor: 'text-blue-800'
        }
    }

    const config = typeConfig[type] || typeConfig.info
    const Icon = config.icon

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`
          relative w-full max-w-md bg-white rounded-2xl shadow-2xl
          transform transition-all duration-300 ease-out
          animate-modal-popup
        `}
            >
                {/* Close Button */}
                {showCloseButton && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                        <IoClose size={20} />
                    </button>
                )}

                {/* Content */}
                <div className="p-6 text-center">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full ${config.bgColor}`}>
                        <Icon size={32} className={config.iconColor} />
                    </div>

                    {/* Title */}
                    {title && (
                        <h3 className={`text-xl font-semibold mb-2 ${config.titleColor}`}>
                            {title}
                        </h3>
                    )}

                    {/* Message */}
                    {message && (
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {message}
                        </p>
                    )}

                    {/* Actions */}
                    {actions.length > 0 && (
                        <div className="flex items-center justify-center gap-3 mt-6">
                            {actions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        action.onClick?.()
                                        if (action.closeOnClick !== false) {
                                            onClose()
                                        }
                                    }}
                                    className={`
                    px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${action.variant === 'primary'
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                            : action.variant === 'danger'
                                                ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }
                  `}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Progress bar for auto-close */}
                {autoClose && autoCloseDelay > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-2xl overflow-hidden">
                        <div
                            className={`h-full transition-all ease-linear ${type === 'success' ? 'bg-green-500' :
                                type === 'error' ? 'bg-red-500' :
                                    type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                }`}
                            style={{
                                animation: `shrink ${autoCloseDelay}ms linear forwards`
                            }}
                        />
                    </div>
                )}
            </div>

            <style>{`
        @keyframes modal-popup {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-modal-popup {
          animation: modal-popup 0.3s ease-out forwards;
        }
        
        @keyframes shrink {
          0% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
      `}</style>
        </div>,
        portalContainer
    )
}

export default NotificationModal
