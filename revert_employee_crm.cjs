const fs = require('fs');

const dePath = './frontend/src/locales/de.json';
const enPath = './frontend/src/locales/en.json';

function updateLeadsCRM(filePath, value) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (data.sidebar) {
    data.sidebar.leadsCRM = value;
  } else {
    data.leadsCRM = value;
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

updateLeadsCRM(dePath, "Leads CRM");
updateLeadsCRM(enPath, "Leads CRM");

console.log('Reverted leadsCRM to "Leads CRM" in de.json and en.json for Employee Dashboard consistency.');
