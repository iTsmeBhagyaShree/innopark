const fs = require('fs')
const path = require('path')

const srcDir = path.join(process.cwd(), 'frontend', 'src')

function walkDir(dir) {
  let results = []
  if (!fs.existsSync(dir)) return results
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    if (fs.statSync(full).isDirectory()) results.push(...walkDir(full))
    else if (full.endsWith('.jsx')) results.push(full)
  }
  return results
}

const files = walkDir(srcDir)
let fixedCount = 0

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content

  // 1. First, remove any corrupted patterns like $', + (
  // Replacing "$' + (t('auto." with "${t('auto."
  content = content.replace(/\$\'\s*\+\s*\(t\(\'auto\./g, "${t('auto.")
  // Closing part: ') + '" or ') + '
  // We need to be careful. Match: ') + ' ... '
  // Actually, let's just look for the whole corrupted pattern
  // Pattern: $' + (t('auto.KEY') || 'FALLBACK') + '
  content = content.replace(/\$\'\s*\+\s*\(t\(\'auto\.([^']+)\'\)\s*\|\|\s*'([^']*)'\)\s*\+\s*\'/g, (match, key, fallback) => {
    return `\${t('auto.${key}') || '${fallback}'}`
  })

  // 2. Fix the non-corrupted but incorrect patterns {t('auto...')} inside backticks
  content = content.replace(/(`[\s\S]*?`)/g, (template) => {
    // If it has {t('auto... but not following $, fix it
    return template.replace(/([^\$])\{t\('auto\./g, "$1${t('auto.")
  })

  // 3. Fix patterns inside single quotes: ' ... {t('auto...')} ... '
  content = content.replace(/'([^']*?)\{t\('auto\.([^']+)'\)\s*\|\|\s*'([^']*)'\}([^']*?)'/g, (match, p1, p2, p3, p4) => {
     return `'${p1}' + (t('auto.${p2}') || '${p3}') + '${p4}'`
  })

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8')
    fixedCount++
  }
}

console.log(`Final cleanup finished. Updated ${fixedCount} files.`)
