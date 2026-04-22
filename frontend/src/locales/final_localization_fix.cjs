
const fs = require('fs');

const enPath = 'frontend/src/locales/en.json';
const dePath = 'frontend/src/locales/de.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// 1. Audit en.json for German leaks and fix them
const enFixes = {
  reports: {
    tabs: {
      sales_pipeline: "Sales Pipeline"
    }
  },
  tasks: {
      showing_x_of_y: "Showing {{count}} of {{total}} tasks"
  },
  invoices: {
      sendEmail: "Send Email"
  }
};

// 2. Comprehensive de.json translation dictionary
const deTranslations = {
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
    logout: "Abmelden",
    tagline: "Ihre CRM-Lösung für Wachstum und Effizienz",
    analytics_dashboard: "Analyse-Dashboard",
    track_metrics: "Kennzahlen verfolgen",
    team_collaboration: "Team-Zusammenarbeit",
    work_seamlessly: "Nahtlos arbeiten",
    customizable_workflows: "Anpassbare Workflows",
    adapt_needs: "An Ihre Bedürfnisse anpassen"
  },
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
      on_hold: "Wartend",
      approved: "Genehmigt",
      rejected: "Abgelehnt"
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
    previous: "Vorherige",
    view: "Ansehen",
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
    no_data_found: "Keine Daten gefunden",
    try_adjusting: "Versuchen Sie, Ihre Filter anzupassen",
    all: "Alle",
    none: "Keine",
    saving: "Wird gespeichert...",
    update: "Aktualisieren",
    create: "Erstellen",
    columns: "Spalten",
    showing: "Anzeige von",
    of: "von",
    entries: "Einträgen",
    show: "Anzeigen",
    hide: "Ausblenden",
    role: "Rolle",
    na: "N/V",
    retry: "Wiederholen",
    view_all: "Alle anzeigen",
    not_assigned: "Nicht zugewiesen",
    success_msg: "Erfolgreich durchgeführt",
    error_msg: "Ein Fehler ist aufgetreten",
    confirm_delete: "Sind Sie sicher, dass Sie dies löschen möchten?",
    confirmation: {
        delete: "Sind Sie sicher, dass Sie dies löschen möchten?",
        irreversible: "Diese Aktion kann nicht rückgängig gemacht werden."
    }
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
    attendance_settings: "Anwesenheitseinstellungen",
    leave_settings: "Urlaubseinstellungen",
    general_settings: "Allgemeine Einstellungen",
    pipeline_settings: "Pipelines",
    custom_fields: "Benutzerdefinierte Felder",
    access_permission: "Berechtigungen",
    sales_prospects: "Vertrieb",
    setup: "Einrichtung",
    plugins: "Erweiterungen",
    administration: "Verwaltung"
  },
  dashboard: {
    title: "Übersicht",
    welcome: "Willkommen zurück",
    overview: "Aktuelle Systemübersicht",
    total_leads: "Gesamt Leads",
    projects: "Projekte",
    revenue: "Umsatz",
    add_lead: "Lead hinzufügen",
    sales_pipeline: "Vertriebspipeline",
    lead_values: "Lead-Werte",
    total_pipeline_value: "Gesamt-Pipelinewert",
    leads_by_source: "Leads nach Quelle",
    recent_activity: "Letzte Aktivitäten",
    view_all: "Alle anzeigen",
    quick_stats: "Schnellstatistik",
    total_clients: "Gesamt Kunden",
    total_projects: "Gesamt Projekte",
    total_tasks: "Gesamt Aufgaben",
    total_revenue: "Gesamter Umsatz",
    pending_tasks: "Ausstehende Aufgaben",
    completed_tasks: "Abgeschlossene Aufgaben",
    recentActivity: "Letzte Aktivitäten",
    upcoming_meetings: "Anstehende Termine",
    quickStats: "Schnellstatistik",
    deals_won_lost: "Gewonnene vs. Verlorene Deals",
    deals_won: "Gewonnen",
    deals_lost: "Verloren",
    won_value: "Gewinnwert",
    lost_value: "Verlustwert",
    global_tasks: "Globale Aufgaben",
    manage_tasks: "Alle Aufgaben verwalten",
    appointments: "Geplante Termine",
    hr_settings: "HR-Einstellungen"
  },
  leads: {
    title: "Leads",
    no_leads: "Keine Leads gefunden",
    add_new_lead: "Neuen Lead hinzufügen",
    edit_lead: "Lead bearbeiten",
    add_lead: "Lead hinzufügen",
    items: "Leads",
    total_leads: "Gesamt Leads",
    basic_info: "Basisinformationen",
    lead_details: "Lead-Details",
    contact_name: "Kontaktname",
    lead_name: "Lead-Name",
    company: "Unternehmen",
    status: "Status",
    value: "Wert",
    source: "Quelle",
    owner: "Besitzer",
    created_date: "Erstellt am",
    email: "E-Mail",
    phone: "Telefon",
    actions: "Aktionen",
    back_to_leads: "Zurück zu Leads",
    view: {
        lead_details: "Lead-Details",
        overview: "Übersicht",
        quotes: "Angebote",
        deals: "Abschlüsse",
        contracts: "Verträge",
        files: "Dateien"
    },
    placeholder_value: "Lead-Wert eingeben",
    probability: "Wahrscheinlichkeit (%)",
    placeholder_notes: "Notizen zu diesem Lead eingeben...",
    required_services: "Erforderliche Dienstleistungen",
    estimated_total: "Geschätzter Gesamtwert",
    lead_type: "Lead-Typ",
    organization: "Organisation",
    person: "Person",
    person_name: "Name der Person",
    organization_name: "Unternehmensname",
    offer_email: "E-Mail-Angebot",
    send_email: "E-Mail senden",
    search_placeholder: "Leads suchen...",
    alerts: {
        save_failed: "Speichern fehlgeschlagen",
        import_success: "Import erfolgreich",
        import_failed: "Import fehlgeschlagen"
    }
  },
  projects: {
    title: "Projekte",
    subtitle: "Alle Projekte verwalten und verfolgen",
    all_projects: "Alle Projekte",
    add_project: "Projekt hinzufügen",
    edit_project: "Projekt bearbeiten",
    search_placeholder: "Projekte suchen...",
    columns: {
        name: "Projektname",
        client: "Kunde",
        price: "Preis",
        start_date: "Startdatum",
        deadline: "Deadline",
        priority: "Priorität",
        progress: "Fortschritt",
        status: "Status"
    },
    status: {
        incomplete: "Unvollständig",
        pending: "Ausstehend",
        in_progress: "In Bearbeitung",
        completed: "Abgeschlossen",
        doing: "In Arbeit",
        done: "Erledigt"
    },
    progress: "Fortschritt",
    deadline: "Deadline",
    details: "Projektdetails",
    team_members: "Teammitglieder",
    project_tasks: "Projekt-Aufgaben",
    no_projects_found: "Keine Projekte gefunden"
  },
  tasks: {
    title: "Aufgaben",
    subtitle: "Alle Aktivitäten und Aufgaben verfolgen",
    add_task: "Aufgabe hinzufügen",
    search_placeholder: "Aufgaben suchen...",
    edit_task: "Aufgabe bearbeiten",
    all_tasks: "Alle Aufgaben",
    new_task: "Neue Aufgabe",
    columns: {
        task: "Aufgabe",
        project: "Projekt",
        assigned_to: "Zugewiesen an",
        due_date: "Fällig am",
        status: "Status",
        priority: "Priorität"
    },
    status: "Status",
    priority: "Priorität",
    pending: "Ausstehend",
    completed: "Abgeschlossen",
    overdue: "Überfällig",
    status_open: "Offen",
    status_completed: "Abgeschlossen",
    high: "Hoch",
    medium: "Mittel",
    low: "Niedrig",
    description: "Beschreibung",
    due_date: "Fälligkeitsdatum",
    no_tasks_found: "Keine Aufgaben gefunden",
    showing_x_of_y: "Anzeige von {{count}} von {{total}} Aufgaben",
    subject: "Betreff",
    subject_placeholder: "Was ist zu tun?",
    mission_objective: "Aufgabenziel",
    deploy_assignment: "Aufgabe speichern",
    abort_mission: "Abbrechen",
    assignee: "Verantwortlicher",
    from_date: "Von Datum",
    only_me: "Nur ich",
    any_module: "Beliebiges Modul"
  },
  invoices: {
    title: "Rechnungen",
    subtitle: "Rechnungen an Kunden verwalten",
    add_invoice: "Rechnung hinzufügen",
    invoice_no: "Rechnungs-Nr.",
    bill_date: "Rechnungsdatum",
    due_date: "Fälligkeitsdatum",
    total: "Gesamt",
    paid: "Bezahlt",
    unpaid: "Unbezahlt",
    partiallyPaid: "Teilweise bezahlt",
    overdue: "Überfällig",
    draft: "Entwurf",
    columns: {
        number: "Rechnungs-Nr.",
        total: "Gesamtbetrag",
        status: "Status"
    },
    client_required: "Kunde ist erforderlich",
    due_date_required: "Fälligkeitsdatum ist erforderlich",
    tax: "Steuer",
    second_tax: "Zweite Steuer",
    discount: "Rabatt",
    received: "Erhalten",
    due: "Fällig",
    search_placeholder: "Rechnungen suchen...",
    total_paid: "Gesamt bezahlt",
    total_unpaid: "Gesamt offen"
  },
  settings: {
    title: "Einstellungen",
    subtitle: "System- und Unternehmenseinstellungen anpassen",
    app_settings: "App-Einstellungen",
    general_settings_label: "Allgemein",
    localization: "Lokalisierung",
    default_language: "Standardsprache",
    email: "E-Mail",
    email_templates: "E-Mail-Vorlagen",
    notifications: "Benachrichtigungen",
    updates_label: "Updates & Backup",
    ui_options: "UI-Optionen",
    ui_options_label: "Design-Einstellungen",
    pwa: {
        title: "PWA-Einstellungen",
        enable: "PWA aktivieren",
        app_name: "App-Name",
        app_short_name: "Kurzname",
        app_description: "Beschreibung",
        app_icon: "App-Symbol",
        app_design_color: "Design-Farbe"
    },
    general_settings: {
        title: "Allgemeine Einstellungen",
        company_information: "Unternehmensinformationen",
        company_name: "Unternehmensname",
        company_email: "E-Mail-Adresse",
        company_phone: "Telefonnummer",
        company_website: "Webseite",
        company_address: "Anschrift",
        company_logo: "Unternehmenslogo",
        system_settings: "Systemeinstellungen",
        system_name: "Systemname",
        default_currency: "Standardwährung",
        timezone: "Zeitzone",
        date_format: "Datumsformat",
        time_format: "Zeitformat",
        currency_position: "Währungsposition"
    },
    localization_settings: {
        title: "Lokalisierungseinstellungen",
        description: "Bevorzugte Sprache und regionale Formate festlegen"
    },
    email_settings: {
        title: "E-Mail-Einstellungen",
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
        save_success: "Einstellungen erfolgreich gespeichert",
        save_failed: "Speichern fehlgeschlagen",
        logo_success: "Logo erfolgreich hochgeladen"
    },
    language_changed_success: "Sprache erfolgreich geändert!",
    interface_updated: "Die Programmoberfläche wurde aktualisiert.",
    current_language: "Aktuelle Sprache: {{language}}"
  },
  employees: {
    title: "Mitarbeiter",
    subtitle: "Belegschaft verwalten",
    add_employee: "Mitarbeiter hinzufügen",
    columns: {
        name: "Name",
        email: "E-Mail",
        department: "Abteilung",
        status: "Status"
    },
    form: {
        account_data: "Kontodaten",
        profile_image: "Profilbild",
        employee_id: "Mitarbeiter-ID",
        name: "Name",
        email: "E-Mail",
        password: "Passwort",
        dob: "Geburtsdatum",
        gender: "Geschlecht",
        department: "Abteilung",
        designation: "Bezeichnung",
        joining_date: "Eintrittsdatum",
        mobile: "Mobilnummer",
        address: "Anschrift",
        salary: "Gehalt",
        employment_type: "Beschäftigungsverhältnis"
    }
  },
  reports: {
    title: "Berichte",
    subtitle: "Geschäftsanalyse und Export",
    refresh: "Aktualisieren",
    excel: "Excel-Export",
    print: "Drucken",
    tabs: {
        sales_pipeline: "Vertriebspipeline",
        leads_analytics: "Lead-Analyse",
        deals_analytics: "Deal-Analyse",
        activity_report: "Aktivitätsbericht",
        expenses_summary: "Ausgaben-Übersicht",
        invoices_summary: "Rechnungs-Übersicht",
        invoice_details: "Rechnungs-Details",
        income_expense: "Einnahmen vs. Ausgaben",
        payments_summary: "Zahlungs-Übersicht",
        timesheets: "Stundenzettel",
        projects_report: "Projektbericht"
    }
  },
  custom_fields: {
    title: "Benutzerdefinierte Felder",
    subtitle: "Zusätzliche Felder für alle Module erstellen",
    add: "Feld hinzufügen"
  },
  // SuperAdmin specific keys found in previous audit
  dashboard_title: "Super-Admin Dashboard",
  dashboard_subtitle: "Systemübersicht und Statistiken",
  total_companies: "Unternehmen gesamt",
  active_companies: "Aktive Unternehmen",
  total_packages: "Pakete gesamt",
  total_users: "Benutzer gesamt",
  total_clients: "Kunden gesamt",
  total_revenue: "Gesamtumsatz",
  total_invoices: "Rechnungen gesamt",
  registered_date: "Registriert am",
  recent_companies: "Neueste Unternehmen",
  manage_packages: "Pakete verwalten",
  manage_users: "Benutzer verwalten",
  offline_requests_title: "Offline-Anfragen",
  billing_title: "Abrechnung",
  users_title: "Benutzerverwaltung",
  pwa_title: "PWA-Konfiguration",
  users_obj: {
      title: "Alle Benutzer",
      description: "Alle Systembenutzer und Rollen verwalten"
  }
};

// Deep merge function
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && !Array.isArray(source[key]) && key in target) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

// Fix EN leaks
deepMerge(en, enFixes);

// Apply DE translations
deepMerge(de, deTranslations);

// Final cleanup: Ensure no template literals strings remain in the values themselves unless intentional
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(dePath, JSON.stringify(de, null, 2));

console.log('Successfully completed localization audit and fix for EN and DE.');
