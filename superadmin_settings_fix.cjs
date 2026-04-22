const fs = require('fs');
const dePath = './frontend/src/locales/de.json';
const deData = JSON.parse(fs.readFileSync(dePath, 'utf8'));

const keysToAdd = {
  "settings": {
    ...deData.settings,
    "general": "Allgemein",
    "files": "Datei-Upload",
    "email": "E-Mail/SMTP",
    "backup": "Backup",
    "footer": "Login-Fußzeile",
    "audit": "Prüfprotokoll",
    "general_settings": {
      "title": "Allgemeine Einstellungen"
    },
    "files_settings": {
      "title": "Datei-Upload-Einstellungen"
    },
    "email_settings": {
      "title": "E-Mail/SMTP-Einstellungen"
    },
    "updates": {
      "title": "Backup-Einstellungen"
    },
    "footer_settings": {
      "title": "Login-Fußzeilen-Einstellungen"
    },
    "audit_settings": {
      "title": "Prüfprotokoll-Einstellungen"
    }
  }
};

// Merge carefully
for (const [key, value] of Object.entries(keysToAdd.settings)) {
  if (typeof value === 'object' && deData.settings[key]) {
      deData.settings[key] = { ...deData.settings[key], ...value };
  } else {
      deData.settings[key] = value;
  }
}

fs.writeFileSync(dePath, JSON.stringify(deData, null, 2));
console.log('Added superadmin settings keys to de.json');
