import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { estimatesAPI as offersAPI } from '../../../api'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import {
  IoArrowBack,
  IoCreate,
  IoTrash,
  IoDocumentText,
  IoPerson,
  IoCalendar,
  IoCash,
} from 'react-icons/io5'

const OfferDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const companyId = parseInt(localStorage.getItem('companyId') || 1, 10)

  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ description: '', note: '', terms: '', status: 'Draft' })

  useEffect(() => {
    if (id) fetchOffer()
  }, [id])

  const fetchOffer = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await offersAPI.getById(id, { company_id: companyId })
      if (res.data?.success && res.data?.data) {
        setOffer(res.data.data)
      } else {
        setError('Offer not found')
      }
    } catch (err) {
      console.error('Fetch offer error:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load offer')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return
    try {
      setDeleting(true)
      await offersAPI.delete(id, { company_id: companyId })
      navigate(user?.role === 'EMPLOYEE' ? '/app/employee/offers' : '/app/admin/offers')
    } catch (err) {
      console.error('Delete offer error:', err)
      alert(err.response?.data?.error || err.message || 'Failed to delete offer')
    } finally {
      setDeleting(false)
    }
  }

  const openEditModal = () => {
    setEditForm({
      description: offer?.description || '',
      note: offer?.note || '',
      terms: offer?.terms || 'Thank you for your business.',
      status: offer?.status || 'Draft',
    })
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    try {
      setSaving(true)
      await offersAPI.update(id, {
        ...editForm,
        company_id: companyId,
      })
      setIsEditModalOpen(false)
      fetchOffer()
    } catch (err) {
      console.error('Update offer error:', err)
      alert(err.response?.data?.error || err.message || 'Failed to update offer')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh]">
        <div className="text-gray-500">Loading offer...</div>
      </div>
    )
  }

  if (error || !offer) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center">
          <p className="text-red-600 mb-4">{error || 'Offer not found'}</p>
          <Button variant="outline" onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/offers' : '/app/admin/offers')}>
            <IoArrowBack size={18} className="mr-2" /> Back to Offers
          </Button>
        </Card>
      </div>
    )
  }

  const statusLower = (offer.status || '').toLowerCase()

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/app/employee/offers' : '/app/admin/offers')} className="self-start">
          <IoArrowBack size={20} className="mr-2" /> Back to Offers
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={openEditModal}
            className="flex items-center gap-2"
          >
            <IoCreate size={18} /> Edit
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2"
          >
            <IoTrash size={18} /> Delete
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {offer.offer_number || `Offer #${offer.id}`}
            </h1>
            <p className="text-gray-500 mt-1">{offer.client_name || 'No client'}</p>
          </div>
          <Badge
            variant={
              statusLower === 'accepted'
                ? 'success'
                : statusLower === 'declined'
                  ? 'danger'
                  : 'primary'
            }
          >
            {offer.status || 'Draft'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-700">
              <IoCalendar size={20} className="text-gray-400" />
              <span>Valid till: {offer.valid_till ? new Date(offer.valid_till).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <IoCash size={20} className="text-gray-400" />
              <span>
                {offer.currency || 'USD'} {Number(offer.total || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {offer.description && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{offer.description}</p>
          </div>
        )}
        {offer.note && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Note</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{offer.note}</p>
          </div>
        )}
        {offer.terms && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Terms & Conditions</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{offer.terms}</p>
          </div>
        )}

        {offer.items && offer.items.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 pr-4">Item</th>
                    <th className="pb-2 pr-4">Qty</th>
                    <th className="pb-2 pr-4">Unit Price</th>
                    <th className="pb-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {offer.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4">{item.item_name || '—'}</td>
                      <td className="py-2 pr-4">{item.quantity}</td>
                      <td className="py-2 pr-4">{Number(item.unit_price || 0).toLocaleString()}</td>
                      <td className="py-2">{Number(item.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Offer"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              value={editForm.note}
              onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
            <textarea
              value={editForm.terms}
              onChange={(e) => setEditForm({ ...editForm, terms: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Declined">Declined</option>
              <option value="Expired">Expired</option>
              <option value="Waiting">Waiting</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit} disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default OfferDetail
