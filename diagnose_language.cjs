const fs = require('fs')
const path = require('path')

const srcDir = path.join(process.cwd(), 'frontend', 'src')

function walkDir(dir) {
  const results = []
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    if (fs.statSync(full).isDirectory()) results.push(...walkDir(full))
    else if (item.endsWith('.jsx') || item.endsWith('.js')) results.push(full)
  }
  return results
}

const files = walkDir(srcDir)

console.log('=== Files using language variable but may not have it in useLanguage() ===\n')

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8')
  if (!content.includes('useLanguage()')) continue

  const destructureMatch = content.match(/const\s*\{([^}]+)\}\s*=\s*useLanguage\(\)/)
  if (!destructureMatch) continue

  const destructured = destructureMatch[1]
  if (/\blanguage\b/.test(destructured)) continue

  // Count occurrences of standalone 'language' 
  const matches = content.match(/\blanguage\b/g) || []
  
  if (matches.length > 0) {
    const relPath = path.relative(process.cwd(), filePath)
    console.log(`📄 ${relPath} (${matches.length} occurrences)`)
    console.log(`   Destructure: ${destructureMatch[0].substring(0, 80)}`)
    
    // Show context lines
    const lines = content.split('\n')
    lines.forEach((line, i) => {
      if (/\blanguage\b/.test(line) && !/\/\//.test(line.substring(0, line.search(/\blanguage\b/)))) {
        console.log(`   Line ${i+1}: ${line.trim().substring(0, 100)}`)
      }
    })
    console.log()
  }
}
