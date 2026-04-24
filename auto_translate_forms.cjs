const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const srcDirs = [
  path.join(process.cwd(), 'frontend', 'src', 'app'),
  path.join(process.cwd(), 'frontend', 'src', 'components'),
  path.join(process.cwd(), 'frontend', 'src', 'auth'),
  path.join(process.cwd(), 'frontend', 'src', 'website')
];

const dePath = path.join(process.cwd(), 'frontend', 'src', 'locales', 'de.json');
const enPath = path.join(process.cwd(), 'frontend', 'src', 'locales', 'en.json');
let deData = JSON.parse(fs.readFileSync(dePath, 'utf8'));
let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

if (!deData.auto) deData.auto = {};
if (!enData.auto) enData.auto = {};

function walkDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) results.push(...walkDir(full));
    else if (full.endsWith('.jsx') || full.endsWith('.js')) results.push(full);
  }
  return results;
}

let allFiles = [];
for (const d of srcDirs) {
  allFiles.push(...walkDir(d));
}

const attributesToTranslate = ['label', 'placeholder', 'title', 'aria-label', 'buttonText', 'headerText', 'footerText'];

function getTranslationKey(text) {
  const hash = crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
  const safeText = text.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
  return `form_${safeText}_${hash}`;
}

async function translateText(text) {
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=de&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0][0][0];
  } catch (e) {
    return text; // Fallback to English if translation fails
  }
}

async function run() {
  let filesModified = 0;
  let keysAdded = 0;

  for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Check if useLanguage is imported
    const hasUseLanguage = content.includes('useLanguage');
    const hasT = content.includes('const { t') || content.includes('const {t');

    let modified = false;

    for (const attr of attributesToTranslate) {
      const regex = new RegExp(`(${attr})=["']([^"']*[a-zA-Z]{2,}[^"']*)["']`, 'g');
      content = content.replace(regex, (match, p1, p2) => {
        // Skip if already a t() call or looks like a variable
        if (p2.startsWith('{') || p2.includes('${')) return match;
        // Skip if it looks like German already (contains German special chars or common words)
        if (/[äöüßÄÖÜ]/.test(p2) || /eingeben|wählen|löschen|speichern/i.test(p2)) return match;

        const key = getTranslationKey(p2);
        if (!deData.auto[key]) {
          // We'll translate later in a batch or just use a placeholder for now
          deData.auto[key] = p2; 
          enData.auto[key] = p2;
          keysAdded++;
        }
        modified = true;
        return `${p1}={t('auto.${key}')}`;
      });
    }

    if (modified) {
      // Add useLanguage if missing
      if (!hasUseLanguage && !content.includes('import { useLanguage }')) {
        content = "import { useLanguage } from '" + path.relative(path.dirname(file), path.join(process.cwd(), 'frontend', 'src', 'context', 'LanguageContext')).replace(/\\/g, '/') + "';\n" + content;
      }
      
      // Inject const { t } = useLanguage() into the component
      if (!hasT) {
        // Simple injection after the first component definition
        content = content.replace(/const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(\([^)]*\)|)\s*=>\s*{/, (m, p1, p2) => {
            return `${m}\n  const { t } = useLanguage();`;
        });
        content = content.replace(/function\s+([A-Z][a-zA-Z0-9]*)\s*(\([^)]*\)|)\s*{/, (m, p1, p2) => {
            return `${m}\n  const { t } = useLanguage();`;
        });
      }

      fs.writeFileSync(file, content, 'utf8');
      filesModified++;
    }
  }

  fs.writeFileSync(dePath, JSON.stringify(deData, null, 2));
  fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

  console.log(`Auto-translated forms: Modified ${filesModified} files, added ${keysAdded} keys.`);
}

run();
