import { useState } from 'react'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import RightSideModal from '../../../components/ui/RightSideModal'
import AddButton from '../../../components/ui/AddButton'
import { IoHelpCircle, IoAdd, IoCreate, IoTrash } from 'react-icons/io5'

const AdminFAQ = () => {
  const [faqs, setFaqs] = useState([
    {
      id: 1,
      question: 'Wie erstelle ich ein neues Unternehmen?',
      answer: 'Gehen Sie zur Unternehmensseite und klicken Sie auf „Unternehmen hinzufügen". Füllen Sie die erforderlichen Daten aus und speichern Sie.',
      category: 'Unternehmen',
      status: 'Published'
    },
    {
      id: 2,
      question: 'Wie weise ich einem Unternehmen ein Paket zu?',
      answer: 'Gehen Sie zur Unternehmensseite, bearbeiten Sie das Unternehmen und wählen Sie ein Paket aus dem Dropdown-Menü.',
      category: 'Pakete',
      status: 'Published'
    }
  ])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedFAQ, setSelectedFAQ] = useState(null)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'Allgemein',
    status: 'Published'
  })

  const handleSave = () => {
    if (selectedFAQ) {
      setFaqs(faqs.map(faq => faq.id === selectedFAQ.id ? { ...formData, id: faq.id } : faq))
    } else {
      setFaqs([...faqs, { ...formData, id: Date.now() }])
    }
    setIsAddModalOpen(false)
    resetForm()
  }

  const handleEdit = (faq) => {
    setSelectedFAQ(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      status: faq.status
    })
    setIsAddModalOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese FAQ löschen möchten?')) {
      setFaqs(faqs.filter(faq => faq.id !== id))
    }
  }

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'Allgemein',
      status: 'Published'
    })
    setSelectedFAQ(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-text">Admin-FAQ</h1>
          <p className="text-secondary-text mt-1">Häufig gestellte Fragen für Administratoren verwalten</p>
        </div>
        <AddButton onClick={() => { resetForm(); setIsAddModalOpen(true) }} />
      </div>

      {/* FAQs List */}
      <div className="space-y-4">
        {faqs.map((faq) => (
          <Card key={faq.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <IoHelpCircle size={24} className="text-primary-accent" />
                  <h3 className="text-lg font-semibold text-primary-text">{faq.question}</h3>
                </div>
                <p className="text-secondary-text mb-3">{faq.answer}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{faq.category}</Badge>
                  <Badge variant={faq.status === 'Published' ? 'success' : 'warning'}>
                    {faq.status === 'Published' ? 'Veröffentlicht' : 'Entwurf'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleEdit(faq)}
                  className="p-2 text-primary-accent hover:bg-primary-accent hover:text-white rounded-lg transition-colors"
                >
                  <IoCreate size={18} />
                </button>
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                >
                  <IoTrash size={18} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <RightSideModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          resetForm()
        }}
        title={selectedFAQ ? 'FAQ bearbeiten' : 'FAQ hinzufügen'}
      >
        <div className="space-y-4">
          <Input
            label="Frage"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            placeholder="Frage eingeben"
            required
          />

          <div>
            <label className="block text-sm font-medium text-primary-text mb-2">
              Antwort
            </label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Antwort eingeben"
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Kategorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              >
                <option value="Allgemein">Allgemein</option>
                <option value="Unternehmen">Unternehmen</option>
                <option value="Pakete">Pakete</option>
                <option value="Abrechnung">Abrechnung</option>
                <option value="Benutzer">Benutzer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              >
                <option value="Published">Veröffentlicht</option>
                <option value="Draft">Entwurf</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                resetForm()
              }}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button onClick={handleSave} className="flex-1">
              FAQ {selectedFAQ ? 'aktualisieren' : 'erstellen'}
            </Button>
          </div>
        </div>
      </RightSideModal>
    </div>
  )
}

export default AdminFAQ
