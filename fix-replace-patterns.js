const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/app/admin/pages/Messages.jsx',
  'frontend/src/app/admin/pages/Settings.jsx',
  'frontend/src/app/admin/pages/Tasks.jsx',
  'frontend/src/components/layout/GlobalSearch.jsx',
];

let totalFixed = 0;

files.forEach(relPath => {
  const filePath = path.join(__dirname, relPath);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Pattern: {t('some.key')}.replace('{{var}}', someExpr)}
  // Fix to:  {t('some.key')?.replace('{{var}}', someExpr)}
  // The issue is the closing brace of the JSX expression is missing before .replace
  // Broken: {t('key')}.replace('{{x}}', val)}
  // Fixed:  {(t('key') || '').replace('{{x}}', val)}

  // Match: {t('...')} or {t("...")} followed by .replace(... chain and final }
  const pattern = /\{(t\('[^']+'\)(?:\s*\|\|\s*'[^']*')?)\}((?:\.replace\('[^']*',\s*[^)]+\))+)\}/g;

  content = content.replace(pattern, (match, tCall, replaceChain) => {
    totalFixed++;
    return `{(${tCall} || '')${replaceChain}}`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${relPath}`);
  } else {
    console.log(`⚠️  No patterns found in: ${relPath}`);
  }
});

console.log(`\nTotal fixes applied: ${totalFixed}`);
