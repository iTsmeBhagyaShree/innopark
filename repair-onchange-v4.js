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

  // Pattern for corrupted onChange (missing arrow, or just garbage)
  const corruptedRegex = /onChange=\{\(e\)\s*\{t\([^}]+\}\s*[^}]*\}/g;
  const corruptedRegexArrow = /onChange=\{\(e\)\s*=>\s*\{t\([^}]+\}\s*[^}]*\}/g;

  let blocks = content.split('<');
  let changed = false;

  for (let i = 0; i < blocks.length; i++) {
      let block = blocks[i];
      if (block.includes('onChange={(e)')) {
          const valueMatch = block.match(/value=\{\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\}/) || 
                             block.match(/value=\{\s*([a-zA-Z0-9_]+)\s*\[\s*['"](.*?)['"]\s*\]\s*\}/) ||
                             block.match(/value=\{\s*([a-zA-Z0-9_]+)\s*\}/);
          
          if (valueMatch) {
              const stateVar = valueMatch[1];
              const propName = valueMatch[2]; // Might be undefined if simpleVar
              const setterName = "set" + stateVar.charAt(0).toUpperCase() + stateVar.slice(1);
              
              const replacement = propName ? 
                  `onChange={(e) => ${setterName}({ ...${stateVar}, ${propName}: e.target.value })}` :
                  `onChange={(e) => ${setterName}(e.target.value)}`;

              // Replace any variation of the corrupted onChange
              let newBlock = block.replace(/onChange=\{\(e\)\s*(=>\s*)?\{t\([^}]+\}\s*[^}]*\}/, replacement);
              if (newBlock !== block) {
                  blocks[i] = newBlock;
                  totalRestored++;
                  changed = true;
              }
          }
      }
  }

  if (changed) {
    fs.writeFileSync(file, blocks.join('<'));
    console.log(`Deep Restoration: ${file}`);
  }
});

console.log(`\nDeep Restoration complete. Restored ${totalRestored} handlers.`);
