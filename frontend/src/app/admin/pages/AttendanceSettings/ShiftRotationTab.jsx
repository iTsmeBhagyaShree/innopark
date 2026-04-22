/**
 * Shift Rotation Tab
 * Rotation Management + Automate + Run Rotation
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../../../../context/ThemeContext'
import { useAuth } from '../../../../context/AuthContext'
import { toast } from 'react-hot-toast'
import { IoAdd, IoSync, IoPlay, IoClose, IoTrash, IoArrowUp, IoArrowDown } from 'react-icons/io5'
import { attendanceSettingsAPI } from '../../../../api'

const ShiftRotationTab = () => {
  const { theme } = useTheme()
  const { user } = useAuth()
  const isDark = theme.mode === 'dark'
  
  const [rotations, setRotations] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddRotationModal, setShowAddRotationModal] = useState(false)
  const [showAutomateModal, setShowAutomateModal] = useState(false)
  const [showRunModal, setShowRunModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

  const [rotationForm, setRotationForm] = useState({
    rotation_name: '',
    rotation_frequency: 'Weekly',
    shifts_in_sequence: [],
    replace_existing_shift: false,
    notify_employees: false
  })

  const [automateForm, setAutomateForm] = useState({
    department_id: '',
    employee_ids: [],
    rotation_id: ''
  })

  const [runForm, setRunForm] = useState({
    rotation_id: '',
    employee_ids: [],
    start_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchRotations()
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

  // Apply sorting to rotations
  const sortedRotations = [...rotations].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0
    
    let aValue, bValue
    
    if (sortConfig.key === 'name') {
      aValue = a.rotation_name || ''
      bValue = b.rotation_name || ''
    } else if (sortConfig.key === 'frequency') {
      aValue = a.rotation_frequency || ''
      bValue = b.rotation_frequency || ''
    } else if (sortConfig.key === 'shifts') {
      aValue = a.shifts_in_sequence?.length || 0
      bValue = b.shifts_in_sequence?.length || 0
    } else if (sortConfig.key === 'replace') {
      aValue = a.replace_existing_shift ? 1 : 0
      bValue = b.replace_existing_shift ? 1 : 0
    } else if (sortConfig.key === 'notify') {
      aValue = a.notify_employees ? 1 : 0
      bValue = b.notify_employees ? 1 : 0
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

  const fetchRotations = async () => {
    try {
      setLoading(true)
      const response = await attendanceSettingsAPI.getAllRotations(user?.company_id)
      if (response.data.success) {
        setRotations(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching rotations:', error)
      toast.error('Failed to load rotations')
    } finally {
      setLoading(false)
    }
  }

  const fetchShifts = async () => {
    try {
      const response = await attendanceSettingsAPI.getAllShifts(user?.company_id)
      if (response.data.success) {
        setShifts(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching shifts:', error)
    }
  }

  const handleCreateRotation = async () => {
    if (!rotationForm.rotation_name) {
      toast.error('Please enter rotation name')
      return
    }

    if (rotationForm.shifts_in_sequence.length === 0) {
      toast.error('Please select at least one shift')
      return
    }

    try {
      setSaving(true)
      const response = await attendanceSettingsAPI.createRotation(user?.company_id, {
        ...rotationForm,
        replace_existing_shift: rotationForm.replace_existing_shift ? 1 : 0,
        notify_employees: rotationForm.notify_employees ? 1 : 0
      })

      if (response.data.success) {
        toast.success('Rotation created successfully')
        setShowAddRotationModal(false)
        fetchRotations()
        // Reset form
        setRotationForm({
          rotation_name: '',
          rotation_frequency: 'Weekly',
          shifts_in_sequence: [],
          replace_existing_shift: false,
          notify_employees: false
        })
      }
    } catch (error) {
      console.error('Error creating rotation:', error)
      toast.error(error.response?.data?.error || 'Failed to create rotation')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRotation = async (rotationId) => {
    if (!confirm('Are you sure you want to delete this rotation?')) return

    try {
      const response = await attendanceSettingsAPI.deleteRotation(rotationId, user?.company_id)
      if (response.data.success) {
        toast.success('Rotation deleted successfully')
        fetchRotations()
      }
    } catch (error) {
      console.error('Error deleting rotation:', error)
      toast.error(error.response?.data?.error || 'Failed to delete rotation')
    }
  }

  const handleRunRotation = async () => {
    if (!runForm.rotation_id) {
      toast.error('Please select a rotation')
      return
    }

    if (runForm.employee_ids.length === 0) {
      toast.error('Please select at least one employee')
      return
    }

    try {
      setSaving(true)
      const response = await attendanceSettingsAPI.runRotation(user?.company_id, runForm)

      if (response.data.success) {
        toast.success('Rotation applied successfully')
        setShowRunModal(false)
        // Reset form
        setRunForm({
          rotation_id: '',
          employee_ids: [],
          start_date: new Date().toISOString().split('T')[0]
        })
      }
    } catch (error) {
      console.error('Error running rotation:', error)
      toast.error(error.response?.data?.error || 'Failed to run rotation')
    } finally {
      setSaving(false)
    }
  }

  const handleShiftToggle = (shiftId) => {
    setRotationForm(prev => {
      const shifts = prev.shifts_in_sequence || []
      if (shifts.includes(shiftId)) {
        return {
          ...prev,
          shifts_in_sequence: shifts.filter(id => id !== shiftId)
        }
      } else {
        return {
          ...prev,
          shifts_in_sequence: [...shifts, shiftId]
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowAddRotationModal(true)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs sm:text-sm md:text-base whitespace-nowrap"
        >
          <IoAdd size={18} className="sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Add New Shift Rotation</span>
          <span className="sm:hidden">Add Rotation</span>
        </button>
        <button
          onClick={() => setShowRunModal(true)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-xs sm:text-sm md:text-base whitespace-nowrap"
        >
          <IoPlay size={18} className="sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Run Rotation</span>
          <span className="sm:hidden">Run</span>
        </button>
      </div>

      {/* Rotations Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          backgroundColor: isDark ? '#1F2937' : '#ffffff',
          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        }}
      >
        <table className="w-full">
          <thead>
            <tr
              className="text-left text-sm font-medium"
              style={{
                backgroundColor: isDark ? '#111827' : '#F9FAFB',
                color: isDark ? '#9CA3AF' : '#6B7280',
              }}
            >
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-opacity-80 select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Rotation Name</span>
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
                className="px-6 py-4 cursor-pointer hover:bg-opacity-80 select-none"
                onClick={() => handleSort('frequency')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Frequency</span>
                  {sortConfig.key === 'frequency' ? (
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
                className="px-6 py-4 cursor-pointer hover:bg-opacity-80 select-none"
                onClick={() => handleSort('shifts')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Shifts Count</span>
                  {sortConfig.key === 'shifts' ? (
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
                className="px-6 py-4 cursor-pointer hover:bg-opacity-80 select-none"
                onClick={() => handleSort('replace')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Replace Existing</span>
                  {sortConfig.key === 'replace' ? (
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
                className="px-6 py-4 cursor-pointer hover:bg-opacity-80 select-none"
                onClick={() => handleSort('notify')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Notify Employees</span>
                  {sortConfig.key === 'notify' ? (
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
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : sortedRotations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                    No rotations found. Add your first rotation to get started.
                  </td>
                </tr>
              ) : (
                sortedRotations.map((rotation) => (
                <tr
                  key={rotation.id}
                  style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}
                >
                  <td className="px-6 py-4 font-medium">{rotation.rotation_name}</td>
                  <td className="px-6 py-4">{rotation.rotation_frequency}</td>
                  <td className="px-6 py-4">{rotation.shifts_in_sequence?.length || 0} shifts</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${rotation.replace_existing_shift ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {rotation.replace_existing_shift ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${rotation.notify_employees ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {rotation.notify_employees ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteRotation(rotation.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <IoTrash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Rotation Modal */}
      {showAddRotationModal && (
        <div 
          className="fixed inset-0 flex items-start sm:items-center justify-center bg-black bg-opacity-50 pt-4 sm:pt-6 md:pt-8 px-2 sm:px-4 md:px-6 pb-2 sm:pb-4 md:pb-6 z-[10000]" 
          style={{ zIndex: 10000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddRotationModal(false)
          }}
        >
          <div
            className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto rounded-lg shadow-2xl relative z-[10001] mx-auto"
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
                Create Shift Rotation
              </h3>
              <button
                onClick={() => setShowAddRotationModal(false)}
                className="p-1 sm:p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <IoClose size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                  Rotation Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={rotationForm.rotation_name}
                  onChange={(e) => setRotationForm(prev => ({ ...prev, rotation_name: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded border outline-none text-sm sm:text-base"
                  placeholder="Enter rotation name"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#D1D5DB',
                    color: isDark ? '#E5E7EB' : '#1F2937',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                  Rotation Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  value={rotationForm.rotation_frequency}
                  onChange={(e) => setRotationForm(prev => ({ ...prev, rotation_frequency: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded border outline-none text-sm sm:text-base"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#D1D5DB',
                    color: isDark ? '#E5E7EB' : '#1F2937',
                  }}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                  Select Shifts in Sequence <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded" style={{ borderColor: isDark ? '#374151' : '#D1D5DB' }}>
                  {shifts.map((shift) => (
                    <label
                      key={shift.id}
                      className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={(rotationForm.shifts_in_sequence || []).includes(shift.id)}
                        onChange={() => handleShiftToggle(shift.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: shift.shift_color }}
                      />
                      <span style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
                        {shift.shift_name} ({shift.start_time} - {shift.end_time})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={rotationForm.replace_existing_shift}
                  onChange={(e) => setRotationForm(prev => ({ ...prev, replace_existing_shift: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                  Replace existing shift of employees
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={rotationForm.notify_employees}
                  onChange={(e) => setRotationForm(prev => ({ ...prev, notify_employees: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                  Send rotation notification to employees
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t sticky bottom-0 z-10"
              style={{ 
                borderColor: isDark ? '#374151' : '#E5E7EB', 
                backgroundColor: isDark ? '#1F2937' : '#ffffff',
                zIndex: 10
              }}
            >
              <button
                onClick={() => setShowAddRotationModal(false)}
                disabled={saving}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 text-xs sm:text-sm md:text-base font-medium"
                style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRotation}
                disabled={saving}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base font-medium"
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Rotation Modal */}
      {showRunModal && (
        <div 
          className="fixed inset-0 flex items-start sm:items-center justify-center bg-black bg-opacity-50 pt-4 sm:pt-6 md:pt-8 px-2 sm:px-4 md:px-6 pb-2 sm:pb-4 md:pb-6 z-[10000]" 
          style={{ zIndex: 10000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRunModal(false)
          }}
        >
          <div
            className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto rounded-lg shadow-2xl relative z-[10001] mx-auto"
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
                borderColor: isDark ? '#374151' : '#E5E7EB' 
              }}
            >
              <h3 className="text-sm sm:text-base md:text-lg font-semibold pr-2" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
                Run Shift Rotation
              </h3>
              <button
                onClick={() => setShowRunModal(false)}
                className="p-1 sm:p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <IoClose size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                  Select Rotation <span className="text-red-500">*</span>
                </label>
                <select
                  value={runForm.rotation_id}
                  onChange={(e) => setRunForm(prev => ({ ...prev, rotation_id: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded border outline-none"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#D1D5DB',
                    color: isDark ? '#E5E7EB' : '#1F2937',
                  }}
                >
                  <option value="">Choose rotation...</option>
                  {rotations.map((rotation) => (
                    <option key={rotation.id} value={rotation.id}>
                      {rotation.rotation_name} ({rotation.rotation_frequency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={runForm.start_date}
                  onChange={(e) => setRunForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded border outline-none"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#D1D5DB',
                    color: isDark ? '#E5E7EB' : '#1F2937',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
                  Employee IDs (comma-separated) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 1,2,3"
                  onChange={(e) => {
                    const ids = e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                    setRunForm(prev => ({ ...prev, employee_ids: ids }))
                  }}
                  className="w-full px-4 py-2.5 rounded border outline-none"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#D1D5DB',
                    color: isDark ? '#E5E7EB' : '#1F2937',
                  }}
                />
                <p className="text-xs mt-1" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                  Note: In a production environment, this would be a multi-select dropdown with employee names
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t sticky bottom-0 z-10"
              style={{ 
                borderColor: isDark ? '#374151' : '#E5E7EB', 
                backgroundColor: isDark ? '#1F2937' : '#ffffff',
                zIndex: 10
              }}
            >
              <button
                onClick={() => setShowRunModal(false)}
                disabled={saving}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 text-xs sm:text-sm md:text-base font-medium"
                style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRunRotation}
                disabled={saving}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base font-medium"
              >
                {saving ? 'Running...' : 'Run Rotation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShiftRotationTab
