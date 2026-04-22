const fs = require('fs');

let fLeads = 'src/app/admin/pages/Leads.jsx';
if (fs.existsSync(fLeads)) {
  let content = fs.readFileSync(fLeads, 'utf8');

  // Replace stages stage.name for Leads (NEW LEAD, CONTACTED, QUALIFIED, CONVERTED)
  const translatedStageName = "{['new lead', 'new', 'neu'].includes((stage.name||'').toLowerCase()) ? 'Neuer Lead' : ['contacted'].includes((stage.name||'').toLowerCase()) ? 'Kontaktiert' : ['qualified'].includes((stage.name||'').toLowerCase()) ? 'Qualifiziert' : ['converted'].includes((stage.name||'').toLowerCase()) ? 'Konvertiert' : ['in progress','in bearbeitung'].includes((stage.name||'').toLowerCase()) ? 'In Bearbeitung' : ['won','gewonnen'].includes((stage.name||'').toLowerCase()) ? 'Gewonnen' : ['lost','verloren'].includes((stage.name||'').toLowerCase()) ? 'Verloren' : stage.name}";
  
  // My previous fix used a different string. I'll just use regex to replace it completely.
  content = content.replace(/>\{\['new','neu'\].*?\bstage\.name\s*\}</g, `>${translatedStageName}<`);

  fs.writeFileSync(fLeads, content);
  console.log('Fixed Leads stages inline.');
}
