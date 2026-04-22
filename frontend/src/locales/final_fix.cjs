const fs = require('fs');
const content = fs.readFileSync('frontend/src/locales/en.json', 'utf8');

// Find a known good point earlier in the file
const marker = '"footer": {';
const index = content.indexOf(marker);

if (index !== -1) {
    // Keep everything up to the footer start
    let sanePart = content.substring(0, index);
    
    // Construct a completely fresh tail for the file starting from footer
    const validTail = `"footer": {
    "privacy_policy": "Privacy Policy",
    "terms_of_service": "Terms of Service",
    "refund_policy": "Refund Policy"
  },
  "create_invoice": "Create Invoice",
  "add_related_company": "Add Related Company",
  "request_company_account": "Request Company Account",
  "delete_role": "Delete Role",
  "bill_date": "Bill Date",
  "select_invoice": "Select Invoice",
  "role": {
    "delete": "Delete Role",
    "create": "Create Role",
    "edit": "Edit Role"
  },
  "view_all": "View All",
  "no_company": "No company registered",
  "save_failed": "Saving Failed",
  "delete_failed": "Deletion Failed",
  "confirm_delete": "Are you sure you want to delete this?",
  "loading_failed": "Loading failed",
  "retry": "Retry",
  "more": "more",
  "crm": {
    "leads": "Leads",
    "deals": "Deals",
    "contacts": "Contacts",
    "companies": "Companies",
    "proposals": "Proposals",
    "invoices": "Invoices"
  },
  "add_new": "Add New",
  "list": "List",
  "show_columns": "Show Columns",
  "rows_selected": "Rows Selected",
  "no_filters_configured": "No filters configured",
  "no_data_found": "No data found",
  "try_adjusting": "Try adjusting your filters",
  "balance": "Balance",
  "profile": "Profile",
  "ownership": "Ownership",
  "unassigned": "Unassigned",
  "labels": "Labels",
  "coming_soon": "Coming Soon",
  "custom_dashboard": "Custom Dashboard",
  "Leads": "Leads",
  "Deals": "Deals",
  "Contacts": "Contacts",
  "Companies": "Companies",
  "Offers": "Offers",
  "Invoices": "Invoices",
  "Activities and Tasks": "Tasks and Activities",
  "My Profile": "My Profile",
  "Settings": "Settings",
  "Notifications": "Notifications",
  "Messages": "Messages",
  "Dashboard": "Dashboard",
  "leads": {
    "no_leads": "No leads found"
  }
}`;
    
    fs.writeFileSync('frontend/src/locales/en.json', sanePart + validTail + '\n' + '}');
    console.log('REPAIRED_SUCCESSFULLY');
} else {
    console.log('FOOTER_NOT_FOUND');
}
