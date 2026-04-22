import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { FaArrowLeft } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext.jsx'

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'EMPLOYEE',
  })
  const [error, setError] = useState('')
  const { signup } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    if (formData.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    try {
      const result = signup(
        formData.email,
        formData.password,
        formData.name,
        formData.role
      )
      if (result.success) {
        const role = result.user.role
        if (role === 'ADMIN') {
          navigate('/app/admin/dashboard')
        } else if (role === 'EMPLOYEE') {
          navigate('/app/employee/dashboard')
        }
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto relative">
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 flex items-center text-primary-accent hover:text-primary-accent/80 transition-colors"
      >
        <FaArrowLeft className="mr-2" />
      </button>

      <div className="text-center mb-8 pt-8">
        <h1 className="text-3xl font-bold text-primary-text mb-2">Konto erstellen</h1>
        <p className="text-secondary-text">Registrieren Sie sich, um loszulegen</p>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
        {/* Decoy fields to suppress browser password manager popups */}
        <input type="text" name="username" autoComplete="username" tabIndex={-1} aria-hidden="true" className="hidden" />
        <input type="password" name="password" autoComplete="new-password" tabIndex={-1} aria-hidden="true" className="hidden" />

        {error && (
          <div className="bg-danger bg-opacity-10 border border-danger rounded-lg p-3 text-sm text-danger">
            {error}
          </div>
        )}

        <Input
          label="Vollständiger Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Max Mustermann"
          required
        />

        <Input
          label="E-Mail"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="ihre.email@beispiel.de"
          required
          autoComplete="off"
        />

        <Input
          label="Passwort"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Mindestens 6 Zeichen"
          required
          autoComplete="new-password"
        />

        <Input
          label="Passwort bestätigen"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Passwort bestätigen"
          required
          autoComplete="new-password"
        />

        <div>
          <label className="block text-sm font-medium text-primary-text mb-2">
            Rolle
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent focus:outline-none transition-colors"
          >
            <option value="EMPLOYEE">Mitarbeiter</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <Button type="submit" variant="primary" className="w-full">
          Registrieren
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-secondary-text text-sm">
          Bereits ein Konto?{' '}
          <Link to="/login" className="text-primary-accent hover:underline font-semibold">
            Anmelden
          </Link>
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <Link
          to="/forgot-password"
          className="block text-center text-sm text-primary-accent hover:underline"
        >
          Passwort vergessen?
        </Link>
      </div>
    </Card>
  )
}

export default SignupPage
