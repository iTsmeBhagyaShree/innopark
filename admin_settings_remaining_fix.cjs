const fs = require('fs');
const dePath = './frontend/src/locales/de.json';
const deData = JSON.parse(fs.readFileSync(dePath, 'utf8'));

if (!deData.settings) deData.settings = {};

const newKeys = {
  "access": {
    "title": "Zugriffs- und Berechtigungseinstellungen",
    "description": "Verwalten Sie die Systemzugriffsebenen, Standardberechtigungen und Sicherheitsrichtlinien für alle Benutzer.",
    "info": "Berechtigungen werden nach dem Prinzip der geringsten Privilegien vergeben. Benutzer haben nur Zugriff auf ausdrücklich zugelassene Module.",
    "default_role": "Standardrolle für neue Benutzer",
    "admin": "Admin",
    "employee": "Mitarbeiter",
    "enable_2fa": "Zwei-Faktor-Authentifizierung (2FA) erzwingen",
    "enable_2fa_desc": "Erfordert, dass alle Administratoren 2FA für zusätzlichen Schutz aktivieren"
  },
  "sales": {
    "title": "Vertriebs- & Interessenteneinstellungen",
    "description": "Konfigurieren Sie Verkaufs-Pipelines, Lead-Quellen und Automatisierungsregeln für Ihr Vertriebsteam.",
    "qualified": "Qualifiziert",
    "proposal": "Angebot gesendet",
    "negotiation": "In Verhandlung",
    "auto_convert": "Qualifizierte Leads automatisch konvertieren",
    "auto_convert_desc": "Leads automatisch in Kontakte umwandeln, wenn ein Angebot angenommen wird",
    "source_placeholder": "z.B. Website-Formular, Kaltakquise",
    "default_stages": "Standard-Vertriebspipeline-Stufen",
    "default_lead_source": "Standard-Lead-Quelle"
  },
  "setup": {
    "title": "Systemeinrichtung & Status",
    "description": "Überwachen Sie den Systemstatus, prüfen Sie Datenbankverbindungen und verwalten Sie Kernsystemkomponenten.",
    "info": "Dieser Abschnitt zeigt Echtzeitinformationen und Diagnosen über die Gesundheit Ihres CRM-Systems.",
    "system_ready": "System ist ordnungsgemäß eingerichtet und bereit",
    "database_active": "Datenbankverbindung ist aktiv (PostgreSQL)",
    "system_status": "Systemstatus",
    "database_status": "Datenbankstatus"
  },
  "plugins": {
    "title": "Plugins & Erweiterungen",
    "description": "Verwalten Sie Drittanbieter-Integrationen, benutzerdefinierte Plugins und Systemerweiterungen.",
    "no_plugins": "Es sind derzeit keine Plugins installiert.",
    "install_plugin": "Neues Plugin installieren",
    "auto_update_plugins": "Plugins automatisch aktualisieren",
    "auto_update_plugins_desc": "Installierte Plugins auf dem neuesten Stand halten, wenn neue Versionen verfügbar sind"
  }
};

for (const [key, obj] of Object.entries(newKeys)) {
  if (!deData.settings[key]) {
    deData.settings[key] = obj;
  } else {
    for (const [nestedKey, val] of Object.entries(obj)) {
      deData.settings[key][nestedKey] = val;
    }
  }
}

fs.writeFileSync(dePath, JSON.stringify(deData, null, 2));
console.log('Added missing keys for access, sales, setup, and plugins to de.json');
