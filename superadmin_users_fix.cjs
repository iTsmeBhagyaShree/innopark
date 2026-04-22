const fs = require('fs')

const dePath = './frontend/src/locales/de.json'
const deData = JSON.parse(fs.readFileSync(dePath, 'utf8'))

const keysToAdd = {
  // Found in Users.jsx
  "users_count": "{{count}} Benutzer",
  "search_placeholder": "Suchen...",
  "filter": "Filter",
  "clear_all": "Alle löschen",
  "all_roles": "Alle Rollen",
  "all_companies": "Alle Unternehmen",
  "all_status": "Alle Status",
  "select_company_optional": "Unternehmen auswählen (optional)",
  "not_assigned": "Nicht zugewiesen",
  "user_details": "Benutzerdetails",
  "leave_empty_to_keep": "Leer lassen, um beizubehalten",
  "saving": "Wird gespeichert...",
  "save_success": "Erfolgreich gespeichert",
  "delete_confirm": "Möchten Sie diesen Datensatz wirklich löschen?",
  "delete_success": "Erfolgreich gelöscht",
  "load_failed": "Laden fehlgeschlagen",
  "name_required": "Name ist erforderlich",
  "email_required": "E-Mail ist erforderlich",
  "password_required": "Passwort ist erforderlich",
  "role_required": "Rolle ist erforderlich",
  "hide": "Verbergen",
  "show": "Anzeigen",
  "create": "Erstellen",
  "update": "Aktualisieren"
}

// Ensure these are at the root
for (const [key, value] of Object.entries(keysToAdd)) {
  if (!deData[key]) deData[key] = value
}

// Add specifically users section
if (!deData.users) {
  deData.users = {}
}
deData.users.title = "Benutzer"
deData.users.description = "Verwalten Sie Systembenutzer, Administratoren und weisen Sie Rollen zu."
deData.title = "Benutzer"
deData.description = "Verwalten Sie Systembenutzer, Administratoren und weisen Sie Rollen zu."

fs.writeFileSync(dePath, JSON.stringify(deData, null, 2))
console.log('Added missing keys for Users view in super admin.')
