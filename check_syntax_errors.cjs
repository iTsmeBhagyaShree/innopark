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
let invalidFiles = 0

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  
  // Check for {t(' inside a string literal '' or ""
  // Pattern: '... {t(' ... '...} ...'
  const singleInSingle = /'[^']*\{t\('[^']*'\)[^']*'/g
  const doubleInDouble = /"[^"]*\{t\("[^"]*"\)[^"]*"/g
  // Check for {t(' inside backticks ` but without $
  const bracketInBacktick = /`[^`]*\{t\([^`]*`[^\$]/g
  
  if (singleInSingle.test(content) || doubleInDouble.test(content)) {
    console.log(`ERROR: Nested quotes in ${file}`)
    invalidFiles++
  }
}

console.log(`Found ${invalidFiles} files with potential quote nesting issues.`)
