import React from 'react'

const Card = ({ children, className = '', onClick, variant = 'default', ...props }) => {
  const variants = {
    default: 'bg-white rounded-lg shadow-sm border border-gray-100 p-3 lg:p-4',
    elevated: 'bg-white rounded-lg shadow-md border border-gray-100 p-3 lg:p-4',
    flat: 'bg-white rounded-lg border border-gray-200 p-3 lg:p-4',
    compact: 'bg-white rounded-md shadow-sm border border-gray-100 p-2',
  }

  return (
    <div
      className={`${variants[variant] || variants.default} ${onClick ? 'cursor-pointer hover:shadow-xl hover:border-gray-200 transition-all duration-200' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
