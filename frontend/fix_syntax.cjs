const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix 1: placeholder={t({t('...') || "..."} -> placeholder={t('...') || "..."}
    const placeholderRegex = /placeholder=\{t\(\{t\('(.*?)'\)( \|\| ["'].*?["'])?\}/g;
    if (placeholderRegex.test(content)) {
        content = content.replace(placeholderRegex, (match, key, fallback) => {
            changed = true;
            return `placeholder={t('${key}')${fallback || ''}}`;
        });
    }

    // Fix 2: {selectedLead.personName || {t('...') || '...'} -> {selectedLead.personName || t('...') || '...'}
    const nestedBraceRegex = /\|\| \{t\('(.*?)'\)( \|\| ["'].*?["'])?\}/g;
    if (nestedBraceRegex.test(content)) {
        content = content.replace(nestedBraceRegex, (match, key, fallback) => {
            changed = true;
            return `|| t('${key}')${fallback || ''}`;
        });
    }

    // Fix 3: placeholder="{t('...')}" -> placeholder={t('...')}
    const stringWrappedRegex = /placeholder="\{t\('(.*?)'\)\}"/g;
    if (stringWrappedRegex.test(content)) {
        content = content.replace(stringWrappedRegex, (match, key) => {
            changed = true;
            return `placeholder={t('${key}')}`;
        });
    }

    // Fix 4: label: {t('...') || '...'} -> label: t('...') || '...'
    const objectKeyRegex = /([a-zA-Z0-9_]+):\s+\{t\('(.*?)'\)( \|\| ["'].*?["'])?\}/g;
    if (objectKeyRegex.test(content)) {
        content = content.replace(objectKeyRegex, (match, keyName, key, fallback) => {
            changed = true;
            return `${keyName}: t('${key}')${fallback || ''}`;
        });
    }
    // Fix 5: ternary/logical nested braces: ? {t(...) : {t(...)
    const ternaryRegex = /([?:]\s*)\{t\('(.*?)'\)( \|\| ["'].*?["'])?\}/g;
    if (ternaryRegex.test(content)) {
        content = content.replace(ternaryRegex, (match, prefix, key, fallback) => {
            changed = true;
            return `${prefix}t('${key}')${fallback || ''}`;
        });
    }

    // Fix 6: Corrupted textarea tags
    const textareaRegex = /onChange=\{\(e\) => setFormData\(\{ \.\.\.formData, (.*?) \}\)\}><\/label>/g;
    if (textareaRegex.test(content)) {
        content = content.replace(textareaRegex, (match, body) => {
            changed = true;
            return `onChange={(e) => setFormData({ ...formData, ${body} })} />`;
        });
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed: ${file}`);
        count++;
    }
});

console.log(`Finished. Total files fixed: ${count}`);
