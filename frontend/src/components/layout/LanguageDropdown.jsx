import { useState, useRef, useEffect } from 'react'
import { IoChevronDown, IoCheckmark } from 'react-icons/io5'
import { useLanguage } from '../../context/LanguageContext'

const LanguageDropdown = ({ isOpen, onClose, className = "" }) => {
  const dropdownRef = useRef(null)
  const { language: currentLang, changeLanguage, languages } = useLanguage()

  // Find the flag for each language
  const getFlag = (code) => {
    const flags = {
      en: '🇬🇧',
      es: '🇪🇸',
      fr: '🇫🇷',
      de: '🇩🇪',
      ar: '🇸🇦'
    }
    return flags[code] || '🌐'
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className={`fixed right-4 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn ${className}`}
      style={{
        top: '3.5rem',
        zIndex: 99999
      }}
    >
      <div className="p-2 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Select Language
        </div>
        {languages.map((langItem) => (
          <button
            key={langItem.code}
            onClick={() => {
              // Change the LanguageContext (for JSON translations)
              changeLanguage(langItem.code)
              onClose()
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-200 ${currentLang === langItem.code
              ? 'bg-primary-accent text-white shadow-md'
              : 'text-primary-text hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{getFlag(langItem.code)}</span>
              <span className="font-medium">{langItem.name}</span>
            </div>
            {currentLang === langItem.code && (
              <IoCheckmark size={18} className="text-white" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default LanguageDropdown
