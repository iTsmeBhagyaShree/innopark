import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations, languages } from '../locales'
import { languageConfig } from '../config/languageConfig'
import { useSettings } from './SettingsContext'

const LanguageContext = createContext()

/**
 * Custom hook to use the language context
 */
export const useLanguage = () => {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

export const LanguageProvider = ({ children }) => {
    const { settings } = useSettings()

    // localStorage > company settings > languageConfig (default German for this product)
    const [language, setLanguage] = useState(() => {
        const stored = localStorage.getItem('language')
        if (stored) return stored
        return settings.default_language || languageConfig.DEFAULT_LANGUAGE || 'de'
    })

    // Sync state when language changes
    useEffect(() => {
        localStorage.setItem('language', language)
        document.documentElement.lang = language
        const langConfig = languages.find(l => l.code === language) || languages[0]
        document.documentElement.dir = langConfig.dir || 'ltr'
        setIsRTL(langConfig.dir === 'rtl')
    }, [language])

    // State to store current translations object
    const [currentTranslations, setCurrentTranslations] = useState(
        translations[language] || translations[languageConfig.DEFAULT_LANGUAGE] || translations.de || translations.en
    )
    const [isRTL, setIsRTL] = useState(false)

    // Load translations whenever language changes
    useEffect(() => {
        const loadTranslations = async () => {
            try {
                // In a real production setup, this could be an API call
                // For now, we use our imported translation objects
                const newTranslations = translations[language] || translations[languageConfig.DEFAULT_LANGUAGE] || translations.de || translations.en
                setCurrentTranslations(newTranslations)
            } catch (error) {
                console.error('Failed to load translations:', error)
                setCurrentTranslations(translations[languageConfig.DEFAULT_LANGUAGE] || translations.de || translations.en)
            }
        }
        loadTranslations()
    }, [language])

    // Sync with global settings if it changes
    useEffect(() => {
        if (settings.default_language && settings.default_language !== language) {
            // Only sync if localStorage is empty or we haven't manually changed it in this session
            const stored = localStorage.getItem('language')
            if (!stored) {
                setLanguage(settings.default_language)
            }
        }
    }, [settings.default_language])

    /**
     * Translate a key into the current language with Smart Fallbacks
     */
    const t = useCallback((key) => {
        if (!key) return ''

        // 1. Direct Case-Insensitive Lookup
        const keys = key.toLowerCase().split('.')

        const findValue = (obj, pathParts) => {
            let res = obj;
            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];
                if (!res || typeof res !== 'object' || Array.isArray(res)) return null;
                const allKeys = Object.keys(res);
                const matches = allKeys.filter((k) => k.toLowerCase() === part);
                if (matches.length === 0) return null;
                // JSON may have e.g. "Contacts" (string) and "contacts" (nested object) at the same
                // level — when the path continues, we must use the key that holds an object, not a string.
                let actualKey;
                if (i < pathParts.length - 1) {
                    const forNested = matches.find((k) => {
                        const v = res[k];
                        return v != null && typeof v === 'object' && !Array.isArray(v);
                    });
                    actualKey = forNested || matches[0];
                } else {
                    actualKey = matches[0];
                }
                res = res[actualKey];
            }
            return res;
        };

        // Attempt 1: Exact Match
        let result = findValue(currentTranslations, keys);

        // Attempt 2: Common Scope Check (e.g. t('save') -> common.save)
        if (result === null && !key.includes('.')) {
            result = findValue(currentTranslations, ['common', key.toLowerCase()]);
        }

        // Attempt 3: English fallback (only if current locale has no string — keeps rare keys usable)
        if (result === null && language !== 'en') {
            result = findValue(translations.en, keys) || findValue(translations.en, ['common', key.toLowerCase()]);
        }

        // Final Result Processing
        if (result !== null) {
            if (typeof result === 'string') return result;
            if (typeof result === 'object' && result.title) return result.title;
        }

        // Return the key itself as a last resort, formatted nicely
        return key.includes('.') ? key.split('.').pop() : key.charAt(0).toUpperCase() + key.slice(1);
    }, [currentTranslations, language])

    /**
     * Change the application language
     */
    const changeLanguage = (langCode) => {
        if (translations[langCode]) {
            setLanguage(langCode)
            localStorage.setItem('language', langCode)
        }
    }

    const value = {
        t,
        language,
        changeLanguage,
        languages,
        isRTL
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    )
}

export default LanguageContext
