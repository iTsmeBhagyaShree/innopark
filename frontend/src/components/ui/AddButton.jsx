import React from 'react'
import { IoAdd } from 'react-icons/io5'

const AddButton = ({ onClick, label, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 
        bg-primary-accent text-white 
        text-xs font-medium rounded-md
        transition-all duration-200
        hover:bg-opacity-90 hover:shadow-elevated
        focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2
        shadow-soft
        ${className}
      `}
    >
      <IoAdd size={16} />
      <span>{label}</span>
    </button>
  )
}

export default AddButton
