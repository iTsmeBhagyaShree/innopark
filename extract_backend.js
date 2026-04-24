const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'backend', 'controllers');
const localesDir = path.join(__dirname, 'backend', 'locales');

if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true });
}

let strings = new Set();

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      
      // Match error: '...', message: '...', error: "...", message: "..."
      const regex1 = /(?:error|message):\s*['"]([^'"]+)['"]/g;
      let match;
      while ((match = regex1.exec(content)) !== null) {
        strings.add(match[1]);
      }
      
      // Match res.status().json('...') or res.send('...')
      const regex2 = /res\.(?:send|json)\(['"]([^'"]+)['"]\)/g;
      while ((match = regex2.exec(content)) !== null) {
         strings.add(match[1]);
      }
    }
  }
}

walk(controllersDir);

const enDict = {};
for (const s of strings) {
  enDict[s] = s;
}

fs.writeFileSync(path.join(localesDir, 'en.json'), JSON.stringify(enDict, null, 2));

console.log(`Extracted ${strings.size} unique strings to backend/locales/en.json`);
