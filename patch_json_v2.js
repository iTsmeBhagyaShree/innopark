const fs = require('fs');

const dePath = 'frontend/src/locales/de.json';
const enPath = 'frontend/src/locales/en.json';

const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Common keys
const commonDe = {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "clear": "Löschen",
    "filter": "Filter",
    "assigned_to": "Zugewiesen an",
    "all_users": "Alle Benutzer",
    "date_from": "Datum von",
    "actions": {
        "view": "Anzeigen",
        "edit": "Bearbeiten",
        "delete": "Löschen"
    },
    "status": {
        "active": "Aktiv",
        "inactive": "Inaktiv"
    },
    "no_company": "Kein Unternehmen verfügbar",
    "select_company": "Unternehmen auswählen",
    "job_title": "Berufsbezeichnung",
    "email": "E-Mail",
    "phone": "Telefon",
    "website": "Webseite",
    "address": "Adresse",
    "notes": "Notizen",
    "tags": "Tags",
    "lead_source": "Lead-Quelle",
    "website_placeholder": "https://example.com",
    "tags_placeholder": "Geben Sie Tags durch Kommas getrennt ein",
    "select_source": "Quelle auswählen",
    "referral": "Empfehlung",
    "social_media": "Soziale Medien",
    "email_campaign": "E-Mail-Kampagne",
    "cold_call": "Kaltakquise",
    "event": "Veranstaltung",
    "other": "Andere"
};

const commonEn = {
    "save": "Save",
    "cancel": "Cancel",
    "clear": "Clear",
    "filter": "Filter",
    "assigned_to": "Assigned to",
    "all_users": "All Users",
    "date_from": "Date From",
    "actions": {
        "view": "View",
        "edit": "Edit",
        "delete": "Delete"
    },
    "status": {
        "active": "Active",
        "inactive": "Inactive"
    }
};

if (!de.common) de.common = {};
Object.assign(de.common, commonDe);

if (!en.common) en.common = {};
Object.assign(en.common, commonEn);

// Deals keys
if (!de.deals) de.deals = {};
de.deals.add_deal = "Deal hinzufügen";
de.deals.edit_deal = "Deal bearbeiten";
de.deals.search_placeholder = "Deals suchen...";
de.deals.date_to = "Datum bis";
de.deals.min_value = "Mindestwert";
de.deals.max_value = "Maximalwert";

if (!en.deals) en.deals = {};
en.deals.add_deal = "Add Deal";
en.deals.edit_deal = "Edit Deal";
en.deals.search_placeholder = "Search deals...";
en.deals.date_to = "Date To";
en.deals.min_value = "Min Value";
en.deals.max_value = "Max Value";

// Leads keys
if (!de.leads) de.leads = {};
de.leads.add_new_lead = "Lead hinzufügen";
de.leads.edit_lead = "Lead bearbeiten";
de.leads.basic_info = "Basisinformationen";
de.leads.lead_type = "Lead-Typ";
de.leads.organization = "Unternehmen";
de.leads.person = "Person";
de.leads.person_name = "Name der Person";
de.leads.organization_name = "Unternehmensname";
de.leads.enter_person_name = "Namen eingeben";
de.leads.enter_organization_name = "Unternehmensnamen eingeben";
de.leads.additional_info = "Zusätzliche Informationen";

if (!en.leads) en.leads = {};
en.leads.add_new_lead = "Add New Lead";
en.leads.edit_lead = "Edit Lead";

// Contacts (already added in v1 but let's be sure)
if (!de.contacts) de.contacts = {};
de.contacts.add_contact = "Kontakt hinzufügen";
de.contacts.edit_contact = "Kontakt bearbeiten";
de.contacts.title = "Kontakte";
de.contacts.subtitle = "Verwalten Sie alle Ihre CRM-Kontakte";

if (!en.contacts) en.contacts = {};
en.contacts.add_contact = "Add Contact";
en.contacts.edit_contact = "Edit Contact";

// Companies (already added in v1 but let's be sure)
if (!de.companies) de.companies = {};
de.companies.add_company = "Unternehmen hinzufügen";
de.companies.edit_company = "Unternehmen bearbeiten";

if (!en.companies) en.companies = {};
en.companies.add_company = "Add Company";
en.companies.edit_company = "Edit Company";

fs.writeFileSync(dePath, JSON.stringify(de, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log("JSON files patched successfully (v2).");
