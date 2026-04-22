/**
 * Attendance Settings Page
 * Route: /app/admin/settings/attendance
 * Tabs: Attendance Settings, Employee Shifts, Shift Rotation, QR Code, Attendance Regularisation
 */

import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import AttendanceSettingsTab from './AttendanceSettings/AttendanceSettingsTab'
import EmployeeShiftsTab from './AttendanceSettings/EmployeeShiftsTab'
import ShiftRotationTab from './AttendanceSettings/ShiftRotationTab'
import QRCodeTab from './AttendanceSettings/QRCodeTab'
import AttendanceRegularisationTab from './AttendanceSettings/AttendanceRegularisationTab'

const AttendanceSettings = () => {
  const { theme } = useTheme()
  const isDark = theme.mode === 'dark'
  
  const [activeTab, setActiveTab] = useState('attendance-settings')

  const tabs = [
    { id: 'attendance-settings', label: 'Attendance Settings' },
    { id: 'employee-shifts', label: 'Employee Shifts' },
    { id: 'shift-rotation', label: 'Shift Rotation' },
    { id: 'qr-code', label: 'QR Code' },
    { id: 'attendance-regularisation', label: 'Attendance Regularisation' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'attendance-settings':
        return <AttendanceSettingsTab />
      case 'employee-shifts':
        return <EmployeeShiftsTab />
      case 'shift-rotation':
        return <ShiftRotationTab />
      case 'qr-code':
        return <QRCodeTab />
      case 'attendance-regularisation':
        return <AttendanceRegularisationTab />
      default:
        return <AttendanceSettingsTab />
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
          Attendance Settings
        </h1>
        <p className="text-xs sm:text-sm" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
          Configure attendance rules, shifts, and employee schedules
        </p>
      </div>

      {/* Tabs */}
      <div 
        className="border-b overflow-x-auto"
        style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}
      >
        <div className="flex space-x-4 sm:space-x-6 lg:space-x-8 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 sm:pb-4 px-1 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2'
                  : 'hover:opacity-70'
              }`}
              style={{
                color: activeTab === tab.id
                  ? isDark ? '#60A5FA' : '#3B82F6'
                  : isDark ? '#9CA3AF' : '#6B7280',
                borderColor: activeTab === tab.id
                  ? isDark ? '#60A5FA' : '#3B82F6'
                  : 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default AttendanceSettings

