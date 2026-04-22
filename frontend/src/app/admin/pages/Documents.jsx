import { useState, useEffect, useCallback } from 'react'
import { documentsAPI, employeesAPI } from '../../../api'
import AddButton from '../../../components/ui/AddButton'
import Card from '../../../components/ui/Card'
import RightSideModal from '../../../components/ui/RightSideModal'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { IoDocumentText, IoTrash, IoDownload, IoPerson, IoBusiness, IoFilter } from 'react-icons/io5'

const Documents = () => {
  const companyId = localStorage.getItem('companyId') || 1
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [documents, setDocuments] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [selectedEmployee, setSelectedEmployee] = useState('')
  
  const [formData, setFormData] = useState({
    document_for: 'employee',
    employee_id: '',
    title: '',
    category: '',
    description: '',
    file: null,
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [selectedEmployee])



  const fetchEmployees = async () => {
    try {
      const response = await employeesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setEmployees(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = { company_id: companyId }
      
      // Apply filters
      if (selectedEmployee) {
        params.user_id = selectedEmployee
      }
      
      console.log('Fetching documents with params:', params)
      const response = await documentsAPI.getAll(params)
      console.log('Documents API response:', response.data)
      
      if (response.data && response.data.success) {
        let fetchedDocs = response.data.data || []
        
        // Additional client-side filtering if needed
        if (selectedEmployee) {
          fetchedDocs = fetchedDocs.filter(doc => doc.user_id)
        }
        
        const transformedDocs = fetchedDocs.map(doc => {
          // Find client or employee name
          let uploadedByName = 'Unknown'
          let uploadedByType = ''
          
          if (doc.user_id) {
            const employee = employees.find(e => e.id === doc.user_id)
            uploadedByName = employee?.name || employee?.email || `Employee #${doc.user_id}`
            uploadedByType = 'Employee'
          }
          
          return {
            id: doc.id,
            name: doc.title || doc.file_name || 'Untitled',
            type: 'file',
            size: doc.size || '-',
            date: doc.date || doc.created_at || '--',
            category: doc.category || '--',
            file_path: doc.file_path,
            file_name: doc.file_name,
            client_id: doc.client_id,
            user_id: doc.user_id,
            uploadedBy: uploadedByName,
            uploadedByType: uploadedByType,
          }
        })
        
        setDocuments(transformedDocs)
      } else {
        setDocuments([])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [selectedEmployee, companyId, employees])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, file })
    }
  }

  const handleUpload = async () => {

    if (formData.document_for === 'employee' && !formData.employee_id) {
      alert('Bitte wählen Sie einen Mitarbeiter aus')
      return
    }
    if (!formData.title) {
      alert('Dokumentname ist erforderlich')
      return
    }
    if (!formData.file) {
      alert('Datei ist erforderlich')
      return
    }

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('company_id', companyId)
      uploadFormData.append('title', formData.title)
      uploadFormData.append('category', formData.category || '')
      uploadFormData.append('description', formData.description || '')
      uploadFormData.append('file', formData.file)
      
      // Add client_id or user_id based on selection
      uploadFormData.append('user_id', formData.employee_id)

      const response = await documentsAPI.create(uploadFormData)
      if (response.data.success) {
        alert('Dokument erfolgreich hochgeladen!')
        await fetchDocuments()
        setIsUploadModalOpen(false)
        setFormData({
          document_for: 'employee',
          employee_id: '',
          title: '',
          category: '',
          description: '',
          file: null,
        })
      } else {
        alert(response.data.error || 'Dokument konnte nicht hochgeladen werden')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      alert(error.response?.data?.error || 'Dokument konnte nicht hochgeladen werden')
    }
  }

  const handleDelete = async (doc) => {
    if (window.confirm(`Delete document "${doc.name}"?`)) {
      try {
        const response = await documentsAPI.delete(doc.id, { company_id: companyId })
        if (response.data.success) {
          alert('Dokument erfolgreich gelöscht!')
          await fetchDocuments()
        } else {
          alert(response.data.error || 'Dokument konnte nicht gelöscht werden')
        }
      } catch (error) {
        console.error('Error deleting document:', error)
        alert(error.response?.data?.error || 'Dokument konnte nicht gelöscht werden')
      }
    }
  }

  const handleDownload = async (doc) => {
    try {
      // Check if file has a direct URL
      const fileUrl = doc.file_path
      if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
        window.open(fileUrl, '_blank')
        return
      }
      
      const response = await documentsAPI.download(doc.id, { company_id: companyId })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', doc.file_name || doc.name)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
      // Try opening file_path directly as fallback
      if (doc.file_path) {
        window.open(doc.file_path, '_blank')
      } else {
        alert('Dokument konnte nicht heruntergeladen werden')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">Dokumente</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">Mitarbeiter-Dokumente verwalten</p>
        </div>
        <AddButton onClick={() => setIsUploadModalOpen(true)} label="Dokument hochladen" />
      </div>

      {/* Filter Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <IoFilter size={20} className="text-primary-accent" />
          <span className="font-medium text-primary-text">Dokumente filtern</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filter Type */}


          {/* Client Filter */}


          {/* Employee Filter */}
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Mitarbeiter auswählen
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
            >
              <option value="">Alle Mitarbeiter</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name || emp.email || `Employee #${emp.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Documents Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary-text">Dokumente werden geladen...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-secondary-text">
                Keine Dokumente gefunden. Laden Sie Ihr erstes Dokument hoch!
              </p>
            </div>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <IoDocumentText size={32} className="text-primary-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary-text truncate">{doc.name}</h3>
                    <p className="text-sm text-secondary-text mt-1">
                      {doc.size} • {typeof doc.date === 'string' ? doc.date.split('T')[0] : doc.date}
                    </p>
                    {doc.category && doc.category !== '--' && (
                      <p className="text-xs text-secondary-text mt-1">Kategorie: {doc.category}</p>
                    )}
                    {/* Uploaded By Info */}
                    {doc.uploadedByType && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                          <IoPerson size={12} />
                          Mitarbeiter
                        </span>
                        <span className="text-xs text-secondary-text truncate">{doc.uploadedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 rounded transition-colors"
                    title="Herunterladen"
                  >
                    <IoDownload size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded transition-colors ml-auto"
                    title="Löschen"
                  >
                    <IoTrash size={18} />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Upload Document Modal */}
      <RightSideModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false)
          setFormData({
            employee_id: '',
            title: '',
            category: '',
            description: '',
            file: null,
          })
        }}
        title="Dokument hochladen"
        width="max-w-xl"
      >
        <div className="space-y-4">
          {/* Document For Selection */}


          {/* Client Selection */}


          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Mitarbeiter auswählen <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              required
            >
              <option value="">-- Mitarbeiter auswählen --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name || emp.email || `Employee #${emp.id}`}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Dokumentname"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Dokumentname eingeben"
            required
          />
          
          <Input
            label="Kategorie (Optional)"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="z.B. Verträge, Angebote, Ausweise"
          />
          
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Beschreibung (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              placeholder="Dokumentbeschreibung eingeben"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Datei hochladen <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none"
              required
            />
            {formData.file && (
              <p className="text-sm text-secondary-text mt-2">
                Ausgewählt: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          
          <div className="flex gap-3 pt-4 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadModalOpen(false)
                setFormData({
                  employee_id: '',
                  title: '',
                  category: '',
                  description: '',
                  file: null,
                })
              }}
              className="px-4"
            >
              Abbrechen
            </Button>
            <Button variant="primary" onClick={handleUpload} className="px-4">
              Hochladen
            </Button>
          </div>
        </div>
      </RightSideModal>
    </div>
  )
}

export default Documents
