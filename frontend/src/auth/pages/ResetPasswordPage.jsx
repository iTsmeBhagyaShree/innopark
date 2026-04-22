import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
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
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // Handle password reset
    setSuccess(true)
    setTimeout(() => {
      navigate('/login')
    }, 2000)
  }

  if (success) {
    return (
      <Card>
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary-accent bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary-text mb-2">
              Password Reset Successful
            </h1>
            <p className="text-secondary-text">
              Your password has been reset. Redirecting to login...
            </p>
          </div>
          <Link to="/login">
            <Button variant="primary">Go to Login</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary-text mb-2">
          Reset Password
        </h1>
        <p className="text-secondary-text">
          Enter your new password below.
        </p>
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
          label="New Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="At least 6 characters"
          required
          autoComplete="new-password"
        />

        <Input
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          required
          autoComplete="new-password"
        />

        <Button type="submit" variant="primary" className="w-full">
          Reset Password
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm text-primary-accent hover:underline"
        >
          Back to Login
        </Link>
      </div>
    </Card>
  )
}

export default ResetPasswordPage

