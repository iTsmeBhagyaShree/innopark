const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const srcDirs = [
  path.join(process.cwd(), 'frontend', 'src', 'app', 'admin', 'pages'),
  path.join(process.cwd(), 'frontend', 'src', 'app', 'superadmin', 'pages'),
  path.join(process.cwd(), 'frontend', 'src', 'app', 'employee', 'pages'),
  path.join(process.cwd(), 'frontend', 'src', 'components')
]

const dePath = path.join(process.cwd(), 'frontend', 'src', 'locales', 'de.json')
const deData = JSON.parse(fs.readFileSync(dePath, 'utf8'))
if (!deData.auto) deData.auto = {}

function walkDir(dir) {
  let results = []
  if (!fs.existsSync(dir)) return results;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    if (fs.statSync(full).isDirectory()) results.push(...walkDir(full))
    else if (full.endsWith('.jsx')) results.push(full)
  }
  return results
}

let allFiles = []
for (const d of srcDirs) {
  allFiles.push(...walkDir(d))
}

let newKeysAdded = 0
let filesModified = 0

// Basic translation dictionary for common words found in CRM to ensure good German
const dict = {
  "Search": "Suchen",
  "Contact Support": "Support kontaktieren",
  "Need More Help": "Brauchen Sie Hilfe?",
  "Submit Feedback": "Feedback senden",
  "Item": "Artikel",
  "Quantity": "Menge",
  "Qty": "Menge",
  "Rate": "Preis",
  "Total": "Gesamt",
  "Sub Total": "Zwischensumme",
  "Sub Total:": "Zwischensumme:",
  "Discount": "Rabatt",
  "Discount:": "Rabatt:",
  "Tax": "Steuer",
  "Tax:": "Steuer:",
  "Total Amount": "Gesamtbetrag",
  "Total:": "Gesamt:",
  "Valid Until": "Gültig bis",
  "Estimate To": "Angebot an",
  "Estimate Date:": "Angebotsdatum:",
  "Valid until:": "Gültig bis:",
  "Preview": "Vorschau",
  "Print": "Drucken",
  "View PDF": "PDF anzeigen",
  "Download PDF": "PDF herunterladen",
  "DESCRIPTION": "BESCHREIBUNG",
  "TERMS & CONDITIONS": "ALLGEMEINE GESCHÄFTSBEDINGUNGEN",
  "Signer Info": "Unterzeichner-Info",
  "Name": "Name",
  "Email": "E-Mail",
  "Additional Information": "Zusätzliche Informationen",
  "No tasks yet": "Noch keine Aufgaben"
}

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8')
  
  // ONLY safe if file has useLanguage and t
  if (!content.includes('useLanguage()')) continue
  if (!content.includes('{ t') && !content.includes('t:')) continue

  let originalContent = content

  // Match tags with text inside: >Text<
  // Safe Regex to find visible texts between closed tags avoiding nested components
  const regex = />([A-Z][a-zA-Z0-9\s,&.:!?'-]+)</g
  
  content = content.replace(regex, (match, innerText) => {
    let text = innerText.trim()
    if (text.length < 2) return match
    
    // Ignore if it's already translated or looks like code/math/variables
    if (text.includes('}}') || text.includes('/>') || text.includes('&&') || text === 'N/A' || text === 'K.A.') return match

    // Create a safe key
    const hash = crypto.createHash('md5').update(text).digest('hex').substring(0, 8)
    const key = `auto_${hash}`
    
    // Translate if in dict, else use text itself (or use Google Translate manually later)
    if (!deData.auto[key]) {
      deData.auto[key] = dict[text] || text
      newKeysAdded++
    }

    // Replace with t('auto.key') || 'Original'
    return `>{t('auto.${key}') || '${text}'}<`
  })

  // Match placeholder="Text"
  const attrRegex = /placeholder="([A-Z][a-zA-Z0-9\s,&.:!?'-]+)"/g
  content = content.replace(attrRegex, (match, innerText) => {
    let text = innerText.trim()
    if (text.length < 2) return match
    const hash = crypto.createHash('md5').update(text).digest('hex').substring(0, 8)
    const key = `auto_${hash}`
    if (!deData.auto[key]) {
      deData.auto[key] = dict[text] || text
      newKeysAdded++
    }
    return `placeholder={t('auto.${key}') || "${text}"}`
  })

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8')
    filesModified++
  }
}

fs.writeFileSync(dePath, JSON.stringify(deData, null, 2))
console.log(`Auto-translator completed! Modified ${filesModified} files and added ${newKeysAdded} keys to de.json.`)
