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

  // Pattern 1: Look for any component block
  // We'll split the content by '<' to find components
  let blocks = content.split('<');
  let changed = false;

  for (let i = 0; i < blocks.length; i++) {
      let block = blocks[i];
      if (block.includes('onChange={(e) =>{t(')) {
          // Find value prop in this block
          const valueMatch = block.match(/value=\{\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\}/) || 
                             block.match(/value=\{\s*([a-zA-Z0-9_]+)\s*\[\s*['"](.*?)['"]\s*\]\s*\}/);
          
          if (valueMatch) {
              const stateVar = valueMatch[1];
              const propName = valueMatch[2];
              const setterName = "set" + stateVar.charAt(0).toUpperCase() + stateVar.slice(1);
              
              blocks[i] = block.replace(/onChange=\{\(e\)\s*=>\s*\{t\([^}]+\}\s*[^}]*\}/, 
                  `onChange={(e) => ${setterName}({ ...${stateVar}, ${propName}: e.target.value })}`);
              
              totalRestored++;
              changed = true;
          }
      }
  }

  if (changed) {
    fs.writeFileSync(file, blocks.join('<'));
    console.log(`Re-Restored onChange handlers: ${file}`);
  }
});

console.log(`\nAggressive Restoration complete. Restored ${totalRestored} handlers.`);
