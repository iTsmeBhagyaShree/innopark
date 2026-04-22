const fs = require('fs');

let fPipeline = 'src/app/admin/pages/PipelineSettings.jsx';
if (fs.existsSync(fPipeline)) {
  let content = fs.readFileSync(fPipeline, 'utf8');

  // Replace pipelines p.name or pipeline.name
  const translatedPipelineName = "{['lead pipeline'].includes((pipeline.name||'').replace(/['\"]/g, '').toLowerCase().trim()) ? 'Lead-Pipeline' : ['international sales'].includes((pipeline.name||'').replace(/['\"]/g, '').toLowerCase().trim()) ? 'Internationaler Vertrieb' : ['sales pipeline'].includes((pipeline.name||'').replace(/['\"]/g, '').toLowerCase().trim()) ? 'Vertriebspipeline' : pipeline.name}";
  
  if (content.includes('>{pipeline.name}<')) {
    content = content.replace(/>{pipeline\.name}</g, `>${translatedPipelineName}<`);
    fs.writeFileSync(fPipeline, content);
    console.log('Fixed PipelineSettings.');
  }

  const translatedPName = "{['lead pipeline'].includes((p.name||'').replace(/['\"]/g, '').toLowerCase().trim()) ? 'Lead-Pipeline' : ['international sales'].includes((p.name||'').replace(/['\"]/g, '').toLowerCase().trim()) ? 'Internationaler Vertrieb' : ['sales pipeline'].includes((p.name||'').replace(/['\"]/g, '').toLowerCase().trim()) ? 'Vertriebspipeline' : p.name}";
  if (content.includes('>{p.name}<')) {
    content = content.replace(/>{p\.name}</g, `>${translatedPName}<`);
    fs.writeFileSync(fPipeline, content);
  }
}
