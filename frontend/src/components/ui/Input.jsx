import React from 'react'

const Input = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error,
  icon: Icon,
  helperText,
  className = '',
  ...domProps 
}) => {
  const isPasswordType = type === 'password'

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-primary-text mb-1.5 sm:mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          onMouseDown={(e) => e.stopPropagation()}
          className={`w-full ${Icon ? 'pl-11' : 'px-4'} py-3 text-sm rounded-input border ${
            error 
              ? 'border-danger focus:ring-danger' 
              : 'border-border-medium focus:ring-primary-accent focus:border-primary-accent'
          } focus:outline-none focus:ring-2 transition-all duration-200 bg-white ${className}`}
          autoCapitalize={isPasswordType ? 'none' : undefined}
          autoCorrect={isPasswordType ? 'off' : undefined}
          spellCheck={isPasswordType ? false : undefined}
          data-lpignore={isPasswordType ? 'true' : undefined}
          data-1p-ignore={isPasswordType ? 'true' : undefined}
          data-form-type={isPasswordType ? 'other' : undefined}
          {...domProps}
        />
      </div>
      {helperText && !error && (
        <p className="mt-1 text-xs sm:text-sm text-secondary-text">{helperText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs sm:text-sm text-danger">{error}</p>
      )}
    </div>
  )
}

export default Input
