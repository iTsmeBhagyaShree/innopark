const fs = require('fs');

// Deals.jsx Fix
let fDeals = 'src/app/admin/pages/Deals.jsx';
if (fs.existsSync(fDeals)) {
  let contentDeals = fs.readFileSync(fDeals, 'utf8');
  const translatedStageName = "{['new','in progress','won','lost'].includes((stage.name||'').toLowerCase()) ? t('deals.stages.' + stage.name.toLowerCase().replace(' ', '_')) : stage.name}";
  contentDeals = contentDeals.replace(/>{stage\.name}</g, `>${translatedStageName}<`);

  const translatedPipelineName = "{['sales pipeline'].includes((p.name||'').toLowerCase()) ? t('deals.pipelines.sales') : p.name}";
  contentDeals = contentDeals.replace(/>{p\.name}</g, `>${translatedPipelineName}<`);

  // Deals might also render 'Super Admin' or 'Test' indirectly? Let's check if the badges are there.
  fs.writeFileSync(fDeals, contentDeals);
}

// Contacts.jsx Fix
let fContacts = 'src/app/admin/pages/Contacts.jsx';
if (fs.existsSync(fContacts)) {
  let contentContacts = fs.readFileSync(fContacts, 'utf8');
  const translatedStatus = '{contact.status === "Active" ? t("contacts.status_active") : contact.status === "Inactive" ? t("contacts.status_inactive") : contact.status}';
  contentContacts = contentContacts.replace(/>{contact\.status}</g, `>${translatedStatus}<`);
  fs.writeFileSync(fContacts, contentContacts);
}

console.log('Fixed Deals and Contacts specific text!');
