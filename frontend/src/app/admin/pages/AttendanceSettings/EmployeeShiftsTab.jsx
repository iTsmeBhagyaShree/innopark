/**
 * Employee Shifts Tab
 * Shift Management with Table and Modal
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../../../../context/ThemeContext'
import { useAuth } from '../../../../context/AuthContext'
import { toast } from 'react-hot-toast'
import { IoAdd, IoPencil, IoTrash, IoClose, IoArrowUp, IoArrowDown } from 'react-icons/io5'
import { attendanceSettingsAPI } from '../../../../api'
import ColorPicker from '../../../../components/ui/ColorPicker'

const EmployeeShiftsTab = () => {
  const { theme } = useTheme()
  const { user } = useAuth()
  const isDark = theme.mode === 'dark'

  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingShift, setEditingShift] = useState(null)
  const [saving, setSaving] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

  const [formData, setFormData] = useState({
    shift_type: 'Strict',
    shift_name: '',
    shift_short_code: '',
    shift_color: '#3B82F6',
    start_time: '09:00',
    end_time: '18:00',
    half_day_mark_time: '13:00',
    auto_clock_out_time: '19:00',
    early_clock_in_allowed_minutes: 0,
    late_mark_after_minutes: 15,
    max_check_ins_per_day: 1,
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    is_default: false,
  })

  // Fetch shifts on mount
  useEffect(() => {
    fetchShifts()
  }, [])

  // Handle sorting
  const handleSort = (columnKey) => {
    let direction = 'asc'
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key: columnKey, direction })
  }

  // Apply sorting to shifts
  const sortedShifts = [...shifts].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0

    let aValue, bValue

    if (sortConfig.key === 'name') {
      aValue = a.shift_name || ''
      bValue = b.shift_name || ''
    } else if (sortConfig.key === 'time') {
      aValue = a.start_time || ''
      bValue = b.start_time || ''
    } else if (sortConfig.key === 'others') {
      aValue = a.late_mark_after_minutes || 0
      bValue = b.late_mark_after_minutes || 0
    } else if (sortConfig.key === 'default') {
      aValue = a.is_default ? 1 : 0
      bValue = b.is_default ? 1 : 0
    } else {
      return 0
    }

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
    }

    const aString = String(aValue).toLowerCase()
    const bString = String(bValue).toLowerCase()
    if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1
    if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const fetchShifts = async () => {
    try {
      setLoading(true)
      const response = await attendanceSettingsAPI.getAllShifts(user?.company_id)
      if (response.data.success) {
        setShifts(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching shifts:', error)
      toast.error('Failed to load shifts')
    } finally {
      setLoading(false)
    }
  }

  const handleAddShift = () => {
    setEditingShift(null)
    setFormData({
      shift_type: 'Strict',
      shift_name: '',
      shift_short_code: '',
      shift_color: '#3B82F6',
      start_time: '09:00',
      end_time: '18:00',
      half_day_mark_time: '13:00',
      auto_clock_out_time: '19:00',
      early_clock_in_allowed_minutes: 0,
      late_mark_after_minutes: 15,
      max_check_ins_per_day: 1,
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      is_default: false,
    })
    setShowModal(true)
  }

  const handleEditShift = (shift) => {
    setEditingShift(shift)
    // Convert working_days to array format if it's stored as array
    setFormData({
      ...shift,
      working_days: Array.isArray(shift.working_days) ? shift.working_days : []
    })
    setShowModal(true)
  }

  const handleDeleteShift = async (shiftId) => {
    if (!confirm('Are you sure you want to delete this shift?')) return

    try {
      const response = await attendanceSettingsAPI.deleteShift(shiftId, user?.company_id)
      if (response.data.success) {
        toast.success('Shift deleted successfully')
        fetchShifts() // Reload shifts
      }
    } catch (error) {
      console.error('Error deleting shift:', error)
      toast.error(error.response?.data?.error || 'Failed to delete shift')
    }
  }

  const handleSaveShift = async () => {
    if (!formData.shift_name) {
      toast.error('Please enter shift name')
      return
    }

    if (!formData.start_time || !formData.end_time) {
      toast.error('Please enter start and end time')
      return
    }

    try {
      setSaving(true)

      const dataToSave = {
        ...formData,
        is_default: formData.is_default ? 1 : 0
      }

      let response
      if (editingShift) {
        response = await attendanceSettingsAPI.updateShift(editingShift.id, user?.company_id, dataToSave)
      } else {
        response = await attendanceSettingsAPI.createShift(user?.company_id, dataToSave)
      }

      if (response.data.success) {
        toast.success(editingShift ? 'Shift updated successfully' : 'Shift created successfully')
        setShowModal(false)
        fetchShifts() // Reload shifts
      }
    } catch (error) {
      console.error('Error saving shift:', error)
      toast.error(error.response?.data?.error || 'Failed to save shift')
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefaultShift = async (shiftId) => {
    try {
      const response = await attendanceSettingsAPI.setDefaultShift(shiftId, user?.company_id)
      if (response.data.success) {
        toast.success('Default shift updated successfully')
        fetchShifts() // Reload shifts
      }
    } catch (error) {
      console.error('Error setting default shift:', error)
      toast.error(error.response?.data?.error || 'Failed to set default shift')
    }
  }

  const handleWorkingDayToggle = (day) => {
    setFormData(prev => {
      const workingDays = Array.isArray(prev.working_days) ? prev.working_days : []
      if (workingDays.includes(day)) {
        return {
          ...prev,
          working_days: workingDays.filter(d => d !== day)
        }
      } else {
        return {
          ...prev,
          working_days: [...workingDays, day]
        }
      }
    })
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
            Employee Shifts
          </h3>
          <p className="text-xs sm:text-sm mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            Manage employee work shifts and schedules
          </p>
        </div>
        <button
          onClick={handleAddShift}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap"
        >
          <IoAdd size={18} className="sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Add New Shift</span>
          <span className="sm:hidden">Add Shift</span>
        </button>
      </div>

      {/* Shifts Table */}
      <div
        className="rounded-lg overflow-hidden shadow-sm"
        style={{
          backgroundColor: isDark ? '#1F2937' : '#ffffff',
          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr
                className="text-left text-xs sm:text-sm font-medium"
                style={{
                  backgroundColor: isDark ? '#111827' : '#F9FAFB',
                  color: isDark ? '#9CA3AF' : '#6B7280',
                }}
              >
                <th
                  className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap cursor-pointer hover:bg-opacity-80 select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Name</span>
                    {sortConfig.key === 'name' ? (
                      sortConfig.direction === 'asc' ? (
                        <IoArrowUp className="w-3 h-3" />
                      ) : (
                        <IoArrowDown className="w-3 h-3" />
                      )
                    ) : (
                      <div className="flex flex-col -space-y-1 opacity-30">
                        <IoArrowUp className="w-2.5 h-2.5" />
                        <IoArrowDown className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                </th>
                <th
                  className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap cursor-pointer hover:bg-opacity-80 select-none"
                  onClick={() => handleSort('time')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Time</span>
                    {sortConfig.key === 'time' ? (
                      sortConfig.direction === 'asc' ? (
                        <IoArrowUp className="w-3 h-3" />
                      ) : (
                        <IoArrowDown className="w-3 h-3" />
                      )
                    ) : (
                      <div className="flex flex-col -space-y-1 opacity-30">
                        <IoArrowUp className="w-2.5 h-2.5" />
                        <IoArrowDown className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                </th>
                <th
                  className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap cursor-pointer hover:bg-opacity-80 select-none"
                  onClick={() => handleSort('others')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Others</span>
                    {sortConfig.key === 'others' ? (
                      sortConfig.direction === 'asc' ? (
                        <IoArrowUp className="w-3 h-3" />
                      ) : (
                        <IoArrowDown className="w-3 h-3" />
                      )
                    ) : (
                      <div className="flex flex-col -space-y-1 opacity-30">
                        <IoArrowUp className="w-2.5 h-2.5" />
                        <IoArrowDown className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                </th>
                <th
                  className="px-3 sm:px-6 py-3 sm:py-4 text-center whitespace-nowrap cursor-pointer hover:bg-opacity-80 select-none"
                  onClick={() => handleSort('default')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Default</span>
                    {sortConfig.key === 'default' ? (
                      sortConfig.direction === 'asc' ? (
                        <IoArrowUp className="w-3 h-3" />
                      ) : (
                        <IoArrowDown className="w-3 h-3" />
                      )
                    ) : (
                      <div className="flex flex-col -space-y-1 opacity-30">
                        <IoArrowUp className="w-2.5 h-2.5" />
                        <IoArrowDown className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-3 sm:px-6 py-6 sm:py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : sortedShifts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 sm:px-6 py-6 sm:py-8 text-center text-sm sm:text-base" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                    No shifts found. Add your first shift to get started.
                  </td>
                </tr>
              ) : (
                sortedShifts.map((shift) => (
                  <tr
                    key={shift.id}
                    className="hover:bg-opacity-50"
                    style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className="w-8 h-6 sm:w-12 sm:h-8 rounded flex-shrink-0"
                          style={{ backgroundColor: shift.shift_color }}
                        />
                        <span className="font-medium text-sm sm:text-base">{shift.shift_name}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm space-y-1">
                        <div>Start: <span className="font-medium">{shift.start_time}</span></div>
                        <div>Half Day: <span className="font-medium">{shift.half_day_mark_time}</span></div>
                        <div>End: <span className="font-medium">{shift.end_time}</span></div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm space-y-1">
                        <div>Late: <span className="font-medium">{shift.late_mark_after_minutes}m</span></div>
                        <div>Max check-in: <span className="font-medium">{shift.max_check_ins_per_day}/day</span></div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(shift.working_days || []).map((day) => (
                            <span
                              key={day}
                              className="text-xs px-1.5 sm:px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: isDark ? '#3B82F6' : '#DBEAFE',
                                color: isDark ? '#ffffff' : '#1E40AF',
                              }}
                            >
                              {day.substring(0, 3)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                      <input
                        type="radio"
                        checked={Boolean(shift.is_default)}
                        onChange={() => handleSetDefaultShift(shift.id)}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEditShift(shift)}
                          className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <IoPencil size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift.id)}
                          className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          disabled={Boolean(shift.is_default)}
                          title={shift.is_default ? 'Cannot delete default shift' : 'Delete shift'}
                        >
                          <IoTrash size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Shift Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center pt-4 sm:pt-6 md:pt-8 px-2 sm:px-4 md:px-6 pb-2 sm:pb-4 md:pb-6 z-[10000]"
          style={{ zIndex: 10000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false)
          }}
        >
          <div
            className="rounded-lg max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-full max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl relative z-[10001] mx-auto"
            style={{
              backgroundColor: isDark ? '#1F2937' : '#ffffff',
              zIndex: 10001,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-b sticky top-0 z-10"
              style={{
                backgroundColor: isDark ? '#1F2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#E5E7EB',
                zIndex: 10
              }}
            >
              <h3 className="text-sm sm:text-base md:text-lg font-semibold pr-2" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
                {editingShift ? 'Edit Shift' : 'Add New Shift'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 sm:p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <IoClose size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6">
              {/* Shift Type */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 sm:mb-3" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                  Shift Type
                </label>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.shift_type === 'Strict'}
                      onChange={() => handleInputChange('shift_type', 'Strict')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm sm:text-base" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>Strict Timings</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.shift_type === 'Flexible'}
                      onChange={() => handleInputChange('shift_type', 'Flexible')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm sm:text-base" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>Flexible Timings</span>
                  </label>
                </div>
              </div>

              {/* Shift Name & Short Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                    Shift Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Night Shift"
                    value={formData.shift_name}
                    onChange={(e) => handleInputChange('shift_name', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded border outline-none text-sm sm:text-base"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#D1D5DB',
                      color: isDark ? '#E5E7EB' : '#1F2937',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                    Shift Short Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NS"
                    value={formData.shift_short_code}
                    onChange={(e) => handleInputChange('shift_short_code', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded border outline-none text-sm sm:text-base"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#D1D5DB',
                      color: isDark ? '#E5E7EB' : '#1F2937',
                    }}
                  />
                </div>
              </div>

              {/* Color Code */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                  Color Code <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <ColorPicker
                    value={formData.shift_color}
                    onChange={(color) => handleInputChange('shift_color', color)}
                  />
                  <input
                    type="text"
                    value={formData.shift_color}
                    onChange={(e) => handleInputChange('shift_color', e.target.value)}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded border outline-none text-sm sm:text-base"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#D1D5DB',
                      color: isDark ? '#E5E7EB' : '#1F2937',
                    }}
                  />
                </div>
              </div>

              {/* Time Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded border outline-none text-sm sm:text-base"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#D1D5DB',
                      color: isDark ? '#E5E7EB' : '#1F2937',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded border outline-none text-sm sm:text-base"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#D1D5DB',
                      color: isDark ? '#E5E7EB' : '#1F2937',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                    Auto Clock Out <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.auto_clock_out_time}
                    onChange={(e) => handleInputChange('auto_clock_out_time', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded border outline-none text-sm sm:text-base"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#D1D5DB',
                      color: isDark ? '#E5E7EB' : '#1F2937',
                    }}
                  />
                </div>
              </div>

              {/* Additional Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                    Half-day Mark <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.half_day_mark_time}
                    onChange={(e) => handleInputChange('half_day_mark_time', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded border outline-none text-sm sm:text-base"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#D1D5DB',
                      color: isDark ? '#E5E7EB' : '#1F2937',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                    Early Clock In (min)
                  </label>
                  <input
                    type="number"
                    value={formData.early_clock_in_allowed_minutes}
                    onChange={(e) => handleInputChange('early_clock_in_allowed_minutes', parseInt(e.target.value))}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded border outline-none text-sm sm:text-base"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#D1D5DB',
                      color: isDark ? '#E5E7EB' : '#1F2937',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                    Late mark (min) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.late_mark_after_minutes}
                    onChange={(e) => handleInputChange('late_mark_after_minutes', parseInt(e.target.value))}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded border outline-none text-sm sm:text-base"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#D1D5DB',
                      color: isDark ? '#E5E7EB' : '#1F2937',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                  Max check-in per day <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.max_check_ins_per_day}
                  onChange={(e) => handleInputChange('max_check_ins_per_day', parseInt(e.target.value))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded border outline-none text-sm sm:text-base"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#D1D5DB',
                    color: isDark ? '#E5E7EB' : '#1F2937',
                  }}
                />
              </div>

              {/* Working Days */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 sm:mb-3" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                  Office opens on <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isSelected = (formData.working_days || []).includes(day)
                    return (
                      <label
                        key={day}
                        className="flex items-center gap-1.5 sm:gap-2 cursor-pointer p-1.5 sm:p-2 rounded border text-xs sm:text-sm"
                        style={{
                          borderColor: isSelected
                            ? '#3B82F6'
                            : isDark ? '#374151' : '#D1D5DB',
                          backgroundColor: isSelected
                            ? isDark ? '#1E3A8A' : '#DBEAFE'
                            : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleWorkingDayToggle(day)}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs sm:text-sm" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
                          <span className="sm:hidden">{day.substring(0, 3)}</span>
                          <span className="hidden sm:inline">{day}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t sticky bottom-0"
              style={{
                borderColor: isDark ? '#374151' : '#E5E7EB',
                backgroundColor: isDark ? '#1F2937' : '#ffffff',
                zIndex: 10
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-4 py-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm sm:text-base"
                style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveShift}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
              >
                {saving ? 'Saving...' : editingShift ? 'Update Shift' : 'Save Shift'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeShiftsTab

