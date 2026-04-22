const fs = require('fs');
const path = 'frontend/src/locales/en.json';
let content = fs.readFileSync(path, 'utf8');

// Primitive cleanup
content = content.trim();
if (!content.endsWith('}')) {
    // If it's really broken, try to find the last valid close }
    const lastBrace = content.lastIndexOf('}');
    if (lastBrace !== -1) {
        content = content.substring(0, lastBrace + 1);
    }
}

try {
    const en = JSON.parse(content);
    en['Leads'] = 'Leads';
    en['Deals'] = 'Deals';
    en['Contacts'] = 'Contacts';
    en['Companies'] = 'Companies';
    en['Offers'] = 'Offers';
    en['Invoices'] = 'Invoices';
    en['Activities and Tasks'] = 'Tasks and Activities';
    en['My Profile'] = 'My Profile';
    en['Settings'] = 'Settings';
    en['Notifications'] = 'Notifications';
    en['Messages'] = 'Messages';
    en['Dashboard'] = 'Dashboard';
    
    if (!en.leads) en.leads = {};
    en.leads.no_leads = 'No leads found';
    
    fs.writeFileSync(path, JSON.stringify(en, null, 2));
    console.log('SUCCESS');
} catch (e) {
    console.error('FAILED TO PARSE:', e.message);
}
