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
const problems = []

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8')

  // More comprehensive: check if 'language' appears as a standalone variable
  const langMatches = content.match(/\blanguage\b/g) || []
  if (langMatches.length < 2) continue // needs at least 2: declaration + usage

  const hasUseLanguage = content.includes('useLanguage()')
  if (!hasUseLanguage) continue

  // Get ALL useLanguage destructures in the file
  const allDestructures = [...content.matchAll(/const\s*\{([^}]+)\}\s*=\s*useLanguage\(\)/g)]
  
  for (const m of allDestructures) {
    const destructured = m[1]
    if (!/\blanguage\b/.test(destructured)) {
      // Language is missing from this destructure
      // Check if language is actually referenced in the broader file context
      // by looking for patterns like: language === , language ?, toLocaleDateString(language
      const usedAsVar = content.includes(`language === `) || 
                        content.includes(`language !==`) ||
                        content.includes(`language ?`) || 
                        content.includes(`(language)`) ||
                        content.includes(`, language `) ||
                        /toLocaleDateString\(language/.test(content) ||
                        /toLocaleString\(language/.test(content)
      
      if (usedAsVar) {
        problems.push({ filePath, destructure: m[0], index: m.index })
        break
      }
    }
  }
}

console.log(`Files needing fix: ${problems.length}`)
if (problems.length === 0) {
  // Let's also do a broader dump
  console.log('\n--- Broader scan: files using language as var ---')
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8')
    if (!content.includes('useLanguage()')) continue
    
    // Find all places where 'language' appears standalone
    const vars = content.match(/\blanguage\b(?!\s*:)/g) || []
    if (vars.length < 2) continue
    
    const m = content.match(/const\s*\{([^}]+)\}\s*=\s*useLanguage\(\)/)
    if (m && !/\blanguage\b/.test(m[1])) {
      console.log(`  POTENTIAL: ${path.relative(process.cwd(), filePath)} → ${m[0].substring(0,60)}`)
    }
  }
}

problems.forEach(p => {
  const content = fs.readFileSync(p.filePath, 'utf8')
  const fixed = content.replace(p.destructure, 
    p.destructure.replace(/const\s*\{([^}]+)\}\s*=\s*useLanguage\(\)/, 
      (_, inner) => `const { ${inner.trim()}, language } = useLanguage()`
    )
  )
  fs.writeFileSync(p.filePath, fixed, 'utf8')
  console.log(`FIXED: ${path.basename(p.filePath)}`)
})
