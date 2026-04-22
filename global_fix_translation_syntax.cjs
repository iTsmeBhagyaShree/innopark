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
  let originalContent = content

  // Match anything like: = ` ... {t('auto.key') || 'Fallback'} ... `
  // We need to change to: = ` ... ${t('auto.key') || 'Fallback'} ... `
  const templateRegex = /(`[\s\S]*?){t\('auto\.([^']+)'\)\s*\|\|\s*'([^']*)'}([\s\S]*?`)/g
  content = content.replace(templateRegex, (match, p1, p2, p3, p4) => {
    return `${p1}\${t('auto.${p2}') || '${p3}'}${p4}`
  })

  // Match anything like: = ' ... {t('auto.key') || 'Fallback'} ... '
  // We need to change to: = ' ... ' + (t('auto.key') || 'Fallback') + ' ... '
  // Note: This is trickier because of the single quotes inside.
  // We look for a string literal that contains {t('auto. ... '}
  const stringRegex = /'([^']*?){t\('auto\.([^']+)'\)\s*\|\|\s*'([^']*)'}([^']*?)'/g
  content = content.replace(stringRegex, (match, p1, p2, p3, p4) => {
     return `'${p1}' + (t('auto.${p2}') || '${p3}') + '${p4}'`
  })

  if (content !== originalContent) {
    console.log(`FIXED: ${path.relative(process.cwd(), file)}`)
    fs.writeFileSync(file, content, 'utf8')
    fixedCount++
  }
}

console.log(`\nGlobal fix finished. Updated ${fixedCount} files.`)
