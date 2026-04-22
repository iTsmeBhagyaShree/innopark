/**
 * Attendance Regularisation Tab
 * Attendance correction and regularisation requests
 */

import { useState } from 'react'
import { useTheme } from '../../../../context/ThemeContext'

const AttendanceRegularisationTab = () => {
  const { theme } = useTheme()
  const isDark = theme.mode === 'dark'

  return (
    <div className="space-y-6">
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? '#1F2937' : '#ffffff',
          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}>
          Attendance Regularisation
        </h3>
        
        <div className="text-center py-12">
          <p style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            Attendance regularisation requests will appear here
          </p>
        </div>
      </div>
    </div>
  )
}

export default AttendanceRegularisationTab

