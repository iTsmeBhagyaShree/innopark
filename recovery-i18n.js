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
let totalChanged = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix 1: {t('key')} || 'fallback'} -> {t('key') || 'fallback'}
  content = content.replace(/\{\s*t\(([^)]+)\)\s*\}\s*\|\|\s*(['"][^'"]*['"])\s*\}/g, '{t($1) || $2}');

  // Fix 2: {t('key')} || 'fallback' -> {t('key') || 'fallback'} (missing trailing brace)
  // This might be tricky if it's valid JS outside a tag.
  // But inside JSX tags, we usually want it together.
  
  // Fix 3: t('key') || 'fallback'} (missing opening {)
  content = content.replace(/([^A-Za-z0-9_{])t\(([^)]+)\)\s*\|\|\s*(['"][^'"]*['"])\s*\}/g, '$1{t($2) || $3}');

  // Fix 4: any text that looks like 'auto.auto_...') || '...' (missing the {t( part)
  content = content.replace(/['"](auto\.auto_[^'"]+)['"]\s*\)\s*\|\|\s*(['"][^'"]*['"])\s*\}/g, "{t('$1') || $2}");

  // Fix 5: standalone auto key showing up in UI with fallback
  // Example: auto.auto_3518f894 || 'USD'}
  content = content.replace(/([^A-Za-z0-9_{])(auto\.auto_[A-Za-z0-9_]+)\s*\|\|\s*(['"][^'"]*['"])\s*\}/g, "$1{t('$2') || $3}");

  // Fix 6: ensure NO literal || 'fallback'} exists inside tags
  // This regex finds content between > and <
  content = content.replace(/>([^<]*?)\s*\|\|\s*(['"][^'"]*['"])\s*\}/g, (match, prefix, fallback) => {
      // If the prefix ends with a translation-sounding thing, wrap it.
      if (prefix.includes('auto.auto_')) {
          const key = prefix.match(/auto\.auto_[A-Za-z0-9_]+/)[0];
          return `>{t('${key}') || ${fallback}}`;
      }
      return match;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Deep recovery: ${file}`);
    totalChanged++;
  }
});

console.log(`\nRecovery complete. Fixed ${totalChanged} files.`);
