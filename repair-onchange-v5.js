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

  let blocks = content.split('<');
  let changed = false;

  for (let i = 0; i < blocks.length; i++) {
      let block = blocks[i];
      if (block.includes('onChange={(e)')) {
          // Flexible value match: look for anything inside value={}
          const valuePropMatch = block.match(/value=\{([^}]+)\}/);
          
          if (valuePropMatch) {
              const valueContent = valuePropMatch[1].trim();
              
              // Extract state variable and property
              // Case: formData.prop || ...
              // Case: prop
              const stateMatch = valueContent.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/) ||
                                 valueContent.match(/([a-zA-Z0-9_]+)/);
              
              if (stateMatch) {
                  const stateVar = stateMatch[1];
                  const propName = stateMatch[2]; // Might be undefined
                  const setterName = "set" + stateVar.charAt(0).toUpperCase() + stateVar.slice(1);
                  
                  const replacement = propName ? 
                      `onChange={(e) => ${setterName}({ ...${stateVar}, ${propName}: e.target.value })}` :
                      `onChange={(e) => ${setterName}(e.target.value)}`;

                  // Highly flexible onChange replacement (greedy)
                  const newBlock = block.replace(/onChange=\{\(e\)\s*(=>\s*)?\{t\([^}]+\}\s*([^}<]*(?=<)|[^}]*(?=\/|>))\}?/, replacement);
                  
                  if (newBlock !== block) {
                      blocks[i] = newBlock;
                      totalRestored++;
                      changed = true;
                  }
              }
          }
      }
  }

  if (changed) {
    fs.writeFileSync(file, blocks.join('<'));
    console.log(`Master Restoration: ${file}`);
  }
});

console.log(`\nMaster Restoration complete. Restored ${totalRestored} handlers.`);
