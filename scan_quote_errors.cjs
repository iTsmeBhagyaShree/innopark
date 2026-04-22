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
  
  // Look for: || '... ' ... ' ... ' }
  // Specifically strings that are incorrectly truncated because of unescaped quotes
  // Regex: || ' followed by text that contains another ' before reaching }
  const regex = /\|\|\s*'([^'}]+'[^'}]*)'/g
  
  let match
  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0]
    const inner = match[1]
    
    // If it's a JSX attribute like label={...} it might be problematic if not handled right
    console.log(`POTENTIAL ERROR in ${path.relative(process.cwd(), file)}:`)
    console.log(`   ${fullMatch}`)
    foundCount++
  }
}

console.log(`\nScan finished. Found ${foundCount} potential quote syntax errors.`)
