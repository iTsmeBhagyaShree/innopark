const fs = require('fs')

const deFile = JSON.parse(fs.readFileSync('./frontend/src/locales/de.json', 'utf8'))

const keysToCheck = [
  'settings.app_settings',
  'settings.general_settings_label',
  'settings.localization',
  'settings.email',
  'settings.email_templates',
  'settings.notifications',
  'settings.updates_label',
  'dashboard.hr_settings',
  'sidebar.attendance',
  'sidebar.leaves',
  'sidebar.access_permission',
  'sidebar.sales_prospects',
  'sidebar.pipeline_settings',
  'sidebar.setup',
  'sidebar.plugins'
]

function getNested(obj, path) {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined
  }, obj)
}

const missing = []
for (const key of keysToCheck) {
  if (getNested(deFile, key) === undefined) {
    missing.push(key)
  }
}

console.log('Missing keys in de.json:')
console.log(missing)
