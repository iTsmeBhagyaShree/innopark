const fs = require('fs');

const dePath = 'frontend/src/locales/de.json';
const enPath = 'frontend/src/locales/en.json';

const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Patch de.json leads
if (de.leads) {
    de.leads.title = "Leads";
    de.leads.add_new_lead = "Lead hinzufügen";
    if (de.leads.columns) {
        de.leads.columns.lead = "Lead";
        de.leads.columns.actions = "Aktionen";
        de.leads.columns.email = "E-Mail";
        de.leads.columns.phone = "Telefon";
    }
}

// Patch de.json companies
if (de.companies) {
    de.companies.title = "Unternehmen";
    if (!de.companies.columns) de.companies.columns = {};
    de.companies.columns.company_name = "Firmenname";
    de.companies.columns.industry = "Branche";
    de.companies.columns.website = "Webseite";
    de.companies.columns.phone = "Telefon";
    de.companies.columns.status = "Status";
    de.companies.columns.address = "Adresse";
    de.companies.columns.notes = "Notizen";

    if (!de.companies.form) de.companies.form = {};
    de.companies.form.company_name = "Firmenname";
    de.companies.form.industry = "Branche";
    de.companies.form.website = "Webseite";
    de.companies.form.phone = "Telefon";
    de.companies.form.address = "Adresse";
    de.companies.form.city = "Stadt";
    de.companies.form.state = "Bundesland";
    de.companies.form.country = "Land";
    de.companies.form.notes = "Notizen";
    de.companies.form.select_industry = "Branche auswählen";
    de.companies.form.website_placeholder = "https://example.com";
    de.companies.form.phone_placeholder = "+49 123 456789";
}

// Patch en.json companies
if (en.companies && !en.companies.columns) {
    en.companies.columns = {
        "company_name": "Company Name",
        "industry": "Industry",
        "website": "Website",
        "phone": "Phone",
        "status": "Status",
        "address": "Address",
        "notes": "Notes"
    };
}
if (en.companies && !en.companies.form) {
    en.companies.form = {
        "company_name": "Company Name",
        "industry": "Industry",
        "website": "Website",
        "phone": "Phone",
        "address": "Address",
        "city": "City",
        "state": "State",
        "country": "Country",
        "notes": "Notes",
        "select_industry": "Select Industry",
        "website_placeholder": "https://example.com",
        "phone_placeholder": "+1 234 567 890"
    };
}

// Add contacts to both
en.contacts = {
    "title": "Contacts",
    "subtitle": "Manage all your CRM contacts",
    "add_contact": "Add Contact",
    "edit_contact": "Edit Contact",
    "search_placeholder": "Search contacts...",
    "columns": {
        "name": "Name",
        "email": "Email",
        "company": "Company",
        "status": "Status"
    }
};

de.contacts = {
    "title": "Kontakte",
    "subtitle": "Verwalten Sie alle Ihre CRM-Kontakte",
    "add_contact": "Kontakt hinzufügen",
    "edit_contact": "Kontakt bearbeiten",
    "search_placeholder": "Kontakte suchen...",
    "columns": {
        "name": "Name",
        "email": "E-Mail",
        "company": "Unternehmen",
        "status": "Status"
    }
};

// Add deals to en.json (if missing some parts)
if (!en.deals) en.deals = {};
if (!en.deals.kanban) {
    en.deals.kanban = { "no_stages": "No stages found", "manage_pipelines": "Manage Pipelines" };
}
if (!en.deals.pipelines) {
    en.deals.pipelines = { "sales": "Sales Pipeline" };
}
if (!en.deals.form) {
    en.deals.form = {
        "title": "Title",
        "placeholder_title": "e.g. Website Development Project",
        "assigned_to": "Assigned to",
        "unassigned": "Unassigned",
        "pipeline": "Pipeline",
        "select_pipeline": "Select Pipeline",
        "stage": "Stage",
        "select_stage": "Select Stage",
        "amount": "Amount",
        "valid_till": "Valid Till",
        "description": "Description",
        "placeholder_desc": "Describe the deal..."
    };
}
if (!en.deals.summary) {
    en.deals.summary = {
        "days_ago": "days ago",
        "days_left": "days left",
        "total": "Total",
        "active_filters": "Active Filters"
    };
}

// Add deals to de.json
if (!de.deals) de.deals = {};
de.deals.pipelines = { "sales": "Vertriebs-Pipeline" };
if (!de.deals.kanban) {
    de.deals.kanban = { "no_stages": "Keine Phasen gefunden", "manage_pipelines": "Pipelines verwalten" };
}

// Fix common fallback things for de.json
if (!de.common) de.common = {};
de.common.job_title = "Berufsbezeichnung";

// Remove old contacts string if it exists in root
if (en.contacts === "Contacts") delete en.contacts;
if (de.Contacts === "Kontakte") delete de.Contacts;

fs.writeFileSync(dePath, JSON.stringify(de, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log("JSON files patched successfully.");
