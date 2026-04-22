
const fs = require('fs');
const dePath = 'frontend/src/locales/de.json';
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));

const extraDeFixes = {
  auth: {
    welcome_back: "Willkommen zurück",
    select_role: "Wählen Sie Ihre Rolle zum Anmelden",
    email: "E-Mail",
    password: "Passwort",
    remember_me: "Angemeldet bleiben",
    forgot_password: "Passwort vergessen?",
    sign_in_as: "Anmelden als",
    signing_in: "Anmeldung läuft...",
    please_wait: "Bitte warten",
    login: "Anmelden",
    logout: "Abmelden"
  },
  settings: {
    title: "Einstellungen",
    subtitle: "Konfigurieren Sie Ihre Anwendungs- und Unternehmenseinstellungen",
    app_settings: "App-Einstellungen",
    localization: "Lokalisierung",
    default_language: "Standardsprache",
    current_language: "Aktuelle Sprache: {{language}}",
    language_changed_success: "Sprache erfolgreich geändert!",
    interface_updated: "Die Benutzeroberfläche wurde aktualisiert."
  },
  common: {
    no_data_found: "Keine Daten gefunden",
    try_adjusting: "Versuchen Sie, Ihre Filter anzupassen",
    all: "Alle",
    none: "Keine"
  }
};

function merge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

merge(de, extraDeFixes);

fs.writeFileSync(dePath, JSON.stringify(de, null, 2));
console.log('Applied extra German translation fixes.');
