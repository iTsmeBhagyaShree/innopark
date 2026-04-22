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
let foundCount = 0

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  
  // Regex to find: {t('auto.something') || 'text with ' in it' }
  // We look for t('auto. followed by any chars, then || ', then text that has an apostrophe before the closing ' and }
  const regex = /\{t\('auto\.[^']+'\)\s*\|\|\s*'([^'}]+'[^'}]*)'\}/g
  
  let match
  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0]
    console.log(`FIXING ERROR in ${path.relative(process.cwd(), file)}:`)
    console.log(`   Original: ${fullMatch}`)
    
    // Fix: replaced single quotes around fallback with double quotes
    const innerText = match[1]
    const fixed = fullMatch.replace(`|| '${innerText}'`, `|| "${innerText}"`)
    console.log(`   Fixed:    ${fixed}\n`)
    
    // Update content
    const newContent = content.replace(fullMatch, fixed)
    fs.writeFileSync(file, newContent, 'utf8')
    foundCount++
  }
}

console.log(`\nScan finished. Fixed ${foundCount} quote syntax errors.`)
