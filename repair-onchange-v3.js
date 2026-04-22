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

  // Split into component tags to isolate props
  let parts = content.split(/<([A-Z][a-zA-Z]*|input|textarea|select)/);
  let changed = false;

  for (let i = 1; i < parts.length; i += 2) {
      let tagName = parts[i];
      let body = parts[i+1];
      
      if (body && body.includes('onChange={(e) =>{t(')) {
          // Case 1: Simple state variable value={searchQuery}
          const simpleValueMatch = body.match(/value=\{\s*([a-zA-Z0-9_]+)\s*\}/);
          if (simpleValueMatch) {
              const stateVar = simpleValueMatch[1];
              const setterName = "set" + stateVar.charAt(0).toUpperCase() + stateVar.slice(1);
              body = body.replace(/onChange=\{\(e\)\s*=>\s*\{t\([^}]+\}\s*[^}]*\}/, 
                  `onChange={(e) => ${setterName}(e.target.value)}`);
              changed = true;
              totalRestored++;
          } 
          // Case 2: Object state variable value={formData.name}
          else {
              const objectValueMatch = body.match(/value=\{\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\}/);
              if (objectValueMatch) {
                  const stateVar = objectValueMatch[1];
                  const propName = objectValueMatch[2];
                  const setterName = "set" + stateVar.charAt(0).toUpperCase() + stateVar.slice(1);
                  body = body.replace(/onChange=\{\(e\)\s*=>\s*\{t\([^}]+\}\s*[^}]*\}/, 
                      `onChange={(e) => ${setterName}({ ...${stateVar}, ${propName}: e.target.value })}`);
                  changed = true;
                  totalRestored++;
              }
          }
          parts[i+1] = body;
      }
  }

  if (changed) {
    fs.writeFileSync(file, parts.reduce((acc, part, idx) => {
        if (idx === 0) return part;
        return acc + (idx % 2 === 1 ? '<' + part : part);
    }, ''));
    console.log(`Final Recovery: ${file}`);
  }
});

console.log(`\nFinal Restoration complete. Restored ${totalRestored} handlers.`);
