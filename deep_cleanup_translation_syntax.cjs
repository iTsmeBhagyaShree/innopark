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

  // Match: ${t('auto.KEY') || 'FALLBACK') + '
  // Replace with: ${t('auto.KEY') || 'FALLBACK'}
  content = content.replace(/\$\{t\('auto\.[^']+'\)\s*\|\|\s*'[^']*'\)\s*\+\s*\'/g, (match) => {
    // Remove the trailing ) + '
    return match.replace(/\)\s*\+\s*\'$/, '}')
  })

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8')
    fixedCount++
  }
}

console.log(`Deep cleanup finished. Updated ${fixedCount} files.`)
