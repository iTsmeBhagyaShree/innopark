const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
       walk(dirPath, callback);
    } else {
      if (dirPath.endsWith('.jsx')) {
         callback(dirPath);
      }
    }
  });
}

function check(f) {
  const content = fs.readFileSync(f, 'utf8');
  let lines = content.split('\n');
  let found = false;
  lines.forEach((l, i) => {
    if (l.match(/['"]New['"]/) || l.match(/['"]In Progress['"]/) || l.match(/['"]Won['"]/) || l.match(/['"]Lost['"]/) || l.includes('₹') || l.includes('$') || l.includes('Sales Pipeline') || l.includes('Super Admin')) {
       if (!found) {
          console.log('\n--- ' + f);
          found = true;
       }
       console.log((i+1) + ': ' + l.trim());
    }
  });
}

walk('src/app', check);
if (fs.existsSync('src/components')) walk('src/components', check);
