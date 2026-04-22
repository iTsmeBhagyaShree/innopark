const fs = require('fs');
const path = require('path');

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) { walk(dirPath); } 
    else if (dirPath.endsWith('.jsx')) {
      let content = fs.readFileSync(dirPath, 'utf8');
      let original = content;
      
      // Replace literal $ followed by a digit or space (but only in JSX text contexts) 
      // It's much safer to replace '$' with '€' except when it's `${`
      // So `$ (?` -> `€` and `$[0-9]` -> `€[0-9]`
      content = content.replace(/\$([0-9])/g, '€$1');
      content = content.replace(/([>\s])\$(?!\s*\{)/g, '$1€'); // any $ after space or > not followed by {
      // Look for string literals containing only $ or $ accompanied by spaces/currency keys
      content = content.replace(/['"]\$['"]/g, "'€'");
      content = content.replace(/['"]\s*\$['"]/g, "' €'");
      // Specifically target ₹ as well
      content = content.replace(/₹/g, '€');
      
      if (content !== original) {
        fs.writeFileSync(dirPath, content);
        console.log('Fixed currency in:', dirPath);
      }
    }
  });
}
walk('src/app');
walk('src/components');
