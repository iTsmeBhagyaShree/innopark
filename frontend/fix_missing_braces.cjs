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
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Pattern: { key: '...', header: t('...') || '...',
    // (Missing closing brace before the comma or at end of line)
    // We look for objects that start with { but end with a comma after a translation call with fallback
    
    const corruptedObjRegex = /\{ (key|id): (['"].*?['"]), (header|label|title): t\(['"].*?['"]\)( \|\| ["'].*?["']),?\s*$/gm;
    
    // Actually, it's easier to match the specific line pattern seen in Reports.jsx
    // Look for lines starting with { and ending with a comma but no closing }
    const lineRegex = /^(\s*\{.*?, (header|label|title|key|id|member|name): t\(.*?\)( \|\| ["'].*?["'])?)(?!\s*\}).*?$/gm;

    if (lineRegex.test(content)) {
        content = content.replace(lineRegex, (match, body) => {
            if (!match.includes('}')) {
                changed = true;
                return `${match} }`;
            }
            return match;
        });
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed missing braces in: ${file}`);
    }
});

console.log('Finished.');
