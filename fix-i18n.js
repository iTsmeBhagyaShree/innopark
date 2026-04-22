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

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Fixes >${t('key') || 'fallback'}<
  // Looks for >${t(...) || ...}<
  const regex1 = />\$\{t\((.*?)\)\s*(\|\|\s*['"].*?['"]\s*)?\}/g;
  content = content.replace(regex1, (match, key, fallback) => {
    totalReplaced++;
    return `>{t(${key})${fallback || ''}`;
  });

  // Also fix `<label ...>${t(...) || ...}</label>`
  const regex2 = />\$\{\s*t\((.*?)\)\s*(\|\|\s*['"].*?['"]\s*)?\}/g;
  content = content.replace(regex2, (match, key, fallback) => {
    totalReplaced++;
    return `>{t(${key})${fallback || ''}`;
  });
  
  // Also fix inside <span class="label">${t(...)}</span>
  const regex3 = /"\s*>\$\{t\((.*?)\)\s*(\|\|\s*['"].*?['"]\s*)?\}/g;
  content = content.replace(regex3, (match, key, fallback) => {
    totalReplaced++;
    return `" >{t(${key})${fallback || ''}`;
  });

  // Specific fix for option tags `<option value="...">\${t('...') || '...'}</option>`
  const regexOption = />\$\{t\((.*?)\)\s*\|\|\s*('[^']+')\}<\/option>/g;
  content = content.replace(regexOption, (match, key, fallback) => {
    totalReplaced++;
    return `>{t(${key}) || ${fallback}}</option>`;
  });
  
  if (originalContent !== content) {
    fs.writeFileSync(file, content);
    changedFilesCount++;
    console.log(`Fixed ${file}`);
  }
});

console.log(`\nFixed ${totalReplaced} translation render leaks across ${changedFilesCount} files.`);
