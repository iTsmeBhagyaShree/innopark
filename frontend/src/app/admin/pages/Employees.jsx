import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { IoPencil, IoTrashOutline, IoEye } from 'react-icons/io5'
import { employeesAPI, departmentsAPI, positionsAPI } from '../../../api'
import { useLanguage } from '../../../context/LanguageContext'
import { FormRow, FormInput, FormSelect, FormTextarea } from '../../../components/ui/FormRow'

const Employees = () => {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const companyId = user?.company_id || localStorage.getItem('companyId') || 1

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  // Initial Form State
  const initialFormState = {
    // Account Details
    employee_number: '',
    salutation: 'Mr.',
    name: '',
    email: '',
    date_of_birth: '',
    designation: '', // Mapped to position_id
    department_id: '',
    position_id: '',
    country: '',
    mobile: '', // phone in DB
    gender: 'Male',
    joining_date: '',
    language: language || 'en',
    user_role: 'EMPLOYEE', // Mapped to role in DB
    address: '', // Personal Address

    // Other Details
    login_allowed: 'Active', // Maps to status
    email_notifications: 1,
    hourly_rate: '',
    salary: '',
    slack_member_id: '',
    skills: '',
    probation_end_date: '',
    notice_period_start_date: '',
    notice_period_end_date: '',
    employment_type: 'Full Time',
    marital_status: 'Single',
    business_address: '',
    about: '',
  }

  const [formData, setFormData] = useState(initialFormState)

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Memoize fetch functions
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

  const fetchPositions = useCallback(async (departmentId) => {
    try {
      const response = await positionsAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        let filteredPositions = response.data.data || []
        if (departmentId) {
          filteredPositions = filteredPositions.filter(pos => pos.department_id === parseInt(departmentId))
        }
        setPositions(filteredPositions)
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }, [companyId])

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const response = await employeesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        const fetchedEmployees = response.data.data || []
        const transformedEmployees = fetchedEmployees.map(emp => ({
          ...emp, // Include all fields
          id: emp.id,
          name: emp.name || '',
          email: emp.email || '',
          phone: emp.phone || '',
          department: emp.department_name || '',
          position: emp.position_name || '',
          status: emp.status || 'Active',
          user_id: emp.user_id,
        }))
        setEmployees(transformedEmployees)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    Promise.all([
      fetchEmployees(),
      fetchDepartments()
    ])
  }, [fetchEmployees, fetchDepartments])

  useEffect(() => {
    if (formData.department_id) {
      fetchPositions(formData.department_id)
    } else {
      fetchPositions(null)
    }
  }, [formData.department_id, fetchPositions])

  // Columns for DataTable
  const columns = [
    { key: 'employee_number', label: t('employees.columns.id') },
    {
      key: 'name', label: t('employees.columns.name'), render: (text, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{text}</span>
          <span className="text-xs text-secondary-text">{row.position}</span>
        </div>
      )
    },
    { key: 'email', label: t('employees.columns.email') },
    { key: 'department', label: t('employees.columns.department') },
    {
      key: 'status',
      label: t('employees.columns.status'),
      render: (value) => (
        <Badge variant={value === 'Active' ? 'success' : 'default'}>{t(`common.status.${value?.toLowerCase() || 'active'}`)}</Badge>
      ),
    },
  ]

  const handleAdd = () => {
    setFormData(initialFormState)
    setPassword('')
    setShowPassword(false)
    setIsAddModalOpen(true)
  }

  const handleEdit = async (employee) => {
    try {
      setLoading(true)
      const response = await employeesAPI.getById(employee.id)
      if (response.data.success) {
        const emp = response.data.data
        setSelectedEmployee(employee)
        setFormData({
          employee_number: emp.employee_number || '',
          salutation: emp.salutation || 'Mr.',
          name: emp.name || '',
          email: emp.email || '',
          date_of_birth: emp.date_of_birth ? emp.date_of_birth.split('T')[0] : '',
          designation: '',
          department_id: emp.department_id?.toString() || '',
          position_id: emp.position_id?.toString() || '',
          country: emp.country || '',
          mobile: emp.phone || '', // phone in DB maps to mobile
          gender: emp.gender || 'Male',
          joining_date: emp.joining_date ? emp.joining_date.split('T')[0] : '',
          reporting_to: emp.reporting_to?.toString() || '',
          language: emp.language || 'en',
          user_role: emp.role || 'EMPLOYEE',
          address: emp.address || '',

          login_allowed: emp.status || 'Active',
          email_notifications: emp.email_notifications ?? 1,
          hourly_rate: emp.hourly_rate || '',
          salary: emp.salary || '',
          slack_member_id: emp.slack_member_id || '',
          skills: emp.skills || '',
          probation_end_date: emp.probation_end_date ? emp.probation_end_date.split('T')[0] : '',
          notice_period_start_date: emp.notice_period_start_date ? emp.notice_period_start_date.split('T')[0] : '',
          notice_period_end_date: emp.notice_period_end_date ? emp.notice_period_end_date.split('T')[0] : '',
          employment_type: emp.employment_type || 'Full Time',
          marital_status: emp.marital_status || 'Single',
          business_address: emp.business_address || '',
          about: emp.about || '',
        })

        if (emp.department_id) {
          await fetchPositions(emp.department_id)
        }
        setIsEditModalOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch employee:', error)
      alert(t('employees.alerts.fetch_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleView = (employee) => {
    navigate(`/app/admin/employees/${employee.id}`)
  }

  const handleSave = async () => {
    if (!formData.name?.trim() || !formData.email?.trim()) {
      alert(t('employees.alerts.name_email_required'))
      return
    }

    if (isAddModalOpen && !password) {
      alert(t('employees.alerts.password_required'))
      return
    }

    try {
      setSaving(true)

      const employeeData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.mobile || null,
        address: formData.address || null, // Personal Address
        company_id: parseInt(companyId),
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        position_id: formData.position_id ? parseInt(formData.position_id) : null,
        employee_number: formData.employee_number || null,
        joining_date: formData.joining_date || null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        role: formData.user_role,
        status: formData.login_allowed,

        // New Fields
        salutation: formData.salutation,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender,
        reporting_to: formData.reporting_to ? parseInt(formData.reporting_to) : null,
        language: formData.language,
        about: formData.about,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        slack_member_id: formData.slack_member_id || null,
        skills: formData.skills,
        probation_end_date: formData.probation_end_date || null,
        notice_period_start_date: formData.notice_period_start_date || null,
        notice_period_end_date: formData.notice_period_end_date || null,
        employment_type: formData.employment_type,
        marital_status: formData.marital_status,
        business_address: formData.business_address,
        country: formData.country,
        email_notifications: parseInt(formData.email_notifications),
      }

      if (isAddModalOpen) {
        employeeData.password = password
      }

      if (isEditModalOpen && selectedEmployee) {
        const response = await employeesAPI.update(selectedEmployee.id, employeeData)
        if (response.data.success) {
          alert(t('employees.alerts.update_success'))
          await fetchEmployees()
          setIsEditModalOpen(false)
          setSelectedEmployee(null)
        } else {
          alert(response.data.error || t('employees.alerts.update_failed') || t('employees.alerts.save_failed'))
        }
      } else {
        const response = await employeesAPI.create(employeeData)
        if (response.data.success) {
          alert(t('employees.alerts.create_success'))
          await fetchEmployees()
          setIsAddModalOpen(false)
        } else {
          alert(response.data.error || t('employees.alerts.create_failed') || t('employees.alerts.save_failed'))
        }
      }
    } catch (error) {
      console.error('Error saving employee:', error)
      alert(error.response?.data?.error || t('employees.alerts.save_failed'))
    } finally {
      setSaving(false)
    }
  }

  const actions = (row) => (
    <div className="action-btn-container">
      <button onClick={(e) => { e.stopPropagation(); handleView(row) }} className="action-btn action-btn-view" title={t('common.actions.view')}><IoEye size={18} /></button>
      <button onClick={(e) => { e.stopPropagation(); handleEdit(row) }} className="action-btn action-btn-edit" title={t('common.actions.edit')}><IoPencil size={18} /></button>
      <button
        onClick={async (e) => {
          e.stopPropagation()
          if (window.confirm(`${row.name} ${t('common.delete')}?`)) {
            try {
              await employeesAPI.delete(row.id)
              alert(t('employees.alerts.delete_success'))
              await fetchEmployees()
            } catch (error) {
              alert(error.response?.data?.error)
            }
          }
        }}
        className="action-btn action-btn-delete"
        title={t('common.actions.delete')}
      >
        <IoTrashOutline size={18} />
      </button>
    </div>
  )

  const renderModalContent = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-primary-text border-b pb-2">{t('employees.form.account_data')}</h3>

      <FormRow label={t('employees.form.profile_image')}>
        <input
          type="file"
          accept="image/*"
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-primary-50 file:text-primary-700
            hover:file:bg-primary-100 cursor-pointer"
          onChange={(e) => {
            // Placeholder for file handling
            console.log('File selected:', e.target.files[0])
          }}
        />
        <p className="text-xs text-gray-500 mt-1">{t('employees.form.image_formats')}</p>
      </FormRow>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label={t('employees.form.employee_id')}>
          <FormInput value={formData.employee_number} onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })} />
          <FormSelect value={formData.salutation} onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}>
            <option value="Mr.">{t('employees.values.mr')}</option>
            <option value="Mrs.">{t('employees.values.mrs')}</option>
            <option value="Miss">{t('employees.values.miss')}</option>
            <option value="Dr.">{t('employees.values.dr')}</option>
            <option value="Prof.">{t('employees.values.prof')}</option>
          </FormSelect>
        </FormRow>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label={t('employees.form.name')} required>
          <FormInput value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </FormRow>
        <FormRow label={t('employees.form.email')} required>
          <FormInput type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </FormRow>
      </div>

      {isAddModalOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">{t('employees.form.password')} <span className="text-red-500">*</span></label>
            <div className="relative">
              <FormInput type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-secondary-text">
                {showPassword ? t('employees.form.hide') : t('employees.form.show')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label={t('employees.form.dob')}>
          <FormInput type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
        </FormRow>
        <div>
          <label className="block text-sm font-medium text-primary-text mb-2">{t('employees.form.gender')}</label>
          <div className="flex gap-4 mt-2">
            {[
              { val: 'Male', label: t('employees.values.male') },
              { val: 'Female', label: t('employees.values.female') },
              { val: 'Other', label: t('employees.values.other') }
            ].map(g => (
              <label key={g.val} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" value={g.val} checked={formData.gender === g.val} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} />
                <span className="text-sm">{g.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label={t('employees.form.department')}>
          <FormSelect value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}>
            <option value="">{t('employees.form.select')}</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </FormSelect>
        </FormRow>
        <FormRow label={t('employees.form.designation')}>
          <FormSelect value={formData.position_id} onChange={(e) => setFormData({ ...formData, position_id: e.target.value })} disabled={!formData.department_id}>
            <option value="">{t('employees.form.select')}</option>
            {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </FormSelect>
        </FormRow>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label={t('employees.form.joining_date')}>
          <FormInput type="date" value={formData.joining_date} onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })} />
        </FormRow>
        <FormRow label={t('employees.form.language')}>
          <FormSelect value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })}>
            <option value="en">{t('auto.auto_78463a38') || 'English'}</option>
            <option value="de">{t('common.german')}</option>
            <option value="fr">Français</option>
            <option value="it">{t('common.italian')}</option>
            <option value="es">Español</option>
          </FormSelect>
        </FormRow>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label={t('employees.form.country')}>
          <FormInput value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
        </FormRow>
        <FormRow label={t('employees.form.mobile')}>
          <FormInput type="tel" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
        </FormRow>
      </div>

      <FormRow label={t('employees.form.address')}>
        <FormTextarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
      </FormRow>
      <FormRow label={t('employees.form.about')}>
        <FormTextarea value={formData.about} onChange={(e) => setFormData({ ...formData, about: e.target.value })} />
      </FormRow>

      <h3 className="text-lg font-semibold text-primary-text border-b pb-2 pt-4">{t('employees.form.other_details')}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label={t('employees.form.login_allowed')}>
          <FormSelect value={formData.login_allowed} onChange={(e) => setFormData({ ...formData, login_allowed: e.target.value })}>
            <option value="Active">{t('employees.values.yes')}</option>
            <option value="Inactive">{t('employees.values.no')}</option>
          </FormSelect>
        </FormRow>
        <div className="flex items-center gap-2 mt-8">
          <input type="checkbox" id="email_notif" checked={formData.email_notifications === 1} onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked ? 1 : 0 })} className="w-4 h-4" />
          <label htmlFor="email_notif" className="text-sm font-medium">{t('employees.form.email_notifications')}</label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label={t('employees.form.salary')}>
          <FormInput type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} />
        </FormRow>
        <FormRow label={t('employees.form.hourly_rate')}>
          <FormInput type="number" value={formData.hourly_rate} onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })} />
        </FormRow>
      </div>
      <FormRow label={t('employees.form.slack_id')}>
        <FormInput value={formData.slack_member_id} onChange={(e) => setFormData({ ...formData, slack_member_id: e.target.value })} />
      </FormRow>

      <FormRow label={t('employees.form.skills')}>
        <FormInput value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} placeholder="e.g. React, Node.js, Design" />
      </FormRow>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FormRow label={t('employees.form.probation_end')} className="flex-col !items-stretch">
          <FormInput type="date" value={formData.probation_end_date} onChange={(e) => setFormData({ ...formData, probation_end_date: e.target.value })} />
        </FormRow>
        <FormRow label={t('employees.form.notice_start')} className="flex-col !items-stretch">
          <FormInput type="date" value={formData.notice_period_start_date} onChange={(e) => setFormData({ ...formData, notice_period_start_date: e.target.value })} />
        </FormRow>
        <FormRow label={t('employees.form.notice_end')} className="flex-col !items-stretch">
          <FormInput type="date" value={formData.notice_period_end_date} onChange={(e) => setFormData({ ...formData, notice_period_end_date: e.target.value })} />
        </FormRow>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormRow label={t('employees.form.employment_type')}>
          <FormSelect value={formData.employment_type} onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}>
            {[
              { val: 'Full Time', label: t('employees.values.full_time') },
              { val: 'Part Time', label: t('employees.values.part_time') },
              { val: 'Contract', label: t('employees.values.contract') },
              { val: 'Internship', label: t('employees.values.internship') },
              { val: 'Trainee', label: t('employees.values.trainee') }
            ].map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
          </FormSelect>
        </FormRow>
        <FormRow label={t('employees.form.marital_status')}>
          <FormSelect value={formData.marital_status} onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}>
            {[
              { val: 'Single', label: t('employees.values.single') },
              { val: 'Married', label: t('employees.values.married') },
              { val: 'Widowed', label: t('employees.values.widowed') },
              { val: 'Divorced', label: t('employees.values.divorced') },
              { val: 'Separated', label: t('employees.values.separated') }
            ].map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
          </FormSelect>
        </FormRow>
      </div>

      <FormRow label={t('employees.form.business_address')}>
        <FormTextarea value={formData.business_address} onChange={(e) => setFormData({ ...formData, business_address: e.target.value })} />
      </FormRow>

      <div className="flex gap-3 justify-end pt-4">
        <Button variant="outline" size="sm" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false) }}>{t('common.cancel')}</Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>{saving ? `${t('common.save')}...` : t('common.save')}</Button>
      </div>
    </div >
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">{t('employees.title')}</h1>
          <p className="text-secondary-text mt-1">{t('employees.subtitle')}</p>
        </div>
        <AddButton onClick={handleAdd} label={t('employees.add_employee')} />
      </div>

      <DataTable
        columns={columns}
        data={employees}
        actions={actions}
        searchPlaceholder={t('common.search')}
        filters={true}
        loading={loading}
      />

      <RightSideModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false) }}
        title={isAddModalOpen ? t('employees.add_employee') : t('employees.edit_employee')}
        className="w-full max-w-5xl"
      >
        {renderModalContent()}
      </RightSideModal>
    </div>
  )
}

export default Employees
