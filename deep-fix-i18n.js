const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.jsx') || dirFile.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
}

const files = walkSync(srcDir);
let totalReplaced = 0;
let filesChanged = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Pattern 1: {t('key')} || 'fallback'}
  // Should be: {t('key') || 'fallback'}
  const pattern1 = /\{\s*t\(([^)]+)\)\s*\}\s*\|\|\s*(['"][^'"]*['"])\s*\}/g;
  content = content.replace(pattern1, (match, key, fallback) => {
    totalReplaced++;
    return `{t(${key}) || ${fallback}}`;
  });

  // Pattern 2: t('key') || 'fallback'} (missing opening {)
  // Should be: {t('key') || 'fallback'}
  const pattern2 = />\s*t\(([^)]+)\)\s*\|\|\s*(['"][^'"]*['"])\s*\}/g;
  content = content.replace(pattern2, (match, key, fallback) => {
    totalReplaced++;
    return `>{t(${key}) || ${fallback}}`;
  });

  // Pattern 3: t('key')} (missing opening {)
  // Should be: {t('key')}
  const pattern3 = />\s*t\(([^)]+)\)\s*\}/g;
  content = content.replace(pattern3, (match, key) => {
    totalReplaced++;
    return `>{t(${key})}`;
  });
  
  // Cleanup any potential double braces like {{t(...) || '...'}}
  const patternDouble = /\{\{\s*t\(([^)]+)\)\s*(\|\|\s*['"][^'"]*['"]\s*)?\}\}/g;
  content = content.replace(patternDouble, (match, key, fallback) => {
    totalReplaced++;
    return `{t(${key})${fallback || ''}}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Deep fixed: ${file}`);
    filesChanged++;
  }
});

console.log(`\nGlobal audit complete. Fixed ${totalReplaced} corrupted translation nodes across ${filesChanged} files.`);
