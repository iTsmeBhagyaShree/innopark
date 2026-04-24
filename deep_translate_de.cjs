const fs = require('fs');
const path = require('path');
const translate = require('translate');

translate.engine = 'google';

const dePath = path.join(__dirname, 'frontend', 'src', 'locales', 'de.json');
const enPath = path.join(__dirname, 'frontend', 'src', 'locales', 'en.json');

let deData = JSON.parse(fs.readFileSync(dePath, 'utf8'));
let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Common English terms that indicate a string needs translation
const engWords = ['Leads', 'Tasks', 'Settings', 'Create', 'Update', 'Delete', 'Add', 'Edit', 'View', 'Invalid', 'Required', 'Name', 'Phone', 'Email', 'Select', 'Total', 'Amount', 'Status'];

async function processObject(deObj, enObj, objPath = '') {
  const keys = Object.keys(deObj);
  let modified = 0;
  for (const key of keys) {
    if (typeof deObj[key] === 'object' && deObj[key] !== null) {
      if (!enObj[key]) enObj[key] = {};
      modified += await processObject(deObj[key], enObj[key], objPath + '.' + key);
    } else if (typeof deObj[key] === 'string') {
      const val = deObj[key];
      const enVal = enObj[key] || val;
      
      // Check if it looks like untranslated English
      const looksLikeEnglish = engWords.some(w => val.includes(w) || val === enVal);
      
      if (looksLikeEnglish && val.length > 1) {
        try {
          console.log(`Translating: "${enVal}"`);
          const translated = await translate(enVal, { from: 'en', to: 'de' });
          deObj[key] = translated;
          console.log(` -> "${translated}"`);
          modified++;
          // Save periodically to avoid losing progress
          if (modified % 20 === 0) {
              fs.writeFileSync(dePath, JSON.stringify(deData, null, 2));
          }
        } catch (e) {
          console.error(`Failed to translate: ${enVal}`, e.message);
        }
      }
    }
  }
  return modified;
}

async function run() {
  console.log("Starting deep translation...");
  const count = await processObject(deData, enData);
  fs.writeFileSync(dePath, JSON.stringify(deData, null, 2));
  console.log(`Translation complete. Modified ${count} values.`);
}

run();
