const fs = require('fs');
const path = require('path');

const srcDirs = [
  path.join(process.cwd(), 'frontend', 'src')
];

function walkDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (item === 'node_modules' || item.startsWith('.')) continue;
    if (fs.statSync(full).isDirectory()) results.push(...walkDir(full));
    else if (full.endsWith('.jsx') || full.endsWith('.js')) results.push(full);
  }
  return results;
}

let allFiles = [];
for (const d of srcDirs) {
  allFiles.push(...walkDir(d));
}

async function run() {
  let filesModified = 0;

  for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Replace {t('key') || 'Fallback'} with {t('key')}
    content = content.replace(/{t\(['"]([^'"]+)['"]\)\s*\|\|\s*['"]([^'"]+)['"]}/g, "{t('$1')}");
    
    // Replace t('key') || 'Fallback' in attributes
    content = content.replace(/t\(['"]([^'"]+)['"]\)\s*\|\|\s*['"]([^'"]+)['"]/g, "t('$1')");

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      filesModified++;
    }
  }

  console.log(`Fallback fix completed! Modified ${filesModified} files.`);
}

run();
