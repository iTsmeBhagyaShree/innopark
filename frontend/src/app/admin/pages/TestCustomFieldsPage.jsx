import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Card from '../../../components/ui/Card';
import { customFieldsAPI } from '../../../api';
import { useAuth } from '../../../context/AuthContext';
import { IoCheckmarkCircle, IoInformationCircle, IoWarning, IoTrashOutline } from 'react-icons/io5';

const TestCustomFieldsPage = () => {
    const { user } = useAuth();
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info'); // 'info', 'success', 'error'

    // Create Form State
    const [createForm, setCreateForm] = useState({
        field_label: '',
        field_name: '',
        field_type: 'text',
        module: 'Leads',
        required: false,
        options: []
    });
    const [optionInput, setOptionInput] = useState('');
    const [formErrors, setFormErrors] = useState({});

    // Test Form State (Simulate capturing data)
    const [testModule, setTestModule] = useState('Leads');
    const [testFormData, setTestFormData] = useState({});

    const showMessage = (text, type = 'info') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    // Fetch Fields
    const fetchFields = async () => {
        try {
            setLoading(true);
            const companyId = user?.company_id || parseInt(localStorage.getItem('companyId') || 0, 10);
            const response = await customFieldsAPI.getAll({ company_id: companyId });
            if (response.data.success) {
                setFields(response.data.data || []);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            showMessage('Error fetching fields: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchFields();
    }, [user]);

    // Validate form
    const validateForm = () => {
        const errors = {};
        if (!createForm.field_label.trim()) {
            errors.field_label = 'Label is required';
        }
        if (!createForm.field_type) {
            errors.field_type = 'Type is required';
        }
        if (!createForm.module) {
            errors.module = 'Module is required';
        }
        if ((createForm.field_type === 'dropdown' || createForm.field_type === 'radio') && createForm.options.length === 0) {
            errors.options = 'At least one option is required for dropdown/radio fields';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle Create
    const handleCreate = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showMessage('Please fix the errors below before submitting.', 'error');
            return;
        }

        showMessage('Creating field...', 'info');
        try {
            const companyId = user?.company_id || parseInt(localStorage.getItem('companyId') || 0, 10);
            const payload = {
                company_id: companyId,
                label: createForm.field_label.trim(),
                name: createForm.field_name.trim() || undefined,
                type: createForm.field_type,
                module: createForm.module,
                required: createForm.required,
                options: (createForm.field_type === 'dropdown' || createForm.field_type === 'radio')
                    ? createForm.options.filter(o => o.trim())
                    : []
            };

            console.log('Creating custom field with payload:', payload);

            const response = await customFieldsAPI.create(payload);
            if (response.data.success) {
                showMessage('✅ Custom Field Created Successfully!', 'success');
                fetchFields();
                setCreateForm({
                    field_label: '',
                    field_name: '',
                    field_type: 'text',
                    module: 'Leads',
                    required: false,
                    options: []
                });
                setOptionInput('');
                setFormErrors({});
            } else {
                showMessage('Failed: ' + response.data.error, 'error');
            }
        } catch (error) {
            console.error('Create error:', error);
            showMessage('Error creating: ' + (error.response?.data?.error || error.message), 'error');
        }
    };

    // Filter fields for test section
    const testFields = fields.filter(f => f.module === testModule);

    const handleTestInputChange = (fieldName, value) => {
        setTestFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const msgColors = {
        success: 'bg-green-100 text-green-700 border border-green-200',
        error: 'bg-red-100 text-red-700 border border-red-200',
        info: 'bg-blue-100 text-blue-700 border border-blue-200',
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-primary-text">Custom Fields Test Playground</h1>
                <Button variant="outline" onClick={fetchFields} disabled={loading}>
                    {loading ? 'Refreshing...' : '↻ Refresh'}
                </Button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${msgColors[messageType]}`}>
                    {messageType === 'success' ? <IoCheckmarkCircle size={20} /> :
                        messageType === 'error' ? <IoWarning size={20} /> :
                            <IoInformationCircle size={20} />}
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Create Field Section */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">1. Create New Custom Field</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Label <span className="text-red-500">*</span>
                            </label>
                            <input
                                className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${formErrors.field_label ? 'border-red-400' : 'border-gray-300'}`}
                                value={createForm.field_label}
                                onChange={e => {
                                    setCreateForm({ ...createForm, field_label: e.target.value });
                                    if (formErrors.field_label) setFormErrors({ ...formErrors, field_label: '' });
                                }}
                                placeholder="e.g. VAT Number"
                            />
                            {formErrors.field_label && <p className="text-red-500 text-xs mt-1">{formErrors.field_label}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Internal Name <span className="text-gray-400 text-xs">(auto-generated if empty)</span>
                            </label>
                            <input
                                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                value={createForm.field_name}
                                onChange={e => setCreateForm({ ...createForm, field_name: e.target.value })}
                                placeholder="e.g. vat_number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${formErrors.field_type ? 'border-red-400' : 'border-gray-300'}`}
                                value={createForm.field_type}
                                onChange={e => setCreateForm({ ...createForm, field_type: e.target.value })}
                            >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="textarea">Text Area</option>
                                <option value="dropdown">Dropdown</option>
                                <option value="checkbox">Checkbox</option>
                            </select>
                            {formErrors.field_type && <p className="text-red-500 text-xs mt-1">{formErrors.field_type}</p>}
                        </div>

                        {(createForm.field_type === 'dropdown' || createForm.field_type === 'radio') && (
                            <div className="bg-gray-50 p-3 rounded border">
                                <label className="block text-sm font-medium mb-1">
                                    Options <span className="text-red-500">*</span>
                                    <span className="text-gray-400 text-xs ml-1">(comma separated)</span>
                                </label>
                                <input
                                    className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${formErrors.options ? 'border-red-400' : 'border-gray-300'}`}
                                    value={optionInput}
                                    onChange={e => {
                                        setOptionInput(e.target.value);
                                        setCreateForm({
                                            ...createForm,
                                            options: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                        });
                                        if (formErrors.options) setFormErrors({ ...formErrors, options: '' });
                                    }}
                                    placeholder="Option 1, Option 2, Option 3"
                                />
                                {formErrors.options && <p className="text-red-500 text-xs mt-1">{formErrors.options}</p>}
                                {createForm.options.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {createForm.options.map((opt, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{opt}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Module <span className="text-red-500">*</span>
                            </label>
                            <select
                                className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${formErrors.module ? 'border-red-400' : 'border-gray-300'}`}
                                value={createForm.module}
                                onChange={e => setCreateForm({ ...createForm, module: e.target.value })}
                            >
                                {['Leads', 'Clients', 'Projects', 'Tasks', 'Contacts'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            {formErrors.module && <p className="text-red-500 text-xs mt-1">{formErrors.module}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="required-check"
                                checked={createForm.required}
                                onChange={e => setCreateForm({ ...createForm, required: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <label htmlFor="required-check" className="text-sm font-medium cursor-pointer">
                                Mark as Required
                            </label>
                        </div>

                        <Button type="submit" variant="primary" className="w-full">
                            + Create Custom Field
                        </Button>
                    </form>
                </Card>

                {/* 2. Existing Fields List */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                        2. Existing Fields
                        <span className="ml-2 text-sm font-normal text-gray-500">({fields.length} total)</span>
                    </h2>
                    <div className="h-96 overflow-y-auto space-y-2">
                        {loading ? (
                            <p className="text-gray-400 italic">Loading...</p>
                        ) : fields.length > 0 ? (
                            fields.map(field => (
                                <div key={field.id} className="p-3 bg-gray-50 rounded border text-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-semibold text-gray-800">{field.label}</span>
                                            <span className="ml-2 text-xs text-gray-500">({field.name})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{field.type}</span>
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{field.module}</span>
                                            {field.required === 1 && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Required</span>
                                            )}
                                        </div>
                                    </div>
                                    {field.options && field.options.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {field.options.map((opt, idx) => (
                                                <span key={idx} className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">{opt}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 italic">No custom fields found. Create one above!</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* 3. Test Form Rendering */}
            <Card className="p-6 border-2 border-blue-100">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-blue-800">3. Test Input Form (Simulated)</h2>
                <div className="mb-6 flex gap-4 items-center">
                    <label className="font-medium">Select Module to Test:</label>
                    <select
                        className="border border-gray-300 p-2 rounded min-w-[200px]"
                        value={testModule}
                        onChange={e => {
                            setTestModule(e.target.value);
                            setTestFormData({});
                        }}
                    >
                        {['Leads', 'Clients', 'Projects', 'Tasks', 'Contacts'].map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <span className="text-sm text-gray-500">
                        Found <strong>{testFields.length}</strong> custom field(s) for <strong>{testModule}</strong>
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Rendered Inputs */}
                    <div className="space-y-4 bg-white p-4 rounded border shadow-sm">
                        <h3 className="font-medium text-gray-700 mb-2">Form Display:</h3>
                        {testFields.length === 0 ? (
                            <p className="text-gray-400 italic">No custom fields configured for {testModule} module.</p>
                        ) : (
                            testFields.map(field => (
                                <div key={field.id}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.label}
                                        {field.required === 1 && <span className="text-red-500 ml-1">*</span>}
                                    </label>

                                    {/* Dynamic Input Rendering — uses field.type (DB column name) */}
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            rows={3}
                                            onChange={e => handleTestInputChange(field.name, e.target.value)}
                                            placeholder={field.placeholder || ''}
                                        />
                                    ) : field.type === 'dropdown' || field.type === 'radio' ? (
                                        <select
                                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            onChange={e => handleTestInputChange(field.name, e.target.value)}
                                        >
                                            <option value="">Select...</option>
                                            {(Array.isArray(field.options) ? field.options : []).map((opt, idx) => (
                                                <option key={idx} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : field.type === 'checkbox' ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                onChange={e => handleTestInputChange(field.name, e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-600">Enable {field.label}</span>
                                        </div>
                                    ) : (
                                        <input
                                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            onChange={e => handleTestInputChange(field.name, e.target.value)}
                                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                        />
                                    )}
                                    {field.help_text && (
                                        <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Live Data Preview */}
                    <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto">
                        <h3 className="font-bold text-white mb-2 border-b border-gray-700 pb-1">Captured Data (JSON):</h3>
                        <pre>{JSON.stringify(testFormData, null, 2)}</pre>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default TestCustomFieldsPage;
