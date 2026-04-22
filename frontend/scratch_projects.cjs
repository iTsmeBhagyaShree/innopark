const fs = require('fs');

// Add on_hold to json files
const addStatus = (file, holdStr) => {
  const fileData = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (fileData.common && fileData.common.status) {
    fileData.common.status.on_hold = holdStr;
    fs.writeFileSync(file, JSON.stringify(fileData, null, 2));
  }
};
addStatus('src/locales/de.json', 'Pausiert');
addStatus('src/locales/en.json', 'On Hold');

// Projects.jsx Fix labels
let fProj = 'src/app/admin/pages/Projects.jsx';
if (fs.existsSync(fProj)) {
  let content = fs.readFileSync(fProj, 'utf8');

  // Replace {row.label}
  const translatedRowLabel = "{['urgent'].includes((row.label||'').toLowerCase()) ? 'Dringend' : ['on track'].includes((row.label||'').toLowerCase()) ? 'Auf Kurs' : ['high priority'].includes((row.label||'').toLowerCase()) ? 'Hohe Priorität' : row.label}";
  content = content.replace(/>\s*\{row\.label\}\s*</g, `>${translatedRowLabel}<`);

  // Replace {project.label}
  const translatedProjectLabel = "{['urgent'].includes((project.label||'').toLowerCase()) ? 'Dringend' : ['on track'].includes((project.label||'').toLowerCase()) ? 'Auf Kurs' : ['high priority'].includes((project.label||'').toLowerCase()) ? 'Hohe Priorität' : project.label}";
  content = content.replace(/>\s*\{project\.label\}\s*</g, `>${translatedProjectLabel}<`);

  fs.writeFileSync(fProj, content);
  console.log('Fixed on_hold and labels in Projects.jsx!');
}
