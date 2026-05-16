/**
 * Settings Context
 * Provides global settings management with formatters for currency, date, and time
 * All settings are company-specific (based on logged-in admin's companyId)
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { settingsAPI, companiesAPI } from '../api'
import BaseUrl from '../api/baseUrl.js'
import { useAuth } from './AuthContext'

const SettingsContext = createContext()

/** BCP 47 locale hints for Intl currency formatting */
const LOCALE_BY_CURRENCY = {
  EUR: 'de-DE',
  USD: 'en-US',
  GBP: 'en-GB',
  INR: 'en-IN',
  CHF: 'de-CH',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  AUD: 'en-AU',
  CAD: 'en-CA',
  AED: 'ar-AE',
  SAR: 'ar-SA',
  SGD: 'en-SG',
  HKD: 'en-HK',
  NZD: 'en-NZ',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  DKK: 'da-DK',
  PLN: 'pl-PL',
  TRY: 'tr-TR',
  BRL: 'pt-BR',
  MXN: 'es-MX',
  ZAR: 'en-ZA',
}

function localeForCurrency(code) {
  const c = String(code || 'EUR').toUpperCase()
  return LOCALE_BY_CURRENCY[c] || 'de-DE'
}

/** First ISO 4217 token from values like "EUR (€)", "USD", or trim garbage */
export function normalizeCurrencyCode(raw) {
  if (raw == null || raw === '') return null
  let s = String(raw).trim()
  if (!s) return null
  const token = s.split(/\s+/)[0]
  const letters = token.replace(/[^A-Za-z]/g, '')
  if (letters.length < 3) return null
  const code = letters.slice(0, 3).toUpperCase()
  return /^[A-Z]{3}$/.test(code) ? code : null
}

/** Parse API / DB amounts (strings, decimals, null) without NaN leaking into Intl */
function parseAmountSafe(raw) {
  if (raw == null || raw === '') return 0
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0
  if (typeof raw === 'object') return 0
  const s = String(raw).trim().replace(/\s/g, '')
  if (!s) return 0
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth()
  const companyId = useMemo(() => user?.company_id || localStorage.getItem('companyId') || 1, [user])
  // Use a ref so fetchCompanyAndSettings always has the latest companyId without stale closures
  const companyIdRef = useRef(companyId)
  useEffect(() => { companyIdRef.current = companyId }, [companyId])

  // Company Information
  const [company, setCompany] = useState(() => {
    const fallback = {
      id: null,
      name: 'Developo',
      email: '',
      phone: '',
      website: '',
      address: '',
      logo: '',
    }
    try {
      const stored = localStorage.getItem('companyInfo')
      if (!stored || stored === 'undefined' || stored === 'null') return fallback
      const parsed = JSON.parse(stored)
      return { ...fallback, ...(parsed || {}) }
    } catch (e) {
      return fallback
    }
  })

  // System Settings
  const [settings, setSettings] = useState({
    system_name: 'Developo',
    default_currency: 'EUR',
    default_timezone: 'Europe/Berlin',
    date_format: 'd/m/Y',
    time_format: 'H:i',
    currency_symbol_position: 'before',
    theme_mode: 'light',
    primary_color: '#217E45',
    secondary_color: '#76AF88',
    font_family: 'Inter, sans-serif',
    default_language: 'de',
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [logoVersion, setLogoVersion] = useState(() => {
    const stored = localStorage.getItem('logoVersion')
    return stored ? parseInt(stored, 10) : Date.now()
  })

  // Cache freshness threshold: 5 minutes
  const CACHE_TTL_MS = 5 * 60 * 1000
  const isCacheFresh = () => {
    const lastFetch = localStorage.getItem('settingsFetchedAt')
    if (!lastFetch) return false
    return Date.now() - parseInt(lastFetch, 10) < CACHE_TTL_MS
  }

  // Currency symbols map (Restricted to EUR as per client requirement)
  const currencySymbols = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    INR: '₹',
    CHF: 'CHF',
  }

  // Timezone options
  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'America/New York (EST)' },
    { value: 'America/Chicago', label: 'America/Chicago (CST)' },
    { value: 'America/Denver', label: 'America/Denver (MST)' },
    { value: 'America/Los_Angeles', label: 'America/Los Angeles (PST)' },
    { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
    { value: 'Europe/Madrid', label: 'Europe/Madrid (CET)' },
    { value: 'Europe/Rome', label: 'Europe/Rome (CET)' },
    { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (CET)' },
    { value: 'Europe/London', label: 'Europe/London (GMT)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
  ]

  // Date format options
  const dateFormatOptions = [
    { value: 'Y-m-d', label: 'YYYY-MM-DD (2024-01-15)', example: '2024-01-15' },
    { value: 'm/d/Y', label: 'MM/DD/YYYY (01/15/2024)', example: '01/15/2024' },
    { value: 'd/m/Y', label: 'DD/MM/YYYY (15/01/2024)', example: '15/01/2024' },
    { value: 'd-m-Y', label: 'DD-MM-YYYY (15-01-2024)', example: '15-01-2024' },
    { value: 'd.m.Y', label: 'DD.MM.YYYY (15.01.2024)', example: '15.01.2024' },
    { value: 'M d, Y', label: 'Jan 15, 2024', example: 'Jan 15, 2024' },
    { value: 'd M Y', label: '15 Jan 2024', example: '15 Jan 2024' },
  ]

  // Time format options
  const timeFormatOptions = [
    { value: 'H:i', label: '24 Hour (14:30)', example: '14:30' },
    { value: 'h:i A', label: '12 Hour (02:30 PM)', example: '02:30 PM' },
  ]

  // Fetch company info and settings
  const fetchCompanyAndSettings = useCallback(async (force = false) => {
    // Always read the latest companyId from the ref (avoids stale closure)
    const currentCompanyId = companyIdRef.current

    // Skip fetch if we have fresh cached data and it's not a forced refresh
    if (!force && isCacheFresh()) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let fetchedCompanyLogo = ''
      let companyRowCurrency = 'EUR' // Force EUR as baseline

      // Step 1: Fetch company info directly from companies table
      try {
        const companyResponse = await companiesAPI.getById(currentCompanyId)
        if (companyResponse.data.success && companyResponse.data.data) {
          const companyData = companyResponse.data.data
          // companyRowCurrency = companyData.currency || 'EUR' 
          // We intentionally ignore other currencies to standardize on EUR
          setCompany(prev => {
            const newCompany = {
              id: companyData.id || prev.id,
              name: companyData.name || prev.name || 'Developo',
              email: companyData.email || prev.email || '',
              phone: companyData.phone || prev.phone || '',
              website: companyData.website || prev.website || '',
              address: companyData.address || prev.address || '',
              currency: 'EUR', // Standardized
              logo: companyData.logo || prev.logo || '',
            }
            fetchedCompanyLogo = newCompany.logo
            localStorage.setItem('companyInfo', JSON.stringify(newCompany))
            return newCompany
          })
        }
      } catch (err) {
        console.error('Error fetching company:', err)
      }

      // Step 2: Fetch system_settings
      try {
        const settingsResponse = await settingsAPI.get({ company_id: currentCompanyId })
        if (settingsResponse.data.success && settingsResponse.data.data) {
          const fetchedSettings = {}
          settingsResponse.data.data.forEach(setting => {
            try {
              if (setting.setting_value && (setting.setting_value.startsWith('{') || setting.setting_value.startsWith('['))) {
                fetchedSettings[setting.setting_key] = JSON.parse(setting.setting_value)
              } else {
                fetchedSettings[setting.setting_key] = setting.setting_value
              }
            } catch (e) {
              fetchedSettings[setting.setting_key] = setting.setting_value
            }
          })

          setCompany(prev => {
            const updated = {
              ...prev,
              logo: fetchedSettings.company_logo || prev.logo,
              name: fetchedSettings.company_name || prev.name || 'Developo',
            }
            localStorage.setItem('companyInfo', JSON.stringify(updated))
            return updated
          })

          setSettings(prev => ({
            ...prev,
            ...fetchedSettings,
            default_currency: 'EUR' // Strictly EUR
          }))
        }
      } catch (err) {
        console.error('Error fetching settings:', err)
      }

      localStorage.setItem('settingsFetchedAt', Date.now().toString())

    } catch (err) {
      console.error('Error in fetchCompanyAndSettings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load on mount
  useEffect(() => {
    fetchCompanyAndSettings()
  }, [fetchCompanyAndSettings, companyId])

  const formatDate = useCallback((dateString, includeTimezone = true) => {
    if (!dateString) return '--'
    try {
      let date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      if (includeTimezone && settings.default_timezone && settings.default_timezone !== 'UTC') {
        try {
          const options = { timeZone: settings.default_timezone }
          const localeDateString = date.toLocaleDateString('en-US', options)
          date = new Date(localeDateString)
        } catch (e) {}
      }
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthName = monthNames[date.getMonth()]
      const format = settings.date_format || 'Y-m-d'
      switch (format) {
        case 'Y-m-d': return `${year}-${month}-${day}`
        case 'm/d/Y': return `${month}/${day}/${year}`
        case 'd/m/Y': return `${day}/${month}/${year}`
        case 'd-m-Y': return `${day}-${month}-${year}`
        case 'd.m.Y': return `${day}.${month}.${year}`
        case 'M d, Y': return `${monthName} ${day}, ${year}`
        case 'd M Y': return `${day} ${monthName} ${year}`
        default: return `${year}-${month}-${day}`
      }
    } catch (e) { return dateString }
  }, [settings.date_format, settings.default_timezone])

  const formatTime = useCallback((dateString, includeTimezone = true) => {
    if (!dateString) return '--'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      const format = settings.time_format || 'H:i'
      if (includeTimezone && settings.default_timezone) {
        try {
          const options = { 
            timeZone: settings.default_timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: format === 'h:i A'
          }
          return date.toLocaleTimeString('en-US', options)
        } catch (e) {}
      }
      return format === 'h:i A' 
        ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch (e) { return dateString }
  }, [settings.time_format, settings.default_timezone])

  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return '--'
    return `${formatDate(dateString)} ${formatTime(dateString)}`
  }, [formatDate, formatTime])

  const formatCurrency = useCallback((amount, currencyCode = null, options = null) => {
    const opts = options && typeof options === 'object' && !Array.isArray(options) ? options : {}
    // Strict requirement: Always use EUR if not explicitly overridden by a valid code, 
    // but the goal is to standardize on EUR.
    const code = 'EUR' 
    const numAmount = parseAmountSafe(amount)
    const loc = 'de-DE'
    try {
      return new Intl.NumberFormat(loc, {
        style: 'currency',
        currency: code,
        minimumFractionDigits: opts.minimumFractionDigits !== undefined ? opts.minimumFractionDigits : 2,
        maximumFractionDigits: opts.maximumFractionDigits !== undefined ? opts.maximumFractionDigits : 2,
        notation: opts.notation || 'standard',
      }).format(numAmount)
    } catch {
      return `${numAmount.toFixed(2)} €`
    }
  }, [settings.default_currency])

  const getCurrencySymbol = useCallback((currencyCode = null) => {
    return '€'
  }, [settings.default_currency])

  const getLogoUrl = useCallback((path) => {
    if (!path || typeof path !== 'string') return null
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    const separator = cleanPath.includes('?') ? '&' : '?'
    return `${BaseUrl}${cleanPath}${separator}v=${logoVersion}`
  }, [logoVersion])

  const getCompanyLogoUrl = useCallback(() => {
    if (typeof getLogoUrl !== 'function') return null;
    const logoSource = settings?.company_logo || company?.logo
    if (!logoSource || logoSource.includes('default-logo')) return null
    return getLogoUrl(logoSource)
  }, [company?.logo, settings?.company_logo, getLogoUrl])

  const updateCompany = useCallback((newCompanyInfo) => {
    setCompany(prev => {
      const updated = { ...prev, ...newCompanyInfo, currency: 'EUR' }
      setTimeout(() => localStorage.setItem('companyInfo', JSON.stringify(updated)), 0)
      return updated
    })
    if (newCompanyInfo.logo || newCompanyInfo.company_logo) {
      const logoValue = newCompanyInfo.company_logo || newCompanyInfo.logo
      setSettings(prev => ({ ...prev, company_logo: logoValue }))
      const newVersion = Date.now()
      setLogoVersion(newVersion)
      localStorage.setItem('logoVersion', String(newVersion))
    }
  }, [])

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  const refreshSettings = useCallback(async () => {
    const newVersion = Date.now()
    setLogoVersion(newVersion)
    localStorage.setItem('logoVersion', newVersion)
    await fetchCompanyAndSettings(true)
  }, [fetchCompanyAndSettings])

  const getCompanyInfo = useCallback(() => {
    return {
      id: company?.id,
      name: company?.name || settings?.company_name || 'Developo',
      email: company?.email || settings?.company_email || '',
      phone: company?.phone || settings?.company_phone || '',
      website: company?.website || settings?.company_website || '',
      address: company?.address || settings?.company_address || '',
      logo: company?.logo || settings?.company_logo || '',
      logoUrl: getCompanyLogoUrl(),
      currency: 'EUR'
    }
  }, [company, settings, getCompanyLogoUrl])

  const toTimezone = useCallback((dateString) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return null
      if (settings.default_timezone) {
        const options = { timeZone: settings.default_timezone }
        return new Date(date.toLocaleString('en-US', options))
      }
      return date
    } catch (e) {
      return new Date(dateString)
    }
  }, [settings.default_timezone])

  const value = {
    company,
    updateCompany,
    getCompanyInfo,
    getCompanyLogoUrl,
    getLogoUrl,
    settings,
    loading,
    error,
    updateSetting,
    updateSettings,
    refreshSettings,
    formatDate,
    formatTime,
    formatDateTime,
    formatCurrency,
    getCurrencySymbol,
    toTimezone,
    logoVersion,
    currencySymbols,
    timezoneOptions,
    dateFormatOptions,
    timeFormatOptions,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export default SettingsContext
