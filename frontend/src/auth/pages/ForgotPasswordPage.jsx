import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { useLanguage } from '../../context/LanguageContext.jsx'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { t } = useLanguage()

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
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
              E-Mail prüfen
            </h1>
            <p className="text-secondary-text">
              Wir haben einen Link zum Zurücksetzen des Passworts an <strong>{email}</strong> gesendet
            </p>
          </div>
          <Link to="/login">
            <Button variant="primary">Zurück zur Anmeldung</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary-text mb-2">
          Passwort vergessen
        </h1>
        <p className="text-secondary-text">
          Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
        </p>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
        <Input
          label="E-Mail"
          type="email"
          name="forgot_email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ihre.email@beispiel.de"
          required
          autoComplete="off"
        />

        <Button type="submit" variant="primary" className="w-full">
          Link zum Zurücksetzen senden
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm text-primary-accent hover:underline"
        >
          Zurück zur Anmeldung
        </Link>
      </div>
    </Card>
  )
}

export default ForgotPasswordPage
