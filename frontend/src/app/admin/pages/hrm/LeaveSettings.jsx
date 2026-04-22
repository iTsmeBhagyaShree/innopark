import { useState, useEffect } from 'react'
import { leaveSettingsAPI } from '../../../../api/leaveSettings'
import { departmentsAPI } from '../../../../api/departments'
import { positionsAPI } from '../../../../api/positions'
import { toast } from 'react-hot-toast'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import RightSideModal from '../../../../components/ui/RightSideModal'
import DataTable from '../../../../components/ui/DataTable'
import ColorPicker from '../../../../components/ui/ColorPicker'
import { IoAdd, IoTrash, IoCalendar, IoPencil, IoArchive, IoRefresh, IoCheckmarkCircle } from 'react-icons/io5'
import { useLanguage } from '../../../../context/LanguageContext'

const LeaveSettings = () => {
    const { t } = useLanguage()
    // Get company ID
    const getCompanyId = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        return parseInt(user.company_id || localStorage.getItem('companyId') || 1, 10)
    }

    const companyId = getCompanyId()

    // Main state
    const [activeTab, setActiveTab] = useState('leave-types') // 'leave-types', 'general-settings', 'archived'
    const [leaveTypes, setLeaveTypes] = useState([])
    const [archivedLeaveTypes, setArchivedLeaveTypes] = useState([])
    const [generalSettings, setGeneralSettings] = useState({
        count_leaves_from: 'start_of_year',
        year_starts_from: 'January',
        reporting_manager_can: 'Approve'
    })
    const [loading, setLoading] = useState(false)
    const [departments, setDepartments] = useState([])
    const [designations, setDesignations] = useState([])

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingLeaveType, setEditingLeaveType] = useState(null)
    const [activeModalTab, setActiveModalTab] = useState('general') // 'general', 'entitlement', 'applicability'

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        allotment_type: 'Yearly',
        total_leaves: 0,
        monthly_limit: 0,
        paid_status: 'Paid',
        color_code: '#3B82F6',
        allow_carry_forward: false,
        max_carry_forward_limit: 0,
        departments: [],
        designations: [],
        is_active: true
    })

    useEffect(() => {
        fetchData()
    }, [activeTab])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [leaveTypesRes, settingsRes, deptsRes, posRes] = await Promise.all([
                leaveSettingsAPI.getAllLeaveTypes(companyId, activeTab === 'archived'),
                leaveSettingsAPI.getGeneralSettings(companyId),
                departmentsAPI.getAll({ company_id: companyId }),
                positionsAPI.getAll({ company_id: companyId })
            ])

            if (leaveTypesRes.data && leaveTypesRes.data.success) {
                const leaveTypesData = leaveTypesRes.data.data || []
                if (activeTab === 'archived') {
                    setArchivedLeaveTypes(leaveTypesData)
                } else {
                    setLeaveTypes(leaveTypesData)
                }
            }

            if (settingsRes.data.success) {
                const settingsData = settingsRes.data.data || {}
                setGeneralSettings({
                    count_leaves_from: settingsData.count_leaves_from || 'start_of_year',
                    year_starts_from: settingsData.year_starts_from || 'January',
                    reporting_manager_can: settingsData.reporting_manager_can || 'Approve'
                })
            }

            if (deptsRes.data.success) {
                setDepartments(deptsRes.data.data || [])
            }

            if (posRes.data.success) {
                setDesignations(posRes.data.data || [])
            }
        } catch (error) {
            console.error(error)
            toast.error(t('settings.leave.alerts.load_error'))
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (leaveType = null) => {
        if (leaveType) {
            setIsEditMode(true)
            setEditingLeaveType(leaveType)
            setFormData({
                name: leaveType.name || '',
                allotment_type: leaveType.allotment_type || 'Yearly',
                total_leaves: leaveType.total_leaves || 0,
                monthly_limit: leaveType.monthly_limit || 0,
                paid_status: leaveType.paid_status || 'Paid',
                color_code: leaveType.color_code || '#3B82F6',
                allow_carry_forward: leaveType.allow_carry_forward || false,
                max_carry_forward_limit: leaveType.max_carry_forward_limit || 0,
                departments: (leaveType.departments || []).map(d => d.id),
                designations: (leaveType.designations || []).map(d => d.id),
                is_active: leaveType.is_active !== undefined ? leaveType.is_active : true
            })
        } else {
            setIsEditMode(false)
            setEditingLeaveType(null)
            setFormData({
                name: '',
                allotment_type: 'Yearly',
                total_leaves: 0,
                monthly_limit: 0,
                paid_status: 'Paid',
                color_code: '#3B82F6',
                allow_carry_forward: false,
                max_carry_forward_limit: 0,
                departments: [],
                designations: [],
                is_active: true
            })
        }
        setActiveModalTab('general')
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setIsEditMode(false)
        setEditingLeaveType(null)
        setActiveModalTab('general')
    }

    const handleSave = async (e) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        try {
            // Validation
            if (!formData.name || !formData.name.trim()) {
                toast.error(t('settings.leave.alerts.name_required'))
                return
            }

            if (!formData.total_leaves || formData.total_leaves <= 0) {
                toast.error(t('settings.leave.alerts.min_leaves'))
                return
            }

            if (!formData.allotment_type) {
                toast.error(t('settings.leave.alerts.allotment_required'))
                return
            }

            const submitData = {
                name: formData.name.trim(),
                allotment_type: formData.allotment_type,
                total_leaves: parseInt(formData.total_leaves) || 0,
                monthly_limit: formData.allotment_type === 'Monthly' ? (parseInt(formData.monthly_limit) || 0) : 0,
                paid_status: formData.paid_status || 'Paid',
                color_code: formData.color_code || '#3B82F6',
                allow_carry_forward: formData.allow_carry_forward || false,
                max_carry_forward_limit: parseInt(formData.max_carry_forward_limit) || 0,
                departments: Array.isArray(formData.departments) ? formData.departments : [],
                designations: Array.isArray(formData.designations) ? formData.designations : [],
                is_active: formData.is_active !== undefined ? formData.is_active : true
            }

            if (isEditMode && editingLeaveType) {
                await leaveSettingsAPI.updateLeaveType(editingLeaveType.id, companyId, submitData)
                toast.success(t('settings.leave.alerts.save_success'))
            } else {
                const response = await leaveSettingsAPI.createLeaveType(companyId, submitData)
                if (response?.data?.success) {
                    toast.success(t('settings.leave.alerts.save_success'))
                } else {
                    throw new Error(response?.data?.error || 'Failed to create leave type')
                }
            }

            handleCloseModal()
            fetchData()
        } catch (error) {
            console.error(error)
            const errorMessage = error.response?.data?.error || error.message || t('settings.leave.alerts.save_error')
            toast.error(errorMessage)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm(t('settings.leave.alerts.delete_confirm'))) return
        try {
            await leaveSettingsAPI.deleteLeaveType(id, companyId)
            toast.success(t('common.delete_success') || t('common.alerts.delete_success'))
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error(t('common.delete_error') || 'Fehler beim Löschen')
        }
    }

    const handleArchive = async (id) => {
        if (!window.confirm(t('settings.leave.alerts.archive_confirm'))) return
        try {
            await leaveSettingsAPI.archiveLeaveType(id, companyId)
            toast.success(t('common.archive_success') || t('common.alerts.archive_success'))
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error(t('common.archive_error') || 'Fehler beim Archivieren')
        }
    }

    const handleRestore = async (id) => {
        try {
            await leaveSettingsAPI.restoreLeaveType(id, companyId)
            toast.success(t('common.restore_success') || t('common.alerts.restore_success'))
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error(t('common.restore_error') || 'Fehler beim Wiederherstellen')
        }
    }

    const handleSaveGeneralSettings = async () => {
        try {
            await leaveSettingsAPI.updateGeneralSettings(companyId, generalSettings)
            toast.success(t('settings.leave.alerts.save_success'))
        } catch (error) {
            console.error(error)
            toast.error(t('settings.leave.alerts.save_error'))
        }
    }

    // Table columns for active leave types
    const columns = [
        {
            key: 'name',
            label: t('settings.leave.table.type'),
            render: (val, row) => (
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: row.color_code || '#3B82F6' }}></span>
                    <span className="font-medium text-gray-900">{val}</span>
                </div>
            )
        },
        {
            key: 'allotment_type',
            label: t('settings.leave.table.allotment'),
            render: (val) => (
                <span className="text-gray-700">{val === 'Yearly' ? t('settings.leave.modal.yearly') : t('settings.leave.modal.monthly') || val}</span>
            )
        },
        {
            key: 'total_leaves',
            label: t('settings.leave.table.no_leaves'),
            render: (val) => (
                <span className="font-semibold text-gray-900">{val || 0}</span>
            )
        },
        {
            key: 'monthly_limit',
            label: t('settings.leave.modal.monthly_limit'),
            render: (val, row) => (
                <span className="text-gray-700">
                    {row.allotment_type === 'Monthly' ? (val || 0) : t('common.na')}
                </span>
            )
        },
        {
            key: 'paid_status',
            label: t('settings.leave.table.paid_status'),
            render: (val) => (
                val === 'Paid'
                    ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">{t('settings.leave.modal.paid')}</span>
                    : <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{t('settings.leave.modal.unpaid')}</span>
            )
        },
        {
            key: 'departments',
            label: t('settings.leave.table.dept'),
            render: (val) => (
                <span className="text-gray-700 text-sm">
                    {val && val.length > 0
                        ? `${val.length} ${val.length === 1 ? t('settings.leave.table.dept_single') || 'Abt.' : t('settings.leave.table.dept_plural') || 'Abt.'}`
                        : t('settings.leave.modal.all_depts')}
                </span>
            )
        },
        {
            key: 'designations',
            label: t('settings.leave.table.desig'),
            render: (val) => (
                <span className="text-gray-700 text-sm">
                    {val && val.length > 0
                        ? `${val.length} ${val.length === 1 ? t('settings.leave.table.desig_single') || 'Pos.' : t('settings.leave.table.desig_plural') || 'Pos.'}`
                        : t('settings.leave.modal.all_desigs')}
                </span>
            )
        },
        {
            key: 'is_active',
            label: t('common.status'),
            render: (val) => (
                val
                    ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">{t('common.active') || 'Aktiv'}</span>
                    : <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{t('common.inactive') || 'Inaktiv'}</span>
            )
        }
    ]

    const actions = (row) => (
        <div className="flex items-center gap-1">
            <button
                onClick={() => handleOpenModal(row)}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title={t('common.edit')}
            >
                <IoPencil size={18} />
            </button>
            <button
                onClick={() => handleArchive(row.id)}
                className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                title={t('common.archive') || 'Archivieren'}
            >
                <IoArchive size={18} />
            </button>
            <button
                onClick={() => handleDelete(row.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title={t('common.delete')}
            >
                <IoTrash size={18} />
            </button>
        </div>
    )

    const archivedActions = (row) => (
        <div className="flex items-center gap-1">
            <button
                onClick={() => handleRestore(row.id)}
                className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                title={t('common.restore') || 'Wiederherstellen'}
            >
                <IoRefresh size={18} />
            </button>
            <button
                onClick={() => handleDelete(row.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title={t('common.permanent_delete') || 'Dauerhaft löschen'}
            >
                <IoTrash size={18} />
            </button>
        </div>
    )

    const months = [
        t('common.months.january'),
        t('common.months.february'),
        t('common.months.march'),
        t('common.months.april'),
        t('common.months.may'),
        t('common.months.june'),
        t('common.months.july'),
        t('common.months.august'),
        t('common.months.september'),
        t('common.months.october'),
        t('common.months.november'),
        t('common.months.december')
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('settings.leave.title')}</h2>
                <p className="text-gray-500 text-sm">{t('settings.leave.description')}</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1 border-b border-gray-200 px-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('leave-types')}
                        className={`px-4 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'leave-types'
                                ? 'border-primary-accent text-primary-accent'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {t('settings.leave.tabs.types')}
                    </button>
                    <button
                        onClick={() => setActiveTab('general-settings')}
                        className={`px-4 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'general-settings'
                                ? 'border-primary-accent text-primary-accent'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {t('settings.leave.tabs.general')}
                    </button>
                    <button
                        onClick={() => setActiveTab('archived')}
                        className={`px-4 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'archived'
                                ? 'border-primary-accent text-primary-accent'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {t('settings.leave.tabs.archived')}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* Leave Types Tab */}
                    {activeTab === 'leave-types' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                        <IoCalendar size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{t('settings.leave.table.type')}</h3>
                                        <p className="text-xs text-gray-500">{t('settings.leave.types_desc')}</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleOpenModal()}
                                    className="shadow-[0_4px_0_0_rgba(0,0,0,0.05)] border-b-4 border-gray-100 active:shadow-none active:border-0 active:translate-y-1 transition-all"
                                >
                                    <IoAdd className="mr-1" /> {t('settings.leave.add_new')}
                                </Button>
                            </div>

                            <DataTable
                                columns={columns}
                                data={leaveTypes}
                                loading={loading}
                                actions={actions}
                                emptyMessage={t('settings.leave.no_types')}
                            />
                        </div>
                    )}

                    {/* General Settings Tab */}
                    {activeTab === 'general-settings' && (
                        <div className="space-y-6 max-w-2xl">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <IoCheckmarkCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{t('settings.leave.general_settings.title')}</h3>
                                    <p className="text-xs text-gray-500">{t('settings.leave.general_settings.desc')}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Count leaves from */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        {t('settings.leave.general_settings.count_from')}
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="count_leaves_from"
                                                value="date_of_joining"
                                                checked={generalSettings.count_leaves_from === 'date_of_joining'}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, count_leaves_from: e.target.value })}
                                                className="text-primary-accent focus:ring-primary-accent"
                                            />
                                            <span className="text-gray-700">{t('settings.leave.general_settings.from_joining')}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="count_leaves_from"
                                                value="start_of_year"
                                                checked={generalSettings.count_leaves_from === 'start_of_year'}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, count_leaves_from: e.target.value })}
                                                className="text-primary-accent focus:ring-primary-accent"
                                            />
                                            <span className="text-gray-700">{t('settings.leave.general_settings.from_year_start')}</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Year starts from */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('settings.leave.general_settings.year_starts')}
                                    </label>
                                    <select
                                        value={generalSettings.year_starts_from || 'January'}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, year_starts_from: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 focus:ring-primary-accent focus:border-primary-accent text-sm p-2.5"
                                    >
                                        {months.map((month, idx) => (
                                            <option key={idx} value={month}>{month}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Reporting manager can */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('settings.leave.general_settings.manager_can')}
                                    </label>
                                    <select
                                        value={generalSettings.reporting_manager_can || 'Approve'}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, reporting_manager_can: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 focus:ring-primary-accent focus:border-primary-accent text-sm p-2.5"
                                    >
                                        <option value="Approve">{t('settings.leave.general_settings.approve')}</option>
                                        <option value="Pre-Approve">{t('settings.leave.general_settings.pre_approve')}</option>
                                    </select>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSaveGeneralSettings}>
                                        {t('common.save_settings') || t('common.save')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Archived Tab */}
                    {activeTab === 'archived' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                    <IoArchive size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{t('settings.leave.archived_title')}</h3>
                                    <p className="text-xs text-gray-500">{t('settings.leave.archived_desc')}</p>
                                </div>
                            </div>

                            <DataTable
                                columns={columns}
                                data={archivedLeaveTypes}
                                loading={loading}
                                actions={archivedActions}
                                emptyMessage={t('settings.leave.no_archived')}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <RightSideModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={isEditMode ? t('settings.leave.modal.edit_title') : t('settings.leave.modal.add_title')}
                width="w-[600px]"
            >
                <div className="space-y-6">
                    {/* Modal Tabs */}
                    <div className="flex items-center gap-1 border-b border-gray-200">
                        <button
                            onClick={() => setActiveModalTab('general')}
                            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeModalTab === 'general'
                                    ? 'border-primary-accent text-primary-accent'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {t('settings.leave.modal.tabs.general')}
                        </button>
                        <button
                            onClick={() => setActiveModalTab('entitlement')}
                            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeModalTab === 'entitlement'
                                    ? 'border-primary-accent text-primary-accent'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {t('settings.leave.modal.tabs.entitlement')}
                        </button>
                        <button
                            onClick={() => setActiveModalTab('applicability')}
                            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeModalTab === 'applicability'
                                    ? 'border-primary-accent text-primary-accent'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {t('settings.leave.modal.tabs.applicability')}
                        </button>
                    </div>

                    {/* General Tab */}
                    {activeModalTab === 'general' && (
                        <div className="space-y-4 pt-4">
                            <Input
                                label={t('settings.leave.table.type')}
                                placeholder="e.g. Privilege Leave"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('settings.leave.modal.allotment_type')}
                                </label>
                                <select
                                    value={formData.allotment_type}
                                    onChange={(e) => setFormData({ ...formData, allotment_type: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 focus:ring-primary-accent focus:border-primary-accent text-sm p-2.5"
                                >
                                    <option value="Monthly">{t('settings.leave.modal.monthly') || 'Monthly'}</option>
                                    <option value="Yearly">{t('settings.leave.modal.yearly') || 'Yearly'}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('settings.leave.modal.paid_status')}
                                </label>
                                <select
                                    value={formData.paid_status}
                                    onChange={(e) => setFormData({ ...formData, paid_status: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 focus:ring-primary-accent focus:border-primary-accent text-sm p-2.5"
                                >
                                    <option value="Paid">{t('settings.leave.modal.paid')}</option>
                                    <option value="Unpaid">{t('settings.leave.modal.unpaid')}</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('settings.leave.modal.color_code')}
                                </label>
                                <div className="flex items-center gap-2">
                                    <ColorPicker
                                        value={formData.color_code}
                                        onChange={(color) => setFormData({ ...formData, color_code: color })}
                                    />
                                    <Input
                                        value={formData.color_code}
                                        onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Entitlement Tab */}
                    {activeModalTab === 'entitlement' && (
                        <div className="space-y-4 pt-4">
                            <Input
                                type="number"
                                label={t('settings.leave.modal.leaves_per_year')}
                                placeholder={t('settings.leave.modal.enter_leaves') || '0'}
                                value={formData.total_leaves || ''}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                                    setFormData({ ...formData, total_leaves: val })
                                }}
                                min="1"
                                required
                            />
                            {formData.allotment_type === 'Monthly' && (
                                <Input
                                    type="number"
                                    label={t('settings.leave.modal.monthly_limit')}
                                    placeholder="0"
                                    value={formData.monthly_limit}
                                    onChange={(e) => setFormData({ ...formData, monthly_limit: parseInt(e.target.value) || 0 })}
                                />
                            )}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.allow_carry_forward}
                                    onChange={(e) => setFormData({ ...formData, allow_carry_forward: e.target.checked })}
                                    className="rounded text-primary-accent focus:ring-primary-accent"
                                />
                                <span className="text-sm text-gray-700">{t('settings.leave.modal.carry_forward')}</span>
                            </label>
                            {formData.allow_carry_forward && (
                                <Input
                                    type="number"
                                    label={t('settings.leave.modal.max_carry_forward')}
                                    placeholder="0"
                                    value={formData.max_carry_forward_limit}
                                    onChange={(e) => setFormData({ ...formData, max_carry_forward_limit: parseInt(e.target.value) || 0 })}
                                />
                            )}
                        </div>
                    )}

                    {/* Applicability Tab */}
                    {activeModalTab === 'applicability' && (
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('settings.leave.modal.applicable_depts')}
                                </label>
                                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                                    {departments.length === 0 ? (
                                        <p className="text-sm text-gray-500">{t('settings.leave.modal.empty_depts')}</p>
                                    ) : (
                                        departments.map(dept => (
                                            <label key={dept.id} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.departments.includes(dept.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, departments: [...formData.departments, dept.id] })
                                                        } else {
                                                            setFormData({ ...formData, departments: formData.departments.filter(id => id !== dept.id) })
                                                        }
                                                    }}
                                                    className="rounded text-primary-accent focus:ring-primary-accent"
                                                />
                                                <span className="text-sm text-gray-700">{dept.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                {formData.departments.length === 0 && (
                                    <p className="text-xs text-gray-500 mt-1">{t('settings.leave.modal.all_depts_desc') || t('settings.leave.modal.all_depts')}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('settings.leave.modal.applicable_desigs')}
                                </label>
                                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                                    {designations.length === 0 ? (
                                        <p className="text-sm text-gray-500">{t('settings.leave.modal.empty_desigs')}</p>
                                    ) : (
                                        designations.map(desig => (
                                            <label key={desig.id} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.designations.includes(desig.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, designations: [...formData.designations, desig.id] })
                                                        } else {
                                                            setFormData({ ...formData, designations: formData.designations.filter(id => id !== desig.id) })
                                                        }
                                                    }}
                                                    className="rounded text-primary-accent focus:ring-primary-accent"
                                                />
                                                <span className="text-sm text-gray-700">{desig.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                {formData.designations.length === 0 && (
                                    <p className="text-xs text-gray-500 mt-1">{t('settings.leave.modal.all_desigs_desc') || t('settings.leave.modal.all_desigs')}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <Button variant="outline" onClick={handleCloseModal}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleSave}>
                            {t('common.save')}
                        </Button>
                    </div>
                </div>
            </RightSideModal>
        </div>
    )
}

export default LeaveSettings
