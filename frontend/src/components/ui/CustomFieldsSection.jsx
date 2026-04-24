import { useState, useEffect } from 'react'
import { customFieldsAPI } from '../../api'
import { IoList, IoDocumentText } from 'react-icons/io5'

/**
 * CustomFieldsSection
 *
 * Drop this component inside any Add/Edit modal to automatically show
 * custom fields for that module.
 *
 * Props:
 *   module      - string: e.g. 'Leads', 'Projects', 'Clients', 'Tasks', etc.
 *   companyId   - number: the current company id
 *   values      - object: { [fieldName]: value }  (formData.custom_fields)
 *   onChange    - function(updatedValues): called whenever a field changes
 */
const CustomFieldsSection = ({ module, companyId, values = {}, onChange }) => {
    const [fields, setFields] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!module || !companyId) return
        const fetch = async () => {
            try {
                setLoading(true)
                const res = await customFieldsAPI.getAll({ company_id: companyId, module })
                if (res.data?.success) {
                    setFields(res.data.data || [])
                }
            } catch (err) {
                console.error(`Error fetching custom fields for ${module}:`, err)
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [module, companyId])

    if (loading) {
        return (
            <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-sm text-gray-400 animate-pulse">Loading custom fields...</p>
            </div>
        )
    }

    if (!fields.length) return null

    const update = (name, value) => {
        onChange(name, value)
    }

    return (
        <div className="border-t border-gray-200 pt-4 mt-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <IoList className="text-primary-accent" size={16} />
                Additional Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                    <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                            {field.required === 1 && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {/* TEXTAREA */}
                        {field.type === 'textarea' ? (
                            <textarea
                                value={values[field.name] || ''}
                                onChange={(e) => update(field.name, e.target.value)}
                                rows={3}
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none text-sm"
                            />

                        ) : field.type === 'dropdown' ? (
                            /* DROPDOWN */
                            <select
                                value={values[field.name] || ''}
                                onChange={(e) => update(field.name, e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none bg-white text-sm"
                            >
                                <option value="">— Select {field.label} —</option>
                                {(field.options || []).map((opt, idx) => (
                                    <option key={idx} value={opt}>{opt}</option>
                                ))}
                            </select>

                        ) : field.type === 'multiselect' ? (
                            /* MULTISELECT */
                            <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                                {(field.options || []).map((opt, idx) => {
                                    const selected = (values[field.name] || '').split(',').filter(Boolean)
                                    return (
                                        <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(opt)}
                                                onChange={(e) => {
                                                    const current = (values[field.name] || '').split(',').filter(Boolean)
                                                    const updated = e.target.checked
                                                        ? [...current, opt]
                                                        : current.filter(v => v !== opt)
                                                    update(field.name, updated.join(','))
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-accent focus:ring-primary-accent"
                                            />
                                            <span className="text-sm text-gray-600">{opt}</span>
                                        </label>
                                    )
                                })}
                            </div>

                        ) : field.type === 'radio' ? (
                            /* RADIO */
                            <div className="space-y-2">
                                {(field.options || []).map((opt, idx) => (
                                    <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`cf_${module}_${field.name}`}
                                            value={opt}
                                            checked={values[field.name] === opt}
                                            onChange={() => update(field.name, opt)}
                                            className="w-4 h-4 border-gray-300 text-primary-accent focus:ring-primary-accent"
                                        />
                                        <span className="text-sm text-gray-600">{opt}</span>
                                    </label>
                                ))}
                            </div>

                        ) : field.type === 'checkbox' ? (
                            /* CHECKBOX (single boolean) */
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={values[field.name] === 'true' || values[field.name] === true}
                                    onChange={(e) => update(field.name, e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-primary-accent focus:ring-primary-accent cursor-pointer"
                                />
                                <span className="text-sm text-gray-600">Yes, {field.label}</span>
                            </label>

                        ) : field.type === 'file' ? (
                            /* FILE UPLOAD */
                            <div>
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-primary-accent transition-all">
                                    <div className="flex flex-col items-center justify-center">
                                        <IoDocumentText size={22} className="text-gray-400 mb-1" />
                                        {values[field.name] ? (
                                            <p className="text-sm text-primary-accent font-medium">
                                                ✅ {typeof values[field.name] === 'string'
                                                    ? values[field.name]
                                                    : values[field.name]?.name || 'File selected'}
                                            </p>
                                        ) : (
                                            <>
                                                <p className="text-sm text-gray-500">
                                                    Click to upload <span className="font-semibold text-primary-accent">{field.label}</span>
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, PDF, DOC up to 10MB</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) update(field.name, file)
                                        }}
                                    />
                                </label>
                                {values[field.name] && (
                                    <button
                                        type="button"
                                        onClick={() => update(field.name, null)}
                                        className="mt-1 text-xs text-red-500 hover:text-red-700"
                                    >
                                        ✕ Remove file
                                    </button>
                                )}
                            </div>

                        ) : (
                            /* TEXT / NUMBER / DATE / DATETIME / EMAIL / PHONE / URL */
                            <input
                                type={
                                    field.type === 'number' ? 'number' :
                                        field.type === 'date' ? 'date' :
                                            field.type === 'datetime' ? 'datetime-local' :
                                                field.type === 'email' ? 'email' :
                                                    field.type === 'phone' ? 'tel' :
                                                        field.type === 'url' ? 'url' : 'text'
                                }
                                value={values[field.name] || ''}
                                onChange={(e) => update(field.name, e.target.value)}
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none text-sm"
                            />
                        )}

                        {field.help_text && (
                            <p className="text-xs text-gray-400 mt-1">{field.help_text}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default CustomFieldsSection
