
const fs = require('fs');
const dePath = 'frontend/src/locales/de.json';
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));

const megaTranslations = {
  common: {
    na: "K.A.",
    today: "Heute",
    days_ago: "Tage zuvor",
    all: "Alle",
    system: "System",
    actions: {
        view: "Ansehen",
        edit: "Bearbeiten",
        delete: "Löschen",
        restore: "Wiederherstellen",
        archive: "Archivieren"
    },
    months: {
        january: "Januar",
        february: "Februar",
        march: "März",
        april: "April",
        may: "Mai",
        june: "Juni",
        july: "Juli",
        august: "August",
        september: "September",
        october: "Oktober",
        november: "November",
        december: "Dezember"
    }
  },
  sidebar: {
    pwaSettings: "PWA-Einstellungen",
    attendance: "Anwesenheit",
    leaves: "Urlaub",
    access_permission: "Berechtigungen",
    sales_prospects: "Vertriebs-Pipeline",
    setup: "Einrichtung",
    plugins: "Plugins",
    pipeline_settings: "Pipeline-Einstellungen"
  },
  dashboard: {
    hr_settings: "HR-Einstellungen"
  },
  employees: {
    title: "Mitarbeiter",
    subtitle: "Mitarbeiterliste und Verwaltung",
    add_employee: "Mitarbeiter hinzufügen",
    edit_employee: "Mitarbeiter bearbeiten",
    columns: {
        id: "ID",
        name: "Name",
        email: "E-Mail",
        department: "Abteilung",
        status: "Status"
    },
    form: {
        account_data: "Kontodaten",
        profile_image: "Profilbild",
        image_formats: "Unterstützte Formate: JPG, PNG, GIF (max. 1MB)",
        employee_id: "Personalnummer",
        salutation: "Anrede",
        name: "Vollständiger Name",
        email: "E-Mail-Adresse",
        password: "Passwort",
        hide: "Ausblenden",
        show: "Anzeigen",
        dob: "Geburtsdatum",
        gender: "Geschlecht",
        department: "Abteilung",
        designation: "Bezeichnung/Position",
        select: "Auswählen...",
        joining_date: "Eintrittsdatum",
        language: "Sprache",
        country: "Land",
        mobile: "Mobiltelefon",
        address: "Adresse",
        about: "Über den Mitarbeiter",
        other_details: "Weitere Details",
        login_allowed: "Login erlaubt",
        email_notifications: "E-Mail-Benachrichtigungen aktivieren",
        salary: "Gehalt",
        hourly_rate: "Stundensatz",
        slack_id: "Slack-Mitglieds-ID",
        skills: "Fähigkeiten",
        probation_end: "Ende der Probezeit",
        notice_start: "Kündigungsfrist Beginn",
        notice_end: "Kündigungsfrist Ende",
        employment_type: "Anstellungsart",
        marital_status: "Familienstand",
        business_address: "Geschäftsadresse"
    },
    values: {
        mr: "Herr",
        mrs: "Frau",
        miss: "Fräulein",
        dr: "Dr.",
        prof: "Prof.",
        male: "Männlich",
        female: "Weiblich",
        other: "Sonstiges",
        yes: "Ja",
        no: "Nein",
        full_time: "Vollzeit",
        part_time: "Teilzeit",
        contract: "Vertrag",
        internship: "Praktikum",
        trainee: "Auszubildender",
        single: "Ledig",
        married: "Verheiratet",
        widowed: "Verwitwet",
        divorced: "Geschieden",
        separated: "Getrennt"
    },
    alerts: {
        fetch_failed: "Fehler beim Laden des Mitarbeiters.",
        name_email_required: "Name und E-Mail sind erforderlich.",
        password_required: "Passwort ist erforderlich für neue Mitarbeiter.",
        update_success: "Mitarbeiter erfolgreich aktualisiert!",
        update_failed: "Aktualisierung fehlgeschlagen.",
        create_success: "Mitarbeiter erfolgreich erstellt!",
        create_failed: "Erstellung fehlgeschlagen.",
        save_failed: "Speichern fehlgeschlagen.",
        delete_success: "Mitarbeiter erfolgreich gelöscht!"
    }
  },
  leads: {
    title: "Leads",
    subtitle: "Lead-Verwaltung und Pipeline",
    add_lead: "Neuen Lead hinzufügen",
    stages: {
        new: "Neu",
        contacted: "Kontaktiert",
        qualified: "Qualifiziert",
        proposal: "Angebot gesendet",
        negotiation: "Verhandlung",
        won: "Gewonnen",
        lost: "Verloren"
    },
    alerts: {
        no_data_export: "Keine Daten zum Exportieren vorhanden.",
        save_success: "Lead erfolgreich gespeichert!",
        load_error: "Fehler beim Laden der Leads."
    }
  },
  meetings: {
    title_required: "Titel ist erforderlich",
    location_required: "Ort ist erforderlich",
    date_required: "Datum ist erforderlich",
    time_required: "Zeit ist erforderlich",
    create_success: "Termin erfolgreich erstellt!"
  },
  tasks: {
    centralized_tasks: "Zentralisierte Aufgaben",
    subtitle: "Alle Aufgaben an einem Ort verwalten",
    source: "Quelle",
    crm: "CRM",
    project: "Projekt",
    all_tasks: "Alle Aufgaben",
    only_me: "Nur meine",
    new_task: "Neue Aufgabe",
    status: "Status",
    priority: "Priorität",
    source_module: "Quellmodul",
    assignee: "Zuständig",
    from_date: "Ab Datum",
    reset_filters: "Filter zurücksetzen",
    all_status: "Alle Status",
    pending: "Ausstehend",
    completed: "Abgeschlossen",
    overdue: "Überfällig",
    all_priorities: "Alle Prioritäten",
    high: "Hoch",
    medium: "Mittel",
    low: "Niedrig",
    any_module: "Jedes Modul",
    global_all: "Alle Benutzer",
    no_tasks: "Keine Aufgaben",
    no_tasks_found: "Keine Aufgaben gefunden, die Ihren Filtern entsprechen.",
    showing_x_of_y: "Zeige {{count}} von {{total}} Aufgaben",
    back: "Zurück",
    next: "Weiter",
    subject: "Betreff",
    subject_placeholder: "Aufgabentitel eingeben...",
    due_date: "Fällig am",
    auto_assign_self: "Sich selbst zuweisen",
    entity_module: "Verknüpftes Modul",
    no_link: "Keine Verknüpfung",
    select_specific: "{{type}} auswählen",
    select_item: "Element auswählen...",
    loading: "Wird geladen...",
    description: "Beschreibung",
    description_placeholder: "Aufgabendetails eingeben...",
    cancel: "Abbrechen",
    save_changes: "Änderungen speichern",
    confirm_task: "Aufgabe bestätigen",
    edit_task: "Aufgabe bearbeiten"
  },
  settings: {
    leave: {
        title: "Urlaubseinstellungen",
        description: "Verwalten Sie Urlaubsarten und Richtlinien",
        tabs: {
            types: "Urlaubsarten",
            general: "Allgemeine Einstellungen",
            archived: "Archiviert"
        },
        table: {
            type: "Art",
            allotment: "Zuteilung",
            no_leaves: "Anzahl Tage",
            paid_status: "Bezahlung",
            dept: "Abteilungen",
            dept_single: "Abt.",
            dept_plural: "Abt.",
            desig: "Positionen",
            desig_single: "Pos.",
            desig_plural: "Pos."
        },
        modal: {
            add_title: "Neue Urlaubsart hinzufügen",
            edit_title: "Urlaubsart bearbeiten",
            tabs: {
                general: "Allgemein",
                entitlement: "Anspruch",
                applicability: "Anwendbarkeit"
            },
            monthly: "Monatlich",
            yearly: "Jährlich",
            paid: "Bezahlt",
            unpaid: "Unbezahlt",
            color_code: "Farbe",
            allotment_type: "Zuteilungsart",
            paid_status: "Zahlungsstatus",
            leaves_per_year: "Tage pro Jahr",
            enter_leaves: "Anzahl eingeben",
            monthly_limit: "Monatliches Limit",
            carry_forward: "Übertrag in das nächste Jahr erlauben",
            max_carry_forward: "Maximaler Übertrag",
            applicable_depts: "Anwendbar auf Abteilungen",
            applicable_desigs: "Anwendbar auf Positionen",
            all_depts: "Alle Abteilungen",
            all_desigs: "Alle Positionen",
            empty_depts: "Keine Abteilungen gefunden",
            empty_desigs: "Keine Positionen gefunden"
        },
        general_settings: {
            title: "Globale Urlaubseinstellungen",
            desc: "Konfigurieren Sie, wie Urlaube systemweit berechnet und genehmigt werden",
            count_from: "Urlaubstage zählen ab",
            from_joining: "Eintrittsdatum",
            from_year_start: "Jahresbeginn",
            year_starts: "Das Jahr beginnt im Monat",
            manager_can: "Berichterstattender Manager kann",
            approve: "Genehmigen",
            pre_approve: "Vorgenehmigen"
        },
        alerts: {
            load_error: "Fehler beim Laden der Urlaubseinstellungen.",
            name_required: "Name der Urlaubsart ist erforderlich.",
            min_leaves: "Anzahl der Tage muss größer als 0 sein.",
            allotment_required: "Zuteilungsart ist erforderlich.",
            save_success: "Einstellungen erfolgreich gespeichert!",
            save_error: "Fehler beim Speichern der Einstellungen.",
            delete_confirm: "Sind Sie sicher, dass Sie diese Urlaubsart dauerhaft löschen möchten?",
            archive_confirm: "Sind Sie sicher, dass Sie diese Urlaubsart archivieren möchten?"
        }
    }
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

deepMerge(de, megaTranslations);

fs.writeFileSync(dePath, JSON.stringify(de, null, 2));
console.log('Applied Mega German translations for all reported modules.');
