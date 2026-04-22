const fs = require('fs');
const path = require('path');

function fixSearch(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) { fixSearch(dirPath); }
    else if (dirPath.endsWith('.jsx')) {
      let content = fs.readFileSync(dirPath, 'utf8');
      let original = content;
      
      // Specifically target missing placeholders observed in UI
      content = content.replace(/searchPlaceholder="Search companies..."/g, 'searchPlaceholder={t("companies.search_placeholder")}');
      content = content.replace(/placeholder="Search companies..."/g, 'placeholder={t("companies.search_placeholder")}');
      
      content = content.replace(/searchPlaceholder="Search contacts..."/g, 'searchPlaceholder={t("contacts.search_placeholder")}');
      content = content.replace(/placeholder="Search contacts by Name, Email or..."/g, 'placeholder={t("contacts.search_placeholder")}');
      content = content.replace(/placeholder="Kontakte nach Name, E-Mail oder..."/g, 'placeholder={t("contacts.search_placeholder")}');
      
      content = content.replace(/COMPANIES\.COLUMNS/g, 'companies.columns');
      content = content.replace(/COMMON\.ACTIONS/g, 'common.actions');

      if (content !== original) {
        fs.writeFileSync(dirPath, content);
        console.log('Fixed search placeholders in', dirPath);
      }
    }
  });
}
fixSearch('src/app');
fixSearch('src/components');
