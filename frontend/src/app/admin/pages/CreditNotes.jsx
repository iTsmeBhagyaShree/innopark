import { useState, useEffect, useCallback } from 'react'
import AddButton from '../../../components/ui/AddButton'
import DataTable from '../../../components/ui/DataTable'
import RightSideModal from '../../../components/ui/RightSideModal'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { creditNotesAPI, invoicesAPI, companiesAPI } from '../../../api'
import { IoAdd, IoEye, IoDownload, IoCreate, IoTrash } from 'react-icons/io5'
import { useLanguage } from '../../../context/LanguageContext.jsx'

const CreditNotes = () => {
  const { t } = useLanguage()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedCreditNote, setSelectedCreditNote] = useState(null)
  const [creditNotes, setCreditNotes] = useState([])
  const [invoices, setInvoices] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  // Get company_id from localStorage
  const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)
  
  const [formData, setFormData] = useState({

    invoice_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'Pending',
  })

  useEffect(() => {
    fetchCreditNotes()
    fetchCompanies()
    fetchInvoices()
  }, [])

  const fetchCreditNotes = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          if (userData.company_id) {
            params.company_id = userData.company_id
          }
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }

      const response = await creditNotesAPI.getAll(params)
      if (response.data.success) {
        const transformedCreditNotes = (response.data.data || []).map(cn => ({
          id: cn.id,
          creditNoteNo: cn.credit_note_number || `CN-${cn.id}`,
          invoice: cn.invoice_number || 'N/A',
          invoice_id: cn.invoice_id,
          amount: parseFloat(cn.amount || 0),
          date: cn.date ? new Date(cn.date).toLocaleDateString() : 'N/A',
          status: cn.status || 'Pending',
          reason: cn.reason || '',
          ...cn
        }))
        setCreditNotes(transformedCreditNotes)
      }
    } catch (error) {
      console.error('Error fetching credit notes:', error)
      alert(error.response?.data?.error || 'Failed to fetch credit notes')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getAll()
      if (response.data.success) {
        setCompanies(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchInvoices = async () => {
    try {
      // Fetch ALL invoices - Admin can create credit notes for any invoice
      const response = await invoicesAPI.getAll({})
      if (response.data.success) {
        setInvoices(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }



  const handleAdd = async () => {
    try {
      // Removed required validations - allow empty data
      const creditNoteData = {
        company_id: companyId,

        invoice_id: formData.invoice_id || null,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        date: formData.date || null,
        reason: formData.reason || null,
        status: formData.status || 'Pending',
      }

      const response = await creditNotesAPI.create(creditNoteData)
      if (response.data.success) {
        alert('Credit note created successfully')
        setIsAddModalOpen(false)
        setFormData({

          invoice_id: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          reason: '',
          status: 'Pending',
        })
        fetchCreditNotes()
      }
    } catch (error) {
      console.error('Error creating credit note:', error)
      alert(error.response?.data?.error || 'Failed to create credit note')
    }
  }

  const handleEdit = async () => {
    try {
      // Removed required validations - allow empty data
      const creditNoteData = {
        company_id: companyId,

        invoice_id: formData.invoice_id ? parseInt(formData.invoice_id) : null,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        date: formData.date || null,
        reason: formData.reason || null,
        status: formData.status || 'Pending',
      }

      const response = await creditNotesAPI.update(selectedCreditNote.id, creditNoteData)
      if (response.data.success) {
        alert('Credit note updated successfully')
        setIsEditModalOpen(false)
        setSelectedCreditNote(null)
        fetchCreditNotes()
      }
    } catch (error) {
      console.error('Error updating credit note:', error)
      alert(error.response?.data?.error || 'Failed to update credit note')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this credit note?')) return

    try {
      const response = await creditNotesAPI.delete(id, { company_id: companyId })
      if (response.data.success) {
        alert('Credit note deleted successfully')
        fetchCreditNotes()
      }
    } catch (error) {
      console.error('Error deleting credit note:', error)
      alert(error.response?.data?.error || 'Failed to delete credit note')
    }
  }

  const handleView = (creditNote) => {
    setSelectedCreditNote(creditNote)
    setIsViewModalOpen(true)
  }

  const handleDownload = (creditNote) => {
    // Create a printable/downloadable version
    const printWindow = window.open('', '_blank')
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Credit Note - ${creditNote.creditNoteNo || creditNote.credit_note_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #333; }
            .details { margin-bottom: 30px; }
            .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
            .amount { font-size: 24px; font-weight: bold; color: #2563eb; text-align: center; margin: 30px 0; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>{t('auto.auto_5b0c87e0') || 'CREDIT NOTE'}</h1>
            <p>${creditNote.creditNoteNo || creditNote.credit_note_number}</p>
          </div>
          <div class="details">
            <div class="details-row">
              <span class="label">{t('auto.auto_abbbd19b') || 'Invoice:'}</span>
              <span class="value">${creditNote.invoice || creditNote.invoice_number || 'N/A'}</span>
            </div>
            <div className="details-row">
              <span className="label">{t('') || ''}</span>
              <span className="value">#${creditNote.id}</span>
            </div>
            <div class="details-row">
              <span class="label">{t('auto.auto_0d8d5800') || 'Date:'}</span>
              <span class="value">${creditNote.date || 'N/A'}</span>
            </div>
            <div class="details-row">
              <span class="label">{t('') || ''}</span>
              <span class="value">${creditNote.status || 'Pending'}</span>
            </div>
            <div class="details-row">
              <span class="label">{t('') || ''}</span>
              <span class="value">${creditNote.reason || 'N/A'}</span>
            </div>
          </div>
          <div class="amount">
            Amount: €${parseFloat(creditNote.amount || 0).toFixed(2)}
          </div>
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `
    printWindow.document.write(content)
    printWindow.document.close()
  }

  const handleEditClick = (creditNote) => {
    setSelectedCreditNote(creditNote)
    setFormData({

      invoice_id: creditNote.invoice_id || '',
      amount: creditNote.amount || '',
      date: creditNote.date ? new Date(creditNote.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      reason: creditNote.reason || '',
      status: creditNote.status || 'Pending',
    })
    setIsEditModalOpen(true)
  }

  const columns = [
    { key: 'creditNoteNo', label: 'Credit Note No' },
    { key: 'invoice', label: 'Invoice' },
    { key: 'invoice', label: 'Invoice' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `$${value.toLocaleString()}`,
    },
    { key: 'date', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusColors = {
          Applied: 'success',
          Approved: 'info',
          Pending: 'warning',
        }
        return <Badge variant={statusColors[value] || 'default'}>{value}</Badge>
      },
    },
  ]

  const actions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleView(row)
        }}
        className="p-2 text-primary-blue hover:bg-primary-blue hover:bg-opacity-10 rounded-button transition-colors"
        title={t('common.view_detail')}
      >
        <IoEye size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleEditClick(row)
        }}
        className="p-2 text-secondary-green hover:bg-secondary-green hover:bg-opacity-10 rounded-button transition-colors"
        title={t('common.edit')}
      >
        <IoCreate size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDelete(row.id)
        }}
        className="p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded-button transition-colors"
        title={t('common.delete')}
      >
        <IoTrash size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDownload(row)
        }}
        className="p-2 text-secondary-green hover:bg-secondary-green hover:bg-opacity-10 rounded-button transition-colors"
        title={t('common.download')}
      >
        <IoDownload size={18} />
      </button>
    </div>
  )

  // Show all invoices (no company filter)
  const filteredInvoices = invoices

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">{t('credit_notes.title')}</h1>
          <p className="text-sm sm:text-base text-secondary-text mt-1">{t('credit_notes.subtitle')}</p>
        </div>
        <AddButton onClick={() => setIsAddModalOpen(true)} label={t('credit_notes.add')} />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary-text">{t('credit_notes.loading')}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={creditNotes}
          searchPlaceholder={t('credit_notes.search_placeholder')}
          filters={true}
          filterConfig={[
            { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved', 'Applied'] },
            { key: 'date', label: 'Date', type: 'daterange' },
          ]}
          actions={actions}
          bulkActions={false}
        />
      )}

      {/* View Modal */}
      <RightSideModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Credit Note Details"
        width="max-w-3xl"
      >
        {selectedCreditNote && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('auto.auto_5080acb2') || 'Credit Note No'}</label>
                <p className="text-primary-text mt-1 text-base font-semibold">{selectedCreditNote.creditNoteNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                <div className="mt-1">
                  <Badge variant={selectedCreditNote.status === 'Applied' ? 'success' : selectedCreditNote.status === 'Approved' ? 'info' : 'warning'}>
                    {selectedCreditNote.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                <p className="text-primary-text mt-1">{selectedCreditNote.invoice}</p>
              </div>
               <div>
                <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                <p className="text-primary-text mt-1">#${selectedCreditNote.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                <p className="text-primary-text mt-1 text-base font-semibold">
                  ${selectedCreditNote.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                <p className="text-primary-text mt-1">{selectedCreditNote.date}</p>
              </div>
              {selectedCreditNote.reason && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-secondary-text">{t('') || ''}</label>
                  <p className="text-primary-text mt-1">{selectedCreditNote.reason}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  alert(`Downloading ${selectedCreditNote.creditNoteNo}...`)
                }}
                className="flex-1"
              >
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </RightSideModal>

      {/* Add Modal */}
      <RightSideModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('credit_notes.add')}
        width="max-w-3xl"
      >
        <div className="space-y-4">
          {/* Company is auto-set from admin's session */}



          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">{t('auto.auto_466eadd4') || 'Invoice'}</label>
            <select
              value={formData.invoice_id}
              onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-input focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none"
            >
              <option value="">{t('') || ''}</option>
              {filteredInvoices.map(invoice => {
                const invoiceNumber = invoice.invoice_number || invoice.invoice_code || invoice.invoiceNumber || `INV-${invoice.id}` || invoice.id
                return (
                  <option key={invoice.id} value={invoice.id}>
                    {invoiceNumber} - ${parseFloat(invoice.total || invoice.amount || 0).toLocaleString()}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('auto.auto_b2f40690') || 'Amount'}</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('') || ''}</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">{t('') || ''}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-input focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none"
            >
              <option value="Pending">{t('') || ''}</option>
              <option value="Approved">{t('') || ''}</option>
              <option value="Applied">{t('') || ''}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">{t('') || ''}</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-input focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none"
              rows={3}
              placeholder={t('credit_notes.reason_placeholder') || 'Grund für die Gutschrift'}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              className="flex-1"
            >
              Create Credit Note
            </Button>
          </div>
        </div>
      </RightSideModal>

      {/* Edit Modal */}
      <RightSideModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Credit Note"
        width="max-w-3xl"
      >
        <div className="space-y-4">


          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">{t('') || ''}</label>
            <select
              value={formData.invoice_id}
              onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-input focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none"
            >
              <option value="">{t('') || ''}</option>
              {filteredInvoices.map(invoice => {
                const invoiceNumber = invoice.invoice_number || invoice.invoice_code || invoice.invoiceNumber || `INV-${invoice.id}` || invoice.id
                return (
                  <option key={invoice.id} value={invoice.id}>
                    {invoiceNumber} - ${parseFloat(invoice.total || invoice.amount || 0).toLocaleString()}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('') || ''}</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('') || ''}</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">{t('') || ''}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-input focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none"
            >
              <option value="Pending">{t('') || ''}</option>
              <option value="Approved">{t('') || ''}</option>
              <option value="Applied">{t('') || ''}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">{t('') || ''}</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-input focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none"
              rows={3}
              placeholder={t('credit_notes.reason_placeholder') || 'Grund für die Gutschrift'}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEdit}
              className="flex-1"
            >
              Update Credit Note
            </Button>
          </div>
        </div>
      </RightSideModal>
    </div>
  )
}

export default CreditNotes
