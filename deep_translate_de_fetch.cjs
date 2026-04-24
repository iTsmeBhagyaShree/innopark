const fs = require('fs');
const path = require('path');

const dePath = path.join(__dirname, 'frontend', 'src', 'locales', 'de.json');
let deData = JSON.parse(fs.readFileSync(dePath, 'utf8'));

const engWords = ['Leads', 'Tasks', 'Settings', 'Create', 'Update', 'Delete', 'Add', 'Edit', 'View', 'Invalid', 'Required', 'Name', 'Phone', 'Email', 'Select', 'Total', 'Amount', 'Status', 'Confirm'];

async function translateText(text) {
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=de&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0][0][0];
  } catch (e) {
    return null;
  }
}

async function processObject(deObj) {
  const keys = Object.keys(deObj);
  let modified = 0;
  for (const key of keys) {
    if (typeof deObj[key] === 'object' && deObj[key] !== null) {
      modified += await processObject(deObj[key]);
    } else if (typeof deObj[key] === 'string') {
      const val = deObj[key];
      
      const looksLikeEnglish = engWords.some(w => val.includes(w)) || /^[A-Z][a-z]+ [A-Z][a-z]+/.test(val) || val.includes("is required");
      
      // Don't translate paths or short code words
      if (looksLikeEnglish && val.length > 2 && !val.includes('/')) {
        console.log(`Translating: "${val}"`);
        const translated = await translateText(val);
        if (translated) {
          deObj[key] = translated;
          console.log(` -> "${translated}"`);
          modified++;
          if (modified % 10 === 0) {
             fs.writeFileSync(dePath, JSON.stringify(deData, null, 2));
          }
        }
      }
    }
  }
  return modified;
}

async function run() {
  console.log("Starting fetch-based translation...");
  const count = await processObject(deData);
  fs.writeFileSync(dePath, JSON.stringify(deData, null, 2));
  console.log(`Translation complete. Modified ${count} values.`);
}

run();
