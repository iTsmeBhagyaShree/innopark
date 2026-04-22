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

  // Check if file uses language === 'de' or language === 'en' style comparisons
  const usesLangComparison = /language\s*===/.test(content) || /language\s*!==/.test(content)
  if (!usesLangComparison) continue

  // Check the useLanguage destructure
  const m = content.match(/const\s*\{([^}]+)\}\s*=\s*useLanguage\(\)/)
  if (!m) continue

  const destructured = m[1]
  if (/\blanguage\b/.test(destructured)) continue // already has language

  problems.push({ filePath, destructure: m[0] })
}

console.log(`Files needing fix: ${problems.length}`)
problems.forEach(p => {
  console.log(`  - ${path.relative(process.cwd(), p.filePath)}`)
  console.log(`    Current: ${p.destructure.substring(0, 80)}`)
})

// Auto-fix them
for (const { filePath, destructure } of problems) {
  let content = fs.readFileSync(filePath, 'utf8')
  const fixed = destructure.replace(
    /const\s*\{([^}]+)\}\s*=\s*useLanguage\(\)/,
    (_, inner) => `const { ${inner.trim()}, language } = useLanguage()`
  )
  content = content.replace(destructure, fixed)
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`FIXED: ${path.basename(filePath)}`)
}
