
const fs = require('fs');
const enPath = 'frontend/src/locales/en.json';
const dePath = 'frontend/src/locales/de.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));

function standardize(source, target) {
    let result = {};
    for (let key in source) {
        const sourceVal = source[key];
        const targetVal = target[key];

        if (sourceVal !== null && typeof sourceVal === 'object' && !Array.isArray(sourceVal)) {
            result[key] = standardize(sourceVal, (targetVal && typeof targetVal === 'object') ? targetVal : {});
        } else {
            // Keep target translation if it exists and is a string
            if (targetVal !== undefined && typeof targetVal === 'string') {
                result[key] = targetVal;
            } else {
                // Otherwise fallback to source (English)
                result[key] = sourceVal;
            }
        }
    }
    return result;
}

const fixedDe = standardize(en, de);

// Fix sidebar.tasks specifically if it was an object in target
fixedDe.sidebar.tasks = (de.sidebar && de.sidebar.tasks && typeof de.sidebar.tasks === 'string') ? de.sidebar.tasks : "Aufgaben";

fs.writeFileSync(dePath, JSON.stringify(fixedDe, null, 2));
console.log('Strictly standardized de.json to match en.json structure.');
