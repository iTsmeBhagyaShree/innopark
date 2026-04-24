const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../locales');
const enPath = path.join(localesDir, 'en.json');
const dePath = path.join(localesDir, 'de.json');

let enDict = {};
let deDict = {};

try {
  if (fs.existsSync(enPath)) enDict = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  if (fs.existsSync(dePath)) deDict = JSON.parse(fs.readFileSync(dePath, 'utf8'));
} catch (err) {
  console.error("Failed to load backend translations:", err);
}

const i18nMiddleware = (req, res, next) => {
  // Determine language from header or query or default to 'de' (as requested)
  let lang = 'de'; 
  const langHeader = req.headers['accept-language'] || req.headers['x-language'] || req.headers['language'];
  if (langHeader && langHeader.startsWith('en')) {
      lang = 'en';
  } else if (langHeader && langHeader.startsWith('de')) {
      lang = 'de';
  }
  // The default language MUST be German (de)

  req.language = lang;

  req.t = (key) => {
      if (lang === 'de') {
          return deDict[key] || enDict[key] || key;
      }
      return enDict[key] || deDict[key] || key;
  };

  next();
};

module.exports = i18nMiddleware;
