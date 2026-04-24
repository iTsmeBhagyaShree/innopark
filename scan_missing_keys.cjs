const fs = require('fs');
const path = require('path');

const srcDirs = [
  path.join(__dirname, 'frontend', 'src')
];

const dePath = path.join(__dirname, 'frontend', 'src', 'locales', 'de.json');
const enPath = path.join(__dirname, 'frontend', 'src', 'locales', 'en.json');
let deData = JSON.parse(fs.readFileSync(dePath, 'utf8'));
let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function walkDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) results.push(...walkDir(full));
    else if (full.endsWith('.jsx') || full.endsWith('.js')) results.push(full);
  }
  return results;
}

let allFiles = [];
for (const d of srcDirs) {
  allFiles.push(...walkDir(d));
}

let missingKeys = new Set();

const regex = /t\(['"]([^'"]+)['"]\)/g;

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    if (key.includes('auto.') || key.includes('${')) continue; // Skip auto keys or dynamic keys
    missingKeys.add(key);
  }
}

function getNested(obj, pathParts) {
  let current = obj;
  for (const part of pathParts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

function setNested(obj, pathParts, value) {
  let current = obj;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!current[part]) current[part] = {};
    current = current[part];
  }
  current[pathParts[pathParts.length - 1]] = value;
}

let added = 0;

function formatText(keyStr) {
  const words = keyStr.split(/[._-]/);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

for (const key of missingKeys) {
  const parts = key.split('.');
  
  let deVal = getNested(deData, parts);
  // Also check common scope if no dot
  if (deVal === undefined && parts.length === 1) {
     deVal = getNested(deData, ['common', parts[0]]);
  }

  if (deVal === undefined) {
    // Attempt auto translation
    const pretty = formatText(key);
    let trans = pretty;
    if (key.includes('enter_organization')) trans = 'Unternehmensname eingeben';
    if (key.includes('enter_phone')) trans = 'Telefonnummer eingeben';
    if (key.includes('enter_email')) trans = 'E-Mail eingeben';
    if (key.includes('organization_name')) trans = 'Unternehmensname';
    if (key.includes('person_name')) trans = 'Name der Person';
    if (key.includes('enter_person_name')) trans = 'Namen eingeben';
    
    setNested(deData, parts, trans);
    setNested(enData, parts, pretty);
    added++;
  }
}

fs.writeFileSync(dePath, JSON.stringify(deData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

console.log(`Found and added ${added} missing keys to de.json and en.json.`);
