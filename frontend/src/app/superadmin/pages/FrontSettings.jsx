import { useState } from 'react'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { IoGlobe } from 'react-icons/io5'

const FrontSettings = () => {
  const [formData, setFormData] = useState({
    site_name: 'Developo',
    site_description: 'Complete CRM Solution',
    site_logo: '',
    site_favicon: '',
    contact_email: 'support@developo.com',
    contact_phone: '+1-234-567-8900',
    address: '',
    social_facebook: '',
    social_twitter: '',
    social_linkedin: '',
    maintenance_mode: false,
  })

  const handleSave = () => {
    alert('Frontend-Einstellungen erfolgreich gespeichert!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-text">Frontend-Einstellungen</h1>
          <p className="text-secondary-text mt-1">Frontend-Webseite konfigurieren</p>
        </div>
      </div>

      {/* General Settings */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-primary-text mb-4 flex items-center gap-2">
          <IoGlobe size={20} />
          Allgemeine Einstellungen
        </h2>
        <div className="space-y-4">
          <Input
            label="Seitenname"
            value={formData.site_name}
            onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
            placeholder="Developo"
          />

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Seitenbeschreibung
            </label>
            <textarea
              value={formData.site_description}
              onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
              placeholder="Seitenbeschreibung eingeben"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            />
          </div>

          <Input
            label="Seiten-Logo URL"
            value={formData.site_logo}
            onChange={(e) => setFormData({ ...formData, site_logo: e.target.value })}
            placeholder="https://beispiel.de/logo.png"
          />

          <Input
            label="Favicon URL"
            value={formData.site_favicon}
            onChange={(e) => setFormData({ ...formData, site_favicon: e.target.value })}
            placeholder="https://beispiel.de/favicon.ico"
          />
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-primary-text mb-4">Kontaktinformationen</h2>
        <div className="space-y-4">
          <Input
            label="Kontakt-E-Mail"
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            placeholder="support@developo.com"
          />

          <Input
            label="Kontakttelefon"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            placeholder="+49-123-456-7890"
          />

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Adresse
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Firmenadresse eingeben"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Social Media */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-primary-text mb-4">Soziale Medien</h2>
        <div className="space-y-4">
          <Input
            label="Facebook URL"
            value={formData.social_facebook}
            onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
            placeholder="https://facebook.com/developo"
          />

          <Input
            label="Twitter URL"
            value={formData.social_twitter}
            onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
            placeholder="https://twitter.com/developo"
          />

          <Input
            label="LinkedIn URL"
            value={formData.social_linkedin}
            onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })}
            placeholder="https://linkedin.com/company/developo"
          />
        </div>
      </Card>

      {/* Maintenance Mode */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-primary-text mb-4">Systemeinstellungen</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-primary-text">Wartungsmodus</p>
            <p className="text-sm text-secondary-text">Aktivieren, um die Seite in den Wartungsmodus zu versetzen</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.maintenance_mode}
              onChange={(e) => setFormData({ ...formData, maintenance_mode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-accent"></div>
          </label>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="px-8">
          Einstellungen speichern
        </Button>
      </div>
    </div>
  )
}

export default FrontSettings
