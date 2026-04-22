import { useState, useEffect } from 'react'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import RightSideModal from '../../../components/ui/RightSideModal'
import { authAPI } from '../../../api'

const Settings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    language: 'English',
    timezone: 'UTC',
  })
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    timezone: 'Europe/Berlin',
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getCurrentUser()
      if (response.data.success) {
        const user = response.data.data
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          timezone: user.timezone || 'Europe/Berlin',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value })
  }

  const handleProfileChange = (field, value) => {
    setProfileData({ ...profileData, [field]: value })
  }

  const handlePasswordChange = (field, value) => {
    setPasswordData({ ...passwordData, [field]: value })
  }

  const handleSaveSettings = () => {
    alert('Einstellungen erfolgreich gespeichert!')
  }

  const handleUpdateProfile = async () => {
    try {
      setLoading(true)
      const response = await authAPI.updateProfile(profileData)
      if (response.data.success) {
        alert('Profil erfolgreich aktualisiert!')
        setIsProfileModalOpen(false)
        await fetchProfile()
      } else {
        alert(response.data.error || 'Fehler beim Aktualisieren des Profils')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(error.response?.data?.error || 'Fehler beim Aktualisieren des Profils')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('Neues Passwort und Bestätigung stimmen nicht überein')
      return
    }

    if (passwordData.new_password.length < 6) {
      alert('Das Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    try {
      setLoading(true)
      const response = await authAPI.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      })
      if (response.data.success) {
        alert('Passwort erfolgreich geändert!')
        setIsPasswordModalOpen(false)
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        })
      } else {
        alert(response.data.error || 'Fehler beim Ändern des Passworts')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert(error.response?.data?.error || 'Fehler beim Ändern des Passworts')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-text">Einstellungen</h1>
        <p className="text-secondary-text mt-1">Verwalten Sie Ihre persönlichen Einstellungen</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-primary-text">Profileinstellungen</h2>
          <Button variant="primary" size="sm" onClick={() => setIsProfileModalOpen(true)}>
            Profil bearbeiten
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-secondary-text">Name</label>
            <p className="text-primary-text mt-1">{profileData.name || '--'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-secondary-text">E-Mail</label>
            <p className="text-primary-text mt-1">{profileData.email || '--'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-secondary-text">Telefon</label>
            <p className="text-primary-text mt-1">{profileData.phone || '--'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-secondary-text">Adresse</label>
            <p className="text-primary-text mt-1">{profileData.address || '--'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-secondary-text">Zeitzone</label>
            <p className="text-primary-text mt-1">{profileData.timezone || 'Europe/Berlin'}</p>
          </div>
        </div>
      </Card>

      {/* Password Change */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-primary-text">Passwort ändern</h2>
          <Button variant="primary" size="sm" onClick={() => setIsPasswordModalOpen(true)}>
            Passwort ändern
          </Button>
        </div>
        <p className="text-secondary-text text-sm">Aktualisieren Sie Ihr Passwort, um Ihr Konto sicher zu halten</p>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-primary-text mb-4">Benachrichtigungseinstellungen</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-primary-text">E-Mail-Benachrichtigungen</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => handleChange('smsNotifications', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-primary-text">SMS-Benachrichtigungen</span>
            </label>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-primary-text mb-4">Allgemeine Einstellungen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Sprache
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  <option value="English">Englisch</option>
                  <option value="German">Deutsch</option>
                  <option value="French">Französisch</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">
                  Zeitzone
                </label>
                <select
                  value={profileData.timezone}
                  onChange={(e) => handleProfileChange('timezone', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                >
                  <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="primary" onClick={handleSaveSettings}>
              Einstellungen speichern
            </Button>
          </div>
        </div>
      </Card>

      {/* Profile Edit Modal */}
      <RightSideModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Profil bearbeiten"
        width="max-w-md"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={profileData.name}
            onChange={(e) => handleProfileChange('name', e.target.value)}
          />
          <Input
            label="E-Mail"
            type="email"
            value={profileData.email}
            onChange={(e) => handleProfileChange('email', e.target.value)}
          />
          <Input
            label="Telefon"
            value={profileData.phone}
            onChange={(e) => handleProfileChange('phone', e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Adresse</label>
            <textarea
              value={profileData.address}
              onChange={(e) => handleProfileChange('address', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">Zeitzone</label>
            <select
              value={profileData.timezone}
              onChange={(e) => handleProfileChange('timezone', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="Europe/Berlin">Europe/Berlin (CET)</option>
              <option value="Europe/Paris">Europe/Paris (CET)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsProfileModalOpen(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateProfile}
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Wird aktualisiert...' : 'Profil aktualisieren'}
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* Password Change Modal */}
      <RightSideModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false)
          setPasswordData({
            current_password: '',
            new_password: '',
            confirm_password: '',
          })
        }}
        title="Passwort ändern"
        width="max-w-md"
      >
        <div className="space-y-4">
          <Input
            label="Aktuelles Passwort"
            type="password"
            value={passwordData.current_password}
            onChange={(e) => handlePasswordChange('current_password', e.target.value)}
          />
          <Input
            label="Neues Passwort"
            type="password"
            value={passwordData.new_password}
            onChange={(e) => handlePasswordChange('new_password', e.target.value)}
          />
          <Input
            label="Neues Passwort bestätigen"
            type="password"
            value={passwordData.confirm_password}
            onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
          />
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordModalOpen(false)
                setPasswordData({
                  current_password: '',
                  new_password: '',
                  confirm_password: '',
                })
              }}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={handleChangePassword}
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Wird geändert...' : 'Passwort ändern'}
            </Button>
          </div>
        </div>
      </RightSideModal>
    </div>
  )
}

export default Settings
