/**
 * ============================================
 * LANGUAGE CONFIGURATION FILE
 * ============================================
 * 
 * This is the ONLY file you need to change to switch languages!
 * 
 * To change the default language:
 * - Change DEFAULT_LANGUAGE to 'en' for English
 * - Change DEFAULT_LANGUAGE to 'de' for German
 * 
 * Example:
 * For English: DEFAULT_LANGUAGE: 'en'
 * For German:  DEFAULT_LANGUAGE: 'de'
 */

export const languageConfig = {
    // ⚠️ CHANGE THIS VALUE TO SWITCH LANGUAGE ⚠️
    // 'en' = English
    // 'de' = German (Deutsch)
    DEFAULT_LANGUAGE: 'de',  // 👈 Change this to 'en' or 'de'

    // ⚠️ DISABLE LANGUAGE SWITCHING ⚠️
    // Set to false to hide language dropdown and lock the language
    // Set to true to allow users to change language
    ALLOW_LANGUAGE_CHANGE: true,

    // Available languages in your application
    AVAILABLE_LANGUAGES: ['de', 'en', 'fr', 'ar'],

    // Language names for display
    LANGUAGE_NAMES: {
        de: 'Deutsch',
        en: 'English',
        fr: 'Français',
        ar: 'العربية'
    }
}

export default languageConfig
