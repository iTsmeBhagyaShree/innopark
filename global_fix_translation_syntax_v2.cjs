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

  // 1. Fix template literals (backticks)
  // Find all backtick blocks first
  content = content.replace(/(`[\s\S]*?`)/g, (template) => {
    // Inside a template literal, if we find {t('auto...'), we replace { with ${
    return template.replace(/\{t\('auto\./g, "${t('auto.")
  })

  // 2. Fix single-quoted strings
  // This is harder. Let's look for known pattern '{t('auto...')}
  content = content.replace(/'([^']*?)\{t\('auto\.([^']+)'\)\s*\|\|\s*'([^']*)'\}([^']*?)'/g, (match, p1, p2, p3, p4) => {
     // Check if it's already fixed (contains +)
     if (match.includes("' + (")) return match
     return `'${p1}' + (t('auto.${p2}') || '${p3}') + '${p4}'`
  })
  
  // 3. Fix double-quoted strings (less likely but possible)
  content = content.replace(/"([^"]*?)\{t\('auto\.([^']+)'\)\s*\|\|\s*'([^']*)'\}([^"]*?)"/g, (match, p1, p2, p3, p4) => {
     return `"${p1}" + (t('auto.${p2}') || "${p3}") + "${p4}"`
  })

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8')
    fixedCount++
  }
}

console.log(`Global fix finished. Updated ${fixedCount} files.`)
