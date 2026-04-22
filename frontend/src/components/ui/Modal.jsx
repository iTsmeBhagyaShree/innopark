import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IoClose } from 'react-icons/io5'

/**
 * Clean Center Modal Component - Developo Style
 * Fixed compact width, centered, fully responsive
 */
const Modal = ({ isOpen, onClose, title, children, size = 'md', footer, darkMode = false }) => {
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

      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handleEscape)

      return () => {
        document.body.style.overflow = originalOverflow || ''
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen || !portalContainer) return null

  // Responsive widths
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'max-w-[95vw] sm:max-w-[500px]'
      case 'md': return 'max-w-[95vw] sm:max-w-[600px] md:max-w-[700px]'
      case 'lg': return 'max-w-[95vw] sm:max-w-[700px] md:max-w-[900px]'
      case 'xl': return 'max-w-[95vw] sm:max-w-[90vw] lg:max-w-[1100px]'
      case 'full': return 'max-w-[95vw] sm:max-w-[95vw] lg:max-w-[1300px]'
      default: return 'max-w-[95vw] sm:max-w-[600px] md:max-w-[700px]'
    }
  }

  const modalContent = (
    <div
      className={`fixed inset-0 z-[99999] overflow-y-auto overscroll-contain ${darkMode ? 'dark text-white' : ''}`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Centered Modal Container */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        {/* Modal Box */}
        <div
          className={`relative ${darkMode ? 'bg-[#242424] border border-gray-800' : 'bg-white'} rounded-lg sm:rounded-xl shadow-2xl w-full ${getSizeClasses()} transition-all duration-300 transform my-2 sm:my-4`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} sticky top-0 ${darkMode ? 'bg-[#242424]' : 'bg-white'} rounded-t-lg sm:rounded-t-xl z-10`}>
            <h2 className={`text-sm sm:text-base md:text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} uppercase tracking-wide sm:tracking-widest truncate pr-2`}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className={`${darkMode ? 'text-gray-500 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} p-1.5 sm:p-2 rounded-full transition-all flex-shrink-0`}
            >
              <IoClose className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div
            className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 overflow-y-auto overflow-x-auto scrollbar-hide"
            style={{ maxHeight: 'calc(85vh - 120px)' }}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className={`flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t ${darkMode ? 'border-gray-800 bg-black/20' : 'border-gray-200 bg-gray-50'} rounded-b-lg sm:rounded-b-xl sticky bottom-0`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, portalContainer)
}

export default Modal
