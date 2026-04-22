const fs = require('fs');

let fLeads = 'src/app/admin/pages/Leads.jsx';
if (fs.existsSync(fLeads)) {
  let content = fs.readFileSync(fLeads, 'utf8');

  // Replace pipelines p.name
  const translatedPipelineName = "{['lead pipeline'].includes((p.name||'').replace(/['\"]/g, '').toLowerCase().trim()) ? 'Lead-Pipeline' : ['international sales'].includes((p.name||'').replace(/['\"]/g, '').toLowerCase().trim()) ? 'Internationaler Vertrieb' : ['sales pipeline'].includes((p.name||'').replace(/['\"]/g, '').toLowerCase().trim()) ? 'Vertriebspipeline' : p.name}";
  content = content.replace(/>{p\.name}</g, `>${translatedPipelineName}<`);

  // Replace stages stage.name
  const translatedStageName = "{['new','neu'].includes((stage.name||'').toLowerCase()) ? 'Neu' : ['in progress','in bearbeitung'].includes((stage.name||'').toLowerCase()) ? 'In Bearbeitung' : ['won','gewonnen'].includes((stage.name||'').toLowerCase()) ? 'Gewonnen' : ['lost','verloren'].includes((stage.name||'').toLowerCase()) ? 'Verloren' : stage.name}";
  content = content.replace(/>{stage\.name}</g, `>${translatedStageName}<`);

  fs.writeFileSync(fLeads, content);
  console.log('Fixed Leads pipelines and stages inline.');
}
