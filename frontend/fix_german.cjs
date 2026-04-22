const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
       walk(dirPath, callback);
    } else {
      if (dirPath.endsWith('.jsx') || dirPath.endsWith('.js')) {
         callback(dirPath);
      }
    }
  });
}

function processFile(f) {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // Currencies
  // Replace ₹ with €
  content = content.replace(/₹/g, '€');
  
  // Replace $ with € ONLY when it's not followed by { (which is string interpolation `${}`)
  // and not part of a regex or specific variable if any, but in JSX usually literal $ is rendered like `$ ${val}` or `$${val}` or just `$`
  // Just in case, let's only replace '$' if it's not `${` and not `$` followed by word chars if it's a variable... wait, JS variables can start with $.
  // To be safe, look for '$' followed by a number or space, or inside text tags.
  // Actually, replacing `\$(?!\{)` might break things like `$0` in regex, or `const $el`.
  // Let's do `\$(?=[0-9])` -> `€`
  // And `\$ ` -> `€ `
  content = content.replace(/\$(?=[0-9])/g, '€');
  content = content.replace(/\$ (?=[0-9])/g, '€ ');
  content = content.replace(/'\$'/g, "'€'");
  content = content.replace(/"\$"/g, '"€"');
  content = content.replace(/>\$(?=<)/g, '>€');
  content = content.replace(/>\$ /g, '>€ ');
  // Handle specific patterns like `${currencySymbol || "$"}` -> `${currencySymbol || "€"}`
  content = content.replace(/\|\|\s*['"]\$['"]/g, '|| "€"');

  // Sales Pipeline
  content = content.replace(/['"]Sales Pipeline['"]/gi, "'Vertriebspipeline'");
  content = content.replace(/>Sales Pipeline</gi, '>Vertriebspipeline<');

  // Pipeline stages
  // Exact quotes
  content = content.replace(/'New'/g, "'Neu'");
  content = content.replace(/"New"/g, '"Neu"');
  content = content.replace(/'NEW'/g, "'NEU'");
  content = content.replace(/"NEW"/g, '"NEU"');

  content = content.replace(/'In Progress'/gi, "'In Bearbeitung'");
  content = content.replace(/"In Progress"/gi, '"In Bearbeitung"');
  content = content.replace(/'IN PROGRESS'/g, "'IN BEARBEITUNG'");
  content = content.replace(/"IN PROGRESS"/g, '"IN BEARBEITUNG"');

  content = content.replace(/'Won'/g, "'Gewonnen'");
  content = content.replace(/"Won"/g, '"Gewonnen"');
  content = content.replace(/'WON'/g, "'GEWONNEN'");
  content = content.replace(/"WON"/g, '"GEWONNEN"');

  content = content.replace(/'Lost'/g, "'Verloren'");
  content = content.replace(/"Lost"/g, '"Verloren"');
  content = content.replace(/'LOST'/g, "'VERLOREN'");
  content = content.replace(/"LOST"/g, '"VERLOREN"');
  
  // Dynamic value 'Super Admin' 
  // It says: Dynamic values (Test, Super Admin, etc.)
  content = content.replace(/'Super Admin'/g, "'Superadmin'");
  content = content.replace(/"Super Admin"/g, '"Superadmin"');
  content = content.replace(/>Super Admin</g, '>Superadmin<');

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed', f);
  }
}

walk('src/app', processFile);
walk('src/components', processFile);
walk('src/context', processFile);
