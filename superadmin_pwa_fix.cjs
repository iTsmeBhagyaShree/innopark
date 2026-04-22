const fs = require('fs');
const dePath = './frontend/src/locales/de.json';
const deData = JSON.parse(fs.readFileSync(dePath, 'utf8'));

const keysToAdd = {
  "pwa": {
    "app_identity": "App-Identität",
    "app_name": "App-Name",
    "short_name": "Kurzname",
    "description": "Beschreibung",
    "colors": "Farben",
    "theme_color": "Themenfarbe",
    "bg_color": "Hintergrundfarbe",
    "app_icon": "App-Symbol",
    "status_enabled": "PWA ist derzeit für alle Benutzer aktiviert",
    "status_disabled": "PWA ist derzeit deaktiviert",
    "preview": "Vorschau",
    "preview_help": "So könnte Ihre App auf dem Startbildschirm eines Benutzers aussehen",
    "install_app": "App installieren",
    "subtitle": "Konfigurieren Sie, wie sich das System als Progressive Web App verhält"
  },
  "alerts": {
    "invalid_image": "Bitte laden Sie ein PNG-, JPEG- oder WebP-Bild hoch",
    "app_name_required": "App-Name ist erforderlich",
    "short_name_required": "Kurzname ist erforderlich",
    "invalid_hex_theme": "Die Themenfarbe muss eine gültige HEX-Farbe sein",
    "invalid_hex_bg": "Die Hintergrundfarbe muss eine gültige HEX-Farbe sein",
    "save_success": "PWA-Einstellungen erfolgreich gespeichert!",
    "save_failed": "PWA-Einstellungen konnten nicht gespeichert werden",
    "file_too_large": "Die Dateigröße darf nicht mehr als 2 MB betragen"
  }
};

for (const [key, value] of Object.entries(keysToAdd)) {
  if (!deData[key]) {
      deData[key] = value;
  } else {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
          deData[key][nestedKey] = nestedValue;
      }
  }
}

fs.writeFileSync(dePath, JSON.stringify(deData, null, 2));
console.log('Added PWA and alert keys to de.json');
