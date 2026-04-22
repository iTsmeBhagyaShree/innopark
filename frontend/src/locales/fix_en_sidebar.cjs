const fs = require('fs');
const content = fs.readFileSync('frontend/src/locales/en.json', 'utf8');

try {
    const en = JSON.parse(content);
    
    // Top-level keys for CRMLayout tabs
    en['Leads'] = 'Leads';
    en['Deals'] = 'Deals';
    en['Contacts'] = 'Contacts';
    en['Companies'] = 'Companies';
    en['Offers'] = 'Offers';
    en['Invoices'] = 'Invoices';
    en['Activities and Tasks'] = 'Tasks and Activities';
    
    // Sidebar keys
    if (!en.sidebar) en.sidebar = {};
    en.sidebar.crm = 'CRM';
    en.sidebar.offers = 'Offers';
    en.sidebar.contracts = 'Contracts';
    en.sidebar.invoices = 'Invoices';
    en.sidebar.contacts = 'Contacts';
    en.sidebar.companies = 'Companies';
    
    // Common keys
    if (!en.common) en.common = {};
    en.common.all_leads = 'All Leads';
    en.common.my_leads = 'My Leads';
    
    // Leads keys
    if (!en.leads) en.leads = {};
    en.leads.no_leads = 'No leads found';
    en.leads.add_new_lead = 'Add New Lead';
    en.leads.edit_lead = 'Edit Lead';

    fs.writeFileSync('frontend/src/locales/en.json', JSON.stringify(en, null, 2));
    console.log('SUCCESS_UPDATED');
} catch (e) {
    console.error('FAILED:', e.message);
}
