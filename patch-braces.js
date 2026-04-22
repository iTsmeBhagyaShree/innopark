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
let changedFilesCount = 0;
let totalReplaced = 0;

const regexFix = /(>\s*\{t\(['"][^'"]+['"]\)(?:\s*\|\|\s*['"][^'"]*?['"]\s*)?)(?!\s*\})/g;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  content = content.replace(regexFix, (match, prefix) => {
    totalReplaced++;
    return `${prefix}}`;
  });
  
  if (originalContent !== content) {
    fs.writeFileSync(file, content);
    changedFilesCount++;
    console.log(`Patched ${file}`);
  }
});

console.log(`\nPatched ${totalReplaced} missed braces across ${changedFilesCount} files.`);
