import React from 'react'

/**
 * FormRow Component - Developo Style
 * Displays label on left, input/content on right
 * Responsive: Stacks on mobile, side-by-side on desktop
 */
const FormRow = ({ label, required, children, htmlFor, helpText, className = '' }) => {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-100 last:border-0 ${className}`}>
            {/* Label Column */}
            <label
                htmlFor={htmlFor}
                className="block text-sm font-medium text-gray-700 mb-2 sm:mb-0 sm:w-40 sm:flex-shrink-0 sm:pt-2"
            >
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>

            {/* Input Column */}
            <div className="flex-1">
                {children}
                {helpText && (
                    <p className="mt-1 text-xs text-gray-500">{helpText}</p>
                )}
            </div>
        </div>
    )
}

/**
 * FormSection Component - For grouping form fields
 */
export const FormSection = ({ title, children, className = '' }) => {
    return (
        <div className={`${className}`}>
            {title && (
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {title}
                </h3>
            )}
            <div className="space-y-0">
                {children}
            </div>
        </div>
    )
}

/**
 * FormInput - Clean input styling for Developo style forms
 */
export const FormInput = ({
    type = 'text',
    value,
    onChange,
    placeholder,
    disabled,
    className = '',
    ...props
}) => {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors disabled:bg-gray-100 disabled:text-gray-500 ${className}`}
            {...props}
        />
    )
}

/**
 * FormSelect - Clean select styling for Developo style forms
 */
export const FormSelect = ({
    value,
    onChange,
    children,
    disabled,
    className = '',
    ...props
}) => {
    return (
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors disabled:bg-gray-100 disabled:text-gray-500 appearance-none cursor-pointer ${className}`}
            style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
            }}
            {...props}
        >
            {children}
        </select>
    )
}

/**
 * FormTextarea - Clean textarea styling for Developo style forms
 */
export const FormTextarea = ({
    value,
    onChange,
    placeholder,
    rows = 3,
    disabled,
    className = '',
    ...props
}) => {
    return (
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors resize-none disabled:bg-gray-100 disabled:text-gray-500 ${className}`}
            {...props}
        />
    )
}

/**
 * FormRadioGroup - Radio button group for Developo style
 */
export const FormRadioGroup = ({
    name,
    options,
    value,
    onChange,
    className = ''
}) => {
    return (
        <div className={`flex flex-wrap gap-4 ${className}`}>
            {options.map((option) => (
                <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <input
                        type="radio"
                        name={name}
                        value={option.value}
                        checked={value === option.value}
                        onChange={onChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                </label>
            ))}
        </div>
    )
}

/**
 * FormCheckbox - Checkbox for Developo style
 */
export const FormCheckbox = ({
    label,
    checked,
    onChange,
    disabled,
    className = ''
}) => {
    return (
        <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    )
}

/**
 * FormActions - Footer buttons for modal forms
 * Supports both props-based API and children for custom buttons
 */
export const FormActions = ({
    onCancel,
    onSubmit,
    submitLabel = 'Save',
    cancelLabel = 'Close',
    loading = false,
    className = '',
    children
}) => {
    // If children are provided, render them directly
    if (children) {
        return (
            <div className={`flex items-center justify-end gap-3 pt-5 mt-5 border-t border-gray-200 ${className}`}>
                {children}
            </div>
        )
    }

    // Otherwise, use the props-based API
    return (
        <div className={`flex items-center justify-end gap-3 pt-5 mt-5 border-t border-gray-200 ${className}`}>
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {cancelLabel}
            </button>
            <button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {loading ? 'Saving...' : submitLabel}
            </button>
        </div>
    )
}

export { FormRow }
export default FormRow
