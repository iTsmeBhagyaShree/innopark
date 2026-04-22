/**
 * Attendance Settings Tab
 * General Rules + Configuration
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../../../../context/ThemeContext'
import { useAuth } from '../../../../context/AuthContext'
import { toast } from 'react-hot-toast'
import { IoSave, IoInformationCircle } from 'react-icons/io5'
import { attendanceSettingsAPI } from '../../../../api'

const AttendanceSettingsTab = () => {
  const { theme } = useTheme()
  const { user } = useAuth()
  const isDark = theme.mode === 'dark'
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [settings, setSettings] = useState({
    allow_shift_change_request: false,
    save_clock_in_location: true,
    allow_employee_self_clock_in_out: true,
    auto_clock_in_first_login: false,
    clock_in_location_radius_check: false,
    clock_in_location_radius_value: 0,
    allow_clock_in_outside_shift: false,
    clock_in_ip_check: false,
    clock_in_ip_addresses: [],
    send_monthly_report_email: false,
    week_starts_from: 'Monday',
    attendance_reminder_status: false,
  })

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await attendanceSettingsAPI.getSettings(user?.company_id)
      if (response.data.success) {
        const data = response.data.data
        setSettings({
          allow_shift_change_request: Boolean(data.allow_shift_change_request),
          save_clock_in_location: Boolean(data.save_clock_in_location),
          allow_employee_self_clock_in_out: Boolean(data.allow_employee_self_clock_in_out),
          auto_clock_in_first_login: Boolean(data.auto_clock_in_first_login),
          clock_in_location_radius_check: Boolean(data.clock_in_location_radius_check),
          clock_in_location_radius_value: data.clock_in_location_radius_value || 0,
          allow_clock_in_outside_shift: Boolean(data.allow_clock_in_outside_shift),
          clock_in_ip_check: Boolean(data.clock_in_ip_check),
          clock_in_ip_addresses: data.clock_in_ip_addresses || [],
          send_monthly_report_email: Boolean(data.send_monthly_report_email),
          week_starts_from: data.week_starts_from || 'Monday',
          attendance_reminder_status: Boolean(data.attendance_reminder_status),
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load attendance settings')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckboxChange = (field) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Convert boolean values to 0/1 for database
      const dataToSave = {
        allow_shift_change_request: settings.allow_shift_change_request ? 1 : 0,
        save_clock_in_location: settings.save_clock_in_location ? 1 : 0,
        allow_employee_self_clock_in_out: settings.allow_employee_self_clock_in_out ? 1 : 0,
        auto_clock_in_first_login: settings.auto_clock_in_first_login ? 1 : 0,
        clock_in_location_radius_check: settings.clock_in_location_radius_check ? 1 : 0,
        clock_in_location_radius_value: settings.clock_in_location_radius_value,
        allow_clock_in_outside_shift: settings.allow_clock_in_outside_shift ? 1 : 0,
        clock_in_ip_check: settings.clock_in_ip_check ? 1 : 0,
        clock_in_ip_addresses: settings.clock_in_ip_addresses,
        send_monthly_report_email: settings.send_monthly_report_email ? 1 : 0,
        week_starts_from: settings.week_starts_from,
        attendance_reminder_status: settings.attendance_reminder_status ? 1 : 0,
      }

      const response = await attendanceSettingsAPI.updateSettings(user?.company_id, dataToSave)
      
      if (response.data.success) {
        toast.success('Attendance settings saved successfully')
      } else {
        throw new Error(response.data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error(error.response?.data?.error || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* General Attendance Rules */}
      <div
        className="p-4 sm:p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? '#1F2937' : '#ffffff',
          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        }}
      >
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
          General Attendance Rules
        </h3>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Checkbox Options */}
          <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allow_shift_change_request}
              onChange={() => handleCheckboxChange('allow_shift_change_request')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
            />
            <span className="text-sm sm:text-base" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
              Allow employee to request shift change
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.save_clock_in_location}
              onChange={() => handleCheckboxChange('save_clock_in_location')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
              Save Clock-In Location
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allow_employee_self_clock_in_out}
              onChange={() => handleCheckboxChange('allow_employee_self_clock_in_out')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
              Allowed Employee self Clock-In/Clock-Out
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.auto_clock_in_first_login}
              onChange={() => handleCheckboxChange('auto_clock_in_first_login')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
              Auto clock-in employee by first sign in
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.clock_in_location_radius_check}
              onChange={() => handleCheckboxChange('clock_in_location_radius_check')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
              Clock-in check with added location Radius
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allow_clock_in_outside_shift}
              onChange={() => handleCheckboxChange('allow_clock_in_outside_shift')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
              Allow clock-in outside shift hours
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.clock_in_ip_check}
              onChange={() => handleCheckboxChange('clock_in_ip_check')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
              Clock-in check with added IP address
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.send_monthly_report_email}
              onChange={() => handleCheckboxChange('send_monthly_report_email')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span style={{ color: isDark ? '#E5E7EB' : '#374151' }} className="flex items-center gap-2">
              Send monthly attendance report email
              <IoInformationCircle size={16} className="text-gray-400" />
            </span>
          </label>
        </div>
      </div>

      {/* Attendance Configuration */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? '#1F2937' : '#ffffff',
          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
          Attendance Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Week Starts From */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
              Week Starts From <span className="text-red-500">*</span>
            </label>
            <select
              value={settings.week_starts_from}
              onChange={(e) => handleInputChange('week_starts_from', e.target.value)}
              className="w-full px-4 py-2.5 rounded border outline-none"
              style={{
                backgroundColor: isDark ? '#111827' : '#ffffff',
                borderColor: isDark ? '#374151' : '#D1D5DB',
                color: isDark ? '#E5E7EB' : '#1F2937',
              }}
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          {/* Attendance Reminder Status */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#E5E7EB' : '#374151' }}>
              Attendance Reminder Status
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleInputChange('attendance_reminder_status', !settings.attendance_reminder_status)}
                className={`relative inline-flex items-center h-7 rounded-full w-14 transition-colors focus:outline-none ${
                  settings.attendance_reminder_status ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block w-5 h-5 transform transition-transform bg-white rounded-full ${
                    settings.attendance_reminder_status ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
              <span style={{ color: isDark ? '#E5E7EB' : '#6B7280' }} className="text-sm">
                {settings.attendance_reminder_status ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium w-full sm:w-auto"
        >
          <IoSave size={16} className="sm:w-[18px] sm:h-[18px]" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      </>
      )}
    </div>
  )
}

export default AttendanceSettingsTab

