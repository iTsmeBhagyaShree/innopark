import React from 'react'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  type = 'button',
  className = '',
  disabled = false,
  ...props 
}) => {
  const baseClasses = 'font-semibold rounded-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 relative'
  
  const variants = {
    primary: 'bg-primary-accent text-white hover:bg-primary-accent/90 hover:shadow-elevated focus:ring-primary-accent shadow-soft',
    secondary: 'bg-secondary-accent text-white hover:bg-secondary-accent/90 hover:shadow-elevated focus:ring-secondary-accent shadow-soft',
    outline: 'border-2 border-gray-300 text-gray-900 hover:bg-gray-800 hover:text-white hover:border-gray-800 hover:shadow-soft focus:ring-primary-accent bg-white',
    ghost: 'text-text-dark hover:bg-sidebar-hover focus:ring-primary-accent',
    danger: 'bg-danger text-white hover:bg-danger/90 hover:shadow-elevated focus:ring-danger shadow-soft',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
