
const fs = require('fs');
const dePath = 'frontend/src/locales/de.json';
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));

const settingsTranslations = {
  settings: {
    app_settings: "App-Einstellungen",
    general_settings_label: "Allgemein",
    localization: "Lokalisierung",
    email: "E-Mail",
    email_templates: "E-Mail-Vorlagen",
    notifications: "Benachrichtigungen",
    updates_label: "Updates & Backup",
    ui_options_label: "Design-Einstellungen",
    pwa_settings_label: "PWA-Konfiguration",
    current_language: "Aktuelle Sprache: {{language}}",
    interface_updated: "Benutzeroberfläche aktualisiert",
    language_changed_success: "Sprache erfolgreich geändert!",
    default_language: "Standardsprache",
    ui_settings: {
        primary_color: "Primärfarbe",
        secondary_color: "Sekundärfarbe",
        sidebar_style: "Sidebar-Stil",
        top_menu_style: "Top-Menü-Stil",
        default: "Standard",
        compact: "Kompakt",
        icon_only: "Nur Symbole",
        centered: "Zentriert",
        minimal: "Minimal"
    },
    pwa: {
        title: "PWA-Einstellungen",
        enable: "PWA aktivieren",
        app_name: "App-Name",
        app_short_name: "Kurzname",
        app_description: "App-Beschreibung",
        app_icon: "App-Symbol",
        icon_recommendation: "Empfohlen: quadratisches PNG, min. 512x512px",
        app_design_color: "Farbe der Benutzeroberfläche"
    },
    localization_settings: {
        title: "Lokalisierungseinstellungen",
        currency_symbol_position: "Position des Währungssymbols",
        before_amount: "Vor dem Betrag ($ 100)",
        after_amount: "Nach dem Betrag (100 $)"
    },
    email_settings: {
        title: "E-Mail-Server-Einstellungen",
        email_driver: "E-Mail-Treiber",
        sender_email: "Absender-E-Mail",
        sender_name: "Absender-Name",
        smtp_host: "SMTP-Host",
        smtp_port: "SMTP-Port",
        smtp_encryption: "Verschlüsselung",
        smtp_username: "SMTP-Benutzername",
        smtp_password: "SMTP-Passwort"
    },
    alerts: {
        no_changes: "Keine Änderungen zum Speichern vorhanden.",
        save_success: "Einstellungen erfolgreich gespeichert!",
        save_failed: "Speichern der Einstellungen fehlgeschlagen.",
        upload_image_only: "Bitte laden Sie nur Bilddateien hoch.",
        file_too_large: "Datei ist zu groß (max. 5MB).",
        logo_success: "Logo erfolgreich aktualisiert!",
        load_failed: "Einstellungen konnten nicht geladen werden.",
        logo_upload_failed: "Logo-Upload fehlgeschlagen."
    },
    pipeline_settings: "Pipeline-Einstellungen",
    attendance_label: "Anwesenheit",
    leaves_label: "Urlaub",
    access_permission_label: "Berechtigungen",
    setup_label: "Einrichtung",
    plugins_label: "Plugins"
  },
  dashboard: {
    hr_settings: "HR-Einstellungen"
  }
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && !Array.isArray(source[key]) && key in target) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

deepMerge(de, settingsTranslations);

fs.writeFileSync(dePath, JSON.stringify(de, null, 2));
console.log('Applied German translations for Admin Settings.');
