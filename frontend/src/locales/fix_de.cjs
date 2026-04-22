
const fs = require('fs');
const dePath = 'frontend/src/locales/de.json';
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// Apply comprehensive German translations for core modules
const deFixes = {
  common: {
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    add: "Hinzufügen",
    search: "Suchen...",
    loading: "Wird geladen...",
    no_data: "Keine Daten verfügbar",
    actions: "Aktionen",
    status: {
      in_progress: "In Bearbeitung",
      active: "Aktiv",
      inactive: "Inaktiv",
      pending: "Ausstehend",
      completed: "Abgeschlossen",
      on_hold: "Wartend"
    },
    date: "Datum",
    name: "Name",
    email: "E-Mail",
    phone: "Telefon",
    address: "Adresse",
    description: "Beschreibung",
    amount: "Betrag",
    total: "Gesamt",
    submit: "Absenden",
    close: "Schließen",
    yes: "Ja",
    no: "Nein",
    confirm: "Bestätigen",
    back: "Zurück",
    next: "Weiter",
    previous: "Zurück",
    view: "Anzeigen",
    download: "Herunterladen",
    upload: "Hochladen",
    export: "Exportieren",
    import: "Importieren",
    reset: "Zurücksetzen",
    filter: "Filter",
    clear_all: "Alles löschen",
    all_status: "Alle Status",
    success: "Erfolgreich",
    warning: "Warnung",
    info: "Information",
    created: "Erstellt",
    updated: "Aktualisiert",
    deleted: "Gelöscht",
    refresh: "Aktualisieren",
    dashboards: "Übersichten",
    profile: "Profil",
    filters: "Filter",
    created_date: "Erstellungsdatum",
    no_data_found: "Keine Daten gefunden"
  },
  sidebar: {
    dashboard: "Übersicht",
    crmSales: "CRM & Vertrieb",
    leads: "Leads",
    clients: "Kunden",
    work: "Arbeit",
    projects: "Projekte",
    tasks: "Aufgaben",
    finance: "Finanzen",
    invoices: "Rechnungen",
    payments: "Zahlungen",
    estimates: "Kostenvoranschläge",
    expenses: "Ausgaben",
    teamOperations: "Teambetrieb",
    employees: "Mitarbeiter",
    attendance: "Anwesenheit",
    leaves: "Urlaub",
    communication: "Kommunikation",
    messages: "Nachrichten",
    notices: "Mitteilungen",
    events: "Termine",
    toolsUtilities: "Werkzeuge",
    documents: "Dokumente",
    reports: "Berichte",
    settings: "Einstellungen",
    packages: "Pakete",
    billing: "Abrechnung",
    users: "Benutzer",
    offlineRequests: "Offline-Anfragen",
    pwaSettings: "PWA-Einstellungen",
    proposals: "Angebote",
    creditNotes: "Gutschriften",
    store: "Shop",
    subscriptions: "Abonnements",
    orders: "Bestellungen",
    companies: "Unternehmen",
    logout: "Abmelden",
    crm: "CRM",
    offers: "Angebote",
    contacts: "Kontakte",
    deals: "Abschlüsse",
    notifications: "Benachrichtigungen",
    calendar: "Kalender",
    my_profile: "Mein Profil",
    hr_settings: "HR-Einstellungen",
    general_settings: "Allgemeine Einstellungen"
  },
  dashboard: {
    title: "Übersicht",
    welcome: "Willkommen zurück",
    overview: "Hier ist Ihre Systemübersicht",
    total_leads: "Gesamt Leads",
    projects: "Projekte",
    revenue: "Umsatz",
    add_lead: "Lead hinzufügen",
    sales_pipeline: "Vertriebspipeline",
    lead_values: "Lead-Werte",
    total_pipeline_value: "Gesamt-Pipelinewert",
    recent_activity: "Letzte Aktivitäten",
    view_all: "Alle anzeigen",
    quick_stats: "Schnellstatistik",
    total_clients: "Gesamt Kunden",
    total_projects: "Gesamt Projekte",
    total_tasks: "Gesamt Aufgaben",
    total_revenue: "Gesamter Umsatz",
    pending_tasks: "Ausstehende Aufgaben",
    completed_tasks: "Abgeschlossene Aufgaben",
    upcoming_meetings: "Anstehende Termine"
  },
  leads: {
    no_leads: "Keine Leads gefunden",
    add_new_lead: "Neuen Lead hinzufügen",
    edit_lead: "Lead bearbeiten",
    items: "Leads",
    title: "Leads",
    basic_info: "Basisinformationen",
    lead_details: "Lead-Details",
    total_leads: "Gesamt Leads"
  },
  projects: {
    title: "Projekte",
    subtitle: "Verwalten und verfolgen Sie alle Unternehmensprojekte",
    all_projects: "Alle Projekte",
    add_project: "Projekt hinzufügen",
    edit_project: "Projekt bearbeiten",
    search_placeholder: "Projekte suchen...",
    progress: "Fortschritt",
    deadline: "Deadline",
    status: {
      pending: "Ausstehend",
      in_progress: "In Bearbeitung",
      completed: "Abgeschlossen"
    }
  },
  tasks: {
    title: "Aufgaben",
    subtitle: "Verfolgen Sie alle Aktivitäten und Aufgaben",
    add_task: "Aufgabe hinzufügen",
    search_placeholder: "Aufgaben suchen...",
    edit_task: "Aufgabe bearbeiten",
    all_tasks: "Alle Aufgaben",
    new_task: "Neue Aufgabe",
    status: "Status",
    priority: "Priorität",
    pending: "Ausstehend",
    completed: "Abgeschlossen",
    overdue: "Überfällig",
    high: "Hoch",
    medium: "Mittel",
    low: "Niedrig",
    description: "Beschreibung",
    due_date: "Fälligkeitsdatum"
  },
  invoices: {
    title: "Rechnungen",
    add_invoice: "Rechnung hinzufügen",
    subtitle: "Rechnungen verwalten",
    paid: "Bezahlt",
    unpaid: "Unbezahlt",
    overdue: "Überfällig",
    invoice_no: "Rechnungs-Nr."
  }
};

// Deep merge fixes into de
function merge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

merge(de, deFixes);

fs.writeFileSync(dePath, JSON.stringify(de, null, 2));
console.log('Applied German translation fixes.');
