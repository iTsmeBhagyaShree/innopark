
const fs = require('fs');
const dePath = 'frontend/src/locales/de.json';
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));

const deepDeTranslations = {
  superadmin: {
    dashboard: "Super-Admin Übersicht",
    companies: "Unternehmen",
    packages: "Pakete",
    users: "Benutzerverwaltung",
    billing: "Abrechnung",
    offline_requests: "Offline-Anfragen",
    pwa_settings: "PWA-Einstellungen",
    total_companies: "Unternehmen gesamt",
    active_companies: "Aktive Unternehmen",
    total_packages: "Pakete gesamt",
    total_users: "Benutzer gesamt",
    total_revenue: "Gesamtumsatz",
    recent_companies: "Neueste Unternehmen",
    registered_date: "Registriert am",
    companies_growth: "Unternehmenswachstum",
    revenue_overview: "Umsatzübersicht",
    package_distribution: "Paket-Verteilung",
    quick_actions: "Schnellaktionen",
    add_company: "Unternehmen hinzufügen",
    manage_packages: "Pakete verwalten",
    view_billing: "Abrechnung anzeigen",
    manage_users: "Benutzer verwalten"
  },
  pwa: {
    title: "PWA-Einstellungen",
    subtitle: "Konfigurieren Sie die Progressive Web App-Einstellungen für die mobile Installation",
    status: "Status",
    status_enabled: "PWA ist aktiviert – Benutzer können die App auf ihren Geräten installieren",
    status_disabled: "PWA ist deaktiviert – Installationsoption wird nicht angezeigt",
    app_identity: "App-Identität",
    app_name: "App-Name",
    short_name: "Kurzname",
    app_name_helper: "Vollständiger Name Ihrer App (wird in App-Stores und Installationsdialogen angezeigt)",
    short_name_helper: "Kurzname für den Startbildschirm (empfohlen max. 12 Zeichen)",
    description: "Beschreibung",
    description_placeholder: "Beschreiben Sie Ihre App...",
    description_helper: "Kurze Beschreibung Ihrer App",
    app_appearance: "Erscheinungsbild",
    theme_color: "Theme-Farbe",
    theme_color_helper: "Farbe der Statusleiste auf mobilen Geräten",
    background_color: "Hintergrundfarbe",
    background_color_helper: "Hintergrundfarbe des Startbildschirms",
    app_icon: "App-Symbol",
    icon_helper: "Laden Sie ein quadratisches Symbol hoch (empfohlen 192×192 Pixel). Dieses Symbol wird auf dem Startbildschirm angezeigt.",
    upload_icon: "Symbol hochladen",
    icon_formats_helper: "Unterstützte Formate: PNG, JPEG, WebP (max. 2 MB)",
    installation_preview: "Installationsvorschau",
    install_app: "App installieren",
    preview_helper: "So wird Ihre App im Installationsdialog angezeigt",
    saving: "Wird gespeichert...",
    reset: "Zurücksetzen"
  },
  offline_requests: {
    title: "Offline-Anfragen",
    description: "Zahlungs- und Serviceanfragen manuell verwalten",
    add_request: "Anfrage hinzufügen",
    search_placeholder: "Anfragen suchen...",
    all_status: "Alle Status",
    status_pending: "Ausstehend",
    status_approved: "Genehmigt",
    status_rejected: "Abgelehnt",
    status_completed: "Abgeschlossen",
    company: "Unternehmen",
    type: "Typ",
    package: "Paket",
    contact: "Kontakt",
    amount: "Betrag",
    status: "Status",
    date: "Datum",
    actions: "Aktionen",
    view: "Details anzeigen",
    accept: "Akzeptieren",
    reject: "Ablehnen",
    edit: "Bearbeiten",
    delete: "Löschen",
    company_name: "Unternehmensname",
    select_company: "Unternehmen auswählen",
    select_package: "Paket auswählen",
    payment: "Zahlung",
    service: "Dienstleistung",
    support: "Support",
    other: "Sonstiges",
    contact_name: "Kontaktname",
    contact_email: "Kontakt-E-Mail",
    contact_phone: "Kontakt-Telefon",
    currency: "Währung",
    payment_method: "Zahlungsart",
    description_label: "Beschreibung",
    notes: "Notizen",
    accept_confirm: "Möchten Sie diese Anfrage wirklich akzeptieren?",
    accept_success: "Anfrage erfolgreich akzeptiert!",
    reject_reason: "Grund für die Ablehnung:",
    reject_success: "Anfrage erfolgreich abgelehnt!",
    error: "Fehler aufgetreten"
  },
  users: {
    title: "Benutzerverwaltung",
    description: "Systembenutzer und Rollen verwalten",
    add_user: "Benutzer hinzufügen",
    search_placeholder: "Benutzer suchen...",
    all_roles: "Alle Rollen",
    all_companies: "Alle Unternehmen",
    users_count: "Benutzeranzahl",
    edit_user: "Benutzer bearbeiten",
    new_password: "Neues Passwort",
    leave_empty_to_keep: "Leer lassen, um aktuelles Passwort zu behalten",
    select_company_optional: "Unternehmen auswählen (optional)",
    user_details: "Benutzerdetails",
    not_assigned: "Nicht zugewiesen",
    name_required: "Name ist erforderlich",
    email_required: "E-Mail ist erforderlich",
    password_required: "Passwort ist erforderlich",
    role_required: "Rolle ist erforderlich",
    save_success: "Benutzer erfolgreich gespeichert",
    delete_success: "Benutzer erfolgreich gelöscht"
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

deepMerge(de, deepDeTranslations);

fs.writeFileSync(dePath, JSON.stringify(de, null, 2));
console.log('Applied deep German translations for SuperAdmin and Offline Requests.');
