import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../context/LanguageContext'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import { estimatesAPI as offersAPI, companiesAPI } from '../../../api'
import { useSettings } from '../../../context/SettingsContext'
import { useAuth } from '../../../context/AuthContext'
import {
  IoAdd,
  IoSearch,
  IoFilter,
  IoDocumentText,
  IoEye,
  IoCreate,
  IoTrash,
  IoCheckmarkCircle,
  IoTime,
  IoClose,
} from 'react-icons/io5'

/**
 * Offers Page
 * Similar to Proposals/Deals but specifically for Offers
 * This is part of the CRM module as per client requirements
 */
const Offers = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { settings, formatCurrency, formatDate } = useSettings();
  const companyId = parseInt(user?.company_id || localStorage.getItem('companyId') || 1, 10)

  const primaryColor = useMemo(() => {
    const fromSettings = settings?.primary_color;
    if (fromSettings) return fromSettings;
    if (typeof window !== "undefined") {
      const cssVar = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary-accent")
        .trim();
      if (cssVar) return cssVar;
    }
    return "#217E45";
  }, [settings?.primary_color]);

  const hexToHsl = (hex) => {
    if (!hex) return { h: 210, s: 100, l: 45 };
    let clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
      clean = clean.split("").map((c) => c + c).join("");
    }
    const num = parseInt(clean, 16);
    if (Number.isNaN(num)) return { h: 210, s: 100, l: 45 };
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const getStatusStyle = (status) => {
    const base = hexToHsl(primaryColor);
    const s = status?.toLowerCase() || "";
    const hueOffsets = {
      accepted: 0,
      sent: 200,
      declined: 145,
      rejected: 145,
      waiting: 25,
      expired: 55,
    };
    if (s === "draft") {
      return {
        backgroundColor: `hsl(${base.h} 10% 92%)`,
        color: `hsl(${base.h} 20% 35%)`,
        borderColor: `hsl(${base.h} 15% 85%)`,
      };
    }
    const hue = (base.h + (hueOffsets[s] || 0)) % 360;
    return {
      backgroundColor: `hsl(${hue} ${Math.max(45, base.s)}% 90%)`,
      color: `hsl(${hue} ${Math.max(55, base.s)}% 35%)`,
      borderColor: `hsl(${hue} ${Math.max(45, base.s)}% 80%)`,
    };
  };

  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [companies, setCompanies] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    valid_till: '',
    currency: 'USD',
    description: '',
    note: '',
    terms: 'Vielen Dank für Ihr Vertrauen.',
    discount: 0,
    discount_type: '%',
    amount: '',
    status: 'draft',
    company_id: companyId,
  })

  useEffect(() => {
    fetchOffers()
    fetchCompanies()
  }, [])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const response = await offersAPI.getAll({ company_id: companyId })
      if (response.data?.success) {
        setOffers(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }



  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getAll({ company_id: companyId })
      if (response.data.success) {
        setCompanies(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const handleCreateOffer = async () => {
    try {
      if (!formData.title && !formData.description) {
        alert(t('estimates.enter_title_description'))
        return
      }

      const currencyCode = formData.currency ? formData.currency.split(' ')[0] : 'USD'
      const validTill = formData.valid_till || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const amount = parseFloat(formData.amount) || 0
      const offerData = {
        description: formData.description || formData.title || '',
        note: formData.note || null,
        terms: formData.terms || 'Vielen Dank für Ihr Vertrauen.',
        valid_till: validTill,
        currency: currencyCode,
        discount: parseFloat(formData.discount) || 0,
        discount_type: (formData.discount_type || '%') === 'flat' ? 'fixed' : '%',
        sub_total: amount,
        discount_amount: 0,
        tax_amount: 0,
        total: amount,
        status: (formData.status || 'Draft').charAt(0).toUpperCase() + (formData.status || 'draft').slice(1).toLowerCase(),
        company_id: parseInt(companyId, 10),
        items: []
      }

      const response = await offersAPI.create(offerData)
      if (response.data.success) {
        alert(t('messages.saveSuccess'))
        setIsAddModalOpen(false)
        setFormData({
          title: '',
          valid_till: '',
          currency: 'USD',
          description: '',
          note: '',
          terms: 'Thank you for your business.',
          discount: 0,
          discount_type: '%',
          amount: '',
          status: 'draft',
          company_id: companyId,
        })
        fetchOffers()
      } else {
      alert(response.data.error || 'Angebot konnte nicht erstellt werden')
    }
  } catch (error) {
    console.error('Error creating offer:', error)
    alert(error.response?.data?.error || 'Angebot konnte nicht erstellt werden')
    }
  }

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = !searchQuery ||
      (offer.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (offer.offer_number || '').toLowerCase().includes(searchQuery.toLowerCase())
    const offerStatus = (offer.status || '').toLowerCase()
    const matchesStatus = statusFilter === 'All' || offerStatus === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-3 sm:space-y-4 bg-main-bg min-h-screen p-2 sm:p-4 text-primary-text">
      {/* Header Card */}
      <Card className="bg-card-bg rounded-lg shadow-soft border border-border-light overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-border-light">
          <div>
            <h1 className="text-xl font-bold text-gray-900 notranslate">{t('Quotes')}</h1>
            <p className="text-xs text-secondary-text mt-0.5 notranslate">{t('estimates.subtitle')}</p>
          </div>
          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <IoAdd size={18} /> <span className="notranslate">{t('estimates.addEstimate')}</span>
          </Button>
        </div>
        
        {/* Filters integrated into header card if needed, or keep as separate card below */}
      </Card>

      {/* Filters Card */}
      <Card className="p-3 sm:p-4 bg-card-bg border border-border-light shadow-soft">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder={t('estimates.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-accent outline-none bg-input-bg"
          >
            <option value="All">{t('auto.auto_bcec0a9d') || 'Alle Status'}</option>
            <option value="draft">{t('') || ''}</option>
            <option value="sent">{t('') || ''}</option>
            <option value="accepted">{t('') || ''}</option>
            <option value="declined">{t('') || ''}</option>
          </select>
        </div>
      </Card>

      {/* Offers List Container Card */}
      <Card className="p-4 sm:p-6 bg-card-bg border border-border-light shadow-soft overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent mx-auto"></div>
            <p className="text-gray-500 mt-4 notranslate">{t('common.loading')}</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-12 text-center">
            <IoDocumentText size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2 notranslate">{t('estimates.no_estimates_found')}</h3>
            <p className="text-gray-500 mb-6 notranslate">{t('estimates.get_started')}</p>
            <Button
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <IoAdd size={18} /> <span className="notranslate">{t('estimates.createEstimate')}</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <Card key={offer.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-100" onClick={() => {
                const path = user?.role === 'EMPLOYEE' ? `/app/employee/offers/${offer.id}` : `/app/admin/offers/${offer.id}`;
                navigate(path);
              }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 truncate" title={offer.description || offer.offer_number}>
                      {offer.description?.trim() ? (offer.description.length > 55 ? `${offer.description.slice(0, 55).trim()}...` : offer.description.trim()) : (offer.offer_number || 'Unbenanntes Angebot')}
                    </h3>
                    <p className="text-[10px] text-gray-400 mb-0.5">{offer.offer_number}</p>
                    <p className="text-xs text-gray-500">{offer.offer_number}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border whitespace-nowrap" style={getStatusStyle(offer.status)}>
                    {offer.status || 'Entwurf'}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-500">{t('auto.auto_8a2e38c7') || 'Wert:'}</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(offer.total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-500">{t('common.created')}:</span>
                    <span className="text-gray-700">
                      {formatDate(offer.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      const path = user?.role === 'EMPLOYEE' ? `/app/employee/offers/${offer.id}` : `/app/admin/offers/${offer.id}`;
                      navigate(path);
                    }}
                  >
                    <IoEye size={14} /> Ansehen
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      const path = user?.role === 'EMPLOYEE' ? `/app/employee/offers/${offer.id}` : `/app/admin/offers/${offer.id}`;
                      navigate(path);
                    }}
                    title="Ansehen / Bearbeiten"
                  >
                    <IoCreate size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Add Offer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setFormData({
            title: '',
            valid_till: '',
            currency: 'USD',
            description: '',
            note: '',
          terms: 'Vielen Dank für Ihr Vertrauen.',
          discount: 0,
          discount_type: '%',
          amount: '',
          status: 'draft',
          company_id: companyId,
        })
      }}
      title={<span className="notranslate">{t('') || ''}</span>}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Input
            label={<span className="notranslate">{t('estimates.quote_title')} *</span>}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t('estimates.enter_title')}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('common.due_date')}
              type="date"
              value={formData.valid_till}
              onChange={(e) => setFormData({ ...formData, valid_till: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Währung</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (€)</option>
              </select>
            </div>
          </div>

          <Input
            label={<span className="notranslate">{t('estimates.quote_value')} ($) *</span>}
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Rabatt"
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              placeholder="0"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('') || ''}</label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="%">Prozent (%)</option>
                <option value="flat">{t('') || ''}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('') || ''}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="draft">{t('') || ''}</option>
              <option value="sent">{t('') || ''}</option>
              <option value="accepted">{t('') || ''}</option>
              <option value="declined">{t('') || ''}</option>
              <option value="expired">{t('') || ''}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('') || ''}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Notiz für den Empfänger"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allgemeine Geschäftsbedingungen</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Allgemeine Geschäftsbedingungen"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setFormData({
                  title: '',
                  valid_till: '',
                  currency: 'USD',
                  description: '',
                  note: '',
              terms: 'Vielen Dank für Ihr Vertrauen.',
              discount: 0,
              discount_type: '%',
              amount: '',
              status: 'draft',
              company_id: companyId,
            })
          }}
          className="flex-1"
        >
          Abbrechen
        </Button>
        <Button variant="primary" onClick={handleCreateOffer} className="flex-1 notranslate">
          Angebot erstellen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Offers

