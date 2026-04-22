import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import RightSideModal from '../../../components/ui/RightSideModal'
import { employeesAPI, documentsAPI } from '../../../api'
import { IoCreate, IoDocumentText, IoDownload, IoTrash } from 'react-icons/io5'

const MyProfile = () => {
  const { user } = useAuth()
  const userId = user?.id || localStorage.getItem('userId')
  const companyId = user?.company_id || localStorage.getItem('companyId')

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    position: '',
    employee_number: '',
    joining_date: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_branch: '',
  })
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (userId && companyId) {
      fetchProfile()
      fetchDocuments()
    }
  }, [userId, companyId])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await employeesAPI.getProfile({
        user_id: userId,
        company_id: companyId
      })
      if (response.data.success) {
        const profile = response.data.data
        setProfileData(profile)
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          department: profile.department_name || '',
          position: profile.position_name || '',
          employee_number: profile.employee_number || '',
          joining_date: profile.joining_date || '',
          emergency_contact_name: profile.emergency_contact_name || '',
          emergency_contact_phone: profile.emergency_contact_phone || '',
          emergency_contact_relation: profile.emergency_contact_relation || '',
          bank_name: profile.bank_name || '',
          bank_account_number: profile.bank_account_number || '',
          bank_ifsc: profile.bank_ifsc || '',
          bank_branch: profile.bank_branch || '',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      alert(t('profile.fallback_error') || 'Error loading profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await documentsAPI.getAll({
        company_id: companyId,
        user_id: userId
      })
      if (response.data.success) {
        setDocuments(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      alert('Name und E-Mail sind erforderlich')
      return
    }

    try {
      setSaving(true)
      const updateData = {
        user_id: userId,
        company_id: companyId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        emergency_contact_relation: formData.emergency_contact_relation || null,
        bank_name: formData.bank_name || null,
        bank_account_number: formData.bank_account_number || null,
        bank_ifsc: formData.bank_ifsc || null,
        bank_branch: formData.bank_branch || null,
      }

      const response = await employeesAPI.updateProfile(updateData, {
        user_id: userId,
        company_id: companyId
      })
      if (response.data.success) {
        alert('Profil erfolgreich aktualisiert!')
        await fetchProfile()
        setIsEditModalOpen(false)
      } else {
        alert(response.data.error || 'Fehler beim Aktualisieren des Profils')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(error.response?.data?.error || 'Fehler beim Aktualisieren des Profils')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadDocument = async (doc) => {
    try {
      const response = await documentsAPI.download(doc.id, {
        company_id: companyId,
        user_id: userId
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', doc.file_name || doc.title)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Fehler beim Herunterladen des Dokuments')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Mein Profil</h1>
          <p className="text-secondary-text mt-1">Verwalten Sie Ihre Profilinformationen</p>
        </div>
        <Card>
          <div className="text-center py-8">
            <p className="text-secondary-text">Profil wird geladen...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Mein Profil</h1>
          <p className="text-secondary-text mt-1">Verwalten Sie Ihre Profilinformationen</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2"
        >
          <IoCreate size={18} />
          Profil bearbeiten
        </Button>
      </div>

      {/* Personal Information */}
      <Card>
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-primary-text mb-4">Persönliche Informationen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary-text">Vollständiger Name</label>
              <p className="text-primary-text mt-1">{formData.name || '--'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">E-Mail</label>
              <p className="text-primary-text mt-1">{formData.email || '--'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Telefon</label>
              <p className="text-primary-text mt-1">{formData.phone || '--'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Mitarbeiter-ID</label>
              <p className="text-primary-text mt-1">{formData.employee_number || '--'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Abteilung</label>
              <p className="text-primary-text mt-1">{formData.department || '--'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Bezeichnung</label>
              <p className="text-primary-text mt-1">{formData.position || '--'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Eintrittsdatum</label>
              <p className="text-primary-text mt-1">
                {formData.joining_date
                  ? new Date(formData.joining_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '--'
                }
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-secondary-text">Adresse</label>
              <p className="text-primary-text mt-1">{formData.address || '--'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-primary-text mb-4">Notfallkontakt</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary-text">Kontaktname</label>
              <p className="text-primary-text mt-1">{formData.emergency_contact_name || '--'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Kontakttelefon</label>
              <p className="text-primary-text mt-1">{formData.emergency_contact_phone || '--'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Beziehung</label>
              <p className="text-primary-text mt-1">{formData.emergency_contact_relation || '--'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Bank Details */}
      <Card>
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-primary-text mb-4">Bankdaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary-text">Bankname</label>
              <p className="text-primary-text mt-1">{formData.bank_name || '--'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Kontonummer</label>
              <p className="text-primary-text mt-1">{formData.bank_account_number || '--'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">IFSC-Code</label>
              <p className="text-primary-text mt-1">{formData.bank_ifsc || '--'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">Filiale</label>
              <p className="text-primary-text mt-1">{formData.bank_branch || '--'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Documents */}
      <Card>
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-primary-text mb-4">Dokumente</h2>
          {documents.length === 0 ? (
            <p className="text-secondary-text">Keine Dokumente verfügbar</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <IoDocumentText size={24} className="text-primary-accent" />
                    <div>
                      <p className="text-primary-text font-medium">{doc.title || doc.file_name}</p>
                      <p className="text-sm text-secondary-text">{doc.size || '--'} • {doc.date || '--'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
                    title="Herunterladen"
                  >
                    <IoDownload size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      <RightSideModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Profil bearbeiten"
        width="max-w-5xl"
      >
        <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-primary-text mb-4">Persönliche Informationen</h3>
            <div className="space-y-4">
              <Input
                label="Vollständiger Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
              <Input
                label="E-Mail"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
              <Input
                label="Telefon"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+49 123 456 7890"
              />
              <div>
                <label className="block text-sm font-medium text-primary-text mb-2">Adresse</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
                  placeholder="Geben Sie Ihre Adresse ein"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-semibold text-primary-text mb-4">Notfallkontakt</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Kontaktname"
                value={formData.emergency_contact_name}
                onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                placeholder="Name"
              />
              <Input
                label="Kontakttelefon"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                placeholder="Telefon"
              />
              <Input
                label="Beziehung"
                value={formData.emergency_contact_relation}
                onChange={(e) => handleChange('emergency_contact_relation', e.target.value)}
                placeholder="Bruder, Mutter, usw."
              />
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Bank Details */}
          <div>
            <h3 className="text-lg font-semibold text-primary-text mb-4">Bankdaten</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Bankname"
                value={formData.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                placeholder="Bank"
              />
              <Input
                label="Kontonummer"
                value={formData.bank_account_number}
                onChange={(e) => handleChange('bank_account_number', e.target.value)}
                placeholder="Konto"
              />
              <Input
                label="IFSC-Code"
                value={formData.bank_ifsc}
                onChange={(e) => handleChange('bank_ifsc', e.target.value)}
                placeholder="IFSC"
              />
              <Input
                label="Filiale"
                value={formData.bank_branch}
                onChange={(e) => handleChange('bank_branch', e.target.value)}
                placeholder="Filiale"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
            </Button>
          </div>
        </div>
      </RightSideModal>
    </div>
  )
}

export default MyProfile
