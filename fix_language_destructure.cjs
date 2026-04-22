const fs = require('fs')
const path = require('path')

// List of files that use 'language' variable but only { t } from useLanguage()
const files = [
  'frontend/src/app/admin/pages/AdminDashboard.jsx',
  'frontend/src/app/admin/pages/Attendance.jsx',
  'frontend/src/app/admin/pages/Companies.jsx',
  'frontend/src/app/admin/pages/Contacts.jsx',
  'frontend/src/app/admin/pages/Contracts.jsx',
  'frontend/src/app/admin/pages/CreditNotes.jsx',
  'frontend/src/app/admin/pages/CustomFields.jsx',
  'frontend/src/app/admin/pages/Deals.jsx',
  'frontend/src/app/admin/pages/EmailTemplatesSettings.jsx',
  'frontend/src/app/admin/pages/Employees.jsx',
  'frontend/src/app/admin/pages/Estimates.jsx',
  'frontend/src/app/admin/pages/Invoices.jsx',
  'frontend/src/app/admin/pages/LeadDetail.jsx',
  'frontend/src/app/admin/pages/LeadDetailNew.jsx',
  'frontend/src/app/admin/pages/Leads.jsx',
  'frontend/src/app/admin/pages/Messages.jsx',
  'frontend/src/app/admin/pages/NotificationSettings.jsx',
  'frontend/src/app/admin/pages/Offers.jsx',
  'frontend/src/app/admin/pages/OrderDetail.jsx',
  'frontend/src/app/admin/pages/PipelineSettings.jsx',
  'frontend/src/app/admin/pages/Projects.jsx',
  'frontend/src/app/admin/pages/Reports.jsx',
  'frontend/src/app/admin/pages/RolesPermissions.jsx',
  'frontend/src/app/admin/pages/Settings.jsx',
  'frontend/src/app/admin/pages/Store.jsx',
  'frontend/src/app/admin/pages/hrm/AttendanceSettings.jsx',
  'frontend/src/app/admin/pages/hrm/LeaveSettings.jsx',
  'frontend/src/app/employee/pages/EmployeeDashboard.jsx',
  'frontend/src/app/superadmin/pages/Companies.jsx',
  'frontend/src/app/superadmin/pages/Packages.jsx',
  'frontend/src/app/superadmin/pages/PwaSettings.jsx',
  'frontend/src/app/superadmin/pages/Settings.jsx',
  'frontend/src/auth/pages/ForgotPasswordPage.jsx',
  'frontend/src/auth/pages/LoginPage.jsx',
  'frontend/src/auth/pages/SignupPage.jsx',
  'frontend/src/components/layout/GlobalSearch.jsx',
  'frontend/src/components/layout/GoogleTranslate.jsx',
  'frontend/src/components/layout/LanguageDropdown.jsx',
  'frontend/src/components/layout/NotificationDropdown.jsx',
  'frontend/src/components/layout/Sidebar.jsx',
  'frontend/src/components/Meetings/Meetings.jsx',
  'frontend/src/components/shared/EventsSection.jsx',
  'frontend/src/components/Tasks/Tasks.jsx',
  'frontend/src/components/ui/DataTable.jsx',
  'frontend/src/components/ui/TaskFormModal.jsx',
  'frontend/src/layouts/AuthLayout.jsx',
  'frontend/src/layouts/CRMLayout.jsx',
  'frontend/src/website/pages/HomePage.jsx',
]

let fixed = 0
let skipped = 0

files.forEach(relPath => {
  const fullPath = path.join(process.cwd(), relPath)
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP (not found): ${relPath}`)
    skipped++
    return
  }

  let content = fs.readFileSync(fullPath, 'utf8')

  // Check if the file actually uses 'language' variable (as a standalone word not in strings)
  const usesLanguageVar = /\blanguage\b/.test(content)
  
  // Check if already has { t, language } or { language, t } or { language } patterns
  const alreadyHasLanguage = /useLanguage\(\)[^{]*\{[^}]*\blanguage\b[^}]*\}/.test(content) ||
    /\{\s*t\s*,\s*language\s*\}/.test(content) ||
    /\{\s*language\s*,\s*t\s*\}/.test(content) ||
    /\{\s*language\s*\}/.test(content)

  if (!usesLanguageVar || alreadyHasLanguage) {
    console.log(`SKIP (no fix needed): ${path.basename(relPath)}`)
    skipped++
    return
  }

  // Replace { t } = useLanguage() with { t, language } = useLanguage()
  // But only if file actually needs it (has 'language' var usage AND useLanguage)
  const patterns = [
    { from: /const\s*\{\s*t\s*\}\s*=\s*useLanguage\(\)/g, to: 'const { t, language } = useLanguage()' },
    { from: /const\s*\{\s*t:\s*translate\s*\}\s*=\s*useLanguage\(\)/g, to: 'const { t: translate, language } = useLanguage()' },
  ]

  let changed = false
  for (const p of patterns) {
    if (p.from.test(content)) {
      content = content.replace(p.from, p.to)
      changed = true
      break
    }
  }

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8')
    console.log(`FIXED: ${path.basename(relPath)}`)
    fixed++
  } else {
    console.log(`SKIP (pattern not matched): ${path.basename(relPath)}`)
    skipped++
  }
})

console.log(`\nDone! Fixed: ${fixed}, Skipped: ${skipped}`)
