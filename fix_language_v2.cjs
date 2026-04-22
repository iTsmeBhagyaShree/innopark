const fs = require('fs')
const path = require('path')

const srcDir = path.join(process.cwd(), 'frontend', 'src')

function walkDir(dir) {
  const files = []
  const items = fs.readdirSync(dir)
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...walkDir(fullPath))
    } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
      files.push(fullPath)
    }
  }
  return files
}

const allFiles = walkDir(srcDir)
let fixed = 0

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf8')

  // Find all useLanguage() destructures
  const destructureRegex = /const\s*\{([^}]+)\}\s*=\s*useLanguage\(\)/g
  let match
  let changed = false

  while ((match = destructureRegex.exec(content)) !== null) {
    const destructured = match[1]
    const fullMatch = match[0]

    // If 'language' is NOT already in the destructure
    if (!/\blanguage\b/.test(destructured)) {
      // Check if 'language' is actually used in the file as a standalone variable
      // (not part of changeLanguage, currentLanguage, etc. - those are separate)
      // We need to check if `language` is used as a variable after this destructure
      
      // Simple heuristic: check if 'language ===' or 'language ===' or 'language ?' appears
      // indicating it's used as a conditional variable
      const hasLanguageUsedAsVar = 
        /language\s*===/.test(content) ||
        /language\s*!==/.test(content) ||
        /\blanguage\s*\?/.test(content) ||
        /toLocaleDateString\([^)]*language/.test(content) ||
        /\.toLocaleString\([^)]*language/.test(content)

      if (hasLanguageUsedAsVar) {
        // Replace const { t } = useLanguage() -> const { t, language } = useLanguage()
        // But be careful not to break aliases like { language: currentLanguage }
        const newDestructure = fullMatch.replace(
          /const\s*\{([^}]+)\}\s*=\s*useLanguage\(\)/,
          (m, inner) => {
            // Don't add if alias already present
            if (/\blanguage\b/.test(inner)) return m
            return `const { ${inner.trim()}, language } = useLanguage()`
          }
        )
        
        if (newDestructure !== fullMatch) {
          content = content.replace(fullMatch, newDestructure)
          changed = true
          console.log(`FIXED: ${path.relative(process.cwd(), filePath)} → added 'language' to ${fullMatch.substring(0, 50)}...`)
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8')
    fixed++
  }
}

console.log(`\nTotal files fixed: ${fixed}`)
