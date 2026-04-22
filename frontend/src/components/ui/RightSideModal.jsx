import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IoClose } from 'react-icons/io5'

/**
 * Clean Center Modal Component - Developo Style
 * Fixed compact width, centered, fully responsive
 */
const RightSideModal = ({ isOpen, onClose, title, children, width, size }) => {
  const contentRef = useRef(null)
  const previousIsOpen = useRef(false)
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

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      // Only scroll to top when modal FIRST opens (not on every state change)
      if (!previousIsOpen.current && contentRef.current) {
        contentRef.current.scrollTop = 0
      }
      previousIsOpen.current = true

      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleEscape)

      return () => {
        document.body.style.overflow = originalOverflow || ''
        document.removeEventListener('keydown', handleEscape)
      }
    } else {
      previousIsOpen.current = false
    }
  }, [isOpen, onClose])

  if (!isOpen || !portalContainer) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] overscroll-contain"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Centered Modal Container */}
      <div className="flex min-h-full items-start justify-center p-2 sm:p-4 pt-4 sm:pt-10 md:pt-20">
        {/* Modal Box - Responsive width */}
        <div
          className="relative bg-white rounded-lg shadow-2xl w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px] my-2 sm:my-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-5 py-2.5 sm:py-3.5 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg z-10">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate pr-2">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-1 rounded hover:bg-gray-100 flex-shrink-0"
            >
              <IoClose className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Content */}
          <div
            ref={contentRef}
            className="px-3 sm:px-4 md:px-5 py-3 sm:py-4 overflow-y-auto overflow-x-hidden"
            style={{
              maxHeight: 'calc(85vh - 80px)',
              scrollBehavior: 'auto',
              overscrollBehavior: 'contain'
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, portalContainer)
}

export default RightSideModal

