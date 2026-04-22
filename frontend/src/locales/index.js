import en from './en.json'
import de from './de.json'
import es from './es.json'
import fr from './fr.json'
import ar from './ar.json'
import { languageConfig } from '../config/languageConfig'

export const translations = {
  en,
  de,
  es,
  fr,
  ar,
}

const allLanguages = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
]

export const languages = allLanguages.filter((l) =>
  (languageConfig.AVAILABLE_LANGUAGES || []).includes(l.code),
)

export default translations
