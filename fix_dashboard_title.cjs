const fs = require('fs');
const path = './frontend/src/locales/de.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Update to German title
data.dashboard_title = "Super-Admin-Übersicht";

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Fixed dashboard_title in de.json to Super-Admin-Übersicht');
