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
  IoList,
  IoGrid,
  IoCopy,
  IoEllipsisVertical,
  IoChevronBack,
  IoChevronForward,
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

  const translateOfferStatus = (status) => {
    const s = (status || '').toLowerCase().trim()
    const keyMap = {
      draft: 'offersForm.offerStatus.draft',
      sent: 'offersForm.offerStatus.sent',
      accepted: 'offersForm.offerStatus.accepted',
      declined: 'offersForm.offerStatus.declined',
      expired: 'offersForm.offerStatus.expired',
      waiting: 'offer_detail_page.status_waiting',
    }
    const key = keyMap[s] || 'offersForm.offerStatus.draft'
    return t(key)
  }

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
  const [offerViewMode, setOfferViewMode] = useState('list') // 'list' | 'tile'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [companies, setCompanies] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    valid_till: '',
    currency: 'EUR',
    description: '',
    note: '',
    terms: '',
    discount: 0,
    discount_type: '%',
    amount: '',
    status: 'draft',
    company_id: companyId,
  })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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

      const currencyCode = 'EUR'
      const validTill = formData.valid_till || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const amount = parseFloat(formData.amount) || 0
      const offerData = {
        description: formData.description || formData.title || '',
        note: formData.note || null,
        terms: formData.terms || t('offer_detail_page.default_terms'),
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
          currency: 'EUR',
          description: '',
          note: '',
          terms: '',
          discount: 0,
          discount_type: '%',
          amount: '',
          status: 'draft',
          company_id: companyId,
        })
        fetchOffers()
      } else {
        alert(response.data.error || t('offersForm.create_failed'))
      }
    } catch (error) {
      console.error('Error creating offer:', error)
      alert(error.response?.data?.error || t('offersForm.create_failed'))
    }
  }

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = !searchQuery ||
      (offer.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (offer.offer_number || '').toLowerCase().includes(searchQuery.toLowerCase())
    const offerStatus = (offer.status || '').toLowerCase()
    const matchesStatus = statusFilter === 'all' || offerStatus === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOffers = filteredOffers.slice(startIndex, endIndex)
  const totalAmount = filteredOffers.reduce((sum, offer) => sum + (parseFloat(offer.total) || 0), 0)

  return (
    <div className="space-y-3 sm:space-y-4 bg-main-bg min-h-screen p-2 sm:p-4 text-primary-text">
      {/* Header Card */}
      <div className="bg-card-bg rounded-lg shadow-soft border border-border-light overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 border-b border-border-light">
          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <IoDocumentText className="text-primary-accent" size={22} /> <span className="notranslate">{t('sidebar.offers')}</span>
            </h1>
          </div>
          <button
            onClick={() => {
              setFormData({
                title: '',
                valid_till: '',
                currency: 'EUR',
                description: '',
                note: '',
                terms: t('offer_detail_page.default_terms'),
                discount: 0,
                discount_type: '%',
                amount: '',
                status: 'draft',
                company_id: companyId,
              })
              setIsAddModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
          >
            <IoAdd size={18} /> <span>{t('estimates.addEstimate')}</span>
          </button>
        </div>

        {/* Controls row - aligned with Invoices */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-border-light bg-input-bg p-0.5" role="group" aria-label={t('sidebar.offers')}>
              <button
                type="button"
                title={t('common.list')}
                onClick={() => setOfferViewMode('list')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${offerViewMode === 'list' ? 'bg-primary-accent text-white shadow-sm' : 'text-secondary-text hover:text-primary-text'}`}
              >
                <IoList size={14} className="inline-block sm:mr-1 align-middle" />
                <span className="hidden sm:inline">{t('common.list')}</span>
              </button>
              <button
                type="button"
                title={t('common.tile')}
                onClick={() => setOfferViewMode('tile')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${offerViewMode === 'tile' ? 'bg-primary-accent text-white shadow-sm' : 'text-secondary-text hover:text-primary-text'}`}
              >
                <IoGrid size={14} className="inline-block sm:mr-1 align-middle" />
                <span className="hidden sm:inline">{t('common.tile')}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:min-w-[280px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('estimates.search_placeholder')}
                className="pl-8 pr-3 py-2 text-sm border border-border-light rounded-lg w-full focus:ring-2 focus:ring-primary-accent outline-none bg-input-bg text-primary-text"
              />
              <IoSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-text" size={14} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border-light rounded-lg bg-white text-sm min-w-[130px]"
            >
              <option value="all">{t('common.all_status')}</option>
              <option value="draft">{t('offersForm.offerStatus.draft')}</option>
              <option value="sent">{t('offersForm.offerStatus.sent')}</option>
              <option value="accepted">{t('offersForm.offerStatus.accepted')}</option>
              <option value="declined">{t('offersForm.offerStatus.declined')}</option>
              <option value="expired">{t('offersForm.offerStatus.expired')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Offers List Container Card */}
      <Card className="p-0 overflow-hidden bg-card-bg border border-border-light shadow-soft min-h-[400px]">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent mx-auto"></div>
            <p className="text-gray-500 mt-4 notranslate">{t('common.loading')}</p>
          </div>
        ) : paginatedOffers.length === 0 ? (
          <div className="p-12 text-center">
            <IoDocumentText size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2 notranslate">{t('estimates.no_estimates_found')}</h3>
            <p className="text-gray-500 mb-6 notranslate">{t('estimates.get_started')}</p>
            <Button
              variant="primary"
              onClick={() => {
                setFormData({
                  title: '',
                  valid_till: '',
                  currency: 'EUR',
                  description: '',
                  note: '',
                  terms: t('offer_detail_page.default_terms'),
                  discount: 0,
                  discount_type: '%',
                  amount: '',
                  status: 'draft',
                  company_id: companyId,
                })
                setIsAddModalOpen(true)
              }}
              className="flex items-center gap-2 mx-auto"
            >
              <IoAdd size={18} /> <span className="notranslate">{t('estimates.createEstimate')}</span>
            </Button>
          </div>
        ) : offerViewMode === 'tile' ? (
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {paginatedOffers.map((offer) => (
              <Card key={offer.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-100" onClick={() => {
                const path = user?.role === 'EMPLOYEE' ? `/app/employee/offers/${offer.id}` : `/app/admin/offers/${offer.id}`;
                navigate(path);
              }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 truncate" title={offer.description || offer.offer_number}>
                      {offer.description?.trim() ? (offer.description.length > 55 ? `${offer.description.slice(0, 55).trim()}...` : offer.description.trim()) : (offer.offer_number || t('offersForm.unnamed_offer'))}
                    </h3>
                    <p className="text-[10px] text-gray-400 mb-0.5">{offer.offer_number}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border whitespace-nowrap" style={getStatusStyle(offer.status)}>
                    {translateOfferStatus(offer.status)}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-500">{t('common.total')}:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(offer.total, offer.currency)}
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
                    <IoEye size={14} /> {t('offersForm.view_action')}
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
                    title={t('offersForm.view_edit_tooltip')}
                  >
                    <IoCreate size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs sm:text-sm">
              <thead className="bg-main-bg border-b border-border-light">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">{t('estimates.quote_title')}</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider hidden lg:table-cell">{t('common.created')}</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider hidden md:table-cell">{t('common.due_date')}</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">{t('common.total')}</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider">{t('common.status')}</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-secondary-text uppercase tracking-wider sticky right-0 bg-main-bg">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light bg-card-bg">
                {paginatedOffers.map((offer) => {
                  const path = user?.role === 'EMPLOYEE' ? `/app/employee/offers/${offer.id}` : `/app/admin/offers/${offer.id}`
                  const titleText = offer.description?.trim()
                    ? (offer.description.length > 80 ? `${offer.description.slice(0, 80)}…` : offer.description)
                    : (offer.offer_number || t('offersForm.unnamed_offer'))
                  return (
                    <tr key={offer.id} className="hover:bg-main-bg">
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <button type="button" onClick={() => navigate(path)} className="text-left font-semibold text-primary-accent hover:underline text-xs sm:text-sm">
                          {offer.offer_number}
                        </button>
                        <div className="text-secondary-text mt-0.5 max-w-md truncate text-[11px] sm:text-xs" title={offer.description || ''}>{titleText}</div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-secondary-text hidden lg:table-cell whitespace-nowrap text-xs sm:text-sm">{formatDate(offer.created_at)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-secondary-text hidden md:table-cell whitespace-nowrap text-xs sm:text-sm">{offer.valid_till ? formatDate(offer.valid_till) : '—'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-primary-text whitespace-nowrap text-xs sm:text-sm">{formatCurrency(offer.total, offer.currency)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border" style={getStatusStyle(offer.status)}>
                          {translateOfferStatus(offer.status)}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 sticky right-0 bg-card-bg">
                        <div className="flex items-center justify-end gap-0.5">
                          <button type="button" onClick={() => navigate(path)} className="p-1 sm:p-1.5 text-secondary-text hover:bg-main-bg rounded" title={t('offersForm.view_action')}>
                            <IoEye size={14} />
                          </button>
                          <button type="button" onClick={() => navigate(path)} className="p-1 sm:p-1.5 text-secondary-text hover:bg-main-bg rounded" title={t('offersForm.view_edit_tooltip')}>
                            <IoCreate size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer with Pagination and Total - Matching Invoices */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-border-light flex flex-wrap items-center justify-between gap-2 sm:gap-3 bg-main-bg">
            <div className="flex items-center gap-2 sm:gap-4">
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                className="px-1.5 sm:px-2 py-1 text-xs sm:text-sm border border-border-light rounded bg-input-bg"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs sm:text-sm text-secondary-text">
                {startIndex + 1}-{Math.min(endIndex, filteredOffers.length)}/{filteredOffers.length}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-primary-text hidden xs:block">
              Gesamt: {formatCurrency(totalAmount, settings?.default_currency)}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-1 sm:p-1.5 border border-border-light rounded ${currentPage === 1 ? 'text-muted-text cursor-not-allowed' : 'hover:bg-main-bg'}`}
              >
                <IoChevronBack size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`p-1 sm:p-1.5 border border-border-light rounded ${currentPage === totalPages || totalPages === 0 ? 'text-muted-text cursor-not-allowed' : 'hover:bg-main-bg'}`}
              >
                <IoChevronForward size={14} />
              </button>
            </div>
          </div>
          </>
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
            currency: 'EUR',
            description: '',
            note: '',
            terms: '',
            discount: 0,
            discount_type: '%',
            amount: '',
            status: 'draft',
            company_id: companyId,
          })
        }}
        title={<span className="notranslate">{t('offersForm.addOffer')}</span>}
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
            <div className="hidden">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.currency')}</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <Input
            label={<span className="notranslate">{t('estimates.quote_value')} (€) *</span>}
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={<span className="notranslate">{t('invoices.discount')}</span>}
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              placeholder="0"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('offersForm.discountType')}</label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="%">{t('offersForm.percent_option')}</option>
                <option value="flat">{t('offersForm.fixedAmount')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('offersForm.status')}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="draft">{t('offersForm.offerStatus.draft')}</option>
              <option value="sent">{t('offersForm.offerStatus.sent')}</option>
              <option value="accepted">{t('offersForm.offerStatus.accepted')}</option>
              <option value="declined">{t('offersForm.offerStatus.declined')}</option>
              <option value="expired">{t('offersForm.offerStatus.expired')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder={t('offersForm.descriptionPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('offersForm.noteForRecipient')}</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder={t('offersForm.notePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('offer_detail_page.terms')}</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder={t('offer_detail_page.default_terms')}
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
                  currency: 'EUR',
                  description: '',
                  note: '',
                  terms: '',
                  discount: 0,
                  discount_type: '%',
                  amount: '',
                  status: 'draft',
                  company_id: companyId,
                })
              }}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleCreateOffer} className="flex-1 notranslate">
              {t('offersForm.createOffer')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Offers

