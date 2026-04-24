const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const srcDirs = [
  path.join(process.cwd(), 'frontend', 'src', 'app'),
  path.join(process.cwd(), 'frontend', 'src', 'components'),
  path.join(process.cwd(), 'frontend', 'src', 'context'),
  path.join(process.cwd(), 'frontend', 'src', 'layouts'),
  path.join(process.cwd(), 'frontend', 'src', 'website')
]

const dePath = path.join(process.cwd(), 'frontend', 'src', 'locales', 'de.json')
const enPath = path.join(process.cwd(), 'frontend', 'src', 'locales', 'en.json')
let deData = {}
let enData = {}
try { deData = JSON.parse(fs.readFileSync(dePath, 'utf8')) } catch (e) {}
try { enData = JSON.parse(fs.readFileSync(enPath, 'utf8')) } catch (e) {}

if (!deData.auto) deData.auto = {}
if (!enData.auto) enData.auto = {}

function walkDir(dir) {
  let results = []
  if (!fs.existsSync(dir)) return results;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    if (fs.statSync(full).isDirectory()) results.push(...walkDir(full))
    else if (full.endsWith('.jsx') || full.endsWith('.js')) results.push(full)
  }
  return results
}

let allFiles = []
for (const d of srcDirs) {
  allFiles.push(...walkDir(d))
}

let newKeysAdded = 0
let filesModified = 0

const commonDe = {
  "successfully": "erfolgreich",
  "not found": "nicht gefunden",
  "required": "erforderlich",
  "failed to": "Fehler beim",
  "invalid": "ungültig",
  "already exists": "existiert bereits",
  "created": "erstellt",
  "updated": "aktualisiert",
  "deleted": "gelöscht",
  "error": "Fehler",
  "saved": "gespeichert",
  "restored": "wiederhergestellt"
};

function autoTranslate(text) {
    if (!text) return text;
    let t = text;
    for (const [en, de] of Object.entries(commonDe)) {
        const regex = new RegExp(`\\b${en}\\b`, 'gi');
        t = t.replace(regex, de);
    }
    if (t !== text) {
        return t.charAt(0).toUpperCase() + t.slice(1);
    }
    return t; 
}

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8')
  
  if (!content.includes('toast.') && !content.includes('alert(') && !content.includes('confirm(')) continue

  let originalContent = content

  // Match toast.success('...') or toast.error('...')
  const toastRegex = /(toast\.(?:success|error)\s*\(\s*)(['"])(.*?)\2/g
  content = content.replace(toastRegex, (match, prefix, quote, text) => {
    if (!text || text.includes('`') || text.includes('$') || text.trim() === '') return match
    
    // Create a safe key
    const hash = crypto.createHash('md5').update(text).digest('hex').substring(0, 8)
    const key = `toast_${hash}`
    
    if (!deData.auto[key]) {
      deData.auto[key] = autoTranslate(text)
      newKeysAdded++
    }
    if (!enData.auto[key]) {
      enData.auto[key] = text
    }

    // Replace with t('auto.toast_hash')
    return `${prefix}t('auto.${key}')`
  })

  // We should also ensure 't' is imported/available if not already
  if (content !== originalContent) {
      if (!content.includes('useLanguage') && !content.includes('import { useTranslation }')) {
         // It might cause reference error if `t` is not defined in this scope.
         // We can fallback to just doing nothing if useLanguage isn't imported to avoid breaking the build.
         if (content.includes('const { t') || content.includes('const {t')) {
             fs.writeFileSync(file, content, 'utf8')
             filesModified++
         } else {
             // Don't replace if `t` is not available
         }
      } else {
          fs.writeFileSync(file, content, 'utf8')
          filesModified++
      }
  }
}

fs.writeFileSync(dePath, JSON.stringify(deData, null, 2))
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2))
console.log(`Toast auto-translator completed! Modified ${filesModified} files and added ${newKeysAdded} keys to de.json.`)
