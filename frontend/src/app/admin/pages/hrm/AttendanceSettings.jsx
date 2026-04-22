import { useState, useEffect } from 'react'
import { hrAPI } from '../../../../api/hr'
import { toast } from 'react-hot-toast'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import RightSideModal from '../../../../components/ui/RightSideModal'
import { IoTime, IoAdd, IoTrash, IoLocation, IoGlobe, IoBusiness, IoCheckmarkCircle } from 'react-icons/io5'
import ColorPicker from '../../../../components/ui/ColorPicker'
import { useLanguage } from '../../../../context/LanguageContext'

const AttendanceSettings = () => {
    const { t } = useLanguage()
    const [shifts, setShifts] = useState([])
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(false)
    const [isAddShiftOpen, setIsAddShiftOpen] = useState(false)

    // Form Data
    const [shiftForm, setShiftForm] = useState({
        shift_name: '',
        shift_short_code: '',
        start_time: '09:00',
        end_time: '18:00',
        late_mark_duration: 15,
        clock_in_buffer: 0,
        option_color: '#217E45'
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [shiftsRes, settingsRes] = await Promise.all([
                hrAPI.getShifts(),
                hrAPI.getAttendanceSettings()
            ])
            if (shiftsRes.data.success) setShifts(shiftsRes.data.data)
            if (settingsRes.data.success) setSettings(settingsRes.data.data)
        } catch (error) {
            console.error(error)
            toast.error(t('settings.attendance.alerts.load_error'))
        } finally {
            setLoading(false)
        }
    }

    const handleAddShift = async () => {
        try {
            if (!shiftForm.shift_name) return toast.error(t('settings.attendance.alerts.name_required'))
            await hrAPI.createShift(shiftForm)
            toast.success(t('settings.attendance.alerts.create_success'))
            setIsAddShiftOpen(false)
            fetchData()
        } catch (error) {
            toast.error(t('settings.attendance.alerts.create_error'))
        }
    }

    const handleDeleteShift = async (id) => {
        if (!window.confirm(t('settings.attendance.alerts.delete_confirm'))) return
        try {
            await hrAPI.deleteShift(id)
            toast.success(t('settings.attendance.alerts.delete_success'))
            fetchData()
        } catch (error) {
            toast.error(t('settings.attendance.alerts.delete_error'))
        }
    }

    const handleUpdateSettings = async (updates) => {
        const newSettings = { ...settings, ...updates }
        setSettings(newSettings) // Optimistic update
        try {
            await hrAPI.updateAttendanceSettings(newSettings)
            toast.success(t('settings.attendance.alerts.update_success'))
        } catch (error) {
            toast.error(t('settings.attendance.alerts.update_error'))
            fetchData() // Revert
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('settings.attendance.title')}</h2>
                <p className="text-gray-500 text-sm">{t('settings.attendance.description')}</p>
            </div>

            {/* Shifts Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <IoTime size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{t('settings.attendance.office_shifts')}</h3>
                            <p className="text-xs text-gray-500">{t('settings.attendance.manage_timings')}</p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setIsAddShiftOpen(true)}
                        className="shadow-[0_4px_0_0_rgba(0,0,0,0.05)] border-b-4 border-gray-100 active:shadow-none active:border-0 active:translate-y-1 transition-all"
                    >
                        <IoAdd className="mr-1" /> {t('settings.attendance.add_shift')}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shifts.map(shift => (
                        <div key={shift.id} className="relative group p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: shift.option_color }}></span>
                                    <span className="font-semibold text-gray-800">{shift.shift_name}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteShift(shift.id)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <IoTrash />
                                </button>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 mt-3">
                                <span>{shift.start_time?.substring(0, 5)} - {shift.end_time?.substring(0, 5)}</span>
                                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-500">{shift.shift_short_code || 'SH'}</span>
                            </div>
                        </div>
                    ))}
                    {shifts.length === 0 && <p className="text-center text-gray-400 col-span-full py-4">{t('settings.attendance.no_shifts')}</p>}
                </div>
            </div>

            {/* Rules Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee Settings */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <IoBusiness size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900">{t('settings.attendance.assignment_rules')}</h3>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-medium text-gray-900 text-sm">{t('settings.attendance.shift_rotation')}</p>
                            <p className="text-xs text-gray-500">{t('settings.attendance.shift_rotation_desc')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer"
                                checked={!!settings.employee_shift_rotation}
                                onChange={(e) => handleUpdateSettings({ employee_shift_rotation: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-medium text-gray-900 text-sm">{t('settings.attendance.regularization')}</p>
                            <p className="text-xs text-gray-500">{t('settings.attendance.regularization_desc')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer"
                                checked={!!settings.attendance_regularization}
                                onChange={(e) => handleUpdateSettings({ attendance_regularization: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>

                {/* Location Settings */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <IoLocation size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900">{t('settings.attendance.location_restrictions')}</h3>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{t('settings.attendance.radius_check')}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer"
                                    checked={!!settings.radius_check}
                                    onChange={(e) => handleUpdateSettings({ radius_check: e.target.checked })}
                                />
                                <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>
                        {settings.radius_check && (
                            <Input
                                type="number"
                                label={t('settings.attendance.radius_meters')}
                                value={settings.radius_meters || 100}
                                onChange={(e) => handleUpdateSettings({ radius_meters: e.target.value })}
                            />
                        )}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{t('settings.attendance.ip_restriction')}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer"
                                    checked={!!settings.ip_restriction}
                                    onChange={(e) => handleUpdateSettings({ ip_restriction: e.target.checked })}
                                />
                                <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>
                        {settings.ip_restriction && (
                            <Input
                                label={t('settings.attendance.allowed_ip')}
                                value={settings.ip_address || ''}
                                onChange={(e) => handleUpdateSettings({ ip_address: e.target.value })}
                                placeholder="e.g. 192.168.1.1"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Add Shift Modal */}
            <RightSideModal
                isOpen={isAddShiftOpen}
                onClose={() => setIsAddShiftOpen(false)}
                title={t('settings.attendance.create_shift')}
                width="w-[400px]"
            >
                <div className="space-y-5">
                    <Input label={t('settings.attendance.shift_name')} placeholder="e.g. Morning Shift" value={shiftForm.shift_name} onChange={(e) => setShiftForm({ ...shiftForm, shift_name: e.target.value })} />
                    <Input label={t('settings.attendance.short_code')} placeholder="e.g. MS" value={shiftForm.shift_short_code} onChange={(e) => setShiftForm({ ...shiftForm, shift_short_code: e.target.value })} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input type="time" label={t('settings.attendance.start_time')} value={shiftForm.start_time} onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })} />
                        <Input type="time" label={t('settings.attendance.end_time')} value={shiftForm.end_time} onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input type="number" label={t('settings.attendance.late_mark')} value={shiftForm.late_mark_duration} onChange={(e) => setShiftForm({ ...shiftForm, late_mark_duration: e.target.value })} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.attendance.shift_color')}</label>
                            <div className="flex items-center gap-2">
                                <ColorPicker
                                    value={shiftForm.option_color}
                                    onChange={(color) => setShiftForm({ ...shiftForm, option_color: color })}
                                />
                                <Input
                                    value={shiftForm.option_color}
                                    onChange={(e) => setShiftForm({ ...shiftForm, option_color: e.target.value })}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleAddShift}>{t('settings.attendance.add_shift')}</Button>
                    </div>
                </div>
            </RightSideModal>
        </div>
    )
}

export default AttendanceSettings
