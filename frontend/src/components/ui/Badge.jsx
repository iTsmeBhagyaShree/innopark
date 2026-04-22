import React from 'react'

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-primary-accent bg-opacity-10 text-black', // Changed text color to black for better visibility
    warning: 'bg-warning bg-opacity-10 text-black',
    danger: 'bg-danger bg-opacity-10 text-black',
    info: 'bg-secondary-accent bg-opacity-10 text-black',
    none: '', // No default colors, use className for everything
  }

  // Handle undefined/null/empty children gracefully
  const displayValue = children == null || children === '' ? '-' : children

  // Ensure variant is valid, fallback to default
  const validVariant = variants[variant] ? variant : 'default'

  return (
    <span
      className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${variants[validVariant]} ${className || ''}`}
    >
      {displayValue}
    </span>
  )
}

export default Badge
