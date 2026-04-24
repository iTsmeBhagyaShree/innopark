const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const controllersDir = path.join(__dirname, 'backend', 'controllers');
const localesDir = path.join(__dirname, 'backend', 'locales');
const dePath = path.join(localesDir, 'de.json');
const enPath = path.join(localesDir, 'en.json');

if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true });
}

let deDict = {};
let enDict = {};
if (fs.existsSync(dePath)) deDict = JSON.parse(fs.readFileSync(dePath, 'utf8'));
if (fs.existsSync(enPath)) enDict = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Common English to German terms
const commonDe = {
  "successfully": "erfolgreich",
  "not found": "nicht gefunden",
  "required": "erforderlich",
  "failed to": "Fehler beim",
  "invalid": "ungültig",
  "already exists": "existiert bereits",
  "created": "erstellt",
  "updated": "aktualisiert",
  "deleted": "gelöscht",
  "error": "Fehler",
  "server error": "Serverfehler"
};

function autoTranslate(text) {
    if (!text || text.trim().length === 0) return text;
    let t = text;
    for (const [en, de] of Object.entries(commonDe)) {
        const regex = new RegExp(`\\b${en}\\b`, 'gi');
        t = t.replace(regex, de);
    }
    // simple casing
    if (t !== text) {
        return t.charAt(0).toUpperCase() + t.slice(1);
    }
    return t; // fallback to English if no common term replaced
}

let modifiedFiles = 0;

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (f.endsWith('.js')) {
      let content = fs.readFileSync(full, 'utf8');
      const original = content;

      // Replace error: '...' or error: "..."
      // and message: '...' or message: "..."
      // But only if it's inside res.json or res.status().json()
      
      const regex = /(res\.(?:status\(\d+\)\.)?json\(\s*\{[\s\S]*?(?:error|message)\s*:\s*)(['"])(.*?)\2/g;
      
      content = content.replace(regex, (match, prefix, quote, text) => {
          if (!text || text.includes('`') || text.includes('$') || text.trim() === '') return match;
          
          // exclude technical strings or code snippets
          if (text.includes('\\n') || text.length > 100) return match;

          // Generate hash key
          const hash = crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
          const key = `api_msg_${hash}`;
          
          if (!enDict[key]) enDict[key] = text;
          if (!deDict[key]) deDict[key] = autoTranslate(text);

          // We replace it with req.t('key') || 'text'
          return `${prefix}req.t ? req.t('${key}') : "${text}"`;
      });

      if (content !== original) {
          fs.writeFileSync(full, content, 'utf8');
          modifiedFiles++;
      }
    }
  }
}

walk(controllersDir);

fs.writeFileSync(enPath, JSON.stringify(enDict, null, 2));
fs.writeFileSync(dePath, JSON.stringify(deDict, null, 2));

console.log(`Codemod applied to ${modifiedFiles} files. Generated ${Object.keys(enDict).length} translation keys.`);
