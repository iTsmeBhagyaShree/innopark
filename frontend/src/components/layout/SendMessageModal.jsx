import { useState } from 'react'
import { IoClose, IoCloudUpload, IoMic } from 'react-icons/io5'
import Button from '../ui/Button'
import Input from '../ui/Input'

const SendMessageModal = ({ isOpen, onClose, recipient = null }) => {
  const [formData, setFormData] = useState({
    to: recipient?.name || '',
    subject: '',
    message: '',
    file: null,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle send message logic
    console.log('Sending message:', formData)
    onClose()
    setFormData({ to: '', subject: '', message: '', file: null })
  }

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Nachricht senden</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <IoClose size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* To Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">An</label>
              <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-primary-accent flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {recipient?.avatar || (recipient?.name ? recipient.name.split(' ').map(n => n[0]).join('') : 'U')}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {recipient?.name || 'Empfänger auswählen'}
                </span>
              </div>
            </div>

            {/* Subject */}
            <Input
              label="Betreff"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Betreff eingeben"
              required
            />

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nachricht</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none"
                placeholder="Geben Sie hier Ihre Nachricht ein..."
                required
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Anhang</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <IoCloudUpload size={20} className="text-gray-600" />
                  <span className="text-sm text-gray-700">Datei hochladen</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {formData.file && (
                  <span className="text-sm text-gray-600">{formData.file.name}</span>
                )}
                <button
                  type="button"
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Audio aufnehmen"
                >
                  <IoMic size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Senden
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SendMessageModal

