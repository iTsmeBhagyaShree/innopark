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

  // Currency symbols map
  const currencySymbols = {
    USD: '€',
    EUR: '€',
    GBP: '£',
    INR: '€',
    AED: 'د.إ',
    SAR: '﷼',
    JPY: '¥',
    CNY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    PKR: '₨',
    BDT: '৳',
    MYR: 'RM',
    SGD: 'S$',
    THB: '฿',
    PHP: '₱',
    IDR: 'Rp',
    VND: '₫',
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

      // Step 1: Fetch company info directly from companies table (highest priority)
      try {
        const companyResponse = await companiesAPI.getById(currentCompanyId)
        if (companyResponse.data.success && companyResponse.data.data) {
          const companyData = companyResponse.data.data
          // Functional update: preserve existing logo if API returns empty
          setCompany(prev => {
            const newCompany = {
              id: companyData.id || prev.id,
              name: companyData.name || prev.name || 'Developo',
              email: companyData.email || prev.email || '',
              phone: companyData.phone || prev.phone || '',
              website: companyData.website || prev.website || '',
              address: companyData.address || prev.address || '',
              // CRITICAL: never clear the logo - keep localStorage version if API returns empty
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

      // Step 2: Fetch system_settings (lower priority for company fields)
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

          // Use settings logo as the primary global logo, then fallback to prevailing local logo.
          setCompany(prev => {
            const updated = {
              ...prev,
              logo: fetchedSettings.company_logo || prev.logo,
              name: fetchedSettings.company_name || prev.name || 'Developo',
            }
            // Side effect to sync local storage for persistence on refresh
            localStorage.setItem('companyInfo', JSON.stringify(updated))
            return updated
          })

          setSettings(prev => ({ ...prev, ...fetchedSettings }))
        }
      } catch (err) {
        console.error('Error fetching settings:', err)
      }

      // Save fetch timestamp for cache staleness check
      localStorage.setItem('settingsFetchedAt', Date.now().toString())

    } catch (err) {
      console.error('Error in fetchCompanyAndSettings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, []) // intentionally empty - uses companyIdRef & isCacheFresh to avoid stale closures

  // Load on mount
  useEffect(() => {
    fetchCompanyAndSettings()
  }, [fetchCompanyAndSettings, companyId])

  /**
   * Format date according to settings
   * @param {string|Date} dateString - Date to format
   * @param {boolean} includeTimezone - Whether to adjust for timezone
   * @returns {string} Formatted date string
   */
  const formatDate = useCallback((dateString, includeTimezone = true) => {
    if (!dateString) return '--'
    
    try {
      let date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString

      // Apply timezone if needed
      if (includeTimezone && settings.default_timezone && settings.default_timezone !== 'UTC') {
        try {
          const options = { timeZone: settings.default_timezone }
          const localeDateString = date.toLocaleDateString('en-US', options)
          date = new Date(localeDateString)
        } catch (e) {
          // Fallback to original date if timezone conversion fails
        }
      }

      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthName = monthNames[date.getMonth()]

      const format = settings.date_format || 'Y-m-d'

      switch (format) {
        case 'Y-m-d':
          return `${year}-${month}-${day}`
        case 'm/d/Y':
          return `${month}/${day}/${year}`
        case 'd/m/Y':
          return `${day}/${month}/${year}`
        case 'd-m-Y':
          return `${day}-${month}-${year}`
        case 'd.m.Y':
          return `${day}.${month}.${year}`
        case 'M d, Y':
          return `${monthName} ${day}, ${year}`
        case 'd M Y':
          return `${day} ${monthName} ${year}`
        default:
          return `${year}-${month}-${day}`
      }
    } catch (e) {
      console.error('Error formatting date:', e)
      return dateString
    }
  }, [settings.date_format, settings.default_timezone])

  /**
   * Format time according to settings
   * @param {string|Date} dateString - Date/time to format
   * @param {boolean} includeTimezone - Whether to adjust for timezone
   * @returns {string} Formatted time string
   */
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
        } catch (e) {
          // Fallback
        }
      }

      if (format === 'h:i A') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      } else {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      }
    } catch (e) {
      console.error('Error formatting time:', e)
      return dateString
    }
  }, [settings.time_format, settings.default_timezone])

  /**
   * Format datetime according to settings
   * @param {string|Date} dateString - Date/time to format
   * @returns {string} Formatted datetime string
   */
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return '--'
    return `${formatDate(dateString)} ${formatTime(dateString)}`
  }, [formatDate, formatTime])

  /**
   * Format currency according to settings
   * @param {number} amount - Amount to format
   * @param {string} currencyCode - Optional currency code override
   * @returns {string} Formatted currency string
   */
  const formatCurrency = useCallback((amount, currencyCode = null, convertTo = null) => {
    let currency = currencyCode || settings.default_currency || 'EUR'
    let numAmount = parseFloat(amount || 0)

    // Basic conversion logic (Example rate: 1 EUR = 1.09 USD)
    if (convertTo === 'USD' && currency === 'EUR') {
      numAmount = numAmount * 1.09
      currency = 'USD'
    } else if (convertTo === 'EUR' && currency === 'USD') {
      numAmount = numAmount / 1.09
      currency = 'EUR'
    }

    const symbol = currencySymbols[currency] || currency
    const position = settings.currency_symbol_position || 'before'
    
    const formattedAmount = numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })

    if (position === 'after') {
      return `${formattedAmount} ${symbol}`
    }
    return `${symbol}${formattedAmount}`
  }, [settings.default_currency, settings.currency_symbol_position])

  /**
   * Get currency symbol
   * @param {string} currencyCode - Optional currency code override
   * @returns {string} Currency symbol
   */
  const getCurrencySymbol = useCallback((currencyCode = null) => {
    const currency = currencyCode || settings.default_currency || 'USD'
    return currencySymbols[currency] || currency
  }, [settings.default_currency])

  /**
   * Get company logo URL
   * @returns {string} Full URL to company logo
   */
  /**
   * Get full logo URL from a path with cache busting
   * @param {string} path - Logo path
   * @returns {string} Full logo URL
   */
  const getLogoUrl = useCallback((path) => {
    if (!path || typeof path !== 'string') return null
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    const separator = cleanPath.includes('?') ? '&' : '?'
    return `${BaseUrl}${cleanPath}${separator}v=${logoVersion}`
  }, [logoVersion])

  /**
   * Get company logo URL
   * @returns {string} Full URL to company logo
   */
  const getCompanyLogoUrl = useCallback(() => {
    // Safety check for getLogoUrl
    if (typeof getLogoUrl !== 'function') return null;
    
    // Priority 1: explicitly uploaded company_logo in settings
    // Priority 2: company specific logo
    const logoSource = settings?.company_logo || company?.logo
    
    // FALLBACK: Aggressively blacklist known old/default logo paths to force the new logo
    if (!logoSource || 
        logoSource.includes('default-logo') || 
        logoSource.includes('ino-logo') || 
        logoSource.includes('1767') || // Blacklist old uploads from Feb/March
        logoSource.includes('1768')) {
      return null
    }
    
    return getLogoUrl(logoSource)
  }, [company?.logo, settings?.company_logo, getLogoUrl])

  /**
   * Update company info
   * @param {object} newCompanyInfo - New company data
   */
  const updateCompany = useCallback((newCompanyInfo) => {
    setCompany(prev => {
      const updated = { ...prev, ...newCompanyInfo }
      setTimeout(() => localStorage.setItem('companyInfo', JSON.stringify(updated)), 0)
      return updated
    })
    // CRITICAL FIX: Also sync settings.company_logo so getCompanyLogoUrl() in TopBar
    // picks up the new logo immediately (not just on next refreshSettings() call)
    if (newCompanyInfo.logo || newCompanyInfo.company_logo) {
      const logoValue = newCompanyInfo.company_logo || newCompanyInfo.logo
      setSettings(prev => {
        const updated = { ...prev, company_logo: logoValue }
        try { localStorage.setItem('cachedSettings', JSON.stringify(updated)) } catch (e) {}
        return updated
      })
      const newVersion = Date.now()
      setLogoVersion(newVersion)
      localStorage.setItem('logoVersion', String(newVersion))
    }
  }, [])

  /**
   * Update a single setting
   * @param {string} key - Setting key
   * @param {any} value - Setting value
   */
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  /**
   * Update multiple settings
   * @param {object} newSettings - New settings object
   */
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  /**
   * Refresh all settings from server
   */
  const refreshSettings = useCallback(async () => {
    const newVersion = Date.now()
    setLogoVersion(newVersion)
    localStorage.setItem('logoVersion', newVersion)
    // Force refresh bypasses cache staleness check
    await fetchCompanyAndSettings(true)
  }, [fetchCompanyAndSettings])

  /**
   * Get company info
   * @returns {object} Company information
   */
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
    }
  }, [company, settings, getCompanyLogoUrl])

  /**
   * Convert date to timezone
   * @param {string|Date} dateString - Date to convert
   * @returns {Date} Date in target timezone
   */
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
    // Company info
    company,
    updateCompany,
    getCompanyInfo,
    getCompanyLogoUrl,
    getLogoUrl,

    // Settings
    settings,
    loading,
    error,
    updateSetting,
    updateSettings,
    refreshSettings,

    // Formatters
    formatDate,
    formatTime,
    formatDateTime,
    formatCurrency,
    getCurrencySymbol,
    toTimezone,

    // Logo version for cache busting & forced re-renders
    logoVersion,

    // Options for selects
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
