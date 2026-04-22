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
let fixed = 0

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8')
  if (!content.includes('useLanguage()')) continue

  // Find the useLanguage destructure
  const destructureMatch = content.match(/const\s*\{([^}]+)\}\s*=\s*useLanguage\(\)/)
  if (!destructureMatch) continue

  const destructured = destructureMatch[1]
  
  // Skip if language already included
  if (/\blanguage\b/.test(destructured)) continue

  // Skip if it's aliased (e.g., language: currentLanguage)
  if (/language\s*:/.test(destructured)) continue

  // Now check: does this file reference `language` as a standalone variable?
  // Strip out:
  // 1. String literals
  // 2. Comments
  // 3. Object property accesses like formData.language, emp.language
  // 4. Object keys like language: ...
  let stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/\/\/.*$/gm, '')          // line comments
    .replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '""') // string literals

  // Find standalone `language` usage (not as property access or object key)
  // Pattern: word boundary, language, not preceded by . and not followed by :
  const standaloneUse = /(?<!\.)(?<!\w)\blanguage\b(?!\s*:)(?!\s*\?)/.test(stripped)
  
  // More specific: look for language used in expressions
  const usedInExpression = 
    /\blanguage\b\s*===/.test(stripped) ||
    /\blanguage\b\s*!==/.test(stripped) ||
    /\blanguage\b\s*==/.test(stripped) ||
    /,\s*language\s*\)/.test(stripped) ||  // passed as argument: func(x, language)
    /\(\s*language\s*\)/.test(stripped) ||  // passed alone: func(language)
    /\?\s*language\b/.test(stripped) ||     // ternary condition
    /\blanguage\b\s*\?/.test(stripped) ||   // ternary: language ? ...
    /toLocaleDateString\(language/.test(stripped) ||
    /toLocaleString\(language/.test(stripped)

  if (!usedInExpression) continue

  // Fix: add language to destructure
  const newDestructure = destructureMatch[0].replace(
    /const\s*\{([^}]+)\}\s*=\s*useLanguage\(\)/,
    (_, inner) => `const { ${inner.trim()}, language } = useLanguage()`
  )

  content = content.replace(destructureMatch[0], newDestructure)
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`✅ FIXED: ${path.relative(process.cwd(), filePath)}`)
  console.log(`   ${destructureMatch[0].substring(0, 70)} → added language`)
  fixed++
}

console.log(`\n✅ Total fixed: ${fixed}`)
