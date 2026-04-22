import { useState, useEffect, useCallback } from 'react'
import { attendanceAPI, employeesAPI, departmentsAPI, positionsAPI } from '../../../api'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import RightSideModal from '../../../components/ui/RightSideModal'
import Button from '../../../components/ui/Button'
import { IoAdd, IoDownloadOutline, IoCloudUploadOutline, IoListOutline, IoPersonOutline, IoTimeOutline } from 'react-icons/io5'

const Attendance = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const companyId = user?.company_id || localStorage.getItem('companyId') || 1

  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [year, setYear] = useState(currentDate.getFullYear())

  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])

  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')

  // Modal
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false)
  const [markFormData, setMarkFormData] = useState({
    employee_id: '',
    date: '',
    status: 'present',
    clock_in: '',
    clock_out: '',
    work_from: 'office',
    late_reason: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  // Months array
  const months = [
    t('months.january'), t('months.february'), t('months.march'), t('months.april'), 
    t('months.may'), t('months.june'), t('months.july'), t('months.august'), 
    t('months.september'), t('months.october'), t('months.november'), t('months.december')
  ]

  // Status config
  const statusConfig = {
    present: { symbol: '✓', color: 'text-green-600', bg: 'bg-green-50', label: t('attendance.status.present') },
    absent: { symbol: '✗', color: 'text-red-600', bg: 'bg-red-50', label: t('attendance.status.absent') },
    half_day: { symbol: '½', color: 'text-orange-600', bg: 'bg-orange-50', label: t('attendance.status.half_day') },
    late: { symbol: '⏱', color: 'text-yellow-600', bg: 'bg-yellow-50', label: t('attendance.status.late') },
    on_leave: { symbol: '✉', color: 'text-purple-600', bg: 'bg-purple-50', label: t('attendance.status.on_leave') },
    holiday: { symbol: '★', color: 'text-amber-600', bg: 'bg-amber-50', label: t('attendance.status.holiday') },
    day_off: { symbol: '🏠', color: 'text-blue-600', bg: 'bg-blue-50', label: t('attendance.status.day_off') },
  }

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await departmentsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setDepartments(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }, [companyId])

  const fetchPositions = useCallback(async () => {
    try {
      const response = await positionsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setPositions(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }, [companyId])

  const fetchAttendanceSummary = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        company_id: companyId,
        month,
        year,
      }
      if (selectedDepartment) params.department_id = selectedDepartment
      if (selectedPosition) params.position_id = selectedPosition

      const response = await attendanceAPI.getSummary(params)
      if (response.data.success) {
        let data = response.data.data || []

        // Filter by selected employee if any
        if (selectedEmployee) {
          data = data.filter(emp => emp.employee_id.toString() === selectedEmployee)
        }

        setAttendanceData(data)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }, [companyId, month, year, selectedDepartment, selectedPosition, selectedEmployee])

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await employeesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setEmployees(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }, [companyId])

  useEffect(() => {
    fetchDepartments()
    fetchPositions()
    fetchEmployees()
  }, [fetchDepartments, fetchPositions, fetchEmployees])

  useEffect(() => {
    fetchAttendanceSummary()
  }, [fetchAttendanceSummary])

  // Get days in month
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Get day name
  const getDayName = (day) => {
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('de', { weekday: 'short' })
  }

  // Check if weekend
  const isWeekend = (day) => {
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay()
    return dayOfWeek === 0 || dayOfWeek === 6
  }

  // Handle cell click
  const handleCellClick = (employee, day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const currentStatus = employee.attendance[day]
    setMarkFormData({
      employee_id: employee.employee_id,
      date: dateStr,
      status: currentStatus ? currentStatus.toLowerCase().replace(' ', '_') : 'present',
      clock_in: '',
      clock_out: '',
      work_from: 'office',
      late_reason: '',
      notes: ''
    })
    setIsMarkModalOpen(true)
  }

  // Handle mark attendance
  const handleMarkAttendance = () => {
    setMarkFormData({
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      clock_in: '',
      clock_out: '',
      work_from: 'office',
      late_reason: '',
      notes: ''
    })
    setIsMarkModalOpen(true)
  }

  // Save attendance
  const handleSave = async () => {
    if (!markFormData.employee_id || !markFormData.date || !markFormData.status) {
      alert(t('attendance.alerts.required_fields'))
      return
    }

    try {
      setSaving(true)
      const response = await attendanceAPI.create({
        company_id: parseInt(companyId),
        ...markFormData,
        employee_id: parseInt(markFormData.employee_id)
      })

      if (response.data.success) {
        alert(t('attendance.alerts.mark_success'))
        setIsMarkModalOpen(false)
        fetchAttendanceSummary()
      } else {
        alert(response.data.error || t('attendance.alerts.mark_failed'))
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      alert(error.response?.data?.error || t('attendance.alerts.mark_failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header Filters */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('common.employee')}</span>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="border border-gray-300 rounded px-2.5 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary-accent"
            >
              <option value="">{t('common.all')}</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('common.departments')}</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="border border-gray-300 rounded px-2.5 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary-accent"
            >
              <option value="">{t('common.all')}</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('common.positions')}</span>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="border border-gray-300 rounded px-2.5 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary-accent"
            >
              <option value="">{t('common.all')}</option>
              {positions.map(pos => (
                <option key={pos.id} value={pos.id}>{pos.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('common.month')}</span>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2.5 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary-accent"
            >
              {months.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('common.year')}</span>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2.5 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary-accent"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAttendance}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 shadow-sm transition-colors active:scale-95"
          >
            <IoAdd size={16} /> {t('attendance.mark_attendance')}
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 shadow-sm transition-colors active:scale-95">
            <IoCloudUploadOutline size={16} /> {t('common.import') || 'Import'}
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 shadow-sm transition-colors active:scale-95">
            <IoDownloadOutline size={16} /> {t('common.export') || 'Export'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 border border-gray-300 rounded-lg bg-gray-900 text-white shadow-sm">
            <IoListOutline size={16} />
          </button>
          <button className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm">
            <IoPersonOutline size={16} />
          </button>
          <button className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm">
            <IoTimeOutline size={16} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-gray-500 font-medium">{t('attendance.fields.legend')}</span>
          {Object.entries(statusConfig).map(([key, config]) => (
            <span key={key} className="flex items-center gap-1">
              <span className={`${config.color}`}>{config.symbol}</span>
              <span className="text-gray-600">→ {config.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="table-responsive-wrapper scrollbar-hide">
        <table className="min-w-full text-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                {t('common.employee')}
              </th>
              {daysArray.map(day => (
                <th
                  key={day}
                  className={`px-2 py-2 text-center text-xs font-medium uppercase tracking-wider min-w-[40px] ${isWeekend(day) ? 'bg-gray-100 text-gray-400' : 'text-gray-500'
                    }`}
                >
                  <div>{day}</div>
                  <div className="text-[10px] font-normal">{getDayName(day)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={daysInMonth + 1} className="text-center py-8 text-gray-400">
                  {t('common.loading')}
                </td>
              </tr>
            ) : attendanceData.length === 0 ? (
              <tr>
                <td colSpan={daysInMonth + 1} className="text-center py-8 text-gray-400">
                  {t('employees.no_employees')}
                </td>
              </tr>
            ) : (
              attendanceData.map((emp, idx) => (
                <tr key={emp.employee_id} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white px-4 py-3 z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                        {emp.name?.charAt(0).toUpperCase() || 'E'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {emp.name}
                          {user?.id === emp.user_id && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">{t('attendance.fields.you')}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{emp.position_name || t('common.employee')}</div>
                      </div>
                    </div>
                  </td>
                  {daysArray.map(day => {
                    const status = emp.attendance[day]
                    const normalizedStatus = status ? status.toLowerCase().replace(' ', '_') : null
                    const config = normalizedStatus ? statusConfig[normalizedStatus] : null
                    return (
                      <td
                        key={day}
                        className={`px-2 py-3 text-center cursor-pointer hover:bg-blue-50 transition-colors ${isWeekend(day) ? 'bg-gray-50' : ''
                          }`}
                        onClick={() => handleCellClick(emp, day)}
                      >
                        {config ? (
                          <span className={`text-sm ${config.color}`} title={config.label}>
                            {config.symbol}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mark Attendance Modal */}
      <RightSideModal
        isOpen={isMarkModalOpen}
        onClose={() => setIsMarkModalOpen(false)}
        title={t('attendance.mark_attendance')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.employee')} *</label>
            <select
              value={markFormData.employee_id}
              onChange={(e) => setMarkFormData({ ...markFormData, employee_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{t('employees.form.select')}</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.date')} *</label>
            <input
              type="date"
              value={markFormData.date}
              onChange={(e) => setMarkFormData({ ...markFormData, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')} *</label>
            <select
              value={markFormData.status}
              onChange={(e) => setMarkFormData({ ...markFormData, status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('attendance.fields.clock_in')}</label>
              <input
                type="time"
                value={markFormData.clock_in}
                onChange={(e) => setMarkFormData({ ...markFormData, clock_in: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('attendance.fields.clock_out')}</label>
              <input
                type="time"
                value={markFormData.clock_out}
                onChange={(e) => setMarkFormData({ ...markFormData, clock_out: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('attendance.fields.work_from')}</label>
            <select
              value={markFormData.work_from}
              onChange={(e) => setMarkFormData({ ...markFormData, work_from: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="office">{t('attendance.values.office')}</option>
              <option value="home">{t('attendance.values.home')}</option>
              <option value="other">{t('attendance.values.other')}</option>
            </select>
          </div>

          {markFormData.status === 'late' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('attendance.fields.late_reason')}</label>
              <textarea
                value={markFormData.late_reason}
                onChange={(e) => setMarkFormData({ ...markFormData, late_reason: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={2}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.note')}</label>
            <textarea
              value={markFormData.notes}
              onChange={(e) => setMarkFormData({ ...markFormData, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsMarkModalOpen(false)} className="flex-1">
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? `${t('common.save') || 'Save'}...` : t('common.save') || 'Save'}
            </Button>
          </div>
        </div>
      </RightSideModal>
    </div>
  )
}

export default Attendance
