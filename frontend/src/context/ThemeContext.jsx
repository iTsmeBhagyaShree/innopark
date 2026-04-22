import { createContext, useContext, useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'

const ThemeContext = createContext(null)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

const defaultTheme = {
  // Colors
  primaryDark: '#102D2C',
  primaryAccent: '#217E45',
  secondaryAccent: '#76AF88',
  mainBg: '#F0F1F1',
  primaryText: '#102D2C',
  secondaryText: '#767A78',
  mutedText: '#9A9A9C',
  warning: '#BCB474',
  danger: '#CC9CA4',

  // Fonts
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: {
    base: '16px',
    sm: '14px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
  },

  // Theme mode
  mode: 'light', // 'light' or 'dark'
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or use default
    const savedTheme = localStorage.getItem('appTheme')
    if (savedTheme) {
      try {
        return { ...defaultTheme, ...JSON.parse(savedTheme) }
      } catch (e) {
        return defaultTheme
      }
    }
    return defaultTheme
  })

  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

  // Load theme settings from database on mount
  useEffect(() => {
    const loadThemeFromSettings = async () => {
      try {
        const companyId = localStorage.getItem('companyId') || 1
        const response = await axiosInstance.get('/settings', { params: { company_id: companyId } })
        if (response.data.success) {
          const settingsData = response.data.data || []
          const settingsObj = {}

          // Transform settings array to object
          settingsData.forEach(setting => {
            settingsObj[setting.setting_key] = setting.setting_value
          })

          // Apply theme settings from database
          const themeUpdates = {}
          if (settingsObj.theme_mode) {
            themeUpdates.mode = settingsObj.theme_mode
          }
          if (settingsObj.font_family) {
            themeUpdates.fontFamily = settingsObj.font_family
          }
          if (settingsObj.primary_color) {
            themeUpdates.primaryAccent = settingsObj.primary_color
          }
          if (settingsObj.secondary_color) {
            themeUpdates.secondaryAccent = settingsObj.secondary_color
          }

          // Update theme if any settings were found
          if (Object.keys(themeUpdates).length > 0) {
            setTheme(prev => ({ ...prev, ...themeUpdates }))
          }
        }
      } catch (error) {
        console.error('Error loading theme from settings:', error)
        // Continue with localStorage theme if API fails
      } finally {
        setIsLoadingSettings(false)
      }
    }

    loadThemeFromSettings()
  }, [])

  // Apply theme to CSS variables and dark mode
  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    // Apply dark mode class to html element
    if (theme.mode === 'dark') {
      root.classList.add('dark')
      // Dark mode color overrides - comprehensive
      root.style.setProperty('--color-main-bg', '#1a1a1a')
      root.style.setProperty('--color-primary-text', '#ffffff')
      root.style.setProperty('--color-secondary-text', '#b0b0b0')
      root.style.setProperty('--color-muted-text', '#808080')
      root.style.setProperty('--color-card-bg', '#2d2d2d')
      root.style.setProperty('--color-sidebar-bg', '#1e1e1e')
      root.style.setProperty('--color-input-bg', '#333333')
      root.style.setProperty('--color-border', '#404040')
      root.style.setProperty('--color-hover-bg', '#3a3a3a')
      body.style.backgroundColor = '#1a1a1a'
      body.style.color = '#ffffff'
    } else {
      root.classList.remove('dark')
      // Light mode colors
      root.style.setProperty('--color-main-bg', theme.mainBg || '#F0F1F1')
      root.style.setProperty('--color-primary-text', theme.primaryText || '#102D2C')
      root.style.setProperty('--color-secondary-text', theme.secondaryText || '#767A78')
      root.style.setProperty('--color-muted-text', theme.mutedText || '#9A9A9C')
      root.style.setProperty('--color-card-bg', '#ffffff')
      root.style.setProperty('--color-sidebar-bg', '#102D2C')
      root.style.setProperty('--color-input-bg', '#ffffff')
      root.style.setProperty('--color-border', '#e5e7eb')
      root.style.setProperty('--color-hover-bg', '#f3f4f6')
      body.style.backgroundColor = theme.mainBg || '#F0F1F1'
      body.style.color = theme.primaryText || '#102D2C'
    }

    // Set CSS variables (always apply, dark mode will override some)
    root.style.setProperty('--color-primary-dark', theme.primaryDark)
    root.style.setProperty('--color-primary-accent', theme.primaryAccent)
    root.style.setProperty('--color-secondary-accent', theme.secondaryAccent)
    root.style.setProperty('--color-warning', theme.warning)
    root.style.setProperty('--color-danger', theme.danger)

    // Apply font family - use the value directly as it comes from settings
    // Values are like 'Poppins, sans-serif' or 'Inter, sans-serif'
    let fontFamily = theme.fontFamily || "'Inter', sans-serif"

    // If it's just a font name without fallback, add sans-serif
    if (fontFamily && !fontFamily.includes(',')) {
      fontFamily = `'${fontFamily}', sans-serif`
    }

    // Dynamic Google Font Loading
    const fontName = fontFamily.split(',')[0].replace(/['"]/g, '').trim()
    const googleFonts = {
      'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
      'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
      'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
      'Open Sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap',
      'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
      'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
    }

    if (googleFonts[fontName]) {
      let link = document.getElementById('dynamic-google-font')
      if (!link) {
        link = document.createElement('link')
        link.id = 'dynamic-google-font'
        link.rel = 'stylesheet'
        document.head.appendChild(link)
      }
      // Only update if changed to prevent flickering/reloading
      if (link.href !== googleFonts[fontName]) {
        link.href = googleFonts[fontName]
      }
    }

    root.style.setProperty('--font-family', fontFamily)
    root.style.setProperty('--font-size-base', theme.fontSize.base)

    // Apply font family to body and all elements
    body.style.fontFamily = fontFamily

    // Also apply to html element for full coverage
    root.style.fontFamily = fontFamily

    // Save to localStorage
    localStorage.setItem('appTheme', JSON.stringify(theme))
  }, [theme])

  const updateTheme = (updates) => {
    setTheme(prev => {
      const newTheme = { ...prev, ...updates }
      return newTheme
    })
  }

  const resetTheme = () => {
    setTheme(defaultTheme)
  }

  const value = {
    theme,
    updateTheme,
    resetTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeContext

