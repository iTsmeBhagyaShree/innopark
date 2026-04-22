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
let totalRestored = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Regex to find components with corrupted onChange but valid value
  // This matches a component block where value comes before onChange
  // Pattern: value={VAR.PROP} ... onChange={(e) =>{t(...) || ...}
  const corruptedRegex = /value=\{\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\}[\s\S]{1,150}onChange=\{\(e\)\s*=>\s*\{t\([^}]+\}\s*[^}]*\}/g;
  
  content = content.replace(corruptedRegex, (match, stateVar, propName) => {
      // Determine setter name based on stateVar
      const setterName = "set" + stateVar.charAt(0).toUpperCase() + stateVar.slice(1);
      
      // Reconstruct the correct onChange
      let newMatch = match.replace(/onChange=\{\(e\)\s*=>\s*\{t\([^}]+\}\s*[^}]*\}/, 
          `onChange={(e) => ${setterName}({ ...${stateVar}, ${propName}: e.target.value })}`);
      
      totalRestored++;
      return newMatch;
  });

  // Also catch the case where onChange comes before value (less common but possible)
  const corruptedRegexReverse = /onChange=\{\(e\)\s*=>\s*\{t\([^}]+\}\s*[^}]*\}[\s\S]{1,150}value=\{\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\}/g;
  
  content = content.replace(corruptedRegexReverse, (match, stateVar, propName) => {
      const setterName = "set" + stateVar.charAt(0).toUpperCase() + stateVar.slice(1);
      let newMatch = match.replace(/onChange=\{\(e\)\s*=>\s*\{t\([^}]+\}\s*[^}]*\}/, 
          `onChange={(e) => ${setterName}({ ...${stateVar}, ${propName}: e.target.value })}`);
      
      totalRestored++;
      return newMatch;
  });

  // Specific fix for the PwaSettings.jsx case which has a trailing brace issue
  // onChange={(e) =>{t('auto.auto_d860b404') || "Develo CRM"}
  content = content.replace(/onChange=\{\(e\)\s*=>\s*\{t\('[^']+'\)\s*\|\|\s*"[^"]+"\}/g, (match) => {
      // This is a last resort if value wasn't caught by the regex above
      return match; // Let the regexes above handle it if possible
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Restored onChange handlers: ${file}`);
  }
});

console.log(`\nRestoration complete. Restored ${totalRestored} handlers.`);
